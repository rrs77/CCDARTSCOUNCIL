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
  createServiceClient,
  getClientIp,
  jsonResponse,
  optionsResponse,
  requireAuth,
} from '../../../../api/_authShared.js';
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

async function mayAccess(userId, storagePath) {
  if (!userId || !storagePath) return false;
  if (storagePath.split('/')[0] === userId) return true;

  const service = createServiceClient();
  if (!service) return false;

  const { data: row } = await service
    .from('lesson_attachments')
    .select('owner_id, status, lesson_key, organisation_id')
    .eq('storage_path', storagePath)
    .maybeSingle();

  if (!row || (row.status !== 'ready' && row.status !== 'linked')) return false;
  if (row.owner_id === userId) return true;

  // Shared read: planning share for this lesson owned by the attachment owner.
  // Mirrors RLS + can_read_planning_resource (service role has no auth.uid(), so
  // audience is evaluated here the same way as the SQL helper).
  const { data: resources } = await service
    .from('planning_share_resources')
    .select('id, organisation_id')
    .eq('resource_type', 'lesson')
    .eq('resource_id', row.lesson_key)
    .eq('owner_id', row.owner_id);

  if (!Array.isArray(resources) || !resources.length) return false;

  const { data: profile } = await service
    .from('profiles')
    .select('organisation_id, allowed_year_groups, status, anonymised_at')
    .eq('id', userId)
    .maybeSingle();
  if (!profile || profile.anonymised_at || (profile.status && profile.status === 'suspended')) {
    return false;
  }
  const orgId = profile.organisation_id ? String(profile.organisation_id).trim() : '';
  const yearGroups = Array.isArray(profile.allowed_year_groups)
    ? profile.allowed_year_groups.map(String)
    : [];

  const resourceIds = resources.map((r) => r.id);
  const { data: grants } = await service
    .from('planning_shares')
    .select('audience_type, audience_id, resource_id')
    .in('resource_id', resourceIds);

  if (!Array.isArray(grants)) return false;

  for (const g of grants) {
    const aud = String(g.audience_id || '');
    if (g.audience_type === 'person' && aud === userId) return true;
    if (
      (g.audience_type === 'school' || g.audience_type === 'hub_org') &&
      orgId &&
      aud === orgId
    ) {
      return true;
    }
    if (g.audience_type === 'year_group' && orgId && yearGroups.length && yearGroups.includes(aud)) {
      const res = resources.find((r) => r.id === g.resource_id);
      const resOrg = res?.organisation_id ? String(res.organisation_id).trim() : '';
      if (resOrg && orgId === resOrg) return true;
    }
    if (g.audience_type === 'group') {
      const { data: member } = await service
        .from('planning_group_members')
        .select('user_id')
        .eq('group_id', aud)
        .eq('user_id', userId)
        .maybeSingle();
      if (member) return true;
    }
  }
  return false;
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
