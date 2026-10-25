/**
 * Guards for the Testing Programmer FAILs on cursor/lesson-templates (bd5b8d57):
 * 1. keyboard focus with the full template preview open over the picker modal,
 * 2. no "Rhythmstix" wording visible in the template feature,
 * 3. the preview is scrolled into view on selection at narrow widths.
 * Behaviour was also checked in a browser (Playwright, demo mode).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { RHYTHMSTIX_TEMPLATES, buildRhythmstixDoc, renderRhythmstixHtml } from '../../utils/lessonTemplates/rhythmstixTemplates.ts';

const SRC = fileURLToPath(new URL('../../', import.meta.url));
const read = (f: string) => readFileSync(SRC + f, 'utf8');

describe('full preview keyboard focus', () => {
  it('useFocusTrap does not re-run (and steal focus) when the Escape handler changes', () => {
    const src = read('hooks/useFocusTrap.ts');
    assert.match(src, /onEscapeRef\.current\?\.\(\)/);
    assert.match(src, /\}, \[isActive, containerRef\]\);/);
  });
  it('full preview traps focus, stops Esc reaching the modal, and returns focus to its opener', () => {
    const src = read('components/ccdPlanner/TemplatePreview.tsx');
    assert.match(src, /addEventListener\('focusin', onFocusIn, true\)/);
    assert.match(src, /e\.key === 'Escape'\) \{[\s\S]{0,120}e\.stopPropagation\(\);/);
    assert.match(src, /opener\.focus\(\)/);
  });
});

describe('no Rhythmstix wording visible in the template feature', () => {
  it('picker subtitle is CCDesigner wording', () => {
    const src = read('components/ccdPlanner/TemplatePickerModal.tsx');
    assert.match(src, /subtitle=\{`CCDesigner plan templates, EYFS to KS5\./);
    for (const m of src.matchAll(/(?:subtitle|title|aria-label|label)=\{?[`'"]([^`'"]*)[`'"]/g)) {
      assert.doesNotMatch(m[1], /rhythmstix/i, m[1]);
    }
  });
  it('rendered templates never show Rhythmstix text', () => {
    const lesson = { grouped: {}, categoryOrder: [], totalTime: 45, title: 'T', sections: [{ id: '1', kind: 'free_text', title: 'S', bodyHtml: 'x' }] };
    for (const t of RHYTHMSTIX_TEMPLATES) {
      const html = renderRhythmstixHtml(buildRhythmstixDoc(lesson, { templateId: t.id }));
      const text = html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
      assert.doesNotMatch(text, /rhythmstix/i, t.id);
    }
    const ks3 = RHYTHMSTIX_TEMPLATES.find((t) => t.id === 'ks3')!;
    assert.equal(ks3.sequenceSubtitle, 'Teacher cues and timings are shown for each activity.');
  });
});

describe('narrow-width preview', () => {
  it('scrolls the preview into view when an option is chosen below lg', () => {
    const src = read('components/ccdPlanner/TemplatePickerModal.tsx');
    assert.match(src, /matchMedia\?\.\('\(max-width: 1023\.98px\)'\)/);
    assert.match(src, /previewRef\.current\?\.scrollIntoView/);
    assert.match(src, /revealPreviewIfStacked\(\);/);
  });
});
