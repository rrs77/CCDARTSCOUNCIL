/**
 * Fixed PDF / print footer for LessonPrintModal exports (single, unit, half-term).
 * Ignores branding productName / footerCompany — always "Page N · © CCDesigner <year>".
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
 */
export function lessonExportFooterTemplateHtml(now: Date = new Date()): string {
  const year = lessonExportFooterYear(now);
  return `<div style="width:100%;font-size:13px;padding:8px 20px;text-align:center;color:#5F6368;font-family:'Inter',sans-serif;">Page <span class="pageNumber"></span> · © CCDesigner ${year}</div>`;
}

/**
 * Body markup for browser print windows (hidden on screen; shown in @media print).
 * Pair with {@link lessonExportPrintFooterCss}. Uses CSS `counter(page)` via `.pageNumber`.
 */
export function lessonExportPrintFooterBodyHtml(now: Date = new Date()): string {
  const year = lessonExportFooterYear(now);
  return `<div class="ccd-export-print-footer" aria-hidden="true">Page <span class="pageNumber"></span> · © CCDesigner ${year}</div>`;
}

/** CSS so the body print footer appears only when printing (not in PDFBolt screen render). */
export function lessonExportPrintFooterCss(): string {
  return `
          .ccd-export-print-footer { display: none; }
          @media print {
            .ccd-export-print-footer {
              display: block;
              position: fixed;
              left: 0;
              right: 0;
              bottom: 0;
              width: 100%;
              text-align: center;
              font-size: 13px;
              color: #5F6368;
              font-family: 'Inter', sans-serif;
              padding: 8px 20px;
            }
            .ccd-export-print-footer .pageNumber:before { content: counter(page); }
          }
`;
}
