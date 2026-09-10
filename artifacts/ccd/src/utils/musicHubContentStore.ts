/**
 * Music Hub content store (published + draft/pending revisions).
 * Persist in localStorage; migrate to Supabase hub_pages later.
 */

import type {
  HubContentActor,
  HubContentRevision,
  HubContentStore,
  HubEditableContent,
  HubPublishedSnapshot,
} from '../types/musicHubContent';
import type { MusicHubDirectoryNode } from '../types/musicHubsDirectory';

export const HUB_CONTENT_STORE_KEY = 'ccd-music-hub-content-v1';
export const MUSIC_HUB_PLACEHOLDER_LOGO = '/music-hubs/placeholder-logo.svg';
export const MUSIC_HUB_PLACEHOLDER_HERO = '/music-hubs/placeholder-hero.svg';
export const MUSIC_HUB_PLACEHOLDER_CARD = '/music-hubs/placeholder-card.svg';

function emptyStore(): HubContentStore {
  return { version: 1, published: {}, revisions: [] };
}

function readStore(): HubContentStore {
  if (typeof window === 'undefined') return emptyStore();
  try {
    const raw = localStorage.getItem(HUB_CONTENT_STORE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as HubContentStore;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.revisions)) return emptyStore();
    return {
      version: 1,
      published: parsed.published && typeof parsed.published === 'object' ? parsed.published : {},
      revisions: parsed.revisions,
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: HubContentStore): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HUB_CONTENT_STORE_KEY, JSON.stringify(store));
  try {
    window.dispatchEvent(new CustomEvent('ccd:music-hub-content-changed'));
  } catch {
    /* ignore */
  }
}

export function getHubContentStore(): HubContentStore {
  return readStore();
}

