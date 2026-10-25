/**
 * CCDesigner plan branding: the single source of truth for the logo and footer
 * on every lesson plan, unit, half-term plan, in-lesson sheet, share PDF,
 * print window, on-screen preview and (future) Word export.
 *
 * Rule (Rob, 25 Oct 2026): the CCDesigner logo ALWAYS appears, in COLOUR, small,
 * top-left; page number and "© CCDesigner <year>" bottom centre.
 *
 * The logo is embedded as a data: URI (planLogoData.ts, generated from
 * public/ccdesigner-logo-colour.png by scripts/gen-plan-logo-data.py), so a print window (about:blank), the PDF service
 * or a Word file never has to fetch a logo file, so it can never go missing.
 * Never put a CSS filter (grayscale, brightness, invert, opacity) on it.
 *
 * Pure module (no DOM access at import) so Node tests and server code can use it.
 */
import { CCD_LOGO_ALT, CCD_LOGO_COLOUR_PATH } from './brandLogo.ts';
import { PLAN_LOGO_PNG_BASE64, PLAN_LOGO_PNG_HEIGHT, PLAN_LOGO_PNG_WIDTH } from './planLogoData.ts';

/**
 * Canonical colour export logo (master brand file trimmed, 784×192, transparent).
 * For on-screen <img> next to plans; outputs use the embedded PLAN_LOGO_DATA_URI.
 */
export const PLAN_LOGO_PATH = CCD_LOGO_COLOUR_PATH;
/** Size of the canonical asset. */
export const PLAN_LOGO_SOURCE_WIDTH = 784;
export const PLAN_LOGO_SOURCE_HEIGHT = 192;
export const PLAN_LOGO_ALT = CCD_LOGO_ALT;
/** Natural aspect ratio of the artwork (784×192 ≈ 4.08:1). */
export const PLAN_LOGO_ASPECT = PLAN_LOGO_PNG_WIDTH / PLAN_LOGO_PNG_HEIGHT;
/**
 * THE logo height on every plan output (Rob, 25 Oct 2026: "A: yes, all the same small size"):
 * 21px at 96dpi ≈ 5.6mm, top-left, 784×192 aspect (≈ 86×21px). Single, unit and half-term
 * PDFs and print windows, all 7 templates and their previews, the full plan print, the share
 * fallback, the timetable share, the calendar export, the in-lesson sheet and Word.
 * This is the only logo size: never hardcode another height in an output.
 */
export const PLAN_LOGO_HEIGHT_PX = 21;

/** Embedded colour PNG as a data: URI. Always available, synchronously. */
export const PLAN_LOGO_DATA_URI = `data:image/png;base64,${PLAN_LOGO_PNG_BASE64}`;

/** Inline style that keeps the logo in colour when printed (and never filtered). */
export const PLAN_LOGO_COLOUR_STYLE =
  '-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact;filter:none;opacity:1;mix-blend-mode:normal';

/** Kept for callers that used to warm a cache: the logo is embedded now, nothing to load. */
export function preloadPlanLogo(): void {}

/** Logo URL for any plan output: always the embedded colour data: URI. */
export function planLogoUrl(): string {
  return PLAN_LOGO_DATA_URI;
}

export function planLogoWidthFor(heightPx: number): number {
  return Math.round(heightPx * PLAN_LOGO_ASPECT);
}
/** Logo width that goes with PLAN_LOGO_HEIGHT_PX (86px). */
export const PLAN_LOGO_WIDTH_PX = planLogoWidthFor(PLAN_LOGO_HEIGHT_PX);

/** <img> for HTML print templates: colour, the one standard size (PLAN_LOGO_HEIGHT_PX), top-left. */
export function planLogoImg(extraStyle = ''): string {
  const h = PLAN_LOGO_HEIGHT_PX;
  const w = PLAN_LOGO_WIDTH_PX;
  return (
    `<img class="ccd-plan-logo" data-ccd-plan-logo="colour" src="${PLAN_LOGO_DATA_URI}" alt="${PLAN_LOGO_ALT}" ` +
    `width="${w}" height="${h}" ` +
    `style="display:block;height:${h}px;width:${w}px;max-width:none;${PLAN_LOGO_COLOUR_STYLE};${extraStyle}">`
  );
}

/**
 * Legacy signature kept for existing callers (LessonPrintModal.tsx passes a height).
 * The height argument is IGNORED: every plan output uses PLAN_LOGO_HEIGHT_PX. Prefer planLogoImg().
 */
export function planLogoHtml(_legacyHeightPx?: number, extraStyle = ''): string {
  return planLogoImg(extraStyle);
}

