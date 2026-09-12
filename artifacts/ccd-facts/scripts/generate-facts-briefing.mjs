#!/usr/bin/env node
/**
 * A4 The facts PDF — magazine measure (full width + columns), CCD logo,
 * in-text footnote marks, full sources at the end, clickable contents
 * and bookmarks. Print-ready: no underlines or screen-only chrome.
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

/** Helvetica is WinAnsi — fold Unicode punctuation so glyphs do not become quotes. */
function pdfSafe(s) {
  return String(s)
    .replace(/[\u2212\u2010\u2011\u2012\u2013\u2014\u2015]/g, "-")
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[\u2192\u21D2]/g, "->")
    .replace(/[\u00A0\u202F\u2007\u2009\u200A\u2000-\u200B\u2060]/g, " ")
    .replace(/\u00D7/g, "x")
    .replace(/\u2248/g, "~")
    .replace(/\u2264/g, "<=")
    .replace(/\u2265/g, ">=")
    .replace(/\u00B1/g, "+/-");
}

function jpeg(name) {
  const file = join(root, "public", "briefing", name);
  return `data:image/jpeg;base64,${readFileSync(file).toString("base64")}`;
}

function pageNo(doc) {
  return doc.internal.getCurrentPageInfo().pageNumber;
}

function addPageLink(doc, x, y, w, h, pageNumber) {
  if (!pageNumber) return;
  try {
    doc.link(x, y, w, h, { pageNumber });
  } catch {
    /* print still works without the jump */
  }
}

function addUrlLink(doc, x, y, w, h, url) {
  if (!url) return;
  try {
    doc.link(x, y, w, h, { url });
  } catch {
    /* visible URL remains for print */
  }
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

  return { longTitle: pdfSafe(longTitle), paras, sections, footnotes };
}

/** Keep [^n] so the writer can turn them into superscript marks. */
function stripMd(s) {
  return pdfSafe(
    String(s)
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
      .replace(/^>\s*/gm, "")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^[-*]\s+/gm, "")
      .replace(/\s+\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .trim(),
  );
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

function drawRichLine(doc, units, x, y, fontSize, color, font, opts = {}) {
  doc.setFont(font[0], font[1]);
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);
  const naturalSpace = doc.getTextWidth(" ");
  const wordW = (unit) =>
    doc.getTextWidth(unit.word || "") + unit.notes.reduce((sum, n) => sum + noteWidth(doc, n), 0);
  const natural =
    units.reduce((sum, u) => sum + wordW(u), 0) + Math.max(0, units.length - 1) * naturalSpace;
  const extra =
    opts.justify && opts.maxW && units.length > 1 ? Math.max(0, opts.maxW - natural) / (units.length - 1) : 0;
  const space = naturalSpace + extra;
  let cx = x;
  units.forEach((unit, i) => {
    doc.setFont(font[0], font[1]);
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    if (i) {
      doc.text(" ", cx, y);
      cx += space;
    }
    if (unit.word) {
      doc.text(unit.word, cx, y);
      cx += doc.getTextWidth(unit.word);
    }
    for (const n of unit.notes) {
      const nw = noteWidth(doc, n);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(NOTE_SIZE);
      doc.setTextColor(...FOREST);
      doc.text(n, cx + 0.2, y - 1.55);
      if (opts.nav) {
        opts.nav.noteHits.push({
          page: pageNo(doc),
          x: cx,
          y: y - 3.2,
          w: Math.max(nw, 2.6),
          h: 3.6,
        });
      }
      cx += nw;
    }
  });
}

