import React from 'react';
import { Eye, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getDemoOriginSchool } from '../utils/demoMode';

/**
 * Persistent top banner shown while the visitor is in Preview / Demo mode.
 *
 * - Clearly labels the session as a preview
 * - Surfaces sign-up / log-in calls to action
 * - Includes an "Exit" button that returns the visitor to the school homepage
 *   (or `/`) by triggering AuthContext.logout()
 */
export function PreviewBanner() {
  const { logout } = useAuth();

  const handleSignIn = () => {
    void logout();
  };

  const handleExit = () => {
    void logout();
  };

  const origin = getDemoOriginSchool();
  const exitLabel = origin ? `Exit to ${origin}` : 'Exit preview';

  return (
    <div
      role="region"
      aria-label="Preview mode notice"
      className="sticky top-0 z-50 w-full border-b border-amber-200 bg-gradient-to-r from-amber-50 via-amber-50 to-orange-50 text-amber-900"
    >
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-3 px-3 py-2 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-400/30 text-amber-900">
            <Eye className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-tight">
              You're in preview mode
            </div>
            <div className="hidden text-xs leading-tight text-amber-800/90 sm:block">
              Browse sample drama, music, and dance content. Sign in to save your own.
            </div>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleSignIn}
            className="hidden items-center gap-1.5 rounded-full bg-amber-900 px-3.5 py-1.5 text-xs font-semibold text-amber-50 shadow-sm transition hover:bg-amber-950 sm:inline-flex"
          >
            <span>Sign up or log in</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleSignIn}
            className="inline-flex items-center gap-1 rounded-full bg-amber-900 px-3 py-1.5 text-xs font-semibold text-amber-50 shadow-sm transition hover:bg-amber-950 sm:hidden"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={handleExit}
            aria-label={exitLabel}
            title={exitLabel}
            className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white/70 px-2.5 py-1.5 text-xs font-medium text-amber-900 transition hover:bg-white"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>
    </div>
  );
}
