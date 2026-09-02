/**
 * POST /api/forum/reports — create report
 * GET  /api/forum/reports — moderation queue
 */

import { createServiceClient, assertRateLimit } from '../_authShared.js';
import {
  forumJson,
  forumOptions,
  hasForumCap,
  requireForumAuth,
  enqueueNotification,
} from '../_forumShared.js';

export async function OPTIONS() {
  return forumOptions();
}

export async function POST(request) {
  try {
    const auth = await requireForumAuth(request, {
      capability: 'forum.report',
      rateKey: 'forum-report',
    });
    if (!auth.ok) return auth.response;

    const rl = assertRateLimit(`forum-report:${auth.userId}`, { limit: 10, windowMs: 60_000 });
    if (!rl.ok) return rl.response;

    const body = await request.json().catch(() => ({}));
    const reason = body.reason;
    const allowed = ['spam', 'abuse', 'off_topic', 'safeguarding', 'other'];
    if (!allowed.includes(reason)) {
      return forumJson({ error: 'Invalid reason.' }, 400);
    }
    if (!body.topic_id && !body.post_id) {
      return forumJson({ error: 'topic_id or post_id required.' }, 400);
    }

    const isSafeguarding = reason === 'safeguarding' || Boolean(body.is_safeguarding);
    const service = createServiceClient();
    const { data, error } = await service
      .from('forum_reports')
      .insert({
        reporter_id: auth.userId,
        topic_id: body.topic_id || null,
        post_id: body.post_id || null,
        reason,
        details: body.details ? String(body.details).slice(0, 4000) : null,
        is_safeguarding: isSafeguarding,
      })
      .select('*')
      .single();
    if (error) return forumJson({ error: error.message }, 400);

    // Notify moderators (profiles with admin roles) — best effort
    const { data: mods } = await service
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'superuser', 'super_admin'])
      .eq('status', 'active')
      .limit(20);
    for (const m of mods || []) {
      await enqueueNotification({
        userId: m.id,
        kind: 'moderation',
        title: isSafeguarding ? 'Safeguarding report received' : 'New forum report',
        body: reason,
        topicId: body.topic_id || null,
        postId: body.post_id || null,
        emailQueued: isSafeguarding,
      });
    }

    return forumJson({
      report: data,
      message: isSafeguarding
        ? 'Thank you. Safeguarding reports are prioritised for moderator review.'
        : 'Report submitted. Moderators will review it.',
    }, 201);
  } catch (e) {
    console.error(e);
    return forumJson({ error: 'Failed to submit report.' }, 500);
  }
}

export async function GET(request) {
  try {
    const auth = await requireForumAuth(request, {
      capability: 'forum.moderate',
      rateKey: 'forum-reports-list',
    });
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'open';
    const safeguarding = url.searchParams.get('safeguarding');

    const service = createServiceClient();
    let query = service
      .from('forum_reports')
      .select('*')
      .order('is_safeguarding', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);
    if (status !== 'all') query = query.eq('status', status);
    if (safeguarding === '1') query = query.eq('is_safeguarding', true);

    const { data, error } = await query;
    if (error) return forumJson({ error: error.message }, 500);
    return forumJson({ reports: data || [] });
  } catch (e) {
    console.error(e);
    return forumJson({ error: 'Failed to list reports.' }, 500);
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireForumAuth(request, { capability: 'forum.moderate' });
    if (!auth.ok) return auth.response;
    if (!hasForumCap(auth.caps, 'forum.moderate')) {
      return forumJson({ error: 'Forbidden.' }, 403);
    }

    const body = await request.json().catch(() => ({}));
    if (!body.id) return forumJson({ error: 'id required.' }, 400);
    const status = body.status;
    if (!['open', 'reviewing', 'resolved', 'dismissed'].includes(status)) {
      return forumJson({ error: 'Invalid status.' }, 400);
    }

    const service = createServiceClient();
    const { data, error } = await service
      .from('forum_reports')
      .update({
        status,
        resolved_by: ['resolved', 'dismissed'].includes(status) ? auth.userId : null,
        resolved_at: ['resolved', 'dismissed'].includes(status)
          ? new Date().toISOString()
          : null,
        resolution_note: body.resolution_note
          ? String(body.resolution_note).slice(0, 2000)
          : null,
      })
      .eq('id', body.id)
      .select('*')
      .single();
    if (error) return forumJson({ error: error.message }, 400);
    return forumJson({ report: data });
  } catch (e) {
    console.error(e);
    return forumJson({ error: 'Failed to update report.' }, 500);
  }
}
