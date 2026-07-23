/**
 * KS2 Dance — Romeo and Juliet (Royal Ballet and Opera / Create & Dance).
 *
 * Seeds categories, activities, Year 5–6 lessons, and a lesson stack from
 * RBO Schools classroom resources (lesson plans, cheat sheets, slides, curriculum map).
 *
 * Sources:
 *  - https://www.rbo.org.uk/schools/course/romeo-and-juliet-ks2
 *  - https://www.rbo.org.uk/schools/resource/classroom-resources
 *  - Per-lesson pages under /schools/lesson/…?allow=true
 *
 * Usage: await setupROHRomeoJuliet() | await setupROHRomeoJuliet({ force: true })
 */

import type { Activity, LessonData } from '../contexts/DataContext';
import type { StackedLesson } from '../hooks/useLessonStacks';
import { ROH_FOLDER_NAME, ROH_LOGO_SRC, RJ_PROJECT_PREFIX } from './rohBranding';
import { CCD_CATEGORIES_UPDATED_EVENT } from './setupLSOYear6';
import { notifyHubActivitiesUpdated } from './hubSeedLocal';
import { starActivityObjectsLocally, getActivityStarKey } from './activityStars';
import {
  PARTNER_PLANNING_ORGS,
  registerPartnerPlanningPack,
} from './partnerPlanning';

const COURSE_URL = 'https://www.rbo.org.uk/schools/course/romeo-and-juliet-ks2';
const CLASSROOM_RESOURCES = 'https://www.rbo.org.uk/schools/resource/classroom-resources';
const RESOURCE_BANK = 'https://www.rbo.org.uk/schools/lesson/romeo--juliet-resource-bank?allow=true';
const PEDAGOGY =
  'https://www.rbo.org.uk/schools/lesson/create-and-dance-pedagogy-and-approaches?allow=true';
const CINEMA =
  'https://www.roh.org.uk/schools/lesson/roh-classroom-cinema-create-and-dance?allow=true';
const KS2_RESOURCES = 'https://www.rbo.org.uk/schools/resource/ks2resources';
const RBO_SCHOOLS_LOGO = 'https://static.roh.org.uk/logos/RBO_schools_left.svg';

/** Public RBO Create & Dance Romeo & Juliet document bucket */
const S3_CAD_RJ =
  'https://s3.eu-west-1.amazonaws.com/static.roh.org.uk/learning-platform/Documents/CAD+R%26J';

const CURRICULUM_MAP_PDF = `${S3_CAD_RJ}/C%26D+Romeo+%26+Juliet+-+Curriculum+Map.pdf`;
const SYNOPSIS_PDF = `${S3_CAD_RJ}/C%26D+Romeo+%26+Juliet+-+Synopsis%2C+Character+Images+%26+Descriptions.pdf`;

const LESSON_URLS = [
  'https://www.rbo.org.uk/schools/lesson/romeo-and-juliet-explorer-getting-started-romeo-and-juliet?allow=true',
  'https://www.rbo.org.uk/schools/lesson/romeo-and-juliet-developing-movement-patterns-conveying-mood?allow=true',
  'https://www.rbo.org.uk/schools/lesson/exploring-a-theme-time-signatures?allow=true',
  'https://www.rbo.org.uk/schools/lesson/romeo-and-juliet-explorer-working-together-creating-highlights?allow=true',
  'https://www.rbo.org.uk/schools/lesson/romeo-and-juliet-explorer-rehearsal-and-performance-counterpoint?allow=true',
] as const;

type LessonAssets = {
  planPdf: string;
  cheatPdf: string;
  slidesPptx: string;
  filmUnitUrl?: string;
};

const LESSON_ASSETS: LessonAssets[] = [
  {
    planPdf: `${S3_CAD_RJ}/R%26J-Lesson+1+Plan.pdf`,
    cheatPdf: `${S3_CAD_RJ}/R%26J-Lesson+1+Cheat+Sheet.pdf`,
    slidesPptx: `${S3_CAD_RJ}/C%26D+R%26J+Lesson+1+-+Getting+Started.pptx`,
    filmUnitUrl: 'https://www.rbo.org.uk/schools/unit/romeo-and-juliet-video-getting-started1',
  },
  {
    planPdf: `${S3_CAD_RJ}/R%26J-Lesson+2+Plan.pdf`,
    cheatPdf: 'https://static.roh.org.uk/learning-platform/Documents/CAD+R%26J/R%26J-Lesson+2+Cheat+Sheet.pdf',
    slidesPptx: `${S3_CAD_RJ}/C%26D+R%26J+Lesson+2+-+Conveying+Mood.pptx`,
  },
  {
    planPdf: `${S3_CAD_RJ}/R%26J-Lesson+3+Plan.pdf`,
    cheatPdf: `${S3_CAD_RJ}/R%26J-Lesson+3+Cheat+Sheet.pdf`,
    slidesPptx: `${S3_CAD_RJ}/C%26D+R%26J+Lesson+3+-+Time+Signatures.pptx`,
  },
  {
    planPdf: `${S3_CAD_RJ}/R%26J-Lesson+4+Plan.pdf`,
    cheatPdf: `${S3_CAD_RJ}/R%26J-Lesson+4+Cheat+Sheet.pdf`,
    slidesPptx: `${S3_CAD_RJ}/C%26D+R%26J+Lesson+4+-+Creating+Highlights.pptx`,
  },
  {
    planPdf: `${S3_CAD_RJ}/R%26J-Lesson+5+Plan.pdf`,
    cheatPdf: `${S3_CAD_RJ}/R%26J-Lesson+5+Cheat+Sheet.pdf`,
    slidesPptx: `${S3_CAD_RJ}/C%26D+R%26J+Lesson+5+-+Counterpoint.pptx`,
  },
];

