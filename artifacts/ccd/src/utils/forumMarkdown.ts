import DOMPurify from 'dompurify';

/**
 * Client-side Markdown → sanitised HTML.
 * Server already sanitises on write; this is defence-in-depth for display.
 * Uses DOMPurify (Apache-2.0 / MPL-2.0) — see docs/FORUM_LICENCES.md.
 */
export function renderForumMarkdown(md: string): string {
  if (!md) return '';
  // Prefer server-rendered body_html when available; this path is for drafts/previews.
  let text = md.replace(/\r\n/g, '\n').slice(0, 50_000);
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const blocks: string[] = [];
  text = text.replace(/```([\s\S]*?)```/g, (_, code: string) => {
    const i = blocks.length;
    blocks.push(`<pre><code>${escape(code.replace(/^\n/, ''))}</code></pre>`);
    return `\0BLOCK${i}\0`;
  });
  text = text.replace(/`([^`\n]+)`/g, (_, code: string) => `<code>${escape(code)}</code>`);
  text = escape(text)
    .replace(/&lt;code&gt;/g, '<code>')
    .replace(/&lt;\/code&gt;/g, '</code>');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label: string, url: string) => {
    const u = url.trim();
    if (!/^(https?:\/\/|mailto:)/i.test(u)) return escape(label);
    return `<a href="${u.replace(/"/g, '')}" rel="noopener noreferrer nofollow" target="_blank">${label}</a>`;
  });
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  text = text.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  text = text.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  text = text.replace(/^(?:- |\* )(.+)$/gm, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  text = text
    .split(/\n{2,}/)
    .map((para) => {
      const t = para.trim();
      if (!t) return '';
      if (/^<(h[2-6]|ul|pre)/.test(t)) return t;
      return `<p>${t.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');
  text = text.replace(/\0BLOCK(\d+)\0/g, (_, i) => blocks[Number(i)] || '');

  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'ul',
      'ol',
      'li',
      'a',
      'h2',
      'h3',
      'h4',
      'blockquote',
      'code',
      'pre',
    ],
    ALLOWED_ATTR: ['href', 'rel', 'target'],
  });
}

export function sanitizeStoredHtml(html: string): string {
  return DOMPurify.sanitize(html || '', {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'ul',
      'ol',
      'li',
      'a',
      'h2',
      'h3',
      'h4',
      'blockquote',
      'code',
      'pre',
    ],
    ALLOWED_ATTR: ['href', 'rel', 'target'],
  });
}
