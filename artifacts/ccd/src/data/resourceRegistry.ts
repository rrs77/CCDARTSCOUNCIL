/**
 * Client-side Jazz North resource registry (stable IDs).
 * Hub Open/Download buttons use DreamHost direct URLs (exact File Manager names).
 * Local `/partners/jazznorth/` copies remain as offline fallback only.
 */
import seed from './jazzNorthResources.seed.json';
import { JN_DREAMHOST_BASE, jnDreamHostUrl } from '../config/jazzNorthDreamHost';

export interface RegistryResource {
  id: string;
  title: string;
  type: string;
  collection: string;
  filename: string;
  /** Exact DreamHost File Manager filename (may include spaces). */
  dreamHostFilename: string;
  relatedAudioId?: string | null;
  /** Direct DreamHost download URL — preferred Open/Download target. */
  publicUrl: string;
  /** Local Vite public path fallback. */
  localPublicUrl: string;
  externalUrlPlaceholder?: string;
}

export interface ResourceCollection {
  id: string;
  title: string;
  description: string;
}

/** Map stable registry ids → exact DreamHost filenames. */
const DREAMHOST_FILENAME_BY_ID: Record<string, string> = {
  'jn-can-you-sing-activities': 'Can-you-sing-your-song-activites.pdf',
  'jn-can-you-sing-piano-accomp': 'Can-you-sing-your-song-piano-accomp.pdf',
  'jn-can-you-sing-audio': 'Can-you-sing-your-song-audio-files.zip',
  'jn-hello-song-activities': 'Hello-song-activities.pdf',
  'jn-hello-song-score': 'Hello song score.pdf',
  'jn-hello-song-audio': 'Hello-song-audio-files.zip',
  'jn-2-and-4-chant-activities': '2-and 4-chant-activities.pdf',
  'jn-2-and-4-chant-score': '2-and-4-chant-score-both-versions.pdf',
  'jn-2-and-4-chant-audio': '2-and-4-audio-files.zip',
  'jn-not-quite-jazz-improv-games': 'Not-quite-jazz-improvisation-games.pdf',
  'jn-ways-into-improvisation': 'Ways-into-Improvisation.pdf',
};

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
  return items.map((r) => {
    const dreamHostFilename = DREAMHOST_FILENAME_BY_ID[r.id] || r.filename;
    return {
      id: r.id,
      title: r.title,
      type: r.type,
      collection: r.collection,
      filename: r.filename,
      dreamHostFilename,
      relatedAudioId: r.relatedAudioId ?? null,
      publicUrl: jnDreamHostUrl(dreamHostFilename),
      localPublicUrl: `/partners/jazznorth/${r.filename}`,
      externalUrlPlaceholder: r.externalUrlPlaceholder || jnDreamHostUrl(dreamHostFilename),
    };
  });
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

/** Documented base for ops / user correction. */
export const JAZZ_NORTH_DREAMHOST_BASE_USED = JN_DREAMHOST_BASE;

export function getJazzNorthResourcesByCollection(collectionId: string): RegistryResource[] {
  return JAZZ_NORTH_RESOURCES.filter((r) => r.collection === collectionId);
}

export function getResourceById(id: string): RegistryResource | undefined {
  return JAZZ_NORTH_RESOURCES.find((r) => r.id === id);
}
