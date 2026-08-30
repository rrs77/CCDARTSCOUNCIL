/**
 * Jazz North — local showcase seed for Partner Hub demos.
 *
 * Seeds a full KS1 lesson plan inspired by the public Mr Big scheme of work
 * (active listening + improvisation with untuned percussion). Links out to
 * jazznorth.org; official Learning Resources Area materials stay on their site.
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
  type LocalObjectiveSeed,
} from './prototypeLocalSeed';
import { getActivityStarKey } from './activityStars';
import {
  PARTNER_PLANNING_ORGS,
  registerPartnerPlanningPack,
} from './partnerPlanning';
import {
  JN_JAZZ_CAMP,
  JN_LEARNING_RESOURCES,
  JN_MR_BIG,
  JN_PLAYLIST_PROJECT,
  JN_SITE,
} from './jazzNorthBranding';
import { highlightPaidHubActivities } from './recentlyAddedActivities';

const SHEET_ID = 'Year 2 Music';
const UNIT = 'Mr Big → Jazz contrasts';
const STACK_NAME = 'Jazz North — Showcase Lesson';
const YEAR_GROUPS = ['Year 2 Music', 'Year 1 Music', 'Year 2', 'Year 1', 'KS1 Music'];
const MARKER_KEY = 'ccd-jn-mr-big-seeded-v1';
const STACK_ID_KEY = 'ccd-jn-mr-big-stack-id';
const LESSON_KEYS_KEY = 'ccd-jn-mr-big-lesson-keys';
const SEED_NOTE = 'JN_SEED:MrBigShowcase';
const COLOR = '#FF53B6';
const LEVEL = 'KS1';

const PDF_OVERVIEW = '/partners/jazznorth/jn-mr-big-lesson-overview.pdf';

const CAT = {
  warmUp: 'Jazz North — Warm-ups',
  listen: 'Jazz North — Listen',
  explore: 'Jazz North — Explore',
  create: 'Jazz North — Create',
  reflect: 'Jazz North — Reflect',
} as const;
const ALL_CATEGORIES = Object.values(CAT);

const OBJ = {
  ygId: 'proto-jn-ks1-music',
  listen: 'proto-jn-ks1-l1',
  contrast: 'proto-jn-ks1-c1',
  improvise: 'proto-jn-ks1-i1',
  voice: 'proto-jn-ks1-v1',
};

const CURRICULUM: LocalObjectiveSeed = {
  yearGroupId: OBJ.ygId,
  yearGroupName: 'KS1 Music — Jazz North (prototype)',
  color: COLOR,
  linkedYearGroups: YEAR_GROUPS,
  areas: [
    {
      id: 'proto-jn-area-listening',
      name: 'Listening and Appraising',
      objectives: [
        {
          id: OBJ.listen,
          code: 'KS1-JN-L1',
          text: 'Listen critically to jazz-inspired music and notice changes in dynamics, pitch, tempo, mood or instrumentation',
          description: 'Active listening to contrasting musical elements',
        },
        {
          id: OBJ.contrast,
          code: 'KS1-JN-C1',
          text: 'Describe simple musical contrasts using child-friendly vocabulary (loud/quiet, high/low, fast/slow, bright/dark)',
          description: 'Musical vocabulary for contrasts',
        },
      ],
    },
    {
      id: 'proto-jn-area-creating',
      name: 'Creating and Improvising',
      objectives: [
        {
          id: OBJ.improvise,
          code: 'KS1-JN-I1',
          text: 'Improvise short musical contrasts on untuned percussion in response to a story or mood',
          description: 'First steps into improvisation',
        },
        {
          id: OBJ.voice,
          code: 'KS1-JN-V1',
          text: 'Use the voice expressively to echo, call-and-response or soundtrack a character moment',
          description: 'Expressive voice',
        },
      ],
    },
  ],
};

const ALL_OBJ_IDS = [OBJ.listen, OBJ.contrast, OBJ.improvise, OBJ.voice];

function isOwnedCategory(name: string) {
  return name.startsWith('Jazz North —') || name.startsWith('JN ');
}
function isOwnedActivity(a: Activity) {
  return (
    String((a as any)?.notes || '').includes('JN_SEED') ||
    isOwnedCategory(String(a.category || ''))
  );
}

const SEED_ACTIVITIES: Partial<Activity>[] = [
  {
    activity: 'Circle welcome & jazz curiosity',
    category: CAT.warmUp,
    time: 5,
    activityText: 'Gather · share outcomes · “What might jazz sound like?”',
    description: [
      'Sit in a circle. Share today’s goal: listen for musical contrasts and invent short jazz-inspired sounds for Mr Big’s story.',
      'Quick curiosity check: show three picture cards (loud/quiet, high/low, fast/slow). Children point or mime which contrast they already know.',
      'Safety: careful instrument handling; stop signal = palms up / freeze.',
    ].join('\n'),
    lessonNumber: 1,
    unitLesson: 1,
    unitName: UNIT,
    teachingUnit: UNIT,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    resourceLink: JN_MR_BIG,
    link: JN_SITE,
    notes: SEED_NOTE,
    curriculumType: 'CUSTOM',
    customObjectives: ALL_OBJ_IDS,
  } as any,
  {
    activity: 'Meet Mr Big — story hook',
    category: CAT.listen,
    time: 10,
    activityText: 'Picture book hook · mood talk · optional PSHE link',
    description: [
      'Inspired by Jazz North’s public Mr Big scheme of work (Ed Vere’s Mr Big) — KS1 active listening with optional PSHE.',
      'Share a short extract / key illustrations: lonely Mr Big, the big piano, finding friends through music.',
      'Ask: How might the music feel when Mr Big is alone? When friends join? Collect mood words (sad, bold, bouncy, warm).',
      'Teacher note: full lead sheets and audio live in Jazz North’s Learning Resources Area (free account).',
    ].join('\n'),
    lessonNumber: 1,
    unitLesson: 1,
    unitName: UNIT,
    teachingUnit: UNIT,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    resourceLink: JN_MR_BIG,
    link: JN_LEARNING_RESOURCES,
    notes: SEED_NOTE,
    curriculumType: 'CUSTOM',
    customObjectives: [OBJ.listen, OBJ.contrast],
  } as any,
  {
    activity: 'Contrast detective listening',
    category: CAT.listen,
    time: 12,
    activityText: 'Dynamics · pitch · tempo · mood · instrumentation',
    description: [
      'Play two short contrasting excerpts (teacher-chosen public jazz / classroom-safe tracks, or Jazz North scheme audio if logged in).',
      'Children hold up contrast cards: loud/quiet · high/low · fast/slow · bright/dark · few/many instruments.',
      'Partner whisper: “I noticed…” using one vocabulary word. Spot-share 3 pairs.',
      'Link: Jazz North Learning Resources Area sections — Aural & Listening / Model Music Curriculum pathways.',
    ].join('\n'),
    lessonNumber: 1,
    unitLesson: 1,
    unitName: UNIT,
    teachingUnit: UNIT,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    resourceLink: JN_LEARNING_RESOURCES,
    link: JN_MR_BIG,
    notes: SEED_NOTE,
    curriculumType: 'CUSTOM',
    customObjectives: [OBJ.listen, OBJ.contrast],
  } as any,
  {
    activity: 'Voice colours for Mr Big',
    category: CAT.explore,
    time: 8,
    activityText: 'Expressive voice · call-and-response · character soundtrack',
    description: [
      'Echo games: soft “hello” vs bold “HELLO!”; high squeak vs low rumble; slow walk-sound vs quick tip-tap.',
      'In pairs, invent a 4-beat vocal ostinato for lonely Mr Big, then a contrasting ostinato for “friends arrive”.',
      'Optional: layer one group soft + one group bold for a live “mix”.',
    ].join('\n'),
    lessonNumber: 1,
    unitLesson: 1,
    unitName: UNIT,
    teachingUnit: UNIT,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    resourceLink: JN_MR_BIG,
    link: JN_LEARNING_RESOURCES,
    notes: SEED_NOTE,
    curriculumType: 'CUSTOM',
    customObjectives: [OBJ.voice, OBJ.contrast],
  } as any,
  {
    activity: 'Percussion improvisation — jazz contrasts',
    category: CAT.create,
    time: 15,
    activityText: 'Untuned percussion · short improvisations · story scenes',
    description: [
      'Groups of 4–5 with untuned percussion. Conduct with hand signals: loud/quiet, stop/start, sparse/busy.',
      'Scene A (lonely): quiet, sparse sounds. Scene B (friends / piano party): louder, more players, clearer pulse.',
      'Each group improvises 20–30 seconds per scene; class guesses which scene they heard.',
      'Stretch: add a “soloist” for 4 beats while others keep a soft groove — first taste of improvisation spotlight.',
      'Teacher note: Jazz North Educators’ Forum and Learning Resources Area offer further improvisation pedagogy ideas.',
    ].join('\n'),
    lessonNumber: 1,
    unitLesson: 1,
    unitName: UNIT,
    teachingUnit: UNIT,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    resourceLink: JN_LEARNING_RESOURCES,
    link: JN_JAZZ_CAMP,
    notes: SEED_NOTE,
    curriculumType: 'CUSTOM',
    customObjectives: ALL_OBJ_IDS,
  } as any,
  {
    activity: 'Perform, reflect, next listening',
    category: CAT.reflect,
    time: 10,
    activityText: 'Gallery share · two stars and a wish · signpost Playlist Project',
    description: [
      'Two groups perform Scene A→B while others hold up the contrast cards they hear.',
      'Exit ticket: one contrast word + one feeling word for Mr Big’s music.',
      'Signpost next steps: Jazz North Playlist Project (KS2 Milestones listening pathway) and Jazz Camp for Girls for older / hub pathways.',
      'Teacher follow-up: create a free account at jazznorth.org/learning-resources-area for full downloads.',
    ].join('\n'),
    lessonNumber: 1,
    unitLesson: 1,
    unitName: UNIT,
    teachingUnit: UNIT,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    resourceLink: JN_PLAYLIST_PROJECT,
    link: JN_LEARNING_RESOURCES,
    notes: SEED_NOTE,
    curriculumType: 'CUSTOM',
    customObjectives: [OBJ.contrast, OBJ.voice],
  } as any,
];

function buildShowcaseLesson(activities: Activity[], _lessonNumber: string): LessonData {
  return {
    title: 'Mr Big → Jazz contrasts',
    lessonName: 'KS1 showcase lesson · Jazz North',
    unitName: UNIT,
    teachingUnit: UNIT,
    activities,
    duration: activities.reduce((s, a) => s + (a.time || 0), 0),
    totalTime: activities.reduce((s, a) => s + (a.time || 0), 0),
    orderedActivities: activities,
    categoryOrder: ALL_CATEGORIES,
    grouped: Object.fromEntries(
      ALL_CATEGORIES.map((c) => [c, activities.filter((a) => a.category === c)]),
    ),
    curriculumType: 'CUSTOM',
    customObjectives: ALL_OBJ_IDS,
    academicYear: '2026-2027',
    customHeader: 'Jazz North — CCDesigner prototype showcase',
    customFooter:
      'Demo lesson plan — original CCDesigner outline linking to jazznorth.org (Mr Big scheme / Learning Resources Area)',
    learningOutcome:
      'Pupils listen for musical contrasts in a jazz-inspired story context and improvise short contrasting soundscapes with voice and untuned percussion.',
    successCriteria:
      'We can name at least one musical contrast we heard.\nWe use quiet/loud or sparse/busy sounds on purpose.\nWe stop and start together on the conductor signal.\nEveryone contributes a sound to at least one scene.',
    introduction:
      'Hook with Mr Big (Ed Vere) — loneliness, piano, friendship through music. Agree listening vocabulary and safety for instruments. Warm up with contrast card mime.',
    mainActivity:
      'Contrast detective listening → expressive voice colours → conducted percussion improvisation for lonely vs friends scenes, with optional short solo spotlight.',
    plenary:
      'Perform Scene A→B; peer feedback with contrast cards; exit ticket; signpost Learning Resources Area, Playlist Project and Jazz Camp for Girls on jazznorth.org.',
    vocabulary:
      'Jazz · improvisation · dynamics · pitch · tempo · mood · instrumentation · contrast · ostinato · call-and-response · pulse',
    keyQuestions:
      'What changed in the music?\nHow did that change make Mr Big feel?\nWhen should we play sparsely — and when should we play busily?\nWhat would you add next lesson to help the story?',
    resources:
      'Mr Big picture book (or key illustrations) · untuned percussion · contrast cards · whiteboard · timer · teacher access to jazznorth.org/mr-big-scheme-of-work and Learning Resources Area',
    differentiation:
      'Support: fewer instruments, pre-chosen contrast cards, teacher models first.\nChallenge: invent a third “party” scene; lead a short solo; invent a class ostinato.\nEAL: gesture + picture first; allow mother-tongue mood words then English labels.',
    assessment:
      'Formative observation of listening responses and improvisation control; exit ticket vocabulary; optional audio clip of best Scene A→B (school policy).',
    assessmentObjectives: [
      'KS1-JN-L1 Listen for musical contrasts',
      'KS1-JN-C1 Describe contrasts with simple vocabulary',
      'KS1-JN-I1 Improvise contrasts on untuned percussion',
      'KS1-JN-V1 Use the voice expressively',
    ],
    resourceLink: JN_MR_BIG,
    additionalLinks: `${JN_LEARNING_RESOURCES}\n${JN_PLAYLIST_PROJECT}\n${JN_JAZZ_CAMP}\n${PDF_OVERVIEW}`,
    notes: `${SEED_NOTE}. Full showcase lesson for PDF export. Inspired by public Jazz North listings (Mr Big scheme of work, Learning Resources Area) — not a copy of downloadable packs.`,
  } as any;
}

function registerJnPlanning(activities: Activity[], lessonKeys: string[]) {
  const org = PARTNER_PLANNING_ORGS.jazznorth;
  registerPartnerPlanningPack({
    ...org,
    projectId: 'mr-big-showcase',
    projectTitle: 'Mr Big → Jazz contrasts',
    sheetId: SHEET_ID,
    activityIds: activities.map((a) => getActivityStarKey(a)),
    lessonKeys,
  });
}

export const JN_SHOWCASE = {
  title: 'Mr Big → Jazz contrasts',
  productUrl: JN_MR_BIG,
  learningResourcesUrl: JN_LEARNING_RESOURCES,
  pdfUrl: PDF_OVERVIEW,
  agesLabel: 'KS1 · Ages 5–7 (adaptable)',
  durationLabel: '≈ 60 minutes',
  summary:
    'Full CCDesigner lesson plan demo inspired by Jazz North’s Mr Big active-listening scheme — timed activities, outcomes, differentiation and assessment ready for PDF export.',
};

export async function setupJazzNorthExample(options?: {
  force?: boolean;
  registerPartnerPlanning?: boolean;
}) {
  const force = Boolean(options?.force);
  const shouldRegister = Boolean(options?.registerPartnerPlanning);

  if (!force && localStorage.getItem(MARKER_KEY) === '1') {
    if (shouldRegister) {
      try {
        const existing = readJson<Activity[]>('library-activities', []).filter((a) =>
          isOwnedActivity(a),
        );
        registerJnPlanning(existing, readJson<string[]>(LESSON_KEYS_KEY, []));
      } catch {
        /* ignore */
      }
    }
    return { skipped: true as const, sheetId: SHEET_ID };
  }

  seedLocalCurriculumObjectives(CURRICULUM);
  ensureLocalYearGroup(SHEET_ID, SHEET_ID, COLOR);
  const categoryMerge = mergeCategoriesLocal(
    ALL_CATEGORIES.map((name) => ({
      name,
      color: COLOR,
      yearGroups: Object.fromEntries(YEAR_GROUPS.map((y) => [y, true])),
    })),
    isOwnedCategory,
  );

  const existingLessonData = readJson<any>(`lesson-data-${SHEET_ID}`, { lessonNumbers: [] });
  const lessonNumbers = allocateLessonNumbers(1, existingLessonData.lessonNumbers || []);
  const lessonNum = lessonNumbers[0];

  const seeded = SEED_ACTIVITIES.map(
    (a) =>
      ({
        ...a,
        lessonNumber: String(lessonNum),
        unitLesson: 1,
        notes: SEED_NOTE,
        curriculumType: 'CUSTOM',
        level: LEVEL,
      }) as any,
  );
  const activities = mergeActivitiesLocal(seeded, isOwnedActivity);

  const lessons = {
    [lessonNum]: buildShowcaseLesson(activities, lessonNum),
  };
  const lessonPayload = mergeLessonsLocal(SHEET_ID, lessons, SEED_NOTE, LESSON_KEYS_KEY, UNIT);

  const lessonStack: StackedLesson = {
    id: newStackId('jn-mrb'),
    name: STACK_NAME,
    description:
      'Full showcase lesson for Jazz North — export to PDF to demonstrate CCDesigner lesson-plan depth.',
    color: COLOR,
    lessons: lessonPayload.writtenNumbers,
    totalTime: activities.reduce((s, a) => s + (a.time || 0), 0),
    totalActivities: activities.length,
    created_at: new Date().toISOString(),
  };
  mergeStackLocal(lessonStack, STACK_ID_KEY, STACK_NAME);

  finishPrototypeSeed({
    activities,
    categories: ALL_CATEGORIES,
    categoryMerge,
    source: 'jazz-north-mr-big-seed',
    markerKey: MARKER_KEY,
    starActivities: false,
  });

  highlightPaidHubActivities(activities, {
    partnerSlug: 'jazznorth',
    partnerLabel: 'Jazz North',
    pickTitles: [
      'Meet Mr Big — story hook',
      'Contrast detective listening',
      'Percussion improvisation — jazz contrasts',
      'Perform, reflect, next listening',
    ],
    fallbackCount: 4,
    categories: ALL_CATEGORIES,
  });

  if (shouldRegister) {
    registerJnPlanning(activities, lessonPayload.writtenNumbers);
  }

  return {
    skipped: false as const,
    activities: activities.length,
    lessons: lessonPayload.writtenNumbers.length,
    stackId: lessonStack.id,
    sheetId: SHEET_ID,
  };
}

/** —— Playlist Project (Milestones) — second showcase resource —— */

const PL_SHEET_ID = 'Year 5 Music';
const PL_UNIT = 'Playlist Project — Milestones';
const PL_STACK_NAME = 'Jazz North — Playlist Project Showcase';
const PL_YEAR_GROUPS = ['Year 5 Music', 'Year 4 Music', 'Year 6 Music', 'Year 5', 'Year 4', 'Year 6'];
const PL_MARKER_KEY = 'ccd-jn-playlist-milestones-seeded-v1';
const PL_STACK_ID_KEY = 'ccd-jn-playlist-milestones-stack-id';
const PL_LESSON_KEYS_KEY = 'ccd-jn-playlist-milestones-lesson-keys';
const PL_SEED_NOTE = 'JN_SEED:PlaylistMilestonesShowcase';
const PL_PDF = '/partners/jazznorth/jn-playlist-milestones-overview.pdf';

const PL_CAT = {
  warmUp: 'Jazz North — Playlist warm-ups',
  listen: 'Jazz North — Playlist listen',
  explore: 'Jazz North — Playlist explore',
  create: 'Jazz North — Playlist create',
  reflect: 'Jazz North — Playlist reflect',
} as const;
const PL_ALL_CATEGORIES = Object.values(PL_CAT);

