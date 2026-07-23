import { Handshake } from 'lucide-react';
import { PARTNER_HUBS, openPartnerHub } from '../config/partnerHubs';

/** Same dark green as login hero — partner SVGs are white wordmarks. */
const LOGO_STRIP_BG = '#002D24';

/**
 * Partner Hubs tab — list only. Each partner opens as an independent page at `/{slug}`.
 */
export function OurPartners() {
  return (
    <div className="space-y-6">
      <div
        className="rounded-xl border border-[#002D24]/10 bg-[var(--ccd-sage-mist,#E8F0EA)] px-5 py-4 sm:px-6 sm:py-5"
      >
        <div className="flex items-center gap-4 sm:gap-5">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#002D24]/75 sm:h-11 sm:w-11"
            style={{ backgroundColor: 'rgba(0, 45, 36, 0.06)' }}
          >
            <Handshake className="h-5 w-5 sm:h-[1.35rem] sm:w-[1.35rem]" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-[#002D24] sm:text-2xl">
              Partner Hubs
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-[#002D24]/70 sm:text-[0.95rem]">
              Cultural organisations whose resources can enrich classroom music and the arts.
              Select a partner to open their hub page.
            </p>
          </div>
        </div>
      </div>

      <ul
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Partner Hubs"
      >
        {PARTNER_HUBS.map((hub) => {
          const invertClass = hub.logoInvert ? 'brightness-0 invert' : '';
          const cardInner = (
            <>
              <div
                className="flex h-20 w-full shrink-0 items-center justify-center px-4"
                style={{ backgroundColor: LOGO_STRIP_BG }}
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
                <span className="text-sm font-medium leading-snug text-gray-800">
                  {hub.displayName}
                </span>
                <span className="text-xs font-medium text-[#002D24]/70">Open hub →</span>
              </div>
            </>
          );

          const baseCard =
            'flex h-full min-h-[11.5rem] w-full flex-col overflow-hidden rounded-xl border bg-white text-center shadow-sm transition-all duration-150 ease-out hover:shadow-md hover:scale-[1.02] active:scale-105';

          return (
            <li key={hub.slug} className="h-full">
              <button
                type="button"
                onClick={() => openPartnerHub(hub.slug)}
                className={`${baseCard} border-[#002D24]/15 hover:border-[#002D24]/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#002D24]/40`}
                aria-label={`Open ${hub.displayName} Partner Hub`}
              >
                {cardInner}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
