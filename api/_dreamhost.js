/**
 * Shared DreamHost storage helpers for authenticated upload + proxy.
 *
 * Env (server-only — never VITE_*):
 *   DREAMHOST_PDF_UPLOAD_URL   — POST upload-pdf.php
 *   DREAMHOST_PDF_DOWNLOAD_URL — GET download-pdf.php (preferred for fetch)
 *   DREAMHOST_PDF_API_KEY      — X-API-Key for both endpoints
 *
 * Never return DreamHost URLs to clients — only app proxy paths.
 */

import { randomUUID } from 'node:crypto';
import {
  canManageUsers,
  createServiceClient,
  isSuspended,
  jsonResponse,
  loadProfile,
  writeAuditLog,
} from './_authShared.js';

/** Shared with dreamhost/api/upload-pdf.php MAX_FILE_SIZE. */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

/** UUID v4-ish path segment (Supabase user ids). */
const USER_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILE_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i;

export function getDreamHostUploadUrl() {
  return (
    process.env.DREAMHOST_PDF_UPLOAD_URL ||
    process.env.PDF_UPLOAD_URL ||
    ''
  ).trim();
}

export function getDreamHostApiKey() {
  return (
    process.env.DREAMHOST_PDF_API_KEY ||
    process.env.PDF_API_KEY ||
    ''
  ).trim();
}

/**
 * Authenticated download endpoint (download-pdf.php).
 * Derived from upload URL when DREAMHOST_PDF_DOWNLOAD_URL is unset.
 */
