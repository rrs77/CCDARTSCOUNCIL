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

export function corsHeaders(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...extra,
  };
}

export function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
      ...extraHeaders,
    },
  });
}

export function optionsResponse() {
  return new Response(null, { status: 204, headers: corsHeaders() });
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

function decodeJwtPayload(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function verifyHs256(token, secret) {
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
  return crypto.subtle.verify('HMAC', key, sig, data);
}

/**
 * Extract Bearer token from Authorization header.
 */
export function getBearerToken(request) {
  const authHeader = request.headers.get('authorization') || '';
  const fromHeader = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (fromHeader) return fromHeader;
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
 * @returns {Promise<{ ok: true, userId: string, email?: string, token: string, claims: object } | { ok: false, response: Response }>}
 */
export async function requireAuth(request) {
  const token = getBearerToken(request);
  if (!token) {
    return { ok: false, response: jsonResponse({ error: 'Unauthorized. Sign in required.' }, 401) };
  }

  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (jwtSecret) {
    const valid = await verifyHs256(token, jwtSecret);
    if (!valid) {
      return { ok: false, response: jsonResponse({ error: 'Unauthorized. Invalid token.' }, 401) };
    }
    const claims = decodeJwtPayload(token);
    const userId = claims?.sub;
    if (!userId) {
      return { ok: false, response: jsonResponse({ error: 'Unauthorized. Invalid token.' }, 401) };
    }
    if (claims.exp && claims.exp * 1000 < Date.now()) {
      return { ok: false, response: jsonResponse({ error: 'Unauthorized. Session expired.' }, 401) };
    }
    return {
      ok: true,
      userId,
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

export function canManageUsers(profile) {
  if (!profile || isSuspended(profile)) return false;
  if (ADMIN_ROLES.has(profile.role)) return true;
  return profile.can_manage_users === true;
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
