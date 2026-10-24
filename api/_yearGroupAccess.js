/**
 * Year-group access request helpers.
 *
 * Teachers with NULL/empty allowed_year_groups keep owner-scoped create/use.
 * Request access only notifies same-org admins — never grants or updates
 * profiles.allowed_year_groups.
 *
 * Rate limit + request row are claimed together via claimAndRecord (DB RPC
 * claim_and_record_year_group_access) so a failed insert cannot lock the user
 * out for 24h with no request row.
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

/** School/org managers who should receive access requests (and not see the teacher notice). */
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
 * claimAndRecord({ requesterId, organisationId }) must atomically claim the
 * 24h slot and insert the request row (or return null on cooldown). If the
 * insert fails, the slot must not remain claimed.
 */
export async function processYearGroupAccessRequest({
  requester,
  claimAndRecord,
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

  let recorded;
  try {
    recorded = await claimAndRecord({
      requesterId: requester.id,
      organisationId,
    });
  } catch (err) {
    // Insert/claim rolled back together — surface as 500; slot must not stick.
    throw err;
  }

  if (!recorded) {
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

  const requestRow = {
    id: recorded.requestId,
    created_at: recorded.claimedAt,
  };

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
    claimedAt: recorded.claimedAt,
  };
}

/**
 * In-memory stand-in for claim_and_record_year_group_access.
 * Claims the slot first (atomic vs parallel callers); if insertFn throws the
 * slot is released so the user is not locked out for 24h.
 */
export function createMemoryClaimAndRecord({
  cooldownMs = YEAR_GROUP_ACCESS_COOLDOWN_MS,
  insertFn,
} = {}) {
  const lastByUser = new Map();
  let seq = 0;
  return async function claimAndRecord({ requesterId, organisationId }) {
    const now = Date.now();
    const prev = lastByUser.get(requesterId);
    if (prev != null && now - prev < cooldownMs) {
      return null;
    }
    // Claim immediately so parallel callers see the cooldown.
    lastByUser.set(requesterId, now);
    const doInsert =
      typeof insertFn === 'function'
        ? insertFn
        : async () => {
            seq += 1;
            return { id: `req-${seq}` };
          };
    try {
      const row = await doInsert({
        requester_id: requesterId,
        organisation_id: organisationId,
      });
      return {
        requestId: row?.id ?? `req-${++seq}`,
        claimedAt: new Date(now).toISOString(),
      };
    } catch (err) {
      // Release slot so a failed insert does not lock the user out.
      if (prev == null) lastByUser.delete(requesterId);
      else lastByUser.set(requesterId, prev);
      throw err;
    }
  };
}

/** @deprecated Prefer createMemoryClaimAndRecord. */
export function createMemoryClaimSlot(opts) {
  const claimAndRecord = createMemoryClaimAndRecord(opts);
  return async function claimSlot(requesterId) {
    const r = await claimAndRecord({
      requesterId,
      organisationId: 'test-org',
    });
    return r?.claimedAt ?? null;
  };
}
