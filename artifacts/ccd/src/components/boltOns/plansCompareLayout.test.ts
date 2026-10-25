/**
 * Guards for Free vs Premium two-column layout + studio workspace scroll.
 * Run: node --import tsx --test artifacts/ccd/src/components/boltOns/plansCompareLayout.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { EXPLORE_COMPARE } from './addonPlans.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const read = (rel: string) => readFileSync(ROOT + rel, 'utf8');

describe('EXPLORE_COMPARE content', () => {
  it('keeps Assessify and PeriFeedback Free/Premium row values', () => {
    assert.equal(EXPLORE_COMPARE.assessify.length, 3);
    assert.equal(EXPLORE_COMPARE.perifeedback.length, 3);
    assert.deepEqual(
      EXPLORE_COMPARE.assessify.map((r) => [r.feature, r.free, r.premium]),
      [
        ['Subject rubrics and progress view', 'yes', 'yes'],
        ['Classes tracked', 'limited', 'Unlimited'],
        ['AI-suggested next steps', 'no', 'yes'],
      ],
    );
    assert.deepEqual(
      EXPLORE_COMPARE.perifeedback.map((r) => [r.feature, r.free, r.premium]),
      [
        ['Lesson notes and practice goals', 'yes', 'yes'],
        ['Note history', 'limited', 'Full'],
        ['Parent updates by email', 'no', 'yes'],
      ],
    );
  });
});

describe('BoltOnsCatalogue Free vs Premium layout', () => {
  const src = read('components/boltOns/BoltOnsCatalogue.tsx');

  it('renders Assessify and PeriFeedback as separate side-by-side cards', () => {
    assert.match(src, /data-plans-compare="two-column"/);
    assert.match(src, /min-\[900px\]:grid-cols-2/);
    assert.match(src, /title="Assessify"/);
    assert.match(src, /title="PeriFeedback"/);
    assert.match(src, /EXPLORE_COMPARE\.assessify/);
    assert.match(src, /EXPLORE_COMPARE\.perifeedback/);
    // Single tall combined table (colSpan group headers) must be gone
    assert.doesNotMatch(src, /colSpan=\{3\}/);
  });

  it('keeps Price not set badge on Premium', () => {
    assert.match(src, /<ExampleTag>Price not set<\/ExampleTag>/);
  });
});

describe('studio workspace vertical scroll', () => {
  const css = read('styles/studio-score.css');

  it('lets workspace-inner scroll so tall pages are not trapped', () => {
    const block = css.match(
      /\.ccd-studio-workspace-inner\s*\{([^}]+)\}/,
    );
    assert.ok(block, 'expected .ccd-studio-workspace-inner rule');
    assert.match(block[1], /min-height:\s*0/);
    assert.match(block[1], /overflow-y:\s*auto/);
  });
});
