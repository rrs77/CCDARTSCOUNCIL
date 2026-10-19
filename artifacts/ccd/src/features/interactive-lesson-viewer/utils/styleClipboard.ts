/** Copy/paste colours and whole text styles between overlays. */

import type { TextOverlay } from '../types';

const COLOR_KEY = 'ccd-ilv-copied-color-v1';
const STYLE_KEY = 'ccd-ilv-copied-text-style-v1';

export type CopiedTextStyle = Pick<
  TextOverlay,
  | 'color'
  | 'boxBackground'
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'fontStyle'
  | 'textDecoration'
  | 'textTransform'
  | 'textAlign'
  | 'letterSpacing'
  | 'lineHeight'
  | 'opacity'
  | 'effects'
  | 'animation'
  | 'style'
>;

export function copyColorToClipboard(color: string): void {
  try {
    localStorage.setItem(COLOR_KEY, color);
  } catch {
    /* ignore */
  }
  void navigator.clipboard?.writeText(color).catch(() => undefined);
}

export function peekCopiedColor(): string | null {
  try {
    return localStorage.getItem(COLOR_KEY);
  } catch {
    return null;
  }
}

export async function pasteColorFromClipboard(): Promise<string | null> {
  try {
    const clip = await navigator.clipboard?.readText();
    if (clip && /^#|^rgba?\(/i.test(clip.trim())) return clip.trim();
  } catch {
    /* fall through */
  }
  return peekCopiedColor();
}

export function copyTextStyle(overlay: TextOverlay): CopiedTextStyle {
  const style: CopiedTextStyle = {
    color: overlay.color,
    boxBackground: overlay.boxBackground,
    fontFamily: overlay.fontFamily,
    fontSize: overlay.fontSize,
    fontWeight: overlay.fontWeight,
    fontStyle: overlay.fontStyle,
    textDecoration: overlay.textDecoration,
    textTransform: overlay.textTransform,
    textAlign: overlay.textAlign,
    letterSpacing: overlay.letterSpacing,
    lineHeight: overlay.lineHeight,
    opacity: overlay.opacity,
    effects: overlay.effects ? { ...overlay.effects } : undefined,
    animation: overlay.animation ? { ...overlay.animation } : undefined,
    style: overlay.style,
  };
  try {
    localStorage.setItem(STYLE_KEY, JSON.stringify(style));
  } catch {
    /* ignore */
  }
  return style;
}

export function peekCopiedTextStyle(): CopiedTextStyle | null {
  try {
    const raw = localStorage.getItem(STYLE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CopiedTextStyle;
  } catch {
    return null;
  }
}

export function applyCopiedTextStyle(overlay: TextOverlay, style: CopiedTextStyle): Partial<TextOverlay> {
  return { ...style };
}
