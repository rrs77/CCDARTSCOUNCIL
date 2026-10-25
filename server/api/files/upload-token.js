/**
 * POST /api/files/upload-token
 * Mint a short-lived HMAC-signed direct-upload token bound to user, org,
 * server-generated path, max size, and a single-use nonce.
 */

import {
  assertRateLimit,
  getClientIp,
  jsonResponse,
  loadProfile,
  optionsResponse,
  requireAuth,
} from '../../../api/_authShared.js';
import { isDreamHostConfigured } from '../../../api/_dreamhost.js';
import {
  isUploadTokenConfigured,
  MAX_DIRECT_UPLOAD_BYTES,
  mintDirectUploadIntent,
} from '../../../api/_uploadToken.js';

export async function OPTIONS(request) {
  return optionsResponse(request);
}

export async function POST(request) {
  try {
    const ip = getClientIp(request) || 'unknown';
    const limited = assertRateLimit(`dh-upload-token:${ip}`, {
      limit: 30,
      windowMs: 60_000,
    });
    if (!limited.ok) return limited.response;

    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    if (!isDreamHostConfigured() || !isUploadTokenConfigured()) {
      return jsonResponse(
        {
          error:
            'Direct upload is not configured. Set DREAMHOST_UPLOAD_TOKEN_SECRET and DreamHost upload URL.',
        },
        503,
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body.' }, 400);
    }

    const byteLength = Number(body?.byteLength);
    if (!Number.isFinite(byteLength) || byteLength < 1) {
      return jsonResponse({ error: 'Missing or invalid byteLength.' }, 400);
    }
    if (byteLength > MAX_DIRECT_UPLOAD_BYTES) {
      return jsonResponse(
        {
          error: `File too large. Maximum upload size is ${MAX_DIRECT_UPLOAD_BYTES / (1024 * 1024)} MB.`,
        },
        413,
      );
    }

    const profile =
      auth.profile ||
      (await loadProfile(auth.userId).catch(() => null));
    const orgId =
      profile && typeof profile.organisation_id === 'string'
        ? profile.organisation_id.trim()
        : '';

    const intent = await mintDirectUploadIntent({
      userId: auth.userId,
      orgId,
      byteLength,
      visibility: body?.visibility,
    });

    return jsonResponse({
      success: true,
      token: intent.token,
      uploadUrl: intent.uploadUrl,
      path: intent.path,
      maxBytes: intent.maxBytes,
      expiresAt: intent.expiresAt,
    });
  } catch (error) {
    console.error('files/upload-token:', error instanceof Error ? error.message : error);
    const status = error?.status && Number.isFinite(error.status) ? error.status : 500;
    return jsonResponse(
      { error: status === 413 ? error.message : 'Could not mint upload token.' },
      status === 413 ? 413 : status >= 400 && status < 600 ? status : 500,
    );
  }
}
