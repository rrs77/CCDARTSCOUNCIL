/**
 * Profile privilege guards (V4 status lock, V5 manager edit scope).
 * Run: node --test api/__tests__/profileGuards.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canManagerEditProfile,
  maySelfUpdateProfileStatus,
  profileRoleRank,
} from '../_authShared.js';

describe('maySelfUpdateProfileStatus (V4)', () => {
  it('allows invited/pending → active (AccountMenu / password gates)', () => {
    assert.equal(maySelfUpdateProfileStatus('invited', 'active'), true);
    assert.equal(maySelfUpdateProfileStatus('pending', 'active'), true);
  });

  it('allows no-op status updates', () => {
    assert.equal(maySelfUpdateProfileStatus('active', 'active'), true);
    assert.equal(maySelfUpdateProfileStatus('invited', 'invited'), true);
  });

  it('denies any change from suspended (blocks self-reactivation)', () => {
    assert.equal(maySelfUpdateProfileStatus('suspended', 'active'), false);
    assert.equal(maySelfUpdateProfileStatus('suspended', 'invited'), false);
  });

  it('denies other self-service status transitions', () => {
    assert.equal(maySelfUpdateProfileStatus('active', 'suspended'), false);
    assert.equal(maySelfUpdateProfileStatus('active', 'invited'), false);
    assert.equal(maySelfUpdateProfileStatus('invited', 'suspended'), false);
  });
});

describe('canManagerEditProfile (V5)', () => {
  const teacherTarget = {
    id: 't1',
    organisation_id: 'ems',
    role: 'teacher',
    status: 'active',
  };

  it('allows super_admin unrestricted edits', () => {
    assert.equal(
      canManagerEditProfile({
        actor: {
          role: 'super_admin',
          status: 'active',
          organisation_id: null,
        },
        targetOld: teacherTarget,
        targetNew: {
          organisation_id: 'jazznorth',
          role: 'admin',
        },
      }),
      true,
    );
  });

  it('allows same-org admin to edit a peer teacher with a lower role', () => {
    assert.equal(
      canManagerEditProfile({
        actor: {
          id: 'admin-1',
          role: 'admin',
          status: 'active',
          organisation_id: 'ems',
        },
        targetOld: teacherTarget,
        targetNew: { role: 'viewer', organisation_id: 'ems' },
      }),
      true,
    );
  });

  it('denies teacher manager editing/suspending a same-org admin (target rank >= actor)', () => {
    assert.equal(
      canManagerEditProfile({
        actor: {
          id: 'mgr-1',
          role: 'teacher',
          status: 'active',
          organisation_id: 'ems',
          can_manage_users: true,
        },
        targetOld: {
          id: 'admin-peer',
          organisation_id: 'ems',
          role: 'admin',
          status: 'active',
          can_manage_users: true,
        },
        targetNew: { status: 'suspended', organisation_id: 'ems' },
      }),
      false,
    );
  });

  it('denies managers changing their own can_* / forum_can_* flags', () => {
    const self = {
      id: 'mgr-1',
      role: 'teacher',
      status: 'active',
      organisation_id: 'ems',
      can_manage_users: true,
      can_edit_activities: false,
      forum_can_moderate: false,
    };
    assert.equal(
      canManagerEditProfile({
        actor: self,
        targetOld: self,
        targetNew: { can_manage_users: false, organisation_id: 'ems' },
      }),
      false,
    );
    assert.equal(
      canManagerEditProfile({
        actor: self,
        targetOld: self,
        targetNew: { forum_can_moderate: true, organisation_id: 'ems' },
      }),
      false,
    );
  });

  it('denies editing users outside the manager org', () => {
    assert.equal(
      canManagerEditProfile({
        actor: { role: 'admin', status: 'active', organisation_id: 'ems' },
        targetOld: { ...teacherTarget, organisation_id: 'jazznorth' },
        targetNew: { organisation_id: 'jazznorth' },
      }),
      false,
    );
  });

  it('denies changing organisation_id to another org', () => {
    assert.equal(
      canManagerEditProfile({
        actor: { role: 'admin', status: 'active', organisation_id: 'ems' },
        targetOld: teacherTarget,
        targetNew: { organisation_id: 'jazznorth' },
      }),
      false,
    );
  });

  it('denies granting roles at or above the actor role', () => {
    assert.equal(
      canManagerEditProfile({
        actor: { role: 'admin', status: 'active', organisation_id: 'ems' },
        targetOld: teacherTarget,
        targetNew: { role: 'admin', organisation_id: 'ems' },
      }),
      false,
    );
    assert.equal(
      profileRoleRank('admin'),
      profileRoleRank('admin'),
    );
  });

  it('denies granting any SUPER_ADMIN_ROLES', () => {
    assert.equal(
      canManagerEditProfile({
        actor: { role: 'admin', status: 'active', organisation_id: 'ems' },
        targetOld: teacherTarget,
        targetNew: { role: 'super_admin', organisation_id: 'ems' },
      }),
      false,
    );
    assert.equal(
      canManagerEditProfile({
        actor: { role: 'admin', status: 'active', organisation_id: 'ems' },
        targetOld: teacherTarget,
        targetNew: { role: 'superuser', organisation_id: 'ems' },
      }),
      false,
    );
  });

  it('allows teacher with can_manage_users to grant only lower ranks', () => {
    assert.equal(
      canManagerEditProfile({
        actor: {
          id: 'mgr-1',
          role: 'teacher',
          status: 'active',
          organisation_id: 'ems',
          can_manage_users: true,
        },
        targetOld: { ...teacherTarget, id: 'viewer-1', role: 'viewer' },
        targetNew: { role: 'student', organisation_id: 'ems' },
      }),
      true,
    );
    assert.equal(
      canManagerEditProfile({
        actor: {
          id: 'mgr-1',
          role: 'teacher',
          status: 'active',
          organisation_id: 'ems',
          can_manage_users: true,
        },
        targetOld: { ...teacherTarget, id: 'viewer-1', role: 'viewer' },
        targetNew: { role: 'teacher', organisation_id: 'ems' },
      }),
      false,
    );
  });

  it('denies teacher manager editing another teacher (peer rank)', () => {
    assert.equal(
      canManagerEditProfile({
        actor: {
          id: 'mgr-1',
          role: 'teacher',
          status: 'active',
          organisation_id: 'ems',
          can_manage_users: true,
        },
        targetOld: teacherTarget,
        targetNew: { status: 'suspended', organisation_id: 'ems' },
      }),
      false,
    );
  });

  it('denies null-org managers and null-org targets', () => {
    assert.equal(
      canManagerEditProfile({
        actor: { role: 'admin', status: 'active', organisation_id: null },
        targetOld: teacherTarget,
        targetNew: { organisation_id: 'ems' },
      }),
      false,
    );
    assert.equal(
      canManagerEditProfile({
        actor: { role: 'admin', status: 'active', organisation_id: 'ems' },
        targetOld: { ...teacherTarget, organisation_id: null },
        targetNew: { organisation_id: 'ems' },
      }),
      false,
    );
  });
});
