/**
 * Lesson attachment storage on DreamHost.
 * Mirrors cursor/security-fixes api/_dreamhost.js upload/download shape
 * (same env vars + JSON body) but paths are:
 *   <userId>/<lessonSeg>/<uuid>.<ext>
 * so it merges cleanly beside PDF-only parseOwnedStoragePath.
 *
 * Env (server-only): DREAMHOST_PDF_UPLOAD_URL, DREAMHOST_PDF_API_KEY,
 *   DREAMHOST_PDF_DOWNLOAD_URL (aliases PDF_*), optional
 *   DREAMHOST_FILE_UPLOAD_URL / DREAMHOST_FILE_DOWNLOAD_URL /
 *   DREAMHOST_FILE_DELETE_URL / DREAMHOST_UPLOAD_SIGNING_SECRET.
 *
 * Size limits (proposed): image 15MB, document 25MB, audio 50MB, video 500MB.
 * Over Vercel ~4.5MB body: HMAC ticket → browser multipart POST to
 * dreamhost/api/upload-file.php (API key never in the browser).
 */

import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { createServiceClient, jsonResponse } from './_authShared.js';

export const SIZE_LIMITS = Object.freeze({
  image: 15 * 1024 * 1024,
  document: 25 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
  video: 500 * 1024 * 1024,
});

/** Safe under Vercel body limit after base64 overhead. */
export const PROXY_MAX_BYTES = 3 * 1024 * 1024;

const USER_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LESSON_SEG_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/;
const ATTACH_FILE_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,8}$/i;

/** @type {Record<string, { kind: string, mime: string, max: number }>} */
export const EXT_ALLOWLIST = Object.freeze({
  jpg: { kind: 'image', mime: 'image/jpeg', max: SIZE_LIMITS.image },
  jpeg: { kind: 'image', mime: 'image/jpeg', max: SIZE_LIMITS.image },
  png: { kind: 'image', mime: 'image/png', max: SIZE_LIMITS.image },
  heic: { kind: 'image', mime: 'image/heic', max: SIZE_LIMITS.image },
  webp: { kind: 'image', mime: 'image/webp', max: SIZE_LIMITS.image },
  mp4: { kind: 'video', mime: 'video/mp4', max: SIZE_LIMITS.video },
  mov: { kind: 'video', mime: 'video/quicktime', max: SIZE_LIMITS.video },
  doc: { kind: 'document', mime: 'application/msword', max: SIZE_LIMITS.document },
  docx: {
    kind: 'document',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    max: SIZE_LIMITS.document,
  },
  mp3: { kind: 'audio', mime: 'audio/mpeg', max: SIZE_LIMITS.audio },
  wav: { kind: 'audio', mime: 'audio/wav', max: SIZE_LIMITS.audio },
  m4a: { kind: 'audio', mime: 'audio/mp4', max: SIZE_LIMITS.audio },
  aac: { kind: 'audio', mime: 'audio/aac', max: SIZE_LIMITS.audio },
  ogg: { kind: 'audio', mime: 'audio/ogg', max: SIZE_LIMITS.audio },
});

const MIME_TO_EXT = Object.freeze({
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
  'audio/ogg': 'ogg',
  'audio/vorbis': 'ogg',
});

