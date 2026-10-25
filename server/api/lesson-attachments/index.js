/**
 * GET  /api/lesson-attachments?lessonKey=
 * GET  /api/lesson-attachments/providers
 * POST /api/lesson-attachments
 *   prepare | complete | import (cloud) | small base64 upload
 * DELETE /api/lesson-attachments?id=
 *
 * Cloud imports: server builds download URLs from {provider, providerFileId}
 * on fixed hosts only (no client-controlled SSRF). Access tokens are never logged.
 */

import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import {
  assertRateLimit,
  createServiceClient,
  getClientIp,
  jsonResponse,
  optionsResponse,
  requireAuth,
} from '../../../api/_authShared.js';
import {
  PROXY_MAX_BYTES,
  SIZE_LIMITS,
  attachmentStorageNotConfiguredResponse,
  buildAttachmentPath,
  buildAttachmentProxyUrl,
  createDirectUploadTicket,
  deleteAttachmentFromDreamHost,
  deleteAttachmentRow,
  getOwnedAttachment,
  getProviderClientConfig,
  insertAttachmentRow,
  isAttachmentStorageConfigured,
  isUploadTicketSecretConfigured,
  listAttachmentsForLesson,
  probeAttachmentOnDreamHost,
  resolveExtFromNameAndMime,
  sniffMatches,
  updateAttachmentRow,
  uploadAttachmentToDreamHost,
} from '../../../api/_lessonAttachmentStorage.js';

export async function OPTIONS() {
  return optionsResponse();
}

const FETCH_TIMEOUT_MS = 30_000;
const MAX_REDIRECTS = 5;

/** Fixed download hosts per provider (SSRF allowlist). */
const PROVIDER_HOSTS = Object.freeze({
  google_drive: Object.freeze(['www.googleapis.com']),
  google_classroom: Object.freeze(['www.googleapis.com']),
  dropbox: Object.freeze(['content.dropboxapi.com', 'dl.dropboxusercontent.com']),
  box: Object.freeze(['api.box.com', 'dl.boxcloud.com']),
  onedrive: Object.freeze([
    'graph.microsoft.com',
    'api.onedrive.com',
    'my.microsoftpersonalcontent.com',
  ]),
  teams: Object.freeze([
    'graph.microsoft.com',
    'api.onedrive.com',
    'my.microsoftpersonalcontent.com',
  ]),
});

/** Extra suffix allowlists for redirect hops (Microsoft / Box CDNs). */
const PROVIDER_REDIRECT_SUFFIXES = Object.freeze({
  onedrive: Object.freeze([
    '.sharepoint.com',
    '.sharepointonline.com',
    '.onedrive.com',
    '.1drv.com',
    '.svc.ms',
    '.microsoftpersonalcontent.com',
    '.blob.core.windows.net',
    '.files.1drv.com',
  ]),
  teams: Object.freeze([
    '.sharepoint.com',
    '.sharepointonline.com',
    '.onedrive.com',
    '.1drv.com',
    '.svc.ms',
    '.microsoftpersonalcontent.com',
    '.blob.core.windows.net',
    '.files.1drv.com',
  ]),
  box: Object.freeze(['.boxcloud.com', '.box.com']),
  dropbox: Object.freeze(['.dropboxusercontent.com', '.dropboxapi.com']),
});

function publicRow(request, row) {
  const linked = row.storage_kind === 'link' || row.status === 'linked';
  return {
    id: row.id,
    lessonKey: row.lesson_key,
    fileName: row.file_name,
    mimeType: row.mime_type,
    kind: row.kind,
    byteSize: row.byte_size,
    status: row.status,
    storageKind: row.storage_kind,
    provider: row.provider || null,
    url: linked
      ? row.external_url
      : row.status === 'ready' && row.storage_path
        ? buildAttachmentProxyUrl(request, row.storage_path)
        : null,
    createdAt: row.created_at,
  };
}

async function orgOf(userId) {
  const service = createServiceClient();
  if (!service) return null;
  const { data } = await service
    .from('profiles')
    .select('organisation_id')
    .eq('id', userId)
    .maybeSingle();
  return data?.organisation_id ? String(data.organisation_id).trim() || null : null;
}

