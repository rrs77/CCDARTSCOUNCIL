import { PARTNER_HUBS, type PartnerHubConfig } from '../../config/partnerHubs';
import { PARTNER_CONTACTS, type PartnerContactInfo } from '../../config/partnerContacts';
import type { MapHub, MapLad } from './ukHubMapData';

export type Phase = 'EYFS' | 'KS1' | 'KS2' | 'KS3' | 'KS4' | 'KS5';
export const PHASES: Phase[] = ['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5'];

export type AccessStatus = 'Free' | 'Organisation access code' | 'Provider subscription' | 'External link';
export type Relationship = 'Working example' | 'Directory listing' | 'Confirmed contributor';

export interface HubResource {
  id: string;
  title: string;
  description: string;
  type: 'PDF' | 'Workshop';
  phases: Phase[];
  phaseLabel: string;
  subject: string;
  provider: string;
  access: AccessStatus;
  previewHref: string;
  sourceHref: string;
  /** Existing CCDesigner seeder that copies this into the teacher's library. */
  packId: 'ems-schools-brochure' | 'ems-dj-workshop' | 'ems-rap-it-workshop';
  /** Where it is published: a hub-wide resource is shown on every area page. */
  scope: { hubId: string; ladCode?: string };
}

/** Real EMS prototype packs already in the app (see utils/setupEMS*.ts). */
export const RESOURCES: HubResource[] = [
  {
    id: 'ems-schools-brochure',
    title: 'Schools brochure',
    description:
      'Essex Music Service’s offer to schools: curriculum platforms, instrumental and vocal pathways, workshops and CPD.',
    type: 'PDF',
    phases: ['KS3'],
    phaseLabel: 'KS3 (set up for Years 7–8)',
    subject: 'Music',
    provider: 'Essex Music Service',
    access: 'Free',
    previewHref: '/demo-resources/ems-schools-brochure.pdf',
    sourceHref: 'https://www.essexmusicservice.org.uk/site/',
    packId: 'ems-schools-brochure',
    scope: { hubId: 'greater-essex' },
  },
  {
    id: 'ems-dj-workshop',
    title: 'DJ Workshop',
    description:
      'Featured EMS workshop: beat-matching, structure and performance. Course notes plus a ready-made lesson sequence.',
    type: 'Workshop',
    phases: ['KS2', 'KS3'],
    phaseLabel: 'KS2–KS3',
    subject: 'Music technology',
    provider: 'Essex Music Service',
    access: 'Free',
    previewHref: '/demo-resources/ems-dj-workshop-course-notes.pdf',
    sourceHref: 'https://www.essexmusicservice.org.uk/site/workshops/',
    packId: 'ems-dj-workshop',
    scope: { hubId: 'greater-essex' },
  },
  {
    id: 'ems-rap-it-workshop',
    title: 'Rap-It!',
    description:
      'Literacy-linked rap writing and performance workshop from Essex Music Service, with course notes and lessons.',
    type: 'Workshop',
    phases: ['KS2', 'KS3', 'KS4'],
    phaseLabel: 'KS2–KS4',
    subject: 'Music · English',
    provider: 'Essex Music Service',
    access: 'Free',
    previewHref: '/demo-resources/ems-rap-it-workshop-course-notes.pdf',
    sourceHref: 'https://www.essexmusicservice.org.uk/site/workshops/',
    packId: 'ems-rap-it-workshop',
    scope: { hubId: 'greater-essex' },
  },
];

export const resourcesForHub = (hubId: string) => RESOURCES.filter((r) => r.scope.hubId === hubId);
export const resourcesForArea = (hubId: string, ladCode: string) => ({
  local: RESOURCES.filter((r) => r.scope.hubId === hubId && r.scope.ladCode === ladCode),
  shared: RESOURCES.filter((r) => r.scope.hubId === hubId && !r.scope.ladCode),
});

export const hubRelationship = (hubId: string): Relationship =>
  hubId === 'greater-essex' ? 'Working example' : 'Directory listing';

