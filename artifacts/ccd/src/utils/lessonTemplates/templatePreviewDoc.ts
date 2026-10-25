/**
 * Wraps rendered template HTML (renderLessonTemplateHtml, the same output the
 * PDF uses) in a standalone document for an on-screen preview <iframe srcdoc>.
 *
 * pageOne: hide everything from the first page break on ("Lesson sequence •
 * continued" or the Reference page), so the frame shows page 1 of the plan.
 * Text keeps its real size (13px or more); the frame is a smaller window onto
 * the page rather than a shrunk copy.
 */
export function templatePreviewDoc(html: string, opts: { pageOne?: boolean; baseHref?: string } = {}): string {
  const base = opts.baseHref ? `<base href="${opts.baseHref.replace(/"/g, '&quot;')}" target="_blank">` : '<base target="_blank">';
  const pageOneCss = opts.pageOne
    ? '.rx-cont,.rx-cont~*,.rx-ref,.rx-ref~*{display:none!important}'
    : '.rx-cont,.rx-ref{margin-top:28px;padding-top:20px;border-top:2px dashed #d4d4d8}';
  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    base +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    `<style>html,body{margin:0;background:#fff}body{padding:18px 22px 28px}${pageOneCss}</style>` +
    `</head><body>${html}</body></html>`
  );
}
