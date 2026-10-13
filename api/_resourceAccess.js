/**
 * Partner resource entitlement + organisation access codes (server-only).
 * Locked file locations live in resource_private_locations (service role only)
 * and are released only after decideResourceAccess() allows it.
 */

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const ACCESS_LEVELS = ['free', 'access_code', 'subscription', 'external_link'];

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Upper-case, drop spaces and dashes so "ab12-cd34" and "AB12 CD34" match. */
export function normaliseAccessCode(raw) {
  return typeof raw === 'string' ? raw.toUpperCase().replace(/[\s-]+/g, '') : '';
}

/** Human-friendly code without ambiguous characters, e.g. "K7QM-4XHP-2RTA". */
export function generateAccessCode(groups = 3, size = 4) {
  const bytes = randomBytes(groups * size);
  const chars = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]);
  const parts = [];
  for (let i = 0; i < groups; i += 1) parts.push(chars.slice(i * size, (i + 1) * size).join(''));
  return parts.join('-');
}

export function hashAccessCode(code) {
  const salt = randomBytes(16);
  const hash = scryptSync(normaliseAccessCode(code), salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyAccessCode(code, stored) {
  if (typeof stored !== 'string') return false;
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  try {
    const expected = Buffer.from(hashHex, 'hex');
    const actual = scryptSync(normaliseAccessCode(code), Buffer.from(saltHex, 'hex'), expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** A code row can be redeemed when active, unexpired and under its limit. */
export function codeIsRedeemable(row, now = Date.now()) {
  if (!row || !row.active) return false;
  if (row.expires_at && new Date(row.expires_at).getTime() <= now) return false;
  if (Number.isInteger(row.max_redemptions) && row.redemption_count >= row.max_redemptions) return false;
  return true;
}

export function grantIsActive(grant, now = Date.now()) {
  if (!grant || grant.revoked_at) return false;
  return !grant.expires_at || new Date(grant.expires_at).getTime() > now;
}

/**
 * @param {{
 *   resource: { status?: string, is_active?: boolean, access_level?: string, organisation_id?: string } | null,
 *   isSuperAdmin?: boolean,
 *   hubRole?: string | null,
 *   grant?: { source?: string, revoked_at?: string | null, expires_at?: string | null } | null,
 *   now?: number,
 * }} input
 * @returns {{ allowed: boolean, reason: string }}
 */
export function decideResourceAccess({ resource, isSuperAdmin = false, hubRole = null, grant = null, now = Date.now() }) {
  if (!resource) return { allowed: false, reason: 'not_found' };
  if (isSuperAdmin) return { allowed: true, reason: 'super_admin' };
  if (hubRole) return { allowed: true, reason: 'hub_member' };

  const published = (resource.status ?? 'published') === 'published' && resource.is_active !== false;
  if (!published) return { allowed: false, reason: 'not_found' };

  const level = resource.access_level || 'free';
  if (level === 'free' || level === 'external_link') return { allowed: true, reason: 'free' };

  if (!grantIsActive(grant, now)) {
    return { allowed: false, reason: level === 'subscription' ? 'subscription_required' : 'code_required' };
  }
  if (level === 'subscription' && !['subscription', 'admin'].includes(grant.source)) {
    return { allowed: false, reason: 'subscription_required' };
  }
  return { allowed: true, reason: 'granted' };
}
