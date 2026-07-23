import { LogoSVG } from '../Logo';
import { PartnerLogoStrip } from './PartnerLogoStrip';

const HERO_IMAGE = '/login/hero-arts.jpg?v=ages-3';
const HERO_VALUE =
  'Capture ideas. Build lessons. Connect with the best arts organisations — EYFS to A-level.';

interface LoginHeroPanelProps {
  logoLetters?: string;
}

/**
 * Full-bleed arts hero — image spans the whole stage so EYFS / KS3 / dance
 * panels stay visible; login card floats over the right side on desktop.
 * On small viewports the panel grows with content so partner logos + disclaimer
 * stay fully readable above the stacked login card.
 */
export function LoginHeroPanel({ logoLetters = 'CCD' }: LoginHeroPanelProps) {
  return (
    <div
      className="relative w-full text-white lg:h-full lg:min-h-full"
      style={{ backgroundColor: '#002D24' }}
    >
      {/* Image layer clipped separately so ken-burns scale never crops copy */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <img
          src={HERO_IMAGE}
          alt=""
          className="ccd-login-hero-image absolute inset-0 h-full w-full object-cover object-center"
          decoding="async"
        />
        {/* Soft teal overlay for text readability — stronger left / bottom, image stays vivid */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(90deg, rgba(0,45,36,0.72) 0%, rgba(0,45,36,0.4) 48%, rgba(0,45,36,0.55) 100%),
              linear-gradient(180deg, rgba(0,45,36,0.2) 0%, rgba(0,45,36,0.35) 50%, rgba(0,45,36,0.88) 100%)
            `,
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-[300px] flex-col justify-between gap-8 px-5 py-6 pb-8 sm:min-h-[340px] sm:px-8 sm:py-8 sm:pb-10 lg:h-full lg:min-h-full lg:max-w-[58%] lg:px-12 lg:py-12 lg:pb-12 xl:px-14">
        <LogoSVG size="lg" showText={false} letters={logoLetters} className="!space-x-0 ccd-login-hero-fade" />

        <div className="flex flex-col gap-6 lg:gap-8">
          <div className="max-w-xl">
            <h1
              className="ccd-login-hero-fade ccd-login-hero-fade-delay-1 text-[1.65rem] font-semibold leading-[1.12] tracking-tight text-white sm:text-[2rem] lg:text-[2.45rem] xl:text-[2.7rem]"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              Exceptional lessons start with{' '}
              <span
                className="italic font-normal"
                style={{ color: '#B6FF7E', fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                connection
              </span>
            </h1>

            <p className="ccd-login-hero-fade ccd-login-hero-fade-delay-2 mt-3 text-sm leading-relaxed text-white/90 sm:text-base lg:max-w-md lg:text-lg">
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
