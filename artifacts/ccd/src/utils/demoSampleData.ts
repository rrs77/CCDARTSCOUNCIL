/**
 * Curated sample content for the public Preview / Demo mode.
 *
 * Three short performing-arts units (Drama, Music, Dance) each with two
 * lessons of 3–4 activities. Activities reference real, public web resources
 * (BBC Bitesize, Teaching Ideas, etc.) so the "Preview" experience feels
 * substantive without exposing any tenant's real data.
 *
 * Shapes match `Activity`, `LessonData`, `Unit`, and `HalfTerm` in
 * `src/contexts/DataContext.tsx`. Keep this file dependency-free so it can
 * be imported and seeded into localStorage before any provider mounts.
 */

import {
  DEMO_SEED_MARKER_KEY,
} from './demoMode';

export const DEMO_SHEET_INFO = {
  sheet: 'DEMO',
  display: 'Performing Arts Demo',
  eyfs: 'DEMO Statements',
};

// Seed for both the current UK academic year and the next one so the demo
// keeps rendering after the calendar rolls into September.
const DEMO_ACADEMIC_YEARS = ['2025-2026', '2026-2027'];
const DEMO_ACADEMIC_YEAR = DEMO_ACADEMIC_YEARS[0];

interface DemoActivity {
  id: string;
  activity: string;
  description: string;
  time: number;
  videoLink: string;
  musicLink: string;
  backingLink: string;
  resourceLink: string;
  link: string;
  vocalsLink: string;
  imageLink: string;
  teachingUnit: string;
  category: string;
  level: string;
  yearGroups: string[];
  unitName: string;
  lessonNumber: string;
}

function makeActivity(partial: Partial<DemoActivity> & {
  id: string;
  activity: string;
  description: string;
  time: number;
  category: string;
  unitName: string;
  lessonNumber: string;
}): DemoActivity {
  return {
    videoLink: '',
    musicLink: '',
    backingLink: '',
    resourceLink: '',
    link: '',
    vocalsLink: '',
    imageLink: '',
    teachingUnit: partial.unitName,
    level: 'KS2',
    yearGroups: ['Year 3', 'Year 4'],
    ...partial,
  } as DemoActivity;
}

// ---------- DRAMA ----------
const dramaWarmups = makeActivity({
  id: 'demo-drama-1-1',
  activity: 'Mirror Game Warm-Up',
  description:
    'Pupils work in pairs facing each other. One leads, the other mirrors every movement. Switch roles after 90 seconds. Builds focus, eye contact, and ensemble awareness.',
  time: 8,
  category: 'Warm-Up',
  unitName: 'Storytelling Through Drama',
  lessonNumber: '1',
  resourceLink: 'https://www.bbc.co.uk/teach/class-clips-video/drama-warm-up-games/zfvtkmn',
});

const dramaFreezeFrame = makeActivity({
  id: 'demo-drama-1-2',
  activity: 'Freeze-Frame Storytelling',
  description:
    'Groups of four create three still images that retell a familiar fable (e.g. The Tortoise and the Hare). Encourage clear use of levels, facial expression, and gesture.',
  time: 20,
  category: 'Main Activity',
  unitName: 'Storytelling Through Drama',
  lessonNumber: '1',
  resourceLink: 'https://www.teachingideas.co.uk/drama/freeze-frames',
});

const dramaReflection = makeActivity({
  id: 'demo-drama-1-3',
  activity: 'Audience Feedback Circle',
  description:
    'Each group performs their three frames. The audience identifies the moment of greatest tension and one strong storytelling choice.',
  time: 10,
  category: 'Plenary',
  unitName: 'Storytelling Through Drama',
  lessonNumber: '1',
});

const dramaImprov = makeActivity({
  id: 'demo-drama-2-1',
  activity: 'Yes, And… Improv',
  description:
    'In pairs, pupils build a short scene by always accepting and extending their partner\'s offer. Stop after a minute and reset with a new "where".',
  time: 10,
  category: 'Warm-Up',
  unitName: 'Storytelling Through Drama',
  lessonNumber: '2',
  videoLink: 'https://www.youtube.com/watch?v=bP-hnB-eQzo',
});

