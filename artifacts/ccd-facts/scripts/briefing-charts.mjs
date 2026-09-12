/** Official Facts chart series — drawn in the briefing, same figures as the live index. */

export const FOREST = [0, 45, 36];
export const TEAL = [20, 184, 166];
export const TEAL_DEEP = [13, 148, 136];
export const CORAL = [255, 107, 107];
export const INK = [15, 42, 46];
export const MUTED = [92, 111, 114];
export const RULE = [210, 214, 208];
export const WASH = [247, 250, 248];
export const LIME = [182, 255, 126];

export const CHARTS = {
  enrichmentParticipation: {
    type: "lollipop",
    caption: "Reported enrichment participation, summer term 2024–25",
    source: "DfE Evidence on enrichment in schools and colleges.",
    max: 100,
    rows: [
      { label: "KS1–3", value: 72, fill: TEAL_DEEP },
      { label: "KS4", value: 60, fill: TEAL },
      { label: "Special", value: 45, fill: CORAL },
    ],
  },
  primaryHours: {
    type: "pair-rings",
    caption: "Primary teachers reporting more than 2.5 hours of arts per week",
    source: "Teacher Tapp / CLA Report Card 2026 — survey, not a census.",
    rows: [
      { label: "Independent", value: 47, fill: FOREST },
      { label: "State", value: 6, fill: TEAL },
    ],
  },
  noGcse: {
    type: "lollipop",
    caption: "Schools with no GCSE entries, 2024/25",
    source: "CLA Report Card 2026. “No entries” does not mean “not taught”.",
    max: 100,
    rows: [
      { label: "Music", value: 36, fill: TEAL_DEEP },
      { label: "Drama", value: 36, fill: TEAL },
      { label: "Dance", value: 83, fill: CORAL },
    ],
  },
  alevelIndex: {
    type: "indexed-line",
    caption: "Recent A-level entry movement: 2024–2026",
    source: "Ofqual provisional entries, indexed 2024 = 100.",
    yMin: 82.5,
    yMax: 100,
    years: ["2024", "2025", "2026"],
    series: [
      { name: "Art & Design", color: FOREST, values: [100, 98.6, 97.7] },
      { name: "Drama", color: CORAL, values: [100, 93.9, 85] },
      { name: "Music", color: TEAL_DEEP, values: [100, 97.4, 92.6] },
    ],
  },
  disadvantage: {
    type: "grouped-bars",
    caption: "Access to arts qualifications differs by disadvantage",
    source: "DfE Curriculum & Assessment Review annex, Table 19, 2024/25. *Photography is Table 18.",
    legend: [
      { name: "Least disadvantaged", fill: FOREST },
      { name: "Most disadvantaged", fill: CORAL },
    ],
    rows: [
      { label: "Art & Design", a: 99, b: 97 },
      { label: "Dance", a: 27, b: 6 },
      { label: "Music", a: 90, b: 39 },
      { label: "Photography*", a: 32, b: 43 },
    ],
  },
  heChange: {
    type: "divergent",
    caption: "University students, 2023/24–2024/25 — not school exams",
    source: "HESA domestic undergraduates via CLA 2026 Detailed Analysis.",
    rows: [
      { label: "Art", value: -1.5 },
      { label: "Film & photo", value: -1.4 },
      { label: "Creative arts", value: -2.9 },
      { label: "Dance", value: -0.7 },
      { label: "Design", value: -1.1 },
      { label: "Drama", value: 1.6 },
      { label: "Music", value: 1.1 },
      { label: "Other creative", value: -15.4 },
      { label: "Performing arts", value: -2.9 },
    ],
  },
  hubRevenueTrend: {
    type: "funding-trend",
    caption: "Music Hubs cash stayed near £76m — dotted line is 2019 money today",
    source: "Turn It Up; Music Mark / Bank of England: £76m in 2019 ≈ £100m today.",
    years: ["2018/19", "2019/20", "2024/25", "2026/27"],
    cash: [75, 76, 76, 76],
    keep2019: [null, 76, null, 100],
    yMax: 110,
  },
  funding: {
    type: "funding-bars",
    caption: "Current national commitments: different funding purposes",
    source: "Not additive like-for-like. Turn It Up; DfE Enrichment Framework resources.",
    rows: [
      { label: "Hubs (annual)", value: 76, fill: TEAL_DEEP },
      { label: "Capital", value: 25, fill: TEAL },
      { label: "National Centre", value: 13, fill: FOREST },
    ],
  },
  longterm: {
    type: "change-bars",
    caption: "Long-term contraction in arts education",
    source: "CLA Report Cards 2024 and 2026.",
    rows: [
      { label: "Arts GCSE entries", value: -41.7, fill: CORAL },
      { label: "Arts A-level entries", value: -25, fill: TEAL_DEEP },
      { label: "Arts teaching hours", value: -21, fill: TEAL },
      { label: "Arts teachers", value: -14, fill: FOREST },
    ],
  },
};

