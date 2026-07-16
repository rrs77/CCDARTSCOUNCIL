import { useState, type FormEvent } from 'react';
import { Lock, X } from 'lucide-react';

const GATE_PASSWORD = 'artscouncil26';
const GATE_KEY = 'ccd-prototype-gate';

export function isPrototypeUnlocked(): boolean {
  try {
    return sessionStorage.getItem(GATE_KEY) === '1';
  } catch {
    return false;
  }
}

function rememberUnlock() {
  try {
    sessionStorage.setItem(GATE_KEY, '1');
  } catch {
    // Storage unavailable — the caller still proceeds for this page view
  }
}

interface PrototypePasswordPromptProps {
  onUnlocked: () => void;
  onCancel?: () => void;
}

/**
 * Full-screen password prompt shown before entering the working prototype.
 * The home screen and login page stay public; this only guards prototype entry.
 */
export function PrototypePasswordPrompt({ onUnlocked, onCancel }: PrototypePasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password.trim().toLowerCase() === GATE_PASSWORD) {
      rememberUnlock();
      onUnlocked();
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute right-3 top-3 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
            <Lock className="h-6 w-6 text-[#7c3aed]" />
          </div>
          <h1 className="text-xl font-bold italic text-gray-900">
            Working prototype
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            The working prototype is password protected. Enter the access
            password to continue.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            placeholder="Access password"
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#a78bfa]/40"
            aria-label="Access password"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-[#7c3aed] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6d28d9]"
          >
            Enter prototype
          </button>
        </form>
      </div>
    </div>
  );
}
