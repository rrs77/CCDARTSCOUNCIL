/**
 * GET/PATCH /api/forum/topics/[topicId]
 */

import { createServiceClient, assertRateLimit } from '../../_authShared.js';
import {
  canReadCategory,
  forumJson,
  forumOptions,
  hasForumCap,
  isCategoryIndexable,
  loadProfilesByIds,
  logForumModAction,
  markdownToSafeHtml,
  optionalForumAuth,
  pageParams,
  publicAuthor,
  requireForumAuth,
} from '../../_forumShared.js';

export async function OPTIONS() {
  return forumOptions();
}

function getTopicId(request) {
  const parts = new URL(request.url).pathname.split('/').filter(Boolean);
  return parts[parts.length - 1];
}

export async function GET(request) {
  try {
    const ctx = await optionalForumAuth(request);
    const topicId = getTopicId(request);
    const service = createServiceClient();
    if (!service) return forumJson({ error: 'Server misconfigured.' }, 500);

    const url = new URL(request.url);
    const { page, limit, offset } = pageParams(url, { defaultLimit: 30 });

    const { data: topic } = await service
      .from('forum_topics')
      .select('*')
      .eq('id', topicId)
      .maybeSingle();
    if (!topic) return forumJson({ error: 'Topic not found.' }, 404);

    const { data: category } = await service
      .from('forum_categories')
      .select('*')
      .eq('id', topic.category_id)
      .maybeSingle();

    if (!category || !(await canReadCategory(category, ctx))) {
      return forumJson({ error: 'Topic not found.' }, 404);
    }
    if (topic.is_hidden && !hasForumCap(ctx.caps, 'forum.moderate') && topic.author_id !== ctx.userId) {
      return forumJson({ error: 'Topic not found.' }, 404);
    }

    let postsQuery = service
      .from('forum_posts')
      .select('*', { count: 'exact' })
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (!hasForumCap(ctx.caps, 'forum.moderate')) {
      postsQuery = postsQuery.or(`is_hidden.eq.false,author_id.eq.${ctx.userId || '00000000-0000-0000-0000-000000000000'}`);
    }

    const { data: posts, count, error } = await postsQuery;
    if (error) return forumJson({ error: error.message }, 500);

    const authorIds = [
      topic.author_id,
      ...(posts || []).map((p) => p.author_id),
    ];
    const authors = await loadProfilesByIds(authorIds);

    // Best-effort view bump (rate-limited per IP+topic)
    const ip = request.headers.get('x-forwarded-for') || 'anon';
    const rl = assertRateLimit(`forum-view:${topicId}:${ip}`, { limit: 3, windowMs: 60_000 });
    if (rl.ok) {
      await service
        .from('forum_topics')
        .update({ view_count: (topic.view_count || 0) + 1 })
        .eq('id', topicId);
    }

    let subscribed = false;
    if (ctx.userId) {
      const { data: sub } = await service
        .from('forum_subscriptions')
        .select('id')
        .eq('user_id', ctx.userId)
        .eq('topic_id', topicId)
        .maybeSingle();
      subscribed = Boolean(sub);
    }

    return forumJson({
      topic: {
        ...topic,
        author: publicAuthor(authors.get(topic.author_id)),
        category: {
          id: category.id,
          slug: category.slug,
          title: category.title,
          scope: category.scope,
          status: category.status,
          hub_id: category.hub_id,
        },
        indexable: isCategoryIndexable(category) && !topic.is_hidden,
        subscribed,
      },
      posts: (posts || []).map((p) => ({
        ...p,
        author: publicAuthor(authors.get(p.author_id)),
        // never expose email
      })),
      page,
      limit,
      total: count || 0,
      caps: [...(ctx.caps || [])],
      anonymous: Boolean(ctx.anonymous),
      robots: isCategoryIndexable(category) && !topic.is_hidden ? 'index,follow' : 'noindex,nofollow',
    });
  } catch (e) {
    console.error(e);
    return forumJson({ error: 'Failed to load topic.' }, 500);
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireForumAuth(request, { rateKey: 'forum-topic-patch' });
    if (!auth.ok) return auth.response;

    const topicId = getTopicId(request);
    const body = await request.json().catch(() => ({}));
    const service = createServiceClient();

    const { data: topic } = await service
      .from('forum_topics')
      .select('*')
      .eq('id', topicId)
      .maybeSingle();
    if (!topic) return forumJson({ error: 'Topic not found.' }, 404);

    const isMod = hasForumCap(auth.caps, 'forum.moderate');
    const isAuthor = topic.author_id === auth.userId;

    if (!isMod && !isAuthor) {
      return forumJson({ error: 'Forbidden.' }, 403);
    }

    const patch = { updated_at: new Date().toISOString() };
    const modActions = [];

    if (body.title != null && (isAuthor || isMod)) {
      patch.title = String(body.title).trim().slice(0, 200);
    }
    if (body.body_md != null && (isAuthor || isMod) && !topic.is_locked) {
      patch.body_md = String(body.body_md).slice(0, 40_000);
      patch.body_html = markdownToSafeHtml(patch.body_md);
    }

    if (isMod) {
      if (body.is_pinned != null) {
        patch.is_pinned = Boolean(body.is_pinned);
        modActions.push(patch.is_pinned ? 'pin' : 'unpin');
      }
      if (body.is_locked != null) {
        patch.is_locked = Boolean(body.is_locked);
        modActions.push(patch.is_locked ? 'lock' : 'unlock');
      }
      if (body.is_hidden != null) {
        patch.is_hidden = Boolean(body.is_hidden);
        modActions.push(patch.is_hidden ? 'hide' : 'restore');
      }
      if (body.category_id && body.category_id !== topic.category_id) {
        const { data: dest } = await service
          .from('forum_categories')
          .select('id')
          .eq('id', body.category_id)
          .maybeSingle();
        if (!dest) return forumJson({ error: 'Destination category not found.' }, 400);
        patch.category_id = body.category_id;
        modActions.push('move');
      }
    }

    const { data, error } = await service
      .from('forum_topics')
      .update(patch)
      .eq('id', topicId)
      .select('*')
      .single();
    if (error) return forumJson({ error: error.message }, 400);

    for (const action of modActions) {
      await logForumModAction({
        actorId: auth.userId,
        action,
        targetType: 'forum_topic',
        targetId: topicId,
        reason: body.reason,
      });
    }

    return forumJson({ topic: data });
  } catch (e) {
    console.error(e);
    return forumJson({ error: 'Failed to update topic.' }, 500);
  }
}