/** Reject non-https external / link URLs. */
function requireHttpsUrl(raw, fieldName = 'externalUrl') {
  if (typeof raw !== 'string' || !raw.trim()) {
    return { ok: false, error: `Missing ${fieldName}.` };
  }
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false, error: `Invalid ${fieldName}.` };
  }
  if (url.protocol !== 'https:') {
    return { ok: false, error: `${fieldName} must be https.` };
  }
  return { ok: true, url: url.toString() };
}

function safeProviderFileId(raw) {
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s || s.length > 512) return null;
  if (s.includes('..') || /[\0\r\n]/.test(s)) return null;
  if (/^https?:/i.test(s)) return null;
  return s;
}

function hostnameAllowed(hostname, provider) {
  const host = String(hostname || '')
    .toLowerCase()
    .replace(/\.$/, '');
  if (!host) return false;
  const exact = PROVIDER_HOSTS[provider] || [];
  if (exact.includes(host)) return true;
  const suffixes = PROVIDER_REDIRECT_SUFFIXES[provider] || [];
  return suffixes.some((suf) => host === suf.slice(1) || host.endsWith(suf));
}

function isBlockedIp(ip) {
  if (!ip) return true;
  const v = isIP(ip);
  if (v === 4) {
    const parts = ip.split('.').map((n) => Number(n));
    if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
      return true;
    }
    if (parts[0] === 0 || parts[0] === 127) return true;
    if (parts[0] === 10) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    return false;
  }
  if (v === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::1') return true;
    // IPv4-mapped ::ffff:a.b.c.d
    const mapped = lower.match(/^:?ffff:(\d+\.\d+\.\d+\.\d+)$/i);
    if (mapped) return isBlockedIp(mapped[1]);
    // Unique local fc00::/7, link-local fe80::/10
    const buf = (() => {
      try {
        // Expand compressed form loosely via URL
        const normalized = lower.includes(':') ? lower : '';
        return normalized;
      } catch {
        return lower;
      }
    })();
    if (buf.startsWith('fc') || buf.startsWith('fd')) return true;
    if (buf.startsWith('fe8') || buf.startsWith('fe9') || buf.startsWith('fea') || buf.startsWith('feb')) {
      return true;
    }
    // Also check first hextet for fe80-febf / fc00-fdff
    const first = buf.split(':')[0] || '';
    const n = Number.parseInt(first, 16);
    if (Number.isFinite(n)) {
      if (n >= 0xfc00 && n <= 0xfdff) return true;
      if (n >= 0xfe80 && n <= 0xfebf) return true;
    }
    return false;
  }
  return true;
}

async function assertHostSafe(hostname, provider) {
  const host = String(hostname || '')
    .toLowerCase()
    .replace(/\.$/, '');
  if (!hostnameAllowed(host, provider)) {
    throw Object.assign(new Error('Download host not allowed.'), { status: 400 });
  }
  if (isIP(host)) {
    if (isBlockedIp(host)) {
      throw Object.assign(new Error('Download address not allowed.'), { status: 400 });
    }
    return;
  }
  let records;
  try {
    records = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw Object.assign(new Error('Could not resolve download host.'), { status: 400 });
  }
  if (!records?.length) {
    throw Object.assign(new Error('Could not resolve download host.'), { status: 400 });
  }
  for (const rec of records) {
    if (isBlockedIp(rec.address)) {
      throw Object.assign(new Error('Download address not allowed.'), { status: 400 });
    }
  }
}

/**
 * Build a fixed-host download target from provider + providerFileId.
 * Dropbox/OneDrive may fall back to an allowlisted client downloadUrl when
 * no access token is available (Chooser / Picker direct links).
 */
