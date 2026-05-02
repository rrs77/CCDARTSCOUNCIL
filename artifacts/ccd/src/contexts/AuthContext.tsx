import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { wordpressAPI } from '../config/api';
import { supabase, isSupabaseAuthEnabled } from '../config/supabase';
import type { AppUser, Profile } from '../types/auth';

interface AuthContextType {
  user: AppUser | null;
  profile: Profile | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Demo / Preview mode.
 *
 * When a visitor clicks "Preview" on a school homepage, the SchoolHomepage
 * component sets `sessionStorage["ccd-demo-mode"]="1"`. AuthContext detects
 * this on init and injects a synthetic, read-only `viewer` user so the rest
 * of the app renders without requiring real credentials. The flag lives in
 * sessionStorage so it goes away when the tab closes; logout also clears it.
 */
const DEMO_MODE_KEY = 'ccd-demo-mode';

function isDemoModeActive(): boolean {
  try {
    return typeof window !== 'undefined' && sessionStorage.getItem(DEMO_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

function clearDemoMode() {
  try {
    sessionStorage.removeItem(DEMO_MODE_KEY);
    sessionStorage.removeItem('ccd-demo-from-school');
  } catch {
    /* noop */
  }
}

const DEMO_USER: AppUser = {
  id: 'demo-viewer',
  email: 'demo@ccd.preview',
  name: 'Demo Visitor',
  role: 'viewer',
};

// Local user database - you can add more users here
const localUsers = [
  {
    id: '1',
    email: 'rob.reichstorer@gmail.com',
    password: 'mubqaZ-piske5-xecdur',
    name: 'Rob Reichstorer',
    avatar: 'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    role: 'administrator'
  },
  // Add more users here as needed
  // {
  //   id: '2',
  //   email: 'teacher@rhythmstix.co.uk',
  //   password: 'teacher123',
  //   name: 'Sarah Teacher',
  //   avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  //   role: 'teacher'
  // },
  // Example view-only user:
  // {
  //   id: '3',
  //   email: 'viewer@rhythmstix.co.uk',
  //   password: 'viewer123',
  //   name: 'View Only User',
  //   avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  //   role: 'viewer'
  // }
];

interface AuthProviderProps {
  children: ReactNode;
}

function syncUserIdToStorage(userId: string | null) {
  if (userId) {
    localStorage.setItem('rhythmstix_user_id', userId);
  } else {
    localStorage.removeItem('rhythmstix_user_id');
  }
}

/**
 * Profile cache – avoids a blocking Supabase round-trip on every page load.
 * Keyed by user id so a different user never sees stale data.
 * 24-hour TTL bounds drift; profile changes still propagate via background revalidation.
 */
const PROFILE_CACHE_KEY = 'rhythmstix_profile_cache';
const PROFILE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface ProfileCacheEntry {
  userId: string;
  profile: Profile | null;
  ts: number;
}

function readProfileCache(userId: string): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProfileCacheEntry;
    if (parsed.userId !== userId) return null;
    if (Date.now() - parsed.ts > PROFILE_CACHE_TTL_MS) return null;
    return parsed.profile;
  } catch {
    return null;
  }
}

function writeProfileCache(userId: string, profile: Profile | null) {
  try {
    const entry: ProfileCacheEntry = { userId, profile, ts: Date.now() };
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* quota or privacy mode – cache is best-effort */
  }
}

function clearProfileCache() {
  try {
    localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    /* noop */
  }
}

function buildAppUserFromSession(
  sessionUser: { id: string; email?: string | null },
  cachedProfile: Profile | null,
): AppUser {
  return {
    id: sessionUser.id,
    email: sessionUser.email ?? '',
    name: cachedProfile?.display_name ?? sessionUser.email ?? '',
    role: cachedProfile?.role ?? 'teacher',
    profile: cachedProfile ?? undefined,
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const resolvedRef = useRef(false);
  /**
   * Tracks the user id we have already hydrated state for. Used to short-circuit the
   * onAuthStateChange handler so it never re-fetches the profile when login() or
   * checkAuthStatus() already did the work for that user. This eliminates the
   * duplicate Supabase request on every successful sign-in.
   */
  const lastHandledUserIdRef = useRef<string | null>(null);

  const fetchSupabaseProfile = useCallback(async (authUserId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUserId)
      .maybeSingle();
    if (error) {
      console.warn('Failed to fetch profile:', error);
      return null;
    }
    return data as Profile | null;
  }, []);

  /** Fetch profile with timeout so login never hangs on slow profiles table */
  const fetchProfileWithTimeout = useCallback(async (authUserId: string, timeoutMs: number): Promise<Profile | null> => {
    try {
      return await Promise.race([
        fetchSupabaseProfile(authUserId),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Profile fetch timeout')), timeoutMs)
        ),
      ]);
    } catch (e) {
      if (import.meta.env.DEV) console.warn('Profile fetch failed or timed out:', e);
      return null;
    }
  }, [fetchSupabaseProfile]);

  /**
   * Profile fetch that distinguishes "row missing" from "network/timeout failure".
   * - kind: 'ok'    → profile is fresh data (may be null if the row was deleted)
   * - kind: 'error' → request failed; do NOT mutate cache or state (keep cached profile)
   *
   * Conflating those two outcomes was an authorization risk: a demoted/deleted user
   * could keep their cached elevated role indefinitely while the network was flaky.
   */
  const fetchProfileSafe = useCallback(async (
    authUserId: string,
    timeoutMs: number,
  ): Promise<{ kind: 'ok'; profile: Profile | null } | { kind: 'error' }> => {
    try {
      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), timeoutMs),
      );
      const result = await Promise.race([queryPromise, timeoutPromise]);
      if ((result as { error?: unknown }).error) {
        if (import.meta.env.DEV) console.warn('Profile fetch error:', (result as { error: unknown }).error);
        return { kind: 'error' };
      }
      return { kind: 'ok', profile: (result as { data: Profile | null }).data };
    } catch (e) {
      if (import.meta.env.DEV) console.warn('Profile fetch failed or timed out:', e);
      return { kind: 'error' };
    }
  }, []);

  /**
   * Background profile revalidation: refreshes profile, updates cache + state, never blocks UI.
   * On a transient network failure we keep the cached profile (avoids logging users out of UI affordances).
   * On a confirmed null (row deleted/RLS denied), we clear the cache and downgrade to a safe default
   * so a removed/demoted account cannot keep elevated permissions across sessions.
   */
  const revalidateProfile = useCallback(async (sessionUserId: string) => {
    const result = await fetchProfileSafe(sessionUserId, 8000);
    if (result.kind === 'error') return; // Keep cached/optimistic data – do not blow it away on transient failure
    const fresh = result.profile;
    if (fresh === null) {
      // Profile row is genuinely gone – purge cache and reset to a safe non-privileged baseline.
      clearProfileCache();
    } else {
      writeProfileCache(sessionUserId, fresh);
    }
    setProfile(fresh);
    setUser((prev) =>
      prev && prev.id === sessionUserId
        ? {
            ...prev,
            name: fresh?.display_name ?? prev.email ?? prev.name,
            role: fresh?.role ?? 'teacher',
            profile: fresh ?? undefined,
          }
        : prev,
    );
  }, [fetchProfileSafe]);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Supabase auth state subscription. Handles token refresh and cross-tab sign-in/out.
  // Skips re-hydrating the same user that login()/checkAuthStatus() already handled
  // so we don't fire a redundant profile fetch on every successful sign-in.
  useEffect(() => {
    if (!isSupabaseAuthEnabled()) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        resolvedRef.current = true;
        lastHandledUserIdRef.current = null;
        clearProfileCache();
        setUser(null);
        setProfile(null);
        syncUserIdToStorage(null);
        localStorage.removeItem('rhythmstix_auth_token');
        return;
      }
      if (!session?.user) return;
      // Already handled this user – nothing to do (avoids the duplicate profile fetch).
      if (lastHandledUserIdRef.current === session.user.id) return;
      lastHandledUserIdRef.current = session.user.id;
      resolvedRef.current = true;
      const cached = readProfileCache(session.user.id);
      setUser(buildAppUserFromSession(session.user, cached));
      setProfile(cached);
      syncUserIdToStorage(session.user.id);
      // Revalidate in background; never blocks UI.
      void revalidateProfile(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, [revalidateProfile]);

  const AUTH_CHECK_TIMEOUT_MS = 2500; // Max time to show spinner; then show login or app
  const GET_SESSION_TIMEOUT_MS = 2000; // Don't wait forever for getSession (Supabase can be slow)

  const checkAuthStatus = async () => {
    const timeoutId = setTimeout(() => {
      if (resolvedRef.current) return; // Already resolved – don't override valid session
      if (import.meta.env.DEV) console.warn('Auth check timed out – showing login form');
      setLoading(false);
      setUser(null);
      setProfile(null);
    }, AUTH_CHECK_TIMEOUT_MS);

    try {
      // Demo / Preview mode short-circuits all auth backends so school
      // homepage visitors can explore the app without real credentials.
      if (isDemoModeActive()) {
        resolvedRef.current = true;
        setUser(DEMO_USER);
        setProfile(null);
        syncUserIdToStorage(DEMO_USER.id);
        setLoading(false);
        return;
      }

      if (isSupabaseAuthEnabled()) {
        // Cap getSession so we never hang on a slow Supabase auth response
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), GET_SESSION_TIMEOUT_MS)
        );
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        if (session?.user) {
          resolvedRef.current = true;
          lastHandledUserIdRef.current = session.user.id;
          // Hydrate from cache so the app renders immediately – no spinner waiting on the profile query.
          const cached = readProfileCache(session.user.id);
          setUser(buildAppUserFromSession(session.user, cached));
          setProfile(cached);
          syncUserIdToStorage(session.user.id);
          setLoading(false);
          // Revalidate profile in the background (catches role/display_name changes since last visit).
          void revalidateProfile(session.user.id);
          return;
        }
        resolvedRef.current = true;
        setUser(null);
        setProfile(null);
        syncUserIdToStorage(null);
        setLoading(false);
        return;
      }

      // ----- Legacy: local + WordPress -----
      // DEV MODE: Auto-login for local development
      if (import.meta.env.DEV && !localStorage.getItem('rhythmstix_auth_token')) {
        const devUser = localUsers[0];
        if (devUser) {
          console.log('🔧 DEV MODE: Auto-logging in as', devUser.email);
          localStorage.setItem('rhythmstix_auth_token', `rhythmstix_local_${devUser.id}`);
          const userData: AppUser = {
            id: devUser.id,
            email: devUser.email,
            name: devUser.name,
            avatar: devUser.avatar,
            role: devUser.role
          };
          setUser(userData);
          syncUserIdToStorage(devUser.id);
          setLoading(false);
          return;
        }
      }

      const token = localStorage.getItem('rhythmstix_auth_token');
      if (token) {
        if (token.startsWith('rhythmstix_local_')) {
          const userId = token.replace('rhythmstix_local_', '');
          const localUser = localUsers.find(u => u.id === userId);
          if (localUser) {
            resolvedRef.current = true;
            const userData: AppUser = {
              id: localUser.id,
              email: localUser.email,
              name: localUser.name,
              avatar: localUser.avatar,
              role: localUser.role
            };
            setUser(userData);
            syncUserIdToStorage(localUser.id);
          } else {
            localStorage.removeItem('rhythmstix_auth_token');
          }
        } else {
          const wordpressUrl = import.meta.env.VITE_WORDPRESS_URL;
          if (wordpressUrl && wordpressUrl !== 'https://your-wordpress-site.com') {
            try {
              const isValid = await wordpressAPI.validateToken(token);
              if (isValid) {
                resolvedRef.current = true;
                const userInfo = await wordpressAPI.getUserInfo(token);
                const userData: AppUser = {
                  id: userInfo.id.toString(),
                  email: userInfo.email,
                  name: userInfo.name,
                  avatar: userInfo.avatar_urls?.['96'] || userInfo.avatar_urls?.['48'],
                  role: userInfo.roles?.[0] || 'subscriber',
                  token
                };
                setUser(userData);
                syncUserIdToStorage(userData.id);
              } else {
                localStorage.removeItem('rhythmstix_auth_token');
              }
            } catch (error) {
              console.warn('WordPress token validation failed:', error);
              localStorage.removeItem('rhythmstix_auth_token');
            }
          } else {
            localStorage.removeItem('rhythmstix_auth_token');
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('rhythmstix_auth_token');
      syncUserIdToStorage(null);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const refreshProfile = useCallback(async () => {
    if (!isSupabaseAuthEnabled() || !user?.id) return;
    const p = await fetchSupabaseProfile(user.id);
    writeProfileCache(user.id, p);
    setProfile(p);
    setUser(prev => prev ? { ...prev, profile: p ?? undefined } : null);
  }, [user?.id, fetchSupabaseProfile]);

  const login = async (username: string, password: string) => {
    try {
      // Don't set loading=true here – it would unmount LoginForm and clear the password field.
      // LoginForm handles its own submit loading state.

      if (isSupabaseAuthEnabled()) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: username.trim(),
          password
        });
        if (error) {
          const msg = (error.message || '').toLowerCase();
          const isWrongPassword = /invalid|credential|wrong|incorrect|login credentials/.test(msg);
          throw new Error(isWrongPassword ? 'Email or password incorrect. Try again or use Forgot password.' : (error.message || 'Sign-in failed'));
        }
        if (!data.session?.user) throw new Error('No session after sign in');
        const sessionUser = data.session.user;
        // Mark this user as handled so the onAuthStateChange SIGNED_IN event doesn't fire a duplicate fetch.
        lastHandledUserIdRef.current = sessionUser.id;
        resolvedRef.current = true;
        // Resolve login immediately using cached profile (or session-only fallback) so the
        // user is redirected into the app without waiting on a second network round trip.
        const cached = readProfileCache(sessionUser.id);
        setUser(buildAppUserFromSession(sessionUser, cached));
        setProfile(cached);
        syncUserIdToStorage(sessionUser.id);
        // Revalidate profile in background – updates name/role/profile object when fresh data arrives.
        void revalidateProfile(sessionUser.id);
        return;
      }

      // ----- Legacy: local users (only when Supabase Auth is disabled) -----
      const localUser = localUsers.find(u => {
        if (u.email === username) {
          return password === '' || u.password === password;
        }
        return false;
      });

      if (localUser) {
        resolvedRef.current = true;
        const userData: AppUser = {
          id: localUser.id,
          email: localUser.email,
          name: localUser.name,
          avatar: localUser.avatar,
          role: localUser.role
        };
        localStorage.setItem('rhythmstix_auth_token', `rhythmstix_local_${localUser.id}`);
        setUser(userData);
        syncUserIdToStorage(localUser.id);
        return;
      }

      // ----- WordPress -----
      const wordpressUrl = import.meta.env.VITE_WORDPRESS_URL;
      if (wordpressUrl && wordpressUrl !== 'https://your-wordpress-site.com') {
        try {
          const authResponse = await wordpressAPI.authenticate(username, password);
          if (authResponse.token) {
            localStorage.setItem('rhythmstix_auth_token', authResponse.token);
            const userInfo = await wordpressAPI.getUserInfo(authResponse.token);
            const userData: AppUser = {
              id: userInfo.id.toString(),
              email: userInfo.email,
              name: userInfo.name,
              avatar: userInfo.avatar_urls?.['96'] || userInfo.avatar_urls?.['48'],
              role: userInfo.roles?.[0] || 'subscriber',
              token: authResponse.token
            };
            setUser(userData);
            syncUserIdToStorage(userData.id);
            return;
          }
        } catch (wpError) {
          console.error('WordPress authentication failed:', wpError);
        }
      }

      throw new Error('Invalid credentials. Please check your email and password.');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    // If we were in demo/preview mode there's no real Supabase session to
    // sign out of — just clear the flag so the next visit returns to the
    // login form (or school homepage) rather than auto-resuming the demo.
    const wasDemo = isDemoModeActive();
    clearDemoMode();
    if (!wasDemo && isSupabaseAuthEnabled()) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('rhythmstix_auth_token');
    syncUserIdToStorage(null);
    clearProfileCache();
    lastHandledUserIdRef.current = null;
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    login,
    logout,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };