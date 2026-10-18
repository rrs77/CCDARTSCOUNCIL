/**
 * Canva only allows iframes for Share → More → Embed URLs:
 *   https://www.canva.com/design/<DESIGN_ID>/<HASH>/view?embed
 * Edit/view share links send X-Frame-Options / CSP that block embedding.
 */

const CANVA_MODES = new Set(['edit', 'view', 'watch', 'present', 'preview']);

export function isCanvaUrl(input: string): boolean {
  try {
    const u = new URL(input.trim().startsWith('http') ? input.trim() : `https://${input.trim()}`);
    const host = u.hostname.replace(/^www\./, '');
    return host === 'canva.com' || host.endsWith('.canva.com') || host === 'canva.link' || host.endsWith('.canva.link');
  } catch {
    return false;
  }
}

export function isCanvaShortlink(input: string): boolean {
  try {
    const u = new URL(input.trim().startsWith('http') ? input.trim() : `https://${input.trim()}`);
    const host = u.hostname.replace(/^www\./, '');
    return host === 'canva.link' || host.endsWith('.canva.link');
  } catch {
    return false;
  }
}

/** True when URL looks like a real Embed form (design id + hash + view + embed). */
export function isLikelyCanvaEmbed(input: string): boolean {
  try {
    const u = new URL(normalizeCanvaEmbedUrl(input));
    if (!u.hostname.includes('canva.com')) return false;
    const parts = u.pathname.split('/').filter(Boolean);
    // design / DESIGN_ID / HASH / view
    if (parts[0] !== 'design' || parts.length < 4) return false;
    if (parts[parts.length - 1] !== 'view') return false;
    return /(?:\?|&)embed(?:&|=|$)/.test(u.search) || u.search === '?embed' || u.search.endsWith('embed');
  } catch {
    return false;
  }
}

/**
 * Normalise edit/view/share Canva URLs to the embed form.
 * Keeps the hash segment when present; strips /edit → /view; appends ?embed.
 * Shortlinks (canva.link) cannot be resolved client-side — returned unchanged.
 */
export function normalizeCanvaEmbedUrl(input: string): string {
  const raw = input.trim();
  if (!raw) return raw;

  let url: URL;
  try {
    url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
  } catch {
    return raw;
  }

  if (isCanvaShortlink(raw)) return raw;
  if (!url.hostname.includes('canva.com')) return raw;

  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] !== 'design' || !parts[1]) return raw;

  const designId = parts[1];
  let rest = parts.slice(2);
  if (rest.length && CANVA_MODES.has(rest[rest.length - 1])) {
    rest = rest.slice(0, -1);
  }

  const params = new URLSearchParams(url.search);
  params.delete('embed');
  const other = params.toString();
  const path = `/${['design', designId, ...rest, 'view'].join('/')}`;
  return `https://www.canva.com${path}${other ? `?${other}&embed` : '?embed'}`;
}

/** Non-embed URL suitable for “Open in Canva”. */
export function canvaOpenUrl(input: string): string {
  try {
    const u = new URL(normalizeCanvaEmbedUrl(input));
    u.search = u.search
      .replace(/([?&])embed=?(&|$)/g, (_, p, end) => (end === '&' ? p : ''))
      .replace(/\?$/, '');
    if (!u.search || u.search === '?') u.search = '';
    return u.toString();
  } catch {
    return input;
  }
}
