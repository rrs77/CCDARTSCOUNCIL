/**
 * Unit tests for users list helpers.
 * Run: node --test api/__tests__/usersShared.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProfileSearchOrFilter,
  intersectIdLists,
  parseUsersListParams,
  sanitizeSearchQuery,
} from '../_usersShared.js';
import { isFullUserAdmin } from '../_authShared.js';

describe('sanitizeSearchQuery', () => {
  it('trims and strips PostgREST-sensitive chars', () => {
    assert.equal(sanitizeSearchQuery('  jane,doe%_  '), 'jane doe');
  });
});

describe('parseUsersListParams', () => {
  it('defaults and clamps pageSize', () => {
    const p = parseUsersListParams(new URLSearchParams(''));
    assert.equal(p.page, 1);
    assert.equal(p.pageSize, 25);
    assert.equal(p.sort, 'created_at');
    assert.equal(p.ascending, false);
    assert.equal(p.from, 0);
    assert.equal(p.to, 24);
  });

  it('parses filters and 1-based pagination', () => {
    const p = parseUsersListParams(
      new URLSearchParams('q=Ada&role=teacher&status=invited&hub=jazznorth&page=3&pageSize=10&sort=email&order=asc'),
    );
    assert.equal(p.q, 'Ada');
    assert.equal(p.role, 'teacher');
    assert.equal(p.status, 'invited');
    assert.equal(p.hub, 'jazznorth');
    assert.equal(p.page, 3);
    assert.equal(p.pageSize, 10);
    assert.equal(p.from, 20);
    assert.equal(p.to, 29);
    assert.equal(p.sort, 'email');
    assert.equal(p.ascending, true);
  });

  it('ignores invalid role/status', () => {
    const p = parseUsersListParams(new URLSearchParams('role=hacker&status=ghost'));
    assert.equal(p.role, null);
    assert.equal(p.status, null);
  });
});

describe('intersectIdLists', () => {
  it('treats null as unrestricted', () => {
    assert.deepEqual(intersectIdLists(null, null), null);
    assert.deepEqual(intersectIdLists(null, ['a', 'b']), ['a', 'b']);
    assert.deepEqual(intersectIdLists(['a', 'b'], null), ['a', 'b']);
  });

  it('intersects when both present', () => {
    assert.deepEqual(intersectIdLists(['a', 'b', 'c'], ['b', 'c', 'd']), ['b', 'c']);
    assert.deepEqual(intersectIdLists(['a'], ['b']), []);
  });
});

describe('buildProfileSearchOrFilter', () => {
  it('returns null for empty', () => {
    assert.equal(buildProfileSearchOrFilter(''), null);
  });

  it('builds or filter', () => {
    const f = buildProfileSearchOrFilter('sam');
    assert.ok(f.includes('email.ilike.%sam%'));
    assert.ok(f.includes('display_name.ilike.%sam%'));
  });
});

describe('isFullUserAdmin', () => {
  it('true for system admins only', () => {
    assert.equal(isFullUserAdmin({ role: 'admin', status: 'active' }), true);
    assert.equal(isFullUserAdmin({ role: 'super_admin', status: 'active' }), true);
    assert.equal(
      isFullUserAdmin({ role: 'teacher', status: 'active', can_manage_users: true }),
      false,
    );
  });
});
