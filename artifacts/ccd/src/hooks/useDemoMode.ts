import { useMemo } from 'react';
import { isDemoModeActive } from '../utils/demoMode';
import toast from 'react-hot-toast';

export function useDemoMode() {
  const isDemo = useMemo(() => isDemoModeActive(), []);

  const showUpgradePrompt = (featureName: string) => {
    toast(
      `${featureName} is available with a full account. Sign up free to unlock exporting, printing, and sharing.`,
      {
        duration: 5000,
        style: {
          background: '#312e81',
          color: '#e0e7ff',
          borderRadius: '12px',
          padding: '14px 18px',
          fontSize: '14px',
          maxWidth: '420px',
          border: '1px solid #4338ca',
        },
      }
    );
  };

  const gateFeature = (featureName: string, callback: () => void) => {
    if (isDemo) {
      showUpgradePrompt(featureName);
      return;
    }
    callback();
  };

  // The prototype now carries a full snapshot of real account content and
  // supports the complete editing workflow, so descriptions are no longer
  // truncated for demo visitors.
  const truncateForDemo = (text: string, _limit = 90): string => text;

  return { isDemo, showUpgradePrompt, gateFeature, truncateForDemo };
}
