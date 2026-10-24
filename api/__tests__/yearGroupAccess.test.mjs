/**
 * Year-group access request — atomic claim+record, same-org admins, never grant.
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
  createMemoryClaimAndRecord,
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
  return {
    claimAndRecord: createMemoryClaimAndRecord(),
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
  it('notifies only same-org admins and never grants', async () => {
    const emails = [];
    const result = await processYearGroupAccessRequest({
      requester,
      ...baseDeps({
        sendEmail: async (payload) => {
          emails.push(payload);
        },
      }),
    });
    assert.equal(result.ok, true);
    assert.equal(result.body.granted, false);
    assert.equal(result.profileMutations, 0);
    assert.equal(emails.some((e) => e.to === otherOrgAdmin.email), false);
  });

  it('returns 409 when year groups are already assigned', async () => {
    let claimCalls = 0;
    const result = await processYearGroupAccessRequest({
      requester: { ...requester, allowed_year_groups: ['Year 4'] },
      ...baseDeps({
        claimAndRecord: async () => {
          claimCalls += 1;
          return { requestId: 'x', claimedAt: new Date().toISOString() };
        },
      }),
    });
    assert.equal(result.status, 409);
    assert.equal(claimCalls, 0);
  });

  it('returns 429 when claimAndRecord returns null', async () => {
    const result = await processYearGroupAccessRequest({
      requester,
      ...baseDeps({ claimAndRecord: async () => null }),
    });
    assert.equal(result.status, 429);
  });

  it('20 parallel POSTs send a single round of emails', async () => {
    const claimAndRecord = createMemoryClaimAndRecord();
    const emails = [];
    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        processYearGroupAccessRequest({
          requester,
          claimAndRecord,
          listOrgProfiles: async () => [sameOrgAdmin, sameOrgManager],
          insertNotifications: async () => {},
          sendEmail: async (payload) => {
            emails.push(payload);
          },
        }),
      ),
    );
    assert.equal(results.filter((r) => r.ok).length, 1);
    assert.equal(results.filter((r) => r.status === 429).length, 19);
    assert.equal(emails.length, 2);
  });

  it('releases the slot when request insert fails so the user is not locked 24h', async () => {
    let inserts = 0;
    const claimAndRecord = createMemoryClaimAndRecord({
      insertFn: async () => {
        inserts += 1;
        if (inserts === 1) throw new Error('insert failed');
        return { id: 'req-retry' };
      },
    });

    await assert.rejects(
      () =>
        processYearGroupAccessRequest({
          requester,
          ...baseDeps({ claimAndRecord }),
        }),
      /insert failed/,
    );

    // Second attempt must succeed — slot was released on failure.
    const retry = await processYearGroupAccessRequest({
      requester,
      ...baseDeps({ claimAndRecord }),
    });
    assert.equal(retry.ok, true);
    assert.equal(retry.requestId, 'req-retry');
    assert.equal(inserts, 2);
  });
});

describe('shouldShowYearGroupsAccessNotice', () => {
  const teacher = {
    id: 't1',
    role: 'teacher',
    organisation_id: ORG_A,
    allowed_year_groups: null,
    can_manage_users: false,
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

  it('hides for admin / super_admin', () => {
    for (const role of ['admin', 'super_admin', 'superuser']) {
      assert.equal(
        shouldShowYearGroupsAccessNotice({
          authLoading: false,
          profile: { ...teacher, role },
          isDemo: false,
          dismissed: false,
        }),
        false,
        role,
      );
    }
  });

  it('hides for can_manage_users teachers (matches server admin check)', () => {
    assert.equal(
      shouldShowYearGroupsAccessNotice({
        authLoading: false,
        profile: { ...teacher, role: 'teacher', can_manage_users: true },
        isDemo: false,
        dismissed: false,
      }),
      false,
    );
  });

  it('hides for demo and no-org', () => {
    assert.equal(
      shouldShowYearGroupsAccessNotice({
        authLoading: false,
        profile: teacher,
        isDemo: true,
        dismissed: false,
      }),
      false,
    );
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

  it('270000 drops clash policies and calls ccd_assert_curriculum_policies', () => {
    const sql = readFileSync(
      `${root}/supabase/migrations/20261024270000_half_terms_rls.sql`,
      'utf8',
    );
    assert.match(sql, /DROP POLICY IF EXISTS half_terms_owner_all/);
    assert.match(sql, /DROP POLICY IF EXISTS half_terms_org_shared_read/);
    assert.doesNotMatch(sql, /CREATE POLICY half_terms_owner_all/);
    assert.match(sql, /SELECT public\.ccd_assert_curriculum_policies\(\)/);
  });

  it('280000 defines claim_and_record RPC in one transaction', () => {
    const sql = readFileSync(
      `${root}/supabase/migrations/20261024280000_year_group_access_requests.sql`,
      'utf8',
    );
    assert.match(sql, /claim_and_record_year_group_access/);
    assert.match(sql, /claim_year_group_access_slot/);
    assert.match(sql, /GRANT UPDATE \(is_read\) ON public\.app_notifications TO authenticated/);
  });

  it('request-access uses claim_and_record, no-store, and audits server config 500', () => {
    const src = readFileSync(
      `${root}/server/api/year-groups/request-access.js`,
      'utf8',
    );
    assert.match(src, /claim_and_record_year_group_access/);
    assert.match(src, /Cache-Control': 'private, no-store'/);
    assert.match(src, /server_configuration/);
    assert.match(src, /error: 'Server configuration error\.'/);
    assert.match(src, /error: 'Request failed\.'/);
  });

  it('curriculum_org_rls keeps half_terms DROPs and escaped ccd_ LIKE', () => {
    const sql = readFileSync(`${root}/supabase/tests/curriculum_org_rls.sql`, 'utf8');
    assert.match(sql, /DROP POLICY IF EXISTS half_terms_owner_all/);
    assert.match(sql, /DROP POLICY IF EXISTS half_terms_org_shared_read/);
    assert.match(sql, /NOT LIKE 'ccd\\_%' ESCAPE/);
  });

  it('keeps owner-approved notice wording', () => {
    assert.match(YEAR_GROUP_ACCESS_NOTICE, /haven't been given any year groups/i);
    assert.equal(orgIdOf({ organisation_id: '  ' }), null);
  });
});
