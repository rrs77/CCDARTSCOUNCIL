import React, { useCallback, useEffect, useId, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { getVercelApiUrl } from '../../utils/apiUrl';
import { supabase } from '../../config/supabase';
import { isDemoModeActive } from '../../utils/demoMode';
import {
  YEAR_GROUP_ACCESS_NOTICE,
  hasAssignedYearGroups,
  shouldShowYearGroupsAccessNotice,
} from '../../utils/planner/yearGroupAccess';

const DISMISS_PREFIX = 'ccd:year-groups-notice-dismissed:';
const DEMO_USER_ID = 'demo-visitor';

function dismissKey(userId: string) {
  return `${DISMISS_PREFIX}${userId}`;
}

function readDismissed(userId: string): boolean {
  try {
    return localStorage.getItem(dismissKey(userId)) === '1';
  } catch {
    return false;
  }
}

function writeDismissed(userId: string) {
  try {
    localStorage.setItem(dismissKey(userId), '1');
  } catch {
    /* ignore quota / private mode */
  }
}

function clearDismissed(userId: string) {
  try {
    localStorage.removeItem(dismissKey(userId));
  } catch {
    /* ignore */
  }
}

/**
 * Dismissible but persistent notice for teachers with NULL/empty
 * allowed_year_groups. Hidden until auth profile has loaded; never shown for
 * admins, demo/preview, or users without an organisation.
 */
export function YearGroupsAccessNotice() {
  const { user, profile, loading: authLoading } = useAuth();
  const headingId = useId();
  const [dismissed, setDismissed] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const userId = user?.id || profile?.id || '';
  const isDemo = isDemoModeActive() || userId === DEMO_USER_ID;
  const hasGroups = hasAssignedYearGroups(profile?.allowed_year_groups);

  useEffect(() => {
    if (!userId || authLoading) {
      setDismissed(false);
      return;
    }
    if (hasGroups) {
      clearDismissed(userId);
      setDismissed(false);
      return;
    }
    setDismissed(readDismissed(userId));
  }, [userId, hasGroups, authLoading]);

  const onDismiss = useCallback(() => {
    if (userId) writeDismissed(userId);
    setDismissed(true);
  }, [userId]);

  const onRequestAccess = useCallback(async () => {
    if (requesting) return;
    setRequesting(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        toast.error('Sign in to request year-group access.');
        return;
      }
      const res = await fetch(getVercelApiUrl('/api/year-groups/request-access'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 429) {
        toast.error(
          typeof body?.error === 'string'
            ? body.error
            : 'You already requested access recently. Please try again tomorrow.',
        );
        return;
      }
      if (!res.ok) {
        toast.error(typeof body?.error === 'string' ? body.error : 'Could not send request.');
        return;
      }
      toast.success('Your school admin has been notified.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send request.');
    } finally {
      setRequesting(false);
    }
  }, [requesting]);

  const visible = shouldShowYearGroupsAccessNotice({
    authLoading,
    profile,
    isDemo,
    dismissed,
  });

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-labelledby={headingId}
      data-testid="year-groups-access-notice"
      className="mb-3 rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2.5 text-[#1F1B4D] shadow-sm"
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p
            id={headingId}
            className="text-[13px] font-semibold leading-snug text-[#1F1B4D]"
          >
            Year groups not assigned yet
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-[#3d3a55]">
            {YEAR_GROUP_ACCESS_NOTICE}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void onRequestAccess()}
              disabled={requesting}
              className="inline-flex min-h-[36px] items-center justify-center rounded-lg bg-[#4338E8] px-3 text-[13px] font-semibold text-white hover:bg-[#3529d1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {requesting ? 'Sending…' : 'Request access'}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss year groups notice"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#5c5878] hover:bg-amber-100/80 hover:text-[#1F1B4D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
