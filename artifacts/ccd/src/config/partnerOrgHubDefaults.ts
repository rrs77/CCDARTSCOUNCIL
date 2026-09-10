/**
 * Default Partner Organisation Hub layouts for Jazz North and LSO.
 * Admins can override via localStorage drafts (PartnerOrgHubTemplate edit mode).
 */

import { jnDreamHostFileUrl, jnDreamHostUrl } from './jazzNorthDreamHost';
import {
  JN_EDUCATORS_FORUM,
  JN_JAZZ_CAMP,
  JN_LEARNING_RESOURCES,
  JN_MR_BIG,
  JN_NEW_NORTHERN,
  JN_NORTHERN_LINE,
  JN_PLAYLIST_PROJECT,
  JN_SITE,
} from '../utils/jazzNorthBranding';
import type { PartnerOrgHubLayout } from '../types/partnerOrgHub';
import {
  JAZZ_NORTH_COLLECTIONS,
  getJazzNorthResourcesByCollection,
} from '../data/resourceRegistry';

/** Recommended DreamHost filenames for scheme overviews (upload if missing). */
export const JN_MR_BIG_OVERVIEW_FILE = 'Mr-Big-scheme-overview.pdf';
export const JN_PLAYLIST_OVERVIEW_FILE = 'Playlist-Project-Milestones-overview.pdf';

function jnWorksheetCards() {
  return JAZZ_NORTH_COLLECTIONS.flatMap((collection) => {
    const items = getJazzNorthResourcesByCollection(collection.id);
    return items.map((res) => ({
      id: res.id,
      title: res.title,
      meta: `${collection.title} · ${res.type}`,
      description: 'Download from Rhythmstix / DreamHost hosting.',
      openUrl: res.publicUrl,
      downloadUrl: res.publicUrl,
      downloadFilename: res.dreamHostFilename,
      openLabel: 'Open',
      downloadLabel: 'Download',
    }));
  });
}

export function getJazzNorthDefaultLayout(): PartnerOrgHubLayout {
  return {
    orgSlug: 'jazznorth',
    orgDisplayName: 'Jazz North',
    version: 1,
    sections: [
      {
        id: 'jn-about',
        type: 'about',
        title: 'Learning & Participation',
        body:
          'Free improvisation pathways for curriculum teachers, instrumental tutors and lifetime learners. Classroom worksheets open from Rhythmstix hosting; programmes and forums link to jazznorth.org.',
        links: [
          { href: JN_LEARNING_RESOURCES, label: 'Learning Resources Area', icon: 'external' },
          { href: JN_SITE, label: 'jazznorth.org', icon: 'external' },
        ],
      },
      {
        id: 'jn-resources',
        type: 'resources',
        title: 'Resources',
        subtitle:
          'Classroom worksheets, scores and audio, plus Mr Big and Playlist Project schemes you can seed into CCDesigner.',
        cards: [
          ...jnWorksheetCards(),
          {
            id: 'mr-big',
            title: 'Mr Big scheme of work',
            meta: 'KS1 · Active listening · Optional PSHE',
            description:
              'Add classroom activities and/or a full lesson plan inspired by Jazz North’s Mr Big scheme. Overview PDF from DreamHost when uploaded.',
            siteUrl: JN_MR_BIG,
            openUrl: jnDreamHostUrl(JN_MR_BIG_OVERVIEW_FILE),
            downloadUrl: jnDreamHostUrl(JN_MR_BIG_OVERVIEW_FILE),
            downloadFilename: JN_MR_BIG_OVERVIEW_FILE,
            openLabel: 'Open overview',
            seedKey: 'mr-big',
            seedable: true,
          },
          {
            id: 'playlist',
            title: 'Playlist Project — Milestones',
            meta: 'KS2 · Listening pathway · No jazz experience needed',
            description:
              'Add listening activities and/or a Milestones lesson plan. Overview PDF from DreamHost when uploaded.',
            siteUrl: JN_PLAYLIST_PROJECT,
            openUrl: jnDreamHostUrl(JN_PLAYLIST_OVERVIEW_FILE),
            downloadUrl: jnDreamHostUrl(JN_PLAYLIST_OVERVIEW_FILE),
            downloadFilename: JN_PLAYLIST_OVERVIEW_FILE,
            openLabel: 'Open overview',
            seedKey: 'playlist',
            seedable: true,
          },
        ],
      },
      {
        id: 'jn-info',
        type: 'info-accordion',
        title: 'Forums & information',
        subtitle: 'Camps, CPD forums and talent programmes — official Jazz North pages.',
        defaultOpen: false,
        cards: [
          {
            id: 'jazz-camp',
            title: 'Jazz Camp for Girls',
            meta: 'Learning & participation · Improvisation camps',
            description: 'Opens the official Jazz North page — materials stay on their site.',
            siteUrl: JN_JAZZ_CAMP,
            openUrl: JN_JAZZ_CAMP,
            openLabel: 'Open',
          },
          {
            id: 'educators',
            title: 'Educators’ Forum',
            meta: 'Termly online CPD · Improvisation pedagogy',
            description: 'Opens the official Jazz North page — materials stay on their site.',
            siteUrl: JN_EDUCATORS_FORUM,
            openUrl: JN_EDUCATORS_FORUM,
            openLabel: 'Open',
          },
          {
            id: 'northern-line',
            title: 'Northern Line',
            meta: 'Live talent development · Northern artists',
            description: 'Opens the official Jazz North page — materials stay on their site.',
            siteUrl: JN_NORTHERN_LINE,
            openUrl: JN_NORTHERN_LINE,
            openLabel: 'Open',
          },
          {
            id: 'new-northern',
            title: 'New Northern',
            meta: 'Promoter bursary · Emerging talent',
            description: 'Opens the official Jazz North page — materials stay on their site.',
            siteUrl: JN_NEW_NORTHERN,
            openUrl: JN_NEW_NORTHERN,
            openLabel: 'Open',
          },
        ],
      },
      {
        id: 'jn-cta',
        type: 'cta',
        title: 'Create a free Jazz North account',
        body: 'Download full Learning Resources Area packs after signing up on jazznorth.org.',
        ctaLabel: 'Learning Resources Area',
        ctaHref: JN_LEARNING_RESOURCES,
      },
    ],
  };
}