const SHEET_ID = 'Year5';
const FOLDER = ROH_FOLDER_NAME;
const UNIT = 'Romeo and Juliet';
const STACK_NAME = 'Romeo and Juliet (ROH KS2)';
const LEVEL = 'KS2';
const YEAR_GROUPS = ['Year5', 'Year 5', 'Year6', 'Year 6'];
const MARKER_KEY = 'ccd-roh-rj-seeded-v2';
const STACK_ID_KEY = 'ccd-roh-rj-lesson-stack-id';
const LESSON_KEYS_KEY = 'ccd-roh-rj-lesson-keys';
const ACADEMIC_YEAR = '2026-2027';
const SEED_NOTE = 'ROH_RJ_SEED:Romeo and Juliet';

const CAT = {
  warmup: `${RJ_PROJECT_PREFIX} — Warm-up`,
  explore: `${RJ_PROJECT_PREFIX} — Explore`,
  create: `${RJ_PROJECT_PREFIX} — Create`,
  perform: `${RJ_PROJECT_PREFIX} — Perform`,
} as const;

const ALL_CATEGORIES = Object.values(CAT);

type SeedActivity = Omit<
  Activity,
  'id' | '_id' | 'videoLink' | 'musicLink' | 'backingLink' | 'vocalsLink' | 'imageLink' | 'resourceLink'
> & {
  videoLink?: string;
  musicLink?: string;
  backingLink?: string;
  vocalsLink?: string;
  imageLink?: string;
  resourceLink?: string;
  unitLesson: number;
};

function act(
  partial: Omit<SeedActivity, 'level' | 'yearGroups' | 'teachingUnit' | 'unitName' | 'link' | 'lessonNumber'> & {
    link?: string;
    category: string;
    unitLesson: number;
  },
): SeedActivity {
  const lessonUrl = LESSON_URLS[partial.unitLesson - 1] || COURSE_URL;
  const assets = LESSON_ASSETS[partial.unitLesson - 1];
  return {
    ...partial,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    teachingUnit: UNIT,
    unitName: UNIT,
    lessonNumber: String(partial.unitLesson),
    link: partial.link ?? lessonUrl,
    videoLink: partial.videoLink || assets?.filmUnitUrl || CINEMA,
    musicLink: partial.musicLink || RESOURCE_BANK,
    backingLink: partial.backingLink || '',
    resourceLink: partial.resourceLink || assets?.planPdf || CURRICULUM_MAP_PDF,
    vocalsLink: partial.vocalsLink || '',
    imageLink: partial.imageLink || ROH_LOGO_SRC,
    descriptionHeading: 'Introduction/Context',
    activityHeading: 'Activity',
    linkHeading: 'RBO resources',
  };
}

const LESSON_META: Record<
  number,
  {
    title: string;
    learningOutcome: string;
    successCriteria: string;
    introduction: string;
    mainActivity: string;
    plenary: string;
    vocabulary: string;
    keyQuestions: string;
    resources: string;
  }
