import {
  ChevronDown,
  ChevronRight,
  Copy,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { usePlanner } from "@/store";
import { Button, IconButton } from "./ui";
import { useState } from "react";

function DraggableLessonChip({
  lessonId,
  title,
  minutes,
  color,
  onOpen,
}: {
  lessonId: string;
  title: string;
  minutes: number;
  color: string;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `unit-lesson:${lessonId}`,
    data: { type: "unit-lesson", lessonId },
  });
  const style = { transform: CSS.Translate.toString(transform) };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex min-w-[140px] max-w-[160px] flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5",
        isDragging && "dnd-ghost z-50",
      )}
    >
      <div className="h-2" style={{ backgroundColor: color }} />
      <div className="flex items-start gap-1 p-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none text-slate-300 hover:text-slate-500"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <span className="line-clamp-2 text-[11px] font-bold leading-snug text-slate-800">
            {title}
          </span>
          <span className="text-[10px] text-slate-400">{minutes} min</span>
        </button>
      </div>
    </div>
  );
}

function UnitTrayDrop({ unitId }: { unitId: string }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `unit-tray:${unitId}`,
    data: { type: "unit-tray", unitId },
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[72px] min-w-[140px] items-center justify-center rounded-2xl border-2 border-dashed px-3 text-center text-[11px] font-semibold transition",
        isOver
          ? "border-indigo-400 bg-indigo-50 text-indigo-700"
          : "border-indigo-200 bg-indigo-50/30 text-indigo-400",
      )}
    >
      Drag lesson here
    </div>
  );
}

export function MyUnits({
  onSelectLesson,
  forceShow = false,
}: {
  onSelectLesson: (lessonId: string) => void;
  forceShow?: boolean;
}) {
  const {
    state,
    getSubject,
    lessonDuration,
    dispatch,
    snapshot,
    setScreen,
  } = usePlanner();
  const [collapsed, setCollapsed] = useState(false);
  const [assignUnitId, setAssignUnitId] = useState<string | null>(
    state.units[0]?.id ?? null,
  );

  if (collapsed && !forceShow) {
    return (
      <aside className="no-print flex w-12 flex-col items-center rounded-[1.5rem] bg-white/70 py-4 shadow-sm max-[1100px]:hidden">
        <IconButton onClick={() => setCollapsed(false)} title="Expand units">
          <ChevronDown className="h-4 w-4" />
        </IconButton>
        <div className="mt-4 text-xs font-bold tracking-wide text-indigo-600 [writing-mode:vertical-rl]">
          My units
        </div>
      </aside>
    );
  }

  const assignUnit = state.units.find((u) => u.id === assignUnitId) ?? state.units[0];

  return (
    <aside
      className={cn(
        "no-print flex w-[260px] shrink-0 flex-col overflow-hidden rounded-[1.5rem] card-surface xl:w-[300px]",
        !forceShow && "max-[1100px]:hidden",
        forceShow && "h-full w-[300px] shadow-2xl",
      )}
    >
      <div className="flex items-center justify-between border-b border-indigo-50 px-4 py-3">
        <h2 className="text-sm font-extrabold text-slate-800">My units</h2>
        <IconButton title="Collapse" onClick={() => setCollapsed(true)}>
          <ChevronDown className="h-4 w-4 rotate-90" />
        </IconButton>
      </div>

      <div className="soft-scroll flex-1 space-y-2.5 overflow-y-auto px-3 py-3">
        {state.units.map((unit) => {
          const subject = getSubject(unit.subjectId);
          const term = state.settings.terms.find((t) => t.id === unit.termId);
          const open = !unit.collapsed;
          return (
            <div
              key={unit.id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
            >
              <button
                type="button"
                onClick={() => dispatch({ type: "TOGGLE_UNIT", id: unit.id })}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left"
              >
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: subject?.color ?? "#4338CA" }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-800">
                    {unit.title}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {subject?.name} · {unit.lessonIds.length} lessons · {term?.name}
                  </span>
                </span>
                {open ? (
                  <ChevronDown className="mt-1 h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronRight className="mt-1 h-4 w-4 text-slate-400" />
                )}
              </button>

              {open ? (
                <div className="border-t border-slate-50 px-3 pb-3 pt-2">
                  <div className="mb-2 flex gap-1">
                    <IconButton
                      title="Duplicate unit"
                      className="h-7 w-7"
                      onClick={() => {
                        snapshot();
                        dispatch({ type: "DUPLICATE_UNIT", id: unit.id });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton
                      title="Select for term assign"
                      className={cn(
                        "h-7 w-7 text-[10px] font-bold",
                        assignUnitId === unit.id && "bg-indigo-50 text-indigo-700",
                      )}
                      onClick={() => setAssignUnitId(unit.id)}
                    >
                      T
                    </IconButton>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {unit.lessonIds.map((lid) => {
                      const lesson = state.lessons.find((l) => l.id === lid);
                      if (!lesson) return null;
                      return (
                        <div key={lid} className="relative">
                          <DraggableLessonChip
                            lessonId={lid}
                            title={lesson.title}
                            minutes={lessonDuration(lesson)}
                            color={subject?.color ?? "#4338CA"}
                            onOpen={() => onSelectLesson(lid)}
                          />
                          <button
                            type="button"
                            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-400 shadow ring-1 ring-slate-100 hover:text-rose-500"
                            onClick={() => {
                              snapshot();
                              dispatch({
                                type: "REMOVE_LESSON_FROM_UNIT",
                                unitId: unit.id,
                                lessonId: lid,
                              });
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                    <UnitTrayDrop unitId={unit.id} />
                  </div>
                  {state.activeLessonId &&
                  !unit.lessonIds.includes(state.activeLessonId) ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => {
                        snapshot();
                        dispatch({
                          type: "ADD_LESSON_TO_UNIT",
                          unitId: unit.id,
                          lessonId: state.activeLessonId!,
                        });
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add current lesson
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}

        <Button
          variant="ghost"
          className="w-full justify-start text-indigo-700"
          onClick={() => {
            snapshot();
            dispatch({ type: "ADD_UNIT" });
          }}
        >
          <Plus className="h-4 w-4" />
          New unit
        </Button>
      </div>

      <div className="space-y-2 border-t border-indigo-50 p-3">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Assign to term
          {assignUnit ? ` · ${assignUnit.title}` : ""}
        </label>
        <select
          className="h-10 w-full rounded-2xl border border-indigo-100 bg-white px-3 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-100"
          value={assignUnit?.termId ?? ""}
          disabled={!assignUnit}
          onChange={(e) => {
            if (!assignUnit) return;
            snapshot();
            dispatch({
              type: "UPDATE_UNIT",
              id: assignUnit.id,
              patch: { termId: e.target.value },
            });
          }}
        >
          {state.settings.terms.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <Button
          variant="primary"
          className="w-full"
          onClick={() => setScreen("year")}
        >
          Year overview
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  );
}
