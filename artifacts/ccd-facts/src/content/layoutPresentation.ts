/**
 * Lay out parsed CONTENT.md sections on a Prezi world canvas.
 * Adding a ## creates a new frame; size grows with content.
 */

import {
  estimateSectionSize,
  type ContentSection,
  type ParsedDocument,
} from "./parseContent";

export type FrameNode = {
  id: string;
  parentId: string | null;
  mainSectionId: string;
  sequence: number;
  level: 1 | 2 | 3;
  title: string;
  navLabel: string;
  x: number;
  y: number;
  w: number;
  h: number;
  section: ContentSection | null;
  /** Title / lead card */
  lead?: string[];
  footnotes?: ParsedDocument["footnotes"];
};

export type Presentation = {
  title: string;
  world: { width: number; height: number; heroImage: string };
  frames: FrameNode[];
  /** Guided path: overview sentinel then frame ids then overview */
  path: string[];
  mainSectionIds: string[];
};

const GAP_X = 160;
const GAP_Y = 140;
const PAD = 200;
const COLS = 3;

export function buildPresentation(doc: ParsedDocument): Presentation {
  const frames: FrameNode[] = [];
  let sequence = 0;

  // Title card
  const titleW = 1200;
  const titleH = 520 + doc.lead.length * 40;
  const titleFrame: FrameNode = {
    id: "title",
    parentId: null,
    mainSectionId: "title",
    sequence: sequence++,
    level: 1,
    title: doc.title,
    navLabel: "Title",
    x: PAD,
    y: PAD,
    w: titleW,
    h: Math.max(560, titleH),
    section: null,
    lead: doc.lead,
  };
  frames.push(titleFrame);

  const mains = doc.sections.filter((s) => s.level === 2);
  const nested = doc.sections.filter((s) => s.level === 3);

  // Pathway: place main sections in a serpentine grid after the title
  const mainFrames: FrameNode[] = [];
  let col = 1;
  let row = 0;
  // Title takes col 0 row 0; start mains at col 1
  mains.forEach((sec, i) => {
    const isSources = /^sources$/i.test(sec.title);
    const { w, h } = estimateSectionSize(sec, isSources);
    if (col >= COLS) {
      col = 0;
      row += 1;
    }
    // Rough cell origin; refine after measuring row heights
    const cellX = PAD + col * (1280 + GAP_X);
    const cellY = PAD + row * (780 + GAP_Y);
    const node: FrameNode = {
      id: sec.id,
      parentId: null,
      mainSectionId: sec.id,
      sequence: sequence++,
      level: 2,
      title: sec.title,
      navLabel: sec.title,
      x: cellX,
      y: cellY,
      w,
      h,
      section: sec,
      footnotes: isSources ? doc.footnotes : undefined,
    };
    mainFrames.push(node);
    frames.push(node);
    col += 1;
    void i;
  });

  // Re-flow mains by measured heights per row for tighter packing
  {
    type Row = { nodes: FrameNode[]; maxH: number };
    const rows: Row[] = [];
    let r: Row = { nodes: [], maxH: 0 };
    // Put title alone on first conceptual row, then pack mains
    const allMain = mainFrames;
    allMain.forEach((n, idx) => {
      if (r.nodes.length >= COLS) {
        rows.push(r);
        r = { nodes: [], maxH: 0 };
      }
      r.nodes.push(n);
      r.maxH = Math.max(r.maxH, n.h);
      if (idx === allMain.length - 1) rows.push(r);
    });

    let y = PAD + titleFrame.h + GAP_Y + 40;
    for (const rowData of rows) {
      let x = PAD;
      for (const n of rowData.nodes) {
        n.x = x;
        n.y = y;
        x += n.w + GAP_X;
      }
      y += rowData.maxH + GAP_Y;
    }
  }

  // Nested frames: sit below-right of parent, offset by index
  const nestedByParent = new Map<string, ContentSection[]>();
  for (const n of nested) {
    if (!n.parentId) continue;
    const list = nestedByParent.get(n.parentId) ?? [];
    list.push(n);
    nestedByParent.set(n.parentId, list);
  }

  for (const [parentId, kids] of nestedByParent) {
    const parent = frames.find((f) => f.id === parentId);
    if (!parent) continue;
    kids.forEach((sec, ki) => {
      const { w, h } = estimateSectionSize(sec, false);
      const node: FrameNode = {
        id: sec.id,
        parentId,
        mainSectionId: parent.mainSectionId,
        sequence: sequence++,
        level: 3,
        title: sec.title,
        navLabel: sec.title,
        x: parent.x + parent.w + GAP_X * 0.55,
        y: parent.y + ki * (h + GAP_Y * 0.65),
        w,
        h,
        section: sec,
      };
      frames.push(node);
    });
  }

  // World bounds
  let maxX = 0;
  let maxY = 0;
  for (const f of frames) {
    maxX = Math.max(maxX, f.x + f.w);
    maxY = Math.max(maxY, f.y + f.h);
  }

  // Guided path: title → each main → its nested (doc order) → next main → …
  const path: string[] = ["overview", "title"];
  for (const main of mains) {
    path.push(main.id);
    const kids = nested.filter((n) => n.parentId === main.id);
    for (const k of kids) path.push(k.id);
  }
  path.push("overview");

  return {
    title: doc.title,
    world: {
      width: Math.max(3600, maxX + PAD),
      height: Math.max(2400, maxY + PAD),
      heroImage: "hero-arts.jpg",
    },
    frames,
    path,
    mainSectionIds: mains.map((m) => m.id),
  };
}

export function getFrame(pres: Presentation, id: string | null | undefined): FrameNode | undefined {
  if (!id || id === "overview") return undefined;
  return pres.frames.find((f) => f.id === id);
}