> = {
  1: {
    title: 'Getting started — Meet the Characters',
    learningOutcome:
      'LO1: To understand use of actions and dynamics to embody a character (see RBO Curriculum Map).',
    successCriteria:
      'I can show character through action and dynamics; I can create a short character motif safely.',
    introduction:
      'Meet Director Kevin O’Hare and Principal Dancers; discover MacMillan’s ballet and Prokofiev’s score.',
    mainActivity:
      'Prepare (film + characters + Verona’s Market warm-up) → Explore musical motifs → Create a character motif → Share.',
    plenary: 'Share & Celebrate; Cool Down: Music conductor.',
    vocabulary: 'motif, dynamics, Capulet, Montague, character, Prokofiev, MacMillan',
    keyQuestions:
      'Who is the choreographer / composer? What is a motif? What does dynamics mean?',
    resources: 'Lesson plan PDF, cheat sheet, slides, synopsis PDF, Getting Started film',
  },
  2: {
    title: 'Conveying mood',
    learningOutcome: 'LO1: To understand use of space and dynamics to convey mood.',
    successCriteria:
      'I can change mood with space and dynamics; I can develop a pas de deux idea with a partner.',
    introduction: 'Recap; introduce Balcony vs Crypt contrasting scenes.',
    mainActivity:
      'Warm-up Opposites pas de deux → Explore contrasting moods → Create Conveying Mood pas de deux.',
    plenary: 'Share & Celebrate; Cool Down: Music conductor.',
    vocabulary: 'mood, space, dynamics, pas de deux, Balcony, Crypt, contrast',
    keyQuestions: 'What makes the Balcony feel different from the Crypt?',
    resources: 'Lesson 2 plan PDF, cheat sheet, slides, synopsis PDF, Resource Bank music',
  },
  3: {
    title: 'Time signatures',
    learningOutcome:
      'Dancers feel time signatures through dynamics and shape — Dance of the Knights (4/4) and Mandolin Dance (waltz feel).',
    successCriteria: 'I can move in 4 and in 3; I can keep a steady pulse with the group.',
    introduction: 'Introduce time signatures linked to Prokofiev excerpts.',
    mainActivity:
      'Rhythm circle warm-up → Explore time-signature shapes → Create a time-signature motif.',
    plenary: 'Share & Celebrate; Cool Down: Music conductor in 3/4.',
    vocabulary: 'pulse, time signature, march, waltz, phrasing, Dance of the Knights, Mandolin',
    keyQuestions: 'How does the music’s pulse change our movement?',
    resources: 'Lesson 3 plan PDF, cheat sheet, slides, Resource Bank music',
  },
  4: {
    title: 'Creating highlights',
    learningOutcome:
      'Dancers create impact through highlights, unison, and action & reaction to build tension.',
    successCriteria: 'I can use a highlight moment; I can respond to a partner’s action.',
    introduction: 'Introduce highlights and working together.',
    mainActivity:
      'Unison highlights warm-up → Explore action and reaction → Create Montague & Capulet motifs.',
    plenary: 'Share & Celebrate; Cool Down: Dance of the Knights Révérence.',
    vocabulary: 'highlight, unison, action and reaction, tension, Montague, Capulet',
    keyQuestions: 'Where is the strongest moment in your phrase, and why?',
    resources: 'Lesson 4 plan PDF, cheat sheet, slides',
  },
  5: {
    title: 'Counterpoint and choreography',
    learningOutcome:
      'Dancers explore counterpoint, set a structure, rehearse, and share their Romeo and Juliet dance.',
    successCriteria: 'I can dance my part against another group; I can rehearse with focus.',
    introduction: 'Introduce counterpoint; recap motifs from the unit.',
    mainActivity:
      'Counterpoint warm-up → Recap motifs → Structure your Romeo and Juliet dance → Share.',
    plenary: 'Share the class dance; Cool Down: Dance of the Knights Révérence.',
    vocabulary: 'counterpoint, structure, rehearsal, performance, révérence',
    keyQuestions: 'How do we make our dance clear for an audience?',
    resources: 'Lesson 5 plan PDF, cheat sheet, slides, Pedagogy guide',
  },
};

