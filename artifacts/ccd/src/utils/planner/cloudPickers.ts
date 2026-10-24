/**
 * Official picker SDKs for cloud import.
 * Public app keys / client IDs only — short-lived access tokens are passed
 * once to the server for fetch and never stored.
 */

export type CloudPickResult = {
  provider: 'dropbox' | 'google_drive' | 'box' | 'onedrive' | 'teams' | 'google_classroom';
  fileName: string;
  mimeType: string;
  byteSize: number;
  downloadUrl: string;
  externalUrl?: string;
  accessToken?: string;
  providerFileId?: string;
  /** When true, server stores provider URL only (YouTube / web links). */
  linkOnly?: boolean;
  kind?: 'image' | 'video' | 'audio' | 'document';
};

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.id = id;
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(s);
  });
}

declare global {
  interface Window {
    Dropbox?: {
      choose: (options: Record<string, unknown>) => void;
    };
    gapi?: {
      load: (name: string, cb: () => void) => void;
      client?: { init: (opts: Record<string, unknown>) => Promise<void> };
    };
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (opts: Record<string, unknown>) => {
            requestAccessToken: (opts?: Record<string, unknown>) => void;
          };
        };
      };
      picker?: {
        // Google Picker builder is chainable; keep loose typing for CDN SDK.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        PickerBuilder: new () => any;
        DocsView: new () => unknown;
        Action: { PICKED: string; CANCEL: string };
        Response: { ACTION: string; DOCUMENTS: string };
        Document: { ID: string; NAME: string; MIME_TYPE: string; URL: string; SIZE_BYTES: string };
      };
    };
    Box?: {
      FilePicker?: new () => {
        show: (
          folderId: string | null,
          accessToken: string,
          options: Record<string, unknown>,
        ) => void;
      };
      ContentPicker?: new () => {
        show: (
          folderId: string | null,
          accessToken: string,
          options: Record<string, unknown>,
        ) => void;
      };
    };
    OneDrive?: {
      open: (options: Record<string, unknown>) => void;
    };
  }
}

export async function pickFromDropbox(appKey: string): Promise<CloudPickResult | null> {
  await loadScript('https://www.dropbox.com/static/api/2/dropins.js', 'dropboxjs');
  // Dropbox Chooser looks for data-app-key on the script tag
  const el = document.getElementById('dropboxjs');
  if (el) el.setAttribute('data-app-key', appKey);

  return new Promise((resolve) => {
    if (!window.Dropbox?.choose) {
      resolve(null);
      return;
    }
    window.Dropbox.choose({
      success: (files: Array<Record<string, unknown>>) => {
        const f = files?.[0];
        if (!f) {
          resolve(null);
          return;
        }
        resolve({
          provider: 'dropbox',
          fileName: String(f.name || 'file'),
          mimeType: '',
          byteSize: Number(f.bytes || 0),
          downloadUrl: String(f.link || ''),
          externalUrl: String(f.link || ''),
          providerFileId: String(f.id || ''),
        });
      },
      cancel: () => resolve(null),
      linkType: 'direct',
      multiselect: false,
      folderselect: false,
    });
  });
}

export async function pickFromGoogleDrive(
  apiKey: string,
  clientId: string,
): Promise<CloudPickResult | null> {
  await loadScript('https://apis.google.com/js/api.js', 'gapi-js');
  await loadScript('https://accounts.google.com/gsi/client', 'gis-js');

  await new Promise<void>((resolve) => {
    window.gapi?.load('client:picker', () => resolve());
  });
  await window.gapi?.client?.init({ apiKey });

  const token = await new Promise<string | null>((resolve) => {
    const client = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: (resp: { access_token?: string; error?: string }) => {
        resolve(resp?.access_token || null);
      },
    });
    client?.requestAccessToken({ prompt: '' });
  });
  if (!token || !window.google?.picker) return null;

  return new Promise((resolve) => {
    const view = new window.google!.picker!.DocsView();
    const picker = new window.google!.picker!.PickerBuilder()
      .addView(view)
      .setOAuthToken(token)
      .setDeveloperKey(apiKey)
      .setCallback((data: Record<string, unknown>) => {
        const action = data[window.google!.picker!.Response.ACTION];
        if (action === window.google!.picker!.Action.CANCEL) {
          resolve(null);
          return;
        }
        if (action === window.google!.picker!.Action.PICKED) {
          const docs = data[window.google!.picker!.Response.DOCUMENTS] as Array<
            Record<string, string | number>
          >;
          const doc = docs?.[0];
          if (!doc) {
            resolve(null);
            return;
          }
          const id = String(doc[window.google!.picker!.Document.ID] || '');
          resolve({
            provider: 'google_drive',
            fileName: String(doc[window.google!.picker!.Document.NAME] || 'file'),
            mimeType: String(doc[window.google!.picker!.Document.MIME_TYPE] || ''),
            byteSize: Number(doc[window.google!.picker!.Document.SIZE_BYTES] || 0),
            downloadUrl: `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`,
            externalUrl: String(doc[window.google!.picker!.Document.URL] || ''),
            accessToken: token,
            providerFileId: id,
          });
        }
      })
      .build();
    picker.setVisible(true);
  });
}

