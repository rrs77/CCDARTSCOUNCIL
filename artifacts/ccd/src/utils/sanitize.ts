import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'span', 'div',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'hr',
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel',
  'class', 'id',
  'dir',
  'colspan', 'rowspan',
];

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('rel', 'noopener noreferrer');
    if (!node.getAttribute('target')) {
      node.setAttribute('target', '_blank');
    }
  }
});

export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return String(DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  }));
}

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtmlText(text: string): string {
  if (!text) return '';
  return String(text).replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch] ?? ch);
}

const SAFE_URL_PATTERN = /^(https?:\/\/|\/|\.\/|#)/i;

export function sanitizeUrl(url: string): string {
  if (!url) return '#';
  const trimmed = url.trim();
  if (SAFE_URL_PATTERN.test(trimmed)) return trimmed;
  return '#';
}

/** LSO partner site HTML — allows inline images (https or data:image). */
export function sanitizeLsoHtml(html: string): string {
  if (!html) return '';
  return String(
    DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [...ALLOWED_TAGS, 'img'],
      ALLOWED_ATTR: [...ALLOWED_ATTR, 'src', 'alt', 'width', 'height', 'style'],
      ALLOW_DATA_ATTR: false,
      ALLOWED_URI_REGEXP:
        /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|data:image\/(?:png|jpeg|jpg|gif|webp);base64,|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    }),
  );
}