export function newRevisionId(): string {
  return `rev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function newItemId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Seed-derived editable baseline for a node (placeholders for empty media). */
export function contentFromNode(node: MusicHubDirectoryNode): HubEditableContent {
  const c = node.content;
  return {
    title: node.name,
    tagline: node.tagline,
    description: node.description ? [...node.description] : [],
    logoUrl: node.logoSrc || MUSIC_HUB_PLACEHOLDER_LOGO,
    heroImageUrl: MUSIC_HUB_PLACEHOLDER_HERO,
    images: [
      {
        id: 'img-hero',
        url: MUSIC_HUB_PLACEHOLDER_HERO,
        alt: `${node.name} image`,
      },
    ],
    about: c?.about ? [...c.about] : [],
    schoolsEducation: c?.schoolsEducation ? [...c.schoolsEducation] : [],
    training: c?.training ? [...c.training] : [],
    events: c?.events ? [...c.events] : [],
    links: c?.links ? c.links.map((l) => ({ ...l })) : [],
    resources: c?.resources
      ? c.resources.map((r) => ({
          ...r,
          ...(r.href ? {} : {}),
        }))
      : [],
    courses: [],
    activities: [],
    lessonPlans: [],
  };
}

export function getPublishedSnapshot(nodeId: string): HubPublishedSnapshot | null {
  return readStore().published[nodeId] || null;
}

export function getPublishedContent(nodeId: string): HubEditableContent | null {
  return getPublishedSnapshot(nodeId)?.content || null;
}

/** Active working revision: draft, pending, or latest rejected (for re-edit). */
export function getWorkingRevision(nodeId: string): HubContentRevision | null {
  const { revisions } = readStore();
  const forNode = revisions
    .filter((r) => r.nodeId === nodeId)
    .sort((a, b) => (a.editedAt < b.editedAt ? 1 : -1));
  const draft = forNode.find((r) => r.status === 'draft');
  if (draft) return draft;
  const pending = forNode.find((r) => r.status === 'pending_approval');
  if (pending) return pending;
  const rejected = forNode.find((r) => r.status === 'rejected');
  return rejected || null;
}

export function listPendingRevisions(): HubContentRevision[] {
  return readStore()
    .revisions.filter((r) => r.status === 'pending_approval')
    .sort((a, b) => (a.submittedAt || a.editedAt) < (b.submittedAt || b.editedAt) ? 1 : -1);
}

export function countPendingForNode(nodeId: string): number {
  return readStore().revisions.filter(
    (r) => r.nodeId === nodeId && r.status === 'pending_approval',
  ).length;
}

export function mergeNodeWithPublished(
  node: MusicHubDirectoryNode,
): MusicHubDirectoryNode & { editable: HubEditableContent } {
  const base = contentFromNode(node);
  const published = getPublishedContent(node.id);
  const editable: HubEditableContent = published
    ? {
        ...base,
        ...published,
        description: published.description ?? base.description,
        about: published.about ?? base.about,
        schoolsEducation: published.schoolsEducation ?? base.schoolsEducation,
        training: published.training ?? base.training,
        events: published.events ?? base.events,
        links: published.links ?? base.links,
        resources: published.resources ?? base.resources,
        courses: published.courses ?? base.courses,
        activities: published.activities ?? base.activities,
        lessonPlans: published.lessonPlans ?? base.lessonPlans,
        images: published.images ?? base.images,
        logoUrl: published.logoUrl || base.logoUrl || MUSIC_HUB_PLACEHOLDER_LOGO,
        heroImageUrl: published.heroImageUrl || base.heroImageUrl || MUSIC_HUB_PLACEHOLDER_HERO,
      }
    : base;

  return {
    ...node,
    name: editable.title || node.name,
    tagline: editable.tagline ?? node.tagline,
    description: editable.description?.length ? editable.description : node.description,
    logoSrc: editable.logoUrl || node.logoSrc || MUSIC_HUB_PLACEHOLDER_LOGO,
    content: {
      ...node.content,
      about: editable.about,
      schoolsEducation: editable.schoolsEducation,
      training: editable.training,
      events: editable.events,
      links: editable.links,
      resources: editable.resources,
    },
    editable,
  };
}

/** Content editors see: published merged with working draft when present. */
export function getEditorPreviewContent(node: MusicHubDirectoryNode): HubEditableContent {
  const merged = mergeNodeWithPublished(node).editable;
  const working = getWorkingRevision(node.id);
  if (!working || working.status === 'published') return merged;
  return {
    ...merged,
    ...working.content,
    logoUrl: working.content.logoUrl || merged.logoUrl || MUSIC_HUB_PLACEHOLDER_LOGO,
    heroImageUrl: working.content.heroImageUrl || merged.heroImageUrl || MUSIC_HUB_PLACEHOLDER_HERO,
  };
}

export function saveDraftRevision(
  nodeId: string,
  content: HubEditableContent,
  actor: HubContentActor,
): HubContentRevision {
  const store = readStore();
  const existing = store.revisions.find(
    (r) => r.nodeId === nodeId && (r.status === 'draft' || r.status === 'rejected'),
  );
  const now = new Date().toISOString();
  let revision: HubContentRevision;
  if (existing) {
    revision = {
      ...existing,
      status: 'draft',
      content,
      editedBy: actor,
      editedAt: now,
      reviewNote: undefined,
      reviewedAt: undefined,
      reviewedBy: undefined,
    };
    store.revisions = store.revisions.map((r) => (r.id === existing.id ? revision : r));
  } else {
    revision = {
      id: newRevisionId(),
      nodeId,
      status: 'draft',
      content,
      editedBy: actor,
      editedAt: now,
    };
    store.revisions = [...store.revisions, revision];
  }
  writeStore(store);
  return revision;
}

export function submitRevisionForApproval(
  nodeId: string,
  actor: HubContentActor,
): HubContentRevision | null {
  const store = readStore();
  const draft = store.revisions.find(
    (r) => r.nodeId === nodeId && (r.status === 'draft' || r.status === 'rejected'),
  );
  if (!draft) return null;
  const now = new Date().toISOString();
  const revision: HubContentRevision = {
    ...draft,
    status: 'pending_approval',
    editedBy: actor,
    editedAt: now,
    submittedAt: now,
  };
  store.revisions = store.revisions.map((r) => (r.id === draft.id ? revision : r));
  writeStore(store);
  return revision;
}

export function approveRevision(
  revisionId: string,
  actor: HubContentActor,
  note?: string,
): HubContentRevision | null {
  const store = readStore();
  const rev = store.revisions.find((r) => r.id === revisionId);
  if (!rev || rev.status !== 'pending_approval') return null;
  const now = new Date().toISOString();
  const published: HubContentRevision = {
    ...rev,
    status: 'published',
    reviewedBy: actor,
    reviewedAt: now,
    reviewNote: note,
  };
  store.revisions = store.revisions.map((r) => (r.id === revisionId ? published : r));
  store.published[rev.nodeId] = {
    revisionId: rev.id,
    content: rev.content,
    publishedAt: now,
    publishedBy: actor,
  };
  writeStore(store);
  return published;
}

export function rejectRevision(
  revisionId: string,
  actor: HubContentActor,
  note?: string,
): HubContentRevision | null {
  const store = readStore();
  const rev = store.revisions.find((r) => r.id === revisionId);
  if (!rev || rev.status !== 'pending_approval') return null;
  const now = new Date().toISOString();
  const rejected: HubContentRevision = {
    ...rev,
    status: 'rejected',
    reviewedBy: actor,
    reviewedAt: now,
    reviewNote: note || 'Rejected',
  };
  store.revisions = store.revisions.map((r) => (r.id === revisionId ? rejected : r));
  writeStore(store);
  return rejected;
}

export function ensurePlaceholderMedia(content: HubEditableContent): HubEditableContent {
  return {
    ...content,
    logoUrl: content.logoUrl || MUSIC_HUB_PLACEHOLDER_LOGO,
    heroImageUrl: content.heroImageUrl || MUSIC_HUB_PLACEHOLDER_HERO,
    images:
      content.images && content.images.length > 0
        ? content.images.map((img) => ({
            ...img,
            url: img.url || MUSIC_HUB_PLACEHOLDER_CARD,
          }))
        : [{ id: 'img-hero', url: MUSIC_HUB_PLACEHOLDER_HERO, alt: 'Hub image' }],
    courses: (content.courses || []).map((c) => ({
      ...c,
      imageUrl: c.imageUrl || MUSIC_HUB_PLACEHOLDER_CARD,
    })),
    activities: (content.activities || []).map((c) => ({
      ...c,
      imageUrl: c.imageUrl || MUSIC_HUB_PLACEHOLDER_CARD,
    })),
    lessonPlans: (content.lessonPlans || []).map((c) => ({
      ...c,
      imageUrl: c.imageUrl || MUSIC_HUB_PLACEHOLDER_CARD,
    })),
  };
}