const SEED_ACTIVITIES: SeedActivity[] = [
  // ——— Lesson 1 ———
  act({
    unitLesson: 1,
    category: CAT.warmup,
    activity: 'Prepare: Getting started film',
    description: `<p>Meet the Royal Ballet’s Director and Principal Dancers. Discover the story of <strong>Romeo and Juliet</strong> as you begin your journey.</p>`,
    activityText: `<ol>
<li>Open the RBO Lesson 1 page and downloads (plan, slides, synopsis PDF).</li>
<li>Share the ballet synopsis (print or slides).</li>
<li>Watch <em>Romeo and Juliet — Getting started</em> (classroom or earlier).</li>
<li>Discuss: Kevin O’Hare, MacMillan, Prokofiev, Anna Rose O’Sullivan, Marcelino Sambé, motif, dynamics.</li>
</ol>`,
    time: 5,
    videoLink: LESSON_ASSETS[0].filmUnitUrl,
    resourceLink: LESSON_ASSETS[0].planPdf,
    link: LESSON_URLS[0],
  }),
  act({
    unitLesson: 1,
    category: CAT.explore,
    activity: 'Prepare: Meet the characters',
    description: `<p>Introduce Capulet and Montague characters through action and dynamics (Layer One / Building Block).</p>`,
    activityText: `<ol>
<li>Use synopsis, character descriptions and images PDF.</li>
<li>Explore Layer One character actions; vary dynamics.</li>
<li>Offer Building Block challenges where ready.</li>
</ol>`,
    time: 10,
    resourceLink: SYNOPSIS_PDF,
    link: LESSON_URLS[0],
  }),
  act({
    unitLesson: 1,
    category: CAT.warmup,
    activity: 'Warm Up: Verona’s Market',
    description: `<p>Active warm-up preparing dancers for character and motif work.</p>`,
    activityText: `<ol>
<li>Follow RBO Lesson 1 warm-up (cheat sheet / slides).</li>
<li>Set space boundaries and a stop signal.</li>
</ol>`,
    time: 10,
    resourceLink: LESSON_ASSETS[0].cheatPdf,
  }),
  act({
    unitLesson: 1,
    category: CAT.explore,
    activity: 'Explore: Musical Motifs',
    description: `<p>Listen with attention to detail; understand motif in music and movement.</p>`,
    activityText: `<ol>
<li>Use Resource Bank music excerpts linked from the lesson.</li>
<li>Identify short musical motifs; mirror with body actions.</li>
</ol>`,
    time: 10,
    musicLink: RESOURCE_BANK,
    resourceLink: LESSON_ASSETS[0].planPdf,
  }),
  act({
    unitLesson: 1,
    category: CAT.create,
    activity: 'Create: Character Motif',
    description: `<p>Compose a short character motif using actions and dynamics.</p>`,
    activityText: `<ol>
<li>Choose a character; create a short motif phrase.</li>
<li>Layer One then Building Block as appropriate.</li>
</ol>`,
    time: 15,
    resourceLink: LESSON_ASSETS[0].slidesPptx,
  }),
  act({
    unitLesson: 1,
    category: CAT.perform,
    activity: 'Share & Celebrate + Music conductor cool down',
    description: `<p>Share character motifs; cool down with Music conductor.</p>`,
    activityText: `<ol>
<li>Share selected motifs (Share &amp; Celebrate).</li>
<li>Cool Down: Music conductor (5 mins).</li>
<li>Bookmark Lesson 1 PDFs and Resource Bank for next time.</li>
</ol>`,
    time: 10,
    resourceLink: CURRICULUM_MAP_PDF,
  }),

  // ——— Lesson 2 ———
  act({
    unitLesson: 2,
    category: CAT.warmup,
    activity: 'Prepare: Recap — Conveying Mood',
    description: `<p>Recap characters; introduce Balcony and Crypt contrasting scenes.</p>`,
    activityText: `<ol>
<li>Open Lesson 2 plan PDF and slides.</li>
<li>Recall motifs from Lesson 1; introduce mood focus.</li>
</ol>`,
    time: 5,
    resourceLink: LESSON_ASSETS[1].planPdf,
    link: LESSON_URLS[1],
  }),
  act({
    unitLesson: 2,
    category: CAT.warmup,
    activity: 'Warm Up: Opposites pas de deux',
    description: `<p>Partner warm-up exploring opposite qualities for pas de deux work.</p>`,
    activityText: `<ol>
<li>Follow Opposites ‘Pas de deux’ warm-up on the cheat sheet.</li>
<li>Travel soft/curved vs sharp/straight pathways.</li>
</ol>`,
    time: 10,
    resourceLink: LESSON_ASSETS[1].cheatPdf,
  }),
  act({
    unitLesson: 2,
    category: CAT.explore,
    activity: 'Explore: Contrasting moods',
    description: `<p>Explore how music, dynamics and space affect mood (Balcony vs Crypt).</p>`,
    activityText: `<ol>
<li>Create a soft Balcony phrase (open space, sustained dynamics).</li>
<li>Create a Crypt phrase (closed space, heavy/slow or sudden).</li>
<li>Partner feedback: which mood was clearest?</li>
</ol>`,
    time: 20,
    musicLink: RESOURCE_BANK,
    resourceLink: LESSON_ASSETS[1].planPdf,
  }),
  act({
    unitLesson: 2,
    category: CAT.create,
    activity: 'Create: Conveying Mood — Pas de deux',
    description: `<p>Develop a short pas de deux idea that conveys contrasting moods.</p>`,
    activityText: `<ol>
<li>Join Balcony (A) and Crypt (B) into a clear phrase.</li>
<li>Use Layer One / Building Block as ready.</li>
</ol>`,
    time: 20,
    resourceLink: LESSON_ASSETS[1].slidesPptx,
  }),
  act({
    unitLesson: 2,
    category: CAT.perform,
    activity: 'Share & Celebrate + Music conductor',
    description: `<p>Share mood contrasts; cool down.</p>`,
    activityText: `<ol>
<li>Perform for another pair; note mood clarity.</li>
<li>Cool Down: Music conductor.</li>
</ol>`,
    time: 10,
  }),

  // ——— Lesson 3 ———
  act({
    unitLesson: 3,
    category: CAT.warmup,
    activity: 'Prepare: Time Signatures',
    description: `<p>Introduce Dance of the Knights (4/4 march) and Mandolin Dance (waltz feel).</p>`,
    activityText: `<ol>
<li>Open Lesson 3 plan and Resource Bank music.</li>
<li>Clap and step pulse differences between 4 and 3.</li>
</ol>`,
    time: 5,
    resourceLink: LESSON_ASSETS[2].planPdf,
    musicLink: RESOURCE_BANK,
    link: LESSON_URLS[2],
  }),
  act({
    unitLesson: 3,
    category: CAT.warmup,
    activity: 'Warm Up: Rhythm circle',
    description: `<p>Group rhythm warm-up preparing for time-signature shapes.</p>`,
    activityText: `<ol>
<li>Follow Rhythm circle warm-up (cheat sheet).</li>
</ol>`,
    time: 10,
    resourceLink: LESSON_ASSETS[2].cheatPdf,
  }),
  act({
    unitLesson: 3,
    category: CAT.explore,
    activity: 'Explore: Time signature shapes',
    description: `<p>Travel and shape work linked to 4/4 and 3/4 feels.</p>`,
    activityText: `<ol>
<li>4/4: strong marching pathways and angular shapes (Knights).</li>
<li>3/4 feel: turning, softer Mandolin-inspired motifs.</li>
</ol>`,
    time: 20,
    musicLink: RESOURCE_BANK,
    resourceLink: LESSON_ASSETS[2].planPdf,
  }),
  act({
    unitLesson: 3,
    category: CAT.create,
    activity: 'Create: Time signature motif',
    description: `<p>Compose a motif that switches between 4 and 3 feels.</p>`,
    activityText: `<ol>
<li>Build a short phrase alternating march and waltz feel.</li>
<li>Layer One then Building Block as appropriate.</li>
</ol>`,
    time: 20,
    resourceLink: LESSON_ASSETS[2].slidesPptx,
  }),
  act({
    unitLesson: 3,
    category: CAT.perform,
    activity: 'Share & Celebrate + conductor cool down (3/4)',
    description: `<p>Share motifs; cool down in 3/4.</p>`,
    activityText: `<ol>
<li>Group share.</li>
<li>Cool Down: Music conductor 3/4.</li>
</ol>`,
    time: 10,
  }),

  // ——— Lesson 4 ———
  act({
    unitLesson: 4,
    category: CAT.warmup,
    activity: 'Prepare: Creating highlights',
    description: `<p>Introduce highlights, unison, and action &amp; reaction.</p>`,
    activityText: `<ol>
<li>Open Lesson 4 plan PDF and slides.</li>
<li>Recap motifs; define a highlight moment.</li>
</ol>`,
    time: 5,
    resourceLink: LESSON_ASSETS[3].planPdf,
    link: LESSON_URLS[3],
  }),
  act({
    unitLesson: 4,
    category: CAT.warmup,
    activity: 'Warm Up: Unison highlights',
    description: `<p>Warm into shared timing for highlight work.</p>`,
    activityText: `<ol>
<li>Mirror a leader in unison; mark a clear highlight.</li>
</ol>`,
    time: 10,
    resourceLink: LESSON_ASSETS[3].cheatPdf,
  }),
  act({
    unitLesson: 4,
    category: CAT.explore,
    activity: 'Explore: Action and Reaction',
    description: `<p>Partner action–reaction to build tension.</p>`,
    activityText: `<ol>
<li>Partner A initiates; Partner B reacts.</li>
<li>Vary dynamics and timing.</li>
</ol>`,
    time: 15,
    resourceLink: LESSON_ASSETS[3].planPdf,
  }),
  act({
    unitLesson: 4,
    category: CAT.create,
    activity: 'Create: Montague & Capulet motifs',
    description: `<p>Compose motifs with unison and a clear highlight.</p>`,
    activityText: `<ol>
<li>Set a phrase including one clear highlight.</li>
<li>Use family identity (Montague / Capulet) in the work.</li>
</ol>`,
    time: 20,
    resourceLink: LESSON_ASSETS[3].slidesPptx,
  }),
  act({
    unitLesson: 4,
    category: CAT.perform,
    activity: 'Share & Celebrate + Dance of the Knights Révérence',
    description: `<p>Perform phrases; cool down with Knights révérence.</p>`,
    activityText: `<ol>
<li>Audience points to the highlight.</li>
<li>Cool Down: Dance of the Knights ‘Révérence’.</li>
</ol>`,
    time: 10,
    musicLink: RESOURCE_BANK,
  }),

  // ——— Lesson 5 ———
  act({
    unitLesson: 5,
    category: CAT.warmup,
    activity: 'Prepare: Counterpoint',
    description: `<p>Introduce counterpoint before completing the class dance.</p>`,
    activityText: `<ol>
<li>Open Lesson 5 plan and pedagogy/how-to-use links as needed.</li>
<li>Explain dancing one part against another.</li>
</ol>`,
    time: 5,
    resourceLink: LESSON_ASSETS[4].planPdf,
    link: LESSON_URLS[4],
  }),
  act({
    unitLesson: 5,
    category: CAT.warmup,
    activity: 'Warm Up: Counterpoint',
    description: `<p>Warm-up exploring two layers moving together.</p>`,
    activityText: `<ol>
<li>Follow Counterpoint warm-up on the cheat sheet.</li>
</ol>`,
    time: 10,
    resourceLink: LESSON_ASSETS[4].cheatPdf,
  }),
  act({
    unitLesson: 5,
    category: CAT.explore,
    activity: 'Explore: Recap the motifs',
    description: `<p>Gallery of motifs from Lessons 1–4 ready to structure.</p>`,
    activityText: `<ol>
<li>Quick recap of characters, moods, pulse, and highlights.</li>
</ol>`,
    time: 10,
    resourceLink: SYNOPSIS_PDF,
  }),
  act({
    unitLesson: 5,
    category: CAT.create,
    activity: 'Create: Structure your Romeo and Juliet dance',
    description: `<p>Set beginning, middle and end; rehearse with clear counts.</p>`,
    activityText: `<ol>
<li>Group A dances a known phrase while Group B holds / moves a contrasting layer.</li>
<li>Agree structure; rehearse entrances and endings.</li>
</ol>`,
    time: 25,
    resourceLink: LESSON_ASSETS[4].slidesPptx,
  }),
  act({
    unitLesson: 5,
    category: CAT.perform,
    activity: 'Share + Dance of the Knights Révérence',
    description: `<p>Run the dance for an audience and cool down.</p>`,
    activityText: `<ol>
<li>Perform once through without stopping.</li>
<li>Two stars and a wish; Cool Down: Dance of the Knights ‘Révérence’.</li>
<li>Point families to Classroom Resources / Resource Bank for further exploration.</li>
</ol>`,
    time: 10,
    link: CLASSROOM_RESOURCES,
    resourceLink: PEDAGOGY,
    musicLink: RESOURCE_BANK,
  }),
];

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function isRohCategoryName(name: string): boolean {
  return ALL_CATEGORIES.includes(name as any) || name === FOLDER || name.startsWith(`${RJ_PROJECT_PREFIX}`);
}

