/**
 * Free Media search — Openverse, Wikimedia Commons, optional Freesound.
 * Freesound goes through authenticated `/api/freesound/*` (server-only key).
 */

import { supabase } from '../../../config/supabase';
import { getVercelApiUrl } from '../../../utils/apiUrl';

export type FreeMediaType = 'image' | 'audio';
export type FreeMediaProvider = 'openverse' | 'wikimedia' | 'freesound';

export interface FreeMediaItem {
  id: string;
  title: string;
  thumbUrl: string;
  url: string;
  mediaType: FreeMediaType;
  license: string;
  creator: string;
  sourceUrl: string;
  provider: FreeMediaProvider;
  /** Authenticated preview proxy path (Freesound panel playback). */
  previewPath?: string;
}

export type ImageProvider = 'openverse' | 'wikimedia';
export type AudioProvider = 'openverse' | 'freesound';

const OPENVERSE_IMAGES = 'https://api.openverse.org/v1/images/';
const OPENVERSE_AUDIO = 'https://api.openverse.org/v1/audio/';
const WIKIMEDIA_API = 'https://commons.wikimedia.org/w/api.php';

const PAGE_SIZE = 20;

let freesoundAvailableCache: boolean | null = null;

async function authHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  } catch {
    /* ignore */
  }
  return headers;
}

/**
 * Whether the authenticated Freesound proxy is configured on the server.
 * No client VITE_FREESOUND_API_KEY — the key stays server-only.
 */
export async function checkFreesoundAvailable(signal?: AbortSignal): Promise<boolean> {
  if (freesoundAvailableCache != null) return freesoundAvailableCache;
  try {
    const res = await fetch(getVercelApiUrl('/api/freesound/search'), {
      signal,
      headers: await authHeaders(),
    });
    if (!res.ok) {
      freesoundAvailableCache = false;
      return false;
    }
    const data = (await res.json()) as { available?: boolean };
    freesoundAvailableCache = Boolean(data.available);
    return freesoundAvailableCache;
  } catch {
    freesoundAvailableCache = false;
    return false;
  }
}

/** @deprecated Prefer checkFreesoundAvailable() — sync stub always false until checked. */
export function isFreesoundAvailable(): boolean {
  return freesoundAvailableCache === true;
}

export function getFreesoundApiKey(): undefined {
  // Intentionally removed from the client — use FREESOUND_API_KEY on the server.
  return undefined;
}

function cleanTitle(raw: string | undefined | null, fallback = 'Untitled'): string {
  const t = (raw || '').replace(/\.[a-z0-9]+$/i, '').trim();
  return t || fallback;
}

function licenseLabel(raw: string | undefined | null): string {
  const s = (raw || '').trim();
  if (!s) return 'Unknown';
  const lower = s.toLowerCase();
  if (lower === 'cc0' || lower.includes('cc0') || lower.includes('zero')) return 'CC0';
  if (lower === 'pdm' || lower.includes('public domain')) return 'Public Domain';
  return s;
}

/* -------------------------------------------------------------------------- */
/* Openverse                                                                  */
/* -------------------------------------------------------------------------- */

interface OpenverseResult {
  id?: string;
  title?: string;
  url?: string;
  thumbnail?: string;
  foreign_landing_url?: string;
  creator?: string | null;
  license?: string;
  license_version?: string;
}

interface OpenversePage {
  results?: OpenverseResult[];
}

async function searchOpenverse(
  mediaType: FreeMediaType,
  query: string,
  signal?: AbortSignal
): Promise<FreeMediaItem[]> {
  const base = mediaType === 'image' ? OPENVERSE_IMAGES : OPENVERSE_AUDIO;
  const params = new URLSearchParams({
    q: query,
    page_size: String(PAGE_SIZE),
    license: 'cc0,pdm',
  });

  const res = await fetch(`${base}?${params}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Openverse ${mediaType} search failed (${res.status})`);
  }

  const data = (await res.json()) as OpenversePage;
  const rows = data.results || [];

  return rows
    .filter((r) => r.id && r.url)
    .map((r) => ({
      id: `openverse-${mediaType}-${r.id}`,
      title: cleanTitle(r.title),
      thumbUrl: r.thumbnail || (mediaType === 'image' ? r.url! : ''),
      url: r.url!,
      mediaType,
      license: licenseLabel(r.license),
      creator: (r.creator || '').trim() || 'Unknown',
      sourceUrl: r.foreign_landing_url || r.url!,
      provider: 'openverse' as const,
    }));
}

