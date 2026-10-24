/**
 * Stepped activity card — visual port of planner-mock ActivityCardModal,
 * wired to real Activity + updateActivity + Settings curriculum store.
 */
import { ChevronLeft, ChevronRight, Music2, Undo2 } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Activity } from '../../contexts/DataContext';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContextNew';
import { loadPlannerCurriculum } from '../../utils/planner/plannerCurriculumStore';
import { cn } from '@/lib/utils';
import {
  Button,
  CloseX,
  Field,
  ModalShell,
  Pill,
  SavedBadge,
  TextInput,
} from './ui';

const STEPS = [
  { id: 'overview', label: 'Overview' },
  { id: 'curriculum', label: 'Curriculum' },
  { id: 'how', label: 'How to run it' },
  { id: 'resources', label: 'Resources' },
  { id: 'assessment', label: 'Assessment' },
] as const;

type StepId = (typeof STEPS)[number]['id'];

type DraftContent = {
  description: string;
  learningOutcome: string;
  howToRun: string;
  resources: string;
  assessment: string;
  curriculumIds: string[];
};

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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
  const { getCategoryColor } = useSettings();
  const titleId = useId();
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftContent | null>(null);
  const [undoStack, setUndoStack] = useState<DraftContent[]>([]);
  const snapshotRef = useRef<DraftContent | null>(null);
  const curriculumStore = useMemo(() => loadPlannerCurriculum(), [open]);

  useEffect(() => {
    if (!open || !activity) return;
    const next: DraftContent = {
      description: activity.description || '',
      learningOutcome: '',
      howToRun: activity.activityText || activity.htmlDescription || '',
      resources: [activity.videoLink, activity.musicLink, activity.resourceLink, activity.link]
        .filter(Boolean)
        .join('\n'),
      assessment: activity.notes || '',
      curriculumIds: [...(activity.customObjectives || activity.standards || [])],
    };
    setDraft(next);
    snapshotRef.current = next;
    setUndoStack([]);
    setStep(0);
    setEditing(false);
    setSavedAt(null);
  }, [open, activity]);

  useEffect(() => {
    if (!editing || !activity || !draft) return;
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const nextActivity: Activity = {
            ...activity,
            description: draft.description,
            activityText: draft.howToRun,
            notes: draft.assessment,
            customObjectives: draft.curriculumIds,
            curriculumType: 'CUSTOM',
          };
          if (updateActivity && (activity.id || activity._id)) {
            await updateActivity(nextActivity);
          }
          setSavedAt(formatTime());
        } catch {
          /* keep local draft */
        }
      })();
    }, 450);
    return () => window.clearTimeout(t);
  }, [draft, editing, activity, updateActivity]);

  if (!open || !activity || !draft) {
    return <ModalShell open={false} onClose={onClose} labelledBy={titleId}><span /></ModalShell>;
  }

  const stepId: StepId = STEPS[step].id;
  const color = getCategoryColor?.(activity.category) || '#4338E8';

  const statements = curriculumStore.statements.filter((st) => {
    const strand = curriculumStore.strands.find((s) => s.id === st.strandId);
    if (!strand) return true;
    // Prefer statements for matching subject/category when strand is scoped
    if (!strand.subjectId) return true;
    return (
      strand.subjectId.toLowerCase() === (activity.category || '').toLowerCase() ||
      curriculumStore.strands.length > 0
    );
  });

  const pushUndo = () => {
    if (snapshotRef.current) setUndoStack((s) => [...s.slice(-19), snapshotRef.current!]);
    snapshotRef.current = draft;
  };

  return (
    <ModalShell open={open} onClose={onClose} labelledBy={titleId}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-indigo-50 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ backgroundColor: color }}
          >
            <Music2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="line-clamp-2 text-lg font-extrabold text-slate-900" title={activity.activity}>
              {activity.activity}
            </h2>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Pill color={color}>{activity.category || 'Activity'}</Pill>
              <Pill className="bg-slate-100 text-slate-600">{activity.time || 0} min</Pill>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex min-h-[44px] items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
            Edit
            <button
              type="button"
              role="switch"
              aria-checked={editing}
              onClick={() => {
                if (!editing) pushUndo();
                setEditing((v) => !v);
              }}
              className={cn(
                'relative h-5 w-9 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
                editing ? 'bg-indigo-600' : 'bg-indigo-200',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition',
                  editing ? 'left-4' : 'left-0.5',
                )}
              />
            </button>
          </label>
          {onAddToLesson ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onAddToLesson({
                  ...activity,
                  description: draft.description,
                  activityText: draft.howToRun,
                  notes: draft.assessment,
                  customObjectives: draft.curriculumIds,
                });
                onClose();
              }}
            >
              Add to lesson
            </Button>
          ) : null}
          <CloseX onClick={onClose} />
        </div>
      </div>

      <div className="px-5 pt-4">
        <div className="relative mx-auto flex max-w-xl items-center justify-between">
          <div className="absolute left-4 right-4 top-4 h-0.5 bg-indigo-100" />
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(i)}
              className="relative z-10 flex min-h-[44px] flex-col items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition',
                  i === step
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : i < step
                      ? 'bg-indigo-200 text-indigo-800'
                      : 'bg-white text-slate-400 ring-2 ring-indigo-100',
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  'hidden text-[10px] font-semibold sm:block',
                  i === step
                    ? 'text-indigo-700 underline decoration-2 underline-offset-4'
                    : 'text-slate-400',
                )}
              >
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="soft-scroll relative min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <button
          type="button"
          aria-label="Previous step"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
          className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-indigo-600 shadow-md ring-1 ring-indigo-100 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next step"
          disabled={step === STEPS.length - 1}
          onClick={() => setStep((s) => s + 1)}
          className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-indigo-600 shadow-md ring-1 ring-indigo-100 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="mx-auto max-w-lg space-y-4 px-8">
          {stepId === 'overview' ? (
            <>
              <Field label="Description">
                <TextInput
                  rows={4}
                  readOnly={!editing}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </Field>
              <Field label="Learning outcome">
                <TextInput
                  rows={3}
                  readOnly={!editing}
                  value={draft.learningOutcome}
                  onChange={(e) => setDraft({ ...draft, learningOutcome: e.target.value })}
                />
              </Field>
            </>
          ) : null}

          {stepId === 'curriculum' ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                From your curriculum in Settings
              </p>
              {statements.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-6 text-center text-sm text-slate-500">
                  No statements yet.{' '}
                  <a href="/settings/curriculum" className="font-bold text-indigo-700 underline">
                    Add frameworks, strands and statements in Settings
                  </a>
                  .
                </p>
              ) : null}
              {statements.map((c) => {
                const strand = curriculumStore.strands.find((s) => s.id === c.strandId);
                const framework = curriculumStore.frameworks.find(
                  (f) => f.id === strand?.frameworkId,
                );
                const checked = draft.curriculumIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={cn(
                      'flex min-h-[44px] cursor-pointer gap-3 rounded-2xl border p-3 text-sm transition',
                      checked
                        ? 'border-indigo-200 bg-indigo-50/60'
                        : 'border-slate-100 bg-white',
                      !editing && 'pointer-events-none opacity-90',
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={checked}
                      disabled={!editing}
                      onChange={(e) => {
                        const ids = e.target.checked
                          ? [...draft.curriculumIds, c.id]
                          : draft.curriculumIds.filter((id) => id !== c.id);
                        setDraft({ ...draft, curriculumIds: ids });
                      }}
                    />
                    <span className="min-w-0">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-indigo-500">
                        {framework?.name}
                        {strand ? ` · ${strand.name}` : ''}
                      </span>
                      <span className="leading-relaxed text-slate-700">{c.text}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          ) : null}

          {stepId === 'how' ? (
            <Field label="How to run it">
              <TextInput
                rows={8}
                readOnly={!editing}
                value={draft.howToRun}
                onChange={(e) => setDraft({ ...draft, howToRun: e.target.value })}
              />
            </Field>
          ) : null}

          {stepId === 'resources' ? (
            <Field label="Resources" hint="One URL or note per line">
              <TextInput
                rows={6}
                readOnly={!editing}
                value={draft.resources}
                onChange={(e) => setDraft({ ...draft, resources: e.target.value })}
              />
            </Field>
          ) : null}

          {stepId === 'assessment' ? (
            <Field label="Assessment">
              <TextInput
                rows={6}
                readOnly={!editing}
                value={draft.assessment}
                onChange={(e) => setDraft({ ...draft, assessment: e.target.value })}
              />
            </Field>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-indigo-50 px-5 py-3">
        <SavedBadge time={savedAt} />
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-400">
            {step + 1} of {STEPS.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={undoStack.length === 0}
            onClick={() => {
              const prev = undoStack[undoStack.length - 1];
              if (!prev) return;
              setUndoStack((s) => s.slice(0, -1));
              setDraft(prev);
              setSavedAt(formatTime());
            }}
          >
            <Undo2 className="h-3.5 w-3.5" />
            Undo
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
