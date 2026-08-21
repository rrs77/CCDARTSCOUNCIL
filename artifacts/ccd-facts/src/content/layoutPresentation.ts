/**
 * Lean Prezi layout from CONTENT.md — overlap-safe grid.
 * Root hubs sit on a quiet pathway grid with large gutters.
 * Leaf frames are parked far below (path/modal only) so they never
 * collide with hub overview scenes.
 */

import {
  parseContentMarkdown,
  type ContentBlock,
  type ParsedDocument,
} from "./parseContent";

export type SceneKind = "title" | "hub" | "leaf" | "sources";
export type PhotoCrop = "classroom" | "drama" | "dance" | "wide";

export type FrameNode = {
  id: string;
  parentId: string | null;
  mainSectionId: string;
  sequence: number;
  level: 1 | 2 | 3;
  kind: SceneKind;
  title: string;
  titleSmall: string;
  titleGiant: string;
  navLabel: string;
  x: number;
  y: number;
  w: number;
  h: number;
  sentence: string;
  heroStat?: { value: string; label: string };
  quote?: string;
  chartId?: string;
  photoHero: boolean;
  photoCrop: PhotoCrop;
  footnotes?: ParsedDocument["footnotes"];
  childIds: string[];
  /** Full CONTENT.md blocks for this section (modal body). */
  blocks: ContentBlock[];
  /** Nested ### sections for hub detail modals */
  subsections?: { title: string; blocks: ContentBlock[] }[];
};

export type Presentation = {
  title: string;
  world: { width: number; height: number; heroImage: string };
  frames: FrameNode[];
  path: string[];
  mainSectionIds: string[];
};

const MAX_CHILDREN = 4;
/** Uniform zone — sized so rest-camera body stays ≥18px; overview uses readable target scale */
const FRAME_W = 1180;
const FRAME_H = 780;
/** Tight gutters so Overview isn’t empty green with postage stamps — still ≥48px clear */
const GUTTER = 280;
const PAD = 220;
/** Park leaves well below the hub band */
const LEAF_BAND_GAP = 4200;

function uniqueId(base: string, used: Set<string>): string {
  let id = base;
  let n = 2;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}

/**
 * Two-tier title. Prefer wrapping-friendly giants (≤2 words) and keep
 * the rest as the small line so “MUSIC EDUCATION” isn’t cropped.
 */
export function splitTitle(title: string): { small: string; giant: string } {
  const words = title.trim().split(/\s+/);
  if (words.length === 1) return { small: "", giant: words[0]!.toUpperCase() };
  if (/^(the|a|an)\b/i.test(words[0]!)) {
    return { small: words[0]!, giant: words.slice(1).join(" ").toUpperCase() };
  }
  if (words.length === 2) {
    return { small: words[0]!, giant: words[1]!.toUpperCase() };
  }
  // Long titles: small = lead phrase, giant = last 1–2 words (wraps inside card)
  const giantCount = words.length >= 5 ? 2 : 1;
  return {
    small: words.slice(0, -giantCount).join(" "),
    giant: words.slice(-giantCount).join(" ").toUpperCase(),
  };
}

function firstSentence(text: string): string {
  const t = text.trim();
  const m = t.match(/^(.+?[.!?])(?:\s|$)/);
  if (m && m[1]!.length >= 28) return m[1]!;
  if (t.length <= 140) return t;
  return t.slice(0, 137).replace(/\s+\S*$/, "") + "…";
}

function shortLabel(text: string, max = 28): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

function leafTitleFromSentence(sentence: string, fallback: string): string {
  const t = sentence.replace(/\s+/g, " ").trim();
  const words = t.split(/\s+/).slice(0, 4).join(" ");
  if (words.length >= 8) return shortLabel(words.replace(/[.!?…]+$/, ""), 36);
  return fallback;
}

const CROPS: PhotoCrop[] = ["classroom", "drama", "dance", "wide"];

