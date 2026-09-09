/**
 * POST /api/register
 * Public self-registration with required fields + privacy / marketing consent.
 * Creates Supabase user (email confirmation preferred) and profile row.
 *
 * Env: SUPABASE_SERVICE_ROLE_KEY, optional RESEND_API_KEY
 */

import {
  assertRateLimit,
  createServiceClient,
  getAppOrigin,
  getClientIp,
  hashIpForStorage,
  jsonResponse,
  optionsResponse,
  writeAuditLog,
} from './_authShared.js';
import { verifyEmailTemplate, sendResendEmail } from './_emailTemplates.js';

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const rl = assertRateLimit(`register:${ip || 'x'}`, { limit: 8, windowMs: 60_000 });
    if (!rl.ok) return rl.response;

    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const firstName = typeof body.first_name === 'string' ? body.first_name.trim() : '';
    const lastName = typeof body.last_name === 'string' ? body.last_name.trim() : '';
    const schoolOrOrg =
      typeof body.school_or_org === 'string' ? body.school_or_org.trim() : '';
    const displayName =
      (typeof body.display_name === 'string' && body.display_name.trim()) ||
      [firstName, lastName].filter(Boolean).join(' ');
    const privacyAccepted = body.privacy_accepted === true;
    const marketingConsent = body.marketing_consent === true;

    if (!email || !email.includes('@')) {
      return jsonResponse({ error: 'A valid email is required.' }, 400);
    }
    if (!password || password.length < 8) {
      return jsonResponse({ error: 'Password must be at least 8 characters.' }, 400);
    }
    if (!firstName || !lastName) {
      return jsonResponse({ error: 'First name and last name are required.' }, 400);
    }
    if (!schoolOrOrg) {
      return jsonResponse({ error: 'School or organisation is required.' }, 400);
    }
    if (!privacyAccepted) {
      return jsonResponse(
        { error: 'You must accept the privacy notice to create an account.' },
        400,
      );
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return jsonResponse(
        {
          error:
            'Registration is temporarily unavailable (server configuration). Please try again later.',
        },
        503,
      );
    }

    const origin = getAppOrigin(request);
    const redirectTo = origin ? `${origin}/` : undefined;

    // Prefer email confirmation: create with email_confirm false when supported
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        display_name: displayName,
        first_name: firstName,
        last_name: lastName,
        role: 'teacher',
      },
    });
    if (error) {
      const msg = error.message || '';
      if (/already|registered|exists/i.test(msg)) {
        return jsonResponse({ error: 'An account with this email already exists.' }, 409);
      }
      return jsonResponse({ error: msg }, 400);
    }

    const user = data?.user;
    if (!user?.id) return jsonResponse({ error: 'Could not create account.' }, 500);

    const now = new Date().toISOString();
    await supabase.from('profiles').upsert(
      {
        id: user.id,
        email,
        display_name: displayName,
        first_name: firstName,
        last_name: lastName,
        school_or_org: schoolOrOrg,
        role: 'teacher',
        status: 'invited',
        can_edit_lessons: true,
        privacy_policy_accepted_at: now,
        marketing_consent: marketingConsent,
        marketing_consent_at: marketingConsent ? now : null,
        must_change_password: false,
        updated_at: now,
      },
      { onConflict: 'id' },
    );

    // Generate magic link / confirmation when possible
    try {
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email,
        password,
        options: { redirectTo },
      });
      const verifyUrl =
        linkData?.properties?.action_link ||
        linkData?.properties?.email_otp ||
        redirectTo;
      if (verifyUrl && typeof verifyUrl === 'string' && verifyUrl.startsWith('http')) {
        const mail = verifyEmailTemplate({ displayName, verifyUrl });
        await sendResendEmail({ to: email, ...mail });
      }
    } catch (e) {
      console.warn('verify link warn:', e instanceof Error ? e.message : e);
    }

    const ipHash = await hashIpForStorage(ip);
    await writeAuditLog({
      actorId: user.id,
      action: 'user.register',
      targetType: 'profile',
      targetId: user.id,
      meta: { email, marketing_consent: marketingConsent },
      ipHash,
    });

    return jsonResponse({
      success: true,
      message:
        'Account created. Please check your email to verify your address before signing in.',
      user_id: user.id,
      email_verification_preferred: true,
    });
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : 'Registration failed' },
      500,
    );
  }
}
