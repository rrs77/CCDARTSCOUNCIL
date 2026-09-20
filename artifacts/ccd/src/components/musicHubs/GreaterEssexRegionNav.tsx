import { ChevronRight, MapPinned } from 'lucide-react';
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
  current?: boolean;
  map?: boolean;
};

/**
 * Always-expanded list of East of England / Greater Essex hubs.
 * When hubsOnly is set, only the three delivery hubs are listed (EMS, Music-on-Sea, Thurrock).
 */
export function GreaterEssexRegionNav({
  current = 'ems',
  title = 'Hubs in East of England',
  showDistrictEntry = true,
  hubsOnly = false,
}: {
  current?: GreaterEssexNavCurrent;
  title?: string;
  /** Link to Essex district map / Chelmsford sample. */
  showDistrictEntry?: boolean;
  /** Only EMS + Music-on-Sea + Thurrock (no region parents). */
  hubsOnly?: boolean;
}) {
  const deliveryHubs: HubLink[] = [
    {
      id: 'ems',
      label: 'Essex Music Service',
      href: '/ems',
      note: 'Lead delivery partner · district map',
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

  const hubs: HubLink[] = hubsOnly
    ? [...deliveryHubs]
    : [
        {
          id: 'greater-essex',
          label: 'Greater Essex Music Hub',
          href: musicHubPageHref(GREATER_ESSEX_PATH),
          note: 'Covers Essex, Southend and Thurrock',
          current: current === 'greater-essex',
        },
        ...deliveryHubs,
      ];

  if (showDistrictEntry) {
    hubs.push({
      id: 'districts',
      label: 'Essex districts map',
      href: '/ems#essex-districts',
      note: 'Open a borough / district for local resources',
      current: current === 'district',
      map: true,
    });
    hubs.push({
      id: 'chelmsford',
      label: 'Chelmsford (sample district)',
      href: musicHubPublicHref(`${EMS_SERVICE_PATH}/chelmsford`),
      note: 'Resources live on district pages',
    });
  }

  return (
    <section
      className="rounded-2xl border border-[#002D24]/15 bg-white px-4 py-5 shadow-sm sm:px-6"
      aria-labelledby="greater-essex-region-nav-heading"
    >
      <h3
        id="greater-essex-region-nav-heading"
        className="text-lg font-semibold tracking-tight text-[#002D24] sm:text-xl"
      >
        {title}
      </h3>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#002D24]/75 sm:text-base">
        {hubsOnly
          ? 'These are the hubs within Greater Essex (East of England). Open any hub below — resources are on district pages after you pick an area on the map.'
          : 'East of England prototype: Greater Essex hubs are listed here so you can move between EMS, Music-on-Sea and Thurrock. Resources sit under district / borough pages.'}
      </p>
      <ul className="mt-4 space-y-2" aria-label="East of England hubs">
        {hubs.map((hub) => (
          <li key={hub.id}>
            {hub.current ? (
              <div className="flex items-start justify-between gap-3 rounded-xl border-2 border-[#330968] bg-[#F5F0FF] px-4 py-3">
                <span>
                  <span className="block text-base font-semibold text-[#330968]">{hub.label}</span>
                  {hub.note && (
                    <span className="mt-1 block text-sm leading-snug text-[#330968]/80">
                      {hub.note}
                    </span>
                  )}
                  <span className="mt-2 inline-block rounded-md bg-[#330968]/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#330968]">
                    You are here
                  </span>
                </span>
              </div>
            ) : (
              <a
                href={hub.href}
                className="flex w-full items-start justify-between gap-3 rounded-xl border border-[#002D24]/15 bg-[#E8F0EA]/50 px-4 py-3 text-left transition-colors hover:border-[#330968]/40 hover:bg-[#E8F0EA]"
              >
                <span>
                  <span className="block text-base font-semibold text-[#002D24]">{hub.label}</span>
                  {hub.note && (
                    <span className="mt-1 block text-sm leading-snug text-[#002D24]/65">
                      {hub.note}
                    </span>
                  )}
                </span>
                {hub.map ? (
                  <MapPinned className="mt-1 h-5 w-5 shrink-0 text-[#002D24]/45" aria-hidden />
                ) : (
                  <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-[#002D24]/45" aria-hidden />
                )}
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
