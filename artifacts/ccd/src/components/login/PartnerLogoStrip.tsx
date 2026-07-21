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
              className="inline-flex"
            >
              <img
                src={partner.src}
                alt=""
                className={`${partner.heightClass} w-auto max-w-[6.5rem] object-contain object-left opacity-50 transition-opacity hover:opacity-70 sm:max-w-[7.5rem] ${
                  partner.invert ? 'brightness-0 invert' : ''
                }`}
                loading="lazy"
                decoding="async"
              />
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4 max-w-xl text-[0.65rem] leading-relaxed text-white/95 sm:text-[0.7rem] lg:max-w-2xl">
        {PARTNER_DISCLAIMER}
      </p>
    </div>
  );
}
