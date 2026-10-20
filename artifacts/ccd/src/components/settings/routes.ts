import type { SettingsSectionId } from './settingsSections';
import { DEFAULT_SETTINGS_SECTION, isSettingsSectionId } from './settingsSections';

const PATH_BY_SECTION: Record<SettingsSectionId, string> = {
  classes: '/settings/classes',
  folders: '/settings/folders',
  objectives: '/settings/objectives',
  preferences: '/settings/preferences',
  downloads: '/settings/downloads',
  users: '/settings/users',
  school: '/settings/school',
};

const SECTION_BY_PATH: Record<string, SettingsSectionId> = {
  '/settings': 'classes',
  '/settings/': 'classes',
  '/settings/classes': 'classes',
  '/settings/classes/': 'classes',
  '/settings/folders': 'folders',
  '/settings/folders/': 'folders',
  '/settings/objectives': 'objectives',
  '/settings/objectives/': 'objectives',
  '/settings/preferences': 'preferences',
  '/settings/preferences/': 'preferences',
  '/settings/downloads': 'downloads',
  '/settings/downloads/': 'downloads',
  '/settings/users': 'users',
  '/settings/users/': 'users',
  '/settings/school': 'school',
  '/settings/school/': 'school',
  // Legacy tab ids used by sessionStorage / Partner Hub deep links
  '/settings/yeargroups': 'classes',
  '/settings/categories': 'folders',
  '/settings/admin': 'objectives',
  '/settings/resource-links': 'preferences',
  '/settings/my-downloads': 'downloads',
  '/settings/hub-admin': 'school',
  '/settings/branding': 'school',
  '/settings/data': 'school',
  '/settings/manage-packs': 'school',
  '/settings/system-categories': 'school',
  '/settings/hub-content': 'school',
};

/** Map old modal tab ids / sessionStorage values → section ids */
const LEGACY_TAB_TO_SECTION: Record<string, SettingsSectionId> = {
  yeargroups: 'classes',
  classes: 'classes',
  categories: 'folders',
  folders: 'folders',
  admin: 'objectives',
  objectives: 'objectives',
  'resource-links': 'preferences',
  preferences: 'preferences',
  general: 'preferences',
  'my-downloads': 'downloads',
  downloads: 'downloads',
  'download-analytics': 'downloads',
  users: 'users',
  people: 'users',
  'hub-admin': 'school',
  branding: 'school',
  data: 'school',
  'manage-packs': 'school',
  'system-categories': 'school',
  'hub-content': 'school',
  school: 'school',
};

export function settingsPath(section: SettingsSectionId = DEFAULT_SETTINGS_SECTION): string {
  return PATH_BY_SECTION[section] ?? PATH_BY_SECTION.classes;
}

export function isSettingsPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, '') || '/';
  return p === '/settings' || p.startsWith('/settings/');
}

export function sectionFromSettingsPath(pathname: string): SettingsSectionId | null {
  const normalised = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  return SECTION_BY_PATH[normalised] ?? SECTION_BY_PATH[`${normalised}/`] ?? null;
}

export function sectionFromLegacyTab(tab: string | null | undefined): SettingsSectionId | null {
  if (!tab) return null;
  const key = tab.trim().toLowerCase();
  return LEGACY_TAB_TO_SECTION[key] ?? (isSettingsSectionId(key) ? key : null);
}

/** Resolve settings section from path, ?section=, ?tab=, or legacy sessionStorage */
export function resolveSettingsSectionFromLocation(
  pathname = typeof window !== 'undefined' ? window.location.pathname : '/',
  search = typeof window !== 'undefined' ? window.location.search : '',
): SettingsSectionId | null {
  try {
    const params = new URLSearchParams(search);
    // Legacy school tools → Users
    if (params.get('panel') === 'users') return 'users';
  } catch {
    /* ignore */
  }
  const fromPath = sectionFromSettingsPath(pathname);
  if (fromPath) {
    // /settings/school?panel=users already handled above; keep school otherwise
    return fromPath;
  }
  try {
    const params = new URLSearchParams(search);
    const fromSection = sectionFromLegacyTab(params.get('section'));
    if (fromSection) return fromSection;
    const fromTab = sectionFromLegacyTab(params.get('tab'));
    if (fromTab && (params.get('tab') === 'settings' || isSettingsPath(pathname))) {
      return fromTab;
    }
    // ?tab=settings → default section
    if (params.get('tab') === 'settings') return DEFAULT_SETTINGS_SECTION;
  } catch {
    /* ignore */
  }
  return null;
}

export function syncSettingsUrl(section: SettingsSectionId): void {
  if (typeof window === 'undefined') return;
  const next = settingsPath(section);
  const current = `${window.location.pathname}${window.location.search}`;
  if (current === next || window.location.pathname === next) {
    if (window.location.search) {
      window.history.replaceState({}, '', next);
    }
    return;
  }
  window.history.pushState({}, '', next);
}

/** When leaving Settings for another shell tab, restore the app home path. */
export function clearSettingsUrlIfPresent(): void {
  if (typeof window === 'undefined') return;
  if (!isSettingsPath(window.location.pathname)) return;
  window.history.replaceState({}, '', '/');
}

const SCHOOL_PANEL_LEGACY = new Set([
  'hub-admin',
  'hub-content',
  'branding',
  'manage-packs',
  'system-categories',
  'data',
]);

/** Open Settings as a full page (URL + shell tab). Optional legacy tab id maps to a section. */
export function navigateToSettings(legacyTabOrSection?: string): void {
  const raw = legacyTabOrSection?.trim().toLowerCase() || '';
  // Legacy "users" under school tools → top-level Users section
  const section =
    raw === 'users' || raw === 'people'
      ? ('users' as SettingsSectionId)
      : sectionFromLegacyTab(raw) ?? DEFAULT_SETTINGS_SECTION;
  const schoolPanel = SCHOOL_PANEL_LEGACY.has(raw) ? raw : null;
  try {
    sessionStorage.removeItem('ccd-open-settings-tab');
  } catch {
    /* ignore */
  }
  if (typeof window === 'undefined') return;
  let next = settingsPath(section);
  if (schoolPanel) {
    next = `${next}?panel=${encodeURIComponent(schoolPanel)}`;
  }
  const current = `${window.location.pathname}${window.location.search}`;
  if (current !== next) {
    window.history.pushState({}, '', next);
  }
  window.dispatchEvent(new CustomEvent('ccd:open-tab', { detail: { tab: 'settings' } }));
  window.dispatchEvent(
    new CustomEvent('ccd:settings-section', {
      detail: { section: schoolPanel || section },
    }),
  );
}
