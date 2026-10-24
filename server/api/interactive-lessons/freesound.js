/**
 * GET /api/interactive-lessons/freesound?q=
 * Authenticated Freesound search proxy — keeps FREESOUND_API_KEY server-only.
 * Folded into api/router.js (no top-level api/*.js entrypoint).
 */

import {
  assertRateLimit,
  getClientIp,
  jsonResponse,
  optionsResponse,
  requireAuth,
} from '../../../api/_authShared.js';

const FREESOUND_SEARCH = 'https://freesound.org/apiv2/search/text/';
const PAGE_SIZE = 20;

function freesoundApiKey() {
  return (
    process.env.FREESOUND_API_KEY ||
    process.env.FREESOUND_CLIENT_TOKEN ||
    process.env.FREESOUND_TOKEN ||
    ''
  ).trim();
}

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request) {
  try {
    const ip = getClientIp(request) || 'unknown';
    const limited = assertRateLimit(`freesound:${ip}`, { limit: 30, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const token = freesoundApiKey();
    if (!token) {
      return jsonResponse(
        {
          error: 'Freesound is not configured.',
          configured: false,
          results: [],
        },
        503,
      );
    }

    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || url.searchParams.get('query') || '').trim();
    if (!q) return jsonResponse({ results: [], configured: true });

    const params = new URLSearchParams({
      query: q.slice(0, 200),
      token,
      page_size: String(PAGE_SIZE),
      fields: 'id,name,previews,images,license,username,url',
      filter: 'license:"Creative Commons 0"',
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    let upstream;
    try {
      upstream = await fetch(`${FREESOUND_SEARCH}?${params}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!upstream.ok) {
      console.error('Freesound upstream:', upstream.status);
      return jsonResponse({ error: 'Freesound search failed.', results: [] }, 502);
    }

    const data = await upstream.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    return jsonResponse({ configured: true, results });
  } catch (e) {
    console.error('freesound proxy:', e instanceof Error ? e.message : e);
    return jsonResponse({ error: 'Freesound search failed.', results: [] }, 500);
  }
}
