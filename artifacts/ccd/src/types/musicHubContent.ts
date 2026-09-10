/**
 * Per-node Music Hub editable content + approval workflow.
 * localStorage today; shape mirrors future hub_pages / revisions API.
 *
 * Activities / lessons / resources reuse existing CCDesigner models via ids
 * (activityId, lessonStackId, packId) — no HubActivity / HubLesson / HubUser types.
 */

import type { MusicHubLink, MusicHubResource } from './musicHubsDirectory';

/** Workflow states for hub page content revisions. */
export type HubContentRevisionStatus =
  | 'draft'
  | 'pending_approval'
  | 'published'
  | 'changes_requested'
  | 'rejected'
  | 'archived';

export interface HubContentImage {
  id: string;
  url: string;
  alt?: string;
}

/**
 * Linked catalogue item shown on a hub page.
 * Prefer refs to existing Activity / Lesson stack / pack / MusicHubResource.
 */
export interface HubLinkedItem {
  id: string;
  title: string;
  description?: string;
  href?: string;
  imageUrl?: string;
  /** Existing Activity id/key in the library. */
  activityId?: string;
  /** Existing lesson stack / stacked lesson id. */
  lessonStackId?: string;
  /** Existing activity pack id. */
  packId?: string;
  /** Existing MusicHubResource id when linking a hub resource row. */
  resourceId?: string;
  access?: MusicHubResource['access'];
  /** Soft-delete proposal until approved. */
  proposedRemoval?: boolean;
}

/** Editable payload for a directory node (hub / service / district / borough). */
export interface HubEditableContent {
  title?: string;
  tagline?: string;
  description?: string[];
  logoUrl?: string;
  heroImageUrl?: string;
  images?: HubContentImage[];
  about?: string[];
  schoolsEducation?: string[];
  training?: string[];
  events?: string[];
  links?: MusicHubLink[];
  /** Reuses MusicHubResource (FREE / SUBSCRIBER / EXTERNAL). */
  resources?: MusicHubResource[];
  /** Course-style links; may reference packId. */
  courses?: HubLinkedItem[];
  /** Activity library refs via activityId / packId. */
  activities?: HubLinkedItem[];
  /** Lesson stack refs via lessonStackId / packId. */
  lessonPlans?: HubLinkedItem[];
  /** Resource / item ids proposed for removal (applied on approve). */
  proposedRemovals?: string[];
}

export interface HubContentActor {
  userId: string;
  email?: string;
  name?: string;
}

export interface HubContentAuditEvent {
  id: string;
  revisionId: string;
  nodeId: string;
  action:
    | 'created'
    | 'saved_draft'
    | 'submitted'
    | 'approved'
    | 'changes_requested'
    | 'rejected'
    | 'archived'
    | 'published';
  actor: HubContentActor;
  at: string;
  note?: string;
}

export interface HubContentRevision {
  id: string;
  nodeId: string;
  status: HubContentRevisionStatus;
  content: HubEditableContent;
  editedBy: HubContentActor;
  editedAt: string;
  submittedAt?: string;
  reviewedBy?: HubContentActor;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface HubPublishedSnapshot {
  revisionId: string;
  content: HubEditableContent;
  publishedAt: string;
  publishedBy: HubContentActor;
}

export interface HubContentStore {
  version: 1;
  /** Live content shown on public pages. */
  published: Record<string, HubPublishedSnapshot>;
  /** Working + pending revisions (keep history for audit). */
  revisions: HubContentRevision[];
  /** Append-only audit trail. */
  audit: HubContentAuditEvent[];
}

/** Local overlay: which users may administer which directory node ids. */
export interface MusicHubAdminAssignmentStore {
  version: 1;
  /**
   * userId → explicit node ids.
   * When `ems` (or another parent) is included with inheritChildren flag in
   * meta, children are expanded at check time.
   */
  byUserId: Record<string, string[]>;
  /** userId → parent node ids whose descendants are also administered. */
  inheritChildrenByUserId?: Record<string, string[]>;
}

export type HubEditFieldKey =
  | 'header'
  | 'logo'
  | 'hero'
  | 'about'
  | 'schoolsEducation'
  | 'resources'
  | 'courses'
  | 'activities'
  | 'lessonPlans'
  | 'training'
  | 'events'
  | 'links'
  | 'images';

/** @deprecated Use HubLinkedItem */
export type HubContentListItem = HubLinkedItem;
