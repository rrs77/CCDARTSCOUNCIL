/**
 * Unit tests for Music Hub subscriber unlock crypto helpers.
 * Run: node --test api/__tests__/musicHubUnlock.test.mjs
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  demoPasswordOk,
  hashPasswordForStorage,
  mintToken,
  verifyPassword,
  verifyToken,
} from '../_musicHubUnlock.js';

test('scrypt hash verifies matching password and rejects wrong one', () => {
  const stored = hashPasswordForStorage('correct-horse-battery');
  assert.equal(verifyPassword('correct-horse-battery', stored), true);
  assert.equal(verifyPassword('wrong-password-xx', stored), false);
});

test('minted token verifies for org and fails for other org', () => {
  process.env.MUSIC_HUB_UNLOCK_SECRET = 'test-secret-for-unit-tests';
  const minted = mintToken('ems');
  assert.ok(minted);
  assert.equal(verifyToken(minted.token, 'ems'), true);
  assert.equal(verifyToken(minted.token, 'triborough'), false);
});

test('demo password gated by env flag', () => {
  process.env.MUSIC_HUB_ALLOW_DEMO_PASSWORD = '1';
  process.env.MUSIC_HUB_DEMO_PASSWORD = 'ems-demo-unlock';
  assert.equal(demoPasswordOk('ems', 'ems-demo-unlock'), true);
  assert.equal(demoPasswordOk('ems', 'nope'), false);
  delete process.env.MUSIC_HUB_ALLOW_DEMO_PASSWORD;
  assert.equal(demoPasswordOk('ems', 'ems-demo-unlock'), false);
});