function resolveProviderDownload({ provider, providerFileId, downloadUrl, accessToken }) {
  const id = safeProviderFileId(providerFileId);
  if (!id) {
    throw Object.assign(new Error('Missing or invalid providerFileId.'), { status: 400 });
  }
  // Client downloadUrl without providerFileId is rejected above; with only
  // downloadUrl and no id we never reach here.
  if (typeof downloadUrl === 'string' && downloadUrl.trim() && !providerFileId) {
    throw Object.assign(new Error('providerFileId is required (do not send downloadUrl alone).'), {
      status: 400,
    });
  }

  const authHeaders = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

  if (provider === 'google_drive' || provider === 'google_classroom') {
    if (!accessToken) {
      throw Object.assign(new Error('Missing access token for Google Drive download.'), { status: 400 });
    }
    return {
      url: `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`,
      method: 'GET',
      headers: { ...authHeaders },
      provider,
    };
  }

  if (provider === 'box') {
    if (!accessToken) {
      throw Object.assign(new Error('Missing access token for Box download.'), { status: 400 });
    }
    return {
      url: `https://api.box.com/2.0/files/${encodeURIComponent(id)}/content`,
      method: 'GET',
      headers: { ...authHeaders },
      provider,
    };
  }

  if (provider === 'dropbox') {
    if (accessToken) {
      return {
        url: 'https://content.dropboxapi.com/2/files/download',
        method: 'POST',
        headers: {
          ...authHeaders,
          'Dropbox-API-Arg': JSON.stringify({ path: id }),
          'Content-Type': 'application/octet-stream',
        },
        provider,
      };
    }
    // Chooser direct link — allowlist hosts only
    if (!downloadUrl) {
      throw Object.assign(new Error('Missing Dropbox download URL or access token.'), { status: 400 });
    }
    let parsed;
    try {
      parsed = new URL(downloadUrl);
    } catch {
      throw Object.assign(new Error('Invalid Dropbox download URL.'), { status: 400 });
    }
    if (parsed.protocol !== 'https:' || !hostnameAllowed(parsed.hostname, 'dropbox')) {
      throw Object.assign(new Error('Dropbox download host not allowed.'), { status: 400 });
    }
    return { url: parsed.toString(), method: 'GET', headers: {}, provider };
  }

  if (provider === 'onedrive' || provider === 'teams') {
    if (accessToken) {
      return {
        url: `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(id)}/content`,
        method: 'GET',
        headers: { ...authHeaders },
        provider,
      };
    }
    // Picker temporary @microsoft.graph.downloadUrl — allowlisted hosts only
    if (!downloadUrl) {
      throw Object.assign(new Error('Missing OneDrive download URL or access token.'), { status: 400 });
    }
    let parsed;
    try {
      parsed = new URL(downloadUrl);
    } catch {
      throw Object.assign(new Error('Invalid OneDrive download URL.'), { status: 400 });
    }
    if (parsed.protocol !== 'https:' || !hostnameAllowed(parsed.hostname, provider)) {
      // Temporary Graph URLs often land on SharePoint CDNs — check suffixes
      const host = parsed.hostname.toLowerCase();
      const suffixes = PROVIDER_REDIRECT_SUFFIXES[provider] || [];
      const ok =
        hostnameAllowed(host, provider) ||
        suffixes.some((suf) => host === suf.slice(1) || host.endsWith(suf));
      if (parsed.protocol !== 'https:' || !ok) {
        throw Object.assign(new Error('OneDrive download host not allowed.'), { status: 400 });
      }
    }
    return { url: parsed.toString(), method: 'GET', headers: {}, provider };
  }

  throw Object.assign(new Error('Unsupported provider.'), { status: 400 });
}

function contentTypeAcceptable(contentType, expectedMime) {
  if (!contentType) return true;
  const ct = String(contentType).split(';')[0].trim().toLowerCase();
  if (!ct) return true;
  // Block HTML/JS responses (common SSRF tell)
  if (ct.includes('text/html') || ct.includes('text/javascript') || ct.includes('application/javascript')) {
    return false;
  }
  if (!expectedMime) return true;
  const expected = String(expectedMime).toLowerCase();
  if (ct === expected) return true;
  // Allow octet-stream / generic binary from cloud APIs
  if (ct === 'application/octet-stream' || ct === 'binary/octet-stream') return true;
  // audio/mp4 vs audio/*, image/jpeg vs image/jpg quirks
  const [eMajor] = expected.split('/');
  const [cMajor] = ct.split('/');
  if (eMajor && eMajor === cMajor) return true;
  return false;
}

/**
 * Safe remote fetch: allowlisted hosts, DNS private-IP reject, manual redirects,
 * 30s timeout, streamed size cap, optional content-type check.
 * Never logs accessToken.
 */
