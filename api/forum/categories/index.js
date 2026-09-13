/**
 * GET  /api/forum/categories — list visible categories
 * POST /api/forum/categories — create (manage_categories)
 */

import { createServiceClient } from '../_authShared.js';
import {
  canReadCategory,
  forumJson,
  forumOptions,
  optionalForumAuth,
  requireForumAuth,
  slugify,
} from '../_forumShared.js';

export async function OPTIONS() {
  return forumOptions();
}

export async function GET(request) {
  try {
    const ctx = await optionalForumAuth(request);
    const service = createServiceClient();
    if (!service) return forumJson({ error: 'Server misconfigured.' }, 500);

    const url = new URL(request.url);
    const includeDrafts = url.searchParams.get('include_drafts') === '1';
    const hubId = url.searchParams.get('hub_id');

    let query = service.from('forum_categories').select('*').order('sort_order').order('title');
    if (hubId) query = query.eq('hub_id', hubId);

    const { data, error } = await query;
    if (error) return forumJson({ error: error.message }, 500);

    const visible = [];
    for (const cat of data || []) {
      if (!includeDrafts && cat.status === 'draft') {
        const ok = await canReadCategory(cat, ctx);
        if (!ok) continue;
      } else {
        const ok = await canReadCategory(cat, ctx);
        if (!ok) continue;
      }
      visible.push(serializeCategory(cat));
    }

    return forumJson({
      categories: visible,
      caps: [...(ctx.caps || [])],
      anonymous: Boolean(ctx.anonymous),
    });
  } catch (e) {
    console.error(e);
    return forumJson({ error: 'Failed to list categories.' }, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await requireForumAuth(request, {
      capability: 'forum.manage_categories',
      rateKey: 'forum-cat-write',
    });
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    const title = String(body.title || '').trim();
    if (title.length < 2 || title.length > 120) {
      return forumJson({ error: 'Title must be 2–120 characters.' }, 400);
    }

    const slug = slugify(body.slug || title);
    const scope = body.scope || 'public';
    const allowedScopes = ['public', 'members', 'hub', 'announcement', 'role_restricted'];
    if (!allowedScopes.includes(scope)) {
      return forumJson({ error: 'Invalid scope.' }, 400);
    }
    if (scope === 'hub' && !body.hub_id) {
      return forumJson({ error: 'hub_id required for hub-scoped categories.' }, 400);
    }

    const service = createServiceClient();
    const row = {
      slug,
      title,
      description: body.description ? String(body.description).slice(0, 2000) : null,
      sort_order: Number.isFinite(body.sort_order) ? body.sort_order : 100,
      status: body.status === 'published' ? 'published' : 'draft',
      scope,
      hub_id: scope === 'hub' ? String(body.hub_id) : null,
      allowed_roles: Array.isArray(body.allowed_roles) ? body.allowed_roles : null,
      is_locked: Boolean(body.is_locked),
      created_by: auth.userId,
    };

    const { data, error } = await service.from('forum_categories').insert(row).select('*').single();
    if (error) return forumJson({ error: error.message }, 400);
    return forumJson({ category: serializeCategory(data) }, 201);
  } catch (e) {
    console.error(e);
    return forumJson({ error: 'Failed to create category.' }, 500);
  }
}

function serializeCategory(c) {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    sort_order: c.sort_order,
    status: c.status,
    scope: c.scope,
    hub_id: c.hub_id,
    allowed_roles: c.allowed_roles,
    is_locked: c.is_locked,
    topic_count: c.topic_count,
    post_count: c.post_count,
    last_activity_at: c.last_activity_at,
  };
}
