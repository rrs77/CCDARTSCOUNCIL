import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { getLsoDefaultLayout } from '../../config/partnerOrgHubDefaults';
import { setupLSOYear6Example } from '../../utils/setupLSOYear6';
import {
  PartnerOrgHubTemplate,
  type PartnerOrgSeedMode,
} from './PartnerOrgHubTemplate';

interface LsoPartnerHubProps {
  onAddedToApp?: (info: { sheetId: string }) => void;
  standalone?: boolean;
}

/**
 * LSO hub — same PartnerOrgHubTemplate as Jazz North (Resources, Forums & information, Subscribe).
 */
export function LsoPartnerHub({ onAddedToApp }: LsoPartnerHubProps) {
  const defaults = useMemo(() => getLsoDefaultLayout(), []);

  const handleSeed = async (_seedKey: string, mode: PartnerOrgSeedMode) => {
    try {
      const result = await setupLSOYear6Example({
        force: true,
        registerPartnerPlanning: true,
      });
      if (result.skipped) {
        toast.success('How to Build an Orchestra is already in your library');
      } else if (mode === 'activities') {
        toast.success('Added How to Build an Orchestra activities to CCDesigner');
      } else if (mode === 'lesson') {
        toast.success('Added How to Build an Orchestra lesson plans to CCDesigner');
      } else {
        toast.success('Added How to Build an Orchestra to CCDesigner');
      }
      onAddedToApp?.({ sheetId: result.sheetId || 'Year6' });
    } catch (e) {
      console.error(e);
      toast.error('Could not add LSO content. Please try again.');
      throw e;
    }
  };

  return (
    <PartnerOrgHubTemplate
      defaults={defaults}
      accentBorderClassName="border-teal-200"
      linkClassName="text-teal-800"
      featuredAccentClassName="border-teal-200 bg-teal-50/60"
      featuredEyebrowClassName="text-teal-800"
      onSeed={handleSeed}
    />
  );
}