/** CSS for a print document's <style>: keeps the logo (and the page's colours) in colour when printed. */
export const PLAN_LOGO_PRINT_CSS =
  'img.ccd-plan-logo{filter:none!important;opacity:1!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}' +
  '@media print{html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact}img.ccd-plan-logo{display:block!important;visibility:visible!important}}';

/** Aliases used by LessonPrintModal header/print chrome (same 21×86 constants). */
export const PLAN_LOGO_PRINT_HEIGHT_PX = PLAN_LOGO_HEIGHT_PX;
export const PLAN_LOGO_PRINT_WIDTH_PX = PLAN_LOGO_WIDTH_PX;
export const PLAN_LOGO_COLOUR_DATA_URL = PLAN_LOGO_DATA_URI;

/**
 * PDFBolt / Chromium header template — colour logo top-left on EVERY page.
 * Pair with a top margin that reserves the header band (see PDFBOLT_MARGINS.top).
 */
export function planLogoHeaderTemplateHtml(): string {
  return `<div style="width:100%;margin:0;padding:6px 20px 0 20px;box-sizing:border-box;">${planLogoImg()}</div>`;
}

/**
 * Print-window running header: a table thead that repeats on every printed page.
 * Hidden on screen so PDFBolt (emulateMediaType: screen) + headerTemplate is not doubled.
 */
export function planLogoPrintTheadHtml(): string {
  return `<thead class="ccd-export-print-logo-row"><tr><td style="padding:0 0 8px 0;">${planLogoImg('margin:0;')}</td></tr></thead>`;
}

/** CSS for the print-window repeating logo thead (screen-hidden) + colour print rules. */
export function planLogoPrintRunningCss(): string {
  return `
          ${PLAN_LOGO_PRINT_CSS}
          .ccd-export-print-sheet { width: 100%; border-collapse: collapse; }
          .ccd-export-print-logo-row { display: none; }
          @media print {
            .ccd-export-print-sheet { width: 100%; border-collapse: collapse; }
            .ccd-export-print-logo-row { display: table-header-group; }
            .ccd-export-print-logo-row img.ccd-plan-logo {
              height: ${PLAN_LOGO_PRINT_HEIGHT_PX}px !important;
              width: ${PLAN_LOGO_PRINT_WIDTH_PX}px !important;
              -webkit-filter: none !important;
              filter: none !important;
            }
          }
`;
}

/** Footer copyright line, e.g. "© CCDesigner 2026". */
export function planFooterCopyright(year: number = new Date().getFullYear()): string {
  return `© CCDesigner ${year}`;
}
export const PLAN_FOOTER_SITE = 'www.ccdesigner.co.uk';

/**
 * Header/footer chrome for HTML sheets that don't have their own (e.g. the
 * in-lesson one-page sheet, when it's built): colour logo top-left, page number
 * and copyright bottom centre.
 */
export function planSheetChrome(opts: { year?: number } = {}): {
  css: string;
  headerHtml: string;
  footerHtml: string;
} {
  const copyright = planFooterCopyright(opts.year);
  return {
    css:
      PLAN_LOGO_PRINT_CSS +
      `@page{@bottom-center{content:"Page " counter(page) " · ${copyright}";font-size:13px;color:#555}}` +
      '.ccd-sheet-foot{text-align:center;font-size:13px;color:#555;margin-top:16px}',
    headerHtml: `<header class="ccd-sheet-head">${planLogoImg()}</header>`,
    footerHtml: `<footer class="ccd-sheet-foot">${copyright}</footer>`,
  };
}

/** True when the HTML carries the colour plan logo with no greyscale/mono filter on it. */
export function htmlHasColourPlanLogo(html: string): boolean {
  const imgs: string[] = html.match(/<img\b[^>]*class="[^"]*\b(?:ccd-plan-logo|plan-logo)\b[^"]*"[^>]*>/gi) || [];
  if (!imgs.length) return false;
  return imgs.every((tag) => {
    const src = /\bsrc="([^"]+)"/i.exec(tag)?.[1] || '';
    const style = /\bstyle="([^"]*)"/i.exec(tag)?.[1] || '';
    const okSrc = src === PLAN_LOGO_DATA_URI || /\/ccdesigner-logo-colour\.png(\?|$)/.test(src);
    return okSrc && planLogoTagIsStandardSize(tag) && !PLAN_LOGO_BAD_FILTER.test(style) && !/\b(grayscale|greyscale|mono)\b/i.test(tag.replace(src, ''));
  }) && !PLAN_LOGO_BAD_CSS.test(html);
}
/**
 * True when a logo <img> tag is exactly the standard size: width/height attributes and
 * inline style height/width all equal PLAN_LOGO_WIDTH_PX × PLAN_LOGO_HEIGHT_PX.
 */
