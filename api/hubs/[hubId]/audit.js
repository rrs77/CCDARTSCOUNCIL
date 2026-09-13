/**
 * Hub audit trail.
 * GET /api/hubs/:hubId/audit
 */

import {
  createServiceClient,
  jsonResponse,
  optionsResponse,
} from '../../_authShared.js';
import { requireHubAccess } from '../../_hubShared.js';

export async function OPTIONS() {
  return optionsResponse();
}

function hubIdFrom(request, context) {
  const parts = new URL(request.url).pathname.split('/').filter(Boolean);
  const hubsIdx = parts.indexOf('hubs');
  return context?.params?.hubId || parts[hubsIdx + 1];
}

export async function GET(request, context) {
  const hubId = hubIdFrom(request, context);
  const access = await requireHubAccess(request, {
    hubId,
    minRole: 'hub_administrator',
  });
  if (!access.ok) return access.response;

  const service = createServiceClient();
  const { data, error } = await service
    .from('audit_log')
    .select('id, actor_id, action, target_type, target_id, meta, created_at')
    .eq('organisation_id', access.organisation.id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ events: data || [] });
}
