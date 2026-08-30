/**
 * Parse CONTENT.md → presentation AST.
 * `#` title · `##` main sections · `###` nested · paragraphs · lists · `>` quotes · footnotes · `<!-- chart:id -->`
 */

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "stat"; value: string; label: string }
  | { type: "chart"; chartId: string };

export type ContentSection = {
  id: string;
  level: 2 | 3;
  title: string;
  parentId: string | null;
  blocks: ContentBlock[];
};

export type ParsedDocument = {
  title: string;
  lead: string[];
  sections: ContentSection[];
  footnotes: { id: string; text: string; url?: string }[];
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "section";
}

function uniqueId(base: string, used: Set<string>): string {
  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${n++}`;
  }
  used.add(id);
  return id;
}

function stripFootnoteRefs(text: string): string {
  return text.replace(/\[\^\d+\]/g, "").trim();
}

/** Parse `- **−42%** — label` or `- **value** label` into a stat tile when possible. */
function tryStat(item: string): ContentBlock | null {
  const m = item.match(/^\*\*(.+?)\*\*\s*[—–\-:]?\s*(.+)$/);
  if (!m) return null;
  const value = m[1].trim();
  const label = stripFootnoteRefs(m[2]);
  if (value.length > 48) return null;
  return { type: "stat", value, label };
}

export function parseContentMarkdown(md: string): ParsedDocument {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const used = new Set<string>();
  let title = "The facts";
  const lead: string[] = [];
  const sections: ContentSection[] = [];
  const footnotes: ParsedDocument["footnotes"] = [];

  let current: ContentSection | null = null;
  let mainId: string | null = null;
  let listBuf: string[] = [];

  const flushList = () => {
    if (!listBuf.length || !current) return;
    const stats: ContentBlock[] = [];
    const plain: string[] = [];
    for (const item of listBuf) {
      const st = tryStat(item);
      if (st) stats.push(st);
      else plain.push(stripFootnoteRefs(item));
    }
    for (const s of stats) current.blocks.push(s);
    if (plain.length) current.blocks.push({ type: "list", items: plain });
    listBuf = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();
    const trimmed = line.trim();

    // Footnote definition
    const fn = trimmed.match(/^\[\^(\d+)\]:\s*(.+)$/);
    if (fn) {
      flushList();
      const text = fn[2].trim();
      const urlMatch = text.match(/https?:\/\/\S+/);
      footnotes.push({
        id: fn[1],
        text: text.replace(/\s*—\s*https?:\/\/\S+/, "").replace(/https?:\/\/\S+/, "").trim() || text,
        url: urlMatch?.[0],
      });
      continue;
    }

    if (/^#\s+/.test(trimmed) && !/^##/.test(trimmed)) {
      flushList();
      title = trimmed.replace(/^#\s+/, "").trim();
      continue;
    }

    if (/^##\s+/.test(trimmed)) {
      flushList();
      const t = trimmed.replace(/^##\s+/, "").trim();
      const id = uniqueId(slugify(t), used);
      mainId = id;
      current = { id, level: 2, title: t, parentId: null, blocks: [] };
      sections.push(current);
      continue;
    }

    if (/^###\s+/.test(trimmed)) {
      flushList();
      const t = trimmed.replace(/^###\s+/, "").trim();
      const id = uniqueId(slugify(t), used);
      current = { id, level: 3, title: t, parentId: mainId, blocks: [] };
      sections.push(current);
      continue;
    }

    const chart = trimmed.match(/^<!--\s*chart:([a-zA-Z0-9_-]+)\s*-->$/);
    if (chart && current) {
      flushList();
      current.blocks.push({ type: "chart", chartId: chart[1] });
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      flushList();
      if (!current) continue;
      const text = stripFootnoteRefs(trimmed.replace(/^>\s?/, ""));
      current.blocks.push({ type: "quote", text });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      if (!current) continue;
      listBuf.push(trimmed.replace(/^[-*]\s+/, ""));
      continue;
    }

    if (!trimmed) {
      flushList();
      continue;
    }

    flushList();
    const text = stripFootnoteRefs(trimmed);
    if (!current) {
      lead.push(text);
    } else {
      current.blocks.push({ type: "paragraph", text });
    }
  }
  flushList();

  return { title, lead, sections, footnotes };
}

export function estimateSectionSize(section: ContentSection, isSources: boolean): { w: number; h: number } {
  const MIN_W = 980;
  const MIN_H = 560;
  const MAX_W = 1280;
  let w = MIN_W;
  let h = 120; // chrome + title

  for (const b of section.blocks) {
    if (b.type === "paragraph") {
      const chars = b.text.length;
      const lines = Math.max(1, Math.ceil(chars / 62));
      h += lines * 34 + 18;
    } else if (b.type === "list") {
      h += b.items.length * 36 + 16;
    } else if (b.type === "quote") {
      const lines = Math.max(2, Math.ceil(b.text.length / 58));
      h += lines * 32 + 48;
    } else if (b.type === "stat") {
      h += 0; // counted in grid below
    } else if (b.type === "chart") {
      h += 300;
      w = Math.max(w, 1100);
    }
  }

  const stats = section.blocks.filter((b) => b.type === "stat");
  if (stats.length) {
    const rows = Math.ceil(stats.length / 2);
    h += rows * 118 + 24;
    w = Math.max(w, 1080);
  }

  if (isSources) {
    h += 80;
    w = Math.max(w, 1040);
  }

  // Nested frames slightly tighter min
  if (section.level === 3) {
    return {
      w: Math.min(MAX_W, Math.max(860, w - 40)),
      h: Math.max(480, h),
    };
  }

  return {
    w: Math.min(MAX_W, Math.max(MIN_W, w)),
    h: Math.max(MIN_H, h),
  };
}
