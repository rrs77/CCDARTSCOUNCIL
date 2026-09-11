/**
 * Resource Zone hub layout — OmniMusic-style template:
 * skip/a11y bar → logo + breadcrumb → full-bleed hero → dark Resource Zone + free downloads.
 * Used for music-hub partners with free downloadable classroom resources.
 */

import { ArrowLeft, Download, ExternalLink, Menu } from 'lucide-react';
import { backToCCDesigner, type PartnerHubConfig } from '../../config/partnerHubs';

export type ResourceZoneItem = {
  title: string;
  description: string;
  href: string;
  /** Download vs open external hub */
  action?: 'download' | 'open';
  kind?: string;
};

export type ResourceZoneContent = {
  zoneHeading: string;
  zoneIntro: string;
  heroSrc: string;
  heroAlt: string;
  resourcesHeading?: string;
  hubLinksHeading?: string;
  hubLinks?: ResourceZoneItem[];
  downloads: ResourceZoneItem[];
  officialResourcesUrl: string;
};

interface ResourceZoneHubPageProps {
  hub: PartnerHubConfig;
  content: ResourceZoneContent;
}

export function ResourceZoneHubPage({ hub, content }: ResourceZoneHubPageProps) {
  const band = hub.primaryColor;
  const accent = hub.accentColor;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Compact accessibility strip */}
      <div
        className="border-b border-white/15 px-3 py-2 text-[11px] text-white sm:px-4"
        style={{ backgroundColor: band }}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <nav aria-label="Skip links" className="flex flex-wrap gap-x-2 gap-y-1">
            <a href="#resource-zone-content" className="underline-offset-2 hover:underline">
              Skip to Content
            </a>
            <span aria-hidden className="opacity-50">
              |
            </span>
            <a href="#resource-zone-nav" className="underline-offset-2 hover:underline">
              Skip to Navigation
            </a>
            <span aria-hidden className="opacity-50">
              |
            </span>
            <a href="#resource-zone-breadcrumb" className="underline-offset-2 hover:underline">
              Skip to Breadcrumb
            </a>
          </nav>
          <p className="text-white/75">Partner Hub · /{hub.slug}</p>
        </div>
      </div>

      {/* Logo / nav bar */}
      <header
        id="resource-zone-nav"
        className="border-b border-gray-200 bg-white"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => backToCCDesigner('our-partners')}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ['--tw-ring-color' as string]: accent }}
              aria-label="Back to CCDesigner Partner Hubs"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              CCDesigner
            </button>
            <a
              href={hub.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 items-center gap-2"
            >
              <img
                src={hub.logoSrc}
                alt=""
                className="h-10 w-auto max-w-[9rem] object-contain sm:h-11"
                loading="eager"
                decoding="async"
              />
              <span className="sr-only">{hub.displayName}</span>
            </a>
          </div>
          <a
            href={content.officialResourcesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: band }}
            aria-label={`${hub.shortName} menu — open official resources`}
          >
            <Menu className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Resources</span>
          </a>
        </div>
      </header>

      {/* Breadcrumb */}
      <nav
        id="resource-zone-breadcrumb"
        aria-label="Breadcrumb"
        className="border-b border-gray-100 bg-white"
      >
        <ol className="mx-auto flex max-w-6xl flex-wrap items-center gap-1.5 px-4 py-2.5 text-sm text-gray-600 sm:px-6">
          <li>
            <button
              type="button"
              onClick={() => backToCCDesigner('our-partners')}
              className="font-medium hover:underline"
            >
              Partner Hubs
            </button>
          </li>
          <li aria-hidden className="text-gray-400">
            ›
          </li>
          <li>
            <a
              href={`/${hub.slug}`}
              className="font-medium hover:underline"
              style={{ color: band }}
            >
              {hub.shortName}
            </a>
          </li>
          <li aria-hidden className="text-gray-400">
            ›
          </li>
          <li className="font-semibold text-gray-900" aria-current="page">
            Resources
          </li>
        </ol>
      </nav>

      {/* Full-bleed hero */}
      <section className="relative w-full overflow-hidden bg-gray-900" aria-label="Hero">
        <img
          src={content.heroSrc}
          alt={content.heroAlt}
          className="block h-[min(52vw,420px)] w-full object-cover object-center sm:h-[min(46vw,480px)]"
          loading="eager"
          decoding="async"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${band}55 0%, transparent 55%)`,
          }}
          aria-hidden
        />
        {/* Lime OM-style mark overlay (template accent) */}
        <svg
          className="pointer-events-none absolute -right-6 bottom-[-8%] h-[70%] w-auto opacity-90 sm:right-4 sm:bottom-[-4%]"
          viewBox="0 0 200 220"
          aria-hidden
        >
          <path
            d="M40 170c20-70 50-110 80-110 18 0 28 14 28 34 0 40-28 70-55 92"
            fill="none"
            stroke={accent}
            strokeWidth="14"
            strokeLinecap="round"
          />
          <circle cx="118" cy="78" r="28" fill="none" stroke={accent} strokeWidth="12" />
          <path
            d="M30 188c35-8 70-8 105 6 18 8 32 8 45-2"
            fill="none"
            stroke={accent}
            strokeWidth="10"
            strokeLinecap="round"
          />
        </svg>
      </section>

      {/* Dark Resource Zone */}
      <section
        id="resource-zone-content"
        className="px-4 py-10 text-white sm:px-6 sm:py-14"
        style={{ backgroundColor: band }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {content.zoneHeading}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-left text-base leading-relaxed text-white/90 sm:text-center sm:text-lg">
            {content.zoneIntro}
          </p>
        </div>

        {content.hubLinks && content.hubLinks.length > 0 ? (
          <div className="mx-auto mt-10 max-w-3xl">
            <h2 className="text-center text-lg font-semibold text-white/95">
              {content.hubLinksHeading ?? 'Explore our resource hubs'}
            </h2>
            <ul className="mt-5 space-y-4">
              {content.hubLinks.map((item) => (
                <li
                  key={item.href + item.title}
                  className="rounded-2xl border border-white/15 bg-white/5 p-5 text-left backdrop-blur-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      {item.kind ? (
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
                          {item.kind}
                        </p>
                      ) : null}
                      <h3 className="mt-1 text-xl font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/85">
                        {item.description}
                      </p>
                    </div>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-900"
                      style={{ backgroundColor: accent }}
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden />
                      Follow link
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mx-auto mt-12 max-w-3xl">
          <h2 className="text-center text-lg font-semibold text-white/95">
            {content.resourcesHeading ?? 'Download our free resources'}
          </h2>
          <ul className="mt-5 space-y-4">
            {content.downloads.map((item) => (
              <li
                key={item.href + item.title}
                className="rounded-2xl border border-white/15 bg-white/5 p-5 text-left"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    {item.kind ? (
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
                        {item.kind}
                      </p>
                    ) : null}
                    <h3 className="mt-1 text-xl font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/85">
                      {item.description}
                    </p>
                  </div>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
                  >
                    {item.action === 'open' ? (
                      <ExternalLink className="h-4 w-4" aria-hidden />
                    ) : (
                      <Download className="h-4 w-4" aria-hidden />
                    )}
                    {item.action === 'open' ? 'Open' : 'Download'}
                  </a>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-center text-sm text-white/70">
            Official materials stay on{' '}
            <a
              href={hub.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-2"
              style={{ color: accent }}
            >
              {hub.siteUrl.replace(/^https?:\/\//, '')}
            </a>
            . Organisation logos are for demonstration of Partner Hubs — not endorsements.
          </p>
        </div>
      </section>
    </div>
  );
}
