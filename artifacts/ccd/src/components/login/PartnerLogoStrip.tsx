import { PARTNER_LOGOS } from '../../config/partnerLogos';

interface PartnerLogoStripProps {
  compact?: boolean;
}

export function PartnerLogoStrip({ compact = false }: PartnerLogoStripProps) {
  return (
    <div className={compact ? '' : 'mt-auto'}>
      <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/45">
        Supported by
      </p>
      <ul
        className={`m-0 flex list-none flex-wrap items-center p-0 ${
          compact ? 'gap-x-5 gap-y-4' : 'gap-x-6 gap-y-4 lg:gap-x-8 lg:gap-y-5'
        }`}
        aria-label="Partner organisations"
      >
        {PARTNER_LOGOS.map((partner) => (
          <li key={partner.id} className="flex shrink-0 items-center">
            <img
              src={partner.src}
              alt={partner.name}
              className={`${partner.heightClass} w-auto max-w-[9.5rem] object-contain object-left opacity-85 transition-opacity hover:opacity-100 sm:max-w-[11rem] ${
                partner.invert ? 'brightness-0 invert' : ''
              }`}
              loading="lazy"
              decoding="async"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
