import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Header } from "./components/Header";
import { ActivityLibrary } from "./components/ActivityLibrary";
import { LessonCanvas } from "./components/LessonCanvas";
import { MyUnits } from "./components/MyUnits";
import { EmptyState } from "./components/EmptyState";
import { ActivityCardModal } from "./components/modals/ActivityCardModal";
import { LessonPlanModal } from "./components/modals/LessonPlanModal";
import { PreviewLessonModal } from "./components/modals/PreviewLessonModal";
import { TemplatePickerModal } from "./components/modals/TemplatePickerModal";
import { YearOverviewScreen } from "./components/screens/YearOverviewScreen";
import { SettingsScreen } from "./components/screens/SettingsScreen";
import { ProtoNav } from "./components/ProtoNav";
import { PlannerProvider, usePlanner } from "./store";

function PlannerApp() {
  const { state, activeLesson, dispatch, snapshot, getActivity, getSubject } =
    usePlanner();

  const [templateOpen, setTemplateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [lessonPlanOpen, setLessonPlanOpen] = useState(false);
  const [activityId, setActivityId] = useState<string | null>(null);
  const [dragLabel, setDragLabel] = useState<string | null>(null);
  const [dragColor, setDragColor] = useState("#4338CA");
  const [unitsOpen, setUnitsOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  if (state.screen === "year") return <YearOverviewScreen />;
  if (state.screen === "settings") return <SettingsScreen />;

  const onDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === "library-activity") {
      const a = getActivity(data.activityId);
      setDragLabel(a?.title ?? "Activity");
      setDragColor(getSubject(a?.subjectId ?? "")?.color ?? "#4338CA");
    } else if (data?.type === "unit-lesson") {
      const l = state.lessons.find((x) => x.id === data.lessonId);
      setDragLabel(l?.title ?? "Lesson");
      setDragColor("#4338CA");
    } else if (data?.type === "lesson-block") {
      const b = activeLesson?.blocks.find((x) => x.id === data.blockId);
      setDragLabel(b?.title ?? "Block");
      setDragColor(getSubject(b?.subjectId ?? "")?.color ?? "#4338CA");
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setDragLabel(null);
    const { active, over } = event;
    if (!over) return;
    const aData = active.data.current;
    const oData = over.data.current;
    const overId = String(over.id);

    // Library activity → lesson canvas
    if (aData?.type === "library-activity") {
      if (overId === "lesson-canvas" || oData?.type === "lesson-canvas" || overId.startsWith("lesson-block:")) {
        snapshot();
        dispatch({ type: "ADD_ACTIVITY_TO_LESSON", activityId: aData.activityId });
      }
      if (oData?.type === "unit-tray") {
        // create isn't needed — activities go to lesson first; ignore
      }
      return;
    }

    // Reorder lesson blocks
    if (aData?.type === "lesson-block" && activeLesson) {
      const ids = activeLesson.blocks.map((b) => b.id);
      const activeBlockId = aData.blockId as string;
      let overBlockId: string | null = null;
      if (overId.startsWith("lesson-block:")) {
        overBlockId = overId.replace("lesson-block:", "");
      } else if (oData?.type === "lesson-block") {
        overBlockId = oData.blockId;
      }
      if (overBlockId && overBlockId !== activeBlockId) {
        const oldIndex = ids.indexOf(activeBlockId);
        const newIndex = ids.indexOf(overBlockId);
        if (oldIndex >= 0 && newIndex >= 0) {
          snapshot();
          dispatch({
            type: "REORDER_LESSON_BLOCKS",
            lessonId: activeLesson.id,
            blockIds: arrayMove(ids, oldIndex, newIndex),
          });
        }
      }
      return;
    }

    // Lesson chip → unit tray
    if (aData?.type === "unit-lesson" && oData?.type === "unit-tray") {
      snapshot();
      dispatch({
        type: "ADD_LESSON_TO_UNIT",
        unitId: oData.unitId,
        lessonId: aData.lessonId,
      });
      return;
    }

    // Active lesson drag from canvas conceptually via unit-lesson id of active
    if (
      aData?.type === "lesson-block" &&
      oData?.type === "unit-tray" &&
      state.activeLessonId
    ) {
      snapshot();
      dispatch({
        type: "ADD_LESSON_TO_UNIT",
        unitId: oData.unitId,
        lessonId: state.activeLessonId,
      });
    }
  };

  const showEmpty = state.emptyMode || !activeLesson;

  return (
    <div className="planner-shell flex min-h-screen flex-col">
      <Header
        onChooseTemplate={() => setTemplateOpen(true)}
        onPreviewLesson={() => {
          if (activeLesson) setPreviewOpen(true);
          else setTemplateOpen(true);
        }}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <main className="relative flex min-h-0 flex-1 gap-3 overflow-hidden px-3 pb-20 sm:px-5 lg:px-6">
          {!libraryOpen ? (
            <ActivityLibrary onOpenActivity={(id) => setActivityId(id)} />
          ) : null}

          {showEmpty ? (
            <EmptyState
              onStartTemplate={() => setTemplateOpen(true)}
              onBrowseLibrary={() => {
                setLibraryOpen(true);
                setActivityId("a1");
              }}
            />
          ) : (
            <LessonCanvas
              onOpenActivity={(id) => setActivityId(id)}
              onOpenLessonPlan={() => setLessonPlanOpen(true)}
            />
          )}

          {!unitsOpen ? (
            <MyUnits
              onSelectLesson={(id) => {
                dispatch({ type: "SET_ACTIVE_LESSON", id });
                dispatch({ type: "SET_EMPTY_MODE", empty: false });
              }}
            />
          ) : null}

          {/* Tablet drawers when side columns are hidden */}
          <div className="no-print pointer-events-none absolute bottom-24 right-4 z-30 flex flex-col gap-2 xl:hidden">
            <button
              type="button"
              className="pointer-events-auto rounded-full bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30"
              onClick={() => {
                setUnitsOpen(true);
                setLibraryOpen(false);
              }}
            >
              My units
            </button>
            <button
              type="button"
              className="pointer-events-auto hidden rounded-full bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 shadow-lg ring-1 ring-indigo-100 max-[900px]:inline-flex"
              onClick={() => {
                setLibraryOpen(true);
                setUnitsOpen(false);
              }}
            >
              Library
            </button>
          </div>

          {unitsOpen ? (
            <div className="no-print absolute inset-0 z-40 flex justify-end bg-indigo-950/25 p-3 backdrop-blur-[1px] xl:hidden">
              <button
                type="button"
                className="absolute inset-0"
                aria-label="Close units"
                onClick={() => setUnitsOpen(false)}
              />
              <div className="relative z-10 h-full">
                <MyUnits
                  forceShow
                  onSelectLesson={(id) => {
                    dispatch({ type: "SET_ACTIVE_LESSON", id });
                    dispatch({ type: "SET_EMPTY_MODE", empty: false });
                    setUnitsOpen(false);
                  }}
                />
              </div>
            </div>
          ) : null}

          {libraryOpen ? (
            <div className="no-print absolute inset-0 z-40 flex bg-indigo-950/25 p-3 backdrop-blur-[1px] min-[901px]:hidden">
              <div className="relative z-10 h-full">
                <ActivityLibrary
                  forceShow
                  onOpenActivity={(id) => {
                    setActivityId(id);
                    setLibraryOpen(false);
                  }}
                />
              </div>
              <button
                type="button"
                className="flex-1"
                aria-label="Close library"
                onClick={() => setLibraryOpen(false)}
              />
            </div>
          ) : null}
        </main>

        <DragOverlay>
          {dragLabel ? (
            <div
              className="rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-2xl"
              style={{ backgroundColor: dragColor }}
            >
              {dragLabel}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TemplatePickerModal open={templateOpen} onClose={() => setTemplateOpen(false)} />
      <PreviewLessonModal open={previewOpen} onClose={() => setPreviewOpen(false)} />
      <LessonPlanModal open={lessonPlanOpen} onClose={() => setLessonPlanOpen(false)} />
      <ActivityCardModal
        open={!!activityId}
        activityId={activityId}
        onClose={() => setActivityId(null)}
        onAddToLesson={(id) => {
          snapshot();
          dispatch({ type: "ADD_ACTIVITY_TO_LESSON", activityId: id });
        }}
      />

      <ProtoNav
        onLessonPlan={() => {
          if (activeLesson) setLessonPlanOpen(true);
          else setTemplateOpen(true);
        }}
        onEmpty={() => {
          snapshot();
          dispatch({ type: "SET_EMPTY_MODE", empty: true });
          dispatch({ type: "SET_SCREEN", screen: "planner" });
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <PlannerProvider>
      <PlannerApp />
    </PlannerProvider>
  );
}
