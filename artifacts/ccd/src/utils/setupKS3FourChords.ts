/**
 * KS3 Music — 4 Chords (Musical Futures–style / Axis of Awesome concept).
 *
 * Original CCDesigner prototype inspired by public Musical Futures informal
 * learning approaches and the widely known I–V–vi–IV “four chords” idea
 * (popularised in classrooms via Axis of Awesome–style mashups).
 *
 * Curated demo seed pack: included by seedDemoData() on prototype activate
 * (same pattern as LSO/ROH). Never written to the production Supabase account.
 */

import type { Activity, LessonData } from '../contexts/DataContext';
import type { StackedLesson } from '../hooks/useLessonStacks';
import {
  allocateLessonNumbers,
  ensureLocalYearGroup,
  finishPrototypeSeed,
  mergeActivitiesLocal,
  mergeCategoriesLocal,
  mergeLessonsLocal,
  mergeStackLocal,
  newStackId,
  readJson,
  seedLocalCurriculumObjectives,
} from './prototypeLocalSeed';

const SHEET_ID = 'Year 8 Music';
const UNIT = '4 Chords';
const STACK_NAME = '4 Chords (KS3 Musical Futures style)';
const LEVEL = 'KS3';
const YEAR_GROUPS = ['Year 8 Music', 'Year 7 Music', 'Year 9 Music', 'Year 8', 'Year 7', 'Year 9'];
const MARKER_KEY = 'ccd-ks3-4chords-seeded-v2';
const STACK_ID_KEY = 'ccd-ks3-4chords-stack-id';
const LESSON_KEYS_KEY = 'ccd-ks3-4chords-lesson-keys';
const ACADEMIC_YEAR = '2026-2027';
const SEED_NOTE = 'KS3_4CHORDS_SEED:4 Chords';
const PDF = '/examples/ks3-four-chords-lesson-guide.pdf';
const PDF_CHART = '/examples/ks3-four-chords-chord-chart.pdf';
const MF_LINK = 'https://www.musicalfutures.org/';

const CAT = {
  listen: '4 Chords — Listen & Find',
  play: '4 Chords — Play',
  create: '4 Chords — Create',
  share: '4 Chords — Share & Reflect',
} as const;

const ALL_CATEGORIES = Object.values(CAT);

/** Shared demo KS3 Music bank IDs (see DEMO_EXTRA_OBJECTIVE_BANKS). */
const OBJ = {
  ygId: 'demo-yg-ks3-music',
  o1: 'demo-ks3-m-p1',
  o2: 'demo-ks3-m-p2',
  o3: 'demo-ks3-m-c1',
  o4: 'demo-ks3-m-l2',
};

const CURRICULUM = {
  yearGroupId: OBJ.ygId,
  yearGroupName: 'KS3 Music',
  color: '#0EA5E9',
  linkedYearGroups: YEAR_GROUPS,
  areas: [
    {
      id: 'demo-area-ks3-perf',
      name: 'Ensemble Performance',
      objectives: [
        {
          id: OBJ.o1,
          code: 'KS3-MU-P1',
          text: 'Play and perform confidently in a range of solo and ensemble contexts using voice, instruments and technology',
        },
        {
          id: OBJ.o2,
          code: 'KS3-MU-P2',
          text: 'Maintain an independent part (chords, bass, rhythm or melody) within a classroom band groove',
        },
      ],
    },
    {
      id: 'demo-area-ks3-comp',
      name: 'Improvisation and Composition',
      objectives: [
        {
          id: OBJ.o3,
          code: 'KS3-MU-C1',
          text: 'Improvise and compose music using chords, riffs and simple song structures',
        },
      ],
    },
    {
      id: 'demo-area-ks3-listen',
      name: 'Critical Listening',
      objectives: [
        {
          id: OBJ.o4,
          code: 'KS3-MU-L2',
          text: 'Identify how harmony, structure and instrumentation create style in four-chord pop songs',
        },
      ],
    },
  ],
};

type SeedActivity = Omit<Activity, 'id' | '_id'> & { unitLesson: number };

