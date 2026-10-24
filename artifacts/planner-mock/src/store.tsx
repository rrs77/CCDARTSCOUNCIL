import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  AI_FLESH_OUT,
  AI_REPROMPT_RESPONSE,
  buildDefaultSettings,
  buildSeedLessons,
  buildSeedUnits,
  DEFAULT_ACTIVITIES,
  DEFAULT_TEMPLATES,
} from "./mockData";
import { formatTime, uid } from "./lib/utils";
import type {
  Activity,
  AiSuggestion,
  CurriculumFramework,
  CurriculumStatement,
  CurriculumStrand,
  KeyStage,
  Lesson,
  LessonBlock,
  PlannerState,
  Screen,
  SectionType,
  SettingsState,
  Subject,
  TermDates,
  Unit,
} from "./types";

type Snapshot = string;

type Action =
  | { type: "SET_SCREEN"; screen: Screen }
  | { type: "SET_KEY_STAGE"; keyStage: KeyStage }
  | { type: "SET_ACTIVE_LESSON"; id: string | null }
  | { type: "SET_EMPTY_MODE"; empty: boolean }
  | { type: "UPDATE_SETTINGS"; patch: Partial<SettingsState> }
  | { type: "UPDATE_SUBJECT"; id: string; patch: Partial<Subject> }
  | { type: "ADD_SUBJECT"; subject: Subject }
  | { type: "UPDATE_TERM"; id: string; patch: Partial<TermDates> }
  | { type: "UPDATE_SECTION_TYPE"; id: string; patch: Partial<SectionType> }
  | { type: "ADD_SECTION_TYPE"; label: string }
  | { type: "ADD_FRAMEWORK"; name?: string }
  | { type: "UPDATE_FRAMEWORK"; id: string; patch: Partial<CurriculumFramework> }
  | { type: "DELETE_FRAMEWORK"; id: string }
  | { type: "ADD_STRAND"; strand: Omit<CurriculumStrand, "id"> & { id?: string } }
  | { type: "UPDATE_STRAND"; id: string; patch: Partial<CurriculumStrand> }
  | { type: "DELETE_STRAND"; id: string }
  | { type: "ADD_STATEMENT"; statement: Omit<CurriculumStatement, "id"> & { id?: string } }
  | { type: "UPDATE_STATEMENT"; id: string; patch: Partial<CurriculumStatement> }
  | { type: "DELETE_STATEMENT"; id: string }
  | { type: "UPDATE_ACTIVITY"; id: string; patch?: Partial<Activity>; content?: Partial<Activity["content"]> }
  | { type: "ADD_ACTIVITY_TO_LESSON"; activityId: string; lessonId?: string }
  | { type: "REORDER_LESSON_BLOCKS"; lessonId: string; blockIds: string[] }
  | { type: "REMOVE_BLOCK"; lessonId: string; blockId: string }
  | { type: "UPDATE_BLOCK"; lessonId: string; blockId: string; patch: Partial<LessonBlock> }
  | { type: "INSERT_FLEXIBLE"; lessonId: string; afterBlockId: string | null; sectionTypeId: string }
  | { type: "UPDATE_LESSON"; id: string; patch: Partial<Lesson> }
  | { type: "DUPLICATE_LESSON"; id: string }
  | { type: "APPLY_TEMPLATE"; templateId: string }
  | { type: "ADD_LESSON_TO_UNIT"; unitId: string; lessonId: string }
  | { type: "REMOVE_LESSON_FROM_UNIT"; unitId: string; lessonId: string }
  | { type: "REORDER_UNIT_LESSONS"; unitId: string; lessonIds: string[] }
  | { type: "UPDATE_UNIT"; id: string; patch: Partial<Unit> }
  | { type: "ADD_UNIT"; title?: string }
  | { type: "DUPLICATE_UNIT"; id: string }
  | { type: "TOGGLE_UNIT"; id: string }
  | { type: "MARK_SAVED" }
  | { type: "PUSH_UNDO"; snapshot: Snapshot }
  | { type: "UNDO" }
  | { type: "RESET_DEMO" };

