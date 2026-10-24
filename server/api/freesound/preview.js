/**
 * GET /api/freesound/preview/:id — stream a Freesound preview mp3.
 * requireAuth + rate limit; server uses FREESOUND_API_KEY to resolve the sound.
 */

import {
  freesoundFetch,
  freesoundNotConfiguredResponse,
  isFreesoundConfigured,
  jsonResponse,
  optionsResponse,
  parseFreesoundSoundId,
  requireFreesoundAuth,
} from '../../../api/_freesoundShared.js';

function soundIdFromRequest(request, context) {
  const fromParams = context?.params?.id;
  if (fromParams != null) {
    const n = parseFreesoundSoundId(fromParams);
    if (n) return n;
  }
  try {
    const pathname = new URL(request.url).pathname;
    const m = pathname.match(/\/api\/freesound\/preview\/(\d+)\/?$/i);
    if (m) return parseFreesoundSoundId(m[1]);
  } catch {
    /* ignore */
  }
  return null;
}

export async function OPTIONS(request) {
  return optionsResponse(request);
}

export async function GET(request, context) {
  try {
    const auth = await requireFreesoundAuth(request);
    if (!auth.ok) return auth.response;

    if (!isFreesoundConfigured()) {
      return freesoundNotConfiguredResponse(request);
    }

    const soundId = soundIdFromRequest(request, context);
    if (!soundId) {
      return jsonResponse({ error: 'Invalid sound id.' }, 400, {}, request);
    }

    const metaRes = await freesoundFetch(
      `/sounds/${soundId}/?fields=id,previews`,
    );
    if (metaRes.status === 404) {
      return jsonResponse({ error: 'Sound not found.' }, 404, {}, request);
    }
    if (!metaRes.ok) {
      return jsonResponse({ error: 'Freesound preview failed.' }, 502, {}, request);
    }

    const meta = await metaRes.json();
    const previewUrl =
      meta?.previews?.['preview-hq-mp3'] || meta?.previews?.['preview-lq-mp3'];
    if (!previewUrl || !/^https:\/\//i.test(previewUrl)) {
      return jsonResponse({ error: 'Preview not available.' }, 404, {}, request);
    }

    // Only allow Freesound CDN hosts for the upstream fetch.
    let previewHost = '';
    try {
      previewHost = new URL(previewUrl).hostname.toLowerCase();
    } catch {
      return jsonResponse({ error: 'Preview not available.' }, 404, {}, request);
    }
    if (
      previewHost !== 'freesound.org' &&
      !previewHost.endsWith('.freesound.org')
    ) {
      return jsonResponse({ error: 'Preview host not allowed.' }, 502, {}, request);
    }

    const audioRes = await fetch(previewUrl, {
      headers: { Accept: 'audio/mpeg,audio/*,*/*' },
    });
    if (!audioRes.ok || !audioRes.body) {
      return jsonResponse({ error: 'Freesound preview failed.' }, 502, {}, request);
    }

    const headers = new Headers();
    headers.set(
      'Content-Type',
      audioRes.headers.get('Content-Type') || 'audio/mpeg',
    );
    const len = audioRes.headers.get('Content-Length');
    if (len) headers.set('Content-Length', len);
    headers.set('Cache-Control', 'private, max-age=300');
    headers.set('X-Content-Type-Options', 'nosniff');

    return new Response(audioRes.body, { status: 200, headers });
  } catch (error) {
    console.error('freesound/preview:', error instanceof Error ? error.message : error);
    const status = error?.status && Number.isFinite(error.status) ? error.status : 500;
    return jsonResponse(
      { error: status === 503 ? 'Freesound is not configured.' : 'Freesound preview failed.' },
      status === 503 ? 503 : 500,
      {},
      request,
    );
  }
}
