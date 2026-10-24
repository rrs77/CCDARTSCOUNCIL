/**
 * POST /api/music-hubs/redeem-code
 * Authorization: Bearer <Supabase access token>
 * Body: { organisationId, code }
 *
 * Grants the signed-in teacher access to an organisation's access-code
 * resources. Codes are stored hashed; the plaintext is never logged.
 */

import {
  assertRateLimit,
  createServiceClient,
  isSuspended,
  jsonResponse,
  loadProfile,
  optionsResponse,
  requireAuth,
  writeAuditLog,
} from '../../../api/_authShared.js';
import { codeIsRedeemable, normaliseAccessCode, verifyAccessCode } from '../../../api/_resourceAccess.js';

export async function OPTIONS(request) {
  return optionsResponse(request);
}

export async function POST(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const limited = assertRateLimit(`redeem-code:${auth.userId}`, { limit: 8 });
    if (!limited.ok) return limited.response;

    const body = await request.json().catch(() => null);
    const organisationId = typeof body?.organisationId === 'string' ? body.organisationId.trim() : '';
    const code = normaliseAccessCode(body?.code);
    if (!organisationId || code.length < 6) {
      return jsonResponse({ error: 'Enter the access code your organisation gave you.' }, 400);
    }

    const profile = await loadProfile(auth.userId);
    if (!profile || isSuspended(profile)) {
      return jsonResponse({ error: 'Forbidden. Active account required.' }, 403);
    }

    const service = createServiceClient();
    if (!service) return jsonResponse({ error: 'Service unavailable.' }, 503);

    const { data: codes } = await service
      .from('organisation_access_codes')
      .select('id, code_hash, active, expires_at, max_redemptions, redemption_count, grant_days')
      .eq('organisation_id', organisationId)
      .eq('active', true);

    const match = (codes || []).find((row) => codeIsRedeemable(row) && verifyAccessCode(code, row.code_hash));
    if (!match) {
      return jsonResponse({ error: 'That code was not recognised or has expired.' }, 403);
    }

    const expiresAt = Number.isInteger(match.grant_days)
      ? new Date(Date.now() + match.grant_days * 86400000).toISOString()
      : null;

    const { error: grantError } = await service.from('organisation_access_grants').upsert(
      {
        organisation_id: organisationId,
        user_id: auth.userId,
        source: 'access_code',
        code_id: match.id,
        granted_at: new Date().toISOString(),
        expires_at: expiresAt,
        revoked_at: null,
      },
      { onConflict: 'organisation_id,user_id' },
    );
    if (grantError) return jsonResponse({ error: 'Could not record access.' }, 500);

    await service
      .from('organisation_access_codes')
      .update({ redemption_count: (match.redemption_count || 0) + 1, updated_at: new Date().toISOString() })
      .eq('id', match.id);

    await writeAuditLog({
      actorId: auth.userId,
      action: 'organisation_access_code_redeemed',
      targetType: 'organisation_access_code',
      targetId: match.id,
      organisationId,
    });

    return jsonResponse({ organisationId, expiresAt });
  } catch (e) {
    console.error('redeem-code failed:', e instanceof Error ? e.message : e);
    return jsonResponse({ error: 'Could not redeem code.' }, 500);
  }
}
