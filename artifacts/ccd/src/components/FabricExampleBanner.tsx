import React from 'react';

/**
 * Diagonal fabric ribbon marking the site as an Arts Council demo.
 * Login screens only — pointer-events disabled so it never blocks interaction.
 */
export function FabricExampleBanner() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      role="status"
      aria-label="Arts Council Example - working site"
    >
      <div className="absolute left-1/2 top-[42%] w-[240vmax] -translate-x-1/2 -translate-y-1/2 -rotate-[32deg]">
        {/* Drop shadow beneath ribbon */}
        <div
          aria-hidden
          className="absolute inset-x-[2%] top-[18px] h-[calc(100%-8px)] opacity-45 blur-md"
          style={{
            background: '#1a0a2e',
            clipPath:
              'polygon(0 18%, 1.2% 0, 98.8% 0, 100% 18%, 100% 82%, 98.8% 100%, 1.2% 100%, 0 82%)',
          }}
        />

        {/* Ribbon body */}
        <div
          className="relative"
          style={{
            filter: 'drop-shadow(0 10px 22px rgba(0,0,0,0.45))',
          }}
        >
          <div
            className="relative overflow-hidden"
            style={{
              clipPath:
                'polygon(0 18%, 1.2% 0, 98.8% 0, 100% 18%, 100% 82%, 98.8% 100%, 1.2% 100%, 0 82%)',
              background:
                'linear-gradient(180deg, #3d1458 0%, #5c1f7a 12%, #6b2488 50%, #5c1f7a 88%, #3d1458 100%)',
            }}
          >
            {/* Satin sheen */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-70"
              style={{
                background:
                  'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.22) 42%, transparent 58%, rgba(255,255,255,0.08) 72%, transparent 100%)',
              }}
            />

            {/* Fabric weave */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-25 mix-blend-overlay"
              style={{
                backgroundImage: [
                  'repeating-linear-gradient(90deg, transparent 0, transparent 2px, rgba(255,255,255,0.07) 2px, rgba(255,255,255,0.07) 3px)',
                  'repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
                ].join(', '),
              }}
            />

            {/* Gold stitched borders */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-[17%] h-[3px]"
              style={{
                background:
                  'linear-gradient(90deg, transparent, #d4af37 8%, #f5e6a8 50%, #d4af37 92%, transparent)',
              }}
            />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-[17%] h-[3px]"
              style={{
                background:
                  'linear-gradient(90deg, transparent, #d4af37 8%, #f5e6a8 50%, #d4af37 92%, transparent)',
              }}
            />

            {/* Fold shadows */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-[18%] bg-gradient-to-b from-black/35 to-transparent"
            />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-[18%] bg-gradient-to-t from-black/35 to-transparent"
            />

            <div className="relative flex flex-col items-center justify-center gap-0.5 px-10 py-5 sm:flex-row sm:gap-4 sm:py-6 md:gap-6 md:py-7">
              <span
                className="text-center font-black uppercase leading-none tracking-[0.06em] text-white sm:text-left"
                style={{
                  fontSize: 'clamp(1.35rem, 4.2vw, 2.75rem)',
                  textShadow:
                    '0 2px 0 rgba(0,0,0,0.35), 0 0 28px rgba(212,175,55,0.35), 0 4px 12px rgba(0,0,0,0.4)',
                  fontFamily: '"Playfair Display", Georgia, "Times New Roman", serif',
                }}
              >
                Arts Council
              </span>

              <span
                aria-hidden
                className="hidden h-8 w-px shrink-0 bg-gradient-to-b from-transparent via-[#f5e6a8] to-transparent sm:block"
              />

              <span
                className="text-center text-[0.7rem] font-bold uppercase leading-tight tracking-[0.28em] text-[#f5e6a8] sm:text-left sm:text-sm sm:tracking-[0.32em]"
                style={{
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                }}
              >
                Example
                <span className="mx-2 hidden font-light text-white/50 sm:inline">·</span>
                <span className="block sm:inline">Working site</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
