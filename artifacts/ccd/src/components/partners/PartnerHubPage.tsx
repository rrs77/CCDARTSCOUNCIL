import React from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { PartnerHubConfig } from '../../config/partnerHubs';
import { backToCCDesigner } from '../../config/partnerHubs';
import { PartnerHubContactFooter } from './PartnerHubContactFooter';
import { PARTNER_CONTACTS } from '../../config/partnerContacts';

interface PartnerHubPageProps {
  hub: PartnerHubConfig;
  children: React.ReactNode;
}

/**
 * One continuous partner hub page:
 *   back → featured logo (hero) → name/site → org description → children
 *   → shared contact footer (LSO contact block preserved via PartnerHubContactFooter)
 *
 * Intentionally NOT a split-panel / two-column school-homepage layout.
 */
export function PartnerHubPage({ hub, children }: PartnerHubPageProps) {
  const panelColor = hub.logoPanelColor || hub.primaryColor;
  const logoOnDark = hub.logoInvert || isDarkHex(panelColor);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <button
          type="button"
          onClick={() => backToCCDesigner('our-partners')}
          className="mb-5 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-800 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ['--tw-ring-color' as string]: hub.primaryColor }}
          aria-label="Back to CCDesigner"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to CCDesigner
        </button>

        {/* Featured logo + org intro — single composition at top of page */}
        <header className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div
            className="flex min-h-[9.5rem] items-center justify-center px-6 py-10 sm:min-h-[11rem] sm:px-10 sm:py-12"
            style={{
              background: `linear-gradient(145deg, ${panelColor} 0%, ${panelColor} 55%, ${hub.accentColor}44 100%)`,
            }}
            aria-hidden={false}
          >
            <img
              src={hub.logoSrc}
              alt={`${hub.displayName} logo`}
              className={`h-16 w-auto max-w-[min(100%,20rem)] object-contain sm:h-20 ${
                logoOnDark && hub.logoSrc.endsWith('.svg') ? 'brightness-0 invert' : ''
              }`}
              loading="eager"
              decoding="async"
            />
          </div>

          <div className="space-y-4 px-5 py-6 sm:px-8 sm:py-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Partner Hub · /{hub.slug}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                {hub.displayName}
              </h1>
              {hub.tagline && (
                <p className="mt-1 text-sm text-gray-500 sm:text-base">{hub.tagline}</p>
              )}
              <a
                href={hub.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800 hover:underline"
              >
                Visit website
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-4 text-sm leading-relaxed text-gray-700 sm:text-base">
              {hub.description.map((para) => (
                <p key={para.slice(0, 48)}>{para}</p>
              ))}
              <p className="text-xs text-gray-500">
                Organisation logos and linked materials are shown for demonstration and planning
                only — they do not imply endorsement.
              </p>
            </div>
          </div>
        </header>

        <div className="mt-6 space-y-6">{children}</div>

        {/*
          Contact block — same PartnerHubContactFooter used on LSO (address / phone /
          email / web). Do not replace with a simpler stub; preserve this UX for all orgs
          that have PARTNER_CONTACTS entries.
        */}
        {PARTNER_CONTACTS[hub.slug] && (
          <PartnerHubContactFooter orgId={hub.slug} className="mt-6" />
        )}
      </div>
    </div>
  );
}

interface PartnerHubComingSoonProps {
  hub: PartnerHubConfig;
}

/** Placeholder body for hubs without interactive content yet — same shell via PartnerHubPage. */
export function PartnerHubComingSoon({ hub }: PartnerHubComingSoonProps) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-8 text-center sm:px-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Coming soon</p>
      <h2 className="mt-2 text-lg font-semibold text-gray-900">
        Planning examples for {hub.shortName}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-600">
        Example activities and Add to CCDesigner for this organisation are not in the prototype
        yet. Visit the official website for current classroom resources.
      </p>
      <a
        href={hub.siteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
        style={{ color: hub.primaryColor }}
      >
        Visit {hub.shortName} website
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>
    </div>
  );
}

function isDarkHex(color: string): boolean {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return true;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  // Relative luminance threshold — light panels (e.g. ICC) keep original logo colours
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55;
}