const PL_OBJ = {
  ygId: 'proto-jn-ks2-playlist',
  aural: 'proto-jn-ks2-a1',
  culture: 'proto-jn-ks2-c1',
  improvise: 'proto-jn-ks2-i1',
  reflect: 'proto-jn-ks2-r1',
};

const PL_CURRICULUM: LocalObjectiveSeed = {
  yearGroupId: PL_OBJ.ygId,
  yearGroupName: 'KS2 Music — Jazz North Playlist (prototype)',
  color: COLOR,
  linkedYearGroups: PL_YEAR_GROUPS,
  areas: [
    {
      id: 'proto-jn-pl-listening',
      name: 'Listening and Aural Memory',
      objectives: [
        {
          id: PL_OBJ.aural,
          code: 'KS2-JN-A1',
          text: 'Build an aural bank of jazz repertoire through repeated playlist listening and notice melodic / rhythmic hooks',
          description: 'Repeated listening pathway',
        },
        {
          id: PL_OBJ.culture,
          code: 'KS2-JN-C2',
          text: 'Talk about cultural context and why repeated listening helps internalise a tune',
          description: 'Context and musical understanding',
        },
      ],
    },
    {
      id: 'proto-jn-pl-creating',
      name: 'Responding and Improvising',
      objectives: [
        {
          id: PL_OBJ.improvise,
          code: 'KS2-JN-I2',
          text: 'Respond to a jazz playlist track with movement, vocal echo or a short improvisation idea',
          description: 'Creative response to listening',
        },
        {
          id: PL_OBJ.reflect,
          code: 'KS2-JN-R1',
          text: 'Reflect on how listening skills transfer to composing and performing',
          description: 'Metacognition / next steps',
        },
      ],
    },
  ],
};

