/**
 * List hubs the caller can administer / view.
 * GET /api/hubs
 * Super admin: all hubs (optional ?q=&status=)
 * Hub member: memberships only
 */

import {
  createServiceClient,
  isSuperAdminProfile,
  jsonResponse,
  loadProfile,
  optionsResponse,
  requireAuth,
  isSuspended,
} from '../_authShared.js';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const profile = await loadProfile(auth.userId);
    if (!profile || isSuspended(profile)) {
      return jsonResponse({ error: 'Forbidden.' }, 403);
    }

    const service = createServiceClient();
    if (!service) {
      return jsonResponse({ error: 'Server misconfigured.' }, 500);
    }

    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    const status = url.searchParams.get('status');

    if (isSuperAdminProfile(profile)) {
      let query = service.from('organisations').select('*').order('display_name');
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) return jsonResponse({ error: error.message }, 500);
      let hubs = data || [];
      if (q) {
        hubs = hubs.filter(
          (h) =>
            h.display_name?.toLowerCase().includes(q) ||
            h.slug?.toLowerCase().includes(q) ||
            h.short_name?.toLowerCase().includes(q),
        );
      }
      return jsonResponse({
        hubs: hubs.map((h) => ({ ...h, hub_role: 'hub_administrator', is_super_admin: true })),
        is_super_admin: true,
      });
    }

    const { data: memberships, error: mErr } = await service
      .from('hub_memberships')
      .select('role, organisation_id, organisations(*)')
      .eq('user_id', auth.userId);
    if (mErr) return jsonResponse({ error: mErr.message }, 500);

    let hubs = (memberships || [])
      .filter((m) => m.organisations)
      .map((m) => ({
        ...m.organisations,
        hub_role: m.role,
        is_super_admin: false,
      }));

    if (status) hubs = hubs.filter((h) => h.status === status);
    if (q) {
      hubs = hubs.filter(
        (h) =>
          h.display_name?.toLowerCase().includes(q) ||
          h.slug?.toLowerCase().includes(q),
      );
    }

    return jsonResponse({ hubs, is_super_admin: false });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: 'Failed to list hubs.' }, 500);
  }
}
