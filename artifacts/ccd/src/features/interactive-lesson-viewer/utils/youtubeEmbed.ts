/** Parse common YouTube URL forms into an ID + optional clip window. */

export interface ParsedYouTube {
  id: string;
  startSec?: number;
  endSec?: number;
  watchUrl: string;
  embedUrl: string;
  thumbUrl: string;
}

function parseTimeToken(raw: string | null): number | undefined {
  if (!raw) return undefined;
  if (/^\d+$/.test(raw)) return Number(raw);
  const m = raw.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i);
  if (!m) return undefined;
  const h = Number(m[1] || 0);
  const min = Number(m[2] || 0);
  const s = Number(m[3] || 0);
  const total = h * 3600 + min * 60 + s;
  return total > 0 ? total : undefined;
}

export function isYouTubeUrl(input: string): boolean {
  try {
    const u = new URL(input.trim().startsWith('http') ? input.trim() : `https://${input.trim()}`);
    const host = u.hostname.replace(/^www\./, '');
    return host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be' || host === 'youtube-nocookie.com';
  } catch {
    return false;
  }
}

export function parseYouTubeUrl(input: string): ParsedYouTube | null {
  const raw = input.trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '');
  let id = '';

  if (host === 'youtu.be') {
    id = url.pathname.split('/').filter(Boolean)[0] || '';
  } else if (host.includes('youtube')) {
    if (url.pathname.startsWith('/embed/')) {
      id = url.pathname.split('/')[2] || '';
    } else if (url.pathname.startsWith('/shorts/')) {
      id = url.pathname.split('/')[2] || '';
    } else if (url.pathname.startsWith('/live/')) {
      id = url.pathname.split('/')[2] || '';
    } else {
      id = url.searchParams.get('v') || '';
    }
  }

  if (!id || !/^[\w-]{6,}$/.test(id)) return null;

  const startSec =
    parseTimeToken(url.searchParams.get('start')) ??
    parseTimeToken(url.searchParams.get('t')) ??
    undefined;
  const endSec = parseTimeToken(url.searchParams.get('end'));

  const params = new URLSearchParams({ rel: '0', enablejsapi: '1' });
  if (startSec != null) params.set('start', String(startSec));
  if (endSec != null) params.set('end', String(endSec));

  return {
    id,
    startSec,
    endSec,
    watchUrl: `https://www.youtube.com/watch?v=${id}`,
    embedUrl: `https://www.youtube.com/embed/${id}?${params.toString()}`,
    thumbUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

export function youtubeEmbedSrc(
  url: string,
  opts?: { startSec?: number; endSec?: number; autoplay?: boolean },
): string {
  const parsed = parseYouTubeUrl(url);
  const id = parsed?.id;
  if (!id) return url.includes('/embed/') ? url : url;
  const params = new URLSearchParams({ rel: '0', enablejsapi: '1' });
  const start = opts?.startSec ?? parsed?.startSec;
  const end = opts?.endSec ?? parsed?.endSec;
  if (start != null) params.set('start', String(start));
  if (end != null) params.set('end', String(end));
  if (opts?.autoplay) params.set('autoplay', '1');
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}
