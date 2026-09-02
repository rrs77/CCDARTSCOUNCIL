/**
 * Download analytics for admins / org / hub admins.
 * GET /api/downloads/analytics
 */

import {
  assertRateLimit,
  canViewGlobalAnalytics,
  canViewOrgAnalytics,
  createServiceClient,
  isSuperAdminProfile,
  isSuspended,
  jsonResponse,
  loadProfile,
  optionsResponse,
  requireAuth,
} from '../_authShared.js';
import { formatUkDateTime } from '../_downloadShared.js';
import { loadHubMembership, hasMinHubRole } from '../_hubShared.js';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const profile = await loadProfile(auth.userId);
    if (!profile || isSuspended(profile)) {
      return jsonResponse({ error: 'Forbidden.' }, 403);
    }

    const rl = assertRateLimit(`downloads-analytics:${auth.userId}`, {
      limit: 40,
      windowMs: 60_000,
    });
    if (!rl.ok) return rl.response;

    const service = createServiceClient();
    if (!service) return jsonResponse({ error: 'Server configuration error.' }, 500);

    const url = new URL(request.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const partnerSlug = url.searchParams.get('partner_slug');
    const days = Math.min(365, Math.max(1, Number(url.searchParams.get('days') || 30)));
    let organisationId = url.searchParams.get('organisation_id');

    const isGlobal = canViewGlobalAnalytics(profile) || isSuperAdminProfile(profile);
    let scope = 'denied';

    if (isGlobal) {
      scope = 'global';
    } else if (canViewOrgAnalytics(profile) && profile.organisation_id) {
      scope = 'organisation';
      organisationId = profile.organisation_id;
    } else if (organisationId || partnerSlug) {
      const orgKey = organisationId || partnerSlug;
      const membership = await loadHubMembership(orgKey, auth.userId);
      if (membership && hasMinHubRole(membership.role, 'hub_administrator')) {
        scope = 'hub';
        organisationId = orgKey;
      }
    }

    if (scope === 'denied') {
      return jsonResponse({ error: 'Forbidden. Analytics access required.' }, 403);
    }

    const since =
      from || new Date(Date.now() - days * 86400000).toISOString();

    let q = service
      .from('download_events')
      .select(
        'id, resource_id, user_id, organisation_id, partner_slug, geo_country, geo_region, geo_city, created_at, resources(title)',
      )
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(2000);

    if (to) q = q.lte('created_at', to);
    if (partnerSlug) q = q.eq('partner_slug', partnerSlug);
    if (organisationId && scope !== 'global') q = q.eq('organisation_id', organisationId);
    else if (organisationId && scope === 'global' && organisationId) {
      q = q.eq('organisation_id', organisationId);
    }

    const { data, error } = await q;
    if (error) return jsonResponse({ error: error.message }, 400);

    const timezone = 'Europe/London';
    const byResource = {};
    const byCountry = {};
    const byDay = {};
    const events = (data || []).map((row) => {
      byResource[row.resource_id] = (byResource[row.resource_id] || 0) + 1;
      const country = row.geo_country || 'Unknown';
      byCountry[country] = (byCountry[country] || 0) + 1;
      const day = String(row.created_at || '').slice(0, 10);
      if (day) byDay[day] = (byDay[day] || 0) + 1;
      return {
        id: row.id,
        resource_id: row.resource_id,
        resource_title: row.resources?.title || row.resource_id,
        user_id: row.user_id,
        partner_slug: row.partner_slug,
        geo_country: row.geo_country,
        created_at: row.created_at,
        created_at_uk: formatUkDateTime(row.created_at, timezone),
      };
    });

    return jsonResponse({
      total: events.length,
      timezone,
      scope,
      organisation_id: organisationId || null,
      days,
      summary: { byResource, byCountry, byDay },
      events,
    });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: 'Analytics failed.' }, 500);
  }
}
