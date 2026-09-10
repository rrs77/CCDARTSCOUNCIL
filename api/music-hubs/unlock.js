/**
 * POST /api/music-hubs/unlock
 * Body: { organisationId, password }
 * Returns session token. Never echoes password. Never logs password.
 */

import {
  demoPasswordOk,
  jsonResponse,
  loadHashMap,
  mintToken,
  optionsResponse,
  signingSecret,
  verifyPassword,
} from '../_musicHubUnlock.js';

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request) {
  try {
    if (!signingSecret()) {
      return jsonResponse(
        {
          error:
            'Unlock service not configured. Set MUSIC_HUB_UNLOCK_SECRET (or SUPABASE_JWT_SECRET) and MUSIC_HUB_SUBSCRIBER_HASHES.',
        },
        503,
      );
    }

    const body = await request.json().catch(() => null);
    const organisationId =
      typeof body?.organisationId === 'string' ? body.organisationId.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!organisationId || !password) {
      return jsonResponse({ error: 'organisationId and password are required.' }, 400);
    }

    const hashes = loadHashMap();
    const stored = hashes[organisationId];
    const ok =
      (stored && verifyPassword(password, stored)) ||
      demoPasswordOk(organisationId, password);

    if (!ok) {
      return jsonResponse({ error: 'Incorrect password.' }, 401);
    }

    const minted = mintToken(organisationId);
    if (!minted) {
      return jsonResponse({ error: 'Could not issue unlock token.' }, 503);
    }

    return jsonResponse({
      organisationId,
      token: minted.token,
      expiresAt: minted.expiresAt,
    });
  } catch {
    return jsonResponse({ error: 'Unlock failed.' }, 500);
  }
}
