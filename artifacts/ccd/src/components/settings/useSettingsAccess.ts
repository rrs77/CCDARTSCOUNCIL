import { useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { isSupabaseAuthEnabled, isSupabaseConfigured } from '../../config/supabase';
import { isDemoModeActive } from '../../utils/demoMode';
import type { SettingsAccess } from './SettingsPage';
import type { SchoolToolsPanelId } from './settingsSections';

/** Role gates for Settings sections — same rules as the former modal tabs. */
export function useSettingsAccess(): SettingsAccess {
  const { user, profile } = useAuth();

  return useMemo(() => {
    const isAdmin =
      user?.role === 'admin' ||
      user?.role === 'superuser' ||
      user?.role === 'super_admin' ||
      profile?.role === 'admin' ||
      profile?.role === 'superuser' ||
      profile?.role === 'super_admin';
    const isSuperAdmin =
      user?.role === 'super_admin' ||
      profile?.role === 'super_admin' ||
      user?.role === 'superuser' ||
      profile?.role === 'superuser';
    const isCreator = profile?.role === 'creator';
    const canManageUsers =
      isAdmin ||
      profile?.role === 'admin' ||
      profile?.role === 'superuser' ||
      profile?.role === 'super_admin' ||
      profile?.can_manage_users === true;
    // Live API when Supabase is on; demo always shows Users for school leads/admins.
    const showUsers =
      canManageUsers &&
      (isDemoModeActive() || isSupabaseAuthEnabled() || isSupabaseConfigured());
    const showHubAdmin =
      isAdmin ||
      profile?.role === 'organisation' ||
      profile?.role === 'super_admin' ||
      (profile?.hub_memberships?.some((m) => m.role === 'admin' || m.role === 'owner') ?? false);
    const canEditSystemCategories = isAdmin || isSuperAdmin;

    const schoolPanels: SchoolToolsPanelId[] = [];
    if (showHubAdmin) schoolPanels.push('hub-admin');
    if (isAdmin) schoolPanels.push('hub-content');
    if (isAdmin) schoolPanels.push('branding');
    if (isAdmin || isCreator) schoolPanels.push('manage-packs');
    if (canEditSystemCategories) schoolPanels.push('system-categories');
    if (isAdmin) schoolPanels.push('data');

    const showIntegrations =
      isAdmin ||
      canManageUsers ||
      profile?.role === 'organisation' ||
      isDemoModeActive();

    return {
      showDownloads: true,
      showUsers,
      showIntegrations,
      showSchoolTools: schoolPanels.length > 0,
      schoolPanels,
    };
  }, [user, profile]);
}
