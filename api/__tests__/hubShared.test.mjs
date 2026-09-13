/**
 * Hub permission boundary tests (pure helpers, no credentials).
 * Run: node --test api/__tests__/hubShared.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  HUB_ROLES,
  assertAssignableHubRole,
  hasMinHubRole,
  isSuperAdmin,
  sanitizeHubHtml,
  validateExternalUrl,
} from '../_hubShared.js';
import { isSuperAdminProfile, canManageUsers } from '../_authShared.js';

describe('hub roles', () => {
  it('ranks correctly', () => {
    assert.equal(hasMinHubRole('hub_viewer', 'hub_viewer'), true);
    assert.equal(hasMinHubRole('hub_editor', 'hub_publisher'), false);
    assert.equal(hasMinHubRole('hub_publisher', 'hub_editor'), true);
    assert.equal(hasMinHubRole('hub_administrator', 'hub_publisher'), true);
  });

  it('only allows hub_* assignable roles', () => {
    assert.equal(assertAssignableHubRole('hub_editor', { actorIsSuperAdmin: false }).ok, true);
    assert.equal(assertAssignableHubRole('super_admin', { actorIsSuperAdmin: true }).ok, false);
    assert.equal(assertAssignableHubRole('admin', { actorIsSuperAdmin: true }).ok, false);
    assert.ok(HUB_ROLES.includes('hub_administrator'));
  });
});

describe('super_admin', () => {
  it('treats super_admin and legacy superuser as system super', () => {
    assert.equal(isSuperAdmin({ role: 'super_admin', status: 'active' }), true);
    assert.equal(isSuperAdminProfile({ role: 'superuser', status: 'active' }), true);
    assert.equal(isSuperAdmin({ role: 'admin', status: 'active' }), false);
    assert.equal(isSuperAdmin({ role: 'super_admin', status: 'suspended' }), false);
  });

  it('super_admin can manage users', () => {
    assert.equal(canManageUsers({ role: 'super_admin', status: 'active' }), true);
  });
});

describe('validateExternalUrl', () => {
  it('requires https for publishable links', () => {
    assert.equal(validateExternalUrl('https://www.jazznorth.org/x').ok, true);
    assert.equal(validateExternalUrl('http://example.com/x').ok, false);
    assert.equal(validateExternalUrl('javascript:alert(1)').ok, false);
  });

  it('allows localhost http for drafts only', () => {
    const r = validateExternalUrl('http://localhost:3000/file.pdf', { allowDraftHttp: true });
    assert.equal(r.ok, true);
  });
});

describe('sanitizeHubHtml', () => {
  it('strips script and event handlers', () => {
    const out = sanitizeHubHtml('<p onclick="x()">Hi</p><script>alert(1)</script>');
    assert.equal(out.includes('script'), false);
    assert.equal(out.includes('onclick'), false);
    assert.equal(out.includes('Hi'), true);
  });
});
