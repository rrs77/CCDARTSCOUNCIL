/**
 * preferOrgScopedByName — hide shared defaults once a school has copies.
 * Run: node --experimental-strip-types --test artifacts/ccd/src/utils/preferOrgScopedByName.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { preferOrgScopedByName } from './preferOrgScopedByName.ts';

describe('preferOrgScopedByName', () => {
  it('keeps shared NULL-org rows when the school has no copies', () => {
    const rows = [
      { id: '1', name: 'Year 1', organisation_id: null },
      { id: '2', name: 'Year 2', organisation_id: null },
    ];
    const out = preferOrgScopedByName(rows);
    assert.equal(out.length, 2);
    assert.ok(out.every((r) => r.organisation_id == null));
  });

  it('hides shared NULL-org rows once any org-scoped copy exists', () => {
    const rows = [
      { id: 's1', name: 'Year 1', organisation_id: null },
      { id: 's2', name: 'Year 2', organisation_id: null },
      { id: 'o1', name: 'Year 1', organisation_id: 'org_a' },
      { id: 'o3', name: 'Reception', organisation_id: 'org_a' },
    ];
    const out = preferOrgScopedByName(rows);
    assert.equal(out.length, 2);
    assert.ok(out.every((r) => r.organisation_id === 'org_a'));
    assert.ok(out.some((r) => r.name === 'Year 1'));
    assert.ok(out.some((r) => r.name === 'Reception'));
    assert.equal(
      out.some((r) => r.name === 'Year 2'),
      false,
      'deleted school Year 2 must not reappear from shared',
    );
  });

  it('prefers org-scoped row when names collide', () => {
    const rows = [
      { id: 's1', name: 'Year 1', organisation_id: null },
      { id: 'o1', name: 'Year 1', organisation_id: 'org_a', color: '#111' },
    ];
    const out = preferOrgScopedByName(rows);
    assert.equal(out.length, 1);
    assert.equal(out[0].organisation_id, 'org_a');
    assert.equal((out[0] as { color?: string }).color, '#111');
  });
});
