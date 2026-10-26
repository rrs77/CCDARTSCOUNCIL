import React, { useEffect, useId, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  offlinePolishBodies,
  preferOfflineDemoAi,
  sleepOfflineThink,
} from '../../utils/planner/offlineDemoAi';

export type PolishSuggestionId = 'sequence' | 'objectives' | 'differentiation';

export function polishSuggestionsFor(lessonTitle?: string): {
  id: PolishSuggestionId;
  title: string;
  body: string;
  defaultOn: boolean;
}[] {
  const canned = offlinePolishBodies(lessonTitle);
  return [
    {
      id: 'sequence',
      title: 'Improve the learning sequence',
      body: canned.sequence.replace(/^Polish · sequence:\s*/i, ''),
      defaultOn: true,
    },
    {
      id: 'objectives',
      title: 'Make the success statements clearer',
      body: canned.objectives.replace(/^Polish · success:\s*/i, ''),
      defaultOn: true,
    },
    {
      id: 'differentiation',
      title: 'Offer differentiation ideas',
      body: canned.differentiation.replace(/^Polish · inclusion:\s*/i, ''),
      defaultOn: false,
    },
  ];
}

export const POLISH_SUGGESTIONS = polishSuggestionsFor();

/**
 * Polish with AI — live path unchanged for real users with API;
 * offline/demo applies scripted suggestions into the lesson draft (with a short think delay).
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
  onAccept: (ids: PolishSuggestionId[]) => void | Promise<void>;
}) {
  const titleId = useId();
  const suggestions = polishSuggestionsFor(lessonTitle);
  const [selected, setSelected] = useState<Record<PolishSuggestionId, boolean>>({
    sequence: true,
    objectives: true,
    differentiation: false,
  });
  const [busy, setBusy] = useState(false);
  const offline = preferOfflineDemoAi();

  useEffect(() => {
    if (!open) return;
    setSelected({
      sequence: true,
      objectives: true,
      differentiation: false,
    });
    setBusy(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const accept = async () => {
    const ids = suggestions.map((s) => s.id).filter((id) => selected[id]);
    if (ids.length === 0) {
      toast('Select at least one suggestion, or keep the original.');
      return;
    }
    setBusy(true);
    try {
      await sleepOfflineThink();
      await onAccept(ids);
      onClose();
      toast.success(
        offline
          ? `Applied ${ids.length} polish suggestion${ids.length === 1 ? '' : 's'} (offline demo AI).`
          : `Applied ${ids.length} polish suggestion${ids.length === 1 ? '' : 's'} to this draft.`,
      );
    } finally {
      setBusy(false);
    }
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
            <p className="text-[13px] font-extrabold uppercase tracking-wide text-[var(--ss-indigo,#4338E8)]">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                {offline ? 'Polish with AI · offline demo' : 'Polish with AI'}
              </span>
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
          {suggestions.map((row) => (
            <label
              key={row.id}
              className="flex cursor-pointer items-start gap-3 rounded-[13px] border border-[#ded9ff] bg-[#f7f6ff] p-4"
            >
              <input
                type="checkbox"
                checked={selected[row.id]}
                onChange={(e) => setSelected((s) => ({ ...s, [row.id]: e.target.checked }))}
                className="mt-1 accent-[var(--ss-indigo,#4338E8)]"
                disabled={busy}
              />
              <span>
                <strong className="block text-[13px] text-[var(--ss-ink,#1F1B4D)]">{row.title}</strong>
                <span className="mt-1 block text-[13px] leading-relaxed text-[#726d99]">{row.body}</span>
              </span>
            </label>
          ))}
          <p className="text-[13px] text-[var(--ss-muted,#77738F)]">
            {offline
              ? 'Offline demo AI — no network call and no tokens. Suggestions never change Hub attribution, licences, or timetable dates.'
              : 'Suggestions never change Hub attribution, licences, resource text, or timetable dates.'}
          </p>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              className="inline-flex h-10 items-center rounded-xl border border-[var(--ss-line,#E2E0EF)] bg-white px-4 text-[13px] font-bold text-[var(--ss-ink,#1F1B4D)]"
              onClick={onClose}
              disabled={busy}
            >
              Keep original
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[var(--ss-indigo,#4338E8)] px-4 text-[13px] font-bold text-white disabled:opacity-60"
              onClick={() => void accept()}
              disabled={busy}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {busy ? 'Thinking…' : 'Accept selected suggestions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Scripted draft patches — used for offline demo and until a live polish endpoint is approved. */
export function buildPolishNotePatches(ids: PolishSuggestionId[], lessonTitle?: string): string[] {
  const canned = offlinePolishBodies(lessonTitle);
  const parts: string[] = [];
  if (ids.includes('sequence')) parts.push(canned.sequence);
  if (ids.includes('objectives')) parts.push(canned.objectives);
  if (ids.includes('differentiation')) parts.push(canned.differentiation);
  return parts;
}
