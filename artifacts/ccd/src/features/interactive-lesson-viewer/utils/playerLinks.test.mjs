/**
 * Run: node --test artifacts/ccd/src/features/interactive-lesson-viewer/utils/playerLinks.test.mjs
 * Mirrors playerLinks helpers (avoids TS imports under node:test).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

function sanitizePlayerReturnTo(raw) {
  if (!raw) return null;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const trimmed = decoded.trim();
  if (!trimmed.startsWith('/?tab=')) return null;
  if (trimmed.includes('://') || trimmed.startsWith('//')) return null;
  if (trimmed.includes('\\') || /\s/.test(trimmed)) return null;
  if (/[<>"']/.test(trimmed)) return null;
  return trimmed;
}

function buildPlayerPath(lessonId, opts = {}) {
  const scene =
    opts.scene != null && opts.scene > 0 ? `&scene=${encodeURIComponent(String(opts.scene))}` : '';
  const safeReturn = sanitizePlayerReturnTo(opts.returnTo);
  const ret = safeReturn ? `&return=${encodeURIComponent(safeReturn)}` : '';
  return `/?tab=lesson-viewer&play=${encodeURIComponent(lessonId)}&mode=player${scene}${ret}`;
}

describe('sanitizePlayerReturnTo', () => {
  it('accepts planner-safe relative paths', () => {
    assert.equal(
      sanitizePlayerReturnTo('/?tab=unit-viewer&view=week&date=2026-11-03'),
      '/?tab=unit-viewer&view=week&date=2026-11-03',
    );
  });

  it('rejects open redirects', () => {
    assert.equal(sanitizePlayerReturnTo('https://evil.example/?tab=unit-viewer'), null);
    assert.equal(sanitizePlayerReturnTo('//evil.example'), null);
    assert.equal(sanitizePlayerReturnTo('/lesson-viewer'), null);
  });
});

describe('buildPlayerPath', () => {
  it('includes scene and sanitized return', () => {
    const path = buildPlayerPath('demo-1', {
      scene: 3,
      returnTo: '/?tab=unit-viewer&view=week',
    });
    assert.match(path, /play=demo-1/);
    assert.match(path, /scene=3/);
    assert.match(path, /return=%2F%3Ftab%3Dunit-viewer/);
  });

  it('drops unsafe return', () => {
    const path = buildPlayerPath('demo-1', { returnTo: 'https://evil.test' });
    assert.doesNotMatch(path, /return=/);
  });
});