function lessonExtraLinks(lessonNumber: number) {
  const assets = LESSON_ASSETS[lessonNumber - 1];
  return [
    { label: 'RBO KS2 Romeo and Juliet course', url: COURSE_URL },
    { label: `Lesson ${lessonNumber} on RBO Schools`, url: LESSON_URLS[lessonNumber - 1] },
    { label: 'Lesson plan (PDF)', url: assets.planPdf },
    { label: 'Cheat sheet (PDF)', url: assets.cheatPdf },
    { label: 'Slide show (PPT)', url: assets.slidesPptx },
    { label: 'Curriculum Map (PDF)', url: CURRICULUM_MAP_PDF },
    { label: 'Synopsis, characters & images (PDF)', url: SYNOPSIS_PDF },
    { label: 'Romeo & Juliet Resource Bank', url: RESOURCE_BANK },
    { label: 'Classroom resources', url: CLASSROOM_RESOURCES },
    { label: 'How to use the lesson plans', url: PEDAGOGY },
    { label: 'RBO Classroom Cinema: Create & Dance', url: CINEMA },
    ...(assets.filmUnitUrl
      ? [{ label: 'Lesson film unit', url: assets.filmUnitUrl }]
      : []),
  ];
}

function mergeCategoriesIntoLocalStorage() {
  const existing = readJson<any[]>('saved-categories', []);
  const folders = readJson<any[]>('category-folders', []);
  const yearTicks = {
    Year5: true,
    'Year 5': true,
    Year6: true,
    'Year 6': true,
  };

  const withoutOld = existing.filter((c) => !isRohCategoryName(String(c?.name || '')));
  const created = ALL_CATEGORIES.map((name, i) => ({
    name,
    color: ['#7c3aed', '#0d9488', '#c2410c', '#1d4ed8'][i % 4],
    position: withoutOld.length + i,
    group: FOLDER,
    groups: [FOLDER],
    yearGroups: { ...yearTicks },
  }));
  const merged = [...withoutOld, ...created];
  localStorage.setItem('saved-categories', JSON.stringify(merged));

  if (!folders.some((f) => f?.name === FOLDER || f?.id === FOLDER)) {
    folders.push({ id: FOLDER, name: FOLDER, color: '#1e1b4b' });
    localStorage.setItem('category-folders', JSON.stringify(folders));
  }
  return { merged, created };
}

