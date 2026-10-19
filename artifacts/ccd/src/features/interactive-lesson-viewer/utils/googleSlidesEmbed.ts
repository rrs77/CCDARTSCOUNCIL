/** Convert Google Slides share/edit URLs to the /embed form. */

export interface ParsedGoogleSlides {
  id: string;
  embedUrl: string;
  openUrl: string;
}

export function isGoogleSlidesUrl(input: string): boolean {
  try {
    const u = new URL(input.trim().startsWith('http') ? input.trim() : `https://${input.trim()}`);
    return u.hostname.includes('docs.google.com') && u.pathname.includes('/presentation/');
  } catch {
    return false;
  }
}

export function normalizeGoogleSlidesEmbedUrl(input: string): string {
  const parsed = parseGoogleSlidesUrl(input);
  return parsed?.embedUrl || input.trim();
}

export function parseGoogleSlidesUrl(input: string): ParsedGoogleSlides | null {
  const raw = input.trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (!url.hostname.includes('docs.google.com')) return null;
  const m = url.pathname.match(/\/presentation\/d\/([^/]+)/);
  if (!m?.[1]) return null;
  const id = m[1];
  const params = new URLSearchParams({
    start: 'false',
    loop: 'false',
    delayms: '3000',
  });
  return {
    id,
    embedUrl: `https://docs.google.com/presentation/d/${id}/embed?${params.toString()}`,
    openUrl: `https://docs.google.com/presentation/d/${id}/edit`,
  };
}

export function isLikelyGoogleSlidesEmbed(input: string): boolean {
  try {
    const u = new URL(normalizeGoogleSlidesEmbedUrl(input));
    return u.hostname.includes('docs.google.com') && u.pathname.includes('/embed');
  } catch {
    return false;
  }
}
