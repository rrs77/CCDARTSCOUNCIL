/**
 * Shared auth helpers for Vercel serverless routes.
 * Verifies Supabase JWTs and loads profiles for permission checks.
 */

import { createClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://wiudrzdkbpyziaodqoog.supabase.co';

/** Roles that can manage users (create / invite / suspend / anonymise). */
export const ADMIN_ROLES = new Set(['admin', 'superuser', 'super_admin']);

/** Roles that can view organisation-scoped download analytics. */
export const ORG_ANALYTICS_ROLES = new Set([
  'admin',
  'superuser',
  'super_admin',
  'organisation',
]);

/** Roles that can view global / system-wide download analytics. */
export const GLOBAL_ANALYTICS_ROLES = new Set(['admin', 'superuser', 'super_admin']);

/** Canonical + legacy system super roles (never checked by email at request time). */
export const SUPER_ADMIN_ROLES = new Set(['super_admin', 'superuser']);

const rateBuckets = new Map();

/**
 * CORS allowlist from env (comma-separated) plus app / Vercel URLs.
 * Env: CORS_ALLOWED_ORIGINS (preferred) or ALLOWED_ORIGINS.
 */
export function parseCorsAllowlist() {
  const raw =
    process.env.CORS_ALLOWED_ORIGINS ||
    process.env.ALLOWED_ORIGINS ||
    '';
  const fromEnv = raw
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const extras = [];
  if (process.env.VITE_APP_URL) {
    extras.push(String(process.env.VITE_APP_URL).replace(/\/$/, ''));
  }
  if (process.env.APP_URL) {
    extras.push(String(process.env.APP_URL).replace(/\/$/, ''));
  }
  if (process.env.VERCEL_URL) {
    extras.push(
      `https://${String(process.env.VERCEL_URL).replace(/^https?:\/\//, '')}`,
    );
  }
  return [...new Set([...fromEnv, ...extras])];
}

/**
 * Reflect Origin only when allow-listed. Omitting ACAO blocks credentialed
 * cross-origin callers that are not on the list.
 */
export function resolveCorsOrigin(request) {
  const origin = (request?.headers?.get?.('origin') || '').replace(/\/$/, '');
  if (!origin) return null;
  if (parseCorsAllowlist().includes(origin)) return origin;
  return null;
}

export function corsHeaders(extra = {}, request = null) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
    ...extra,
  };
  const allowed = resolveCorsOrigin(request);
  if (allowed) {
    headers['Access-Control-Allow-Origin'] = allowed;
  }
  return headers;
}

export function jsonResponse(body, status = 200, extraHeaders = {}, request = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders({}, request),
      ...extraHeaders,
    },
  });
}

export function optionsResponse(request = null) {
  return new Response(null, { status: 204, headers: corsHeaders({}, request) });
}

/**
 * Same-origin relative return path only (share / download post-login).
 * Rejects absolute, protocol-relative, scheme URLs, and control characters.
 */
export function safeInAppReturnPath(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/')) return null;
  if (trimmed.startsWith('//')) return null;
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) return null;
  if (/^[a-zA-Z][a-zA-Z+\-.]*:/.test(trimmed)) return null;
  if (trimmed.includes('\\')) return null;
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    /* keep trimmed */
  }
  if (/[\u0000-\u001f\u007f]/.test(decoded)) return null;
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return null;
  if (/^[a-zA-Z][a-zA-Z+\-.]*:/.test(decoded)) return null;
  return trimmed.split('#')[0] || null;
}

/** App sign-in URL that returns to an in-app path after auth (no share tokens). */
export function buildSignInRedirectLocation(returnPath) {
  const safe = safeInAppReturnPath(returnPath) || '/';
  const params = new URLSearchParams();
  params.set('return', safe);
  params.set('signin', '1');
  return `/?${params.toString()}`;
}

/**
 * Browser navigation vs API client. Used so unauthenticated share opens
 * redirect to sign-in instead of a bare JSON 401.
 */
export function prefersHtmlNavigation(request) {
  if (!request?.headers?.get) return false;
  const mode = (request.headers.get('sec-fetch-mode') || '').toLowerCase();
  if (mode === 'navigate' || mode === 'nested-navigate') return true;
  const accept = (request.headers.get('accept') || '').toLowerCase();
  if (!accept) return false;
  if (accept.includes('application/json') && !accept.includes('text/html')) {
    return false;
  }
  return accept.includes('text/html');
}

/**
 * Decision 2 — share links are signed-in users only (no anonymous / public
 * share tokens). Unauthenticated HTML navigations redirect to sign-in with
 * return= the file path; API clients get 401.
 */