function act(partial: {
  unitLesson: number;
  category: string;
  activity: string;
  description: string;
  activityText?: string;
  time: number;
  link?: string;
  resourceLink?: string;
  imageLink?: string;
  videoLink?: string;
  musicLink?: string;
}): SeedActivity {
  return {
    activity: partial.activity,
    description: partial.description,
    activityText: partial.activityText || '',
    time: partial.time,
    category: partial.category,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    teachingUnit: UNIT,
    unitName: UNIT,
    lessonNumber: String(partial.unitLesson),
    unitLesson: partial.unitLesson,
    link: partial.link || MF_LINK,
    resourceLink: partial.resourceLink || PDF,
    imageLink: partial.imageLink || '',
    videoLink: partial.videoLink || '',
    musicLink: partial.musicLink || '',
    backingLink: '',
    vocalsLink: '',
    canvaLink: '',
    descriptionHeading: 'Introduction/Context',
    activityHeading: 'Activity',
    linkHeading: 'Prototype / Musical Futures',
    eyfsStandards: [],
  } as SeedActivity;
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
    objectiveIds: string[];
  }
> = {
  1: {
    title: 'Find the four chords',
    learningOutcome:
      'To recognise I–V–vi–IV in familiar pop songs and play the progression with a steady pulse (KS3 Music).',
    successCriteria:
      'I can name the four chords in order; I can play them in time with the class.',
    introduction: 'Listen to short clips that share the same progression; students spot the loop.',
    mainActivity: 'Chord map on board → ukulele/guitar/keyboard stations → pulse circle.',
    plenary: 'Exit ticket: write the progression in Roman numerals and chord names in C major.',
    vocabulary: 'chord, progression, I V vi IV, tonic, pulse, riff, Musical Futures',
    keyQuestions: 'Why do so many songs use the same four chords?',
    resources: PDF,
    objectiveIds: [OBJ.o1, OBJ.o4],
  },
  2: {
    title: 'Play as a band',
    learningOutcome: 'To perform the progression in layered parts (bass, chords, rhythm, melody).',
    successCriteria: 'I can keep my part; I can listen for balance in the group.',
    introduction: 'Model band roles; quick Musical Futures–style peer coaching.',
    mainActivity: 'Rotate roles → full-class groove → section leaders coach.',
    plenary: 'Record 30 seconds; two stars and a wish on ensemble timing.',
    vocabulary: 'texture, balance, groove, ostinato, ensemble, peer coaching',
    keyQuestions: 'Which part is hardest to keep in time — and how do we fix it?',
    resources: PDF,
    objectiveIds: [OBJ.o1, OBJ.o2],
  },
  3: {
    title: 'Melody over the loop',
    learningOutcome: 'To create a simple vocal or instrumental melody that fits I–V–vi–IV.',
    successCriteria: 'I can improvise a 4-bar idea; I can choose and refine one hook.',
    introduction: 'Call-and-response hooks over the loop.',
    mainActivity: 'Improvise → select → notate or lyric the best hook.',
    plenary: 'Share hooks; class votes on catchiest without losing pulse.',
    vocabulary: 'hook, improvisation, stepwise, leap, phrase',
    keyQuestions: 'What makes a melody sit well over these chords?',
    resources: PDF,
    objectiveIds: [OBJ.o2, OBJ.o3],
  },
  4: {
    title: 'Mash-up / song sketch',
    learningOutcome: 'To combine song fragments or original lyrics over the four-chord bed (Axis of Awesome–style classroom mash-up concept).',
    successCriteria: 'I can structure verse/chorus on the loop; I can rehearse a 60-second sketch.',
    introduction: 'Discuss respectful use of song ideas; keep to short public-domain/own lyrics where needed.',
    mainActivity: 'Group song sketch → lyric writing → rehearsal.',
    plenary: 'Mini performances; peer feedback on structure and groove.',
    vocabulary: 'structure, mash-up, verse, chorus, arrangement',
    keyQuestions: 'How does structure help the audience recognise your idea?',
    resources: PDF,
    objectiveIds: [OBJ.o3, OBJ.o1],
  },
  5: {
    title: 'Share, reflect, next steps',
    learningOutcome: 'To perform a polished sketch and evaluate using KS3 musical vocabulary.',
    successCriteria: 'I can perform with focus; I can evaluate texture, timing and hook clearly.',
    introduction: 'Rehearsal goals; stagecraft basics.',
    mainActivity: 'Final rehearsal → class performances → written reflection.',
    plenary: 'Set one personal target for the next performing unit.',
    vocabulary: 'evaluate, texture, dynamics, timing, audience',
    keyQuestions: 'What will you improve first next lesson — pulse, hook, or balance?',
    resources: PDF,
    objectiveIds: [OBJ.o4, OBJ.o2],
  },
};