type Proto = {
  id: string;
  parentId: string | null;
  mainSectionId: string;
  level: 1 | 2 | 3;
  kind: SceneKind;
  title: string;
  sentence: string;
  heroStat?: { value: string; label: string };
  quote?: string;
  chartId?: string;
  photoHero: boolean;
  photoCrop: PhotoCrop;
  footnotes?: ParsedDocument["footnotes"];
  blocks: ContentBlock[];
  subsections?: { title: string; blocks: ContentBlock[] }[];
};

export function expandToProtos(doc: ParsedDocument): Proto[] {
  const used = new Set<string>(["title", "overview"]);
  const protos: Proto[] = [];
  let cropIdx = 0;
  const nextCrop = (): PhotoCrop => CROPS[cropIdx++ % CROPS.length]!;

  protos.push({
    id: "title",
    parentId: null,
    mainSectionId: "title",
    level: 1,
    kind: "title",
    title: doc.title,
    sentence: doc.lead[0] ? firstSentence(doc.lead[0]) : "",
    photoHero: true,
    photoCrop: nextCrop(),
    blocks: doc.lead.map((text) => ({ type: "paragraph" as const, text })),
  });

  const mains = doc.sections.filter((s) => s.level === 2);
  const nested = doc.sections.filter((s) => s.level === 3);

  for (const sec of mains) {
    const isSources = /^sources$/i.test(sec.title);
    const paras = sec.blocks.filter((b) => b.type === "paragraph") as Extract<
      ContentBlock,
      { type: "paragraph" }
    >[];
    const stats = sec.blocks.filter((b) => b.type === "stat") as Extract<
      ContentBlock,
      { type: "stat" }
    >[];
    const quotes = sec.blocks.filter((b) => b.type === "quote") as Extract<
      ContentBlock,
      { type: "quote" }
    >[];
    const charts = sec.blocks.filter((b) => b.type === "chart") as Extract<
      ContentBlock,
      { type: "chart" }
    >[];

    const hubId = sec.id;
    used.add(hubId);
    const crop = nextCrop();

    // One hero only: prefer chart OR one stat OR photo — never stack competing ovals.
    // “A solution” is a product zone: no exam/funding graph on the pathway surface.
    const isSolution = hubId === "a-solution";
    const hubChart =
      !isSources && !isSolution && charts[0] ? charts[0].chartId : undefined;
    const hubStat =
      !isSources && !hubChart && stats[0]
        ? { value: stats[0].value, label: shortLabel(stats[0].label, 48) }
        : undefined;

    protos.push({
      id: hubId,
      parentId: null,
      mainSectionId: hubId,
      level: 2,
      kind: isSources ? "sources" : "hub",
      title: sec.title,
      sentence: paras[0]
        ? firstSentence(paras[0].text)
        : quotes[0]
          ? firstSentence(quotes[0].text)
          : "",
      heroStat: hubStat,
      chartId: hubChart,
      quote: quotes[0] ? firstSentence(quotes[0].text) : undefined,
      // Classroom photo ONLY on The situation — unique illustration, not reused
      photoHero: hubId === "the-situation" && !hubStat && !hubChart && !isSources,
      photoCrop: crop,
      footnotes: isSources ? doc.footnotes : undefined,
      blocks: sec.blocks,
      subsections: nested
        .filter((n) => n.parentId === sec.id)
        .map((n) => ({ title: n.title, blocks: n.blocks })),
    });

    type ChildSpec = {
      id: string;
      title: string;
      sentence: string;
      heroStat?: { value: string; label: string };
      chartId?: string;
      quote?: string;
      photoHero: boolean;
      blocks: ContentBlock[];
    };
    const children: ChildSpec[] = [];
    const usedChildTitles = new Set<string>([sec.title.trim().toLowerCase()]);

    const takeTitle = (raw: string): string => {
      let t = raw.trim();
      const key = t.toLowerCase();
      if (!usedChildTitles.has(key)) {
        usedChildTitles.add(key);
        return t;
      }
      let n = 2;
      while (usedChildTitles.has(`${key} ${n}`)) n += 1;
      t = `${raw.trim()} ${n}`;
      usedChildTitles.add(t.toLowerCase());
      return t;
    };

    for (const kid of nested.filter((n) => n.parentId === sec.id)) {
      if (children.length >= MAX_CHILDREN) break;
      const kParas = kid.blocks.filter((b) => b.type === "paragraph") as Extract<
        ContentBlock,
        { type: "paragraph" }
      >[];
      const kStats = kid.blocks.filter((b) => b.type === "stat") as Extract<
        ContentBlock,
        { type: "stat" }
      >[];
      const kCharts = kid.blocks.filter((b) => b.type === "chart") as Extract<
        ContentBlock,
        { type: "chart" }
      >[];
      used.add(kid.id);
      children.push({
        id: kid.id,
        title: takeTitle(kid.title),
        sentence: kParas[0]
          ? firstSentence(kParas[0].text)
          : kStats[0]
            ? shortLabel(kStats[0].label, 90)
            : firstSentence(kid.title),
        heroStat: kStats[0]
          ? { value: kStats[0].value, label: shortLabel(kStats[0].label, 48) }
          : undefined,
        chartId: !kStats[0] ? kCharts[0]?.chartId : undefined,
        photoHero: false,
        blocks: kid.blocks,
      });
    }

    for (let i = 1; i < paras.length && children.length < MAX_CHILDREN; i++) {
      const sentence = firstSentence(paras[i]!.text);
      const id = uniqueId(`${hubId}-more-${i}`, used);
      children.push({
        id,
        title: takeTitle(leafTitleFromSentence(sentence, `More ${i}`)),
        sentence,
        photoHero: false,
        blocks: [{ type: "paragraph", text: paras[i]!.text }],
      });
    }

    // Extra stats (beyond hub hero) → leaf stops — not second ovals on the hub
    const startStat = hubStat ? 1 : 0;
    for (let i = startStat; i < stats.length && children.length < MAX_CHILDREN; i++) {
      const st = stats[i]!;
      const id = uniqueId(`${hubId}-stat-${i}`, used);
      children.push({
        id,
        title: takeTitle(shortLabel(st.label.split(/[—(]/)[0] || st.label, 36)),
        sentence: shortLabel(st.label, 100),
        heroStat: { value: st.value, label: shortLabel(st.label, 48) },
        photoHero: false,
        blocks: [{ type: "stat", value: st.value, label: st.label }],
      });
    }

    // Extra charts only if hub didn’t take the first
    if (!hubChart && charts[0] && children.length < MAX_CHILDREN) {
      const c = charts[0];
      const id = uniqueId(`${hubId}-${c.chartId}`, used);
      children.push({
        id,
        title: takeTitle("Chart"),
        sentence: "Detail from the evidence overview.",
        chartId: c.chartId,
        photoHero: false,
        blocks: [{ type: "chart", chartId: c.chartId }],
      });
    }

    for (const ch of children) {
      protos.push({
        id: ch.id,
        parentId: hubId,
        mainSectionId: hubId,
        level: 3,
        kind: "leaf",
        title: ch.title,
        sentence: ch.sentence,
        heroStat: ch.heroStat,
        quote: ch.quote,
        chartId: ch.chartId,
        photoHero: ch.photoHero,
        photoCrop: crop,
        blocks: ch.blocks,
      });
    }
  }

  return protos;
}

/** Quiet pathway grid for hubs — fixed columns, large gutters, no AABB overlap. */
function placeHubsOnGrid(hubs: FrameNode[]): void {
  // Pathway bands (story order):
  // 0: title (full width slot)
  // 1: situation + key stages (primary, secondary, a-level)
  // 2: after school (HE, hubs) + solution + sources
  const COLS = 3;
  const cellW = FRAME_W + GUTTER;
  const cellH = FRAME_H + GUTTER;

  const title = hubs.find((h) => h.kind === "title");
  const rest = hubs.filter((h) => h.kind !== "title");

  if (title) {
    title.x = PAD;
    title.y = PAD;
    title.w = FRAME_W;
    title.h = FRAME_H;
  }

  // Extra vertical air after title before the stage band
  const band0Y = PAD + (title ? FRAME_H + GUTTER : 0);

  rest.forEach((hub, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    hub.x = PAD + col * cellW;
    hub.y = band0Y + row * cellH;
    hub.w = FRAME_W;
    // Chart hubs need more height so ticks/labels aren’t cropped
    hub.h = hub.chartId ? FRAME_H + 80 : FRAME_H;
  });
}

function aabbOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
  pad = 48,
): boolean {
  return !(
    a.x + a.w + pad <= b.x ||
    b.x + b.w + pad <= a.x ||
    a.y + a.h + pad <= b.y ||
    b.y + b.h + pad <= a.y
  );
}