const HTBAO_PAGE =
  'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/how-to-build-an-orchestra/';
const LSO_DIGITAL_HUB =
  'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/';
const LSO_SCHOOLS =
  'https://www.lso.co.uk/learn-and-discover/activities-for-schools-and-teachers/';
const LSO_TES = 'https://www.tes.com/member/lsodiscovery';

const LSO_RESOURCE_PROJECTS = [
  {
    id: 'htbao',
    title: 'How to Build an Orchestra',
    meta: 'KS2 · In CCDesigner',
    description:
      'Ages 7–12 — classroom film with Sir Simon Rattle & Rachel Leach, family videos and creative projects inspired by Mary Auld’s book.',
    siteUrl: HTBAO_PAGE,
    openUrl: HTBAO_PAGE,
    seedKey: 'htbao',
    seedable: true,
  },
  {
    id: 'planets',
    title: 'The Planets',
    meta: 'KS2 · Featured on LSO',
    description:
      'Ages 7–12 — Holst suite with videos, games and lesson plans featuring Rachel Leach, Sir Antonio Pappano and Tim Peake.',
    siteUrl: 'https://lso.co.uk/planets',
    openUrl: 'https://lso.co.uk/planets',
  },
  {
    id: 'alice',
    title: 'The Alice Sound',
    meta: 'KS2',
    description:
      'Ages 7–12 — Wonderland cross-curricular resources with Paul Rissmann’s suites and free downloads.',
    siteUrl: 'https://www.thealicesound.com/',
    openUrl: 'https://www.thealicesound.com/',
  },
  {
    id: 'space',
    title: 'Space … but not as we know it',
    meta: 'KS2',
    description:
      'Ages 7–12 — online concert and classroom packs on how sound travels around an orchestra.',
    siteUrl:
      'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/space-but-not-as-we-know-it/',
    openUrl:
      'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/space-but-not-as-we-know-it/',
  },
  {
    id: 'leon',
    title: 'Leon and the Place Between',
    meta: 'KS2',
    description:
      'Ages 7–12 — interactive concert plus downloadable classroom and family resources.',
    siteUrl:
      'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/leon-and-the-place-between/',
    openUrl:
      'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/leon-and-the-place-between/',
  },
  {
    id: 'lso-play',
    title: 'LSO Play',
    meta: 'KS2',
    description: 'Ages 7–12 — multi-angle performances, instrument exploration and masterclasses.',
    siteUrl: 'https://play.lso.co.uk/',
    openUrl: 'https://play.lso.co.uk/',
  },
  {
    id: 'lockdown-listening',
    title: "Rachel Leach's Lockdown Listening",
    meta: 'KS2 · YouTube',
    description: 'Ages 7–12 — listening playlist from the LSO digital resources grid.',
    siteUrl: 'https://youtube.com/playlist?list=PLTjZ3o6K-BOn25PsSiEZRbZ6wrNlw-wgv',
    openUrl: 'https://youtube.com/playlist?list=PLTjZ3o6K-BOn25PsSiEZRbZ6wrNlw-wgv',
  },
  {
    id: 'olivia',
    title: 'Olivia Forms a Band',
    meta: 'KS1',
    description: 'Age 5+ — story-led classroom and family activities.',
    siteUrl:
      'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/olivia-forms-a-band/',
    openUrl:
      'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/olivia-forms-a-band/',
  },
  {
    id: 'simon',
    title: "Where's Simon?",
    meta: 'KS1–2',
    description: 'Ages 5–12 — find-the-conductor style discovery resource.',
    siteUrl: 'https://www.lso.co.uk/wheres-simon/',
    openUrl: 'https://www.lso.co.uk/wheres-simon/',
  },
  {
    id: 'jemma',
    title: "Jemma's Journey",
    meta: 'EYFS',
    description: 'Under-5s — Early Years Foundation Stage listening and movement resource.',
    siteUrl:
      'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/jemmas-journey/',
    openUrl:
      'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/jemmas-journey/',
  },
  {
    id: 'fergal',
    title: 'Fergal is Fuming!',
    meta: 'EYFS',
    description: 'Under-5s — Early Years story and music activities.',
    siteUrl:
      'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/fergal-is-fuming/',
    openUrl:
      'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/fergal-is-fuming/',
  },
  {
    id: 'a-level-seminars',
    title: 'A-Level Seminars',
    meta: 'KS5 · YouTube',
    description: 'Age 16+ — seminar playlist for A-Level / Key Stage 5 students.',
    siteUrl: 'https://youtube.com/playlist?list=PLTjZ3o6K-BOmGAKJx_tOf63vDkQJ7I9ME',
    openUrl: 'https://youtube.com/playlist?list=PLTjZ3o6K-BOmGAKJx_tOf63vDkQJ7I9ME',
  },
  {
    id: 'a-level-shorts',
    title: 'A-Level Revision Shorts',
    meta: 'KS5 · YouTube',
    description: 'Age 16+ — short revision videos from the LSO Discovery grid.',
    siteUrl: 'https://youtube.com/playlist?list=PLTjZ3o6K-BOnKsd0GLdhTLy2Rt5WxBK67',
    openUrl: 'https://youtube.com/playlist?list=PLTjZ3o6K-BOnKsd0GLdhTLy2Rt5WxBK67',
  },
];