export function searchOpenverseImages(query: string, signal?: AbortSignal) {
  return searchOpenverse('image', query, signal);
}

export function searchOpenverseAudio(query: string, signal?: AbortSignal) {
  return searchOpenverse('audio', query, signal);
}

/* -------------------------------------------------------------------------- */
/* Wikimedia Commons                                                          */
/* -------------------------------------------------------------------------- */

interface WikiImageInfo {
  url?: string;
  descriptionurl?: string;
  size?: number;
  thumburl?: string;
  mime?: string;
  extmetadata?: Record<string, { value?: string } | undefined>;
}

interface WikiPage {
  pageid?: number;
  title?: string;
  imageinfo?: WikiImageInfo[];
}

interface WikiQueryResponse {
  query?: { pages?: Record<string, WikiPage> };
}

const PD_LICENSE_RE =
  /\b(cc[- ]?0|cc0|public domain|pd[- ]?old|pdm|no rights reserved|creativecommons\.org\/publicdomain)\b/i;

function wikiMeta(info: WikiImageInfo | undefined, key: string): string {
  const v = info?.extmetadata?.[key]?.value;
  if (!v) return '';
  return String(v).replace(/<[^>]+>/g, '').trim();
}

function wikiLooksPublicDomain(info: WikiImageInfo | undefined): boolean {
  const blob = [
    wikiMeta(info, 'LicenseShortName'),
    wikiMeta(info, 'License'),
    wikiMeta(info, 'UsageTerms'),
    wikiMeta(info, 'Copyright'),
  ].join(' ');
  if (!blob) return true; // Commons often omits for PD; keep unless clearly restricted
  if (PD_LICENSE_RE.test(blob)) return true;
  // Explicit non-PD Creative Commons (BY/SA/NC/ND) — skip
  if (/\bcc[- ]?by\b/i.test(blob) && !/\bcc[- ]?0\b/i.test(blob)) return false;
  if (/\ball rights reserved\b/i.test(blob)) return false;
  return false;
}

function isImageMime(mime: string | undefined, title: string | undefined): boolean {
  if (mime?.startsWith('image/')) return true;
  return /\.(jpe?g|png|gif|webp|svg|tif{1,2})$/i.test(title || '');
}

export async function searchWikimediaImages(
  query: string,
  signal?: AbortSignal
): Promise<FreeMediaItem[]> {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrnamespace: '6',
    gsrsearch: query,
    gsrlimit: String(PAGE_SIZE),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size|mime|thumburl',
    iiurlwidth: '320',
    format: 'json',
    origin: '*',
  });

  const res = await fetch(`${WIKIMEDIA_API}?${params}`, { signal });
  if (!res.ok) {
    throw new Error(`Wikimedia search failed (${res.status})`);
  }

  const data = (await res.json()) as WikiQueryResponse;
  const pages = Object.values(data.query?.pages || {});

  const items: FreeMediaItem[] = [];
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info?.url || !page.pageid) continue;
    if (!isImageMime(info.mime, page.title)) continue;
    if (!wikiLooksPublicDomain(info)) continue;

    const licenseRaw =
      wikiMeta(info, 'LicenseShortName') ||
      wikiMeta(info, 'UsageTerms') ||
      'Public Domain / CC0';
    const artist = wikiMeta(info, 'Artist') || wikiMeta(info, 'Credit') || 'Unknown';

    items.push({
      id: `wikimedia-${page.pageid}`,
      title: cleanTitle((page.title || '').replace(/^File:/i, '')),
      thumbUrl: info.thumburl || info.url,
      url: info.url,
      mediaType: 'image',
      license: licenseLabel(licenseRaw),
      creator: artist.slice(0, 120),
      sourceUrl: info.descriptionurl || info.url,
      provider: 'wikimedia',
    });
  }

  return items;
}

