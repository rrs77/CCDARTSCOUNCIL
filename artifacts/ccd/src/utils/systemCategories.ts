/**
 * System (app) categories vs user-created categories.
 * Activities keep category as a name string — never duplicated per user.
 */

export type CategorySource = 'system' | 'user';

export type CategoryYearGroupMode = 'selected' | 'all';

export interface CategoryLike {
  id?: string;
  name: string;
  color: string;
  position: number;
  group?: string;
  groups?: string[];
  yearGroups: Record<string, boolean | undefined>;
  source?: CategorySource;
  /** Soft-hide system category for this user (or globally for system catalog). */
  hidden?: boolean;
  /** selected = use yearGroups map; all = every active (non-hidden) year group. */
  yearGroupMode?: CategoryYearGroupMode;
}

/** Built-in catalog — seed for system:categories and offline fallback. */
export const DEFAULT_SYSTEM_CATEGORIES: CategoryLike[] = [
  { name: 'Welcome', color: '#10b981', position: 0, yearGroups: {}, source: 'system' },
  { name: 'Kodaly Songs', color: '#3b82f6', position: 1, yearGroups: {}, source: 'system' },
  { name: 'Kodaly Action Songs', color: '#f97316', position: 2, yearGroups: {}, source: 'system' },
  { name: 'Action/Games Songs', color: '#f59e0b', position: 3, yearGroups: {}, source: 'system' },
  { name: 'Rhythm Sticks', color: '#d97706', position: 4, yearGroups: {}, source: 'system' },
  { name: 'Scarf Songs', color: '#10b981', position: 5, yearGroups: {}, source: 'system' },
  { name: 'General Game', color: '#06b6d4', position: 6, yearGroups: {}, source: 'system' },
  { name: 'Core Songs', color: '#84cc16', position: 7, yearGroups: {}, source: 'system' },
  { name: 'Parachute Games', color: '#ef4444', position: 8, yearGroups: {}, source: 'system' },
  { name: 'Percussion Games', color: '#06b6d4', position: 9, yearGroups: {}, source: 'system' },
  { name: 'Teaching Units', color: '#6366f1', position: 10, yearGroups: {}, source: 'system' },
  { name: 'Goodbye', color: '#14b8a6', position: 11, yearGroups: {}, source: 'system' },
  { name: 'Kodaly Rhythms', color: '#8b5cf6', position: 12, yearGroups: {}, source: 'system' },
  { name: 'Kodaly Games', color: '#ec4899', position: 13, yearGroups: {}, source: 'system' },
  { name: 'IWB Games', color: '#f59e0b', position: 14, yearGroups: {}, source: 'system' },
  { name: 'Drama Games', color: '#8b5cf6', position: 15, yearGroups: {}, source: 'system' },
  { name: 'Vocal Warmups', color: '#ec4899', position: 16, yearGroups: {}, source: 'system' },
];

export const SYSTEM_CATEGORY_NAMES = new Set(
  DEFAULT_SYSTEM_CATEGORIES.map((c) => c.name.toLowerCase())
);

/** Names that must always reappear even if previously "deleted". */
export const REQUIRED_SYSTEM_CATEGORY_NAMES = new Set(['Drama Games', 'Vocal Warmups']);

export function isSystemCategoryName(name: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  if (SYSTEM_CATEGORY_NAMES.has(lower)) return true;
  // DB sometimes uses hyphenated Vocal Warm-Ups
  if (lower === 'vocal warm-ups' || lower === 'vocal warm ups') return true;
  return false;
}

export function tagCategorySource<T extends CategoryLike>(cat: T): T {
  const source: CategorySource =
    cat.source === 'user' || cat.source === 'system'
      ? cat.source
      : isSystemCategoryName(cat.name)
        ? 'system'
        : 'user';
  return { ...cat, source };
}

export function tagCategoriesSource<T extends CategoryLike>(cats: T[]): T[] {
  return (cats || []).map((c) => tagCategorySource(c));
}

export function isUserCategory(cat: CategoryLike): boolean {
  return tagCategorySource(cat).source === 'user';
}

