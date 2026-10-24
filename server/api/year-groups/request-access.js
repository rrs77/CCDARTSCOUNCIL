/**
 * POST /api/year-groups/request-access
 *
 * Authenticated user with a non-null organisation_id asks org admins to assign
 * allowed_year_groups. Creates an audit/request row, in-app app_notifications
 * for same-org admins (capped), and optional email via Resend.
 *
 * Never updates profiles / allowed_year_groups. Atomic 24h cooldown + request
 * row via claim_and_record_year_group_access (service_role SECURITY DEFINER).
 */

import {
  assertRateLimit,
  createServiceClient,
  getClientIp,
  hashIpForStorage,
  jsonResponse,
  loadProfile,
  optionsResponse,
  requireAuth,
  writeAuditLog,
} from '../../../api/_authShared.js';
import {
  processYearGroupAccessRequest,
  YEAR_GROUP_ACCESS_COOLDOWN_MS,
} from '../../../api/_yearGroupAccess.js';
import {
  sendResendEmail,
  yearGroupAccessRequestEmail,
} from '../../../api/_emailTemplates.js';

const NO_STORE = { 'Cache-Control': 'private, no-store' };

function appUsersSettingsUrl() {
  const base =
    process.env.APP_BASE_URL ||
    process.env.VITE_APP_URL ||
    process.env.VITE_VERCEL_URL ||
    'https://www.ccdesigner.co.uk';
  return `${String(base).replace(/\/$/, '')}/settings/users`;
}

function respond(body, status, extra = {}) {
  return jsonResponse(body, status, { ...NO_STORE, ...extra });
}

async function audit(request, { actorId, action, organisationId, meta }) {
  const ipHash = await hashIpForStorage(getClientIp(request));
  await writeAuditLog({
    actorId,
    action,
    targetType: 'year_group_access',
    targetId: actorId,
    organisationId: organisationId || null,
    ipHash,
    meta,
  });
}

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request) {
  let actorId = null;
  let organisationId = null;
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) {
      // requireAuth already shaped; still force no-store
      const res = auth.response;
      const headers = new Headers(res.headers);
      headers.set('Cache-Control', 'private, no-store');
      return new Response(res.body, { status: res.status, headers });
    }
    actorId = auth.userId;

    const ip = getClientIp(request);
    const ipRl = assertRateLimit(`year-group-access-ip:${ip || 'x'}`, {
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });
    if (!ipRl.ok) {
      await audit(request, {
        actorId,
        action: 'year_group_access.request_denied_ip_rate',
        organisationId: null,
        meta: { status: 429 },
      });
      return respond(
        { error: 'Too many requests. Please wait and try again.' },
        429,
        { 'Retry-After': '3600' },
      );
    }

    const service = createServiceClient();
    if (!service) {
      await audit(request, {
        actorId,
        action: 'year_group_access.request_error',
        organisationId: null,
        meta: { status: 500, reason: 'server_configuration' },
      });
      return respond({ error: 'Server configuration error.' }, 500);
    }

    const requester = await loadProfile(auth.userId);
    if (!requester || requester.anonymised_at) {
      await audit(request, {
        actorId,
        action: 'year_group_access.request_denied',
        organisationId: null,
        meta: { status: 403, reason: 'forbidden' },
      });
      return respond({ error: 'Forbidden.' }, 403);
    }
    const status = requester.status == null ? 'active' : String(requester.status);
    if (status === 'suspended') {
      await audit(request, {
        actorId,
        action: 'year_group_access.request_denied',
        organisationId: null,
        meta: { status: 403, reason: 'suspended' },
      });
      return respond({ error: 'Forbidden.' }, 403);
    }

    organisationId =
      typeof requester.organisation_id === 'string'
        ? requester.organisation_id.trim() || null
        : null;

    const result = await processYearGroupAccessRequest({
      requester: {
        id: auth.userId,
        email: requester.email,
        display_name: requester.display_name,
        organisation_id: requester.organisation_id,
        allowed_year_groups: requester.allowed_year_groups,
      },
      // Single RPC: claim slot + insert request in one transaction.
      claimAndRecord: async ({ requesterId, organisationId: orgId }) => {
        const { data, error } = await service.rpc('claim_and_record_year_group_access', {
          p_requester_id: requesterId,
          p_organisation_id: orgId,
        });
        if (error) {
          // Never echo the DB message to the client; keep only the SQLSTATE.
          console.error('claim_and_record_year_group_access failed:', error.code, error.message);
          const err = new Error('claim_and_record_year_group_access failed');
          err.code = error.code;
          throw err;
        }
        const row = Array.isArray(data) ? data[0] : data;
        if (!row?.request_id) return null;
        return { requestId: row.request_id, claimedAt: row.claimed_at };
      },
      listOrgProfiles: async (orgId) => {
        const { data, error } = await service
          .from('profiles')
          .select(
            'id, email, display_name, role, status, organisation_id, can_manage_users, anonymised_at',
          )
          .eq('organisation_id', orgId);
        if (error) throw new Error(error.message);
        return data || [];
      },
      insertNotifications: async (rows) => {
        const { error } = await service.from('app_notifications').insert(rows);
        if (error) throw new Error(error.message);
      },
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

    if (result.status === 400 || result.status === 403 || result.status === 429 || result.status === 409) {
      await audit(request, {
        actorId,
        action:
          result.status === 429
            ? 'year_group_access.request_rate_limited'
            : result.status === 409
              ? 'year_group_access.request_already_assigned'
              : 'year_group_access.request_denied',
        organisationId,
        meta: { status: result.status },
      });
    } else if (result.ok) {
      await audit(request, {
        actorId,
        action: 'year_group_access.request',
        organisationId,
        meta: {
          status: 200,
          notified: result.notifiedAdminIds?.length ?? 0,
          request_id: result.requestId ?? null,
        },
      });
    }

    const extra =
      result.status === 429
        ? { 'Retry-After': String(Math.ceil(YEAR_GROUP_ACCESS_COOLDOWN_MS / 1000)) }
        : {};
    return respond(result.body, result.status, extra);
  } catch (e) {
    console.error(
      'year-groups/request-access failed:',
      e instanceof Error ? e.stack || e.message : e,
    );
    if (actorId) {
      await audit(request, {
        actorId,
        action: 'year_group_access.request_error',
        organisationId,
        meta: { status: 500 },
      }).catch(() => {});
    }
    return respond({ error: 'Request failed.' }, 500);
  }
}
