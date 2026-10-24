/**
 * Pick black/white text for chips/stripes so foreground meets ~4.5:1 on the given bg.
 * Settings colours belong on chips, stripes and borders — not on body text.
 */

function parseHex(color: string): { r: number; g: number; b: number } | null {
  const raw = color.trim();
  const short = /^#([0-9a-fA-F]{3})$/.exec(raw);
  if (short) {
    const h = short[1];
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  const full = /^#([0-9a-fA-F]{6})$/.exec(raw);
  if (full) {
    return {
      r: parseInt(full[1].slice(0, 2), 16),
      g: parseInt(full[1].slice(2, 4), 16),
      b: parseInt(full[1].slice(4, 6), 16),
    };
  }
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(raw);
  if (rgb) {
    return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  }
  return null;
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const lin = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Returns `#0f172a` or `#ffffff` — whichever has higher contrast vs bg (≥4.5:1 preferred). */
export function contrastTextOn(bg: string): '#0f172a' | '#ffffff' {
  const parsed = parseHex(bg);
  if (!parsed) return '#0f172a';
  const L = relativeLuminance(parsed);
  const dark = '#0f172a';
  const light = '#ffffff';
  const darkL = relativeLuminance({ r: 15, g: 23, b: 42 });
  const lightL = 1;
  const darkRatio = contrastRatio(L, darkL);
  const lightRatio = contrastRatio(L, lightL);
  if (darkRatio >= 4.5 || darkRatio >= lightRatio) return dark;
  return light;
}

/**
 * Soft tinted chip (~12% alpha). Category headers use dark ink on light tints
 * so coloured Settings colours stay on the chip/stripe, not body text.
 */
export function chipStyle(color: string): { backgroundColor: string; color: string; borderColor: string } {
  const base = color || '#4338E8';
  return {
    backgroundColor: `${base}1F`,
    color: '#0f172a',
    borderColor: `${base}55`,
  };
}
