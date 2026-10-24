/**
 * Sanitised rich-text display — same path as ActivityDetailsModal / UnitViewer.
 */
import { sanitizeHtml } from '../../utils/sanitize';
import { cn } from '@/lib/utils';

/** Prepare stored activity/section HTML (or plain text) for safe rendering. */
export function formatRichTextHtml(text: string | undefined | null): string {
  if (!text) return '';
  const raw = String(text);
  if (raw.includes('<')) return sanitizeHtml(raw);
  return sanitizeHtml(raw.replace(/\n/g, '<br>'));
}

export function RichHtml({
  html,
  className,
  empty = '—',
}: {
  html?: string | null;
  className?: string;
  empty?: string;
}) {
  const prepared = formatRichTextHtml(html);
  if (!prepared.trim()) {
    return <p className={cn('text-sm text-slate-400', className)}>{empty}</p>;
  }
  return (
    <div
      className={cn(
        'prose prose-sm max-w-none text-slate-700',
        'prose-p:my-2 prose-p:leading-relaxed',
        'prose-strong:font-bold prose-em:italic',
        'prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5',
        'prose-headings:mb-2 prose-headings:mt-3 prose-headings:font-extrabold',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: prepared }}
    />
  );
}
