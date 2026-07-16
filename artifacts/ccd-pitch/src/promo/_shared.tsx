import React from 'react';
import { motion } from 'framer-motion';
import { springs } from './animations';

type Tint = 'teal' | 'plum' | 'amber' | 'rose' | 'indigo' | 'midnight';

const TINTS: Record<Tint, { base: string; orbA: string; orbB: string; accent: string; eyebrow: string }> = {
  teal: {
    base: 'radial-gradient(ellipse at 20% 0%, #0c3a3f 0%, #06181c 55%, #03090c 100%)',
    orbA: 'radial-gradient(circle, rgba(94,234,212,0.35), transparent 65%)',
    orbB: 'radial-gradient(circle, rgba(20,184,166,0.30), transparent 65%)',
    accent: '#5EEAD4',
    eyebrow: 'rgba(94,234,212,0.18)',
  },
  plum: {
    base: 'radial-gradient(ellipse at 80% 0%, #2a1240 0%, #120825 55%, #04030c 100%)',
    orbA: 'radial-gradient(circle, rgba(168,85,247,0.40), transparent 65%)',
    orbB: 'radial-gradient(circle, rgba(244,114,182,0.30), transparent 65%)',
    accent: '#C084FC',
    eyebrow: 'rgba(192,132,252,0.18)',
  },
  amber: {
    base: 'radial-gradient(ellipse at 50% 0%, #3a1f08 0%, #1a0e05 55%, #0a0604 100%)',
    orbA: 'radial-gradient(circle, rgba(251,191,36,0.35), transparent 65%)',
    orbB: 'radial-gradient(circle, rgba(244,114,182,0.20), transparent 65%)',
    accent: '#FBBF24',
    eyebrow: 'rgba(251,191,36,0.20)',
  },
  rose: {
    base: 'radial-gradient(ellipse at 30% 100%, #3a0f1f 0%, #190612 55%, #06030a 100%)',
    orbA: 'radial-gradient(circle, rgba(244,63,94,0.40), transparent 65%)',
    orbB: 'radial-gradient(circle, rgba(168,85,247,0.25), transparent 65%)',
    accent: '#FB7185',
    eyebrow: 'rgba(251,113,133,0.20)',
  },
  indigo: {
    base: 'radial-gradient(ellipse at 70% 100%, #0d1f4d 0%, #050a26 55%, #020410 100%)',
    orbA: 'radial-gradient(circle, rgba(99,102,241,0.40), transparent 65%)',
    orbB: 'radial-gradient(circle, rgba(56,189,248,0.30), transparent 65%)',
    accent: '#A5B4FC',
    eyebrow: 'rgba(165,180,252,0.18)',
  },
  midnight: {
    base: 'radial-gradient(ellipse at 50% 50%, #0a1428 0%, #050912 55%, #02030a 100%)',
    orbA: 'radial-gradient(circle, rgba(56,189,248,0.30), transparent 65%)',
    orbB: 'radial-gradient(circle, rgba(168,85,247,0.25), transparent 65%)',
    accent: '#7DD3FC',
    eyebrow: 'rgba(125,211,252,0.16)',
  },
};

export function tintAccent(tint: Tint = 'teal'): string {
  return TINTS[tint].accent;
}

interface BackdropProps {
  tint?: Tint;
  children: React.ReactNode;
  fast?: boolean;
}

/** Cinematic dark backdrop with two slowly drifting glow orbs and a subtle noise texture. */
export function Backdrop({ tint = 'teal', children, fast = false }: BackdropProps) {
  const t = TINTS[tint];
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{ background: t.base }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'circOut' }}
    >
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '70cqw',
          height: '70cqw',
          left: '-15cqw',
          top: '-20cqh',
          background: t.orbA,
          filter: 'blur(4cqw)',
        }}
        animate={{ x: ['0%', '12%', '-6%', '0%'], y: ['0%', '8%', '-4%', '0%'], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: fast ? 12 : 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '60cqw',
          height: '60cqw',
          right: '-10cqw',
          bottom: '-15cqh',
          background: t.orbB,
          filter: 'blur(4cqw)',
        }}
        animate={{ x: ['0%', '-10%', '6%', '0%'], y: ['0%', '-8%', '4%', '0%'], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: fast ? 14 : 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="relative z-10 w-full h-full">{children}</div>
    </motion.div>
  );
}

interface EyebrowProps {
  children: React.ReactNode;
  tint?: Tint;
  delay?: number;
  align?: 'left' | 'center';
}

