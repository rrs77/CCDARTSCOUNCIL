/**
 * Hub administration types (organisations, memberships, resources).
 */

export type HubMembershipRole =
  | 'hub_viewer'
  | 'hub_editor'
  | 'hub_publisher'
  | 'hub_administrator';

export type HubStatus = 'active' | 'draft' | 'archived';

export type ResourceStatus = 'draft' | 'published' | 'unpublished' | 'archived';

export interface OrganisationHub {
  id: string;
  slug: string;
  display_name: string;
  short_name?: string | null;
  site_url?: string | null;
  logo_src?: string | null;
  primary_color?: string | null;
  accent_color?: string | null;
  logo_invert?: boolean | null;
  logo_on_plate?: boolean | null;
  logo_panel_color?: string | null;
  paid?: boolean;
  interactive?: boolean;
  status: HubStatus;
  aliases?: string[];
  hub_role?: HubMembershipRole;
  is_super_admin?: boolean;
}

export interface HubPageContent {
  organisation_id?: string;
  tagline?: string | null;
  description?: string[];
  intro_html?: string;
  headings?: Record<string, string>;
  featured?: Record<string, unknown>;
  packs?: unknown[];
  gallery?: unknown[];
  contact?: Record<string, unknown>;
  images?: unknown[];
  draft_content?: Record<string, unknown> | null;
  published_revision?: number;
  published_at?: string | null;
  updated_at?: string;
}

export interface HubResource {
  id: string;
  organisation_id: string;
  collection_id?: string | null;
  title: string;
  description?: string | null;
  resource_type: string;
  /** Canonical stored URL column */
  download_url?: string;
  /** Alias used in admin forms */
  external_url?: string;
  url_verified?: boolean;
  url_check_warning?: string | null;
  status: ResourceStatus;
  is_free: boolean;
  pricing_note?: string | null;
  age_range?: string | null;
  key_stages?: string[];
  subjects?: string[];
  tags?: string[];
  sort_order: number;
  requires_auth?: boolean;
  preview_url?: string | null;
  related_resource_id?: string | null;
  published_at?: string | null;
}

export interface HubCollection {
  id: string;
  organisation_id: string;
  title: string;
  description?: string | null;
  sort_order: number;
}

export interface PublicHubPayload {
  organisation: Partial<OrganisationHub> & { slug: string; display_name: string };
  page: HubPageContent | null;
  resources: HubResource[];
  collections: HubCollection[];
  activities: unknown[];
  media: unknown[];
}