function purgeStatementRefs(state: PlannerState, removedIds: Set<string>): PlannerState {
  if (removedIds.size === 0) return state;
  return {
    ...state,
    activities: state.activities.map((a) => ({
      ...a,
      content: {
        ...a.content,
        curriculumIds: a.content.curriculumIds.filter((id) => !removedIds.has(id)),
      },
    })),
    lessons: state.lessons.map((l) => ({
      ...l,
      curriculumIds: l.curriculumIds.filter((id) => !removedIds.has(id)),
    })),
  };
}

interface UiExtras {
  aiSuggestions: AiSuggestion[];
  aiBusy: boolean;
  repromptNote: string | null;
}

interface StoreValue {
  state: PlannerState;
  ui: UiExtras;
  dispatch: React.Dispatch<Action>;
  visibleSubjects: Subject[];
  activeLesson: Lesson | null;
  lessonDuration: (lesson: Lesson) => number;
  getActivity: (id: string) => Activity | undefined;
  getSubject: (id: string) => Subject | undefined;
  setScreen: (s: Screen) => void;
  snapshot: () => void;
  undo: () => void;
  fleshOutWithAi: (lessonId: string) => void;
  acceptSuggestion: (blockId: string) => void;
  rejectSuggestion: (blockId: string) => void;
  acceptAllSuggestions: () => void;
  rejectAllSuggestions: () => void;
  clearSuggestions: () => void;
  applyReprompt: (prompt: string) => void;
  setAiSuggestions: (s: AiSuggestion[]) => void;
  setRepromptNote: (n: string | null) => void;
}

function serialize(state: PlannerState): Snapshot {
  return JSON.stringify({
    lessons: state.lessons,
    units: state.units,
    activities: state.activities,
    settings: state.settings,
    activeLessonId: state.activeLessonId,
    emptyMode: state.emptyMode,
  });
}

function applySnapshot(state: PlannerState, snapshot: Snapshot): PlannerState {
  const data = JSON.parse(snapshot);
  return {
    ...state,
    ...data,
    lastSavedAt: formatTime(),
  };
}

function createInitialState(empty = false): PlannerState {
  const lessons = empty ? [] : buildSeedLessons();
  const units = empty ? [] : buildSeedUnits(lessons);
  return {
    screen: "planner",
    keyStage: "KS2",
    settings: buildDefaultSettings(),
    activities: DEFAULT_ACTIVITIES.map((a) => ({
      ...a,
      content: { ...a.content },
    })),
    lessons,
    units,
    templates: DEFAULT_TEMPLATES,
    activeLessonId: empty ? null : "les_1",
    emptyMode: empty,
    lastSavedAt: formatTime(),
    undoStack: [],
  };
}

function lessonDuration(lesson: Lesson, activities: Activity[]) {
  return lesson.blocks.reduce((sum, b) => {
    if (b.kind === "activity") {
      const a = activities.find((x) => x.id === b.activityId);
      return sum + (b.durationMin ?? a?.durationMin ?? 0);
    }
    return sum;
  }, 0);
}

