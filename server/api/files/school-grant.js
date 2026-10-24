/**
 * POST   /api/files/school-grant  — push licensed resource to whole school
 * DELETE /api/files/school-grant  — revoke school-wide grant
 *
 * Server-only (requireAuth). Grant rows written via service role.
 * Body: { resourceId: string, organisationId?: string }
 * organisationId, if present, must match the caller's org (never cross-org).
 */

import {
  assertRateLimit,
  getClientIp,
  hashIpForStorage,
  jsonResponse,
  loadProfile,
  optionsResponse,
  requireAuth,
} from '../../../api/_authShared.js';
import {
  canPushResourceToSchool,
  loadResourceSchoolPushContext,
  pushResourceToSchool,
  revokeResourceSchoolPush,
  sameOrganisationIds,
} from '../../../api/_dreamhost.js';

export async function OPTIONS(request) {
  return optionsResponse(request);
}

async function parseBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function resourceIdFrom(request, body) {
  if (typeof body?.resourceId === 'string' && body.resourceId.trim()) {
    return body.resourceId.trim();
  }
  try {
    const q = new URL(request.url).searchParams.get('resourceId');
    if (q && q.trim()) return q.trim();
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Resolve target org: caller's org only. Client-supplied organisationId must
 * match; null/empty org denied.
 */
function resolveTargetOrganisationId(actorProfile, body) {
  const actorOrg =
    typeof actorProfile?.organisation_id === 'string'
      ? actorProfile.organisation_id.trim()
      : '';
  if (!actorOrg) return null;

  if (body?.organisationId != null && body.organisationId !== '') {
    const requested = String(body.organisationId).trim();
    if (!requested || !sameOrganisationIds(requested, actorOrg)) {
      return null;
    }
  }
  return actorOrg;
}

async function authorizeSchoolGrant(request) {
  const ip = getClientIp(request) || 'unknown';
  const limited = assertRateLimit(`school-grant:${ip}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!limited.ok) return { ok: false, response: limited.response };

  const auth = await requireAuth(request);
  if (!auth.ok) return auth;

  const profile = await loadProfile(auth.userId);
  if (!profile) {
    return {
      ok: false,
      response: jsonResponse({ error: 'Profile required.' }, 403),
    };
  }

  const body = await parseBody(request);
  const resourceId = resourceIdFrom(request, body);
  if (!resourceId) {
    return {
      ok: false,
      response: jsonResponse({ error: 'resourceId required.' }, 400),
    };
  }

  const targetOrganisationId = resolveTargetOrganisationId(profile, body);
  if (!targetOrganisationId) {
    return {
      ok: false,
      response: jsonResponse(
        {
          error:
            'Forbidden. Push/revoke requires a non-null organisation and cannot target another organisation.',
        },
        403,
      ),
    };
  }

  const ctx = await loadResourceSchoolPushContext({
    resourceId,
    actorId: auth.userId,
    actorOrganisationId: targetOrganisationId,
  });
  if (!ctx) {
    return {
      ok: false,
      response: jsonResponse({ error: 'Resource not found.' }, 404),
    };
  }

  const isPurchaser = ctx.purchaserIds.includes(auth.userId);
  const allowed = canPushResourceToSchool({
    actorProfile: profile,
    resourceOrganisationId: ctx.resourceOrganisationId,
    targetOrganisationId,
    isPurchaser,
    hasCallerLicence: ctx.hasCallerLicence,
    orgHasSchoolLicence: ctx.orgHasSchoolLicence,
  });

  if (!allowed) {
    return {
      ok: false,
      response: jsonResponse(
        {
          error:
            'Forbidden. Only the purchaser or an org admin in the same organisation may push/revoke, and a personal or school licence is required.',
        },
        403,
      ),
    };
  }

  const ipHash = await hashIpForStorage(ip);
  return {
    ok: true,
    userId: auth.userId,
    profile,
    resourceId,
    targetOrganisationId,
    ctx,
    ipHash,
  };
}

export async function POST(request) {
  try {
    const gate = await authorizeSchoolGrant(request);
    if (!gate.ok) return gate.response;

    // First push requires a personal licence (org school licence covers re-push).
    if (!gate.ctx.hasCallerLicence && !gate.ctx.orgHasSchoolLicence) {
      return jsonResponse(
        { error: 'Forbidden. Caller must hold a licence for this resource.' },
        403,
      );
    }

    const result = await pushResourceToSchool({
      resourceId: gate.resourceId,
      organisationId: gate.targetOrganisationId,
      grantedBy: gate.userId,
      ipHash: gate.ipHash,
    });

    return jsonResponse({
      success: true,
      resourceId: gate.resourceId,
      organisationId: gate.targetOrganisationId,
      grantId: result.grantId,
      created: result.created,
    });
  } catch (error) {
    console.error(
      'files/school-grant POST:',
      error instanceof Error ? error.message : error,
    );
    const status =
      error?.status && Number.isFinite(error.status) ? error.status : 500;
    return jsonResponse(
      { error: status === 400 ? error.message : 'Push failed.' },
      status >= 400 && status < 600 ? status : 500,
    );
  }
}

export async function DELETE(request) {
  try {
    const gate = await authorizeSchoolGrant(request);
    if (!gate.ok) return gate.response;

    const result = await revokeResourceSchoolPush({
      resourceId: gate.resourceId,
      organisationId: gate.targetOrganisationId,
      revokedBy: gate.userId,
      ipHash: gate.ipHash,
    });

    return jsonResponse({
      success: true,
      resourceId: gate.resourceId,
      organisationId: gate.targetOrganisationId,
      grantId: result.grantId,
      revoked: true,
    });
  } catch (error) {
    console.error(
      'files/school-grant DELETE:',
      error instanceof Error ? error.message : error,
    );
    const status =
      error?.status && Number.isFinite(error.status) ? error.status : 500;
    return jsonResponse(
      {
        error:
          status === 404
            ? 'No active school grant to revoke.'
            : status === 400
              ? error.message
              : 'Revoke failed.',
      },
      status >= 400 && status < 600 ? status : 500,
    );
  }
}
