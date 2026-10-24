/**
 * Year-group access request — notify same-org admins only; never grant.
 * Run: node --test api/__tests__/yearGroupAccess.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  YEAR_GROUP_ACCESS_COOLDOWN_MS,
  YEAR_GROUP_ACCESS_NOTICE,
  hasAssignedYearGroups,
  isWithinRequestCooldown,
  orgIdOf,
  processYearGroupAccessRequest,
  selectOrgAdminsToNotify,
} from '../_yearGroupAccess.js';

const ORG_A = 'school-a';
const ORG_B = 'school-b';
const NOW = new Date('2026-10-24T12:00:00.000Z');

const requester = {
  id: 'teacher-1',
  email: 'teacher@school-a.test',
  display_name: 'Taylor Teacher',
  organisation_id: ORG_A,
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

describe('hasAssignedYearGroups', () => {
  it('treats null and empty as no access', () => {
    assert.equal(hasAssignedYearGroups(null), false);
    assert.equal(hasAssignedYearGroups(undefined), false);
    assert.equal(hasAssignedYearGroups([]), false);
    assert.equal(hasAssignedYearGroups(['', '  ']), false);
  });

  it('accepts a non-blank year group', () => {
    assert.equal(hasAssignedYearGroups(['Year 5']), true);
    assert.equal(hasAssignedYearGroups(['', 'Year 3']), true);
  });
});

describe('selectOrgAdminsToNotify', () => {
  it('includes same-org admins and can_manage_users; excludes other-org and peers', () => {
    const selected = selectOrgAdminsToNotify(
      [sameOrgAdmin, sameOrgManager, otherOrgAdmin, sameOrgTeacher, requester],
      { organisationId: ORG_A, excludeUserId: requester.id },
    );
    assert.deepEqual(
      selected.map((p) => p.id).sort(),
      [sameOrgAdmin.id, sameOrgManager.id].sort(),
    );
  });

  it('returns empty when organisation_id is missing', () => {
    assert.deepEqual(
      selectOrgAdminsToNotify([sameOrgAdmin], { organisationId: null, excludeUserId: 'x' }),
      [],
    );
  });

  it('excludes suspended / anonymised admins', () => {
    const selected = selectOrgAdminsToNotify(
      [
        { ...sameOrgAdmin, status: 'suspended' },
        { ...sameOrgManager, anonymised_at: '2026-01-01T00:00:00.000Z' },
      ],
      { organisationId: ORG_A, excludeUserId: requester.id },
    );
    assert.equal(selected.length, 0);
  });
});

describe('isWithinRequestCooldown', () => {
  it('blocks within 24h and allows after', () => {
    const recent = new Date(NOW.getTime() - 60 * 60 * 1000).toISOString();
    const old = new Date(NOW.getTime() - YEAR_GROUP_ACCESS_COOLDOWN_MS - 1000).toISOString();
    assert.equal(isWithinRequestCooldown(recent, NOW.getTime()), true);
    assert.equal(isWithinRequestCooldown(old, NOW.getTime()), false);
    assert.equal(isWithinRequestCooldown(null, NOW.getTime()), false);
  });
});

describe('processYearGroupAccessRequest', () => {
  it('notifies only same-org admins and never grants allowed_year_groups', async () => {
    const profileUpdates = [];
    const emails = [];
    const notifications = [];
    let insertedRequest = null;

    const result = await processYearGroupAccessRequest({
      requester,
      now: NOW,
      getLatestRequest: async () => null,
      insertRequest: async (row) => {
        insertedRequest = { id: 'req-1', ...row };
        return insertedRequest;
      },
      listOrgProfiles: async (orgId) => {
        assert.equal(orgId, ORG_A);
        // Deliberately include other-org admin in the candidate set — must be filtered out.
        return [sameOrgAdmin, sameOrgManager, otherOrgAdmin, sameOrgTeacher];
      },
      insertNotifications: async (rows) => {
        notifications.push(...rows);
      },
      updateProfile: async (patch) => {
        profileUpdates.push(patch);
      },
      sendEmail: async (payload) => {
        emails.push(payload);
      },
    });

    assert.equal(result.ok, true);
    assert.equal(result.status, 200);
    assert.equal(result.body.granted, false);
    assert.equal(result.body.allowed_year_groups_unchanged, true);
    assert.equal(result.profileMutations, 0);
    assert.equal(profileUpdates.length, 0);
    assert.ok(insertedRequest);
    assert.equal(insertedRequest.organisation_id, ORG_A);
    assert.equal(insertedRequest.requester_id, requester.id);

    assert.deepEqual(result.notifiedAdminIds.sort(), [sameOrgAdmin.id, sameOrgManager.id].sort());
    assert.equal(notifications.length, 2);
    for (const n of notifications) {
      assert.equal(n.organisation_id, ORG_A);
      assert.equal(n.meta.grants_allowed_year_groups, false);
      assert.notEqual(n.user_id, otherOrgAdmin.id);
    }
    assert.equal(
      notifications.some((n) => n.user_id === otherOrgAdmin.id),
      false,
    );

    assert.equal(emails.length, 2);
    assert.equal(
      emails.some((e) => e.to === otherOrgAdmin.email),
      false,
    );
  });

  it('does not notify other-org admins even when listOrgProfiles is mis-scoped', async () => {
    const notifications = [];
    const result = await processYearGroupAccessRequest({
      requester,
      now: NOW,
      getLatestRequest: async () => null,
      insertRequest: async (row) => ({ id: 'req-2', ...row }),
      listOrgProfiles: async () => [otherOrgAdmin],
      insertNotifications: async (rows) => {
        notifications.push(...rows);
      },
      sendEmail: async () => {},
    });
    assert.equal(result.ok, true);
    assert.equal(result.notifiedAdminIds.length, 0);
    assert.equal(notifications.length, 0);
  });

  it('rate-limits to once per 24h without writing grants', async () => {
    let insertCalls = 0;
    const result = await processYearGroupAccessRequest({
      requester,
      now: NOW,
      getLatestRequest: async () => ({
        id: 'old',
        created_at: new Date(NOW.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      }),
      insertRequest: async () => {
        insertCalls += 1;
        return { id: 'should-not' };
      },
      listOrgProfiles: async () => [sameOrgAdmin],
      insertNotifications: async () => {},
      updateProfile: async () => {
        throw new Error('updateProfile must not be called');
      },
      sendEmail: async () => {},
    });
    assert.equal(result.ok, false);
    assert.equal(result.status, 429);
    assert.equal(insertCalls, 0);
    assert.equal(result.profileMutations, 0);
  });

  it('rejects when organisation_id is null', async () => {
    const result = await processYearGroupAccessRequest({
      requester: { ...requester, organisation_id: null },
      now: NOW,
      getLatestRequest: async () => null,
      insertRequest: async () => {
        throw new Error('should not insert');
      },
      listOrgProfiles: async () => [],
      insertNotifications: async () => {},
      sendEmail: async () => {},
    });
    assert.equal(result.ok, false);
    assert.equal(result.status, 400);
  });
});

describe('notice copy', () => {
  it('keeps the owner-approved wording', () => {
    assert.match(YEAR_GROUP_ACCESS_NOTICE, /haven't been given any year groups/i);
    assert.match(YEAR_GROUP_ACCESS_NOTICE, /create your own activities and plans/i);
    assert.match(YEAR_GROUP_ACCESS_NOTICE, /Ask your school admin/i);
  });

  it('orgIdOf trims blank organisation ids', () => {
    assert.equal(orgIdOf({ organisation_id: '  ' }), null);
    assert.equal(orgIdOf({ organisation_id: ` ${ORG_A} ` }), ORG_A);
  });
});
