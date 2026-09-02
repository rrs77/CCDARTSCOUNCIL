/**
 * POST /api/resend-invite
 * Admin-only: resend Supabase invite email for an existing invited user.
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
import { activateAccountEmail, sendResendEmail } from './_emailTemplates.js';

export async function OPTIONS() {
  return optionsResponse();
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
    if (!email) return jsonResponse({ error: 'Email is required.' }, 400);

    const supabase = createServiceClient();
    if (!supabase) return jsonResponse({ error: 'Server configuration error.' }, 500);

    const origin = getAppOrigin(request);
    const redirectTo = origin ? `${origin}/reset-password` : undefined;

    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {},
    });
    if (error) return jsonResponse({ error: error.message }, 400);

    const mail = activateAccountEmail({
      displayName: null,
      activateUrl: redirectTo || `${origin || ''}/reset-password`,
    });
    await sendResendEmail({ to: email, ...mail });

    const ipHash = await hashIpForStorage(ip);
    await writeAuditLog({
      actorId: admin.userId,
      action: 'user.resend_invite',
      targetType: 'email',
      targetId: email,
      ipHash,
    });

    return jsonResponse({ success: true, message: 'Invite resent.' });
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : 'Failed to resend invite' },
      500,
    );
  }
}
