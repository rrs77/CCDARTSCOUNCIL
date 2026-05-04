import React from 'react';

export function DemoWatermark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[5] overflow-hidden select-none"
      style={{ opacity: 0.035 }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -35deg,
            transparent,
            transparent 180px,
            currentColor 180px,
            currentColor 181px,
            transparent 181px,
            transparent 360px
          )`,
        }}
      />
      <div
        className="absolute inset-0 flex flex-wrap items-center justify-center gap-x-48 gap-y-40"
        style={{
          transform: 'rotate(-35deg) scale(1.5)',
          transformOrigin: 'center center',
        }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className="whitespace-nowrap text-5xl font-black uppercase tracking-[0.25em] text-gray-900"
          >
            PREVIEW
          </span>
        ))}
      </div>
    </div>
  );
}