/** Short-lived Box token via OAuth2 implicit popup (not stored). */
async function boxImplicitToken(clientId: string): Promise<string | null> {
  const redirectUri = `${window.location.origin}/`;
  const url =
    `https://account.box.com/api/oauth2/authorize?response_type=token` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent('root_readonly')}`;
  const popup = window.open(url, 'box-oauth', 'width=600,height=700');
  if (!popup) return null;
  return new Promise((resolve) => {
    const timer = window.setInterval(() => {
      try {
        if (popup.closed) {
          window.clearInterval(timer);
          resolve(null);
          return;
        }
        const href = popup.location.href;
        if (href.startsWith(redirectUri) && href.includes('access_token=')) {
          const hash = new URL(href).hash.replace(/^#/, '');
          const params = new URLSearchParams(hash);
          const token = params.get('access_token');
          popup.close();
          window.clearInterval(timer);
          resolve(token);
        }
      } catch {
        /* cross-origin until redirect */
      }
    }, 400);
    window.setTimeout(() => {
      window.clearInterval(timer);
      try {
        popup.close();
      } catch {
        /* ignore */
      }
      resolve(null);
    }, 120000);
  });
}

export async function pickFromBox(clientId: string): Promise<CloudPickResult | null> {
  const accessToken = await boxImplicitToken(clientId);
  if (!accessToken) return null;

  // List root folder and let the user pick via a simple prompt of first-page files.
  // Full Box Content Picker UI Elements need extra CSS/JS hosting; this keeps the
  // official OAuth + Box API path without long-lived secrets.
  const listRes = await fetch('https://api.box.com/2.0/folders/0/items?limit=50&fields=id,name,size,type', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!listRes.ok) throw new Error('Box list failed');
  const list = (await listRes.json()) as {
    entries?: Array<{ id: string; name: string; size?: number; type: string }>;
  };
  const files = (list.entries || []).filter((e) => e.type === 'file');
  if (!files.length) throw new Error('No files in Box root folder');
  const choice = window.prompt(
    `Enter the number of the Box file to attach:\n${files
      .map((f, i) => `${i + 1}. ${f.name}`)
      .join('\n')}`,
    '1',
  );
  const idx = Math.max(0, (Number(choice) || 1) - 1);
  const f = files[idx];
  if (!f) return null;
  return {
    provider: 'box',
    fileName: f.name,
    mimeType: '',
    byteSize: Number(f.size || 0),
    downloadUrl: `https://api.box.com/2.0/files/${f.id}/content`,
    externalUrl: `https://app.box.com/file/${f.id}`,
    accessToken,
    providerFileId: f.id,
  };
}

function openMicrosoftFilePicker(
  clientId: string,
  provider: 'onedrive' | 'teams',
): Promise<CloudPickResult | null> {
  return new Promise((resolve) => {
    if (!window.OneDrive?.open) {
      resolve(null);
      return;
    }
    // Teams files live in SharePoint; the work/school OneDrive+SharePoint picker
    // (same Entra app as OneDrive) surfaces team document libraries when the
    // user signs in with an organisational account.
    window.OneDrive.open({
      clientId,
      action: 'download',
      multiSelect: false,
      advanced: {
        filter: '',
        redirectUri: `${window.location.origin}/`,
        // Prefer organisational (SharePoint / Teams) over consumer OneDrive.
        ...(provider === 'teams' ? { isConsumerAccount: false } : {}),
      },
      success: (files: { value?: Array<Record<string, unknown>> }) => {
        const f = files?.value?.[0];
        if (!f) {
          resolve(null);
          return;
        }
        const permissions = f['@microsoft.graph.downloadUrl'] || f['@content.downloadUrl'];
        resolve({
          provider,
          fileName: String(f.name || 'file'),
          mimeType: String((f.file as { mimeType?: string } | undefined)?.mimeType || ''),
          byteSize: Number(f.size || 0),
          downloadUrl: String(permissions || ''),
          externalUrl: String(f.webUrl || ''),
          providerFileId: String(f.id || ''),
        });
      },
      cancel: () => resolve(null),
      error: () => resolve(null),
    });
  });
}

export async function pickFromOneDrive(clientId: string): Promise<CloudPickResult | null> {
  await loadScript('https://js.live.net/v7.2/OneDrive.js', 'onedrive-js');
  return openMicrosoftFilePicker(clientId, 'onedrive');
}

/** Teams / SharePoint files via the same OneDrive File Picker + Graph download URL. */
export async function pickFromTeams(clientId: string): Promise<CloudPickResult | null> {
  await loadScript('https://js.live.net/v7.2/OneDrive.js', 'onedrive-js');
  return openMicrosoftFilePicker(clientId, 'teams');
}

export type ClassroomCourse = { id: string; name: string };
export type ClassroomMaterialItem = {
  id: string;
  title: string;
  attachment: CloudPickResult;
};

