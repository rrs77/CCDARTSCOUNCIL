import type { BoltOnsPageId } from './types';

const PATH_BY_PAGE: Record<BoltOnsPageId, string> = {
  'bolt-ons': '/bolt-ons',
  assessify: '/bolt-ons/assessify',
  perifeedback: '/bolt-ons/perifeedback',
};

const PAGE_BY_PATH: Record<string, BoltOnsPageId> = {
  '/bolt-ons': 'bolt-ons',
  '/bolt-ons/': 'bolt-ons',
  '/bolt-ons/assessify': 'assessify',
  '/bolt-ons/assessify/': 'assessify',
  '/bolt-ons/perifeedback': 'perifeedback',
  '/bolt-ons/perifeedback/': 'perifeedback',
};

const TAB_ALIASES: Record<string, BoltOnsPageId> = {
  'bolt-ons': 'bolt-ons',
  bolt_ons: 'bolt-ons',
  boltons: 'bolt-ons',
  assessify: 'assessify',
  perifeedback: 'perifeedback',
  'peri-feedback': 'perifeedback',
};

export function boltOnsPath(page: BoltOnsPageId): string {
  return PATH_BY_PAGE[page];
}

export function isBoltOnsPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, '') || '/';
  return p === '/bolt-ons' || p.startsWith('/bolt-ons/');
}

export function pageFromBoltOnsPath(pathname: string): BoltOnsPageId | null {
  const normalised = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  return PAGE_BY_PATH[normalised] ?? PAGE_BY_PATH[`${normalised}/`] ?? null;
}

export function pageFromTabParam(tab: string | null | undefined): BoltOnsPageId | null {
  if (!tab) return null;
  return TAB_ALIASES[tab.toLowerCase()] ?? null;
}

/** Resolve initial bolt-ons page from path or ?tab= */
export function resolveBoltOnsPageFromLocation(
  pathname = typeof window !== 'undefined' ? window.location.pathname : '/',
  search = typeof window !== 'undefined' ? window.location.search : '',
): BoltOnsPageId | null {
  const fromPath = pageFromBoltOnsPath(pathname);
  if (fromPath) return fromPath;
  try {
    return pageFromTabParam(new URLSearchParams(search).get('tab'));
  } catch {
    return null;
  }
}

export function syncBoltOnsUrl(page: BoltOnsPageId): void {
  if (typeof window === 'undefined') return;
  const next = boltOnsPath(page);
  const current = `${window.location.pathname}${window.location.search}`;
  if (current === next || window.location.pathname === next) {
    if (window.location.search) {
      window.history.replaceState({}, '', next);
    }
    return;
  }
  window.history.replaceState({}, '', next);
}

/** When leaving bolt-ons for another shell tab, restore the app home path. */
export function clearBoltOnsUrlIfPresent(): void {
  if (typeof window === 'undefined') return;
  if (!isBoltOnsPath(window.location.pathname)) return;
  window.history.replaceState({}, '', '/');
}
