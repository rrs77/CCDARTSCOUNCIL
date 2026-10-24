/**
 * Shared DreamHost storage helpers for authenticated upload + proxy.
 * Shape mirrors cursor/security-fixes so the branches merge cleanly.
 *
 * Env (server-only — never VITE_*):
 *   DREAMHOST_PDF_UPLOAD_URL   — POST upload-pdf.php (aliases: PDF_UPLOAD_URL)
 *   DREAMHOST_PDF_DOWNLOAD_URL — GET download-pdf.php (aliases: PDF_DOWNLOAD_URL)
 *   DREAMHOST_PDF_API_KEY      — X-API-Key (aliases: PDF_API_KEY)
 *
 * Never return raw DreamHost URLs to clients — only app proxy paths.
 */

import { randomUUID } from 'node:crypto';
import { createServiceClient, jsonResponse } from './_authShared.js';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

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
 * App-facing URL (authenticated proxy). Not a public DreamHost link.
 */
export function buildProxyFileUrl(request, storagePath) {
  const path = parseOwnedStoragePath(storagePath);
  if (!path) throw new Error('Invalid storage path.');
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
  const relative = `/api/files/${path}`;
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

/** Allowed visibility values (registry optional on this branch). */
export const FILE_VISIBILITY = Object.freeze({
  ORG: 'org',
  PRIVATE: 'private',
  LICENSED: 'licensed',
});

/**
 * Register a stored file row after upload (service role). Best-effort —
 * table may not exist until security-fixes migrations land.
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

  let mode = FILE_VISIBILITY.PRIVATE;
  if (isPurchasedResource) mode = FILE_VISIBILITY.LICENSED;
  else if (visibility === FILE_VISIBILITY.ORG) mode = FILE_VISIBILITY.ORG;
  else if (visibility === FILE_VISIBILITY.PRIVATE) mode = FILE_VISIBILITY.PRIVATE;

  try {
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
  } catch (e) {
    console.warn('registerStoredFile:', e instanceof Error ? e.message : e);
    return false;
  }
}

/**
 * Access check for /api/files proxy.
 * Owner always allowed. Without stored_files metadata, fail closed for others.
 */
export async function userMayAccessStoredFile(userId, storagePath) {
  const path = parseOwnedStoragePath(storagePath);
  if (!path || !userId) return false;
  const ownerId = path.split('/')[0];
  if (userId === ownerId) return true;

  const service = createServiceClient();
  if (!service) return false;
  try {
    const { data } = await service
      .from('stored_files')
      .select('owner_id, visibility')
      .eq('storage_path', path)
      .maybeSingle();
    if (!data) return false;
    if (data.owner_id === userId) return true;
    // Org-wide visibility without full ACL tables: allow same-org via profiles.
    if (data.visibility === FILE_VISIBILITY.ORG) {
      const { data: profiles } = await service
        .from('profiles')
        .select('id, organisation_id, school_or_org')
        .in('id', [userId, data.owner_id]);
      const rows = Array.isArray(profiles) ? profiles : [];
      const viewer = rows.find((p) => p.id === userId);
      const owner = rows.find((p) => p.id === data.owner_id);
      const vOrg = (viewer?.organisation_id || viewer?.school_or_org || '').trim();
      const oOrg = (owner?.organisation_id || owner?.school_or_org || '').trim();
      return Boolean(vOrg && oOrg && vOrg === oOrg);
    }
    return false;
  } catch {
    return false;
  }
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
