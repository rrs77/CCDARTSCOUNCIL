/**
 * Feature-demo film mode — hides prototype notice + disclaimer chrome
 * so recorded video shows a clean login/app hero.
 *
 * Activate with `?ccd-feature-demo=1` (or sessionStorage flag set by the recorder).
 */
export const FEATURE_DEMO_FILM_PARAM = 'ccd-feature-demo';
export const FEATURE_DEMO_FILM_KEY = 'ccd-feature-demo';

export function isFeatureDemoFilmMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get(FEATURE_DEMO_FILM_PARAM) === '1') return true;
    if (sessionStorage.getItem(FEATURE_DEMO_FILM_KEY) === '1') return true;
  } catch {
    /* ignore */
  }
  return false;
}

/** Apply html.ccd-feature-demo / data-ccd-record for CSS hide rules. Safe early in boot. */
export function applyFeatureDemoFilmClass(): boolean {
  if (typeof document === 'undefined') return false;
  const on = isFeatureDemoFilmMode();
  document.documentElement.classList.toggle('ccd-feature-demo', on);
  if (on) {
    document.documentElement.setAttribute('data-ccd-record', '1');
    try {
      sessionStorage.setItem(FEATURE_DEMO_FILM_KEY, '1');
    } catch {
      /* ignore */
    }
  } else {
    document.documentElement.removeAttribute('data-ccd-record');
  }
  return on;
}
