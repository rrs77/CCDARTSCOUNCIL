/**
 * Year-group access request helpers.
 *
 * Teachers with NULL/empty allowed_year_groups keep owner-scoped create/use.
 * Request access only notifies same-org admins — never grants or updates
 * profiles.allowed_year_groups.
 *
 * Rate limit is atomic via claimSlot (DB RPC claim_year_group_access_slot).
 */

export const YEAR_GROUP_ACCESS_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const YEAR_GROUP_ACCESS_EMAIL_CAP = 20;

export const YEAR_GROUP_ACCESS_NOTICE =
  "You haven't been given any year groups yet. You can still create your own activities and plans. Ask your school admin for access to year-group shared plans.";

export const YEAR_GROUP_ACCESS_KIND = 'year_group_access_request';

/** True when the profile has at least one non-blank year group. */
export function hasAssignedYearGroups(allowedYearGroups) {
  if (!Array.isArray(allowedYearGroups)) return false;
  return allowedYearGroups.some((y) => String(y ?? '').trim().length > 0);
}

export function orgIdOf(profile) {
  const org =
    typeof profile?.organisation_id === 'string' ? profile.organisation_id.trim() : '';
  return org || null;
}

export function isActiveProfile(profile) {
  if (!profile) return false;
  if (profile.anonymised_at) return false;
  const status = profile.status == null ? 'active' : String(profile.status);
  return status !== 'suspended';
}

/** School/org managers who should receive access requests. */
export function isOrgAdminForNotify(profile) {
  if (!isActiveProfile(profile)) return false;
  const role = profile.role || '';
  return (
    role === 'admin' ||
    role === 'superuser' ||
    role === 'super_admin' ||
    profile.can_manage_users === true
  );
}

/**
 * Keep only active same-org admins, excluding the requester.
 * Other organisations must never be included even if present in the candidate list.
 */
export function selectOrgAdminsToNotify(candidates, { organisationId, excludeUserId }) {
  const org = typeof organisationId === 'string' ? organisationId.trim() : '';
  if (!org) return [];
  return (Array.isArray(candidates) ? candidates : []).filter((p) => {
    if (!p || p.id === excludeUserId) return false;
    if (orgIdOf(p) !== org) return false;
    return isOrgAdminForNotify(p);
  });
}

/** Cap email/notify recipients (deterministic: first N after filter). */
export function capNotifyRecipients(admins, cap = YEAR_GROUP_ACCESS_EMAIL_CAP) {
  const list = Array.isArray(admins) ? admins : [];
  const limit = Number.isFinite(cap) && cap > 0 ? Math.floor(cap) : YEAR_GROUP_ACCESS_EMAIL_CAP;
  return list.slice(0, limit);
}

export function buildAccessRequestNotification({ requester, organisationId }) {
  const name =
    (typeof requester?.display_name === 'string' && requester.display_name.trim()) ||
    (typeof requester?.email === 'string' && requester.email.trim()) ||
    'A teacher';
  const title = 'Year-group access requested';
  const body = `${name} asked for year-group access so they can use year-group shared plans. Assign year groups in Settings → Users. Their own activities and plans stay available meanwhile.`;
  return {
    kind: YEAR_GROUP_ACCESS_KIND,
    title,
    body,
    organisation_id: organisationId,
    meta: {
      requester_id: requester?.id ?? null,
      requester_email: requester?.email ?? null,
      grants_allowed_year_groups: false,
    },
  };
}

/**
 * Process a year-group access request with injectable I/O (for tests).
 *
 * Guarantees:
 * - never calls updateProfile / never mutates allowed_year_groups
 * - only notifies admins returned by selectOrgAdminsToNotify (same org)
 * - rate-limits via claimSlot (atomic); no row / falsy ⇒ 429
 * - emails via Promise.allSettled, capped at YEAR_GROUP_ACCESS_EMAIL_CAP
 */
export async function processYearGroupAccessRequest({
  requester,
  claimSlot,
  insertRequest,
  listOrgProfiles,
  insertNotifications,
  sendEmail,
  /** @deprecated Never used — accepted so tests can assert grants are impossible. */
  updateProfile: _updateProfile,
  emailCap = YEAR_GROUP_ACCESS_EMAIL_CAP,
}) {
  void _updateProfile;

  if (hasAssignedYearGroups(requester?.allowed_year_groups)) {
    return {
      ok: false,
      status: 409,
      body: { error: 'You already have year groups assigned.' },
      notifiedAdminIds: [],
      emailsAttempted: 0,
      profileMutations: 0,
    };
  }

  const organisationId = orgIdOf(requester);
  if (!organisationId) {
    return {
      ok: false,
      status: 400,
      body: { error: 'Your profile needs an organisation_id before requesting year-group access.' },
      notifiedAdminIds: [],
      emailsAttempted: 0,
      profileMutations: 0,
    };
  }

  const claimedAt = await claimSlot(requester.id);
  if (!claimedAt) {
    return {
      ok: false,
      status: 429,
      body: {
        error: 'You already requested access recently. Please wait 24 hours before asking again.',
        retry_after_hours: 24,
      },
      notifiedAdminIds: [],
      emailsAttempted: 0,
      profileMutations: 0,
    };
  }

  const requestRow = await insertRequest({
    requester_id: requester.id,
    organisation_id: organisationId,
  });

  const candidates = await listOrgProfiles(organisationId);
  const admins = capNotifyRecipients(
    selectOrgAdminsToNotify(candidates, {
      organisationId,
      excludeUserId: requester.id,
    }),
    emailCap,
  );

  const note = buildAccessRequestNotification({ requester, organisationId });
  const notificationRows = admins.map((admin) => ({
    user_id: admin.id,
    organisation_id: organisationId,
    kind: note.kind,
    title: note.title,
    body: note.body,
    meta: { ...note.meta, request_id: requestRow?.id ?? null },
  }));

  if (notificationRows.length) {
    await insertNotifications(notificationRows);
  }

  const notifiedAdminIds = admins.map((a) => a.id);
  let emailsAttempted = 0;
  if (typeof sendEmail === 'function') {
    const jobs = admins
      .filter((admin) => admin.email)
      .map((admin) => {
        emailsAttempted += 1;
        return Promise.resolve(
          sendEmail({
            to: admin.email,
            admin,
            requester,
            organisationId,
          }),
        );
      });
    await Promise.allSettled(jobs);
  }

  return {
    ok: true,
    status: 200,
    body: {
      ok: true,
      notified: notifiedAdminIds.length,
      granted: false,
      allowed_year_groups_unchanged: true,
    },
    notifiedAdminIds,
    emailsAttempted,
    profileMutations: 0,
    requestId: requestRow?.id ?? null,
    claimedAt,
  };
}

/**
 * In-memory stand-in for claim_year_group_access_slot used by parallel tests.
 * Only the first successful claim within the cooldown window returns a timestamp.
 */
export function createMemoryClaimSlot({ cooldownMs = YEAR_GROUP_ACCESS_COOLDOWN_MS } = {}) {
  const lastByUser = new Map();
  return async function claimSlot(requesterId) {
    const now = Date.now();
    const prev = lastByUser.get(requesterId);
    if (prev != null && now - prev < cooldownMs) {
      return null;
    }
    lastByUser.set(requesterId, now);
    return new Date(now).toISOString();
  };
}