function rgb(c) {
  return Array.isArray(c) ? c : FOREST;
}

function captionBlock(doc, x, y, w, caption, source) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...FOREST);
  const cap = doc.splitTextToSize(caption, w);
  doc.text(cap, x, y);
  let yy = y + cap.length * 3.5 + 1.2;
  return yy;
}

function sourceLine(doc, x, y, w, source) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.6);
  doc.setTextColor(...MUTED);
  const lines = doc.splitTextToSize(source, w);
  doc.text(lines, x, y);
  return y + lines.length * 2.9;
}

function drawRing(doc, cx, cy, r, pct, color) {
  doc.setDrawColor(210, 214, 208);
  doc.setLineWidth(2.4);
  doc.circle(cx, cy, r, "S");
  const steps = Math.max(2, Math.round((Math.max(0, Math.min(100, pct)) / 100) * 60));
  doc.setDrawColor(...rgb(color));
  doc.setLineWidth(2.6);
  for (let i = 0; i < steps; i += 1) {
    const a0 = (-90 + (i / 60) * 360) * (Math.PI / 180);
    const a1 = (-90 + ((i + 1) / 60) * 360) * (Math.PI / 180);
    doc.line(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r);
  }
}

function lollipop(doc, chart, x, y, w) {
  const rowH = 9.2;
  const labelW = 22;
  const barX = x + labelW;
  const barW = w - labelW - 14;
  chart.rows.forEach((row, i) => {
    const yy = y + i * rowH;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.4);
    doc.setTextColor(...INK);
    doc.text(row.label, x, yy + 2.4);
    const len = (row.value / chart.max) * barW;
    doc.setDrawColor(...rgb(row.fill));
    doc.setLineWidth(0.7);
    doc.line(barX, yy + 1.6, barX + len, yy + 1.6);
    doc.setFillColor(...rgb(row.fill));
    doc.circle(barX + len, yy + 1.6, 1.35, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.4);
    doc.text(`${row.value}%`, barX + len + 2.4, yy + 2.6);
  });
  return chart.rows.length * rowH;
}

function pairRings(doc, chart, x, y, w) {
  const r = 11;
  chart.rows.forEach((row, i) => {
    const cx = x + w * (i === 0 ? 0.28 : 0.72);
    const cy = y + 13;
    drawRing(doc, cx, cy, r, row.value, row.fill);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...rgb(row.fill));
    doc.text(`${row.value}%`, cx, cy + 1.4, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(row.label, cx, cy + r + 5.2, { align: "center" });
  });
  return 34;
}

function groupedBars(doc, chart, x, y, w) {
  const rowH = 11;
  const labelW = 28;
  const barX = x + labelW;
  const barW = w - labelW - 2;
  const max = 100;
  chart.rows.forEach((row, i) => {
    const yy = y + i * rowH;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...INK);
    doc.text(row.label, x, yy + 4.2);
    const h = 3.2;
    const wa = (row.a / max) * barW;
    const wb = (row.b / max) * barW;
    doc.setFillColor(...FOREST);
    doc.rect(barX, yy, wa, h, "F");
    doc.setFillColor(...CORAL);
    doc.rect(barX, yy + 3.6, wb, h, "F");
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.4);
  doc.setFillColor(...FOREST);
  doc.rect(x, y + chart.rows.length * rowH + 0.4, 2.4, 2.4, "F");
  doc.setTextColor(...MUTED);
  doc.text("Least disadvantaged", x + 3.4, y + chart.rows.length * rowH + 2.3);
  doc.setFillColor(...CORAL);
  doc.rect(x + 42, y + chart.rows.length * rowH + 0.4, 2.4, 2.4, "F");
  doc.text("Most disadvantaged", x + 45.4, y + chart.rows.length * rowH + 2.3);
  return chart.rows.length * rowH + 7;
}

