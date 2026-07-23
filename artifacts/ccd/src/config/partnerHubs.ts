/**
 * Partner mini-hub URL slugs (e.g. `/roh`, `/lso`).
 * Accessible when signed in; linked from Partner Hubs.
 *
 * Hubs render as one continuous page: featured logo at top, org description,
 * then featured resources / Add to CCDesigner (see PartnerHubPage).
 */

export interface PartnerHubConfig {
  /** URL path segment, lowercase, no leading slash */
  slug: string;
  /** Optional alternate path segments that resolve to this hub (e.g. `wtd` → weteachdrama) */
  aliases?: string[];
  partnerLogoId: string;
  displayName: string;
  shortName: string;
  siteUrl: string;
  logoSrc: string;
  /** Whether the hub has interactive content in CCDesigner yet */
  interactive: boolean;
  /** Optional short tagline under the name */
  tagline?: string;
  /**
   * Top-of-page org description (LSO PartnerDetail pattern).
   * Shown under the featured logo on every hub.
   */
  description: string[];
  /** Primary brand color — logo hero / accents */
  primaryColor: string;
  /** Accent color for highlights */
  accentColor: string;
  /** Invert logo for dark hero strips (white wordmarks) */
  logoInvert?: boolean;
  /** Optional dark panel behind the logo (defaults to primaryColor) */
  logoPanelColor?: string;
}

