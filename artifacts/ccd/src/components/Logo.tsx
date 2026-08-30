import React, { useId } from 'react';

export const LOGO_RING = '#B6FF7E';
export const LOGO_BG = '#002D24';

interface LogoMarkProps {
  letters?: string;
  className?: string;
  /** Pixel size of the square logo mark */
  size?: number;
  title?: string;
}

interface LogoProps {
  className?: string;
  size?: 'xs' | 'xs-sm' | 'sm' | 'md' | 'lg' | 'hero';
  showText?: boolean;
  boldCurriculumDesigner?: boolean;
  /** Custom letters in logo circle, max 3 chars (e.g., "CCD") */
  letters?: string;
}

const SIZE_CLASS: Record<NonNullable<LogoProps['size']>, string> = {
  xs: 'h-10 w-10',
  'xs-sm': 'h-10 w-10 sm:h-12 sm:w-12',
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-20 w-20',
  hero: 'h-[7.5rem] w-[7.5rem] sm:h-[8.5rem] sm:w-[8.5rem]',
};

export function normaliseLogoLetters(val: string | undefined): string {
  if (!val || typeof val !== 'string') return 'CCD';
  const s = val.slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s || 'CCD';
}

function logoFontSize(letters: string): number {
  if (letters.length === 1) return 36;
  if (letters.length === 2) return 30;
  return 28;
}

/** Circular CCD mark — white letters, mint ring, dark green fill with soft glow */
export function LogoMark({ letters, className = '', size = 48, title }: LogoMarkProps) {
  const displayLetters = normaliseLogoLetters(letters);
  const gradientId = useId().replace(/:/g, '');
  const fontSize = logoFontSize(displayLetters);
  const label = title ?? displayLetters;

  return (
    <svg
      viewBox="0 0 80 80"
      width={size}
      height={size}
      className={`flex-shrink-0 ${className}`}
      role="img"
      aria-label={label}
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

export function Logo({
  className = '',
  size = 'md',
  showText = true,
  boldCurriculumDesigner = false,
  letters,
}: LogoProps) {
  const sizeClass = SIZE_CLASS[size] ?? SIZE_CLASS.md;

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <div className={`${sizeClass} flex-shrink-0 relative rounded-full shadow-[0_0_32px_rgba(182,255,126,0.12)]`}>
        <LogoMark letters={letters} className="h-full w-full" />
      </div>

      {showText && (
        <h1
          className="whitespace-nowrap font-bold leading-tight text-black"
          style={{
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 700,
            fontSize: size === 'lg' ? '1.5rem' : size === 'md' ? '1.25rem' : '1.125rem',
          }}
        >
          <span>Creative </span>
          <span className={boldCurriculumDesigner ? 'font-bold' : 'font-normal'}>Curriculum Designer</span>
        </h1>
      )}
    </div>
  );
}

export const LogoSVG = Logo;