function mergeActivitiesIntoLocalStorage(seed: SeedActivity[]): Activity[] {
  const existing = readJson<Activity[]>('library-activities', []);
  const kept = existing.filter((a) => {
    const cat = String(a?.category || '');
    const notes = String((a as any)?.notes || '');
    if (isRohCategoryName(cat)) return false;
    if (notes.includes('ROH_RJ_SEED')) return false;
    if (
      String(a?.teachingUnit || '').includes('Romeo and Juliet') &&
      String(a?.imageLink || '').includes('royal-opera')
    )
      return false;
    return true;
  });

  const withIds: Activity[] = seed.map((a, i) => ({
    ...a,
    notes: SEED_NOTE,
    videoLink: a.videoLink || '',
    musicLink: a.musicLink || '',
    backingLink: a.backingLink || '',
    vocalsLink: a.vocalsLink || '',
    imageLink: a.imageLink || ROH_LOGO_SRC,
    resourceLink: a.resourceLink || '',
    _id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `roh-rj-${i}-${Date.now()}`,
  }));
  localStorage.setItem('library-activities', JSON.stringify([...kept, ...withIds]));
  return withIds;
}

function allocateLessonNumbers(count: number, existingKeys: string[]): string[] {
  const used = new Set(existingKeys.map(String));
  const previous = readJson<string[]>(LESSON_KEYS_KEY, []);
  previous.forEach((k) => used.delete(String(k)));
  const nums = existingKeys.map((k) => parseInt(String(k), 10)).filter((n) => !isNaN(n));
  let next = (nums.length ? Math.max(...nums) : 0) + 1;
  const allocated: string[] = [];
  for (const k of previous) {
    if (allocated.length >= count) break;
    if (/^\d+$/.test(String(k))) allocated.push(String(k));
  }
  while (allocated.length < count) {
    const key = String(next++);
    if (used.has(key) && !previous.includes(key)) continue;
    allocated.push(key);
    used.add(key);
  }
  return allocated;
}

function buildLessons(activities: Activity[], lessonNumbers: string[]): Record<string, LessonData> {
  const byUnit: Record<number, Activity[]> = {};
  SEED_ACTIVITIES.forEach((seed, i) => {
    const a = activities[i];
    if (!a) return;
    if (!byUnit[seed.unitLesson]) byUnit[seed.unitLesson] = [];
    byUnit[seed.unitLesson].push(a);
  });

  const lessons: Record<string, LessonData> = {};
  for (let i = 1; i <= 5; i++) {
    const meta = LESSON_META[i];
    const lessonActs = byUnit[i] || [];
    const key = lessonNumbers[i - 1];
    const categoriesInLesson = [...new Set(lessonActs.map((a) => a.category))];
    const grouped: Record<string, Activity[]> = {};
    categoriesInLesson.forEach((c) => {
      grouped[c] = lessonActs.filter((a) => a.category === c);
    });
    const assets = LESSON_ASSETS[i - 1];
    lessons[key] = {
      title: meta.title,
      lessonName: `${UNIT} — ${meta.title}`,
      grouped,
      categoryOrder: categoriesInLesson,
      orderedActivities: lessonActs,
      totalTime: lessonActs.reduce((sum, a) => sum + (a.time || 0), 0),
      learningOutcome: meta.learningOutcome,
      successCriteria: meta.successCriteria,
      introduction: meta.introduction,
      mainActivity: meta.mainActivity,
      plenary: meta.plenary,
      vocabulary: meta.vocabulary,
      keyQuestions: meta.keyQuestions,
      resources: meta.resources,
      notes: `${SEED_NOTE}. Open Links & Resources for RBO lesson PDFs, Resource Bank, and Classroom Cinema.`,
      videoLink: assets.filmUnitUrl || CINEMA,
      resourceLink: assets.planPdf,
      additionalLinks: JSON.stringify(lessonExtraLinks(i)) as unknown as string,
      isUserCreated: true,
      academicYear: ACADEMIC_YEAR,
    };
  }
  return lessons;
}

