/**
 * Guards: full-page studio workspaces scroll inside .ccd-studio-workspace-inner.
 * Settings and the activity editor keep their own overflow via more specific selectors.
 * Run: node --import tsx --test artifacts/ccd/src/styles/workspaceScroll.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const read = (rel: string) => readFileSync(ROOT + rel, 'utf8');

describe('studio workspace vertical scroll', () => {
  const css = read('styles/studio-score.css');

  it('lets workspace-inner scroll so tall pages are not trapped', () => {
    const block = css.match(/\.ccd-studio-workspace-inner\s*\{([^}]+)\}/);
    assert.ok(block, 'expected .ccd-studio-workspace-inner rule');
    assert.match(block[1], /min-height:\s*0/);
    assert.match(block[1], /overflow-x:\s*hidden/);
    assert.match(block[1], /overflow-y:\s*auto/);
    assert.match(block[1], /overscroll-behavior:\s*contain/);
  });

  it('keeps Settings and activity editor on their own overflow', () => {
    assert.match(
      css,
      /\.ccd-studio-workspace-inner\.wide-canvas:has\(\.ss-settings-page\)\s*\{[^}]*overflow:\s*hidden/s,
    );
    assert.match(
      css,
      /\.ccd-studio-workspace-inner\.editor-flush\s*\{[^}]*overflow:\s*hidden/s,
    );
  });
});

describe('Lessons workspace does not trap height in the viewport', () => {
  const src = read('components/LessonsWorkspace.tsx');

  it('avoids min-h calc(100vh) that clipped the lesson plan panel', () => {
    assert.doesNotMatch(src, /min-h-\[calc\(100vh-7\.5rem\)\]/);
    assert.match(src, /data-testid="lessons-planner"/);
    assert.match(src, /lessonPlanOpen \? 'overflow-visible'/);
  });
});
