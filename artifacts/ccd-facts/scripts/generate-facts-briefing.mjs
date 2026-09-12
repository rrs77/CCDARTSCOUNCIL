#!/usr/bin/env node
/**
 * Branded A4 briefing — two columns, footnote marks in the copy,
 * full references at the end, CCD mark on the opening page, page numbers throughout.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { jsPDF } = require("jspdf");
import { chartHeightEstimate, drawChart } from "./briefing-charts.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const contentPath = join(root, "CONTENT.md");
const outPath = join(root, "public", "the-facts-briefing.pdf");

const FOREST = [0, 45, 36];
const LIME = [182, 255, 126];
const INK = [15, 42, 46];
const MUTED = [92, 111, 114];
const RULE = [210, 214, 208];
const WASH = [247, 250, 248];
const WHITE = [255, 250, 247];

const PAGE = { w: 210, h: 297 };
const M = { l: 16, r: 16, t: 20, b: 18 };
const GUTTER = 7;
const CONTENT_W = PAGE.w - M.l - M.r;
const COL_W = (CONTENT_W - GUTTER) / 2;
const NOTE_SIZE = 6.1;

const SECTION_PHOTO = {
  EYFS: "briefing-eyfs.jpg",
  "Enrichment Framework": "briefing-music.jpg",
  GCSE: "briefing-drama.jpg",
  "Music Hubs and National Centre": "briefing-music.jpg",
};

function jpeg(name) {
  const file = join(root, "public", "briefing", name);
  return `data:image/jpeg;base64,${readFileSync(file).toString("base64")}`;
}

function loadDocument() {
  const raw = readFileSync(contentPath, "utf8").replace(/\r\n/g, "\n");
  const footnotes = [];
  const withoutNotes = raw.replace(/^\[\^(\d+)\]:\s*(.+)$/gm, (_, n, text) => {
    footnotes.push({ n, text: text.trim() });
    return "";
  });
  const cleaned = withoutNotes.replace(/<!--(?!\s*chart:)[\s\S]*?-->/g, "").trim();
  const chunks = cleaned.split(/^## /m);
  const intro = chunks[0];
  const longTitle = (intro.match(/^#\s+(.+)$/m) || [, "The facts"])[1].trim();
  const paras = intro
    .replace(/^#\s+.+$/m, "")
    .split(/\n{2,}/)
    .map((p) => stripMd(p))
    .filter(Boolean);

  const sections = chunks.slice(1).map((chunk) => {
    const lines = chunk.split("\n");
    return { heading: (lines[0] || "").trim(), body: lines.slice(1).join("\n").trim() };
  });

  return { longTitle, paras, sections, footnotes };
}

/** Keep [^n] so the writer can turn them into superscript marks. */
function stripMd(s) {
  return String(s)
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^>\s*/gm, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\s+\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/[−–]/g, "-")
    .trim();
}

function isDisplayStat(value, label) {
  if (/^https?:/i.test(value) || /^https?:/i.test(label)) return false;
  if (value.length > 40) return false;
  return /[\d%£]|^(−|-)/.test(value);
}

