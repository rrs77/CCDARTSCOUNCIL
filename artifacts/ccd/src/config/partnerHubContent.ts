/**
 * Per-partner mini-hub copy and official teacher-resource links.
 * Prefer real organisation URLs. Leave `resources` empty when none are verified yet.
 */

import { jnDreamHostFileUrl } from './jazzNorthDreamHost';

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
      "This hub includes mock product pages for Groove'n'Play and Music Makes Me (example course notes + Add showcase lesson for PDF export). Demo only — access resources via the official Tri-Borough Music Hub site.",
    ],
    resourcesHeading: 'School & hub resources',
    resourcesIntro:
      "Mock programme pages (Groove'n'Play, Music Makes Me) seed detailed showcase lessons for PDF export. Official links below for Virtual Music School, curriculum guidance and school services.",
    resources: [
      {
        title: 'Music Hub services for schools',
        href: 'https://www.triboroughmusichub.org/schools',
        description: 'School services overview and hub offer for schools.',
        kind: 'Schools',
      },
      {
        title: 'Curriculum guidance for schools',
        href: 'https://www.triboroughmusichub.org/school-services/curriculum-guidance-for-schools/',
        description: 'Free support documents and teaching materials (birth–25).',
        kind: 'Guidance',
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
        description: '1,500+ online resources for schools.',
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
      'Landscape scrollers for David Farmer’s books and drama games (click through to dramaresource.com), plus Just Add Drama and CPD. Prototype Add for Ten Second Objects is on the interactive hub.',
    resources: [
      {
        title: 'Drama games',
        href: 'https://dramaresource.com/drama-games/',
        description: 'Warm-ups, improvisation, concentration and group dynamics — click images on the hub to open each game.',
        kind: 'Games',
      },
      {
        title: "David Farmer's books",
        href: 'https://dramaresource.com/drama-books-by-david-farmer/',
        description: '101 Drama Games, Learning Through Drama, Drop of a Hat, Playful Plays and more.',
        kind: 'Books',
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

  jazznorth: {
    slug: 'jazznorth',
    headerBg: '#1A0A14',
    siteLabel: 'jazznorth.org',
    about: [
      'Jazz North is the strategic development agency for jazz in the North of England, with programmes in Artist Development, Sector Support and Learning & Participation — including free improvisation resources for schools.',
      'Organisation logos and linked materials are shown for planning only — they do not imply endorsement. Always open official Jazz North pages for the latest packs, camps and booking details.',
    ],
    resourcesHeading: 'Teacher & learning resources',
    resourcesIntro:
      'Classroom worksheets download from Rhythmstix/DreamHost on the interactive hub, plus Learning Resources Area, Mr Big, Playlist Project, Jazz Camp for Girls and Educators’ Forums.',
    resources: [
      {
        title: 'Learning Resources Area',
        href: 'https://www.jazznorth.org/learning-resources-area',
        description:
          'Free downloadable improvisation pathways for KS1–4 teachers, instrumental tutors and lifetime learners (account required).',
        kind: 'Library',
      },
      {
        title: 'Can You Sing Your Song? — Activities',
        href: jnDreamHostFileUrl('canYouSingActivities'),
        description: 'Classroom activities worksheet (DreamHost direct download).',
        kind: 'PDF',
      },
      {
        title: 'Hello Song — Activities',
        href: jnDreamHostFileUrl('helloActivities'),
        description: 'Hello Song activities worksheet (DreamHost direct download).',
        kind: 'PDF',
      },
      {
        title: '2 and 4 Chant — Activities',
        href: jnDreamHostFileUrl('chantActivities'),
        description: '2 and 4 Chant activities worksheet (DreamHost direct download).',
        kind: 'PDF',
      },
      {
        title: 'Ways into Improvisation',
        href: jnDreamHostFileUrl('waysIntoImprov'),
        description: 'Improvisation guide for classroom use (DreamHost direct download).',
        kind: 'PDF',
      },
      {
        title: 'Mr Big scheme of work',
        href: 'https://www.jazznorth.org/mr-big-scheme-of-work',
        description: 'KS1 active listening scheme inspired by Ed Vere’s Mr Big (featured Add seed).',
        kind: 'KS1',
      },
      {
        title: 'Playlist Project',
        href: 'https://www.jazznorth.org/playlist-project',
        description: 'KS2 Milestones listening pathway — repeated listening to active activities to live/video culmination.',
        kind: 'KS2',
      },
      {
        title: 'Jazz Camp for Girls',
        href: 'https://www.jazznorth.org/jazz-camp-for-girls',
        description: 'Award-winning improvisation camps for young female musicians across the North.',
        kind: 'Camps',
      },
      {
        title: 'Educators’ Forum',
        href: 'https://www.jazznorth.org/news/educators-forum-june-2026',
        description: 'Termly online forums on improvisation pedagogy and youth jazz ensembles.',
        kind: 'CPD',
      },
      {
        title: 'Northern Line',
        href: 'https://www.jazznorth.org/northern-line',
        description: 'Live talent development programme for northern jazz artists.',
        kind: 'Artists',
      },
      {
        title: 'About / mission',
        href: 'https://www.jazznorth.org/what-we-do',
        description: 'Mission, vision and Learning & Participation overview.',
        kind: 'About',
      },
    ],
  },

  rsc: {
    slug: 'rsc',
    headerBg: '#111111',
    logoInvert: true,
    siteLabel: 'rsc.org.uk/learn/schools-and-teachers',
    about: [
      'RSC Education supports schools and teachers with rehearsal-room approaches to Shakespeare — from Key Stage 1 to A-Level — including teacher packs, activity toolkits, Associate Schools and the Shakespeare Curriculum platform.',
      'Organisation logos and linked materials are shown for planning only — they do not imply endorsement. Always open official RSC pages for the latest packs, events and booking details.',
    ],
    resourcesHeading: 'Teacher & school resources',
    resourcesIntro:
      'Official RSC Education links: the Shakespeare Curriculum platform, free teacher packs for set texts, activity toolkits, inclusive Signing Shakespeare resources, literacy packs, and school visit / Associate Schools programmes.',
    resources: [
      {
        title: 'Shakespeare Curriculum',
        href: 'https://www.rsc.org.uk/learn/shakespeare-curriculum',
        description:
          'KS3–4 platform with lesson plans, films, Digital Playtext and assessments — free for UK state-funded secondary schools. Macbeth live now; Romeo and Juliet suite launching Autumn 2026.',
        kind: 'Platform',
      },
      {
        title: 'Shakespeare Curriculum (sign up)',
        href: 'https://www.shakespearecurriculum.com/',
        description: 'Open the curriculum platform to explore plays and register your school.',
        kind: 'Sign up',
      },
      {
        title: 'Teacher resources library',
        href: 'https://www.rsc.org.uk/learn/schools-and-teachers/teacher-resources',
        description: 'Search lesson plans, teacher packs, videos and production images from KS1 to A-Level.',
        kind: 'Library',
      },
      {
        title: 'Macbeth Teacher Pack 2023',
        href: 'https://www.rsc.org.uk/learn/schools-and-teachers/teacher-resources/macbeth-teacher-pack-2023',
        description: 'KS3–4 rehearsal-room activities, edited scenes and printable PDFs for the 2023 production.',
        kind: 'KS3–4',
      },
      {
        title: 'Romeo and Juliet Pack 2024',
        href: 'https://www.rsc.org.uk/learn/schools-and-teachers/teacher-resources/romeo-and-juliet-pack-2024',
        description: 'Teacher pack supporting classroom study of Romeo and Juliet.',
        kind: 'KS3–4',
      },
      {
        title: 'Othello Teacher Pack 2024',
        href: 'https://www.rsc.org.uk/learn/schools-and-teachers/teacher-resources/othello-teacher-pack-2024',
        description: 'Classroom activities and production context for Othello.',
        kind: 'KS4–5',
      },
      {
        title: 'Hamlet Teacher Pack 2025',
        href: 'https://www.rsc.org.uk/learn/schools-and-teachers/teacher-resources/hamlet-teacher-pack-2025',
        description: 'Latest Hamlet teacher pack for secondary classrooms.',
        kind: 'KS4–5',
      },
      {
        title: 'The Tempest Teacher Pack 2025',
        href: 'https://www.rsc.org.uk/learn/schools-and-teachers/teacher-resources/the-tempest-teacher-pack-2025',
        description: '2025 Tempest pack with rehearsal-room approaches.',
        kind: 'KS3–4',
      },
      {
        title: 'Twelfth Night Teacher Pack 2024',
        href: 'https://www.rsc.org.uk/learn/schools-and-teachers/teacher-resources/twelfth-night-teacher-pack-2024',
        description: 'Teacher pack for Twelfth Night study and performance visits.',
        kind: 'KS3–4',
      },
      {
        title: 'Activity toolkits',
        href: 'https://www.rsc.org.uk/learn/schools-and-teachers/teacher-resources/activity-toolkits',
        description: 'Short 15-minute creative activities (e.g. Macbeth toolkit) for classroom, remote and blended learning.',
        kind: 'Activities',
      },
      {
        title: 'Signing Shakespeare: Macbeth',
        href: 'https://www.rsc.org.uk/learn/schools-and-teachers/teacher-resources/signing-shakespeare-for-deaf-students',
        description: 'Scheme of work and films for KS3–4 Deaf and hard-of-hearing students — adaptable for all learners.',
        kind: 'Inclusive',
      },
      {
        title: 'Tales From Shakespeare literacy packs',
        href: 'https://www.rsc.org.uk/learn/schools-and-teachers/teacher-resources/shakespeare-and-literacy-resources',
        description: 'KS1–3 writing activities inspired by Michael Morpurgo’s Tales from Shakespeare.',
        kind: 'KS1–3',
      },
      {
        title: 'First Encounters',
        href: 'https://www.rsc.org.uk/learn/first-encounters',
        description: 'First Encounters programme — early Shakespeare experiences for schools.',
        kind: 'Programme',
      },
      {
        title: 'First Encounters · King Lear pack (PDF)',
        href: 'https://cdn2.rsc.org.uk/sitefinity/education-pdfs/teacher-packs/first-encounters-king-lear-learning-pack-2025.pdf',
        description: '2025 First Encounters King Lear learning pack (downloadable PDF).',
        kind: 'PDF',
      },
      {
        title: 'Schools and teachers hub',
        href: 'https://www.rsc.org.uk/learn/schools-and-teachers/',
        description: 'Events, workshops, CPD, partnerships and programmes overview.',
        kind: 'Hub',
      },
      {
        title: 'Events and workshops for students',
        href: 'https://www.rsc.org.uk/learn/schools-and-teachers/events-and-workshops-for-students',
        description: 'Student workshops, events and creative engagement opportunities.',
        kind: 'Workshops',
      },
      {
        title: 'Planning an education visit',
        href: 'https://www.rsc.org.uk/learn/planning-an-education-visit',
        description: 'How to bring a group to Stratford — visits, tours and practical planning.',
        kind: 'Visits',
      },
      {
        title: 'Associate Schools Programme',
        href: 'https://www.rsc.org.uk/learn/associate-schools-programme',
        description: 'In-depth partnership programme for schools embedding RSC approaches.',
        kind: 'Partnership',
      },
      {
        title: 'Young people',
        href: 'https://www.rsc.org.uk/learn/young-people',
        description: 'RSC programmes and opportunities for young people beyond the classroom.',
        kind: 'Youth',
      },
      {
        title: 'Matilda The Musical · school resources',
        href: 'https://uk.matildathemusical.com/schools/#Performance-Rights',
        description: 'Official Matilda school resources and performance-rights information.',
        kind: 'Musical',
      },
    ],
  },

  bristololdvic: {
    slug: 'bristololdvic',
    headerBg: '#111111',
    logoInvert: true,
    siteLabel: 'bristololdvic.org.uk/teacher-resources',
    about: [
      'Bristol Old Vic’s Learning team supports schools with free RE:SOURCES heritage packs, production education packs, school visits, workshops and Young Company programmes at Britain’s oldest continually working theatre.',
      'Organisation logos and linked materials are shown for planning only — they do not imply endorsement. Always open official Bristol Old Vic pages for the latest packs and school bookings.',
    ],
    resourcesHeading: 'Teacher & school resources',
    resourcesIntro:
      'Download heritage RE:SOURCES packs and production education packs, or book a school visit with workshops and post-show talks.',
    resources: [
      {
        title: 'Teacher resources (RE:SOURCES)',
        href: 'https://bristololdvic.org.uk/teacher-resources',
        description: 'Heritage classroom packs developed with Lighting Up Learning, University of Bristol Theatre Collection and Bristol Archives.',
        kind: 'Library',
      },
      {
        title: 'Take part · teacher resources',
        href: 'https://bristololdvic.org.uk/take-part/teacher-resources',
        description: 'RE:SOURCES packs plus production education packs (primary to post-16).',
        kind: 'Packs',
      },
      {
        title: 'Schools visits',
        href: 'https://bristololdvic.org.uk/your-visit/schools',
        description: 'School ticket rates, workshops, post-show talks and booking support.',
        kind: 'Visits',
      },
    ],
  },

  kneehigh: {
    slug: 'kneehigh',
    headerBg: '#1a0a0a',
    logoInvert: true,
    siteLabel: 'thisiskneehigh.co.uk/item-categories/education',
    about: [
      'Kneehigh created joyful, anarchic theatre for over 40 years. Their education Cookbook and archive — study guides, interviews, design notes and devising exercises — are preserved by Falmouth University at This is Kneehigh.',
      'Organisation logos and linked materials are shown for planning only — they do not imply endorsement. Always open the official archive for the latest digitised items.',
    ],
    resourcesHeading: 'Education archive',
    resourcesIntro:
      'Browse This is Kneehigh education holdings for KS4/KS5 practitioner study — Cookbook-style teaching materials, production notes and devising kits.',
    resources: [
      {
        title: 'Education archive',
        href: 'https://thisiskneehigh.co.uk/item-categories/education/',
        description: 'Study guides, Shadow Kit exercises, memory notes and education programme materials.',
        kind: 'Archive',
      },
      {
        title: 'This is Kneehigh home',
        href: 'https://thisiskneehigh.co.uk/',
        description: 'Full digital archive of shows, photographs, interviews and devising records.',
        kind: 'Hub',
      },
      {
        title: 'Shows index',
        href: 'https://thisiskneehigh.co.uk/',
        description: 'Explore productions such as Tristan & Yseult, Brief Encounter and Dead Dog in a Suitcase.',
        kind: 'Shows',
      },
    ],
  },
};

export function getPartnerHubContent(slug: string): PartnerHubPageContent | null {
  return PARTNER_HUB_CONTENT[slug] ?? null;
}
