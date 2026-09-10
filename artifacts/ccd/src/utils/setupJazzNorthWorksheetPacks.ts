/**
 * Jazz North classroom worksheet packs → CCDesigner lessons + activities.
 *
 * Uses {@link addPartnerPacksToLibrary} so other hubs can copy the same pattern.
 * Resource hrefs point at DreamHost (see jazzNorthDreamHost.ts).
 */

import { jnDreamHostFileUrl } from '../config/jazzNorthDreamHost';
import {
  addPartnerPacksToLibrary,
  type PartnerHubPackCatalog,
} from './addPartnerPackToLibrary';

const COLOR = '#FF53B6';
const SHEET_ID = 'Year 3 Music';
const YEAR_GROUPS = ['Year 3 Music', 'Year 2 Music', 'Year 4 Music', 'Year 3', 'Year 2', 'KS2 Music'];
const LEVEL = 'KS1–2';
const COMBINED_MARKER = 'ccd-jn-worksheet-packs-seeded-v1';

const CAT = {
  canYouSing: 'JN Worksheets — Can You Sing',
  hello: 'JN Worksheets — Hello Song',
  chant: 'JN Worksheets — 2 and 4 Chant',
  improv: 'JN Worksheets — Improvisation',
} as const;

const URLS = {
  canYouSingActivities: jnDreamHostFileUrl('canYouSingActivities'),
  canYouSingPiano: jnDreamHostFileUrl('canYouSingPiano'),
  canYouSingAudio: jnDreamHostFileUrl('canYouSingAudio'),
  helloActivities: jnDreamHostFileUrl('helloActivities'),
  helloScore: jnDreamHostFileUrl('helloScore'),
  helloAudio: jnDreamHostFileUrl('helloAudio'),
  chantActivities: jnDreamHostFileUrl('chantActivities'),
  chantScore: jnDreamHostFileUrl('chantScore'),
  chantAudio: jnDreamHostFileUrl('chantAudio'),
  waysIntoImprov: jnDreamHostFileUrl('waysIntoImprov'),
  improvGames: jnDreamHostFileUrl('improvGames'),
};

function baseCatalog(
  packId: string,
  partial: Omit<
    PartnerHubPackCatalog,
    | 'partnerSlug'
    | 'partnerLabel'
    | 'sheetId'
    | 'yearGroups'
    | 'color'
    | 'level'
    | 'seedNote'
    | 'planningOrgId'
    | 'packId'
  >,
): PartnerHubPackCatalog {
  return {
    partnerSlug: 'jazznorth',
    partnerLabel: 'Jazz North',
    packId,
    sheetId: SHEET_ID,
    yearGroups: YEAR_GROUPS,
    color: COLOR,
    level: LEVEL,
    /** Unique per pack so sequential seeds do not wipe sibling packs. */
    seedNote: `JN_SEED:WorksheetPacks:${packId}`,
    planningOrgId: 'jazznorth',
    ...partial,
  };
}