export function getLsoDefaultLayout(): PartnerOrgHubLayout {
  return {
    orgSlug: 'lso',
    orgDisplayName: 'London Symphony Orchestra',
    version: 1,
    sections: [
      {
        id: 'lso-featured',
        type: 'featured',
        title: 'How to Build an Orchestra',
        eyebrow: 'Featured · KS2',
        body:
          'Year 6 classroom unit based on the Hachette / LSO project packs and Mary Auld’s book. Instrument families, classroom film, Beethoven storm and Ravel Boléro.',
        links: [
          { href: HTBAO_PAGE, label: 'LSO resource page', icon: 'external' },
          { href: LSO_DIGITAL_HUB, label: 'All digital resources', icon: 'external' },
          { href: LSO_SCHOOLS, label: 'Schools & teachers', icon: 'external' },
        ],
        cards: [
          {
            id: 'htbao-featured',
            title: 'How to Build an Orchestra',
            meta: 'KS2 · Seed into CCDesigner',
            description: 'Add activities and/or the full unit lesson plans to your library.',
            siteUrl: HTBAO_PAGE,
            openUrl: HTBAO_PAGE,
            seedKey: 'htbao',
            seedable: true,
          },
        ],
      },
      {
        id: 'lso-resources',
        type: 'resources',
        title: 'Resources',
        subtitle:
          'LSO Discovery digital projects. How to Build an Orchestra seeds into CCDesigner; others open on LSO.',
        cards: LSO_RESOURCE_PROJECTS,
      },
      {
        id: 'lso-info',
        type: 'info-accordion',
        title: 'Forums & information',
        subtitle: 'Teacher platforms, schools programmes and Discovery hubs.',
        defaultOpen: false,
        cards: [
          {
            id: 'lso-schools',
            title: 'Activities for schools and teachers',
            meta: 'LSO Discovery',
            description: 'Official schools and teachers hub on lso.co.uk.',
            siteUrl: LSO_SCHOOLS,
            openUrl: LSO_SCHOOLS,
            openLabel: 'Open',
          },
          {
            id: 'lso-digital',
            title: 'Digital activities and resources',
            meta: 'Families & schools',
            description: 'Full LSO digital resources grid.',
            siteUrl: LSO_DIGITAL_HUB,
            openUrl: LSO_DIGITAL_HUB,
            openLabel: 'Open',
          },
          {
            id: 'lso-tes',
            title: 'LSO resources on TES',
            meta: 'Teaching platforms',
            description: 'Teacher resource packs and LSO Play listening tasks for KS2–3 on TES.com.',
            siteUrl: LSO_TES,
            openUrl: LSO_TES,
            openLabel: 'Open',
          },
        ],
      },
    ],
  };
}

/** Keep worksheet pack seed URLs in sync with DreamHost keys used elsewhere. */
export const JN_WORKSHEET_DREAMHOST_KEYS = [
  'canYouSingActivities',
  'canYouSingPiano',
  'canYouSingAudio',
  'helloActivities',
  'helloScore',
  'helloAudio',
  'chantActivities',
  'chantScore',
  'chantAudio',
  'improvGames',
  'waysIntoImprov',
] as const;

export function listJnDreamHostExampleUrls(): string[] {
  return JN_WORKSHEET_DREAMHOST_KEYS.map((k) => jnDreamHostFileUrl(k));
}
