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

describe('studio sticky top bar clearance', () => {
  const css = read('styles/studio-score.css');

  it('defines --ss-topbar and keeps workspace-inner clear of the app header', () => {
    assert.match(css, /--ss-topbar:\s*3\.5rem/);
    assert.match(css, /--ss-topbar:\s*4rem/);
    assert.match(css, /height:\s*calc\(100vh\s*-\s*var\(--ss-topbar\)\)/);
    const inner = css.match(/\.ccd-studio-workspace-inner\s*\{([^}]+)\}/);
    assert.ok(inner, 'expected .ccd-studio-workspace-inner rule');
    assert.match(inner[1], /margin-top:\s*0/);
    assert.match(inner[1], /scroll-padding-top:\s*18px/);
    assert.doesNotMatch(inner[1], /margin-top:\s*-/);
  });

  it('gives Partner Hubs the same top padding as other studio pages', () => {
    const hubs = css.match(/\.ccd-studio-workspace-inner\.hubs-bridge\s*\{([^}]+)\}/);
    assert.ok(hubs, 'expected .hubs-bridge rule');
    assert.match(hubs[1], /padding:\s*18px\s+12px\s+40px/);
    assert.match(hubs[1], /margin-top:\s*0/);
    assert.match(css, /\.ccd-studio-workspace-inner\s+\.ccd-studio-eyebrow/);
    assert.match(css, /scroll-margin-top:\s*12px/);
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

describe('Lessons workspace exposes drag lesson builder', () => {
  const src = read('components/LessonsWorkspace.tsx');
  const app = read('App.tsx');

  it('places Design lesson from activities left of Your lessons and mounts LessonPlanBuilder', () => {
    assert.match(src, /import \{ LessonPlanBuilder \} from '\.\/LessonPlanBuilder'/);
    assert.match(src, /data-testid="lessons-design-from-activities-btn"/);
    assert.match(src, /Design lesson from activities/);
    const btnIdx = src.indexOf('data-testid="lessons-design-from-activities-btn"');
    const menuIdx = src.indexOf('<YourLessonsMenu');
    assert.ok(btnIdx > 0 && menuIdx > btnIdx, 'CTA must appear before YourLessonsMenu in the toolbar');
    assert.match(src, /data-testid="lessons-design-from-activities"/);
    assert.match(src, /data-testid="lessons-design-back"/);
    assert.match(src, /<LessonPlanBuilder[\s\S]*?embedded/);
    assert.match(app, /<DndRoot>/);
  });
});
