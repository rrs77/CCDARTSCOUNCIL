/**
 * Hub membership management.
 * GET/POST /api/hubs/:hubId/members
 * PATCH/DELETE with body.user_id
 *
 * Hub admins can only assign hub_* roles — never system roles / super_admin / other hubs.
 */

import {
  createServiceClient,
  isSuperAdminProfile,
  jsonResponse,
  optionsResponse,
} from '../../_authShared.js';
import {
  HUB_ROLES,
  assertAssignableHubRole,
  auditHubAction,
  requireHubAccess,
} from '../../_hubShared.js';

export async function OPTIONS() {
  return optionsResponse();
}

function hubIdFrom(request, context) {
  const parts = new URL(request.url).pathname.split('/').filter(Boolean);
  const hubsIdx = parts.indexOf('hubs');
  return context?.params?.hubId || parts[hubsIdx + 1];
}

export async function GET(request, context) {
  const hubId = hubIdFrom(request, context);
  const access = await requireHubAccess(request, {
    hubId,
    minRole: 'hub_administrator',
  });
  if (!access.ok) return access.response;

  const service = createServiceClient();
  const { data, error } = await service
    .from('hub_memberships')
    .select('id, role, user_id, granted_by, created_at, updated_at')
    .eq('organisation_id', access.organisation.id)
    .order('created_at');

  if (error) return jsonResponse({ error: error.message }, 500);

  const userIds = (data || []).map((m) => m.user_id);
  let profiles = [];
  if (userIds.length) {
    const { data: p } = await service
      .from('profiles')
      .select('id, email, display_name, role, status')
      .in('id', userIds);
    profiles = p || [];
  }
  const byId = Object.fromEntries(profiles.map((p) => [p.id, p]));

  return jsonResponse({
    members: (data || []).map((m) => ({
      ...m,
      profile: byId[m.user_id]
        ? {
            id: byId[m.user_id].id,
            email: byId[m.user_id].email,
            display_name: byId[m.user_id].display_name,
            status: byId[m.user_id].status,
            // Never expose system role escalation path in hub UI beyond label
            system_role: byId[m.user_id].role,
          }
        : null,
    })),
  });
}

export async function POST(request, context) {
  try {
    const hubId = hubIdFrom(request, context);
    const access = await requireHubAccess(request, {
      hubId,
      minRole: 'hub_administrator',
    });
    if (!access.ok) return access.response;

    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const userId = typeof body.user_id === 'string' ? body.user_id : null;
    const role = body.role || 'hub_editor';

    const roleCheck = assertAssignableHubRole(role, {
      actorIsSuperAdmin: isSuperAdminProfile(access.profile),
    });
    if (!roleCheck.ok) return jsonResponse({ error: roleCheck.error }, 400);
    if (!HUB_ROLES.includes(role)) {
      return jsonResponse({ error: 'Only hub_* roles may be assigned.' }, 400);
    }

    // Reject attempts to set system roles via this endpoint
    if (['admin', 'superuser', 'super_admin', 'teacher', 'viewer', 'creator'].includes(role)) {
      return jsonResponse({ error: 'Cannot assign system roles via hub membership.' }, 403);
    }

    const service = createServiceClient();
    let targetUserId = userId;
    if (!targetUserId && email) {
      const { data: profile } = await service
        .from('profiles')
        .select('id, email')
        .ilike('email', email)
        .maybeSingle();
      if (!profile) {
        return jsonResponse({
          error: 'User not found. Invite them to CCDesigner first, then grant hub access.',
        }, 404);
      }
      targetUserId = profile.id;
    }
    if (!targetUserId) {
      return jsonResponse({ error: 'email or user_id required.' }, 400);
    }

    const { data, error } = await service
      .from('hub_memberships')
      .upsert(
        {
          organisation_id: access.organisation.id,
          user_id: targetUserId,
          role,
          granted_by: access.userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organisation_id,user_id' },
      )
      .select('*')
      .single();

    if (error) return jsonResponse({ error: error.message }, 400);

    await auditHubAction({
      actorId: access.userId,
      organisationId: access.organisation.id,
      action: 'hub.member.grant',
      targetType: 'user',
      targetId: targetUserId,
      meta: { role },
      request,
    });

    return jsonResponse({ membership: data }, 201);
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: 'Failed to grant membership.' }, 500);
  }
}

export async function PATCH(request, context) {
  const hubId = hubIdFrom(request, context);
  const access = await requireHubAccess(request, {
    hubId,
    minRole: 'hub_administrator',
  });
  if (!access.ok) return access.response;

  const body = await request.json().catch(() => ({}));
  const targetUserId = body.user_id;
  const role = body.role;
  if (!targetUserId || !role) {
    return jsonResponse({ error: 'user_id and role required.' }, 400);
  }
  if (!HUB_ROLES.includes(role)) {
    return jsonResponse({ error: 'Only hub_* roles may be assigned.' }, 400);
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from('hub_memberships')
    .update({ role, updated_at: new Date().toISOString(), granted_by: access.userId })
    .eq('organisation_id', access.organisation.id)
    .eq('user_id', targetUserId)
    .select('*')
    .single();

  if (error) return jsonResponse({ error: error.message }, 400);

  await auditHubAction({
    actorId: access.userId,
    organisationId: access.organisation.id,
    action: 'hub.member.update',
    targetType: 'user',
    targetId: targetUserId,
    meta: { role },
    request,
  });

  return jsonResponse({ membership: data });
}

export async function DELETE(request, context) {
  const hubId = hubIdFrom(request, context);
  const access = await requireHubAccess(request, {
    hubId,
    minRole: 'hub_administrator',
  });
  if (!access.ok) return access.response;

  const body = await request.json().catch(() => ({}));
  const url = new URL(request.url);
  const targetUserId = body.user_id || url.searchParams.get('user_id');
  if (!targetUserId) return jsonResponse({ error: 'user_id required.' }, 400);

  const service = createServiceClient();
  const { error } = await service
    .from('hub_memberships')
    .delete()
    .eq('organisation_id', access.organisation.id)
    .eq('user_id', targetUserId);

  if (error) return jsonResponse({ error: error.message }, 400);

  await auditHubAction({
    actorId: access.userId,
    organisationId: access.organisation.id,
    action: 'hub.member.revoke',
    targetType: 'user',
    targetId: targetUserId,
    request,
  });

  return jsonResponse({ ok: true });
}
