/** Partner logos for login / marketing — replace files in `public/partners/` with official brand assets. */
export interface PartnerLogo {
  id: string;
  name: string;
  /** Path from site root, e.g. `/partners/tate.svg` */
  src: string;
  /** Official organisation website */
  href: string;
  /** Tailwind height class for the image */
  heightClass: string;
  /** Set true for dark logos on transparent PNG/SVG — applies CSS invert for white display */
  invert?: boolean;
  /**
   * Soft white plate behind the logo (for dark / full-colour assets on the green hero).
   * Prefer this over invert when the logo needs its brand colours preserved.
   */
  onPlate?: boolean;
}

export const PARTNER_LOGOS: PartnerLogo[] = [
  {
    id: 'royal-opera-house',
    name: 'Royal Opera House',
    src: '/partners/royal-opera-house.svg',
    href: 'https://www.roh.org.uk/',
    heightClass: 'h-5 sm:h-6',
  },
  {
    id: 'lso',
    name: 'London Symphony Orchestra',
    src: '/partners/lso.svg',
    href: 'https://www.lso.co.uk/',
    heightClass: 'h-6 sm:h-7',
  },
  {
    id: 'national-theatre',
    name: 'National Theatre',
    src: '/partners/national-theatre.svg',
    href: 'https://www.nationaltheatre.org.uk/',
    heightClass: 'h-5 sm:h-6',
  },
  {
    id: 'bbc-ten-pieces',
    name: 'BBC Ten Pieces',
    src: '/partners/bbc-ten-pieces.svg',
    href: 'https://www.bbc.co.uk/teach/ten-pieces',
    heightClass: 'h-5 sm:h-6',
  },
  {
    id: 'tate',
    name: 'Tate',
    src: '/partners/tate.svg',
    href: 'https://www.tate.org.uk/',
    heightClass: 'h-5 sm:h-6',
  },
  {
    id: 'national-gallery',
    name: 'The National Gallery',
    src: '/partners/national-gallery.svg',
    href: 'https://www.nationalgallery.org.uk/',
    heightClass: 'h-7 sm:h-8',
  },
  {
    id: 'sadlers-wells',
    name: "Sadler's Wells",
    src: '/partners/sadlers-wells.svg',
    href: 'https://www.sadlerswells.com/',
    heightClass: 'h-5 sm:h-6',
  },
  {
    id: 'we-teach-drama',
    name: 'We Teach Drama',
    src: '/partners/we-teach-drama.svg',
    href: 'https://www.weteachdrama.com/',
    heightClass: 'h-5 sm:h-6',
  },
  {
    id: 'essex-music-service',
    name: 'Essex Music Service',
    src: '/partners/essex-music-service.svg',
    href: 'https://www.essexmusicservice.org.uk/',
    heightClass: 'h-6 sm:h-7',
  },
  {
    id: 'icompose',
    name: 'iCompose',
    src: '/partners/icompose.svg',
    href: 'https://www.icancompose.com/',
    heightClass: 'h-6 sm:h-7',
  },
  {
    id: 'drama-resource',
    name: 'Drama Resource',
    src: '/partners/drama-resource.svg',
    href: 'https://dramaresource.com/',
    heightClass: 'h-6 sm:h-7',
  },
];