const SEED_ACTIVITIES: SeedActivity[] = [
  act({
    unitLesson: 1,
    category: CAT.listen,
    activity: 'Spot the progression',
    description: '<p>Listen for the shared I–V–vi–IV loop across short pop excerpts.</p>',
    activityText: '<p>Hands up when the progression restarts; then map chords on the board.</p>',
    time: 12,
  }),
  act({
    unitLesson: 1,
    category: CAT.play,
    activity: 'Four-chord station rotation',
    description: '<p>Ukulele, keyboard and guitar stations learning C–G–Am–F (or equivalent).</p>',
    activityText: '<p>3 minutes per station; peer coaches help fingerings. Use the chord chart PDF.</p>',
    time: 20,
    resourceLink: PDF_CHART,
  }),
  act({
    unitLesson: 1,
    category: CAT.share,
    activity: 'Pulse circle check',
    description: '<p>Whole class plays the loop; freeze on cue to check pulse.</p>',
    activityText: '<p>Exit ticket: Roman numerals + chord names.</p>',
    time: 10,
  }),
  act({
    unitLesson: 2,
    category: CAT.play,
    activity: 'Band role carousel',
    description: '<p>Bass, chords, rhythm and melody roles over the same progression.</p>',
    activityText: '<p>Rotate every 4 minutes; keep the groove continuous.</p>',
    time: 24,
  }),
  act({
    unitLesson: 2,
    category: CAT.share,
    activity: 'Record the groove',
    description: '<p>Capture 30 seconds and give ensemble feedback.</p>',
    activityText: '<p>Focus feedback on timing and balance only.</p>',
    time: 12,
  }),
  act({
    unitLesson: 3,
    category: CAT.create,
    activity: 'Hook improvisation',
    description: '<p>Improvise short melodic hooks over the loop.</p>',
    activityText: '<p>Choose one hook; refine with stepwise motion and a clear end.</p>',
    time: 22,
  }),
  act({
    unitLesson: 3,
    category: CAT.share,
    activity: 'Hook showcase',
    description: '<p>Groups share hooks; class identifies strongest melodic shape.</p>',
    activityText: '<p>Use vocabulary: stepwise, leap, repetition, contrast.</p>',
    time: 12,
  }),
  act({
    unitLesson: 4,
    category: CAT.create,
    activity: 'Song sketch / mash-up plan',
    description: '<p>Plan a 60-second verse–chorus sketch on I–V–vi–IV.</p>',
    activityText: '<p>Own lyrics preferred; keep any borrowed fragments minimal and attributed in discussion.</p>',
    time: 25,
  }),
  act({
    unitLesson: 4,
    category: CAT.play,
    activity: 'Sketch rehearsal',
    description: '<p>Rehearse with clear structure cues from a student MD.</p>',
    activityText: '<p>Count-ins, dynamics plan, ending gesture.</p>',
    time: 15,
  }),
  act({
    unitLesson: 5,
    category: CAT.share,
    activity: 'Class performances',
    description: '<p>Perform sketches; evaluate with KS3 vocabulary.</p>',
    activityText: '<p>Written reflection: texture, timing, hook, next target.</p>',
    time: 30,
    resourceLink: PDF,
  }),
];

function isOwnedCategory(name: string) {
  return ALL_CATEGORIES.includes(name as any) || name.startsWith('4 Chords —');
}

function isOwnedActivity(a: Activity) {
  return isOwnedCategory(String(a.category || '')) || String((a as any).notes || '').includes(SEED_NOTE);
}

