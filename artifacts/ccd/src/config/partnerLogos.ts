/** Partner logos for login / marketing — replace files in `public/partners/` with official brand assets. */
export interface PartnerLogo {
  id: string;
  name: string;
  /** Path from site root, e.g. `/partners/tate.svg` */
  src: string;
  /** Tailwind height class for the image */
  heightClass: string;
  /** Set true for dark logos on transparent PNG/SVG — applies CSS invert for white display */
  invert?: boolean;
}

export const PARTNER_LOGOS: PartnerLogo[] = [
  {
    id: 'royal-opera-house',
    name: 'Royal Opera House',
    src: '/partners/royal-opera-house.svg',
    heightClass: 'h-5 sm:h-6',
  },
  {
    id: 'lso',
    name: 'London Symphony Orchestra',
    src: '/partners/lso.svg',
    heightClass: 'h-6 sm:h-7',
  },
  {
    id: 'national-theatre',
    name: 'National Theatre',
    src: '/partners/national-theatre.svg',
    heightClass: 'h-5 sm:h-6',
  },
  {
    id: 'bbc-ten-pieces',
    name: 'BBC Ten Pieces',
    src: '/partners/bbc-ten-pieces.svg',
    heightClass: 'h-5 sm:h-6',
  },
  {
    id: 'tate',
    name: 'Tate',
    src: '/partners/tate.svg',
    heightClass: 'h-5 sm:h-6',
  },
  {
    id: 'national-gallery',
    name: 'The National Gallery',
    src: '/partners/national-gallery.svg',
    heightClass: 'h-6 sm:h-7',
  },
  {
    id: 'sadlers-wells',
    name: "Sadler's Wells",
    src: '/partners/sadlers-wells.svg',
    heightClass: 'h-5 sm:h-6',
  },
];
