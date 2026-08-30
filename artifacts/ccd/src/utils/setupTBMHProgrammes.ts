/**
 * Tri-Borough Music Hub — Groove'n'Play + Music Makes Me showcase seeds.
 * Full lesson-plan fields for PDF export. Links to official TBMH pages;
 * mock course-note PDFs are original CCDesigner outlines only.
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
  TBMH_CURRICULUM_GUIDANCE,
  TBMH_GNP_COURSE_NOTES_PDF,
  TBMH_MUSIC_MAKES_ME_COURSE_NOTES_PDF,
  TBMH_SERVICES_2026,
  TBMH_SITE,
} from './tbmhBranding';
import { highlightPaidHubActivities } from './recentlyAddedActivities';

export type TbmhProgrammeId = 'groove-n-play' | 'music-makes-me';

type ProgrammeDef = {
  id: TbmhProgrammeId;
  title: string;
  unit: string;
  stackName: string;
  sheetId: string;
  yearGroups: string[];
  level: string;
  agesLabel: string;
  durationLabel: string;
  color: string;
  productUrl: string;
  pdfUrl: string;
  seedNote: string;
  markerKey: string;
  stackIdKey: string;
  lessonKeysKey: string;
  projectId: string;
  catPrefix: string;
  curriculum: LocalObjectiveSeed;
  pickTitles: string[];
  summary: string;
  learningOutcome: string;
  successCriteria: string;
  introduction: string;
  mainActivity: string;
  plenary: string;
  vocabulary: string;
  keyQuestions: string;
  resources: string;
  differentiation: string;
  assessment: string;
  assessmentObjectives: string[];
  activities: Partial<Activity>[];
};

const ACADEMIC_YEAR = '2026-2027';

const GNP_OBJ = {
  ygId: 'proto-tbmh-gnp-ks2',
  pulse: 'proto-tbmh-gnp-p1',
  play: 'proto-tbmh-gnp-i1',
  listen: 'proto-tbmh-gnp-l1',
  collab: 'proto-tbmh-gnp-c1',
};

const MMM_OBJ = {
  ygId: 'proto-tbmh-mmm-ks2',
  invent: 'proto-tbmh-mmm-c1',
  lyric: 'proto-tbmh-mmm-w1',
  perform: 'proto-tbmh-mmm-p1',
  reflect: 'proto-tbmh-mmm-r1',
};

const PROGRAMMES: Record<TbmhProgrammeId, ProgrammeDef> = {
  'groove-n-play': {
    id: 'groove-n-play',
    title: "Groove'n'Play — Whole Class Instrumental Learning",
    unit: "TBMH — Groove'n'Play",
    stackName: "Tri-Borough Music Hub — Groove'n'Play",
    sheetId: 'Year 4 Music',
    yearGroups: ['Year 4 Music', 'Year 5 Music', 'Year 3 Music', 'Year 3', 'Year 4', 'Year 5'],
    level: 'KS2',
    agesLabel: 'Whole-class WCIL · primary (Y1–Y7 pathways on public listing)',
    durationLabel: 'FREE annual GnP licence + CPD for one teacher (worth £85)',
    color: '#1a1a1a',
    productUrl: TBMH_SERVICES_2026,
    pdfUrl: TBMH_GNP_COURSE_NOTES_PDF,
    seedNote: 'TBMH_SEED:GrooveNPlay',
    markerKey: 'ccd-tbmh-gnp-seeded-v1',
    stackIdKey: 'ccd-tbmh-gnp-stack-id',
    lessonKeysKey: 'ccd-tbmh-gnp-lesson-keys',
    projectId: 'tbmh-groove-n-play',
    catPrefix: 'TBMH GnP',
    summary:
      "Every school can access a FREE Groove'n'Play whole-class online licence for school delivery, plus free CPD for one teacher. Prototype course notes + full CCDesigner lesson for PDF export.",
    curriculum: {
      yearGroupId: GNP_OBJ.ygId,
      yearGroupName: "TBMH Groove'n'Play (prototype)",
      color: '#1a1a1a',
      linkedYearGroups: ['Year 3 Music', 'Year 4 Music', 'Year 5 Music', 'Year 3', 'Year 4', 'Year 5'],
      areas: [
        {
          id: 'proto-tbmh-gnp-area-play',
          name: 'Playing and performing',
          objectives: [
            {
              id: GNP_OBJ.pulse,
              code: 'TBMH-GNP-P1',
              text: 'Maintain a steady pulse while playing and singing in a whole-class ensemble',
            },
            {
              id: GNP_OBJ.play,
              code: 'TBMH-GNP-I1',
              text: 'Perform a short instrumental pattern with control of dynamics and starting/stopping together',
            },
            {
              id: GNP_OBJ.collab,
              code: 'TBMH-GNP-C1',
              text: 'Collaborate as a class band, listening carefully to stay in time',
            },
          ],
        },
        {
          id: 'proto-tbmh-gnp-area-listen',
          name: 'Listening',
          objectives: [
            {
              id: GNP_OBJ.listen,
              code: 'TBMH-GNP-L1',
              text: 'Recognise simple structure (verse/chorus or call-and-response) in the repertoire',
            },
          ],
        },
      ],
    },
    pickTitles: [
      'Pulse warm-up & class band rules',
      'Learn the groove pattern',
      'Layer parts & dynamics',
      'Class performance & reflect',
    ],
    learningOutcome:
      'Pupils play and sing together in a whole-class instrumental groove, keeping a steady pulse, starting/stopping as an ensemble, and reflecting on teamwork.',
    successCriteria:
      'We keep a steady pulse with the class.\nWe start and stop together.\nWe change dynamics when directed.\nWe listen to other parts while we play.',
    introduction:
      "Welcome in Groove'n'Play style (prototype). Share the lesson aim: play as one class band. Agree instrument care and freeze signals. Pulse claps → body percussion → transfer to instruments.",
    mainActivity:
      'Learn a short groove pattern in sections (call-and-response). Layer bass/rhythm/melody or pitched/unpitched roles. Add dynamics map (quiet verse / louder chorus). Rehearse transitions.',
    plenary:
      'Class performance. Two stars and a wish for ensemble skills. Exit ticket: one listening tip that helped. Next step: access FREE GnP licence via Tri-Borough Music Hub school services.',
    vocabulary:
      'Pulse · groove · ensemble · dynamics · call-and-response · ostinato · structure · WCIL · Groove\'n\'Play',
    keyQuestions:
      'What helps us stay in time?\nHow did dynamics change the mood?\nWhich part was hardest to keep steady — and why?\nHow could this support progression to small-group tuition?',
    resources:
      "Classroom instruments / WCIL kit · pulse track optional · whiteboard for structure map · access to TBMH Groove'n'Play licence materials when booked",
    differentiation:
      'Support: larger note values, colour-coded parts, partner players.\nChallenge: improvise a 2-bar fill; lead a call.\nSEND: adaptive instruments, visual pulse cards, optional listening pathway with part cards.',
    assessment:
      'Observation of pulse and ensemble starts/stops; dynamics response; exit ticket; optional audio of class performance for portfolio.',
    assessmentObjectives: [
      'TBMH-GNP-P1 Maintain a steady pulse in ensemble',
      'TBMH-GNP-I1 Perform a short pattern with control',
      'TBMH-GNP-C1 Collaborate as a class band',
      'TBMH-GNP-L1 Recognise simple structure',
    ],
    activities: [
      {
        activity: 'Pulse warm-up & class band rules',
        time: 10,
        activityText: 'Pulse games · instrument care · freeze signal',
        description: [
          "Inspired by Tri-Borough Music Hub Groove'n'Play whole-class instrumental learning (FREE school licence + CPD on public listing).",
          'Clap / stomp pulse; practise freeze. Quick kit check.',
        ].join('\n'),
      },
      {
        activity: 'Learn the groove pattern',
        time: 20,
        activityText: 'Call-and-response · teach pattern in chunks',
        description: [
          'Tutor/teacher models; class echoes. Split into part groups and reassemble.',
          'Keep patterns short and repeatable (ostinato).',
        ].join('\n'),
      },
      {
        activity: 'Layer parts & dynamics',
        time: 20,
        activityText: 'Stack parts · mark quiet / loud · rehearse joins',
        description: [
          'Add layers gradually. Map dynamics to structure on the board.',
          'Practise clean starts after silent bars.',
        ].join('\n'),
      },
      {
        activity: 'Class performance & reflect',
        time: 10,
        activityText: 'Perform · feedback · exit ticket · TBMH next step',
        description: [
          'Full run. Peer feedback on pulse and listening.',
          "Signpost FREE Groove'n'Play licence via TBMH school services pages.",
        ].join('\n'),
      },
    ],
  },
  'music-makes-me': {
    id: 'music-makes-me',
    title: 'Music Makes Me — Song-writing Resource',
    unit: 'TBMH — Music Makes Me',
    stackName: 'Tri-Borough Music Hub — Music Makes Me',
    sheetId: 'Year 5 Music',
    yearGroups: ['Year 5 Music', 'Year 6 Music', 'Year 4 Music', 'Year 4', 'Year 5', 'Year 6'],
    level: 'KS2',
    agesLabel: 'Classroom / whole-school song co-creation · all ages adaptable',
    durationLabel: 'FREE Teaching & Learning song-writing resource (5 strands)',
    color: '#F5E827',
    productUrl: TBMH_CURRICULUM_GUIDANCE,
    pdfUrl: TBMH_MUSIC_MAKES_ME_COURSE_NOTES_PDF,
    seedNote: 'TBMH_SEED:MusicMakesMe',
    markerKey: 'ccd-tbmh-mmm-seeded-v1',
    stackIdKey: 'ccd-tbmh-mmm-stack-id',
    lessonKeysKey: 'ccd-tbmh-mmm-lesson-keys',
    projectId: 'tbmh-music-makes-me',
    catPrefix: 'TBMH MMM',
    summary:
      'Co-create school, class or year-group anthems using Music Makes Me strands (Social Story, Transition, Emotional Regulation, Topic, Celebration). Prototype course notes + full CCDesigner lesson for PDF export.',
    curriculum: {
      yearGroupId: MMM_OBJ.ygId,
      yearGroupName: 'TBMH Music Makes Me (prototype)',
      color: '#C9A227',
      linkedYearGroups: ['Year 4 Music', 'Year 5 Music', 'Year 6 Music', 'Year 4', 'Year 5', 'Year 6'],
      areas: [
        {
          id: 'proto-tbmh-mmm-area-create',
          name: 'Composing and song-writing',
          objectives: [
            {
              id: MMM_OBJ.invent,
              code: 'TBMH-MMM-C1',
              text: 'Contribute ideas to a class song with a clear theme and structure',
            },
            {
              id: MMM_OBJ.lyric,
              code: 'TBMH-MMM-W1',
              text: 'Write or adapt lyrics that fit a pulse and communicate meaning',
            },
          ],
        },
        {
          id: 'proto-tbmh-mmm-area-perform',
          name: 'Performing and reflecting',
          objectives: [
            {
              id: MMM_OBJ.perform,
              code: 'TBMH-MMM-P1',
              text: 'Perform the class song with confidence, clear words and ensemble awareness',
            },
            {
              id: MMM_OBJ.reflect,
              code: 'TBMH-MMM-R1',
              text: 'Reflect on how the song supports wellbeing, belonging or a curriculum topic',
            },
          ],
        },
      ],
    },
    pickTitles: [
      'Choose our song strand',
      'Hook & verse lyric lab',
      'Melody / chant fit',
      'Anthem share',
    ],
    learningOutcome:
      'Pupils co-create and perform a short class song linked to a Music Makes Me strand, using lyric, pulse and structure to express a shared message.',
    successCriteria:
      'Our song has a clear theme.\nLyrics fit the pulse.\nWe can sing a hook together.\nWe can explain who the song is for.',
    introduction:
      'Introduce Music Makes Me (prototype). Browse five strands: Social Story; Transition; Emotional Regulation; Topic; Celebration. Class votes a strand and audience (class / year / school).',
    mainActivity:
      'Hook bank → verse lines in pairs → combine into 8–12 bar structure → fit to a simple chant or melody → rehearse with actions optional.',
    plenary:
      'Perform the anthem. Reflect: which strand did we serve? How could this support transition or celebration? Signpost FREE Music Makes Me PDF via TBMH curriculum guidance.',
    vocabulary:
      'Hook · verse · chorus · strand · anthem · pulse · lyric · theme · celebration · transition · wellbeing',
    keyQuestions:
      'Who is this song for?\nWhich words matter most?\nHow does the hook stick in the memory?\nWhich Music Makes Me strand did we use — and why?',
    resources:
      'Whiteboards · lyric sheets · optional backing pulse · speaker · access to TBMH Music Makes Me resource PDF when downloaded from hub site',
    differentiation:
      'Support: sentence starters, word banks, echo singing.\nChallenge: write a bridge; add call-and-response; bilingual line.\nSEND: symbol-supported lyrics; movement strand; Social Story focus.',
    assessment:
      'Lyric clarity and theme fit; ensemble singing; reflection comments; optional recording for school anthem archive.',
    assessmentObjectives: [
      'TBMH-MMM-C1 Contribute ideas to a class song',
      'TBMH-MMM-W1 Write lyrics that fit a pulse',
      'TBMH-MMM-P1 Perform with confidence and clarity',
      'TBMH-MMM-R1 Reflect on purpose and wellbeing/topic link',
    ],
    activities: [
      {
        activity: 'Choose our song strand',
        time: 10,
        activityText: 'Meet five strands · vote theme & audience',
        description: [
          'Inspired by Tri-Borough Music Hub Music Makes Me song-writing resource (Social Story, Transition, Emotional Regulation, Topic, Celebration).',
          'Quick examples for each strand; class democratic choice.',
        ].join('\n'),
      },
      {
        activity: 'Hook & verse lyric lab',
        time: 20,
        activityText: 'Bank strong phrases · draft hook · pair verses',
        description: [
          'Collect 6–8 powerful words/phrases. Craft a 1–2 line hook. Pairs write a short verse.',
          'Keep language inclusive and school-safe.',
        ].join('\n'),
      },
      {
        activity: 'Melody / chant fit',
        time: 15,
        activityText: 'Fit lyrics to pulse · optional simple melody',
        description: [
          'Speak lyrics in rhythm first, then sing/chant. Mark breaths.',
          'Optional actions for younger classes.',
        ].join('\n'),
      },
      {
        activity: 'Anthem share',
        time: 15,
        activityText: 'Perform · reflect on strand · TBMH next step',
        description: [
          'Class performance. Name the strand and audience.',
          'Signpost FREE Music Makes Me download via TBMH curriculum guidance page.',
        ].join('\n'),
      },
    ],
  },
};

function isOwned(seedNote: string, catPrefix: string) {
  return {
    isOwnedCategory: (name: string) =>
      name.startsWith(catPrefix) || name.startsWith('TBMH'),
    isOwnedActivity: (a: Activity) =>
      String((a as any)?.notes || '').includes(seedNote) ||
      String(a?.category || '').startsWith(catPrefix),
  };
}

function buildLesson(pack: ProgrammeDef, activities: Activity[], cats: string[]): LessonData {
  const objIds = pack.curriculum.areas.flatMap((a) => a.objectives.map((o) => o.id));
  return {
    title: pack.title,
    lessonName: `${pack.agesLabel} · Tri-Borough Music Hub showcase`,
    unitName: pack.unit,
    teachingUnit: pack.unit,
    activities,
    duration: activities.reduce((s, a) => s + (a.time || 0), 0),
    totalTime: activities.reduce((s, a) => s + (a.time || 0), 0),
    orderedActivities: activities,
    categoryOrder: cats,
    grouped: Object.fromEntries(cats.map((c) => [c, activities.filter((a) => a.category === c)])),
    curriculumType: 'CUSTOM',
    customObjectives: objIds,
    academicYear: ACADEMIC_YEAR,
    customHeader: 'Tri-Borough Music Hub — CCDesigner prototype course notes',
    customFooter: 'Demo outlines — access resources via triboroughmusichub.org',
    learningOutcome: pack.learningOutcome,
    successCriteria: pack.successCriteria,
    introduction: pack.introduction,
    mainActivity: pack.mainActivity,
    plenary: pack.plenary,
    vocabulary: pack.vocabulary,
    keyQuestions: pack.keyQuestions,
    resources: pack.resources,
    differentiation: pack.differentiation,
    assessment: pack.assessment,
    assessmentObjectives: pack.assessmentObjectives,
    resourceLink: pack.pdfUrl,
    additionalLinks: `${pack.productUrl}\n${TBMH_SITE}\n${pack.pdfUrl}`,
    notes: `${pack.seedNote}. Showcase lesson for PDF export. Inspired by public TBMH listings — not official TBMH course packs.`,
  } as any;
}

export const TBMH_PROGRAMME_SHOWCASES = {
  'groove-n-play': {
    id: 'groove-n-play' as const,
    title: PROGRAMMES['groove-n-play'].title,
    productUrl: PROGRAMMES['groove-n-play'].productUrl,
    pdfUrl: PROGRAMMES['groove-n-play'].pdfUrl,
    agesLabel: PROGRAMMES['groove-n-play'].agesLabel,
    durationLabel: PROGRAMMES['groove-n-play'].durationLabel,
    summary: PROGRAMMES['groove-n-play'].summary,
  },
  'music-makes-me': {
    id: 'music-makes-me' as const,
    title: PROGRAMMES['music-makes-me'].title,
    productUrl: PROGRAMMES['music-makes-me'].productUrl,
    pdfUrl: PROGRAMMES['music-makes-me'].pdfUrl,
    agesLabel: PROGRAMMES['music-makes-me'].agesLabel,
    durationLabel: PROGRAMMES['music-makes-me'].durationLabel,
    summary: PROGRAMMES['music-makes-me'].summary,
  },
};

export async function setupTBMHProgramme(
  programmeId: TbmhProgrammeId,
  options?: { force?: boolean; registerPartnerPlanning?: boolean },
) {
  const pack = PROGRAMMES[programmeId];
  if (!pack) throw new Error(`Unknown TBMH programme: ${programmeId}`);

  const force = Boolean(options?.force);
  const shouldRegister = Boolean(options?.registerPartnerPlanning);
  const catMap = {
    warm: `${pack.catPrefix} — Warm-up`,
    explore: `${pack.catPrefix} — Explore`,
    create: `${pack.catPrefix} — Create`,
    share: `${pack.catPrefix} — Share`,
  } as const;
  const catList = Object.values(catMap);
  const { isOwnedCategory, isOwnedActivity } = isOwned(pack.seedNote, pack.catPrefix);

  if (!force && localStorage.getItem(pack.markerKey) === '1') {
    if (shouldRegister) {
      try {
        const existing = readJson<Activity[]>('library-activities', []).filter(isOwnedActivity);
        registerPartnerPlanningPack({
          ...PARTNER_PLANNING_ORGS.triborough,
          projectId: pack.projectId,
          projectTitle: pack.title,
          sheetId: pack.sheetId,
          activityIds: existing.map((a) => getActivityStarKey(a)),
          lessonKeys: readJson<string[]>(pack.lessonKeysKey, []),
        });
      } catch {
        /* ignore */
      }
    }
    return { skipped: true as const, sheetId: pack.sheetId, programmeId };
  }

  seedLocalCurriculumObjectives(pack.curriculum);
  ensureLocalYearGroup(pack.sheetId, pack.sheetId, pack.color === '#F5E827' ? '#C9A227' : pack.color);
  const categoryMerge = mergeCategoriesLocal(
    catList.map((name) => ({
      name,
      color: pack.color === '#F5E827' ? '#C9A227' : pack.color,
      yearGroups: Object.fromEntries(pack.yearGroups.map((y) => [y, true])),
    })),
    isOwnedCategory,
  );

  const existingLessonData = readJson<any>(`lesson-data-${pack.sheetId}`, { lessonNumbers: [] });
  const lessonNumbers = allocateLessonNumbers(1, existingLessonData.lessonNumbers || []);
  const lessonNum = lessonNumbers[0];
  const objIds = pack.curriculum.areas.flatMap((a) => a.objectives.map((o) => o.id));
  const catOrder = [catMap.warm, catMap.explore, catMap.create, catMap.share];

  const seeded = pack.activities.map((a, i) => ({
    ...a,
    category: catOrder[i] || catMap.explore,
    lessonNumber: String(lessonNum),
    unitLesson: 1,
    unitName: pack.unit,
    teachingUnit: pack.unit,
    level: pack.level,
    yearGroups: pack.yearGroups,
    notes: pack.seedNote,
    curriculumType: 'CUSTOM' as const,
    customObjectives: objIds,
    resourceLink: pack.pdfUrl,
    link: pack.productUrl,
  }));

  const activities = mergeActivitiesLocal(seeded as any, isOwnedActivity);
  const lessons = { [lessonNum]: buildLesson(pack, activities, catList) };
  const lessonPayload = mergeLessonsLocal(
    pack.sheetId,
    lessons,
    pack.seedNote,
    pack.lessonKeysKey,
    pack.unit,
  );

  const lessonStack: StackedLesson = {
    id: newStackId(`tbmh-${pack.id}`),
    name: pack.stackName,
    description: pack.summary,
    color: pack.color === '#F5E827' ? '#C9A227' : pack.color,
    lessons: lessonPayload.writtenNumbers,
    totalTime: activities.reduce((s, a) => s + (a.time || 0), 0),
    totalActivities: activities.length,
    created_at: new Date().toISOString(),
  };
  mergeStackLocal(lessonStack, pack.stackIdKey, pack.stackName);

  finishPrototypeSeed({
    activities,
    categories: catList,
    categoryMerge,
    source: `tbmh-${pack.id}-seed`,
    markerKey: pack.markerKey,
    starActivities: false,
  });

  highlightPaidHubActivities(activities, {
    partnerSlug: 'triborough',
    partnerLabel: 'Tri-Borough Music Hub',
    pickTitles: pack.pickTitles,
    fallbackCount: 4,
    categories: catList,
  });

  if (shouldRegister) {
    registerPartnerPlanningPack({
      ...PARTNER_PLANNING_ORGS.triborough,
      projectId: pack.projectId,
      projectTitle: pack.title,
      sheetId: pack.sheetId,
      activityIds: activities.map((a) => getActivityStarKey(a)),
      lessonKeys: lessonPayload.writtenNumbers,
    });
  }

  return {
    skipped: false as const,
    programmeId,
    activities: activities.length,
    lessons: lessonPayload.writtenNumbers.length,
    stackId: lessonStack.id,
    sheetId: pack.sheetId,
  };
}

if (typeof window !== 'undefined') {
  (window as any).setupTBMHProgramme = setupTBMHProgramme;
}
