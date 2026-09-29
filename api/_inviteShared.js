/**
 * Shared invitation helpers for create-user / resend-invite / users list.
 * Invite links are one-time Supabase Auth URLs. Never return them to the admin UI.
 */

import { getAppOrigin } from './_authShared.js';

export const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

export const CREATE_USER_ROLES = [
  'viewer',
  'student',
  'teacher',
  'admin',
  'superuser',
  'super_admin',
  'creator',
  'organisation',
];

const ALREADY_REGISTERED_RE =
  /already (been )?registered|already exists|user already|duplicate(?: key)?|email address has already/i;

/**
 * @param {unknown} err
 */
export function isAlreadyRegisteredError(err) {
  const msg = typeof err === 'string' ? err : err && typeof err === 'object' && 'message' in err
    ? String(err.message)
    : '';
  return ALREADY_REGISTERED_RE.test(msg);
}

/**
 * @param {Date} [now]
 */
export function inviteTimestamps(now = new Date()) {
  return {
    invite_sent_at: now.toISOString(),
    invite_expires_at: new Date(now.getTime() + INVITE_TTL_MS).toISOString(),
  };
}

/**
 * @param {{
 *   status?: string | null,
 *   must_change_password?: boolean | null,
 *   invite_expires_at?: string | null,
 *   anonymised_at?: string | null,
 * }} profile
 * @param {Date} [now]
 * @returns {'pending' | 'expired' | 'complete' | 'suspended'}
 */
export function invitationStatus(profile, now = new Date()) {
  if (!profile) return 'pending';
  if (profile.status === 'suspended' || profile.anonymised_at) return 'suspended';
  if (profile.status === 'active' && profile.must_change_password !== true) {
    return 'complete';
  }
  if (profile.invite_expires_at) {
    const exp = new Date(profile.invite_expires_at);
    if (!Number.isNaN(exp.getTime()) && exp.getTime() <= now.getTime()) {
      return 'expired';
    }
  }
  return 'pending';
}

/**
 * @param {object} profile
 * @param {Date} [now]
 */
export function canResendInvitation(profile, now = new Date()) {
  const status = invitationStatus(profile, now);
  return status === 'pending' || status === 'expired';
}

/**
 * @param {Request} request
 * @returns {string | undefined}
 */
export function inviteRedirectUrl(request) {
  const fromHeader = request.headers.get('origin');
  const origin = (fromHeader || getAppOrigin(request) || '').replace(/\/$/, '');
  if (!origin) return undefined;
  return `${origin}/reset-password`;
}

/**
 * @param {string} role
 */
export function defaultPermissionsForRole(role) {
  const canEdit =
    role === 'teacher' ||
    role === 'admin' ||
    role === 'superuser' ||
    role === 'super_admin' ||
    role === 'creator';
  return {
    can_edit_lessons: canEdit,
    can_edit_activities: canEdit,
  };
}

const SECRET_KEYS = new Set([
  'password',
  'temporarypassword',
  'action_link',
  'hashed_token',
  'email_otp',
]);

/**
 * True when the JSON payload would leak a password or one-time link.
 * @param {unknown} payload
 */
export function payloadContainsSecrets(payload) {
  if (payload == null) return false;
  const walk = (value) => {
    if (!value || typeof value !== 'object') return false;
    if (Array.isArray(value)) return value.some(walk);
    for (const [key, val] of Object.entries(value)) {
      if (SECRET_KEYS.has(String(key).toLowerCase())) return true;
      if (walk(val)) return true;
    }
    return false;
  };
  return walk(payload);
}

/**
 * @param {object} admin
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} email
 */
export async function findProfileByEmail(supabase, email) {
  const target = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', target)
    .limit(5);
  if (error) throw error;
  const rows = data || [];
  return (
    rows.find((row) => String(row.email || '').trim().toLowerCase() === target) ||
    rows[0] ||
    null
  );
}

/**
 * Persist invite timestamps; retry without those columns if the DB is not migrated yet.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {Record<string, unknown>} timestamps
 */
export async function updateInviteTimestamps(supabase, userId, timestamps) {
  const { error } = await supabase
    .from('profiles')
    .update({ ...timestamps, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error && /invite_sent_at|invite_expires_at/.test(error.message || '')) {
    return { skipped: true, error: null };
  }
  return { skipped: false, error };
}

/**
 * Upsert a profile row, dropping invite timestamp columns if the schema lacks them.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {Record<string, unknown>} row
 */
export async function upsertProfileRow(supabase, row) {
  let { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
  if (error && /invite_sent_at|invite_expires_at/.test(error.message || '')) {
    const rest = { ...row };
    delete rest.invite_sent_at;
    delete rest.invite_expires_at;
    ({ error } = await supabase.from('profiles').upsert(rest, { onConflict: 'id' }));
  }
  return error;
}

/**
 * Generate a one-time Auth link. Caller must email properties.action_link and
 * must not return it to the browser.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ type: 'invite' | 'recovery' | 'magiclink', email: string, redirectTo?: string, data?: object }} opts
 */
export async function generateAuthLink(supabase, { type, email, redirectTo, data }) {
  const { data: linkData, error } = await supabase.auth.admin.generateLink({
    type,
    email,
    options: {
      ...(data ? { data } : {}),
      ...(redirectTo ? { redirectTo } : {}),
    },
  });
  if (error) return { error, user: null, actionLink: null };
  const actionLink =
    linkData?.properties?.action_link &&
    typeof linkData.properties.action_link === 'string'
      ? linkData.properties.action_link
      : null;
  return {
    error: null,
    user: linkData?.user || null,
    actionLink,
  };
}
