/**
 * Shared helpers for the public Preview / Demo mode.
 *
 * Demo mode is a tab-scoped flag (`sessionStorage["ccd-demo-mode"]="1"`)
 * activated when a visitor clicks "Preview" on a school homepage. While the
 * flag is active:
 *   - AuthContext skips Supabase and injects a synthetic read-only viewer
 *   - DataContext skips Supabase loads and reads from localStorage seeds
 *   - All write operations are gated by `useIsViewOnly`
 *
 * The purple PreviewBanner is intentionally off for Arts Council / partner-hub
 * prototypes (`SHOW_PREVIEW_BANNER`). Flip that constant to re-enable it.
 *
 * The flag and seeded data are cleared on logout.
 */

export const DEMO_MODE_KEY = 'ccd-demo-mode';
export const DEMO_FROM_SCHOOL_KEY = 'ccd-demo-from-school';
export const DEMO_SEED_MARKER_KEY = 'ccd-demo-seeded';

/** Purple "exploring a sample curriculum" bar — hidden for ACE prototype. */
export const SHOW_PREVIEW_BANNER = false;

export function isDemoModeActive(): boolean {
  try {
    return typeof window !== 'undefined' && sessionStorage.getItem(DEMO_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Whether to render PreviewBanner and reserve top layout space for it. */
export function shouldShowPreviewBanner(): boolean {
  return SHOW_PREVIEW_BANNER && isDemoModeActive();
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
  'lesson-stacks',
  'custom-year-groups',
  'saved-categories',
  'category-groups',
  'year-group-bands',
  // Year-group section presets (EYFS/KS1/…) — cleared then reseeded from the
  // login-account snapshot / captured Settings so nesting survives demo entry.
  'year-group-sections',
  'year-group-sections-auto-migrated-v2',
  'year-group-sections-auto-migrated-v3',
  'rhythmstix_user_id',
  'ccd-starred-activity-ids',
  'ccd-starred-first-activity-categories',
  'ccd-starred-first-activity-global',
  'ccd-partner-planning-v1',
  'ccd-important-dates-v1',
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
  'calendar-events-',
  // Demo seed markers for partner hubs + curated packs (cleared then re-seeded)
  'ccd-roh-',
  'ccd-lso-',
  'ccd-wtd-',
  'ccd-ks3-',
  'ccd-ocr-',
  'ccd-starred-',
  'ccd-partner-planning-',
  'ccd-important-dates-',
  'prototype-objectives-',
];

/**
 * Wipe demo-owned localStorage (seeded packs + visitor edits). Called on demo
 * exit and again right before reseeding. Packs are not “gone forever” — the
 * next `seedDemoData()` restores curated packs; only session edits stay wiped.
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
