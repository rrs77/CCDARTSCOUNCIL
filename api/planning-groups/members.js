/**
 * POST /api/planning-groups/members
 * DELETE /api/planning-groups/members
 *
 * Authenticated: add/remove planning_group_members via service role only after
 * verifying the caller is the planning_groups owner or a same-org admin
 * (role admin/superuser/super_admin or can_manage_users).
 *
 * Body: { groupId, userId?, label?, organisationId? }
 * - POST upserts membership for userId (defaults to caller).
 * - Creates planning_groups row if missing (caller becomes owner; org from profile).
 */

import {
  assertRateLimit,
  createServiceClient,
  jsonResponse,
  loadProfile,
  optionsResponse,
  requireAuth,
} from '../_authShared.js';

function isActiveProfile(profile) {
  if (!profile) return false;
  if (profile.anonymised_at) return false;
  const status = profile.status == null ? 'active' : String(profile.status);
  return status !== 'suspended';
}

function orgIdOf(profile) {
  const org = typeof profile?.organisation_id === 'string' ? profile.organisation_id.trim() : '';
  return org || null;
}

function isOrgAdmin(profile) {
  if (!isActiveProfile(profile)) return false;
  const role = profile.role || '';
  return (
    role === 'admin' ||
    role === 'superuser' ||
    role === 'super_admin' ||
    profile.can_manage_users === true
  );
}

async function assertCanManageGroup(service, callerId, callerProfile, groupId) {
  const { data: group, error } = await service
    .from('planning_groups')
    .select('id, owner_id, organisation_id')
    .eq('id', groupId)
    .maybeSingle();
  if (error) {
    return { ok: false, response: jsonResponse({ error: error.message }, 400) };
  }
  if (!group) {
    return { ok: false, missing: true };
  }
  if (group.owner_id === callerId) {
    return { ok: true, group };
  }
  const callerOrg = orgIdOf(callerProfile);
  const groupOrg = typeof group.organisation_id === 'string' ? group.organisation_id.trim() : '';
  if (callerOrg && groupOrg && callerOrg === groupOrg && isOrgAdmin(callerProfile)) {
    return { ok: true, group };
  }
  return { ok: false, response: jsonResponse({ error: 'Forbidden.' }, 403) };
}

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const rl = assertRateLimit(`planning-group-members:${auth.userId}`, {
      limit: 40,
      windowMs: 60_000,
    });
    if (!rl.ok) return rl.response;

    const service = createServiceClient();
    if (!service) return jsonResponse({ error: 'Server configuration error.' }, 500);

    const callerProfile = await loadProfile(auth.userId);
    if (!isActiveProfile(callerProfile)) {
      return jsonResponse({ error: 'Forbidden.' }, 403);
    }
    const callerOrg = orgIdOf(callerProfile);
    if (!callerOrg) {
      return jsonResponse({ error: 'Your profile has no organisation_id.' }, 400);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body.' }, 400);
    }

    const groupId = typeof body?.groupId === 'string' ? body.groupId.trim() : '';
    if (!groupId || groupId.length > 120) {
      return jsonResponse({ error: 'Invalid groupId.' }, 400);
    }

    const targetUserId =
      typeof body?.userId === 'string' && body.userId.trim()
        ? body.userId.trim()
        : auth.userId;

    let managed = await assertCanManageGroup(service, auth.userId, callerProfile, groupId);
    if (!managed.ok && managed.missing) {
      // Create group — caller becomes owner (only for self-add bootstrap).
      if (targetUserId !== auth.userId) {
        return jsonResponse({ error: 'Group not found.' }, 404);
      }
      const label =
        typeof body?.label === 'string' && body.label.trim()
          ? body.label.trim().slice(0, 200)
          : groupId;
      const { error: createErr } = await service.from('planning_groups').insert({
        id: groupId,
        owner_id: auth.userId,
        organisation_id: callerOrg,
        label,
        updated_at: new Date().toISOString(),
      });
      if (createErr) {
        // Race: another request created it — re-check manage rights.
        managed = await assertCanManageGroup(service, auth.userId, callerProfile, groupId);
        if (!managed.ok) {
          return managed.response || jsonResponse({ error: createErr.message }, 400);
        }
      } else {
        managed = { ok: true, group: { id: groupId, owner_id: auth.userId, organisation_id: callerOrg } };
      }
    } else if (!managed.ok) {
      return managed.response;
    }

    // Target must be same org when adding someone else.
    if (targetUserId !== auth.userId) {
      const targetProfile = await loadProfile(targetUserId);
      const targetOrg = orgIdOf(targetProfile);
      if (!targetOrg || targetOrg !== managed.group.organisation_id) {
        return jsonResponse({ error: 'Member must share the group organisation_id.' }, 400);
      }
    }

    const { error: upsertErr } = await service.from('planning_group_members').upsert(
      {
        group_id: groupId,
        user_id: targetUserId,
        organisation_id: managed.group.organisation_id,
      },
      { onConflict: 'group_id,user_id' },
    );
    if (upsertErr) return jsonResponse({ error: upsertErr.message }, 400);

    return jsonResponse({
      success: true,
      groupId,
      userId: targetUserId,
      organisationId: managed.group.organisation_id,
    });
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : 'Failed to update group members' },
      500,
    );
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const rl = assertRateLimit(`planning-group-members-del:${auth.userId}`, {
      limit: 40,
      windowMs: 60_000,
    });
    if (!rl.ok) return rl.response;

    const service = createServiceClient();
    if (!service) return jsonResponse({ error: 'Server configuration error.' }, 500);

    const callerProfile = await loadProfile(auth.userId);
    if (!isActiveProfile(callerProfile)) {
      return jsonResponse({ error: 'Forbidden.' }, 403);
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const url = new URL(request.url);
    const groupId = (
      (typeof body.groupId === 'string' && body.groupId) ||
      url.searchParams.get('groupId') ||
      ''
    ).trim();
    const targetUserId = (
      (typeof body.userId === 'string' && body.userId) ||
      url.searchParams.get('userId') ||
      auth.userId
    ).trim();

    if (!groupId) return jsonResponse({ error: 'Invalid groupId.' }, 400);

    const managed = await assertCanManageGroup(service, auth.userId, callerProfile, groupId);
    if (!managed.ok) {
      return managed.response || jsonResponse({ error: 'Group not found.' }, 404);
    }

    const { error } = await service
      .from('planning_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', targetUserId);
    if (error) return jsonResponse({ error: error.message }, 400);

    return jsonResponse({ success: true, groupId, userId: targetUserId });
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : 'Failed to remove group member' },
      500,
    );
  }
}
