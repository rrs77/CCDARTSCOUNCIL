/**
 * Year-group access request — atomic cooldown, same-org admins only, never grant.
 * Run: node --test api/__tests__/yearGroupAccess.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  YEAR_GROUP_ACCESS_COOLDOWN_MS,
  YEAR_GROUP_ACCESS_EMAIL_CAP,
  YEAR_GROUP_ACCESS_NOTICE,
  capNotifyRecipients,
  createMemoryClaimSlot,
  hasAssignedYearGroups,
  orgIdOf,
  processYearGroupAccessRequest,
  selectOrgAdminsToNotify,
} from '../_yearGroupAccess.js';
import { shouldShowYearGroupsAccessNotice } from '../../artifacts/ccd/src/utils/planner/yearGroupAccessHelpers.mjs';

const ORG_A = 'school-a';
const ORG_B = 'school-b';

const requester = {
  id: 'teacher-1',
  email: 'teacher@school-a.test',
  display_name: 'Taylor Teacher',
  organisation_id: ORG_A,
  allowed_year_groups: null,
};

const sameOrgAdmin = {
  id: 'admin-a',
  email: 'admin@school-a.test',
  display_name: 'Ada Admin',
  role: 'admin',
  status: 'active',
  organisation_id: ORG_A,
  can_manage_users: false,
};

const sameOrgManager = {
  id: 'manager-a',
  email: 'manager@school-a.test',
  display_name: 'Morgan Manager',
  role: 'teacher',
  status: 'active',
  organisation_id: ORG_A,
  can_manage_users: true,
};

const otherOrgAdmin = {
  id: 'admin-b',
  email: 'admin@school-b.test',
  display_name: 'Other Admin',
  role: 'admin',
  status: 'active',
  organisation_id: ORG_B,
  can_manage_users: true,
};

const sameOrgTeacher = {
  id: 'teacher-2',
  email: 'peer@school-a.test',
  display_name: 'Peer Teacher',
  role: 'teacher',
  status: 'active',
  organisation_id: ORG_A,
  can_manage_users: false,
};

function baseDeps(overrides = {}) {
  const claimSlot = createMemoryClaimSlot();
  return {
    claimSlot,
    insertRequest: async (row) => ({ id: 'req-1', ...row }),
    listOrgProfiles: async () => [sameOrgAdmin, sameOrgManager, otherOrgAdmin, sameOrgTeacher],
    insertNotifications: async () => {},
    sendEmail: async () => ({ sent: true }),
    updateProfile: async () => {
      throw new Error('updateProfile must not be called');
    },
    ...overrides,
  };
}

describe('hasAssignedYearGroups', () => {
  it('treats null and empty as no access', () => {
    assert.equal(hasAssignedYearGroups(null), false);
    assert.equal(hasAssignedYearGroups([]), false);
    assert.equal(hasAssignedYearGroups(['', '  ']), false);
  });

  it('accepts a non-blank year group', () => {
    assert.equal(hasAssignedYearGroups(['Year 5']), true);
  });
});

describe('selectOrgAdminsToNotify / cap', () => {
  it('includes same-org admins only', () => {
    const selected = selectOrgAdminsToNotify(
      [sameOrgAdmin, sameOrgManager, otherOrgAdmin, sameOrgTeacher, requester],
      { organisationId: ORG_A, excludeUserId: requester.id },
    );
    assert.deepEqual(
      selected.map((p) => p.id).sort(),
      [sameOrgAdmin.id, sameOrgManager.id].sort(),
    );
  });

  it('caps recipients at 20', () => {
    const many = Array.from({ length: 25 }, (_, i) => ({
      ...sameOrgAdmin,
      id: `admin-${i}`,
      email: `a${i}@school-a.test`,
    }));
    assert.equal(capNotifyRecipients(many).length, YEAR_GROUP_ACCESS_EMAIL_CAP);
  });
});

describe('processYearGroupAccessRequest', () => {
  it('notifies only same-org admins and never grants allowed_year_groups', async () => {
    const profileUpdates = [];
    const emails = [];
    const notifications = [];

    const result = await processYearGroupAccessRequest({
      requester,
      ...baseDeps({
        insertNotifications: async (rows) => {
          notifications.push(...rows);
        },
        updateProfile: async (patch) => {
          profileUpdates.push(patch);
        },
        sendEmail: async (payload) => {
          emails.push(payload);
        },
      }),
    });

    assert.equal(result.ok, true);
    assert.equal(result.status, 200);
    assert.equal(result.body.granted, false);
    assert.equal(result.body.allowed_year_groups_unchanged, true);
    assert.equal(result.profileMutations, 0);
    assert.equal(profileUpdates.length, 0);
    assert.deepEqual(result.notifiedAdminIds.sort(), [sameOrgAdmin.id, sameOrgManager.id].sort());
    assert.equal(notifications.some((n) => n.user_id === otherOrgAdmin.id), false);
    assert.equal(emails.some((e) => e.to === otherOrgAdmin.email), false);
  });

  it('returns 409 when year groups are already assigned (no grant side effects)', async () => {
    let claimCalls = 0;
    const result = await processYearGroupAccessRequest({
      requester: { ...requester, allowed_year_groups: ['Year 4'] },
      ...baseDeps({
        claimSlot: async () => {
          claimCalls += 1;
          return new Date().toISOString();
        },
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.status, 409);
    assert.equal(claimCalls, 0);
  });

  it('returns 429 when claimSlot returns null', async () => {
    const result = await processYearGroupAccessRequest({
      requester,
      ...baseDeps({
        claimSlot: async () => null,
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.status, 429);
  });

  it('rejects when organisation_id is null with 400', async () => {
    const result = await processYearGroupAccessRequest({
      requester: { ...requester, organisation_id: null },
      ...baseDeps(),
    });
    assert.equal(result.ok, false);
    assert.equal(result.status, 400);
  });

  it('20 parallel POSTs send a single round of emails (atomic claim)', async () => {
    const claimSlot = createMemoryClaimSlot({ cooldownMs: YEAR_GROUP_ACCESS_COOLDOWN_MS });
    const emails = [];
    const insertRequestCalls = [];

    const runOnce = () =>
      processYearGroupAccessRequest({
        requester,
        claimSlot,
        insertRequest: async (row) => {
          insertRequestCalls.push(row);
          return { id: `req-${insertRequestCalls.length}`, ...row };
        },
        listOrgProfiles: async () => [sameOrgAdmin, sameOrgManager],
        insertNotifications: async () => {},
        sendEmail: async (payload) => {
          emails.push(payload);
          return { sent: true };
        },
      });

    const results = await Promise.all(Array.from({ length: 20 }, () => runOnce()));
    const successes = results.filter((r) => r.ok);
    const limited = results.filter((r) => r.status === 429);

    assert.equal(successes.length, 1);
    assert.equal(limited.length, 19);
    assert.equal(insertRequestCalls.length, 1);
    // One successful round → two admins emailed once each
    assert.equal(emails.length, 2);
    assert.deepEqual(
      emails.map((e) => e.to).sort(),
      [sameOrgAdmin.email, sameOrgManager.email].sort(),
    );
  });
});

describe('shouldShowYearGroupsAccessNotice', () => {
  const teacher = {
    id: 't1',
    role: 'teacher',
    organisation_id: ORG_A,
    allowed_year_groups: null,
  };

  it('hides while auth is loading (first-login no-flash)', () => {
    assert.equal(
      shouldShowYearGroupsAccessNotice({
        authLoading: true,
        profile: teacher,
        isDemo: false,
        dismissed: false,
      }),
      false,
    );
  });

  it('hides for admin / super_admin even when allowed_year_groups is null', () => {
    for (const role of ['admin', 'super_admin', 'superuser']) {
      assert.equal(
        shouldShowYearGroupsAccessNotice({
          authLoading: false,
          profile: { ...teacher, role, allowed_year_groups: null },
          isDemo: false,
          dismissed: false,
        }),
        false,
        role,
      );
    }
  });

  it('hides for demo sessions', () => {
    assert.equal(
      shouldShowYearGroupsAccessNotice({
        authLoading: false,
        profile: teacher,
        isDemo: true,
        dismissed: false,
      }),
      false,
    );
  });

  it('hides when organisation_id is missing', () => {
    assert.equal(
      shouldShowYearGroupsAccessNotice({
        authLoading: false,
        profile: { ...teacher, organisation_id: null },
        isDemo: false,
        dismissed: false,
      }),
      false,
    );
  });

  it('shows for loaded teacher with org and empty year groups', () => {
    assert.equal(
      shouldShowYearGroupsAccessNotice({
        authLoading: false,
        profile: teacher,
        isDemo: false,
        dismissed: false,
      }),
      true,
    );
  });
});

describe('migration / route hardening source checks', () => {
  const root = fileURLToPath(new URL('../..', import.meta.url));

  it('270000 drops clash half_terms policies (ccd_* only)', () => {
    const sql = readFileSync(
      `${root}/supabase/migrations/20261024270000_half_terms_rls.sql`,
      'utf8',
    );
    assert.match(sql, /DROP POLICY IF EXISTS half_terms_owner_all/);
    assert.match(sql, /DROP POLICY IF EXISTS half_terms_org_shared_read/);
    assert.doesNotMatch(sql, /CREATE POLICY half_terms_owner_all/);
    assert.doesNotMatch(sql, /CREATE POLICY half_terms_org_shared_read/);
  });

  it('280000 defines atomic claim RPC and UPDATE\(is_read\) grant', () => {
    const sql = readFileSync(
      `${root}/supabase/migrations/20261024280000_year_group_access_requests.sql`,
      'utf8',
    );
    assert.match(sql, /year_group_access_last/);
    assert.match(sql, /claim_year_group_access_slot/);
    assert.match(sql, /ON CONFLICT \(requester_id\) DO UPDATE/);
    assert.match(sql, /SET search_path = public, pg_temp/);
    assert.match(sql, /GRANT UPDATE \(is_read\) ON public\.app_notifications TO authenticated/);
    assert.match(sql, /year_group_access_requests_select_org_admin/);
    assert.match(sql, /REVOKE ALL ON FUNCTION public\.claim_year_group_access_slot/);
  });

  it('request-access route uses no-store, generic catch, audit, and Promise.allSettled path', () => {
    const src = readFileSync(
      `${root}/server/api/year-groups/request-access.js`,
      'utf8',
    );
    assert.match(src, /Cache-Control': 'private, no-store'/);
    assert.match(src, /error: 'Request failed\.'/);
    assert.match(src, /console\.error/);
    assert.match(src, /writeAuditLog|hashIpForStorage/);
    assert.match(src, /claim_year_group_access_slot/);
    assert.match(src, /Retry-After/);
  });

  it('process helper uses Promise.allSettled for emails', () => {
    const src = readFileSync(`${root}/api/_yearGroupAccess.js`, 'utf8');
    assert.match(src, /Promise\.allSettled/);
    assert.match(src, /YEAR_GROUP_ACCESS_EMAIL_CAP/);
  });

  it('keeps owner-approved notice wording', () => {
    assert.match(YEAR_GROUP_ACCESS_NOTICE, /haven't been given any year groups/i);
    assert.equal(orgIdOf({ organisation_id: '  ' }), null);
  });

  it('CI workflow includes test-sql-restore-guards', () => {
    const yml = readFileSync(`${root}/.github/workflows/test.yml`, 'utf8');
    assert.match(yml, /test-sql-restore-guards/);
    assert.match(yml, /run_restore_cross_org_guards\.sh/);
  });
});
