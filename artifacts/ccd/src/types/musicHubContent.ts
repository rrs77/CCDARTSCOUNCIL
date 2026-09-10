/**
 * Per-node Music Hub editable content + approval workflow.
 * localStorage today; shape mirrors future hub_pages / revisions API.
 */

import type { MusicHubLink, MusicHubResource } from './musicHubsDirectory';

export type HubContentRevisionStatus =
  | 'draft'
  | 'pending_approval'
  | 'published'
  | 'rejected';

export interface HubContentImage {
  id: string;
  url: string;
  alt?: string;
}

export interface HubContentListItem {
  id: string;
  title: string;
  description?: string;
  href?: string;
  imageUrl?: string;
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
  resources?: MusicHubResource[];
  courses?: HubContentListItem[];
  activities?: HubContentListItem[];
  lessonPlans?: HubContentListItem[];
}

export interface HubContentActor {
  userId: string;
  email?: string;
  name?: string;
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
}

/** Local overlay: which users may administer which directory node ids. */
export interface MusicHubAdminAssignmentStore {
  version: 1;
  /** userId → node ids (e.g. ems, ems-chelmsford). */
  byUserId: Record<string, string[]>;
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
