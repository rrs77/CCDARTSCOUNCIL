import { PARTNER_LOGOS } from '../../config/partnerLogos';
import { PARTNER_DISCLAIMER } from './prototypeCopy';

interface PartnerLogoStripProps {
  compact?: boolean;
}

export function PartnerLogoStrip({ compact = false }: PartnerLogoStripProps) {
  return (
    <div className={compact ? '' : 'mt-auto'}>
      <ul
        className={`m-0 flex list-none flex-wrap items-center p-0 ${
          compact ? 'gap-x-4 gap-y-3' : 'gap-x-5 gap-y-3 lg:gap-x-6 lg:gap-y-4'
        }`}
        aria-label="Example organisations for demonstration"
      >
        {PARTNER_LOGOS.map((partner) => (
          <li key={partner.id} className="flex shrink-0 items-center">
            <a
              href={partner.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${partner.name} (opens in new tab)`}
              className={
                partner.onPlate
                  ? 'inline-flex items-center rounded-md bg-white/90 px-2 py-1 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-white'
                  : 'inline-flex'
              }
            >
              <img
                src={partner.src}
                alt=""
                className={`${partner.heightClass} w-auto object-contain object-left ${
                  partner.onPlate
                    ? 'max-w-[8.5rem] opacity-95 sm:max-w-[9.5rem]'
                    : 'max-w-[6.5rem] opacity-[0.62] transition-opacity hover:opacity-90 sm:max-w-[7.5rem]'
                } ${partner.invert ? 'brightness-0 invert' : ''}`}
                loading="lazy"
                decoding="async"
              />
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4 max-w-xl text-[0.75rem] font-semibold leading-relaxed text-white sm:text-[0.8rem] lg:max-w-2xl">
        {PARTNER_DISCLAIMER}
      </p>
    </div>
  );
}
