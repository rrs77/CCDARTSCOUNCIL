/**
 * Shared helpers for the public Preview / Demo mode.
 *
 * Demo mode is a tab-scoped flag (`sessionStorage["ccd-demo-mode"]="1"`)
 * activated when a visitor clicks "Preview" on a school homepage. While the
 * flag is active:
 *   - AuthContext skips Supabase and injects a synthetic read-only viewer
 *   - DataContext skips Supabase loads and reads from localStorage seeds
 *   - The PreviewBanner is rendered above the main app shell
 *   - All write operations are gated by `useIsViewOnly`
 *
 * The flag and seeded data are cleared on logout.
 */

export const DEMO_MODE_KEY = 'ccd-demo-mode';
export const DEMO_FROM_SCHOOL_KEY = 'ccd-demo-from-school';
export const DEMO_SEED_MARKER_KEY = 'ccd-demo-seeded';

export function isDemoModeActive(): boolean {
  try {
    return typeof window !== 'undefined' && sessionStorage.getItem(DEMO_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

export function activateDemoMode(fromSchoolSlug?: string) {
  try {
    sessionStorage.setItem(DEMO_MODE_KEY, '1');
    if (fromSchoolSlug) {
      sessionStorage.setItem(DEMO_FROM_SCHOOL_KEY, fromSchoolSlug);
    }
  } catch {
    /* sessionStorage may be blocked – degrade gracefully */
  }
}

export function getDemoOriginSchool(): string | null {
  try {
    return sessionStorage.getItem(DEMO_FROM_SCHOOL_KEY);
  } catch {
    return null;
  }
}

export function clearDemoMode() {
  try {
    sessionStorage.removeItem(DEMO_MODE_KEY);
    sessionStorage.removeItem(DEMO_FROM_SCHOOL_KEY);
    sessionStorage.removeItem(DEMO_SEED_MARKER_KEY);
  } catch {
    /* noop */
  }
  clearDemoLocalStorage();
}

/** Exact localStorage keys we own when seeding the demo. */
const DEMO_OWNED_KEYS = [
  'currentSheetInfo',
  'library-activities',
  'user-created-lesson-plans',
  'activity-stacks',
  'custom-year-groups',
  'saved-categories',
  'category-groups',
  'year-group-bands',
  'rhythmstix_user_id',
];

/**
 * Prefixes for per-sheet keys seeded from the account snapshot and the
 * `demo-db-*` tables behind the mock Supabase client. Everything matching
 * these prefixes is wiped on demo exit/reset so the next session starts from
 * the pristine snapshot again.
 */
const DEMO_OWNED_PREFIXES = [
  'demo-db-',
  'lesson-data-',
  'units-',
  'half-terms-',
  'trash-lessons-',
];

/**
 * Wipe all demo-owned localStorage. Called on demo exit and again right
 * before reseeding, so a new session always starts from the pristine
 * snapshot even if the previous demo session ended without logout.
 */
export function clearDemoLocalStorage() {
  try {
    for (const k of DEMO_OWNED_KEYS) {
      localStorage.removeItem(k);
    }
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && DEMO_OWNED_PREFIXES.some((p) => key.startsWith(p))) {
        doomed.push(key);
      }
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* noop */
  }
}
