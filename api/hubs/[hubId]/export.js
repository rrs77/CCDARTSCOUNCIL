/**
 * CSV export of org-scoped download events.
 * GET /api/hubs/:hubId/export
 */

import {
  createServiceClient,
  optionsResponse,
} from '../../_authShared.js';
import { toCsv } from '../../_downloadShared.js';
import { corsHeaders } from '../../_authShared.js';
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
    const days = Math.min(365, Math.max(1, Number(url.searchParams.get('days') || 90)));
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const { data, error } = await service
      .from('download_events')
      .select('resource_id, user_id, country, region, city, created_at')
      .eq('organisation_id', access.organisation.id)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10000);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    const csv = toCsv(data || [], [
      { header: 'Resource ID', key: 'resource_id' },
      { header: 'User ID', key: 'user_id' },
      { header: 'Country', key: 'country' },
      { header: 'Region', key: 'region' },
      { header: 'City', key: 'city' },
      { header: 'Downloaded at', key: 'created_at' },
    ]);

    const filename = `${access.organisation.slug}-downloads-${days}d.csv`;
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
        ...corsHeaders(),
      },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Export failed.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
}
