/**
 * POST /api/year-groups/request-access
 *
 * Authenticated teacher (or any signed-in user) with a non-null organisation_id
 * asks org admins to assign allowed_year_groups. Creates an audit/request row,
 * in-app app_notifications for same-org admins, and optional email via Resend.
 *
 * Never updates profiles / allowed_year_groups. Rate-limited to once per 24h
 * per requester (DB-backed).
 */

import {
  createServiceClient,
  jsonResponse,
  loadProfile,
  optionsResponse,
  requireAuth,
} from '../../../api/_authShared.js';
import {
  processYearGroupAccessRequest,
  YEAR_GROUP_ACCESS_COOLDOWN_MS,
} from '../../../api/_yearGroupAccess.js';
import {
  sendResendEmail,
  yearGroupAccessRequestEmail,
} from '../../../api/_emailTemplates.js';

function appUsersSettingsUrl() {
  const base =
    process.env.APP_BASE_URL ||
    process.env.VITE_APP_URL ||
    process.env.VITE_VERCEL_URL ||
    'https://www.ccdesigner.co.uk';
  return `${String(base).replace(/\/$/, '')}/settings/users`;
}

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const service = createServiceClient();
    if (!service) return jsonResponse({ error: 'Server configuration error.' }, 500);

    const requester = await loadProfile(auth.userId);
    if (!requester || requester.anonymised_at) {
      return jsonResponse({ error: 'Forbidden.' }, 403);
    }
    const status = requester.status == null ? 'active' : String(requester.status);
    if (status === 'suspended') {
      return jsonResponse({ error: 'Forbidden.' }, 403);
    }

    const result = await processYearGroupAccessRequest({
      requester: {
        id: auth.userId,
        email: requester.email,
        display_name: requester.display_name,
        organisation_id: requester.organisation_id,
      },
      getLatestRequest: async (requesterId) => {
        const { data, error } = await service
          .from('year_group_access_requests')
          .select('id, created_at')
          .eq('requester_id', requesterId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data;
      },
      insertRequest: async (row) => {
        const { data, error } = await service
          .from('year_group_access_requests')
          .insert(row)
          .select('id, created_at')
          .single();
        if (error) throw new Error(error.message);
        return data;
      },
      listOrgProfiles: async (organisationId) => {
        const { data, error } = await service
          .from('profiles')
          .select(
            'id, email, display_name, role, status, organisation_id, can_manage_users, anonymised_at',
          )
          .eq('organisation_id', organisationId);
        if (error) throw new Error(error.message);
        return data || [];
      },
      insertNotifications: async (rows) => {
        const { error } = await service.from('app_notifications').insert(rows);
        if (error) throw new Error(error.message);
      },
      // Intentionally unused — exposed so tests prove grants never happen.
      updateProfile: undefined,
      sendEmail: async ({ to, admin, requester: req }) => {
        const mail = yearGroupAccessRequestEmail({
          adminDisplayName: admin.display_name,
          requesterDisplayName: req.display_name,
          requesterEmail: req.email,
          settingsUsersUrl: appUsersSettingsUrl(),
        });
        return sendResendEmail({ to, ...mail });
      },
    });

    const headers =
      result.status === 429
        ? { 'Retry-After': String(Math.ceil(YEAR_GROUP_ACCESS_COOLDOWN_MS / 1000)) }
        : undefined;
    return jsonResponse(result.body, result.status, headers);
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : 'Request failed.' },
      500,
    );
  }
}