export function Eyebrow({ children, tint = 'teal', delay = 0.1, align = 'left' }: EyebrowProps) {
  const t = TINTS[tint];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.gentle, delay }}
      className={`${
        align === 'center' ? 'self-center' : 'self-start'
      } inline-flex items-center gap-[1cqmin] px-[2cqmin] py-[1cqmin] rounded-full font-semibold tracking-[0.18em] uppercase backdrop-blur-sm`}
      style={{
        background: t.eyebrow,
        border: `1px solid ${t.accent}40`,
        color: t.accent,
        fontSize: 'clamp(9px,1.4cqmax,18px)',
      }}
    >
      <span
        className="inline-block rounded-full"
        style={{ width: '0.6em', height: '0.6em', background: t.accent, boxShadow: `0 0 12px ${t.accent}` }}
      />
      {children}
    </motion.div>
  );
}

interface CinematicProps {
  children: React.ReactNode;
  delay?: number;
  size?: 'lg' | 'xl' | '2xl';
  align?: 'left' | 'center';
}

/** Big premium headline with line-by-line stagger. Pass <span> children for line breaks. */
export function Cinematic({ children, delay = 0.25, size = 'xl', align = 'left' }: CinematicProps) {
  const fontSize =
    size === '2xl'
      ? 'clamp(40px,9cqmax,140px)'
      : size === 'xl'
      ? 'clamp(34px,7cqmax,112px)'
      : 'clamp(28px,5.5cqmax,88px)';

  const lines = React.Children.toArray(children);

  return (
    <motion.h1
      className={`font-display font-black text-white tracking-tight leading-[1.02] ${
        align === 'center' ? 'text-center' : ''
      }`}
      style={{ fontSize, perspective: '1200px' }}
    >
      {lines.map((line, i) => (
        <motion.span
          key={i}
          className="block"
          initial={{ opacity: 0, y: 36, rotateX: -22 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ ...springs.snappy, delay: delay + i * 0.12 }}
        >
          {line}
        </motion.span>
      ))}
    </motion.h1>
  );
}

