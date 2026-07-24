import { ArrowLeft } from 'lucide-react';
import { LSO_TEMPLATES, lsoPagePath } from '../../../utils/lsoSiteContent';
import { useLsoSite } from './LsoSiteContext';
import { LsoTemplateRenderer } from './templates/LsoTemplates';
import { LsoPlainField } from './LsoEditable';

export function LsoCustomPageView({
  pageSlug,
  editing,
}: {
  pageSlug: string;
  editing: boolean;
}) {
  const { getPageBySlug, updatePage, content } = useLsoSite();
  const page = getPageBySlug(pageSlug);
  const templateName = page
    ? LSO_TEMPLATES.find((t) => t.id === page.template)?.name
    : undefined;

  if (!page) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
        <h2 className="text-lg font-semibold text-gray-900">Page not found</h2>
        <p className="mt-2 text-sm text-gray-600">
          No LSO page with slug “{pageSlug}”. It may have been deleted in this browser.
        </p>
        <a
          href={editing ? '/lso/edit' : '/lso'}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-800 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to LSO hub
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <a
          href={editing ? '/lso/edit' : '/lso'}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-800 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          LSO hub
        </a>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {templateName}
          {content.pages.length > 1 && (
            <span className="ml-2 text-gray-400">
              · {content.pages.findIndex((p) => p.id === page.id) + 1} of {content.pages.length}
            </span>
          )}
        </p>
      </div>

      {editing ? (
        <LsoPlainField
          editing
          label="Page title (nav)"
          value={page.title}
          onChange={(title) => updatePage(page.id, { title })}
        />
      ) : (
        <h2 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
          {page.title}
        </h2>
      )}

      <LsoTemplateRenderer
        page={page}
        editing={editing}
        onChange={(patch) => updatePage(page.id, patch)}
      />

      {content.pages.length > 1 && (
        <nav className="flex flex-wrap gap-2 border-t border-gray-200 pt-4">
          {content.pages
            .filter((p) => p.id !== page.id)
            .map((p) => (
              <a
                key={p.id}
                href={lsoPagePath(p.slug, editing)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-teal-300 hover:text-teal-800"
              >
                {p.title}
              </a>
            ))}
        </nav>
      )}
    </div>
  );
}
