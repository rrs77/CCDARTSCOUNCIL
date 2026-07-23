import { useState } from 'react';
import { ChevronDown, ChevronRight, Handshake, Music2, ShoppingBag } from 'lucide-react';
import { PARTNER_HUBS, openPartnerHub, type PartnerHubConfig } from '../config/partnerHubs';
import { PaidBasketDrawer } from './partners/PaidBasketDrawer';

/** Music hubs section — EMS + Tri-Borough only (user-specified). */
const MUSIC_HUB_SLUGS = ['ems', 'triborough'] as const;

/**
 * Original Partner Hubs card strip — shared forest green for white wordmarks
 * on free organisation cards (ROH, LSO, National Theatre, Tate, etc.).
 */
const FREE_LOGO_STRIP_BG = '#002D24';

function hubBySlug(slug: string): PartnerHubConfig | undefined {
  return PARTNER_HUBS.find((h) => h.slug === slug);
}

/**
 * Free organisation card — original tall branded split design.
 */
function FreeOrgHubCard({ hub }: { hub: PartnerHubConfig }) {
  const invertClass = hub.logoInvert ? 'brightness-0 invert' : '';

  return (
    <li className="h-full">
      <button
        type="button"
        onClick={() => openPartnerHub(hub.slug)}
        className="flex h-full min-h-[11.5rem] w-full flex-col overflow-hidden rounded-xl border border-[#002D24]/15 bg-white text-center shadow-sm transition-all duration-150 ease-out hover:scale-[1.02] hover:border-[#002D24]/35 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#002D24]/40 active:scale-105"
        aria-label={`Open ${hub.displayName} Partner Hub`}
      >
        <div
          className="flex h-20 w-full shrink-0 items-center justify-center px-4"
          style={{ backgroundColor: FREE_LOGO_STRIP_BG }}
        >
          <img
            src={hub.logoSrc}
            alt=""
            className={`h-10 w-auto max-w-[11rem] object-contain sm:h-11 ${invertClass}`}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-1 px-4 py-4 text-center">
          <span className="text-sm font-medium leading-snug text-gray-800">{hub.displayName}</span>
          <span className="text-xs font-medium text-[#002D24]/70">Open hub →</span>
        </div>
      </button>
    </li>
  );
}

type AccordionVariant = 'music' | 'premium';

/**
 * Collapsed → expand rows (Music hubs + Premium partners).
 * No PAID badges — section headings carry that meaning.
 */
