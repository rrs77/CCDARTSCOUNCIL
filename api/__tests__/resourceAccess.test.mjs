/**
 * Partner resource entitlement + access code tests.
 * Run: node --test api/__tests__/resourceAccess.test.mjs
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  codeIsRedeemable,
  decideResourceAccess,
  generateAccessCode,
  hashAccessCode,
  normaliseAccessCode,
  verifyAccessCode,
} from '../_resourceAccess.js';
import { POST, GET } from '../router.js';

const NOW = Date.parse('2026-10-13T12:00:00Z');
const locked = { status: 'published', is_active: true, access_level: 'access_code', organisation_id: 'ems' };
const sub = { ...locked, access_level: 'subscription' };

describe('decideResourceAccess', () => {
  it('lets anyone signed in open free and external resources', () => {
    assert.equal(decideResourceAccess({ resource: { access_level: 'free' }, now: NOW }).allowed, true);
    assert.equal(decideResourceAccess({ resource: { access_level: 'external_link' }, now: NOW }).allowed, true);
  });

  it('refuses locked resources without a grant', () => {
    assert.deepEqual(decideResourceAccess({ resource: locked, now: NOW }), { allowed: false, reason: 'code_required' });
    assert.deepEqual(decideResourceAccess({ resource: sub, now: NOW }), { allowed: false, reason: 'subscription_required' });
  });

  it('honours active grants and rejects revoked or expired ones', () => {
    assert.equal(decideResourceAccess({ resource: locked, grant: { source: 'access_code' }, now: NOW }).allowed, true);
    assert.equal(
      decideResourceAccess({ resource: locked, grant: { source: 'access_code', revoked_at: '2026-10-01' }, now: NOW }).allowed,
      false,
    );
    assert.equal(
      decideResourceAccess({ resource: locked, grant: { source: 'access_code', expires_at: '2026-10-12T00:00:00Z' }, now: NOW }).allowed,
      false,
    );
  });

  it('does not let an access-code grant unlock subscription content', () => {
    assert.equal(decideResourceAccess({ resource: sub, grant: { source: 'access_code' }, now: NOW }).allowed, false);
    assert.equal(decideResourceAccess({ resource: sub, grant: { source: 'subscription' }, now: NOW }).allowed, true);
  });

  it('hides unpublished resources from everyone except hub members and super admins', () => {
    const draft = { ...locked, status: 'draft' };
    assert.equal(decideResourceAccess({ resource: draft, grant: { source: 'access_code' }, now: NOW }).reason, 'not_found');
    assert.equal(decideResourceAccess({ resource: draft, hubRole: 'hub_editor', now: NOW }).allowed, true);
    assert.equal(decideResourceAccess({ resource: draft, isSuperAdmin: true, now: NOW }).allowed, true);
    assert.equal(decideResourceAccess({ resource: null, isSuperAdmin: true, now: NOW }).reason, 'not_found');
  });
});

describe('access codes', () => {
  it('generates unambiguous grouped codes', () => {
    const code = generateAccessCode();
    assert.match(code, /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  });

  it('verifies regardless of case, spaces and dashes; rejects others', () => {
    const stored = hashAccessCode('K7QM-4XHP-2RTA');
    assert.equal(normaliseAccessCode(' k7qm 4xhp-2rta '), 'K7QM4XHP2RTA');
    assert.equal(verifyAccessCode('k7qm 4xhp 2rta', stored), true);
    assert.equal(verifyAccessCode('K7QM-4XHP-2RTB', stored), false);
    assert.equal(verifyAccessCode('K7QM-4XHP-2RTA', 'not-a-hash'), false);
  });

  it('only redeems active, unexpired codes under their limit', () => {
    assert.equal(codeIsRedeemable({ active: true }, NOW), true);
    assert.equal(codeIsRedeemable({ active: false }, NOW), false);
    assert.equal(codeIsRedeemable({ active: true, expires_at: '2026-10-01' }, NOW), false);
    assert.equal(codeIsRedeemable({ active: true, max_redemptions: 2, redemption_count: 2 }, NOW), false);
    assert.equal(codeIsRedeemable({ active: true, max_redemptions: 2, redemption_count: 1 }, NOW), true);
  });
});

describe('locked resource routes require sign-in', () => {
  const call = (fn, method, route, body) =>
    fn(
      new Request(`https://ccd.example/api/router?__route=${route}`, {
        method,
        headers: { 'content-type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      }),
    );

  it('resource-access returns 401 without a token (copied URL / direct call)', async () => {
    const res = await call(GET, 'GET', 'music-hubs/resource-access&resourceId=ems-dj-workshop');
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.url, undefined);
  });

  it('redeem-code returns 401 without a token', async () => {
    const res = await call(POST, 'POST', 'music-hubs/redeem-code', { organisationId: 'ems', code: 'AAAA-BBBB-CCCC' });
    assert.equal(res.status, 401);
  });

  it('access-codes returns 401 without a token', async () => {
    const res = await call(GET, 'GET', 'music-hubs/access-codes&organisationId=ems');
    assert.equal(res.status, 401);
  });
});
