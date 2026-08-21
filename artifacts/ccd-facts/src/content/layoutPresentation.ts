/**
 * Expand CONTENT.md sections into Prezi-friendly frames:
 * parent keeps one sentence (+ optional hero stat);
 * extra paragraphs, list stats, and ### become child satellites.
 */

import {
  parseContentMarkdown,
  type ContentBlock,
  type ParsedDocument,
} from "./parseContent";

export type SceneKind = "title" | "hub" | "leaf" | "sources";

export type FrameNode = {
  id: string;
  parentId: string | null;
  mainSectionId: string;
  sequence: number;
  level: 1 | 2 | 3;
  kind: SceneKind;
  title: string;
  /** Small mixed-case line */
  titleSmall: string;
  /** GIANT condensed caps */
  titleGiant: string;
  navLabel: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** One sentence for the body card */
  sentence: string;
  /** Optional giant hero stat */
  heroStat?: { value: string; label: string };
  quote?: string;
  chartId?: string;
  /** Use masked hero photo in the green bubble */
  photoHero: boolean;
  footnotes?: ParsedDocument["footnotes"];
  /** Child ids that sit as satellites on this hub */
  childIds: string[];
};

export type Presentation = {
  title: string;
  world: { width: number; height: number; heroImage: string };
  frames: FrameNode[];
  path: string[];
  mainSectionIds: string[];
};

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64) || "section"
  );
}

function uniqueId(base: string, used: Set<string>): string {
  let id = base;
  let n = 2;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}

/** Two-tier title: small line + GIANT caps. */
export function splitTitle(title: string): { small: string; giant: string } {
  const clean = title.trim();
  const words = clean.split(/\s+/);
  if (words.length === 1) return { small: "", giant: words[0]!.toUpperCase() };
  if (/^(the|a|an)\b/i.test(words[0]!)) {
    return { small: words[0]!, giant: words.slice(1).join(" ").toUpperCase() };
  }
  if (words.length === 2) {
    return { small: words[0]!, giant: words[1]!.toUpperCase() };
  }
  // Prefer last 1–2 words as the giant wordmark
  const giantCount = words.length >= 5 ? 2 : 1;
  return {
    small: words.slice(0, -giantCount).join(" "),
    giant: words.slice(-giantCount).join(" ").toUpperCase(),
  };
}

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
  footnotes?: ParsedDocument["footnotes"];
};

function firstSentence(text: string): string {
  const t = text.trim();
  const m = t.match(/^(.+?[.!?])(?:\s|$)/);
  if (m && m[1]!.length >= 40) return m[1]!;
  if (t.length <= 160) return t;
  return t.slice(0, 157).replace(/\s+\S*$/, "") + "…";
}

