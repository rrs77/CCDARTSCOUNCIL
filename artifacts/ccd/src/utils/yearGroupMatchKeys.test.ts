/**
 * EYFS alias group + year-group key matching.
 * Run: node --import tsx --test artifacts/ccd/src/utils/yearGroupMatchKeys.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  categoryAssignedToYearGroupKeys,
  resolveYearGroupMatchKeys,
  yearGroupTokensMatch,
} from './yearGroupMatchKeys.ts';

describe('EYFS alias group', () => {
  it('matches EYFS class to reception / lkg / ukg / nursery ticks and the reverse', () => {
    const pairs: Array<[string, string]> = [
      ['EYFS', 'reception'],
      ['EYFS', 'lkg'],
      ['EYFS', 'ukg'],
      ['EYFS', 'nursery'],
      ['eyfs', 'Reception'],
      ['reception', 'EYFS'],
      ['LKG', 'EYFS'],
      ['UKG', 'eyfs'],
      ['Nursery', 'EYFS'],
    ];
    for (const [a, b] of pairs) {
      assert.equal(yearGroupTokensMatch(a, b), true, `${a} ↔ ${b}`);
    }
  });

  it('does not treat EYFS as Year 1', () => {
    assert.equal(yearGroupTokensMatch('EYFS', 'Year 1'), false);
    assert.equal(yearGroupTokensMatch('Year 1', 'nursery'), false);
  });

  it('expands resolveYearGroupMatchKeys for an EYFS sheet', () => {
    const keys = resolveYearGroupMatchKeys('EYFS', [{ id: 'eyfs', name: 'EYFS' }]);
    const lower = keys.map((k) => k.toLowerCase());
    assert.ok(lower.includes('eyfs'));
    assert.ok(lower.includes('reception'));
    assert.ok(lower.includes('lkg'));
    assert.ok(lower.includes('ukg'));
    assert.ok(lower.includes('nursery'));
  });

  it('lets category ticks for reception match an EYFS class', () => {
    assert.equal(
      categoryAssignedToYearGroupKeys({ reception: true }, ['EYFS']),
      true,
    );
    assert.equal(
      categoryAssignedToYearGroupKeys({ EYFS: true }, ['Reception']),
      true,
    );
  });
});
