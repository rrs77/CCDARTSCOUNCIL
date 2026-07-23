/**
 * Per-partner mini-hub copy and official teacher-resource links.
 * Prefer real organisation URLs. Leave `resources` empty when none are verified yet.
 */

export interface PartnerHubResourceLink {
  title: string;
  href: string;
  description?: string;
  /** Optional badge, e.g. "CPD", "KS2", "PDF" */
  kind?: string;
}

export interface PartnerHubPageContent {
  slug: string;
  /** Hex for header band behind logo */
  headerBg: string;
  /** Invert white wordmark logos on dark headers */
  logoInvert?: boolean;
  siteLabel: string;
  about: string[];
  resourcesHeading?: string;
  resourcesIntro?: string;
  resources: PartnerHubResourceLink[];
  /** Shown when resources is empty */
  awaitingNote?: string;
}

export const PARTNER_HUB_CONTENT: Record<string, PartnerHubPageContent> = {
  sadlerswells: {
    slug: 'sadlerswells',
    headerBg: '#1a1a1a',
    logoInvert: true,
    siteLabel: 'sadlerswells.com/take-part/schools-and-colleges',
    about: [
      "Sadler's Wells is a world-leading dance organisation. Its Schools and Colleges programme helps children and young people watch, explore and learn through dance — from theatre visits to free classroom teaching resources.",
      'Organisation logos and linked materials are shown for planning only — they do not imply endorsement. Always open official Sadler’s Wells pages for the latest packs, workshops and booking details.',
    ],
    resourcesHeading: 'Teacher & school resources',
    resourcesIntro:
      'Free dance teaching resources (workshops and written guides) are available on request. Use the links below to explore programmes and request materials.',
    resources: [
      {
        title: 'Schools and colleges',
        href: 'https://www.sadlerswells.com/take-part/schools-and-colleges/',
        description: 'Associate Schools, Breakin’ Convention schools work, theatre visits and resources overview.',
        kind: 'Hub',
      },
      {
        title: 'Request teacher resources',
        href: 'https://www.sadlerswells.com/take-part/schools-and-colleges/teachers-resources-application-form/',
        description:
          'Apply for free pre-recorded workshops and written teaching guides covering dance styles and leading choreographers.',
        kind: 'Form',
      },
      {
        title: 'School bookings',
        href: 'https://www.sadlerswells.com/your-visit/school-bookings-at-sadlers-wells/',
        description: 'Discounted school tickets, matinees and schools newsletter signup.',
        kind: 'Visits',
      },
      {
        title: 'Making Moves',
        href: 'https://www.sadlerswells.com/take-part/making-moves-2026-27/',
        description:
          'Choreography project with digital toolkits and teacher PD workshops (supports GCSE/A Level Dance and Arts Award contexts).',
        kind: 'Project',
      },
    ],
  },

  tate: {
    slug: 'tate',
    headerBg: '#000000',
    logoInvert: true,
    siteLabel: 'tate.org.uk/art/teaching-resource',
    about: [
      'Tate creates art learning resources for teachers to bring artists and ideas into the classroom — from Artist Stories and Art Makes activities to Teacher Spotlight packs.',
      'Organisation logos and linked materials are shown for planning only — they do not imply endorsement. Always open official Tate pages for the latest resources and school visits.',
    ],
    resourcesHeading: 'Teacher resources',
    resourcesIntro:
      'Browse Tate’s teaching resource library for classroom activities, artist films and discussion prompts across ages.',
    resources: [
      {
        title: 'Art learning resources for teachers',
        href: 'https://www.tate.org.uk/art/teaching-resource',
        description: 'Searchable library of classroom resources (Artist Stories, Art Makes, Teacher Spotlight and more).',
        kind: 'Library',
      },
      {
        title: 'Schools and teachers events',
        href: 'https://www.tate.org.uk/whats-on?type=schools',
        description: 'School tours, workshops and gallery sessions at Tate sites.',
        kind: 'Visits',
      },
    ],
  },

  nationaltheatre: {
    slug: 'nationaltheatre',
    headerBg: '#1b0f0a',
    logoInvert: true,
    siteLabel: 'nationaltheatre.org.uk/learn-explore/schools',
    about: [
      'The National Theatre’s Learning programmes support secondary, further education and SEND/SEMH schools with free teaching resources, streamed productions and teacher CPD.',
      'Organisation logos and linked materials are shown for planning only — they do not imply endorsement. Always open official National Theatre pages for the latest titles and booking information.',
    ],
    resourcesHeading: 'Teacher & school resources',
    resourcesIntro:
      'Explore the Learning Hub, stream the National Theatre Collection (free for UK state schools), and find CPD for drama teachers.',
    resources: [
      {
        title: 'Secondary & Further Education schools hub',
        href: 'https://www.nationaltheatre.org.uk/learn-explore/schools/',
        description: 'Programmes, teaching resources, Collection signup and school visits overview.',
        kind: 'Hub',
      },
      {
        title: 'Teacher resources (Learning Hub)',
        href: 'https://www.nationaltheatre.org.uk/learn-explore/schools/teacher-resources/?all=true',
        description:
          'Free online library — set-text packs, learning guides, practitioners, primary guides and classroom tools.',
        kind: 'Library',
      },
      {
        title: 'National Theatre Collection',
        href: 'https://www.nationaltheatre.org.uk/learn-explore/schools/national-theatre-collection/',
        description: 'Stream 80+ filmed productions free for UK state schools and FE colleges.',
        kind: 'Streaming',
      },
      {
        title: 'Teacher CPD events',
        href: 'https://www.nationaltheatre.org.uk/learn-explore/schools/',
        description: 'Drama Teacher Conference and CPD events (see schools hub for current dates).',
        kind: 'CPD',
      },
    ],
  },

  bbctenpieces: {
    slug: 'bbctenpieces',
    headerBg: '#0b0c0c',
    logoInvert: true,
    siteLabel: 'bbc.co.uk/teach/ten-pieces',
    about: [
      'BBC Ten Pieces opens up classical music for ages 7–14 (and Early Years) with films, lesson plans, arrangements and inclusive resources — free via BBC Teach.',
      'Organisation logos and linked materials are shown for planning only — they do not imply endorsement. Always open official BBC Teach pages for the latest films and downloadable plans.',
    ],
    resourcesHeading: 'Classroom & CPD resources',
    resourcesIntro:
      'Official Ten Pieces hubs for lesson schemes, Early Years/Secondary packs, inclusive resources and teacher CPD. Use these links in planning; full unit seeding in CCDesigner can be added later.',
    resources: [
      {
        title: 'BBC Ten Pieces home',
        href: 'https://www.bbc.co.uk/teach/ten-pieces',
        description: 'Films, lesson plans, arrangements and collections overview.',
        kind: 'Hub',
      },
      {
        title: 'How to use Ten Pieces',
        href: 'https://www.bbc.co.uk/teach/ten-pieces/articles/zqsqnk7',
        description: 'Getting started guide for classroom use.',
        kind: 'Guide',
      },
      {
        title: 'Lesson plans index',
        href: 'https://www.bbc.co.uk/teach/ten-pieces/articles/z48gqp3',
        description: 'EYFS/KS1, primary and secondary schemes (up to six weeks per piece).',
        kind: 'Lessons',
      },
      {
        title: 'Early Years / KS1 resources',
        href: 'https://www.bbc.co.uk/teach/ten-pieces/articles/znvhrj6',
        description: 'Lesson plans and audio for younger children.',
        kind: 'EYFS/KS1',
      },
      {
        title: 'Secondary resources',
        href: 'https://www.bbc.co.uk/teach/ten-pieces/articles/zd28t39',
        description: 'KS3 schemes, cover lessons and composing ideas.',
        kind: 'KS3',
      },
      {
        title: 'Teacher CPD',
        href: 'https://www.bbc.co.uk/teach/ten-pieces/articles/zj8q47h',
        description: 'Virtual CPD workshop archive and related teacher development.',
        kind: 'CPD',
      },
      {
        title: 'Inclusive resources',
        href: 'https://www.bbc.co.uk/teach/ten-pieces/articles/zrq9xyc',
        description: 'Multi-sensory, Figurenotes, Soundbeam and open ensemble materials.',
        kind: 'SEND',
      },
      {
        title: 'Ensemble & orchestra leaders',
        href: 'https://www.bbc.co.uk/teach/ten-pieces/articles/zffbpg8',
        description: 'Arrangements and masterclasses for ensemble leaders.',
        kind: 'Ensembles',
      },
    ],
  },

  triborough: {
    slug: 'triborough',
    headerBg: '#1a1a1a',
    siteLabel: 'triboroughmusichub.org',
    about: [
      'Tri-Borough Music Hub (TBMH) supports music education for children and young people across Kensington & Chelsea, Hammersmith & Fulham and Westminster — including school services, tuition, singing resources and inclusive music programmes.',
      'Organisation logos and linked materials are shown for planning only — they do not imply endorsement. Always open official TBMH pages for the latest school services, tuition and events.',
    ],
    resourcesHeading: 'School & hub resources',
    resourcesIntro:
      'Official Tri-Borough Music Hub links for schools, about the hub and virtual music school. Use these in planning; classroom seeding in CCDesigner can be added later.',
    resources: [
      {
        title: 'Music Hub services for schools',
        href: 'https://www.triboroughmusichub.org/schools',
        description: 'School services overview and hub offer for schools.',
        kind: 'Schools',
      },
      {
        title: 'About Tri-Borough Music Hub',
        href: 'https://www.triboroughmusichub.org/about-us/',
        description: 'Team, strategic aims, partners and key documents.',
        kind: 'About',
      },
      {
        title: 'TBMH Virtual Music School',
        href: 'https://www.triboroughmusichub.org/tbmh-virtual-music-school',
        description: 'Virtual music school pathway and related resources.',
        kind: 'Hub',
      },
    ],
  },

  nationalgallery: {
    slug: 'nationalgallery',
    headerBg: '#0c2340',
    logoInvert: true,
    siteLabel: 'nationalgallery.org.uk/learning/teachers-and-schools',
    about: [
      'The National Gallery’s Learning team supports primary (and wider) schools with Take One Picture, free UK school sessions, teachers’ notes and CPD — helping pupils look, talk and create from paintings.',
      'Organisation logos and linked materials are shown for planning only — they do not imply endorsement. Always open official National Gallery pages for booking and the current focus painting.',
    ],
    resourcesHeading: 'Teacher & school resources',
    resourcesIntro:
      'Start with Take One Picture and the learning resources search. Classroom seeding in CCDesigner can be added when you choose specific painting packs to import.',
    resources: [
      {
        title: 'Teachers and schools (Primary)',
        href: 'https://www.nationalgallery.org.uk/learning/teachers-and-schools',
        description: 'Onsite and online sessions, Take One Picture and teacher tools overview.',
        kind: 'Hub',
      },
      {
        title: 'Take One Picture',
        href: 'https://www.nationalgallery.org.uk/learning/take-one-picture',
        description: 'Nationwide primary programme using one focus painting for cross-curricular projects.',
        kind: 'Programme',
      },
      {
        title: 'Search learning resources',
        href: 'https://www.nationalgallery.org.uk/learning/teachers-notes/teachers-notes-redirect',
        description: 'Teachers’ notes, guides and downloadable packs by painting, artist and key stage.',
        kind: 'Library',
      },
      {
        title: 'Teachers’ CPD sessions',
        href: 'https://www.nationalgallery.org.uk/learning/teachers-cpd-sessions',
        description: 'Gallery-based, online and outreach CPD for primary and secondary teachers.',
        kind: 'CPD',
      },
      {
        title: 'National Gallery Imaginarium',
        href: 'https://www.nationalgallery.org.uk/visiting/virtual-gallery/national-gallery-imaginarium',
        description: 'Virtual classroom-friendly space to explore paintings with soundscapes and prompts.',
        kind: 'Digital',
      },
      {
        title: 'Take One Picture teachers’ notes (PDF)',
        href: 'https://www.nationalgallery.org.uk/media/brjpigi1/teachers-notes-2025-26.pdf',
        description: 'Current focus-painting teachers’ notes for classroom discussion and projects.',
        kind: 'PDF',
      },
    ],
  },

  dramaresource: {
    slug: 'dramaresource',
    headerBg: '#0F3D2E',
    siteLabel: 'dramaresource.com',
    about: [
      'Drama Resource, directed by David Farmer, publishes drama games, strategies, lesson plans and CPD for primary, secondary and language teachers.',
      'Organisation logos and linked materials are shown for planning only — they do not imply endorsement. Always open official Drama Resource pages for the latest packs and booking details.',
    ],
    resourcesHeading: 'Teacher & classroom resources',
    resourcesIntro:
      'Free drama games plus downloadable lesson plans, Just Add Drama and CPD. Prototype Add for Ten Second Objects is available on the interactive hub.',
    resources: [
      {
        title: 'Drama games',
        href: 'https://dramaresource.com/drama-games/',
        description: 'Warm-ups, improvisation, concentration and group dynamics activities.',
        kind: 'Games',
      },
      {
        title: 'Drama strategies',
        href: 'https://dramaresource.com/drama-strategies/',
        description: 'Teacher-in-role, freeze-frames and classroom techniques.',
        kind: 'Strategies',
      },
      {
        title: 'Drama lesson plans',
        href: 'https://dramaresource.com/lesson-plans/',
        description: 'Downloadable units linked to stories, themes and practitioners.',
        kind: 'Lessons',
      },
      {
        title: 'Ten Second Objects',
        href: 'https://dramaresource.com/ten-second-objects/',
        description: 'Classic body-shape warm-up game (featured Add to CCDesigner seed).',
        kind: 'Game',
      },
      {
        title: 'Just Add Drama',
        href: 'https://dramaresource.com/just-add-drama/',
        description: 'Creative Teacher’s Toolkit — online course, videos and lesson plans.',
        kind: 'Course',
      },
      {
        title: 'Drama CPD / INSET',
        href: 'https://dramaresource.com/drama-cpd-courses-inset/',
        description: 'Courses and training with David Farmer.',
        kind: 'CPD',
      },
    ],
  },
};

export function getPartnerHubContent(slug: string): PartnerHubPageContent | null {
  return PARTNER_HUB_CONTENT[slug] ?? null;
}
