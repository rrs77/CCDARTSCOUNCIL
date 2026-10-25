/**
 * Rhythmstix age-phase lesson plan templates (EYFS → KS5).
 *
 * Pure module (no React, no DOM, no Supabase) so it can be unit-tested with
 * `node --experimental-strip-types --test`. Sections, order, headings and
 * labels follow Rob's example files in docs/rhythmstix-templates
 * (branch cursor/rhythmstix-template-sources @ 0ad36c8e).
 *
 * Templates are declarative configs; one renderer (renderRhythmstixHtml)
 * produces the A4 document. The lesson data stays the source of truth.
 */

export type RhythmstixTemplateId = 'eyfs' | 'ks1' | 'lks2' | 'uks2' | 'ks3' | 'ks4' | 'ks5';

export interface RhythmstixTemplate {
  id: RhythmstixTemplateId;
  /** Short name shown in pickers, e.g. "KS2 · Years 3–4". */
  name: string;
  description: string;
  /** Years shown in the header band and meta line, e.g. "YEARS 3–4". */
  yearsLabel: string;
  /** Prefix of the top-right header, e.g. "KS2" → "KS2 MUSIC | TEACHING RESOURCE". */
  headerPhase: string;
  /** Restrained phase accent (headings rule, labels). */
  accent: string;
  /** Pale tint of the accent for intent / I CAN cells. */
  tint: string;
  /** Primary (EYFS–UKS2) or secondary (KS3–KS5) reference-page layout. */
  stage: 'primary' | 'secondary';
  /** Default strap under the title when the lesson has no subtitle. */
  defaultStrap: string;
  sequenceSubtitle: string;
  referenceHeading: string;
  referenceSubtitle: string;
  assessmentLabel: string;
  toolkitHeading: string;
  toolkitSubtitle: string;
  /** Fixed toolkit card labels (secondary). Primary toolkits are teacher-authored concept cards. */
  toolkitLabels: string[];
  sourceLabel: string;
  /** Template's own attribution line (structural, from Rob's examples), shown when the lesson has none. */
  sourceDefault: string;
  /** Lesson length used in the meta line when the lesson has no duration (from the examples). */
  defaultMinutes: number;
  /** Generic teacher guidance for fixed toolkit cards, where Rob's examples give non-lesson-specific text. */
  toolkitDefaults?: Record<string, string>;
  sortOrder: number;
}

const PRIMARY = {
  stage: 'primary' as const,
  referenceHeading: 'Check understanding',
  assessmentLabel: 'ASSESSMENT — LOOK & LISTEN FOR',
  toolkitHeading: 'Non-specialist teacher toolkit',
  toolkitLabels: [] as string[],
  sourceLabel: 'SOURCE & ADAPTATION',
  sourceDefault:
    'Adapt activities, curriculum links, credits and references for your class before teaching or sharing. Rhythmstix design © 2026.',
};

const SECONDARY = {
  stage: 'secondary' as const,
  referenceHeading: 'Assessment and subject guidance',
  referenceSubtitle: 'Adaptive teaching information; qualification fields are teacher-controlled.',
  assessmentLabel: 'ASSESSMENT: LOOK FOR',
  toolkitHeading: 'Teacher reference and subject toolkit',
  toolkitSubtitle: '',
  sourceLabel: 'SOURCE, ATTRIBUTION AND LIVE RESOURCE LINKS',
  sourceDefault: 'Use permitted Activity Library resources and retain provider attribution.',
  sequenceSubtitle: 'Teacher cues and timings follow the original Rhythmstix layout.',
};

export const RHYTHMSTIX_TEMPLATES: readonly RhythmstixTemplate[] = [
  {
    ...PRIMARY,
    id: 'eyfs',
    defaultMinutes: 45,
    name: 'EYFS · Nursery & Reception',
    description: 'Sing, move, play and explore. Short I CAN outcomes, look & listen assessment.',
    yearsLabel: 'RECEPTION',
    headerPhase: 'EYFS',
    accent: '#C87835',
    tint: '#FDF1E3',
    defaultStrap: 'Listen • Move • Play • Create',
    sequenceSubtitle: 'Model the action first, then let children listen, explore and respond.',
    referenceSubtitle: 'Use simple questions as children play and talk.',
    toolkitSubtitle: 'Straightforward guidance for a confident early-years lesson.',
    sortOrder: 1,
  },
  {
    ...PRIMARY,
    id: 'ks1',
    defaultMinutes: 45,
    name: 'KS1 · Years 1–2',
    description: 'Practise, copy, choose and perform, with explicit teacher prompts.',
    yearsLabel: 'YEARS 1–2',
    headerPhase: 'KS1',
    accent: '#4E9177',
    tint: '#E9F3EE',
    defaultStrap: 'Listen • Imagine • Perform • Reflect',
    sequenceSubtitle: 'Model each step, then let pupils practise, choose and perform.',
    referenceSubtitle: 'Use simple questions to check recall and understanding.',
    toolkitSubtitle: 'Clear subject concepts to support confident KS1 teaching.',
    sortOrder: 2,
  },
  {
    ...PRIMARY,
    id: 'lks2',
    defaultMinutes: 50,
    name: 'KS2 · Years 3–4',
    description: 'Experiment, apply, sequence and create; begin to evaluate.',
    yearsLabel: 'YEARS 3–4',
    headerPhase: 'KS2',
    accent: '#C5A13B',
    tint: '#FBF4DF',
    defaultStrap: 'Explore • Practise • Compose • Share',
    sequenceSubtitle: 'Build confidence with one idea before layering parts.',
    referenceSubtitle: 'Use questions and peer feedback to check understanding.',
    toolkitSubtitle: 'Clear subject concepts to support confident KS2 teaching.',
    sortOrder: 3,
  },
  {
    ...PRIMARY,
    id: 'uks2',
    defaultMinutes: 50,
    name: 'KS2 · Years 5–6',
    description: 'Develop technique, refine and justify ideas independently.',
    yearsLabel: 'YEARS 5–6',
    headerPhase: 'KS2',
    accent: '#3E6F9D',
    tint: '#E8EFF6',
    defaultStrap: 'Plan • Rehearse • Refine • Perform',
    sequenceSubtitle: 'Move from initial ideas to a purposeful performance.',
    referenceSubtitle: 'Focus on choices, control and evidence of refinement.',
    toolkitSubtitle: 'Subject concepts to support independence and KS3 transition.',
    sortOrder: 4,
  },
  {
    ...SECONDARY,
    id: 'ks3',
    defaultMinutes: 60,
    name: 'KS3 · Years 7–9',
    description: 'Conceptual exploration, specialist practice and critical reflection.',
    yearsLabel: 'YEARS 7–9',
    headerPhase: 'YEARS 7–9',
    accent: '#665A8C',
    tint: '#EFEDF5',
    defaultStrap: 'Explore • Create • Refine • Evaluate',
    toolkitLabels: ['SUBJECT KNOWLEDGE', 'COMMON MISCONCEPTION', 'PROGRESSION', 'EVIDENCE'],
    sortOrder: 5,
  },
  {
    ...SECONDARY,
    id: 'ks4',
    defaultMinutes: 60,
    name: 'KS4 · Years 10–11',
    description: 'Deliberate practical choices, refinement and teacher-selected qualification mapping.',
    yearsLabel: 'YEARS 10–11',
    headerPhase: 'YEARS 10–11',
    accent: '#9B5A4A',
    tint: '#F5ECE9',
    defaultStrap: 'Investigate • Rehearse • Refine • Evidence',
    toolkitLabels: ['QUALIFICATION MAPPING', 'AUTHENTICITY', 'TEACHER SUPPORT', 'EVIDENCE'],
    toolkitDefaults: {
      'QUALIFICATION MAPPING':
        'Select exam board, specification, component and current assessment objectives from verified teacher-managed data.',
      AUTHENTICITY:
        'Reflective evidence must describe the learner’s own choices and be handled in accordance with course rules.',
      'TEACHER SUPPORT': 'Provide sentence stems for explaining intention and revision, not pre-written portfolio answers.',
      EVIDENCE: 'Retain rehearsal annotations or recordings only where permissions and school policies permit.',
    },
    sourceDefault:
      'Not tied to any examination board. Actual objectives and permitted evidence depend on the teacher’s chosen specification.',
    sortOrder: 6,
  },
  {
    ...SECONDARY,
    id: 'ks5',
    defaultMinutes: 75,
    name: 'KS5 · Years 12–13',
    description: 'Advanced reasoning, independent enquiry and scholarly evidence.',
    yearsLabel: 'YEARS 12–13',
    headerPhase: 'YEARS 12–13',
    accent: '#7B415D',
    tint: '#F4EAEF',
    defaultStrap: 'Research • Analyse • Interpret • Critique',
    toolkitLabels: ['SUBJECT EXPERTISE', 'SCHOLARLY LITERACY', 'QUALIFICATION FIT', 'EVIDENCE'],
    toolkitDefaults: {
      'SUBJECT EXPERTISE': 'Provide the selected score, recording versions and reliable context; do not assume a fixed set work.',
      'SCHOLARLY LITERACY': 'Distinguish observation from interpretation, reference recording timings and cite sources.',
      'QUALIFICATION FIT': 'Use the teacher-selected A-level, BTEC or other pathway standards; do not hardcode one board.',
    },
    sourceDefault: 'Use teacher-approved curriculum, scholarly sources and licensing conditions.',
    sortOrder: 7,
  },
];