async function fetchRemoteFileSafe({
  url,
  method = 'GET',
  headers = {},
  provider,
  maxBytes,
  expectedMime,
}) {
  let current = url;
  let hops = 0;

  while (hops <= MAX_REDIRECTS) {
    let parsed;
    try {
      parsed = new URL(current);
    } catch {
      throw Object.assign(new Error('Invalid download URL.'), { status: 400 });
    }
    if (parsed.protocol !== 'https:') {
      throw Object.assign(new Error('Download URL must be https.'), { status: 400 });
    }
    await assertHostSafe(parsed.hostname, provider);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res;
    try {
      res = await fetch(current, {
        method: hops === 0 ? method : 'GET',
        headers: hops === 0 ? headers : {},
        redirect: 'manual',
        signal: controller.signal,
      });
    } catch (e) {
      clearTimeout(timer);
      if (e?.name === 'AbortError') {
        throw Object.assign(new Error('Download timed out.'), { status: 504 });
      }
      throw Object.assign(new Error('Provider download failed.'), { status: 502 });
    } finally {
      clearTimeout(timer);
    }

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get('location');
      if (!loc) {
        throw Object.assign(new Error('Provider redirect missing Location.'), { status: 502 });
      }
      current = new URL(loc, parsed).toString();
      hops += 1;
      continue;
    }

    if (!res.ok) {
      throw Object.assign(new Error(`Provider download failed (${res.status}).`), { status: 502 });
    }

    const ct = res.headers.get('content-type');
    if (!contentTypeAcceptable(ct, expectedMime)) {
      throw Object.assign(new Error('Unexpected content type from provider.'), { status: 400 });
    }

    const len = Number(res.headers.get('content-length') || 0);
    if (len && len > maxBytes) {
      return { oversize: true, size: len, buffer: null };
    }

    if (!res.body) {
      const ab = await res.arrayBuffer();
      if (ab.byteLength > maxBytes) {
        return { oversize: true, size: ab.byteLength, buffer: null };
      }
      return { oversize: false, size: ab.byteLength, buffer: Buffer.from(ab) };
    }

    const reader = res.body.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          /* ignore */
        }
        return { oversize: true, size: total, buffer: null };
      }
      chunks.push(Buffer.from(value));
    }
    return { oversize: false, size: total, buffer: Buffer.concat(chunks, total) };
  }

  throw Object.assign(new Error('Too many redirects.'), { status: 502 });
}

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    if (url.pathname.endsWith('/providers') || url.searchParams.get('providers') === '1') {
      const cfg = getProviderClientConfig();
      return jsonResponse({
        dropbox: cfg.dropbox,
        googleDrive: cfg.googleDrive,
        googleClassroom: cfg.googleClassroom,
        box: cfg.box,
        oneDrive: cfg.oneDrive,
        teams: cfg.teams,
        // Public picker keys only (safe to expose; hide button when null)
        keys: {
          dropboxAppKey: cfg.dropboxAppKey,
          googleApiKey: cfg.googleApiKey,
          googleClientId: cfg.googleClientId,
          boxClientId: cfg.boxClientId,
          oneDriveClientId: cfg.oneDriveClientId,
          teamsClientId: cfg.teamsClientId,
        },
        sizeLimits: SIZE_LIMITS,
      });
    }

    const lessonKey = (url.searchParams.get('lessonKey') || '').trim();
    if (!lessonKey) return jsonResponse({ error: 'Missing lessonKey.' }, 400);
    const rows = await listAttachmentsForLesson(lessonKey, auth.userId);
    return jsonResponse({ attachments: rows.map((r) => publicRow(request, r)) });
  } catch (e) {
    console.error('lesson-attachments GET:', e instanceof Error ? e.message : e);
    return jsonResponse({ error: 'Failed to list attachments.' }, 500);
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    const url = new URL(request.url);
    const id = (url.searchParams.get('id') || '').trim();
    if (!id) return jsonResponse({ error: 'Missing id.' }, 400);
    const row = await getOwnedAttachment(id, auth.userId);
    if (!row) return jsonResponse({ error: 'Not found.' }, 404);
    if (row.storage_path && row.storage_kind === 'dreamhost') {
      try {
        await deleteAttachmentFromDreamHost(row.storage_path);
      } catch (e) {
        console.warn('DreamHost delete:', e instanceof Error ? e.message : e);
      }
    }
    await deleteAttachmentRow(id, auth.userId);
    return jsonResponse({ success: true });
  } catch (e) {
    return jsonResponse({ error: 'Delete failed.' }, 500);
  }
}

