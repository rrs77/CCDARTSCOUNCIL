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

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const resolvedRef = useRef(false);

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

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Supabase auth state: when session changes, refresh profile
  useEffect(() => {
    if (!isSupabaseAuthEnabled()) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        resolvedRef.current = true; // Prevent timeout from overwriting; we explicitly signed out
        setUser(null);
        setProfile(null);
        syncUserIdToStorage(null);
        localStorage.removeItem('rhythmstix_auth_token');
      } else if (session?.user) {
        resolvedRef.current = true; // Valid session – prevent timeout from clearing it
        const p = await fetchProfileWithTimeout(session.user.id, 4000);
        const appUser: AppUser = {
          id: session.user.id,
          email: session.user.email ?? '',
          name: p?.display_name ?? session.user.email ?? '',
          role: p?.role ?? 'teacher',
          profile: p ?? undefined
        };
        setUser(appUser);
        setProfile(p ?? null);
        syncUserIdToStorage(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchProfileWithTimeout]);

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
      if (isSupabaseAuthEnabled()) {
        // Cap getSession so we never hang on a slow Supabase auth response
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), GET_SESSION_TIMEOUT_MS)
        );
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        if (session?.user) {
          resolvedRef.current = true;
          const p = await fetchSupabaseProfile(session.user.id);
          const appUser: AppUser = {
            id: session.user.id,
            email: session.user.email ?? '',
            name: p?.display_name ?? session.user.email ?? '',
            role: p?.role ?? 'teacher',
            profile: p ?? undefined
          };
          setUser(appUser);
          setProfile(p ?? null);
          syncUserIdToStorage(session.user.id);
          setLoading(false);
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
        // Timeout so we never hang on slow profiles table – use session data if profile times out
        const PROFILE_TIMEOUT_MS = 4000;
        const p = await fetchProfileWithTimeout(data.session.user.id, PROFILE_TIMEOUT_MS);
        const appUser: AppUser = {
          id: data.session.user.id,
          email: data.session.user.email ?? '',
          name: p?.display_name ?? data.session.user.email ?? '',
          role: p?.role ?? 'teacher',
          profile: p ?? undefined
        };
        setUser(appUser);
        setProfile(p ?? null);
        syncUserIdToStorage(data.session.user.id);
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
    if (isSupabaseAuthEnabled()) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('rhythmstix_auth_token');
    syncUserIdToStorage(null);
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