import React from 'react';

export const LOGO_RING = '#FFC93C';
export const LOGO_BG = '#1F1B4D';

/** Cache-bust when mark asset changes */
const LOGO_MARK_SRC = '/login/ccd-mark.png?v=logo-5';

/** Wordmark type — matches Studio Score UI; solid fill (no distressed PNG text). */
export const LOGO_WORDMARK_FONT =
  "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

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
  /** When true, show mark + “designer”. When false, mark only. */
  showText?: boolean;
  boldCurriculumDesigner?: boolean;
  /** Custom letters (legacy); ignored for image logo */
  letters?: string;
  /** White “designer” text for dark backgrounds */
  light?: boolean;
}

/** Square mark height */
const MARK_SIZE: Record<NonNullable<LogoProps['size']>, string> = {
  xs: 'h-7 w-7',
  'xs-sm': 'h-8 w-8 sm:h-9 sm:w-9',
  sm: 'h-9 w-9',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  hero: 'h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] lg:h-20 lg:w-20',
};

/** “designer” text size — optically matches mark height */
const WORD_SIZE: Record<NonNullable<LogoProps['size']>, string> = {
  xs: 'text-[1.05rem]',
  'xs-sm': 'text-[1.15rem] sm:text-[1.25rem]',
  sm: 'text-[1.3rem]',
  md: 'text-[1.45rem]',
  lg: 'text-[1.7rem]',
  hero: 'text-[2.25rem] sm:text-[2.65rem] lg:text-[3.1rem]',
};

export function normaliseLogoLetters(val: string | undefined): string {
  if (!val || typeof val !== 'string') return 'CCD';
  const s = val.slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s || 'CCD';
}

/** Colourful ribbon mark only */
export function LogoMark({ letters, className = '', size = 48, title }: LogoMarkProps) {
  const label = title ?? normaliseLogoLetters(letters);
  return (
    <img
      src={LOGO_MARK_SRC}
      width={size}
      height={size}
      alt={label}
      className={`flex-shrink-0 object-contain ${className}`}
      decoding="async"
    />
  );
}

/**
 * Brand lockup — ribbon mark + solid “designer” type (not a noisy wordmark PNG).
 * Pass light for dark surfaces (sidebar / hero).
 */
export function Logo({
  className = '',
  size = 'md',
  showText = true,
  boldCurriculumDesigner: _bold = false,
  letters,
  light = false,
}: LogoProps) {
  if (!showText) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <LogoMark letters={letters} className={MARK_SIZE[size]} size={48} />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-[0.28em] ${className}`}
      role="img"
      aria-label="designer"
    >
      <LogoMark letters={letters} className={MARK_SIZE[size]} size={64} title="" />
      <span
        className={`font-extrabold lowercase leading-none tracking-[-0.03em] ${WORD_SIZE[size]} ${
          light ? 'text-white' : 'text-[#1F1B4D]'
        }`}
        style={{ fontFamily: LOGO_WORDMARK_FONT }}
        aria-hidden
      >
        designer
      </span>
    </div>
  );
}

export const LogoSVG = Logo;
