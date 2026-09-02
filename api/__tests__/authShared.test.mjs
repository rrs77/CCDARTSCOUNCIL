/**
 * Auth helper unit tests (pure functions).
 * Run: node --test api/__tests__/authShared.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canManageUsers,
  canViewGlobalAnalytics,
  canViewOrgAnalytics,
  assertRateLimit,
} from '../_authShared.js';

describe('permissions', () => {
  it('admin can manage users', () => {
    assert.equal(canManageUsers({ role: 'admin', status: 'active' }), true);
  });

  it('teacher cannot manage users without flag', () => {
    assert.equal(canManageUsers({ role: 'teacher', status: 'active' }), false);
    assert.equal(
      canManageUsers({ role: 'teacher', status: 'active', can_manage_users: true }),
      true,
    );
  });

  it('organisation can view org analytics with org id', () => {
    assert.equal(
      canViewOrgAnalytics({
        role: 'organisation',
        status: 'active',
        organisation_id: 'jazznorth',
      }),
      true,
    );
    assert.equal(
      canViewGlobalAnalytics({
        role: 'organisation',
        status: 'active',
        organisation_id: 'jazznorth',
      }),
      false,
    );
  });

  it('super_admin can manage users and view global analytics', () => {
    assert.equal(canManageUsers({ role: 'super_admin', status: 'active' }), true);
    assert.equal(canViewGlobalAnalytics({ role: 'super_admin', status: 'active' }), true);
  });
});

describe('assertRateLimit', () => {
  it('allows under limit then blocks', () => {
    const key = `test-${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      assert.equal(assertRateLimit(key, { limit: 3, windowMs: 60_000 }).ok, true);
    }
    assert.equal(assertRateLimit(key, { limit: 3, windowMs: 60_000 }).ok, false);
  });
});
