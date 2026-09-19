import { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Handshake, Loader2, PlusCircle, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { PARTNER_HUBS, openPartnerHub, type PartnerHubConfig } from '../config/partnerHubs';
import {
  formatPricePence,
  getPaidProductsForPartner,
  type PaidPartnerSlug,
} from '../config/paidPartnerProducts';
import {
  canSeedPaidProduct,
  seedPaidPartnerProduct,
} from '../utils/seedPaidPartnerProduct';
import { AddToBasketButton } from './partners/AddToBasketButton';
import { PaidBasketDrawer } from './partners/PaidBasketDrawer';
import { MusicHubsDirectory } from './musicHubs/MusicHubsDirectory';
import { MusicHubAdminPanel } from './musicHubs/MusicHubAdminPanel';
import { useAuth } from '../hooks/useAuth';

const AZ_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function orgSortLetter(hub: PartnerHubConfig): string {
  const ch = hub.displayName.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(ch) ? ch : '#';
}

function sortFreeOrgs(hubs: PartnerHubConfig[]): PartnerHubConfig[] {
  return [...hubs].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, 'en', { sensitivity: 'base' }),
  );
}

/** Minimal sticky A–Z rail — only letters with orgs are active. */
function OrgsAzBrowser({
  availableLetters,
  activeLetter,
  onSelect,
}: {
  availableLetters: Set<string>;
  activeLetter: string | null;
  onSelect: (letter: string) => void;
}) {
  return (
    <nav
      aria-label="Organisations A to Z"
      className="sticky top-24 z-10 hidden w-8 shrink-0 self-start lg:block"
    >
      <div className="flex flex-col items-center gap-0.5 rounded-full border border-[#002D24]/10 bg-white/90 py-2 shadow-[0_1px_0_rgba(0,45,36,0.04)] backdrop-blur-sm">
        {AZ_LETTERS.map((letter) => {
          const hasOrgs = availableLetters.has(letter);
          const isActive = activeLetter === letter;
          return (
            <button
              key={letter}
              type="button"
              disabled={!hasOrgs}
              onClick={() => onSelect(letter)}
              aria-label={
                hasOrgs ? `Jump to organisations starting with ${letter}` : `${letter} — none`
              }
              aria-current={isActive ? 'true' : undefined}
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold leading-none tracking-wide transition-colors ${
                !hasOrgs
                  ? 'cursor-default text-[#002D24]/20'
                  : isActive
                    ? 'bg-[#002D24] text-white'
                    : 'text-[#002D24]/55 hover:bg-[#002D24]/08 hover:text-[#002D24]'
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** Music hubs section — UK directory (EMS featured; Tri-Borough under London). */
const MUSIC_HUB_LEGACY_SLUGS = ['ems', 'triborough'] as const;

/**
 * Original Partner Hubs card strip — shared forest green for white wordmarks
 * on free organisation cards (ROH, LSO, National Theatre, Tate, etc.).
 */
const FREE_LOGO_STRIP_BG = '#002D24';

const PREMIUM_SLUGS = new Set(['weteachdrama', 'icompose', 'dramaresource']);

/** Demo packs shown when a premium partner row is expanded. */
function PremiumPartnerResources({ slug }: { slug: string }) {
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  if (!PREMIUM_SLUGS.has(slug)) return null;
  const products = getPaidProductsForPartner(slug as PaidPartnerSlug);
  if (products.length === 0) return null;

  const handleAddToApp = async (productId: string) => {
    if (!canSeedPaidProduct(productId)) {
      openPartnerHub(slug);
      return;
    }
    setAddingId(productId);
    try {
      const result = await seedPaidPartnerProduct(productId, { force: true });
      if (!result) {
        toast.error('No prototype seed for this pack yet — open the hub for details.');
        return;
      }
      if (result.skipped) {
        toast.success('Already in your local library');
      } else {
        toast.success(
          `Added ${result.lessons ?? 1} lesson · ${result.activities ?? 0} activities to CCDesigner`,
        );
      }
      setAddedIds((prev) => ({ ...prev, [productId]: true }));
      try {
        sessionStorage.setItem(
          'ccd-open-after-partner',
          JSON.stringify({ sheetId: result.sheetId, tab: 'lesson-library' }),
        );
      } catch {
        /* ignore */
      }
    } catch (e) {
      console.error(e);
      toast.error('Could not add pack to CCDesigner. Please try again.');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="mt-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3F6212]">
        Demo packs &amp; resources
      </p>
      <ul className="mt-2 space-y-2" aria-label={`${slug} demo packs`}>
        {products.map((product) => (
          <li
            key={product.id}
            className="flex flex-col gap-2 rounded-lg border border-[#A3E635]/50 bg-white/95 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#002D24]">{product.title}</p>
              <p className="mt-0.5 text-xs text-[#002D24]/65">
                {product.meta ? `${product.meta} · ` : ''}
                {formatPricePence(product.pricePence)}
                <span className="text-[#002D24]/45"> · demo only</span>
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <AddToBasketButton productId={product.id} variant="secondary" />
              {canSeedPaidProduct(product.id) && (
                <button
                  type="button"
                  onClick={() => void handleAddToApp(product.id)}
                  disabled={addingId !== null}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#002D24]/25 bg-white px-3 py-2 text-xs font-semibold text-[#002D24] hover:bg-[#E8F0EA] disabled:opacity-60"
                >
                  {addingId === product.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : addedIds[product.id] ? (
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <PlusCircle className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {addedIds[product.id] ? 'Added' : 'Add to CCDesigner'}
                </button>
              )}
              <button
                type="button"
                onClick={() => openPartnerHub(slug)}
                className="inline-flex items-center justify-center rounded-lg border border-[#002D24]/20 bg-[#F7FEE7] px-3 py-2 text-xs font-semibold text-[#002D24] hover:bg-[#E8F0EA]"
              >
                View in hub
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Free organisation card — original tall branded split design.
 * Prefer `logoSrcOnDark` (white lockup) directly on the green strip like ROH / LSO.
 * Plate logos only when there is no dark-strip asset (e.g. full-colour WTD-style marks).
 */
function FreeOrgHubCard({ hub }: { hub: PartnerHubConfig }) {
  const darkStripLogo = hub.logoSrcOnDark;
  const usePlate = !darkStripLogo && hub.logoOnPlate;
  const invertClass =
    !darkStripLogo && !hub.logoOnPlate && hub.logoInvert ? 'brightness-0 invert' : '';
  const plateBg = usePlate ? hub.logoPanelColor || '#FFFFFF' : undefined;
  const cardLogoSrc = darkStripLogo || hub.logoSrc;

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
          {usePlate ? (
            <span
              className="flex h-12 w-full max-w-[11rem] items-center justify-center rounded-lg border border-white/20 px-2.5 sm:h-[3.25rem]"
              style={{ backgroundColor: plateBg }}
            >
              <img
                src={cardLogoSrc}
                alt=""
                className="h-8 w-auto max-h-9 max-w-[9.5rem] object-contain object-center sm:h-9 sm:max-w-[10rem]"
                loading="lazy"
                decoding="async"
              />
            </span>
          ) : (
            <img
              src={cardLogoSrc}
              alt=""
              className={`h-10 w-auto max-w-[11rem] object-contain sm:h-11 ${invertClass}`}
              loading="lazy"
              decoding="async"
            />
          )}
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

                {isPremium && (
                  <PremiumPartnerResources slug={hub.slug} />
                )}

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
                    Open the hub for full pack details, mock PDFs and Add to CCDesigner.
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
 * 1. Music hubs — UK directory (featured EMS + explore by country)
 * 2. Premium partners — WTD / iCompose / Drama Resource (collapsed)
 * 3. Organisations — free resources A–Z (branded cards + right-hand letter rail)
 */
export function OurPartners() {
  const { user } = useAuth();
  const paidHubs = PARTNER_HUBS.filter((h) => h.paid);
  const musicSlugSet = new Set<string>(MUSIC_HUB_LEGACY_SLUGS);
  const freeOrgs = sortFreeOrgs(
    PARTNER_HUBS.filter((h) => !h.paid && !musicSlugSet.has(h.slug)),
  );
  const freeOrgKey = freeOrgs.map((h) => h.slug).join('|');
  const availableLetters = new Set(freeOrgs.map(orgSortLetter).filter((l) => l !== '#'));
  const [activeLetter, setActiveLetter] = useState<string | null>(
    () => freeOrgs[0] ? orgSortLetter(freeOrgs[0]) : null,
  );
  const showMusicAdmin =
    user?.role === 'admin' ||
    user?.role === 'superuser' ||
    user?.role === 'super_admin';

  useEffect(() => {
    if (typeof window === 'undefined' || freeOrgs.length === 0) return;

    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>('[data-org-letter-index]'),
    );
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const letter = visible[0]?.target.getAttribute('data-org-letter-index');
        if (letter) setActiveLetter(letter);
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
    // freeOrgKey tracks membership; freeOrgs is rebuilt each render from static config.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable slug key
  }, [freeOrgKey]);

  const scrollToLetter = (letter: string) => {
    setActiveLetter(letter);
    const el = document.querySelector(`[data-org-letter-index="${letter}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /** Group sorted orgs under first-letter markers for the grid. */
  const freeOrgRows: Array<
    | { type: 'letter'; letter: string }
    | { type: 'hub'; hub: PartnerHubConfig }
  > = [];
  let lastLetter = '';
  for (const hub of freeOrgs) {
    const letter = orgSortLetter(hub);
    if (letter !== lastLetter) {
      freeOrgRows.push({ type: 'letter', letter });
      lastLetter = letter;
    }
    freeOrgRows.push({ type: 'hub', hub });
  }

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

      <MusicHubsDirectory />

      {showMusicAdmin && (
        <MusicHubAdminPanel organisationFilter={null} />
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
              We Teach Drama, iCompose &amp; Drama Resource
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
          <div className="mb-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h3
                id="free-orgs-heading"
                className="text-lg font-semibold tracking-tight text-[#002D24] sm:text-xl"
              >
                Organisations — free resources
              </h3>
              <p className="mt-1 text-sm text-[#002D24]/70">
                National arts organisations with free classroom and learning resources — listed A–Z.
              </p>
            </div>
            {/* Compact mobile A–Z strip (desktop uses the right rail) */}
            <div
              className="flex max-w-[55%] flex-wrap justify-end gap-0.5 lg:hidden"
              aria-label="Jump to letter"
            >
              {[...availableLetters].sort().map((letter) => (
                <button
                  key={letter}
                  type="button"
                  onClick={() => scrollToLetter(letter)}
                  className={`flex h-6 min-w-[1.35rem] items-center justify-center rounded px-1 text-[11px] font-semibold transition-colors ${
                    activeLetter === letter
                      ? 'bg-[#002D24] text-white'
                      : 'text-[#002D24]/60 hover:bg-[#002D24]/08 hover:text-[#002D24]'
                  }`}
                  aria-label={`Jump to ${letter}`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3 sm:gap-4">
            <ul
              className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              aria-label="Organisations with free resources"
            >
              {freeOrgRows.map((row) =>
                row.type === 'letter' ? (
                  <li
                    key={`letter-${row.letter}`}
                    data-org-letter-index={row.letter}
                    className="col-span-full scroll-mt-24 border-b border-[#002D24]/10 pb-1.5 pt-1 first:pt-0"
                  >
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#002D24]/45">
                      {row.letter}
                    </span>
                  </li>
                ) : (
                  <FreeOrgHubCard key={row.hub.slug} hub={row.hub} />
                ),
              )}
            </ul>

            <OrgsAzBrowser
              availableLetters={availableLetters}
              activeLetter={activeLetter}
              onSelect={scrollToLetter}
            />
          </div>
        </section>
      )}

      <PaidBasketDrawer />
    </div>
  );
}
