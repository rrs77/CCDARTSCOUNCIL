import React from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { PartnerHubConfig } from '../../config/partnerHubs';
import { backToCCDesigner } from '../../config/partnerHubs';
import { PartnerHubContactFooter } from './PartnerHubContactFooter';
import { PARTNER_CONTACTS } from '../../config/partnerContacts';
import { PaidBasketButton, PaidBasketDrawer } from './PaidBasketDrawer';

interface PartnerHubPageProps {
  hub: PartnerHubConfig;
  children: React.ReactNode;
}

/**
 * Shared Partner Hub chrome — wide, brand-led, LSO-style structure:
 *   back → full-width brand band (logo + name) → intro strip → children → contact
 *
 * Each org keeps its own palette + logo; layout is shared across all hubs.
 */
export function PartnerHubPage({ hub, children }: PartnerHubPageProps) {
  /** Brand band uses org colour; plate logos (WTD/iCompose) sit on a white tile inside. */
  const bandColor = hub.logoOnPlate
    ? hub.primaryColor
    : hub.logoPanelColor || hub.primaryColor;
  const logoPlateBg = hub.logoOnPlate ? '#FFFFFF' : 'rgba(0,0,0,0.25)';
  const invertLogo =
    !hub.logoOnPlate &&
    (hub.logoInvert || isDarkHex(bandColor)) &&
    hub.logoSrc.endsWith('.svg');

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(180deg, ${bandColor}0d 0%, #f3f4f6 28%, #f9fafb 100%)`,
      }}
    >
      {/* Full-width brand band */}
      <div
        className="relative overflow-hidden border-b border-black/10"
        style={{
          background: `linear-gradient(115deg, ${bandColor} 0%, ${bandColor} 58%, ${hub.accentColor}55 100%)`,
        }}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => backToCCDesigner('our-partners')}
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label="Back to CCDesigner"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to CCDesigner
            </button>
            {hub.paid && <PaidBasketButton />}
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <div
                className={`flex h-16 w-52 shrink-0 items-center justify-center rounded-xl px-3 sm:h-[4.5rem] sm:w-56 ${
                  hub.logoOnPlate ? 'border border-black/10 shadow-sm' : ''
                }`}
                style={{ backgroundColor: logoPlateBg }}
              >
                <img
                  src={hub.logoSrc}
                  alt={`${hub.displayName} logo`}
                  className={`h-10 w-auto max-w-full object-contain sm:h-11 ${
                    invertLogo ? 'brightness-0 invert' : ''
                  }`}
                  loading="eager"
                  decoding="async"
                />
              </div>
              <div className="min-w-0 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                  {hub.paid ? 'Paid Partner Hub' : 'Partner Hub'} · /{hub.slug}
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                  {hub.displayName}
                </h1>
                {hub.tagline && (
                  <p className="mt-1.5 text-sm text-white/85 sm:text-base">{hub.tagline}</p>
                )}
                {hub.paid && (
                  <p className="mt-2 inline-flex rounded bg-[#A3E635] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#002D24]">
                    Paid resources · demo basket
                  </p>
                )}
              </div>
            </div>

            <a
              href={hub.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-opacity hover:opacity-95 sm:self-end"
              style={{ color: hub.primaryColor }}
            >
              Visit website
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="rounded-2xl border border-gray-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:p-6 lg:p-7">
          <div className="max-w-3xl space-y-2.5 text-sm leading-relaxed text-gray-700 sm:text-[0.95rem]">
            {hub.description.slice(0, 2).map((para) => (
              <p key={para.slice(0, 48)}>{para}</p>
            ))}
            <p className="text-xs text-gray-500">
              Organisation logos and linked materials are shown for demonstration and planning only —
              they do not imply endorsement.
              {hub.paid
                ? ' Add to basket is a local demo — no payment is processed in this prototype.'
                : ''}
            </p>
          </div>
        </section>

        <div className="mt-6 space-y-8 sm:mt-8">{children}</div>

        {PARTNER_CONTACTS[hub.slug] && (
          <PartnerHubContactFooter orgId={hub.slug} className="mt-8" />
        )}
      </div>

      {hub.paid && <PaidBasketDrawer />}
    </div>
  );
}

interface PartnerHubComingSoonProps {
  hub: PartnerHubConfig;
}

/** Placeholder body for hubs without interactive content yet — same shell via PartnerHubPage. */
export function PartnerHubComingSoon({ hub }: PartnerHubComingSoonProps) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center sm:px-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Coming soon</p>
      <h2 className="mt-2 text-xl font-semibold text-gray-900">
        Planning examples for {hub.shortName}
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-gray-600">
        Example activities and Add to CCDesigner for this organisation are not in the prototype yet.
        Visit the official website for current classroom resources.
      </p>
      <a
        href={hub.siteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
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
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55;
}
