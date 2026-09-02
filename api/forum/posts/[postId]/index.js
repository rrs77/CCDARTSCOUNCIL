/**
 * PATCH /api/forum/posts/[postId] — edit / hide
 * POST  /api/forum/posts/[postId]/react — toggle reaction
 */

import { createServiceClient, assertRateLimit } from '../../_authShared.js';
import {
  forumJson,
  forumOptions,
  hasForumCap,
  logForumModAction,
  markdownToSafeHtml,
  requireForumAuth,
} from '../../_forumShared.js';

export async function OPTIONS() {
  return forumOptions();
}

function getPostId(request) {
  const parts = new URL(request.url).pathname.split('/').filter(Boolean);
  // .../posts/:id or .../posts/:id/react
  const idx = parts.indexOf('posts');
  return parts[idx + 1];
}

export async function PATCH(request) {
  try {
    const auth = await requireForumAuth(request, { rateKey: 'forum-post-patch' });
    if (!auth.ok) return auth.response;

    const postId = getPostId(request);
    const body = await request.json().catch(() => ({}));
    const service = createServiceClient();

    const { data: post } = await service
      .from('forum_posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle();
    if (!post) return forumJson({ error: 'Post not found.' }, 404);

    const isMod = hasForumCap(auth.caps, 'forum.moderate');
    const isAuthor = post.author_id === auth.userId;
    if (!isMod && !isAuthor) return forumJson({ error: 'Forbidden.' }, 403);

    const patch = { updated_at: new Date().toISOString() };
    if (body.body_md != null && (isAuthor || isMod)) {
      const bodyMd = String(body.body_md).trim().slice(0, 40_000);
      if (bodyMd.length < 2) return forumJson({ error: 'Body too short.' }, 400);
      patch.body_md = bodyMd;
      patch.body_html = markdownToSafeHtml(bodyMd);
    }
    if (isMod && body.is_hidden != null) {
      patch.is_hidden = Boolean(body.is_hidden);
      await logForumModAction({
        actorId: auth.userId,
        action: patch.is_hidden ? 'hide_post' : 'restore_post',
        targetType: 'forum_post',
        targetId: postId,
        reason: body.reason,
      });
    }

    const { data, error } = await service
      .from('forum_posts')
      .update(patch)
      .eq('id', postId)
      .select('*')
      .single();
    if (error) return forumJson({ error: error.message }, 400);
    return forumJson({ post: data });
  } catch (e) {
    console.error(e);
    return forumJson({ error: 'Failed to update post.' }, 500);
  }
}

export async function POST(request) {
  // Used when path ends with /react — Vercel may route react.js separately;
  // this file handles PATCH only; see react.js for POST react.
  return forumJson({ error: 'Use /api/forum/posts/:id/react for reactions.' }, 405);
}