export function buildPresentation(doc: ParsedDocument): Presentation {
  const protos = expandToProtos(doc);
  const frames: FrameNode[] = [];
  let sequence = 0;
  const usedGiants = new Set<string>();

  const roots = protos.filter((p) => !p.parentId);
  const hubFrames: FrameNode[] = [];

  for (const p of roots) {
    let { small, giant } = splitTitle(p.title);
    if (usedGiants.has(giant.toLowerCase())) {
      const alt = splitTitle(`${p.title} detail`);
      small = alt.small || small;
      giant = alt.giant;
    }
    usedGiants.add(giant.toLowerCase());

    const node: FrameNode = {
      id: p.id,
      parentId: null,
      mainSectionId: p.mainSectionId,
      sequence: sequence++,
      level: p.level,
      kind: p.kind,
      title: p.title,
      titleSmall: small,
      titleGiant: giant,
      navLabel: p.title,
      x: 0,
      y: 0,
      w: FRAME_W,
      h: FRAME_H,
      sentence: p.sentence,
      heroStat: p.heroStat,
      quote: p.quote,
      chartId: p.chartId,
      photoHero: p.photoHero,
      photoCrop: p.photoCrop,
      footnotes: p.footnotes,
      childIds: [],
      blocks: p.blocks,
      subsections: p.subsections,
    };
    hubFrames.push(node);
    frames.push(node);
  }

  placeHubsOnGrid(hubFrames);

  // Assert / resolve hub overlaps by pushing down
  for (let i = 0; i < hubFrames.length; i++) {
    for (let j = i + 1; j < hubFrames.length; j++) {
      const a = hubFrames[i]!;
      const b = hubFrames[j]!;
      let guard = 0;
      while (aabbOverlap(a, b, 48) && guard < 40) {
        b.y += GUTTER;
        guard += 1;
      }
    }
  }

  let hubMaxY = 0;
  for (const h of hubFrames) hubMaxY = Math.max(hubMaxY, h.y + h.h);

  // Leaves parked in a distant band — never on the overview constellation
  const leafProtos = protos.filter((p) => p.parentId);
  leafProtos.forEach((p, i) => {
    let { small, giant } = splitTitle(p.title);
    if (usedGiants.has(giant.toLowerCase())) {
      const alt = splitTitle(`${p.title} detail`);
      small = alt.small || small;
      giant = alt.giant;
    }
    usedGiants.add(giant.toLowerCase());

    const col = i % 4;
    const row = Math.floor(i / 4);
    const node: FrameNode = {
      id: p.id,
      parentId: p.parentId,
      mainSectionId: p.mainSectionId,
      sequence: sequence++,
      level: 3,
      kind: "leaf",
      title: p.title,
      titleSmall: small,
      titleGiant: giant,
      navLabel: p.heroStat ? p.heroStat.value : p.title,
      x: PAD + col * (FRAME_W + GUTTER),
      y: hubMaxY + LEAF_BAND_GAP + row * (FRAME_H + GUTTER),
      w: FRAME_W,
      h: p.chartId ? FRAME_H + 40 : FRAME_H,
      sentence: p.sentence,
      heroStat: p.heroStat,
      quote: p.quote,
      chartId: p.chartId,
      photoHero: p.photoHero,
      photoCrop: p.photoCrop,
      childIds: [],
      blocks: p.blocks,
    };
    frames.push(node);
  });

  for (const f of frames) {
    if (f.parentId) continue;
    f.childIds = frames.filter((c) => c.parentId === f.id).map((c) => c.id);
  }

  // World bounds = hub constellation only (leaves are off-canvas / modal).
  // Including the leaf band made Overview a postage-stamp cluster in empty green.
  let maxX = 0;
  let maxY = 0;
  for (const f of hubFrames) {
    maxX = Math.max(maxX, f.x + f.w);
    maxY = Math.max(maxY, f.y + f.h);
  }

  // Path: overview → each hub then its children → overview
  const path: string[] = ["overview"];
  for (const hub of hubFrames) {
    path.push(hub.id);
    for (const cid of hub.childIds) path.push(cid);
  }
  path.push("overview");

  return {
    title: doc.title,
    world: {
      width: Math.max(4200, maxX + PAD),
      height: Math.max(2800, maxY + PAD),
      heroImage: "hero-arts.jpg",
    },
    frames,
    path,
    mainSectionIds: hubFrames.filter((h) => h.kind !== "title").map((h) => h.id),
  };
}

