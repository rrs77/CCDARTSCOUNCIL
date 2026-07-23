import React, { useEffect, useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, PlayCircle } from 'lucide-react';
import type { SchoolHomepageConfig } from '../../config/schoolHomepages';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../LoadingSpinner';
import { PlaceholderSchoolLogo } from './PlaceholderSchoolLogo';
import {
  isSupabaseAuthEnabled,
  setSessionOnlyCookie,
} from '../../config/supabase';
import { activateDemoMode } from '../../utils/demoMode';
import { seedDemoData } from '../../utils/demoSeed';
import { PrototypeNoticeBar } from '../login/PrototypeNoticeBar';
import { PrototypeWelcomeModal } from '../login/PrototypeWelcomeModal';
import { WELCOME_PROTOTYPE_STORAGE_KEY } from '../login/prototypeCopy';

interface SchoolHomepageProps {
  school: SchoolHomepageConfig;
}

/**
 * Public, school-branded homepage rendered at `/<schoolSlug>`.
 * Split-screen layout: branded panel on the left, login + demo on the right.
 */
export function SchoolHomepage({ school }: SchoolHomepageProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showWelcomePrototype, setShowWelcomePrototype] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(WELCOME_PROTOTYPE_STORAGE_KEY) === '1') return;
    } catch {
      // still show
    }
    setShowWelcomePrototype(true);
  }, []);

  const dismissWelcomePrototype = () => {
    try {
      sessionStorage.setItem(WELCOME_PROTOTYPE_STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setShowWelcomePrototype(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isSupabaseAuthEnabled() && !staySignedIn) {
        setSessionOnlyCookie();
      }
      const LOGIN_TIMEOUT_MS = 60000;
      await Promise.race([
        login(email, password),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  'Connection timed out. The server may be waking up — please try again in a moment.',
                ),
              ),
            LOGIN_TIMEOUT_MS,
          ),
        ),
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message || 'Email or password incorrect. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartDemo = async () => {
    // Activate demo mode and seed the full account-snapshot content into
    // localStorage *before* navigating, so DataContext picks it up on its
    // first load and the visitor sees the fully populated prototype.
    activateDemoMode(school.slug);
    await seedDemoData();
    window.location.assign('/?demo=1');
  };

  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      <PrototypeNoticeBar />
      <div className="relative flex flex-1 flex-col overflow-hidden bg-white lg:flex-row">
      {/* LEFT: branded panel */}
      <div
        className="relative z-10 flex flex-col justify-between px-8 py-10 lg:w-1/2 lg:min-h-screen lg:px-16 lg:py-14"
        style={{
          background: `linear-gradient(140deg, ${school.primaryColor} 0%, ${school.primaryColor} 60%, ${school.accentColor}33 100%)`,
          color: '#fff',
        }}
      >
        {/* Decorative blurred shapes */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ backgroundColor: school.accentColor }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: '#fff' }}
        />

        {/* Top: small wordmark */}
        <div className="relative flex items-center gap-2 text-sm font-medium tracking-wide opacity-90">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: school.accentColor }} />
          <span className="uppercase">Creative Curriculum Designer</span>
        </div>

        {/* Center: logo + name */}
        <div className="relative flex flex-col items-center text-center my-12 lg:my-0">
          <div className="mb-6 flex items-center justify-center">
            {school.logoUrl ? (
              <img
                src={school.logoUrl}
                alt={`${school.displayName} logo`}
                className="h-40 w-40 rounded-3xl bg-white object-contain p-3 shadow-lg"
                loading="eager"
              />
            ) : (
              <div className="rounded-3xl bg-white/10 p-3 shadow-lg backdrop-blur-sm">
                <PlaceholderSchoolLogo
                  schoolName={school.displayName}
                  accentColor="#ffffff"
                  foregroundColor={school.primaryColor}
                  size={168}
                />
              </div>
            )}
          </div>
          <h1
            className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            {school.displayName}
          </h1>
          {school.tagline && (
            <p className="mt-3 max-w-md text-base opacity-85 sm:text-lg">
              {school.tagline}
            </p>
          )}
        </div>

        {/* Bottom: footer microcopy */}
        <div className="relative flex flex-wrap items-center justify-between gap-2 text-xs opacity-75">
          <span>© {new Date().getFullYear()} {school.displayName}</span>
          <span>Powered by Creative Curriculum Designer</span>
        </div>
      </div>

      {/* RIGHT: login + demo */}
      <div className="relative z-10 flex flex-1 flex-col bg-gray-50 lg:w-1/2">
        <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2
              className="text-2xl font-bold text-gray-900 sm:text-3xl"
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
            >
              {school.welcomeHeading ?? 'Welcome back'}
            </h2>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              {school.welcomeBody ?? 'Sign in to plan, deliver, and review your curriculum.'}
            </p>
          </div>

          {/* Login card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="school-email" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="school-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2"
                    style={{ boxShadow: 'none' }}
                    placeholder="you@school.org"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="school-password" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="school-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-gray-600">
                  <input
                    type="checkbox"
                    checked={staySignedIn}
                    onChange={(e) => setStaySignedIn(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                    style={{ accentColor: school.primaryColor }}
                  />
                  Stay signed in
                </label>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !email || !password}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: school.primaryColor }}
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400">
            <div className="h-px flex-1 bg-gray-200" />
            <span>Or</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Demo / Preview */}
          <button
            type="button"
            onClick={handleStartDemo}
            className="group flex w-full items-center justify-between gap-3 rounded-2xl border bg-white px-5 py-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            style={{ borderColor: `${school.accentColor}66` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${school.accentColor}26`, color: school.primaryColor }}
              >
                <PlayCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Explore the working prototype
                </div>
                <div className="text-xs text-gray-500">
                  Sample content — no sign-in required
                </div>
              </div>
            </div>
            <ArrowRight
              className="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5"
            />
          </button>

          {/* Sub-foot */}
          <p className="mt-8 text-center text-xs text-gray-400">
            Trouble signing in? Contact your school administrator.
          </p>
        </div>
        </div>
      </div>
      </div>

      <PrototypeWelcomeModal
        isOpen={showWelcomePrototype}
        onClose={dismissWelcomePrototype}
      />
    </div>
  );
}