export const PARTNER_HUBS: PartnerHubConfig[] = [
  {
    slug: 'roh',
    partnerLogoId: 'royal-opera-house',
    displayName: 'Royal Ballet and Opera',
    shortName: 'ROH',
    siteUrl: 'https://www.rbo.org.uk/schools/',
    logoSrc: '/partners/royal-opera-house.svg',
    interactive: true,
    tagline: 'Create & Dance resources for schools',
    description: [
      'The Royal Ballet and Opera (formerly Royal Opera House) creates world-class ballet and opera education resources for schools. Through Create & Dance, teachers can explore iconic productions with inclusive, layered lesson plans.',
      'CCDesigner links selected Create & Dance planning so you can add classroom activities and lessons locally for demos — always open official RBO Schools pages for the latest PDFs, films and teacher guidance.',
    ],
    primaryColor: '#1a1033',
    accentColor: '#C9A227',
    logoInvert: true,
    logoPanelColor: '#1a1033',
  },
  {
    slug: 'lso',
    partnerLogoId: 'lso',
    displayName: 'London Symphony Orchestra',
    shortName: 'LSO',
    siteUrl: 'https://www.lso.co.uk/learn-and-discover/',
    logoSrc: '/partners/lso.svg',
    interactive: true,
    tagline: 'LSO Discovery for the classroom',
    description: [
      'The London Symphony Orchestra is one of the world’s great orchestras, based at the Barbican in London. Through LSO Discovery, its education and community programme, the LSO creates projects, films, and classroom resources that help children meet the orchestra, its instruments, and its music.',
      'CCDesigner includes How to Build an Orchestra so teachers can plan listening, practical, and composition work alongside the orchestra’s digital activities. Other Discovery projects are linked from this hub.',
    ],
    primaryColor: '#0a1628',
    accentColor: '#3DB7E4',
    logoPanelColor: '#0a1628',
  },
  {
    slug: 'weteachdrama',
    aliases: ['wtd'],
    partnerLogoId: 'we-teach-drama',
    displayName: 'We Teach Drama',
    shortName: 'We Teach Drama',
    siteUrl: 'https://www.weteachdrama.com/',
    logoSrc: '/partners/we-teach-drama.svg',
    interactive: true,
    tagline: 'Drama schemes and classroom resources',
    description: [
      'We Teach Drama publishes classroom schemes, CPD and design resources for secondary drama teachers — from KS3 cover packs and theatre design challenge mats to GCSE AQA set-text revision (including Blood Brothers) and practitioner packs for ages 14–18.',
      'Add to CCDesigner seeds original local planning outlines with key-stage standards attached. Paid PDFs are never copied — purchase resources on the official We Teach Drama site.',
    ],
    primaryColor: '#1f2937',
    accentColor: '#F59E0B',
    /** White wordmark SVG — no invert (same pattern as LSO) */
    logoPanelColor: '#111827',
  },
  {
    slug: 'ems',
    partnerLogoId: 'essex-music-service',
    displayName: 'Essex Music Service',
    shortName: 'EMS',
    siteUrl: 'https://www.essexmusicservice.org.uk/',
    logoSrc: '/partners/essex-music-service.svg',
    interactive: true,
    tagline: 'Greater Essex Music Hub — curriculum, CPD & workshops',
    description: [
      'Essex Music Service (Greater Essex Music Hub) supports schools with curriculum platforms, instrumental learning, singing programmes, workshops and CPD across the county.',
      'This hub links the public schools brochure and curriculum pages so teachers can preview EMS provision planning in CCDesigner. Demo only — book and price via official EMS channels.',
    ],
    primaryColor: '#330968',
    accentColor: '#7a00df',
    /** White EMS wordmark SVG on dark panel (LSO-style) */
    logoPanelColor: '#330968',
  },
  {
    slug: 'icompose',
    aliases: ['icancompose'],
    partnerLogoId: 'icompose',
    displayName: 'iCompose',
    shortName: 'iCompose',
    siteUrl: 'https://www.icancompose.com/',
    logoSrc: '/partners/icompose.svg',
    interactive: true,
    tagline: 'Online composition courses for secondary musicians',
    description: [
      'iCompose offers award-winning online composing courses for secondary musicians and teachers — step-by-step lessons with exemplar listening, model compositions and video guidance, including a free Getting Started track for KS3 / GCSE beginners.',
      'Prototype Add seeds local planning stubs that link out to official course pages. Open icancompose.com for access, pricing and full materials.',
    ],
    primaryColor: '#0a1628',
    accentColor: '#5BA3D9',
    /** White wordmark SVG on dark panel (LSO / National Theatre strip style) */
    logoPanelColor: '#0a1628',
  },
  {
    slug: 'dramaresource',
    aliases: ['davidfarmer'],
    partnerLogoId: 'drama-resource',
    displayName: 'Drama Resource',
    shortName: 'Drama Resource',
    siteUrl: 'https://dramaresource.com/',
    logoSrc: '/partners/drama-resource.svg',
    interactive: true,
    tagline: 'Creative ideas for teaching drama — David Farmer',
    description: [
      'Drama Resource, directed by theatre director and author David Farmer, publishes drama games, strategies, lesson plans and CPD for primary, secondary and language teachers — from free classroom games to downloadable units and the Just Add Drama toolkit.',
      'This hub links official Drama Resource pages for planning. Add to CCDesigner seeds original local outlines that point back to dramaresource.com — paid PDFs are never copied.',
    ],
    primaryColor: '#0F3D2E',
    accentColor: '#2DD4BF',
    logoPanelColor: '#0F3D2E',
  },
  {
    slug: 'sadlerswells',
    partnerLogoId: 'sadlers-wells',
    displayName: "Sadler's Wells",
    shortName: "Sadler's Wells",
    siteUrl: 'https://www.sadlerswells.com/take-part/schools-and-colleges/',
    logoSrc: '/partners/sadlers-wells.svg',
    interactive: false,
    tagline: 'Dance and theatre for schools',
    description: [
      "Sadler's Wells is a world-leading dance organisation. Its Schools and Colleges programme helps children and young people watch, explore and learn through dance — from theatre visits to free classroom teaching resources (available on request).",
      'This hub lists official teacher and schools links. Classroom seeding in CCDesigner can be added when you choose packs to import.',
    ],
    primaryColor: '#111827',
    accentColor: '#EF4444',
    logoInvert: true,
    logoPanelColor: '#111827',
  },
  {
    slug: 'tate',
    partnerLogoId: 'tate',
    displayName: 'Tate',
    shortName: 'Tate',
    siteUrl: 'https://www.tate.org.uk/art/teaching-resource',
    logoSrc: '/partners/tate.svg',
    interactive: false,
    tagline: 'Art and ideas for learning',
    description: [
      'Tate creates art learning resources for teachers — Artist Stories, Art Makes activities and Teacher Spotlight packs — to bring artists and ideas into the classroom.',
      'This hub links the official teaching resource library. Add to CCDesigner can be wired when you choose specific packs to seed.',
    ],
    primaryColor: '#000000',
    accentColor: '#FFED00',
    logoInvert: true,
    logoPanelColor: '#000000',
  },
  {
    slug: 'nationaltheatre',
    partnerLogoId: 'national-theatre',
    displayName: 'National Theatre',
    shortName: 'National Theatre',
    siteUrl: 'https://www.nationaltheatre.org.uk/learn-explore/schools/',
    logoSrc: '/partners/national-theatre.svg',
    interactive: false,
    tagline: 'Theatre resources for schools',
    description: [
      'The National Theatre’s Learning programmes support secondary, further education and SEND/SEMH schools with free teaching resources, the National Theatre Collection (streamed productions) and teacher CPD.',
      'This hub links the Learning Hub and Collection. Example Add to CCDesigner packs can be added later.',
    ],
    primaryColor: '#1B1B1B',
    accentColor: '#E30613',
    logoInvert: true,
    logoPanelColor: '#1B1B1B',
  },
  {
    slug: 'bbctenpieces',
    partnerLogoId: 'bbc-ten-pieces',
    displayName: 'BBC Ten Pieces',
    shortName: 'BBC Ten Pieces',
    siteUrl: 'https://www.bbc.co.uk/teach/ten-pieces',
    logoSrc: '/partners/bbc-ten-pieces.svg',
    interactive: false,
    tagline: 'Classical music for every classroom',
    description: [
      'BBC Ten Pieces opens up classical music for ages 7–14 (and Early Years) with films, lesson plans, arrangements and inclusive resources — free via BBC Teach.',
      'This hub lists official lesson, CPD and inclusive resource pages. Full unit seeding in CCDesigner can be added when you pick pieces to import.',
    ],
    primaryColor: '#0B0C0C',
    accentColor: '#FF4D4D',
    logoInvert: true,
    logoPanelColor: '#0B0C0C',
  },
  {
    slug: 'nationalgallery',
    partnerLogoId: 'national-gallery',
    displayName: 'The National Gallery',
    shortName: 'National Gallery',
    siteUrl: 'https://www.nationalgallery.org.uk/learning/teachers-and-schools',
    logoSrc: '/partners/national-gallery.svg',
    interactive: false,
    tagline: 'Paintings and learning resources',
    description: [
      'The National Gallery’s Learning team supports schools with Take One Picture, free UK school sessions, teachers’ notes and CPD — helping pupils look, talk and create from paintings.',
      'This hub links Take One Picture, the learning resources search and CPD. Classroom seeding can be added when you choose painting packs to import.',
    ],
    primaryColor: '#0F3D2E',
    accentColor: '#D4A574',
    logoPanelColor: '#0F3D2E',
  },
];

export function getPartnerHubForPath(pathname: string): PartnerHubConfig | null {
  if (!pathname) return null;
  const trimmed = pathname.replace(/^\/+/, '').replace(/\/+$/, '').toLowerCase();
  if (!trimmed || trimmed.includes('/')) return null;
  return (
    PARTNER_HUBS.find((h) => h.slug === trimmed || h.aliases?.includes(trimmed)) ?? null
  );
}

export function getPartnerHubByLogoId(partnerLogoId: string): PartnerHubConfig | null {
  return PARTNER_HUBS.find((h) => h.partnerLogoId === partnerLogoId) ?? null;
}

export const PARTNER_HUB_SLUGS = new Set(
  PARTNER_HUBS.flatMap((h) => [h.slug, ...(h.aliases || [])]),
);

/** Navigate to a partner hub as a full independent page. */
export function openPartnerHub(slug: string): void {
  if (typeof window === 'undefined') return;
  window.location.assign(`/${slug}`);
}

/** Return to the main CCDesigner app (Partner Hubs tab). */
export function backToCCDesigner(tab: string = 'our-partners'): void {
  if (typeof window === 'undefined') return;
  window.location.assign(`/?tab=${encodeURIComponent(tab)}`);
}