const dramaScene = makeActivity({
  id: 'demo-drama-2-2',
  activity: 'Two-Minute Scene Builder',
  description:
    'Pairs improvise a two-minute scene around a "secret" only one character knows. Run twice, then perform best take to a partner pair.',
  time: 22,
  category: 'Main Activity',
  unitName: 'Storytelling Through Drama',
  lessonNumber: '2',
  resourceLink: 'https://dramaresource.com/improvisation-games/',
});

const dramaShare = makeActivity({
  id: 'demo-drama-2-3',
  activity: 'Spotlight Sharing',
  description:
    'Two pairs share their strongest scene. Class identifies the inciting moment and a clear ending.',
  time: 8,
  category: 'Plenary',
  unitName: 'Storytelling Through Drama',
  lessonNumber: '2',
});

// ---------- MUSIC ----------
const musicListening = makeActivity({
  id: 'demo-music-3-1',
  activity: 'Active Listening: Rhythms of West Africa',
  description:
    'Play a short djembe ensemble recording. Pupils tap the underlying pulse, then identify the call-and-response pattern and shifting layers.',
  time: 10,
  category: 'Warm-Up',
  unitName: 'Rhythms of the World',
  lessonNumber: '3',
  videoLink: 'https://www.youtube.com/watch?v=q1vPm5dHMnY',
  resourceLink: 'https://www.bbc.co.uk/teach/ten-pieces/west-african-music-resources/zk6n2sg',
});

const musicBodyPercussion = makeActivity({
  id: 'demo-music-3-2',
  activity: 'Body Percussion Layer Build',
  description:
    'Teach a four-bar body percussion ostinato (stomp, clap, click, clap). Split the class into three groups and stagger entries to build a textured groove.',
  time: 18,
  category: 'Main Activity',
  unitName: 'Rhythms of the World',
  lessonNumber: '3',
  resourceLink: 'https://www.teachingideas.co.uk/music/body-percussion',
});

const musicComposition = makeActivity({
  id: 'demo-music-3-3',
  activity: 'Mini Composition in Pairs',
  description:
    'Pairs invent their own 4-beat ostinato using two body sounds. Notate using picture symbols on whiteboards. Perform in a circle with each pair adding in turn.',
  time: 15,
  category: 'Composition',
  unitName: 'Rhythms of the World',
  lessonNumber: '3',
});

const musicMelody = makeActivity({
  id: 'demo-music-4-1',
  activity: 'Pentatonic Melody Improvisation',
  description:
    'Using glockenspiels with only the C-D-E-G-A bars in place, pupils improvise short call-and-response melodies over a 4-bar drone.',
  time: 20,
  category: 'Main Activity',
  unitName: 'Rhythms of the World',
  lessonNumber: '4',
  resourceLink: 'https://www.bbc.co.uk/bitesize/topics/zcbkcj6',
});

const musicNotation = makeActivity({
  id: 'demo-music-4-2',
  activity: 'Stave Notation Snapshot',
  description:
    'Pupils notate one of their improvised melodies onto a 4-bar treble stave. Peer-check note placement.',
  time: 15,
  category: 'Theory',
  unitName: 'Rhythms of the World',
  lessonNumber: '4',
  resourceLink: 'https://www.musictheory.net/lessons',
});

const musicShare = makeActivity({
  id: 'demo-music-4-3',
  activity: 'Composer\'s Concert',
  description:
    'Volunteers perform their notated melody from the score while the rest of the class follows along.',
  time: 8,
  category: 'Plenary',
  unitName: 'Rhythms of the World',
  lessonNumber: '4',
});

// ---------- DANCE ----------
const danceWarmup = makeActivity({
  id: 'demo-dance-5-1',
  activity: 'Joint-by-Joint Mobiliser',
  description:
    'Standing in a circle, lead pupils through a head-to-toe joint mobilisation set to gentle rhythmic music. Encourage controlled breathing.',
  time: 8,
  category: 'Warm-Up',
  unitName: 'Movement & Motif',
  lessonNumber: '5',
  videoLink: 'https://www.youtube.com/watch?v=v7AYKMP6rOE',
});