/* -------------------------------------------------------------------------- */
/* Freesound (authenticated server proxy)                                     */
/* -------------------------------------------------------------------------- */

interface FreesoundProxyHit {
  id?: number;
  name?: string;
  url?: string;
  username?: string;
  license?: string;
  waveform?: string;
  previewPath?: string;
  previewUrl?: string;
}

interface FreesoundProxyPage {
  results?: FreesoundProxyHit[];
  error?: string;
  available?: boolean;
}

/**
 * Fetch preview audio bytes via the authenticated proxy (Bearer).
 * Use for Audio() playback which cannot set Authorization headers.
 */
export async function fetchFreesoundPreviewObjectUrl(
  previewPath: string,
  signal?: AbortSignal,
): Promise<string> {
  const path = previewPath.startsWith('/') ? previewPath : `/${previewPath}`;
  if (!/^\/api\/freesound\/preview\/\d+\/?$/.test(path)) {
    throw new Error('Invalid Freesound preview path.');
  }
  const res = await fetch(getVercelApiUrl(path), {
    signal,
    headers: await authHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Freesound preview failed (${res.status})`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function searchFreesoundAudio(
  query: string,
  signal?: AbortSignal
): Promise<FreeMediaItem[]> {
  const params = new URLSearchParams({
    query,
    page_size: String(PAGE_SIZE),
  });

  const res = await fetch(getVercelApiUrl(`/api/freesound/search?${params}`), {
    signal,
    headers: await authHeaders(),
  });

  if (res.status === 503) {
    freesoundAvailableCache = false;
    throw new Error('Freesound is not configured on the server.');
  }
  if (res.status === 401) {
    throw new Error('Sign in required to search Freesound.');
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || `Freesound search failed (${res.status})`);
  }

  freesoundAvailableCache = true;
  const data = (await res.json()) as FreesoundProxyPage;
  return (data.results || [])
    .filter((r) => r.id && (r.previewUrl || r.previewPath))
    .map((r) => {
      const id = Number(r.id);
      return {
        id: `freesound-${id}`,
        title: cleanTitle(r.name),
        thumbUrl: r.waveform || '',
        // Durable CDN URL for lesson storage; panel playback uses previewPath + Bearer.
        url: r.previewUrl || r.previewPath || '',
        mediaType: 'audio' as const,
        license: licenseLabel(r.license),
        creator: (r.username || '').trim() || 'Unknown',
        sourceUrl: r.url || `https://freesound.org/s/${id}/`,
        provider: 'freesound' as const,
        previewPath: r.previewPath || `/api/freesound/preview/${id}`,
      };
    });
}

/* -------------------------------------------------------------------------- */
/* Unified search                                                             */
/* -------------------------------------------------------------------------- */

export interface FreeMediaSearchOptions {
  query: string;
  mediaType: FreeMediaType;
  /** Images: openverse | wikimedia. Audio: openverse | freesound. */
  provider: ImageProvider | AudioProvider;
  signal?: AbortSignal;
}

export async function searchFreeMedia(opts: FreeMediaSearchOptions): Promise<FreeMediaItem[]> {
  const q = opts.query.trim();
  if (!q) return [];

  if (opts.mediaType === 'image') {
    if (opts.provider === 'wikimedia') return searchWikimediaImages(q, opts.signal);
    return searchOpenverseImages(q, opts.signal);
  }

  if (opts.provider === 'freesound') return searchFreesoundAudio(q, opts.signal);
  return searchOpenverseAudio(q, opts.signal);
}

/** Short attribution line for UI / captions. */
export function formatFreeMediaAttribution(item: FreeMediaItem): string {
  const who = item.creator && item.creator !== 'Unknown' ? item.creator : 'Unknown creator';
  return `“${item.title}” by ${who} · ${item.license} · ${item.provider}`;
}
