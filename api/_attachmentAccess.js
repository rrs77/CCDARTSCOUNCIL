/**
 * Shared lesson-attachment access checks (owner path prefix OR planning share).
 * Used by /api/lesson-attachments/file/[...path] and ILV Whisper transcribe.
 * Underscore module — does not count toward Hobby /api function budget.
 */

import { createServiceClient } from './_authShared.js';
import { parseAttachmentStoragePath } from './_lessonAttachmentStorage.js';

/**
 * Whether userId may read the DreamHost object at storagePath.
 * Owner shortcut: path.split('/')[0] === userId.
 * Otherwise: lesson_attachments row must be ready/linked, and either
 * owner_id matches or a planning_shares grant reaches the user.
 *
 * @param {string} userId
 * @param {string} storagePath canonical path from parseAttachmentStoragePath
 * @param {{ serviceClient?: object | null }} [opts] inject client for tests
 * @returns {Promise<boolean>}
 */
export async function mayAccessLessonAttachment(userId, storagePath, opts = {}) {
  if (!userId || !storagePath) return false;
  const path = parseAttachmentStoragePath(storagePath) || storagePath;
  if (!path) return false;
  if (path.split('/')[0] === userId) return true;

  const service = opts.serviceClient !== undefined ? opts.serviceClient : createServiceClient();
  if (!service) return false;

  const { data: row } = await service
    .from('lesson_attachments')
    .select('owner_id, status, lesson_key, organisation_id')
    .eq('storage_path', path)
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

/** @deprecated alias kept for call-site clarity in file proxy */
export const mayAccess = mayAccessLessonAttachment;
