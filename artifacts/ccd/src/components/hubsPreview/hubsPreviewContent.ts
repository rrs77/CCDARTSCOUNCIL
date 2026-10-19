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
