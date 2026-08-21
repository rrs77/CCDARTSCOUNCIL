import { useId } from "react";

export const LOGO_RING = "#B6FF7E";
export const LOGO_BG = "#002D24";

function logoFontSize(letters: string): number {
  if (letters.length === 1) return 36;
  if (letters.length === 2) return 30;
  return 28;
}

/** Circular CCD mark — white letters, mint ring, forest fill (matches login / walkthrough). */
export function LogoMark({
  letters = "CCD",
  className = "",
  size = 48,
  title,
}: {
  letters?: string;
  className?: string;
  size?: number;
  title?: string;
}) {
  const displayLetters = letters.slice(0, 3).toUpperCase() || "CCD";
  const gradientId = useId().replace(/:/g, "");
  const fontSize = logoFontSize(displayLetters);

  return (
    <svg
      viewBox="0 0 80 80"
      width={size}
      height={size}
      className={`flex-shrink-0 ${className}`}
      role="img"
      aria-label={title ?? displayLetters}
    >
      <defs>
        <radialGradient id={`ccdGlow-${gradientId}`} cx="50%" cy="44%" r="58%">
          <stop offset="0%" stopColor="#1a4038" />
          <stop offset="55%" stopColor={LOGO_BG} />
          <stop offset="100%" stopColor="#001812" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="39" fill="none" stroke={LOGO_RING} strokeOpacity="0.18" strokeWidth="1" />
      <circle
        cx="40"
        cy="40"
        r="36"
        fill={`url(#ccdGlow-${gradientId})`}
        stroke={LOGO_RING}
        strokeWidth="1.5"
      />
      <text
        x="40"
        y="40.5"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#FFFFFF"
        fontSize={fontSize}
        fontWeight="700"
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
        letterSpacing="-0.5"
      >
        {displayLetters}
      </text>
    </svg>
  );
}
