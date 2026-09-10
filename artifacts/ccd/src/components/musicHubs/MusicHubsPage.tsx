import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { HubPageTemplate } from './HubPageTemplate';
import { MusicHubsDirectory } from './MusicHubsDirectory';
import {
  findMusicHubNodeByPath,
  LEGACY_PARTNER_TO_MUSIC_HUB_PATH,
} from '../../config/musicHubsDirectory';
import { backToCCDesigner, openPartnerHub } from '../../config/partnerHubs';

/**
 * Standalone /music-hubs and /music-hubs/* pages (signed-in).
 */
export function MusicHubsPage({
  path,
  onAddedToApp,
}: {
  /** Empty string = directory root. */
  path: string;
  onAddedToApp?: (info: { sheetId: string }) => void;
}) {
  const match = path ? findMusicHubNodeByPath(path) : null;
  const partnerSlug = match?.node.partnerHubSlug;

  useEffect(() => {
    if (partnerSlug === 'ems' || partnerSlug === 'triborough') {
      openPartnerHub(partnerSlug);
    }
  }, [partnerSlug]);

  if (!path) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E8F0EA]/80 via-gray-50 to-gray-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => backToCCDesigner('our-partners')}
            className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-[#002D24]/20 bg-white px-3 py-1.5 text-sm font-semibold text-[#002D24] hover:bg-[#E8F0EA]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to Partner Hubs
          </button>
          <MusicHubsDirectory />
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-[#002D24]">Page not found</h1>
        <p className="mt-2 text-sm text-[#002D24]/70">No Music Hub matches this path.</p>
        <a href="/music-hubs" className="mt-4 inline-block text-sm font-semibold text-[#002D24] underline">
          Back to Music Hubs
        </a>
      </div>
    );
  }

  if (partnerSlug === 'ems' || partnerSlug === 'triborough') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#002D24]/70">
        Opening {match.node.name}…
      </div>
    );
  }

  const { node, parents } = match;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F0EA]/60 via-gray-50 to-gray-50">
      <div className="border-b border-[#002D24]/10 bg-white/80">
        <div className="mx-auto flex w-full max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => backToCCDesigner('our-partners')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#002D24]/20 bg-white px-3 py-1.5 text-sm font-semibold text-[#002D24] hover:bg-[#E8F0EA]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to CCDesigner
          </button>
        </div>
      </div>
      <HubPageTemplate node={node} parents={parents} onAddedToApp={onAddedToApp} />
    </div>
  );
}

/** Resolve partner hub slug to directory path for breadcrumbs / redirects. */
export function musicHubPathForPartnerSlug(slug: string): string | null {
  return LEGACY_PARTNER_TO_MUSIC_HUB_PATH[slug] || null;
}
