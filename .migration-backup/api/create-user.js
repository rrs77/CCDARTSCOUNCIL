/**
 * Vercel Serverless Function: Create or invite a user (admin only).
 * Uses Supabase service role. Call from Settings → Users → Add user.
 *
 * POST body: { email: string, password?: string, display_name?: string, role?: 'viewer'|'teacher'|'admin'|'superuser' }
 * - If password is provided: creates user with that password (email_confirm: true).
 * - If password is omitted: sends invite email; user sets password when they accept.
 * Env: SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_URL or SUPABASE_URL
 */

import { createClient } from '@supabase/supabase-js';

const ROLES = ['viewer', 'student', 'teacher', 'admin', 'superuser'];
const STATUSES = ['active', 'invited', 'suspended'];

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, display_name, role, status, send_invite_email, allowed_year_groups, admin_preset_categories, admin_preset_activity_pack_ids } = body || {};

    const emailTrimmed = typeof email === 'string' ? email.trim() : '';
    if (!emailTrimmed) {
      return jsonResponse({ error: 'Email is required.' }, 400);
    }

    const roleVal = role && ROLES.includes(role) ? role : 'viewer';
    const statusVal = status && STATUSES.includes(status) ? status : 'invited';
    const displayName = typeof display_name === 'string' ? display_name.trim() || null : null;
    const useInvite = send_invite_email === true || (!password && statusVal === 'invited');

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://wiudrzdkbpyziaodqoog.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return jsonResponse({
        error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is not set. Add it in Vercel Project Settings → Environment Variables.',
      }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    let user;
    if (!useInvite && password && typeof password === 'string' && password.length >= 6) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: emailTrimmed,
        password,
        email_confirm: true,
        user_metadata: { display_name: displayName, role: roleVal },
      });
      if (error) {
        return jsonResponse({ error: error.message }, 400);
      }
      user = data?.user;
    } else {
      const baseUrl = request.headers.get('origin') || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
      const redirectTo = baseUrl ? `${baseUrl}/reset-password` : `${request.headers.get('referer')?.replace(/\/[^/]*$/, '') || ''}/reset-password`;
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(emailTrimmed, {
        data: { display_name: displayName, role: roleVal },
        redirectTo,
      });
      if (error) {
        return jsonResponse({ error: error.message }, 400);
      }
      user = data?.user;
    }

    if (!user?.id) {
      return jsonResponse({ error: 'User could not be created.' }, 500);
    }

    // Ensure profile has correct role, display_name, status, and admin presets (trigger may have created it)
    const profileRow = {
      id: user.id,
      email: user.email ?? emailTrimmed,
      display_name: displayName,
      role: roleVal,
      status: statusVal,
      updated_at: new Date().toISOString(),
      ...(Array.isArray(allowed_year_groups) && allowed_year_groups.length > 0 && { allowed_year_groups }),
      ...(Array.isArray(admin_preset_categories) && admin_preset_categories.length > 0 && { admin_preset_categories }),
      ...(Array.isArray(admin_preset_activity_pack_ids) && admin_preset_activity_pack_ids.length > 0 && { admin_preset_activity_pack_ids }),
    };
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileRow, { onConflict: 'id' });

    if (profileError) {
      console.warn('Profile upsert warning:', profileError.message);
      // User was created; profile may still be updated by trigger
    }

    return jsonResponse({
      success: true,
      user: {
        id: user.id,
        email: user.email ?? emailTrimmed,
        display_name: displayName,
        role: roleVal,
      },
      invited: useInvite,
    });
  } catch (e) {
    console.error('create-user error:', e);
    return jsonResponse(
      { error: e instanceof Error ? e.message : 'Failed to create user' },
      500
    );
  }
}
