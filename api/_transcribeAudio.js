/**
 * Resolve audio bytes for Whisper transcribe (SSRF-safe URL or owned attachment).
 * Underscore module — does not count toward Hobby /api function budget.
 */

import { mayAccessLessonAttachment } from './_attachmentAccess.js';
import {
  EXT_ALLOWLIST,
  fetchAttachmentFromDreamHost,
  parseAttachmentStoragePath,
} from './_lessonAttachmentStorage.js';
import { AUDIO_MAX_BYTES, fetchAllowlistedAudio } from './_safeAudioFetch.js';

function extFromContentType(contentType) {
  const ct = String(contentType || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (ct.includes('wav')) return 'wav';
  if (ct.includes('mp4') || ct.includes('m4a') || ct === 'audio/mp4') return 'm4a';
  if (ct.includes('ogg')) return 'ogg';
  if (ct.includes('aac')) return 'aac';
  return 'mp3';
}

/**
 * Resolve audio for transcription.
 * storagePath requires mayAccessLessonAttachment(userId, path) — no upload-ticket
 * read grant (attachmentTicket is intentionally not accepted).
 *
 * @param {object} body
 * @param {string} userId authenticated user id (required for storagePath)
 * @param {{ mayAccess?: typeof mayAccessLessonAttachment, fetchAttachment?: typeof fetchAttachmentFromDreamHost, fetchAudio?: typeof fetchAllowlistedAudio }} [deps]
 */
export async function resolveAudioBuffer(body, userId, deps = {}) {
  const mayAccess = deps.mayAccess || mayAccessLessonAttachment;
  const fetchAttachment = deps.fetchAttachment || fetchAttachmentFromDreamHost;
  const fetchAudio = deps.fetchAudio || fetchAllowlistedAudio;

  // Upload tickets are write grants only — never treat as a read grant.
  if (typeof body?.attachmentTicket === 'string' && body.attachmentTicket.trim()) {
    throw Object.assign(
      new Error('attachmentTicket is not accepted for transcription; use storagePath or audioUrl.'),
      { status: 400, code: 'ticket_not_allowed' },
    );
  }

  const storagePath =
    typeof body?.storagePath === 'string' ? body.storagePath.trim() : '';
  if (storagePath) {
    if (!userId) {
      throw Object.assign(new Error('Authentication required for storagePath.'), {
        status: 401,
        code: 'unauthenticated',
      });
    }
    const path = parseAttachmentStoragePath(storagePath);
    if (!path) {
      throw Object.assign(new Error('Invalid storagePath.'), {
        status: 400,
        code: 'bad_path',
      });
    }
    const ext = path.split('.').pop()?.toLowerCase();
    if (!ext || EXT_ALLOWLIST[ext]?.kind !== 'audio') {
      throw Object.assign(new Error('storagePath must be an audio attachment.'), {
        status: 400,
        code: 'non_audio_type',
      });
    }
    const allowed = await mayAccess(userId, path);
    if (!allowed) {
      throw Object.assign(new Error('Forbidden.'), { status: 403, code: 'forbidden' });
    }
    const buffer = await fetchAttachment(path, { maxBytes: AUDIO_MAX_BYTES });
    return {
      buffer,
      contentType: EXT_ALLOWLIST[ext].mime,
      ext,
    };
  }

  const audioUrl = typeof body?.audioUrl === 'string' ? body.audioUrl : '';
  const fetched = await fetchAudio(audioUrl);
  return {
    buffer: fetched.buffer,
    contentType: fetched.contentType,
    ext: extFromContentType(fetched.contentType),
  };
}
