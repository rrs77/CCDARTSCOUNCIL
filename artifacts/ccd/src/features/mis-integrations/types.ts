/**
 * School Systems & MIS Integration — shared types.
 * No live provider auth or sync in this phase.
 */

export type MisAppId = 'ccdesigner' | 'assessify' | 'perifeedback' | 'periplanner';

export type MisScopeId =
  | 'year_groups.read'
  | 'pupils.read'
  | 'classes.read'
  | 'lesson_assignments.read'
  | 'parent_contacts.read'
  | 'timetables.read'
  | 'activities.read';

export type MisProviderId =
  | 'wonde'
  | 'isams'
  | 'sims'
  | 'arbor'
  | 'bromcom'
  | 'engage'
  | 'wcbs'
  | 'schoolbase'
  | 'socs';

export type MisProviderKind = 'mis' | 'hub' | 'co_curricular';

/** UI status shown with text + coloured dot (never colour alone). */
export type MisUiStatus = 'unverified' | 'requested' | 'approved' | 'connected';

export type MisApprovalStatus =
  | 'unverified'
  | 'docs_reviewed'
  | 'pending_approval'
  | 'approved'
  | 'declined';

export type MisAvailability = 'catalogue' | 'requestable' | 'available' | 'unavailable';

export type MisConnectionStatus =
  | 'draft'
  | 'requested'
  | 'gates_incomplete'
  | 'ready'
  | 'connected'
  | 'revoked'
  | 'declined';

export type MisMappingAction = 'match' | 'rename_to_mis' | 'keep_existing';

export type MisMappingActionLabel = 'Match' | 'Rename to MIS name' | 'Keep existing';

/** Six UI approval steps (mockup). Finer DB gates map into these. */
export type MisApprovalStepId =
  | 'docs_reviewed'
  | 'api_commercial'
  | 'school_authorised'
  | 'data_protection'
  | 'categories_configured'
  | 'tested';

export interface MisProviderDef {
  id: MisProviderId;
  displayName: string;
  kind: MisProviderKind;
  subtitle: string;
  availability: MisAvailability;
  approvalStatus: MisApprovalStatus;
  /** Always unverified until official docs + approval. */
  uiStatus: MisUiStatus;
  isCentralHub: boolean;
  recommendedFirst: boolean;
  requiresSeparateIntegration: boolean;
  flag?: string;
  softFlag?: string;
  docsUrl?: string;
  notes: string;
  sortOrder: number;
}

export interface MisAppDataRow {
  appId: MisAppId;
  displayName: string;
  dataItCanReceive: string;
  scopes: MisScopeId[];
  scopesNote?: string;
  neverReceives?: string;
  highlightCcd?: boolean;
}

export interface MisApprovalStepDef {
  id: MisApprovalStepId;
  step: number;
  label: string;
}

export interface MisYearGroupMappingPreview {
  externalName: string;
  localName: string | null;
  action: MisMappingAction;
}

export interface MisIntegrationRequestDraft {
  providerId: MisProviderId;
  schoolName: string;
  requesterName: string;
  requesterEmail: string;
  message: string;
  requestedApps: MisAppId[];
}
