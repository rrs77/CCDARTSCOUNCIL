/**
 * Pure helpers for LessonPrintModal print/PDF HTML.
 * Escaping and colour hardening live here so they can be unit-tested without mounting React.
 * Print-window chrome (CSP, @page @bottom-center footer) is shared by single / unit / half-term.
 */

import { escapeHtmlText } from './escapeHtml.ts';
import { safeColour } from './safeColour.ts';
import { lessonExportPrintFooterCss } from './lessonExportFooter.ts';

/** CSP for about:blank print windows (no scripts; opener calls print()). */
export const LESSON_PRINT_WINDOW_CSP =
  "default-src 'none'; img-src data: https: blob:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src data: https://fonts.gstatic.com; script-src 'none'; base-uri 'none'; form-action 'none'";

export const LESSON_PRINT_CSP_META = `<meta http-equiv="Content-Security-Policy" content="${LESSON_PRINT_WINDOW_CSP}">`;

/**
 * Ensure a full HTML document written into the print window carries the CSP meta.
 * Always injects as the first child of &lt;head&gt; (duplicate CSP metas are harmless).
 * Do not skip based on the phrase appearing elsewhere in the document (e.g. body text).
 */
export function ensurePrintDocumentCsp(html: string): string {
  if (!html) return html;
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${LESSON_PRINT_CSP_META}`);
  }
  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/<html([^>]*)>/i, `<html$1><head>${LESSON_PRINT_CSP_META}</head>`);
  }
  return `<!DOCTYPE html><html><head>${LESSON_PRINT_CSP_META}</head><body>${html}</body></html>`;
}

export function renderPrintEyfsGoalBoxHtml(
  area: string,
  statements: string[],
  areaIsStatement: boolean,
): string {
  const heading = areaIsStatement
    ? ''
    : `<h4 style="font-size: 13px; font-weight: 700; color: #1f2937; margin: 0 0 8px 0;">${escapeHtmlText(area)}</h4>`;
  const items = statements
    .filter((s) => s && String(s).trim())
    .map(
      (statement) => `
                    <li style="display: flex; align-items: flex-start; margin-bottom: 6px; font-size: 13px; color: #1f2937; line-height: 1.4;">
                      <span style="color: #16a34a; font-weight: 700; margin-right: 6px; flex-shrink: 0;">✓</span>
                      <span>${escapeHtmlText(statement)}</span>
                    </li>`,
    )
    .join('');
  return `
                <div class="goal-box" style="background-color: #fffbeb; border: 1px solid #1f2937; border-radius: 8px; padding: 12px;">
                  ${heading}
                  <ul style="list-style: none; padding: 0; margin: 0;">${items}
                  </ul></div>`;
}

export function renderPrintCustomObjectiveBoxHtml(
  displayTitle: string,
  objectiveTexts: string[],
): string {
  const items = objectiveTexts
    .filter((t) => t && String(t).trim())
    .map(
      (text) => `
                    <li style="display: flex; align-items: flex-start; margin-bottom: 6px; font-size: 13px; color: #1f2937; line-height: 1.4;">
                      <span style="color: #16a34a; font-weight: 700; margin-right: 6px; flex-shrink: 0;">✓</span>
                      <span>${escapeHtmlText(text)}</span>
                    </li>`,
    )
    .join('');
  return `
                <div style="background-color: #fffbeb; border: 1px solid #1f2937; border-radius: 8px; padding: 12px;">
                  <h4 style="font-size: 13px; font-weight: 700; color: #1f2937; margin: 0 0 8px 0;">${escapeHtmlText(displayTitle)}</h4>
                  <ul style="list-style: none; padding: 0; margin: 0;">${items}
                  </ul></div>`;
}

export function renderPrintCategoryHeadingHtml(
  category: string,
  categoryColor: unknown,
  fallback = '#0f766e',
): string {
  const color = safeColour(categoryColor, fallback);
  return `
            <div class="activity-category" style="color: ${color}; border-bottom-color: ${color};">
              ${escapeHtmlText(category)}
            </div>`;
}

export function renderPrintSheetDisplayMetaHtml(sheetDisplay: string): string {
  return `<span class="meta-item">📚 ${escapeHtmlText(sheetDisplay)}</span>`;
}

/**
 * Minimal print document covering the teacher-controlled fields that must be escaped.
 * Used by security tests; shape matches LessonPrintModal interpolations.
 */
export function buildLessonPrintModalEscapingSampleHtml(fields: {
  area: string;
  statement: string;
  displayTitle: string;
  objectiveText: string;
  category: string;
  sheetDisplay: string;
  categoryColor?: string;
  printTitle?: string;
}): string {
  const title = escapeHtmlText(fields.printTitle || 'Lesson Plan');
  const body = [
    renderPrintSheetDisplayMetaHtml(fields.sheetDisplay),
    renderPrintEyfsGoalBoxHtml(fields.area, [fields.statement], false),
    renderPrintCustomObjectiveBoxHtml(fields.displayTitle, [fields.objectiveText]),
    renderPrintCategoryHeadingHtml(fields.category, fields.categoryColor ?? '#0f766e'),
  ].join('\n');

  // Same print-window chrome as LessonPrintModal (single / unit / half-term): CSP + @page footer.
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
${LESSON_PRINT_CSP_META}
<title>${title}</title>
<style>
${lessonExportPrintFooterCss()}
</style>
</head>
<body>
${body}
</body>
</html>`;
}
