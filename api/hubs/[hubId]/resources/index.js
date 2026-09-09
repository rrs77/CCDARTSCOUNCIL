/**
 * Hub resources CRUD + reorder + publish lifecycle.
 * GET/POST /api/hubs/:hubId/resources
 */

import {
  createServiceClient,
  jsonResponse,
  optionsResponse,
} from '../../_authShared.js';
import {
  auditHubAction,
  probeExternalUrl,
  requireHubAccess,
  snapshotResourceRevision,
  validateExternalUrl,
} from '../../_hubShared.js';

export async function OPTIONS() {
  return optionsResponse();
}

function hubIdFrom(request, context) {
  const parts = new URL(request.url).pathname.split('/').filter(Boolean);
  // /api/hubs/:hubId/resources
  const hubsIdx = parts.indexOf('hubs');
  return context?.params?.hubId || parts[hubsIdx + 1];
}

export async function GET(request, context) {
  const hubId = hubIdFrom(request, context);
  const access = await requireHubAccess(request, { hubId, minRole: 'hub_viewer' });
  if (!access.ok) return access.response;

  const service = createServiceClient();
  const url = new URL(request.url);
  const status = url.searchParams.get('status');

  let q = service
    .from('resources')
    .select('*')
    .eq('organisation_id', access.organisation.id)
    .order('sort_order');
  if (status) q = q.eq('status', status);

  const { data, error } = await q;
  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ resources: data || [] });
}

export async function POST(request, context) {
  try {
    const hubId = hubIdFrom(request, context);
    const body = await request.json().catch(() => ({}));

    if (body.action === 'reorder') {
      const access = await requireHubAccess(request, {
        hubId,
        minRole: 'hub_editor',
      });
      if (!access.ok) return access.response;
      const service = createServiceClient();
      const ids = Array.isArray(body.ids) ? body.ids : [];
      for (let i = 0; i < ids.length; i++) {
        await service
          .from('resources')
          .update({ sort_order: i, updated_at: new Date().toISOString() })
          .eq('id', ids[i])
          .eq('organisation_id', access.organisation.id);
      }
      await auditHubAction({
        actorId: access.userId,
        organisationId: access.organisation.id,
        action: 'hub.resources.reorder',
        targetType: 'organisation',
        targetId: access.organisation.id,
        meta: { count: ids.length },
        request,
      });
      return jsonResponse({ ok: true });
    }

    const access = await requireHubAccess(request, {
      hubId,
      minRole: 'hub_editor',
    });
    if (!access.ok) return access.response;

    const status = body.status === 'published' ? 'draft' : body.status || 'draft';
    // Creating as published requires publisher; force draft on create unless publisher
    let initialStatus = status;
    if (body.status === 'published') {
      const pubAccess = await requireHubAccess(request, {
        hubId,
        minRole: 'hub_publisher',
      });
      if (!pubAccess.ok) {
        initialStatus = 'draft';
      } else {
        initialStatus = 'published';
      }
    }

    const urlCheck = validateExternalUrl(body.external_url || body.download_url, {
      allowDraftHttp: initialStatus === 'draft',
    });
    if (!urlCheck.ok) return jsonResponse({ error: urlCheck.error }, 400);

    const probe = await probeExternalUrl(urlCheck.url);
    const id =
      (typeof body.id === 'string' && body.id.trim()) ||
      `res-${crypto.randomUUID().slice(0, 8)}`;

    const row = {
      id,
      organisation_id: access.organisation.id,
      partner_slug: access.organisation.slug || access.organisation.partner_slug || access.organisation.id,
      collection_id: body.collection_id || null,
      title: String(body.title || '').trim() || 'Untitled resource',
      description: body.description || null,
      resource_type: body.resource_type || 'web',
      download_url: urlCheck.url,
      filename: body.filename || null,
      url_verified: probe.verified,
      url_last_checked_at: new Date().toISOString(),
      url_check_warning: probe.warning || urlCheck.warning || null,
      status: initialStatus,
      is_active: initialStatus === 'published',
      is_free: body.is_free !== false,
      pricing_note: body.pricing_note || null,
      age_range: body.age_range || null,
      key_stages: Array.isArray(body.key_stages) ? body.key_stages : [],
      subjects: Array.isArray(body.subjects) ? body.subjects : [],
      tags: Array.isArray(body.tags) ? body.tags : [],
      metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
      sort_order: typeof body.sort_order === 'number' ? body.sort_order : 999,
      requires_auth: body.requires_auth !== false,
      preview_url: body.preview_url || null,
      related_audio_id: body.related_resource_id || body.related_audio_id || null,
      published_at: initialStatus === 'published' ? new Date().toISOString() : null,
      created_by: access.userId,
      updated_by: access.userId,
    };

    const service = createServiceClient();
    const { data, error } = await service.from('resources').insert(row).select('*').single();
    if (error) return jsonResponse({ error: error.message }, 400);

    await snapshotResourceRevision(data, access.userId, 'create');
    await auditHubAction({
      actorId: access.userId,
      organisationId: access.organisation.id,
      action: 'hub.resource.create',
      targetType: 'resource',
      targetId: data.id,
      meta: { status: data.status, warning: data.url_check_warning },
      request,
    });

    return jsonResponse({
      resource: data,
      warning: data.url_check_warning || null,
    }, 201);
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: 'Failed to create resource.' }, 500);
  }
}
