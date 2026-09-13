import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { CompactSignInForm } from './CompactSignInForm';
import { buildSignInHref } from '../../utils/authReturn';

interface SignInRequiredModalProps {
  open: boolean;
  onClose: () => void;
  /** Shown under the title */
  message?: string;
  /**
   * Path to return to after the full-page Sign in flow
   * (`/?return=…&signin=1`). Same-origin relative; works on Preview and production.
   */
  returnUrl?: string;
}

/**
 * Modal prompting sign-in before a protected action.
 * Sign in → full CCDesigner login, preserving return URL.
 * Sign in here → compact in-place form (no marketing shell / welcome modal).
 */
export function SignInRequiredModal({
  open,
  onClose,
  message = 'Sign in to download this resource. Your place on this page will be remembered.',
  returnUrl,
}: SignInRequiredModalProps) {
  const [showHere, setShowHere] = useState(false);

  if (!open) return null;

  const goLogin = () => {
    const ret =
      returnUrl ||
      (typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : '/forum');
    window.location.assign(buildSignInHref(ret));
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="signin-required-title"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#002D24]" aria-hidden />
            <h2 id="signin-required-title" className="text-lg font-semibold text-gray-900">
              Sign in required
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowHere(false);
              onClose();
            }}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600">{message}</p>

        {showHere ? (
          <CompactSignInForm
            onSuccess={() => {
              setShowHere(false);
              onClose();
            }}
          />
        ) : (
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={goLogin}
              className="rounded-lg bg-[#002D24] px-4 py-2 text-sm font-medium text-white hover:opacity-95"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setShowHere(true)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-[#008272] hover:underline"
            >
              Sign in here
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
