/**
 * Hub-scoped auth helpers: membership roles, URL sanitisation, IDOR guards.
 * Used by Vercel serverless routes (service role + explicit permission checks).
 */

import {
  createServiceClient,
  isSuspended,
  jsonResponse,
  loadProfile,
  requireAuth,
  writeAuditLog,
} from './_authShared.js';

/** Hub-specific roles (not system roles). */
export const HUB_ROLES = [
  'hub_viewer',
  'hub_editor',
  'hub_publisher',
  'hub_administrator',
];

export const HUB_ROLE_RANK = {
  hub_viewer: 1,
  hub_editor: 2,
  hub_publisher: 3,
  hub_administrator: 4,
};

/** System roles that may manage any hub. */
export const SUPER_ADMIN_ROLES = new Set(['super_admin', 'superuser']);

export function isSuperAdmin(profile) {
  if (!profile || isSuspended(profile)) return false;
  return SUPER_ADMIN_ROLES.has(profile.role);
}

export function hubRoleRank(role) {
  return HUB_ROLE_RANK[role] || 0;
}

export function hasMinHubRole(role, minRole) {
  return hubRoleRank(role) >= hubRoleRank(minRole);
}

/**
 * Validate external resource URL. Requires https (http allowed only for localhost drafts).
 * @returns {{ ok: true, url: string, warning?: string } | { ok: false, error: string }}
 */
export function validateExternalUrl(raw, { allowDraftHttp = false } = {}) {
  if (typeof raw !== 'string' || !raw.trim()) {
    return { ok: false, error: 'URL is required.' };
  }
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false, error: 'Invalid URL.' };
  }
  if (url.protocol === 'https:') {
    return { ok: true, url: url.toString() };
  }
  if (
    allowDraftHttp &&
    url.protocol === 'http:' &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
  ) {
    return {
      ok: true,
      url: url.toString(),
      warning: 'HTTP localhost only allowed for drafts.',
    };
  }
  if (url.protocol === 'http:') {
    return {
      ok: false,
      error: 'Only HTTPS URLs are allowed for published resources. Save as draft with HTTPS, or fix the link.',
    };
  }
  return { ok: false, error: 'Unsupported URL protocol. Use HTTPS.' };
}

/** Strip dangerous HTML for hub intro fields (server-side). */
export function sanitizeHubHtml(html) {
  if (!html || typeof html !== 'string') return '';
  let out = html
    .replace(/<\s*script[\s\S]*?>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*iframe[\s\S]*?>[\s\S]*?<\s*\/\s*iframe\s*>/gi, '')
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript\s*:/gi, '');
  // Allow a conservative tag set
  out = out.replace(/<\/?(?!\/?(p|br|strong|b|em|i|u|ul|ol|li|a|h2|h3|h4|blockquote)\b)[^>]*>/gi, '');
  return out.trim();
}

export async function resolveOrganisation({ hubId, slug }) {
  const service = createServiceClient();
  if (!service) return null;
  if (hubId) {
    const { data } = await service
      .from('organisations')
      .select('*')
      .eq('id', hubId)
      .maybeSingle();
    if (data) return normalizeOrg(data);
    // Also allow lookup by slug if hubId looks like a slug
    const { data: bySlug } = await service
      .from('organisations')
      .select('*')
      .eq('slug', hubId)
      .maybeSingle();
    if (bySlug) return normalizeOrg(bySlug);
  }
  if (slug) {
    const { data } = await service
      .from('organisations')
      .select('*')
      .or(`slug.eq.${slug},id.eq.${slug},partner_slug.eq.${slug}`)
      .maybeSingle();
    if (data) return normalizeOrg(data);
    const { data: all } = await service.from('organisations').select('*');
    const found = (all || []).find(
      (o) => Array.isArray(o.aliases) && o.aliases.includes(slug),
    );
    return found ? normalizeOrg(found) : null;
  }
  return null;
}

function normalizeOrg(o) {
  if (!o) return null;
  return {
    ...o,
    display_name: o.display_name || o.name,
    slug: o.slug || o.partner_slug || o.id,
  };
}

