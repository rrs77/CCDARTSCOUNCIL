import { Logo } from '../Logo';
import { PartnerLogoStrip } from './PartnerLogoStrip';

/** Triptych: EYFS/primary music · secondary drama · dance — ages match “EYFS to A-level”. */
const HERO_IMAGE = '/login/hero-arts.jpg?v=ages-1';
const HERO_VALUE =
  'Capture ideas, build lessons, connect with the best arts organisations from EYFS to A-level.';

/** Explicit index.html — bare `/the-facts/` is caught by the SPA rewrite. */
export const THE_FACTS_HREF = '/the-facts/index.html';

interface LoginHeroPanelProps {
  logoLetters?: string;
}

/**
 * Full-bleed arts hero — image spans the whole stage so EYFS / KS3 / dance
 * panels stay visible; login card floats over the right side on desktop.
 * On small viewports the panel grows with content so partner logos + disclaimer
 * stay fully readable above the stacked login card.
 */
export function LoginHeroPanel({ logoLetters: _logoLetters = 'CCD' }: LoginHeroPanelProps) {
  return (
    <div
      className="relative w-full text-white lg:h-full lg:min-h-full"
      style={{ backgroundColor: '#1F1B4D' }}
    >
      {/* Image layer clipped separately so ken-burns scale never crops copy */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <img
          src={HERO_IMAGE}
          alt=""
          className="ccd-login-hero-image absolute inset-0 h-full w-full object-cover object-left lg:object-[28%_center]"
          decoding="async"
        />
        {/* Neutral ink wash — keep the photo visible, avoid purple cast */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(90deg, rgba(18,16,36,0.55) 0%, rgba(18,16,36,0.22) 52%, rgba(18,16,36,0.12) 100%),
              linear-gradient(180deg, rgba(18,16,36,0.18) 0%, rgba(18,16,36,0.28) 55%, rgba(18,16,36,0.78) 100%)
            `,
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-[300px] flex-col justify-between gap-8 px-5 py-6 pb-8 sm:min-h-[340px] sm:px-8 sm:py-8 sm:pb-10 lg:h-full lg:min-h-full lg:max-w-[58%] lg:px-12 lg:py-12 lg:pb-12 xl:px-14">
        <div className="flex flex-wrap items-center gap-3 ccd-login-hero-fade">
          <Logo size="hero" light className="drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)]" />
        </div>

        <div className="flex flex-col gap-6 lg:gap-8">
          <div className="max-w-xl">
            <h1
              className="ccd-login-hero-fade ccd-login-hero-fade-delay-1 text-[1.65rem] font-extrabold leading-[1.12] tracking-tight text-white sm:text-[2rem] lg:text-[2.45rem] xl:text-[2.7rem]"
              style={{ fontFamily: "var(--ss-font-display, 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif)" }}
            >
              Exceptional lessons start with{' '}
              <span className="font-extrabold" style={{ color: '#FFC93C' }}>
                connection
              </span>
            </h1>

            <p className="ccd-login-hero-fade ccd-login-hero-fade-delay-3 mt-3 text-sm leading-relaxed text-white/90 sm:text-base lg:max-w-md lg:text-lg">
              {HERO_VALUE}
            </p>
          </div>

          <div className="ccd-login-hero-fade ccd-login-hero-fade-delay-3">
            <PartnerLogoStrip />
          </div>
        </div>
      </div>

      {/* Decorative/accessible alt kept on a visually hidden label for the collage */}
      <span className="sr-only">EYFS percussion, KS3 drama, and a teenage dancer</span>
    </div>
  );
}
