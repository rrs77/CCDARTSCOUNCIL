/**
 * Hub page read/update + publish.
 * GET/PATCH /api/hubs/:hubId
 * POST /api/hubs/:hubId  body: { action: 'publish' | 'unpublish' | 'save_draft' }
 */

import {
  createServiceClient,
  jsonResponse,
  optionsResponse,
} from '../../_authShared.js';
import {
  auditHubAction,
  requireHubAccess,
  sanitizeHubHtml,
} from '../../_hubShared.js';

export async function OPTIONS() {
  return optionsResponse();
}

function hubIdFromContext(request, context) {
  return (
    context?.params?.hubId ||
    new URL(request.url).pathname.split('/').filter(Boolean).slice(-1)[0]
  );
}

export async function GET(request, context) {
  try {
    const hubId = hubIdFromContext(request, context);
    const access = await requireHubAccess(request, {
      hubId,
      minRole: 'hub_viewer',
    });
    if (!access.ok) return access.response;

    const service = createServiceClient();
    const orgId = access.organisation.id;

    const [pageRes, collectionsRes, resourcesRes, activitiesRes, mediaRes] =
      await Promise.all([
        service.from('hub_pages').select('*').eq('organisation_id', orgId).maybeSingle(),
        service
          .from('resource_collections')
          .select('*')
          .eq('organisation_id', orgId)
          .order('sort_order'),
        service
          .from('resources')
          .select('*')
          .eq('organisation_id', orgId)
          .order('sort_order'),
        service
          .from('hub_activities')
          .select('*')
          .eq('organisation_id', orgId)
          .order('sort_order'),
        service
          .from('hub_media')
          .select('*')
          .eq('organisation_id', orgId)
          .order('sort_order'),
      ]);

    return jsonResponse({
      organisation: access.organisation,
      hub_role: access.hubRole,
      page: pageRes.data,
      collections: collectionsRes.data || [],
      resources: resourcesRes.data || [],
      activities: activitiesRes.data || [],
      media: mediaRes.data || [],
    });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: 'Failed to load hub.' }, 500);
  }
}

export async function PATCH(request, context) {
  try {
    const hubId = hubIdFromContext(request, context);
    const access = await requireHubAccess(request, {
      hubId,
      minRole: 'hub_editor',
    });
    if (!access.ok) return access.response;

    const body = await request.json().catch(() => ({}));
    const service = createServiceClient();
    const orgId = access.organisation.id;

    // Org metadata (logo/colours) — editor+
    const orgPatch = {};
    for (const key of [
      'display_name',
      'short_name',
      'site_url',
      'logo_src',
      'primary_color',
      'accent_color',
      'logo_invert',
      'logo_on_plate',
      'logo_panel_color',
    ]) {
      if (body[key] !== undefined) orgPatch[key] = body[key];
    }
    if (Object.keys(orgPatch).length) {
      orgPatch.updated_at = new Date().toISOString();
      const { error } = await service
        .from('organisations')
        .update(orgPatch)
        .eq('id', orgId);
      if (error) return jsonResponse({ error: error.message }, 400);
    }

    if (body.page && typeof body.page === 'object') {
      const page = { ...body.page };
      if (typeof page.intro_html === 'string') {
        page.intro_html = sanitizeHubHtml(page.intro_html);
      }
      // Never accept arbitrary script-bearing fields
      delete page.organisation_id;
      const payload = {
        ...page,
        organisation_id: orgId,
        updated_by: access.userId,
        updated_at: new Date().toISOString(),
      };
      const { error } = await service.from('hub_pages').upsert(payload, {
        onConflict: 'organisation_id',
      });
      if (error) return jsonResponse({ error: error.message }, 400);
    }

    await auditHubAction({
      actorId: access.userId,
      organisationId: orgId,
      action: 'hub.page.update',
      targetType: 'organisation',
      targetId: orgId,
      meta: { keys: Object.keys(body) },
      request,
    });

    return jsonResponse({ ok: true });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: 'Failed to update hub.' }, 500);
  }
}

export async function POST(request, context) {
  try {
    const hubId = hubIdFromContext(request, context);
    const body = await request.json().catch(() => ({}));
    const action = body.action;

    if (action === 'publish' || action === 'unpublish') {
      const access = await requireHubAccess(request, {
        hubId,
        minRole: 'hub_publisher',
      });
      if (!access.ok) return access.response;

      const service = createServiceClient();
      const orgId = access.organisation.id;
      const { data: page } = await service
        .from('hub_pages')
        .select('*')
        .eq('organisation_id', orgId)
        .maybeSingle();

      if (!page) return jsonResponse({ error: 'Hub page not found.' }, 404);

      if (action === 'publish') {
        const nextRev = (page.published_revision || 0) + 1;
        const snapshot = { ...page, draft_content: null };
        await service.from('hub_page_revisions').insert({
          organisation_id: orgId,
          revision: nextRev,
          snapshot,
          changed_by: access.userId,
          change_note: body.note || 'publish',
        });
        await service
          .from('hub_pages')
          .update({
            published_at: new Date().toISOString(),
            published_revision: nextRev,
            draft_content: null,
            updated_by: access.userId,
            updated_at: new Date().toISOString(),
          })
          .eq('organisation_id', orgId);
      } else {
        await service
          .from('hub_pages')
          .update({
            published_at: null,
            updated_by: access.userId,
            updated_at: new Date().toISOString(),
          })
          .eq('organisation_id', orgId);
      }

      await auditHubAction({
        actorId: access.userId,
        organisationId: orgId,
        action: `hub.page.${action}`,
        targetType: 'organisation',
        targetId: orgId,
        request,
      });

      return jsonResponse({ ok: true, action });
    }

    if (action === 'save_draft') {
      const access = await requireHubAccess(request, {
        hubId,
        minRole: 'hub_editor',
      });
      if (!access.ok) return access.response;
      const service = createServiceClient();
      const draft = body.draft || {};
      if (typeof draft.intro_html === 'string') {
        draft.intro_html = sanitizeHubHtml(draft.intro_html);
      }
      await service
        .from('hub_pages')
        .upsert(
          {
            organisation_id: access.organisation.id,
            draft_content: draft,
            updated_by: access.userId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'organisation_id' },
        );
      await auditHubAction({
        actorId: access.userId,
        organisationId: access.organisation.id,
        action: 'hub.page.draft',
        targetType: 'organisation',
        targetId: access.organisation.id,
        request,
      });
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: 'Unknown action.' }, 400);
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: 'Hub action failed.' }, 500);
  }
}
