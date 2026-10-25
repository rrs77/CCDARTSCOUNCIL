/**
 * Pluggable lyrics transcription (OpenAI Whisper).
 * Routed through /api/router so we stay within the Hobby serverless function limit.
 * Secret: OPENAI_API_KEY (server env only — never commit).
 *
 * Gating: assertRateLimit (IP) + requireAiAddon + claimAiUsage (DB per-user/org).
 * SSRF: fetchAllowlistedAudio — https + exact host allowlist, manual redirects,
 * private-IP reject, 25MB stream cap, audio/* only, 20s timeout.
 */

import {
  assertRateLimit,
  corsHeaders,
  getBearerToken,
  getClientIp,
  jsonResponse,
  optionsResponse,
  requireAuth,
} from '../../../api/_authShared.js';
import { probeAiAddon, requireAiAddon } from '../../../api/_aiAddon.js';
import { assertAiRequestBodySize, claimAiUsage } from '../../../api/_aiUsage.js';
import {
  AUDIO_MAX_BYTES,
  fetchAllowlistedAudio,
} from '../../../api/_safeAudioFetch.js';
import {
  EXT_ALLOWLIST,
  fetchAttachmentFromDreamHost,
  parseAttachmentStoragePath,
  verifyDirectUploadTicket,
} from '../../../api/_lessonAttachmentStorage.js';

const OPENAI_URL = 'https://api.openai.com/v1/audio/transcriptions';

function getOpenAiKey() {
  return process.env.OPENAI_API_KEY || process.env.WHISPER_API_KEY || '';
}

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
 * Resolve audio bytes: prefer lesson-attachment storagePath / ticket (server-side
 * DreamHost read), else SSRF-safe allowlisted https URL.
 */
async function resolveAudioBuffer(body) {
  const ticket =
    typeof body?.attachmentTicket === 'string' ? body.attachmentTicket.trim() : '';
  if (ticket) {
    const payload = verifyDirectUploadTicket(ticket);
    if (!payload?.p) {
      throw Object.assign(new Error('Invalid or expired attachment ticket.'), {
        status: 400,
        code: 'bad_ticket',
      });
    }
    const path = parseAttachmentStoragePath(payload.p);
    if (!path) {
      throw Object.assign(new Error('Invalid attachment path in ticket.'), {
        status: 400,
        code: 'bad_path',
      });
    }
    const ext = path.split('.').pop()?.toLowerCase();
    if (!ext || EXT_ALLOWLIST[ext]?.kind !== 'audio') {
      throw Object.assign(new Error('Attachment is not an audio file.'), {
        status: 400,
        code: 'non_audio_type',
      });
    }
    const buffer = await fetchAttachmentFromDreamHost(path);
    if (buffer.byteLength > AUDIO_MAX_BYTES) {
      throw Object.assign(new Error('Audio file is too large (max 25MB).'), {
        status: 413,
        code: 'oversize',
      });
    }
    return {
      buffer,
      contentType: EXT_ALLOWLIST[ext].mime,
      ext,
    };
  }

  const storagePath =
    typeof body?.storagePath === 'string' ? body.storagePath.trim() : '';
  if (storagePath) {
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
    const buffer = await fetchAttachmentFromDreamHost(path);
    if (buffer.byteLength > AUDIO_MAX_BYTES) {
      throw Object.assign(new Error('Audio file is too large (max 25MB).'), {
        status: 413,
        code: 'oversize',
      });
    }
    return {
      buffer,
      contentType: EXT_ALLOWLIST[ext].mime,
      ext,
    };
  }

  const audioUrl = typeof body?.audioUrl === 'string' ? body.audioUrl : '';
  const fetched = await fetchAllowlistedAudio(audioUrl);
  return {
    buffer: fetched.buffer,
    contentType: fetched.contentType,
    ext: extFromContentType(fetched.contentType),
  };
}

export async function GET(request) {
  const key = getOpenAiKey();
  let aiAddon = false;
  try {
    if (getBearerToken(request)) {
      const auth = await requireAuth(request);
      if (auth.ok) {
        const probe = await probeAiAddon(auth.userId);
        aiAddon = probe.aiAddon;
      }
    }
  } catch {
    /* key status still returned */
  }

  if (!key) {
    return jsonResponse(
      {
        available: false,
        aiAddon,
        provider: 'none',
        message:
          'No OPENAI_API_KEY (or WHISPER_API_KEY) is set. Auto-transcribe is disabled; use Tap to sync or paste lyrics.',
      },
      200,
    );
  }
  return jsonResponse({
    available: true,
    aiAddon,
    provider: 'openai-whisper',
    message: aiAddon
      ? 'OpenAI Whisper is configured for auto-timing lyrics.'
      : 'AI add-on required',
  });
}

export async function POST(request) {
  if (request.method === 'OPTIONS') return optionsResponse(request);

  const ip = getClientIp(request) || 'unknown';
  const limited = assertRateLimit(`ilv-transcribe:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!limited.ok) return limited.response;

  const bodySize = assertAiRequestBodySize(request);
  if (!bodySize.ok) return bodySize.response;

  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ message: 'Invalid JSON body' }, 400);
  }

  const entitlement = await requireAiAddon(auth.userId, body);
  if (!entitlement.ok) return entitlement.response;

  const usage = await claimAiUsage({
    userId: auth.userId,
    organisationId: entitlement.organisationId,
    route: 'transcribe',
  });
  if (!usage.ok) return usage.response;

  const key = getOpenAiKey();
  if (!key) {
    return jsonResponse(
      {
        available: false,
        provider: 'none',
        message:
          'No OPENAI_API_KEY set on the server. Ask an admin to add it, or use Tap to sync in the editor.',
      },
      501,
    );
  }

  try {
    const { buffer, contentType, ext } = await resolveAudioBuffer(body);

    const form = new FormData();
    form.append('file', new Blob([buffer], { type: contentType }), `lyrics.${ext}`);
    form.append('model', 'whisper-1');
    form.append('response_format', 'verbose_json');
    form.append('timestamp_granularities[]', 'segment');

    const whisperRes = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
      signal: AbortSignal.timeout(60_000),
    });

    if (!whisperRes.ok) {
      const errText = await whisperRes.text().catch(() => '');
      console.error('[ILV transcribe] OpenAI error', whisperRes.status, errText.slice(0, 400));
      return jsonResponse(
        { message: 'Whisper transcription failed. Try Tap to sync instead.' },
        502,
      );
    }

    const result = await whisperRes.json();
    const segments = Array.isArray(result.segments) ? result.segments : [];
    const lines = segments
      .map((seg) => ({
        text: String(seg.text || '').trim(),
        startMs: Math.round(Number(seg.start || 0) * 1000),
        endMs: Math.round(Number(seg.end || 0) * 1000),
      }))
      .filter((l) => l.text);

    return jsonResponse({
      provider: 'openai-whisper',
      lines,
      available: true,
      aiAddon: true,
    });
  } catch (err) {
    const status = err && typeof err === 'object' && 'status' in err ? Number(err.status) : 0;
    const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
    const message = err instanceof Error ? err.message : 'Transcription error.';
    if (status >= 400 && status < 500) {
      return jsonResponse({ message, code: code || undefined }, status);
    }
    console.error('[ILV transcribe]', message.slice(0, 300));
    return jsonResponse(
      { message: 'Transcription error. Use Tap to sync as a fallback.' },
      status >= 500 ? status : 500,
    );
  }
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders({}, request) });
  }
  if (request.method === 'GET') return GET(request);
  if (request.method === 'POST') return POST(request);
  return jsonResponse({ message: 'Method not allowed' }, 405);
}
