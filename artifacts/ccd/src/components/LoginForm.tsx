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
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getAppBaseUrl } from '../utils/apiUrl';
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
import { activateDemoMode } from '../utils/demoMode';
import { seedDemoData } from '../utils/demoSeed';
import { FeatureWalkthroughModal } from './FeatureWalkthrough/FeatureWalkthroughModal';
import { PrototypePasswordPrompt, isPrototypeUnlocked } from './PrototypeGate';
import { LoginHeroPanel } from './login/LoginHeroPanel';
import { PrototypeNoticeBar } from './login/PrototypeNoticeBar';
import { PartnersFundingStartModal } from './login/PartnersFundingStartModal';
import { FeatureDemoVideoModal } from './login/FeatureDemoVideoModal';
import { PARTNERS_FUNDING_VIDEO_STORAGE_KEY } from './login/prototypeCopy';
import { LogoSVG, LOGO_BG } from './Logo';

const LOGIN_GREEN = LOGO_BG;

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
  const [showFeatureWalkthrough, setShowFeatureWalkthrough] = useState(false);
  const [showPrototypePassword, setShowPrototypePassword] = useState(false);
  const [showPartnersFundingStart, setShowPartnersFundingStart] = useState(false);
  const [showFeatureDemoVideo, setShowFeatureDemoVideo] = useState(false);

  const branding = settings.branding || {};
  const logoLetters = branding.logoLetters || 'CCD';

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
    try {
      if (sessionStorage.getItem(PARTNERS_FUNDING_VIDEO_STORAGE_KEY) === '1') return;
    } catch {
      // sessionStorage may be unavailable; still show the notice
    }
    setShowPartnersFundingStart(true);
  }, []);

  const dismissPartnersFundingStart = () => {
    try {
      sessionStorage.setItem(PARTNERS_FUNDING_VIDEO_STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setShowPartnersFundingStart(false);
  };

  /** Acknowledge org/images disclaimer, then open the in-app feature demo video modal. */
  const watchFeatureDemoFromStart = () => {
    dismissPartnersFundingStart();
    setShowFeatureDemoVideo(true);
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

  const handleStartPreview = async () => {
    if (!isPrototypeUnlocked()) {
      setShowPrototypePassword(true);
      return;
    }
    await enterPrototype();
  };

  const enterPrototype = async () => {
    activateDemoMode('default');
    await seedDemoData();
    window.location.assign('/?demo=1');
  };

  const inputClassName =
    'w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-[#002D24] focus:outline-none focus:ring-2 focus:ring-[#002D24]/20';

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-x-hidden"
      style={{
        backgroundColor: '#e9e7e3',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n' x='0' y='0' width='100%25' height='100%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.25' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.52 0 0 0 0 0.51 0 0 0 0 0.49 0 0 0 0.07 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '180px 180px',
      }}
    >
      {/* Hidden in film mode via html.ccd-feature-demo CSS (see index.css). */}
      <PrototypeNoticeBar />
      {/* Outer surround only: fluid padding scales with viewport; stage design unchanged */}
      <div className="relative z-10 flex flex-1 flex-col p-0 sm:p-[clamp(0.75rem,2vw,1rem)] lg:p-[clamp(1rem,2.5vw,1.5rem)]">
        <div className="relative mx-auto flex w-full max-w-[min(1440px,100%)] flex-col bg-[#002D24] sm:min-h-[calc(100dvh-2.5rem)] sm:overflow-hidden sm:rounded-2xl sm:shadow-[0_24px_80px_rgba(0,45,36,0.18)] lg:min-h-[calc(100dvh-3.5rem)]">
          {/* Full-bleed hero — content-sized stack on phone; fills stage on desktop */}
          <div className="relative w-full lg:absolute lg:inset-0">
            <LoginHeroPanel logoLetters={logoLetters} />
          </div>

          {/* Login card — below hero on phone/tablet (no overlap); floats over image on desktop */}
          <div className="relative z-20 mx-4 mb-5 mt-4 sm:mx-6 sm:mb-6 sm:mt-5 lg:absolute lg:bottom-auto lg:left-auto lg:right-5 lg:top-1/2 lg:mx-0 lg:mb-0 lg:mt-0 lg:w-[min(320px,30%)] lg:-translate-y-1/2 xl:right-8 xl:w-[340px]">
            <div className="overflow-hidden rounded-2xl border border-transparent bg-white shadow-[0_20px_50px_rgba(0,0,0,0.22)] lg:shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-end gap-2 px-4 pt-3 sm:px-5 lg:px-5 lg:pt-3">
                {canInstall && !isInstalled && (
                  <button
                    type="button"
                    onClick={async () => {
                      await install();
                    }}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-white/60 hover:text-gray-700"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Install</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowFeatureWalkthrough(true)}
                  className="flex items-center gap-2 rounded-lg bg-[#B6FF7E] px-3 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                >
                  <PlayCircle className="h-5 w-5 shrink-0 text-black" />
                  <span>Feature walkthrough</span>
                </button>
              </div>

              <div className="px-4 pb-5 pt-1 sm:px-5 sm:pb-6 lg:px-5 lg:pb-6">
                <div className="w-full">
                  {/* Logo on phone/tablet form only — desktop already has the hero mark */}
                  <LogoSVG
                    size="sm"
                    showText={false}
                    letters={logoLetters}
                    className="!space-x-0 lg:hidden"
                  />

                  <div className="mb-5 mt-3 lg:mt-0">
                    <h2
                      className="text-xl font-semibold tracking-tight text-[#002D24] sm:text-2xl"
                      style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                    >
                      Welcome back
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">Sign in to continue to your account.</p>
                  </div>

                  {showForgotPassword ? (
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
                        <div className="mb-1.5 flex items-center justify-between">
                          <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                            Password
                          </label>
                          {isSupabaseConfigured() && (
                            <button
                              type="button"
                              onClick={() => setShowForgotPassword(true)}
                              className="text-sm font-medium text-[#002D24] hover:underline"
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
                      </div>

                      {isSupabaseAuthEnabled() && (
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                          <input
                            type="checkbox"
                            checked={staySignedIn}
                            onChange={(e) => setStaySignedIn(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-[#002D24] focus:ring-[#002D24]"
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
                                className="mt-1 flex items-center gap-1 text-sm font-medium text-[#002D24] hover:underline"
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
                        className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ backgroundColor: isSubmitting ? '#6B7280' : LOGIN_GREEN }}
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

                  {!showForgotPassword && (
                    <>
                      <div className="my-5 flex items-center gap-3">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">or</span>
                        <div className="h-px flex-1 bg-gray-200" />
                      </div>

                      <button
                        type="button"
                        onClick={handleStartPreview}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        Explore the working prototype
                        <ExternalLink className="h-4 w-4" />
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

      {showPrototypePassword && (
        <PrototypePasswordPrompt
          onUnlocked={() => {
            setShowPrototypePassword(false);
            void enterPrototype();
          }}
          onCancel={() => setShowPrototypePassword(false)}
        />
      )}

      <PartnersFundingStartModal
        isOpen={showPartnersFundingStart}
        onClose={dismissPartnersFundingStart}
        onWatchVideo={watchFeatureDemoFromStart}
      />

      <FeatureDemoVideoModal
        isOpen={showFeatureDemoVideo}
        onClose={() => setShowFeatureDemoVideo(false)}
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
            style={{ backgroundColor: forgotSubmitting ? '#9CA3AF' : LOGIN_GREEN }}
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
            <div className="rounded-lg bg-[#002D24]/10 p-2">
              <Download className="h-6 w-6 text-[#002D24]" />
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
          <div className="rounded-lg border border-[#002D24]/15 bg-[#002D24]/5 p-4">
            <p className="mb-2 text-sm font-medium text-[#002D24]">Benefits of installing:</p>
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
              style={{ backgroundColor: LOGIN_GREEN }}
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