const danceMotif = makeActivity({
  id: 'demo-dance-5-2',
  activity: 'Create a 4-Count Motif',
  description:
    'In pairs, pupils invent a 4-count movement motif using one travel, one shape, and one gesture. Repeat × 4 to a steady count.',
  time: 18,
  category: 'Choreography',
  unitName: 'Movement & Motif',
  lessonNumber: '5',
  resourceLink: 'https://www.teachingideas.co.uk/dance/creating-a-motif',
});

const danceDevelopment = makeActivity({
  id: 'demo-dance-5-3',
  activity: 'Motif Development: Canon',
  description:
    'Pairs join into fours and perform their motifs in canon (overlapping by one count). Reflect on how the unison sections feel different to the canon sections.',
  time: 14,
  category: 'Main Activity',
  unitName: 'Movement & Motif',
  lessonNumber: '5',
});

const danceCharacter = makeActivity({
  id: 'demo-dance-6-1',
  activity: 'Character Walks',
  description:
    'Pupils travel around the space embodying contrasting characters (royalty, scientist, athlete). Freeze on the cymbal crash and hold the character\'s posture.',
  time: 10,
  category: 'Warm-Up',
  unitName: 'Movement & Motif',
  lessonNumber: '6',
});

const danceGroupChoreo = makeActivity({
  id: 'demo-dance-6-2',
  activity: 'Group Choreography: Storms & Stillness',
  description:
    'Groups of five compose a 32-count piece contrasting frenetic "storm" and held "stillness" sections. Use shape, level, and dynamic clearly.',
  time: 25,
  category: 'Choreography',
  unitName: 'Movement & Motif',
  lessonNumber: '6',
  resourceLink: 'https://www.bbc.co.uk/bitesize/topics/zcgyf4j',
});

const danceShare = makeActivity({
  id: 'demo-dance-6-3',
  activity: 'Performance & Glow/Grow',
  description:
    'Each group performs. Audience offers one "glow" (something that worked) and one "grow" (something to develop).',
  time: 12,
  category: 'Plenary',
  unitName: 'Movement & Motif',
  lessonNumber: '6',
});

// ---------- LESSON ASSEMBLY ----------
type DemoLesson = {
  number: string;
  title: string;
  unit: string;
  activities: DemoActivity[];
  categoryOrder: string[];
};

const DEMO_LESSONS: DemoLesson[] = [
  {
    number: '1',
    title: 'Drama: Telling Stories with Stillness',
    unit: 'Storytelling Through Drama',
    activities: [dramaWarmups, dramaFreezeFrame, dramaReflection],
    categoryOrder: ['Warm-Up', 'Main Activity', 'Plenary'],
  },
  {
    number: '2',
    title: 'Drama: Improvising a Two-Minute Scene',
    unit: 'Storytelling Through Drama',
    activities: [dramaImprov, dramaScene, dramaShare],
    categoryOrder: ['Warm-Up', 'Main Activity', 'Plenary'],
  },
  {
    number: '3',
    title: 'Music: Listen, Layer, Loop',
    unit: 'Rhythms of the World',
    activities: [musicListening, musicBodyPercussion, musicComposition],
    categoryOrder: ['Warm-Up', 'Main Activity', 'Composition'],
  },
  {
    number: '4',
    title: 'Music: Pentatonic Melodies & Stave Notation',
    unit: 'Rhythms of the World',
    activities: [musicMelody, musicNotation, musicShare],
    categoryOrder: ['Main Activity', 'Theory', 'Plenary'],
  },
  {
    number: '5',
    title: 'Dance: Building a Motif',
    unit: 'Movement & Motif',
    activities: [danceWarmup, danceMotif, danceDevelopment],
    categoryOrder: ['Warm-Up', 'Choreography', 'Main Activity'],
  },
  {
    number: '6',
    title: 'Dance: Storms & Stillness',
    unit: 'Movement & Motif',
    activities: [danceCharacter, danceGroupChoreo, danceShare],
    categoryOrder: ['Warm-Up', 'Choreography', 'Plenary'],
  },
];

