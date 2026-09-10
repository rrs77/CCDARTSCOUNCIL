/**
 * GET /api/music-hubs/resource?resourceId=&organisationId=
 * Authorization: Bearer <unlock-token>
 * Returns protected URL only after org unlock. Never expose before auth.
 */

import {
  PROTECTED_RESOURCES,
  jsonResponse,
  optionsResponse,
  verifyToken,
} from '../_musicHubUnlock.js';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const resourceId = url.searchParams.get('resourceId') || '';
    const organisationId = url.searchParams.get('organisationId') || '';
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';

    if (!resourceId || !organisationId || !token) {
      return jsonResponse({ error: 'resourceId, organisationId and Bearer token required.' }, 400);
    }

    if (!verifyToken(token, organisationId)) {
      return jsonResponse({ error: 'Unlock required or expired.' }, 401);
    }

    const resource = PROTECTED_RESOURCES[resourceId];
    if (!resource || resource.organisationId !== organisationId) {
      return jsonResponse({ error: 'Resource not found.' }, 404);
    }

    return jsonResponse({ url: resource.url, resourceId });
  } catch {
    return jsonResponse({ error: 'Resource lookup failed.' }, 500);
  }
}
