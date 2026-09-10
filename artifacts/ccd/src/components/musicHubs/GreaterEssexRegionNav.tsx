import { ChevronRight, ExternalLink, MapPinned } from 'lucide-react';
import { musicHubPageHref, musicHubPublicHref } from '../../config/musicHubsDirectory';

/** Canonical Greater Essex / East of England prototype paths. */
export const EOE_REGION_PATH = 'england/east-of-england';
export const GREATER_ESSEX_PATH = 'england/east-of-england/greater-essex';
export const EMS_SERVICE_PATH = 'england/east-of-england/greater-essex/essex-music-service';
export const MUSIC_ON_SEA_PATH = 'england/east-of-england/greater-essex/music-on-sea';
export const THURROCK_PATH = 'england/east-of-england/greater-essex/thurrock-music-service';

export type GreaterEssexNavCurrent =
  | 'east-of-england'
  | 'greater-essex'
  | 'ems'
  | 'music-on-sea'
  | 'thurrock'
  | 'district';

type HubLink = {
  id: string;
  label: string;
  href: string;
  note?: string;
  external?: boolean;
  current?: boolean;
};

/**
 * Always-expanded list of Greater Essex / East of England hub links.
 * Used on EMS Partner Hub and Music Hubs hierarchy pages so sibling hubs
 * are visible without collapsed accordions or dead home redirects.
 */
export function GreaterEssexRegionNav({
  current = 'ems',
  title = 'Other hubs in East of England',
  showDistrictEntry = true,
}: {
  current?: GreaterEssexNavCurrent;
  title?: string;
  /** Link to Essex district map / Chelmsford sample. */
  showDistrictEntry?: boolean;
}) {
  const hubs: HubLink[] = [
    {
      id: 'eoe',
      label: 'East of England',
      href: musicHubPageHref(EOE_REGION_PATH),
      note: 'Region directory (prototype focus)',
      current: current === 'east-of-england',
    },
    {
      id: 'greater-essex',
      label: 'Greater Essex Music Hub',
      href: musicHubPageHref(GREATER_ESSEX_PATH),
      note: 'Lead hub for Essex, Southend and Thurrock',
      current: current === 'greater-essex',
    },
    {
      id: 'ems',
      label: 'Essex Music Service',
      href: '/ems',
      note: 'Lead delivery partner · workshops, curriculum, map',
      current: current === 'ems',
    },
    {
      id: 'music-on-sea',
      label: 'Music-on-Sea (Southend)',
      href: musicHubPageHref(MUSIC_ON_SEA_PATH),
      note: 'Southend-on-Sea music education',
      current: current === 'music-on-sea',
    },
    {
      id: 'thurrock',
      label: 'Thurrock Music Service',
      href: musicHubPageHref(THURROCK_PATH),
      note: 'Thurrock schools and young people',
      current: current === 'thurrock',
    },
  ];

  if (showDistrictEntry) {
    hubs.push({
      id: 'districts',
      label: 'Essex districts map',
      href: '/ems#essex-districts',
      note: 'Interactive map on the EMS hub · open a district page',
      current: current === 'district',
    });
    hubs.push({
      id: 'chelmsford',
      label: 'Chelmsford (sample district)',
      href: musicHubPublicHref(`${EMS_SERVICE_PATH}/chelmsford`),
      note: 'Published district template with free sample resources',
    });
  }

  return (
    <section
      className="rounded-xl border border-[#002D24]/15 bg-white px-4 py-4 shadow-sm sm:px-5"
      aria-labelledby="greater-essex-region-nav-heading"
    >
      <h3
        id="greater-essex-region-nav-heading"
        className="text-base font-semibold tracking-tight text-[#002D24] sm:text-lg"
      >
        {title}
      </h3>
      <p className="mt-1 text-sm text-[#002D24]/70">
        This prototype focuses on East of England — Greater Essex hubs are listed here so you can
        move between EMS, Music-on-Sea and Thurrock without leaving the Music Hubs flow.
      </p>
      <ul className="mt-3 space-y-1.5" aria-label="Greater Essex and East of England hubs">
        {hubs.map((hub) => (
          <li key={hub.id}>
            {hub.current ? (
              <div className="flex items-start justify-between gap-3 rounded-xl border border-[#330968]/35 bg-[#F5F0FF] px-3 py-2.5">
                <span>
                  <span className="block text-sm font-semibold text-[#330968]">{hub.label}</span>
                  {hub.note && (
                    <span className="mt-0.5 block text-xs text-[#330968]/75">{hub.note}</span>
                  )}
                  <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wide text-[#330968]/60">
                    You are here
                  </span>
                </span>
              </div>
            ) : (
              <a
                href={hub.href}
                className="flex w-full items-start justify-between gap-3 rounded-xl border border-[#002D24]/12 bg-[#E8F0EA]/35 px-3 py-2.5 text-left transition-colors hover:border-[#002D24]/35 hover:bg-[#E8F0EA]"
              >
                <span>
                  <span className="block text-sm font-semibold text-[#002D24]">{hub.label}</span>
                  {hub.note && (
                    <span className="mt-0.5 block text-xs text-[#002D24]/60">{hub.note}</span>
                  )}
                </span>
                {hub.id === 'districts' ? (
                  <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-[#002D24]/45" aria-hidden />
                ) : hub.external ? (
                  <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-[#002D24]/45" aria-hidden />
                ) : (
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[#002D24]/45" aria-hidden />
                )}
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
