import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Maximize2, X } from 'lucide-react';
import { templatePreviewDoc } from '../../utils/lessonTemplates/templatePreviewDoc';
import { cn } from '@/lib/utils';

const origin = () => (typeof window !== 'undefined' && window.location?.origin ? `${window.location.origin}/` : undefined);

/**
 * Sandboxed frame for rendered template HTML (no scripts; links open in a new tab).
 * The HTML is the PDF renderer's own output, already sanitised.
 */
export function TemplatePreviewFrame({
  html,
  pageOne,
  title,
  className,
  testId,
}: {
  html: string;
  pageOne?: boolean;
  title: string;
  className?: string;
  testId?: string;
}) {
  return (
    <iframe
      title={title}
      data-testid={testId}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      srcDoc={templatePreviewDoc(html, { pageOne, baseHref: origin() })}
      className={cn('block w-full border-0 bg-white', className)}
    />
  );
}

/**
 * Page-1 preview shown straight after a template is picked. Updates as the
 * selection changes; "Open full preview" shows every page, "Hide" dismisses it.
 */
export function TemplatePreviewPanel({
  html,
  templateName,
  onOpenFull,
  onDismiss,
  className,
  frameClassName,
  testId = 'template-preview',
}: {
  html: string;
  templateName: string;
  onOpenFull: () => void;
  onDismiss?: () => void;
  className?: string;
  frameClassName?: string;
  testId?: string;
}) {
  return (
    <section
      data-testid={testId}
      aria-label={`Preview of page 1 in the ${templateName} template`}
      className={cn('flex min-w-0 flex-col overflow-hidden rounded-2xl border-2 border-indigo-100 bg-slate-50', className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 bg-white px-3 py-2">
        <p className="flex min-w-0 items-center gap-1.5 text-[13px] font-bold text-slate-800">
          <Eye className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
          <span className="truncate">
            Preview · {templateName} · page 1
          </span>
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenFull}
            data-testid={`${testId}-open-full`}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-indigo-200 bg-white px-3 text-[13px] font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Maximize2 className="h-3.5 w-3.5" aria-hidden />
            Open full preview
          </button>
          {onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              data-testid={`${testId}-hide`}
              className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-[13px] font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Hide preview
            </button>
          ) : null}
        </div>
      </div>
      <div className="min-h-0 flex-1 bg-white">
        <TemplatePreviewFrame
          html={html}
          pageOne
          title={`Page 1 preview, ${templateName} template`}
          testId={`${testId}-frame`}
          className={cn('h-[min(46vh,520px)]', frameClassName)}
        />
      </div>
    </section>
  );
}

/** Full-size preview of every page, over everything (including modals). Esc or Close dismisses it. */
export function TemplatePreviewDialog({
  open,
  html,
  templateName,
  onClose,
}: {
  open: boolean;
  html: string;
  templateName: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    // The opener ("Open full preview"): focus goes back here on Close or Esc.
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Close only this preview, never the modal underneath.
        e.stopPropagation();
        e.preventDefault();
        onCloseRef.current();
      } else if (e.key === 'Tab') {
        // Keep focus on the dialog (only one control) and away from any modal's trap underneath.
        e.stopPropagation();
        e.preventDefault();
        closeRef.current?.focus();
      }
    };
    // Trap: if anything (e.g. a modal underneath) moves focus out of the preview, bring it back.
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as Node | null;
      if (dialogRef.current && t && !dialogRef.current.contains(t)) closeRef.current?.focus();
    };
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('focusin', onFocusIn, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('focusin', onFocusIn, true);
      if (opener && opener.isConnected) {
        opener.focus();
        // Again after paint, in case a modal underneath re-focuses its first control.
        requestAnimationFrame(() => {
          if (opener.isConnected && document.activeElement !== opener) opener.focus();
        });
      }
    };
  }, [open]);
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div ref={dialogRef} className="fixed inset-0 z-[400] flex items-stretch justify-center p-2 sm:p-4" data-testid="template-preview-full">
      <button type="button" aria-label="Close preview" className="absolute inset-0 bg-slate-950/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex w-full max-w-[900px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5">
          <h2 id={titleId} className="text-[15px] font-extrabold text-slate-900">
            Full preview · {templateName}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            data-testid="template-preview-full-close"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border-2 border-slate-200 px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <X className="h-4 w-4" aria-hidden />
            Close
          </button>
        </div>
        <TemplatePreviewFrame html={html} title={`Full preview, ${templateName} template`} className="min-h-0 flex-1" />
      </div>
    </div>,
    document.body,
  );
}
