/**
 * The shared HTML escape for text interpolated into print / share / PDF HTML strings
 * (class names, school names, titles, notes, labels, attribute values).
 * Pure module (no DOM, no DOMPurify) so Node tests and builders can import it.
 * Re-exported from utils/sanitize.ts as before.
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtmlText(text: unknown): string {
  if (text === null || text === undefined || text === '') return '';
  return String(text).replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch] ?? ch);
}
