#!/usr/bin/env node
/**
 * ONE-OFF (manual): grant profiles.role = super_admin to a fixed auth.users.id.
 *
 * Does NOT match by email. Requires:
 *   - argument: auth.users UUID
 *   - that user has email_confirmed_at IS NOT NULL
 *   - SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the environment
 *
 * Usage (do not run from CI / agent unless the owner asks):
 *   node scripts/grant-super-admin.mjs <auth-users-uuid>
 *
 * Dry-run (default): prints what would change. Pass --apply to write.
 */

import { createClient } from '@supabase/supabase-js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function usage(msg) {
  if (msg) console.error(msg);
  console.error(
    'Usage: node scripts/grant-super-admin.mjs <auth.users.id> [--apply]',
  );
  process.exit(msg ? 1 : 0);
}

const args = process.argv.slice(2).filter((a) => a !== '--apply');
const apply = process.argv.includes('--apply');
const userId = args[0];

if (!userId || !UUID_RE.test(userId)) {
  usage('Missing or invalid auth.users.id UUID.');
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  usage('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

const service = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: authUser, error: authErr } = await service.auth.admin.getUserById(
  userId,
);
if (authErr || !authUser?.user) {
  console.error('auth.users lookup failed:', authErr?.message || 'not found');
  process.exit(1);
}

const user = authUser.user;
if (!user.email_confirmed_at) {
  console.error(
    'Refusing: email_confirmed_at is null. Confirm the account first.',
  );
  process.exit(1);
}

const { data: profile, error: profileErr } = await service
  .from('profiles')
  .select('id, email, role, status, can_manage_users')
  .eq('id', userId)
  .maybeSingle();

if (profileErr) {
  console.error('profiles lookup failed:', profileErr.message);
  process.exit(1);
}
if (!profile) {
  console.error('No profiles row for', userId);
  process.exit(1);
}

console.log('Target profile:', {
  id: profile.id,
  email: profile.email,
  role: profile.role,
  status: profile.status,
  auth_email_confirmed_at: user.email_confirmed_at,
});

if (!apply) {
  console.log(
    'Dry-run only. Re-run with --apply to set role=super_admin, can_manage_users=true.',
  );
  process.exit(0);
}

const { error: updErr } = await service
  .from('profiles')
  .update({
    role: 'super_admin',
    can_manage_users: true,
    updated_at: new Date().toISOString(),
  })
  .eq('id', userId);

if (updErr) {
  console.error('Update failed:', updErr.message);
  process.exit(1);
}

console.log('Applied: role=super_admin for', userId);
