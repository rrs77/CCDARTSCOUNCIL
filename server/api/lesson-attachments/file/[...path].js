/**
 * GET /api/lesson-attachments/file/:userId/:lessonSeg/:uuid.ext
 * Authenticated proxy for DreamHost lesson attachments.
 *
 * Access: owner path prefix, OR shared reader via can_read_planning_resource
 * on a planning_share_resources row for the lesson with
 * r.owner_id = lesson_attachments.owner_id (see migration comment).
 */

import {
  assertRateLimit,
  getClientIp,
  jsonResponse,
  optionsResponse,
  requireAuth,
} from '../../../../api/_authShared.js';
import { mayAccessLessonAttachment } from '../../../../api/_attachmentAccess.js';
import {
  contentTypeForAttachmentPath,
  fetchAttachmentFromDreamHost,
  parseAttachmentStoragePath,
} from '../../../../api/_lessonAttachmentStorage.js';

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

export async function GET(request, context) {
  try {
    const storagePath = pathFromRequest(request, context);
    if (!storagePath) return jsonResponse({ error: 'Invalid file path.' }, 400);

    const ip = getClientIp(request) || 'unknown';
    const limited = assertRateLimit(`la-file:${ip}:${storagePath}`, { limit: 60, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const allowed = await mayAccessLessonAttachment(auth.userId, storagePath);
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
