import React, { useEffect, useId, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export type PolishSuggestionId = 'sequence' | 'objectives' | 'differentiation';

export const POLISH_SUGGESTIONS: {
  id: PolishSuggestionId;
  title: string;
  body: string;
  defaultOn: boolean;
}[] = [
  {
    id: 'sequence',
    title: 'Improve the learning sequence',
    body: 'Move from a playful warm-up to practical exploration, a shared performance and a short reflection.',
    defaultOn: true,
  },
  {
    id: 'objectives',
    title: 'Make the success statements clearer',
    body: 'Use concise, child-friendly “I can…” statements linked to the learning taking place.',
    defaultOn: true,
  },
  {
    id: 'differentiation',
    title: 'Offer differentiation ideas',
    body: 'Add a scaffold for new learners and a creative extension for pupils ready for more.',
    defaultOn: false,
  },
];

/**
 * Preview-only Polish with AI UX. No model calls / token spend.
 * On accept, callers apply scripted suggestions to the open lesson draft only.
 */
export function PolishWithAIModal({
  open,
  lessonTitle,
  onClose,
  onAccept,
}: {
  open: boolean;
  lessonTitle?: string;
  onClose: () => void;
  /** Called with the selected suggestion ids when the teacher confirms. */
  onAccept: (ids: PolishSuggestionId[]) => void;
}) {
  const titleId = useId();
  const [selected, setSelected] = useState<Record<PolishSuggestionId, boolean>>({
    sequence: true,
    objectives: true,
    differentiation: false,
  });

  useEffect(() => {
    if (!open) return;
    setSelected({
      sequence: true,
      objectives: true,
      differentiation: false,
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const accept = () => {
    const ids = POLISH_SUGGESTIONS.map((s) => s.id).filter((id) => selected[id]);
    if (ids.length === 0) {
      toast('Select at least one suggestion, or keep the original.');
      return;
    }
    onAccept(ids);
    onClose();
    toast.success(
      `Applied ${ids.length} polish suggestion${ids.length === 1 ? '' : 's'} to this draft (preview — no AI call).`,
    );
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="presentation">
      <button type="button" className="absolute inset-0 bg-[rgba(21,18,51,0.38)]" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[71] max-h-[min(90vh,840px)] w-full max-w-[585px] overflow-auto rounded-[23px] bg-white shadow-[0_25px_90px_rgba(31,27,77,0.33)]"
      >
        <div className="flex items-start justify-between gap-3 px-6 pb-3 pt-6">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--ss-indigo,#4338E8)]">
              ✦ Polish with AI · design preview
            </p>
            <h2
              id={titleId}
              className="mt-2 text-[28px] font-extrabold tracking-tight text-[var(--ss-ink,#1F1B4D)]"
              style={{ fontFamily: 'var(--ss-font-display, ui-sans-serif, system-ui, sans-serif)' }}
            >
              A thoughtful second look
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--ss-muted,#77738F)]">
              Ideas for <strong className="text-[var(--ss-ink,#1F1B4D)]">{lessonTitle || 'this lesson'}</strong>. Your
              original stays untouched until you accept. Drag-and-drop activities are unchanged unless you accept a
              sequence suggestion.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--ss-line,#E2E0EF)]"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 px-6 pb-6">
          {POLISH_SUGGESTIONS.map((row) => (
            <label
              key={row.id}
              className="flex cursor-pointer items-start gap-3 rounded-[13px] border border-[#ded9ff] bg-[#f7f6ff] p-4"
            >
              <input
                type="checkbox"
                checked={selected[row.id]}
                onChange={(e) => setSelected((s) => ({ ...s, [row.id]: e.target.checked }))}
                className="mt-1 accent-[var(--ss-indigo,#4338E8)]"
              />
              <span>
                <strong className="block text-[13px] text-[var(--ss-ink,#1F1B4D)]">{row.title}</strong>
                <span className="mt-1 block text-[12px] leading-relaxed text-[#726d99]">{row.body}</span>
              </span>
            </label>
          ))}
          <p className="text-[10px] text-[var(--ss-muted,#77738F)]">
            No AI service is called and no tokens are spent. Suggestions never change Hub attribution, licences, resource
            text, or timetable dates.
          </p>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              className="inline-flex h-10 items-center rounded-xl border border-[var(--ss-line,#E2E0EF)] bg-white px-4 text-xs font-bold text-[var(--ss-ink,#1F1B4D)]"
              onClick={onClose}
            >
              Keep original
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center rounded-xl bg-[var(--ss-indigo,#4338E8)] px-4 text-xs font-bold text-white"
              onClick={accept}
            >
              Accept selected suggestions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Scripted draft patches — used until a real AI endpoint is approved. */
export function buildPolishNotePatches(ids: PolishSuggestionId[]): string[] {
  const parts: string[] = [];
  if (ids.includes('sequence')) {
    parts.push(
      'Polish · sequence: Warm-up → explore → share/perform → short reflection. Reorder activities in the builder if needed (drag and drop still works).',
    );
  }
  if (ids.includes('objectives')) {
    parts.push(
      'Polish · success: Prefer clear “I can…” statements tied to what pupils actually do in this lesson.',
    );
  }
  if (ids.includes('differentiation')) {
    parts.push(
      'Polish · inclusion: Scaffold for new learners; offer a creative extension for those ready for more.',
    );
  }
  return parts;
}
