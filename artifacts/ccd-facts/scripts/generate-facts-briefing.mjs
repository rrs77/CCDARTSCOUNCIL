#!/usr/bin/env node
/**
 * Branded A4 briefing of every Facts section — same copy and voice as the live index.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { jsPDF } = require("jspdf");

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
const M = { l: 22, r: 22, t: 22, b: 20 };
const CONTENT_W = PAGE.w - M.l - M.r;

function loadDocument() {
  const raw = readFileSync(contentPath, "utf8").replace(/\r\n/g, "\n");
  const footnotes = [];
  const withoutNotes = raw.replace(/^\[\^(\d+)\]:\s*(.+)$/gm, (_, n, text) => {
    footnotes.push({ n, text: text.trim() });
    return "";
  });
  const cleaned = withoutNotes.replace(/<!--[\s\S]*?-->/g, "").trim();
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

function stripMd(s) {
  return String(s)
    .replace(/\[\^(\d+)\]/g, " [$1]")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^>\s*/gm, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\s+\n/g, "\n")
    .replace(/[ \t]+/g, " ")
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

function washPage(doc) {
  doc.setFillColor(...WASH);
  doc.rect(0, 0, PAGE.w, PAGE.h, "F");
  doc.setFillColor(...FOREST);
  doc.rect(0, 0, 4.2, PAGE.h, "F");
}

function footer(doc, page, total) {
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.18);
  doc.line(M.l, PAGE.h - 13, PAGE.w - M.r, PAGE.h - 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text("CCD  ·  The facts", M.l, PAGE.h - 8);
  doc.text(`${page}  /  ${total}`, PAGE.w - M.r, PAGE.h - 8, { align: "right" });
}

function runningHead(doc, label) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...FOREST);
  doc.text("THE FACTS", M.l + 4, 12);
  if (label) {
    doc.setTextColor(...MUTED);
    doc.text(label.toUpperCase(), PAGE.w - M.r, 12, { align: "right" });
  }
}

function cover(doc, meta) {
  doc.setFillColor(...FOREST);
  doc.rect(0, 0, PAGE.w, PAGE.h, "F");
  doc.setFillColor(...LIME);
  doc.rect(0, 0, 4.2, PAGE.h, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...LIME);
  doc.text("CCD  ·  CREATIVE CURRICULUM DESIGNER", M.l + 6, 34);

  doc.setFont("times", "bold");
  doc.setFontSize(44);
  doc.setTextColor(...WHITE);
  doc.text("The facts", M.l + 6, 72);

  doc.setFont("times", "italic");
  doc.setFontSize(14);
  doc.setTextColor(230, 236, 228);
  const sub = doc.splitTextToSize(meta.longTitle, CONTENT_W - 8);
  doc.text(sub, M.l + 6, 86);

  doc.setDrawColor(...LIME);
  doc.setLineWidth(0.9);
  doc.line(M.l + 6, 102, M.l + 32, 102);

  doc.setFont("times", "italic");
  doc.setFontSize(16);
  doc.setTextColor(...LIME);
  doc.text("Exceptional lessons start with connection", M.l + 6, 118);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(214, 224, 218);
  let y = 138;
  for (const para of meta.paras.slice(0, 3)) {
    const lines = doc.splitTextToSize(para, CONTENT_W - 8);
    doc.text(lines, M.l + 6, y);
    y += lines.length * 4.8 + 6;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(168, 186, 176);
  const note = doc.splitTextToSize(
    "A briefing for teachers, funders and arts organisations. Figures are from the Cultural Learning Alliance, Ofqual and the Department for Education, read as published. “No entries” does not mean a subject is not taught. CCD aims to — it does not claim to solve.",
    CONTENT_W - 8,
  );
  doc.text(note, M.l + 6, PAGE.h - 42);
  doc.setTextColor(...LIME);
  doc.text("ccdesigner.co.uk  ·  the-facts", M.l + 6, PAGE.h - 18);
}

function contentsPage(doc, sections) {
  doc.addPage();
  washPage(doc);
  runningHead(doc, "Contents");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...FOREST);
  doc.text("CONTENTS", M.l + 4, 28);

  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...INK);
  doc.text("How this briefing is arranged", M.l + 4, 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  const lead = doc.splitTextToSize(
    "Eleven stages, matching the live index. Official sources are collected at the end.",
    CONTENT_W - 4,
  );
  doc.text(lead, M.l + 4, 50);

  let y = 64;
  sections.forEach((s, i) => {
    const n = String(i + 1).padStart(2, "0");
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.15);
    doc.line(M.l + 4, y - 5.2, PAGE.w - M.r, y - 5.2);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...FOREST);
    doc.text(n, M.l + 4, y);
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    const title = doc.splitTextToSize(s.heading, CONTENT_W - 16);
    doc.text(title, M.l + 16, y);
    y += Math.max(11, title.length * 6) + 3;
  });
}

function newContentPage(doc, label) {
  doc.addPage();
  washPage(doc);
  runningHead(doc, label);
  return M.t + 6;
}

