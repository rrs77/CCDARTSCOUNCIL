import { CalendarRange, FileSpreadsheet, LayoutGrid, Settings2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlanner } from "@/store";

export function ProtoNav({
  onLessonPlan,
        onEmpty,
}: {
  onLessonPlan: () => void;
  onEmpty: () => void;
}) {
  const { state, setScreen, dispatch, snapshot } = usePlanner();

  const items = [
    {
      id: "planner",
      label: "Planner",
      icon: LayoutGrid,
      active: state.screen === "planner" && !state.emptyMode,
      onClick: () => {
        setScreen("planner");
        dispatch({ type: "SET_EMPTY_MODE", empty: false });
        if (!state.activeLessonId && state.lessons[0]) {
          dispatch({ type: "SET_ACTIVE_LESSON", id: state.lessons[0].id });
        }
      },
    },
    {
      id: "plan",
      label: "Lesson plan",
      icon: FileSpreadsheet,
      active: false,
      onClick: () => {
        setScreen("planner");
        onLessonPlan();
      },
    },
    {
      id: "year",
      label: "Year",
      icon: CalendarRange,
      active: state.screen === "year",
      onClick: () => setScreen("year"),
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings2,
      active: state.screen === "settings",
      onClick: () => setScreen("settings"),
    },
    {
      id: "empty",
      label: "Empty",
      icon: Sparkles,
      active: state.screen === "planner" && state.emptyMode,
      onClick: () => {
        snapshot();
        dispatch({ type: "SET_EMPTY_MODE", empty: true });
        setScreen("planner");
        onEmpty();
      },
    },
  ] as const;

  return (
    <nav className="no-print fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-indigo-950/92 p-1.5 text-white shadow-2xl shadow-indigo-950/40 backdrop-blur-md">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition active:scale-95",
              item.active
                ? "bg-white text-indigo-800 shadow-sm"
                : "text-white/80 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
