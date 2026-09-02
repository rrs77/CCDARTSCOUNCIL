/**
 * Client-side Jazz North resource registry (stable IDs).
 * Downloads MUST go through /api/resources/:id/download — never raw DreamHost URLs.
 */
import seed from '../data/jazzNorthResources.seed.json';

export interface RegistryResource {
  id: string;
  title: string;
  type: string;
  collection: string;
  filename: string;
  relatedAudioId?: string | null;
  /** Placeholder only — never used as a button href. */
  externalUrlPlaceholder?: string;
}

export interface ResourceCollection {
  id: string;
  title: string;
  description: string;
}

const pdfResources: RegistryResource[] = (seed.resources || []).map((r) => ({
  id: r.id,
  title: r.title,
  type: r.type,
  collection: r.collection,
  filename: r.filename,
  relatedAudioId: r.relatedAudioId ?? null,
  externalUrlPlaceholder: r.externalUrlPlaceholder,
}));

const audioResources: RegistryResource[] = (seed.audioSupport || []).map((r) => ({
  id: r.id,
  title: r.title,
  type: r.type,
  collection: r.collection,
  filename: r.filename,
  relatedAudioId: null,
  externalUrlPlaceholder: r.externalUrlPlaceholder,
}));

export const JAZZ_NORTH_COLLECTIONS: ResourceCollection[] = seed.collections || [];

export const JAZZ_NORTH_RESOURCES: RegistryResource[] = [...pdfResources, ...audioResources];

export function getJazzNorthResourcesByCollection(collectionId: string): RegistryResource[] {
  return JAZZ_NORTH_RESOURCES.filter((r) => r.collection === collectionId);
}

export function getResourceById(id: string): RegistryResource | undefined {
  return JAZZ_NORTH_RESOURCES.find((r) => r.id === id);
}
