/**
 * Client-side media upload for Interactive Lesson Viewer.
 * Prefers Supabase Storage bucket `interactive-lessons`; falls back to
 * object URL + IndexedDB when storage isn't configured / upload fails.
 * No serverless functions.
 */

import { supabase, isSupabaseAuthEnabled } from '../../../config/supabase';
import { isDemoModeActive, isAuthorizedDemoMode } from '../../../utils/demoMode';
import type { SceneType } from '../types';

export const ILV_STORAGE_BUCKET = 'interactive-lessons';
const IDB_NAME = 'ccd-ilv-media-v1';
const IDB_STORE = 'files';

export type UploadKind = 'image' | 'video' | 'audio' | 'powerpoint' | 'upload';

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface UploadedMedia {
  url: string;
  name: string;
  mimeType: string;
  kind: UploadKind;
  size: number;
  /** True when stored only in this browser (object URL / IndexedDB). */
  localOnly: boolean;
  warning?: string;
  storagePath?: string;
}

const ACCEPT_MAP: Record<UploadKind, string[]> = {
  image: ['image/'],
  video: ['video/'],
  audio: ['audio/'],
  powerpoint: [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/pdf',
  ],
  upload: [],
};

export const ILV_FILE_ACCEPT =
  'image/*,video/*,audio/*,.pptx,.ppt,.pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,application/pdf';

export function detectUploadKind(file: File): UploadKind {
  const t = (file.type || '').toLowerCase();
  const name = file.name.toLowerCase();
  if (t.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(name)) return 'image';
  if (t.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(name)) return 'video';
  if (t.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(name)) return 'audio';
  if (
    t.includes('presentation') ||
    t.includes('powerpoint') ||
    t === 'application/pdf' ||
    /\.(pptx?|pdf)$/i.test(name)
  ) {
    return 'powerpoint';
  }
  return 'upload';
}

export function uploadKindToSceneType(kind: UploadKind): SceneType {
  if (kind === 'image') return 'image';
  if (kind === 'video') return 'video';
  if (kind === 'audio') return 'audio';
  if (kind === 'powerpoint') return 'powerpoint';
  return 'embed';
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-()+ ]+/g, '_').replace(/\s+/g, '-').slice(0, 120);
}

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
  });
}

async function putIdb(key: string, blob: Blob): Promise<void> {
  const db = await openIdb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IndexedDB put failed'));
  });
  db.close();
}

export async function getIdbBlob(key: string): Promise<Blob | null> {
  try {
    const db = await openIdb();
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve((req.result as Blob) || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return blob;
  } catch {
    return null;
  }
}

async function fallbackLocal(file: File, onProgress?: (p: UploadProgress) => void): Promise<UploadedMedia> {
  onProgress?.({ loaded: 0, total: file.size, percent: 10 });
  const key = `local_${Date.now()}_${sanitizeFileName(file.name)}`;
  try {
    await putIdb(key, file);
  } catch {
    /* still provide object URL */
  }
  onProgress?.({ loaded: file.size, total: file.size, percent: 100 });
  const url = URL.createObjectURL(file);
  return {
    url,
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    kind: detectUploadKind(file),
    size: file.size,
    localOnly: true,
    warning:
      'Stored locally in this browser only — not available on other devices until Supabase Storage is configured.',
    storagePath: key,
  };
}

function canAttemptRemote(): boolean {
  if (isDemoModeActive() || isAuthorizedDemoMode()) return false;
  return isSupabaseAuthEnabled();
}

/**
 * Upload a file with progress. Tries Supabase Storage first; falls back to local.
 */
export async function uploadInteractiveLessonMedia(
  file: File,
  opts: {
    userId: string;
    lessonId: string;
    onProgress?: (p: UploadProgress) => void;
  },
): Promise<UploadedMedia> {
  const { userId, lessonId, onProgress } = opts;
  const kind = detectUploadKind(file);

  if (!canAttemptRemote() || !userId || userId === 'anonymous') {
    return fallbackLocal(file, onProgress);
  }

  const path = `${userId}/${lessonId || 'shared'}/${Date.now()}_${sanitizeFileName(file.name)}`;
  onProgress?.({ loaded: 0, total: file.size, percent: 5 });

  try {
    // Supabase JS upload doesn't expose byte progress for all runtimes —
    // simulate staged progress around the await, then complete.
    const tick = window.setInterval(() => {
      onProgress?.({
        loaded: Math.min(file.size * 0.85, file.size),
        total: file.size,
        percent: 85,
      });
    }, 400);

    const { error } = await supabase.storage.from(ILV_STORAGE_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });
    window.clearInterval(tick);

    if (error) {
      console.warn('[ilv] storage upload failed, using local fallback', error.message);
      return fallbackLocal(file, onProgress);
    }

    // Private bucket: short-lived signed URL only (never getPublicUrl).
    const { data: signed, error: signError } = await supabase.storage
      .from(ILV_STORAGE_BUCKET)
      .createSignedUrl(path, 3600);
    if (signError || !signed?.signedUrl) {
      console.warn(
        '[ilv] signed URL failed, using local fallback',
        signError?.message || 'no url',
      );
      return fallbackLocal(file, onProgress);
    }
    onProgress?.({ loaded: file.size, total: file.size, percent: 100 });

    return {
      url: signed.signedUrl,
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      kind,
      size: file.size,
      localOnly: false,
      storagePath: path,
    };
  } catch (err) {
    console.warn('[ilv] storage upload exception, using local fallback', err);
    return fallbackLocal(file, onProgress);
  }
}

export function isFileDrag(e: React.DragEvent | DragEvent): boolean {
  const types = e.dataTransfer?.types;
  if (!types) return false;
  return Array.from(types).includes('Files');
}

export function filesFromDrop(e: React.DragEvent | DragEvent): File[] {
  const list = e.dataTransfer?.files;
  if (!list?.length) return [];
  return Array.from(list);
}