function buildLessons(activities: Activity[], lessonNumbers: string[]): Record<string, LessonData> {
  const lessons: Record<string, LessonData> = {};
  for (let i = 1; i <= 5; i++) {
    const key = lessonNumbers[i - 1];
    const meta = LESSON_META[i];
    const lessonActs = activities.filter((a) => String(a.lessonNumber) === String(i));
    const categoriesInLesson = ALL_CATEGORIES.filter((c) => lessonActs.some((a) => a.category === c));
    const grouped: Record<string, Activity[]> = {};
    categoriesInLesson.forEach((c) => {
      grouped[c] = lessonActs.filter((a) => a.category === c);
    });
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
      notes: `${SEED_NOTE}. Prototype inspired by Musical Futures informal learning and the public four-chord classroom concept — original outlines only.`,
      resourceLink: PDF,
      isUserCreated: true,
      academicYear: ACADEMIC_YEAR,
      curriculumType: 'CUSTOM',
      customObjectives: meta.objectiveIds,
    };
  }
  return lessons;
}

export async function setupKS3FourChords(options?: { force?: boolean }) {
  const force = Boolean(options?.force);
  if (!force && localStorage.getItem(MARKER_KEY) === '1') {
    return { skipped: true as const, sheetId: SHEET_ID };
  }

  seedLocalCurriculumObjectives(CURRICULUM);
  ensureLocalYearGroup(SHEET_ID, SHEET_ID, '#0EA5E9');

  const categoryMerge = mergeCategoriesLocal(
    ALL_CATEGORIES.map((name) => ({
      name,
      color: '#0EA5E9',
      yearGroups: Object.fromEntries(YEAR_GROUPS.map((y) => [y, true])),
    })),
    isOwnedCategory,
  );

  const activities = mergeActivitiesLocal(
    SEED_ACTIVITIES.map((a) => ({ ...a, notes: SEED_NOTE }) as any),
    isOwnedActivity,
  );

  const existingLessonData = readJson<any>(`lesson-data-${SHEET_ID}`, { lessonNumbers: [] });
  const lessonNumbers = allocateLessonNumbers(5, existingLessonData.lessonNumbers || []);
  const lessons = buildLessons(activities, lessonNumbers);
  const lessonPayload = mergeLessonsLocal(SHEET_ID, lessons, SEED_NOTE, LESSON_KEYS_KEY, UNIT);

  const lessonStack: StackedLesson = {
    id: newStackId('ks3-4c'),
    name: STACK_NAME,
    description:
      'KS3 Music prototype: Musical Futures–style informal learning around the I–V–vi–IV progression. Demo seed content for the prototype login.',
    color: '#0284C7',
    lessons: lessonPayload.writtenNumbers,
    totalTime: activities.reduce((s, a) => s + (a.time || 0), 0),
    totalActivities: activities.length,
    customObjectives: [OBJ.o1, OBJ.o2, OBJ.o3, OBJ.o4],
    curriculumType: 'CUSTOM',
    created_at: new Date().toISOString(),
  };
  mergeStackLocal(lessonStack, STACK_ID_KEY, STACK_NAME);

  finishPrototypeSeed({
    activities,
    categories: ALL_CATEGORIES,
    categoryMerge,
    source: 'ks3-4chords-seed',
    markerKey: MARKER_KEY,
  });

  return {
    skipped: false as const,
    activities: activities.length,
    lessons: lessonPayload.writtenNumbers.length,
    stackId: lessonStack.id,
    sheetId: SHEET_ID,
  };
}

export const KS3_FOUR_CHORDS_COURSE = {
  title: 'KS3 Music — 4 Chords',
  pdfUrl: PDF,
  level: LEVEL,
  sheetId: SHEET_ID,
  musicalFuturesUrl: MF_LINK,
  lessons: Object.entries(LESSON_META).map(([num, m]) => ({
    number: Number(num),
    title: m.title,
    summary: m.learningOutcome,
  })),
} as const;

if (typeof window !== 'undefined') {
  (window as any).setupKS3FourChords = setupKS3FourChords;
}