function reducer(state: PlannerState, action: Action): PlannerState {
  switch (action.type) {
    case "SET_SCREEN":
      return { ...state, screen: action.screen };
    case "SET_KEY_STAGE":
      return { ...state, keyStage: action.keyStage };
    case "SET_ACTIVE_LESSON":
      return {
        ...state,
        activeLessonId: action.id,
        emptyMode: action.id == null,
      };
    case "SET_EMPTY_MODE":
      if (action.empty) {
        return {
          ...state,
          emptyMode: true,
          activeLessonId: null,
        };
      }
      return {
        ...state,
        emptyMode: false,
        activeLessonId:
          state.activeLessonId ?? state.lessons[0]?.id ?? null,
      };
    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.patch }, lastSavedAt: formatTime() };
    case "UPDATE_SUBJECT":
      return {
        ...state,
        settings: {
          ...state.settings,
          subjects: state.settings.subjects.map((s) =>
            s.id === action.id ? { ...s, ...action.patch } : s,
          ),
        },
        lastSavedAt: formatTime(),
      };
    case "ADD_SUBJECT":
      return {
        ...state,
        settings: {
          ...state.settings,
          subjects: [...state.settings.subjects, action.subject],
        },
        lastSavedAt: formatTime(),
      };
    case "UPDATE_TERM":
      return {
        ...state,
        settings: {
          ...state.settings,
          terms: state.settings.terms.map((t) =>
            t.id === action.id ? { ...t, ...action.patch } : t,
          ),
        },
        lastSavedAt: formatTime(),
      };
    case "UPDATE_SECTION_TYPE":
      return {
        ...state,
        settings: {
          ...state.settings,
          sectionTypes: state.settings.sectionTypes.map((s) =>
            s.id === action.id ? { ...s, ...action.patch } : s,
          ),
        },
        lastSavedAt: formatTime(),
      };
    case "ADD_SECTION_TYPE":
      return {
        ...state,
        settings: {
          ...state.settings,
          sectionTypes: [
            ...state.settings.sectionTypes,
            { id: uid("sec"), label: action.label, builtIn: false, enabled: true },
          ],
        },
        lastSavedAt: formatTime(),
      };
    case "ADD_FRAMEWORK":
      return {
        ...state,
        settings: {
          ...state.settings,
          frameworks: [
            ...state.settings.frameworks,
            { id: uid("fw"), name: action.name ?? "New framework" },
          ],
        },
        lastSavedAt: formatTime(),
      };
    case "UPDATE_FRAMEWORK":
      return {
        ...state,
        settings: {
          ...state.settings,
          frameworks: state.settings.frameworks.map((f) =>
            f.id === action.id ? { ...f, ...action.patch } : f,
          ),
        },
        lastSavedAt: formatTime(),
      };
    case "DELETE_FRAMEWORK": {
      const strandIds = new Set(
        state.settings.strands
          .filter((s) => s.frameworkId === action.id)
          .map((s) => s.id),
      );
      const removedStatementIds = new Set(
        state.settings.curriculum
          .filter((c) => strandIds.has(c.strandId))
          .map((c) => c.id),
      );
      const next = {
        ...state,
        settings: {
          ...state.settings,
          frameworks: state.settings.frameworks.filter((f) => f.id !== action.id),
          strands: state.settings.strands.filter((s) => s.frameworkId !== action.id),
          curriculum: state.settings.curriculum.filter(
            (c) => !strandIds.has(c.strandId),
          ),
        },
        lastSavedAt: formatTime(),
      };
      return purgeStatementRefs(next, removedStatementIds);
    }
    case "ADD_STRAND":
      return {
        ...state,
        settings: {
          ...state.settings,
          strands: [
            ...state.settings.strands,
            {
              id: action.strand.id ?? uid("st"),
              frameworkId: action.strand.frameworkId,
              name: action.strand.name,
              subjectId: action.strand.subjectId,
              keyStage: action.strand.keyStage,
            },
          ],
        },
        lastSavedAt: formatTime(),
      };
    case "UPDATE_STRAND":
      return {
        ...state,
        settings: {
          ...state.settings,
          strands: state.settings.strands.map((s) =>
            s.id === action.id ? { ...s, ...action.patch } : s,
          ),
        },
        lastSavedAt: formatTime(),
      };
    case "DELETE_STRAND": {
      const removedStatementIds = new Set(
        state.settings.curriculum
          .filter((c) => c.strandId === action.id)
          .map((c) => c.id),
      );
      const next = {
        ...state,
        settings: {
          ...state.settings,
          strands: state.settings.strands.filter((s) => s.id !== action.id),
          curriculum: state.settings.curriculum.filter(
            (c) => c.strandId !== action.id,
          ),
        },
        lastSavedAt: formatTime(),
      };
      return purgeStatementRefs(next, removedStatementIds);
    }
    case "ADD_STATEMENT":
      return {
        ...state,
        settings: {
          ...state.settings,
          curriculum: [
            ...state.settings.curriculum,
            {
              id: action.statement.id ?? uid("c"),
              strandId: action.statement.strandId,
              text: action.statement.text,
            },
          ],
        },
        lastSavedAt: formatTime(),
      };
    case "UPDATE_STATEMENT":
      return {
        ...state,
        settings: {
          ...state.settings,
          curriculum: state.settings.curriculum.map((c) =>
            c.id === action.id ? { ...c, ...action.patch } : c,
          ),
        },
        lastSavedAt: formatTime(),
      };
    case "DELETE_STATEMENT": {
      const removed = new Set([action.id]);
      const next = {
        ...state,
        settings: {
          ...state.settings,
          curriculum: state.settings.curriculum.filter((c) => c.id !== action.id),
        },
        lastSavedAt: formatTime(),
      };
      return purgeStatementRefs(next, removed);
    }
    case "UPDATE_ACTIVITY": {
      return {
        ...state,
        activities: state.activities.map((a) =>
          a.id === action.id
            ? {
                ...a,
                ...(action.patch ?? {}),
                content: action.content ? { ...a.content, ...action.content } : a.content,
              }
            : a,
        ),
        lastSavedAt: formatTime(),
      };
    }
    case "ADD_ACTIVITY_TO_LESSON": {
      const activity = state.activities.find((a) => a.id === action.activityId);
      if (!activity) return state;
      const newBlock = {
        id: uid("blk"),
        kind: "activity" as const,
        activityId: activity.id,
        title: activity.title,
        body: activity.content.description,
        subjectId: activity.subjectId,
        durationMin: activity.durationMin,
      };

      let lessonId = action.lessonId ?? state.activeLessonId;
      let lessons = state.lessons;

      // Empty canvas: create a fresh lesson on first add
      if (!lessonId || state.emptyMode) {
        const fresh: Lesson = {
          id: uid("les"),
          title: "New lesson",
          keyStage: state.keyStage,
          className: state.settings.className,
          yearGroup: state.settings.yearGroup,
          targetMin: state.settings.defaultTargetMin,
          termId: state.settings.terms[0]?.id ?? "aut1",
          learningObjective: "To explore and develop creative skills",
          successCriteria: ["Engage fully", "Collaborate kindly", "Reflect on learning"],
          curriculumIds: [],
          blocks: [newBlock],
        };
        return {
          ...state,
          emptyMode: false,
          lessons: [...lessons, fresh],
          activeLessonId: fresh.id,
          lastSavedAt: formatTime(),
        };
      }

      return {
        ...state,
        emptyMode: false,
        lessons: lessons.map((l) =>
          l.id === lessonId
            ? { ...l, blocks: [...l.blocks, newBlock] }
            : l,
        ),
        lastSavedAt: formatTime(),
      };
    }
    case "REORDER_LESSON_BLOCKS":
      return {
        ...state,
        lessons: state.lessons.map((l) => {
          if (l.id !== action.lessonId) return l;
          const map = new Map(l.blocks.map((b) => [b.id, b]));
          return {
            ...l,
            blocks: action.blockIds.map((id) => map.get(id)!).filter(Boolean),
          };
        }),
        lastSavedAt: formatTime(),
      };
    case "REMOVE_BLOCK":
      return {
        ...state,
        lessons: state.lessons.map((l) =>
          l.id === action.lessonId
            ? { ...l, blocks: l.blocks.filter((b) => b.id !== action.blockId) }
            : l,
        ),
        lastSavedAt: formatTime(),
      };
    case "UPDATE_BLOCK":
      return {
        ...state,
        lessons: state.lessons.map((l) =>
          l.id === action.lessonId
            ? {
                ...l,
                blocks: l.blocks.map((b) =>
                  b.id === action.blockId ? { ...b, ...action.patch } : b,
                ),
              }
            : l,
        ),
        lastSavedAt: formatTime(),
      };
    case "INSERT_FLEXIBLE": {
      const section = state.settings.sectionTypes.find((s) => s.id === action.sectionTypeId);
      const block: LessonBlock = {
        id: uid("blk"),
        kind: "flexible",
        sectionTypeId: action.sectionTypeId,
        title: section?.label ?? "Section",
        body: "",
      };
      return {
        ...state,
        lessons: state.lessons.map((l) => {
          if (l.id !== action.lessonId) return l;
          if (!action.afterBlockId) {
            return { ...l, blocks: [block, ...l.blocks] };
          }
          const idx = l.blocks.findIndex((b) => b.id === action.afterBlockId);
          const blocks = [...l.blocks];
          blocks.splice(idx + 1, 0, block);
          return { ...l, blocks };
        }),
        lastSavedAt: formatTime(),
      };
    }
    case "UPDATE_LESSON":
      return {
        ...state,
        lessons: state.lessons.map((l) =>
          l.id === action.id ? { ...l, ...action.patch } : l,
        ),
        lastSavedAt: formatTime(),
      };
    case "DUPLICATE_LESSON": {
      const src = state.lessons.find((l) => l.id === action.id);
      if (!src) return state;
      const copy: Lesson = {
        ...src,
        id: uid("les"),
        title: `${src.title} (copy)`,
        blocks: src.blocks.map((b) => ({ ...b, id: uid("blk") })),
        successCriteria: [...src.successCriteria],
        curriculumIds: [...src.curriculumIds],
      };
      return {
        ...state,
        lessons: [...state.lessons, copy],
        activeLessonId: copy.id,
        lastSavedAt: formatTime(),
      };
    }
    case "APPLY_TEMPLATE": {
      const tpl = state.templates.find((t) => t.id === action.templateId);
      if (!tpl) return state;
      const activities = state.activities.filter((a) => tpl.activityIds.includes(a.id));
      const lesson: Lesson = {
        id: uid("les"),
        title: tpl.name,
        keyStage: tpl.keyStage,
        className: state.settings.className,
        yearGroup: state.settings.yearGroup,
        targetMin: tpl.targetMin,
        termId: state.settings.terms[0]?.id ?? "aut1",
        learningObjective: "To explore and develop creative skills through this sequence",
        successCriteria: ["Engage fully", "Collaborate kindly", "Reflect on learning"],
        curriculumIds: [],
        blocks: activities.map((a) => ({
          id: uid("blk"),
          kind: "activity" as const,
          activityId: a.id,
          title: a.title,
          body: a.content.description,
          subjectId: a.subjectId,
          durationMin: a.durationMin,
        })),
      };
      return {
        ...state,
        emptyMode: false,
        keyStage: tpl.keyStage,
        lessons: [...state.lessons, lesson],
        activeLessonId: lesson.id,
        lastSavedAt: formatTime(),
      };
    }
    case "ADD_LESSON_TO_UNIT":
      return {
        ...state,
        units: state.units.map((u) =>
          u.id === action.unitId && !u.lessonIds.includes(action.lessonId)
            ? { ...u, lessonIds: [...u.lessonIds, action.lessonId] }
            : u,
        ),
        lastSavedAt: formatTime(),
      };
    case "REMOVE_LESSON_FROM_UNIT":
      return {
        ...state,
        units: state.units.map((u) =>
          u.id === action.unitId
            ? { ...u, lessonIds: u.lessonIds.filter((id) => id !== action.lessonId) }
            : u,
        ),
        lastSavedAt: formatTime(),
      };
    case "REORDER_UNIT_LESSONS":
      return {
        ...state,
        units: state.units.map((u) =>
          u.id === action.unitId ? { ...u, lessonIds: action.lessonIds } : u,
        ),
        lastSavedAt: formatTime(),
      };
    case "UPDATE_UNIT":
      return {
        ...state,
        units: state.units.map((u) =>
          u.id === action.id ? { ...u, ...action.patch } : u,
        ),
        lastSavedAt: formatTime(),
      };
    case "ADD_UNIT":
      return {
        ...state,
        units: [
          ...state.units,
          {
            id: uid("u"),
            title: action.title ?? "New unit",
            subjectId: state.settings.subjects.find((s) => !s.hidden)?.id ?? "music",
            termId: state.settings.terms[0]?.id ?? "aut1",
            lessonIds: [],
            collapsed: false,
          },
        ],
        lastSavedAt: formatTime(),
      };
    case "DUPLICATE_UNIT": {
      const src = state.units.find((u) => u.id === action.id);
      if (!src) return state;
      return {
        ...state,
        units: [
          ...state.units,
          {
            ...src,
            id: uid("u"),
            title: `${src.title} (copy)`,
            lessonIds: [...src.lessonIds],
          },
        ],
        lastSavedAt: formatTime(),
      };
    }
    case "TOGGLE_UNIT":
      return {
        ...state,
        units: state.units.map((u) =>
          u.id === action.id ? { ...u, collapsed: !u.collapsed } : u,
        ),
      };
    case "MARK_SAVED":
      return { ...state, lastSavedAt: formatTime() };
    case "PUSH_UNDO":
      return {
        ...state,
        undoStack: [...state.undoStack.slice(-19), action.snapshot],
      };
    case "UNDO": {
      if (state.undoStack.length === 0) return state;
      const stack = [...state.undoStack];
      const snap = stack.pop()!;
      return { ...applySnapshot(state, snap), undoStack: stack };
    }
    case "RESET_DEMO":
      return createInitialState(false);
    default:
      return state;
  }
}

