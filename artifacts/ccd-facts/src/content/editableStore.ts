/**
 * Local edit overlay for The facts.
 * Defaults come from facts.content.ts; edits persist in localStorage.
 */
import {
  glanceModal,
  meta,
  topics as defaultTopics,
  type GlanceFigure,
  type GlancePage,
  type TopicDef,
} from "./facts.content";

export const EDIT_STORAGE_KEY = "ccd-facts-edit-v1";

export type EditableBlock = {
  id: string;
  title: string;
  body: string;
};

export type EditableGlancePage = GlancePage & {
  figures?: Array<GlanceFigure & { id?: string }>;
  sections?: Array<{
    id?: string;
    title: string;
    figures: Array<GlanceFigure & { id?: string }>;
    caveat?: string;
  }>;
  customBlocks?: EditableBlock[];
};

export type EditableTopic = {
  id: string;
  markerLabel: string;
  title: string;
  investorLine: string;
  body: string[];
  whyThisMattersForCCD: string;
  customBlocks?: EditableBlock[];
  /** Keep chart wiring from source of truth */
  chartIds?: string[];
  nestedChartIds?: string[];
  statIds?: string[];
  sourceIds: string[];
  x: number;
  y: number;
  neighbors: TopicDef["neighbors"];
};

export type EditableSnapshot = {
  version: 1;
  situationHeadline: string;
  situationLine: string;
  exploreHint: string;
  glanceTitle: string;
  glancePages: EditableGlancePage[];
  topics: EditableTopic[];
};

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function withFigureIds(figures: GlanceFigure[] | undefined): Array<GlanceFigure & { id: string }> {
  return (figures ?? []).map((f, i) => ({
    ...f,
    id: (f as GlanceFigure & { id?: string }).id ?? `fig-${i}-${f.label.slice(0, 12)}`,
  }));
}

export function buildDefaults(): EditableSnapshot {
  return {
    version: 1,
    situationHeadline: meta.situationHeadline,
    situationLine: meta.situationLine,
    exploreHint: meta.ui.exploreHint,
    glanceTitle: glanceModal.title,
    glancePages: glanceModal.pages.map((p) => ({
      ...p,
      figures: withFigureIds(p.figures),
      sections: p.sections?.map((s, si) => ({
        id: `sec-${p.id}-${si}`,
        ...s,
        figures: withFigureIds(s.figures),
      })),
      customBlocks: [],
    })),
    topics: defaultTopics.map((t) => ({
      id: t.id,
      markerLabel: t.markerLabel,
      title: t.title,
      investorLine: t.investorLine,
      body: [...t.body],
      whyThisMattersForCCD: t.whyThisMattersForCCD,
      chartIds: t.chartIds,
      nestedChartIds: t.nestedChartIds,
      statIds: t.statIds,
      sourceIds: t.sourceIds,
      x: t.x,
      y: t.y,
      neighbors: t.neighbors,
      customBlocks: [],
    })),
  };
}

export function loadSnapshot(): EditableSnapshot {
  const defaults = buildDefaults();
  try {
    const raw = localStorage.getItem(EDIT_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<EditableSnapshot>;
    if (parsed.version !== 1) return defaults;
    return {
      ...defaults,
      ...parsed,
      version: 1,
      glancePages: parsed.glancePages?.length ? parsed.glancePages : defaults.glancePages,
      topics: parsed.topics?.length
        ? defaults.topics.map((dt) => {
            const overlay = parsed.topics?.find((t) => t.id === dt.id);
            return overlay ? { ...dt, ...overlay, neighbors: dt.neighbors, x: dt.x, y: dt.y } : dt;
          })
        : defaults.topics,
    };
  } catch {
    return defaults;
  }
}

export function saveSnapshot(snap: EditableSnapshot) {
  localStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(snap));
}

export function clearSnapshot() {
  localStorage.removeItem(EDIT_STORAGE_KEY);
}

export function downloadSnapshot(snap: EditableSnapshot) {
  const blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "facts-content-edits.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function newCustomBlock(): EditableBlock {
  return { id: uid("block"), title: "New heading", body: "Add your text here." };
}

export function newGlancePage(): EditableGlancePage {
  return {
    id: uid("page"),
    heading: "New page",
    summary: "",
    figures: [],
    customBlocks: [newCustomBlock()],
  };
}

export function newGlanceFigure(): GlanceFigure & { id: string } {
  return {
    id: uid("fig"),
    value: "—",
    label: "New figure",
    source: "Source",
  };
}

export function isEditingField(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.getAttribute("role") === "textbox";
}