/** Circular CCD mark — lime ring, forest fill, white letters. */
function drawLogo(doc, cx, cy, d, onDark) {
  const r = d / 2;
  doc.setFillColor(...(onDark ? [10, 61, 50] : FOREST));
  doc.circle(cx, cy, r * 0.9, "F");
  doc.setDrawColor(...LIME);
  doc.setLineWidth(Math.max(0.55, d * 0.028));
  doc.circle(cx, cy, r * 0.9, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(d * 0.34);
  doc.setTextColor(...WHITE);
  doc.text("CCD", cx, cy + d * 0.055, { align: "center" });
}

function washPage(doc) {
  doc.setFillColor(...WASH);
  doc.rect(0, 0, PAGE.w, PAGE.h, "F");
  doc.setFillColor(...FOREST);
  doc.rect(0, 0, 3.6, PAGE.h, "F");
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

function runningHead(doc, label, nav) {
  drawLogo(doc, M.l + 5.2, 10.4, 10.4, false);
  addPageLink(doc, M.l, 5.2, 10.4, 10.4, 1);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(...FOREST);
  doc.text("CREATIVE CURRICULUM DESIGNER", M.l + 12.4, 9.2);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text("The facts", M.l + 12.4, 12.6);
  addPageLink(doc, M.l + 12.4, 10.2, 22, 4, nav.contents);
  if (label) {
    doc.text(pdfSafe(label).toUpperCase(), PAGE.w - M.r, 11.2, { align: "right" });
  }
}

function makeFlow(doc, y0, label, nav) {
  return {
    doc,
    label,
    nav,
    full: true,
    col: 0,
    spanY: y0,
    colY: [y0, y0],
    top: y0,
    get x() {
      return this.full ? M.l : M.l + this.col * (COL_W + GUTTER);
    },
    get width() {
      return this.full ? CONTENT_W : COL_W;
    },
    get y() {
      return this.full ? this.spanY : this.colY[this.col];
    },
    set y(v) {
      if (this.full) this.spanY = v;
      else this.colY[this.col] = v;
    },
    remaining() {
      return PAGE.h - M.b - this.y;
    },
    newPage() {
      doc.addPage();
      washPage(doc);
      runningHead(doc, this.label, this.nav);
      this.col = 0;
      this.top = M.t + 4;
      this.spanY = this.top;
      this.colY = [this.top, this.top];
    },
    nextColumn() {
      if (this.full) {
        this.newPage();
        return;
      }
      if (this.col === 0) {
        this.col = 1;
        return;
      }
      this.newPage();
    },
    useFull() {
      if (this.full) return;
      this.spanY = Math.max(this.colY[0], this.colY[1]);
      this.full = true;
      this.col = 0;
    },
    useColumns() {
      if (!this.full) return;
      this.full = false;
      this.col = 0;
      this.top = this.spanY;
      this.colY = [this.spanY, this.spanY];
    },
    need(mm) {
      if (this.y + mm < PAGE.h - M.b) return;
      this.nextColumn();
    },
    writeRich(text, opts = {}) {
      const size = opts.size ?? 9.15;
      const leading = opts.leading ?? 4.25;
      const color = opts.color ?? INK;
      const font = opts.font ?? ["helvetica", "normal"];
      const gapAfter = opts.gapAfter ?? 2.8;
      const justify = opts.justify !== false && font[1] !== "italic";
      this.doc.setFont(font[0], font[1]);
      const lines = wrapRich(this.doc, text, this.width, size);
      lines.forEach((line, i) => {
        this.need(leading + 0.6);
        const last = i === lines.length - 1;
        drawRichLine(this.doc, line, this.x, this.y, size, color, font, {
          maxW: this.width,
          justify: justify && !last,
          nav: this.nav,
        });
        this.y += leading;
      });
      this.y += gapAfter;
    },
    spanNeed(h) {
      this.useFull();
      if (this.remaining() < h + 3) this.newPage();
    },
    placeSpan(h) {
      this.useFull();
      this.y += h;
    },
  };
}

function cover(doc, meta, nav) {
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

  drawLogo(doc, M.l + 14, 26, 22, true);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.4);
  doc.setTextColor(...LIME);
  doc.text("CREATIVE CURRICULUM DESIGNER", M.l + 28, 23.6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(214, 224, 218);
  doc.text("ccdesigner.co.uk", M.l + 28, 28.8);

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

  const flow = makeFlow(doc, 180, "The facts", nav);
  flow.newPage = function stayOnCover() {
    /* keep the opening on one print page */
  };

  for (const para of meta.paras) {
    flow.writeRich(para, {
      size: 8.8,
      leading: 3.95,
      color: [230, 236, 228],
      gapAfter: 2.4,
    });
  }
}

function contentsPage(doc, sections, nav) {
  doc.addPage();
  washPage(doc);
  runningHead(doc, "Contents", nav);
  nav.contents = pageNo(doc);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...FOREST);
  doc.text("CONTENTS", M.l, M.t + 4);

  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...INK);
  doc.text("What's inside", M.l, M.t + 14);

  const flow = makeFlow(doc, M.t + 22, "Contents", nav);
  flow.writeRich(
    "Eleven stages, matching the live index. On screen, tap a stage to jump there. Superscript numbers in the text point to the official sources at the end. The same pages print cleanly.",
    { size: 8.8, leading: 4, color: MUTED, gapAfter: 6 },
  );

  flow.useColumns();
  const startTop = flow.y;
  const mid = Math.ceil(sections.length / 2);
  sections.forEach((s, i) => {
    if (i === mid) {
      flow.col = 1;
      flow.colY[1] = startTop;
    }
    const n = String(i + 1).padStart(2, "0");
    const y0 = flow.y;
    const x0 = flow.x;
    flow.writeRich(`${n}   ${pdfSafe(s.heading)}`, {
      size: 11,
      leading: 5,
      font: ["times", "bold"],
      gapAfter: 4.4,
      justify: false,
    });
    nav.tocHits.push({
      heading: s.heading,
      page: pageNo(doc),
      x: x0,
      y: y0 - 4.2,
      w: flow.width,
      h: Math.max(8, flow.y - y0 + 1),
    });
  });
}

