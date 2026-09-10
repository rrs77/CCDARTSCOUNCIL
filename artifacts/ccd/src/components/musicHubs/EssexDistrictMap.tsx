/**
 * Interactive Essex districts map — schematic SVG paths (no external asset found).
 * Hover highlight, click → district path, keyboard + aria, list fallback for mobile.
 */

import { useId, useState } from 'react';
import type { EssexDistrictSlug } from '../../config/musicHubsDirectory';
import { ESSEX_DISTRICT_SLUGS } from '../../config/musicHubsDirectory';

export type EssexDistrictMeta = {
  slug: EssexDistrictSlug;
  name: string;
  /** SVG path in viewBox 0 0 400 320 */
  d: string;
};

/**
 * Approximate district shapes arranged geographically (NW Uttlesford → SE Castle Point).
 * Clean schematic for interaction — not Ordnance Survey accuracy.
 */
export const ESSEX_DISTRICTS: EssexDistrictMeta[] = [
  {
    slug: 'uttlesford',
    name: 'Uttlesford',
    d: 'M40 20 L140 18 L145 70 L95 95 L35 75 Z',
  },
  {
    slug: 'braintree',
    name: 'Braintree',
    d: 'M145 18 L230 22 L235 85 L175 100 L145 70 Z',
  },
  {
    slug: 'colchester',
    name: 'Colchester',
    d: 'M230 22 L310 30 L320 95 L250 105 L235 85 Z',
  },
  {
    slug: 'tendring',
    name: 'Tendring',
    d: 'M310 30 L385 45 L380 120 L325 125 L320 95 Z',
  },
  {
    slug: 'harlow',
    name: 'Harlow',
    d: 'M35 75 L95 95 L90 130 L40 125 Z',
  },
  {
    slug: 'epping-forest',
    name: 'Epping Forest',
    d: 'M40 125 L90 130 L100 175 L45 180 Z',
  },
  {
    slug: 'chelmsford',
    name: 'Chelmsford',
    d: 'M95 95 L175 100 L185 160 L110 165 L90 130 Z',
  },
  {
    slug: 'maldon',
    name: 'Maldon',
    d: 'M175 100 L250 105 L255 165 L185 160 Z',
  },
  {
    slug: 'brentwood',
    name: 'Brentwood',
    d: 'M45 180 L110 165 L120 210 L55 220 Z',
  },
  {
    slug: 'basildon',
    name: 'Basildon',
    d: 'M110 165 L185 160 L195 215 L125 225 L120 210 Z',
  },
  {
    slug: 'rochford',
    name: 'Rochford',
    d: 'M185 160 L255 165 L270 220 L200 230 L195 215 Z',
  },
  {
    slug: 'castle-point',
    name: 'Castle Point',
    d: 'M125 225 L200 230 L205 275 L140 280 L125 250 Z',
  },
];

const NAME_BY_SLUG = Object.fromEntries(
  ESSEX_DISTRICTS.map((d) => [d.slug, d.name]),
) as Record<EssexDistrictSlug, string>;

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
          viewBox="0 0 400 300"
          className="mx-auto h-auto w-full max-w-xl touch-manipulation"
          role="img"
          aria-labelledby={labelId}
        >
          <title>Interactive map of Essex districts</title>
          <rect width="400" height="300" fill="#E8F0EA" rx="8" />
          {ESSEX_DISTRICTS.map((district) => {
            const active = hovered === district.slug || selectedSlug === district.slug;
            return (
              <path
                key={district.slug}
                d={district.d}
                tabIndex={0}
                role="button"
                aria-label={`${district.name} district`}
                fill={active ? '#330968' : '#FFFFFF'}
                stroke="#002D24"
                strokeWidth={active ? 2.2 : 1.4}
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
          {ESSEX_DISTRICTS.map((district) => {
            const match = district.d.match(/M([\d.]+)\s+([\d.]+)/);
            const x = match ? Number(match[1]) + 18 : 0;
            const y = match ? Number(match[2]) + 28 : 0;
            const active = hovered === district.slug || selectedSlug === district.slug;
            return (
              <text
                key={`${district.slug}-label`}
                x={x}
                y={y}
                className="pointer-events-none select-none"
                fill={active ? '#FFFFFF' : '#002D24'}
                fontSize="9"
                fontWeight="600"
              >
                {district.name.length > 10 ? district.name.slice(0, 9) + '…' : district.name}
              </text>
            );
          })}
        </svg>
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
