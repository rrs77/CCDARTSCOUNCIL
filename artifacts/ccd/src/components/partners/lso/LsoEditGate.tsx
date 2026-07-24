import { useEffect, useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { useLsoSite } from './LsoSiteContext';

/**
 * Prototype password gate for LSO site editing.
 * Password is the plain string `lso` (Arts Council demo only).
 */
export function LsoEditGate({
  open,
  onClose,
  onUnlocked,
}: {
  open: boolean;
  onClose?: () => void;
  onUnlocked?: () => void;
}) {
  const { unlock, unlocked } = useLsoSite();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setPassword('');
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (open && unlocked) onUnlocked?.();
  }, [open, unlocked, onUnlocked]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lso-edit-gate-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-7">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#0a1628] text-white">
          <Lock className="h-5 w-5" aria-hidden />
        </div>
        <h2 id="lso-edit-gate-title" className="text-lg font-semibold text-gray-900">
          Edit LSO partner site
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
          Prototype editor for LSO staff. Enter the demo password to unlock rich-text and
          image editing. Changes save in this browser (localStorage).
        </p>
        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (unlock(password)) {
              setError('');
              onUnlocked?.();
            } else {
              setError('Incorrect password.');
            }
          }}
        >
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Password
            </span>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </label>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#0a1628] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 sm:flex-none"
            >
              <Unlock className="h-4 w-4" aria-hidden />
              Unlock editor
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        <p className="mt-4 text-[11px] leading-relaxed text-gray-400">
          Demo only — not production auth. Password is documented for Arts Council
          walkthroughs.
        </p>
      </div>
    </div>
  );
}
