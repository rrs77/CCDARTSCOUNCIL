/**
 * POST /api/users/anonymise
 * Admin-only: anonymise PII on a profile (UK GDPR erasure-style). Protects last admin.
 * Body: { user_id: string }
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
  ADMIN_ROLES,
} from '../_authShared.js';

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;

    const ip = getClientIp(request);
    const rl = assertRateLimit(`anonymise:${admin.userId}`, { limit: 10, windowMs: 60_000 });
    if (!rl.ok) return rl.response;

    const body = await request.json().catch(() => ({}));
    const userId = typeof body?.user_id === 'string' ? body.user_id.trim() : '';
    if (!userId) return jsonResponse({ error: 'user_id is required.' }, 400);
    if (userId === admin.userId) {
      return jsonResponse({ error: 'You cannot anonymise your own account.' }, 400);
    }

    const supabase = createServiceClient();
    if (!supabase) return jsonResponse({ error: 'Server configuration error.' }, 500);

    const { data: target, error: loadErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (loadErr) return jsonResponse({ error: loadErr.message }, 400);
    if (!target) return jsonResponse({ error: 'User not found.' }, 404);

    if (ADMIN_ROLES.has(target.role)) {
      const { count, error: countErr } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .in('role', ['admin', 'superuser'])
        .neq('status', 'suspended')
        .is('anonymised_at', null);
      if (countErr) return jsonResponse({ error: countErr.message }, 400);
      if ((count ?? 0) <= 1) {
        return jsonResponse(
          { error: 'Cannot anonymise the last active administrator.' },
          400,
        );
      }
    }

    const anonEmail = `anonymised-${userId.slice(0, 8)}@deleted.local`;
    const { error: updErr } = await supabase
      .from('profiles')
      .update({
        email: anonEmail,
        display_name: 'Anonymised user',
        first_name: null,
        last_name: null,
        school_or_org: null,
        status: 'suspended',
        marketing_consent: false,
        marketing_consent_at: null,
        anonymised_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    if (updErr) return jsonResponse({ error: updErr.message }, 400);

    // Ban / delete auth user email via admin API (best-effort)
    try {
      await supabase.auth.admin.updateUserById(userId, {
        email: anonEmail,
        ban_duration: '876000h',
        user_metadata: { anonymised: true },
      });
    } catch (e) {
      console.warn('auth anonymise warn:', e instanceof Error ? e.message : e);
    }

    const ipHash = await hashIpForStorage(ip);
    await writeAuditLog({
      actorId: admin.userId,
      action: 'user.anonymise',
      targetType: 'profile',
      targetId: userId,
      ipHash,
    });

    return jsonResponse({ success: true });
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : 'Anonymise failed' },
      500,
    );
  }
}
