/**
 * Run: node --experimental-strip-types --test artifacts/ccd/src/utils/__tests__/printModalEscaping.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { escapeHtmlText } from '../escapeHtml.ts';
import { safeColour } from '../safeColour.ts';
import {
  LESSON_PRINT_CSP_META,
  LESSON_PRINT_WINDOW_CSP,
  buildLessonPrintModalEscapingSampleHtml,
  ensurePrintDocumentCsp,
} from '../lessonPrintModalHtml.ts';

const HOSTILE = '<img src=x onerror=alert(1)>';
const HOSTILE_ATTR = '"><svg onload=1>';
const HOSTILE_COLOUR = 'red;background:url(//evil)';

describe('LessonPrintModal print escaping', () => {
  it('escapes hostile markup in area, statement, displayTitle, objective text, category and sheet display', () => {
    const html = buildLessonPrintModalEscapingSampleHtml({
      area: HOSTILE,
      statement: HOSTILE,
      displayTitle: HOSTILE,
      objectiveText: HOSTILE,
      category: HOSTILE,
      sheetDisplay: HOSTILE,
      categoryColor: HOSTILE_COLOUR,
      printTitle: HOSTILE_ATTR,
    });

    // No raw <img> / <svg> tags — payload may still appear as escaped text (&lt;img …)
    assert.equal(html.includes('<img'), false, 'raw <img must not appear');
    assert.doesNotMatch(html, /<img\b/i);
    assert.doesNotMatch(html, /<svg\b/i);

    // Each named field carried the hostile payload and was escaped
    const escapedImg = escapeHtmlText(HOSTILE);
    assert.equal((html.split(escapedImg).length - 1), 6, 'escaped payload once per field (area, statement, displayTitle, objective, category, sheetDisplay)');
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);

    // Colour falls back — no url(//evil) breakout
    assert.doesNotMatch(html, /background\s*:\s*url/i);
    assert.doesNotMatch(html, /\/\/evil/);
    assert.match(html, /color:\s*#0f766e/);

    // CSP meta present (same as writeAndPrintWindow injection)
    assert.ok(html.includes(LESSON_PRINT_CSP_META) || /Content-Security-Policy/i.test(html));
    assert.match(html, /script-src 'none'/);
  });

  it('safeColour accepts hex/rgb/hsl(deg) and rejects breakouts', () => {
    assert.equal(safeColour('#0f766e', '#000'), '#0f766e');
    assert.equal(safeColour('#abc', '#000'), '#abc');
    assert.equal(safeColour('rgb(1, 2, 3)', '#000'), 'rgb(1, 2, 3)');
    assert.equal(safeColour('rgb(1 2 3)', '#000'), 'rgb(1 2 3)');
    assert.equal(safeColour('hsl(120deg, 50%, 40%)', '#000'), 'hsl(120deg, 50%, 40%)');
    assert.equal(safeColour(HOSTILE_COLOUR, '#0f766e'), '#0f766e');
    assert.equal(safeColour('"><svg onload=1>', '#0f766e'), '#0f766e');
    assert.equal(safeColour(null, '#111'), '#111');
  });

  it('print-window sample never includes Page 0 or a position:fixed footer', () => {
    const html = buildLessonPrintModalEscapingSampleHtml({
      area: 'a',
      statement: 's',
      displayTitle: 't',
      objectiveText: 'o',
      category: 'c',
      sheetDisplay: 'd',
    });
    assert.doesNotMatch(html, /Page\s+0/);
    assert.doesNotMatch(html, /position:\s*fixed/i);
    assert.doesNotMatch(html, /ccd-export-print-footer/);
  });

  it('ensurePrintDocumentCsp injects CSP into HTML written for the print window', () => {
    const raw = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>t</title></head><body>x</body></html>';
    const withCsp = ensurePrintDocumentCsp(raw);
    assert.match(withCsp, /http-equiv="Content-Security-Policy"/);
    assert.match(withCsp, /script-src 'none'/);
    // Always injects as first head child; calling again may duplicate (harmless) but CSP remains.
    const twice = ensurePrintDocumentCsp(withCsp);
    assert.match(twice, /script-src 'none'/);
    assert.match(twice, /fonts\.googleapis\.com/);
  });

  it('ensurePrintDocumentCsp still injects when CSP phrase appears only in body text', () => {
    const raw =
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>t</title></head>' +
      '<body>Note: http-equiv="Content-Security-Policy" mentioned in teacher notes</body></html>';
    const withCsp = ensurePrintDocumentCsp(raw);
    assert.match(withCsp, /<head[^>]*>\s*<meta http-equiv="Content-Security-Policy"/i);
    assert.match(withCsp, /script-src 'none'/);
    assert.ok(
      (withCsp.match(/http-equiv="Content-Security-Policy"/gi) || []).length >= 1,
      'meta must be injected even when the phrase is already in the body',
    );
  });

  it('print CSP allows Google Fonts hosts and keeps script-src none', () => {
    assert.match(LESSON_PRINT_WINDOW_CSP, /fonts\.googleapis\.com/);
    assert.match(LESSON_PRINT_WINDOW_CSP, /fonts\.gstatic\.com/);
    assert.match(LESSON_PRINT_WINDOW_CSP, /script-src 'none'/);
    assert.match(LESSON_PRINT_WINDOW_CSP, /style-src 'unsafe-inline' https:\/\/fonts\.googleapis\.com/);
    assert.match(LESSON_PRINT_WINDOW_CSP, /font-src data: https:\/\/fonts\.gstatic\.com/);
    assert.match(LESSON_PRINT_WINDOW_CSP, /base-uri 'none'/);
    assert.match(LESSON_PRINT_WINDOW_CSP, /form-action 'none'/);
    assert.ok(LESSON_PRINT_CSP_META.includes(LESSON_PRINT_WINDOW_CSP));
  });
});
