/**
 * Bring lesson-attachment providers into the Interactive Lesson Viewer.
 * Reuses planner pickers + /api/lesson-attachments (public client IDs only).
 */

import { supabase } from '../../../config/supabase';
import {
  fetchProviderConfig,
  importCloudAttachment,
  uploadLessonAttachment,
  type LessonAttachment,
  type ProviderConfig,
} from '../../../utils/planner/lessonAttachmentsApi';
import type { CloudPickResult } from '../../../utils/planner/cloudPickers';
import {
  pickFromBox,
  pickFromDropbox,
  pickFromGoogleDrive,
  pickFromOneDrive,
  pickFromTeams,
  listGoogleClassroomCourses,
  listGoogleClassroomMaterials,
  type ClassroomCourse,
  type ClassroomMaterialItem,
} from '../../../utils/planner/cloudPickers';
import { detectUploadKind, type UploadKind } from './mediaUpload';

export type IlvCloudProviderId =
  | 'device'
  | 'dropbox'
  | 'googleDrive'
  | 'googleClassroom'
  | 'box'
  | 'oneDrive'
  | 'teams';

export type IlvProviderStatus = {
  id: IlvCloudProviderId;
  label: string;
  connected: boolean;
};

export function ilvAttachmentLessonKey(lessonId: string): string {
  return `ilv:${lessonId}`;
}

export function listIlvProviderStatuses(cfg: ProviderConfig | null): IlvProviderStatus[] {
  return [
    { id: 'device', label: 'This device', connected: true },
    { id: 'dropbox', label: 'Dropbox', connected: Boolean(cfg?.dropbox && cfg.keys.dropboxAppKey) },
    {
      id: 'googleDrive',
      label: 'Google Drive',
      connected: Boolean(cfg?.googleDrive && cfg.keys.googleApiKey && cfg.keys.googleClientId),
    },
    {
      id: 'googleClassroom',
      label: 'Google Classroom',
      connected: Boolean(cfg?.googleClassroom && cfg.keys.googleClientId),
    },
    { id: 'box', label: 'Box', connected: Boolean(cfg?.box && cfg.keys.boxClientId) },
    { id: 'oneDrive', label: 'OneDrive', connected: Boolean(cfg?.oneDrive && cfg.keys.oneDriveClientId) },
    { id: 'teams', label: 'Teams', connected: Boolean(cfg?.teams && cfg.keys.teamsClientId) },
  ];
}

export async function loadIlvProviderConfig(): Promise<ProviderConfig> {
  return fetchProviderConfig();
}

async function authToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Resolve a playable URL for the viewer. Proxy attachment paths are fetched
 * with Bearer auth (no token in the URL) and turned into a blob URL.
 */
export async function resolveAttachmentPlayUrl(url: string | null | undefined): Promise<string> {
  if (!url) throw new Error('Attachment has no URL yet');
  if (!url.includes('/api/lesson-attachments/')) return url;
  const token = await authToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Could not load file (${res.status})`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export function kindFromAttachment(att: LessonAttachment): UploadKind {
  if (att.kind === 'image') return 'image';
  if (att.kind === 'video') return 'video';
  if (att.kind === 'audio') return 'audio';
  const mime = (att.mimeType || '').toLowerCase();
  const name = att.fileName || '';
  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(name)) return 'image';
  if (mime.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(name)) return 'video';
  if (mime.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg)$/i.test(name)) return 'audio';
  if (/presentation|powerpoint|\.pptx?$/i.test(mime + name)) return 'powerpoint';
  return 'upload';
}

export type ImportedIlvMedia = {
  url: string;
  name: string;
  kind: UploadKind;
  provider?: string;
  sourceUrl?: string;
  attachmentId: string;
};

export async function importPickedCloudToIlv(
  lessonId: string,
  picked: CloudPickResult,
): Promise<ImportedIlvMedia> {
  const lessonKey = ilvAttachmentLessonKey(lessonId);
  const attachment = await importCloudAttachment(lessonKey, picked);
  const playUrl =
    attachment.url ||
    picked.externalUrl ||
    (picked.linkOnly ? picked.externalUrl : null);
  if (picked.linkOnly && playUrl) {
    return {
      url: playUrl,
      name: attachment.fileName || picked.fileName,
      kind: kindFromAttachment(attachment),
      provider: picked.provider,
      sourceUrl: playUrl,
      attachmentId: attachment.id,
    };
  }
  const url = await resolveAttachmentPlayUrl(attachment.url);
  return {
    url,
    name: attachment.fileName || picked.fileName,
    kind: kindFromAttachment(attachment),
    provider: picked.provider,
    sourceUrl: picked.externalUrl || attachment.url || undefined,
    attachmentId: attachment.id,
  };
}

export async function uploadDeviceFileToIlv(
  lessonId: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<ImportedIlvMedia> {
  const lessonKey = ilvAttachmentLessonKey(lessonId);
  const attachment = await uploadLessonAttachment(lessonKey, file, onProgress);
  const url = await resolveAttachmentPlayUrl(attachment.url);
  return {
    url,
    name: attachment.fileName || file.name,
    kind: detectUploadKind(file),
    provider: 'device',
    attachmentId: attachment.id,
  };
}

export async function pickIlvCloudProvider(
  provider: Exclude<IlvCloudProviderId, 'device' | 'googleClassroom'>,
  cfg: ProviderConfig,
): Promise<CloudPickResult | null> {
  if (provider === 'dropbox' && cfg.keys.dropboxAppKey) {
    return pickFromDropbox(cfg.keys.dropboxAppKey);
  }
  if (provider === 'googleDrive' && cfg.keys.googleApiKey && cfg.keys.googleClientId) {
    return pickFromGoogleDrive(cfg.keys.googleApiKey, cfg.keys.googleClientId);
  }
  if (provider === 'box' && cfg.keys.boxClientId) {
    return pickFromBox(cfg.keys.boxClientId);
  }
  if (provider === 'oneDrive' && cfg.keys.oneDriveClientId) {
    return pickFromOneDrive(cfg.keys.oneDriveClientId);
  }
  if (provider === 'teams' && cfg.keys.teamsClientId) {
    return pickFromTeams(cfg.keys.teamsClientId);
  }
  return null;
}

export async function openIlvClassroom(
  cfg: ProviderConfig,
): Promise<{ token: string; courses: ClassroomCourse[] }> {
  if (!cfg.keys.googleClientId) throw new Error('Google Classroom is not connected');
  return listGoogleClassroomCourses(cfg.keys.googleClientId);
}

export async function loadIlvClassroomMaterials(
  courseId: string,
  token: string,
): Promise<ClassroomMaterialItem[]> {
  return listGoogleClassroomMaterials(courseId, token);
}

export type { ClassroomCourse, ClassroomMaterialItem, ProviderConfig, CloudPickResult };