export function unauthenticatedFileShareResponse(request, filePath) {
  const safePath = safeInAppReturnPath(filePath);
  if (prefersHtmlNavigation(request) && safePath) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: buildSignInRedirectLocation(safePath),
        'Cache-Control': 'private, no-store',
        ...corsHeaders({}, request),
      },
    });
  }
  return jsonResponse(
    { error: 'Unauthorized. Sign in required to open this shared file.' },
    401,
    {},
    request,
  );
}

export function getSupabaseUrl() {
  return (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    DEFAULT_SUPABASE_URL
  );
}

export function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

export function getAnonKey() {
  return process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
}

export function createServiceClient() {
  const key = getServiceRoleKey();
  if (!key) return null;
  return createClient(getSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Simple in-memory rate limit (per serverless isolate).
 * @returns {{ ok: true } | { ok: false, response: Response }}
 */
export function assertRateLimit(key, { limit = 30, windowMs = 60_000 } = {}) {
  const now = Date.now();
  let bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.windowStart > windowMs) {
    bucket = { windowStart: now, count: 0 };
    rateBuckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      response: jsonResponse(
        { error: 'Too many requests. Please wait a minute and try again.' },
        429,
        { 'Retry-After': '60' },
      ),
    };
  }
  return { ok: true };
}

export const JWT_CLOCK_SKEW_MS = 30_000;

/**
 * Shared Supabase access-token claim checks (HS256 payload after verify).
 * Requires aud === 'authenticated' and role === 'authenticated' (rejects anon key).
 */
export function accessTokenClaimsAreValid(claims, nowMs = Date.now()) {
  if (!claims || typeof claims !== 'object') return false;
  if (!claims.sub || typeof claims.sub !== 'string') return false;
  if (typeof claims.exp !== 'number') return false;
  if (claims.exp * 1000 < nowMs - JWT_CLOCK_SKEW_MS) return false;
  if (claims.aud !== 'authenticated' || claims.role !== 'authenticated') {
    return false;
  }
  return true;
}

function decodeJwtPart(part) {
  try {
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function decodeJwtHeader(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  return decodeJwtPart(parts[0]);
}

function decodeJwtPayload(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  return decodeJwtPart(parts[1]);
}

async function verifyHs256(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const data = enc.encode(`${parts[0]}.${parts[1]}`);
    const sig = Uint8Array.from(
      atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0),
    );
    return await crypto.subtle.verify('HMAC', key, sig, data);
  } catch {
    return false;
  }
}

/**
 * Extract Bearer token from Authorization header.
 * Query-string `?access_token=` is opt-in for GET resource downloads only
 * (window.location cannot set Authorization). Never use on /api/files or
 * ordinary JSON APIs — tokens would leak via Referer / logs.
 *
 * @param {Request} request
 * @param {{ allowQuery?: boolean }} [options]
 */
export function getBearerToken(request, { allowQuery = false } = {}) {
  const authHeader = request.headers.get('authorization') || '';
  const fromHeader = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (fromHeader) return fromHeader;
  if (!allowQuery) return '';
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('access_token');
    if (q && q.trim()) return q.trim();
  } catch {
    /* ignore */
  }
  return '';
}

/**
 * Verify Supabase JWT. Prefer SUPABASE_JWT_SECRET (HS256).
 * Falls back to getUser via service role when secret is unset (dev / misconfig).
 *
 * @param {Request} request
 * @param {{ allowQuery?: boolean }} [options] pass allowQuery:true only for
 *   GET /api/resources/:id/download (window.location tracked downloads).
 * @returns {Promise<{ ok: true, userId: string, email?: string, token: string, claims: object } | { ok: false, response: Response }>}
 */
export async function requireAuth(request, options = {}) {
  const token = getBearerToken(request, options);
  if (!token) {
    return { ok: false, response: jsonResponse({ error: 'Unauthorized. Sign in required.' }, 401) };
  }

  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (jwtSecret) {
    const header = decodeJwtHeader(token);
    if (!header || header.alg !== 'HS256') {
      return { ok: false, response: jsonResponse({ error: 'Unauthorized. Invalid token.' }, 401) };
    }

    let valid = false;
    try {
      valid = await verifyHs256(token, jwtSecret);
    } catch {
      return { ok: false, response: jsonResponse({ error: 'Unauthorized. Invalid token.' }, 401) };
    }
    if (!valid) {
      return { ok: false, response: jsonResponse({ error: 'Unauthorized. Invalid token.' }, 401) };
    }

    const claims = decodeJwtPayload(token);
    if (!accessTokenClaimsAreValid(claims)) {
      const expired =
        claims &&
        typeof claims.exp === 'number' &&
        claims.exp * 1000 < Date.now() - JWT_CLOCK_SKEW_MS;
      return {
        ok: false,
        response: jsonResponse(
          {
            error: expired
              ? 'Unauthorized. Session expired.'
              : 'Unauthorized. Invalid token.',
          },
          401,
        ),
      };
    }
    return {
      ok: true,
      userId: claims.sub,
      email: typeof claims.email === 'string' ? claims.email : undefined,
      token,
      claims,
    };
  }

  // Fallback: validate via Supabase Auth Admin API
  const service = createServiceClient();
  if (!service) {
    return {
      ok: false,
      response: jsonResponse(
        {
          error:
            'Server misconfigured: set SUPABASE_JWT_SECRET or SUPABASE_SERVICE_ROLE_KEY.',
        },
        500,
      ),
    };
  }
  const { data, error } = await service.auth.getUser(token);
  if (error || !data?.user?.id) {
    return { ok: false, response: jsonResponse({ error: 'Unauthorized. Invalid token.' }, 401) };
  }
  return {
    ok: true,
    userId: data.user.id,
    email: data.user.email,
    token,
    claims: { sub: data.user.id, email: data.user.email },
  };
}