/** Pack 1 — Can You Sing Your Song? */
export const JN_PACK_CAN_YOU_SING: PartnerHubPackCatalog = baseCatalog('can-you-sing', {
  markerKey: 'ccd-jn-pack-can-you-sing-v1',
  stackIdKey: 'ccd-jn-pack-can-you-sing-stack-id',
  lessonKeysKey: 'ccd-jn-pack-can-you-sing-lesson-keys',
  stackName: 'Jazz North — Can You Sing Your Song?',
  categories: [CAT.canYouSing],
  planningProjectId: 'jn-can-you-sing',
  planningProjectTitle: 'Can You Sing Your Song?',
  highlightTitles: [
    'Can You Sing Your Song? — Activities',
    'Can You Sing Your Song? — Piano accompaniment',
  ],
  activities: [
    {
      id: 'cyss-activities',
      title: 'Can You Sing Your Song? — Activities',
      category: CAT.canYouSing,
      time: 15,
      activityText: 'Classroom activities PDF · follow with audio tracks',
      description:
        'Work through the Jazz North Can You Sing Your Song? activity sheet. Use the piano accompaniment and audio ZIP for modelling and pupil practice.',
      resourceLink: URLS.canYouSingActivities,
      lessonLink: URLS.canYouSingPiano,
      audioLink: URLS.canYouSingAudio,
      backingLink: URLS.canYouSingPiano,
    },
    {
      id: 'cyss-piano',
      title: 'Can You Sing Your Song? — Piano accompaniment',
      category: CAT.canYouSing,
      time: 10,
      activityText: 'Score / accompaniment PDF for the lesson',
      description:
        'Piano accompaniment for Can You Sing Your Song?. Pair with the activities PDF and audio files in class.',
      resourceLink: URLS.canYouSingPiano,
      lessonLink: URLS.canYouSingActivities,
      audioLink: URLS.canYouSingAudio,
      backingLink: URLS.canYouSingPiano,
    },
    {
      id: 'cyss-audio',
      title: 'Can You Sing Your Song? — Audio files',
      category: CAT.canYouSing,
      time: 8,
      activityText: 'Download audio ZIP for listening and singing along',
      description:
        'Supporting audio for Can You Sing Your Song?. Open the ZIP, then link tracks to the matching activity steps.',
      resourceLink: URLS.canYouSingAudio,
      lessonLink: URLS.canYouSingActivities,
      audioLink: URLS.canYouSingAudio,
    },
  ],
  lessons: [
    {
      title: 'Can You Sing Your Song?',
      lessonName: 'Jazz North classroom song lesson',
      unitName: 'Jazz North — Can You Sing Your Song?',
      activityIds: ['cyss-activities', 'cyss-piano', 'cyss-audio'],
      learningOutcome:
        'Pupils sing and explore Can You Sing Your Song? using Jazz North activities, accompaniment and audio.',
      successCriteria:
        'We join in with the song.\nWe follow at least one activity from the sheet.\nWe listen carefully to the audio model.',
      introduction: 'Share the song title and listening focus. Open the activities PDF.',
      mainActivity:
        'Work through activity steps with piano accompaniment; use audio tracks for modelling and pupil response.',
      plenary: 'Revisit a favourite phrase; note one next-step activity for next lesson.',
      resources: `Activities PDF · Piano accomp · Audio ZIP\n${URLS.canYouSingActivities}\n${URLS.canYouSingPiano}\n${URLS.canYouSingAudio}`,
      resourceLink: URLS.canYouSingActivities,
      additionalLinks: `${URLS.canYouSingPiano}\n${URLS.canYouSingAudio}`,
    },
  ],
});

/** Pack 2 — Hello Song */
export const JN_PACK_HELLO_SONG: PartnerHubPackCatalog = baseCatalog('hello-song', {
  markerKey: 'ccd-jn-pack-hello-song-v1',
  stackIdKey: 'ccd-jn-pack-hello-song-stack-id',
  lessonKeysKey: 'ccd-jn-pack-hello-song-lesson-keys',
  stackName: 'Jazz North — Hello Song',
  categories: [CAT.hello],
  planningProjectId: 'jn-hello-song',
  planningProjectTitle: 'Hello Song',
  highlightTitles: ['Hello Song — Activities', 'Hello Song — Score'],
  activities: [
    {
      id: 'hello-activities',
      title: 'Hello Song — Activities',
      category: CAT.hello,
      time: 15,
      activityText: 'Classroom activities PDF with audio support',
      description:
        'Jazz North Hello Song activities. Use the score PDF as the related lesson material and the audio ZIP for modelling.',
      resourceLink: URLS.helloActivities,
      lessonLink: URLS.helloScore,
      audioLink: URLS.helloAudio,
    },
    {
      id: 'hello-score',
      title: 'Hello Song — Score',
      category: CAT.hello,
      time: 10,
      activityText: 'Score PDF for singing / teaching',
      description: 'Hello Song score. Pair with activities PDF and audio files.',
      resourceLink: URLS.helloScore,
      lessonLink: URLS.helloActivities,
      audioLink: URLS.helloAudio,
    },
    {
      id: 'hello-audio',
      title: 'Hello Song — Audio files',
      category: CAT.hello,
      time: 8,
      activityText: 'Download audio ZIP for Hello Song',
      description: 'Supporting audio for Hello Song activities and score work.',
      resourceLink: URLS.helloAudio,
      lessonLink: URLS.helloScore,
      audioLink: URLS.helloAudio,
    },
  ],
  lessons: [
    {
      title: 'Hello Song',
      lessonName: 'Jazz North welcome song lesson',
      unitName: 'Jazz North — Hello Song',
      activityIds: ['hello-activities', 'hello-score', 'hello-audio'],
      learningOutcome:
        'Pupils learn and perform Hello Song using the Jazz North score, activities and audio.',
      successCriteria:
        'We sing the greeting clearly.\nWe follow an activity from the sheet.\nWe match our singing to the audio model where helpful.',
      introduction: 'Warm welcome circle; introduce Hello Song score.',
      mainActivity: 'Score singing → activity sheet steps → audio-supported practice.',
      plenary: 'Class performance of the greeting; reflect on tone and ensemble.',
      resources: `Activities · Score · Audio\n${URLS.helloActivities}\n${URLS.helloScore}\n${URLS.helloAudio}`,
      resourceLink: URLS.helloScore,
      additionalLinks: `${URLS.helloActivities}\n${URLS.helloAudio}`,
    },
  ],
});