export function getDreamHostDownloadUrl() {
  const explicit = (
    process.env.DREAMHOST_PDF_DOWNLOAD_URL ||
    process.env.PDF_DOWNLOAD_URL ||
    ''
  ).trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const upload = getDreamHostUploadUrl();
  if (!upload) return '';
  try {
    const u = new URL(upload);
    // .../api/upload-pdf.php → .../api/download-pdf.php
    u.pathname = u.pathname.replace(/upload-pdf\.php$/i, 'download-pdf.php');
    if (!/download-pdf\.php$/i.test(u.pathname)) {
      u.pathname = u.pathname.replace(/\/?$/, '/') + 'download-pdf.php';
    }
    return u.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

export function isDreamHostConfigured() {
  return Boolean(
    getDreamHostUploadUrl() && getDreamHostApiKey() && getDreamHostDownloadUrl(),
  );
}

/**
 * Server-built per-user object key. Never accept a client path.
 * @param {string} userId
 * @returns {string} `<userId>/<uuid>.pdf`
 */
export function buildOwnedStoragePath(userId) {
  if (!userId || !USER_ID_RE.test(userId)) {
    throw new Error('Invalid user id for storage path.');
  }
  return `${userId}/${randomUUID()}.pdf`;
}

/**
 * Validate and normalise a storage path from a proxy request.
 * @returns {string|null}
 */
export function parseOwnedStoragePath(raw) {
  if (typeof raw !== 'string' || !raw) return null;
  const cleaned = raw.replace(/^\/+/, '').replace(/\/+/g, '/');
  const parts = cleaned.split('/');
  if (parts.length !== 2) return null;
  const [userId, fileName] = parts;
  if (!USER_ID_RE.test(userId) || !FILE_UUID_RE.test(fileName)) return null;
  if (cleaned.includes('..')) return null;
  return `${userId}/${fileName}`;
}

/**
 * In-app share path (no JWT). Signed-out users sign in and return here;
 * the page fetches /api/files/... with Authorization Bearer.
 * @param {string} storagePath `userId/uuid.pdf`
 * @returns {string} `/shared/{userId}/{uuid}`
 */
export function buildShareAppPath(storagePath) {
  const path = parseOwnedStoragePath(storagePath);
  if (!path) throw new Error('Invalid storage path.');
  const [userId, fileName] = path.split('/');
  const fileId = fileName.replace(/\.pdf$/i, '');
  return `/shared/${userId}/${fileId}`;
}

/**
 * Authenticated file proxy API path (Authorization Bearer only).
 * @param {string} storagePath
 * @returns {string} `/api/files/{userId}/{uuid}.pdf`
 */
export function buildFileProxyApiPath(storagePath) {
  const path = parseOwnedStoragePath(storagePath);
  if (!path) throw new Error('Invalid storage path.');
  return `/api/files/${path}`;
}

/**
 * Parse `/shared/{userId}/{uuid}` (optional .pdf) → storage path.
 * @param {string} pathname
 * @returns {string|null}
 */
export function parseShareAppPath(pathname) {
  if (typeof pathname !== 'string' || !pathname) return null;
  const cleaned = pathname.split('?')[0].split('#')[0];
  const m = cleaned.match(
    /^\/shared\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\.pdf)?\/?$/i,
  );
  if (!m) return null;
  return parseOwnedStoragePath(`${m[1]}/${m[2]}.pdf`);
}

/**
 * Map legacy `/api/files/...` links to the in-app share route.
 * @param {string} pathnameOrUrl
 * @returns {string|null}
 */
export function shareAppPathFromApiOrShare(pathnameOrUrl) {
  if (typeof pathnameOrUrl !== 'string' || !pathnameOrUrl) return null;
  let path = pathnameOrUrl.trim();
  try {
    if (/^https?:\/\//i.test(path)) {
      path = new URL(path).pathname;
    }
  } catch {
    return null;
  }
  const fromShare = parseShareAppPath(path);
  if (fromShare) return buildShareAppPath(fromShare);
  const marker = '/api/files/';
  const idx = path.indexOf(marker);
  if (idx >= 0) {
    const storage = parseOwnedStoragePath(path.slice(idx + marker.length));
    if (storage) return buildShareAppPath(storage);
  }
  return null;
}

/**
 * App-facing share URL for Copy Link. In-app `/shared/...` — never a JWT
 * and never a public DreamHost link. The page loads the proxy with Bearer.
 */
export function buildProxyFileUrl(request, storagePath) {
  const relative = buildShareAppPath(storagePath);
  const fromEnv =
    process.env.VITE_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  let origin = fromEnv ? String(fromEnv).replace(/\/$/, '') : '';
  if (!origin) {
    try {
      origin = new URL(request.url).origin;
    } catch {
      origin = '';
    }
  }
  return origin ? `${origin}${relative}` : relative;
}

/**
 * Upload bytes to DreamHost. Path must already be server-built.
 * @returns {Promise<{ path: string }>}
 */
export async function uploadToDreamHost({ buffer, storagePath }) {
  const uploadUrl = getDreamHostUploadUrl();
  const apiKey = getDreamHostApiKey();
  if (!uploadUrl || !apiKey) {
    const err = new Error('DreamHost storage is not configured.');
    err.status = 503;
    throw err;
  }

  const path = parseOwnedStoragePath(storagePath);
  if (!path) {
    const err = new Error('Invalid storage path.');
    err.status = 400;
    throw err;
  }

  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (bytes.byteLength === 0) {
    const err = new Error('Empty file.');
    err.status = 400;
    throw err;
  }
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    const err = new Error('File too large.');
    err.status = 413;
    throw err;
  }

  const fileData = bytes.toString('base64');
  const upstream = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'X-Upsert': 'false',
    },
    body: JSON.stringify({
      fileData,
      fileName: path,
      upsert: false,
    }),
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '');
    console.error('DreamHost upload failed:', upstream.status, text.slice(0, 200));
    const err = new Error('Upload failed.');
    err.status = upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502;
    throw err;
  }

  let result = null;
  try {
    result = await upstream.json();
  } catch {
    result = null;
  }

  if (result && result.success === false) {
    console.error('DreamHost upload rejected:', result.error || 'unknown');
    const err = new Error('Upload failed.');
    err.status = 502;
    throw err;
  }

  return { path };
}

/**
 * Fetch object bytes via authenticated download-pdf.php (never a public URL).
 */
export async function fetchFromDreamHost(storagePath) {
  const apiKey = getDreamHostApiKey();
  const downloadBase = getDreamHostDownloadUrl();
  const path = parseOwnedStoragePath(storagePath);
  if (!apiKey || !downloadBase || !path) {
    const err = new Error('File storage is not configured.');
    err.status = 503;
    throw err;
  }

  const url = new URL(downloadBase);
  url.searchParams.set('path', path);

  const upstream = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'X-API-Key': apiKey },
  });
  if (!upstream.ok) {
    console.error('DreamHost download failed:', upstream.status);
    const err = new Error(upstream.status === 404 ? 'File not found.' : 'Failed to fetch file.');
    err.status = upstream.status === 404 ? 404 : 502;
    throw err;
  }
  return Buffer.from(await upstream.arrayBuffer());
}