function blocks(body) {
  const out = [];
  const lines = body.split("\n");
  let buf = [];

  const flush = () => {
    const t = buf.join("\n").trim();
    buf = [];
    if (!t) return;
    if (/^>/.test(t)) {
      out.push({ kind: "quote", text: stripMd(t.replace(/^>\s*/gm, "")) });
      return;
    }
    const stat = t.match(/^\*\*(.{1,48}?)\*\*\s+[—–-]\s+(.+)$/s);
    if (stat && isDisplayStat(stat[1], stat[2])) {
      out.push({ kind: "stat", value: stripMd(stat[1]), label: stripMd(stat[2]) });
      return;
    }
    if (/^[-*]\s/m.test(t) || /^\d+\.\s/m.test(t)) {
      const items = t
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const numbered = l.match(/^(\d+)\.\s+(.+)$/);
          const rawItem = numbered ? numbered[2] : l.replace(/^[-*]\s+/, "");
          const res = rawItem.match(/^\*\*(.+?)\*\*\s+[—–-]\s+(https?:\/\/\S+)/);
          if (res) return { text: stripMd(res[1]), href: res[2] };
          return { text: stripMd(rawItem) };
        });
      out.push({ kind: "list", items });
      return;
    }
    out.push({ kind: "p", text: stripMd(t) });
  };

  for (const line of lines) {
    const chart = line.trim().match(/^<!--\s*chart:([a-zA-Z0-9_-]+)\s*-->$/);
    if (chart) {
      flush();
      out.push({ kind: "chart", id: chart[1] });
      continue;
    }
    if (/^###\s+/.test(line)) {
      flush();
      out.push({ kind: "h", text: stripMd(line.replace(/^###\s+/, "")) });
      continue;
    }
    if (line.trim() === "") {
      flush();
      continue;
    }
    buf.push(line);
  }
  flush();
  return out;
}

function tokenize(text) {
  const units = [];
  const re = /\[\^(\d+)\]/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    const before = text.slice(last, m.index);
    for (const word of before.split(/\s+/).filter(Boolean)) {
      units.push({ word, notes: [] });
    }
    if (!units.length) units.push({ word: "", notes: [] });
    units[units.length - 1].notes.push(m[1]);
    last = m.index + m[0].length;
  }
  for (const word of text.slice(last).split(/\s+/).filter(Boolean)) {
    units.push({ word, notes: [] });
  }
  return units;
}

function noteWidth(doc, n) {
  const prev = doc.getFontSize();
  doc.setFontSize(NOTE_SIZE);
  const w = doc.getTextWidth(String(n)) + 0.45;
  doc.setFontSize(prev);
  return w;
}

function wrapRich(doc, text, maxW, fontSize) {
  doc.setFontSize(fontSize);
  const space = doc.getTextWidth(" ");
  const lines = [];
  let cur = [];
  let curW = 0;
  for (const unit of tokenize(text)) {
    const w = doc.getTextWidth(unit.word) + unit.notes.reduce((sum, n) => sum + noteWidth(doc, n), 0);
    const add = cur.length ? space + w : w;
    if (cur.length && curW + add > maxW) {
      lines.push(cur);
      cur = [unit];
      curW = w;
    } else {
      cur.push(unit);
      curW += add;
    }
  }
  if (cur.length) lines.push(cur);
  return lines;
}

function drawRichLine(doc, units, x, y, fontSize, color, font) {
  doc.setFont(font[0], font[1]);
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);
  const space = doc.getTextWidth(" ");
  let cx = x;
  units.forEach((unit, i) => {
    if (i) cx += space;
    doc.setFont(font[0], font[1]);
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    if (unit.word) {
      doc.text(unit.word, cx, y);
      cx += doc.getTextWidth(unit.word);
    }
    for (const n of unit.notes) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(NOTE_SIZE);
      doc.setTextColor(...FOREST);
      doc.text(n, cx + 0.2, y - 1.55);
      cx += noteWidth(doc, n);
    }
  });
}

function washPage(doc) {
  doc.setFillColor(...WASH);
  doc.rect(0, 0, PAGE.w, PAGE.h, "F");
  doc.setFillColor(...FOREST);
  doc.rect(0, 0, 3.6, PAGE.h, "F");
}