function indexedLine(doc, chart, x, y, w) {
  const h = 38;
  const left = x + 10;
  const plotW = w - 12;
  const { yMin, yMax, years, series } = chart;
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.2);
  for (let i = 0; i <= 3; i += 1) {
    const yy = y + (h * i) / 3;
    doc.line(left, yy, left + plotW, yy);
    const val = yMax - ((yMax - yMin) * i) / 3;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...MUTED);
    doc.text(String(Math.round(val)), left - 1.4, yy + 0.8, { align: "right" });
  }
  years.forEach((yr, i) => {
    const xx = left + (plotW * i) / (years.length - 1);
    doc.setFontSize(6.4);
    doc.text(yr, xx, y + h + 4, { align: "center" });
  });
  series.forEach((s) => {
    doc.setDrawColor(...rgb(s.color));
    doc.setFillColor(...rgb(s.color));
    doc.setLineWidth(0.85);
    let prev = null;
    s.values.forEach((v, i) => {
      const xx = left + (plotW * i) / (years.length - 1);
      const yy = y + ((yMax - v) / (yMax - yMin)) * h;
      if (prev) doc.line(prev.x, prev.y, xx, yy);
      doc.circle(xx, yy, 0.9, "F");
      prev = { x: xx, y: yy };
    });
  });
  let lx = x;
  const ly = y + h + 8;
  series.forEach((s) => {
    doc.setFillColor(...rgb(s.color));
    doc.circle(lx + 1.1, ly - 0.8, 1, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.4);
    doc.setTextColor(...INK);
    doc.text(s.name, lx + 3.2, ly);
    lx += doc.getTextWidth(s.name) + 8;
  });
  return h + 12;
}

function divergent(doc, chart, x, y, w) {
  const rowH = 6.4;
  const labelW = 28;
  const mid = x + labelW + (w - labelW) / 2;
  const half = (w - labelW) / 2 - 8;
  const max = Math.max(...chart.rows.map((r) => Math.abs(r.value)), 1);
  chart.rows.forEach((row, i) => {
    const yy = y + i * rowH;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.6);
    doc.setTextColor(...INK);
    doc.text(row.label, x, yy + 2.2);
    const len = (Math.abs(row.value) / max) * half;
    if (row.value < 0) {
      doc.setFillColor(...CORAL);
      doc.rect(mid - len, yy, len, 3.4, "F");
    } else {
      doc.setFillColor(...TEAL_DEEP);
      doc.rect(mid, yy, len, 3.4, "F");
    }
    doc.setFontSize(6.2);
    doc.setTextColor(...MUTED);
    const tag = `${row.value > 0 ? "+" : ""}${row.value}%`;
    doc.text(tag, row.value < 0 ? mid - len - 1.2 : mid + len + 1.2, yy + 2.5, {
      align: row.value < 0 ? "right" : "left",
    });
  });
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.25);
  doc.line(mid, y - 1, mid, y + chart.rows.length * rowH);
  return chart.rows.length * rowH + 2;
}

