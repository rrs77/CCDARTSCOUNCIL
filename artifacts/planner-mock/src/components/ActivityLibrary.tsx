import {
  ChevronDown,
  Filter,
  GripVertical,
  Plus,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { usePlanner } from "@/store";
import type { Activity } from "@/types";
import { Button, IconButton } from "./ui";

function LibraryActivity({
  activity,
  color,
  onOpen,
  onAdd,
}: {
  activity: Activity;
  color: string;
  onOpen: () => void;
  onAdd: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lib:${activity.id}`,
    data: { type: "library-activity", activityId: activity.id },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    borderLeftColor: color,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-1 rounded-2xl border border-white/80 bg-white py-2 pl-1 pr-2 shadow-sm transition duration-200",
        isDragging
          ? "dnd-ghost z-50 opacity-90"
          : "hover:-translate-y-0.5 hover:shadow-md hover:ring-2 hover:ring-indigo-100",
      )}
    >
      <button
        type="button"
        className="drag-handle cursor-grab touch-none rounded-xl p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 active:cursor-grabbing"
        aria-label="Drag activity"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 border-l-4 py-1 pl-2 text-left"
        style={{ borderLeftColor: color }}
      >
        <span className="block truncate text-sm font-semibold text-slate-800">
          {activity.title}
        </span>
        <span className="text-xs text-slate-400">{activity.durationMin}m</span>
      </button>
      <IconButton
        title="Add to lesson"
        onClick={onAdd}
        className="h-8 w-8 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
      >
        <Plus className="h-4 w-4 text-indigo-600" />
      </IconButton>
    </div>
  );
}

export function ActivityLibrary({
  onOpenActivity,
  forceShow = false,
}: {
  onOpenActivity: (id: string) => void;
  forceShow?: boolean;
}) {
  const { state, visibleSubjects, dispatch, snapshot } = usePlanner();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ music: true });
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const bySubject = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visibleSubjects.map((subject) => ({
      subject,
      activities: state.activities.filter(
        (a) =>
          a.subjectId === subject.id &&
          a.keyStages.includes(state.keyStage) &&
          (!q || a.title.toLowerCase().includes(q)),
      ),
    }));
  }, [visibleSubjects, state.activities, state.keyStage, query]);

  if (collapsed && !forceShow) {
    return (
      <aside className="no-print flex w-12 flex-col items-center rounded-[1.5rem] bg-white/70 py-4 shadow-sm max-[900px]:hidden">
        <IconButton onClick={() => setCollapsed(false)} title="Expand library">
          <Filter className="h-4 w-4" />
        </IconButton>
        <div className="mt-4 writing-mode-vertical rotate-180 text-xs font-bold tracking-wide text-indigo-600 [writing-mode:vertical-rl]">
          Activity library
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "no-print flex w-[220px] shrink-0 flex-col overflow-hidden rounded-[1.5rem] card-surface lg:w-[280px]",
        !forceShow && "max-[900px]:hidden",
        forceShow && "h-full w-[280px] shadow-2xl",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-indigo-50 px-4 py-3">
        <h2 className="text-sm font-extrabold text-slate-800">Activity library</h2>
        <div className="flex items-center gap-1">
          <IconButton title="Collapse" onClick={() => setCollapsed(true)}>
            <Filter className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search activities"
            className="h-10 w-full rounded-2xl border border-indigo-50 bg-indigo-50/40 pl-9 pr-3 text-sm outline-none focus:border-indigo-200 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          />
        </div>
      </div>

      <div className="soft-scroll mt-2 flex-1 space-y-2 overflow-y-auto px-3 pb-4">
        {bySubject.map(({ subject, activities }) => {
          const open = expanded[subject.id] ?? false;
          return (
            <div key={subject.id} className="overflow-hidden rounded-2xl">
              <button
                type="button"
                onClick={() =>
                  setExpanded((e) => ({ ...e, [subject.id]: !open }))
                }
                className="flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-left text-sm font-bold text-white shadow-sm transition hover:brightness-105"
                style={{ backgroundColor: subject.color }}
              >
                <span>{subject.name}</span>
                <span className="flex items-center gap-2 text-white/80">
                  <span className="text-xs font-semibold">{activities.length}</span>
                  <ChevronDown
                    className={cn("h-4 w-4 transition", open && "rotate-180")}
                  />
                </span>
              </button>
              {open ? (
                <div className="space-y-1.5 bg-slate-50/80 px-2 py-2">
                  {activities.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-slate-400">
                      No activities for {state.keyStage}
                    </p>
                  ) : (
                    activities.map((activity) => (
                      <LibraryActivity
                        key={activity.id}
                        activity={activity}
                        color={subject.color}
                        onOpen={() => onOpenActivity(activity.id)}
                        onAdd={() => {
                          snapshot();
                          dispatch({
                            type: "ADD_ACTIVITY_TO_LESSON",
                            activityId: activity.id,
                          });
                        }}
                      />
                    ))
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-slate-500"
                    onClick={() => onOpenActivity(activities[0]?.id ?? "a1")}
                  >
                    Browse {subject.name}
                  </Button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
