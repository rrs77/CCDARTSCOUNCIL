/**
 * Lesson stacks persistence (cursor/stacks-persist). Regression for: a stack whose
 * Supabase insert failed lived only in page memory, so it vanished on leaving
 * Lessons or reloading and never reached Half-terms › Add scheme.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  dropMissingColumn,
  localStacksKey,
  mergeStacks,
  missingColumnFromError,
  readLocalStacks,
  stackFromDbRow,
  stackToDbRow,
  unitsAsSchemes,
  writeLocalStacks,
  type LessonStackLike,
} from './lessonStacksLocal.ts';

function memStorage(init: Record<string, string> = {}) {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    get length() {
      return m.size;
    },
    key: (i: number) => [...m.keys()][i] ?? null,
    _map: m,
  };
}

const stack = (id: string, extra: Partial<LessonStackLike> = {}): LessonStackLike => ({
  id,
  name: `Stack ${id}`,
  color: '#4338E8',
  lessons: ['1', '2'],
  totalTime: 60,
  totalActivities: 4,
  created_at: '2026-10-25T09:00:00.000Z',
  ...extra,
});

describe('local fallback store', () => {
  it('keys are per user and per organisation', () => {
    const a = localStacksKey('u1', 'org_a');
    assert.notEqual(a, localStacksKey('u2', 'org_a'));
    assert.notEqual(a, localStacksKey('u1', 'org_b'));
    assert.equal(localStacksKey(null, null), 'ccd-lesson-stacks-local:v1:no-org:anon');
  });

  it('a failed save survives a "reload" (fresh read) and leaving the page', () => {
    const ls = memStorage();
    const key = localStacksKey('u1', 'org_a');
    writeLocalStacks(ls, key, [stack('s1', { localOnly: true })]);
    // New page load: nothing in memory, server returned []
    const merged = mergeStacks([], readLocalStacks(ls, key));
    assert.equal(merged.length, 1);
    assert.equal(merged[0].id, 's1');
    assert.equal(merged[0].localOnly, true);
  });

  it("another user's or org's device copies are not shown", () => {
    const ls = memStorage();
    writeLocalStacks(ls, localStacksKey('u1', 'org_a'), [stack('s1')]);
    assert.deepEqual(readLocalStacks(ls, localStacksKey('u2', 'org_a')), []);
    assert.deepEqual(readLocalStacks(ls, localStacksKey('u1', 'org_b')), []);
  });

  it('server copy wins once uploaded (no duplicates)', () => {
    const merged = mergeStacks([stack('s1')], [stack('s1', { name: 'old' }), stack('s2')]);
    assert.deepEqual(merged.map((s) => [s.id, !!s.localOnly]), [['s1', false], ['s2', true]]);
    assert.equal(merged[0].name, 'Stack s1');
  });

  it('ignores corrupt storage and never stores My units', () => {
    const ls = memStorage({ k: '{not json' });
    assert.deepEqual(readLocalStacks(ls, 'k'), []);
    writeLocalStacks(ls, 'k2', [stack('u', { source: 'unit' })]);
    assert.equal(ls.getItem('k2'), null);
    ls.setItem('k3', JSON.stringify([{ id: 'x' }, stack('ok')]));
    assert.deepEqual(readLocalStacks(ls, 'k3').map((s) => s.id), ['ok']);
  });
});

describe('older database without the new columns', () => {
  const pgrst204 = {
    code: 'PGRST204',
    message: "Could not find the 'curriculum_type' column of 'lesson_stacks' in the schema cache",
  };
  it('reads the missing column from PostgREST and Postgres errors', () => {
    assert.equal(missingColumnFromError(pgrst204), 'curriculum_type');
    assert.equal(
      missingColumnFromError({ code: '42703', message: 'column "user_id" of relation "lesson_stacks" does not exist' }),
      'user_id',
    );
    assert.equal(missingColumnFromError({ code: '42501', message: 'new row violates row-level security policy' }), null);
  });

  it('drops only optional columns, so an insert can be retried', () => {
    const row = stackToDbRow(stack('s1'), { organisationId: 'org_a', userId: 'u1' });
    const next = dropMissingColumn(row, pgrst204)!;
    assert.ok(!('curriculum_type' in next));
    assert.equal(next.organisation_id, 'org_a');
    assert.equal(
      dropMissingColumn(row, { code: 'PGRST204', message: "Could not find the 'lessons' column of 'lesson_stacks'" }),
      null,
    );
    assert.equal(dropMissingColumn(row, { code: '42501', message: 'rls' }), null);
  });

  it('every app-only column can be dropped one by one (July 2026 live table shape)', () => {
    let row: Record<string, unknown> | null = stackToDbRow(stack('s1'), { organisationId: 'org_a', userId: 'u1' });
    for (const col of ['custom_objectives', 'curriculum_type', 'user_id', 'organisation_id']) {
      row = dropMissingColumn(row!, { code: 'PGRST204', message: `Could not find the '${col}' column of 'lesson_stacks'` });
      assert.ok(row && !(col in row), col);
    }
    assert.deepEqual(Object.keys(row!).sort(), [
      'color', 'created_at', 'description', 'id', 'lessons', 'name', 'total_activities', 'total_time', 'updated_at',
    ]);
  });
});

describe('row mapping', () => {
  it('round-trips and keeps ids so a device copy uploads under the same id', () => {
    const row = stackToDbRow(stack('stack-1', { customObjectives: ['o1'], curriculumType: 'CUSTOM' }), {
      organisationId: 'org_a',
      userId: 'u1',
    });
    assert.equal(row.id, 'stack-1');
    assert.equal(row.user_id, 'u1');
    const back = stackFromDbRow(row as never);
    assert.equal(back.id, 'stack-1');
    assert.deepEqual(back.lessons, ['1', '2']);
    assert.deepEqual(back.customObjectives, ['o1']);
    assert.equal(back.localOnly, false);
  });

  it('omits org and user when unknown (demo mode)', () => {
    const row = stackToDbRow(stack('s'), { organisationId: null, userId: null });
    assert.ok(!('organisation_id' in row) && !('user_id' in row));
  });

  it('reads restore-style rows that keep fields in data', () => {
    const s = stackFromDbRow({ id: 'r1', name: 'R', data: { lessons: [3, 4], totalTime: 30, color: '#111111' } } as never);
    assert.deepEqual(s.lessons, ['3', '4']);
    assert.equal(s.totalTime, 30);
  });
});

describe('My units in Half-terms › Add scheme', () => {
  it('lists units from every class with their class sheet', () => {
    const ls = memStorage({
      'units-KS2Y5': JSON.stringify([{ id: 'unit-1', name: 'Romeo and Juliet (LSO)', lessonNumbers: ['3', '4'], color: '#ff0000', createdAt: '2026-10-25T09:00:00Z' }]),
      'units-LKG': JSON.stringify([{ id: 'unit-2', name: 'Nursery songs', lessonNumbers: [], classSheet: 'LKG', createdAt: 'bad date' }]),
      'units-broken': '{',
      'other-key': '[]',
    });
    const units = unitsAsSchemes(ls);
    assert.deepEqual(units.map((u) => [u.id, u.classSheet, u.source]), [
      ['unit-1', 'KS2Y5', 'unit'],
      ['unit-2', 'LKG', 'unit'],
    ]);
    assert.deepEqual(units[0].lessons, ['3', '4']);
    assert.equal(units[1].created_at, new Date(0).toISOString());
  });
});
