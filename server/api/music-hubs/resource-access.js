/**
 * GET /api/music-hubs/resource-access?resourceId=
 * Authorization: Bearer <Supabase access token>
 *
 * Releases a resource location only after a server-side entitlement check.
 * Locked locations come from resource_private_locations (service role only),
 * so a copied URL or direct API call without a grant gets nothing.
 */

import {
  assertRateLimit,
  createServiceClient,
  isSuperAdminProfile,
  isSuspended,
  jsonResponse,
  loadProfile,
  optionsResponse,
  requireAuth,
} from '../../../api/_authShared.js';
import { decideResourceAccess } from '../../../api/_resourceAccess.js';

const SIGNED_URL_SECONDS = 300;

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const limited = assertRateLimit(`resource-access:${auth.userId}`, { limit: 60 });
    if (!limited.ok) return limited.response;

    const resourceId = new URL(request.url).searchParams.get('resourceId') || '';
    if (!resourceId) return jsonResponse({ error: 'resourceId is required.' }, 400);

    const profile = await loadProfile(auth.userId);
    if (!profile || isSuspended(profile)) {
      return jsonResponse({ error: 'Forbidden. Active account required.' }, 403);
    }

    const service = createServiceClient();
    if (!service) return jsonResponse({ error: 'Service unavailable.' }, 503);

    const { data: resource } = await service
      .from('resources')
      .select('id, title, status, is_active, access_level, organisation_id, download_url')
      .eq('id', resourceId)
      .maybeSingle();

    let hubRole = null;
    let grant = null;
    if (resource?.organisation_id) {
      const [{ data: membership }, { data: grantRow }] = await Promise.all([
        service
          .from('hub_memberships')
          .select('role')
          .eq('organisation_id', resource.organisation_id)
          .eq('user_id', auth.userId)
          .maybeSingle(),
        service
          .from('organisation_access_grants')
          .select('source, revoked_at, expires_at')
          .eq('organisation_id', resource.organisation_id)
          .eq('user_id', auth.userId)
          .maybeSingle(),
      ]);
      hubRole = membership?.role || null;
      grant = grantRow || null;
    }

    const decision = decideResourceAccess({
      resource,
      isSuperAdmin: isSuperAdminProfile(profile),
      hubRole,
      grant,
    });

    if (!decision.allowed) {
      const status = decision.reason === 'not_found' ? 404 : 403;
      return jsonResponse(
        {
          error: status === 404 ? 'Resource not found.' : 'This resource needs an organisation access code.',
          reason: decision.reason,
          organisationId: status === 404 ? undefined : resource.organisation_id,
        },
        status,
      );
    }

    const { data: location } = await service
      .from('resource_private_locations')
      .select('url, storage_bucket, storage_path')
      .eq('resource_id', resource.id)
      .maybeSingle();

    if (location?.storage_bucket && location?.storage_path) {
      const { data: signed, error } = await service.storage
        .from(location.storage_bucket)
        .createSignedUrl(location.storage_path, SIGNED_URL_SECONDS);
      if (error || !signed?.signedUrl) return jsonResponse({ error: 'Could not prepare file.' }, 500);
      return jsonResponse({ resourceId: resource.id, url: signed.signedUrl, expiresIn: SIGNED_URL_SECONDS });
    }

    return jsonResponse({ resourceId: resource.id, url: location?.url || resource.download_url });
  } catch (e) {
    console.error('resource-access failed:', e instanceof Error ? e.message : e);
    return jsonResponse({ error: 'Resource access failed.' }, 500);
  }
}
