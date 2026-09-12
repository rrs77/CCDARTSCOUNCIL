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
        const kStats = kid.blocks.filter((b) => b.ty