function writeSection(doc, section, index, nav) {
  const label = section.heading;
  doc.addPage();
  washPage(doc);
  runningHead(doc, label, nav);
  nav.section[label] = pageNo(doc);
  const flow = makeFlow(doc, M.t + 6, label, nav);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...FOREST);
  doc.text(String(index + 1).padStart(2, "0"), flow.x, flow.y);
  flow.y += 7;

  doc.setFont("times", "bold");
  const titleLines = wrapRich(doc, pdfSafe(section.heading), flow.width, 22);
  for (const line of titleLines) {
    flow.need(9);
    drawRichLine(doc, line, flow.x, flow.y, 22, INK, ["times", "bold"]);
    flow.y += 8.2;
  }
  flow.y += 1.2;
  doc.setDrawColor(...LIME);
  doc.setLineWidth(0.9);
  doc.line(flow.x, flow.y, flow.x + 16, flow.y);
  flow.y += 7;

  const bodyBlocks = blocks(section.body);
  if (section.heading === "Secondary" && !bodyBlocks.some((b) => b.kind === "chart")) {
    bodyBlocks.splice(1, 0, { kind: "chart", id: "longterm" });
  }

  for (const b of bodyBlocks) {
    if (b.kind === "h") {
      flow.useFull();
      flow.need(12);
      flow.y += 1.5;
      flow.writeRich(b.text, {
        size: 13,
        leading: 5.2,
        color: FOREST,
        font: ["times", "bold"],
        gapAfter: 3.2,
        justify: false,
      });
      continue;
    }
    if (b.kind === "quote") {
      flow.useFull();
      const lines = wrapRich(doc, `"${b.text}"`, flow.width - 6, 10);
      const boxH = lines.length * 4.4 + 5;
      flow.need(boxH + 3);
      doc.setFillColor(...FOREST);
      doc.rect(flow.x, flow.y - 2.4, 1.4, boxH, "F");
      const startY = flow.y;
      for (const line of lines) {
        drawRichLine(doc, line, flow.x + 4, flow.y, 10, FOREST, ["times", "italic"], { nav });
        flow.y += 4.4;
      }
      flow.y = startY + boxH + 2.8;
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
        justify: false,
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
      flow.useColumns();
      for (const item of b.items) {
        const lines = wrapRich(doc, item.text, flow.width - 4, 8.6);
        flow.need(lines.length * 3.8 + (item.href ? 3.6 : 0) + 2.4);
        doc.setFillColor(...FOREST);
        doc.circle(flow.x + 1.1, flow.y - 1.05, 0.55, "F");
        for (const line of lines) {
          drawRichLine(doc, line, flow.x + 3.4, flow.y, 8.6, INK, ["helvetica", "normal"], { nav });
          flow.y += 3.8;
        }
        if (item.href) {
          const hrefLines = wrapRich(doc, item.href, flow.width - 4, 6.8);
          const hx = flow.x + 3.4;
          const hy = flow.y;
          for (const line of hrefLines) {
            drawRichLine(doc, line, hx, flow.y, 6.8, MUTED, ["helvetica", "normal"]);
            flow.y += 3.2;
          }
          addUrlLink(doc, hx, hy - 3, flow.width - 4, flow.y - hy + 3, item.href);
        }
        flow.y += 2.1;
      }
      flow.y += 1.2;
      continue;
    }
    flow.useFull();
    flow.writeRich(b.text, { size: 9.2, leading: 4.3, gapAfter: 3.1 });
  }
}

