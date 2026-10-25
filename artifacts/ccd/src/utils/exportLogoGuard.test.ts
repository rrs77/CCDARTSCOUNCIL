/**
 * Guard for Rob's rule (25 Oct 2026): the CCDesigner logo ALWAYS appears, in COLOUR,
 * on every lesson plan, unit, half-term plan and in-lesson sheet, in PDF, Word and
 * the on-screen preview. This fails if any export builder drops the shared colour
 * logo, points at another (mono/old) logo file, or puts a greyscale/mono filter on it.
 * It also fails if any output uses a logo height other than PLAN_LOGO_HEIGHT_PX (21px):
 * Rob, 25 Oct 2026, "A: yes, all the same small size".
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { PLAN_LOGO_BAD_FILTER, PLAN_LOGO_HEIGHT_PX, htmlHasColourPlanLogo, planDocxHeaderFooter, planSheetChrome } from './planLogo.ts';
import { RHYTHMSTIX_TEMPLATES, buildRhythmstixDoc, renderRhythmstixHtml } from './lessonTemplates/rhythmstixTemplates.ts';
import { templatePreviewDoc } from './lessonTemplates/templatePreviewDoc.ts';
import { buildTimetableShareHtml } from './timetableShareHtml.ts';

const lesson = {
  grouped: {},
  categoryOrder: [],
  totalTime: 45,
  title: 'Guard lesson',
  sections: Array.from({ length: 6 }, (_, i) => ({ id: String(i), kind: 'free_text', title: `Step ${i + 1}`, durationMins: 5, bodyHtml: 'Do it.' })),
};

describe('every export HTML carries the colour logo (runtime)', () => {
  it('all 7 lesson templates (PDF + on-screen preview)', () => {
    assert.equal(RHYTHMSTIX_TEMPLATES.length, 7);
    for (const t of RHYTHMSTIX_TEMPLATES) {
      const html = renderRhythmstixHtml(buildRhythmstixDoc(lesson, { templateId: t.id }));
      assert.ok(htmlHasColourPlanLogo(html), `${t.id}: PDF HTML`);
      assert.ok(htmlHasColourPlanLogo(templatePreviewDoc(html, { pageOne: true })), `${t.id}: preview`);
      assert.match(html, /print-color-adjust:exact/, t.id);
    }
  });
  it('timetable share PDF', () => {
    const [html] = buildTimetableShareHtml(
      [{ id: '1', day: 1, startTime: '09:00', endTime: '10:00', className: 'Year 3 Music', location: 'Hall', color: '#14b8a6' }],
      'Year 3',
    );
    assert.ok(htmlHasColourPlanLogo(html));
  });
  it('in-lesson sheet chrome (shared helper for the future one-pager)', () => {
    const c = planSheetChrome();
    assert.ok(htmlHasColourPlanLogo(`<style>${c.css}</style>${c.headerHtml}`));
  });
  it('Word header logo is the same standard height', () => {
    assert.equal(planDocxHeaderFooter().header.logo.height, PLAN_LOGO_HEIGHT_PX);
  });
  it('template logo slot is sized from the shared constant (no taller slot)', () => {
    const html = renderRhythmstixHtml(buildRhythmstixDoc(lesson, { templateId: RHYTHMSTIX_TEMPLATES[0].id }));
    assert.match(html, new RegExp(`\\.rx-logo-slot\\{min-height:${PLAN_LOGO_HEIGHT_PX}px;`));
  });
});

/**
 * Builders that live in React components/hooks (can't be rendered in Node) are
 * checked at source level: they must take the logo from utils/planLogo.ts and
 * must not reference any other logo file or a colour-stripping filter.
 */
