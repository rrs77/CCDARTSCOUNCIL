/**
 * Year-group key normalisation + Activity Library matching.
 * Run: node --experimental-strip-types --test artifacts/ccd/src/utils/yearGroupMatchKeys.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  activityTagsMatchYearGroupKeys,
  categoryAssignedToYearGroupKeys,
  extractYearNumber,
  normalizeYearGroupKey,
  resolveYearGroupMatchKeys,
  yearGroupTokensMatch,
} from './yearGroupMatchKeys.ts';

describe('normalizeYearGroupKey', () => {
  it('trims, lower-cases, and collapses whitespace', () => {
    assert.equal(normalizeYearGroupKey('  EYFS   Reception  Music '), 'eyfs reception music');
  });

  it('treats null/undefined as empty', () => {
    assert.equal(normalizeYearGroupKey(null), '');
    assert.equal(normalizeYearGroupKey(undefined), '');
  });
});

describe('yearGroupTokensMatch — Reception / EYFS spellings', () => {
  const receptionPairs: [string, string][] = [
    ['Reception', 'Rec'],
    ['Reception', 'R'],
    ['Reception', 'Yr R'],
    ['Reception', 'Year R'],
    ['Reception', 'EYFS'],
    ['Reception', 'Nursery'],
    ['Reception Music', 'Reception Drama'],
    ['EYFS Reception Music', 'Reception'],
    ['EYFS Reception Music', 'Reception Music'],
    ['Reception Music', 'EYFS Reception Music'],
  ];

  for (const [a, b] of receptionPairs) {
    it(`matches ${a} ↔ ${b}`, () => {
      assert.equal(yearGroupTokensMatch(a, b), true);
      assert.equal(yearGroupTokensMatch(b, a), true);
    });
  }

  it('does not match Reception Music with Year 1 Music', () => {
    assert.equal(yearGroupTokensMatch('EYFS Reception Music', 'Year 1 Music'), false);
  });
});

describe('yearGroupTokensMatch — Year N spellings', () => {
  const year1Pairs: [string, string][] = [
    ['Year 1', 'Yr 1'],
    ['Year 1', 'Y 1'],
    ['Year 1', 'Y1'],
    ['Year 1', 'Year1'],
    ['Year 1 Drama', 'Year 1 Music'],
    ['Year 1 Music', 'Yr 1'],
  ];

  for (const [a, b] of year1Pairs) {
    it(`matches ${a} ↔ ${b}`, () => {
      assert.equal(yearGroupTokensMatch(a, b), true);
      assert.equal(yearGroupTokensMatch(b, a), true);
    });
  }

  it('never treats Year 10 as Year 1', () => {
    assert.equal(yearGroupTokensMatch('Year 10', 'Year 1'), false);
    assert.equal(yearGroupTokensMatch('Year 10 Music', 'Year 1 Music'), false);
    assert.equal(extractYearNumber('year 10 music'), '10');
    assert.equal(extractYearNumber('year 1 music'), '1');
    assert.equal(extractYearNumber('yr 1'), '1');
  });

  it('matches Year 6 aliases', () => {
    assert.equal(yearGroupTokensMatch('Year6', 'Year 6 Music'), true);
    assert.equal(yearGroupTokensMatch('Y6', 'Year 6'), true);
    assert.equal(yearGroupTokensMatch('Yr 6', 'Year 6 Drama'), true);
  });
});

describe('yearGroupTokensMatch — KS bands', () => {
  it('KS1 covers Year 1 and Year 2 only', () => {
    assert.equal(yearGroupTokensMatch('KS1', 'Year 1'), true);
    assert.equal(yearGroupTokensMatch('KS1', 'Year 2'), true);
    assert.equal(yearGroupTokensMatch('Key Stage 1', 'Year 1 Music'), true);
    assert.equal(yearGroupTokensMatch('KS1', 'Year 3'), false);
    assert.equal(yearGroupTokensMatch('KS1', 'Reception'), false);
  });

  it('KS2 covers Years 3–6 only', () => {
    assert.equal(yearGroupTokensMatch('KS2', 'Year 3'), true);
    assert.equal(yearGroupTokensMatch('KS2', 'Year 6 Music'), true);
    assert.equal(yearGroupTokensMatch('KS2', 'Year 2'), false);
    assert.equal(yearGroupTokensMatch('KS2', 'Year 7'), false);
  });
});

describe('resolveYearGroupMatchKeys — EYFS Reception Music finds activities', () => {
  const groups = [
    { id: 'yg-rec-plain', name: 'Reception Music' },
    { id: 'yg-eyfs-rec', name: 'EYFS Reception Music' },
    { id: 'Year1', name: 'Year 1 Music' },
  ];

  it('includes Reception aliases when the class is EYFS Reception Music', () => {
    const keys = resolveYearGroupMatchKeys('EYFS Reception Music', groups);
    assert.ok(keys.includes('EYFS Reception Music'));
    assert.ok(keys.includes('Reception') || keys.some((k) => /reception/i.test(k)));
    assert.ok(
      keys.some((k) => yearGroupTokensMatch(k, 'Reception')),
      `expected Reception alias in ${JSON.stringify(keys)}`,
    );
  });

  it('includes sibling year-group UUID so Settings ticks on the other Reception row match', () => {
    const keys = resolveYearGroupMatchKeys('EYFS Reception Music', groups);
    assert.ok(
      keys.includes('yg-rec-plain'),
      `expected sibling id yg-rec-plain in ${JSON.stringify(keys)}`,
    );
    assert.ok(keys.includes('Reception Music'));
  });

  it('category assigned under sibling UUID is visible for EYFS Reception Music', () => {
    const keys = resolveYearGroupMatchKeys('EYFS Reception Music', groups);
    const yearGroups = { 'yg-rec-plain': true, Year1: false };
    assert.equal(categoryAssignedToYearGroupKeys(yearGroups, keys), true);
  });

  it('activity tagged Reception is visible for EYFS Reception Music (real matching path)', () => {
    const keys = resolveYearGroupMatchKeys('EYFS Reception Music', groups);
    assert.equal(activityTagsMatchYearGroupKeys(['Reception'], keys), true);
    assert.equal(activityTagsMatchYearGroupKeys(['Reception Music'], keys), true);
    assert.equal(activityTagsMatchYearGroupKeys(['Yr R'], keys), true);
    assert.equal(activityTagsMatchYearGroupKeys(['Year 1'], keys), false);
  });

  it('does not pull in Year 1 when resolving Reception', () => {
    const keys = resolveYearGroupMatchKeys('EYFS Reception Music', groups);
    assert.equal(keys.includes('Year1'), false);
    assert.equal(
      keys.some((k) => yearGroupTokensMatch(k, 'Year 1 Music') && !/reception/i.test(k)),
      false,
    );
  });
});