function drawCcdMark(doc, x, y, r, onForest) {
  doc.setFillColor(...(onForest ? [10, 61, 50] : FOREST));
  doc.circle(x, y, r, "F");
  doc.setDrawColor(...LIME);
  doc.setLineWidth(0.7);
  doc.circle(x, y, r, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(r >= 7 ? 8.2 : 6.4);
  doc.setTextColor(...WHITE);
  doc.text("CCD", x, y + (r >= 7 ? 1.15 : 0.9), { align: "center" });
}

function footer(doc, page, total, onForest) {
  const ink = onForest ? [214, 224, 218] : MUTED;
  const rule = onForest ? [40, 80, 70] : RULE;
  doc.setDrawColor(...rule);
  doc.setLineWidth(0.16);
  doc.line(M.l, PAGE.h - 11.5, PAGE.w - M.r, PAGE.h - 11.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.4);
  doc.setTextColor(...ink);
  doc.text("CCD  ·  Creative Curriculum Designer", M.l, PAGE.h - 7);
  doc.text(`${page}  /  ${total}`, PAGE.w - M.r, PAGE.h - 7, { align: "right" });
}

function runningHead(doc, label) {
  drawCcdMark(doc, M.l + 4.2, 10.2, 4.4, false);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(...FOREST);
  doc.text("CREATIVE CURRICULUM DESIGNER", M.l + 10.5, 9.2);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text("The facts", M.l + 10.5, 12.6);
  if (label) {
    doc.text(label.toUpperCase(), PAGE.w - M.r, 11.2, { align: "right" });
  }
}

function makeFlow(doc, y0, label) {
  return {
    doc,
    label,
    col: 0,
    y: y0,
    top: y0,
    get x() {
      return M.l + this.col * (COL_W + GUTTER);
    },
    get width() {
      return COL_W;
    },
    remaining() {
      return PAGE.h - M.b - this.y;
    },
    newPage() {
      doc.addPage();
      washPage(doc);
      runningHead(doc, this.label);
      this.col = 0;
      this.top = M.t + 4;
      this.y = this.top;
    },
    nextColumn() {
      if (this.col === 0) {
        this.col = 1;
        this.y = this.top;
        return;
      }
      this.newPage();
    },
    need(mm) {
      if (this.y + mm < PAGE.h - M.b) return;
      this.nextColumn();
    },
    writeRich(text, opts = {}) {
      const size = opts.size ?? 9;
      const leading = opts.leading ?? 3.95;
      const color = opts.color ?? INK;
      const font = opts.font ?? ["helvetica", "normal"];
      const gapAfter = opts.gapAfter ?? 2.4;
      this.doc.setFont(font[0], font[1]);
      const lines = wrapRich(this.doc, text, this.width, size);
      for (const line of lines) {
        this.need(leading + 0.6);
        drawRichLine(this.doc, line, this.x, this.y, size, color, font);
        this.y += leading;
      }
      this.y += gapAfter;
    },
    spanNeed(h) {
      if (this.col === 1 || this.remaining() < h + 3) this.newPage();
    },
    placeSpan(h) {
      this.top = this.y + h;
      this.col = 0;
      this.y = this.top;
    },
  };
}

function cover(doc, meta) {
  doc.addImage(jpeg("hero-arts.jpg"), "JPEG", 0, 0, PAGE.w, 172, undefined, "FAST");
  try {
    const g = new doc.GState({ opacity: 0.38 });
    doc.saveGraphicsState();
    doc.setGState(g);
    doc.setFillColor(...FOREST);
    doc.rect(0, 0, PAGE.w, 172, "F");
    doc.restoreGraphicsState();
  } catch {
    doc.setFillColor(...FOREST);
    doc.rect(0, 132, PAGE.w, 40, "F");
  }
  doc.setFillColor(...FOREST);
  doc.rect(0, 156, PAGE.w, PAGE.h - 156, "F");
  doc.setFillColor(...LIME);
  doc.rect(0, 0, 3.6, PAGE.h, "F");

  drawCcdMark(doc, M.l + 12, 22, 8.2, true);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.setTextColor(...LIME);
  doc.text("CREATIVE CURRICULUM DESIGNER", M.l + 24, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(214, 224, 218);
  doc.text("ccdesigner.co.uk", M.l + 24, 25.4);

  doc.setFont("times", "bold");
  doc.setFontSize(40);
  doc.setTextColor(...WHITE);
  doc.text("The facts", M.l + 6, 128);

  doc.setFont("times", "italic");
  doc.setFontSize(13);
  doc.setTextColor(230, 236, 228);
  const sub = doc.splitTextToSize(meta.longTitle, CONTENT_W - 6);
  doc.text(sub, M.l + 6, 140);

  doc.setDrawColor(...LIME);
  doc.setLineWidth(0.9);
  doc.line(M.l + 6, 152, M.l + 28, 152);

  doc.setFont("times", "italic");
  doc.setFontSize(12.5);
  doc.setTextColor(...LIME);
  doc.text("Exceptional lessons start with connection", M.l + 6, 168);

  const flow = makeFlow(doc, 180, "The facts");
  flow.newPage = function newPage() {
    doc.addPage();
    washPage(doc);
    runningHead(doc, "The facts");
    this.col = 0;
    this.top = M.t + 4;
    this.y = this.top;
  };

  for (const para of meta.paras) {
    flow.writeRich(para, {
      size: 8.8,
      leading: 3.85,
      color: [230, 236, 228],
      gapAfter: 2.6,
    });
  }
}

function contentsPage(doc, sections) {
  doc.addPage();
  washPage(doc);
  runningHead(doc, "Contents");

  try {
    doc.addImage(jpeg("briefing-eyfs.jpg"), "JPEG", PAGE.w - M.r - 62, M.t + 2, 62, 44, undefined, "FAST");
  } catch {
    /* photo optional */
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...FOREST);
  doc.text("CONTENTS", M.l, M.t + 4);

  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...INK);
  doc.text("How this briefing is arranged", M.l, M.t + 14);

  const flow = makeFlow(doc, M.t + 50, "Contents");
  flow.writeRich("Eleven stages, matching the live index. Superscript numbers in the text point to the official sources listed at the end.", {
    size: 8.6,
    leading: 3.8,
    color: MUTED,
    gapAfter: 4,
  });

  const mid = Math.ceil(sections.length / 2);
  const startTop = flow.y;
  sections.forEach((s, i) => {
    if (i === mid) {
      flow.col = 1;
      flow.y = startTop;
    }
    const n = String(i + 1).padStart(2, "0");
    flow.writeRich(`${n}   ${s.heading}`, {
      size: 11,
      leading: 5,
      font: ["times", "bold"],
      gapAfter: 4.2,
    });
  });
}

function writeSection(doc, section, index) {
  const label = section.heading;
  doc.addPage();
  washPage(doc);
  runningHead(doc, label);
  const flow = makeFlow(doc, M.t + 6, label);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...FOREST);
  doc.text(String(index + 1).padStart(2, "0"), flow.x, flow.y);
  flow.y += 6.5;

  doc.setFont("times", "bold");
  const titleLines = wrapRich(doc, section.heading, flow.width, 15);
  for (const line of titleLines) {
    flow.need(7.2);
    drawRichLine(doc, line, flow.x, flow.y, 15, INK, ["times", "bold"]);
    flow.y += 6.6;
  }
  flow.y += 1.5;
  doc.setDrawColor(...LIME);
  doc.setLineWidth(0.9);
  doc.line(flow.x, flow.y, flow.x + 16, flow.y);
  flow.y += 6;

  const photo = SECTION_PHOTO[section.heading];
  if (photo) {
    const ph = 46;
    flow.spanNeed(ph + 4);
    try {
      doc.addImage(jpeg(photo), "JPEG", M.l, flow.y, CONTENT_W, ph, undefined, "FAST");
    } catch {
      /* skip */
    }
    flow.placeSpan(ph + 4);
  }

  const bodyBlocks = blocks(section.body);
  if (section.heading === "Secondary" && !bodyBlocks.some((b) => b.kind === "chart")) {
    bodyBlocks.splice(1, 0, { kind: "chart", id: "longterm" });
  }

  for (const b of bodyBlocks) {
    if (b.kind === "h") {
      flow.need(12);
      flow.y += 1.5;
      flow.writeRich(b.text.toUpperCase(), {
        size: 7.4,
        leading: 3.4,
        color: FOREST,
        font: ["helvetica", "bold"],
        gapAfter: 2.2,
      });
      continue;
    }
    if (b.kind === "quote") {
      const lines = wrapRich(doc, `“${b.text}”`, flow.width - 4, 9);
      const boxH = lines.length * 4 + 5;
      flow.need(boxH + 3);
      doc.setFillColor(...FOREST);
      doc.rect(flow.x, flow.y - 2.4, 1.2, boxH, "F");
      const startY = flow.y;
      for (const line of lines) {
        drawRichLine(doc, line, flow.x + 3.2, flow.y, 9, FOREST, ["times", "italic"]);
        flow.y += 4;
      }
      flow.y = startY + boxH + 2.5;
      continue;
    }
    if (b.kind === "stat") {
      flow.need(14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...FOREST);
      doc.text(b.value.replace(/\[\^(\d+)\]/g, ""), flow.x, flow.y);
      flow.y += 5;
      flow.writeRich(b.label, {
        size: 7.8,
        leading: 3.4,
        color: MUTED,
        gapAfter: 3.2,
      });
      continue;
    }
    if (b.kind === "chart") {
      const est = chartHeightEstimate(b.id) + 8;
      flow.spanNeed(est);
      const used = drawChart(doc, b.id, M.l, flow.y, CONTENT_W);
      flow.placeSpan(used + 3.5);
      continue;
    }
    if (b.kind === "list") {
      for (const item of b.items) {
        const lines = wrapRich(doc, item.text, flow.width - 4, 8.6);
        flow.need(lines.length * 3.8 + (item.href ? 3.6 : 0) + 2.4);
        doc.setFillColor(...FOREST);
        doc.circle(flow.x + 1.1, flow.y - 1.05, 0.55, "F");
        for (const line of lines) {
          drawRichLine(doc, line, flow.x + 3.4, flow.y, 8.6, INK, ["helvetica", "normal"]);
          flow.y += 3.8;
        }
        if (item.href) {
          const hrefLines = wrapRich(doc, item.href, flow.width - 4, 6.8);
          for (const line of hrefLines) {
            drawRichLine(doc, line, flow.x + 3.4, flow.y, 6.8, MUTED, ["helvetica", "normal"]);
            flow.y += 3.2;
          }
        }
        flow.y += 2.1;
      }
      flow.y += 1.2;
      continue;
    }
    flow.writeRich(b.text, { size: 9, leading: 3.95, gapAfter: 2.8 });
  }
}