const PL_ALL_OBJ_IDS = [PL_OBJ.aural, PL_OBJ.culture, PL_OBJ.improvise, PL_OBJ.reflect];

function isPlaylistOwnedCategory(name: string) {
  return name.startsWith('Jazz North — Playlist');
}
function isPlaylistOwnedActivity(a: Activity) {
  return (
    String((a as any)?.notes || '').includes('JN_SEED:Playlist') ||
    isPlaylistOwnedCategory(String(a.category || ''))
  );
}

const PL_SEED_ACTIVITIES: Partial<Activity>[] = [
  {
    activity: 'Playlist welcome & listening goals',
    category: PL_CAT.warmUp,
    time: 5,
    activityText: 'Share pathway stages · agree focus listening behaviours',
    description: [
      'Introduce Jazz North’s Playlist Project (Milestones): repeated listening → active listening activities → live / video culmination.',
      'Success check: quiet bodies for focus listening; notice a hook (melody, rhythm or mood).',
    ].join('\n'),
    lessonNumber: 1,
    unitLesson: 1,
    unitName: PL_UNIT,
    teachingUnit: PL_UNIT,
    level: 'KS2',
    yearGroups: PL_YEAR_GROUPS,
    resourceLink: JN_PLAYLIST_PROJECT,
    link: JN_SITE,
    notes: PL_SEED_NOTE,
    curriculumType: 'CUSTOM',
    customObjectives: PL_ALL_OBJ_IDS,
  } as any,
  {
    activity: 'Milestones hook — why repeated listening works',
    category: PL_CAT.listen,
    time: 10,
    activityText: 'Story of the Maryland class · Miles Davis Milestones inspiration',
    description: [
      'Retell the public Jazz North origin story: children internalised Miles Davis’ Milestones through background playlist listening.',
      'Discuss: What tunes stick in your head? Why might hearing something often help you sing or clap it later?',
      'Teacher note: full scheme packs / audio live in the Learning Resources Area (free account).',
    ].join('\n'),
    lessonNumber: 1,
    unitLesson: 1,
    unitName: PL_UNIT,
    teachingUnit: PL_UNIT,
    level: 'KS2',
    yearGroups: PL_YEAR_GROUPS,
    resourceLink: JN_PLAYLIST_PROJECT,
    link: JN_LEARNING_RESOURCES,
    notes: PL_SEED_NOTE,
    curriculumType: 'CUSTOM',
    customObjectives: [PL_OBJ.aural, PL_OBJ.culture],
  } as any,
  {
    activity: 'Focus listen — find the hook',
    category: PL_CAT.listen,
    time: 12,
    activityText: 'Playlist extract · map melody / rhythm / mood',
    description: [
      'Play a short classroom-safe extract from the teacher’s Playlist Project track list (or Learning Resources audio).',
      'Children map: melodic hook · rhythmic hook · mood word. Share in pairs then spot-check three ideas.',
      'Optional: mark “same / different” when a solo or section changes.',
    ].join('\n'),
    lessonNumber: 1,
    unitLesson: 1,
    unitName: PL_UNIT,
    teachingUnit: PL_UNIT,
    level: 'KS2',
    yearGroups: PL_YEAR_GROUPS,
    resourceLink: JN_LEARNING_RESOURCES,
    link: JN_PLAYLIST_PROJECT,
    notes: PL_SEED_NOTE,
    curriculumType: 'CUSTOM',
    customObjectives: [PL_OBJ.aural, PL_OBJ.culture],
  } as any,
  {
    activity: 'Active listening stations',
    category: PL_CAT.explore,
    time: 12,
    activityText: 'Movement · clap echo · mood tableau · instrument colour',
    description: [
      'Rotate short stations linked to Playlist Project Stage Two active-listening ideas (prototype outline):',
      '1) Move to the pulse / freeze on a signal. 2) Clap or vocal-echo a short motif. 3) Freeze-frame the mood. 4) Choose untuned percussion “colour” for a section.',
      'Keep each station tight (2–3 minutes) so energy stays high.',
    ].join('\n'),
    lessonNumber: 1,
    unitLesson: 1,
    unitName: PL_UNIT,
    teachingUnit: PL_UNIT,
    level: 'KS2',
    yearGroups: PL_YEAR_GROUPS,
    resourceLink: JN_PLAYLIST_PROJECT,
    link: JN_LEARNING_RESOURCES,
    notes: PL_SEED_NOTE,
    curriculumType: 'CUSTOM',
    customObjectives: [PL_OBJ.improvise, PL_OBJ.aural],
  } as any,
  {
    activity: 'Call-and-response improvisation taste',
    category: PL_CAT.create,
    time: 12,
    activityText: '4-beat call · invent reply · optional solo spotlight',
    description: [
      'Teacher plays / sings a 4-beat call inspired by the track; groups invent a reply on voice or untuned percussion.',
      'Stretch: one volunteer solos for 4 beats while others keep a soft groove — first improvisation spotlight.',
      'Link: Jazz North Educators’ Forum discussions on improvisation pedagogy in the curriculum.',
    ].join('\n'),
    lessonNumber: 1,
    unitLesson: 1,
    unitName: PL_UNIT,
    teachingUnit: PL_UNIT,
    level: 'KS2',
    yearGroups: PL_YEAR_GROUPS,
    resourceLink: JN_LEARNING_RESOURCES,
    link: JN_PLAYLIST_PROJECT,
    notes: PL_SEED_NOTE,
    curriculumType: 'CUSTOM',
    customObjectives: PL_ALL_OBJ_IDS,
  } as any,
  {
    activity: 'Reflect & plan the listening week',
    category: PL_CAT.reflect,
    time: 9,
    activityText: 'Exit ticket · homework playlist moments · Stage Three signpost',
    description: [
      'Exit ticket: one hook I heard + one way I’ll listen again this week (classroom playlist / home).',
      'Signpost Stage Three: interactive classroom visit video (Helena Summerfield) or partner hub live visit where available.',
      'Teacher follow-up: helena@jazznorth.org for Playlist Project partnership; Learning Resources Area account for packs.',
    ].join('\n'),
    lessonNumber: 1,
    unitLesson: 1,
    unitName: PL_UNIT,
    teachingUnit: PL_UNIT,
    level: 'KS2',
    yearGroups: PL_YEAR_GROUPS,
    resourceLink: JN_PLAYLIST_PROJECT,
    link: JN_LEARNING_RESOURCES,
    notes: PL_SEED_NOTE,
    curriculumType: 'CUSTOM',
    customObjectives: [PL_OBJ.reflect, PL_OBJ.culture],
  } as any,
];

