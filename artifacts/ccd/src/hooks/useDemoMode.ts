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

  const truncateForDemo = (text: string, limit = 90): string => {
    if (!isDemo || !text || text.length <= limit) return text;
    return text.substring(0, limit) + '...';
  };

  return { isDemo, showUpgradePrompt, gateFeature, truncateForDemo };
}
