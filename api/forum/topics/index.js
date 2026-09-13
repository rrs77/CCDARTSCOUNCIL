/**
 * GET  /api/forum/topics — list / search topics
 * POST /api/forum/topics — create topic + starter post
 */

import { createServiceClient } from '../../_authShared.js';
import {
  canContributeCategory,
  canReadCategory,
  forumJson,
  forumOptions,
  isCategoryIndexable,
  loadProfilesByIds,
  markdownToSafeHtml,
  optionalForumAuth,
  pageParams,
  publicAuthor,
  requireForumAuth,
  slugify,
  enqueueNotification,
} from '../../_forumShared.js';

export async function OPTIONS() {
  return forumOptions();
}

export async function GET(request) {
  try {
    const ctx = await optionalForumAuth(request);
    const service = createServiceClient();
    if (!service) return forumJson({ error: 'Server misconfigured.' }, 500);

    const url = new URL(request.url);
    const { page, limit, offset } = pageParams(url);
    const categoryId = url.searchParams.get('category_id');
    const categorySlug = url.searchParams.get('category');
    const sort = url.searchParams.get('sort') || 'recent';
    const q = (url.searchParams.get('q') || '').trim();
    const filter = url.searchParams.get('filter'); // pinned | unanswered | recent

    let category = null;
    if (categoryId || categorySlug) {
      let cq = service.from('forum_categories').select('*');
      cq = categoryId ? cq.eq('id', categoryId) : cq.eq('slug', categorySlug);
      const { data } = await cq.maybeSingle();
      category = data;
      if (!category || !(await canReadCategory(category, ctx))) {
        return forumJson({ error: 'Category not found.' }, 404);
      }
    }

    // Load readable category ids for global lists
    const { data: allCats } = await service.from('forum_categories').select('*');
    const readableIds = [];
    const catMap = new Map();
    for (const c of allCats || []) {
      if (await canReadCategory(c, ctx)) {
        readableIds.push(c.id);
        catMap.set(c.id, c);
      }
    }
    if (!readableIds.length) {
      return forumJson({ topics: [], page, limit, total: 0 });
    }

    let query = service
      .from('forum_topics')
      .select('*', { count: 'exact' })
      .in('category_id', category ? [category.id] : readableIds)
      .eq('is_hidden', false);

    if (filter === 'pinned') query = query.eq('is_pinned', true);
    if (filter === 'unanswered') query = query.eq('reply_count', 0);
    if (q) query = query.or(`title.ilike.%${q}%,body_md.ilike.%${q}%`);

    if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sort === 'replies') {
      query = query.order('reply_count', { ascending: false });
    } else {
      query = query
        .order('is_pinned', { ascending: false })
        .order('last_reply_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);
    const { data: topics, error, count } = await query;
    if (error) return forumJson({ error: error.message }, 500);

    const authors = await loadProfilesByIds((topics || []).map((t) => t.author_id));
    const serialized = (topics || []).map((t) => {
      const cat = catMap.get(t.category_id) || category;
      return {
        id: t.id,
        title: t.title,
        slug: t.slug,
        category_id: t.category_id,
        category_slug: cat?.slug,
        category_title: cat?.title,
        is_pinned: t.is_pinned,
        is_locked: t.is_locked,
        is_announcement: t.is_announcement,
        reply_count: t.reply_count,
        view_count: t.view_count,
        last_reply_at: t.last_reply_at,
        created_at: t.created_at,
        author: publicAuthor(authors.get(t.author_id)),
        indexable: isCategoryIndexable(cat),
        excerpt: String(t.body_md || '').slice(0, 180),
      };
    });

    return forumJson({
      topics: serialized,
      page,
      limit,
      total: count || 0,
      caps: [...(ctx.caps || [])],
      anonymous: Boolean(ctx.anonymous),
    });
  } catch (e) {
    console.error(e);
    return forumJson({ error: 'Failed to list topics.' }, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await requireForumAuth(request, {
      capability: 'forum.create_topic',
      rateKey: 'forum-topic-create',
    });
    if (!auth.ok) return auth.response;

    const rl = await import('../../_authShared.js').then((m) =>
      m.assertRateLimit(`forum-topic:${auth.userId}`, { limit: 10, windowMs: 60_000 }),
    );
    if (!rl.ok) return rl.response;

    const body = await request.json().catch(() => ({}));
    const title = String(body.title || '').trim();
    const bodyMd = String(body.body_md || body.body || '').trim();
    const categoryId = body.category_id;

    if (title.length < 5 || title.length > 200) {
      return forumJson({ error: 'Title must be 5–200 characters.' }, 400);
    }
    if (bodyMd.length < 5 || bodyMd.length > 40_000) {
      return forumJson({ error: 'Body must be 5–40000 characters.' }, 400);
    }
    if (!categoryId) return forumJson({ error: 'category_id required.' }, 400);

    const service = createServiceClient();
    const { data: category } = await service
      .from('forum_categories')
      .select('*')
      .eq('id', categoryId)
      .maybeSingle();

    if (!category || !(await canContributeCategory(category, auth, 'forum.create_topic'))) {
      return forumJson({ error: 'Cannot create topic in this category.' }, 403);
    }

    const bodyHtml = markdownToSafeHtml(bodyMd);
    let slug = slugify(title);
    const { count } = await service
      .from('forum_topics')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .eq('slug', slug);
    if (count) slug = `${slug}-${Date.now().toString(36)}`;

    const now = new Date().toISOString();
    const { data: topic, error: tErr } = await service
      .from('forum_topics')
      .insert({
        category_id: categoryId,
        author_id: auth.userId,
        title,
        slug,
        body_md: bodyMd,
        body_html: bodyHtml,
        is_announcement: category.scope === 'announcement',
        last_reply_at: now,
        last_reply_by: auth.userId,
      })
      .select('*')
      .single();
    if (tErr) return forumJson({ error: tErr.message }, 400);

    const { data: post, error: pErr } = await service
      .from('forum_posts')
      .insert({
        topic_id: topic.id,
        author_id: auth.userId,
        body_md: bodyMd,
        body_html: bodyHtml,
        is_topic_starter: true,
      })
      .select('*')
      .single();
    if (pErr) return forumJson({ error: pErr.message }, 400);

    await service
      .from('forum_categories')
      .update({
        topic_count: (category.topic_count || 0) + 1,
        post_count: (category.post_count || 0) + 1,
        last_activity_at: now,
        updated_at: now,
      })
      .eq('id', categoryId);

    // Auto-subscribe author
    await service.from('forum_subscriptions').upsert(
      { user_id: auth.userId, topic_id: topic.id },
      { onConflict: 'user_id,topic_id', ignoreDuplicates: true },
    );

    // Notify category subscribers (best-effort)
    const { data: subs } = await service
      .from('forum_subscriptions')
      .select('user_id')
      .eq('category_id', categoryId);
    for (const s of subs || []) {
      if (s.user_id === auth.userId) continue;
      await enqueueNotification({
        userId: s.user_id,
        kind: 'subscription',
        title: `New topic in ${category.title}`,
        body: title,
        topicId: topic.id,
        emailQueued: true,
      });
    }

    return forumJson({ topic, post }, 201);
  } catch (e) {
    console.error(e);
    return forumJson({ error: 'Failed to create topic.' }, 500);
  }
}
