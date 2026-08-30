/**
 * Resend invite email for an existing user (admin). Uses Supabase service role.
 * POST body: { email: string }
 */

import { createClient } from '@supabase/supabase-js';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    if (!email) return jsonResponse({ error: 'Email is required.' }, 400);

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) return jsonResponse({ error: 'Server configuration error.' }, 500);

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const baseUrl = request.headers.get('origin') || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
    const redirectTo = baseUrl ? `${baseUrl}/reset-password` : undefined;

    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {}
    });
    if (error) return jsonResponse({ error: error.message }, 400);
    return jsonResponse({ success: true, message: 'Invite resent.' });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Failed to resend invite' }, 500);
  }
}