/** Turn a parsed doc into flat proto-frames (parent + lean children). */
export function expandToProtos(doc: ParsedDocument): Proto[] {
  const used = new Set<string>(["title", "overview"]);
  const protos: Proto[] = [];

  protos.push({
    id: "title",
    parentId: null,
    mainSectionId: "title",
    level: 1,
    kind: "title",
    title: doc.title,
    sentence: doc.lead[0] ? firstSentence(doc.lead[0]) : "",
    photoHero: true,
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
    const lists = sec.blocks.filter((b) => b.type === "list") as Extract<
      ContentBlock,
      { type: "list" }
    >[];

    const hubId = sec.id;
    used.add(hubId);

    const hub: Proto = {
      id: hubId,
      parentId: null,
      mainSectionId: hubId,
      level: 2,
      kind: isSources ? "sources" : "hub",
      title: sec.title,
      sentence: paras[0] ? firstSentence(paras[0].text) : firstSentence(doc.lead[0] ?? ""),
      heroStat: stats[0] ? { value: stats[0].value, label: stats[0].label } : undefined,
      quote: quotes[0]?.text,
      chartId: undefined,
      photoHero: !isSources && !stats[0],
      footnotes: isSources ? doc.footnotes : undefined,
    };
    protos.push(hub);

    // Extra paragraphs → leaf children
    paras.slice(1).forEach((p, i) => {
      const id = uniqueId(`${hubId}-p${i + 2}`, used);
      protos.push({
        id,
        parentId: hubId,
        mainSectionId: hubId,
        level: 3,
        kind: "leaf",
        title: sec.title,
        sentence: firstSentence(p.text),
        photoHero: false,
      });
    });

    // Stat list items (beyond first hero) → satellite leaves
    stats.slice(hub.heroStat ? 1 : 0).forEach((st, i) => {
      const id = uniqueId(`${hubId}-stat-${i + 1}`, used);
      protos.push({
        id,
        parentId: hubId,
        mainSectionId: hubId,
        level: 3,
        kind: "leaf",
        title: st.label.split(/[—(]/)[0]!.trim().slice(0, 42) || st.label,
        sentence: st.label,
        heroStat: { value: st.value, label: st.label },
        photoHero: false,
      });
    });

    // Plain list items → short leaf frames
    for (const list of lists) {
      list.items.forEach((item, i) => {
        const id = uniqueId(`${hubId}-li-${i + 1}`, used);
        protos.push({
          id,
          parentId: hubId,
          mainSectionId: hubId,
          level: 3,
          kind: "leaf",
          title: item.slice(0, 36),
          sentence: firstSentence(item),
          photoHero: false,
        });
      });
    }

    // Quotes beyond first → leaf
    quotes.slice(1).forEach((q, i) => {
      const id = uniqueId(`${hubId}-q${i + 2}`, used);
      protos.push({
        id,
        parentId: hubId,
        mainSectionId: hubId,
        level: 3,
        kind: "leaf",
        title: "Pull-out",
        sentence: firstSentence(q.text),
        quote: q.text,
        photoHero: false,
      });
    });

    // Charts → leaf frames
    charts.forEach((c, i) => {
      const id = uniqueId(`${hubId}-chart-${c.chartId}`, used);
      protos.push({
        id,
        parentId: hubId,
        mainSectionId: hubId,
        level: 3,
        kind: "leaf",
        title: c.chartId,
        sentence: "Explore the chart.",
        chartId: c.chartId,
        photoHero: false,
      });
      void i;
    });

    // Explicit ### nested sections
    const kids = nested.filter((n) => n.parentId === sec.id);
    for (const kid of kids) {
      const kParas = kid.blocks.filter((b) => b.type === "paragraph") as Extract<
        ContentBlock,
        { type: "paragraph" }
      >[];
      const kStats = kid.blocks.filter((b) => b.type === "stat") as Extract<
        ContentBlock,
        { type: "stat" }
      >[];
      const kQuotes = kid.blocks.filter((b) => b.type === "quote") as Extract<
        ContentBlock,
        { type: "quote" }
      >[];
      const kCharts = kid.blocks.filter((b) => b.type === "chart") as Extract<
        ContentBlock,
        { type: "chart" }
      >[];

      used.add(kid.id);
      const nestProto: Proto = {
        id: kid.id,
        parentId: hubId,
        mainSectionId: hubId,
        level: 3,
        kind: "leaf",
        title: kid.title,
        sentence: kParas[0]
          ? firstSentence(kParas[0].text)
          : kStats[0]
            ? kStats[0].label
            : "",
        heroStat: kStats[0] ? { value: kStats[0].value, label: kStats[0].label } : undefined,
        quote: kQuotes[0]?.text,
        chartId: kCharts[0]?.chartId,
        photoHero: false,
      };
      protos.push(nestProto);

      // Further stats under ### become their own satellites of the hub (siblings)
      kStats.slice(1).forEach((st, i) => {
        const id = uniqueId(`${kid.id}-s${i + 2}`, used);
        protos.push({
          id,
          parentId: hubId,
          mainSectionId: hubId,
          level: 3,
          kind: "leaf",
          title: st.label.split(/[—(]/)[0]!.trim().slice(0, 42) || kid.title,
          sentence: st.label,
          heroStat: { value: st.value, label: st.label },
          photoHero: false,
        });
      });

      kParas.slice(1).forEach((p, i) => {
        const id = uniqueId(`${kid.id}-p${i + 2}`, used);
        protos.push({
          id,
          parentId: hubId,
          mainSectionId: hubId,
          level: 3,
          kind: "leaf",
          title: kid.title,
          sentence: firstSentence(p.text),
          photoHero: false,
        });
      });

      kCharts.slice(1).forEach((c) => {
        const id = uniqueId(`${kid.id}-${c.chartId}`, used);
        protos.push({
          id,
          parentId: hubId,
          mainSectionId: hubId,
          level: 3,
          kind: "leaf",
          title: c.chartId,
          sentence: "Explore the chart.",
          chartId: c.chartId,
          photoHero: false,
        });
      });
    }
  }

  return protos;
}

const HUB_W = 1680;
const HUB_H = 1100;
const LEAF_W = 920;
const LEAF_H = 720;
const TITLE_W = 1400;
const TITLE_H = 900;
const PAD = 280;

/** Place children on an ellipse around the hub centre — satellites ARE destinations. */
function placeSatellites(
  parent: { x: number; y: number; w: number; h: number },
  children: FrameNode[],
) {
  const n = children.length;
  if (!n) return;
  const cx = parent.x + parent.w * 0.58;
  const cy = parent.y + parent.h * 0.52;
  const rx = parent.w * 0.48 + 220;
  const ry = parent.h * 0.42 + 160;
  // Start from upper-right, go clockwise — leave left third emptier
  const start = -Math.PI * 0.35;
  const sweep = Math.PI * 1.45;
  children.forEach((ch, i) => {
    const t = n === 1 ? start + sweep * 0.35 : start + (sweep * i) / Math.max(1, n - 1);
    const px = cx + Math.cos(t) * rx - ch.w / 2;
    const py = cy + Math.sin(t) * ry - ch.h / 2;
    ch.x = px;
    ch.y = py;
  });
}

export function buildPresentation(doc: ParsedDocument): Presentation {
  const protos = expandToProtos(doc);
  const frames: FrameNode[] = [];
  let sequence = 0;

  const hubs = protos.filter((p) => p.parentId === null);
  // Arrange hubs in a gentle arc / pathway across the world
  const hubGapX = 420;
  const hubGapY = 380;
  let col = 0;
  let row = 0;
  const COLS = 3;

  const hubNodes: FrameNode[] = [];

  for (const p of hubs) {
    if (col >= COLS) {
      col = 0;
      row += 1;
    }
    const isTitle = p.kind === "title";
    const w = isTitle ? TITLE_W : p.kind === "sources" ? 1100 : HUB_W;
    const h = isTitle ? TITLE_H : p.kind === "sources" ? 900 : HUB_H;
    const { small, giant } = splitTitle(p.title);
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
      x: PAD + col * (HUB_W + hubGapX),
      y: PAD + row * (HUB_H + hubGapY),
      w,
      h,
      sentence: p.sentence,
      heroStat: p.heroStat,
      quote: p.quote,
      chartId: p.chartId,
      photoHero: p.photoHero,
      footnotes: p.footnotes,
      childIds: [],
    };
    // Title sits left of first row
    if (isTitle) {
      node.x = PAD;
      node.y = PAD;
      col = 1;
      row = 0;
    } else {
      col += 1;
    }
    hubNodes.push(node);
    frames.push(node);
  }

  // Reflow non-title hubs after title
  {
    const rest = hubNodes.filter((n) => n.kind !== "title");
    const title = hubNodes.find((n) => n.kind === "title");
    let x = PAD + (title ? title.w + hubGapX : 0);
    let y = PAD;
    let c = title ? 1 : 0;
    for (const n of rest) {
      if (c >= COLS) {
        c = 0;
        x = PAD;
        y += HUB_H + hubGapY;
      }
      n.x = x;
      n.y = y;
      x += n.w + hubGapX;
      c += 1;
    }
  }

  // Children as satellites
  for (const hub of hubNodes) {
    const kids = protos.filter((p) => p.parentId === hub.id);
    const childNodes: FrameNode[] = kids.map((p) => {
      const { small, giant } = splitTitle(p.title);
      const hasChart = !!p.chartId;
      const node: FrameNode = {
        id: p.id,
        parentId: hub.id,
        mainSectionId: hub.mainSectionId,
        sequence: sequence++,
        level: 3,
        kind: "leaf",
        title: p.title,
        titleSmall: small,
        titleGiant: giant || p.title.toUpperCase(),
        navLabel: p.title,
        x: 0,
        y: 0,
        w: hasChart ? 1100 : LEAF_W,
        h: hasChart ? 860 : LEAF_H,
        sentence: p.sentence,
        heroStat: p.heroStat,
        quote: p.quote,
        chartId: p.chartId,
        photoHero: p.photoHero,
        childIds: [],
      };
      frames.push(node);
      return node;
    });
    hub.childIds = childNodes.map((c) => c.id);
    placeSatellites(hub, childNodes);
  }

  let maxX = 0;
  let maxY = 0;
  for (const f of frames) {
    maxX = Math.max(maxX, f.x + f.w);
    maxY = Math.max(maxY, f.y + f.h);
  }

  // Guided path: overview → each hub → its children → … → overview
  const path: string[] = ["overview"];
  for (const hub of hubNodes) {
    path.push(hub.id);
    for (const cid of hub.childIds) path.push(cid);
  }
  path.push("overview");

  return {
    title: doc.title,
    world: {
      width: Math.max(4800, maxX + PAD),
      height: Math.max(3200, maxY + PAD),
      heroImage: "hero-arts.jpg",
    },
    frames,
    path,
    mainSectionIds: hubNodes.filter((h) => h.kind !== "title").map((h) => h.id),
  };
}

export function getFrame(pres: Presentation, id: string | null | undefined): FrameNode | undefined {
  if (!id || id === "overview") return undefined;
  return pres.frames.find((f) => f.id === id);
}

export function presentationFromMarkdown(md: string): Presentation {
  return buildPresentation(parseContentMarkdown(md));
}