function pdfUploadUrl() {
  return (process.env.DREAMHOST_PDF_UPLOAD_URL || process.env.PDF_UPLOAD_URL || '').trim();
}
function pdfApiKey() {
  return (process.env.DREAMHOST_PDF_API_KEY || process.env.PDF_API_KEY || '').trim();
}
function pdfDownloadUrl() {
  const explicit = (process.env.DREAMHOST_PDF_DOWNLOAD_URL || process.env.PDF_DOWNLOAD_URL || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const upload = pdfUploadUrl();
  if (!upload) return '';
  try {
    const u = new URL(upload);
    u.pathname = u.pathname.replace(/upload-pdf\.php$/i, 'download-pdf.php');
    if (!/download-pdf\.php$/i.test(u.pathname)) {
      u.pathname = u.pathname.replace(/\/?$/, '/') + 'download-pdf.php';
    }
    return u.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

export function getFileUploadUrl() {
  const explicit = (process.env.DREAMHOST_FILE_UPLOAD_URL || process.env.FILE_UPLOAD_URL || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const pdf = pdfUploadUrl();
  if (!pdf) return '';
  try {
    const u = new URL(pdf);
    u.pathname = u.pathname.replace(/upload-pdf\.php$/i, 'upload-file.php');
    if (!/upload-file\.php$/i.test(u.pathname)) {
      u.pathname = u.pathname.replace(/\/?$/, '/') + 'upload-file.php';
    }
    return u.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

export function getFileDownloadUrl() {
  const explicit = (process.env.DREAMHOST_FILE_DOWNLOAD_URL || process.env.FILE_DOWNLOAD_URL || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const pdf = pdfDownloadUrl();
  if (!pdf) return '';
  try {
    const u = new URL(pdf);
    u.pathname = u.pathname.replace(/download-pdf\.php$/i, 'download-file.php');
    if (!/download-file\.php$/i.test(u.pathname)) {
      u.pathname = u.pathname.replace(/\/?$/, '/') + 'download-file.php';
    }
    return u.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

export function getFileDeleteUrl() {
  const explicit = (process.env.DREAMHOST_FILE_DELETE_URL || process.env.FILE_DELETE_URL || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const upload = getFileUploadUrl();
  if (!upload) return '';
  try {
    const u = new URL(upload);
    u.pathname = u.pathname.replace(/upload-file\.php$/i, 'delete-file.php');
    if (!/delete-file\.php$/i.test(u.pathname)) {
      u.pathname = u.pathname.replace(/\/?$/, '/') + 'delete-file.php';
    }
    return u.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

export function isAttachmentStorageConfigured() {
  return Boolean(getFileUploadUrl() && pdfApiKey() && getFileDownloadUrl());
}

export function attachmentStorageNotConfiguredResponse() {
  return jsonResponse(
    {
      error:
        'Lesson attachment storage is not configured. Set DREAMHOST_PDF_UPLOAD_URL / DREAMHOST_PDF_API_KEY (and deploy dreamhost/api/upload-file.php), or DREAMHOST_FILE_* overrides.',
    },
    503,
  );
}

export function parseAttachmentStoragePath(raw) {
  if (typeof raw !== 'string' || !raw) return null;
  const cleaned = raw.replace(/^\/+/, '').replace(/\/+/g, '/');
  if (cleaned.includes('..')) return null;
  const parts = cleaned.split('/');
  if (parts.length !== 3) return null;
  const [userId, lessonSeg, fileName] = parts;
  if (!USER_ID_RE.test(userId) || !LESSON_SEG_RE.test(lessonSeg) || !ATTACH_FILE_RE.test(fileName)) {
    return null;
  }
  return `${userId}/${lessonSeg}/${fileName}`;
}

export function lessonKeyToSegment(lessonKey) {
  if (typeof lessonKey !== 'string' || !lessonKey.trim()) return null;
  const cleaned = lessonKey
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 128);
  return cleaned && LESSON_SEG_RE.test(cleaned) ? cleaned : null;
}

export function buildAttachmentPath(userId, lessonKey, ext) {
  if (!userId || !USER_ID_RE.test(userId)) {
    throw Object.assign(new Error('Invalid user id.'), { status: 400 });
  }
  const lessonSeg = lessonKeyToSegment(lessonKey);
  if (!lessonSeg) throw Object.assign(new Error('Invalid lesson key.'), { status: 400 });
  const e = String(ext || '')
    .toLowerCase()
    .replace(/^\./, '');
  if (!EXT_ALLOWLIST[e]) throw Object.assign(new Error('File type not allowed.'), { status: 400 });
  return `${userId}/${lessonSeg}/${randomUUID()}.${e}`;
}

export function resolveExtFromNameAndMime(fileName, mimeType) {
  const fromName = String(fileName || '')
    .split('.')
    .pop()
    ?.toLowerCase();
  if (fromName && EXT_ALLOWLIST[fromName]) {
    return { ok: true, ext: fromName, ...EXT_ALLOWLIST[fromName] };
  }
  const mimeExt = MIME_TO_EXT[String(mimeType || '').toLowerCase()];
  if (mimeExt && EXT_ALLOWLIST[mimeExt]) {
    return { ok: true, ext: mimeExt, ...EXT_ALLOWLIST[mimeExt] };
  }
  return { ok: false, error: 'Unsupported file type.' };
}

export function sniffMatches(buffer, ext) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return false;
  const e = String(ext).toLowerCase();
  const b = buffer;
  if (e === 'jpg' || e === 'jpeg') return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (e === 'png') return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  if (e === 'webp') {
    return (
      b.length >= 12 &&
      b.subarray(0, 4).toString('ascii') === 'RIFF' &&
      b.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  if (e === 'mp4' || e === 'mov' || e === 'm4a') {
    return b.length >= 8 && b.subarray(4, 8).toString('ascii') === 'ftyp';
  }
  if (e === 'docx') return b[0] === 0x50 && b[1] === 0x4b;
  if (e === 'doc') return b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0;
  if (e === 'heic') {
    if (b.length >= 12 && b.subarray(4, 8).toString('ascii') === 'ftyp') {
      return /heic|heif|mif1|msf1/i.test(b.subarray(8, 12).toString('ascii'));
    }
    return false;
  }
  if (e === 'mp3') {
    return (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0);
  }
  if (e === 'wav') {
    return (
      b.length >= 12 &&
      b.subarray(0, 4).toString('ascii') === 'RIFF' &&
      b.subarray(8, 12).toString('ascii') === 'WAVE'
    );
  }
  if (e === 'ogg') return b.subarray(0, 4).toString('ascii') === 'OggS';
  if (e === 'aac') return b[0] === 0xff && (b[1] & 0xf0) === 0xf0;
  return false;
}

function signingSecret() {
  return (process.env.DREAMHOST_UPLOAD_SIGNING_SECRET || pdfApiKey() || '').trim();
}

function b64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromB64url(str) {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

export function createDirectUploadTicket({ userId, storagePath, mime, maxBytes, attachmentId, ttlSec = 900 }) {
  const secret = signingSecret();
  if (!secret) throw Object.assign(new Error('Signing secret not configured.'), { status: 503 });
  const path = parseAttachmentStoragePath(storagePath);
  if (!path || path.split('/')[0] !== userId) {
    throw Object.assign(new Error('Invalid storage path.'), { status: 400 });
  }
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSec;
  const body = b64url(
    JSON.stringify({ u: userId, p: path, m: mime, n: maxBytes, a: attachmentId, exp: expiresAt }),
  );
  const sig = b64url(createHmac('sha256', secret).update(body).digest());
  return { ticket: `${body}.${sig}`, expiresAt, uploadUrl: getFileUploadUrl() };
}

export function verifyDirectUploadTicket(ticket) {
  const secret = signingSecret();
  if (!secret || typeof ticket !== 'string' || !ticket.includes('.')) return null;
  const [body, sig] = ticket.split('.');
  const expected = b64url(createHmac('sha256', secret).update(body).digest());
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  let payload;
  try {
    payload = JSON.parse(fromB64url(body).toString('utf8'));
  } catch {
    return null;
  }
  if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  if (!parseAttachmentStoragePath(payload.p)) return null;
  return payload;
}

export async function uploadAttachmentToDreamHost({ buffer, storagePath, maxBytes }) {
  const uploadUrl = getFileUploadUrl();
  const apiKey = pdfApiKey();
  const path = parseAttachmentStoragePath(storagePath);
  if (!uploadUrl || !apiKey || !path) {
    throw Object.assign(new Error('DreamHost storage is not configured.'), { status: 503 });
  }
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (!bytes.byteLength) throw Object.assign(new Error('Empty file.'), { status: 400 });
  if (bytes.byteLength > maxBytes) throw Object.assign(new Error('File too large.'), { status: 413 });

  const upstream = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'X-Upsert': 'false',
    },
    body: JSON.stringify({ fileData: bytes.toString('base64'), fileName: path, path, upsert: false }),
  });
  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '');
    console.error('DreamHost attachment upload failed:', upstream.status, text.slice(0, 200));
    throw Object.assign(new Error('Upload failed.'), {
      status: upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502,
    });
  }
  return { path };
}

export async function fetchAttachmentFromDreamHost(storagePath) {
  const apiKey = pdfApiKey();
  const downloadBase = getFileDownloadUrl();
  const path = parseAttachmentStoragePath(storagePath);
  if (!apiKey || !downloadBase || !path) {
    throw Object.assign(new Error('File storage is not configured.'), { status: 503 });
  }
  const url = new URL(downloadBase);
  url.searchParams.set('path', path);
  const upstream = await fetch(url.toString(), { method: 'GET', headers: { 'X-API-Key': apiKey } });
  if (!upstream.ok) {
    throw Object.assign(new Error(upstream.status === 404 ? 'File not found.' : 'Failed to fetch file.'), {
      status: upstream.status === 404 ? 404 : 502,
    });
  }
  return Buffer.from(await upstream.arrayBuffer());
}

export async function deleteAttachmentFromDreamHost(storagePath) {
  const apiKey = pdfApiKey();
  const deleteUrl = getFileDeleteUrl();
  const path = parseAttachmentStoragePath(storagePath);
  if (!apiKey || !deleteUrl || !path) {
    throw Object.assign(new Error('File storage is not configured.'), { status: 503 });
  }
  const upstream = await fetch(deleteUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
    body: JSON.stringify({ path }),
  });
  if (!upstream.ok && upstream.status !== 404) {
    throw Object.assign(new Error('Failed to delete file.'), { status: 502 });
  }
  return true;
}

export function contentTypeForAttachmentPath(storagePath) {
  const path = parseAttachmentStoragePath(storagePath);
  if (!path) return 'application/octet-stream';
  const ext = path.split('.').pop()?.toLowerCase();
  return EXT_ALLOWLIST[ext]?.mime || 'application/octet-stream';
}

export function buildAttachmentProxyUrl(request, storagePath) {
  const path = parseAttachmentStoragePath(storagePath);
  if (!path) throw new Error('Invalid storage path.');
  const fromEnv =
    process.env.VITE_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  let origin = fromEnv ? String(fromEnv).replace(/\/$/, '') : '';
  if (!origin) {
    try {
      origin = new URL(request.url).origin;
    } catch {
      origin = '';
    }
  }
  const relative = `/api/lesson-attachments/file/${path}`;
  return origin ? `${origin}${relative}` : relative;
}

/** Provider picker visibility (public client ids only — no secrets). */
export function getProviderClientConfig() {
  const googleApiKey = (process.env.VITE_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY || '').trim() || null;
  const googleClientId =
    (process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '').trim() || null;
  const msClientId =
    (
      process.env.VITE_TEAMS_CLIENT_ID ||
      process.env.VITE_ONEDRIVE_CLIENT_ID ||
      process.env.VITE_MICROSOFT_CLIENT_ID ||
      process.env.MICROSOFT_CLIENT_ID ||
      ''
    ).trim() || null;
  const oneDriveClientId =
    (
      process.env.VITE_ONEDRIVE_CLIENT_ID ||
      process.env.VITE_MICROSOFT_CLIENT_ID ||
      process.env.MICROSOFT_CLIENT_ID ||
      process.env.VITE_TEAMS_CLIENT_ID ||
      ''
    ).trim() || null;

  return {
    dropbox: Boolean((process.env.VITE_DROPBOX_APP_KEY || process.env.DROPBOX_APP_KEY || '').trim()),
    googleDrive: Boolean(googleApiKey && googleClientId),
    // Classroom reuses the same Google OAuth client; enable Classroom API in that project.
    googleClassroom: Boolean(googleApiKey && googleClientId),
    box: Boolean((process.env.VITE_BOX_CLIENT_ID || process.env.BOX_CLIENT_ID || '').trim()),
    oneDrive: Boolean(oneDriveClientId),
    // Teams files live in SharePoint; same Entra app / picker as OneDrive when configured.
    teams: Boolean(msClientId),
    dropboxAppKey: (process.env.VITE_DROPBOX_APP_KEY || process.env.DROPBOX_APP_KEY || '').trim() || null,
    googleApiKey,
    googleClientId,
    boxClientId: (process.env.VITE_BOX_CLIENT_ID || process.env.BOX_CLIENT_ID || '').trim() || null,
    oneDriveClientId,
    teamsClientId: msClientId,
  };
}

export async function insertAttachmentRow(row) {
  const service = createServiceClient();
  if (!service) throw Object.assign(new Error('Database not configured.'), { status: 503 });
  const { data, error } = await service.from('lesson_attachments').insert(row).select('*').single();
  if (error) {
    console.error('insertAttachmentRow:', error.message);
    throw Object.assign(new Error('Failed to save attachment metadata.'), { status: 500 });
  }
  return data;
}

export async function updateAttachmentRow(id, ownerId, patch) {
  const service = createServiceClient();
  if (!service) return null;
  const { data, error } = await service
    .from('lesson_attachments')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_id', ownerId)
    .select('*')
    .single();
  if (error) return null;
  return data;
}

export async function getOwnedAttachment(id, ownerId) {
  const service = createServiceClient();
  if (!service) return null;
  const { data } = await service
    .from('lesson_attachments')
    .select('*')
    .eq('id', id)
    .eq('owner_id', ownerId)
    .maybeSingle();
  return data || null;
}

export async function deleteAttachmentRow(id, ownerId) {
  const service = createServiceClient();
  if (!service) return false;
  const { error } = await service.from('lesson_attachments').delete().eq('id', id).eq('owner_id', ownerId);
  return !error;
}

export async function listAttachmentsForLesson(lessonKey, userId) {
  const service = createServiceClient();
  if (!service) return [];
  const { data, error } = await service
    .from('lesson_attachments')
    .select('*')
    .eq('lesson_key', lessonKey)
    .in('status', ['ready', 'linked'])
    .order('created_at', { ascending: true });
  if (error) return [];
  const rows = Array.isArray(data) ? data : [];
  return rows.filter((r) => r.owner_id === userId);
}
