/**
 * Auth helper unit tests (pure functions).
 * Run: node --test api/__tests__/authShared.test.mjs
 */

import { createHmac } from 'node:crypto';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  accessTokenClaimsAreValid,
  canManageUsers,
  canViewGlobalAnalytics,
  canViewOrgAnalytics,
  assertRateLimit,
  isFullUserAdmin,
  requireAuth,
  getBearerToken,
} from '../_authShared.js';

const TEST_SECRET = 'ccd-test-jwt-secret-do-not-use-in-prod';

function b64urlJson(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function signJwt(payload, secret = TEST_SECRET, header = { alg: 'HS256', typ: 'JWT' }) {
  const h = b64urlJson(header);
  const p = b64urlJson(payload);
  const sig = createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url');
  return `${h}.${p}.${sig}`;
}

function authRequest(token, url = 'https://ccd.example/api/test') {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return new Request(url, { headers });
}

function validClaims(extra = {}) {
  const now = Math.floor(Date.now() / 1000);
  return {
    sub: '11111111-1111-4111-8111-111111111111',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'teacher@example.com',
    exp: now + 3600,
    iat: now,
    ...extra,
  };
}

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

  it('isFullUserAdmin is true for system admins only', () => {
    assert.equal(isFullUserAdmin({ role: 'admin', status: 'active' }), true);
    assert.equal(isFullUserAdmin({ role: 'superuser', status: 'active' }), true);
    assert.equal(
      isFullUserAdmin({ role: 'teacher', status: 'active', can_manage_users: true }),
      false,
    );
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

describe('getBearerToken', () => {
  it('reads Authorization header and ignores query by default', () => {
    const req = new Request(
      'https://ccd.example/api/x?access_token=from-query',
      { headers: { Authorization: 'Bearer from-header' } },
    );
    assert.equal(getBearerToken(req), 'from-header');
    assert.equal(getBearerToken(req, { allowQuery: false }), 'from-header');
  });

  it('allows query token only when allowQuery is true', () => {
    const req = new Request('https://ccd.example/api/x?access_token=from-query');
    assert.equal(getBearerToken(req), '');
    assert.equal(getBearerToken(req, { allowQuery: true }), 'from-query');
  });
});

describe('requireAuth JWT claims', () => {
  let prevSecret;
  before(() => {
    prevSecret = process.env.SUPABASE_JWT_SECRET;
    process.env.SUPABASE_JWT_SECRET = TEST_SECRET;
  });
  after(() => {
    if (prevSecret === undefined) delete process.env.SUPABASE_JWT_SECRET;
    else process.env.SUPABASE_JWT_SECRET = prevSecret;
  });

  it('accepts a valid HS256 authenticated token', async () => {
    const token = signJwt(validClaims());
    const result = await requireAuth(authRequest(token));
    assert.equal(result.ok, true);
    assert.equal(result.userId, '11111111-1111-4111-8111-111111111111');
  });

  it('rejects wrong alg', async () => {
    const token = signJwt(validClaims(), TEST_SECRET, { alg: 'none', typ: 'JWT' });
    const result = await requireAuth(authRequest(token));
    assert.equal(result.ok, false);
    assert.equal(result.response.status, 401);
  });

  it('rejects missing aud/role', async () => {
    const token = signJwt(validClaims({ aud: 'anon', role: 'anon' }));
    const result = await requireAuth(authRequest(token));
    assert.equal(result.ok, false);
    assert.equal(result.response.status, 401);
  });

  it('rejects Supabase anon key JWT (role anon) with 401 — PDF/generate parity', async () => {
    // Anon keys are valid HS256 JWTs but must not authorize PDF generation.
    const anonToken = signJwt(
      validClaims({
        role: 'anon',
        aud: 'authenticated',
        sub: '00000000-0000-0000-0000-000000000000',
      }),
    );
    const result = await requireAuth(authRequest(anonToken));
    assert.equal(result.ok, false);
    assert.equal(result.response.status, 401);
    assert.equal(
      accessTokenClaimsAreValid({
        sub: '00000000-0000-0000-0000-000000000000',
        aud: 'authenticated',
        role: 'anon',
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
      false,
    );
  });

  it('rejects expired tokens beyond skew', async () => {
    const token = signJwt(validClaims({ exp: Math.floor(Date.now() / 1000) - 120 }));
    const result = await requireAuth(authRequest(token));
    assert.equal(result.ok, false);
    assert.equal(result.response.status, 401);
  });

  it('accepts tokens within 30s expiry skew', async () => {
    const token = signJwt(validClaims({ exp: Math.floor(Date.now() / 1000) - 10 }));
    const result = await requireAuth(authRequest(token));
    assert.equal(result.ok, true);
  });

  it('rejects bad signatures without throwing', async () => {
    const token = signJwt(validClaims(), 'wrong-secret');
    const result = await requireAuth(authRequest(token));
    assert.equal(result.ok, false);
    assert.equal(result.response.status, 401);
  });

  it('rejects malformed tokens without throwing', async () => {
    const result = await requireAuth(authRequest('not.a.jwt!!!'));
    assert.equal(result.ok, false);
    assert.equal(result.response.status, 401);
  });
});
