/**
 * GET/PATCH /api/forum/categories/[categoryId]
 */

import { createServiceClient } from '../../_authShared.js';
import {
  canReadCategory,
  forumJson,
  forumOptions,
  logForumModAction,
  optionalForumAuth,
  requireForumAuth,
  slugify,
} from '../../_forumShared.js';

export async function OPTIONS() {
  return forumOptions();
}

function getCategoryId(request) {
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  // api/forum/categories/:id
  return parts[parts.length - 1];
}

export async function GET(request) {
  try {
    const ctx = await optionalForumAuth(request);
    const idOrSlug = getCategoryId(request);
    const service = createServiceClient();
    if (!service) return forumJson({ error: 'Server misconfigured.' }, 500);

    let q = service.from('forum_categories').select('*');
    q = idOrSlug.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
      ? q.eq('id', idOrSlug)
      : q.eq('slug', idOrSlug);

    const { data: cat, error } = await q.maybeSingle();
    if (error) return forumJson({ error: error.message }, 500);
    if (!cat || !(await canReadCategory(cat, ctx))) {
      return forumJson({ error: 'Category not found.' }, 404);
    }
    return forumJson({ category: cat, caps: [...(ctx.caps || [])] });
  } catch (e) {
    console.error(e);
    return forumJson({ error: 'Failed to load category.' }, 500);
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireForumAuth(request, {
      capability: 'forum.manage_categories',
      rateKey: 'forum-cat-patch',
    });
    if (!auth.ok) return auth.response;

    const id = getCategoryId(request);
    const body = await request.json().catch(() => ({}));
    const service = createServiceClient();

    const { data: existing } = await service
      .from('forum_categories')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (!existing) return forumJson({ error: 'Category not found.' }, 404);

    const patch = { updated_at: new Date().toISOString() };
    if (body.title != null) patch.title = String(body.title).trim().slice(0, 120);
    if (body.description != null) patch.description = String(body.description).slice(0, 2000);
    if (body.sort_order != null) patch.sort_order = Number(body.sort_order) || 100;
    if (body.status && ['draft', 'published', 'archived'].includes(body.status)) {
      patch.status = body.status;
    }
    if (body.scope && ['public', 'members', 'hub', 'announcement', 'role_restricted'].includes(body.scope)) {
      patch.scope = body.scope;
    }
    if (body.hub_id !== undefined) patch.hub_id = body.hub_id || null;
    if (body.allowed_roles !== undefined) patch.allowed_roles = body.allowed_roles;
    if (body.is_locked != null) patch.is_locked = Boolean(body.is_locked);
    if (body.slug) patch.slug = slugify(body.slug);

    if (patch.scope === 'hub' && !patch.hub_id && !existing.hub_id) {
      return forumJson({ error: 'hub_id required for hub scope.' }, 400);
    }

    const { data, error } = await service
      .from('forum_categories')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) return forumJson({ error: error.message }, 400);

    await logForumModAction({
      actorId: auth.userId,
      action: 'category.update',
      targetType: 'forum_category',
      targetId: id,
      meta: patch,
    });

    return forumJson({ category: data });
  } catch (e) {
    console.error(e);
    return forumJson({ error: 'Failed to update category.' }, 500);
  }
}