const StoreContext = createContext<StoreValue | null>(null);

export function PlannerProvider({
  children,
  startEmpty = false,
}: {
  children: ReactNode;
  startEmpty?: boolean;
}) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    createInitialState(startEmpty),
  );
  const [ui, setUi] = useReducer(
    (s: UiExtras, p: Partial<UiExtras>) => ({ ...s, ...p }),
    { aiSuggestions: [], aiBusy: false, repromptNote: null },
  );

  const visibleSubjects = useMemo(
    () => state.settings.subjects.filter((s) => !s.hidden),
    [state.settings.subjects],
  );

  const activeLesson = useMemo(
    () => state.lessons.find((l) => l.id === state.activeLessonId) ?? null,
    [state.lessons, state.activeLessonId],
  );

  const getActivity = useCallback(
    (id: string) => state.activities.find((a) => a.id === id),
    [state.activities],
  );
  const getSubject = useCallback(
    (id: string) => state.settings.subjects.find((s) => s.id === id),
    [state.settings.subjects],
  );

  const snapshot = useCallback(() => {
    dispatch({ type: "PUSH_UNDO", snapshot: serialize(state) });
  }, [state]);

  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);

  const fleshOutWithAi = useCallback(
    (lessonId: string) => {
      const lesson = state.lessons.find((l) => l.id === lessonId);
      if (!lesson) return;
      snapshot();
      setUi({ aiBusy: true });
      window.setTimeout(() => {
        const suggestions: AiSuggestion[] = lesson.blocks
          .filter((b) => b.kind === "flexible")
          .map((b) => ({
            blockId: b.id,
            proposedBody:
              AI_FLESH_OUT[b.sectionTypeId ?? "custom"] ??
              AI_FLESH_OUT.custom,
            status: "pending",
          }));
        // Also suggest for empty activity bodies enrichment via a synthetic flexible if none
        if (suggestions.length === 0) {
          // Insert canned flexible sections then suggest
          const types = ["diff", "vocab", "afl"];
          types.forEach((sectionTypeId, i) => {
            dispatch({
              type: "INSERT_FLEXIBLE",
              lessonId,
              afterBlockId: lesson.blocks[Math.min(i, lesson.blocks.length - 1)]?.id ?? null,
              sectionTypeId,
            });
          });
          // suggestions applied on next tick after blocks exist — use direct canned on activities' follow-ups
          setUi({
            aiBusy: false,
            aiSuggestions: types.map((sectionTypeId, i) => ({
              blockId: `pending_${i}`,
              proposedBody: AI_FLESH_OUT[sectionTypeId],
              status: "pending" as const,
            })),
            repromptNote: null,
          });
          // Re-read after inserts via delayed second pass
          window.setTimeout(() => {
            // Force a flesh-out against latest by reading from a microtask — use dispatch MARK and rebuild
            setUi({
              aiBusy: false,
              aiSuggestions: [],
            });
            // Simpler path: update flexible blocks that match section types with pending suggestions
            // We'll set suggestions in App via a dedicated effect; for prototype reliability,
            // apply pending bodies as suggestions keyed after insert:
          }, 50);
          return;
        }
        setUi({ aiBusy: false, aiSuggestions: suggestions, repromptNote: null });
      }, 700);
    },
    [snapshot, state.lessons],
  );

  const acceptSuggestion = useCallback(
    (blockId: string) => {
      const sug = ui.aiSuggestions.find((s) => s.blockId === blockId);
      if (!sug || !state.activeLessonId) return;
      dispatch({
        type: "UPDATE_BLOCK",
        lessonId: state.activeLessonId,
        blockId,
        patch: {
          body: sug.proposedBody,
          ...(sug.proposedTitle ? { title: sug.proposedTitle } : {}),
        },
      });
      setUi({
        aiSuggestions: ui.aiSuggestions.map((s) =>
          s.blockId === blockId ? { ...s, status: "accepted" } : s,
        ),
      });
    },
    [ui.aiSuggestions, state.activeLessonId],
  );

  const rejectSuggestion = useCallback(
    (blockId: string) => {
      setUi({
        aiSuggestions: ui.aiSuggestions.map((s) =>
          s.blockId === blockId ? { ...s, status: "rejected" } : s,
        ),
      });
    },
    [ui.aiSuggestions],
  );

  const acceptAllSuggestions = useCallback(() => {
    ui.aiSuggestions
      .filter((s) => s.status === "pending")
      .forEach((s) => {
        if (!state.activeLessonId) return;
        dispatch({
          type: "UPDATE_BLOCK",
          lessonId: state.activeLessonId,
          blockId: s.blockId,
          patch: { body: s.proposedBody },
        });
      });
    setUi({
      aiSuggestions: ui.aiSuggestions.map((s) =>
        s.status === "pending" ? { ...s, status: "accepted" } : s,
      ),
    });
  }, [ui.aiSuggestions, state.activeLessonId]);

  const rejectAllSuggestions = useCallback(() => {
    setUi({
      aiSuggestions: ui.aiSuggestions.map((s) =>
        s.status === "pending" ? { ...s, status: "rejected" } : s,
      ),
    });
  }, [ui.aiSuggestions]);

  const clearSuggestions = useCallback(() => setUi({ aiSuggestions: [] }), []);

  const applyReprompt = useCallback(
    (_prompt: string) => {
      snapshot();
      setUi({ aiBusy: true });
      window.setTimeout(() => {
        if (state.activeLessonId) {
          dispatch({
            type: "UPDATE_LESSON",
            id: state.activeLessonId,
            patch: {
              learningObjective: AI_REPROMPT_RESPONSE,
            },
          });
        }
        setUi({
          aiBusy: false,
          repromptNote: AI_REPROMPT_RESPONSE,
        });
      }, 600);
    },
    [snapshot, state.activeLessonId],
  );

  const value: StoreValue = {
    state,
    ui,
    dispatch,
    visibleSubjects,
    activeLesson,
    lessonDuration: (lesson) => lessonDuration(lesson, state.activities),
    getActivity,
    getSubject,
    setScreen: (s) => dispatch({ type: "SET_SCREEN", screen: s }),
    snapshot,
    undo,
    fleshOutWithAi,
    acceptSuggestion,
    rejectSuggestion,
    acceptAllSuggestions,
    rejectAllSuggestions,
    clearSuggestions,
    applyReprompt,
    setAiSuggestions: (aiSuggestions) => setUi({ aiSuggestions }),
    setRepromptNote: (repromptNote) => setUi({ repromptNote }),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function usePlanner() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("usePlanner must be used within PlannerProvider");
  return ctx;
}

