/**
 * A colour that is safe to put inside a style="" attribute or a <style> block.
 * Only #hex (3–8 digits) or rgb()/rgba()/hsl()/hsla() with simple numeric args are
 * allowed; anything else (e.g. `red;background:url(https://x/..)`) returns `fallback`.
 * Pure module so Node tests and every print/share builder can share it
 * (LessonPrintModal.tsx can reuse it once that edit is approved).
 */
const HEX = /^#[0-9a-fA-F]{3,8}$/;
const NUM = '\\s*-?\\d{1,3}(?:\\.\\d+)?(?:%|deg)?\\s*';
const FUNC = new RegExp(`^(?:rgb|rgba|hsl|hsla)\\((?:${NUM},){2}${NUM}(?:[,/]\\s*(?:0|1|0?\\.\\d+|\\d{1,3}%)\\s*)?\\)$`, 'i');
const FUNC_SPACE = new RegExp(`^(?:rgb|rgba|hsl|hsla)\\(${NUM}${NUM}${NUM}(?:/\\s*(?:0|1|0?\\.\\d+|\\d{1,3}%)\\s*)?\\)$`, 'i');

export function isSafeColour(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  return HEX.test(v) || FUNC.test(v) || FUNC_SPACE.test(v);
}

export function safeColour(value: unknown, fallback: string): string {
  return isSafeColour(value) ? (value as string).trim() : fallback;
}