/**
 * Load profile for an authenticated user (service role bypasses RLS).
 */
export async function loadProfile(userId) {
  const service = createServiceClient();
  if (!service) return null;
  const { data, error } = await service
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.warn('loadProfile error:', error.message);
    return null;
  }
  return data;
}

export function isSuspended(profile) {
  return profile?.status === 'suspended' || profile?.anonymised_at != null;
}

export function isSuperAdminProfile(profile) {
  if (!profile || isSuspended(profile)) return false;
  return SUPER_ADMIN_ROLES.has(profile.role);
}

/** System admins who may list/manage all users (not hub-scoped). */
/** Full user admin = super_admin / superuser only (matches SQL current_user_is_full_user_admin). */
export function isFullUserAdmin(profile) {
  if (!profile || isSuspended(profile)) return false;
  return SUPER_ADMIN_ROLES.has(profile.role);
}

export function canManageUsers(profile) {
  if (!profile || isSuspended(profile)) return false;
  if (ADMIN_ROLES.has(profile.role)) return true;
  return profile.can_manage_users === true;
}

/**
 * V4: non-managers may only change invited/pending → active.
 * Any change from suspended is denied (blocks self-reactivation).
 * No-op (same status) is allowed.
 */
export function maySelfUpdateProfileStatus(oldStatus, newStatus) {
  if (oldStatus === newStatus) return true;
  if (oldStatus === 'suspended') return false;
  return (
    (oldStatus === 'invited' || oldStatus === 'pending') &&
    newStatus === 'active'
  );
}

/**
 * LOW: anonymised_at may only change via service role (non-server denied).
 */
export function mayClientUpdateAnonymisedAt({ isServer = false, oldValue, newValue }) {
  if (isServer) return true;
  return oldValue === newValue || (oldValue == null && newValue == null);
}

/** Rank for role grant comparisons (higher = more privileged). */
export const PROFILE_ROLE_RANK = Object.freeze({
  student: 0,
  viewer: 0,
  teacher: 1,
  creator: 1,
  organisation: 2,
  admin: 3,
  superuser: 4,
  super_admin: 4,
});

export function profileRoleRank(role) {
  if (role == null) return 0;
  const rank = PROFILE_ROLE_RANK[role];
  return Number.isFinite(rank) ? rank : 0;
}

/** Capability / forum / preset fields managers must not change on their own row. */
export const SELF_LOCKED_PROFILE_FLAGS = Object.freeze([
  'can_edit_activities',
  'can_edit_lessons',
  'can_manage_year_groups',
  'can_manage_users',
  'can_view_download_analytics',
  'can_view_raw_ip',
  'forum_can_moderate',
  'forum_can_manage_categories',
  'forum_can_manage_settings',
  'allowed_year_groups',
  'admin_preset_categories',
  'admin_preset_activity_pack_ids',
]);

/** Distinct-from check for scalars and JSON-ish arrays (self-edit guards). */
function profileFieldChanged(nextVal, oldVal) {
  if (Array.isArray(nextVal) || Array.isArray(oldVal)) {
    return JSON.stringify(nextVal ?? null) !== JSON.stringify(oldVal ?? null);
  }
  return nextVal !== oldVal;
}

/**
 * V5: whether a manager may apply targetNew over targetOld.
 * Super-admins (super_admin / superuser) are unrestricted.
 * Other managers: same-org only; cannot move organisation_id to another org;
 * cannot edit others whose rank >= actor rank; cannot grant roles at/above
 * their own or any SUPER_ADMIN_ROLES; cannot change their own can_ or forum_can_ flags.
 */
