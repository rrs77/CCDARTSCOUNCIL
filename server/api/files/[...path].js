/**
 * GET /api/files/:userId/:uuid.pdf
 * Authenticated proxy for DreamHost-stored files.
 *
 * Decision 2 — signed-in users only (no anonymous / public share tokens).
 * Share links use the in-app `/shared/...` route, which fetches this proxy
 * with Authorization Bearer only (JWT never in the URL; no ?access_token=).
 * Query-token fallback remains solely on GET /api/resources/:id/download
 * for window.location tracked downloads that cannot set headers.
 * Then visibility checks (org / private / licensed).
 */

import {
  assertRateLimit,
  getClientIp,
  jsonResponse,
  optionsResponse,
  requireAuth,
  unauthenticatedFileShareResponse,
} from '../../../api/_authShared.js';
import {
  buildShareAppPath,
  fetchFromDreamHost,
  parseOwnedStoragePath,
  userMayAccessStoredFile,
} from '../../../api/_dreamhost.js';

export async function OPTIONS(request) {
  return optionsResponse(request);
}

function storagePathFromRequest(request, context) {
  const fromParams = context?.params?.path;
  if (Array.isArray(fromParams) && fromParams.length) {
    return parseOwnedStoragePath(fromParams.join('/'));
  }
  if (typeof fromParams === 'string' && fromParams) {
    return parseOwnedStoragePath(fromParams);
  }
  try {
    const pathname = new URL(request.url).pathname;
    const marker = '/api/files/';
    const idx = pathname.indexOf(marker);
    if (idx >= 0) {
      return parseOwnedStoragePath(pathname.slice(idx + marker.length));
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function GET(request, context) {
  try {
    const storagePath = storagePathFromRequest(request, context);
    if (!storagePath) {
      return jsonResponse({ error: 'Invalid file path.' }, 400);
    }

    const ip = getClientIp(request) || 'unknown';
    const limited = assertRateLimit(`dh-proxy:${ip}:${storagePath}`, {
      limit: 60,
      windowMs: 60_000,
    });
    if (!limited.ok) return limited.response;

    // Bearer only — /shared/... loads this proxy with Authorization.
    // Do not accept ?access_token= here (leak via Referer / logs).
    const auth = await requireAuth(request);
    if (!auth.ok) {
      return unauthenticatedFileShareResponse(
        request,
        buildShareAppPath(storagePath),
      );
    }

    const allowed = await userMayAccessStoredFile(auth.userId, storagePath);
    if (!allowed) {
      return jsonResponse({ error: 'Forbidden.' }, 403);
    }

    const buffer = await fetchFromDreamHost(storagePath);
    const fileName = storagePath.split('/').pop() || 'file.pdf';

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(buffer.byteLength),
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('files/proxy:', error instanceof Error ? error.message : error);
    const status = error?.status && Number.isFinite(error.status) ? error.status : 500;
    return jsonResponse(
      { error: status === 404 ? 'File not found.' : 'Failed to fetch file.' },
      status === 404 ? 404 : 500,
    );
  }
}