export async function loadHubMembership(organisationId, userId) {
  const service = createServiceClient();
  if (!service) return null;
  const { data } = await service
    .from('hub_memberships')
    .select('*')
    .eq('organisation_id', organisationId)
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

/**
 * Effective hub role for a user (super_admin → hub_administrator).
 */
export async function getEffectiveHubRole(profile, organisationId) {
  if (isSuperAdmin(profile)) return 'hub_administrator';
  const membership = await loadHubMembership(organisationId, profile.id);
  return membership?.role || null;
}

/**
 * Require auth + hub membership at minRole for the organisation.
 * Resolves org from hubId (UUID) or slug — never trusts client org body alone.
 *
 * @returns {Promise<
 *   | { ok: true, userId, email, token, claims, profile, organisation, hubRole }
 *   | { ok: false, response: Response }
 * >}
 */
export async function requireHubAccess(request, { hubId, slug, minRole = 'hub_viewer' }) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth;

  const profile = await loadProfile(auth.userId);
  if (!profile || isSuspended(profile)) {
    return {
      ok: false,
      response: jsonResponse({ error: 'Forbidden. Active account required.' }, 403),
    };
  }

  const organisation = await resolveOrganisation({ hubId, slug });
  if (!organisation) {
    return { ok: false, response: jsonResponse({ error: 'Hub not found.' }, 404) };
  }

  const hubRole = await getEffectiveHubRole(profile, organisation.id);
  if (!hubRole || !hasMinHubRole(hubRole, minRole)) {
    return {
      ok: false,
      response: jsonResponse(
        { error: `Forbidden. Requires ${minRole} (or higher) on this hub.` },
        403,
      ),
    };
  }

  return {
    ...auth,
    profile,
    organisation,
    hubRole,
  };
}

/**
 * Ensure a resource belongs to the organisation (IDOR guard).
 */
export async function getOrgScopedResource(organisationId, resourceId) {
  const service = createServiceClient();
  if (!service) return null;
  const { data } = await service
    .from('resources')
    .select('*')
    .eq('id', resourceId)
    .eq('organisation_id', organisationId)
    .maybeSingle();
  return data;
}

/**
 * Hub admins may only assign hub_* roles — never system roles.
 */
export function assertAssignableHubRole(role, { actorIsSuperAdmin }) {
  if (!HUB_ROLES.includes(role)) {
    return { ok: false, error: 'Invalid hub role.' };
  }
  if (!actorIsSuperAdmin && role === 'hub_administrator') {
    // Hub administrators may grant up to hub_publisher; only super can grant hub_administrator
    // Spec: hub-user mgmt never escalate to system roles; hub_administrator can manage hub users.
    // Allow hub_administrator to grant hub_administrator within their hub (common pattern),
    // but never system roles. Keep as allowed.
  }
  return { ok: true };
}

export async function auditHubAction({
  actorId,
  organisationId,
  action,
  targetType,
  targetId,
  meta,
  request,
}) {
  let ipHash = null;
  try {
    const { getClientIp, hashIpForStorage } = await import('./_authShared.js');
    ipHash = await hashIpForStorage(getClientIp(request));
  } catch {
    /* ignore */
  }
  await writeAuditLog({
    actorId,
    action,
    targetType,
    targetId,
    meta,
    ipHash,
    organisationId,
  });
}

export async function snapshotResourceRevision(resource, changedBy, changeNote) {
  const service = createServiceClient();
  if (!service || !resource) return;
  await service.from('resource_revisions').insert({
    resource_id: resource.id,
    snapshot: resource,
    changed_by: changedBy,
    change_note: changeNote || null,
  });
}

/**
 * Soft HEAD/GET check for URL reachability. Never blocks draft saves.
 */
export async function probeExternalUrl(urlString) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(urlString, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok || res.status === 405 || res.status === 403) {
      return { verified: true, warning: null };
    }
    return {
      verified: false,
      warning: `URL returned HTTP ${res.status}. You can still save as draft.`,
    };
  } catch (e) {
    return {
      verified: false,
      warning: `Could not verify URL (${e instanceof Error ? e.message : 'network error'}). Draft allowed.`,
    };
  }
}
