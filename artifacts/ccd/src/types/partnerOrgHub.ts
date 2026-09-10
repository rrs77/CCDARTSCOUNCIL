/**
 * Shared Partner Organisation Hub layout — Jazz North, LSO, and future orgs.
 * Admins pick section types from a fixed palette (no free-form HTML).
 */

export type PartnerOrgSectionType =
  | 'about'
  | 'featured'
  | 'resources'
  | 'info-accordion'
  | 'courses'
  | 'events'
  | 'cta';

export type PartnerOrgCardActionKind =
  | 'open'
  | 'download'
  | 'view-site'
  | 'add-activities'
  | 'add-lesson';

export interface PartnerOrgHubLink {
  href: string;
  label: string;
  icon?: 'external' | 'file';
}

export interface PartnerOrgHubCard {
  id: string;
  title: string;
  meta?: string;
  description?: string;
  /** Official organisation page */
  siteUrl?: string;
  /** Direct open / download target (DreamHost or official file) */
  openUrl?: string;
  downloadUrl?: string;
  downloadFilename?: string;
  openLabel?: string;
  downloadLabel?: string;
  /** Seed handler keys resolved by the hub wrapper */
  seedKey?: string;
  /** Show Add Activities / Add Lesson Plan */
  seedable?: boolean;
}

export interface PartnerOrgHubSection {
  id: string;
  type: PartnerOrgSectionType;
  title: string;
  subtitle?: string;
  /** Collapsible sections (info-accordion) start collapsed unless true */
  defaultOpen?: boolean;
  body?: string;
  eyebrow?: string;
  links?: PartnerOrgHubLink[];
  cards?: PartnerOrgHubCard[];
  /** Optional hero / section image */
  imageSrc?: string;
  imageAlt?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export interface PartnerOrgHubLayout {
  orgSlug: string;
  orgDisplayName: string;
  version: 1;
  sections: PartnerOrgHubSection[];
}

/** Fixed palette shown in “Add section” — labels only; styling is shared. */
export const PARTNER_ORG_SECTION_PALETTE: {
  type: PartnerOrgSectionType;
  label: string;
  hint: string;
}[] = [
  { type: 'about', label: 'About', hint: 'Short intro copy block' },
  { type: 'featured', label: 'Featured', hint: 'Highlighted course / pack with CTA' },
  { type: 'resources', label: 'Resources grid', hint: 'Downloadable / seedable cards' },
  {
    type: 'info-accordion',
    label: 'Forums & information',
    hint: 'Collapsible info / opportunities cards',
  },
  { type: 'courses', label: 'Courses', hint: 'Course list with open links' },
  { type: 'events', label: 'Events', hint: 'Events / dates teaser' },
  { type: 'cta', label: 'Call to action', hint: 'Single CTA band' },
];
