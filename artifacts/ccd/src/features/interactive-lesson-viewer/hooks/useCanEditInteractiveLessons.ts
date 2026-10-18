import { useAuth } from '../../../hooks/useAuth';
import { useIsViewOnly } from '../../../hooks/useIsViewOnly';
import { isAuthorizedDemoMode } from '../../../utils/demoMode';

/**
 * Admin / hub-admin gate for the Interactive Lesson EDITOR.
 * Mirrors UserSettings showHubAdmin + isAdmin pattern — no new auth system.
 * Authorized prototype demo mode can open the editor for classroom-ready review.
 */
export function useCanEditInteractiveLessons(): boolean {
  const { user, profile } = useAuth();
  const isViewOnly = useIsViewOnly();
  if (!user || isViewOnly) return false;

  if (isAuthorizedDemoMode()) return true;

  const role = profile?.role || user.role;
  const isSystemAdmin =
    role === 'admin' || role === 'superuser' || role === 'super_admin';

  const isHubAdmin =
    role === 'organisation' ||
    (profile?.hub_memberships?.some((m) => m.role === 'admin' || m.role === 'owner') ?? false);

  return isSystemAdmin || isHubAdmin;
}
