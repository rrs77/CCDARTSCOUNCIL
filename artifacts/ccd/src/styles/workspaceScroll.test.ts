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
    assert.match(src, /data-lessons-plan-shell=\{lessonPlanOpen \? 'open' : 'canvas'\}/);
    assert.match(src, /lessonPlanOpen\s*\?\s*'min-h-0 overflow-hidden'/);
    assert.match(src, /Drop min-h-\[28rem\] while open/);
  });
});

describe('Lesson plan panel body scrolls in Plan / Preview / Print', () => {
  const css = read('styles/studio-score.css');
  const panel = read('components/ccdPlanner/LessonPlanModal.tsx');

  it('bounds the panel and gives the body overflow-y:auto with min-height:0', () => {
    assert.match(
      css,
      /\.ccd-studio-workspace-inner:has\(\[data-ccd-lesson-plan-panel\]\)\s*\{[^}]*overflow:\s*hidden/s,
    );
    const body = css.match(
      /\[data-ccd-lesson-plan-panel\]\s+\[data-ccd-lesson-plan-body\]\s*\{([^}]+)\}/,
    );
    assert.ok(body, 'expected [data-ccd-lesson-plan-body] rule');
    assert.match(body[1], /min-height:\s*0/);
    assert.match(body[1], /overflow-y:\s*auto/);
    assert.match(body[1], /overflow-x:\s*hidden/);
    assert.match(
      css,
      /\[data-ccd-lesson-plan-panel\]\s*\{[^}]*overflow:\s*hidden/s,
    );
    assert.match(
      css,
      /\[data-ccd-lesson-plan-panel\]\s*\{[^}]*max-height:\s*min\(100%,\s*calc\(100dvh\s*-\s*var\(--ss-topbar\)/s,
    );
  });

  it('marks header, scroll body, and footer in LessonPlanPanel markup', () => {
    assert.match(panel, /data-ccd-lesson-plan-panel/);
    assert.match(panel, /data-ccd-lesson-plan-header/);
    assert.match(panel, /data-ccd-lesson-plan-body/);
    assert.match(panel, /data-ccd-lesson-plan-footer/);
    assert.match(panel, /data-ccd-lesson-plan-body-shell/);
    assert.match(
      panel,
      /className="soft-scroll flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto"/,
    );
  });
});

describe('Lessons workspace Design lesson from activities CTA', () => {
  const src = read('components/LessonsWorkspace.tsx');
  const library = read('components/ccdPlanner/LibraryMenu.tsx');
  const canvas = read('components/ccdPlanner/PlannerLessonCanvas.tsx');
  const app = read('App.tsx');

  it('places CTA left of Your lessons and opens Library (not LessonPlanBuilder)', () => {
    assert.doesNotMatch(src, /import \{ LessonPlanBuilder \} from '\.\/LessonPlanBuilder'/);
    assert.doesNotMatch(src, /designFromActivities/);
    assert.match(src, /data-testid="lessons-design-from-activities-btn"/);
    assert.match(src, /Design lesson from activities/);
    assert.match(src, /designLessonFromActivities/);
    assert.match(src, /ensureEmptyLessonOnCanvas/);
    assert.match(src, /setLibraryOpen\(true\)/);
    const btnIdx = src.indexOf('data-testid="lessons-design-from-activities-btn"');
    const menuIdx = src.indexOf('<YourLessonsMenu');
    assert.ok(btnIdx > 0 && menuIdx > btnIdx, 'CTA must appear before YourLessonsMenu in the toolbar');
    assert.match(library, /function DraggableLibraryRow/);
    assert.match(library, /type:\s*'activity'/);
    assert.match(canvas, /accept:\s*\['activity'\]/);
    assert.match(app, /<DndRoot>/);
  });

  it('keeps designer pink CTA styles in one constant with responsive labels', () => {
    assert.match(src, /const DESIGN_LESSON_FROM_ACTIVITIES_BTN_CLASS/);
    assert.match(src, /border-pink-600 bg-pink-600/);
    assert.match(src, /hover:border-pink-700 hover:bg-pink-700/);
    assert.match(src, /active:border-pink-800 active:bg-pink-800/);
    assert.match(src, /focus-visible:outline-pink-300/);
    assert.match(src, /shadow-\[0_4px_12px_-2px_rgba\(219,39,119,0\.35\)\]/);
    assert.match(src, /pointer-coarse:min-h-\[44px\]/);
    assert.match(src, /className=\{DESIGN_LESSON_FROM_ACTIVITIES_BTN_CLASS\}/);
    assert.match(src, /hidden xl:inline/);
    assert.match(src, /hidden lg:inline xl:hidden/);
    assert.match(src, /DesignLessonFromActivitiesIcon/);
    assert.doesNotMatch(src, /LayoutGrid/);
  });
});