async function googleAccessToken(clientId: string, scope: string): Promise<string | null> {
  await loadScript('https://accounts.google.com/gsi/client', 'gis-js');
  return new Promise((resolve) => {
    const client = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: clientId,
      scope,
      callback: (resp: { access_token?: string; error?: string }) => {
        resolve(resp?.access_token || null);
      },
    });
    client?.requestAccessToken({ prompt: '' });
  });
}

const CLASSROOM_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
].join(' ');

/** List courses the signed-in teacher teaches (Classroom API). */
export async function listGoogleClassroomCourses(
  clientId: string,
): Promise<{ token: string; courses: ClassroomCourse[] }> {
  const token = await googleAccessToken(clientId, CLASSROOM_SCOPES);
  if (!token) throw new Error('Google Classroom sign-in cancelled');
  const res = await fetch(
    'https://classroom.googleapis.com/v1/courses?teacherId=me&courseStates=ACTIVE&pageSize=50',
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`Classroom courses failed (${res.status})`);
  const data = (await res.json()) as { courses?: Array<{ id: string; name: string }> };
  return {
    token,
    courses: (data.courses || []).map((c) => ({ id: c.id, name: c.name || c.id })),
  };
}

/**
 * List attachable materials for a course: Drive files (download via Drive API)
 * plus links / YouTube as linked-only attachments.
 */
export async function listGoogleClassroomMaterials(
  courseId: string,
  accessToken: string,
): Promise<ClassroomMaterialItem[]> {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const [matRes, workRes] = await Promise.all([
    fetch(
      `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(courseId)}/courseWorkMaterials?pageSize=40`,
      { headers },
    ),
    fetch(
      `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(courseId)}/courseWork?pageSize=40`,
      { headers },
    ),
  ]);

  type Att = {
    driveFile?: { driveFile?: { id?: string; title?: string; alternateLink?: string } };
    link?: { url?: string; title?: string };
    youtubeVideo?: { id?: string; title?: string; alternateLink?: string };
  };
  type Item = { id?: string; title?: string; materials?: Att[] };

  const materials: ClassroomMaterialItem[] = [];
  const driveIds: string[] = [];

  const pushFrom = (items: Item[], prefix: string) => {
    for (const item of items) {
      const title = item.title || prefix;
      for (const [i, m] of (item.materials || []).entries()) {
        const key = `${item.id || 'x'}-${i}`;
        if (m.driveFile?.driveFile?.id) {
          const df = m.driveFile.driveFile;
          const id = String(df.id);
          driveIds.push(id);
          materials.push({
            id: key,
            title: `${title} — ${df.title || 'Drive file'}`,
            attachment: {
              provider: 'google_classroom',
              fileName: String(df.title || 'classroom-file'),
              mimeType: '',
              byteSize: 0,
              downloadUrl: `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`,
              externalUrl: String(df.alternateLink || ''),
              accessToken,
              providerFileId: id,
            },
          });
        } else if (m.youtubeVideo) {
          const yt = m.youtubeVideo;
          const url =
            yt.alternateLink ||
            (yt.id ? `https://www.youtube.com/watch?v=${yt.id}` : '');
          if (!url) continue;
          materials.push({
            id: key,
            title: `${title} — ${yt.title || 'YouTube'}`,
            attachment: {
              provider: 'google_classroom',
              fileName: String(yt.title || 'YouTube video'),
              mimeType: 'video/youtube',
              byteSize: 0,
              downloadUrl: '',
              externalUrl: url,
              providerFileId: yt.id || undefined,
              linkOnly: true,
              kind: 'video',
            },
          });
        } else if (m.link?.url) {
          materials.push({
            id: key,
            title: `${title} — ${m.link.title || 'Link'}`,
            attachment: {
              provider: 'google_classroom',
              fileName: String(m.link.title || m.link.url),
              mimeType: 'text/uri-list',
              byteSize: 0,
              downloadUrl: '',
              externalUrl: m.link.url,
              linkOnly: true,
              kind: 'document',
            },
          });
        }
      }
    }
  };

  if (matRes.ok) {
    const data = (await matRes.json()) as { courseWorkMaterial?: Item[] };
    pushFrom(data.courseWorkMaterial || [], 'Material');
  }
  if (workRes.ok) {
    const data = (await workRes.json()) as { courseWork?: Item[] };
    pushFrom(data.courseWork || [], 'Coursework');
  }

  await Promise.all(
    [...new Set(driveIds)].map(async (id) => {
      try {
        const metaRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?fields=name,mimeType,size`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (!metaRes.ok) return;
        const meta = (await metaRes.json()) as {
          name?: string;
          mimeType?: string;
          size?: string;
        };
        for (const entry of materials) {
          if (entry.attachment.providerFileId !== id) continue;
          if (meta.name) entry.attachment.fileName = meta.name;
          if (meta.mimeType) entry.attachment.mimeType = meta.mimeType;
          if (meta.size) entry.attachment.byteSize = Number(meta.size) || 0;
          entry.title = entry.title.replace(/— .*$/, `— ${entry.attachment.fileName}`);
        }
      } catch {
        /* keep title-only */
      }
    }),
  );

  return materials;
}
