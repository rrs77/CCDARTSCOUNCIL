import React from 'react';

/**
 * Diagonal corner-to-corner banner marking the site as an Arts Council demo.
 * Pointer-events are disabled so it does not block login or navigation.
 */
export function FabricExampleBanner() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      role="status"
      aria-label="Arts Council Example - working site"
    >
      <div className="absolute left-1/2 top-1/2 w-[220vmax] -translate-x-1/2 -translate-y-1/2 -rotate-[32deg]">
        <div className="relative border-y-[3px] border-amber-900/35 bg-gradient-to-r from-[#c9a227] via-[#e8c547] to-[#c9a227] py-3 shadow-[0_6px_28px_rgba(0,0,0,0.28)] sm:py-3.5">
          <div
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: [
                'repeating-linear-gradient(90deg, transparent 0, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)',
                'repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(255,255,255,0.06) 3px, rgba(255,255,255,0.06) 4px)',
              ].join(', '),
            }}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-white/35"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-px bg-black/15"
          />
          <p className="relative px-6 text-center text-xs font-bold uppercase tracking-[0.22em] text-[#3d2e0a] sm:text-sm sm:tracking-[0.28em]">
            Arts Council Example - working site
          </p>
        </div>
      </div>
    </div>
  );
}
