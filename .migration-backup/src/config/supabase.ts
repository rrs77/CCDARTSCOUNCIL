import { createClient } from '@supabase/supabase-js';

// Use env vars in Vercel (or any host); fallback to current Supabase project
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wiudrzdkbpyziaodqoog.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdWRyemRrYnB5emlhb2Rxb29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzgxNzcsImV4cCI6MjA2NjUxNDE3N30.LpD82hY_1wYzroA09nYfaz13iNx5gRJzmPTt0gPCLMI';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel (or use defaults).');
}

// Use Supabase Auth (email/password, RLS): set VITE_USE_SUPABASE_AUTH=true
const useSupabaseAuth = import.meta.env.VITE_USE_SUPABASE_AUTH === 'true';

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

// Create Supabase client. When using Supabase Auth, session is persisted (localStorage or sessionStorage when "require password each time").
export const supabase = createClient(
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