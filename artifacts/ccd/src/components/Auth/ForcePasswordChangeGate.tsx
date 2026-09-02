import React, { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

/**
 * Blocking overlay when profile.must_change_password is true (temp password from admin).
 */
export function ForcePasswordChangeGate({ children }: { children: React.ReactNode }) {
  const { profile, refreshProfile, user } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user || !profile?.must_change_password) {
    return <>{children}</>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      const { error: authErr } = await supabase.auth.updateUser({ password });
      if (authErr) throw new Error(authErr.message);
      const { error: profErr } = await supabase
        .from('profiles')
        .update({
          must_change_password: false,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);
      if (profErr) throw new Error(profErr.message);
      await refreshProfile();
      toast.success('Password updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#002D24]/80 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-[#002D24]" />
          <h1 className="text-lg font-semibold text-gray-900">Choose a new password</h1>
        </div>
        <p className="mb-4 text-sm text-gray-600">
          Your account was set up with a temporary password. Please choose a new one before
          continuing.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">New password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Confirm password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#002D24] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save and continue
          </button>
        </form>
      </div>
    </div>
  );
}