function buildPlaylistLesson(activities: Activity[]): LessonData {
  return {
    title: 'Playlist Project — Milestones listening lesson',
    lessonName: 'KS2 showcase lesson · Jazz North Playlist Project',
    unitName: PL_UNIT,
    teachingUnit: PL_UNIT,
    activities,
    duration: activities.reduce((s, a) => s + (a.time || 0), 0),
    totalTime: activities.reduce((s, a) => s + (a.time || 0), 0),
    orderedActivities: activities,
    categoryOrder: PL_ALL_CATEGORIES,
    grouped: Object.fromEntries(
      PL_ALL_CATEGORIES.map((c) => [c, activities.filter((a) => a.category === c)]),
    ),
    curriculumType: 'CUSTOM',
    customObjectives: PL_ALL_OBJ_IDS,
    academicYear: '2026-2027',
    customHeader: 'Jazz North Playlist Project — CCDesigner prototype showcase',
    customFooter:
      'Demo lesson plan — original CCDesigner outline linking to jazznorth.org/playlist-project',
    learningOutcome:
      'Pupils use repeated and active listening to notice hooks in a jazz playlist track and respond with movement, echo and a short improvisation idea.',
    successCriteria:
      'We can name a melodic, rhythmic or mood hook.\nWe show focused listening behaviours.\nWe invent a short call-and-response reply.\nWe can say one way listening helps performing or composing.',
    introduction:
      'Share the Playlist Project / Milestones story and the three-stage pathway. Agree listening goals and success criteria.',
    mainActivity:
      'Focus listen for hooks → active listening stations → call-and-response improvisation taste with optional solo spotlight.',
    plenary:
      'Exit ticket and weekly listening plan; signpost Stage Three visits / Learning Resources Area downloads.',
    vocabulary:
      'Playlist · aural bank · hook · motif · improvisation · call-and-response · pulse · solo · jazz · repeated listening',
    keyQuestions:
      'What stuck in your ear?\nHow did the music change?\nWhen did movement or echo help you listen harder?\nWhat would you put on a class playlist next?',
    resources:
      'Teacher playlist / Learning Resources audio · space for movement · untuned percussion · whiteboard · sticky notes · access to jazznorth.org/playlist-project',
    differentiation:
      'Support: shorter extracts, visual hook cards, echo first then invent.\nChallenge: lead a station; invent a second reply; write a listening journal sentence.\nEAL: gesture first; allow mother-tongue mood words then English labels.',
    assessment:
      'Observation of listening focus and improvisation replies; exit ticket; optional audio of best call-and-response (school policy).',
    assessmentObjectives: [
      'KS2-JN-A1 Build an aural bank through repeated listening',
      'KS2-JN-C2 Talk about cultural context of listening',
      'KS2-JN-I2 Respond with movement, echo or improvisation',
      'KS2-JN-R1 Reflect on listening → performing / composing',
    ],
    resourceLink: JN_PLAYLIST_PROJECT,
    additionalLinks: `${JN_LEARNING_RESOURCES}\n${JN_MR_BIG}\n${PL_PDF}`,
    notes: `${PL_SEED_NOTE}. Full showcase lesson for PDF export. Inspired by public Jazz North Playlist Project pages — not a copy of downloadable packs.`,
  } as any;
}

