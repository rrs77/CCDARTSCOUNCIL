/**
 * Single resource update / lifecycle.
 * PATCH/DELETE /api/hubs/:hubId/resources/:resourceId
 * POST body.action = publish | unpublish | archive
 */

import {
  createServiceClient,
  jsonResponse,
  optionsResponse,
} from '../../../_authShared.js';
import {
  auditHubAction,
  getOrgScopedResource,
  probeExternalUrl,
  requireHubAccess,
  snapshotResourceRevision,
  validateExternalUrl,
} from '../../../_hubShared.js';

export async function OPTIONS() {
  return optionsResponse();
}

function idsFrom(request, context) {
  const parts = new URL(request.url).pathname.split('/').filter(Boolean);
  const hubsIdx = parts.indexOf('hubs');
  return {
    hubId: context?.params?.hubId || parts[hubsIdx + 1],
    resourceId: context?.params?.resourceId || parts[hubsIdx + 3],
  };
}

export async function GET(request, context) {
  const { hubId, resourceId } = idsFrom(request, context);
  const access = await requireHubAccess(request, { hubId, minRole: 'hub_viewer' });
  if (!access.ok) return access.response;
  const resource = await getOrgScopedResource(access.organisation.id, resourceId);
  if (!resource) return jsonResponse({ error: 'Resource not found in this hub.' }, 404);

  const service = createServiceClient();
  const { data: revisions } = await service
    .from('resource_revisions')
    .select('id, change_note, changed_by, created_at')
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: false })
    .limit(25);

  return jsonResponse({ resource, revisions: revisions || [] });
}

export async function PATCH(request, context) {
  try {
    const { hubId, resourceId } = idsFrom(request, context);
    const body = await request.json().catch(() => ({}));

    if (body.action === 'publish' || body.action === 'unpublish' || body.action === 'archive') {
      const minRole = body.action === 'archive' ? 'hub_editor' : 'hub_publisher';
      const access = await requireHubAccess(request, { hubId, minRole });
      if (!access.ok) return access.response;

      const existing = await getOrgScopedResource(access.organisation.id, resourceId);
      if (!existing) return jsonResponse({ error: 'Resource not found in this hub.' }, 404);

      if (body.action === 'publish') {
        const urlCheck = validateExternalUrl(existing.download_url || existing.external_url);
        if (!urlCheck.ok) {
          return jsonResponse({
            error: `Cannot publish: ${urlCheck.error}`,
          }, 400);
        }
      }

      const now = new Date().toISOString();
      const patch =
        body.action === 'publish'
          ? {
              status: 'published',
              is_active: true,
              published_at: now,
              unpublished_at: null,
              archived_at: null,
            }
          : body.action === 'unpublish'
            ? { status: 'unpublished', is_active: false, unpublished_at: now }
            : { status: 'archived', is_active: false, archived_at: now };

      patch.updated_by = access.userId;
      patch.updated_at = now;

      const service = createServiceClient();
      const { data, error } = await service
        .from('resources')
        .update(patch)
        .eq('id', resourceId)
        .eq('organisation_id', access.organisation.id)
        .select('*')
        .single();
      if (error) return jsonResponse({ error: error.message }, 400);

      await snapshotResourceRevision(data, access.userId, body.action);
      await auditHubAction({
        actorId: access.userId,
        organisationId: access.organisation.id,
        action: `hub.resource.${body.action}`,
        targetType: 'resource',
        targetId: resourceId,
        request,
      });
      return jsonResponse({ resource: data });
    }

    const access = await requireHubAccess(request, { hubId, minRole: 'hub_editor' });
    if (!access.ok) return access.response;

    const existing = await getOrgScopedResource(access.organisation.id, resourceId);
    if (!existing) return jsonResponse({ error: 'Resource not found in this hub.' }, 404);

    const patch = {};
    for (const key of [
      'title',
      'description',
      'resource_type',
      'collection_id',
      'is_free',
      'pricing_note',
      'age_range',
      'key_stages',
      'subjects',
      'tags',
      'metadata',
      'sort_order',
      'requires_auth',
      'preview_url',
      'related_resource_id',
    ]) {
      if (body[key] !== undefined) patch[key] = body[key];
    }

    if (body.external_url !== undefined || body.download_url !== undefined) {
      const urlCheck = validateExternalUrl(body.external_url || body.download_url, {
        allowDraftHttp: existing.status === 'draft',
      });
      if (!urlCheck.ok) return jsonResponse({ error: urlCheck.error }, 400);
      patch.download_url = urlCheck.url;
      const probe = await probeExternalUrl(urlCheck.url);
      patch.url_verified = probe.verified;
      patch.url_last_checked_at = new Date().toISOString();
      patch.url_check_warning = probe.warning || urlCheck.warning || null;
    }

    // Status transitions via dedicated action only (except draft edits)
    if (body.status === 'draft' && existing.status !== 'published') {
      patch.status = 'draft';
    }

    patch.updated_by = access.userId;
    patch.updated_at = new Date().toISOString();

    const service = createServiceClient();
    const { data, error } = await service
      .from('resources')
      .update(patch)
      .eq('id', resourceId)
      .eq('organisation_id', access.organisation.id)
      .select('*')
      .single();
    if (error) return jsonResponse({ error: error.message }, 400);

    await snapshotResourceRevision(data, access.userId, 'update');
    await auditHubAction({
      actorId: access.userId,
      organisationId: access.organisation.id,
      action: 'hub.resource.update',
      targetType: 'resource',
      targetId: resourceId,
      meta: { keys: Object.keys(patch) },
      request,
    });

    return jsonResponse({
      resource: data,
      warning: data.url_check_warning || null,
    });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: 'Failed to update resource.' }, 500);
  }
}

export async function DELETE(request, context) {
  const { hubId, resourceId } = idsFrom(request, context);
  const access = await requireHubAccess(request, { hubId, minRole: 'hub_administrator' });
  if (!access.ok) return access.response;

  const existing = await getOrgScopedResource(access.organisation.id, resourceId);
  if (!existing) return jsonResponse({ error: 'Resource not found in this hub.' }, 404);

  // Soft-delete via archive (preserve analytics history)
  const service = createServiceClient();
  const { data, error } = await service
    .from('resources')
    .update({
      status: 'archived',
      is_active: false,
      archived_at: new Date().toISOString(),
      updated_by: access.userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', resourceId)
    .eq('organisation_id', access.organisation.id)
    .select('*')
    .single();
  if (error) return jsonResponse({ error: error.message }, 400);

  await auditHubAction({
    actorId: access.userId,
    organisationId: access.organisation.id,
    action: 'hub.resource.archive',
    targetType: 'resource',
    targetId: resourceId,
    request,
  });

  return jsonResponse({ resource: data });
}
