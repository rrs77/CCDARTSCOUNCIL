import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { navigateToSettings } from './settings';
import {
  initialsFromDisplayName,
  resolveDisplayName,
  roleLabelShort,
} from '../utils/accountDisplay';

interface AccountMenuProps {
  /** Compact trigger for the desktop header strip */
  compact?: boolean;
  /** Close parent mobile drawer when navigating */
  onNavigate?: () => void;
}

export function AccountMenu({ compact = true, onNavigate }: AccountMenuProps) {
  const { user, profile, logout } = useAuth();
  const [open, setOpen] = useState(false);
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
          className="grid h-7 w-7 place-items-center rounded-full bg-[#4338E8] text-[11px] font-extrabold text-white lg:h-8 lg:w-8 lg:text-xs"
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
    </div>
  );
}
