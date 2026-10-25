/**
 * Run: node --experimental-strip-types --test artifacts/ccd/src/utils/lessonExportFooter.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
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

  it('print-window HTML/CSS never emits Page 0 or a position:fixed footer', () => {
    const now = new Date('2026-06-15T00:00:00Z');
    const body = lessonExportPrintFooterBodyHtml(now);
    const css = lessonExportPrintFooterCss(now);
    // Chromium lacks @page margin boxes; empty fallback avoids wrong footers.
    assert.equal(body, '');
    assert.equal(css, '');

    const printWindowSnippet = `<style>${css}</style>${body}`;
    assert.doesNotMatch(printWindowSnippet, /Page\s+0/);
    assert.doesNotMatch(printWindowSnippet, /position:\s*fixed/i);
    assert.doesNotMatch(printWindowSnippet, /ccd-export-print-footer/);
    assert.doesNotMatch(printWindowSnippet, /counter\(page\)/);
  });
});
