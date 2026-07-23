import { LogoSVG } from '../Logo';
import { PartnerLogoStrip } from './PartnerLogoStrip';

const HERO_IMAGE = '/login/hero-arts.jpg?v=ages-3';
const HERO_VALUE =
  'Capture ideas. Build lessons. Connect with the best arts organisations — EYFS to A-level.';
const HERO_LIGHTNING =
  'Ever lost an excellent idea? Keep every lightning moment in one place — a melting pot of ideas for arts planning.';

interface LoginHeroPanelProps {
  logoLetters?: string;
}

/**
 * Full-bleed arts hero — image spans the whole stage so EYFS / KS3 / dance
 * panels stay visible; login card floats over the right side on desktop.
 */
export function LoginHeroPanel({ logoLetters = 'CCD' }: LoginHeroPanelProps) {
  return (
    <div className="relative h-full min-h-[300px] w-full overflow-hidden text-white sm:min-h-[340px] lg:min-h-full" style={{ backgroundColor: '#002D24' }}>
      <img
        src={HERO_IMAGE}
        alt="EYFS percussion, KS3 drama, and a teenage dancer"
        className="ccd-login-hero-image absolute inset-0 h-full w-full object-cover object-center"
        decoding="async"
      />
      {/* Soft teal overlay for text readability — stronger left / bottom, image stays vivid */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(90deg, rgba(0,45,36,0.72) 0%, rgba(0,45,36,0.4) 48%, rgba(0,45,36,0.55) 100%),
            linear-gradient(180deg, rgba(0,45,36,0.2) 0%, rgba(0,45,36,0.35) 50%, rgba(0,45,36,0.88) 100%)
          `,
        }}
      />

      <div className="relative z-10 flex h-full min-h-[300px] flex-col justify-between gap-8 px-5 py-6 sm:min-h-[340px] sm:px-8 sm:py-8 lg:min-h-full lg:max-w-[58%] lg:px-12 lg:py-12 xl:px-14">
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

            <div className="ccd-login-hero-fade ccd-login-hero-fade-delay-2 mt-3 space-y-2.5 text-sm leading-relaxed text-white/90 sm:text-base lg:max-w-md lg:text-lg">
              <p>{HERO_VALUE}</p>
              <p className="text-white/85">{HERO_LIGHTNING}</p>
            </div>
          </div>

          <div className="ccd-login-hero-fade ccd-login-hero-fade-delay-3">
            <PartnerLogoStrip />
          </div>
        </div>
      </div>
    </div>
  );
}
