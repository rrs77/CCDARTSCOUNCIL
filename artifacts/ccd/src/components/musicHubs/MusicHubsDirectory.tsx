import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Music2, Search } from 'lucide-react';
import {
  getFeaturedMusicHub,
  getMusicHubsDirectory,
  musicHubPageHref,
  musicHubPublicHref,
  openMusicHubPath,
  searchMusicHubs,
  visibleChildren,
} from '../../config/musicHubsDirectory';
import type { MusicHubDirectoryNode } from '../../types/musicHubsDirectory';
import { openPartnerHub } from '../../config/partnerHubs';
import { isAuthorizedDemoMode } from '../../utils/demoMode';

/**
 * Main Music Hubs directory — featured EMS card + country accordions + search.
 * Keeps EMS / Tri-Borough accordion/card visual language from Partner Hubs.
 */
export function MusicHubsDirectory() {
  const directory = useMemo(() => getMusicHubsDirectory(), []);
  const featured = useMemo(() => getFeaturedMusicHub(), []);
  const demoDefaults = typeof window !== 'undefined' && isAuthorizedDemoMode();
  const [expandedCountry, setExpandedCountry] = useState<string | null>(
    demoDefaults ? 'england' : null,
  );
  const [expandedRegion, setExpandedRegion] = useState<string | null>(
    demoDefaults ? 'east-of-england' : null,
  );
  const [query, setQuery] = useState('');

  const searchHits = useMemo(() => searchMusicHubs(query), [query]);

  return (
    <section aria-labelledby="music-hubs-directory-heading" className="space-y-6">
      <div className="mb-1">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#002D24]/65">
          <Music2 className="h-3.5 w-3.5" aria-hidden />
          Partner Hubs
        </p>
        <h2
          id="music-hubs-directory-heading"
          className="mt-1 text-lg font-semibold tracking-tight text-[#002D24] sm:text-xl"
        >
          MUSIC HUBS
        </h2>
        <p className="mt-1 text-sm text-[#002D24]/70">
          Prototype directory of UK Music Hubs — East of England (Greater Essex) is the working
          example with EMS, district pages and sample resources. Other nations and regions are
          light placeholders for now.
        </p>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#002D24]/45"
          aria-hidden
        />
        <label htmlFor="music-hubs-search" className="sr-only">
          Search Music Hubs, services or areas
        </label>
        <input
          id="music-hubs-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Music Hubs, services or areas…"
          className="w-full rounded-xl border border-[#002D24]/20 bg-white py-2.5 pl-10 pr-3 text-sm text-[#002D24] placeholder:text-[#002D24]/45 focus:border-[#002D24]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#002D24]/30"
        />
        {query.trim() && (
          <ul
            className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[#002D24]/15 bg-white py-1 shadow-md"
            aria-label="Search results"
          >
            {searchHits.length === 0 ? (
              <li className="px-3 py-2 text-sm text-[#002D24]/60">No matches</li>
            ) : (
              searchHits.map((hit) => (
                <li key={hit.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col px-3 py-2 text-left hover:bg-[#E8F0EA]"
                    onClick={() => openMusicHubPath(hit.path)}
                  >
                    <span className="text-sm font-semibold text-[#002D24]">{hit.name}</span>
                    <span className="text-xs text-[#002D24]/55">{hit.path.replace(/\//g, ' · ')}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {featured && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#002D24]/65">
            Featured partner
          </p>
          <FeaturedMusicHubCard node={featured} />
        </div>
      )}

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#002D24]/65">
          Explore by area
        </p>
        <ul className="space-y-2" aria-label="UK countries">
          {directory.countries.map((country) => {
            const open = expandedCountry === country.id;
            const regions = visibleChildren(country);
            return (
              <li
                key={country.id}
                className={`overflow-hidden rounded-xl border transition-shadow ${
                  open
                    ? 'border-[#002D24]/35 bg-white shadow-md ring-1 ring-[#002D24]/15'
                    : 'border-[#002D24]/20 bg-white hover:border-[#002D24]/40'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setExpandedCountry(open ? null : country.id);
                    setExpandedRegion(null);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#002D24]/40 sm:gap-4 sm:px-4"
                  aria-expanded={open}
                  aria-controls={`country-${country.id}`}
                >
                  {open ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#002D24]/70" aria-hidden />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#002D24]/70" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[#002D24] sm:text-base">
                      {country.name}
                    </span>
                    {!open && country.description?.[0] && (
                      <span className="mt-0.5 block truncate text-xs text-[#002D24]/65">
                        {country.description[0]}
                      </span>
                    )}
                  </span>
                </button>

                {open && (
                  <div
                    id={`country-${country.id}`}
                    className="border-t border-[#002D24]/10 bg-gradient-to-b from-[#E8F0EA]/70 to-white px-4 py-4 sm:px-5"
                  >
                    {country.description?.[0] && (
                      <p className="mb-3 text-sm text-[#002D24]/75">{country.description[0]}</p>
                    )}
                    {regions.length === 0 ? (
                      <p className="text-sm text-[#002D24]/60">Hub page coming soon</p>
                    ) : (
                      <ul className="space-y-2" aria-label={`${country.name} areas`}>
                        {regions.map((region) => (
                          <RegionAccordionRow
                            key={region.id}
                            node={region}
                            expanded={expandedRegion === region.id}
                            onToggle={() =>
                              setExpandedRegion(expandedRegion === region.id ? null : region.id)
                            }
                          />
                        ))}
                      </ul>
                    )}
                    <div className="mt-3">
                      <a
                        href={musicHubPageHref(country.path)}
                        className="text-sm font-semibold text-[#002D24] hover:underline"
                      >
                        Open {country.name} directory →
                      </a>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function FeaturedMusicHubCard({ node }: { node: MusicHubDirectoryNode }) {
  const open = () => {
    if (node.partnerHubSlug) {
      openPartnerHub(node.partnerHubSlug);
      return;
    }
    openMusicHubPath(node.path);
  };

  return (
    <article className="overflow-hidden rounded-xl border border-[#002D24]/20 bg-white shadow-sm transition-shadow hover:border-[#002D24]/40 hover:shadow-md">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <span
          className="flex h-14 w-40 shrink-0 items-center justify-center rounded-lg px-2.5"
          style={{ backgroundColor: node.logoPanelColor || node.primaryColor || '#002D24' }}
        >
          {node.logoSrc && (
            <img
              src={node.logoSrc}
              alt=""
              className="h-9 w-auto max-w-[9rem] object-contain"
              loading="lazy"
              decoding="async"
            />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#002D24]/50">
            Featured partner
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-[#002D24] sm:text-lg">
            {node.name === 'Essex Music Service' ? 'Greater Essex Music Hub' : node.name}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-[#002D24]/75">
            {(node.description && node.description[0]) ||
              'Essex Music Service leads delivery for Greater Essex Music Hub across the county.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={open}
              className="inline-flex items-center justify-center rounded-lg bg-[#002D24] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95"
            >
              Open Hub →
            </button>
            {node.siteUrl && (
              <a
                href={node.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#002D24]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#002D24] hover:bg-[#E8F0EA]"
              >
                Visit Website
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function RegionAccordionRow({
  node,
  expanded,
  onToggle,
}: {
  node: MusicHubDirectoryNode;
  expanded: boolean;
  onToggle: () => void;
}) {
  const children = visibleChildren(node);
  const isLeafish = children.length === 0 || node.kind !== 'region';

  if (isLeafish && node.kind !== 'region') {
    return (
      <li>
        <button
          type="button"
          onClick={() => openMusicHubPath(node.path)}
          className="flex w-full items-center justify-between rounded-lg border border-[#002D24]/12 bg-white px-3 py-2.5 text-left text-sm font-semibold text-[#002D24] hover:bg-[#E8F0EA]"
        >
          {node.name}
          <ChevronRight className="h-4 w-4 text-[#002D24]/45" aria-hidden />
        </button>
      </li>
    );
  }

  return (
    <li className="overflow-hidden rounded-lg border border-[#002D24]/12 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#002D24]/30"
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-[#002D24]/60" aria-hidden />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-[#002D24]/60" aria-hidden />
        )}
        <span className="min-w-0 flex-1 text-sm font-semibold text-[#002D24]">{node.name}</span>
        {node.status === 'coming-soon' && (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#002D24]/45">
            Soon
          </span>
        )}
      </button>
      {expanded && (
        <div className="border-t border-[#002D24]/08 px-3 py-2">
          {children.length === 0 ? (
            <p className="py-1 text-xs text-[#002D24]/60">Hub page coming soon</p>
          ) : (
            <ul className="space-y-1.5">
              {children.map((child) => {
                // Music hubs with multiple services (e.g. Greater Essex) open the
                // hub page so siblings stay listed — do not skip straight to EMS.
                const openHref =
                  child.partnerHubSlug === 'ems' || child.partnerHubSlug === 'triborough'
                    ? `/${child.partnerHubSlug}`
                    : musicHubPublicHref(child.path);
                const nested = visibleChildren(child);
                return (
                  <li key={child.id}>
                    <a
                      href={openHref}
                      className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm text-[#002D24] hover:bg-[#E8F0EA]"
                    >
                      <span>
                        <span className="font-medium">{child.name}</span>
                        {child.status === 'coming-soon' && (
                          <span className="mt-0.5 block text-xs text-[#002D24]/55">
                            Hub page coming soon
                          </span>
                        )}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#002D24]/40" aria-hidden />
                    </a>
                    {nested.length > 0 && child.kind === 'music-hub' && (
                      <ul className="mb-1 ml-3 space-y-0.5 border-l border-[#002D24]/10 pl-2">
                        {nested.map((svc) => {
                          const svcHref =
                            svc.partnerHubSlug === 'ems' || svc.partnerHubSlug === 'triborough'
                              ? `/${svc.partnerHubSlug}`
                              : musicHubPublicHref(svc.path);
                          return (
                            <li key={svc.id}>
                              <a
                                href={svcHref}
                                className="block rounded-md px-2 py-1.5 text-xs font-medium text-[#002D24]/85 hover:bg-[#E8F0EA]"
                              >
                                {svc.name}
                                {svc.status === 'coming-soon' ? ' · soon' : ''}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <a
            href={musicHubPageHref(node.path)}
            className="mt-2 inline-block text-xs font-semibold text-[#002D24] hover:underline"
          >
            Open region →
          </a>
        </div>
      )}
    </li>
  );
}
