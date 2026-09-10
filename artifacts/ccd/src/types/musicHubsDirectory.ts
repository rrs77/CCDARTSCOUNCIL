/**
 * UK Music Hubs directory — Country → Region → Music Hub → Service → Borough/District.
 * Seed JSON is the source of truth; Admin can overlay status later (migrate to hub_pages).
 */

export type MusicHubNodeKind =
  | 'country'
  | 'region'
  | 'music-hub'
  | 'service'
  | 'borough'
  | 'district'
  | 'national-service'
  | 'delivery-partner';

export type MusicHubPublishStatus = 'published' | 'draft' | 'coming-soon';

export type MusicHubResourceAccess = 'FREE' | 'EXTERNAL' | 'SUBSCRIBER';

export interface MusicHubLink {
  label: string;
  href: string;
}

export interface MusicHubResource {
  id: string;
  title: string;
  description?: string;
  access: MusicHubResourceAccess;
  /** Public FREE / EXTERNAL URLs only. SUBSCRIBER URLs live server-side. */
  href?: string;
  /** Organisation that owns subscriber unlock (defaults to nearest orgId). */
  organisationId?: string;
  /** Attribution shown after copy to library. */
  providedBy?: string;
  /** Optional pack catalog id for add-to-library. */
  packId?: string;
}

export interface MusicHubSectionContent {
  about?: string[];
  schoolsEducation?: string[];
  training?: string[];
  events?: string[];
  links?: MusicHubLink[];
  resources?: MusicHubResource[];
}

export interface MusicHubDirectoryNode {
  id: string;
  kind: MusicHubNodeKind;
  name: string;
  slug: string;
  /** Full path segments from country, e.g. england/east-of-england/greater-essex/ems */
  path: string;
  status: MusicHubPublishStatus;
  /** Featured on main Music Hubs page without duplicating the org record. */
  featured?: boolean;
  tagline?: string;
  description?: string[];
  siteUrl?: string;
  logoSrc?: string;
  primaryColor?: string;
  accentColor?: string;
  logoOnPlate?: boolean;
  logoPanelColor?: string;
  logoInvert?: boolean;
  /** Links to existing PartnerHubConfig slug (ems, triborough). */
  partnerHubSlug?: string;
  /** Org id for subscriber password scope. */
  organisationId?: string;
  /** Show Essex district map (EMS only). */
  showEssexMap?: boolean;
  content?: MusicHubSectionContent;
  children?: MusicHubDirectoryNode[];
}

export interface MusicHubBreadcrumb {
  name: string;
  path: string;
}

export interface MusicHubDirectoryIndex {
  version: number;
  updatedAt: string;
  countries: MusicHubDirectoryNode[];
}