export function canManagerEditProfile({ actor, targetOld, targetNew }) {
  if (!actor || !targetOld || !canManageUsers(actor)) return false;
  if (isSuperAdminProfile(actor)) return true;

  const actorOrg =
    typeof actor.organisation_id === 'string' ? actor.organisation_id.trim() : '';
  const targetOrg =
    typeof targetOld.organisation_id === 'string'
      ? targetOld.organisation_id.trim()
      : '';
  if (!actorOrg || !targetOrg || actorOrg !== targetOrg) return false;

  const isSelf =
    actor.id != null && targetOld.id != null && String(actor.id) === String(targetOld.id);

  // Block editing peers/superiors (except self).
  if (!isSelf && profileRoleRank(targetOld.role) >= profileRoleRank(actor.role)) {
    return false;
  }

  if (targetNew && Object.prototype.hasOwnProperty.call(targetNew, 'organisation_id')) {
    const nextOrg =
      targetNew.organisation_id == null
        ? ''
        : String(targetNew.organisation_id).trim();
    if (!nextOrg || nextOrg !== actorOrg) return false;
  }

  if (
    targetNew &&
    Object.prototype.hasOwnProperty.call(targetNew, 'role') &&
    targetNew.role !== targetOld.role
  ) {
    if (SUPER_ADMIN_ROLES.has(targetNew.role)) return false;
    if (profileRoleRank(targetNew.role) >= profileRoleRank(actor.role)) {
      return false;
    }
  }

  // Managers cannot escalate their own capability / forum / preset fields.
  if (isSelf && targetNew) {
    for (const flag of SELF_LOCKED_PROFILE_FLAGS) {
      if (
        Object.prototype.hasOwnProperty.call(targetNew, flag) &&
        profileFieldChanged(targetNew[flag], targetOld[flag])
      ) {
        return false;
      }
    }
  }

  return true;
}

export function canViewGlobalAnalytics(profile) {
  if (!profile || isSuspended(profile)) return false;
  if (GLOBAL_ANALYTICS_ROLES.has(profile.role)) return true;
  return profile.can_view_download_analytics === true && isSuperAdminProfile(profile);
}

export function canViewOrgAnalytics(profile) {
  if (!profile || isSuspended(profile)) return false;
  if (GLOBAL_ANALYTICS_ROLES.has(profile.role)) return true;
  if (ORG_ANALYTICS_ROLES.has(profile.role) && profile.organisation_id) return true;
  return (
    profile.can_view_download_analytics === true && Boolean(profile.organisation_id)
  );
}

export function canViewRawIp(profile) {
  if (!profile || isSuspended(profile)) return false;
  return profile.can_view_raw_ip === true && isSuperAdminProfile(profile);
}

/**
 * Require auth + admin/user-management permission.
 */
export async function requireAdmin(request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth;
  const profile = await loadProfile(auth.userId);
  if (!profile || isSuspended(profile) || !canManageUsers(profile)) {
    return {
      ok: false,
      response: jsonResponse({ error: 'Forbidden. Admin access required.' }, 403),
    };
  }
  return { ...auth, profile };
}

/**
 * Write an audit_log row (best-effort; never throws to caller).
 */
export async function writeAuditLog({
  actorId,
  action,
  targetType = null,
  targetId = null,
  meta = null,
  ipHash = null,
  organisationId = null,
}) {
  try {
    const service = createServiceClient();
    if (!service) return;
    const row = {
      actor_id: actorId,
      action,
      target_type: targetType,
      target_id: targetId,
      meta,
      ip_hash: ipHash,
    };
    if (organisationId) row.organisation_id = organisationId;
    await service.from('audit_log').insert(row);
  } catch (e) {
    console.warn('audit_log write failed:', e instanceof Error ? e.message : e);
  }
}

/**
 * Trusted client IP from Vercel / proxy headers.
 * Prefer x-vercel-forwarded-for, then x-forwarded-for first hop, then x-real-ip.
 */
export function getClientIp(request) {
  const vercel = request.headers.get('x-vercel-forwarded-for');
  if (vercel) {
    return vercel.split(',')[0].trim();
  }
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0].trim();
  }
  return (request.headers.get('x-real-ip') || '').trim() || null;
}

/**
 * Truncate IPv4 to /24 and IPv6 to /48 for privacy, then SHA-256 hash.
 * Stores neither full IP nor reversible truncation alone.
 */
export async function hashIpForStorage(ip) {
  if (!ip) return null;
  let truncated = ip;
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) truncated = `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  } else if (ip.includes(':')) {
    const parts = ip.split(':').filter(Boolean);
    truncated = parts.slice(0, 3).join(':') + '::';
  }
  const salt = process.env.IP_HASH_SALT || 'ccd-download-ip-v1';
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(`${salt}:${truncated}`));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getAppOrigin(request) {
  const fromEnv =
    process.env.VITE_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  if (fromEnv) return String(fromEnv).replace(/\/$/, '');
  const origin = request.headers.get('origin');
  if (origin) return origin.replace(/\/$/, '');
  return '';
}
