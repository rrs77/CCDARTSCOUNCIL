/**
 * Official picker SDKs for cloud import.
 * Public app keys / client IDs only — short-lived access tokens are passed
 * once to the server for fetch and never stored.
 */

export type CloudPickResult = {
  provider: 'dropbox' | 'google_drive' | 'box' | 'onedrive';
  fileName: string;
  mimeType: string;
  byteSize: number;
  downloadUrl: string;
  externalUrl?: string;
  accessToken?: string;
  providerFileId?: string;
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
    `&scope=${encodeURIComponent('root_readwrite')}`;
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

export async function pickFromOneDrive(clientId: string): Promise<CloudPickResult | null> {
  await loadScript('https://js.live.net/v7.2/OneDrive.js', 'onedrive-js');
  return new Promise((resolve) => {
    if (!window.OneDrive?.open) {
      resolve(null);
      return;
    }
    window.OneDrive.open({
      clientId,
      action: 'download',
      multiSelect: false,
      advanced: {
        filter: '',
        redirectUri: `${window.location.origin}/`,
      },
      success: (files: { value?: Array<Record<string, unknown>> }) => {
        const f = files?.value?.[0];
        if (!f) {
          resolve(null);
          return;
        }
        const permissions = f['@microsoft.graph.downloadUrl'] || f['@content.downloadUrl'];
        resolve({
          provider: 'onedrive',
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
