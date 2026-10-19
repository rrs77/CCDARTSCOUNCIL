/** Pick readable text colour against a scene / stage background. */

function parseColor(input: string): { r: number; g: number; b: number; a: number } | null {
  const raw = (input || '').trim();
  if (!raw) return null;

  if (raw.startsWith('#')) {
    let hex = raw.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    }
    if (hex.length === 4) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
      if ([r, g, b].every((n) => Number.isFinite(n))) return { r, g, b, a };
    }
    return null;
  }

  const rgb = raw.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
  );
  if (rgb) {
    return {
      r: Number(rgb[1]),
      g: Number(rgb[2]),
      b: Number(rgb[3]),
      a: rgb[4] != null ? Number(rgb[4]) : 1,
    };
  }
  return null;
}

function relativeLuminance(r: number, g: number, b: number): number {
  const lin = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/** High-contrast ink for overlays on a given background. */
export function contrastTextColor(background: string | undefined | null): string {
  const parsed = parseColor(background || '#FFFFFF');
  if (!parsed || parsed.a < 0.35) return '#1F1B4D';
  const L = relativeLuminance(parsed.r, parsed.g, parsed.b);
  return L > 0.55 ? '#1F1B4D' : '#FFFFFF';
}

/** Softer but still readable placeholder colour (not washed-out grey). */
export function placeholderTextColor(background: string | undefined | null): string {
  const ink = contrastTextColor(background);
  return ink === '#FFFFFF' ? 'rgba(255,255,255,0.78)' : 'rgba(31,27,77,0.62)';
}

export const OVERLAY_PLACEHOLDER_RE =
  /^(add title|add subtitle|add text|lesson title|subtitle|body text)$/i;

export function isOverlayPlaceholder(text: string): boolean {
  return OVERLAY_PLACEHOLDER_RE.test((text || '').trim());
}

/** Sensible starting width (%) so new boxes hug placeholder content. */
export function defaultOverlayWidth(style: 'headline' | 'subtitle' | 'body'): number {
  if (style === 'headline') return 48;
  if (style === 'subtitle') return 32;
  return 28;
}

export function defaultOverlayPosition(
  style: 'headline' | 'subtitle' | 'body',
  existingCount: number,
): { x: number; y: number } {
  if (style === 'headline') return { x: 26, y: 36 };
  if (style === 'subtitle') return { x: 34, y: 52 };
  return { x: 20, y: Math.min(72, 18 + existingCount * 12) };
}
