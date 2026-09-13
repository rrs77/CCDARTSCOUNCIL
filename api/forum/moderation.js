/**
 * POST /api/forum/moderation — suspend user, grant moderator, etc.
 * GET  /api/forum/moderation — recent moderation actions
 */

import { createServiceClient } from '../_authShared.js';
import {
  forumJson,
  forumOptions,
  logForumModAction,
  requireForumAuth,
} from '../_forumShared.js';

export async function OPTIONS() {
  return forumOptions();
}

export async function GET(request) {
  try {
    const auth = await requireForumAuth(request, { capability: 'forum.moderate' });
    if (!auth.ok) return auth.response;

    const service = createServiceClient();
    const { data, error } = await service
      .from('forum_moderation_actions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) return forumJson({ error: error.message }, 500);
    return forumJson({ actions: data || [] });
  } catch (e) {
    console.error(e);
    return forumJson({ error: 'Failed to load moderation log.' }, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await requireForumAuth(request, {
      capability: 'forum.moderate',
      rateKey: 'forum-mod',
    });
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    const action = body.action;
    const service = createServiceClient();

    if (action === 'suspend_user') {
      const userId = body.user_id;
      if (!userId) return forumJson({ error: 'user_id required.' }, 400);
      const until = body.suspended_until || null;
      const { data, error } = await service
        .from('forum_user_status')
        .upsert(
          {
            user_id: userId,
            is_suspended: true,
            suspended_until: until,
            suspend_reason: body.reason ? String(body.reason).slice(0, 1000) : null,
            suspended_by: auth.userId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
        .select('*')
        .single();
      if (error) return forumJson({ error: error.message }, 400);
      await logForumModAction({
        actorId: auth.userId,
        action: 'suspend_user',
        targetType: 'user',
        targetId: userId,
        reason: body.reason,
      });
      return forumJson({ status: data });
    }

    if (action === 'unsuspend_user') {
      const userId = body.user_id;
      if (!userId) return forumJson({ error: 'user_id required.' }, 400);
      const { data, error } = await service
        .from('forum_user_status')
        .upsert(
          {
            user_id: userId,
            is_suspended: false,
            suspended_until: null,
            suspend_reason: null,
            suspended_by: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
        .select('*')
        .single();
      if (error) return forumJson({ error: error.message }, 400);
      await logForumModAction({
        actorId: auth.userId,
        action: 'unsuspend_user',
        targetType: 'user',
        targetId: userId,
      });
      return forumJson({ status: data });
    }

    if (action === 'set_moderator') {
      if (!auth.caps.has('forum.manage_settings') && !auth.caps.has('forum.manage_categories')) {
        // allow moderate+manage; super already has both
      }
      const userId = body.user_id;
      if (!userId) return forumJson({ error: 'user_id required.' }, 400);
      const { data, error } = await service
        .from('forum_user_status')
        .upsert(
          {
            user_id: userId,
            is_moderator: Boolean(body.is_moderator),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
        .select('*')
        .single();
      if (error) return forumJson({ error: error.message }, 400);
      await logForumModAction({
        actorId: auth.userId,
        action: body.is_moderator ? 'grant_moderator' : 'revoke_moderator',
        targetType: 'user',
        targetId: userId,
      });
      return forumJson({ status: data });
    }

    return forumJson({ error: 'Unknown action.' }, 400);
  } catch (e) {
    console.error(e);
    return forumJson({ error: 'Moderation action failed.' }, 500);
  }
}