function registerPlaylistPlanning(activities: Activity[], lessonKeys: string[]) {
  const org = PARTNER_PLANNING_ORGS.jazznorth;
  registerPartnerPlanningPack({
    ...org,
    projectId: 'playlist-milestones-showcase',
    projectTitle: 'Playlist Project — Milestones',
    sheetId: PL_SHEET_ID,
    activityIds: activities.map((a) => getActivityStarKey(a)),
    lessonKeys,
  });
}

export const JN_PLAYLIST_SHOWCASE = {
  title: 'Playlist Project — Milestones listening lesson',
  productUrl: JN_PLAYLIST_PROJECT,
  pdfUrl: PL_PDF,
  agesLabel: 'KS2 · Ages 8–11 (adaptable)',
  durationLabel: '≈ 60 minutes',
  summary:
    'Full CCDesigner lesson plan demo inspired by Jazz North’s Playlist Project (Milestones) — repeated listening, active stations and a first improvisation taste.',
};

export async function setupJazzNorthPlaylistExample(options?: {
  force?: boolean;
  registerPartnerPlanning?: boolean;
}) {
  const force = Boolean(options?.force);
  const shouldRegister = Boolean(options?.registerPartnerPlanning);

  if (!force && localStorage.getItem(PL_MARKER_KEY) === '1') {
    if (shouldRegister) {
      try {
        const existing = readJson<Activity[]>('library-activities', []).filter((a) =>
          isPlaylistOwnedActivity(a),
        );
        registerPlaylistPlanning(existing, readJson<string[]>(PL_LESSON_KEYS_KEY, []));
      } catch {
        /* ignore */
      }
    }
    return { skipped: true as const, sheetId: PL_SHEET_ID };
  }

  seedLocalCurriculumObjectives(PL_CURRICULUM);
  ensureLocalYearGroup(PL_SHEET_ID, PL_SHEET_ID, COLOR);
  const categoryMerge = mergeCategoriesLocal(
    PL_ALL_CATEGORIES.map((name) => ({
      name,
      color: COLOR,
      yearGroups: Object.fromEntries(PL_YEAR_GROUPS.map((y) => [y, true])),
    })),
    isPlaylistOwnedCategory,
  );

  const existingLessonData = readJson<any>(`lesson-data-${PL_SHEET_ID}`, { lessonNumbers: [] });
  const lessonNumbers = allocateLessonNumbers(1, existingLessonData.lessonNumbers || []);
  const lessonNum = lessonNumbers[0];

  const seeded = PL_SEED_ACTIVITIES.map(
    (a) =>
      ({
        ...a,
        lessonNumber: String(lessonNum),
        unitLesson: 1,
        notes: PL_SEED_NOTE,
        curriculumType: 'CUSTOM',
        level: 'KS2',
      }) as any,
  );
  const activities = mergeActivitiesLocal(seeded, isPlaylistOwnedActivity);

  const lessons = {
    [lessonNum]: buildPlaylistLesson(activities),
  };
  const lessonPayload = mergeLessonsLocal(
    PL_SHEET_ID,
    lessons,
    PL_SEED_NOTE,
    PL_LESSON_KEYS_KEY,
    PL_UNIT,
  );

  const lessonStack: StackedLesson = {
    id: newStackId('jn-pl'),
    name: PL_STACK_NAME,
    description:
      'Playlist Project showcase for Jazz North — activities + lesson plan for Lesson Library / PDF export.',
    color: COLOR,
    lessons: lessonPayload.writtenNumbers,
    totalTime: activities.reduce((s, a) => s + (a.time || 0), 0),
    totalActivities: activities.length,
    created_at: new Date().toISOString(),
  };
  mergeStackLocal(lessonStack, PL_STACK_ID_KEY, PL_STACK_NAME);

  finishPrototypeSeed({
    activities,
    categories: PL_ALL_CATEGORIES,
    categoryMerge,
    source: 'jazz-north-playlist-milestones-seed',
    markerKey: PL_MARKER_KEY,
    starActivities: false,
  });

  highlightPaidHubActivities(activities, {
    partnerSlug: 'jazznorth',
    partnerLabel: 'Jazz North',
    pickTitles: [
      'Milestones hook — why repeated listening works',
      'Focus listen — find the hook',
      'Active listening stations',
      'Call-and-response improvisation taste',
    ],
    fallbackCount: 4,
    categories: PL_ALL_CATEGORIES,
  });

  if (shouldRegister) {
    registerPlaylistPlanning(activities, lessonPayload.writtenNumbers);
  }

  return {
    skipped: false as const,
    activities: activities.length,
    lessons: lessonPayload.writtenNumbers.length,
    stackId: lessonStack.id,
    sheetId: PL_SHEET_ID,
  };
}

if (typeof window !== 'undefined') {
  (window as any).setupJazzNorthExample = setupJazzNorthExample;
  (window as any).setupJazzNorthPlaylistExample = setupJazzNorthPlaylistExample;
}