/** Allowed visibility values. Unknown/missing fails closed to private. */
export const FILE_VISIBILITY = Object.freeze({
  ORG: 'org',
  PRIVATE: 'private',
  LICENSED: 'licensed',
});

/**
 * Normalize visibility. Unknown/missing → private (fail closed).
 * Purchased resources are always treated as licensed.
 */
export function normalizeVisibility(raw, { isPurchasedResource = false } = {}) {
  if (isPurchasedResource) return FILE_VISIBILITY.LICENSED;
  if (raw === FILE_VISIBILITY.ORG) return FILE_VISIBILITY.ORG;
  if (raw === FILE_VISIBILITY.PRIVATE) return FILE_VISIBILITY.PRIVATE;
  if (raw === FILE_VISIBILITY.LICENSED) return FILE_VISIBILITY.LICENSED;
  return FILE_VISIBILITY.PRIVATE;
}

/**
 * Same-school/org check for file proxy access.
 * Never treats null/empty organisation_id as matching (no null=null).
 */
export function sameOrganisationIds(viewerOrgId, ownerOrgId) {
  if (viewerOrgId == null || ownerOrgId == null) return false;
  const viewer = String(viewerOrgId).trim();
  const owner = String(ownerOrgId).trim();
  if (!viewer || !owner) return false;
  return viewer === owner;
}

/**
 * V2 mirror of protect_stored_file_visibility for non-server UPDATEs:
 * if OLD was licensed or purchased, visibility and is_purchased_resource
 * must not change at all (blocks licensed→private→org and clearing purchase).
 */