function PartnerHubAccordion({
  hubs,
  variant,
  listLabel,
}: {
  hubs: PartnerHubConfig[];
  variant: AccordionVariant;
  listLabel: string;
}) {
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const isPremium = variant === 'premium';

  return (
    <ul className="space-y-2" aria-label={listLabel}>
      {hubs.map((hub) => {
        const open = expandedSlug === hub.slug;
        const panel = hub.logoOnPlate
          ? '#FFFFFF'
          : hub.logoPanelColor || (isPremium ? '#FFFFFF' : FREE_LOGO_STRIP_BG);
        const invertLogo =
          !hub.logoOnPlate && hub.logoInvert
            ? 'brightness-0 invert'
            : !hub.logoOnPlate && !hub.logoInvert && panel === FREE_LOGO_STRIP_BG
              ? ''
              : hub.logoInvert
                ? 'brightness-0 invert'
                : '';
        const borderIdle = isPremium
          ? 'border-[#A3E635]/70 bg-white/90 hover:border-[#65A30D]'
          : 'border-[#002D24]/20 bg-white hover:border-[#002D24]/40';
        const borderOpen = isPremium
          ? 'border-[#65A30D] bg-white shadow-md ring-1 ring-[#A3E635]/50'
          : 'border-[#002D24]/35 bg-white shadow-md ring-1 ring-[#002D24]/15';
        const expandBg = isPremium
          ? 'border-[#A3E635]/40 bg-gradient-to-b from-[#F7FEE7]/80 to-white'
          : 'border-[#002D24]/10 bg-gradient-to-b from-[#E8F0EA]/70 to-white';
        const chevron = isPremium ? 'text-[#3F6212]' : 'text-[#002D24]/70';
        const focusRing = isPremium
          ? 'focus-visible:ring-[#65A30D]/50'
          : 'focus-visible:ring-[#002D24]/40';

        return (
          <li
            key={hub.slug}
            className={`overflow-hidden rounded-xl border transition-shadow ${
              open ? borderOpen : borderIdle
            }`}
          >
            <button
              type="button"
              onClick={() => setExpandedSlug(open ? null : hub.slug)}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left focus:outline-none focus-visible:ring-2 ${focusRing} sm:gap-4 sm:px-4`}
              aria-expanded={open}
              aria-controls={`${variant}-hub-${hub.slug}`}
            >
              {open ? (
                <ChevronDown className={`h-4 w-4 shrink-0 ${chevron}`} aria-hidden />
              ) : (
                <ChevronRight className={`h-4 w-4 shrink-0 ${chevron}`} aria-hidden />
              )}
              <span
                className={`flex h-12 w-36 shrink-0 items-center justify-center rounded-lg px-2.5 sm:w-40 ${
                  hub.logoOnPlate || panel === '#FFFFFF' ? 'border border-[#002D24]/10' : ''
                }`}
                style={{ backgroundColor: panel }}
              >
                <img
                  src={hub.logoSrc}
                  alt=""
                  className={`h-8 w-auto max-h-9 max-w-[8.5rem] object-contain object-center sm:h-9 sm:max-w-[9.5rem] ${invertLogo}`}
                  loading="lazy"
                  decoding="async"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[#002D24] sm:text-base">
                  {hub.displayName}
                </span>
                {!open && hub.tagline && (
                  <span className="mt-0.5 block truncate text-xs text-[#002D24]/65">{hub.tagline}</span>
                )}
              </span>
            </button>

            {open && (
              <div
                id={`${variant}-hub-${hub.slug}`}
                className={`border-t px-4 py-4 sm:px-5 ${expandBg}`}
              >
                {hub.tagline && (
                  <p
                    className={`text-sm font-medium ${
                      isPremium ? 'text-[#3F6212]' : 'text-[#002D24]/80'
                    }`}
                  >
                    {hub.tagline}
                  </p>
                )}
                <p className="mt-1.5 text-sm leading-relaxed text-[#002D24]/75">
                  {hub.description[0]}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openPartnerHub(hub.slug)}
                    className="inline-flex items-center justify-center rounded-lg bg-[#002D24] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95"
                  >
                    Open hub →
                  </button>
                  <a
                    href={hub.siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-lg border border-[#002D24]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#002D24] hover:bg-[#E8F0EA]"
                  >
                    Visit website
                  </a>
                </div>
                {isPremium && (
                  <p className="mt-3 text-xs text-[#002D24]/55">
                    Add to basket and Add to CCDesigner are inside the hub on each paid pack’s
                    details.
                  </p>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Partner Hubs tab (exact order):
 * 1. Music hubs — EMS + Tri-Borough (collapsed)
 * 2. Premium partners — WTD + iCompose (collapsed)
 * 3. Organisations — free resources (4-up branded cards)
 */
export function OurPartners() {
  const musicHubs = MUSIC_HUB_SLUGS.map(hubBySlug).filter(Boolean) as PartnerHubConfig[];
  const paidHubs = PARTNER_HUBS.filter((h) => h.paid);
  const musicSlugSet = new Set<string>(MUSIC_HUB_SLUGS);
  const freeOrgs = PARTNER_HUBS.filter((h) => !h.paid && !musicSlugSet.has(h.slug));

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 rounded-lg border border-[#002D24]/10 bg-[var(--ccd-sage-mist,#E8F0EA)] px-3 py-2.5 sm:gap-3.5 sm:px-4 sm:py-2.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#002D24]/75"
          style={{ backgroundColor: 'rgba(0, 45, 36, 0.06)' }}
        >
          <Handshake className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight text-[#002D24] sm:text-lg">
            Partner Hubs
          </h2>
          <p className="text-sm leading-snug text-[#002D24]/70">
            Cultural organisations whose resources can enrich classroom music and the arts. Select a
            partner to open their hub page.
          </p>
        </div>
      </div>

      {musicHubs.length > 0 && (
        <section aria-labelledby="music-hubs-heading">
          <div className="mb-3">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#002D24]/65">
              <Music2 className="h-3.5 w-3.5" aria-hidden />
              Music hubs
            </p>
            <h3
              id="music-hubs-heading"
              className="mt-1 text-lg font-semibold tracking-tight text-[#002D24] sm:text-xl"
            >
              Local music hubs
            </h3>
            <p className="mt-1 text-sm text-[#002D24]/70">
              Expand a hub for details, then open its page for school services and planning links.
            </p>
          </div>
          <PartnerHubAccordion
            hubs={musicHubs}
            variant="music"
            listLabel="Music hubs"
          />
        </section>
      )}

      {paidHubs.length > 0 && (
        <section
          className="rounded-2xl border border-[#A3E635]/60 bg-gradient-to-br from-[#F7FEE7] via-white to-[#E8F0EA] px-4 py-5 sm:px-5 sm:py-6"
          aria-labelledby="premium-partners-heading"
        >
          <div className="mb-3">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3F6212]">
              <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
              Premium partners
            </p>
            <h3
              id="premium-partners-heading"
              className="mt-1 text-lg font-semibold tracking-tight text-[#002D24] sm:text-xl"
            >
              We Teach Drama &amp; iCompose
            </h3>
            <p className="mt-1 text-sm text-[#002D24]/70">
              Expand a row for details, then open the hub for paid pack Add to basket (demo).
            </p>
          </div>
          <PartnerHubAccordion
            hubs={paidHubs}
            variant="premium"
            listLabel="Premium partner hubs"
          />
        </section>
      )}

      {freeOrgs.length > 0 && (
        <section aria-labelledby="free-orgs-heading">
          <div className="mb-3">
            <h3
              id="free-orgs-heading"
              className="text-lg font-semibold tracking-tight text-[#002D24] sm:text-xl"
            >
              Organisations — free resources
            </h3>
            <p className="mt-1 text-sm text-[#002D24]/70">
              National arts organisations with free classroom and learning resources.
            </p>
          </div>
          <ul
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
            aria-label="Organisations with free resources"
          >
            {freeOrgs.map((hub) => (
              <FreeOrgHubCard key={hub.slug} hub={hub} />
            ))}
          </ul>
        </section>
      )}

      <PaidBasketDrawer />
    </div>
  );
}