function ensureSpace(doc, y, need, label) {
  if (y + need < PAGE.h - M.b) return y;
  return newContentPage(doc, label);
}

function writeSection(doc, section, index) {
  let y = newContentPage(doc, section.heading);
  const label = section.heading;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...FOREST);
  doc.text(String(index + 1).padStart(2, "0"), M.l + 4, y);

  y += 8;
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...INK);
  const h = doc.splitTextToSize(section.heading, CONTENT_W - 4);
  doc.text(h, M.l + 4, y);
  y += h.length * 8 + 3;

  doc.setDrawColor(...LIME);
  doc.setLineWidth(1);
  doc.line(M.l + 4, y, M.l + 26, y);
  y += 9;

  for (const b of blocks(section.body)) {
    if (b.kind === "h") {
      y = ensureSpace(doc, y, 14, label);
      y += 3;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...FOREST);
      doc.text(b.text.toUpperCase(), M.l + 4, y);
      y += 7;
      continue;
    }
    if (b.kind === "quote") {
      const q = doc.splitTextToSize(`“${b.text}”`, CONTENT_W - 14);
      const boxH = q.length * 5.2 + 8;
      y = ensureSpace(doc, y, boxH + 4, label);
      doc.setFillColor(...FOREST);
      doc.rect(M.l + 4, y - 3, 1.5, boxH, "F");
      doc.setFont("times", "italic");
      doc.setFontSize(10.5);
      doc.setTextColor(...FOREST);
      doc.text(q, M.l + 10, y + 3);
      y += boxH + 6;
      continue;
    }
    if (b.kind === "stat") {
      const lab = doc.splitTextToSize(b.label, CONTENT_W - 4);
      y = ensureSpace(doc, y, 8 + lab.length * 4.2 + 6, label);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(...FOREST);
      doc.text(b.value, M.l + 4, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      doc.text(lab, M.l + 4, y + 5.6);
      y += 6 + lab.length * 4.2 + 7;
      continue;
    }
    if (b.kind === "list") {
      for (const item of b.items) {
        const lines = doc.splitTextToSize(item.text, CONTENT_W - 10);
        const extra = item.href ? 4.2 : 0;
        y = ensureSpace(doc, y, lines.length * 4.3 + extra + 3.4, label);
        doc.setFillColor(...FOREST);
        doc.circle(M.l + 6.2, y - 1.15, 0.65, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.4);
        doc.setTextColor(...INK);
        doc.text(lines, M.l + 10, y);
        y += lines.length * 4.3;
        if (item.href) {
          doc.setFontSize(7.5);
          doc.setTextColor(...MUTED);
          const href = doc.splitTextToSize(item.href, CONTENT_W - 10);
          doc.text(href, M.l + 10, y + 0.6);
          y += href.length * 3.6 + 1;
        }
        y += 3.2;
      }
      y += 2;
      continue;
    }
    const lines = doc.splitTextToSize(b.text, CONTENT_W - 4);
    y = ensureSpace(doc, y, lines.length * 4.7 + 5, label);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(lines, M.l + 4, y);
    y += lines.length * 4.7 + 5;
  }
}

function writeSources(doc, footnotes) {
  let y = newContentPage(doc, "Sources");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...FOREST);
  doc.text("SOURCES", M.l + 4, y);
  y += 8;
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...INK);
  doc.text("Read as published", M.l + 4, y);
  y += 8;
  doc.setDrawColor(...LIME);
  doc.setLineWidth(1);
  doc.line(M.l + 4, y, M.l + 26, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  const lead = doc.splitTextToSize(
    "Official CLA, Ofqual and DfE sources only. Links are given so figures can be checked in the original documents.",
    CONTENT_W - 4,
  );
  doc.text(lead, M.l + 4, y);
  y += lead.length * 4.6 + 8;

  const sorted = [...footnotes].sort((a, b) => Number(a.n) - Number(b.n));
  for (const note of sorted) {
    const urlMatch = note.text.match(/^(.*?)\s+(https?:\/\/\S+)\s*$/);
    const label = stripMd(urlMatch ? urlMatch[1].replace(/\s+[—–-]\s*$/, "") : note.text);
    const href = urlMatch ? urlMatch[2] : "";
    const labelLines = doc.splitTextToSize(label, CONTENT_W - 12);
    const hrefLines = href ? doc.splitTextToSize(href, CONTENT_W - 12) : [];
    y = ensureSpace(doc, y, labelLines.length * 4.2 + hrefLines.length * 3.6 + 6, "Sources");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...FOREST);
    doc.text(note.n, M.l + 4, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text(labelLines, M.l + 12, y);
    y += labelLines.length * 4.2;
    if (hrefLines.length) {
      doc.setFontSize(7.4);
      doc.setTextColor(...MUTED);
      doc.text(hrefLines, M.l + 12, y + 0.4);
      y += hrefLines.length * 3.6;
    }
    y += 4.2;
  }
}

function stampFooters(doc) {
  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i += 1) {
    doc.setPage(i);
    footer(doc, i, total);
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
