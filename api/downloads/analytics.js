/**
 * System-wide download analytics (super_admin only).
 * GET /api/downloads/analytics
 */

import {
  canViewGlobalAnalytics,
  createServiceClient,
  isSuspended,
  jsonResponse,
  loadProfile,
  optionsResponse,
  requireAuth,
} from '../_authShared.js';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  const profile = await loadProfile(auth.userId);
  if (!profile || isSuspended(profile) || !canViewGlobalAnalytics(profile)) {
    return jsonResponse({ error: 'Forbidden. System analytics require super admin.' }, 403);
  }

  const service = createServiceClient();
  const url = new URL(request.url);
  const days = Math.min(365, Math.max(1, Number(url.searchParams.get('days') || 30)));
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data, error } = await service
    .from('download_events')
    .select('id, resource_id, organisation_id, country, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5000);

  if (error) return jsonResponse({ error: error.message }, 500);

  const byOrg = {};
  const byResource = {};
  for (const e of data || []) {
    byOrg[e.organisation_id] = (byOrg[e.organisation_id] || 0) + 1;
    byResource[e.resource_id] = (byResource[e.resource_id] || 0) + 1;
  }

  return jsonResponse({
    days,
    total: (data || []).length,
    by_organisation: byOrg,
    by_resource: byResource,
    events: data || [],
  });
}