export async function POST(request) {
  try {
    const ip = getClientIp(request) || 'unknown';
    const limited = assertRateLimit(`la:${ip}`, { limit: 40, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body.' }, 400);
    }

    // --- complete direct upload ---
    if (body?.complete === true) {
      if (!isAttachmentStorageConfigured()) return attachmentStorageNotConfiguredResponse();
      const row = await getOwnedAttachment(body.attachmentId, auth.userId);
      if (!row) return jsonResponse({ error: 'Not found.' }, 404);
      if (!row.storage_path) {
        return jsonResponse({ error: 'Attachment has no storage path.' }, 400);
      }
      const ext = String(row.storage_path).split('.').pop()?.toLowerCase() || '';
      const maxBytes = SIZE_LIMITS[row.kind] || SIZE_LIMITS.document;
      try {
        const probe = await probeAttachmentOnDreamHost(row.storage_path, {
          maxBytes,
          ext,
          expectedBytes: row.byte_size,
        });
        const updated = await updateAttachmentRow(row.id, auth.userId, {
          status: 'ready',
          byte_size: probe.byteLength,
        });
        return jsonResponse({
          attachment: publicRow(request, updated || { ...row, status: 'ready', byte_size: probe.byteLength }),
        });
      } catch (e) {
        const status = e?.status && Number.isFinite(e.status) ? e.status : 502;
        await updateAttachmentRow(row.id, auth.userId, { status: 'failed' }).catch(() => null);
        return jsonResponse(
          {
            error:
              status === 404
                ? 'Uploaded file not found on storage.'
                : status === 400
                  ? 'Uploaded file failed type verification.'
                  : status === 413
                    ? 'Uploaded file is too large.'
                    : 'Could not verify upload.',
          },
          status === 404 || status === 400 || status === 413 ? status : 502,
        );
      }
    }

    const lessonKey = typeof body?.lessonKey === 'string' ? body.lessonKey.trim() : '';
    if (!lessonKey) return jsonResponse({ error: 'Missing lessonKey.' }, 400);
    const organisationId = await orgOf(auth.userId);

    // --- cloud import ---
    if (body?.import === true) {
      const provider = String(body.provider || '').toLowerCase();
      if (
        !['dropbox', 'google_drive', 'box', 'onedrive', 'teams', 'google_classroom'].includes(
          provider,
        )
      ) {
        return jsonResponse({ error: 'Unsupported provider.' }, 400);
      }
      const fileName = String(body.fileName || 'file').trim();
      const mimeType = String(body.mimeType || '').trim();
      const downloadUrl = typeof body.downloadUrl === 'string' ? body.downloadUrl.trim() : '';
      const accessToken =
        typeof body.accessToken === 'string' && body.accessToken.trim()
          ? body.accessToken.trim()
          : null;
      const declaredSize = Number(body.byteSize) || 0;
      const externalUrlRaw =
        typeof body.externalUrl === 'string' && body.externalUrl.trim()
          ? body.externalUrl.trim()
          : '';
      const providerFileId =
        typeof body.providerFileId === 'string' ? body.providerFileId.trim() : '';
      const linkOnly = body.linkOnly === true || body.asLink === true;

      // Reject client downloadUrl without providerFileId (prefer providerFileId).
      if (downloadUrl && !providerFileId && !linkOnly) {
        return jsonResponse(
          { error: 'providerFileId is required; do not send downloadUrl alone.' },
          400,
        );
      }

      // YouTube / web links from Classroom — store as linked metadata only.
      if (linkOnly) {
        const kindRaw = String(body.kind || '').toLowerCase();
        const kind = ['image', 'video', 'audio', 'document'].includes(kindRaw)
          ? kindRaw
          : 'document';
        const linkTarget = externalUrlRaw || downloadUrl;
        const https = requireHttpsUrl(linkTarget, 'externalUrl');
        if (!https.ok) return jsonResponse({ error: https.error }, 400);
        const row = await insertAttachmentRow({
          owner_id: auth.userId,
          organisation_id: organisationId,
          lesson_key: lessonKey,
          storage_path: null,
          storage_kind: 'link',
          file_name: fileName || https.url,
          mime_type: mimeType || (kind === 'video' ? 'video/youtube' : 'text/uri-list'),
          kind,
          byte_size: Math.max(0, Math.floor(declaredSize)),
          status: 'linked',
          provider,
          provider_file_id: providerFileId || null,
          external_url: https.url,
        });
        return jsonResponse({ attachment: publicRow(request, row), linked: true, reason: 'link_only' });
      }

      let externalUrl = null;
      if (externalUrlRaw) {
        const https = requireHttpsUrl(externalUrlRaw, 'externalUrl');
        if (!https.ok) return jsonResponse({ error: https.error }, 400);
        externalUrl = https.url;
      }

      const resolved = resolveExtFromNameAndMime(fileName, mimeType);
      if (!resolved.ok) return jsonResponse({ error: resolved.error }, 400);

      // Oversize → linked attachment (no DreamHost bytes)
      if (declaredSize > resolved.max) {
        if (!externalUrl) {
          return jsonResponse(
            { error: 'Over-size cloud files require an https externalUrl to link.' },
            400,
          );
        }
        const row = await insertAttachmentRow({
          owner_id: auth.userId,
          organisation_id: organisationId,
          lesson_key: lessonKey,
          storage_path: null,
          storage_kind: 'link',
          file_name: fileName,
          mime_type: resolved.mime,
          kind: resolved.kind,
          byte_size: Math.floor(declaredSize),
          status: 'linked',
          provider,
          provider_file_id: providerFileId || null,
          external_url: externalUrl,
        });
        return jsonResponse({
          attachment: publicRow(request, row),
          linked: true,
          reason: 'over_size_limit',
        });
      }

      if (!providerFileId) {
        return jsonResponse({ error: 'Missing providerFileId.' }, 400);
      }
      if (!isAttachmentStorageConfigured()) return attachmentStorageNotConfiguredResponse();

      let target;
      try {
        target = resolveProviderDownload({
          provider,
          providerFileId,
          downloadUrl,
          accessToken,
        });
      } catch (e) {
        const status = e?.status && Number.isFinite(e.status) ? e.status : 400;
        return jsonResponse({ error: e instanceof Error ? e.message : 'Invalid download target.' }, status);
      }

      const fetched = await fetchRemoteFileSafe({
        url: target.url,
        method: target.method,
        headers: target.headers,
        provider: target.provider,
        maxBytes: resolved.max,
        expectedMime: resolved.mime,
      });
      if (fetched.oversize) {
        if (!externalUrl) {
          return jsonResponse(
            { error: 'File over size limit and no https externalUrl to link.' },
            413,
          );
        }
        const row = await insertAttachmentRow({
          owner_id: auth.userId,
          organisation_id: organisationId,
          lesson_key: lessonKey,
          storage_path: null,
          storage_kind: 'link',
          file_name: fileName,
          mime_type: resolved.mime,
          kind: resolved.kind,
          byte_size: fetched.size,
          status: 'linked',
          provider,
          provider_file_id: providerFileId || null,
          external_url: externalUrl,
        });
        return jsonResponse({
          attachment: publicRow(request, row),
          linked: true,
          reason: 'over_size_limit',
        });
      }

      if (!sniffMatches(fetched.buffer, resolved.ext)) {
        return jsonResponse({ error: 'File content does not match declared type.' }, 400);
      }

      const storagePath = buildAttachmentPath(auth.userId, lessonKey, resolved.ext);
      await uploadAttachmentToDreamHost({
        buffer: fetched.buffer,
        storagePath,
        maxBytes: resolved.max,
      });
      const row = await insertAttachmentRow({
        owner_id: auth.userId,
        organisation_id: organisationId,
        lesson_key: lessonKey,
        storage_path: storagePath,
        storage_kind: 'dreamhost',
        file_name: fileName,
        mime_type: resolved.mime,
        kind: resolved.kind,
        byte_size: fetched.size,
        status: 'ready',
        provider,
        provider_file_id: providerFileId || null,
        external_url: null,
      });
      return jsonResponse({ attachment: publicRow(request, row), linked: false });
    }

    if (!isAttachmentStorageConfigured()) return attachmentStorageNotConfiguredResponse();

    const fileName = typeof body?.fileName === 'string' ? body.fileName.trim() : '';
    const mimeType = typeof body?.mimeType === 'string' ? body.mimeType.trim() : '';
    const resolved = resolveExtFromNameAndMime(fileName, mimeType);
    if (!resolved.ok) return jsonResponse({ error: resolved.error }, 400);

    // --- prepare (device upload) ---
    if (body?.prepare === true) {
      const byteSize = Number(body.byteSize);
      if (!Number.isFinite(byteSize) || byteSize <= 0) {
        return jsonResponse({ error: 'Invalid byteSize.' }, 400);
      }
      if (byteSize > resolved.max) {
        return jsonResponse(
          { error: `File too large (max ${Math.round(resolved.max / (1024 * 1024))} MB).` },
          413,
        );
      }
      if (byteSize <= PROXY_MAX_BYTES) {
        return jsonResponse({ mode: 'proxy', maxBytes: resolved.max });
      }
      if (!isUploadTicketSecretConfigured()) {
        return jsonResponse(
          {
            error:
              'Direct upload is not configured. Set DREAMHOST_UPLOAD_TOKEN_SECRET or DREAMHOST_UPLOAD_SIGNING_SECRET.',
          },
          503,
        );
      }
      const storagePath = buildAttachmentPath(auth.userId, lessonKey, resolved.ext);
      const row = await insertAttachmentRow({
        owner_id: auth.userId,
        organisation_id: organisationId,
        lesson_key: lessonKey,
        storage_path: storagePath,
        storage_kind: 'dreamhost',
        file_name: fileName || `attachment.${resolved.ext}`,
        mime_type: resolved.mime,
        kind: resolved.kind,
        byte_size: Math.floor(byteSize),
        status: 'pending',
      });
      const ticket = createDirectUploadTicket({
        userId: auth.userId,
        storagePath,
        mime: resolved.mime,
        maxBytes: resolved.max,
        attachmentId: row.id,
      });
      return jsonResponse({
        mode: 'direct',
        attachmentId: row.id,
        uploadUrl: ticket.uploadUrl,
        ticket: ticket.ticket,
        expiresAt: ticket.expiresAt,
        storagePath,
        maxBytes: resolved.max,
        mimeType: resolved.mime,
      });
    }

    // --- small proxy upload ---
    const fileData = body?.fileData;
    if (typeof fileData !== 'string' || !fileData) {
      return jsonResponse({ error: 'Missing fileData (or use prepare/import).' }, 400);
    }
    let buffer;
    try {
      buffer = Buffer.from(fileData, 'base64');
    } catch {
      return jsonResponse({ error: 'Invalid base64 fileData.' }, 400);
    }
    if (!buffer.byteLength) return jsonResponse({ error: 'Empty file.' }, 400);
    if (buffer.byteLength > PROXY_MAX_BYTES) {
      return jsonResponse({ error: 'Too large for proxy upload; use prepare:true.' }, 413);
    }
    if (buffer.byteLength > resolved.max) return jsonResponse({ error: 'File too large.' }, 413);
    if (!sniffMatches(buffer, resolved.ext)) {
      return jsonResponse({ error: 'File content does not match declared type.' }, 400);
    }

    const storagePath = buildAttachmentPath(auth.userId, lessonKey, resolved.ext);
    await uploadAttachmentToDreamHost({
      buffer,
      storagePath,
      maxBytes: Math.min(resolved.max, PROXY_MAX_BYTES),
    });
    const row = await insertAttachmentRow({
      owner_id: auth.userId,
      organisation_id: organisationId,
      lesson_key: lessonKey,
      storage_path: storagePath,
      storage_kind: 'dreamhost',
      file_name: fileName || `attachment.${resolved.ext}`,
      mime_type: resolved.mime,
      kind: resolved.kind,
      byte_size: buffer.byteLength,
      status: 'ready',
    });
    return jsonResponse({ success: true, attachment: publicRow(request, row) });
  } catch (error) {
    // Never log bodies that may contain accessToken
    console.error('lesson-attachments POST:', error instanceof Error ? error.message : 'error');
    const status = error?.status && Number.isFinite(error.status) ? error.status : 500;
    return jsonResponse(
      { error: status === 413 ? 'File too large.' : 'Upload failed.' },
      status === 413 ? 413 : status >= 400 && status < 600 ? status : 500,
    );
  }
}
