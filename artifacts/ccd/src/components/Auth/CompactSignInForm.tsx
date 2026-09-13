import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { isSupabaseAuthEnabled, setSessionOnlyCookie } from '../../config/supabase';

/**
 * In-place email/password sign-in for gated Forum actions.
 * Avoids embedding the full marketing LoginForm (welcome modal, walkthrough).
 */
export function CompactSignInForm({ onSuccess }: { onSuccess?: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (isSupabaseAuthEnabled() && !staySignedIn) {
        setSessionOnlyCookie();
      }
      await login(email, password);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-3">
      <div>
        <label htmlFor="forum-signin-email" className="mb-1 block text-sm font-medium text-gray-700">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="forum-signin-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-[#002D24] focus:outline-none focus:ring-2 focus:ring-[#002D24]/20"
          />
        </div>
      </div>
      <div>
        <label htmlFor="forum-signin-password" className="mb-1 block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="forum-signin-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-10 text-sm focus:border-[#002D24] focus:outline-none focus:ring-2 focus:ring-[#002D24]/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <button
        type="submit"
        disabled={isSubmitting || !email.trim()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#002D24] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Sign in
      </button>
    </form>
  );
}
