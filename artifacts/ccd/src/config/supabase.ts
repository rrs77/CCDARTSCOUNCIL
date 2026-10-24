import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isDemoModeActive } from '../utils/demoMode';
import { createDemoSupabaseClient } from '../utils/demoDb';

// Use env vars in Vercel (or any host). Fail closed when the anon key is missing.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wiudrzdkbpyziaodqoog.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY. Set it in the environment before starting the app.',
  );
}

if (!supabaseUrl) {
  throw new Error(
    'Missing VITE_SUPABASE_URL. Set it in the environment before starting the app.',
  );
}

// Supabase Auth is enabled by default (fail-closed).
// Set VITE_USE_SUPABASE_AUTH=false only to explicitly disable it (e.g. during local dev without a Supabase project).
const useSupabaseAuth = import.meta.env.VITE_USE_SUPABASE_AUTH !== 'false';

/** Session cookie set when user chooses "Require password each time". When set, we use sessionStorage so session ends when browser closes. */
const SESSION_ONLY_COOKIE = 'ccd_session_only';

function useSessionStorageForAuth(): boolean {
  if (typeof document === 'undefined' || !document.cookie) return false;
  return document.cookie.includes(`${SESSION_ONLY_COOKIE}=`);
}

const customAuthStorage = {
  getItem: (key: string): string | null =>
    useSessionStorageForAuth() ? sessionStorage.getItem(key) : localStorage.getItem(key),
  setItem: (key: string, value: string): void =>
    (useSessionStorageForAuth() ? sessionStorage : localStorage).setItem(key, value),
  removeItem: (key: string): void =>
    (useSessionStorageForAuth() ? sessionStorage : localStorage).removeItem(key),
};

/** Call before sign-in when user chose "Require password each time". Session will be stored in sessionStorage and cleared when the browser/tab closes. */
export function setSessionOnlyCookie() {
  document.cookie = `${SESSION_ONLY_COOKIE}=1; path=/; SameSite=Lax`;
}

// Live client is always constructed so we can detect a real signed-in session
// even if a leftover Preview/Demo flag is still set in sessionStorage.
// Data reads/writes in demo mode still go through the mock (see Proxy below).
const liveSupabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: useSupabaseAuth,
      autoRefreshToken: useSupabaseAuth,
      detectSessionInUrl: useSupabaseAuth,
      ...(useSupabaseAuth && { storage: customAuthStorage }),
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey
      }
    }
  }
);

let demoSupabase: SupabaseClient | null = null;

function getDemoSupabase(): SupabaseClient {
  if (!demoSupabase) {
    demoSupabase = createDemoSupabaseClient() as SupabaseClient;
  }
  return demoSupabase;
}

/**
 * Real Supabase client — always use this for auth session checks / sign-in /
 * sign-out / password updates. Never the demo mock.
 */
export function getLiveSupabase(): SupabaseClient {
  return liveSupabase;
}

/**
 * App-facing client. In Preview/Demo mode routes to the localStorage mock so
 * visitor writes never hit the live project. Outside demo mode, the live client.
 * Re-evaluates on every access so clearing demo mode after a real login
 * immediately switches back to live (unlike the old module-load freeze).
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, _receiver) {
    const client = isDemoModeActive() ? getDemoSupabase() : liveSupabase;
    const value = Reflect.get(client as object, prop, client);
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
});

export const isSupabaseAuthEnabled = () => useSupabaseAuth;

// Database table names
export const TABLES = {
  ACTIVITIES: 'activities',
  LESSONS: 'lessons',
  LESSON_PLANS: 'lesson_plans',
  EYFS_STATEMENTS: 'eyfs_statements',
  HALF_TERMS: 'half_terms',
  YEAR_GROUPS: 'year_groups',
  /** Used for category list + year group assignments (same table as ~2 weeks ago when persistence worked). */
  CUSTOM_CATEGORIES: 'custom_categories',
  /** Alternative table; app currently uses custom_categories. */
  CATEGORIES: 'categories',
  CATEGORY_GROUPS: 'category_groups',
  CUSTOM_OBJECTIVE_YEAR_GROUPS: 'custom_objective_year_groups',
  CUSTOM_OBJECTIVE_AREAS: 'custom_objective_areas',
  CUSTOM_OBJECTIVES: 'custom_objectives',
  ACTIVITY_CUSTOM_OBJECTIVES: 'activity_custom_objectives',
  LESSON_STACKS: 'lesson_stacks',
  ACTIVITY_STACKS: 'activity_stacks',
  TIMETABLE_CLASSES: 'timetable_classes',
  BRANDING_SETTINGS: 'branding_settings',
  
  // Unused tables (commented out for safety - can be deleted later)
  // ACTIVITIES_ROWS: 'activities_rows',
  // BACKUP_SNAPSHOTS: 'backup_snapshots', 
  // USER_CLASSES: 'user_classes',
  // USER_LESSON_PLANS: 'user_lesson_plans'
};

// Helper function to check if Supabase is configured
// Only logs once on first call to reduce console noise
let configCheckLogged = false;

export const isSupabaseConfigured = () => {
  const configured = !!supabaseUrl && !!supabaseAnonKey;
  
  if (!configCheckLogged) {
    if (import.meta.env.DEV) console.log('🔍 Supabase configuration check:', { hasUrl: !!supabaseUrl, hasKey: !!supabaseAnonKey, configured });
    configCheckLogged = true;
  }
  
  return configured;
};

/** Check if Supabase Auth is reachable – useful for login diagnostics */
export async function checkSupabaseAuthHealth(): Promise<{ ok: boolean; error?: string }> {
  if (!supabaseUrl || !supabaseAnonKey) return { ok: false, error: 'Missing Supabase URL or key' };
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: supabaseAnonKey },
      signal: controller.signal,
    });
    clearTimeout(to);
    if (!res.ok) return { ok: false, error: `Auth returned ${res.status}` };
    return { ok: true };
  } catch (e) {
    clearTimeout(to);
    const msg = e instanceof Error ? e.message : 'Network error';
    return { ok: false, error: msg.includes('abort') ? 'Connection timed out' : msg };
  }
}
