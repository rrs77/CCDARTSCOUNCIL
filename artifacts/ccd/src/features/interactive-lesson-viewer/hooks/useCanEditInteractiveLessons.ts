import { useAuth } from '../../../hooks/useAuth';
import { useIsViewOnly } from '../../../hooks/useIsViewOnly';
import { isAuthorizedDemoMode } from '../../../utils/demoMode';
import type { ProfileRole } from '../../../types/auth';

const SYSTEM_ADMIN_ROLES = new Set<ProfileRole | string>([
  'admin',
  'superuser',
  'super_admin',
]);

/**
 * Admin / hub-admin gate for the Interactive Lesson EDITOR.
 * Mirrors UserSettings `isAdmin` + `showHubAdmin` — uses the normal CCDesigner
 * session (Supabase profile / user.role). No prototype password required.
 */
export function useCanEditInteractiveLessons(): boolean {
  const { user, profile } = useAuth();
  const isViewOnly = useIsViewOnly();
  if (!user || isViewOnly) return false;

  // Optional: authorised demo can still edit for classroom review walks.
  // Normal admin login does not depend on this.
  if (isAuthorizedDemoMode()) return true;

  const role = (profile?.role || user.profile?.role || user.role || '') as string;

  const isSystemAdmin = SYSTEM_ADMIN_ROLES.has(role);

  const isHubAdmin =
    role === 'organisation' ||
    (profile?.hub_memberships?.some((m) => m.role === 'admin' || m.role === 'owner') ??
      false) ||
    (user.profile?.hub_memberships?.some((m) => m.role === 'admin' || m.role === 'owner') ??
      false);

  // Explicit profile capability (set in User Management) also grants the editor.
  const canEditLessons =
    profile?.can_edit_lessons === true || user.profile?.can_edit_lessons === true;

  return isSystemAdmin || isHubAdmin || canEditLessons;
}
