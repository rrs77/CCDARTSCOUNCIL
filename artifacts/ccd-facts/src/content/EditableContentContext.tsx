import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  buildDefaults,
  clearSnapshot,
  downloadSnapshot,
  loadSnapshot,
  newCustomBlock,
  newGlanceFigure,
  newGlancePage,
  saveSnapshot,
  type EditableBlock,
  type EditableGlancePage,
  type EditableSnapshot,
  type EditableTopic,
} from "./editableStore";

type Ctx = {
  editMode: boolean;
  setEditMode: (on: boolean) => void;
  snap: EditableSnapshot;
  setSnap: React.Dispatch<React.SetStateAction<EditableSnapshot>>;
  updateSnap: (fn: (prev: EditableSnapshot) => EditableSnapshot) => void;
  resetToOriginal: () => void;
  downloadJson: () => void;
  // Glance helpers
  setGlanceTitle: (title: string) => void;
  setGlancePage: (pageIndex: number, page: EditableGlancePage) => void;
  addGlancePage: () => void;
  removeGlancePage: (pageIndex: number) => void;
  addGlanceFigure: (pageIndex: number) => void;
  removeGlanceFigure: (pageIndex: number, figureId: string) => void;
  addGlanceBlock: (pageIndex: number) => void;
  removeGlanceBlock: (pageIndex: number, blockId: string) => void;
  updateGlanceBlock: (pageIndex: number, blockId: string, patch: Partial<EditableBlock>) => void;
  // Topic helpers
  getTopic: (id: string) => EditableTopic | undefined;
  updateTopic: (id: string, patch: Partial<EditableTopic>) => void;
  addTopicBlock: (topicId: string) => void;
  removeTopicBlock: (topicId: string, blockId: string) => void;
  updateTopicBlock: (topicId: string, blockId: string, patch: Partial<EditableBlock>) => void;
  setSituationHeadline: (v: string) => void;
  setSituationLine: (v: string) => void;
  setExploreHint: (v: string) => void;
};

const EditableContentContext = createContext<Ctx | null>(null);

export function EditableContentProvider({
  children,
  initialEdit,
}: {
  children: ReactNode;
  initialEdit?: boolean;
}) {
  const [editMode, setEditModeState] = useState(!!initialEdit);
  const [snap, setSnap] = useState<EditableSnapshot>(() => buildDefaults());

  useEffect(() => {
    setSnap(loadSnapshot());
  }, []);

  const setEditMode = useCallback((on: boolean) => {
    setEditModeState(on);
    const url = new URL(window.location.href);
    if (on) url.searchParams.set("edit", "1");
    else url.searchParams.delete("edit");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }, []);

  const updateSnap = useCallback((fn: (prev: EditableSnapshot) => EditableSnapshot) => {
    setSnap((prev) => {
      const next = fn(prev);
      saveSnapshot(next);
      return next;
    });
  }, []);

  const resetToOriginal = useCallback(() => {
    clearSnapshot();
    setSnap(buildDefaults());
  }, []);

  const downloadJson = useCallback(() => {
    downloadSnapshot(snap);
  }, [snap]);

  const value = useMemo<Ctx>(() => {
    return {
      editMode,
      setEditMode,
      snap,
      setSnap,
      updateSnap,
      resetToOriginal,
      downloadJson,
      setGlanceTitle: (title) => updateSnap((s) => ({ ...s, glanceTitle: title })),
      setGlancePage: (pageIndex, page) =>
        updateSnap((s) => {
          const pages = [...s.glancePages];
          pages[pageIndex] = page;
          return { ...s, glancePages: pages };
        }),
      addGlancePage: () =>
        updateSnap((s) => ({ ...s, glancePages: [...s.glancePages, newGlancePage()] })),
      removeGlancePage: (pageIndex) =>
        updateSnap((s) => ({
          ...s,
          glancePages: s.glancePages.filter((_, i) => i !== pageIndex),
        })),
      addGlanceFigure: (pageIndex) =>
        updateSnap((s) => {
          const pages = [...s.glancePages];
          const p = { ...pages[pageIndex] };
          p.figures = [...(p.figures ?? []), newGlanceFigure()];
          pages[pageIndex] = p;
          return { ...s, glancePages: pages };
        }),
      removeGlanceFigure: (pageIndex, figureId) =>
        updateSnap((s) => {
          const pages = [...s.glancePages];
          const p = { ...pages[pageIndex] };
          p.figures = (p.figures ?? []).filter((f) => (f as { id?: string }).id !== figureId);
          pages[pageIndex] = p;
          return { ...s, glancePages: pages };
        }),
      addGlanceBlock: (pageIndex) =>
        updateSnap((s) => {
          const pages = [...s.glancePages];
          const p = { ...pages[pageIndex] };
          p.customBlocks = [...(p.customBlocks ?? []), newCustomBlock()];
          pages[pageIndex] = p;
          return { ...s, glancePages: pages };
        }),
      removeGlanceBlock: (pageIndex, blockId) =>
        updateSnap((s) => {
          const pages = [...s.glancePages];
          const p = { ...pages[pageIndex] };
          p.customBlocks = (p.customBlocks ?? []).filter((b) => b.id !== blockId);
          pages[pageIndex] = p;
          return { ...s, glancePages: pages };
        }),
      updateGlanceBlock: (pageIndex, blockId, patch) =>
        updateSnap((s) => {
          const pages = [...s.glancePages];
          const p = { ...pages[pageIndex] };
          p.customBlocks = (p.customBlocks ?? []).map((b) =>
            b.id === blockId ? { ...b, ...patch } : b,
          );
          pages[pageIndex] = p;
          return { ...s, glancePages: pages };
        }),
      getTopic: (id) => snap.topics.find((t) => t.id === id),
      updateTopic: (id, patch) =>
        updateSnap((s) => ({
          ...s,
          topics: s.topics.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      addTopicBlock: (topicId) =>
        updateSnap((s) => ({
          ...s,
          topics: s.topics.map((t) =>
            t.id === topicId
              ? { ...t, customBlocks: [...(t.customBlocks ?? []), newCustomBlock()] }
              : t,
          ),
        })),
      removeTopicBlock: (topicId, blockId) =>
        updateSnap((s) => ({
          ...s,
          topics: s.topics.map((t) =>
            t.id === topicId
              ? { ...t, customBlocks: (t.customBlocks ?? []).filter((b) => b.id !== blockId) }
              : t,
          ),
        })),
      updateTopicBlock: (topicId, blockId, patch) =>
        updateSnap((s) => ({
          ...s,
          topics: s.topics.map((t) =>
            t.id === topicId
              ? {
                  ...t,
                  customBlocks: (t.customBlocks ?? []).map((b) =>
                    b.id === blockId ? { ...b, ...patch } : b,
                  ),
                }
              : t,
          ),
        })),
      setSituationHeadline: (v) => updateSnap((s) => ({ ...s, situationHeadline: v })),
      setSituationLine: (v) => updateSnap((s) => ({ ...s, situationLine: v })),
      setExploreHint: (v) => updateSnap((s) => ({ ...s, exploreHint: v })),
    };
  }, [downloadJson, editMode, resetToOriginal, setEditMode, snap, updateSnap]);

  return (
    <EditableContentContext.Provider value={value}>{children}</EditableContentContext.Provider>
  );
}

export function useEditableContent() {
  const ctx = useContext(EditableContentContext);
  if (!ctx) throw new Error("useEditableContent requires EditableContentProvider");
  return ctx;
}
