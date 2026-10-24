/**
 * POST /api/upload-pdf  (also /api/files/upload)
 * Authenticated upload of a PDF (or other bytes) to DreamHost.
 * Path is always `<userId>/<uuid>.pdf` — never client-controlled.
 * Returns an app proxy URL only (no public DreamHost link).
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
  isDreamHostConfigured,
  uploadToDreamHost,
} from '../../../api/_dreamhost.js';

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

    let buffer;
    try {
      buffer = Buffer.from(fileData, 'base64');
    } catch {
      return jsonResponse({ error: 'Invalid base64 fileData.' }, 400);
    }

    if (!buffer.byteLength) {
      return jsonResponse({ error: 'Empty file.' }, 400);
    }

    const storagePath = buildOwnedStoragePath(auth.userId);
    const contentType =
      typeof body?.contentType === 'string' && body.contentType.startsWith('application/')
        ? body.contentType
        : 'application/pdf';

    await uploadToDreamHost({ buffer, storagePath, contentType });

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