/** Improved AI flesh-out that inserts missing flexible sections then suggests */
export function runFleshOut(
  dispatch: React.Dispatch<Action>,
  lesson: Lesson,
  sectionTypes: SectionType[],
  setSuggestions: (s: AiSuggestion[]) => void,
  setBusy: (b: boolean) => void,
  snapshot: () => void,
) {
  snapshot();
  setBusy(true);
  const ensureTypes = ["diff", "vocab", "afl"].filter((id) =>
    sectionTypes.some((s) => s.id === id && s.enabled),
  );

  let afterId = lesson.blocks[1]?.id ?? lesson.blocks[0]?.id ?? null;
  const existingFlex = new Set(
    lesson.blocks.filter((b) => b.kind === "flexible").map((b) => b.sectionTypeId),
  );

  ensureTypes.forEach((sectionTypeId) => {
    if (!existingFlex.has(sectionTypeId)) {
      dispatch({
        type: "INSERT_FLEXIBLE",
        lessonId: lesson.id,
        afterBlockId: afterId,
        sectionTypeId,
      });
    }
  });

  window.setTimeout(() => {
    setBusy(false);
    // Suggestions will be wired by caller after state updates — return canned map
    setSuggestions(
      ensureTypes.map((sectionTypeId) => ({
        blockId: sectionTypeId, // caller remaps to real ids
        proposedBody: AI_FLESH_OUT[sectionTypeId] ?? AI_FLESH_OUT.custom,
        status: "pending",
      })),
    );
  }, 650);
}
