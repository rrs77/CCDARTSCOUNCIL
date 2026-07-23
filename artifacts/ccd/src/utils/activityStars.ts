/**
 * Activity Library starring — session star prefs for starred IDs and
 * starred-first sorting. Curated demo / partner hub seeds use this so newly
 * added activities appear at the top without writing to production cloud.
 */

export const ACTIVITY_STARRED_IDS_KEY = 'ccd-starred-activity-ids';
export const ACTIVITY_STARRED_FIRST_CATEGORIES_KEY = 'ccd-starred-first-activity-categories';
export const ACTIVITY_STARRED_FIRST_GLOBAL_KEY = 'ccd-starred-first-activity-global';

/** Dispatched after hub seeds (or UI) update local star prefs. */
export const CCD_ACTIVITY_STARS_UPDATED_EVENT = 'ccd-activity-stars-updated';

export type ActivityStarRef = {
  _id?: string | null;
  id?: string | null;
  activity?: string | null;
  category?: string | null;
};

/** Stable key for starring (prefer DB / local _id). Matches ActivityLibrary. */
export function getActivityStarKey(activity: ActivityStarRef): string {
  if (activity._id) return String(activity._id);
  if (activity.id) return String(activity.id);
  return `h:${activity.activity || ''}::${activity.category || ''}`;
}

function readJsonArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export type LocalStarPrefs = {
  starredIds: string[];
  starredFirstCategories: string[];
  globalStarredFirst: boolean;
};

export function readLocalStarPrefs(): LocalStarPrefs {
  try {
    return {
      starredIds: readJsonArray(ACTIVITY_STARRED_IDS_KEY),
      starredFirstCategories: readJsonArray(ACTIVITY_STARRED_FIRST_CATEGORIES_KEY),
      globalStarredFirst: localStorage.getItem(ACTIVITY_STARRED_FIRST_GLOBAL_KEY) === '1',
    };
  } catch {
    return { starredIds: [], starredFirstCategories: [], globalStarredFirst: false };
  }
}

export function writeLocalStarPrefs(prefs: Partial<LocalStarPrefs> & { starredIds?: Iterable<string> }): void {
  try {
    const current = readLocalStarPrefs();
    const starredIds = prefs.starredIds != null ? [...new Set([...prefs.starredIds].map(String))] : current.starredIds;
    const starredFirstCategories =
      prefs.starredFirstCategories != null
        ? [...new Set(prefs.starredFirstCategories.map(String))]
        : current.starredFirstCategories;
    const globalStarredFirst =
      typeof prefs.globalStarredFirst === 'boolean' ? prefs.globalStarredFirst : current.globalStarredFirst;

    localStorage.setItem(ACTIVITY_STARRED_IDS_KEY, JSON.stringify(starredIds));
    localStorage.setItem(ACTIVITY_STARRED_FIRST_CATEGORIES_KEY, JSON.stringify(starredFirstCategories));
    localStorage.setItem(ACTIVITY_STARRED_FIRST_GLOBAL_KEY, globalStarredFirst ? '1' : '0');
  } catch {
    /* localStorage may be blocked */
  }
}

export function clearLocalStarPrefs(): void {
  try {
    localStorage.removeItem(ACTIVITY_STARRED_IDS_KEY);
    localStorage.removeItem(ACTIVITY_STARRED_FIRST_CATEGORIES_KEY);
    localStorage.removeItem(ACTIVITY_STARRED_FIRST_GLOBAL_KEY);
  } catch {
    /* noop */
  }
}

/**
 * Star activity IDs locally and (by default) enable starred-first so they
 * sort to the top of Activity Library lists. Local only — no Supabase write.
 */
export function starActivitiesLocally(
  ids: Iterable<string>,
  options?: {
    /** Default true — Activity Library only pins starred when this (or per-category) is on. */
    enableGlobalStarredFirst?: boolean;
    /** Optional category names to enable starred-first for. */
    starredFirstCategories?: string[];
    dispatchEvent?: boolean;
  },
): string[] {
  const incoming = [...ids].map(String).filter(Boolean);
  const current = readLocalStarPrefs();
  const starredIds = [...new Set([...current.starredIds, ...incoming])];
  const enableGlobal = options?.enableGlobalStarredFirst !== false;
  const starredFirstCategories = options?.starredFirstCategories
    ? [...new Set([...current.starredFirstCategories, ...options.starredFirstCategories])]
    : current.starredFirstCategories;

  writeLocalStarPrefs({
    starredIds,
    starredFirstCategories,
    globalStarredFirst: enableGlobal ? true : current.globalStarredFirst,
  });

  if (options?.dispatchEvent !== false && typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(CCD_ACTIVITY_STARS_UPDATED_EVENT, {
        detail: { starredIds, source: 'starActivitiesLocally' },
      }),
    );
  }

  return starredIds;
}

/** Star a list of activity objects using getActivityStarKey. */
export function starActivityObjectsLocally(
  activities: ActivityStarRef[],
  options?: Parameters<typeof starActivitiesLocally>[1],
): string[] {
  return starActivitiesLocally(
    activities.map((a) => getActivityStarKey(a)),
    options,
  );
}
