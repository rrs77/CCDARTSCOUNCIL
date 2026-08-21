/**
 * Lean Prezi layout from CONTENT.md.
 * - ## → hub (1 sentence + 1 hero). Children = ### and lean extras (max 4).
 * - Frames are spaced far apart — never ellipse-clustered (overlapping rings).
 * - Extra essay text becomes nested stops with unique titles (never reuse hub title).
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
  /** Child ids for path + hub edge satellites */
  childIds: string[];
};

export type Presentation = {
  title: string;
  world: { width: number; height: number; heroImage: string };
  frames: FrameNode[];
  path: string[];
  mainSectionIds: string[];
};

const MAX_CHILDREN = 4;
const FRAME_W = 1280;
const FRAME_H = 800;
/** Centres far apart — one scene at a time; no overlapping rings */
const GAP = 2400;
const PAD = 480;

function uniqueId(base: string, used: Set<string>): string {
  let id = base;
  let n = 2;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}

export function splitTitle(title: string): { small: string; giant: string } {
  const words = title.trim().split(/\s+/);
  if (words.length === 1) return { small: "", giant: words[0]!.toUpperCase() };
  if (/^(the|a|an)\b/i.test(words[0]!)) {
    return { small: words[0]!, giant: words.slice(1).join(" ").toUpperCase() };
  }
  if (words.length === 2) {
    return { small: words[0]!, giant: words[1]!.toUpperCase() };
  }
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

/** Title for an extra paragraph leaf — never clone the hub heading. */
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

    const hubStat =
      !isSources && stats[0]
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
      photoHero: !hubStat && !isSources,
      photoCrop: crop,
      footnotes: isSources ? doc.footnotes : undefined,
    });

    type ChildSpec = {
      id: string;
      title: string;
      sentence: string;
      heroStat?: { value: string; label: string };
      chartId?: string;
      quote?: string;
      photoHero: boolean;
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
        heroStat: undefined,
      });
    }

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
      });
    }

    if (charts[0] && children.length < MAX_CHILDREN) {
      const c = charts[0];
      const id = uniqueId(`${hubId}-${c.chartId}`, used);
      children.push({
        id,
        title: takeTitle("Chart"),
        sentence: "Detail from the evidence overview.",
        chartId: c.chartId,
        photoHero: false,
      });
    }

    if (quotes[0] && children.length < MAX_CHILDREN && paras[0]) {
      const id = uniqueId(`${hubId}-why`, used);
      children.push({
        id,
        title: takeTitle("Why it matters"),
        sentence: firstSentence(quotes[0].text),
        quote: firstSentence(quotes[0].text),
        photoHero: false,
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
      });
    }
  }

  return protos;
}

/** Place every path stop in its own clear region — no overlapping constellation. */
export function buildPresentation(doc: ParsedDocument): Presentation {
  const protos = expandToProtos(doc);
  const frames: FrameNode[] = [];
  let sequence = 0;

  const roots = protos.filter((p) => !p.parentId);
  const ordered: Proto[] = [];
  for (const root of roots) {
    ordered.push(root);
    ordered.push(...protos.filter((p) => p.parentId === root.id));
  }

  const usedGiants = new Set<string>();

  ordered.forEach((p, i) => {
    let { small, giant } = splitTitle(p.title);
    const gKey = giant.toLowerCase();
    if (usedGiants.has(gKey)) {
      // Avoid duplicate wordmarks like TEACHERS twice on the path
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
      level: p.level,
      kind: p.kind,
      title: p.title,
      titleSmall: small,
      titleGiant: giant,
      navLabel: p.kind === "leaf" && p.heroStat ? p.heroStat.value : p.title,
      x: PAD + col * GAP,
      y: PAD + row * GAP,
      w: FRAME_W,
      h: p.chartId ? 900 : FRAME_H,
      sentence: p.sentence,
      heroStat: p.heroStat,
      quote: p.quote,
      chartId: p.chartId,
      photoHero: p.photoHero,
      photoCrop: p.photoCrop,
      footnotes: p.footnotes,
      childIds: [],
    };
    frames.push(node);
  });

  for (const f of frames) {
    if (f.parentId) continue;
    f.childIds = frames.filter((c) => c.parentId === f.id).map((c) => c.id);
  }

  let maxX = 0;
  let maxY = 0;
  for (const f of frames) {
    maxX = Math.max(maxX, f.x + f.w);
    maxY = Math.max(maxY, f.y + f.h);
  }

  const path: string[] = ["overview", ...ordered.map((p) => p.id), "overview"];

  return {
    title: doc.title,
    world: {
      width: Math.max(3600, maxX + PAD),
      height: Math.max(2400, maxY + PAD),
      heroImage: "hero-arts.jpg",
    },
    frames,
    path,
    mainSectionIds: roots.filter((r) => r.kind !== "title").map((r) => r.id),
  };
}

export function getFrame(pres: Presentation, id: string | null | undefined): FrameNode | undefined {
  if (!id || id === "overview") return undefined;
  return pres.frames.find((f) => f.id === id);
}

export function presentationFromMarkdown(md: string): Presentation {
  return buildPresentation(parseContentMarkdown(md));
}
