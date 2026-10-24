import {
  Check,
  GripVertical,
  Plus,
  Printer,
  Sparkles,
  Undo2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AI_FLESH_OUT } from "@/mockData";
import { cn } from "@/lib/utils";
import { usePlanner } from "@/store";
import type { AiSuggestion, LessonBlock } from "@/types";
import {
  Button,
  CloseX,
  Field,
  ModalShell,
  Pill,
  SavedBadge,
  Segmented,
  TextInput,
  TextField,
} from "../ui";

function SortablePlanBlock({
  block,
  index,
  color,
  suggestion,
  onChange,
  onRemove,
  onAccept,
  onReject,
}: {
  block: LessonBlock;
  index: number;
  color: string;
  suggestion?: AiSuggestion;
  onChange: (patch: Partial<LessonBlock>) => void;
  onRemove: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-2xl border border-slate-100 bg-white shadow-sm",
        isDragging && "dnd-ghost z-20",
        block.kind === "flexible" && "border-dashed border-indigo-200 bg-indigo-50/20",
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <span
          className="h-8 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <button
          type="button"
          className="cursor-grab touch-none text-slate-300 hover:text-slate-500"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-700">
          {index + 1}
        </span>
        <input
          className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none"
          value={block.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
        {block.durationMin != null ? (
          <span className="text-[11px] font-semibold text-slate-400">
            {block.durationMin}m
          </span>
        ) : null}
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="px-3 pb-3">
        <TextInput
          rows={block.kind === "flexible" ? 3 : 2}
          value={block.body}
          onChange={(e) => onChange({ body: e.target.value })}
          className="bg-white"
        />
        {suggestion && suggestion.status === "pending" ? (
          <div className="mt-2 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-3">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-indigo-600">
              AI suggestion
            </p>
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {suggestion.proposedBody}
            </p>
            <div className="mt-2 flex gap-2">
              <Button variant="primary" size="sm" onClick={onAccept}>
                <Check className="h-3.5 w-3.5" /> Accept
              </Button>
              <Button variant="ghost" size="sm" onClick={onReject}>
                Reject
              </Button>
            </div>
          </div>
        ) : null}
        {suggestion?.status === "accepted" ? (
          <p className="mt-1.5 text-[11px] font-semibold text-emerald-600">Suggestion accepted</p>
        ) : null}
        {suggestion?.status === "rejected" ? (
          <p className="mt-1.5 text-[11px] font-semibold text-slate-400">Suggestion rejected</p>
        ) : null}
      </div>
    </div>
  );
}

function InsertBetween({
  onInsert,
  types,
}: {
  onInsert: (sectionTypeId: string) => void;
  types: { id: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex items-center justify-center py-1">
      <div className="absolute inset-x-8 top-1/2 h-px bg-indigo-100" />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition hover:scale-105"
      >
        <Plus className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute top-9 z-30 min-w-[220px] overflow-hidden rounded-2xl border border-indigo-100 bg-white p-1.5 shadow-xl">
          {types.map((t) => (
            <button
              key={t.id}
              type="button"
              className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
              onClick={() => {
                onInsert(t.id);
                setOpen(false);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function LessonPlanModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    activeLesson,
    state,
    getSubject,
    dispatch,
    snapshot,
    undo,
    ui,
    setAiSuggestions,
    acceptSuggestion,
    rejectSuggestion,
    acceptAllSuggestions,
    rejectAllSuggestions,
    applyReprompt,
    clearSuggestions,
  } = usePlanner();

  const [view, setView] = useState<"plan" | "preview" | "print">("plan");
  const [reprompt, setReprompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    if (open) setView("plan");
  }, [open]);

  const enabledSections = state.settings.sectionTypes.filter((s) => s.enabled);

  const suggestionsByBlock = useMemo(() => {
    const map = new Map<string, AiSuggestion>();
    ui.aiSuggestions.forEach((s) => map.set(s.blockId, s));
    return map;
  }, [ui.aiSuggestions]);

  if (!activeLesson) return null;

  const linkedCurriculum = state.settings.curriculum.filter((c) =>
    activeLesson.curriculumIds.includes(c.id),
  );

  const subjectIdsInLesson = new Set(
    activeLesson.blocks
      .map((b) => b.subjectId)
      .filter((id): id is string => Boolean(id)),
  );

  const pickableStatements = state.settings.curriculum.filter((c) => {
    const strand = state.settings.strands.find((s) => s.id === c.strandId);
    if (!strand) return false;
    if (strand.keyStage !== activeLesson.keyStage) return false;
    if (subjectIdsInLesson.size === 0) return true;
    return subjectIdsInLesson.has(strand.subjectId);
  });

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = activeLesson.blocks.map((b) => b.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    snapshot();
    dispatch({
      type: "REORDER_LESSON_BLOCKS",
      lessonId: activeLesson.id,
      blockIds: arrayMove(ids, oldIndex, newIndex),
    });
  };

  const runFleshOut = () => {
    snapshot();
    setAiBusy(true);
    const ensure = ["diff", "vocab", "afl"].filter((id) =>
      enabledSections.some((s) => s.id === id),
    );
    const existing = new Set(
      activeLesson.blocks
        .filter((b) => b.kind === "flexible")
        .map((b) => b.sectionTypeId),
    );
    let after = activeLesson.blocks[1]?.id ?? activeLesson.blocks[0]?.id ?? null;
    ensure.forEach((sectionTypeId) => {
      if (!existing.has(sectionTypeId)) {
        dispatch({
          type: "INSERT_FLEXIBLE",
          lessonId: activeLesson.id,
          afterBlockId: after,
          sectionTypeId,
        });
      }
    });
    window.setTimeout(() => {
      // Remap suggestions onto flexible blocks by section type
      const lesson = activeLesson; // stale — remap by reading latest via callback pattern
      setAiBusy(false);
    }, 100);

    window.setTimeout(() => {
      // Second pass: build suggestions from current flexible blocks in store via section match
      setAiBusy(false);
      // We need latest lesson — use a custom event approach: compute from ensure types against
      // blocks that will exist. For prototype, dispatch a follow-up using getState pattern.
      // Simpler: set suggestions with temporary ids then fix in effect below.
      setAiSuggestions(
        ensure.map((id) => ({
          blockId: `sec:${id}`,
          proposedBody: AI_FLESH_OUT[id] ?? AI_FLESH_OUT.custom,
          status: "pending",
        })),
      );
    }, 700);
  };

  // Remap sec:id suggestions to real block ids when lesson updates
  useEffect(() => {
    if (!activeLesson || ui.aiSuggestions.length === 0) return;
    if (!ui.aiSuggestions.some((s) => s.blockId.startsWith("sec:"))) return;
    const remapped = ui.aiSuggestions.map((s) => {
      if (!s.blockId.startsWith("sec:")) return s;
      const sectionTypeId = s.blockId.slice(4);
      const block = activeLesson.blocks.find(
        (b) => b.kind === "flexible" && b.sectionTypeId === sectionTypeId,
      );
      return block ? { ...s, blockId: block.id } : s;
    });
    if (remapped.some((s, i) => s.blockId !== ui.aiSuggestions[i].blockId)) {
      setAiSuggestions(remapped);
    }
  }, [activeLesson?.blocks, ui.aiSuggestions]);

  return (
    <ModalShell open={open} onClose={onClose}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-indigo-50 px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-lg font-extrabold text-indigo-700" title={activeLesson.title}>
            Lesson plan — {activeLesson.title}
          </h2>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Pill className="bg-indigo-50 text-indigo-700">
              {getSubject(activeLesson.blocks.find((b) => b.subjectId)?.subjectId ?? "music")
                ?.name ?? "Mixed"}
            </Pill>
            <Pill className="bg-indigo-50 text-indigo-700">{activeLesson.keyStage}</Pill>
            <Pill className="bg-slate-100 text-slate-600">{activeLesson.yearGroup}</Pill>
            <Pill className="bg-slate-100 text-slate-600">{activeLesson.targetMin} min</Pill>
            <Pill className="bg-violet-50 text-violet-700">
              {state.settings.terms.find((t) => t.id === activeLesson.termId)?.name}
            </Pill>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { id: "plan", label: "Plan" },
              { id: "preview", label: "Preview" },
              { id: "print", label: "Print" },
            ]}
          />
          <Button
            variant="primary"
            size="sm"
            disabled={aiBusy}
            onClick={runFleshOut}
            className={cn(aiBusy && "ai-shimmer")}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Flesh out with AI
          </Button>
          <CloseX onClick={onClose} />
        </div>
      </div>

      {view === "plan" ? (
        <div className="soft-scroll grid min-h-0 flex-1 gap-4 overflow-y-auto p-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h3 className="mb-2 text-sm font-extrabold text-slate-800">Lesson sequence</h3>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext
                items={activeLesson.blocks.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <InsertBetween
                  types={enabledSections}
                  onInsert={(sectionTypeId) => {
                    snapshot();
                    dispatch({
                      type: "INSERT_FLEXIBLE",
                      lessonId: activeLesson.id,
                      afterBlockId: null,
                      sectionTypeId,
                    });
                  }}
                />
                {activeLesson.blocks.map((block, index) => (
                  <div key={block.id}>
                    <SortablePlanBlock
                      block={block}
                      index={index}
                      color={
                        block.kind === "activity"
                          ? getSubject(block.subjectId ?? "")?.color ?? "#4338CA"
                          : "#818CF8"
                      }
                      suggestion={suggestionsByBlock.get(block.id)}
                      onChange={(patch) => {
                        dispatch({
                          type: "UPDATE_BLOCK",
                          lessonId: activeLesson.id,
                          blockId: block.id,
                          patch,
                        });
                      }}
                      onRemove={() => {
                        snapshot();
                        dispatch({
                          type: "REMOVE_BLOCK",
                          lessonId: activeLesson.id,
                          blockId: block.id,
                        });
                      }}
                      onAccept={() => acceptSuggestion(block.id)}
                      onReject={() => rejectSuggestion(block.id)}
                    />
                    <InsertBetween
                      types={enabledSections}
                      onInsert={(sectionTypeId) => {
                        snapshot();
                        dispatch({
                          type: "INSERT_FLEXIBLE",
                          lessonId: activeLesson.id,
                          afterBlockId: block.id,
                          sectionTypeId,
                        });
                      }}
                    />
                  </div>
                ))}
              </SortableContext>
            </DndContext>

            {ui.aiSuggestions.some((s) => s.status === "pending") ? (
              <div className="mt-3 flex flex-wrap gap-2 rounded-2xl bg-indigo-50 p-3">
                <Button variant="primary" size="sm" onClick={acceptAllSuggestions}>
                  Accept all
                </Button>
                <Button variant="ghost" size="sm" onClick={rejectAllSuggestions}>
                  Reject all
                </Button>
                <Button variant="ghost" size="sm" onClick={clearSuggestions}>
                  Clear
                </Button>
              </div>
            ) : null}

            <div className="mt-4 rounded-2xl border border-indigo-100 bg-white p-3">
              <Field label="Re-prompt AI" hint="Canned revision with undo">
                <div className="flex gap-2">
                  <TextField
                    value={reprompt}
                    onChange={(e) => setReprompt(e.target.value)}
                    placeholder="e.g. Make the start quieter and assessment more visible"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      applyReprompt(reprompt || "Revise emphasis");
                      setReprompt("");
                    }}
                  >
                    Revise
                  </Button>
                </div>
              </Field>
              {ui.repromptNote ? (
                <p className="mt-2 rounded-xl bg-violet-50 p-2.5 text-sm text-violet-800">
                  {ui.repromptNote}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800">Curriculum statements</h4>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    From your curriculum in Settings
                  </p>
                </div>
                <Button
                  variant="soft"
                  size="sm"
                  onClick={() => setPickerOpen((v) => !v)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {pickerOpen ? "Done" : "Choose"}
                </Button>
              </div>
              {pickerOpen ? (
                <div className="mb-3 max-h-48 space-y-1.5 overflow-y-auto rounded-2xl border border-indigo-100 bg-indigo-50/40 p-2">
                  {pickableStatements.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-slate-500">
                      No statements for this key stage / subjects. Define them in Settings.
                    </p>
                  ) : (
                    pickableStatements.map((c) => {
                      const strand = state.settings.strands.find((s) => s.id === c.strandId);
                      const checked = activeLesson.curriculumIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className="flex cursor-pointer gap-2 rounded-xl bg-white px-2.5 py-2 text-xs text-slate-700"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={checked}
                            onChange={(e) => {
                              const ids = e.target.checked
                                ? [...activeLesson.curriculumIds, c.id]
                                : activeLesson.curriculumIds.filter((id) => id !== c.id);
                              dispatch({
                                type: "UPDATE_LESSON",
                                id: activeLesson.id,
                                patch: { curriculumIds: ids },
                              });
                            }}
                          />
                          <span className="min-w-0">
                            <span className="mb-0.5 block font-bold text-indigo-500">
                              {strand?.name}
                            </span>
                            {c.text}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              ) : null}
              <ul className="space-y-2">
                {linkedCurriculum.map((c) => {
                  const strand = state.settings.strands.find((s) => s.id === c.strandId);
                  return (
                    <li key={c.id} className="flex gap-2 text-sm text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                      <span>
                        {strand ? (
                          <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-indigo-500">
                            {strand.name}
                          </span>
                        ) : null}
                        {c.text}
                      </span>
                    </li>
                  );
                })}
                {linkedCurriculum.length === 0 ? (
                  <li className="text-sm text-slate-400">
                    No statements linked yet — choose from Settings-defined statements.
                  </li>
                ) : null}
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              <h4 className="mb-2 text-sm font-extrabold text-slate-800">Learning objective</h4>
              <TextInput
                rows={3}
                value={activeLesson.learningObjective}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_LESSON",
                    id: activeLesson.id,
                    patch: { learningObjective: e.target.value },
                  })
                }
              />
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              <h4 className="mb-2 text-sm font-extrabold text-slate-800">Success criteria</h4>
              <TextInput
                rows={4}
                value={activeLesson.successCriteria.join("\n")}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_LESSON",
                    id: activeLesson.id,
                    patch: {
                      successCriteria: e.target.value.split("\n").filter(Boolean),
                    },
                  })
                }
              />
            </div>
          </div>
        </div>
      ) : null}

      {view === "preview" ? (
        <div className="soft-scroll flex-1 overflow-y-auto p-6">
          <article className="mx-auto max-w-2xl space-y-4">
            <header>
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">Preview</p>
              <h3 className="text-2xl font-extrabold text-slate-900">{activeLesson.title}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {activeLesson.yearGroup} · Class {activeLesson.className} · {activeLesson.targetMin} min
              </p>
              <p className="mt-3 rounded-2xl bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-900">
                {activeLesson.learningObjective}
              </p>
            </header>
            <ol className="space-y-3">
              {activeLesson.blocks.map((b, i) => (
                <li
                  key={b.id}
                  className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <p className="text-xs font-bold text-indigo-500">
                    {i + 1}. {b.title}
                    {b.durationMin ? ` · ${b.durationMin}m` : ""}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{b.body}</p>
                </li>
              ))}
            </ol>
          </article>
        </div>
      ) : null}

      {view === "print" ? (
        <div className="soft-scroll flex-1 overflow-y-auto bg-slate-100/80 p-6">
          <article className="a4-sheet mx-auto min-h-[297mm] w-full max-w-[210mm] rounded-sm bg-white p-10 shadow-lg print:shadow-none">
            <header className="border-b border-slate-200 pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Creative Curriculum Designer
              </p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">{activeLesson.title}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {activeLesson.keyStage} · {activeLesson.yearGroup} · Class {activeLesson.className} ·{" "}
                {activeLesson.targetMin} minutes
              </p>
            </header>
            <section className="mt-5">
              <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Learning objective
              </h4>
              <p className="mt-1 text-sm text-slate-800">{activeLesson.learningObjective}</p>
            </section>
            <section className="mt-4">
              <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Success criteria
              </h4>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-slate-800">
                {activeLesson.successCriteria.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
            <section className="mt-5">
              <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Sequence
              </h4>
              <ol className="mt-2 space-y-3">
                {activeLesson.blocks.map((b, i) => (
                  <li key={b.id} className="text-sm">
                    <p className="font-bold text-slate-900">
                      {i + 1}. {b.title}
                      {b.durationMin ? ` (${b.durationMin} min)` : ""}
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap text-slate-700">{b.body}</p>
                  </li>
                ))}
              </ol>
            </section>
            <section className="mt-5">
              <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Curriculum statements
              </h4>
              <p className="mb-1 text-[10px] font-semibold uppercase text-slate-400">
                From your curriculum in Settings
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                {linkedCurriculum.map((c) => (
                  <li key={c.id}>{c.text}</li>
                ))}
              </ul>
            </section>
          </article>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-indigo-50 px-5 py-3">
        <SavedBadge time={state.lastSavedAt} />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={state.undoStack.length === 0}
            onClick={undo}
          >
            <Undo2 className="h-3.5 w-3.5" />
            Undo
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setView("preview")}>
            Preview
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setView("print");
              window.setTimeout(() => window.print(), 200);
            }}
          >
            <Printer className="h-3.5 w-3.5" />
            Print / PDF
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
