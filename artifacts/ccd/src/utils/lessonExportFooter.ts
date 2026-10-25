/**
 * Fixed PDF / print footer for LessonPrintModal exports (single, unit, half-term).
 * Ignores branding productName / footerCompany — always "Page N · © CCDesigner <year>".
 *
 * Server/PDFBolt path uses {@link lessonExportFooterTemplateHtml} (Chromium fills .pageNumber).
 * Browser print-window fallback uses CSS @page @bottom-center (Chromium 131+), injected only
 * into the print window via {@link injectPrintWindowFooterCss} — never into the PDF HTML payload
 * (that would double the footer and override PDFBolt margins). Never use a position:fixed body
 * footer with counter(page) — that prints "Page 0".
 */

/** Runtime copyright year for export footers (not branding.footerCopyrightYear). */
export function lessonExportFooterYear(now: Date = new Date()): number {
  return now.getFullYear();
}

/** Plain footer line without markup (for assertions / docs). */
export function lessonExportFooterText(now: Date = new Date()): string {
  return `Page N · © CCDesigner ${lessonExportFooterYear(now)}`;
}

/**
 * PDFBolt / Chromium header-footer template. Chromium fills `.pageNumber`.
 * Centred; 13px minimum; one "CCDesigner" only.
 * Do not change this for print-window fallback fixes.
 */
export function lessonExportFooterTemplateHtml(now: Date = new Date()): string {
  const year = lessonExportFooterYear(now);
  return `<div style="width:100%;font-size:13px;padding:8px 20px;text-align:center;color:#5F6368;font-family:'Inter',sans-serif;">Page <span class="pageNumber"></span> · © CCDesigner ${year}</div>`;
}

/**
 * @deprecated No in-body print footer — use {@link lessonExportPrintFooterCss} (@page margin box).
 * Kept as an empty string so callers stay stable. Never emit "Page 0".
 */
export function lessonExportPrintFooterBodyHtml(_now: Date = new Date()): string {
  return '';
}

/**
 * Print-window-only CSS: @page margin box with Page N · © CCDesigner &lt;year&gt;.
 * Must NOT be included in PDFBolt HTML (duplicate footer + overrides PDFBOLT_MARGINS).
 * Year is a numeric constant only. Never emits position:fixed or the literal "Page 0".
 */
export function lessonExportPrintFooterCss(now: Date = new Date()): string {
  const year = lessonExportFooterYear(now);
  return `
          @page {
            size: A4;
            margin: 12mm 15mm 14mm 15mm;
            @bottom-center {
              content: "Page " counter(page) " · © CCDesigner ${year}";
              font-size: 13px;
              color: #555;
              font-family: Inter, sans-serif;
            }
          }
`;
}

const PRINT_FOOTER_STYLE_MARKER = 'data-ccd-print-footer="1"';

/**
 * Inject {@link lessonExportPrintFooterCss} into a document for the browser print window only.
 * Idempotent. PDF payloads must never call this.
 */
export function injectPrintWindowFooterCss(html: string, now: Date = new Date()): string {
  if (!html) return html;
  if (html.includes(PRINT_FOOTER_STYLE_MARKER)) return html;
  const style = `<style ${PRINT_FOOTER_STYLE_MARKER}>${lessonExportPrintFooterCss(now)}</style>`;
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${style}`);
  }
  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/<html([^>]*)>/i, `<html$1><head>${style}</head>`);
  }
  return `<!DOCTYPE html><html><head>${style}</head><body>${html}</body></html>`;
}
