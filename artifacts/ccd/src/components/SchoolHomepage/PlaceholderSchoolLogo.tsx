import React from 'react';

interface PlaceholderSchoolLogoProps {
  /** School display name — used to derive initials. */
  schoolName: string;
  /** Accent color (hex/rgb) used for the inner shape. */
  accentColor?: string;
  /** Foreground color for initials. */
  foregroundColor?: string;
  /** Pixel size of the rendered SVG (square). */
  size?: number;
}

function getInitials(name: string): string {
  const parts = name
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'S';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * A clean, modern SVG placeholder logo used when a school has not
 * provided their own logo image. Designed to look credible at any size
 * and to work on dark/colored backgrounds.
 */
export function PlaceholderSchoolLogo({
  schoolName,
  accentColor = '#FFFFFF',
  foregroundColor = '#0F172A',
  size = 168,
}: PlaceholderSchoolLogoProps) {
  const initials = getInitials(schoolName);
  const fontSize = initials.length > 1 ? 56 : 64;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 168 168"
      role="img"
      aria-label={`${schoolName} logo`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="phRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.95" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0.65" />
        </linearGradient>
      </defs>

      {/* Outer ring */}
      <circle cx="84" cy="84" r="78" fill="none" stroke="url(#phRing)" strokeWidth="3" />

      {/* Inner soft-square */}
      <rect
        x="22"
        y="22"
        width="124"
        height="124"
        rx="28"
        fill={accentColor}
        opacity="0.95"
      />

      {/* Subtle inner highlight to add depth */}
      <rect
        x="22"
        y="22"
        width="124"
        height="62"
        rx="28"
        fill="white"
        opacity="0.08"
      />

      {/* Initials */}
      <text
        x="84"
        y="92"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontWeight={700}
        fontSize={fontSize}
        letterSpacing="-2"
        fill={foregroundColor}
      >
        {initials}
      </text>
    </svg>
  );
}
