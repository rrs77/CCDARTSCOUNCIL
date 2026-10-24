/**
 * CCDesigner logo for plan outputs (prints, PDFs) and the Planner/Calendar screens.
 * The current lockup (ribbon mark + "designer", the same artwork as the app header and
 * login page). 1027×292 PNG, so it stays sharp at print sizes (~30px tall ≈ 8mm).
 */
export const PLAN_LOGO_PATH = '/ccdesigner-logo.png';
export const PLAN_LOGO_ALT = 'CCDesigner';

let cachedDataUrl: string | null = null;

/**
 * Load the logo once as a data: URL. Print windows (about:blank) and server-side
 * PDF rendering (PDFBolt can't reach localhost) then never wait on a network fetch.
 */
export function preloadPlanLogo(): void {
  if (cachedDataUrl || typeof window === 'undefined' || typeof fetch === 'undefined') return;
  fetch(PLAN_LOGO_PATH)
    .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
    .then(
      (blob) =>
        new Promise<void>((resolve) => {
          const fr = new FileReader();
          fr.onload = () => {
            if (typeof fr.result === 'string') cachedDataUrl = fr.result;
            resolve();
          };
          fr.onerror = () => resolve();
          fr.readAsDataURL(blob);
        }),
    )
    .catch(() => {
      /* fall back to the absolute URL */
    });
}

/** Embedded data: URL when loaded, otherwise an absolute URL. */
export function planLogoUrl(): string {
  if (cachedDataUrl) return cachedDataUrl;
  if (typeof window === 'undefined' || !window.location?.origin) return PLAN_LOGO_PATH;
  return `${window.location.origin}${PLAN_LOGO_PATH}`;
}

preloadPlanLogo();

/** <img> for HTML print templates. Height in px; width follows the artwork. */
export function planLogoHtml(heightPx = 30, extraStyle = ''): string {
  return `<img class="ccd-plan-logo" src="${planLogoUrl()}" alt="${PLAN_LOGO_ALT}" width="${Math.round((heightPx * 1027) / 292)}" height="${heightPx}" style="display:block;height:${heightPx}px;width:${Math.round((heightPx * 1027) / 292)}px;${extraStyle}">`;
}
