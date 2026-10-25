/**
 * Pluggable lyrics transcription (OpenAI Whisper).
 * Routed through /api/router so we stay within the Hobby serverless function limit.
 * Secret: OPENAI_API_KEY (server env only — never commit).
 */

import {
  corsHeaders,
  jsonResponse,
  optionsResponse,
  requireAuth,
} from '../../../api/_authShared.js';

const OPENAI_URL = 'https://api.openai.com/v1/audio/transcriptions';

function getOpenAiKey() {
  return process.env.OPENAI_API_KEY || process.env.WHISPER_API_KEY || '';
}

export async function GET() {
  const key = getOpenAiKey();
  if (!key) {
    return jsonResponse(
      {
        available: false,
        provider: 'none',
        message:
          'No OPENAI_API_KEY (or WHISPER_API_KEY) is set. Auto-transcribe is disabled; use Tap to sync or paste lyrics.',
      },
      200,
    );
  }
  return jsonResponse({
    available: true,
    provider: 'openai-whisper',
    message: 'OpenAI Whisper is configured for auto-timing lyrics.',
  });
}

export async function POST(request) {
  if (request.method === 'OPTIONS') return optionsResponse(request);

  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

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

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ message: 'Invalid JSON body' }, 400);
  }

  const audioUrl = typeof body.audioUrl === 'string' ? body.audioUrl.trim() : '';
  if (!audioUrl) {
    return jsonResponse({ message: 'audioUrl is required' }, 400);
  }

  if (!/^https?:\/\//i.test(audioUrl) && !audioUrl.startsWith('/')) {
    return jsonResponse({ message: 'audioUrl must be http(s) or a site-relative path' }, 400);
  }

  try {
    const absolute = audioUrl.startsWith('http')
      ? audioUrl
      : new URL(audioUrl, request.url).toString();

    const mediaRes = await fetch(absolute);
    if (!mediaRes.ok) {
      return jsonResponse({ message: `Could not fetch audio (${mediaRes.status})` }, 400);
    }
    const buf = Buffer.from(await mediaRes.arrayBuffer());
    const contentType = mediaRes.headers.get('content-type') || 'audio/mpeg';
    const ext = contentType.includes('wav')
      ? 'wav'
      : contentType.includes('mp4') || contentType.includes('m4a')
        ? 'm4a'
        : 'mp3';

    const form = new FormData();
    form.append('file', new Blob([buf], { type: contentType }), `lyrics.${ext}`);
    form.append('model', 'whisper-1');
    form.append('response_format', 'verbose_json');
    form.append('timestamp_granularities[]', 'segment');

    const whisperRes = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
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
    });
  } catch (err) {
    console.error('[ILV transcribe]', err);
    return jsonResponse(
      { message: 'Transcription error. Use Tap to sync as a fallback.' },
      500,
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