function mergeLessonsIntoLocalStorage(lessons: Record<string, LessonData>) {
  const key = `lesson-data-${SHEET_ID}`;
  const existing = readJson<any>(key, { allLessonsData: {}, lessonNumbers: [], teachingUnits: [] });
  const allLessonsData = { ...(existing.allLessonsData || {}) };
  const previousKeys = readJson<string[]>(LESSON_KEYS_KEY, []);
  for (const k of previousKeys) {
    if (String(allLessonsData[k]?.notes || '').includes('ROH_RJ_SEED')) delete allLessonsData[k];
  }
  for (const [num, lesson] of Object.entries(lessons)) {
    allLessonsData[num] = lesson;
  }
  const writtenNumbers = Object.keys(lessons);
  const lessonNumbers = [
    ...new Set([
      ...(existing.lessonNumbers || []).filter((n: string) => allLessonsData[n]),
      ...writtenNumbers,
    ]),
  ].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  const teachingUnits = [...new Set([...(existing.teachingUnits || []), UNIT])];
  const payload = {
    ...existing,
    allLessonsData,
    lessonNumbers,
    teachingUnits,
    notes: existing.notes || '',
  };
  localStorage.setItem(key, JSON.stringify(payload));
  localStorage.setItem(LESSON_KEYS_KEY, JSON.stringify(writtenNumbers));
  return { payload, writtenNumbers };
}