/** Pack 3 — 2 and 4 Chant */
export const JN_PACK_2_AND_4_CHANT: PartnerHubPackCatalog = baseCatalog('2-and-4-chant', {
  markerKey: 'ccd-jn-pack-2-and-4-v1',
  stackIdKey: 'ccd-jn-pack-2-and-4-stack-id',
  lessonKeysKey: 'ccd-jn-pack-2-and-4-lesson-keys',
  stackName: 'Jazz North — 2 and 4 Chant',
  categories: [CAT.chant],
  planningProjectId: 'jn-2-and-4-chant',
  planningProjectTitle: '2 and 4 Chant',
  highlightTitles: ['2 and 4 Chant — Activities', '2 and 4 Chant — Score (both versions)'],
  activities: [
    {
      id: 'chant-activities',
      title: '2 and 4 Chant — Activities',
      category: CAT.chant,
      time: 15,
      activityText: 'Chant activities PDF · pulse and groove',
      description:
        '2 and 4 Chant classroom activities. Related lesson score (both versions) and matching audio ZIP linked.',
      resourceLink: URLS.chantActivities,
      lessonLink: URLS.chantScore,
      audioLink: URLS.chantAudio,
    },
    {
      id: 'chant-score',
      title: '2 and 4 Chant — Score (both versions)',
      category: CAT.chant,
      time: 10,
      activityText: 'Score PDF — both versions',
      description: '2 and 4 Chant score (both versions). Use with activities and audio.',
      resourceLink: URLS.chantScore,
      lessonLink: URLS.chantActivities,
      audioLink: URLS.chantAudio,
    },
    {
      id: 'chant-audio',
      title: '2 and 4 Chant — Audio files',
      category: CAT.chant,
      time: 8,
      activityText: 'Download audio ZIP for 2 and 4 Chant',
      description: 'Supporting audio for the 2 and 4 Chant activities and scores.',
      resourceLink: URLS.chantAudio,
      lessonLink: URLS.chantScore,
      audioLink: URLS.chantAudio,
    },
  ],
  lessons: [
    {
      title: '2 and 4 Chant',
      lessonName: 'Jazz North pulse & chant lesson',
      unitName: 'Jazz North — 2 and 4 Chant',
      activityIds: ['chant-activities', 'chant-score', 'chant-audio'],
      learningOutcome:
        'Pupils feel and perform 2- and 4-feel chant patterns using Jazz North scores, activities and audio.',
      successCriteria:
        'We keep a steady pulse.\nWe try both score versions where appropriate.\nWe use audio to check our groove.',
      introduction: 'Body percussion pulse warm-up; introduce 2 vs 4 feel.',
      mainActivity: 'Score versions → activity sheet → audio call-and-response / groove check.',
      plenary: 'Class chant performance; name one difference between the two versions.',
      resources: `Activities · Score · Audio\n${URLS.chantActivities}\n${URLS.chantScore}\n${URLS.chantAudio}`,
      resourceLink: URLS.chantScore,
      additionalLinks: `${URLS.chantActivities}\n${URLS.chantAudio}`,
    },
  ],
});

