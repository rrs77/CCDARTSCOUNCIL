#!/usr/bin/env node
/**
 * Set a user's password via Supabase Admin API (no email sent – use when rate limit hit).
 *
 * Get your service_role key: Supabase Dashboard → Project Settings → API → service_role (secret).
 * Never commit this key or use it in the frontend.
 *
 * Usage (from project root):
 *   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key node scripts/set-user-password.js <user_uid> <new_password>
 *
 * Example for rob.reichstorer@gmail.com (UID from Auth → Users):
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/set-user-password.js bccf4ec8-63e7-458f-b8c6-e9ea8cd5c8a5 MyNewPassword123
 *
 * Optional: VITE_SUPABASE_URL or SUPABASE_URL if different from default.
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://wiudrzdkbpyziaodqoog.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in env (Supabase Dashboard → Project Settings → API → service_role).');
  process.exit(1);
}

const uid = process.argv[2];
const newPassword = process.argv[3];

if (!uid || !newPassword) {
  console.error('Usage: SUPABASE_SERVICE_ROLE_KEY=... node scripts/set-user-password.js <user_uid> <new_password>');
  console.error('Example: SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/set-user-password.js bccf4ec8-63e7-458f-b8c6-e9ea8cd5c8a5 MyNewPass123');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

async function main() {
  const { data, error } = await supabase.auth.admin.updateUserById(uid, { password: newPassword });
  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
  console.log('Password updated for user:', data?.user?.email || uid);
}

main();
