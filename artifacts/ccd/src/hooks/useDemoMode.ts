import { useMemo } from 'react';
import { isDemoModeActive } from '../utils/demoMode';

/**
 * UI helpers for the (legacy) demo/preview session flag.
 *
 * Preview/demo mode no longer gates exporting, printing, or sharing — any
 * signed-in user (including the Demo Visitor account) must be able to use
 * those features. `isDemo` is therefore always false for feature gates.
 *
 * `isDemoModeActive()` still exists for data/auth seeding (localStorage
 * snapshot, synthetic session); do not use it to lock PDF/share/print UI.
 */
export function useDemoMode() {
  // Never treat demo/preview as a feature lock for signed-in sessions.
  const isDemo = useMemo(() => false, []);

  /** @deprecated Preview gates are gone; kept as a no-op for call-site compatibility. */
  const showUpgradePrompt = (_featureName: string) => {
    // Intentionally empty — export/print/share are available to all signed-in users.
  };

  const gateFeature = (_featureName: string, callback: () => void) => {
    callback();
  };

  // Descriptions are never truncated for demo visitors.
  const truncateForDemo = (text: string, _limit = 90): string => text;

  /** True when the tab still carries the legacy demo seed flag (data path only). */
  const isDemoSession = useMemo(() => isDemoModeActive(), []);

  return { isDemo, isDemoSession, showUpgradePrompt, gateFeature, truncateForDemo };
}
