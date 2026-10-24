/**
 * POST /api/files/upload-complete
 * After a successful direct DreamHost upload, consume the single-use intent
 * and register the stored_files row (visibility from the minted intent).
 * Does not trust the client for path or visibility.
 */

import {
  assertRateLimit,
  getClientIp,
  jsonResponse,
  optionsResponse,
  requireAuth,
} from '../../../api/_authShared.js';
import {
  buildProxyFileUrl,
  dreamHostNotConfiguredResponse,
  isDreamHostConfigured,
  probeDreamHostPdf,
  registerStoredFile,
} from '../../../api/_dreamhost.js';
import {
  consumeDirectUploadIntent,
  verifyUploadToken,
} from '../../../api/_uploadToken.js';

export async function OPTIONS(request) {
  return optionsResponse(request);
}

export async function POST(request) {
  try {
    const ip = getClientIp(request) || 'unknown';
    const limited = assertRateLimit(`dh-upload-complete:${ip}`, {
      limit: 30,
      windowMs: 60_000,
    });
    if (!limited.ok) return limited.response;

    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    if (!isDreamHostConfigured()) {
      return dreamHostNotConfiguredResponse();
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body.' }, 400);
    }

    const token = typeof body?.token === 'string' ? body.token : '';
    const claims = verifyUploadToken(token);
    if (!claims) {
      return jsonResponse({ error: 'Invalid upload token.' }, 401);
    }
    if (claims.userId !== auth.userId) {
      return jsonResponse({ error: 'Upload token does not match the signed-in user.' }, 403);
    }
    if (claims.exp < Math.floor(Date.now() / 1000)) {
      return jsonResponse({ error: 'Upload token expired.' }, 401);
    }

    // Single-use: consume nonce before registering.
    const intent = await consumeDirectUploadIntent({
      nonce: claims.nonce,
      userId: auth.userId,
      path: claims.path,
    });
    if (!intent) {
      return jsonResponse(
        { error: 'Upload intent missing, expired, or already used.' },
        409,
      );
    }

    // Confirm object exists, starts with %PDF-, and respects the token max size.
    try {
      await probeDreamHostPdf(claims.path, claims.maxBytes);
    } catch (e) {
      const status = e?.status && Number.isFinite(e.status) ? e.status : 502;
      const msg =
        status === 404
          ? 'File not found on storage.'
          : status === 400
            ? 'Uploaded file is not a PDF.'
            : status === 413
              ? 'Uploaded file is too large.'
              : 'Could not verify upload.';
      return jsonResponse({ error: msg }, status === 404 || status === 400 || status === 413 ? status : 502);
    }

    await registerStoredFile({
      storagePath: claims.path,
      ownerId: auth.userId,
      visibility: intent.visibility || claims.visibility,
      isPurchasedResource: false,
    });

    return jsonResponse({
      success: true,
      url: buildProxyFileUrl(request, claims.path),
      path: claims.path,
    });
  } catch (error) {
    console.error('files/upload-complete:', error instanceof Error ? error.message : error);
    return jsonResponse({ error: 'Upload confirmation failed.' }, 500);
  }
}
