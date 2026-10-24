/**
 * Typed read hook for the shared workspace profile (Settings → My classes).
 * Add-ons should use this instead of maintaining their own class lists.
 */

import { useCallback, useEffect, useState } from 'react';
import { workspaceProfileApi } from '../config/workspaceProfileApi';
import type { WorkspaceProfile } from '../utils/workspaceProfile';
import { emptyWorkspaceProfile } from '../utils/workspaceProfile';

export type UseWorkspaceProfileResult = {
  profile: WorkspaceProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Convenience: flat class list from the shared profile */
  classes: WorkspaceProfile['classes'];
  schoolName: string;
};

export function useWorkspaceProfile(): UseWorkspaceProfileResult {
  const [profile, setProfile] = useState<WorkspaceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await workspaceProfileApi.getMine();
      setProfile(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspace profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    profile,
    loading,
    error,
    refresh,
    classes: profile?.classes ?? emptyWorkspaceProfile().classes,
    schoolName: profile?.schoolName ?? '',
  };
}
