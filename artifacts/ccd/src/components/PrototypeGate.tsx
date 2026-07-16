import { useState, type FormEvent, type ReactNode } from 'react';
import { Lock } from 'lucide-react';

const GATE_PASSWORD = 'artscouncil26';
const GATE_KEY = 'ccd-prototype-gate';

function isUnlocked(): boolean {
  try {
    return sessionStorage.getItem(GATE_KEY) === '1';
  } catch {
    return false;
  }
}

export function PrototypeGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(isUnlocked);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (unlocked) return <>{children}</>;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password.trim().toLowerCase() === GATE_PASSWORD) {
      try {
        sessionStorage.setItem(GATE_KEY, '1');
      } catch {
        // Storage unavailable — still unlock for this render
      }
      setUnlocked(true);
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
            <Lock className="h-6 w-6 text-[#7c3aed]" />
          </div>
          <h1 className="text-xl font-bold italic text-gray-900">
            Creative Curriculum Designer
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            This working prototype is password protected. Enter the access
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
