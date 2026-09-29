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
  if (name === 'Epping Forest') return 'Epping Forest';
  if (name === 'Castle Point') return 'Castle Point';
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
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-[#002D24]/15 bg-white p-3 sm:p-5">
        <p id={labelId} className="mb-3 text-base font-semibold text-[#002D24]">
          In your area — choose a district
        </p>
        <p className="mb-4 text-sm leading-relaxed text-[#002D24]/70">
          Labels are readable on the map; use the district buttons below if you prefer a list.
          Resources open on the district page you select.
        </p>
        <svg
          viewBox={ESSEX_MAP_VIEWBOX}
          className="mx-auto h-auto w-full max-w-3xl touch-manipulation"
          role="img"
          aria-labelledby={labelId}
        >
          <title>Interactive map of Essex districts</title>
          <desc>
            Boundaries from ONS Local Authority Districts December 2024 (BGC, simplified), Open
            Government Licence. Click a district to open its hub page.
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
                aria-label={`${district.name} district — open resources`}
                fill={active ? '#330968' : '#FFFFFF'}
                stroke="#002D24"
                strokeWidth={active ? 2.6 : 1.5}
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
            const compact =
              district.slug === 'harlow' ||
              district.slug === 'castle-point' ||
              district.slug === 'epping-forest';
            const fontSize = compact ? 11 : 13;
            const label = shortLabel(district.name);
            return (
              <g key={`${district.slug}-label`} className="pointer-events-none select-none">
                {/* Halo for contrast on both white and purple fills */}
                <text
                  x={district.labelX}
                  y={district.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={active ? 'rgba(26,10,60,0.55)' : 'rgba(255,255,255,0.95)'}
                  fontSize={fontSize}
                  fontWeight="700"
                  stroke={active ? 'rgba(26,10,60,0.35)' : 'rgba(255,255,255,0.9)'}
                  strokeWidth={3}
                  paintOrder="stroke"
                >
                  {label}
                </text>
                <text
                  x={district.labelX}
                  y={district.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={active ? '#FFFFFF' : '#002D24'}
                  fontSize={fontSize}
                  fontWeight="700"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="mt-3 text-xs leading-relaxed text-[#002D24]/55">
          District boundaries: ONS Local Authority Districts (December 2024) BGC · Contains OS data ©
          Crown copyright and database right · OGL v3.0
        </p>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-[#002D24]/70">
          Or choose an area from the list
        </p>
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4" aria-label="Essex districts">
          {ESSEX_DISTRICT_SLUGS.map((slug) => (
            <li key={slug}>
              <button
                type="button"
                onClick={() => select(slug)}
                className={`w-full rounded-xl border px-3 py-3 text-left text-sm font-semibold leading-snug transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#330968]/40 sm:text-[15px] ${
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
