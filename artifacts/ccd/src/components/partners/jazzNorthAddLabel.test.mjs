/**
 * Jazz North hub CTAs must say Add to CCDesigner.
 * Run: node --test artifacts/ccd/src/components/partners/jazzNorthAddLabel.test.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

describe('Jazz North Add to CCDesigner labels', () => {
  it('resource cards and Jazz North pack CTA use Add to CCDesigner', () => {
    const card = readFileSync(join(here, 'PartnerHubResourceCard.tsx'), 'utf8');
    const hub = readFileSync(join(here, 'JazzNorthPartnerHub.tsx'), 'utf8');
    assert.match(card, /Add to CCDesigner/);
    assert.doesNotMatch(card, /Add activities to your planner/);
    assert.doesNotMatch(card, /Add lesson to your planner/);
    assert.match(hub, /label="Add to CCDesigner"/);
    assert.doesNotMatch(hub, /Add activities to your planner/);
  });
});
