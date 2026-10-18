import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Download,
  X,
  RefreshCw,
  ArrowRight,
  PlayCircle,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getAppBaseUrl } from '../utils/apiUrl';
import { isMidFlowSignIn, queryReturnPath } from '../utils/authReturn';
import { LoadingSpinner } from './LoadingSpinner';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useSettings } from '../contexts/SettingsContextNew';
import {
  supabase,
  isSupabaseAuthEnabled,
  isSupabaseConfigured,
  checkSupabaseAuthHealth,
  setSessionOnlyCookie,
} from '../config/supabase';
import { FeatureWalkthroughModal } from './FeatureWalkthrough/FeatureWalkthroughModal';
import { LoginHeroPanel, THE_FACTS_HREF } from './login/LoginHeroPanel';
import { PrototypeNoticeBar } from './login/PrototypeNoticeBar';
import { PartnersFundingStartModal } from './login/PartnersFundingStartModal';
import { PARTNERS_FUNDING_VIDEO_STORAGE_KEY } from './login/prototypeCopy';
import { LogoSVG } from './Logo';
import { RegisterForm } from './Auth/RegisterForm';

const LOGIN_INDIGO = '#4338E8';

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
  const [showRegister, setShowRegister] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [showFeatureWalkthrough, setShowFeatureWalkthrough] = useState(false);
  const [showPartnersFundingStart, setShowPartnersFundingStart] = useState(false);

  const branding = settings.branding || {};
  const logoLetters = branding.logoLetters || 'CCD';
  const midFlowSignIn =
    typeof window !== 'undefined' && isMidFlowSignIn(window.location.search);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    if (!username.trim()) {
      setError('Missing email');
      return;
    }
    setIsSubmitting(true);
    try {
      if (isSupabaseAuthEnabled() && !staySignedIn) {
        setSessionOnlyCookie();
      }
      const LOGIN_TIMEOUT_MS = 60000;
      await Promise.race([
        login(username, password),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  'Connection timed out. The server may be waking up – please try again in a moment.',
                ),
              ),
            LOGIN_TIMEOUT_MS,
          ),
        ),
      ]);
      if (midFlowSignIn) {
        const ret = queryReturnPath(window.location.search);
        if (ret) {
          window.location.assign(ret);
        }
      }
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

  useEffect(() => {
    // Mid-flow returns (`?return=/forum/admin&signin=1`) must not be blocked
    // by the first-visit Partners / funding welcome modal.
    if (midFlowSignIn) return;
    try {
      if (sessionStorage.getItem(PARTNERS_FUNDING_VIDEO_STORAGE_KEY) === '1') return;
    } catch {
      // sessionStorage may be unavailable; still show the notice
    }
    setShowPartnersFundingStart(true);
  }, [midFlowSignIn]);

  const dismissPartnersFundingStart = () => {
    try {
      sessionStorage.setItem(PARTNERS_FUNDING_VIDEO_STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setShowPartnersFundingStart(false);
  };

  /** Notice primary CTA → open animated walkthrough in the old FeatureDemoVideoModal slot. */
  const startWalkthroughFromStart = () => {
    dismissPartnersFundingStart();
    setShowFeatureWalkthrough(true);
  };
  useEffect(() => {
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
    return undefined;
  }, [canInstall, isInstalled]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailTrimmed = forgotEmail.trim();
    if (!emailTrimmed) return;
    setForgotError('');
    setForgotSubmitting(true);
    try {
      const baseUrl = getAppBaseUrl();
      const redirectTo = baseUrl
        ? `${baseUrl}/reset-password`
        : `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(emailTrimmed, {
        redirectTo,
      });
      if (resetError) {
        const msg = resetError.message || '';
        if (msg.toLowerCase().includes('rate limit')) {
          throw new Error('Too many reset requests. Please wait about an hour and try again.');
        }
        throw new Error(resetError.message);
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

  const inputClassName =
    'w-full rounded-lg border border-[#E2E0EF] bg-white py-3 pl-10 pr-4 text-sm text-[#1F1B4D] placeholder-[#77738F] focus:border-[#4338E8] focus:outline-none focus:ring-2 focus:ring-[#4338E8]/25';

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-x-hidden"
      style={{
        backgroundColor: '#EDECF2',
        fontFamily: "var(--ss-font-ui, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)",
      }}
    >
      {/* Hidden in film mode via html.ccd-feature-demo CSS (see index.css). */}
      <PrototypeNoticeBar />
      {/* Outer surround only: fluid padding scales with viewport; stage design unchanged */}
      <div className="relative z-10 flex flex-1 flex-col p-0 sm:p-[clamp(0.75rem,2vw,1rem)] lg:p-[clamp(1rem,2.5vw,1.5rem)]">
        <div className="relative mx-auto flex w-full max-w-[min(1440px,100%)] flex-col bg-[#1F1B4D] sm:min-h-[calc(100dvh-2.5rem)] sm:overflow-hidden sm:rounded-2xl sm:shadow-[0_24px_80px_rgba(31,27,77,0.22)] lg:min-h-[calc(100dvh-3.5rem)]">
          {/* Full-bleed hero — content-sized stack on phone; fills stage on desktop */}
          <div className="relative w-full lg:absolute lg:inset-0">
            <LoginHeroPanel logoLetters={logoLetters} />
          </div>

          {/* Login card — below hero on phone/tablet (no overlap); floats over image on desktop */}
          <div className="relative z-20 mx-4 mb-5 mt-4 sm:mx-6 sm:mb-6 sm:mt-5 lg:absolute lg:bottom-auto lg:left-auto lg:right-5 lg:top-1/2 lg:mx-0 lg:mb-0 lg:mt-0 lg:w-[min(320px,30%)] lg:-translate-y-1/2 xl:right-8 xl:w-[340px]">
            <div className="overflow-hidden rounded-2xl border border-transparent bg-white shadow-[0_20px_50px_rgba(0,0,0,0.22)] lg:shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
              <div className="px-4 pb-5 pt-4 sm:px-5 sm:pb-6 lg:px-5 lg:pb-6">
                <div className="w-full">
                  {/* Logo on phone/tablet form only — desktop already has the hero mark */}
                  <LogoSVG
                    size="sm"
                    showText
                    letters={logoLetters}
                    className="mb-3 lg:hidden"
                  />

                  <div className="mb-4 flex flex-nowrap items-center gap-x-2.5 overflow-hidden">
                    <a
                      href={THE_FACTS_HREF}
                      className="inline-flex shrink-0 items-center gap-1 text-[0.8125rem] font-semibold leading-none text-[#4338E8] underline-offset-2 hover:underline sm:text-sm"
                    >
                      <BookOpen className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                      The facts
                    </a>
                    <span className="shrink-0 text-sm text-[#E2E0EF]" aria-hidden>
                      ·
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowFeatureWalkthrough(true)}
                      className="inline-flex min-w-0 items-center gap-1 text-[0.8125rem] font-semibold leading-none text-[#1F1B4D] underline-offset-2 hover:underline sm:text-sm"
                    >
                      <PlayCircle className="h-3.5 w-3.5 shrink-0 text-[#4338E8] sm:h-4 sm:w-4" aria-hidden />
                      <span className="truncate">Feature walkthrough</span>
                    </button>
                    {canInstall && !isInstalled && (
                      <>
                        <span className="shrink-0 text-sm text-[#E2E0EF]" aria-hidden>
                          ·
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            await install();
                          }}
                          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#77738F] underline-offset-2 hover:text-[#1F1B4D] hover:underline"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Install
                        </button>
                      </>
                    )}
                  </div>

                  <div className="mb-4">
                    <h2
                      className="text-xl font-extrabold tracking-tight text-[#1F1B4D] sm:text-2xl"
                      style={{ fontFamily: "var(--ss-font-display, 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif)" }}
                    >
                      Welcome back
                    </h2>
                  </div>

                  {showRegister ? (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900">Create an account</h3>
                      <p className="text-sm text-gray-600">
                        Email verification is preferred. Check your inbox after registering.
                      </p>
                      <RegisterForm compact onCancel={() => setShowRegister(false)} />
                      <button
                        type="button"
                        onClick={() => setShowRegister(false)}
                        className="text-sm font-medium text-[#4338E8] hover:underline"
                      >
                        Back to sign in
                      </button>
                    </div>
                  ) : showForgotPassword ? (
                    <ForgotPasswordPanel
                      forgotEmail={forgotEmail}
                      setForgotEmail={setForgotEmail}
                      forgotSent={forgotSent}
                      forgotError={forgotError}
                      forgotSubmitting={forgotSubmitting}
                      onSubmit={handleForgotPassword}
                      onBack={() => {
                        setShowForgotPassword(false);
                        setForgotSent(false);
                        setForgotError('');
                      }}
                      inputClassName={inputClassName}
                    />
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
                            className={inputClassName}
                            placeholder="you@school.org"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-gray-700">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className={`${inputClassName} pr-10`}
                            placeholder="Enter your password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {isSupabaseConfigured() && (
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="mt-1.5 text-sm font-medium text-[#1F1B4D] hover:underline"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>

                      {isSupabaseAuthEnabled() && (
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                          <input
                            type="checkbox"
                            checked={staySignedIn}
                            onChange={(e) => setStaySignedIn(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-[#1F1B4D] focus:ring-[#1F1B4D]"
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
                                className="mt-1 flex items-center gap-1 text-sm font-medium text-[#1F1B4D] hover:underline"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Try again
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {isSupabaseConfigured() && !isSupabaseAuthEnabled() && (
                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                          Email/password sign-in is off. Set VITE_USE_SUPABASE_AUTH=true in your environment
                          and redeploy to sign in and use password reset.
                        </p>
                      )}

                      {isSupabaseAuthEnabled() && authStatus && authStatus !== 'ok' && (
                        <div
                          className={`rounded-lg p-2 text-xs ${
                            authStatus === 'fail' ? 'bg-amber-50 text-amber-800' : 'bg-gray-50 text-gray-600'
                          }`}
                        >
                          {authStatus === 'checking' && 'Checking Supabase...'}
                          {authStatus === 'fail' &&
                            `Supabase Auth: ${authError || 'Not reachable'}. Check Supabase Dashboard.`}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ backgroundColor: isSubmitting ? '#6B7280' : LOGIN_INDIGO }}
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

                  {!showForgotPassword && !showRegister && isSupabaseAuthEnabled() && (
                    <>
                      <div className="my-2.5 flex items-center gap-2.5">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">or</span>
                        <div className="h-px flex-1 bg-gray-200" />
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowRegister(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#1F1B4D]/30 bg-white px-4 py-2 text-sm font-semibold text-[#1F1B4D] transition-colors hover:bg-[#1F1B4D]/5"
                      >
                        Create an account
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showInstallPrompt && canInstall && !isInstalled && (
        <InstallPromptModal
          onInstall={handleInstall}
          onDismiss={() => {
            setShowInstallPrompt(false);
            localStorage.setItem('pwa-install-dismissed', Date.now().toString());
          }}
        />
      )}

      <FeatureWalkthroughModal
        isOpen={showFeatureWalkthrough}
        onClose={() => setShowFeatureWalkthrough(false)}
      />

      <PartnersFundingStartModal
        isOpen={showPartnersFundingStart}
        onClose={dismissPartnersFundingStart}
        onStartWalkthrough={startWalkthroughFromStart}
      />
    </div>
  );
}

function ForgotPasswordPanel({
  forgotEmail,
  setForgotEmail,
  forgotSent,
  forgotError,
  forgotSubmitting,
  onSubmit,
  onBack,
  inputClassName,
}: {
  forgotEmail: string;
  setForgotEmail: (v: string) => void;
  forgotSent: boolean;
  forgotError: string;
  forgotSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  inputClassName: string;
}) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-gray-900">Forgot password?</h3>
      {!isSupabaseAuthEnabled() ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Password reset is not available because email sign-in is disabled for this site. Contact your
          administrator or enable Supabase Auth to use reset.
        </p>
      ) : forgotSent ? (
        <p className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
          Check your email. We sent a link to reset your password.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="forgot-email" className="mb-1.5 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
              className={inputClassName.replace('pl-10', 'pl-3')}
              placeholder="Enter your email"
            />
          </div>
          {forgotError && <p className="text-sm text-red-600">{forgotError}</p>}
          <button
            type="submit"
            disabled={forgotSubmitting}
            className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ backgroundColor: forgotSubmitting ? '#9CA3AF' : LOGIN_INDIGO }}
          >
            {forgotSubmitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}
      <button type="button" onClick={onBack} className="w-full text-sm text-gray-600 hover:text-gray-900">
        Back to sign in
      </button>
    </div>
  );
}

function InstallPromptModal({
  onInstall,
  onDismiss,
}: {
  onInstall: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-[#1F1B4D]/10 p-2">
              <Download className="h-6 w-6 text-[#1F1B4D]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Install App</h3>
              <p className="text-sm text-gray-600">Get quick access and work offline</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-[#1F1B4D]/15 bg-[#1F1B4D]/5 p-4">
            <p className="mb-2 text-sm font-medium text-[#1F1B4D]">Benefits of installing:</p>
            <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
              <li>Quick access from your desktop or home screen</li>
              <li>Works offline with cached data</li>
              <li>Faster loading times</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onInstall}
              className="flex flex-1 items-center justify-center space-x-2 rounded-lg px-6 py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg"
              style={{ backgroundColor: LOGIN_INDIGO }}
            >
              <Download className="h-5 w-5" />
              <span>Install Now</span>
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="px-6 py-3 font-medium text-gray-600 transition-colors hover:text-gray-800"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
