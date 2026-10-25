/**
 * Fixed PDF / print footer for LessonPrintModal exports (single, unit, half-term).
 * Ignores branding productName / footerCompany — always "Page N · © CCDesigner <year>".
 *
 * Server/PDFBolt path uses {@link lessonExportFooterTemplateHtml} (Chromium fills .pageNumber).
 * Browser print-window fallback: Chromium does not support CSS @page margin boxes
 * (@bottom-center), and a position:fixed body footer prints "Page 0" and overlaps content.
 * Therefore the print-window path emits no custom footer — the browser's own page footer
 * applies. Never emit "Page 0" or a position:fixed print footer.
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
 * @deprecated No in-body print footer — Chromium cannot paginate position:fixed counters
 * (prints "Page 0") and does not support @page @bottom-center margin boxes in available
 * Chromium. Kept as an empty string so callers stay stable.
 */
export function lessonExportPrintFooterBodyHtml(_now: Date = new Date()): string {
  return '';
}

/**
 * Print-window CSS for the export footer.
 * Empty on purpose: margin boxes are unsupported, and a position:fixed body footer
 * would print "Page 0" and overlap content. Never emits "Page 0" or position:fixed.
 * Inline styles remain allowed by the print CSP (style-src 'unsafe-inline').
 */
export function lessonExportPrintFooterCss(_now: Date = new Date()): string {
  return '';
}
