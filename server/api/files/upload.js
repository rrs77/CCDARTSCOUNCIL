/**
 * POST /api/upload-pdf  (also /api/files/upload)
 * Authenticated upload of a small PDF to DreamHost via Vercel JSON (base64).
 * Honest cap: 3 MB (Vercel request body limit ~4.5 MB). Larger files must use
 * POST /api/files/upload-token → direct DreamHost → /api/files/upload-complete.
 * Path is always `<userId>/<uuid>.pdf` — never client-controlled.
 */

import {
  assertRateLimit,
  getClientIp,
  jsonResponse,
  optionsResponse,
  requireAuth,
} from '../../../api/_authShared.js';
import {
  buildOwnedStoragePath,
  buildProxyFileUrl,
  dreamHostNotConfiguredResponse,
  FILE_VISIBILITY,
  isDreamHostConfigured,
  registerStoredFile,
  uploadToDreamHost,
} from '../../../api/_dreamhost.js';
import {
  estimateBase64DecodedBytes,
  MAX_DIRECT_UPLOAD_BYTES,
  MAX_VERCEL_BODY_UPLOAD_BYTES,
  VERCEL_JSON_CONTENT_LENGTH_LIMIT,
} from '../../../api/_uploadToken.js';

const PDF_MAGIC = Buffer.from('%PDF-');

export async function OPTIONS(request) {
  return optionsResponse(request);
}

export async function POST(request) {
  try {
    const ip = getClientIp(request) || 'unknown';
    const limited = assertRateLimit(`dh-upload:${ip}`, { limit: 20, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    if (!isDreamHostConfigured()) {
      return dreamHostNotConfiguredResponse();
    }

    // Content-Length pre-check before buffering / request.json() (413 early).
    const clRaw = request.headers.get('content-length');
    if (clRaw != null && clRaw !== '') {
      const cl = Number(clRaw);
      if (Number.isFinite(cl) && cl > VERCEL_JSON_CONTENT_LENGTH_LIMIT) {
        return jsonResponse(
          {
            error: `File too large for this upload route (max ${MAX_VERCEL_BODY_UPLOAD_BYTES / (1024 * 1024)} MB). Use direct upload for files up to ${MAX_DIRECT_UPLOAD_BYTES / (1024 * 1024)} MB.`,
            code: 'USE_DIRECT_UPLOAD',
            maxVercelBytes: MAX_VERCEL_BODY_UPLOAD_BYTES,
            maxDirectBytes: MAX_DIRECT_UPLOAD_BYTES,
          },
          413,
        );
      }
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body.' }, 400);
    }

    const fileData = body?.fileData;
    if (typeof fileData !== 'string' || !fileData) {
      return jsonResponse({ error: 'Missing fileData.' }, 400);
    }

    // Reject oversized base64 before decode (avoids allocating a huge Buffer).
    const estimated = estimateBase64DecodedBytes(fileData);
    if (estimated > MAX_VERCEL_BODY_UPLOAD_BYTES || fileData.length > VERCEL_JSON_CONTENT_LENGTH_LIMIT) {
      return jsonResponse(
        {
          error: `File too large for this upload route (max ${MAX_VERCEL_BODY_UPLOAD_BYTES / (1024 * 1024)} MB). Use direct upload for files up to ${MAX_DIRECT_UPLOAD_BYTES / (1024 * 1024)} MB.`,
          code: 'USE_DIRECT_UPLOAD',
          maxVercelBytes: MAX_VERCEL_BODY_UPLOAD_BYTES,
          maxDirectBytes: MAX_DIRECT_UPLOAD_BYTES,
        },
        413,
      );
    }

    let buffer;
    try {
      buffer = Buffer.from(fileData, 'base64');
    } catch {
      return jsonResponse({ error: 'Invalid base64 fileData.' }, 400);
    }

    if (!buffer.byteLength) {
      return jsonResponse({ error: 'Empty file.' }, 400);
    }

    if (buffer.byteLength > MAX_VERCEL_BODY_UPLOAD_BYTES) {
      return jsonResponse(
        {
          error: `File too large for this upload route (max ${MAX_VERCEL_BODY_UPLOAD_BYTES / (1024 * 1024)} MB). Use direct upload for files up to ${MAX_DIRECT_UPLOAD_BYTES / (1024 * 1024)} MB.`,
          code: 'USE_DIRECT_UPLOAD',
          maxVercelBytes: MAX_VERCEL_BODY_UPLOAD_BYTES,
          maxDirectBytes: MAX_DIRECT_UPLOAD_BYTES,
        },
        413,
      );
    }

    // Ignore client contentType — require PDF magic bytes server-side.
    if (buffer.length < 5 || !buffer.subarray(0, 5).equals(PDF_MAGIC)) {
      return jsonResponse({ error: 'Not a PDF.' }, 400);
    }

    const storagePath = buildOwnedStoragePath(auth.userId);
    await uploadToDreamHost({ buffer, storagePath });

    // Default visibility = org. Purchased/licensed rows are service-role only.
    await registerStoredFile({
      storagePath,
      ownerId: auth.userId,
      visibility: FILE_VISIBILITY.ORG,
      isPurchasedResource: false,
    });

    const url = buildProxyFileUrl(request, storagePath);
    return jsonResponse({
      success: true,
      url,
      path: storagePath,
    });
  } catch (error) {
    console.error('files/upload:', error instanceof Error ? error.message : error);
    const status = error?.status && Number.isFinite(error.status) ? error.status : 500;
    return jsonResponse(
      { error: status === 413 ? 'File too large.' : 'Upload failed.' },
      status === 413 ? 413 : status >= 400 && status < 600 ? status : 500,
    );
  }
}
