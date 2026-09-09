/**
 * POST /api/forum/topics/[topicId]/posts — reply
 */

import { createServiceClient, assertRateLimit } from '../../../_authShared.js';
import {
  canContributeCategory,
  canReadCategory,
  enqueueNotification,
  forumJson,
  forumOptions,
  markdownToSafeHtml,
  requireForumAuth,
} from '../../../_forumShared.js';

export async function OPTIONS() {
  return forumOptions();
}

function getTopicId(request) {
  const parts = new URL(request.url).pathname.split('/').filter(Boolean);
  // api/forum/topics/:topicId/posts
  return parts[parts.length - 2];
}

export async function POST(request) {
  try {
    const auth = await requireForumAuth(request, {
      capability: 'forum.reply',
      rateKey: 'forum-reply',
    });
    if (!auth.ok) return auth.response;

    const rl = assertRateLimit(`forum-reply:${auth.userId}`, { limit: 20, windowMs: 60_000 });
    if (!rl.ok) return rl.response;

    const topicId = getTopicId(request);
    const body = await request.json().catch(() => ({}));
    const bodyMd = String(body.body_md || body.body || '').trim();
    if (bodyMd.length < 2 || bodyMd.length > 40_000) {
      return forumJson({ error: 'Reply must be 2–40000 characters.' }, 400);
    }

    const service = createServiceClient();
    const { data: topic } = await service
      .from('forum_topics')
      .select('*')
      .eq('id', topicId)
      .maybeSingle();
    if (!topic || topic.is_hidden) return forumJson({ error: 'Topic not found.' }, 404);
    if (topic.is_locked) return forumJson({ error: 'Topic is locked.' }, 403);

    const { data: category } = await service
      .from('forum_categories')
      .select('*')
      .eq('id', topic.category_id)
      .maybeSingle();

    if (!category || !(await canContributeCategory(category, auth, 'forum.reply'))) {
      return forumJson({ error: 'Cannot reply in this category.' }, 403);
    }
    if (!(await canReadCategory(category, auth))) {
      return forumJson({ error: 'Cannot reply in this category.' }, 403);
    }

    const bodyHtml = markdownToSafeHtml(bodyMd);
    const now = new Date().toISOString();
    const { data: post, error } = await service
      .from('forum_posts')
      .insert({
        topic_id: topicId,
        author_id: auth.userId,
        parent_post_id: body.parent_post_id || null,
        body_md: bodyMd,
        body_html: bodyHtml,
        is_topic_starter: false,
      })
      .select('*')
      .single();
    if (error) return forumJson({ error: error.message }, 400);

    await service
      .from('forum_topics')
      .update({
        reply_count: (topic.reply_count || 0) + 1,
        last_reply_at: now,
        last_reply_by: auth.userId,
        updated_at: now,
      })
      .eq('id', topicId);

    await service
      .from('forum_categories')
      .update({
        post_count: (category.post_count || 0) + 1,
        last_activity_at: now,
      })
      .eq('id', category.id);

    // Notify topic subscribers + author
    const { data: subs } = await service
      .from('forum_subscriptions')
      .select('user_id')
      .eq('topic_id', topicId);
    const notifyIds = new Set((subs || []).map((s) => s.user_id));
    notifyIds.add(topic.author_id);
    for (const uid of notifyIds) {
      if (uid === auth.userId) continue;
      await enqueueNotification({
        userId: uid,
        kind: 'reply',
        title: `New reply: ${topic.title}`,
        body: bodyMd.slice(0, 200),
        topicId,
        postId: post.id,
        emailQueued: true,
      });
    }

    return forumJson({ post }, 201);
  } catch (e) {
    console.error(e);
    return forumJson({ error: 'Failed to post reply.' }, 500);
  }
}
