/**
 * Organisation access codes (hub administrators only).
 * GET  /api/music-hubs/access-codes?organisationId=   list (never returns hashes)
 * POST /api/music-hubs/access-codes                   { organisationId, label?, expiresAt?, maxRedemptions?, grantDays? }
 *      → returns the plaintext code ONCE; only its hash is stored.
 * PATCH /api/music-hubs/access-codes                  { organisationId, id, active } (deactivate / reactivate)
 */

import { createServiceClient, jsonResponse, optionsResponse } from '../../../api/_authShared.js';
import { auditHubAction, requireHubAccess } from '../../../api/_hubShared.js';
import { generateAccessCode, hashAccessCode } from '../../../api/_resourceAccess.js';

const PUBLIC_COLUMNS =
  'id, organisation_id, label, active, expires_at, max_redemptions, redemption_count, grant_days, created_at';

export async function OPTIONS(request) {
  return optionsResponse(request);
}

const positiveIntOrNull = (v) => (Number.isInteger(v) && v > 0 ? v : null);

export async function GET(request) {
  const organisationId = new URL(request.url).searchParams.get('organisationId') || '';
  const access = await requireHubAccess(request, { hubId: organisationId, minRole: 'hub_administrator' });
  if (!access.ok) return access.response;

  const { data, error } = await createServiceClient()
    .from('organisation_access_codes')
    .select(PUBLIC_COLUMNS)
    .eq('organisation_id', access.organisation.id)
    .order('created_at', { ascending: false });
  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ codes: data || [] });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const access = await requireHubAccess(request, {
    hubId: typeof body?.organisationId === 'string' ? body.organisationId : '',
    minRole: 'hub_administrator',
  });
  if (!access.ok) return access.response;

  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  if (expiresAt && (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now())) {
    return jsonResponse({ error: 'Expiry must be a future date.' }, 400);
  }

  const code = generateAccessCode();
  const { data, error } = await createServiceClient()
    .from('organisation_access_codes')
    .insert({
      organisation_id: access.organisation.id,
      label: typeof body.label === 'string' && body.label.trim() ? body.label.trim().slice(0, 80) : 'Access code',
      code_hash: hashAccessCode(code),
      expires_at: expiresAt ? expiresAt.toISOString() : null,
      max_redemptions: positiveIntOrNull(body.maxRedemptions),
      grant_days: positiveIntOrNull(body.grantDays),
      created_by: access.userId,
    })
    .select(PUBLIC_COLUMNS)
    .single();
  if (error) return jsonResponse({ error: error.message }, 500);

  await auditHubAction({
    actorId: access.userId,
    organisationId: access.organisation.id,
    action: 'organisation_access_code_created',
    targetType: 'organisation_access_code',
    targetId: data.id,
    meta: { label: data.label },
    request,
  });

  return jsonResponse({ code, record: data }, 201);
}

export async function PATCH(request) {
  const body = await request.json().catch(() => ({}));
  const access = await requireHubAccess(request, {
    hubId: typeof body?.organisationId === 'string' ? body.organisationId : '',
    minRole: 'hub_administrator',
  });
  if (!access.ok) return access.response;
  if (typeof body.id !== 'string' || typeof body.active !== 'boolean') {
    return jsonResponse({ error: 'id and active are required.' }, 400);
  }

  const { data, error } = await createServiceClient()
    .from('organisation_access_codes')
    .update({ active: body.active, updated_at: new Date().toISOString() })
    .eq('id', body.id)
    .eq('organisation_id', access.organisation.id)
    .select(PUBLIC_COLUMNS)
    .maybeSingle();
  if (error) return jsonResponse({ error: error.message }, 500);
  if (!data) return jsonResponse({ error: 'Code not found.' }, 404);

  await auditHubAction({
    actorId: access.userId,
    organisationId: access.organisation.id,
    action: body.active ? 'organisation_access_code_enabled' : 'organisation_access_code_disabled',
    targetType: 'organisation_access_code',
    targetId: data.id,
    request,
  });

  return jsonResponse({ record: data });
}
