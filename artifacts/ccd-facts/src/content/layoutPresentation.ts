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
/** Tight enough for a readable overview constellation; still ≥48px clear between frames */
const GUTTER = 200;
const PAD = 180;
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
const ARTICLE = /^(the|a|an)$/i;

export function splitTitle(title: string): { small: string; giant: string } {
  const trimmed = title.trim();
  const words = trimmed.split(/\s+/);
  if (words.length <= 1) return { small: "", giant: trimmed.toUpperCase() };

  // Keep “A solution” / “The facts” together — never a stray article kicker.
  if (ARTICLE.test(words[0]!) && words.length <= 3) {
    return { small: "", giant: trimmed.toUpperCase() };
  }

  if (words.length === 2) {
    return { small: words[0]!, giant: words[1]!.toUpperCase() };
  }

  const giantCount = words.length >= 5 ? 2 : 1;
  const small = words.slice(0, -giantCount).join(" ");
  const giant = words.slice(-giantCount).join(" ").toUpperCase();
  if (ARTICLE.test(small) || small.length <= 2) {
    return { small: "", giant: trimmed.toUpperCase() };
  }
  return { small, giant };
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

const HANGING = /^(and|or|the|a|an|of|to|for|with|from|into|on|in|at|by|as|also)$/i;

function leafTitleFromSentence(sentence: string, fallback: string): string {
  const t = sentence.replace(/\s+/g, " ").trim();
  let candidate = t.split(/\s+[—–]\s+/)[0]!.replace(/[:.!?…]+$/, "").trim();
  if (candidate.length > 44) {
    candidate = candidate.slice(0, 44).replace(/\s+\S*$/, "").trim();
  }
  const words = candidate.split(/\s+/).filter(Boolean);
  while (words.length > 2 && HANGING.test(words[words.length - 1]!)) words.pop();
  const title = words.join(" ");
  if (title.length >= 8) return title;
  return fallback;
}

function isFigureStat(value: string): boolean {
  return /[%£]/.test(value) || /^[−~≈-]?\s*\d/.test(value);
}

function blocksWithFollowingMatter(
  sectionBlocks: ContentBlock[],
  paraText: string,
): ContentBlock[] {
  const idx = sectionBlocks.findIndex((b) => b.type === "paragraph" && b.text === paraText);
  if (idx < 0) return [{ type: "paragraph", text: paraText }];
  const out: ContentBlock[] = [sectionBlocks[idx]!];
  for (let j = idx + 1; j < sectionBlocks.length; j++) {
    const b = sectionBlocks[j]!;
    if (b.type === "list" || b.type === "link") out.push(b);
    else break;
  }
  return out;
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

  const mains = doc.sections.filter((s) => s.level === 2);
  const nested = doc.sections.filter((s) => s.level === 3);

  for (const sec of mains) {
    const isSources = /^sources$/i.test(sec.title);
    const isSolution = sec.id === "a-solution";
    if (isSources) continue;
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
    const nestedSections = nested.filter((n) => n.parentId === sec.id);
    const applicableIds = new Set([
      ...sec.footnoteIds,
      ...nestedSections.flatMap((n) => n.footnoteIds),
    ]);
    const applicableFootnotes = doc.footnotes.filter((fn) => applicableIds.has(fn.id));

    // One hero only: prefer chart OR one stat OR photo — never stack competing ovals.
    // “A solution” is a product zone: no exam/funding graph on the pathway surface.
    const hubChart =
      !isSources && !isSolution && charts[0] ? charts[0].chartId : undefined;
    const figureStats = stats.filter((s) => isFigureStat(s.value));
    const hubStat =
      !isSources && !hubChart && figureStats[0]
        ? { value: figureStats[0].value, label: shortLabel(figureStats[0].label, 48) }
        : undefined;

    protos.push({
      id: hubId,
      parentId: null,
      mainSectionId: hubId,
      level: 2,
      kind: "hub",
      title: sec.title,
      // Sources: footnotes only on the frame — no closing/meta sentence as a body card
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
      footnotes: applicableFootnotes.filter((fn) => !!fn.url),
      blocks: sec.blocks,
      subsections: nestedSections
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

    {
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
        const leafBlocks = blocksWithFollowingMatter(sec.blocks, paras[i]!.text);
        children.push({
          id,
          title: takeTitle(leafTitleFromSentence(sentence, `More ${i}`)),
          sentence,
          photoHero: false,
          blocks: leafBlocks,
        });
      }

      // Extra stats (beyond hub hero) → leaf stops — not second ovals on the hub
      for (let i = 0; i < stats.length && children.length < MAX_CHILDREN; i++) {
        const st = stats[i]!;
        if (hubStat && st.value === hubStat.value) continue;
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
        footnotes: applicableFootnotes,
        blocks: ch.blocks,
      });
    }
  }

  return protos;
}

/** Quiet pathway grid for hubs — story-order bands, large gutters, no AABB overlap. */
function placeHubsOnGrid(hubs: FrameNode[]): void {
  // Story path bands (left → right, then down):
  // 0: EYFS, primary, secondary (continuous pathway)
  // 1: GCSE, A-level, HE
  // 2: cold spots, Enrichment Framework, music hubs
  // 3: national plans, a solution
  const cellW = FRAME_W + GUTTER;
  const cellH = FRAME_H + GUTTER;

  const byId = new Map(hubs.map((h) => [h.id, h]));
  const orderedIds = [
    "eyfs",
    "primary-ks1-ks2",
    "secondary",
    "gcse",
    "a-level",
    "university-he",
    "cold-spots-place-and-income",
    "enrichment-framework",
    "music-hubs-and-national-centre",
    "national-plans-and-free-resources",
    "a-solution",
  ];
  const placed = new Set<string>();

  const place = (id: string, col: number, row: number) => {
    const hub = byId.get(id);
    if (!hub) return;
    hub.x = PAD + col * cellW;
    hub.y = PAD + row * cellH;
    hub.w = FRAME_W;
    hub.h = hub.chartId ? FRAME_H + 80 : FRAME_H;
    placed.add(id);
  };

  place("eyfs", 0, 0);
  place("primary-ks1-ks2", 1, 0);
  place("secondary", 2, 0);
  place("gcse", 0, 1);
  place("a-level", 1, 1);
  place("university-he", 2, 1);
  place("cold-spots-place-and-income", 0, 2);
  place("enrichment-framework", 1, 2);
  place("music-hubs-and-national-centre", 2, 2);
  place("national-plans-and-free-resources", 0, 3);
  place("a-solution", 1, 3);

  // Any leftover hubs continue the grid
  let extra = 0;
  for (const hub of hubs) {
    if (placed.has(hub.id)) continue;
    const col = extra % 3;
    const row = 4 + Math.floor(extra / 3);
    hub.x = PAD + col * cellW;
    hub.y = PAD + row * cellH;
    hub.w = FRAME_W;
    hub.h = hub.chartId ? FRAME_H + 80 : FRAME_H;
    extra += 1;
  }

  void orderedIds;
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

/** Edge-to-edge connector that stays in gutters (never through f