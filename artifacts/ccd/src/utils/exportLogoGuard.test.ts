/**
 * Guard for Rob's rule (25 Oct 2026): the CCDesigner logo ALWAYS appears, in COLOUR,
 * on every lesson plan, unit, half-term plan and in-lesson sheet, in PDF, Word and
 * the on-screen preview. This fails if any export builder drops the shared colour
 * logo, points at another (mono/old) logo file, or puts a greyscale/mono filter on it.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { PLAN_LOGO_BAD_FILTER, htmlHasColourPlanLogo, planSheetChrome } from './planLogo.ts';
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
});

/**
 * Builders that live in React components/hooks (can't be rendered in Node) are
 * checked at source level: they must take the logo from utils/planLogo.ts and
 * must not reference any other logo file or a colour-stripping filter.
 */
const SRC = fileURLToPath(new URL('..', import.meta.url));
const SOURCE_BUILDERS: { file: string; what: string; uses: RegExp }[] = [
  { file: 'components/LessonPrintModal.tsx', what: 'single lesson, unit and half-term PDF/print', uses: /planLogoHtml\(/ },
  { file: 'hooks/useShareLesson.ts', what: 'share fallback PDF', uses: /planLogoHtml\(/ },
  { file: 'utils/timetableShareHtml.ts', what: 'timetable share PDF', uses: /planLogoHtml\(/ },
  { file: 'components/LessonPlannerCalendar.tsx', what: 'calendar print', uses: /planLogoHtml\(/ },
  { file: 'components/planner/Planner.tsx', what: 'Full plan (week/term) print', uses: /planLogoHtml\(/ },
  { file: 'utils/printLessonPlan.ts', what: 'Ctrl+P lesson print clone', uses: /planLogoUrl\(\)/ },
  { file: 'components/HalfTermView.tsx', what: 'half-term print', uses: /PLAN_LOGO_DATA_URI/ },
  { file: 'utils/lessonTemplates/renderLessonTemplate.ts', what: 'template PDF', uses: /planLogoHtml\(/ },
  { file: 'utils/lessonTemplates/rhythmstixTemplates.ts', what: 'template renderer default logo', uses: /planLogoHtml\(/ },
];
const OTHER_LOGO_FILE = /['"`(/](cre-logo|cdlogo|ccdesigner-logo-black[^'"`)]*|ccdesigner-logo|rhythmstix[^'"`)]*logo[^'"`)]*)\.(png|svg|jpe?g)/i;
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
    });
  }
});
