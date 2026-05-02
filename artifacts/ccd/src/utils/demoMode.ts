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

/** localStorage keys we own when seeding the demo. */
const DEMO_OWNED_KEYS = [
  'currentSheetInfo',
  'library-activities',
  'lesson-data-DEMO',
  'units-DEMO',
  'half-terms-DEMO-2025-2026',
  'half-terms-DEMO-2026-2027',
  'trash-lessons-DEMO',
  'user-created-lesson-plans',
];

function clearDemoLocalStorage() {
  try {
    for (const k of DEMO_OWNED_KEYS) {
      localStorage.removeItem(k);
    }
  } catch {
    /* noop */
  }
}