/** Pack 4 — Not Quite Jazz / Improvisation */
export const JN_PACK_IMPROVISATION: PartnerHubPackCatalog = baseCatalog('improvisation', {
  markerKey: 'ccd-jn-pack-improvisation-v1',
  stackIdKey: 'ccd-jn-pack-improvisation-stack-id',
  lessonKeysKey: 'ccd-jn-pack-improvisation-lesson-keys',
  stackName: 'Jazz North — Improvisation',
  categories: [CAT.improv],
  planningProjectId: 'jn-improvisation',
  planningProjectTitle: 'Not Quite Jazz / Improvisation',
  highlightTitles: ['Ways into Improvisation', 'Not Quite Jazz — Improvisation games'],
  activities: [
    {
      id: 'ways-into',
      title: 'Ways into Improvisation',
      category: CAT.improv,
      time: 20,
      activityText: 'Teacher guide PDF — pathways into improvisation',
      description:
        'Jazz North Ways into Improvisation guide. Use as the core lesson resource; pair with improvisation games activities.',
      resourceLink: URLS.waysIntoImprov,
      lessonLink: URLS.waysIntoImprov,
    },
    {
      id: 'improv-games',
      title: 'Not Quite Jazz — Improvisation games',
      category: CAT.improv,
      time: 20,
      activityText: 'Improvisation games PDF for classroom play',
      description:
        'Not Quite Jazz improvisation games. Related lesson guide: Ways into Improvisation.',
      resourceLink: URLS.improvGames,
      lessonLink: URLS.waysIntoImprov,
    },
  ],
  lessons: [
    {
      title: 'Not Quite Jazz / Improvisation',
      lessonName: 'Jazz North improvisation pathway',
      unitName: 'Jazz North — Improvisation',
      activityIds: ['ways-into', 'improv-games'],
      learningOutcome:
        'Pupils try first improvisation games with structure and safety, guided by Jazz North resources.',
      successCriteria:
        'We take a short improvised turn.\nWe listen and respond to others.\nWe can name one “way into” improvisation we tried.',
      introduction: 'Agree stop signal and kind listening rules; preview Ways into Improvisation.',
      mainActivity: 'Select 2–3 games from the improvisation games PDF; scaffold with the guide.',
      plenary: 'Share one brave moment; signpost further Jazz North Learning Resources Area packs.',
      resources: `Ways into Improvisation · Improvisation games\n${URLS.waysIntoImprov}\n${URLS.improvGames}`,
      resourceLink: URLS.waysIntoImprov,
      additionalLinks: URLS.improvGames,
    },
  ],
});

export const JN_WORKSHEET_PACKS: PartnerHubPackCatalog[] = [
  JN_PACK_CAN_YOU_SING,
  JN_PACK_HELLO_SONG,
  JN_PACK_2_AND_4_CHANT,
  JN_PACK_IMPROVISATION,
];

/**
 * Hub CTA: add every Jazz North worksheet pack as lessons + Activity Library rows.
 */
export async function setupJazzNorthWorksheetPacks(options?: {
  force?: boolean;
  registerPartnerPlanning?: boolean;
}) {
  return addPartnerPacksToLibrary(JN_WORKSHEET_PACKS, {
    force: options?.force,
    registerPartnerPlanning: options?.registerPartnerPlanning ?? true,
    combinedMarkerKey: COMBINED_MARKER,
  });
}

if (typeof window !== 'undefined') {
  (window as any).setupJazzNorthWorksheetPacks = setupJazzNorthWorksheetPacks;
}
