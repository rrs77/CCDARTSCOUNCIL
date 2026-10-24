/**
 * GET  /api/lesson-attachments?lessonKey=
 * GET  /api/lesson-attachments/providers
 * POST /api/lesson-attachments
 *   prepare | complete | import (cloud) | small base64 upload
 * DELETE /api/lesson-attachments?id=
 *
 * DreamHost uploads mirror security-fixes _dreamhost.js shape (same env + API key).
 * Cloud imports: server fetches with a one-shot client token / direct URL; token not stored.
 */

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
  listAttachmentsForLesson,
  resolveExtFromNameAndMime,
  sniffMatches,
  updateAttachmentRow,
  uploadAttachmentToDreamHost,
} from '../../../api/_lessonAttachmentStorage.js';

export async function OPTIONS() {
  return optionsResponse();
}

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

async function fetchRemoteFile({ downloadUrl, accessToken, maxBytes }) {
  const headers = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const res = await fetch(downloadUrl, { headers });
  if (!res.ok) {
    throw Object.assign(new Error(`Provider download failed (${res.status}).`), { status: 502 });
  }
  const len = Number(res.headers.get('content-length') || 0);
  if (len && len > maxBytes) {
    return { oversize: true, size: len, buffer: null };
  }
  const ab = await res.arrayBuffer();
  if (ab.byteLength > maxBytes) {
    return { oversize: true, size: ab.byteLength, buffer: null };
  }
  return { oversize: false, size: ab.byteLength, buffer: Buffer.from(ab) };
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
      const updated = await updateAttachmentRow(row.id, auth.userId, { status: 'ready' });
      return jsonResponse({ attachment: publicRow(request, updated || { ...row, status: 'ready' }) });
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
      const externalUrl =
        typeof body.externalUrl === 'string' && body.externalUrl.trim()
          ? body.externalUrl.trim()
          : downloadUrl;
      const providerFileId =
        typeof body.providerFileId === 'string' ? body.providerFileId.trim() : null;
      const linkOnly = body.linkOnly === true || body.asLink === true;

      // YouTube / web links from Classroom — store as linked metadata only.
      if (linkOnly) {
        const kindRaw = String(body.kind || '').toLowerCase();
        const kind = ['image', 'video', 'audio', 'document'].includes(kindRaw)
          ? kindRaw
          : 'document';
        if (!externalUrl) return jsonResponse({ error: 'Missing externalUrl for linked attachment.' }, 400);
        const row = await insertAttachmentRow({
          owner_id: auth.userId,
          organisation_id: organisationId,
          lesson_key: lessonKey,
          storage_path: null,
          storage_kind: 'link',
          file_name: fileName || externalUrl,
          mime_type: mimeType || (kind === 'video' ? 'video/youtube' : 'text/uri-list'),
          kind,
          byte_size: Math.max(0, Math.floor(declaredSize)),
          status: 'linked',
          provider,
          provider_file_id: providerFileId,
          external_url: externalUrl,
        });
        return jsonResponse({ attachment: publicRow(request, row), linked: true, reason: 'link_only' });
      }

      const resolved = resolveExtFromNameAndMime(fileName, mimeType);
      if (!resolved.ok) return jsonResponse({ error: resolved.error }, 400);

      // Oversize → linked attachment (no DreamHost bytes)
      if (declaredSize > resolved.max) {
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
          provider_file_id: providerFileId,
          external_url: externalUrl || null,
        });
        return jsonResponse({
          attachment: publicRow(request, row),
          linked: true,
          reason: 'over_size_limit',
        });
      }

      if (!downloadUrl) return jsonResponse({ error: 'Missing downloadUrl.' }, 400);
      if (!isAttachmentStorageConfigured()) return attachmentStorageNotConfiguredResponse();

      const fetched = await fetchRemoteFile({
        downloadUrl,
        accessToken,
        maxBytes: resolved.max,
      });
      if (fetched.oversize) {
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
          provider_file_id: providerFileId,
          external_url: externalUrl || null,
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
        provider_file_id: providerFileId,
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
    console.error('lesson-attachments POST:', error instanceof Error ? error.message : error);
    const status = error?.status && Number.isFinite(error.status) ? error.status : 500;
    return jsonResponse(
      { error: status === 413 ? 'File too large.' : 'Upload failed.' },
      status === 413 ? 413 : status >= 400 && status < 600 ? status : 500,
    );
  }
}
