/**
 * GET /api/users/list
 * Admin user-management list with server-side search, filters, pagination.
 *
 * Query: q, role, status, hub (organisation_id), page (1-based), pageSize,
 *        sort (created_at|email|display_name|role), order (asc|desc)
 *
 * Scope:
 * - admin / superuser / super_admin → all users
 * - can_manage_users without full admin → users in hubs they administer
 *   (hub_memberships.role = hub_administrator), plus own organisation_id peers
 * - otherwise → own profile only (requireAdmin already gates entry)
 */

import {
  assertRateLimit,
  createServiceClient,
  getClientIp,
  isFullUserAdmin,
  jsonResponse,
  optionsResponse,
  requireAdmin,
} from '../_authShared.js';
import {
  buildProfileSearchOrFilter,
  intersectIdLists,
  parseUsersListParams,
} from '../_usersShared.js';

export async function OPTIONS() {
  return optionsResponse();
}

/**
 * Resolve optional ID scope for non–full-admins.
 * @returns {Promise<string[] | null>} null = unrestricted
 */
async function resolveActorScopeUserIds(service, actor) {
  if (isFullUserAdmin(actor.profile)) return null;

  const orgIds = new Set();
  if (actor.profile?.organisation_id) {
    orgIds.add(actor.profile.organisation_id);
  }

  const { data: adminMemberships, error: mErr } = await service
    .from('hub_memberships')
    .select('organisation_id')
    .eq('user_id', actor.userId)
    .eq('role', 'hub_administrator');
  if (mErr) throw new Error(mErr.message);
  for (const row of adminMemberships || []) {
    if (row.organisation_id) orgIds.add(row.organisation_id);
  }

  if (orgIds.size === 0) {
    return [actor.userId];
  }

  const orgList = [...orgIds];
  const ids = new Set([actor.userId]);

  const { data: members, error: memErr } = await service
    .from('hub_memberships')
    .select('user_id')
    .in('organisation_id', orgList);
  if (memErr) throw new Error(memErr.message);
  for (const row of members || []) {
    if (row.user_id) ids.add(row.user_id);
  }

  const { data: orgProfiles, error: pErr } = await service
    .from('profiles')
    .select('id')
    .in('organisation_id', orgList);
  if (pErr) throw new Error(pErr.message);
  for (const row of orgProfiles || []) {
    if (row.id) ids.add(row.id);
  }

  return [...ids];
}

async function userIdsForHub(service, hubId) {
  const { data, error } = await service
    .from('hub_memberships')
    .select('user_id')
    .eq('organisation_id', hubId);
  if (error) throw new Error(error.message);
  return (data || []).map((r) => r.user_id).filter(Boolean);
}

export async function GET(request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;

    const ip = getClientIp(request);
    const rl = assertRateLimit(`users-list:${admin.userId}:${ip || 'x'}`, {
      limit: 60,
      windowMs: 60_000,
    });
    if (!rl.ok) return rl.response;

    const service = createServiceClient();
    if (!service) {
      return jsonResponse({ error: 'Server configuration error.' }, 500);
    }

    const params = parseUsersListParams(new URL(request.url).searchParams);

    // Non–full-admins may only filter hubs they administer
    if (params.hub && !isFullUserAdmin(admin.profile)) {
      const { data: own, error: ownErr } = await service
        .from('hub_memberships')
        .select('organisation_id')
        .eq('user_id', admin.userId)
        .eq('organisation_id', params.hub)
        .eq('role', 'hub_administrator')
        .maybeSingle();
      if (ownErr) return jsonResponse({ error: ownErr.message }, 400);
      const orgMatch = admin.profile?.organisation_id === params.hub;
      if (!own && !orgMatch) {
        return jsonResponse({ error: 'Forbidden. Hub not in your scope.' }, 403);
      }
    }

    const actorScope = await resolveActorScopeUserIds(service, admin);
    const hubScope = params.hub ? await userIdsForHub(service, params.hub) : null;
    const finalIds = intersectIdLists(actorScope, hubScope);

    if (Array.isArray(finalIds) && finalIds.length === 0) {
      return jsonResponse({
        users: [],
        total: 0,
        page: params.page,
        pageSize: params.pageSize,
        activeAdminCount: 0,
        scope: isFullUserAdmin(admin.profile) ? 'global' : 'hub',
      });
    }

    let query = service.from('profiles').select('*', { count: 'exact' });
    if (finalIds) query = query.in('id', finalIds);
    if (params.role) query = query.eq('role', params.role);
    if (params.status) query = query.eq('status', params.status);

    const searchOr = buildProfileSearchOrFilter(params.q);
    if (searchOr) query = query.or(searchOr);

    query = query
      .order(params.sort, { ascending: params.ascending, nullsFirst: false })
      .range(params.from, params.to);

    const { data, error, count } = await query;
    if (error) return jsonResponse({ error: error.message }, 400);

    const users = data || [];
    const userIds = users.map((u) => u.id);

    let membershipsByUser = {};
    if (userIds.length > 0) {
      const { data: memberships, error: memErr } = await service
        .from('hub_memberships')
        .select('user_id, organisation_id, role')
        .in('user_id', userIds);
      if (memErr) return jsonResponse({ error: memErr.message }, 400);
      for (const m of memberships || []) {
        if (!membershipsByUser[m.user_id]) membershipsByUser[m.user_id] = [];
        membershipsByUser[m.user_id].push({
          organisation_id: m.organisation_id,
          role: m.role,
        });
      }
    }

    const enriched = users.map((u) => ({
      ...u,
      hub_memberships: membershipsByUser[u.id] || [],
      hub_ids: (membershipsByUser[u.id] || []).map((m) => m.organisation_id),
    }));

    const { count: activeAdminCount, error: adminCountErr } = await service
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .in('role', ['admin', 'superuser', 'super_admin'])
      .neq('status', 'suspended')
      .is('anonymised_at', null);
    if (adminCountErr) {
      console.warn('activeAdminCount:', adminCountErr.message);
    }

    return jsonResponse({
      users: enriched,
      total: count ?? enriched.length,
      page: params.page,
      pageSize: params.pageSize,
      activeAdminCount: activeAdminCount ?? 0,
      scope: isFullUserAdmin(admin.profile) ? 'global' : 'hub',
    });
  } catch (e) {
    console.error('users/list error:', e);
    return jsonResponse(
      { error: e instanceof Error ? e.message : 'Failed to list users' },
      500,
    );
  }
}
