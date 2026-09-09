/**
 * Client-side Jazz North resource registry (stable IDs).
 * On main, files are served from /partners/jazznorth/ for demo + signed-in hub browsing.
 * The auth branch’s tracked-download API can reuse the same IDs later.
 */
import seed from './jazzNorthResources.seed.json';

export interface RegistryResource {
  id: string;
  title: string;
  type: string;
  collection: string;
  filename: string;
  relatedAudioId?: string | null;
  /** Public path under Vite `public/` — preferred open/download target on main. */
  publicUrl: string;
  /** Placeholder external host URL — not used as a button href on main. */
  externalUrlPlaceholder?: string;
}

export interface ResourceCollection {
  id: string;
  title: string;
  description: string;
}

function toRegistry(
  items: Array<{
    id: string;
    title: string;
    type: string;
    collection: string;
    filename: string;
    relatedAudioId?: string | null;
    externalUrlPlaceholder?: string;
  }>,
): RegistryResource[] {
  return items.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    collection: r.collection,
    filename: r.filename,
    relatedAudioId: r.relatedAudioId ?? null,
    publicUrl: `/partners/jazznorth/${r.filename}`,
    externalUrlPlaceholder: r.externalUrlPlaceholder,
  }));
}

const pdfResources = toRegistry(seed.resources || []);
const audioResources = toRegistry(
  (seed.audioSupport || []).map((r) => ({
    ...r,
    relatedAudioId: null,
  })),
);

export const JAZZ_NORTH_COLLECTIONS: ResourceCollection[] = seed.collections || [];

export const JAZZ_NORTH_RESOURCES: RegistryResource[] = [...pdfResources, ...audioResources];

export function getJazzNorthResourcesByCollection(collectionId: string): RegistryResource[] {
  return JAZZ_NORTH_RESOURCES.filter((r) => r.collection === collectionId);
}

export function getResourceById(id: string): RegistryResource | undefined {
  return JAZZ_NORTH_RESOURCES.find((r) => r.id === id);
}