export function licensedStoredFileFieldsMutable({
  isServer = false,
  oldVisibility = null,
  oldIsPurchased = false,
  newVisibility = null,
  newIsPurchased = false,
} = {}) {
  if (isServer) return true;
  if (oldVisibility === FILE_VISIBILITY.LICENSED || oldIsPurchased === true) {
    if (
      newVisibility !== oldVisibility ||
      Boolean(newIsPurchased) !== Boolean(oldIsPurchased)
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Whether the actor may change visibility on a stored file.
 * Only the owner may change visibility; nobody may self-upgrade to licensed.
 */
export function canChangeFileVisibility({
  actorId,
  ownerId,
  currentVisibility,
  nextVisibility,
  isPurchasedResource = false,
}) {
  if (!actorId || !ownerId || actorId !== ownerId) return false;

  // Inspect the requested next value before purchased-resource coercion —
  // otherwise next='org' normalises to licensed and looks like a no-op.
  const requestedNext = nextVisibility;
  if (
    requestedNext != null &&
    requestedNext !== FILE_VISIBILITY.ORG &&
    requestedNext !== FILE_VISIBILITY.PRIVATE &&
    requestedNext !== FILE_VISIBILITY.LICENSED
  ) {
    return false;
  }

  const current = normalizeVisibility(currentVisibility, { isPurchasedResource });

  // Purchased resources are locked to licensed (never org/private via client).
  if (isPurchasedResource) {
    return (
      requestedNext == null ||
      requestedNext === FILE_VISIBILITY.LICENSED
    );
  }

  if (requestedNext === current || requestedNext == null) return true;

  // Users can never set or upgrade to licensed themselves.
  if (requestedNext === FILE_VISIBILITY.LICENSED) {
    return false;
  }
  // Licensed may tighten to private, never open to org.
  if (current === FILE_VISIBILITY.LICENSED) {
    return requestedNext === FILE_VISIBILITY.PRIVATE;
  }
  return (
    requestedNext === FILE_VISIBILITY.ORG ||
    requestedNext === FILE_VISIBILITY.PRIVATE
  );
}

/**
 * Pure access decision for tests / proxy.
 *
 * - org (default): owner + same non-null organisation_id
 * - private: owner + explicit file_shares grants
 * - licensed: owner + licence holders + members of an org with an active
 *   school push grant (never ambient org-wide without a grant)
 * Unknown/missing visibility → private.
 */
export function evaluateStoredFileAccess({
  userId,
  storagePath,
  viewerProfile = null,
  ownerProfile = null,
  visibility = null,
  isPurchasedResource = false,
  hasShareGrant = false,
  hasLicence = false,
  hasOrgGrant = false,
}) {
  const path = parseOwnedStoragePath(storagePath);
  if (!path || !userId) return false;
  const ownerId = path.split('/')[0];
  if (userId === ownerId) return true;
  if (!viewerProfile || isSuspended(viewerProfile)) return false;

  const mode = normalizeVisibility(visibility, { isPurchasedResource });

  if (mode === FILE_VISIBILITY.LICENSED) {
    return Boolean(hasLicence || hasOrgGrant);
  }
  if (mode === FILE_VISIBILITY.PRIVATE) {
    return Boolean(hasShareGrant);
  }
  // org
  return sameOrganisationIds(
    viewerProfile.organisation_id,
    ownerProfile?.organisation_id,
  );
}

/**
 * Whether the actor may push / revoke a school-wide grant for a resource.
 *
 * Require target org === actor's non-null org (never compare to file owner org).
 * Allowed when:
 *   - actor holds a purchase licence for the resource, OR
 *   - actor is a same-org admin (role admin / can_manage_users) AND some
 *     member of that org holds a purchase licence.
 * Null org denied. Never cross-org.
 */
export function canPushResourceToSchool({
  actorProfile = null,
  targetOrganisationId = null,
  hasCallerPurchaseLicence = false,
  orgMemberHasPurchaseLicence = false,
}) {
  if (!actorProfile || isSuspended(actorProfile)) return false;

  const actorOrg = actorProfile.organisation_id;
  if (!sameOrganisationIds(actorOrg, targetOrganisationId)) return false;

  if (hasCallerPurchaseLicence) return true;

  if (canManageUsers(actorProfile) && orgMemberHasPurchaseLicence) {
    return true;
  }
  return false;
}

/**
 * Load stored_files metadata + share/licence/org-grant flags (service role).
 */
export async function loadStoredFileAccessContext(userId, storagePath) {
  const path = parseOwnedStoragePath(storagePath);
  if (!path || !userId) return null;
  const ownerId = path.split('/')[0];
  const service = createServiceClient();

  let meta = null;
  let hasShareGrant = false;
  let hasLicence = false;
  let hasOrgGrant = false;

  const [viewer, owner] = await Promise.all([
    loadProfile(userId),
    loadProfile(ownerId),
  ]);

  if (service) {
    const { data: fileRow } = await service
      .from('stored_files')
      .select(
        'storage_path, owner_id, visibility, is_purchased_resource, resource_id',
      )
      .eq('storage_path', path)
      .maybeSingle();
    meta = fileRow || null;

    const { data: shareRow } = await service
      .from('file_shares')
      .select('id')
      .eq('storage_path', path)
      .eq('shared_with', userId)
      .maybeSingle();
    hasShareGrant = Boolean(shareRow?.id);

    const { data: licenceRow } = await service
      .from('file_licences')
      .select('id')
      .eq('storage_path', path)
      .eq('user_id', userId)
      .maybeSingle();
    hasLicence = Boolean(licenceRow?.id);

    const resourceId =
      typeof meta?.resource_id === 'string' ? meta.resource_id.trim() : '';
    const viewerOrg =
      typeof viewer?.organisation_id === 'string'
        ? viewer.organisation_id.trim()
        : '';
    if (resourceId && viewerOrg) {
      const { data: grantRow } = await service
        .from('resource_org_grants')
        .select('id')
        .eq('resource_id', resourceId)
        .eq('organisation_id', viewerOrg)
        .is('revoked_at', null)
        .maybeSingle();
      hasOrgGrant = Boolean(grantRow?.id);
    }
  }

  return {
    path,
    ownerId,
    viewerProfile: viewer,
    ownerProfile: owner,
    visibility: meta?.visibility ?? null,
    isPurchasedResource: Boolean(meta?.is_purchased_resource),
    resourceId: meta?.resource_id ?? null,
    hasShareGrant,
    hasLicence,
    hasOrgGrant,
    // Missing metadata fails closed to private (unless owner).
    missingMetadata: !meta,
  };
}

/**
 * Register a stored file row after upload (service role). Best-effort.
 */
export async function registerStoredFile({
  storagePath,
  ownerId,
  visibility = FILE_VISIBILITY.ORG,
  isPurchasedResource = false,
  resourceId = null,
}) {
  const path = parseOwnedStoragePath(storagePath);
  if (!path || !ownerId) return false;
  const service = createServiceClient();
  if (!service) return false;

  // Purchased → always licensed. Clients cannot self-register as licensed.
  let mode;
  if (isPurchasedResource) {
    mode = FILE_VISIBILITY.LICENSED;
  } else if (visibility === FILE_VISIBILITY.ORG) {
    mode = FILE_VISIBILITY.ORG;
  } else if (visibility === FILE_VISIBILITY.PRIVATE) {
    mode = FILE_VISIBILITY.PRIVATE;
  } else {
    // Unknown or client-requested licensed → fail closed to private
    // (callers that want org should pass FILE_VISIBILITY.ORG explicitly;
    // upload defaults to org).
    mode = FILE_VISIBILITY.PRIVATE;
  }

  const { error } = await service.from('stored_files').upsert(
    {
      storage_path: path,
      owner_id: ownerId,
      visibility: mode,
      is_purchased_resource: Boolean(isPurchasedResource),
      resource_id: resourceId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'storage_path' },
  );
  if (error) {
    console.warn('registerStoredFile:', error.message);
    return false;
  }
  return true;
}

/**
 * Enforce visibility rules for /api/files proxy.
 */
export async function userMayAccessStoredFile(userId, storagePath) {
  const path = parseOwnedStoragePath(storagePath);
  if (!path || !userId) return false;
  const ownerId = path.split('/')[0];
  if (userId === ownerId) return true;

  try {
    const ctx = await loadStoredFileAccessContext(userId, path);
    if (!ctx) return false;
    return evaluateStoredFileAccess({
      userId,
      storagePath: path,
      viewerProfile: ctx.viewerProfile,
      ownerProfile: ctx.ownerProfile,
      // Missing row → private (fail closed).
      visibility: ctx.missingMetadata ? FILE_VISIBILITY.PRIVATE : ctx.visibility,
      isPurchasedResource: ctx.isPurchasedResource,
      hasShareGrant: ctx.hasShareGrant,
      hasLicence: ctx.hasLicence,
      hasOrgGrant: ctx.hasOrgGrant,
    });
  } catch (e) {
    console.warn(
      'userMayAccessStoredFile:',
      e instanceof Error ? e.message : e,
    );
    return false;
  }
}

/**
 * Resolve resource metadata for school push/revoke (service role).
 * Does not compare against the file owner's organisation — entitlement is
 * actor org + purchase licence (self or any same-org member for admins).
 */
export async function loadResourceSchoolPushContext({
  resourceId,
  actorId,
  actorOrganisationId,
}) {
  const rid = typeof resourceId === 'string' ? resourceId.trim() : '';
  if (!rid || !actorId) return null;
  const service = createServiceClient();
  if (!service) return null;

  const { data: files } = await service
    .from('stored_files')
    .select('storage_path, owner_id, resource_id, is_purchased_resource, visibility')
    .eq('resource_id', rid);

  const fileRows = Array.isArray(files) ? files : [];
  if (!fileRows.length) return null;

  const paths = fileRows.map((f) => f.storage_path).filter(Boolean);

  const { data: licenceRows } = paths.length
    ? await service
        .from('file_licences')
        .select('user_id, storage_path, source')
        .in('storage_path', paths)
    : { data: [] };

  const licences = Array.isArray(licenceRows) ? licenceRows : [];
  // Purchase holders: purchase-sourced licence rows + owners of purchased files.
  const purchaseHolderIds = [
    ...new Set([
      ...licences
        .filter((l) => !l.source || l.source === 'purchase')
        .map((l) => l.user_id)
        .filter(Boolean),
      ...fileRows
        .filter((f) => f.is_purchased_resource)
        .map((f) => f.owner_id)
        .filter(Boolean),
    ]),
  ];

  const hasCallerPurchaseLicence = purchaseHolderIds.includes(actorId);

  const actorOrg =
    typeof actorOrganisationId === 'string' ? actorOrganisationId.trim() : '';

  let orgMemberHasPurchaseLicence = false;
  if (actorOrg && purchaseHolderIds.length) {
    for (const holderId of purchaseHolderIds) {
      const holder = await loadProfile(holderId);
      if (
        holder &&
        sameOrganisationIds(holder.organisation_id, actorOrg)
      ) {
        orgMemberHasPurchaseLicence = true;
        break;
      }
    }
  }

  let activeGrant = null;
  if (actorOrg) {
    const { data: grantRow } = await service
      .from('resource_org_grants')
      .select('id, resource_id, organisation_id, granted_by, granted_at, revoked_at')
      .eq('resource_id', rid)
      .eq('organisation_id', actorOrg)
      .is('revoked_at', null)
      .maybeSingle();
    activeGrant = grantRow || null;
  }

  return {
    resourceId: rid,
    purchaseHolderIds,
    hasCallerPurchaseLicence,
    orgMemberHasPurchaseLicence,
    activeGrant,
  };
}

/**
 * Create an active school-wide grant (service role). Idempotent if already active.
 */
export async function pushResourceToSchool({
  resourceId,
  organisationId,
  grantedBy,
  ipHash = null,
}) {
  const rid = typeof resourceId === 'string' ? resourceId.trim() : '';
  const org = typeof organisationId === 'string' ? organisationId.trim() : '';
  if (!rid || !org || !grantedBy) {
    const err = new Error('Invalid push parameters.');
    err.status = 400;
    throw err;
  }
  const service = createServiceClient();
  if (!service) {
    const err = new Error('Service unavailable.');
    err.status = 503;
    throw err;
  }

  const { data: existing } = await service
    .from('resource_org_grants')
    .select('id, granted_at')
    .eq('resource_id', rid)
    .eq('organisation_id', org)
    .is('revoked_at', null)
    .maybeSingle();

  if (existing?.id) {
    await writeAuditLog({
      actorId: grantedBy,
      action: 'resource_org_grant_push',
      targetType: 'resource',
      targetId: rid,
      organisationId: org,
      ipHash,
      meta: { organisation_id: org, grant_id: existing.id, already_active: true },
    });
    return { grantId: existing.id, created: false };
  }

  const { data: inserted, error } = await service
    .from('resource_org_grants')
    .insert({
      resource_id: rid,
      organisation_id: org,
      granted_by: grantedBy,
      granted_at: new Date().toISOString(),
    })
    .select('id')
    .maybeSingle();

  if (error || !inserted?.id) {
    console.error('pushResourceToSchool:', error?.message || 'insert failed');
    const err = new Error('Failed to create school grant.');
    err.status = 500;
    throw err;
  }

  await writeAuditLog({
    actorId: grantedBy,
    action: 'resource_org_grant_push',
    targetType: 'resource',
    targetId: rid,
    organisationId: org,
    ipHash,
    meta: { organisation_id: org, grant_id: inserted.id },
  });

  return { grantId: inserted.id, created: true };
}

/**
 * Revoke an active school-wide grant (service role).
 */
export async function revokeResourceSchoolPush({
  resourceId,
  organisationId,
  revokedBy,
  ipHash = null,
}) {
  const rid = typeof resourceId === 'string' ? resourceId.trim() : '';
  const org = typeof organisationId === 'string' ? organisationId.trim() : '';
  if (!rid || !org || !revokedBy) {
    const err = new Error('Invalid revoke parameters.');
    err.status = 400;
    throw err;
  }
  const service = createServiceClient();
  if (!service) {
    const err = new Error('Service unavailable.');
    err.status = 503;
    throw err;
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await service
    .from('resource_org_grants')
    .update({ revoked_by: revokedBy, revoked_at: now })
    .eq('resource_id', rid)
    .eq('organisation_id', org)
    .is('revoked_at', null)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('revokeResourceSchoolPush:', error.message);
    const err = new Error('Failed to revoke school grant.');
    err.status = 500;
    throw err;
  }
  if (!updated?.id) {
    const err = new Error('No active school grant to revoke.');
    err.status = 404;
    throw err;
  }

  await writeAuditLog({
    actorId: revokedBy,
    action: 'resource_org_grant_revoke',
    targetType: 'resource',
    targetId: rid,
    organisationId: org,
    ipHash,
    meta: { organisation_id: org, grant_id: updated.id },
  });

  return { grantId: updated.id, revoked: true };
}

export function dreamHostNotConfiguredResponse() {
  return jsonResponse(
    {
      error:
        'File storage is not configured. Set DREAMHOST_PDF_UPLOAD_URL, DREAMHOST_PDF_DOWNLOAD_URL (or matching upload URL), and DREAMHOST_PDF_API_KEY.',
    },
    503,
  );
}