function writeSources(doc, footnotes) {
  doc.addPage();
  washPage(doc);
  runningHead(doc, "References");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...FOREST);
  doc.text("REFERENCES", M.l, M.t + 4);
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...INK);
  doc.text("Sources", M.l, M.t + 14);
  doc.setDrawColor(...LIME);
  doc.setLineWidth(0.9);
  doc.line(M.l, M.t + 17, M.l + 16, M.t + 17);

  const flow = makeFlow(doc, M.t + 24, "References");
  flow.writeRich(
    "Numbers in the text are footnotes. Each mark matches a source below. Official CLA, Ofqual and DfE documents only — read as published.",
    { size: 8.4, leading: 3.7, color: MUTED, gapAfter: 4.2 },
  );

  const sorted = [...footnotes].sort((a, b) => Number(a.n) - Number(b.n));
  for (const note of sorted) {
    const urlMatch = note.text.match(/^(.*?)\s+(https?:\/\/\S+)\s*$/);
    const label = stripMd(urlMatch ? urlMatch[1].replace(/\s+[—–-]\s*$/, "") : note.text);
    const href = urlMatch ? urlMatch[2] : "";
    flow.need(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...FOREST);
    doc.text(note.n, flow.x, flow.y);
    const indent = 5.2;
    const savedX = flow.x;
    const writeIndented = (text, size, color) => {
      const lines = wrapRich(doc, text, flow.width - indent, size);
      for (const line of lines) {
        flow.need(size * 0.42 + 1.6);
        drawRichLine(doc, line, savedX + indent, flow.y, size, color, ["helvetica", "normal"]);
        flow.y += size * 0.42 + 1.15;
      }
    };
    writeIndented(label, 8.2, INK);
    if (href) writeIndented(href, 6.8, MUTED);
    flow.y += 3.1;
  }
}

function stampFooters(doc) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    footer(doc, i, total, i === 1);
  }
}

function main() {
  const meta = loadDocument();
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  cover(doc, meta);
  contentsPage(doc, meta.sections);
  meta.sections.forEach((s, i) => writeSection(doc, s, i));
  writeSources(doc, meta.footnotes);
  stampFooters(doc);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, Buffer.from(doc.output("arraybuffer")));
  process.stdout.write(`wrote ${outPath} (${doc.getNumberOfPages()} pages)\n`);
}

main();