function buildLessonStack(lessonNumbers: string[], activities: Activity[]): StackedLesson {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? `stack-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
      : `stack-${Date.now()}`;
  return {
    id,
    name: STACK_NAME,
    description:
      'KS2 Create & Dance unit from Royal Ballet and Opera Schools — five Romeo and Juliet lessons with RBO PDFs, slides, and Resource Bank links.',
    color: '#1e1b4b',
    lessons: lessonNumbers,
    totalTime: activities.reduce((s, a) => s + (a.time || 0), 0),
    totalActivities: activities.length,
    customObjectives: [],
    curriculumType: 'CUSTOM',
    created_at: new Date().toISOString(),
  };
}

function mergeLessonStackIntoLocalStorage(stack: StackedLesson) {
  const existing = readJson<any[]>('lesson-stacks', []);
  const oldId = localStorage.getItem(STACK_ID_KEY);
  const cleaned = existing.filter((s) => s?.id !== oldId && s?.name !== STACK_NAME);
  cleaned.push(stack);
  localStorage.setItem('lesson-stacks', JSON.stringify(cleaned));
  localStorage.setItem(STACK_ID_KEY, stack.id);
}

/**
 * Partner / curated demo seeds write into the prototype session store.
 * Never call activitiesApi / lessonsApi / lessonStacksApi here —
 * packs must not sync to the production Supabase account.
 */
async function tryCloudSync(_args?: unknown) {
  // Intentionally no-op — protect production; packs are demo seed, not cloud rows.
  return;
}

function registerRohPartnerPlanning(
  activities: Activity[],
  lessonKeys: string[],
) {
  const org = PARTNER_PLANNING_ORGS.roh;
  registerPartnerPlanningPack({
    ...org,
    projectId: 'romeo-and-juliet-ks2',
    projectTitle: 'Romeo and Juliet',
    sheetId: SHEET_ID,
    activityIds: activities.map((a) => getActivityStarKey(a)),
    lessonKeys,
  });
}

export async function setupROHRomeoJuliet(options?: {
  force?: boolean;
  skipCloudSync?: boolean;
  /** When true (hub “Add to CCDesigner”), register for partner-planning accordion. */
  registerPartnerPlanning?: boolean;
}) {
  const force = Boolean(options?.force);
  const shouldRegister = Boolean(options?.registerPartnerPlanning);

  if (!force && localStorage.getItem(MARKER_KEY) === '1') {
    // Upgrade path: ensure already-local hub activities are starred.
    try {
      const existing = readJson<Activity[]>('library-activities', []).filter(
        (a) =>
          isRohCategoryName(a?.category) ||
          String((a as any)?.notes || '').includes('ROH_RJ_SEED'),
      );
      if (existing.length) {
        starActivityObjectsLocally(existing, {
          enableGlobalStarredFirst: true,
          starredFirstCategories: ALL_CATEGORIES,
        });
      }
      if (shouldRegister) {
        const lessonKeys = readJson<string[]>(LESSON_KEYS_KEY, []);
        registerRohPartnerPlanning(existing, lessonKeys);
      }
    } catch {
      /* ignore */
    }
    return { skipped: true as const, sheetId: SHEET_ID };
  }

  // Drop older marker so re-seed upgrades PDFs / activities
  localStorage.removeItem('ccd-roh-rj-seeded-v1');

  const categoryMerge = mergeCategoriesIntoLocalStorage();
  const activities = mergeActivitiesIntoLocalStorage(SEED_ACTIVITIES);
  const existingLessonData = readJson<any>(`lesson-data-${SHEET_ID}`, { lessonNumbers: [] });
  const lessonNumbers = allocateLessonNumbers(5, existingLessonData.lessonNumbers || []);
  const lessons = buildLessons(activities, lessonNumbers);
  const lessonPayload = mergeLessonsIntoLocalStorage(lessons);
  const lessonStack = buildLessonStack(lessonPayload.writtenNumbers, activities);
  mergeLessonStackIntoLocalStorage(lessonStack);

  // Secondary signal: star + starred-first (primary UI is partner-planning accordion).
  starActivityObjectsLocally(activities, {
    enableGlobalStarredFirst: true,
    starredFirstCategories: ALL_CATEGORIES,
  });

  if (shouldRegister) {
    registerRohPartnerPlanning(activities, lessonPayload.writtenNumbers);
  }

  localStorage.setItem(MARKER_KEY, '1');
  window.dispatchEvent(
    new CustomEvent(CCD_CATEGORIES_UPDATED_EVENT, {
      detail: { categories: categoryMerge.merged, source: 'roh-seed' },
    }),
  );
  notifyHubActivitiesUpdated('roh-rj-seed');

  // Cloud sync stays off — demo/hub packs must not write to production.
  if (options?.skipCloudSync === false) {
    await tryCloudSync();
  }

  return {
    skipped: false as const,
    activities: activities.length,
    lessons: lessonPayload.writtenNumbers.length,
    stackId: lessonStack.id,
    sheetId: SHEET_ID,
  };
}

export const ROH_RJ_COURSE = {
  title: 'KS2 — Romeo and Juliet',
  courseUrl: COURSE_URL,
  classroomResourcesUrl: CLASSROOM_RESOURCES,
  resourceBankUrl: RESOURCE_BANK,
  pedagogyUrl: PEDAGOGY,
  cinemaUrl: CINEMA,
  ks2ResourcesUrl: KS2_RESOURCES,
  curriculumMapPdf: CURRICULUM_MAP_PDF,
  synopsisPdf: SYNOPSIS_PDF,
  logoUrl: RBO_SCHOOLS_LOGO,
  learningObjectives: [
    'Creating movement patterns',
    'Use of actions and dynamics to embody a character',
    'Use of space and dynamics to convey mood',
    'Time signatures through dynamics and shape',
    'Dance relationships and movement highlights',
    'Counterpoint and choreographic practices',
  ],
  lessons: [
    {
      number: 1,
      title: 'Getting started — Meet the Characters',
      summary:
        'Meet characters from Shakespeare’s Romeo and Juliet as shown in MacMillan’s ballet and Prokofiev’s music.',
      url: LESSON_URLS[0],
      planPdf: LESSON_ASSETS[0].planPdf,
      cheatPdf: LESSON_ASSETS[0].cheatPdf,
      slidesPptx: LESSON_ASSETS[0].slidesPptx,
    },
    {
      number: 2,
      title: 'Conveying mood',
      summary: 'Contrast Balcony and Crypt scenes using space and dynamics for mood.',
      url: LESSON_URLS[1],
      planPdf: LESSON_ASSETS[1].planPdf,
      cheatPdf: LESSON_ASSETS[1].cheatPdf,
      slidesPptx: LESSON_ASSETS[1].slidesPptx,
    },
    {
      number: 3,
      title: 'Time signatures',
      summary: 'Explore Dance of the Knights (4/4) and Mandolin Dance (waltz feel).',
      url: LESSON_URLS[2],
      planPdf: LESSON_ASSETS[2].planPdf,
      cheatPdf: LESSON_ASSETS[2].cheatPdf,
      slidesPptx: LESSON_ASSETS[2].slidesPptx,
    },
    {
      number: 4,
      title: 'Creating highlights',
      summary: 'Build tension with highlights, unison, and action–reaction.',
      url: LESSON_URLS[3],
      planPdf: LESSON_ASSETS[3].planPdf,
      cheatPdf: LESSON_ASSETS[3].cheatPdf,
      slidesPptx: LESSON_ASSETS[3].slidesPptx,
    },
    {
      number: 5,
      title: 'Counterpoint and choreography',
      summary: 'Use counterpoint, set structure, rehearse and share your dance.',
      url: LESSON_URLS[4],
      planPdf: LESSON_ASSETS[4].planPdf,
      cheatPdf: LESSON_ASSETS[4].cheatPdf,
      slidesPptx: LESSON_ASSETS[4].slidesPptx,
    },
  ],
} as const;

if (typeof window !== 'undefined') {
  (window as any).setupROHRomeoJuliet = setupROHRomeoJuliet;
  try {
    if (localStorage.getItem(MARKER_KEY) !== '1') {
      void setupROHRomeoJuliet();
    }
  } catch (e) {
    console.warn('ROH Romeo and Juliet auto-seed failed', e);
  }
}
