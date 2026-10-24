/**
 * GET /api/lesson-attachments/file/:userId/:lessonSeg/:uuid.ext
 * Authenticated proxy for DreamHost lesson attachments (mirrors SF files proxy shape).
 */

import {
  assertRateLimit,
  getClientIp,
  jsonResponse,
  optionsResponse,
  requireAuth,
} from '../../../../api/_authShared.js';
import {
  contentTypeForAttachmentPath,
  fetchAttachmentFromDreamHost,
  getOwnedAttachment,
  parseAttachmentStoragePath,
} from '../../../../api/_lessonAttachmentStorage.js';
import { createServiceClient } from '../../../../api/_authShared.js';

export async function OPTIONS() {
  return optionsResponse();
}

function pathFromRequest(request, context) {
  const fromParams = context?.params?.path;
  if (Array.isArray(fromParams) && fromParams.length) {
    return parseAttachmentStoragePath(fromParams.join('/'));
  }
  if (typeof fromParams === 'string' && fromParams) {
    return parseAttachmentStoragePath(fromParams);
  }
  try {
    const pathname = new URL(request.url).pathname;
    const marker = '/api/lesson-attachments/file/';
    const idx = pathname.indexOf(marker);
    if (idx >= 0) return parseAttachmentStoragePath(pathname.slice(idx + marker.length));
  } catch {
    /* ignore */
  }
  return null;
}

async function mayAccess(userId, storagePath) {
  if (!userId || !storagePath) return false;
  if (storagePath.split('/')[0] === userId) return true;
  const service = createServiceClient();
  if (!service) return false;
  const { data } = await service
    .from('lesson_attachments')
    .select('owner_id, status')
    .eq('storage_path', storagePath)
    .maybeSingle();
  return Boolean(data && data.owner_id === userId && (data.status === 'ready' || data.status === 'linked'));
}

export async function GET(request, context) {
  try {
    const storagePath = pathFromRequest(request, context);
    if (!storagePath) return jsonResponse({ error: 'Invalid file path.' }, 400);

    const ip = getClientIp(request) || 'unknown';
    const limited = assertRateLimit(`la-file:${ip}:${storagePath}`, { limit: 60, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const allowed = await mayAccess(auth.userId, storagePath);
    if (!allowed) return jsonResponse({ error: 'Forbidden.' }, 403);

    const buffer = await fetchAttachmentFromDreamHost(storagePath);
    const fileName = storagePath.split('/').pop() || 'file';
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentTypeForAttachmentPath(storagePath),
        'Content-Length': String(buffer.byteLength),
        'Content-Disposition': `inline; filename="${fileName.replace(/"/g, '')}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('lesson-attachments file:', error instanceof Error ? error.message : error);
    const status = error?.status && Number.isFinite(error.status) ? error.status : 500;
    return jsonResponse(
      { error: status === 404 ? 'File not found.' : 'Failed to fetch file.' },
      status === 404 ? 404 : 500,
    );
  }
}

// silence unused
void getOwnedAttachment;