function fundingTrend(doc, chart, x, y, w) {
  const h = 36;
  const n = chart.years.length;
  const gap = 4;
  const barW = (w - 8 - gap * (n - 1)) / n;
  chart.years.forEach((yr, i) => {
    const xx = x + 6 + i * (barW + gap);
    const bh = (chart.cash[i] / chart.yMax) * h;
    doc.setFillColor(...TEAL_DEEP);
    doc.rect(xx, y + h - bh, barW, bh, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.setTextColor(...MUTED);
    doc.text(yr, xx + barW / 2, y + h + 3.6, { align: "center" });
  });
  const pts = chart.keep2019
    .map((v, i) => {
      if (v == null) return null;
      const xx = x + 6 + i * (barW + gap) + barW / 2;
      const yy = y + h - (v / chart.yMax) * h;
      return { x: xx, y: yy };
    })
    .filter(Boolean);
  doc.setDrawColor(...FOREST);
  doc.setLineDashPattern([0.8, 0.7], 0);
  doc.setLineWidth(0.7);
  for (let i = 1; i < pts.length; i += 1) doc.line(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
  doc.setLineDashPattern([], 0);
  pts.forEach((p) => {
    doc.setFillColor(...FOREST);
    doc.circle(p.x, p.y, 0.9, "F");
  });
  doc.setFontSize(6.4);
  doc.setTextColor(...MUTED);
  doc.text("Cash grant   ·   dotted = 2019 £76m in today’s money", x, y + h + 8);
  return h + 11;
}

function fundingBars(doc, chart, x, y, w) {
  const h = 34;
  const n = chart.rows.length;
  const gap = 8;
  const barW = (w - gap * (n - 1)) / n;
  const max = Math.max(...chart.rows.map((r) => r.value));
  chart.rows.forEach((row, i) => {
    const xx = x + i * (barW + gap);
    const bh = (row.value / max) * h;
    doc.setFillColor(...rgb(row.fill));
    doc.rect(xx, y + h - bh, barW, bh, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(...FOREST);
    doc.text(`£${row.value}m`, xx + barW / 2, y + h - bh - 1.6, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.4);
    doc.setTextColor(...MUTED);
    doc.text(row.label, xx + barW / 2, y + h + 3.8, { align: "center" });
  });
  return h + 8;
}

function changeBars(doc, chart, x, y, w) {
  const rowH = 8.4;
  const labelW = 38;
  const barX = x + labelW;
  const barW = w - labelW - 16;
  const max = Math.max(...chart.rows.map((r) => Math.abs(r.value)));
  chart.rows.forEach((row, i) => {
    const yy = y + i * rowH;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...INK);
    doc.text(row.label, x, yy + 3);
    const len = (Math.abs(row.value) / max) * barW;
    doc.setFillColor(...rgb(row.fill));
    doc.rect(barX, yy, len, 4.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.text(`${row.value}%`, barX + len + 1.6, yy + 3.1);
  });
  return chart.rows.length * rowH;
}

const DRAW = {
  lollipop,
  "pair-rings": pairRings,
  "grouped-bars": groupedBars,
  "indexed-line": indexedLine,
  divergent,
  "funding-trend": fundingTrend,
  "funding-bars": fundingBars,
  "change-bars": changeBars,
};

/** Draw a chart figure. Returns total height used (caption + plot + source). */
export function drawChart(doc, id, x, y, w) {
  const chart = CHARTS[id];
  if (!chart) return 0;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.2);
  const plotFn = DRAW[chart.type];
  const capEnd = captionBlock(doc, x + 2.2, y + 4.6, w - 4.4, chart.caption, chart.source);
  const plotH = plotFn(doc, chart, x + 3, capEnd + 1.4, w - 6);
  const srcY = sourceLine(doc, x + 2.2, capEnd + 1.4 + plotH + 1.6, w - 4.4, chart.source);
  const total = srcY - y + 2.4;
  doc.rect(x, y, w, total, "S");
  return total;
}

export function chartHeightEstimate(id) {
  const chart = CHARTS[id];
  if (!chart) return 0;
  if (chart.type === "lollipop") return 18 + chart.rows.length * 9.2;
  if (chart.type === "pair-rings") return 56;
  if (chart.type === "grouped-bars") return 22 + chart.rows.length * 11;
  if (chart.type === "indexed-line") return 68;
  if (chart.type === "divergent") return 20 + chart.rows.length * 6.4;
  if (chart.type === "funding-trend") return 62;
  if (chart.type === "funding-bars") return 56;
  if (chart.type === "change-bars") return 18 + chart.rows.length * 8.4;
  return 52;
}