function buildLessonRecord() {
  const allLessonsData: Record<string, unknown> = {};
  const teachingUnitsSet = new Set<string>();
  const lessonStandards: Record<string, string[]> = {};

  for (const l of DEMO_LESSONS) {
    teachingUnitsSet.add(l.unit);
    const grouped: Record<string, DemoActivity[]> = {};
    for (const cat of l.categoryOrder) {
      grouped[cat] = l.activities.filter((a) => a.category === cat);
    }
    const totalTime = l.activities.reduce((sum, a) => sum + a.time, 0);
    allLessonsData[l.number] = {
      grouped,
      categoryOrder: l.categoryOrder,
      totalTime,
      title: l.title,
      lessonName: l.unit,
      academicYear: DEMO_ACADEMIC_YEAR,
      orderedActivities: l.activities,
      isUserCreated: false,
    };
    lessonStandards[l.number] = [];
  }

  return {
    allLessonsData,
    teachingUnits: Array.from(teachingUnitsSet),
    lessonStandards,
  };
}

function buildUnits() {
  return [
    {
      id: 'demo-unit-drama',
      name: 'Storytelling Through Drama',
      description: 'Two lessons exploring still image, ensemble work, and improvised storytelling.',
      lessonNumbers: ['1', '2'],
      color: '#7C3AED',
      term: 'Autumn 1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-unit-music',
      name: 'Rhythms of the World',
      description: 'Two lessons on global rhythms, body percussion, and pentatonic composition.',
      lessonNumbers: ['3', '4'],
      color: '#0EA5E9',
      term: 'Autumn 2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-unit-dance',
      name: 'Movement & Motif',
      description: 'Two lessons developing motifs, canon, and dynamic contrast in dance.',
      lessonNumbers: ['5', '6'],
      color: '#F59E0B',
      term: 'Spring 1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

function buildHalfTerms() {
  // Mirrors DEFAULT_HALF_TERMS shape used by DataContext.
  return [
    { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct', lessons: ['1', '2'], stacks: [], isComplete: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec', lessons: ['3', '4'], stacks: [], isComplete: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb', lessons: ['5', '6'], stacks: [], isComplete: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'SP2', name: 'Spring 2', months: 'Feb-Mar', lessons: [], stacks: [], isComplete: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'SM1', name: 'Summer 1', months: 'Apr-May', lessons: [], stacks: [], isComplete: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul', lessons: [], stacks: [], isComplete: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];
}

/**
 * Pre-populates localStorage with the demo dataset so DataContext renders
 * curated drama/music/dance content without any backend calls.
 *
 * Idempotent: safe to call repeatedly. Uses a marker so we don't overwrite
 * a visitor's in-session changes (those are still discarded on logout).
 */
export function seedDemoLocalStorage() {
  try {
    if (sessionStorage.getItem(DEMO_SEED_MARKER_KEY) === '1') return;

    const lessonBundle = buildLessonRecord();
    const allActivities = DEMO_LESSONS.flatMap((l) => l.activities);

    localStorage.setItem('currentSheetInfo', JSON.stringify(DEMO_SHEET_INFO));
    localStorage.setItem('library-activities', JSON.stringify(allActivities));
    localStorage.setItem(
      `lesson-data-${DEMO_SHEET_INFO.sheet}`,
      JSON.stringify(lessonBundle),
    );
    localStorage.setItem(
      `units-${DEMO_SHEET_INFO.sheet}`,
      JSON.stringify(buildUnits()),
    );
    const halfTerms = buildHalfTerms();
    for (const year of DEMO_ACADEMIC_YEARS) {
      localStorage.setItem(
        `half-terms-${DEMO_SHEET_INFO.sheet}-${year}`,
        JSON.stringify(halfTerms),
      );
    }

    sessionStorage.setItem(DEMO_SEED_MARKER_KEY, '1');
  } catch (err) {
    if (typeof console !== 'undefined') {
      console.warn('Failed to seed demo localStorage:', err);
    }
  }
}
