import { useRef, useState } from 'react';
import {
  Download,
  FilePlus2,
  Lock,
  PanelRightClose,
  PanelRightOpen,
  Trash2,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  exportLsoSiteJson,
  LSO_TEMPLATES,
  lsoPagePath,
  type LsoTemplateId,
} from '../../../utils/lsoSiteContent';
import { useLsoSite } from './LsoSiteContext';

export function LsoEditPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    content,
    editing,
    lock,
    setEditing,
    addPage,
    deletePage,
    importJson,
    resetToDefaults,
  } = useLsoSite();
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState<LsoTemplateId>('hero-intro-cta');
  const importRef = useRef<HTMLInputElement>(null);

  if (!editing) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="fixed bottom-5 right-5 z-[70] inline-flex items-center gap-2 rounded-full bg-[#0a1628] px-4 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-95"
        aria-expanded={open}
      >
        {open ? (
          <PanelRightClose className="h-4 w-4" aria-hidden />
        ) : (
          <PanelRightOpen className="h-4 w-4" aria-hidden />
        )}
        {open ? 'Hide panel' : 'Editing panel'}
      </button>

      {open && (
        <aside className="fixed bottom-20 right-5 z-[70] flex max-h-[min(78vh,640px)] w-[min(100%-1.5rem,22rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:bottom-5 sm:right-[11.5rem]">
          <div className="border-b border-slate-100 bg-[#0a1628] px-4 py-3 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/60">
              LSO site editor
            </p>
            <p className="text-sm font-semibold">Pages &amp; publishing</p>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-4 text-sm">
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Add a page
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Choose one of five templates, then edit text and images on the page.
              </p>
              <label className="mt-3 block">
                <span className="mb-1 block text-xs font-medium text-gray-600">Title</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Family concert guide"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                />
              </label>
              <label className="mt-2 block">
                <span className="mb-1 block text-xs font-medium text-gray-600">Template</span>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value as LsoTemplateId)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                >
                  {LSO_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500">
                {LSO_TEMPLATES.find((t) => t.id === template)?.description}
              </p>
              <button
                type="button"
                onClick={() => {
                  const page = addPage(title.trim() || 'Untitled page', template);
                  setTitle('');
                  toast.success(`Created “${page.title}”`);
                  window.location.assign(lsoPagePath(page.slug, true));
                }}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
              >
                <FilePlus2 className="h-4 w-4" aria-hidden />
                Create page
              </button>
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Your pages ({content.pages.length})
              </h3>
              {content.pages.length === 0 ? (
                <p className="mt-2 text-xs text-gray-500">No extra pages yet.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {content.pages.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-start justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2"
                    >
                      <div className="min-w-0">
                        <a
                          href={lsoPagePath(p.slug, true)}
                          className="block truncate text-sm font-semibold text-teal-800 hover:underline"
                        >
                          {p.title}
                        </a>
                        <p className="truncate text-[11px] text-gray-500">
                          {LSO_TEMPLATES.find((t) => t.id === p.template)?.name} · /lso/p/{p.slug}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!window.confirm(`Delete “${p.title}”?`)) return;
                          deletePage(p.id);
                          toast.success('Page deleted');
                          if (window.location.pathname.includes(`/p/${p.slug}`)) {
                            window.location.assign('/lso/edit');
                          }
                        }}
                        className="shrink-0 rounded-md p-1.5 text-red-600 hover:bg-red-50"
                        aria-label={`Delete ${p.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-2 border-t border-gray-100 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Backup
              </h3>
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([exportLsoSiteJson(content)], {
                    type: 'application/json',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `lso-site-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('Exported JSON');
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50"
              >
                <Download className="h-3.5 w-3.5" aria-hidden />
                Export JSON
              </button>
              <input
                ref={importRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  try {
                    const raw = await file.text();
                    importJson(raw);
                    toast.success('Imported site content');
                  } catch {
                    toast.error('Could not import that JSON file');
                  }
                }}
              />
              <button
                type="button"
                onClick={() => importRef.current?.click()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden />
                Import JSON
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!window.confirm('Reset all LSO site edits to defaults?')) return;
                  resetToDefaults();
                  toast.success('Reset to defaults');
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                Reset site content
              </button>
            </section>
          </div>

          <div className="flex gap-2 border-t border-gray-100 p-3">
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                window.location.assign('/lso');
              }}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              View as visitor
            </button>
            <button
              type="button"
              onClick={() => {
                lock();
                onOpenChange(false);
                window.location.assign('/lso');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900"
            >
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Lock
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