export function planLogoTagIsStandardSize(tag: string): boolean {
  const attr = (n: string) => new RegExp(`\\s${n}="(\\d+)"`, 'i').exec(tag)?.[1];
  const style = /\bstyle="([^"]*)"/i.exec(tag)?.[1] || '';
  const css = (n: string) => new RegExp(`(?:^|;)\\s*${n}\\s*:\\s*([\\d.]+)px`, 'i').exec(style)?.[1];
  return (
    attr('height') === String(PLAN_LOGO_HEIGHT_PX) &&
    attr('width') === String(PLAN_LOGO_WIDTH_PX) &&
    css('height') === String(PLAN_LOGO_HEIGHT_PX) &&
    css('width') === String(PLAN_LOGO_WIDTH_PX)
  );
}
/** filter values that would strip the logo's colour or hide it. */
export const PLAN_LOGO_BAD_FILTER = /filter\s*:\s*(?!none)[^;"]*(grayscale|greyscale|saturate\(0|brightness\(0|invert|contrast\(0)/i;
/** A stylesheet rule that targets the logo with a colour-stripping filter. */
const PLAN_LOGO_BAD_CSS =
  /(ccd-plan-logo|plan-logo)[^{}]*\{[^}]*filter\s*:\s*(?!none)[^;}]*(grayscale|greyscale|saturate\(0|brightness\(0|invert)/i;

/* ------------------------------------------------------------------ */
/* Word (.docx)                                                        */
/* ------------------------------------------------------------------ */

const EMU_PER_PX = 9525; // 914400 EMU per inch / 96 px per inch

/** Decode the embedded PNG to bytes (works in the browser and in Node). */
export function planLogoPngBytes(): Uint8Array {
  const b64 = PLAN_LOGO_PNG_BASE64;
  if (typeof atob === 'function') {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
    return out;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const B = (globalThis as any).Buffer;
  return new Uint8Array(B.from(b64, 'base64'));
}

export interface PlanDocxLogo {
  /** PNG bytes (colour) for an ImageRun / w:drawing. */
  data: Uint8Array;
  type: 'png';
  /** Pixel size of the embedded artwork. */
  pixelWidth: number;
  pixelHeight: number;
  /** Display size in px (96dpi), as docx's ImageRun transformation expects. */
  width: number;
  height: number;
  /** Display size in EMU (raw OOXML wp:extent). */
  widthEmu: number;
  heightEmu: number;
  altText: string;
}

/** The colour logo for a Word document, at the standard PLAN_LOGO_HEIGHT_PX (21px ≈ 5.6mm, 86×21px). */
export function planLogoDocx(): PlanDocxLogo {
  const heightPx = PLAN_LOGO_HEIGHT_PX;
  const width = PLAN_LOGO_WIDTH_PX;
  return {
    data: planLogoPngBytes(),
    type: 'png',
    pixelWidth: PLAN_LOGO_PNG_WIDTH,
    pixelHeight: PLAN_LOGO_PNG_HEIGHT,
    width,
    height: heightPx,
    widthEmu: width * EMU_PER_PX,
    heightEmu: heightPx * EMU_PER_PX,
    altText: PLAN_LOGO_ALT,
  };
}

export type DocxFooterPart = { kind: 'text'; text: string } | { kind: 'pageNumber' };

export interface PlanDocxHeaderFooterSpec {
  header: { alignment: 'left'; logo: PlanDocxLogo };
  footer: { alignment: 'center'; fontSizePt: number; parts: DocxFooterPart[] };
}

/**
 * Header and footer for every Word export (same rule as the PDFs): colour logo
 * top-left; "Page N · © CCDesigner <year>" bottom centre. Map to the docx
 * library as: Header([Paragraph({alignment: LEFT, children: [ImageRun(logo)]})]),
 * Footer([Paragraph({alignment: CENTER, children: parts → TextRun / PageNumber.CURRENT})]).
 */
export function planDocxHeaderFooter(opts: { year?: number } = {}): PlanDocxHeaderFooterSpec {
  return {
    header: { alignment: 'left', logo: planLogoDocx() },
    footer: {
      alignment: 'center',
      fontSizePt: 10,
      parts: [
        { kind: 'text', text: 'Page ' },
        { kind: 'pageNumber' },
        { kind: 'text', text: ` · ${planFooterCopyright(opts.year)}` },
      ],
    },
  };
}
