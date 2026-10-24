/**
 * GET /api/freesound/search?query=… — authenticated Freesound text search proxy.
 * Server-only FREESOUND_API_KEY. Whitelisted params only.
 */

import {
  buildFreesoundSearchParams,
  freesoundFetch,
  freesoundNotConfiguredResponse,
  isFreesoundConfigured,
  jsonResponse,
  optionsResponse,
  requireFreesoundAuth,
} from '../../../api/_freesoundShared.js';

export async function OPTIONS(request) {
  return optionsResponse(request);
}

export async function GET(request) {
  try {
    const auth = await requireFreesoundAuth(request);
    if (!auth.ok) return auth.response;

    if (!isFreesoundConfigured()) {
      return freesoundNotConfiguredResponse(request);
    }

    const url = new URL(request.url);
    // Availability probe (no query) — signed-in clients only.
    if (!url.searchParams.get('query') && !url.searchParams.get('q')) {
      return jsonResponse({ available: true }, 200, {}, request);
    }

    const built = buildFreesoundSearchParams(url.searchParams);
    if (!built.ok) {
      return jsonResponse({ error: built.error }, 400, {}, request);
    }

    const upstream = await freesoundFetch(`/search/text/?${built.params.toString()}`);
    if (!upstream.ok) {
      const status = upstream.status === 429 ? 429 : upstream.status >= 500 ? 502 : 400;
      return jsonResponse(
        { error: 'Freesound search failed.' },
        status,
        {},
        request,
      );
    }

    const data = await upstream.json();
    const results = Array.isArray(data?.results) ? data.results : [];

    // Map to a stable client shape; preview URLs go through our proxy path.
    const mapped = results
      .filter((r) => r?.id && (r.previews?.['preview-hq-mp3'] || r.previews?.['preview-lq-mp3']))
      .map((r) => {
        const id = Number(r.id);
        return {
          id,
          name: typeof r.name === 'string' ? r.name : '',
          username: typeof r.username === 'string' ? r.username : '',
          license: typeof r.license === 'string' ? r.license : '',
          url: typeof r.url === 'string' ? r.url : `https://freesound.org/s/${id}/`,
          waveform: r.images?.waveform_m || r.images?.spectral_m || '',
          previewPath: `/api/freesound/preview/${id}`,
          // Public CDN preview kept for lesson storage (no API key required to play).
          previewUrl:
            r.previews?.['preview-hq-mp3'] || r.previews?.['preview-lq-mp3'] || '',
        };
      });

    return jsonResponse(
      {
        count: typeof data.count === 'number' ? data.count : mapped.length,
        results: mapped,
      },
      200,
      {},
      request,
    );
  } catch (error) {
    console.error('freesound/search:', error instanceof Error ? error.message : error);
    const status = error?.status && Number.isFinite(error.status) ? error.status : 500;
    return jsonResponse(
      { error: status === 503 ? 'Freesound is not configured.' : 'Freesound search failed.' },
      status === 503 ? 503 : 500,
      {},
      request,
    );
  }
}
