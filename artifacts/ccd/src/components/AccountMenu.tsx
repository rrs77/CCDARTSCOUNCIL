import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, KeyRound, Loader2, LogOut, Settings, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { navigateToSettings } from './settings';
import { getLiveSupabase } from '../config/supabase';
import { isDemoModeActive } from '../utils/demoMode';
import {
  initialsFromDisplayName,
  resolveDisplayName,
  roleLabelShort,
} from '../utils/accountDisplay';
import toast from 'react-hot-toast';

interface AccountMenuProps {
  /** Compact trigger for the desktop header strip */
  compact?: boolean;
  /** Close parent mobile drawer when navigating */
  onNavigate?: () => void;
}

export function AccountMenu({ compact = true, onNavigate }: AccountMenuProps) {
  const { user, profile, logout, refreshProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const displayName = resolveDisplayName(user, profile);
  const email = profile?.email || user?.email || '';
  const role = roleLabelShort(profile?.role || user?.role);
  const initials = initialsFromDisplayName(displayName, email);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (password.length < 8) {
      setPasswordError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      if (isDemoModeActive() && (!user?.id || user.id === 'demo-visitor')) {
        toast.success('Password updated (demo — not saved to the server).');
        setPasswordOpen(false);
        setPassword('');
        setConfirm('');
        return;
      }
      const live = getLiveSupabase();
      const { error } = await live.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      if (profile?.id && profile.id !== 'demo-visitor') {
        await live
          .from('profiles')
          .update({
            must_change_password: false,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id);
        await refreshProfile();
      }
      toast.success('Password updated.');
      setPasswordOpen(false);
      setPassword('');
      setConfirm('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Could not update password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="relative flex-shrink-0" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 rounded-xl border border-[#E2E0EF] bg-white transition-colors hover:border-[#bcb7f4] hover:bg-[#FAFAFC] focus:outline-none focus:ring-2 focus:ring-[#4338E8]/25 ${
          compact ? 'px-2 py-1.5 lg:px-2.5 lg:py-1.5' : 'w-full px-3 py-2'
        }`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${displayName}`}
      >
        <span
          className="grid h-7 w-7 place-items-center rounded-full bg-[#4338E8] text-[13px] font-extrabold tracking-tight text-white lg:h-8 lg:w-8"
          aria-hidden
        >
          {initials}
        </span>
        <span className="hidden min-w-0 max-w-[7.5rem] truncate text-left text-xs font-semibold text-[#1F1B4D] lg:inline lg:max-w-[9rem] lg:text-sm">
          {displayName}
        </span>
        <ChevronDown
          className={`hidden h-3.5 w-3.5 text-[#77738F] transition-transform lg:block ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-[60] mt-1.5 w-64 overflow-hidden rounded-xl border border-[#E2E0EF] bg-white shadow-lg"
        >
          <div className="border-b border-[#E2E0EF] px-3.5 py-3">
            <p className="truncate text-[14px] font-extrabold text-[#1F1B4D]">{displayName}</p>
            {email ? (
              <p className="mt-0.5 truncate text-[12px] font-medium text-[#5C5878]">{email}</p>
            ) : null}
            <p className="mt-1.5 inline-flex rounded-md bg-[#E9E6FF] px-1.5 py-0.5 text-[11px] font-bold text-[#2A2299]">
              {role}
            </p>
          </div>
          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold text-[#1F1B4D] hover:bg-[#F4F3FA]"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
                navigateToSettings();
              }}
            >
              <Settings className="h-4 w-4 text-[#4338E8]" />
              Settings
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold text-[#1F1B4D] hover:bg-[#F4F3FA]"
              onClick={() => {
                setOpen(false);
                setPasswordOpen(true);
              }}
            >
              <KeyRound className="h-4 w-4 text-[#4338E8]" />
              Change password
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold text-[#1F1B4D] hover:bg-[#F4F3FA]"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
                void logout();
              }}
            >
              <LogOut className="h-4 w-4 text-[#77738F]" />
              Sign out
            </button>
          </div>
        </div>
      )}

      {passwordOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1F1B4D]/55 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#E2E0EF] bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-[16px] font-extrabold text-[#1F1B4D]">Change password</h2>
                <p className="mt-1 text-[13px] font-medium text-[#5C5878]">
                  Choose a new password for {email || 'your account'}.
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-1.5 text-[#77738F] hover:bg-[#F4F3FA]"
                aria-label="Close"
                onClick={() => setPasswordOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(e) => void submitPassword(e)} className="space-y-3">
              <div>
                <label className="mb-1 block text-[12px] font-bold text-[#5C5878]">New password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#E2E0EF] px-3 py-2 text-sm focus:border-[#4338E8] focus:outline-none focus:ring-2 focus:ring-[#4338E8]/25"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-bold text-[#5C5878]">Confirm password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-xl border border-[#E2E0EF] px-3 py-2 text-sm focus:border-[#4338E8] focus:outline-none focus:ring-2 focus:ring-[#4338E8]/25"
                  autoComplete="new-password"
                />
              </div>
              {passwordError ? <p className="text-[13px] font-medium text-red-600">{passwordError}</p> : null}
              <button
                type="submit"
                disabled={savingPassword}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#4338E8] text-[13px] font-extrabold text-white hover:bg-[#3529d1] disabled:opacity-60"
              >
                {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save password
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
