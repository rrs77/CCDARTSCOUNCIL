/**
 * POST /api/upload-pdf
 * Authenticated upload of a PDF to DreamHost.
 * Path is always `<userId>/<uuid>.pdf` — never client-controlled.
 * Client contentType / fileName are ignored; bytes must start with %PDF-.
 * Returns an app proxy URL only (no public DreamHost link).
 *
 * Env (server-only): DREAMHOST_PDF_UPLOAD_URL, DREAMHOST_PDF_API_KEY,
 *   DREAMHOST_PDF_DOWNLOAD_URL (optional; derived from upload URL),
 *   aliases PDF_UPLOAD_URL / PDF_API_KEY / PDF_DOWNLOAD_URL.
 */

import {
  assertRateLimit,
  getClientIp,
  jsonResponse,
  optionsResponse,
  requireAuth,
} from './_authShared.js';
import {
  buildOwnedStoragePath,
  buildProxyFileUrl,
  dreamHostNotConfiguredResponse,
  FILE_VISIBILITY,
  isDreamHostConfigured,
  registerStoredFile,
  uploadToDreamHost,
} from './_dreamhost.js';

export const config = {
  maxDuration: 60,
};

const PDF_MAGIC = Buffer.from('%PDF-');

export async function OPTIONS() {
  return optionsResponse();
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

    // Ignore client contentType / fileName — require PDF magic bytes server-side.
    if (buffer.length < 5 || !buffer.subarray(0, 5).equals(PDF_MAGIC)) {
      return jsonResponse({ error: 'Not a PDF.' }, 400);
    }

    const storagePath = buildOwnedStoragePath(auth.userId);
    await uploadToDreamHost({ buffer, storagePath });

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
    console.error('upload-pdf:', error instanceof Error ? error.message : error);
    const status = error?.status && Number.isFinite(error.status) ? error.status : 500;
    return jsonResponse(
      { error: status === 413 ? 'File too large.' : 'Upload failed.' },
      status === 413 ? 413 : status >= 400 && status < 600 ? status : 500,
    );
  }
}
