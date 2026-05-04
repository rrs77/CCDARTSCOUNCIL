import React from 'react';
import { Eye, LogIn, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getDemoOriginSchool } from '../utils/demoMode';

export function PreviewBanner() {
  const { logout } = useAuth();

  const handleSignIn = () => {
    void logout();
  };

  const handleExit = () => {
    void logout();
  };

  const origin = getDemoOriginSchool();
  const exitLabel = origin ? `Back to ${origin}` : 'Exit preview';

  return (
    <div
      role="region"
      aria-label="Preview mode notice"
      className="fixed top-0 left-0 right-0 z-[55] w-full border-b border-indigo-300/40 bg-gradient-to-r from-indigo-900 via-violet-900 to-indigo-900 text-white shadow-lg"
    >
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-3 px-3 py-2.5 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white/15 px-3 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm border border-white/20">
            <Eye className="h-3.5 w-3.5" />
            Preview
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium leading-tight text-indigo-100">
              You are exploring a sample curriculum
            </div>
            <div className="hidden text-xs leading-tight text-indigo-300 sm:block">
              Browse lessons, activities, and resources. Create a free account to build your own.
            </div>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleSignIn}
            className="hidden items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-indigo-900 shadow-sm transition hover:bg-indigo-50 sm:inline-flex"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign up free</span>
          </button>
          <button
            type="button"
            onClick={handleSignIn}
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-indigo-900 shadow-sm transition hover:bg-indigo-50 sm:hidden"
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign up
          </button>
          <button
            type="button"
            onClick={handleExit}
            aria-label={exitLabel}
            title={exitLabel}
            className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/20"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>
    </div>
  );
}
