/**
 * Run: node --experimental-strip-types --test artifacts/ccd/src/utils/lessonExportFooter.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  injectPrintWindowFooterCss,
  lessonExportFooterTemplateHtml,
  lessonExportFooterText,
  lessonExportFooterYear,
  lessonExportPrintFooterBodyHtml,
  lessonExportPrintFooterCss,
} from './lessonExportFooter.ts';

describe('lesson export PDF/print footer', () => {
  it('uses the runtime year and fixed CCDesigner once', () => {
    const now = new Date('2026-10-25T12:00:00Z');
    assert.equal(lessonExportFooterYear(now), 2026);
    assert.equal(lessonExportFooterText(now), 'Page N · © CCDesigner 2026');

    const html = lessonExportFooterTemplateHtml(now);
    assert.match(html, /Page <span class="pageNumber"><\/span> · © CCDesigner 2026/);
    assert.match(html, /text-align:\s*center/);
    assert.match(html, /font-size:\s*13px/);
    assert.equal((html.match(/CCDesigner/g) || []).length, 1);
    assert.doesNotMatch(html, /Lesson\s+\d/);
    assert.doesNotMatch(html, /of <span class="totalPages">/);
    assert.doesNotMatch(html, /www\.|http/i);
  });

  it('does not embed branding productName or footerCompany', () => {
    const html = lessonExportFooterTemplateHtml(new Date('2026-01-01T00:00:00Z'));
    assert.doesNotMatch(html, /Creative Curriculum Designer/);
    assert.doesNotMatch(html, /CCDesigner\s+CCDesigner/);
    assert.doesNotMatch(html, /CCDesigner \| CCDesigner/);
  });

  it('print-window CSS uses @bottom-center with Inter — never Page 0 or position:fixed', () => {
    const now = new Date('2026-06-15T00:00:00Z');
    assert.equal(lessonExportPrintFooterBodyHtml(now), '');

    const css = lessonExportPrintFooterCss(now);
    assert.match(css, /@page/);
    assert.match(css, /@bottom-center/);
    assert.match(css, /content:\s*"Page "\s*counter\(page\)/);
    assert.match(css, /© CCDesigner 2026/);
    assert.match(css, /font-size:\s*13px/);
    assert.match(css, /font-family:\s*Inter,\s*sans-serif/);
    assert.match(css, /margin:\s*12mm\s+15mm\s+14mm\s+15mm/);
    assert.doesNotMatch(css, /Page\s+0/);
    assert.doesNotMatch(css, /position:\s*fixed/i);
    assert.doesNotMatch(css, /ccd-export-print-footer/);
  });

  it('PDF HTML builders contain no @page and no @bottom-center', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const pdfHtmlSrc = readFileSync(join(here, 'lessonPdfHtml.ts'), 'utf8');
    const modalSrc = readFileSync(join(here, '../components/LessonPrintModal.tsx'), 'utf8');
    const shareSrc = readFileSync(join(here, '../hooks/useShareLesson.ts'), 'utf8');
    const timetableSrc = readFileSync(join(here, 'timetableShareHtml.ts'), 'utf8');

    for (const [label, src] of [
      ['lessonPdfHtml', pdfHtmlSrc],
      ['LessonPrintModal', modalSrc],
      ['useShareLesson', shareSrc],
      ['timetableShareHtml', timetableSrc],
    ] as const) {
      // Match real CSS rules only (comments may mention the names).
      assert.doesNotMatch(src, /@page\s*\{/, `${label} must not embed @page { in PDF HTML`);
      assert.doesNotMatch(src, /@bottom-center\s*\{/, `${label} must not embed @bottom-center { in PDF HTML`);
    }
    // Print-window footer CSS is injected at write time, not baked into generateHTMLContent.
    assert.match(modalSrc, /injectPrintWindowFooterCss/);
    assert.doesNotMatch(modalSrc, /\$\{lessonExportPrintFooterCss/);
  });

  it('injectPrintWindowFooterCss adds @bottom-center only for the print window', () => {
    const now = new Date('2026-06-15T00:00:00Z');
    const pdfLike =
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>t</title></head><body><p>Lesson</p></body></html>';
    assert.doesNotMatch(pdfLike, /@page/);

    const printHtml = injectPrintWindowFooterCss(pdfLike, now);
    assert.match(printHtml, /@bottom-center/);
    assert.match(printHtml, /content:\s*"Page "/);
    assert.match(printHtml, /© CCDesigner 2026/);
    assert.match(printHtml, /font-family:\s*Inter,\s*sans-serif/);
    assert.doesNotMatch(printHtml, /Page\s+0/);
    // Idempotent
    assert.equal(injectPrintWindowFooterCss(printHtml, now), printHtml);
  });
});
