import { supabase } from '../../config/supabase';
import { getVercelApiUrl } from '../apiUrl';

export type AttachmentKind = 'image' | 'video' | 'document' | 'audio';

export interface LessonAttachment {
  id: string;
  lessonKey: string;
  fileName: string;
  mimeType: string;
  kind: AttachmentKind;
  byteSize: number;
  status: 'pending' | 'ready' | 'linked' | 'failed';
  storageKind?: 'dreamhost' | 'link';
  provider?: string | null;
  url: string | null;
  createdAt?: string;
}

export interface ProviderConfig {
  dropbox: boolean;
  googleDrive: boolean;
  box: boolean;
  oneDrive: boolean;
  keys: {
    dropboxAppKey: string | null;
    googleApiKey: string | null;
    googleClientId: string | null;
    boxClientId: string | null;
    oneDriveClientId: string | null;
  };
}

export function buildLessonKey(sheet: string, lessonNumber: string): string {
  return `${sheet}:${lessonNumber}`;
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  } catch {
    /* ignore */
  }
  return headers;
}

export async function fetchProviderConfig(): Promise<ProviderConfig> {
  const res = await fetch(`${getVercelApiUrl('/api/lesson-attachments')}?providers=1`, {
    headers: await authHeaders(),
  });
  if (!res.ok) {
    return {
      dropbox: false,
      googleDrive: false,
      box: false,
      oneDrive: false,
      keys: {
        dropboxAppKey: null,
        googleApiKey: null,
        googleClientId: null,
        boxClientId: null,
        oneDriveClientId: null,
      },
    };
  }
  return (await res.json()) as ProviderConfig;
}

export async function listLessonAttachments(lessonKey: string): Promise<LessonAttachment[]> {
  const res = await fetch(
    `${getVercelApiUrl('/api/lesson-attachments')}?lessonKey=${encodeURIComponent(lessonKey)}`,
    { headers: await authHeaders() },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `List failed (${res.status})`);
  }
  const data = (await res.json()) as { attachments?: LessonAttachment[] };
  return Array.isArray(data.attachments) ? data.attachments : [];
}

export async function deleteLessonAttachment(id: string): Promise<void> {
  const res = await fetch(
    `${getVercelApiUrl('/api/lesson-attachments')}?id=${encodeURIComponent(id)}`,
    { method: 'DELETE', headers: await authHeaders() },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Delete failed (${res.status})`);
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function uploadLessonAttachment(
  lessonKey: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<LessonAttachment> {
  const headers = await authHeaders();
  onProgress?.(5);
  const prepareRes = await fetch(getVercelApiUrl('/api/lesson-attachments'), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prepare: true,
      lessonKey,
      fileName: file.name,
      mimeType: file.type || '',
      byteSize: file.size,
    }),
  });
  if (!prepareRes.ok) {
    const err = await prepareRes.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Prepare failed (${prepareRes.status})`);
  }
  const prepare = (await prepareRes.json()) as {
    mode: 'proxy' | 'direct';
    attachmentId?: string;
    uploadUrl?: string;
    ticket?: string;
    storagePath?: string;
  };
  onProgress?.(20);

  if (prepare.mode === 'proxy') {
    const fileData = await fileToBase64(file);
    onProgress?.(55);
    const up = await fetch(getVercelApiUrl('/api/lesson-attachments'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        lessonKey,
        fileName: file.name,
        mimeType: file.type || '',
        fileData,
      }),
    });
    if (!up.ok) {
      const err = await up.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || `Upload failed (${up.status})`);
    }
    onProgress?.(100);
    return ((await up.json()) as { attachment: LessonAttachment }).attachment;
  }

  if (!prepare.uploadUrl || !prepare.ticket || !prepare.storagePath || !prepare.attachmentId) {
    throw new Error('Direct upload ticket missing.');
  }
  const form = new FormData();
  form.append('path', prepare.storagePath);
  form.append('ticket', prepare.ticket);
  form.append('file', file, file.name);
  onProgress?.(45);
  const direct = await fetch(prepare.uploadUrl, {
    method: 'POST',
    headers: { 'X-Upload-Ticket': prepare.ticket },
    body: form,
  });
  if (!direct.ok) {
    const text = await direct.text().catch(() => '');
    throw new Error(text || `Direct upload failed (${direct.status})`);
  }
  onProgress?.(85);
  const complete = await fetch(getVercelApiUrl('/api/lesson-attachments'), {
    method: 'POST',
    headers,
    body: JSON.stringify({ complete: true, attachmentId: prepare.attachmentId }),
  });
  if (!complete.ok) {
    const err = await complete.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Complete failed (${complete.status})`);
  }
  onProgress?.(100);
  return ((await complete.json()) as { attachment: LessonAttachment }).attachment;
}

export async function importCloudAttachment(
  lessonKey: string,
  payload: {
    provider: 'dropbox' | 'google_drive' | 'box' | 'onedrive';
    fileName: string;
    mimeType?: string;
    byteSize?: number;
    downloadUrl: string;
    externalUrl?: string;
    accessToken?: string;
    providerFileId?: string;
  },
): Promise<LessonAttachment> {
  const res = await fetch(getVercelApiUrl('/api/lesson-attachments'), {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ import: true, lessonKey, ...payload }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Import failed (${res.status})`);
  }
  return ((await res.json()) as { attachment: LessonAttachment }).attachment;
}

export const LESSON_ATTACHMENT_ACCEPT =
  '.jpg,.jpeg,.png,.heic,.webp,.mp4,.mov,.doc,.docx,.mp3,.wav,.m4a,.aac,.ogg,image/*,video/mp4,video/quicktime,audio/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