export const RHYTHMSTIX_TEMPLATE_IDS = RHYTHMSTIX_TEMPLATES.map((t) => t.id);

export function isRhythmstixTemplateId(id: unknown): id is RhythmstixTemplateId {
  return typeof id === 'string' && (RHYTHMSTIX_TEMPLATE_IDS as string[]).includes(id);
}

export function getRhythmstixTemplate(
  id: string | null | undefined,
  list: readonly RhythmstixTemplate[] = RHYTHMSTIX_TEMPLATES,
): RhythmstixTemplate {
  return list.find((t) => t.id === id) || RHYTHMSTIX_TEMPLATES.find((t) => t.id === id) || RHYTHMSTIX_TEMPLATES[0];
}

function normYearText(yearGroup: string | null | undefined): string {
  return String(yearGroup || '')
    .toLowerCase()
    .replace(/[–—_]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

const EYFS_RE =
  /(?:^|[^a-z0-9])(?:yr\.?|y\s*r|yrs?\s+r|year\s+r)(?![a-z0-9])|\b(eyfs|reception|rec|nursery|early years|foundation( stage)?|fs ?[12]|pre-?school|lkg|ukg|(lower|upper) kindergarten|kindergarten)\b/;

/** First year number in a label: "Year 3", "Yr 3", "Y3", "Years 3-4", "Yrs 5 & 6", "Year 11 Music (GCSE)". */
export function yearNumberFromLabel(yearGroup: string | null | undefined): number | null {
  const s = normYearText(yearGroup);
  const m = s.match(/(?:^|[^a-z])(?:years?|yrs?|y)\s*\.?\s*-?\s*(\d{1,2})(?!\d)/);
  return m ? Number(m[1]) : null;
}

function templateForYear(y: number): RhythmstixTemplateId | null {
  if (y <= 0) return 'eyfs';
  if (y <= 2) return 'ks1';
  if (y <= 4) return 'lks2';
  if (y <= 6) return 'uks2';
  if (y <= 9) return 'ks3';
  if (y <= 11) return 'ks4';
  if (y <= 13) return 'ks5';
  return null;
}

/**
 * Year group / class label → default template.
 * EYFS, Nursery, Reception, Lower/Upper Kindergarten (LKG/UKG) → eyfs;
 * Y1–2 ks1; Y3–4 lks2; Y5–6 uks2; Y7–9 ks3; Y10–11 ks4; Y12–13 ks5.
 * "Yr 3", "Y3", "Years 3-4" and "Years 3–4" all read the first year number.
 * A bare "KS2" (no year) gives lks2, the same as templateIdForKeyStage, so
 * teachers start on the Years 3–4 layout and can switch to Years 5–6.
 * Returns null when nothing matches.
 */
export function templateIdForYearGroup(yearGroup: string | null | undefined): RhythmstixTemplateId | null {
  const s = normYearText(yearGroup);
  if (!s) return null;
  const y = yearNumberFromLabel(s);
  if (y !== null) {
    const t = templateForYear(y);
    if (t) return t;
  }
  if (EYFS_RE.test(s)) return 'eyfs';
  if (/\b(a-? ?levels?|ks ?5|key stage 5|sixth form|post-?16)\b/.test(s)) return 'ks5';
  if (/\b(gcse|btec|ks ?4|key stage 4)\b/.test(s)) return 'ks4';
  if (/\b(ks ?3|key stage 3)\b/.test(s)) return 'ks3';
  if (/\b(lks ?2|lower ks ?2|lower key stage 2)\b/.test(s)) return 'lks2';
  if (/\b(uks ?2|upper ks ?2|upper key stage 2)\b/.test(s)) return 'uks2';
  if (/\b(ks ?2|key stage 2)\b/.test(s)) return 'lks2';
  if (/\b(ks ?1|key stage 1)\b/.test(s)) return 'ks1';
  return null;
}

/** Library key stage id (eyfs/ks1/ks2/ks3/ks4/ks5) → template. KS2 gives Years 3–4 (lks2), as above. */
export function templateIdForKeyStage(ks: string | null | undefined): RhythmstixTemplateId | null {
  const s = String(ks || '').trim().toLowerCase();
  if (isRhythmstixTemplateId(s)) return s;
  return templateIdForYearGroup(s);
}

/**
 * Years label for the meta line. Uses the template's label ("YEARS 7–9"),
 * except EYFS, where the class's own stage is kept: NURSERY, RECEPTION,
 * LOWER KINDERGARTEN, UPPER KINDERGARTEN (default RECEPTION).
 */
export function yearsLabelFor(t: RhythmstixTemplate, yearGroup?: string | null): string {
  if (t.id !== 'eyfs') return t.yearsLabel;
  const s = normYearText(yearGroup);
  if (/\b(lkg|lower kindergarten)\b/.test(s)) return 'LOWER KINDERGARTEN';
  if (/\b(ukg|upper kindergarten)\b/.test(s)) return 'UPPER KINDERGARTEN';
  if (/\bnursery|pre-?school|fs ?1\b/.test(s)) return 'NURSERY';
  return t.yearsLabel;
}

/** Subject from the class label or lesson (Music unless the label names another subject). */
export function subjectFromLabel(label: string | null | undefined, fallback = 'Music'): string {
  const s = String(label || '').toLowerCase();
  const found = [
    ['music', 'Music'], ['drama', 'Drama'], ['dance', 'Dance'], ['computing', 'Computing'],
    ['art', 'Art'], ['pe', 'PE'],
  ].filter(([k]) => new RegExp(`\\b${k}\\b`).test(s)).map(([, v]) => v);
  return found.length ? found.join(' & ') : fallback;
}

/**
 * The template a lesson prints with: the teacher's saved choice wins, then the
 * year group, then the key stage, then EYFS.
 */
export function resolveLessonTemplateId(
  lesson: { lessonTemplateId?: string | null } | null | undefined,
  yearGroup?: string | null,
  keyStage?: string | null,
): RhythmstixTemplateId {
  if (lesson && isRhythmstixTemplateId(lesson.lessonTemplateId)) return lesson.lessonTemplateId;
  return templateIdForYearGroup(yearGroup) || templateIdForKeyStage(keyStage) || 'eyfs';
}

/** Return a copy of the lesson with the chosen template saved on it. */
export function withLessonTemplate<T extends object>(lesson: T, id: RhythmstixTemplateId): T & { lessonTemplateId: RhythmstixTemplateId } {
  if (!isRhythmstixTemplateId(id)) throw new Error(`Unknown lesson template: ${String(id)}`);
  return { ...lesson, lessonTemplateId: id };
}

const HEX_COLOUR = /^#[0-9A-Fa-f]{6}$/;

/** A colour safe to put in a style: 6-digit hex, otherwise the fallback. */
export function safeHexColour(value: unknown, fallback: string): string {
  return typeof value === 'string' && HEX_COLOUR.test(value) ? value : fallback;
}

/** Normalise a DB row (lesson_plan_templates) into a template; null when invalid. */
export function templateFromDbRow(row: any): RhythmstixTemplate | null {
  if (!row || !isRhythmstixTemplateId(row.template_key)) return null;
  const base = getRhythmstixTemplate(row.template_key);
  const cfg = row.config && typeof row.config === 'object' ? row.config : {};
  return {
    ...base,
    ...cfg,
    id: base.id,
    accent: safeHexColour(cfg.accent, base.accent),
    tint: safeHexColour(cfg.tint, base.tint),
    name: typeof row.name === 'string' && row.name ? row.name : base.name,
    description: typeof row.description === 'string' ? row.description : base.description,
    sortOrder: Number.isFinite(row.sort_order) ? row.sort_order : base.sortOrder,
  };
}

/* ------------------------------------------------------------------ */
/* Document model                                                      */
/* ------------------------------------------------------------------ */

export interface RxLink { label: string; url: string }
export interface RxStep { title: string; minutes?: number; bodyHtml: string; cue?: string; links: RxLink[] }
export interface RxCard { label: string; bodyHtml: string }

export interface RhythmstixDoc {
  template: RhythmstixTemplate;
  subject: string;
  title: string;
  strap: string;
  meta: string[];
  intentHtml: string;
  iCan: string[];
  vocabularyHtml: string;
  resourceLines: string[];
  resourceLinks: RxLink[];
  steps: RxStep[];
  keyQuestions: string[];
  assessment: string[];
  toolkit: RxCard[];
  support: string;
  challenge: string;
  safety: string;
  sourceHtml: string;
  sourceLinks: RxLink[];
}

type AnyLesson = Record<string, any>;

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function stripTags(html: string): string {
  return decodeEntities(
    String(html || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|li|div|h\d|tr)>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  );
}

/** Comparable form of a block of text (for de-duplication). */
export function normText(s: unknown): string {
  return stripTags(String(s ?? ''))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Split rich text / newline / bullet lists into clean items. */
export function splitItems(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.flatMap((r) => splitItems(r));
  return stripTags(String(raw))
    .split(/\n|•|;(?=\s)/)
    .map((s) => s.replace(/^\s*(?:[-*✓✔]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);
}

function pushUnique(list: string[], items: string[]) {
  for (const i of items) {
    const n = normText(i);
    if (n && !list.some((x) => normText(x) === n)) list.push(i);
  }
}

/** Append a rich block unless the same text is already there. */
function appendUnique(cur: string, next: string): string {
  const n = normText(next);
  if (!n) return cur;
  if (normText(cur).includes(n)) return cur;
  if (n.includes(normText(cur)) && normText(cur)) return next;
  return cur ? `${cur}<br>${next}` : next;
}

const FILE_RE = /\.(pdf|docx?|pptx?|xlsx?|mp3|mp4|m4a|wav|png|jpe?g|gif|zip|txt)$/i;
const PATH_OR_URL_RE = /(https?:\/\/[^\s<>"')]+|\/[A-Za-z0-9\-._~%/]+\.[A-Za-z0-9]{2,4})/g;

/** Human label for a URL or path: "/examples/ks3-four-chords-lesson-guide.pdf" → "KS3 four chords lesson guide (PDF)". */
export function labelForLink(url: string): string {
  let path = url;
  try {
    path = /^https?:/i.test(url) ? new URL(url).pathname : url;
  } catch {
    /* keep raw */
  }
  const last = decodeURIComponent(path.split('/').filter(Boolean).pop() || '');
  const ext = (last.match(FILE_RE)?.[1] || '').toUpperCase();
  let base = last.replace(FILE_RE, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!base) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }
  base = base.replace(/\b(ks\d|eyfs|gcse|lks2|uks2|pdf|midi|daw)\b/gi, (m) => m.toUpperCase());
  base = base.charAt(0).toUpperCase() + base.slice(1);
  return ext ? `${base} (${ext === 'JPEG' ? 'JPG' : ext})` : base;
}

/** Absolute http(s) URL for a link, or null when unsafe. Relative "/x" paths resolve against baseUrl. */
export function safeLinkUrl(raw: unknown, baseUrl?: string): string | null {
  if (typeof raw !== 'string') return null;
  const u = raw.trim();
  if (/^https?:\/\/[^\s]+$/i.test(u)) return u;
  if (/^\/(?!\/)[^\s]*$/.test(u)) {
    if (baseUrl && /^https?:\/\//i.test(baseUrl)) {
      try {
        return new URL(u, baseUrl).toString();
      } catch {
        return null;
      }
    }
    return u;
  }
  return null;
}

function pushLink(list: RxLink[], label: string | null, url: unknown, baseUrl?: string) {
  const u = safeLinkUrl(url, baseUrl);
  if (!u) return;
  if (list.some((l) => l.url === u)) return;
  list.push({ label: label || labelForLink(u), url: u });
}

/** Split resources text into prose lines and links (paths/URLs become titled links). */
function absorbResources(doc: RhythmstixDoc, raw: unknown, baseUrl?: string) {
  for (const line of stripTags(String(raw ?? '')).split('\n')) {
    const found = line.match(PATH_OR_URL_RE) || [];
    for (const f of found) pushLink(doc.resourceLinks, null, f, baseUrl);
    const rest = line.replace(PATH_OR_URL_RE, '').replace(/^[\s,;:–—-]+|[\s,;:–—-]+$/g, '').trim();
    if (rest) pushUnique(doc.resourceLines, [rest]);
  }
}

type Route = 'keyQuestions' | 'assessment' | 'support' | 'challenge' | 'safety' | 'sourceHtml' | 'vocabularyHtml' | 'resources' | 'iCan' | 'intent';
const ROUTE: Array<[RegExp, Route]> = [
  [/^key questions?:?$/i, 'keyQuestions'],
  [/^(assessment|afl|assessment for learning|look (&|and) listen for|look for)/i, 'assessment'],
  [/^(support|differentiation)$/i, 'support'],
  [/^challenge$/i, 'challenge'],
  [/^safety|health (&|and) safety/i, 'safety'],
  [/^(source|attribution|source (&|and) adaptation)/i, 'sourceHtml'],
  [/^(key )?vocabulary:?$/i, 'vocabularyHtml'],
  [/^resources:?$/i, 'resources'],
  [/^(i can|success criteria)/i, 'iCan'],
  [/^(learning (outcomes?|objectives?|intentions?)|lesson intent|intent):?$/i, 'intent'],
];
const routeFor = (title: string): Route | undefined => ROUTE.find(([re]) => re.test(title.trim()))?.[1];

function activityLinks(a: AnyLesson | undefined, baseUrl?: string): RxLink[] {
  const out: RxLink[] = [];
  if (!a) return out;
  const name = String(a.activity || 'Activity');
  pushLink(out, `${name}: resource`, a.resourceLink, baseUrl);
  pushLink(out, `${name}: link`, a.link, baseUrl);
  pushLink(out, `${name}: video`, a.videoLink, baseUrl);
  pushLink(out, `${name}: music`, a.musicLink, baseUrl);
  pushLink(out, `${name}: backing track`, a.backingLink, baseUrl);
  return out;
}

const escapeLine = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Runs of 3+ short lines (word lists, question lists, rules: "excited / proud / worried")
 * print inline as "excited • proud • worried" so a pasted list doesn't take a page.
 * Lead-in lines ending in ':' and numbered headings are never merged.
 */
export function compactShortLines(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length >= 3) out.push(run.map((r) => r.trim()).join(' • '));
    else out.push(...run);
    run = [];
  };
  for (const l of lines) {
    const t = l.trim();
    if (t && t.length <= 48 && !/:$/.test(t) && !/^\d+[.)]\s/.test(t)) run.push(l);
    else {
      flush();
      out.push(l);
    }
  }
  flush();
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

/**
 * Split one long free-text block (e.g. a whole legacy "Main activity") into
 * steps at numbered headings like "1. Warm-Up Game – Pass the Emotion (10 minutes)".
 * Un-numbered headings that name a reference block ("Key Vocabulary",
 * "Key questions", "Resources", "Assessment", "Learning Outcomes") are routed
 * to that block instead of printing inside a step.
 */
export function splitLongBlock(
  title: string,
  bodyHtml: string,
): { steps: Array<{ title: string; minutes?: number; bodyHtml: string }>; routed: Array<[Route, string]> } {
  const lines = stripTags(bodyHtml).split('\n').map((l) => l.replace(/\s+$/, ''));
  const HEAD = /^\s*(\d{1,2})[.)]\s+(.{2,90}?)\s*(?:[(\[–—-]\s*(?:\d{1,3}\s*[–—-]\s*)?(\d{1,3})\s*(?:mins?|minutes?)\s*[)\]]?)?\s*$/i;
  const heads = lines.filter((l) => HEAD.test(l) && l.trim().length <= 110).length;
  const steps: Array<{ title: string; minutes?: number; bodyHtml: string }> = [];
  const routed: Array<[Route, string]> = [];
  if (heads < 2) {
    // No structure: keep as one step, but break very long text into readable parts.
    const text = compactShortLines(lines.join('\n')).trim();
    if (text.length <= 1800) return { steps: [{ title, bodyHtml }], routed };
    const paras = text.split(/\n\s*\n/);
    let buf = '';
    let part = 0;
    const flush = () => {
      if (!buf.trim()) return;
      steps.push({ title: part === 0 ? title : `${title} (continued)`, bodyHtml: escapeLine(buf.trim()).replace(/\n/g, '<br>') });
      part += 1;
      buf = '';
    };
    for (const p of paras) {
      if (buf && buf.length + p.length > 1200) flush();
      buf += (buf ? '\n\n' : '') + p;
    }
    flush();
    return { steps, routed };
  }
  let cur: { title: string; minutes?: number; lines: string[]; route?: Route } = { title, lines: [] };
  const close = () => {
    const text = compactShortLines(cur.lines.join('\n').replace(/^\s*lesson structure:?\s*$/gim, '')).trim();
    if (cur.route) {
      // A lone lead-in such as "By the end of the lesson:" with nothing after it adds nothing.
      if (text && !(text.length < 60 && /:$/.test(text))) routed.push([cur.route, escapeLine(text).replace(/\n/g, '<br>')]);
      return;
    }
    if (text || cur.title !== title) {
      steps.push({ title: cur.title, minutes: cur.minutes, bodyHtml: escapeLine(text).replace(/\n/g, '<br>') });
    }
  };
  for (const l of lines) {
    const m = l.trim().length <= 110 ? l.match(HEAD) : null;
    const plain = l.trim().replace(/:$/, '');
    const r = plain.length <= 40 && !m ? routeFor(plain) : undefined;
    if (m) {
      close();
      cur = { title: m[2].replace(/\s*[–—-]\s*$/, '').trim(), minutes: m[3] ? Number(m[3]) : undefined, lines: [] };
    } else if (r) {
      close();
      cur = { title: plain, lines: [], route: r };
    } else {
      cur.lines.push(l);
    }
  }
  close();
  // Drop an empty leading preamble.
  return { steps, routed };
}

/**
 * Map CCDesigner lesson data into the template's document model.
 * Never invents content: missing fields become teacher prompts or omitted blocks.
 */
export function buildRhythmstixDoc(
  lesson: AnyLesson,
  opts: {
    templateId: RhythmstixTemplateId;
    template?: RhythmstixTemplate;
    yearGroup?: string;
    subject?: string;
    lessonNumber?: string;
    baseUrl?: string;
  },
): RhythmstixDoc {
  const template = opts.template || getRhythmstixTemplate(opts.templateId);
  const subject = String(opts.subject || lesson.subject || subjectFromLabel(opts.yearGroup)).trim();
  const base = opts.baseUrl;
  const doc: RhythmstixDoc = {
    template,
    subject,
    title: String(lesson.title || '').trim() || 'Untitled lesson',
    strap: template.defaultStrap,
    meta: [],
    intentHtml: String(lesson.learningOutcome || ''),
    iCan: [],
    vocabularyHtml: '',
    resourceLines: [],
    resourceLinks: [],
    steps: [],
    keyQuestions: [],
    assessment: [],
    toolkit: [],
    support: '',
    challenge: '',
    safety: '',
    sourceHtml: '',
    sourceLinks: [],
  };
  pushUnique(doc.iCan, splitItems(lesson.successCriteria));
  doc.vocabularyHtml = appendUnique('', String(lesson.vocabulary || ''));
  absorbResources(doc, lesson.resources, base);
  pushUnique(doc.keyQuestions, splitItems(lesson.keyQuestions));
  pushUnique(doc.assessment, splitItems(lesson.assessment));
  doc.support = appendUnique('', String(lesson.differentiation || ''));

  // Meta: "YEARS 7–9 • 60 minutes • focus" (primary examples also name the subject).
  doc.meta.push(yearsLabelFor(template, opts.yearGroup));
  const metaAt = doc.meta.length;

  pushLink(doc.resourceLinks, null, lesson.resourceLink, base);
  pushLink(doc.resourceLinks, null, lesson.videoLink, base);
  for (const extra of splitItems(lesson.additionalLinks)) pushLink(doc.resourceLinks, null, extra, base);

  const toolkitLabels = template.toolkitLabels.map((l) => l.toLowerCase());

  const route = (r: Route, body: string) => {
    if (r === 'keyQuestions') pushUnique(doc.keyQuestions, splitItems(body));
    else if (r === 'assessment') pushUnique(doc.assessment, splitItems(body));
    else if (r === 'iCan') pushUnique(doc.iCan, splitItems(body));
    else if (r === 'support') doc.support = appendUnique(doc.support, body);
    else if (r === 'challenge') doc.challenge = appendUnique(doc.challenge, body);
    else if (r === 'safety') doc.safety = appendUnique(doc.safety, body);
    else if (r === 'sourceHtml') doc.sourceHtml = appendUnique(doc.sourceHtml, body);
    else if (r === 'vocabularyHtml') doc.vocabularyHtml = appendUnique(doc.vocabularyHtml, body);
    else if (r === 'resources') absorbResources(doc, body, base);
    else if (r === 'intent') doc.intentHtml = appendUnique(doc.intentHtml, body);
  };

  const addStep = (title: string, minutes: unknown, bodyHtml: string, act?: AnyLesson, cue?: string) => {
    const links = activityLinks(act, base);
    links.forEach((l) => pushLink(doc.sourceLinks, l.label, l.url, base));
    const m = Number(minutes);
    const parts = act ? { steps: [{ title, bodyHtml }], routed: [] as Array<[Route, string]> } : splitLongBlock(title, bodyHtml);
    parts.routed.forEach(([r, b]) => route(r, b));
    parts.steps.forEach((p, i) => {
      const pm = (p as { minutes?: number }).minutes;
      doc.steps.push({
        title: p.title || 'Activity',
        minutes: pm ?? (i === 0 && Number.isFinite(m) && m > 0 ? m : undefined),
        bodyHtml: p.bodyHtml,
        cue: i === 0 ? cue || (act?.teacherCue ? String(act.teacherCue) : undefined) : undefined,
        links: i === 0 ? links : [],
      });
    });
  };

  const sections: AnyLesson[] = Array.isArray(lesson.sections) ? lesson.sections : [];
  const activities: AnyLesson[] = sections.length
    ? []
    : Array.isArray(lesson.orderedActivities) && lesson.orderedActivities.length
      ? lesson.orderedActivities
      : (lesson.categoryOrder || []).flatMap((c: string) => lesson.grouped?.[c] || []);

  for (const s of sections) {
    const title = String(s.title || '').trim();
    const body = String(s.bodyHtml || '');
    if (s.kind === 'activity' || s.activity) {
      addStep(title || s.activity?.activity, s.durationMins ?? s.activity?.time, body || String(s.activity?.description || ''), s.activity);
      continue;
    }
    if (s.kind === 'vocabulary') { route('vocabularyHtml', body); continue; }
    if (s.kind === 'afl') { route('assessment', body); continue; }
    if (s.kind === 'differentiation') { route('support', body); continue; }
    const tk = toolkitLabels.indexOf(title.toLowerCase());
    if (tk >= 0 || /^toolkit\s*:/i.test(title) || (template.stage === 'primary' && / = /.test(title))) {
      if (normText(body)) doc.toolkit.push({ label: (tk >= 0 ? template.toolkitLabels[tk] : title.replace(/^toolkit\s*:\s*/i, '')).toUpperCase(), bodyHtml: body });
      continue;
    }
    const r = routeFor(title);
    if (r) route(r, body);
    else if (normText(body) || s.durationMins) addStep(title || (s.kind === 'homework' ? 'Homework / next steps' : 'Activity'), s.durationMins, body);
  }
  for (const a of activities) addStep(String(a.activity || ''), a.time, String(a.description || ''), a);

  if (!sections.length && !activities.length) {
    if (lesson.introduction) addStep('Introduction', undefined, String(lesson.introduction));
    if (lesson.mainActivity) addStep('Main activity', undefined, String(lesson.mainActivity));
    if (lesson.plenary) addStep('Plenary', undefined, String(lesson.plenary));
  }
  // Meta: years • minutes • (subject, primary) • focus. Minutes: lesson total, else
  // the sum of step timings, else the template's default length.
  const stepMins = doc.steps.reduce((n, st) => n + (st.minutes || 0), 0);
  const minutes = Number(lesson.totalTime) > 0 ? Number(lesson.totalTime) : stepMins > 0 ? stepMins : template.defaultMinutes;
  const tail: string[] = [`${minutes} minutes`];
  if (template.stage === 'primary' && subject) tail.push(subject);
  const firstCategory = (sections.find((x) => x.activity?.category)?.activity?.category ||
    activities.find((a) => a.category)?.category ||
    (Array.isArray(lesson.categoryOrder) ? lesson.categoryOrder[0] : '') ||
    '') as string;
  const focus = String(lesson.strand || lesson.focus || lesson.unitName || lesson.teachingUnit || firstCategory || '').trim();
  if (focus && !/^(teaching units?|uncategori[sz]ed|general|other|misc(ellaneous)?)$/i.test(focus) && normText(focus) !== normText(doc.title) && normText(focus) !== normText(subject)) tail.push(focus);
  doc.meta.splice(metaAt, 0, ...tail);
  return doc;
}

/* ------------------------------------------------------------------ */
/* HTML renderer (A4, full width)                                      */
/* ------------------------------------------------------------------ */

export function escapeText(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** CCDesigner logo (same artwork as utils/planLogo.ts) when no logo markup is passed in. Never a Rhythmstix mark. */
export const DEFAULT_LOGO_HTML =
  '<img class="ccd-plan-logo" src="/ccdesigner-logo.png" alt="CCDesigner" width="141" height="40" style="display:block;height:40px;width:141px">';

/** Plan footer (Rob, 25 Oct 2026: "change it to CCDesigner"). Site as used in the app (FeatureWalkthroughModal SITE_URL). */
export const PLAN_FOOTER_COPYRIGHT = (year: number = new Date().getFullYear()) => `© CCDesigner ${year}`;
export const PLAN_FOOTER_SITE = 'www.ccdesigner.co.uk';

export interface RenderOptions {
  /** Sanitiser for teacher-authored rich HTML (DOMPurify in the app). Defaults to escaping. */
  sanitizeHtml?: (html: string) => string;
  /** Trusted logo markup for the top-left slot (planLogoHtml in the app). Falls back to the CCDesigner logo image. */
  logoHtml?: string;
}

/** Rough printed height (px at 96dpi, 14px text, ~95 chars/line) used to place the "continued" break. */
function estHeight(html: string, charsPerLine = 92): number {
  const text = stripTags(html);
  const lines = text.split('\n').reduce((n, l) => n + Math.max(1, Math.ceil(l.length / charsPerLine)), 0);
  return lines * 20;
}

/** Ruled, printable write-in lines for fields the lesson hasn't filled. */
const LINES = (n: number) => `<div class="rx-lines" aria-label="Write-in space">${'<span></span>'.repeat(n)}</div>`;
export function rhythmstixCss(t: RhythmstixTemplate, subject = 'MUSIC'): string {
  const cssText = (v: string) => v.replace(/["\\<>{}]/g, '').toUpperCase();
  const base = RHYTHMSTIX_TEMPLATES.find((b) => b.id === t.id) || RHYTHMSTIX_TEMPLATES[0];
  t = { ...t, accent: safeHexColour(t.accent, base.accent), tint: safeHexColour(t.tint, base.tint) };
  return `
.rx-doc{--rx-accent:${t.accent};--rx-tint:${t.tint};--rx-teal:#1F7A70;--rx-gold:#B08A1E;
  font-family:Aptos,"Segoe UI",Calibri,Arial,sans-serif;color:#111;background:#fff;font-size:14px;line-height:1.45;width:100%;max-width:none;box-sizing:border-box}
.rx-doc *{box-sizing:border-box}
.rx-doc p{margin:0}
.rx-doc a{color:var(--rx-teal);font-weight:700}
.rx-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:2px solid var(--rx-gold);padding-bottom:10px;margin-bottom:14px}
.rx-logo-slot{min-height:40px;min-width:160px;display:flex;align-items:center}
.rx-phase{font-size:13px;font-weight:700;color:var(--rx-accent);text-transform:uppercase;text-align:right}
.rx-kicker{font-size:13px;font-weight:800;letter-spacing:.04em;color:var(--rx-accent);text-transform:uppercase;margin:0 0 4px}
.rx-title{font-size:30px;font-weight:800;line-height:1.15;margin:0}
.rx-strap{font-size:19px;font-weight:700;color:var(--rx-teal);margin:2px 0 4px}
.rx-meta{font-size:13px;font-weight:700;color:var(--rx-teal);margin:0 0 10px}
.rx-box{border:1px solid var(--rx-accent);border-radius:4px;padding:8px 12px;margin:10px 0}
.rx-box.tint{background:var(--rx-tint)}
.rx-label{font-size:13px;font-weight:800;color:var(--rx-accent);text-transform:uppercase;margin:0 0 4px}
.rx-lines{display:block;padding-top:2px}
.rx-lines span{display:block;height:24px;border-bottom:1px solid #9a9a9a}
.rx-ican-grid>div .rx-lines span{height:22px}
.rx-fillin{display:inline-block;min-width:44px;border-bottom:1px solid #9a9a9a;height:1em;vertical-align:baseline}
.rx-cue .rx-fillin{min-width:60%}
.rx-ican{margin:14px 0;border:1px solid var(--rx-accent);border-radius:4px;overflow:hidden;break-inside:avoid}
.rx-ican-h{background:#1d1d1f;color:#fff;font-weight:800;font-size:14px;padding:5px 10px}
.rx-ican-grid{display:grid;grid-template-columns:1fr 1fr}
.rx-ican-grid>div{padding:8px 10px;color:var(--rx-teal);font-weight:700;border-top:1px solid var(--rx-accent)}
.rx-ican-grid>div:nth-child(odd){border-right:1px solid var(--rx-accent)}
.rx-ican-grid>div:nth-child(4n+1),.rx-ican-grid>div:nth-child(4n+4){background:var(--rx-tint)}
.rx-ican-grid>div:nth-child(4n+2),.rx-ican-grid>div:nth-child(4n+3){background:#fff}
.rx-two{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #c9c9c9;margin:10px 0;break-inside:avoid}
.rx-two>div{padding:8px 12px}
.rx-two>div+div{border-left:1px solid #c9c9c9}
.rx-cell-a{background:#EEF6F4}.rx-cell-b{background:#FAF6EA}
.rx-h2{font-size:22px;font-weight:800;margin:18px 0 2px}
.rx-sub{font-size:14px;color:var(--rx-teal);margin:0 0 8px}
.rx-step{border-bottom:1px solid #ddd;padding:8px 0 10px}
.rx-step.short{break-inside:avoid}
.rx-step-h{display:flex;justify-content:space-between;gap:12px;font-weight:800;font-size:17px;break-after:avoid}
.rx-step-t{font-size:13px;font-weight:700;color:var(--rx-accent);white-space:nowrap}
.rx-cue{font-size:13px;font-weight:700;color:var(--rx-gold);margin-top:4px}
.rx-links{font-size:13px;margin-top:4px}
.rx-cont{break-before:page;page-break-before:always}
.rx-ref{break-before:page;page-break-before:always;padding-top:4px}
.rx-grid2{display:grid;grid-template-columns:1fr 1fr;border:1px solid #c9c9c9;margin:10px 0}
.rx-grid2>div{padding:8px 12px;border-bottom:1px solid #c9c9c9;break-inside:avoid}
.rx-grid2>div:nth-child(odd){border-right:1px solid #c9c9c9;background:#EEF6F4}
.rx-grid2>div:nth-child(even){background:#FAF6EA}
.rx-grid3{display:grid;border:1px solid #c9c9c9;margin:10px 0;break-inside:avoid}
.rx-grid3>div{padding:8px 12px}
.rx-grid3>div+div{border-left:1px solid #c9c9c9}
.rx-grid3>div:nth-child(1){background:#EEF6F4}.rx-grid3>div:nth-child(3){background:#FAF6EA}
.rx-list{margin:0;padding-left:18px}
.rx-checks{list-style:none;margin:0;padding:0}
.rx-checks li::before{content:"✓ ";color:var(--rx-teal);font-weight:800}
.rx-source{background:#EEF6F4;border:1px solid #9cc9c1;border-radius:4px;padding:8px 12px;margin:14px 0;break-inside:avoid}
.rx-foot{display:flex;justify-content:space-between;border-top:1px solid #ddd;margin-top:18px;padding-top:6px;font-size:13px;color:#555}
.rx-empty{color:#666;font-style:italic}
@media print{
  @page{size:A4;margin:14mm 14mm 16mm 14mm;
    @top-right{content:"${cssText(t.headerPhase)} ${cssText(subject)}  |  TEACHING RESOURCE";font-size:13px;font-weight:700;color:${t.accent}}
    @bottom-left{content:"${PLAN_FOOTER_COPYRIGHT()}";font-size:13px;color:#555}
    @bottom-center{content:"${PLAN_FOOTER_SITE}";font-size:13px;color:#1F7A70}
    @bottom-right{content:"Page " counter(page);font-size:13px;color:#555}}
  @page:first{@top-right{content:none}}
  html,body{background:#fff !important}
  .rx-foot{display:none}
}`;
}

/** Usable page-1 / page height (px) for the continued-sequence break. A4 minus margins ≈ 1010px. */
const PAGE_PX = 1010;

export function renderRhythmstixHtml(doc: RhythmstixDoc, opts: RenderOptions = {}): string {
  const t = doc.template;
  const rich = (h: string) =>
    opts.sanitizeHtml ? opts.sanitizeHtml(h.includes('<') ? h : h.replace(/\n/g, '<br>')) : escapeText(stripTags(h)).replace(/\n/g, '<br>');
  const link = (l: RxLink) => `<a href="${escapeText(l.url)}" target="_blank" rel="noopener noreferrer">${escapeText(l.label)} ↗</a>`;
  const li = (items: string[]) => `<ul class="rx-list">${items.map((i) => `<li>${escapeText(i)}</li>`).join('')}</ul>`;
  const checks = (items: string[]) => `<ul class="rx-checks">${items.map((i) => `<li>${escapeText(i)}</li>`).join('')}</ul>`;
  const subjectUpper = escapeText(doc.subject.toUpperCase());
  const secondary = t.stage === 'secondary';

  const parts: string[] = [];
  let used = 0; // estimated px used on page 1
  parts.push(`<style>${rhythmstixCss(t, doc.subject)}</style>`);
  parts.push(`<div class="rx-doc" data-rx-template="${t.id}">`);
  parts.push(
    `<header class="rx-head"><div class="rx-logo-slot" data-logo-slot="top-left">${opts.logoHtml || DEFAULT_LOGO_HTML}</div>` +
      `<div class="rx-phase">${escapeText(t.headerPhase)} ${subjectUpper} &nbsp;|&nbsp; TEACHING RESOURCE</div></header>`,
  );
  // Kicker as in the examples: KS3–KS5 say "LESSON PLAN • ILLUSTRATIVE TEMPLATE".
  parts.push(`<p class="rx-kicker">${secondary ? 'Lesson plan • Illustrative template' : 'Lesson plan'}</p><h1 class="rx-title">${escapeText(doc.title)}</h1>`);
  parts.push(`<p class="rx-strap">${escapeText(doc.strap)}</p><p class="rx-meta">${doc.meta.map(escapeText).join(' &nbsp;•&nbsp; ')}</p>`);
  used += 175 + Math.max(0, Math.ceil(doc.title.length / 40) - 1) * 36;

  parts.push(
    `<div class="rx-box tint"><p class="rx-label">Lesson intent</p>${
      normText(doc.intentHtml) ? rich(doc.intentHtml) : LINES(2)
    }</div>`,
  );
  used += 50 + estHeight(doc.intentHtml);

  // I CAN… always four cells, as in every example; empty cells are teacher prompts.
  const ican = doc.iCan.slice();
  const cells = Math.max(4, ican.length + (ican.length % 2));
  parts.push(
    `<section class="rx-ican"><div class="rx-ican-h">I CAN…</div><div class="rx-ican-grid">${Array.from({ length: cells }, (_, i) =>
      ican[i] ? `<div>✓ ${escapeText(ican[i])}</div>` : `<div>✓ I can ${LINES(1)}</div>`,
    ).join('')}</div></section>`,
  );
  used += 40 + (cells / 2) * 40;

  // Key vocabulary / Resources: always shown, as in the examples.
  const vocab = normText(doc.vocabularyHtml) ? rich(doc.vocabularyHtml) : LINES(2);
  const resText = doc.resourceLines.length ? doc.resourceLines.map((l) => `<p>${escapeText(l)}</p>`).join('') : '';
  const resLinks = doc.resourceLinks.length ? `<div class="rx-links">${doc.resourceLinks.map(link).join('<br>')}</div>` : '';
  parts.push(
    `<div class="rx-two"><div class="rx-cell-a"><p class="rx-label">Key vocabulary</p>${vocab}</div>` +
      `<div class="rx-cell-b"><p class="rx-label">Resources</p>${resText || resLinks ? resText + resLinks : LINES(2)}</div></div>`,
  );
  used += 56 + Math.max(estHeight(doc.vocabularyHtml, 45), (doc.resourceLines.length + doc.resourceLinks.length) * 20);

  parts.push(`<h2 class="rx-h2">Lesson sequence</h2><p class="rx-sub">${escapeText(t.sequenceSubtitle)}</p>`);
  used += 60;
  if (!doc.steps.length) parts.push(`<p class="rx-empty">No activities in this lesson yet.</p>`);
  let continued = false;
  doc.steps.forEach((s, i) => {
    const h = 66 + estHeight(s.bodyHtml) + (s.links.length ? 18 : 0);
    const short = h < 360;
    // Examples: a step that won't fit starts page 2 under "LESSON SEQUENCE • CONTINUED".
    if (!continued && i > 0 && (i >= 2 || used + (short ? h : 160) > PAGE_PX)) {
      continued = true;
      parts.push(
        `<div class="rx-cont"><p class="rx-kicker">Lesson sequence • continued</p>${
          secondary ? `<h2 class="rx-h2" style="margin-top:4px">From exploration to confident practice</h2><p class="rx-sub">Retain the teacher’s own activity order, source links and timings.</p>` : ''
        }</div>`,
      );
    }
    if (!continued) used += h;
    parts.push(
      `<div class="rx-step${short ? ' short' : ''}"><div class="rx-step-h"><span>${i + 1}.&nbsp; ${escapeText(s.title)}</span><span class="rx-step-t">${
        s.minutes ? `${s.minutes} min` : '<span class="rx-fillin"></span> min'
      }</span></div>${normText(s.bodyHtml) ? `<div>${rich(s.bodyHtml)}</div>` : ''}<div class="rx-cue">Teacher cue: ${
        s.cue ? escapeText(s.cue) : '<span class="rx-fillin"></span>'
      }</div>${s.links.length ? `<div class="rx-links">${s.links.map(link).join(' &nbsp; ')}</div>` : ''}</div>`,
    );
  });

  // Reference page
  parts.push(`<section class="rx-ref"><p class="rx-kicker">Reference page</p>`);
  parts.push(`<h2 class="rx-h2">${escapeText(t.referenceHeading)}</h2><p class="rx-sub">${escapeText(t.referenceSubtitle)}</p>`);
  parts.push(
    `<div class="rx-two"><div class="rx-cell-b"><p class="rx-label">Key questions</p>${
      doc.keyQuestions.length ? li(doc.keyQuestions) : LINES(4)
    }</div>` +
      `<div class="rx-cell-a"><p class="rx-label">${escapeText(t.assessmentLabel)}</p>${
        doc.assessment.length ? checks(doc.assessment) : LINES(4)
      }</div></div>`,
  );

  // Toolkit: secondary has fixed labels; primary always shows four concept cards.
  let toolkitCards: RxCard[];
  if (secondary) {
    toolkitCards = [
      ...t.toolkitLabels.map((label) => doc.toolkit.find((c) => c.label === label) || { label, bodyHtml: t.toolkitDefaults?.[label] || '' }),
      ...doc.toolkit.filter((c) => !t.toolkitLabels.includes(c.label)),
    ];
  } else {
    toolkitCards = doc.toolkit.slice();
    while (toolkitCards.length < 4 || toolkitCards.length % 2) {
      toolkitCards.push({ label: 'KEY CONCEPT', bodyHtml: '' });
    }
  }
  parts.push(`<h2 class="rx-h2">${escapeText(t.toolkitHeading)}</h2>${t.toolkitSubtitle ? `<p class="rx-sub">${escapeText(t.toolkitSubtitle)}</p>` : ''}`);
  parts.push(
    `<div class="rx-grid2">${toolkitCards
      .map((c) => `<div><p class="rx-label">${escapeText(c.label)}</p>${normText(c.bodyHtml) ? rich(c.bodyHtml) : LINES(3)}</div>`)
      .join('')}</div>`,
  );

  // Support / Challenge / Safety: always shown, as in every example; empty boxes are write-in.
  parts.push(`<h2 class="rx-h2">Support, challenge and safety</h2>`);
  parts.push(
    `<div class="rx-grid3" style="grid-template-columns:repeat(3,1fr)">${(
      [
        ['Support', doc.support],
        ['Challenge', doc.challenge],
        ['Safety', doc.safety],
      ] as Array<[string, string]>
    )
      .map(([k, v]) => `<div><p class="rx-label">${k}</p>${normText(v) ? rich(v) : LINES(3)}</div>`)
      .join('')}</div>`,
  );
  // Source: always shown; the lesson's own attribution, else the template's line.
  parts.push(
    `<div class="rx-source"><p class="rx-label" style="color:var(--rx-teal)">${escapeText(t.sourceLabel)}</p>${
      normText(doc.sourceHtml) ? rich(doc.sourceHtml) : `<p>${escapeText(t.sourceDefault)}</p>`
    }${doc.sourceLinks.length ? `<div class="rx-links">${doc.sourceLinks.map(link).join('<br>')}</div>` : ''}</div>`,
  );
  parts.push(`</section>`);
  parts.push(`<footer class="rx-foot"><span>${PLAN_FOOTER_COPYRIGHT()}</span><span>${PLAN_FOOTER_SITE}</span><span></span></footer>`);
  parts.push(`</div>`);
  return parts.join('');
}

/**
 * Starter sections for a new lesson built from a Rhythmstix template, so the
 * reference page has somewhere to write. Titles match the router in
 * buildRhythmstixDoc. Types kept structural to stay import-free.
 */
export function rhythmstixPlanTemplate(t: RhythmstixTemplate): {
  id: string;
  keyStageId: string;
  name: string;
  description?: string;
  defaultSectionBlueprints: Array<{ kind: 'vocabulary' | 'free_text' | 'afl' | 'differentiation'; title: string }>;
} {
  return {
    id: `rhythmstix-${t.id}`,
    keyStageId: t.id === 'lks2' || t.id === 'uks2' ? 'ks2' : t.id,
    name: t.name,
    description: t.description,
    defaultSectionBlueprints: [
      { kind: 'free_text', title: 'I can' },
      { kind: 'vocabulary', title: 'Key vocabulary' },
      { kind: 'free_text', title: 'Resources' },
      { kind: 'free_text', title: 'Key questions' },
      { kind: 'afl', title: t.stage === 'primary' ? 'Assessment — look & listen for' : 'Assessment: look for' },
      ...t.toolkitLabels.map((label) => ({
        kind: 'free_text' as const,
        title: label.charAt(0) + label.slice(1).toLowerCase(),
      })),
      { kind: 'differentiation', title: 'Support' },
      { kind: 'free_text', title: 'Challenge' },
      { kind: 'free_text', title: 'Safety' },
    ],
  };
}
