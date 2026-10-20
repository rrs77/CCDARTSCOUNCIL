/**
 * POST /api/create-user
 * Admin-only: invite a user. They set their own password via a one-time link.
 * Never accepts, stores, or returns a password.
 *
 * Env: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL | VITE_SUPABASE_URL,
 *      SUPABASE_JWT_SECRET (recommended), RESEND_API_KEY (branded email)
 */

import {
  assertRateLimit,
  createServiceClient,
  getClientIp,
  hashIpForStorage,
  isFullUserAdmin,
  jsonResponse,
  optionsResponse,
  requireAdmin,
  SUPER_ADMIN_ROLES,
  writeAuditLog,
} from './_authShared.js';
import { activateAccountEmail, sendResendEmail } from './_emailTemplates.js';
import {
  CREATE_USER_ROLES,
  defaultPermissionsForRole,
  generateAuthLink,
  inviteRedirectUrl,
  inviteTimestamps,
  isAlreadyRegisteredError,
  payloadContainsSecrets,
  upsertProfileRow,
} from './_inviteShared.js';

export async function OPTIONS() {
  return optionsResponse();
}

function safeJson(body, status) {
  if (payloadContainsSecrets(body)) {
    console.error('create-user refused to return secrets in JSON');
    return jsonResponse({ error: 'Internal server error.' }, 500);
  }
  return jsonResponse(body, status);
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
      display_name,
      first_name,
      last_name,
      school_or_org,
      role,
      allowed_year_groups,
      admin_preset_categories,
      admin_preset_activity_pack_ids,
      organisation_id,
      organisation_name,
      marketing_consent,
    } = body || {};

    const emailTrimmed = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      return safeJson({ error: 'A valid email is required.' }, 400);
    }

    const roleVal = role && CREATE_USER_ROLES.includes(role) ? role : 'teacher';
    const actorIsSuper = SUPER_ADMIN_ROLES.has(admin.profile?.role);
    const actorIsFullAdmin = isFullUserAdmin(admin.profile);
    if ((roleVal === 'superuser' || roleVal === 'super_admin') && !actorIsSuper) {
      return safeJson({ error: 'Only a super admin can create another super admin.' }, 403);
    }
    // Org / hub admins cannot mint system admins
    if (
      !actorIsFullAdmin &&
      (roleVal === 'admin' || roleVal === 'organisation' || roleVal === 'superuser' || roleVal === 'super_admin')
    ) {
      return safeJson(
        { error: 'Your role can invite teachers and viewers for your organisation only.' },
        403,
      );
    }

    const displayName =
      (typeof display_name === 'string' && display_name.trim()) ||
      [first_name, last_name].filter(Boolean).join(' ').trim() ||
      null;

    const supabase = createServiceClient();
    if (!supabase) {
      return safeJson(
        {
          error:
            'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is not set. Add it in Vercel Project Settings → Environment Variables.',
        },
        500,
      );
    }

    // Scope org-admin invites to their organisation (and first hub they administer).
    let scopedOrganisationId =
      typeof organisation_id === 'string' ? organisation_id.trim() || null : null;
    let scopedOrganisationName =
      typeof organisation_name === 'string' ? organisation_name.trim() || null : null;
    if (!actorIsFullAdmin) {
      const actorOrg = admin.profile?.organisation_id || null;
      const { data: hubAdminRows } = await supabase
        .from('hub_memberships')
        .select('organisation_id')
        .eq('user_id', admin.userId)
        .eq('role', 'hub_administrator')
        .limit(5);
      const hubOrgIds = (hubAdminRows || [])
        .map((r) => r.organisation_id)
        .filter(Boolean);
      const allowedOrgs = new Set([actorOrg, ...hubOrgIds].filter(Boolean));
      if (allowedOrgs.size === 0) {
        return safeJson(
          { error: 'Your account is not linked to an organisation. Ask a super admin to assign one.' },
          403,
        );
      }
      if (scopedOrganisationId && !allowedOrgs.has(scopedOrganisationId)) {
        return safeJson({ error: 'You can only invite users to your own organisation.' }, 403);
      }
      if (!scopedOrganisationId) {
        scopedOrganisationId = actorOrg || hubOrgIds[0];
      }
      if (!scopedOrganisationName) {
        scopedOrganisationName =
          admin.profile?.organisation_name ||
          admin.profile?.school_or_org ||
          null;
      }
    }

    const { data: existingProfiles, error: existingErr } = await supabase
      .from('profiles')
      .select('id, email, status, role')
      .ilike('email', emailTrimmed)
      .limit(5);
    if (existingErr) {
      return safeJson({ error: existingErr.message }, 400);
    }
    const duplicate = (existingProfiles || []).find(
      (row) => String(row.email || '').trim().toLowerCase() === emailTrimmed,
    );
    if (duplicate) {
      return safeJson(
        {
          error: 'A user with this email already exists.',
          code: 'email_exists',
        },
        409,
      );
    }

    const redirectTo = inviteRedirectUrl(request);
    const timestamps = inviteTimestamps();
    const perms = defaultPermissionsForRole(roleVal);

    let user = null;
    let emailSent = false;
    let emailWarning = null;

    const generated = await generateAuthLink(supabase, {
      type: 'invite',
      email: emailTrimmed,
      redirectTo,
      data: { display_name: displayName, role: roleVal },
    });
    if (generated.error) {
      if (isAlreadyRegisteredError(generated.error)) {
        return safeJson(
          {
            error: 'A user with this email already exists.',
            code: 'email_exists',
          },
          409,
        );
      }
      return safeJson({ error: generated.error.message }, 400);
    }
    user = generated.user;

    if (process.env.RESEND_API_KEY && generated.actionLink) {
      const mail = activateAccountEmail({
        displayName,
        activateUrl: generated.actionLink,
      });
      const sent = await sendResendEmail({ to: emailTrimmed, ...mail });
      emailSent = sent.sent === true;
      if (!emailSent) {
        emailWarning =
          sent.error ||
          sent.skipped ||
          'The account was created but the invitation email could not be sent. Use Resend invite.';
      }
    } else {
      const { error: smtpError } = await supabase.auth.resetPasswordForEmail(emailTrimmed, {
        redirectTo,
      });
      if (smtpError) {
        emailWarning =
          smtpError.message ||
          'The account was created but the invitation email could not be sent. Use Resend invite.';
      } else {
        emailSent = true;
      }
    }

    if (!user?.id) {
      return safeJson({ error: 'User could not be created.' }, 500);
    }

    const profileRow = {
      id: user.id,
      email: user.email ?? emailTrimmed,
      display_name: displayName,
      first_name: typeof first_name === 'string' ? first_name.trim() || null : null,
      last_name: typeof last_name === 'string' ? last_name.trim() || null : null,
      school_or_org: typeof school_or_org === 'string' ? school_or_org.trim() || null : null,
      role: roleVal,
      status: 'invited',
      must_change_password: true,
      ...perms,
      organisation_id: scopedOrganisationId,
      organisation_name: scopedOrganisationName,
      marketing_consent: marketing_consent === true,
      marketing_consent_at: marketing_consent === true ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
      ...timestamps,
      ...(Array.isArray(allowed_year_groups) &&
        allowed_year_groups.length > 0 && { allowed_year_groups }),
      ...(Array.isArray(admin_preset_categories) &&
        admin_preset_categories.length > 0 && { admin_preset_categories }),
      ...(Array.isArray(admin_preset_activity_pack_ids) &&
        admin_preset_activity_pack_ids.length > 0 && {
          admin_preset_activity_pack_ids,
        }),
    };

    const profileError = await upsertProfileRow(supabase, profileRow);
    if (profileError) {
      console.warn('Profile upsert warning:', profileError.message);
    }

    const ipHash = await hashIpForStorage(ip);
    await writeAuditLog({
      actorId: admin.userId,
      action: 'user.invite',
      targetType: 'profile',
      targetId: user.id,
      meta: {
        email: emailTrimmed,
        role: roleVal,
        status: 'invited',
        email_sent: emailSent,
      },
      ipHash,
    });

    const responseBody = {
      success: true,
      invited: true,
      emailSent,
      invitation_status: 'pending',
      user: {
        id: user.id,
        email: user.email ?? emailTrimmed,
        display_name: displayName,
        role: roleVal,
        status: 'invited',
      },
    };
    if (emailWarning) responseBody.warning = emailWarning;
    return safeJson(responseBody, 201);
  } catch (e) {
    console.error('create-user error:', e);
    return safeJson(
      { error: e instanceof Error ? e.message : 'Failed to create user' },
      500,
    );
  }
}