export interface HubIdentity {
  logoSrc?: string;
  brandColor?: string;
  services?: { name: string; role: string; covers: string; siteUrl?: string; match: (l: MapLad) => boolean }[];
  about?: string[];
  contact?: PartnerContactInfo;
}

export const HUB_IDENTITY: Record<string, HubIdentity> = {
  'greater-essex': {
    logoSrc: '/music-hubs/logos/essex-music-service.svg',
    brandColor: '#330968',
    about: [
      'Greater Essex Music Hub is a partnership of organisations, including the music services of Essex, Southend-on-Sea and Thurrock, and schools. It helps children and young people from all backgrounds and every part of the hub’s area to deepen their engagement with music.',
      'Essex Music Service (Essex County Council) is the Hub Lead Organisation.',
    ],
    services: [
      {
        name: 'Essex Music Service',
        role: 'Hub Lead Organisation',
        covers: 'The 12 Essex County Council districts',
        siteUrl: 'https://www.essexmusicservice.org.uk/site/',
        match: (l) => l.county === 'Essex',
      },
      {
        name: 'Music-on-Sea',
        role: 'Music service',
        covers: 'Southend-on-Sea',
        siteUrl: 'https://www.musiconsea.co.uk/',
        match: (l) => l.name === 'Southend-on-Sea',
      },
      {
        name: 'Thurrock Music Service',
        role: 'Music service',
        covers: 'Thurrock',
        match: (l) => l.name === 'Thurrock',
      },
    ],
    contact: PARTNER_CONTACTS.ems,
  },
};

export const serviceForLad = (hub: MapHub, lad: MapLad) =>
  HUB_IDENTITY[hub.id]?.services?.find((s) => s.match(lad));

// ---------- arts organisations ----------

export type Discipline = 'Music' | 'Drama' | 'Dance' | 'Art & design';
export const DISCIPLINES: Discipline[] = ['Music', 'Drama', 'Dance', 'Art & design'];

const ORG_DISCIPLINES: Record<string, Discipline[]> = {
  roh: ['Music', 'Dance'],
  lso: ['Music'],
  weteachdrama: ['Drama'],
  omnimusic: ['Music'],
  icompose: ['Music'],
  dramaresource: ['Drama'],
  jazznorth: ['Music'],
  sadlerswells: ['Dance'],
  tate: ['Art & design'],
  nationaltheatre: ['Drama'],
  bbctenpieces: ['Music'],
  nationalgallery: ['Art & design'],
  rsc: ['Drama'],
  bristololdvic: ['Drama'],
  kneehigh: ['Drama'],
};

const MUSIC_HUB_SLUGS = new Set(['ems', 'triborough']);

export interface OrgEntry {
  hub: PartnerHubConfig;
  disciplines: Discipline[];
  access: AccessStatus;
  relationship: Relationship;
}

export const ORGANISATIONS: OrgEntry[] = PARTNER_HUBS.filter((h) => !MUSIC_HUB_SLUGS.has(h.slug))
  .map((hub) => ({
    hub,
    disciplines: ORG_DISCIPLINES[hub.slug] ?? [],
    access: (hub.paid ? 'Provider subscription' : 'Free') as AccessStatus,
    relationship: 'Directory listing' as Relationship,
  }))
  .sort((a, b) => a.hub.displayName.replace(/^The /, '').localeCompare(b.hub.displayName.replace(/^The /, '')));

export const NATION_NOTES: Record<string, { title: string; body: string }> = {
  W92000004: {
    title: 'Music services and networks in Wales',
    body: 'Wales has its own National Plan for Music Education, delivered through the National Music Service for Wales working with local authority music services. Verified organisations will be listed here.',
  },
  S92000003: {
    title: 'Music services in Scotland',
    body: 'Instrumental music tuition in Scotland is provided by each local authority’s instrumental music service. Verified services will be listed here.',
  },
  N92000002: {
    title: 'Music services in Northern Ireland',
    body: 'Music services in Northern Ireland are provided through the Education Authority. Verified services will be listed here.',
  },
};
