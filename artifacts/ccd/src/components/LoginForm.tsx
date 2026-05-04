import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Download, X, RefreshCw, ArrowRight, PlayCircle, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getAppBaseUrl } from '../utils/apiUrl';
import { LoadingSpinner } from './LoadingSpinner';
import { LogoSVG } from './Logo';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useSettings } from '../contexts/SettingsContextNew';
import { supabase, isSupabaseAuthEnabled, isSupabaseConfigured, checkSupabaseAuthHealth, setSessionOnlyCookie } from '../config/supabase';
import { activateDemoMode } from '../utils/demoMode';
import { seedDemoLocalStorage } from '../utils/demoSampleData';

export function LoginForm() {
  const { login } = useAuth();
  const { canInstall, isInstalled, install } = usePWAInstall();
  const { settings } = useSettings();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [error, setError] = useState('');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authStatus, setAuthStatus] = useState<'checking' | 'ok' | 'fail' | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const branding = settings.branding || {};
  const loginButtonColor = branding.loginButtonColor || '#008272';
  const logoLetters = branding.logoLetters || 'CCD';
  const loginTitle = branding.loginTitle || 'Creative Curriculum Designer';
  const loginSubtitle = branding.loginSubtitle || 'From Rhythmstix';
  const loginSubtitleUrl = branding.loginSubtitleUrl || 'https://www.rhythmstix.co.uk';

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (isSupabaseAuthEnabled() && !staySignedIn) {
        setSessionOnlyCookie();
      }
      const LOGIN_TIMEOUT_MS = 60000;
      await Promise.race([
        login(username, password),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timed out. The server may be waking up – please try again in a moment.')), LOGIN_TIMEOUT_MS)
        ),
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message || 'Email or password incorrect. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isSupabaseAuthEnabled()) {
      setAuthStatus(null);
      return;
    }
    setAuthStatus('checking');
    checkSupabaseAuthHealth()
      .then(({ ok, error }) => {
        setAuthStatus(ok ? 'ok' : 'fail');
        setAuthError(error ?? null);
      })
      .catch(() => {
        setAuthStatus('fail');
        setAuthError('Check failed');
      });
  }, []);

  React.useEffect(() => {
    if (canInstall && !isInstalled) {
      const timer = setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (!dismissed) {
          setShowInstallPrompt(true);
        } else {
          const dismissedTime = parseInt(dismissed, 10);
          const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
          if (daysSinceDismissed >= 7) {
            setShowInstallPrompt(true);
          }
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [canInstall, isInstalled]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailTrimmed = forgotEmail.trim();
    if (!emailTrimmed) return;
    setForgotError('');
    setForgotSubmitting(true);
    try {
      const baseUrl = getAppBaseUrl();
      const redirectTo = baseUrl ? `${baseUrl}/reset-password` : `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(emailTrimmed, {
        redirectTo,
      });
      if (error) {
        const msg = error.message || '';
        if (msg.toLowerCase().includes('rate limit')) {
          throw new Error('Too many reset requests. Please wait about an hour and try again.');
        }
        throw new Error(error.message);
      }
      setForgotSent(true);
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleInstall = async () => {
    await install();
    setShowInstallPrompt(false);
  };

  const handleStartPreview = () => {
    activateDemoMode('default');
    seedDemoLocalStorage();
    window.location.assign('/?demo=1');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      <div
        className="relative flex flex-col justify-between px-8 py-10 lg:w-1/2 lg:min-h-screen lg:px-16 lg:py-14 overflow-hidden"
        style={{
          background: 'linear-gradient(140deg, #0D3B3E 0%, #0A5C55 40%, #14B8A6 100%)',
          color: '#fff',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ backgroundColor: '#14B8A6', animation: 'loginFloat 8s ease-in-out infinite' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/3 -left-32 h-64 w-64 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: '#0EA5E9', animation: 'loginFloat 10s ease-in-out infinite reverse' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 right-1/4 h-80 w-80 rounded-full opacity-15 blur-3xl"
          style={{ backgroundColor: '#fff', animation: 'loginFloat 12s ease-in-out infinite 2s' }}
        />

        <div className="relative flex items-center gap-2 text-sm font-medium tracking-wide opacity-90">
          <span className="inline-block h-2 w-2 rounded-full bg-teal-400" />
          <span className="uppercase">Creative Curriculum Designer</span>
        </div>

        <div className="relative flex flex-col items-center text-center my-12 lg:my-0">
          <div className="mb-8">
            <LogoSVG size="lg" showText={false} letters={logoLetters} />
          </div>
          <h1
            className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            {loginTitle}
          </h1>
          <p className="mt-4 max-w-md text-base opacity-85 sm:text-lg leading-relaxed">
            Plan, deliver, and review your curriculum — all in one place.
          </p>
        </div>

        <div className="relative flex flex-wrap items-center justify-between gap-2 text-xs opacity-75">
          <span>© {new Date().getFullYear()} Rhythmstix</span>
          <a
            href={loginSubtitleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline opacity-90"
          >
            {loginSubtitle}
          </a>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-gray-50 px-6 py-12 lg:w-1/2 lg:px-12 relative">
        {canInstall && !isInstalled && (
          <button
            onClick={async () => { await install(); }}
            className="absolute top-4 right-4 flex items-center gap-2 bg-white text-teal-600 px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium border border-gray-200"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}

        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-2">
            <LogoSVG size="sm" showText={false} letters={logoLetters} />
            <span
              className="text-lg font-semibold text-gray-900"
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
            >
              {loginTitle}
            </span>
          </div>

          <div className="mb-6">
            <h2
              className="text-2xl font-bold text-gray-900 sm:text-3xl"
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
            >
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              Please sign in to your account.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
            {showForgotPassword ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Forgot password?</h3>
                {!isSupabaseAuthEnabled() ? (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-4 rounded-lg">
                    Password reset is not available because email sign-in is disabled for this site. Contact your administrator or enable Supabase Auth to use reset.
                  </p>
                ) : forgotSent ? (
                  <p className="text-sm text-green-700 bg-green-50 p-4 rounded-lg">Check your email. We sent a link to reset your password.</p>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        id="forgot-email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        className="block w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900"
                        placeholder="Enter your email"
                      />
                    </div>
                    {forgotError && <p className="text-sm text-red-600">{forgotError}</p>}
                    <button
                      type="submit"
                      disabled={forgotSubmitting}
                      className="w-full text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                      style={{ backgroundColor: forgotSubmitting ? '#9CA3AF' : loginButtonColor }}
                    >
                      {forgotSubmitting ? 'Sending...' : 'Send reset link'}
                    </button>
                  </form>
                )}
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(false); setForgotSent(false); setForgotError(''); }}
                  className="w-full text-sm text-gray-600 hover:text-gray-900"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="you@school.org"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    {isSupabaseConfigured() && (
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm font-medium hover:underline"
                        style={{ color: loginButtonColor }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isSupabaseAuthEnabled() && (
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={staySignedIn}
                      onChange={(e) => setStaySignedIn(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    Remember me
                  </label>
                )}

                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <div className="flex-1">
                      <span>{error}</span>
                      {error.includes('timed out') && (
                        <button
                          type="button"
                          onClick={() => handleSubmit()}
                          disabled={isSubmitting || !username.trim()}
                          className="flex items-center gap-1 mt-1 text-sm font-medium text-teal-700 hover:text-teal-800"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Try again
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {isSupabaseConfigured() && !isSupabaseAuthEnabled() && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Email/password sign-in is off. Set VITE_USE_SUPABASE_AUTH=true in your environment and redeploy to sign in and use password reset.
                  </p>
                )}

                {isSupabaseAuthEnabled() && authStatus && authStatus !== 'ok' && (
                  <div className={`p-2 rounded-lg text-xs ${authStatus === 'fail' ? 'bg-amber-50 text-amber-800' : 'bg-gray-50 text-gray-600'}`}>
                    {authStatus === 'checking' && 'Checking Supabase...'}
                    {authStatus === 'fail' && `Supabase Auth: ${authError || 'Not reachable'}. Check Supabase Dashboard.`}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ backgroundColor: isSubmitting ? '#6B7280' : loginButtonColor }}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400">
            <div className="h-px flex-1 bg-gray-200" />
            <span>Or</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={handleStartPreview}
            className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-white px-5 py-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                <PlayCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Preview Full App
                </div>
                <div className="text-xs text-gray-500">
                  Explore with sample content — no sign-in required
                </div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5" />
          </button>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <Shield className="h-3.5 w-3.5" />
            <span>AES-256 encrypted &amp; secure</span>
          </div>

          <p className="mt-3 text-center text-xs text-gray-400">
            Need help?{' '}
            <a
              href={loginSubtitleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 hover:underline"
            >
              Contact Rhythmstix
            </a>
          </p>
        </div>
      </div>

      {showInstallPrompt && canInstall && !isInstalled && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Download className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Install App</h3>
                  <p className="text-sm text-gray-600">Get quick access and work offline</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowInstallPrompt(false);
                  localStorage.setItem('pwa-install-dismissed', Date.now().toString());
                }}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <p className="text-sm text-teal-900 font-medium mb-2">Benefits of installing:</p>
                <ul className="text-sm text-teal-800 space-y-1 list-disc list-inside">
                  <li>Quick access from your desktop or home screen</li>
                  <li>Works offline with cached data</li>
                  <li>Faster loading times</li>
                  <li>No browser tabs needed</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <Download className="h-5 w-5" />
                  <span>Install Now</span>
                </button>
                <button
                  onClick={() => {
                    setShowInstallPrompt(false);
                    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
                  }}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes loginFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(15px, -20px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
