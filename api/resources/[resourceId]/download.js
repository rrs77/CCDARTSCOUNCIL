/**
 * Tracked resource download: auth → permission → log → redirect to external URL.
 * GET /api/resources/:resourceId/download
 * Auth via Authorization Bearer or ?access_token= (for window.location redirects).
 */

import {
  assertRateLimit,
  createServiceClient,
  getClientIp,
  hashIpForStorage,
  jsonResponse,
  loadProfile,
  optionsResponse,
  requireAuth,
} from '../../_authShared.js';
import {
  getResourceById,
  isAllowListedUrl,
  lookupGeo,
  redirectResponse,
  userMayDownload,
} from '../../_downloadShared.js';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request, context) {
  try {
    const resourceId =
      context?.params?.resourceId ||
      new URL(request.url).pathname.split('/').filter(Boolean).slice(-2)[0];

    if (!resourceId) {
      return jsonResponse({ error: 'Resource id required.' }, 400);
    }

    const ip = getClientIp(request) || 'unknown';
    const limited = assertRateLimit(`dl:${ip}:${resourceId}`, { limit: 60, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const profile = await loadProfile(auth.userId);
    if (!profile) {
      return jsonResponse({ error: 'Profile required.' }, 403);
    }

    const resource = await getResourceById(resourceId);
    if (!resource) {
      return jsonResponse({ error: 'Resource not found.' }, 404);
    }

    const status = resource.status || (resource.is_active === false ? 'unpublished' : 'published');
    if (status !== 'published') {
      return jsonResponse({ error: 'Resource is not available for download.' }, 404);
    }

    if (!userMayDownload(profile, resource)) {
      return jsonResponse({ error: 'Forbidden. You cannot download this resource.' }, 403);
    }

    const target = resource.download_url || resource.external_url;
    if (!target) {
      return jsonResponse({ error: 'Download URL missing.' }, 400);
    }

    if (!isAllowListedUrl(target)) {
      try {
        const u = new URL(target);
        if (u.protocol !== 'https:') {
          return jsonResponse({ error: 'Download target is not an allowed HTTPS URL.' }, 400);
        }
      } catch {
        return jsonResponse({ error: 'Invalid download URL.' }, 400);
      }
      if (!resource.organisation_id && !resource.partner_slug) {
        return jsonResponse({ error: 'Download host is not allow-listed.' }, 400);
      }
    }

    const ipHash = await hashIpForStorage(ip);
    const geo = await lookupGeo(ip);
    const service = createServiceClient();
    const organisationId =
      resource.organisation_id || resource.partner_slug || profile.organisation_id || null;

    if (service) {
      service
        .from('download_events')
        .insert({
          resource_id: resource.id,
          organisation_id: organisationId,
          partner_slug: resource.partner_slug || null,
          user_id: auth.userId,
          ip_hash: ipHash,
          user_agent: (request.headers.get('user-agent') || '').slice(0, 500),
          geo_country: geo?.country || null,
          geo_region: geo?.region || null,
          geo_city: geo?.city || null,
        })
        .then(({ error }) => {
          if (error) console.warn('download_events insert:', error.message);
        });
    }

    return redirectResponse(target);
  } catch (e) {
    console.error('download error:', e);
    return jsonResponse({ error: 'Download failed.' }, 500);
  }
}
