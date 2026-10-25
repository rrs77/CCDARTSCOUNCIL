/**
 * Reliable Chrome print for lesson plan preview/print tabs.
 * Clones the marked surface onto <body> so nested #root / overflow / portals
 * cannot blank the print preview.
 */

import { PLAN_LOGO_ALT, PLAN_LOGO_COLOUR_STYLE, PLAN_LOGO_HEIGHT_PX, planLogoUrl, planLogoWidthFor } from './planLogo';

const PRINT_ROOT_ID = 'ccd-print-root';

function ensurePrintRoot(): HTMLElement {
  let root = document.getElementById(PRINT_ROOT_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = PRINT_ROOT_ID;
    root.setAttribute('data-ccd-print-root', 'true');
    document.body.appendChild(root);
  }
  return root;
}

function clearPrintRoot() {
  const root = document.getElementById(PRINT_ROOT_ID);
  if (root) root.replaceChildren();
}

/** Find the lesson plan print/preview article currently on screen. */
export function findLessonPlanPrintSource(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>('[data-lesson-plan-print="true"]') ||
    document.querySelector<HTMLElement>('.print-content[data-lesson-plan-print]') ||
    document.querySelector<HTMLElement>('[data-ccd-lesson-plan-panel] article')
  );
}

/**
 * Clone the lesson plan print surface to body and invoke window.print().
 * Falls back to printing whatever is marked if clone fails.
 */
export function printLessonPlanFromDom(source?: HTMLElement | null): void {
  const el = source || findLessonPlanPrintSource();
  if (!el) {
    window.print();
    return;
  }

  const root = ensurePrintRoot();
  clearPrintRoot();
  const clone = el.cloneNode(true) as HTMLElement;
  clone.classList.add('print-content');
  clone.setAttribute('data-lesson-plan-print', 'true');
  // Rhythmstix templates set their own A4 margins via @page and carry the logo in
  // their header slot; legacy surfaces keep 12mm and get the logo prepended.
  const templated = clone.hasAttribute('data-lesson-template');
  clone.style.cssText = `display:block;width:100%;max-width:none;margin:0;padding:${
    templated ? '0' : '12mm'
  };background:#fff;color:#111;`;
  if (!templated) {
    // CCDesigner logo, top-left of every printed plan.
    const logo = document.createElement('img');
    logo.src = planLogoUrl();
    logo.alt = PLAN_LOGO_ALT;
    logo.className = 'ccd-plan-logo';
    logo.dataset.ccdPlanLogo = 'colour';
    logo.width = planLogoWidthFor(PLAN_LOGO_HEIGHT_PX);
    logo.height = PLAN_LOGO_HEIGHT_PX;
    logo.style.cssText = `display:block;height:${PLAN_LOGO_HEIGHT_PX}px;width:${planLogoWidthFor(PLAN_LOGO_HEIGHT_PX)}px;max-width:none;margin:0 0 8px 0;${PLAN_LOGO_COLOUR_STYLE}`;
    clone.insertBefore(logo, clone.firstChild);
  }
  root.appendChild(clone);
  document.documentElement.classList.add('ccd-printing-lesson');

  const cleanup = () => {
    document.documentElement.classList.remove('ccd-printing-lesson');
    clearPrintRoot();
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);

  window.setTimeout(() => {
    try {
      window.print();
    } finally {
      // Safari / some Chromium builds fire afterprint late or not at all
      window.setTimeout(cleanup, 1500);
    }
  }, 50);
}
