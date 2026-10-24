/**
 * Path-based URLs for the main Studio screens (mirrors settings/help routing).
 * Legacy `?tab=` deep links still resolve via resolveMainTabFromLocation.
 */

export type MainTabId =
  | 'unit-viewer'
  | 'curriculum'
  | 'lesson-library'
  | 'activity-library'
  | 'lesson-viewer'
  | 'our-partners'
  | 'contact-us'
  | 'more'
  | 'settings'
  | 'help';

const PATH_BY_TAB: Partial<Record<MainTabId, string>> = {
  'unit-viewer': '/planner',
  curriculum: '/half-terms',
  'lesson-library': '/lessons',
  'activity-library': '/activities',
  'lesson-viewer': '/viewer',
  'our-partners': '/partners',
  'contact-us': '/contact',
  more: '/more',
};

const TAB_BY_PATH: Record<string, MainTabId> = {
  '/': 'unit-viewer',
  '/planner': 'unit-viewer',
  '/calendar': 'unit-viewer',
  '/half-terms': 'curriculum',
  '/halfterms': 'curriculum',
  '/curriculum': 'curriculum',
  '/lessons': 'lesson-library',
  '/lesson-library': 'lesson-library',
  '/lesson-builder': 'lesson-library',
  '/activities': 'activity-library',
  '/activity-library': 'activity-library',
  '/viewer': 'lesson-viewer',
  '/lesson-viewer': 'lesson-viewer',
  '/partners': 'our-partners',
  '/our-partners': 'our-partners',
  '/contact': 'contact-us',
  '/contact-us': 'contact-us',
  '/more': 'more',
};

const MAIN_PATHS = new Set(Object.keys(TAB_BY_PATH));

export function mainPathForTab(tab: string): string | null {
  return PATH_BY_TAB[tab as MainTabId] ?? null;
}

export function isMainAppPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, '') || '/';
  return MAIN_PATHS.has(p);
}

export function tabFromMainPath(pathname: string): MainTabId | null {
  const normalised = pathname.replace(/\/+$/, '') || '/';
  return TAB_BY_PATH[normalised] ?? null;
}

/** Resolve main tab from path or legacy ?tab= (settings/help/bolt-ons handled elsewhere). */
export function resolveMainTabFromLocation(
  pathname = typeof window !== 'undefined' ? window.location.pathname : '/',
  search = typeof window !== 'undefined' ? window.location.search : '',
): MainTabId | null {
  const fromPath = tabFromMainPath(pathname);
  if (fromPath) return fromPath;
  try {
    const params = new URLSearchParams(search);
    const tab = params.get('tab');
    if (!tab) return null;
    if (tab === 'lesson-builder' || tab === 'calendar') {
      return tab === 'calendar' ? 'unit-viewer' : 'lesson-library';
    }
    if (tab in PATH_BY_TAB || tab === 'unit-viewer' || tab === 'curriculum') {
      return tab as MainTabId;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function syncMainUrl(tab: string): void {
  if (typeof window === 'undefined') return;
  const next = mainPathForTab(tab);
  if (!next) return;
  const current = window.location.pathname.replace(/\/+$/, '') || '/';
  const target = next.replace(/\/+$/, '') || '/';
  if (current === target && !window.location.search) return;
  // Drop legacy ?tab= when writing a clean path
  window.history.pushState({}, '', next);
}

export function clearMainUrlIfPresent(): void {
  if (typeof window === 'undefined') return;
  if (!isMainAppPath(window.location.pathname)) return;
  // Leave path; caller navigates to settings/help/bolt-ons which replace it
}
