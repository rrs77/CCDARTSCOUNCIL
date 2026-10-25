/**
 * Org-level AI add-on entitlement (extra-cost).
 * Stored as organisations.ai_addon (boolean). Independent of Free/Full plan
 * and of organisations.paid (partner-hub branding).
 *
 * Access: super_admin/superuser (from profiles.role via loadProfile) OR org.ai_addon.
 * Never trust client body/header/claim fields for role or entitlement.
 */

import {
  createServiceClient,
  isSuspended,
  isSuperAdminProfile,
  jsonResponse,
  loadProfile,
} from './_authShared.js';

export const AI_ADDON_REQUIRED_CODE = 'ai_addon_required';
export const AI_ADDON_REQUIRED_MESSAGE = 'AI add-on required';

/** Pure check used by tests and route handlers. */
export function orgHasAiAddon(orgRow) {
  return Boolean(orgRow && orgRow.ai_addon === true);
}

/**
 * Pure entitlement decision — profile must come from server loadProfile(userId).
 * Any clientClaims / bodyRole / headerRole arguments are ignored (spoof resistance).
 *
 * @param {{
 *   profile: { role?: string, status?: string, anonymised_at?: string | null, organisation_id?: string | null } | null,
 *   orgRow?: { ai_addon?: boolean } | null,
 *   clientClaims?: unknown,
 *   bodyRole?: unknown,
 *   headerRole?: unknown,
 * }} input
 */
export function decideAiAddonAccess({
  profile,
  orgRow = null,
  clientClaims = undefined,
  bodyRole = undefined,
  headerRole = undefined,
}) {
  // Explicitly discard spoof surfaces — never read these for entitlement.
  void clientClaims;
  void bodyRole;
  void headerRole;

  // Super admins: isSuperAdminProfile already requires active + non-anonymised.
  if (isSuperAdminProfile(profile)) {
    return { allowed: true, reason: 'super_admin', aiAddon: true };
  }
  // Ordinary users: deny missing / suspended / anonymised before org lookup.
  if (!profile || isSuspended(profile)) {
    return { allowed: false, reason: 'suspended_or_missing', aiAddon: false };
  }
  if (orgHasAiAddon(orgRow)) {
    return { allowed: true, reason: 'org_ai_addon', aiAddon: true };
  }
  return { allowed: false, reason: 'ai_addon_required', aiAddon: false };
}

function deniedResponse() {
  return jsonResponse(
    {
      error: AI_ADDON_REQUIRED_MESSAGE,
      message: AI_ADDON_REQUIRED_MESSAGE,
      code: AI_ADDON_REQUIRED_CODE,
      available: false,
      aiAddon: false,
    },
    403,
  );
}

/**
 * Server gate for AI routes. Loads profile by authenticated userId only.
 * Optional requestBody is accepted solely so tests can prove spoofed role fields
 * are ignored — it is never used for the decision.
 *
 * @returns {Promise<
 *   | { ok: true, profile: object | null, organisationId: string | null, aiAddon: true, reason: string }
 *   | { ok: false, response: Response, aiAddon: false, reason: string, profile?: object | null, organisationId?: string | null }
 * >}
 */
export async function requireAiAddon(userId, requestBody = null) {
  void requestBody; // spoof surface — ignored

  if (!userId) {
    return {
      ok: false,
      aiAddon: false,
      reason: 'unauthenticated',
      response: deniedResponse(),
    };
  }

  const profile = await loadProfile(userId);

  if (isSuperAdminProfile(profile)) {
    return {
      ok: true,
      profile,
      organisationId: profile?.organisation_id ? String(profile.organisation_id) : null,
      aiAddon: true,
      reason: 'super_admin',
    };
  }

  // Ordinary users: deny before org lookup when profile is missing or suspended.
  if (!profile || isSuspended(profile)) {
    return {
      ok: false,
      aiAddon: false,
      reason: 'suspended_or_missing',
      profile: profile || null,
      organisationId: null,
      response: deniedResponse(),
    };
  }

  const organisationId = profile?.organisation_id ? String(profile.organisation_id).trim() : '';
  if (!organisationId) {
    return {
      ok: false,
      aiAddon: false,
      reason: 'no_organisation',
      profile,
      organisationId: null,
      response: deniedResponse(),
    };
  }

  const service = createServiceClient();
  if (!service) {
    return {
      ok: false,
      aiAddon: false,
      reason: 'server_misconfigured',
      profile,
      organisationId,
      response: deniedResponse(),
    };
  }

  const { data: org, error } = await service
    .from('organisations')
    .select('id, ai_addon')
    .eq('id', organisationId)
    .maybeSingle();

  const decision = decideAiAddonAccess({
    profile,
    orgRow: error ? null : org,
    clientClaims: requestBody,
    bodyRole: requestBody && typeof requestBody === 'object' ? requestBody.role : undefined,
  });

  if (!decision.allowed) {
    return {
      ok: false,
      aiAddon: false,
      reason: error ? 'lookup_failed' : decision.reason,
      profile,
      organisationId,
      response: deniedResponse(),
    };
  }

  return {
    ok: true,
    profile,
    organisationId,
    aiAddon: true,
    reason: decision.reason,
  };
}

/** Non-throwing entitlement probe for GET availability responses. */
export async function probeAiAddon(userId) {
  try {
    const result = await requireAiAddon(userId);
    return {
      aiAddon: result.aiAddon === true,
      reason: result.reason || (result.aiAddon ? 'ok' : 'denied'),
    };
  } catch {
    return { aiAddon: false, reason: 'error' };
  }
}
