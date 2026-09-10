/**
 * Interactive Essex districts map — ONS LAD boundaries as SVG paths.
 * Hover highlight, click → district path, keyboard + aria, list fallback for mobile.
 */

import { useId, useState } from 'react';
import type { EssexDistrictSlug } from '../../config/musicHubsDirectory';
import { ESSEX_DISTRICT_SLUGS } from '../../config/musicHubsDirectory';
import {
  ESSEX_DISTRICT_PATHS,
  ESSEX_MAP_VIEWBOX,
  type EssexDistrictPath,
} from './essexDistrictPaths';

export type EssexDistrictMeta = EssexDistrictPath;

/** @deprecated Prefer ESSEX_DISTRICT_PATHS — kept as alias for callers. */
export const ESSEX_DISTRICTS = ESSEX_DISTRICT_PATHS;

const NAME_BY_SLUG = Object.fromEntries(
  ESSEX_DISTRICT_PATHS.map((d) => [d.slug, d.name]),
) as Record<EssexDistrictSlug, string>;

function shortLabel(name: string): string {
  if (name === 'Epping Forest') return 'Epping F.';
  if (name === 'Castle Point') return 'Castle Pt';
  return name;
}

export function EssexDistrictMap({
  onSelect,
  selectedSlug,
  basePath = 'england/east-of-england/greater-essex/essex-music-service',
}: {
  onSelect: (slug: EssexDistrictSlug, path: string) => void;
  selectedSlug?: string | null;
  basePath?: string;
}) {
  const labelId = useId();
  const [hovered, setHovered] = useState<string | null>(null);

  const select = (slug: EssexDistrictSlug) => {
    onSelect(slug, `${basePath}/${slug}`);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-[#002D24]/15 bg-white p-3 sm:p-4">
        <p id={labelId} className="mb-2 text-sm font-medium text-[#002D24]">
          In your area — choose a district
        </p>
        <svg
          viewBox={ESSEX_MAP_VIEWBOX}
          className="mx-auto h-auto w-full max-w-2xl touch-manipulation"
          role="img"
          aria-labelledby={labelId}
        >
          <title>Interactive map of Essex districts</title>
          <desc>
            Boundaries from ONS Local Authority Districts December 2024 (BGC, simplified), Open
            Government Licence.
          </desc>
          <rect width="720" height="560" fill="#E8F0EA" rx="8" />
          {ESSEX_DISTRICT_PATHS.map((district) => {
            const active = hovered === district.slug || selectedSlug === district.slug;
            return (
              <path
                key={district.slug}
                id={district.slug}
                data-district={district.slug}
                d={district.d}
                tabIndex={0}
                role="button"
                aria-label={`${district.name} district`}
                fill={active ? '#330968' : '#FFFFFF'}
                stroke="#002D24"
                strokeWidth={active ? 2.4 : 1.3}
                strokeLinejoin="round"
                className="cursor-pointer outline-none transition-[fill,stroke-width] duration-150 focus-visible:stroke-[#7a00df] focus-visible:stroke-[3]"
                onMouseEnter={() => setHovered(district.slug)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(district.slug)}
                onBlur={() => setHovered(null)}
                onClick={() => select(district.slug)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    select(district.slug);
                  }
                }}
              />
            );
          })}
          {ESSEX_DISTRICT_PATHS.map((district) => {
            const active = hovered === district.slug || selectedSlug === district.slug;
            const fontSize = district.slug === 'harlow' || district.slug === 'castle-point' ? 9 : 11;
            return (
              <text
                key={`${district.slug}-label`}
                x={district.labelX}
                y={district.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none select-none"
                fill={active ? '#FFFFFF' : '#002D24'}
                fontSize={fontSize}
                fontWeight="600"
              >
                {shortLabel(district.name)}
              </text>
            );
          })}
        </svg>
        <p className="mt-2 text-[10px] leading-snug text-[#002D24]/55">
          District boundaries: ONS Local Authority Districts (December 2024) BGC · Contains OS data ©
          Crown copyright and database right · OGL v3.0
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#002D24]/65">
          Choose an area
        </p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4" aria-label="Essex districts">
          {ESSEX_DISTRICT_SLUGS.map((slug) => (
            <li key={slug}>
              <button
                type="button"
                onClick={() => select(slug)}
                className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#330968]/40 ${
                  selectedSlug === slug
                    ? 'border-[#330968] bg-[#330968]/10 text-[#330968]'
                    : 'border-[#002D24]/15 bg-white text-[#002D24] hover:border-[#002D24]/35 hover:bg-[#E8F0EA]'
                }`}
              >
                {NAME_BY_SLUG[slug]}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
