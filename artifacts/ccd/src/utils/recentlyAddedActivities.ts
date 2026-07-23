/**
 * Activity Library “Recently added” — local-only list of hub-picked activities
 * (We Teach Drama / iCompose paid hubs). Entries are pushed only after the user
 * clicks Add to CCDesigner on the partner hub.
 */

import {
  getActivityStarKey,
  starActivityObjectsLocally,
  type ActivityStarRef,
} from './activityStars';

export const RECENTLY_ADDED_KEY = 'ccd-recently-added-activities-v1';
export const CCD_RECENTLY_ADDED_UPDATED_EVENT = 'ccd-recently-added-updated';

export type PaidHubPartnerSlug = 'weteachdrama' | 'icompose';

export type RecentlyAddedEntry = {
  activityId: string;
  partnerSlug: PaidHubPartnerSlug;
  partnerLabel: string;
  title: string;
  category?: string;
  addedAt: string;
  /** Premium / partner highlight — shown with a star in Recently added */
  starred: boolean;
};

function readRaw(): RecentlyAddedEntry[] {
  try {
    const raw = localStorage.getItem(RECENTLY_ADDED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e) =>
        e &&
        typeof e.activityId === 'string' &&
        (e.partnerSlug === 'weteachdrama' || e.partnerSlug === 'icompose'),
    ) as RecentlyAddedEntry[];
  } catch {
    return [];
  }
}

function writeRaw(entries: RecentlyAddedEntry[]): void {
  try {
    localStorage.setItem(RECENTLY_ADDED_KEY, JSON.stringify(entries));
  } catch {
    /* quota / private mode */
  }
}

function dispatchUpdated(entries: RecentlyAddedEntry[]): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(CCD_RECENTLY_ADDED_UPDATED_EVENT, {
      detail: { entries },
    }),
  );
}

export function readRecentlyAdded(): RecentlyAddedEntry[] {
  return readRaw();
}

export function clearRecentlyAdded(): void {
  try {
    localStorage.removeItem(RECENTLY_ADDED_KEY);
  } catch {
    /* noop */
  }
  dispatchUpdated([]);
}

/**
 * Prepend picked activities into Recently added (newest first). Dedupes by activityId.
 */
export function pushRecentlyAdded(
  entries: Array<Omit<RecentlyAddedEntry, 'addedAt'> & { addedAt?: string }>,
  options?: { limit?: number },
): RecentlyAddedEntry[] {
  const limit = options?.limit ?? 24;
  const now = new Date().toISOString();
  const incoming: RecentlyAddedEntry[] = entries
    .filter((e) => e?.activityId)
    .map((e) => ({
      activityId: String(e.activityId),
      partnerSlug: e.partnerSlug,
      partnerLabel: e.partnerLabel,
      title: e.title || 'Activity',
      category: e.category,
      starred: e.starred !== false,
      addedAt: e.addedAt || now,
    }));

  if (incoming.length === 0) return readRaw();

  const seen = new Set(incoming.map((e) => e.activityId));
  const kept = readRaw().filter((e) => !seen.has(e.activityId));
  const next = [...incoming, ...kept].slice(0, limit);
  writeRaw(next);
  dispatchUpdated(next);
  return next;
}

/**
 * Pick a subset of seeded activities by title (order preserved), star them,
 * and surface them in Activity Library → Recently added.
 */
type HighlightableActivity = ActivityStarRef & {
  activity?: string | null;
  category?: string | null;
};

export function highlightPaidHubActivities(
  activities: HighlightableActivity[],
  options: {
    partnerSlug: PaidHubPartnerSlug;
    partnerLabel: string;
    /** Preferred activity titles to feature (star + Recently added). */
    pickTitles: string[];
    /** Fallback count when titles don’t match (e.g. re-seed id drift). */
    fallbackCount?: number;
    categories?: string[];
  },
): { featured: HighlightableActivity[]; starredIds: string[] } {
  const titleSet = new Set(options.pickTitles.map((t) => t.trim().toLowerCase()));
  let featured = activities.filter((a) =>
    titleSet.has(String(a.activity || '').trim().toLowerCase()),
  );
  if (featured.length === 0) {
    const n = Math.max(1, options.fallbackCount ?? 3);
    featured = activities.slice(0, Math.min(n, activities.length));
  }

  const starredIds = starActivityObjectsLocally(featured, {
    enableGlobalStarredFirst: true,
    starredFirstCategories: options.categories,
  });

  pushRecentlyAdded(
    featured.map((a) => ({
      activityId: getActivityStarKey(a),
      partnerSlug: options.partnerSlug,
      partnerLabel: options.partnerLabel,
      title: String(a.activity || 'Activity'),
      category: a.category ? String(a.category) : undefined,
      starred: true,
    })),
  );

  return { featured, starredIds };
}
