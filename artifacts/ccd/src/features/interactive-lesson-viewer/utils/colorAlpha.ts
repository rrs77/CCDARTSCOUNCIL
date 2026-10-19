/** Colour + alpha helpers for pickers and opacity sliders. */

export function parseCssColor(
  input: string | undefined | null,
): { r: number; g: number; b: number; a: number } | null {
  const raw = (input || '').trim();
  if (!raw) return null;

  if (raw.startsWith('#')) {
    let hex = raw.slice(1);
    if (hex.length === 3 || hex.length === 4) {
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

export function toHex6(r: number, g: number, b: number): string {
  const h = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

export function toRgba(r: number, g: number, b: number, a: number): string {
  const alpha = Math.max(0, Math.min(1, a));
  if (alpha >= 0.999) return toHex6(r, g, b);
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Math.round(alpha * 1000) / 1000})`;
}

export function colorWithAlpha(color: string, alpha: number): string {
  const p = parseCssColor(color) || { r: 31, g: 27, b: 77, a: 1 };
  return toRgba(p.r, p.g, p.b, alpha);
}

export function getColorAlpha(color: string | undefined | null, fallback = 1): number {
  const p = parseCssColor(color);
  return p ? p.a : fallback;
}

export function getHexForInput(color: string | undefined | null, fallback = '#1F1B4D'): string {
  const p = parseCssColor(color);
  if (!p) return fallback;
  return toHex6(p.r, p.g, p.b);
}

/** Snap transition duration to a friendly grid while dragging. */
export function snapTransitionMs(ms: number): number {
  const v = Math.max(0, Math.min(5000, ms));
  if (v < 50) return 0;
  if (v <= 1000) return Math.round(v / 50) * 50;
  return Math.round(v / 100) * 100;
}