export function Sub({
  children,
  delay = 0.7,
  align = 'left',
}: {
  children: React.ReactNode;
  delay?: number;
  align?: 'left' | 'center';
}) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'circOut', delay }}
      className={`text-white/65 font-light leading-relaxed max-w-[60cqw] ${align === 'center' ? 'text-center mx-auto' : ''}`}
      style={{ fontSize: 'clamp(13px,1.9cqmax,26px)' }}
    >
      {children}
    </motion.p>
  );
}

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function GlassPanel({ children, className = '', style }: GlassPanelProps) {
  return (
    <div
      className={`relative rounded-[2cqmin] backdrop-blur-xl bg-white/[0.04] border border-white/10 ${className}`}
      style={{
        boxShadow:
          '0 30px 80px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** A small floating "idea" card for visual storytelling — used in archive / never-lose / community scenes. */
export function IdeaCard({
  tag,
  title,
  meta,
  color = '#5EEAD4',
  className = '',
  style,
}: {
  tag: string;
  title: string;
  meta?: string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-[1.5cqmin] bg-white/[0.06] backdrop-blur-md border border-white/10 px-[2cqmin] py-[1.6cqmin] ${className}`}
      style={{
        boxShadow: '0 18px 40px -10px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
        ...style,
      }}
    >
      <div
        className="inline-flex items-center gap-[0.6cqmin] rounded-full px-[1.2cqmin] py-[0.4cqmin] font-semibold uppercase tracking-wider"
        style={{
          background: `${color}22`,
          color,
          fontSize: 'clamp(8px,1cqmax,12px)',
        }}
      >
        <span className="rounded-full" style={{ width: '0.5em', height: '0.5em', background: color }} />
        {tag}
      </div>
      <div
        className="text-white/95 mt-[0.8cqmin] font-semibold leading-snug"
        style={{ fontSize: 'clamp(11px,1.5cqmax,20px)' }}
      >
        {title}
      </div>
      {meta && (
        <div className="text-white/40 mt-[0.4cqmin]" style={{ fontSize: 'clamp(8px,1cqmax,13px)' }}>
          {meta}
        </div>
      )}
    </div>
  );
}

/** Browser-chrome wrapper for screenshots / mockups. */
export function MockupFrame({
  children,
  label = 'Creative Curriculum Designer',
  className = '',
  style,
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[2cqmin] border border-white/10 bg-[#0a1014] ${className}`}
      style={{
        boxShadow:
          '0 50px 120px -30px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
        ...style,
      }}
    >
      <div className="flex items-center gap-[0.8cqmin] px-[1.5cqmin] py-[1cqmin] border-b border-white/5 bg-white/[0.02]">
        <span className="rounded-full bg-[#FF5F57]" style={{ width: 'clamp(6px,0.8cqmax,12px)', height: 'clamp(6px,0.8cqmax,12px)' }} />
        <span className="rounded-full bg-[#FEBC2E]" style={{ width: 'clamp(6px,0.8cqmax,12px)', height: 'clamp(6px,0.8cqmax,12px)' }} />
        <span className="rounded-full bg-[#28C840]" style={{ width: 'clamp(6px,0.8cqmax,12px)', height: 'clamp(6px,0.8cqmax,12px)' }} />
        <div className="flex-1 text-center text-white/40 font-mono" style={{ fontSize: 'clamp(8px,1cqmax,13px)' }}>
          {label}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

/**
 * Composite wordmark: transparent purple CC mark + DESIGNER text.
 * `variant="light"` => white DESIGNER text (use on dark backgrounds).
 * `variant="dark"`  => deep-plum DESIGNER text (use on light backgrounds).
 * Sized by `height` (any CSS length); the wordmark hugs its content with no padding.
 */
export function Wordmark({
  variant = 'light',
  height = 'clamp(36px,5.5cqmax,70px)',
  shadow = true,
  className = '',
  style,
}: {
  variant?: 'light' | 'dark';
  height?: string;
  shadow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const textColor = variant === 'light' ? '#FFFFFF' : '#1a1033';
  const dropShadow = shadow
    ? variant === 'light'
      ? 'drop-shadow(0 2px 10px rgba(0,0,0,0.45))'
      : 'drop-shadow(0 2px 10px rgba(26,16,51,0.18))'
    : 'none';
  return (
    <div
      className={`inline-flex items-center ${className}`}
      style={{
        height,
        fontSize: height,
        gap: '0.18em',
        lineHeight: 1,
        filter: dropShadow,
        ...style,
      }}
    >
      <img
        src={`${import.meta.env.BASE_URL}cc-mark.png`}
        alt=""
        aria-hidden
        crossOrigin="anonymous"
        style={{ height: '100%', width: 'auto', display: 'block' }}
      />
      <span
        style={{
          color: textColor,
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          fontWeight: 700,
          letterSpacing: '0.06em',
          fontSize: '0.4em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        Designer
      </span>
    </div>
  );
}

/** A persistent corner brand stamp for cinematic (dark) scenes.
 *  Sized with `cqmin` so it scales gracefully on portrait phones — using
 *  `cqmax` made the wordmark balloon vertically and overlap the scene
 *  eyebrow on tall narrow viewports. */
export function CornerBrand({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="absolute top-[3cqmin] left-[3.5cqmin] z-20"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: 'circOut', delay }}
    >
      <Wordmark variant="light" height="clamp(22px,4.2cqmin,52px)" />
    </motion.div>
  );
}

/** Scene-counter chip in opposite corner. */
export function SceneChip({ index, total, delay = 0 }: { index: number; total: number; delay?: number }) {
  return (
    <motion.div
      className="absolute top-[3cqmin] right-[4cqmin] z-20 px-[1.5cqmin] py-[0.6cqmin] rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/55 font-mono tabular-nums tracking-wider"
      style={{ fontSize: 'clamp(9px,1.1cqmax,14px)' }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: 'circOut', delay }}
    >
      {String(index).padStart(2, '0')} / {String(total).padStart(2, '0')}
    </motion.div>
  );
}

/** Convenience layout: vertical-centered cinematic content with optional right-side visual slot. */
export function SceneLayout({
  children,
  visual,
  layout = 'left-text',
}: {
  children: React.ReactNode;
  visual?: React.ReactNode;
  layout?: 'left-text' | 'right-text' | 'centered' | 'stacked';
}) {
  if (layout === 'centered') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[6cqmin] gap-[2.5cqmin] text-center">
        {children}
      </div>
    );
  }
  if (layout === 'stacked') {
    return (
      <div className="absolute inset-0 flex flex-col justify-center gap-[3cqmin] px-[6cqmin]">
        <div className="flex flex-col gap-[2.5cqmin] max-w-[80cqw]">{children}</div>
        {visual && <div className="relative">{visual}</div>}
      </div>
    );
  }
  return (
    // Portrait phones get extra top + bottom padding so the absolutely
    // positioned CornerBrand (top-left) and SceneChip (top-right) never
    // sit on top of the eyebrow / headline. On landscape we keep the
    // tighter cinematic padding so the composition doesn't feel hollow.
    <div
      className={`absolute inset-0 grid items-center gap-[3cqmin] px-[5cqmin] pt-[14cqmin] pb-[10cqmin] landscape:py-[8cqmin] ${
        layout === 'right-text' ? 'landscape:grid-cols-[1.1fr_1fr]' : 'landscape:grid-cols-[1fr_1.1fr]'
      } grid-cols-1`}
    >
      {layout === 'right-text' ? (
        <>
          <div className="relative landscape:order-1 order-2">{visual}</div>
          <div className="flex flex-col gap-[2cqmin] landscape:order-2 order-1">{children}</div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-[2cqmin]">{children}</div>
          <div className="relative">{visual}</div>
        </>
      )}
    </div>
  );
}

export type { Tint };
