/**
 * POST /api/create-user
 * Admin-only: create user with password or invite by email (Supabase Auth).
 *
 * Env: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL | VITE_SUPABASE_URL,
 *      SUPABASE_JWT_SECRET (recommended), RESEND_API_KEY (optional branded email)
 */

import {
  assertRateLimit,
  createServiceClient,
  getAppOrigin,
  getClientIp,
  hashIpForStorage,
  jsonResponse,
  optionsResponse,
  requireAdmin,
  writeAuditLog,
} from './_authShared.js';
import {
  accountCreatedEmail,
  activateAccountEmail,
  sendResendEmail,
} from './_emailTemplates.js';

const ROLES = [
  'viewer',
  'student',
  'teacher',
  'admin',
  'superuser',
  'creator',
  'organisation',
];
const STATUSES = ['active', 'invited', 'suspended'];

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;

    const ip = getClientIp(request);
    const rl = assertRateLimit(`create-user:${admin.userId}:${ip || 'x'}`, {
      limit: 20,
      windowMs: 60_000,
    });
    if (!rl.ok) return rl.response;

    const body = await request.json().catch(() => ({}));
    const {
      email,
      password,
      display_name,
      first_name,
      last_name,
      school_or_org,
      role,
      status,
      send_invite_email,
      allowed_year_groups,
      admin_preset_categories,
      admin_preset_activity_pack_ids,
      organisation_id,
      organisation_name,
      must_change_password,
      marketing_consent,
    } = body || {};

    const emailTrimmed = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      return jsonResponse({ error: 'A valid email is required.' }, 400);
    }

    const roleVal = role && ROLES.includes(role) ? role : 'viewer';
    if (roleVal === 'superuser' && admin.profile?.role !== 'superuser') {
      return jsonResponse({ error: 'Only a superuser can create another superuser.' }, 403);
    }

    const statusVal = status && STATUSES.includes(status) ? status : 'invited';
    const displayName =
      (typeof display_name === 'string' && display_name.trim()) ||
      [first_name, last_name].filter(Boolean).join(' ').trim() ||
      null;
    const useInvite =
      send_invite_email === true || (!password && statusVal === 'invited');
    const forcePwChange =
      must_change_password === true ||
      (!useInvite && typeof password === 'string' && password.length >= 6);

    const supabase = createServiceClient();
    if (!supabase) {
      return jsonResponse(
        {
          error:
            'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is not set. Add it in Vercel Project Settings → Environment Variables.',
        },
        500,
      );
    }

    const origin = getAppOrigin(request);
    const redirectTo = origin ? `${origin}/reset-password` : undefined;
    let user;
    let temporaryPassword = null;

    if (!useInvite && password && typeof password === 'string' && password.length >= 6) {
      temporaryPassword = password;
      const { data, error } = await supabase.auth.admin.createUser({
        email: emailTrimmed,
        password,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
          role: roleVal,
          must_change_password: forcePwChange,
        },
      });
      if (error) return jsonResponse({ error: error.message }, 400);
      user = data?.user;
    } else {
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(emailTrimmed, {
        data: { display_name: displayName, role: roleVal },
        redirectTo,
      });
      if (error) return jsonResponse({ error: error.message }, 400);
      user = data?.user;
    }

    if (!user?.id) {
      return jsonResponse({ error: 'User could not be created.' }, 500);
    }

    const profileRow = {
      id: user.id,
      email: user.email ?? emailTrimmed,
      display_name: displayName,
      first_name: typeof first_name === 'string' ? first_name.trim() || null : null,
      last_name: typeof last_name === 'string' ? last_name.trim() || null : null,
      school_or_org: typeof school_or_org === 'string' ? school_or_org.trim() || null : null,
      role: roleVal,
      status: statusVal,
      must_change_password: forcePwChange,
      organisation_id: typeof organisation_id === 'string' ? organisation_id.trim() || null : null,
      organisation_name:
        typeof organisation_name === 'string' ? organisation_name.trim() || null : null,
      marketing_consent: marketing_consent === true,
      marketing_consent_at: marketing_consent === true ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
      ...(Array.isArray(allowed_year_groups) &&
        allowed_year_groups.length > 0 && { allowed_year_groups }),
      ...(Array.isArray(admin_preset_categories) &&
        admin_preset_categories.length > 0 && { admin_preset_categories }),
      ...(Array.isArray(admin_preset_activity_pack_ids) &&
        admin_preset_activity_pack_ids.length > 0 && {
          admin_preset_activity_pack_ids,
        }),
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileRow, { onConflict: 'id' });
    if (profileError) {
      console.warn('Profile upsert warning:', profileError.message);
    }

    const loginUrl = origin || 'https://www.ccdesigner.co.uk';
    if (useInvite) {
      const mail = activateAccountEmail({
        displayName,
        activateUrl: redirectTo || `${loginUrl}/reset-password`,
      });
      await sendResendEmail({ to: emailTrimmed, ...mail });
    } else if (temporaryPassword) {
      const mail = accountCreatedEmail({
        displayName,
        email: emailTrimmed,
        temporaryPassword,
        loginUrl,
      });
      await sendResendEmail({ to: emailTrimmed, ...mail });
    }

    const ipHash = await hashIpForStorage(ip);
    await writeAuditLog({
      actorId: admin.userId,
      action: useInvite ? 'user.invite' : 'user.create',
      targetType: 'profile',
      targetId: user.id,
      meta: { email: emailTrimmed, role: roleVal, status: statusVal },
      ipHash,
    });

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
      500,
    );
  }
}
