/**
 * POST /api/resend-invite
 * Admin-only: send a fresh one-time setup/recovery link for a pending or expired invite.
 * Works for users who already exist in Auth (a second invite email cannot).
 */

import {
  assertRateLimit,
  createServiceClient,
  getClientIp,
  hashIpForStorage,
  jsonResponse,
  optionsResponse,
  requireAdmin,
  writeAuditLog,
} from './_authShared.js';
import { activateAccountEmail, sendResendEmail } from './_emailTemplates.js';
import {
  canResendInvitation,
  findProfileByEmail,
  generateAuthLink,
  invitationStatus,
  inviteRedirectUrl,
  inviteTimestamps,
  payloadContainsSecrets,
  updateInviteTimestamps,
} from './_inviteShared.js';

export async function OPTIONS() {
  return optionsResponse();
}

function safeJson(body, status) {
  if (payloadContainsSecrets(body)) {
    console.error('resend-invite refused to return secrets in JSON');
    return jsonResponse({ error: 'Internal server error.' }, 500);
  }
  return jsonResponse(body, status);
}

export async function POST(request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;

    const ip = getClientIp(request);
    const rl = assertRateLimit(`resend-invite:${admin.userId}:${ip || 'x'}`, {
      limit: 15,
      windowMs: 60_000,
    });
    if (!rl.ok) return rl.response;

    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email) return safeJson({ error: 'Email is required.' }, 400);

    const supabase = createServiceClient();
    if (!supabase) return safeJson({ error: 'Server configuration error.' }, 500);

    const profile = await findProfileByEmail(supabase, email);
    if (!profile) {
      return safeJson({ error: 'No user found with that email.' }, 404);
    }

    if (!canResendInvitation(profile)) {
      const status = invitationStatus(profile);
      if (status === 'complete') {
        return safeJson(
          {
            error: 'This user has already completed setup. Send a password reset instead.',
            invitation_status: status,
          },
          400,
        );
      }
      return safeJson(
        { error: 'Cannot resend an invitation for this user.', invitation_status: status },
        400,
      );
    }

    const redirectTo = inviteRedirectUrl(request);
    let emailSent = false;
    let warning = null;

    if (process.env.RESEND_API_KEY) {
      const generated = await generateAuthLink(supabase, {
        type: 'recovery',
        email,
        redirectTo,
      });
      if (generated.error) {
        return safeJson({ error: generated.error.message }, 400);
      }
      if (generated.actionLink) {
        const mail = activateAccountEmail({
          displayName: profile.display_name || null,
          activateUrl: generated.actionLink,
        });
        const sent = await sendResendEmail({ to: email, ...mail });
        emailSent = sent.sent === true;
        if (!emailSent) {
          warning =
            sent.error ||
            sent.skipped ||
            'Could not send the invitation email. Try again in a minute.';
        }
      } else {
        warning = 'Could not issue a new setup link.';
      }
    } else {
      const { error: recoverError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (recoverError) {
        warning = recoverError.message;
      } else {
        emailSent = true;
      }
    }

    const timestamps = inviteTimestamps();
    await updateInviteTimestamps(supabase, profile.id, timestamps);

    const ipHash = await hashIpForStorage(ip);
    await writeAuditLog({
      actorId: admin.userId,
      action: 'user.resend_invite',
      targetType: 'profile',
      targetId: profile.id,
      meta: { email, email_sent: emailSent },
      ipHash,
    });

    const responseBody = {
      success: true,
      emailSent,
      invitation_status: 'pending',
      message: emailSent
        ? 'Invite resent.'
        : 'A new setup link was created but the email may not have sent.',
    };
    if (warning) responseBody.warning = warning;
    return safeJson(responseBody);
  } catch (e) {
    return safeJson(
      { error: e instanceof Error ? e.message : 'Failed to resend invite' },
      500,
    );
  }
}
