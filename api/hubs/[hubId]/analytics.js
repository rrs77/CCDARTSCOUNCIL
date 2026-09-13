/**
 * Org-scoped download analytics (no raw IP unless can_view_raw_ip + super).
 * GET /api/hubs/:hubId/analytics
 */

import {
  canViewRawIp,
  createServiceClient,
  isSuperAdminProfile,
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
  try {
    const hubId = hubIdFrom(request, context);
    const access = await requireHubAccess(request, {
      hubId,
      minRole: 'hub_administrator',
    });
    if (!access.ok) return access.response;

    const service = createServiceClient();
    const url = new URL(request.url);
    const days = Math.min(365, Math.max(1, Number(url.searchParams.get('days') || 30)));
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const { data, error } = await service
      .from('download_events')
      .select(
        'id, resource_id, user_id, country, region, city, created_at, ip_hash, geo_country, geo_region, geo_city',
      )
      .eq('organisation_id', access.organisation.id)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(2000);

    if (error) return jsonResponse({ error: error.message }, 500);

    const includeRawIpMeta =
      isSuperAdminProfile(access.profile) && canViewRawIp(access.profile);

    const events = (data || []).map((e) => ({
      id: e.id,
      resource_id: e.resource_id,
      user_id: e.user_id,
      country: e.geo_country || e.country,
      region: e.geo_region || e.region,
      city: e.geo_city || e.city,
      created_at: e.created_at,
      ip_hash: includeRawIpMeta ? e.ip_hash : undefined,
    }));

    const byResource = {};
    for (const e of events) {
      byResource[e.resource_id] = (byResource[e.resource_id] || 0) + 1;
    }

    return jsonResponse({
      organisation_id: access.organisation.id,
      days,
      total: events.length,
      by_resource: byResource,
      events,
      raw_ip_included: false,
    });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: 'Analytics failed.' }, 500);
  }
}