/** Edge-to-edge connector that stays in gutters (never through frame centres). */
export function buildHubConnectorPath(frames: FrameNode[]): string {
  const hubs = frames.filter((f) => !f.parentId);
  if (hubs.length < 2) return "";
  // Story order = sequence order among roots
  const ordered = [...hubs].sort((a, b) => a.sequence - b.sequence);
  let d = "";
  for (let i = 0; i < ordered.length - 1; i++) {
    const a = ordered[i]!;
    const b = ordered[i + 1]!;
    const aRight = a.x + a.w;
    const aCx = a.x + a.w / 2;
    const aCy = a.y + a.h / 2;
    const bLeft = b.x;
    const bCx = b.x + b.w / 2;
    const bCy = b.y + b.h / 2;

    // Same row → horizontal gutter connector (edge midpoints)
    if (Math.abs(a.y - b.y) < 80) {
      const y = a.y + a.h / 2;
      const x1 = aRight;
      const x2 = bLeft;
      const mid = (x1 + x2) / 2;
      d += `${d ? " " : ""}M ${x1} ${y} C ${mid} ${y}, ${mid} ${y}, ${x2} ${y}`;
      continue;
    }

    // Different row → go down from bottom centre, along gutter, into top centre
    const x1 = aCx;
    const y1 = a.y + a.h;
    const x2 = bCx;
    const y2 = b.y;
    const midY = (y1 + y2) / 2;
    d += `${d ? " " : ""}M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
  }
  return d;
}

export function framesOverlap(
  frames: FrameNode[],
  pad = 48,
): { a: string; b: string }[] {
  const hits: { a: string; b: string }[] = [];
  const roots = frames.filter((f) => !f.parentId);
  for (let i = 0; i < roots.length; i++) {
    for (let j = i + 1; j < roots.length; j++) {
      const a = roots[i]!;
      const b = roots[j]!;
      if (aabbOverlap(a, b, pad)) hits.push({ a: a.id, b: b.id });
    }
  }
  return hits;
}

export function getFrame(pres: Presentation, id: string | null | undefined): FrameNode | undefined {
  if (!id || id === "overview") return undefined;
  return pres.frames.find((f) => f.id === id);
}

export function presentationFromMarkdown(md: string): Presentation {
  return buildPresentation(parseContentMarkdown(md));
}
