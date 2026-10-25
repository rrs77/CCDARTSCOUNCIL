/**
 * Link URLs allowed in print / share HTML: http(s), same-origin relative paths, ./ and #.
 * A relative path must not start with // or /\ (browsers treat both as a URL to another
 * host). Anything else becomes '#'. Pure module (Node tests); re-exported by sanitize.ts.
 */
const SAFE_URL_PATTERN = /^(https?:\/\/|\/(?![/\\])|\.\/|#)/i;

export function sanitizeUrl(url: string): string {
  if (!url) return '#';
  // Browsers drop tab/newline/control chars from URLs ('/\t/evil.com' is read as '//evil.com'),
  // so strip them before testing and return the cleaned string.
  const trimmed = String(url).replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (SAFE_URL_PATTERN.test(trimmed)) return trimmed;
  return '#';
}
