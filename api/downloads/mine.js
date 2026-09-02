/**
 * GET /api/downloads/mine
 * Authenticated user's download history (joined with resource title).
 */

import {
  assertRateLimit,
  createServiceClient,
  jsonResponse,
  optionsResponse,
  requireAuth,
} from '../_authShared.js';
import { formatUkDateTime } from '../_downloadShared.js';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const rl = assertRateLimit(`downloads-mine:${auth.userId}`, {
      limit: 40,
      windowMs: 60_000,
    });
    if (!rl.ok) return rl.response;

    const service = createServiceClient();
    if (!service) return jsonResponse({ error: 'Server configuration error.' }, 500);

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 200);

    const { data, error } = await service
      .from('download_events')
      .select(
        'id, resource_id, partner_slug, geo_country, geo_city, created_at, resources(id, title, resource_type, filename, collection_id)',
      )
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return jsonResponse({ error: error.message }, 400);

    const timezone = 'Europe/London';
    const events = (data || []).map((row) => ({
      id: row.id,
      resource_id: row.resource_id,
      partner_slug: row.partner_slug,
      geo_country: row.geo_country,
      geo_city: row.geo_city,
      created_at: row.created_at,
      created_at_uk: formatUkDateTime(row.created_at, timezone),
      resource: row.resources || null,
    }));

    return jsonResponse({ events, timezone });
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : 'Failed to load downloads' },
      500,
    );
  }
}
