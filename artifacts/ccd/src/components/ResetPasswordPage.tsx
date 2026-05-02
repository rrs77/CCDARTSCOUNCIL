import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { LogoSVG } from './Logo';
import { supabase, isSupabaseConfigured, isSupabaseAuthEnabled } from '../config/supabase';

export function ResetPasswordPage() {
  const loginBgColor = 'rgb(77, 181, 168)';
  const loginButtonColor = '#008272';
  const logoLetters = 'CCD';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasRecoveryToken, setHasRecoveryToken] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash || '';
    const hasHash = hash.includes('type=recovery') || hash.includes('access_token');
    if (!hasHash) {
      setHasRecoveryToken(false);
      setSessionReady(true);
      return;
    }
    setHasRecoveryToken(true);

    const applySession = (session: { user: unknown } | null) => {
      setSessionReady(true);
      if (!session && hasHash) setHasRecoveryToken(false);
    };

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        applySession(session);
        return;
      }
      timeoutId = setTimeout(() => {
        supabase.auth.getSession().then(({ data: { session: s } }) => applySession(s));
      }, 800);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) applySession(session);
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw new Error(err.message);
      setSuccess(true);
      await supabase.auth.signOut();
      setTimeout(() => {
        window.location.href = '/';
      }, 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update password';
      if (msg.toLowerCase().includes('same') || msg.toLowerCase().includes('different')) {
        setError('Please choose a new password that is different from your current one.');
      } else if (msg.toLowerCase().includes('weak') || msg.toLowerCase().includes('at least')) {
        setError('Password does not meet requirements. Use at least 6 characters.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: loginBgColor }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <p className="text-gray-700">Password reset requires Supabase to be configured.</p>
          <a href="/" className="mt-4 inline-block text-teal-600 hover:underline font-medium">Back to sign in</a>
        </div>
      </div>
    );
  }

  if (!isSupabaseAuthEnabled()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: loginBgColor }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <p className="text-gray-700 mb-4">Password reset is only available when sign-in uses Supabase Auth. Ask your administrator to set VITE_USE_SUPABASE_AUTH=true.</p>
          <a href="/" className="text-teal-600 hover:underline font-medium">Back to sign in</a>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: loginBgColor }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <p className="text-gray-600">Checking reset link…</p>
        </div>
      </div>
    );
  }

  if (!hasRecoveryToken && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: loginBgColor }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invalid or expired link</h2>
          <p className="text-gray-600 mb-4">Please request a new password reset from the login screen.</p>
          <a href="/" className="text-teal-600 hover:underline font-medium">Back to sign in</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: loginBgColor }}>
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <LogoSVG size="lg" showText={true} letters={logoLetters} boldCurriculumDesigner={true} />
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {success ? (
            <div className="space-y-3 text-center">
              <p className="text-green-700 bg-green-50 p-4 rounded-lg">
                Password updated successfully.
              </p>
              <p className="text-sm text-gray-600">
                You will be taken to the sign-in page. Use your new password to log in.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Set new password</h2>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">New password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-2">Confirm password</label>
                <input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="block w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900"
                  placeholder="Confirm new password"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-medium py-3 px-4 rounded-lg"
                style={{ backgroundColor: loading ? '#9CA3AF' : loginButtonColor }}
              >
                {loading ? 'Updating…' : 'Set password'}
              </button>
              <a href="/" className="block text-center text-sm text-gray-600 hover:text-gray-900">
                Back to sign in
              </a>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
