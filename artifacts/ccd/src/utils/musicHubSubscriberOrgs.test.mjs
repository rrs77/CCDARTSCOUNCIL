/**
 * Tests for subscriber-password organisation id helpers.
 * Run: node --test artifacts/ccd/src/utils/musicHubSubscriberOrgs.test.mjs
 *
 * Mirrors validation / merge rules from musicHubSubscriberOrgs.ts (no Vite JSON import).
 */

import assert from 'node:assert/strict';
import test from 'node:test';

const ORG_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const DEFAULTS = ['ems', 'triborough'];

function normalise(raw) {
  return String(raw).trim().toLowerCase();
}

function isValid(raw) {
  return ORG_ID_PATTERN.test(normalise(raw));
}

function listOrgs({ directory = [], custom = [], filter = null } = {}) {
  if (filter && isValid(filter)) return [normalise(filter)];
  return [...new Set([...DEFAULTS, ...directory, ...custom].map(normalise).filter(isValid))].sort();
}

test('accepts slug-like organisation ids', () => {
  assert.equal(isValid('ems'), true);
  assert.equal(isValid('music-on-sea'), true);
  assert.equal(isValid('TriBorough'), true);
  assert.equal(isValid('a'), true);
});

test('rejects invalid organisation ids', () => {
  assert.equal(isValid(''), false);
  assert.equal(isValid('Has Space'), false);
  assert.equal(isValid('-leading'), false);
  assert.equal(isValid('Bad!'), false);
});

test('list merges defaults, directory, and custom', () => {
  assert.deepEqual(listOrgs({ directory: ['ems'], custom: ['music-on-sea'] }), [
    'ems',
    'music-on-sea',
    'triborough',
  ]);
});

test('organisationFilter narrows the list', () => {
  assert.deepEqual(listOrgs({ custom: ['x'], filter: 'ems' }), ['ems']);
});
