/**
 * Scoped curriculum localStorage — no cross-user/org legacy import.
 * Run: node --experimental-strip-types --test artifacts/ccd/src/utils/planner/plannerCurriculumLocalCache.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import {
  STORAGE_KEY,
  PERSONAL_STORAGE_KEY,
  cacheScopeToken,
  readScopedOrMigrateLegacy,
  scopedCurriculumKey,
  writeScopedLocal,
} from './plannerCurriculumLocalCache.ts';
import { orgOrNullFilter } from '../orgIdFilter.ts';
import {
  ensurePlannerCurriculumCacheScope,
  getPlannerCurriculumCacheScope,
  resetPlannerCurriculumCacheScope,
} from './plannerCurriculumCacheScope.ts';

const store = new Map<string, string>();

function installMemoryLocalStorage() {
  const ls = {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
  (globalThis as { localStorage?: typeof ls }).localStorage = ls;
}

beforeEach(() => {
  store.clear();
  installMemoryLocalStorage();
  resetPlannerCurriculumCacheScope();
});

describe('readScopedOrMigrateLegacy', () => {
  it('migrates legacy once for the first signed-in user and deletes the unscoped key', () => {
    store.set(STORAGE_KEY, JSON.stringify({ frameworks: [{ id: 'legacy' }] }));

    const rawA = readScopedOrMigrateLegacy(STORAGE_KEY, 'org_a', 'user_a');
    assert.ok(rawA);
    assert.equal(store.has(STORAGE_KEY), false, 'legacy key must be removed after migrate');
    assert.ok(store.has(scopedCurriculumKey(STORAGE_KEY, 'org_a', 'user_a')));

    // Second user must not see the legacy blob (already removed).
    const rawB = readScopedOrMigrateLegacy(STORAGE_KEY, 'org_b', 'user_b');
    assert.equal(rawB, null);
  });

  it('does not import another user/org scoped key', () => {
    writeScopedLocal(STORAGE_KEY, JSON.stringify({ frameworks: [{ id: 'a-only' }] }), 'org_a', 'user_a');
    const rawB = readScopedOrMigrateLegacy(STORAGE_KEY, 'org_b', 'user_b');
    assert.equal(rawB, null);
  });

  it('does not fall back to unscoped personal key for a different signed-in user', () => {
    store.set(PERSONAL_STORAGE_KEY, JSON.stringify({ statements: [{ id: 'legacy-personal' }] }));
    const first = readScopedOrMigrateLegacy(PERSONAL_STORAGE_KEY, 'org_a', 'user_a');
    assert.ok(first);
    assert.equal(store.has(PERSONAL_STORAGE_KEY), false);

    const second = readScopedOrMigrateLegacy(PERSONAL_STORAGE_KEY, 'org_a', 'user_b');
    assert.equal(second, null, 'user B must not receive user A legacy personal data');
  });

  it('allows unscoped read only when unsigned (no user/org)', () => {
    store.set(STORAGE_KEY, JSON.stringify({ frameworks: [{ id: 'demo' }] }));
    const raw = readScopedOrMigrateLegacy(STORAGE_KEY, null, null);
    assert.ok(raw);
    assert.equal(store.has(STORAGE_KEY), true, 'unsigned path must not delete legacy');
  });
});

describe('cacheScopeToken + ensurePlannerCurriculumCacheScope', () => {
  it('builds org:user tokens used to discard stale module caches', () => {
    assert.equal(cacheScopeToken('org_a', 'user_a'), 'org_a:user_a');
    assert.equal(cacheScopeToken(null, 'user_a'), ':user_a');
    assert.notEqual(cacheScopeToken('org_a', 'user_a'), cacheScopeToken('org_b', 'user_a'));
  });

  it('discards caches via onMismatch when org/user changes', () => {
    let cleared = 0;
    ensurePlannerCurriculumCacheScope('org_a', 'user_a', () => {
      cleared += 1;
    });
    assert.equal(getPlannerCurriculumCacheScope(), 'org_a:user_a');
    assert.equal(cleared, 0);

    ensurePlannerCurriculumCacheScope('org_b', 'user_b', () => {
      cleared += 1;
    });
    assert.equal(cleared, 1, 'mismatch must clear stale caches');
    assert.equal(getPlannerCurriculumCacheScope(), 'org_b:user_b');

    ensurePlannerCurriculumCacheScope('org_b', 'user_b', () => {
      cleared += 1;
    });
    assert.equal(cleared, 1, 'same identity must not clear again');
  });
});

describe('orgOrNullFilter', () => {
  it('accepts safe ids and rejects unsafe interpolation', () => {
    assert.equal(orgOrNullFilter('org_a'), 'organisation_id.eq.org_a,organisation_id.is.null');
    assert.equal(orgOrNullFilter('org;drop'), null);
    assert.equal(orgOrNullFilter(''), null);
    assert.equal(orgOrNullFilter(null), null);
  });
});