function writeSources(doc, footnotes, nav) {
  doc.addPage();
  washPage(doc);
  runningHead(doc, "References", nav);
  nav.refs = pageNo(doc);

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

  const flow = makeFlow(doc, M.t + 24, "References", nav);
  flow.writeRich(
    "Numbers in the text are footnotes. Each mark matches a source below. Official CLA, Ofqual and DfE documents only - read as published.",
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
    const writeIndented = (text, size, color, asUrl) => {
      const lines = wrapRich(doc, text, flow.width - indent, size);
      const y0 = flow.y;
      for (const line of lines) {
        flow.need(size * 0.42 + 1.6);
        drawRichLine(doc, line, savedX + indent, flow.y, size, color, ["helvetica", "normal"]);
        flow.y += size * 0.42 + 1.15;
      }
      if (asUrl) addUrlLink(doc, savedX + indent, y0 - 3, flow.width - indent, flow.y - y0 + 3, text);
    };
    writeIndented(label, 8.2, INK, false);
    if (href) writeIndented(href, 6.8, MUTED, true);
    flow.y += 3.1;
  }
}

function applyNav(doc, nav) {
  for (const hit of nav.tocHits) {
    doc.setPage(hit.page);
    addPageLink(doc, hit.x, hit.y, hit.w, hit.h, nav.section[hit.heading]);
  }
  for (const hit of nav.noteHits) {
    doc.setPage(hit.page);
    addPageLink(doc, hit.x, hit.y, hit.w, hit.h, nav.refs);
  }
  try {
    doc.outline.add(null, "The facts", { pageNumber: 1 });
    doc.outline.add(null, "What's inside", { pageNumber: nav.contents });
    for (const [heading, page] of Object.entries(nav.section)) {
      doc.outline.add(null, pdfSafe(heading), { pageNumber: page });
    }
    if (nav.refs) doc.outline.add(null, "Sources", { pageNumber: nav.refs });
  } catch {
    /* bookmarks optional */
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
  const nav = { cover: 1, contents: 2, section: {}, refs: 0, tocHits: [], noteHits: [] };
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  try {
    doc.setProperties({
      title: "The facts - Creative Curriculum Designer",
      subject: "Official figures on creative education in England",
      author: "Creative Curriculum Designer",
      creator: "CCDesigner",
    });
    doc.setDisplayMode("fullwidth", "continuous", "UseOutlines");
  } catch {
    /* older jsPDF */
  }
  cover(doc, meta, nav);
  contentsPage(doc, meta.sections, nav);
  meta.sections.forEach((s, i) => writeSection(doc, s, i, nav));
  writeSources(doc, meta.footnotes, nav);
  applyNav(doc, nav);
  stampFooters(doc);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, Buffer.from(doc.output("arraybuffer")));
  process.stdout.write(`wrote ${outPath} (${doc.getNumberOfPages()} pages)\n`);
}

main();
