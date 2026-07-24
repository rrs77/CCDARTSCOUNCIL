import { sanitizeLsoHtml } from '../../../utils/sanitize';

/** Safe HTML render for LSO partner site fields. */
export function LsoHtml({
  html,
  className = '',
}: {
  html: string;
  className?: string;
}) {
  if (!html?.trim()) return null;
  return (
    <div
      className={`lso-prose prose prose-sm max-w-none text-gray-700 prose-a:text-teal-700 prose-headings:text-gray-900 ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeLsoHtml(html) }}
    />
  );
}
