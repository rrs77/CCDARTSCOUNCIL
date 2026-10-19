import { PARTNER_HUBS, type PartnerHubConfig } from '../../config/partnerHubs';
import type { AccessLevel } from './partnerDirectory';

/** Brand of a lead organisation, from the existing partner configuration. */
export const organisationBrand = (organisationId?: string) => {
  const h = organisationId ? PARTNER_HUBS.find((p) => p.slug === organisationId) : undefined;
  return h ? { logoSrc: h.logoSrcOnDark || h.logoSrc, color: h.logoPanelColor || h.primaryColor, name: h.displayName } : undefined;
};

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
  access: AccessLevel;
}

function toOrgEntry(hub: PartnerHubConfig): OrgEntry {
  return {
    hub,
    disciplines: ORG_DISCIPLINES[hub.slug] ?? [],
    access: (hub.paid ? 'subscription' : 'free') as AccessLevel,
  };
}

const byDisplayName = (a: OrgEntry, b: OrgEntry) =>
  a.hub.displayName.replace(/^The /, '').localeCompare(b.hub.displayName.replace(/^The /, ''));

/** All non–Music Hub partners (arts + paid). Prefer ARTS_ORGANISATIONS / PAID_RESOURCES for menus. */
export const ORGANISATIONS: OrgEntry[] = PARTNER_HUBS.filter((h) => !MUSIC_HUB_SLUGS.has(h.slug))
  .map(toOrgEntry)
  .sort(byDisplayName);

/** Free cultural hubs — RSC, National Theatre, ROH, LSO, Tate, etc. */
export const ARTS_ORGANISATIONS: OrgEntry[] = ORGANISATIONS.filter((o) => !o.hub.paid);

/** Paid / subscription classroom packs — We Teach Drama, iCompose, Drama Resource, etc. */
export const PAID_RESOURCES: OrgEntry[] = ORGANISATIONS.filter((o) => Boolean(o.hub.paid));

/** Featured strip on Arts organisations (existing hubs only). */
export const FEATURED_ORG_SLUGS = ['nationaltheatre', 'roh', 'tate', 'lso', 'rsc'] as const;

export interface OrgListingMeta {
  location: string;
  region: string;
  tags: string[];
  artForms: string[];
  ageRanges: string[];
  coverSrc?: string;
}

const ORG_LISTING: Record<string, OrgListingMeta> = {
  roh: {
    location: 'London',
    region: 'London',
    tags: ['Resources', 'Workshops', 'CPD', 'Projects'],
    artForms: ['Ballet', 'Opera', 'Dance', 'Music'],
    ageRanges: ['Primary 5–11', 'Secondary 11–16', 'Teachers'],
    coverSrc: '/login/hero-arts-clean.jpg',
  },
  lso: {
    location: 'London',
    region: 'London',
    tags: ['Resources', 'Workshops', 'CPD', 'Projects'],
    artForms: ['Music', 'Orchestra'],
    ageRanges: ['Primary 5–11', 'Secondary 11–16', 'Teachers'],
    coverSrc: '/login/hero-arts.jpg',
  },
  nationaltheatre: {
    location: 'London',
    region: 'London',
    tags: ['Performances', 'Workshops', 'Resources', 'CPD'],
    artForms: ['Theatre', 'Drama'],
    ageRanges: ['Primary 5–11', 'Secondary 11–16', 'Teachers'],
    coverSrc: '/login/hero-arts-clean.jpg',
  },
  tate: {
    location: 'London',
    region: 'London',
    tags: ['Resources', 'Workshops', 'CPD', 'Projects'],
    artForms: ['Art & design'],
    ageRanges: ['Primary 5–11', 'Secondary 11–16', 'Teachers'],
    coverSrc: '/login/hero-arts.jpg',
  },
  sadlerswells: {
    location: 'London',
    region: 'London',
    tags: ['Performances', 'Workshops', 'Resources'],
    artForms: ['Dance'],
    ageRanges: ['Primary 5–11', 'Secondary 11–16', 'Teachers'],
  },
  bbctenpieces: {
    location: 'National',
    region: 'National',
    tags: ['Resources', 'Teacher packs', 'Projects'],
    artForms: ['Music'],
    ageRanges: ['Primary 5–11', 'Secondary 11–14', 'Teachers'],
  },
  nationalgallery: {
    location: 'London',
    region: 'London',
    tags: ['Resources', 'CPD', 'Projects'],
    artForms: ['Art & design'],
    ageRanges: ['Primary 5–11', 'Secondary 11–16', 'Teachers'],
  },
  rsc: {
    location: 'Stratford-upon-Avon',
    region: 'West Midlands',
    tags: ['Resources', 'Workshops', 'CPD', 'Teacher packs'],
    artForms: ['Theatre', 'Drama'],
    ageRanges: ['Primary 5–11', 'Secondary 11–16', 'Teachers'],
  },
  bristololdvic: {
    location: 'Bristol',
    region: 'South West',
    tags: ['Resources', 'Workshops', 'Projects'],
    artForms: ['Theatre', 'Drama'],
    ageRanges: ['Primary 5–11', 'Secondary 11–16', 'Teachers'],
  },
  kneehigh: {
    location: 'Cornwall',
    region: 'South West',
    tags: ['Resources', 'Teacher packs'],
    artForms: ['Theatre', 'Drama'],
    ageRanges: ['Secondary 11–16', 'KS4 / KS5'],
  },
  jazznorth: {
    location: 'North of England',
    region: 'North',
    tags: ['Resources', 'Workshops', 'CPD', 'Projects'],
    artForms: ['Music', 'Jazz'],
    ageRanges: ['Primary 5–11', 'Secondary 11–16', 'Teachers'],
  },
  omnimusic: {
    location: 'National',
    region: 'National',
    tags: ['Resources', 'Inclusive', 'Projects'],
    artForms: ['Music'],
    ageRanges: ['All ages', 'SEND', 'Teachers'],
    coverSrc: '/partners/omnimusic/hero.png',
  },
};

const DEFAULT_LISTING: OrgListingMeta = {
  location: 'UK',
  region: 'National',
  tags: ['Resources', 'Projects'],
  artForms: ['Arts'],
  ageRanges: ['Schools', 'Teachers'],
};

export function orgListingMeta(slug: string): OrgListingMeta {
  return ORG_LISTING[slug] ?? DEFAULT_LISTING;
}

export function featuredArtsOrganisations(): OrgEntry[] {
  const bySlug = new Map(ARTS_ORGANISATIONS.map((o) => [o.hub.slug, o]));
  return FEATURED_ORG_SLUGS.map((s) => bySlug.get(s)).filter(Boolean) as OrgEntry[];
}

/** Soft tag colours for listing chips (Partner Hubs mockup). */
export const TAG_TONE: Record<string, string> = {
  Performances: 'bg-[#EDE9FE] text-[#5B21B6]',
  Workshops: 'bg-[#FEF3C7] text-[#92400E]',
  Resources: 'bg-[#DBEAFE] text-[#1D4ED8]',
  CPD: 'bg-[#E0E7FF] text-[#4338E8]',
  Ensembles: 'bg-[#FEF9C3] text-[#854D0E]',
  'Youth ensembles': 'bg-[#DBEAFE] text-[#1D4ED8]',
  Projects: 'bg-[#EDE9FE] text-[#5B21B6]',
  'Teacher packs': 'bg-[#FCE7F3] text-[#9D174D]',
  Inclusive: 'bg-[#CCFBF1] text-[#0F766E]',
};

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
