import {
  Clock,
  Copy,
  GripVertical,
  Lightbulb,
  Sparkles,
  X,
} from "lucide-react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { usePlanner } from "@/store";
import type { LessonBlock } from "@/types";
import { Button, IconButton, Pill } from "./ui";

function SortableBlock({
  block,
  color,
  onOpen,
  onRemove,
}: {
  block: LessonBlock;
  color: string;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: `lesson-block:${block.id}`,
      data: { type: "lesson-block", blockId: block.id },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition duration-200",
        block.kind === "flexible" && "ring-dashed ring-indigo-200",
        isDragging ? "dnd-ghost z-50 opacity-95" : "hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 text-white"
        style={{
          backgroundColor: block.kind === "flexible" ? "#818CF8" : color,
        }}
      >
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            className="cursor-grab touch-none rounded-lg p-1 text-white/80 hover:bg-white/15 active:cursor-grabbing"
            {...listeners}
            {...attributes}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onOpen}
            className="line-clamp-2 min-w-0 text-left text-sm font-bold leading-snug"
            title={block.title}
          >
            {block.title}
          </button>
        </div>
        <div className="flex items-center gap-1">
          {block.kind === "flexible" ? (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold">
              Section
            </span>
          ) : null}
          {block.durationMin != null ? (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold">
              {block.durationMin} min
            </span>
          ) : null}
          <IconButton
            onClick={onRemove}
            className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"
            aria-label="Remove"
          >
            <X className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="w-full px-3.5 py-2.5 text-left text-xs leading-relaxed text-slate-500"
      >
        {block.body || "Tap to edit this block…"}
      </button>
    </div>
  );
}

export function LessonCanvas({
  onOpenActivity,
  onOpenLessonPlan,
}: {
  onOpenActivity: (activityId: string) => void;
  onOpenLessonPlan: () => void;
}) {
  const {
    activeLesson,
    lessonDuration,
    getSubject,
    dispatch,
    snapshot,
    state,
  } = usePlanner();

  const { setNodeRef, isOver } = useDroppable({
    id: "lesson-canvas",
    data: { type: "lesson-canvas" },
  });

  if (!activeLesson || state.emptyMode) {
    return null;
  }

  const used = lessonDuration(activeLesson);
  const over = used > activeLesson.targetMin;
  const pct = Math.min(100, Math.round((used / activeLesson.targetMin) * 100));

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] card-surface-strong transition",
        isOver && "drop-active ring-2 ring-indigo-400 ring-offset-2 ring-offset-[#f3f0fb]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-indigo-50 px-5 py-4">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Pill className="bg-indigo-50 text-indigo-700">{activeLesson.keyStage}</Pill>
            <Pill className="bg-violet-50 text-violet-700">Class {activeLesson.className}</Pill>
            <Pill className="bg-slate-100 text-slate-600">{activeLesson.yearGroup}</Pill>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            {activeLesson.title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <IconButton
            title="Duplicate lesson"
            onClick={() => {
              snapshot();
              dispatch({ type: "DUPLICATE_LESSON", id: activeLesson.id });
            }}
          >
            <Copy className="h-4 w-4" />
          </IconButton>
          <Button variant="soft" size="sm" onClick={onOpenLessonPlan}>
            <Sparkles className="h-3.5 w-3.5" />
            Open lesson plan
          </Button>
        </div>
      </div>

      <div className="border-b border-indigo-50 px-5 py-3">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600">
            <Clock className="h-4 w-4" />
            Lesson time
          </span>
          <span
            className={cn(
              "font-extrabold tabular-nums",
              over ? "text-amber-600" : "text-indigo-700",
            )}
          >
            {used} / {activeLesson.targetMin} min
          </span>
        </div>
        <div
          className={cn(
            "flex h-3 overflow-hidden rounded-full bg-indigo-50 ring-1 transition",
            over ? "ring-amber-300" : "ring-indigo-100",
          )}
        >
          {activeLesson.blocks
            .filter((b) => (b.durationMin ?? 0) > 0 || b.kind === "activity")
            .map((block) => {
              const mins =
                block.durationMin ??
                (block.activityId
                  ? state.activities.find((a) => a.id === block.activityId)?.durationMin ?? 0
                  : 0);
              if (!mins) return null;
              const color =
                block.kind === "activity"
                  ? getSubject(block.subjectId ?? "")?.color ?? "#4338CA"
                  : "#94A3B8";
              const width = `${(mins / Math.max(used, activeLesson.targetMin)) * 100}%`;
              return (
                <div
                  key={block.id}
                  title={`${block.title} · ${mins}m`}
                  className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                  style={{ width, backgroundColor: over ? "#F59E0B" : color, opacity: over ? 0.85 : 1 }}
                />
              );
            })}
        </div>
        {over ? (
          <p className="mt-1.5 text-xs font-medium text-amber-600">
            Over target by {used - activeLesson.targetMin} minutes — trim or split activities.
          </p>
        ) : (
          <p className="mt-1.5 text-[11px] text-slate-400">
            Segments tint by subject · {pct}% of target
          </p>
        )}
      </div>

      <div className="soft-scroll flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
        <SortableContext
          items={activeLesson.blocks.map((b) => `lesson-block:${b.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {activeLesson.blocks.map((block) => {
            const color =
              block.kind === "activity"
                ? getSubject(block.subjectId ?? "")?.color ?? "#4338CA"
                : "#94A3B8";
            return (
              <SortableBlock
                key={block.id}
                block={block}
                color={color}
                onOpen={() => {
                  if (block.kind === "activity" && block.activityId) {
                    onOpenActivity(block.activityId);
                  } else {
                    onOpenLessonPlan();
                  }
                }}
                onRemove={() => {
                  snapshot();
                  dispatch({
                    type: "REMOVE_BLOCK",
                    lessonId: activeLesson.id,
                    blockId: block.id,
                  });
                }}
              />
            );
          })}
        </SortableContext>

        {activeLesson.blocks.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-10 text-center">
            <p className="text-sm font-semibold text-indigo-700">
              Drop activities here
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Drag from the library or tap + on any activity.
            </p>
          </div>
        ) : null}
      </div>

      <div className="m-4 mt-0 flex items-start gap-2 rounded-2xl bg-amber-50/80 px-3.5 py-3 text-xs text-amber-900/80">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <p>
          <span className="font-bold">Tip:</span> Drag activities from the library or
          reorder them to build your lesson. Mix subjects freely.
        </p>
      </div>
    </section>
  );
}
