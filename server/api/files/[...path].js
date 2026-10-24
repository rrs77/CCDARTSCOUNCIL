/**
 * GET /api/files/:userId/:uuid.pdf
 * Authenticated proxy for DreamHost-stored files.
 * Allows Bearer header or ?access_token= (download/open in new tab).
 * Access: owner or same-organisation (share) colleague.
 */

import {
  assertRateLimit,
  getClientIp,
  jsonResponse,
  optionsResponse,
  requireAuth,
} from '../../../api/_authShared.js';
import {
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

    // Auth: Bearer header, or ?access_token= (needed for new-tab open).
    // L1 narrows query-token acceptance to this proxy + resource download only.
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

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
