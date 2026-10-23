import {
  ChevronLeft,
  ChevronRight,
  Music2,
  Undo2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn, formatTime } from "@/lib/utils";
import { usePlanner } from "@/store";
import {
  Button,
  CloseX,
  Field,
  ModalShell,
  Pill,
  SavedBadge,
  TextInput,
} from "../ui";

const STEPS = [
  { id: "overview", label: "Overview" },
  { id: "curriculum", label: "Curriculum" },
  { id: "how", label: "How to run it" },
  { id: "resources", label: "Resources" },
  { id: "assessment", label: "Assessment" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export function ActivityCardModal({
  activityId,
  open,
  onClose,
  onAddToLesson,
}: {
  activityId: string | null;
  open: boolean;
  onClose: () => void;
  onAddToLesson: (id: string) => void;
}) {
  const { state, getActivity, getSubject, dispatch, snapshot, undo } = usePlanner();
  const activity = activityId ? getActivity(activityId) : undefined;
  const subject = activity ? getSubject(activity.subjectId) : undefined;

  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(state.lastSavedAt);
  const [draft, setDraft] = useState(activity?.content);

  useEffect(() => {
    if (activity) {
      setDraft(activity.content);
      setStep(0);
      setEditing(false);
    }
  }, [activity?.id]);

  useEffect(() => {
    if (!editing || !activity || !draft) return;
    const t = window.setTimeout(() => {
      snapshot();
      dispatch({
        type: "UPDATE_ACTIVITY",
        id: activity.id,
        content: draft,
      });
      setSavedAt(formatTime());
    }, 450);
    return () => window.clearTimeout(t);
  }, [draft, editing]);

  const stepId: StepId = STEPS[step].id;

  const curriculum = useMemo(() => {
    if (!activity) return [];
    return state.settings.curriculum.filter(
      (c) =>
        c.subjectId === activity.subjectId &&
        (activity.content.curriculumIds.includes(c.id) ||
          c.keyStage === state.keyStage),
    );
  }, [activity, state.settings.curriculum, state.keyStage]);

  if (!open || !activity || !draft || !subject) {
    return null;
  }

  return (
    <ModalShell open={open} onClose={onClose} wide className="max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-indigo-50 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ backgroundColor: subject.color }}
          >
            <Music2 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">{activity.title}</h2>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Pill color={subject.color}>{subject.name}</Pill>
              <Pill className="bg-indigo-50 text-indigo-700">{state.keyStage}</Pill>
              <Pill className="bg-slate-100 text-slate-600">{activity.durationMin} min</Pill>
              <Pill className="bg-violet-50 text-violet-700">{activity.content.grouping}</Pill>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
            Edit
            <button
              type="button"
              role="switch"
              aria-checked={editing}
              onClick={() => {
                if (!editing) snapshot();
                setEditing((v) => !v);
              }}
              className={cn(
                "relative h-5 w-9 rounded-full transition",
                editing ? "bg-indigo-600" : "bg-indigo-200",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition",
                  editing ? "left-4" : "left-0.5",
                )}
              />
            </button>
          </label>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onAddToLesson(activity.id);
              onClose();
            }}
          >
            Add to lesson
          </Button>
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
              className="relative z-10 flex flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition",
                  i === step
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : i < step
                      ? "bg-indigo-200 text-indigo-800"
                      : "bg-white text-slate-400 ring-2 ring-indigo-100",
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-[10px] font-semibold sm:block",
                  i === step ? "text-indigo-700 underline decoration-2 underline-offset-4" : "text-slate-400",
                )}
              >
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="soft-scroll relative flex-1 overflow-y-auto px-5 py-5">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
          className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-indigo-600 shadow-md ring-1 ring-indigo-100 disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          disabled={step === STEPS.length - 1}
          onClick={() => setStep((s) => s + 1)}
          className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-indigo-600 shadow-md ring-1 ring-indigo-100 disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="mx-auto max-w-lg space-y-4 px-8">
          {stepId === "overview" ? (
            <>
              <Field label="Description">
                <TextInput
                  rows={4}
                  readOnly={!editing}
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                />
              </Field>
              <Field label="Learning outcome">
                <TextInput
                  rows={3}
                  readOnly={!editing}
                  value={draft.learningOutcome}
                  onChange={(e) =>
                    setDraft({ ...draft, learningOutcome: e.target.value })
                  }
                />
              </Field>
            </>
          ) : null}

          {stepId === "curriculum" ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                From your curriculum in Settings
              </p>
              {curriculum.map((c) => {
                const checked = draft.curriculumIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={cn(
                      "flex cursor-pointer gap-3 rounded-2xl border p-3 text-sm transition",
                      checked
                        ? "border-indigo-200 bg-indigo-50/60"
                        : "border-slate-100 bg-white",
                      !editing && "pointer-events-none opacity-90",
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
                    <span className="leading-relaxed text-slate-700">{c.text}</span>
                  </label>
                );
              })}
            </div>
          ) : null}

          {stepId === "how" ? (
            <Field label="How to run it">
              <TextInput
                rows={8}
                readOnly={!editing}
                value={draft.howToRun}
                onChange={(e) => setDraft({ ...draft, howToRun: e.target.value })}
              />
            </Field>
          ) : null}

          {stepId === "resources" ? (
            <Field label="Resources">
              <TextInput
                rows={6}
                readOnly={!editing}
                value={draft.resources}
                onChange={(e) =>
                  setDraft({ ...draft, resources: e.target.value })
                }
              />
            </Field>
          ) : null}

          {stepId === "assessment" ? (
            <Field label="Assessment">
              <TextInput
                rows={6}
                readOnly={!editing}
                value={draft.assessment}
                onChange={(e) =>
                  setDraft({ ...draft, assessment: e.target.value })
                }
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
            disabled={state.undoStack.length === 0}
            onClick={() => {
              undo();
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