export function isSystemCategory(cat: CategoryLike): boolean {
  return tagCategorySource(cat).source === 'system';
}

/** Stable localStorage key; falls back to legacy unscoped key for dual-read. */
export function categoriesStorageKey(userId: string | null | undefined): string {
  if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return `saved-categories:${userId}`;
  }
  return 'saved-categories';
}

export const LEGACY_CATEGORIES_STORAGE_KEY = 'saved-categories';

/**
 * Merge cloud user categories with local and ensure system catalog rows exist.
 * Prefer cloud yearGroups when present; otherwise keep local ticks.
 * Never drops user customs that exist only locally.
 */
export function mergeCategoryLayers(opts: {
  systemCatalog: CategoryLike[];
  cloudOrUser: CategoryLike[];
  local?: CategoryLike[];
  deletedSystemNames?: Set<string>;
}): CategoryLike[] {
  const {
    systemCatalog,
    cloudOrUser,
    local = [],
    deletedSystemNames = new Set(),
  } = opts;

  const byName = new Map<string, CategoryLike>();

  const upsert = (cat: CategoryLike, preferYearGroupsFromIncoming: boolean) => {
    if (!cat?.name) return;
    const tagged = tagCategorySource(cat);
    const existing = byName.get(tagged.name);
    if (!existing) {
      byName.set(tagged.name, { ...tagged });
      return;
    }
    const incomingYg = tagged.yearGroups || {};
    const existingYg = existing.yearGroups || {};
    const incomingHasTicks = Object.values(incomingYg).some((v) => v === true);
    const existingHasTicks = Object.values(existingYg).some((v) => v === true);
    const yearGroups =
      preferYearGroupsFromIncoming && incomingHasTicks
        ? incomingYg
        : existingHasTicks
          ? existingYg
          : incomingHasTicks
            ? incomingYg
            : existingYg;

    byName.set(tagged.name, {
      ...existing,
      ...tagged,
      // Keep system source if either side is system
      source:
        existing.source === 'system' || tagged.source === 'system' ? 'system' : tagged.source || existing.source,
      yearGroups,
      color: tagged.color || existing.color,
      position: typeof tagged.position === 'number' ? tagged.position : existing.position,
      group: tagged.group ?? existing.group,
      groups: tagged.groups?.length ? tagged.groups : existing.groups,
      hidden: tagged.hidden ?? existing.hidden,
      yearGroupMode: tagged.yearGroupMode ?? existing.yearGroupMode,
      id: tagged.id ?? existing.id,
    });
  };

  // 1) System catalog baseline
  systemCatalog.forEach((c) => {
    if (deletedSystemNames.has(c.name) && !REQUIRED_SYSTEM_CATEGORY_NAMES.has(c.name)) return;
    upsert({ ...c, source: 'system' }, false);
  });

  // 2) Local (may have unsynced ticks / customs)
  local.forEach((c) => upsert(c, true));

  // 3) Cloud / authoritative user doc wins year-group ticks when set
  cloudOrUser.forEach((c) => upsert(c, true));

  return Array.from(byName.values()).sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0)
  );
}

export function categoryHasYearGroupAssignment(cat: CategoryLike): boolean {
  if (cat.yearGroupMode === 'all') return true;
  const yg = cat.yearGroups || {};
  return Object.values(yg).some((v) => v === true);
}

/** Names of Settings categories assigned to the given year-group keys (for library dropdowns). */
export function settingsCategoryNamesForYearGroupKeys(
  categories: CategoryLike[],
  yearGroupKeys: string[],
  assignedFn: (yearGroups: Record<string, boolean | undefined>, keys: string[]) => boolean
): string[] {
  if (!yearGroupKeys.length) {
    return categories.filter((c) => !c.hidden).map((c) => c.name);
  }
  return categories
    .filter((c) => {
      if (c.hidden) return false;
      if (c.yearGroupMode === 'all') return true;
      return assignedFn(c.yearGroups || {}, yearGroupKeys);
    })
    .map((c) => c.name);
}