const SRC = fileURLToPath(new URL('..', import.meta.url));
const SOURCE_BUILDERS: { file: string; what: string; uses: RegExp }[] = [
  { file: 'components/LessonPrintModal.tsx', what: 'single lesson, unit and half-term PDF/print', uses: /planLogoHtml\(/ },
  { file: 'hooks/useShareLesson.ts', what: 'share fallback PDF', uses: /planLogoImg\(/ },
  { file: 'utils/timetableShareHtml.ts', what: 'timetable share PDF', uses: /planLogoImg\(/ },
  { file: 'components/LessonPlannerCalendar.tsx', what: 'calendar print', uses: /planLogoImg\(/ },
  { file: 'components/planner/Planner.tsx', what: 'Full plan (week/term) print', uses: /planLogoImg\(/ },
  { file: 'utils/printLessonPlan.ts', what: 'Ctrl+P lesson print clone', uses: /planLogoUrl\(\)/ },
  { file: 'components/HalfTermView.tsx', what: 'half-term print', uses: /PLAN_LOGO_DATA_URI/ },
  { file: 'utils/lessonTemplates/renderLessonTemplate.ts', what: 'template PDF', uses: /planLogoImg\(/ },
  { file: 'utils/lessonTemplates/rhythmstixTemplates.ts', what: 'template renderer default logo', uses: /planLogoImg\(/ },
];
const OTHER_LOGO_FILE = /['"`(/](cre-logo|cdlogo|ccdesigner-logo-black[^'"`)]*|ccdesigner-logo|rhythmstix[^'"`)]*logo[^'"`)]*)\.(png|svg|jpe?g)/i;
/** A hardcoded logo height: planLogoHtml(<number>) / a numeric logo height next to a plan-logo. */
const HARDCODED_LOGO_SIZE = /planLogoHtml\(\s*\d|PLAN_LOGO_SHEET_HEIGHT_PX|rx-logo-slot\{min-height:\d|ccd-plan-logo[^\n]*\b(?:h|w)-\[\d+px\]/;
const MONO_CSS = /(grayscale|greyscale|saturate\(0|filter\s*:\s*['"]?\s*(invert|brightness\(0))/i;

describe('every export builder uses the shared colour logo (source guard)', () => {
  for (const b of SOURCE_BUILDERS) {
    it(`${b.file} (${b.what})`, () => {
      const src = readFileSync(SRC + b.file, 'utf8');
      assert.match(src, /from '\.{1,2}(\/\.\.)*\/(utils\/)?planLogo(\.ts)?'/, 'imports utils/planLogo');
      assert.match(src, b.uses, 'renders the shared logo');
      assert.doesNotMatch(src, OTHER_LOGO_FILE, 'no other/mono logo file in an export');
      assert.doesNotMatch(src, MONO_CSS, 'no greyscale/mono filter');
      assert.doesNotMatch(src, PLAN_LOGO_BAD_FILTER, 'no colour-stripping filter');
      if (b.file === 'components/LessonPrintModal.tsx') {
        // Not edited by this work: it still passes a legacy height, which planLogoHtml ignores
        // (always PLAN_LOGO_HEIGHT_PX); the runtime test in planLogo.test.ts pins that.
        assert.match(src, /planLogoHtml\(/);
      } else {
        assert.doesNotMatch(src, HARDCODED_LOGO_SIZE, 'logo size comes only from PLAN_LOGO_HEIGHT_PX');
      }
    });
  }
});

describe('builders that set the <img> size themselves use the shared constants', () => {
  it('components/HalfTermView.tsx (half-term print header)', () => {
    const src = readFileSync(SRC + 'components/HalfTermView.tsx', 'utf8');
    assert.match(src, /width=\{PLAN_LOGO_WIDTH_PX\}/);
    assert.match(src, /height=\{PLAN_LOGO_HEIGHT_PX\}/);
    assert.doesNotMatch(src, /src=\{PLAN_LOGO_DATA_URI\}[\s\S]{0,200}(width|height)=\{\d/);
  });
  it('utils/printLessonPlan.ts (Ctrl+P clone)', () => {
    const src = readFileSync(SRC + 'utils/printLessonPlan.ts', 'utf8');
    assert.match(src, /logo\.width = PLAN_LOGO_WIDTH_PX;/);
    assert.match(src, /logo\.height = PLAN_LOGO_HEIGHT_PX;/);
    assert.doesNotMatch(src, /logo\.(width|height) = \d/);
  });
});
