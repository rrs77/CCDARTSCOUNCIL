/**
 * File sources for the Interactive Lesson Viewer.
 *
 * "This device" uploads through the existing ILV media path (Supabase Storage,
 * falling back to this browser). Cloud providers (Dropbox, Drive, Classroom,
 * Box, OneDrive, Teams) reuse the lesson-attachments API, which lives on the
 * separate lesson-attachments branch; until that ships they show as not
 * connected and never call /api/lesson-attachments.
 */

import { supabase } from '../../../config/supabase';
import { uploadInteractiveLessonMedia, type UploadKind } from './mediaUpload';

export type CloudPickResult = {
  provider: 'dropbox' | 'google_drive' | 'box' | 'onedrive' | 'teams' | 'google_classroom';
  fileName: string;
  mimeType: string;
  byteSize: number;
  downloadUrl: string;
  externalUrl?: string;
  accessToken?: string;
  providerFileId?: string;
  linkOnly?: boolean;
  kind?: 'image' | 'video' | 'audio' | 'document';
};

export type ClassroomCourse = { id: string; name: string };
export type ClassroomMaterialItem = { id: string; title: string; attachment: CloudPickResult };

/** Cloud providers are disabled until the lesson-attachments API is merged. */
export type ProviderConfig = { cloudAvailable: false };

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

export function listIlvProviderStatuses(_cfg: ProviderConfig | null): IlvProviderStatus[] {
  return [
    { id: 'device', label: 'This device', connected: true },
    { id: 'dropbox', label: 'Dropbox', connected: false },
    { id: 'googleDrive', label: 'Google Drive', connected: false },
    { id: 'googleClassroom', label: 'Google Classroom', connected: false },
    { id: 'box', label: 'Box', connected: false },
    { id: 'oneDrive', label: 'OneDrive', connected: false },
    { id: 'teams', label: 'Teams', connected: false },
  ];
}

export async function loadIlvProviderConfig(): Promise<ProviderConfig> {
  return { cloudAvailable: false };
}

export type ImportedIlvMedia = {
  url: string;
  name: string;
  kind: UploadKind;
  provider?: string;
  sourceUrl?: string;
  attachmentId?: string;
};

const NOT_AVAILABLE = 'Cloud file sources are not available yet.';

export async function importPickedCloudToIlv(
  _lessonId: string,
  _picked: CloudPickResult,
): Promise<ImportedIlvMedia> {
  throw new Error(NOT_AVAILABLE);
}

export async function uploadDeviceFileToIlv(
  lessonId: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<ImportedIlvMedia> {
  let userId = 'anonymous';
  try {
    const { data } = await supabase.auth.getUser();
    if (data.user?.id) userId = data.user.id;
  } catch {
    /* fall back to local storage */
  }
  const media = await uploadInteractiveLessonMedia(file, {
    userId,
    lessonId,
    onProgress: (p) => onProgress?.(p.percent),
  });
  return { url: media.url, name: media.name, kind: media.kind, provider: 'device' };
}

export async function pickIlvCloudProvider(
  _provider: Exclude<IlvCloudProviderId, 'device' | 'googleClassroom'>,
  _cfg: ProviderConfig,
): Promise<CloudPickResult | null> {
  throw new Error(NOT_AVAILABLE);
}

export async function openIlvClassroom(
  _cfg: ProviderConfig,
): Promise<{ token: string; courses: ClassroomCourse[] }> {
  throw new Error(NOT_AVAILABLE);
}

export async function loadIlvClassroomMaterials(
  _courseId: string,
  _token: string,
): Promise<ClassroomMaterialItem[]> {
  throw new Error(NOT_AVAILABLE);
}
