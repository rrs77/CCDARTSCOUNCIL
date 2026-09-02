/**
 * POST /api/forum/posts/[postId]/react — toggle reaction
 */

import { createServiceClient, assertRateLimit } from '../../../_authShared.js';
import { forumJson, forumOptions, requireForumAuth } from '../../../_forumShared.js';

export async function OPTIONS() {
  return forumOptions();
}

function getPostId(request) {
  const parts = new URL(request.url).pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('posts');
  return parts[idx + 1];
}

export async function POST(request) {
  try {
    const auth = await requireForumAuth(request, {
      capability: 'forum.react',
      rateKey: 'forum-react',
    });
    if (!auth.ok) return auth.response;

    const rl = assertRateLimit(`forum-react:${auth.userId}`, { limit: 60, windowMs: 60_000 });
    if (!rl.ok) return rl.response;

    const postId = getPostId(request);
    const body = await request.json().catch(() => ({}));
    const reaction = ['like', 'helpful', 'insightful'].includes(body.reaction)
      ? body.reaction
      : 'like';

    const service = createServiceClient();
    const { data: post } = await service
      .from('forum_posts')
      .select('id, reaction_count, is_hidden')
      .eq('id', postId)
      .maybeSingle();
    if (!post || post.is_hidden) return forumJson({ error: 'Post not found.' }, 404);

    const { data: existing } = await service
      .from('forum_reactions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', auth.userId)
      .eq('reaction', reaction)
      .maybeSingle();

    if (existing) {
      await service.from('forum_reactions').delete().eq('id', existing.id);
      await service
        .from('forum_posts')
        .update({ reaction_count: Math.max(0, (post.reaction_count || 1) - 1) })
        .eq('id', postId);
      return forumJson({ reacted: false, reaction });
    }

    const { error } = await service.from('forum_reactions').insert({
      post_id: postId,
      user_id: auth.userId,
      reaction,
    });
    if (error) return forumJson({ error: error.message }, 400);
    await service
      .from('forum_posts')
      .update({ reaction_count: (post.reaction_count || 0) + 1 })
      .eq('id', postId);
    return forumJson({ reacted: true, reaction });
  } catch (e) {
    console.error(e);
    return forumJson({ error: 'Failed to react.' }, 500);
  }
}
