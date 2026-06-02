import { LogoSVG } from '../Logo';

const PARTNERS = [
  'Arts Council England',
  'Royal Opera House',
  'LSO',
  'National Theatre',
  'BBC Ten Pieces',
  'Tate',
  'National Gallery',
  "Sadler's Wells",
];

interface LoginHeroPanelProps {
  logoLetters?: string;
  compact?: boolean;
}

export function LoginHeroPanel({ logoLetters = 'CCD', compact = false }: LoginHeroPanelProps) {
  return (
    <div
      className={`relative flex w-full flex-col overflow-hidden text-white ${
        compact
          ? 'px-6 py-8 sm:px-8 sm:py-10'
          : 'min-h-full px-8 py-10 lg:min-h-[520px] lg:px-14 lg:py-12 xl:px-16'
      }`}
      style={{ backgroundColor: '#002D24' }}
    >
      <HeroDecor />

      <div className={`relative z-10 flex flex-1 flex-col ${compact ? 'gap-6' : 'justify-between gap-10 lg:min-h-[560px]'}`}>
        <div
          className={`flex flex-col ${
            compact
              ? 'items-start gap-5 text-left'
              : 'flex-1 items-center justify-center gap-8 text-center lg:items-start lg:justify-center lg:text-left'
          }`}
        >
          <LogoSVG size="hero" showText={false} letters={logoLetters} className="!space-x-0" />

          <div className={compact ? 'max-w-xl' : 'max-w-lg lg:max-w-xl'}>
            <h1
              className={`font-semibold leading-[1.12] tracking-tight ${
                compact ? 'text-[1.75rem] sm:text-[2rem]' : 'text-[2rem] sm:text-[2.35rem] lg:text-[2.65rem] xl:text-[2.85rem]'
              }`}
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              Exceptional lessons start with{' '}
              <span
                className="italic font-normal"
                style={{ color: '#B6FF7E', fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                connection.
              </span>
            </h1>

            <p
              className={`mt-4 text-white/80 leading-relaxed ${
                compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg lg:max-w-md'
              }`}
            >
              Capture ideas. Build lessons. Connect with the best arts organisations. Share or sell
              your resources. Create inspiring learning experiences — EYFS to A-level.
            </p>
          </div>
        </div>

        <div className={compact ? '' : 'mt-auto'}>
          <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/45">
            Supported by
          </p>
          <div
            className={`flex gap-2 ${
              compact
                ? 'flex-wrap'
                : 'flex-wrap lg:gap-x-5 lg:gap-y-3'
            }`}
          >
            {PARTNERS.map((name) => (
              <span
                key={name}
                className="rounded-md border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-wide text-white/70 sm:text-[0.68rem]"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroDecor() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute -left-4 top-0 h-48 w-48 opacity-70 sm:h-56 sm:w-56 lg:h-64 lg:w-64"
      viewBox="0 0 240 240"
      fill="none"
    >
      <path
        d="M20 180 C 60 120, 100 200, 140 100 S 200 40, 220 20"
        stroke="#B6FF7E"
        strokeWidth="1.5"
        strokeOpacity="0.35"
        fill="none"
      />
      <path
        d="M10 140 C 50 100, 90 160, 130 80 S 190 60, 210 40"
        stroke="#B6FF7E"
        strokeWidth="1"
        strokeOpacity="0.22"
        fill="none"
      />
      <circle cx="48" cy="52" r="4" fill="#B6FF7E" fillOpacity="0.55" />
      <circle cx="112" cy="88" r="3" fill="#B6FF7E" fillOpacity="0.4" />
      <circle cx="168" cy="36" r="5" fill="#B6FF7E" fillOpacity="0.5" />
      <circle cx="196" cy="72" r="2.5" fill="#B6FF7E" fillOpacity="0.35" />
    </svg>
  );
}
