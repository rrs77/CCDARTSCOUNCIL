import type { HelpTopicId } from './topics';
import { HELP_TOPICS, isHelpTopicId } from './topics';

export function helpHomePath(): string {
  return '/help';
}

export function helpTopicPath(topic: HelpTopicId): string {
  return `/help/${topic}`;
}

export function isHelpPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, '') || '/';
  return p === '/help' || p.startsWith('/help/');
}

export function topicFromHelpPath(pathname: string): HelpTopicId | null {
  const normalised = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  if (normalised === '/help') return null;
  const match = normalised.match(/^\/help\/([a-z0-9-]+)$/i);
  if (!match) return null;
  const slug = match[1].toLowerCase();
  // Aliases for older modal section ids
  const aliases: Record<string, HelpTopicId> = {
    activities: 'activity',
    'activity-library': 'activity',
    lessons: 'lesson',
    'lesson-builder': 'lesson',
    units: 'unit',
    calendar: 'assign',
    'half-terms': 'halfterms',
    'half-term': 'halfterms',
    hubs: 'partners',
    'partner-hubs': 'partners',
    passwords: 'account',
  };
  if (aliases[slug]) return aliases[slug];
  if (isHelpTopicId(slug)) return slug;
  return null;
}

export function syncHelpUrl(topic: HelpTopicId | null): void {
  if (typeof window === 'undefined') return;
  const next = topic ? helpTopicPath(topic) : helpHomePath();
  const current = window.location.pathname.replace(/\/+$/, '') || '/';
  const target = next.replace(/\/+$/, '');
  if (current === target) return;
  window.history.pushState({}, '', next);
}

export function clearHelpUrlIfPresent(): void {
  if (typeof window === 'undefined') return;
  if (!isHelpPath(window.location.pathname)) return;
  window.history.replaceState({}, '', '/');
}

/** Open Help as a full page (URL + shell tab). */
export function navigateToHelp(topic?: HelpTopicId | string | null): void {
  if (typeof window === 'undefined') return;
  let resolved: HelpTopicId | null = null;
  if (topic) {
    const raw = String(topic).trim().toLowerCase();
    resolved = topicFromHelpPath(`/help/${raw}`) ?? (isHelpTopicId(raw) ? raw : null);
  }
  const next = resolved ? helpTopicPath(resolved) : helpHomePath();
  const current = `${window.location.pathname}${window.location.search}`;
  if (current !== next) {
    window.history.pushState({}, '', next);
  }
  window.dispatchEvent(new CustomEvent('ccd:open-tab', { detail: { tab: 'help' } }));
  window.dispatchEvent(
    new CustomEvent('ccd:help-topic', { detail: { topic: resolved } }),
  );
}

export function allHelpTopicIds(): HelpTopicId[] {
  return HELP_TOPICS.map((t) => t.id);
}
