import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import type { Activity } from '../../contexts/DataContext';
import { useData } from '../../contexts/DataContext';
import { loadPlannerCurriculum } from '../../utils/planner/plannerCurriculumStore';
import { ModalBody, ModalFooter, ModalHeader, ModalShell } from './ModalShell';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'overview', label: 'Overview' },
  { id: 'curriculum', label: 'Curriculum' },
  { id: 'how', label: 'How to run it' },
  { id: 'resources', label: 'Resources' },
  { id: 'assessment', label: 'Assessment' },
] as const;

type StepId = (typeof STEPS)[number]['id'];

export function ActivityStepsModal({
  open,
  activity,
  onClose,
  onAddToLesson,
}: {
  open: boolean;
  activity: Activity | null;
  onClose: () => void;
  onAddToLesson?: (activity: Activity) => void;
}) {
  const { updateActivity } = useData();
  const titleId = useId();
  const [stepIndex, setStepIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Activity | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const curriculum = useMemo(() => loadPlannerCurriculum(), [open]);

  useEffect(() => {
    if (open && activity) {
      setDraft({ ...activity });
      setStepIndex(0);
      setEditing(false);
    }
  }, [open, activity]);

  if (!activity || !draft) {
    return (
      <ModalShell open={false} onClose={onClose} labelledBy={titleId}>
        <span />
      </ModalShell>
    );
  }

  const step = STEPS[stepIndex];
  const selectedStatementIds = new Set(draft.customObjectives || draft.standards || []);

  const autosave = async (next: Activity) => {
    setDraft(next);
    try {
      if (updateActivity && (next.id || next._id)) {
        await updateActivity(next);
        setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch {
      /* keep draft local if save fails */
    }
  };

  const patch = (partial: Partial<Activity>) => {
    const next = { ...draft, ...partial };
    void autosave(next);
  };

  return (
    <ModalShell open={open} onClose={onClose} labelledBy={titleId}>
      <ModalHeader
        title={draft.activity || 'Activity'}
        subtitle={`${draft.time || 0} min · ${draft.category || 'Uncategorised'}`}
        onClose={onClose}
        titleId={titleId}
      >
        <div className="mt-3 flex flex-wrap gap-1">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStepIndex(i)}
              className={cn(
                'h-9 rounded-full px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
                i === stepIndex
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </ModalHeader>

      <ModalBody>
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
            {step.label}
          </p>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="h-9 rounded-full px-3 text-xs font-bold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>

        {step.id === 'overview' && (
          <FieldBlock
            editing={editing}
            label="Description"
            value={draft.description || ''}
            onChange={(v) => patch({ description: v })}
          />
        )}
        {step.id === 'curriculum' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              From your curriculum in Settings. Only statements you have set up appear here.
            </p>
            {curriculum.statements.length === 0 ? (
              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                No curriculum statements yet.{' '}
                <a href="/settings/curriculum" className="font-bold underline">
                  Open Settings → Curriculum
                </a>
              </p>
            ) : (
              <ul className="space-y-2">
                {curriculum.statements.map((st) => {
                  const checked = selectedStatementIds.has(st.id);
                  return (
                    <li key={st.id}>
                      <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border border-slate-100 px-3 py-2 hover:bg-indigo-50/40">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4"
                          checked={checked}
                          disabled={!editing}
                          onChange={() => {
                            const current = new Set(draft.customObjectives || []);
                            if (checked) current.delete(st.id);
                            else current.add(st.id);
                            patch({ customObjectives: [...current], curriculumType: 'CUSTOM' });
                          }}
                        />
                        <span className="text-sm text-slate-700">{st.text}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
        {step.id === 'how' && (
          <FieldBlock
            editing={editing}
            label="How to run it"
            value={draft.activityText || draft.htmlDescription || ''}
            onChange={(v) => patch({ activityText: v })}
          />
        )}
        {step.id === 'resources' && (
          <div className="space-y-3">
            {(
              [
                ['videoLink', 'Video'],
                ['musicLink', 'Music'],
                ['resourceLink', 'Resource'],
                ['link', 'Link'],
                ['imageLink', 'Image'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {label}
                </span>
                {editing ? (
                  <input
                    value={(draft[key] as string) || ''}
                    onChange={(e) => patch({ [key]: e.target.value })}
                    className="h-11 w-full rounded-2xl border border-indigo-100 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  />
                ) : (
                  <p className="text-sm text-slate-700">
                    {(draft[key] as string) || '—'}
                  </p>
                )}
              </label>
            ))}
          </div>
        )}
        {step.id === 'assessment' && (
          <FieldBlock
            editing={editing}
            label="Assessment notes"
            value={draft.notes || ''}
            onChange={(v) => patch({ notes: v })}
          />
        )}
      </ModalBody>

      <ModalFooter>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous step"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-indigo-100 text-indigo-700 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next step"
            disabled={stepIndex >= STEPS.length - 1}
            onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-indigo-100 text-indigo-700 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          {savedAt ? (
            <span className="ml-2 text-xs font-medium text-emerald-600">Saved {savedAt}</span>
          ) : null}
        </div>
        {onAddToLesson ? (
          <button
            type="button"
            onClick={() => {
              onAddToLesson(draft);
              onClose();
            }}
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Plus className="h-4 w-4" />
            Add to lesson
          </button>
        ) : null}
      </ModalFooter>
    </ModalShell>
  );
}

function FieldBlock({
  editing,
  label,
  value,
  onChange,
}: {
  editing: boolean;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {editing ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={8}
          className="w-full resize-y rounded-2xl border border-indigo-100 bg-indigo-50/30 px-3.5 py-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus-visible:ring-2 focus-visible:ring-indigo-400"
        />
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {value || '—'}
        </p>
      )}
    </label>
  );
}
