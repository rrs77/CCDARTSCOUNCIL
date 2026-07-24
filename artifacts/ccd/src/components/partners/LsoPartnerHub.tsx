import { LsoSiteProvider } from './lso/LsoSiteContext';
import { LsoPartnerHubBody } from './lso/LsoPartnerHubBody';

interface LsoPartnerHubProps {
  onAddedToApp?: (info: { sheetId: string }) => void;
  standalone?: boolean;
}

/**
 * LSO hub body — collapsed logo / description / contact live in PartnerHubPage.
 * When rendered outside LsoSiteShell (legacy), wraps its own provider for public browse.
 */
export function LsoPartnerHub({ onAddedToApp }: LsoPartnerHubProps) {
  return (
    <LsoSiteProvider>
      <LsoPartnerHubBody onAddedToApp={onAddedToApp} />
    </LsoSiteProvider>
  );
}
