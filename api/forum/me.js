/**
 * GET/PATCH /api/forum/me — caps, prefs, notifications
 * POST /api/forum/me — subscribe / mark read
 */

import { createServiceClient } from '../_authShared.js';
import {
  forumJson,
  forumOptions,
  requireForumAuth,
} from '../_forumShared.js';

export async function OPTIONS() {
  return forumOptions();
}

export async function GET(request) {
  try {
    const auth = await requireForumAuth(request, { rateKey: 'forum-me' });
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const service = createServiceClient();

    if (url.searchParams.get('notifications') === '1') {
      const { data } = await service
        .from('forum_notifications')
        .select('*')
        .eq('user_id', auth.userId)
        .order('created_at', { ascending: false })
        .limit(50);
      return forumJson({
        notifications: data || [],
        caps: [...auth.caps],
        forum_status: auth.forumStatus,
        prefs: {
          forum_email_notifications: auth.profile.forum_email_notifications !== false,
          forum_notify_replies: auth.profile.forum_notify_replies !== false,
          forum_notify_mentions: auth.profile.forum_notify_mentions !== false,
        },
      });
    }

    return forumJson({
      caps: [...auth.caps],
      forum_status: auth.forumStatus,
      prefs: {
        forum_email_notifications: auth.profile.forum_email_notifications !== false,
        forum_notify_replies: auth.profile.forum_notify_replies !== false,
        forum_notify_mentions: auth.profile.forum_notify_mentions !== false,
      },
      display_name:
        auth.profile.display_name ||
        [auth.profile.first_name, auth.profile.last_name].filter(Boolean).join(' ') ||
        'Member',
    });
  } catch (e) {
    console.error(e);
    return forumJson({ error: 'Failed to load forum profile.' }, 500);
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireForumAuth(request);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    const service = createServiceClient();
    const patch = {};
    if (typeof body.forum_email_notifications === 'boolean') {
      patch.forum_email_notifications = body.forum_email_notifications;
    }
    if (typeof body.forum_notify_replies === 'boolean') {
      patch.forum_notify_replies = body.forum_notify_replies;
    }
    if (typeof body.forum_notify_mentions === 'boolean') {
      patch.forum_notify_mentions = body.forum_notify_mentions;
    }
    if (!Object.keys(patch).length) {
      return forumJson({ error: 'No preference fields provided.' }, 400);
    }
    const { data, error } = await service
      .from('profiles')
      .update(patch)
      .eq('id', auth.userId)
      .select(
        'forum_email_notifications, forum_notify_replies, forum_notify_mentions',
      )
      .single();
    if (error) return forumJson({ error: error.message }, 400);
    return forumJson({ prefs: data });
  } catch (e) {
    console.error(e);
    return forumJson({ error: 'Failed to update prefs.' }, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await requireForumAuth(request);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    const service = createServiceClient();

    if (body.action === 'subscribe') {
      if (!body.topic_id && !body.category_id) {
        return forumJson({ error: 'topic_id or category_id required.' }, 400);
      }
      const row = {
        user_id: auth.userId,
        topic_id: body.topic_id || null,
        category_id: body.category_id || null,
      };
      const { error } = await service.from('forum_subscriptions').insert(row);
      if (error && !String(error.message).includes('duplicate')) {
        return forumJson({ error: error.message }, 400);
      }
      return forumJson({ subscribed: true });
    }

    if (body.action === 'unsubscribe') {
      let q = service.from('forum_subscriptions').delete().eq('user_id', auth.userId);
      if (body.topic_id) q = q.eq('topic_id', body.topic_id);
      if (body.category_id) q = q.eq('category_id', body.category_id);
      await q;
      return forumJson({ subscribed: false });
    }

    if (body.action === 'mark_notifications_read') {
      await service
        .from('forum_notifications')
        .update({ is_read: true })
        .eq('user_id', auth.userId)
        .eq('is_read', false);
      return forumJson({ ok: true });
    }

    return forumJson({ error: 'Unknown action.' }, 400);
  } catch (e) {
    console.error(e);
    return forumJson({ error: 'Action failed.' }, 500);
  }
}
