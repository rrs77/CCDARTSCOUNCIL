/**
 * Freesound proxy helpers (param whitelist, sound id, config).
 * Run: node --test api/__tests__/freesoundShared.test.mjs
 */

import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFreesoundSearchParams,
  getFreesoundApiKey,
  isFreesoundConfigured,
  parseFreesoundSoundId,
} from '../_freesoundShared.js';

describe('parseFreesoundSoundId', () => {
  it('accepts positive integers', () => {
    assert.equal(parseFreesoundSoundId('12345'), 12345);
    assert.equal(parseFreesoundSoundId(99), 99);
  });

  it('rejects invalid ids', () => {
    assert.equal(parseFreesoundSoundId('0'), null);
    assert.equal(parseFreesoundSoundId('-1'), null);
    assert.equal(parseFreesoundSoundId('abc'), null);
    assert.equal(parseFreesoundSoundId(''), null);
  });
});

describe('buildFreesoundSearchParams', () => {
  it('requires query', () => {
    const built = buildFreesoundSearchParams(new URLSearchParams());
    assert.equal(built.ok, false);
  });

  it('whitelists and caps page_size', () => {
    const built = buildFreesoundSearchParams(
      new URLSearchParams({
        query: 'soft clap',
        page_size: '999',
        page: '2',
        token: 'must-not-pass',
        filter: 'evil',
      }),
    );
    assert.equal(built.ok, true);
    assert.equal(built.params.get('query'), 'soft clap');
    assert.equal(built.params.get('page_size'), '20');
    assert.equal(built.params.get('page'), '2');
    assert.equal(built.params.get('token'), null);
    assert.equal(built.params.has('filter'), true);
    assert.match(built.params.get('filter') || '', /Creative Commons 0/);
  });

  it('accepts q alias', () => {
    const built = buildFreesoundSearchParams(new URLSearchParams({ q: 'bell' }));
    assert.equal(built.ok, true);
    assert.equal(built.params.get('query'), 'bell');
  });
});

describe('FREESOUND_API_KEY (server-only)', () => {
  const prev = process.env.FREESOUND_API_KEY;

  after(() => {
    if (prev === undefined) delete process.env.FREESOUND_API_KEY;
    else process.env.FREESOUND_API_KEY = prev;
  });

  it('reads FREESOUND_API_KEY not VITE_', () => {
    process.env.FREESOUND_API_KEY = 'server-secret';
    process.env.VITE_FREESOUND_API_KEY = 'client-leak';
    assert.equal(getFreesoundApiKey(), 'server-secret');
    assert.equal(isFreesoundConfigured(), true);
    delete process.env.FREESOUND_API_KEY;
    delete process.env.VITE_FREESOUND_API_KEY;
    assert.equal(isFreesoundConfigured(), false);
  });
});
