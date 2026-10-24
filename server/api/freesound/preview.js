/**
 * GET /api/freesound/preview/:id — stream a Freesound preview mp3.
 * requireAuth + rate limit; server uses FREESOUND_API_KEY to resolve the sound.
 * Upstream fetch uses redirect:'error' (no open redirects) and only serves audio/*.
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

function isAllowedFreesoundHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  return host === 'freesound.org' || host.endsWith('.freesound.org');
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

    let previewHost = '';
    try {
      previewHost = new URL(previewUrl).hostname;
    } catch {
      return jsonResponse({ error: 'Preview not available.' }, 404, {}, request);
    }
    if (!isAllowedFreesoundHost(previewHost)) {
      return jsonResponse({ error: 'Preview host not allowed.' }, 502, {}, request);
    }

    // Do not follow redirects — avoids hopping off Freesound CDN hosts.
    const audioRes = await fetch(previewUrl, {
      redirect: 'error',
      headers: { Accept: 'audio/mpeg,audio/*,*/*' },
    });
    if (!audioRes.ok || !audioRes.body) {
      return jsonResponse({ error: 'Freesound preview failed.' }, 502, {}, request);
    }

    const upstreamType = (audioRes.headers.get('Content-Type') || '')
      .split(';')[0]
      .trim()
      .toLowerCase();
    if (upstreamType && !upstreamType.startsWith('audio/')) {
      return jsonResponse({ error: 'Preview is not audio.' }, 502, {}, request);
    }

    const headers = new Headers();
    // Force a known audio type for the panel player.
    headers.set('Content-Type', upstreamType.startsWith('audio/') ? upstreamType : 'audio/mpeg');
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
