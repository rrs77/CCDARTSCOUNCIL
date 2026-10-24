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
  sortOrder: number;
}

const PRIMARY = {
  stage: 'primary' as const,
  referenceHeading: 'Check understanding',
  assessmentLabel: 'ASSESSMENT — LOOK & LISTEN FOR',
  toolkitHeading: 'Non-specialist teacher toolkit',
  toolkitLabels: [] as string[],
  sourceLabel: 'SOURCE & ADAPTATION',
};

const SECONDARY = {
  stage: 'secondary' as const,
  referenceHeading: 'Assessment and subject guidance',
  referenceSubtitle: 'Adaptive teaching information; qualification fields are teacher-controlled.',
  assessmentLabel: 'ASSESSMENT: LOOK FOR',
  toolkitHeading: 'Teacher reference and subject toolkit',
  toolkitSubtitle: '',
  sourceLabel: 'SOURCE, ATTRIBUTION AND LIVE RESOURCE LINKS',
  sequenceSubtitle: 'Teacher cues and timings follow the original Rhythmstix layout.',
};

export const RHYTHMSTIX_TEMPLATES: readonly RhythmstixTemplate[] = [
  {
    ...PRIMARY,
    id: 'eyfs',
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
    name: 'KS4 · Years 10–11',
    description: 'Deliberate practical choices, refinement and teacher-selected qualification mapping.',
    yearsLabel: 'YEARS 10–11',
    headerPhase: 'YEARS 10–11',
    accent: '#9B5A4A',
    tint: '#F5ECE9',
    defaultStrap: 'Investigate • Rehearse • Refine • Evidence',
    toolkitLabels: ['QUALIFICATION MAPPING', 'AUTHENTICITY', 'TEACHER SUPPORT', 'EVIDENCE'],
    sortOrder: 6,
  },
  {
    ...SECONDARY,
    id: 'ks5',
    name: 'KS5 · Years 12–13',
    description: 'Advanced reasoning, independent enquiry and scholarly evidence.',
    yearsLabel: 'YEARS 12–13',
    headerPhase: 'YEARS 12–13',
    accent: '#7B415D',
    tint: '#F4EAEF',
    defaultStrap: 'Research • Analyse • Interpret • Critique',
    toolkitLabels: ['QUALIFICATION FIT', 'EVIDENCE', 'SUBJECT EXPERTISE', 'SCHOLARLY LITERACY'],
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

/**
 * Year group → default template.
 * EYFS/Nursery/Reception → eyfs, Y1–2 ks1, Y3–4 lks2, Y5–6 uks2,
 * Y7–9 ks3, Y10–11 ks4, Y12–13 ks5. Returns null when nothing matches.
 */
export function templateIdForYearGroup(yearGroup: string | null | undefined): RhythmstixTemplateId | null {
  const s = String(yearGroup || '').trim().toLowerCase();
  if (!s) return null;
  if (/\b(eyfs|reception|nursery|early years|lkg|ukg|foundation|fs[12]?|yr|pre-?school)\b/.test(s)) return 'eyfs';
  const m = s.match(/\b(?:year|yr|y)\s*-?\s*(\d{1,2})\b/);
  if (m) {
    const y = Number(m[1]);
    if (y <= 0) return 'eyfs';
    if (y <= 2) return 'ks1';
    if (y <= 4) return 'lks2';
    if (y <= 6) return 'uks2';
    if (y <= 9) return 'ks3';
    if (y <= 11) return 'ks4';
    if (y <= 13) return 'ks5';
  }
  if (/\b(a[\s-]?level|ks5|key stage 5|sixth form|post-?16)\b/.test(s)) return 'ks5';
  if (/\b(gcse|btec|ks4|key stage 4)\b/.test(s)) return 'ks4';
  if (/\b(ks3|key stage 3)\b/.test(s)) return 'ks3';
  if (/\b(lks2|lower ks2)\b/.test(s)) return 'lks2';
  if (/\b(uks2|upper ks2|ks2|key stage 2)\b/.test(s)) return 'uks2';
  if (/\b(ks1|key stage 1)\b/.test(s)) return 'ks1';
  return null;
}

/** Library key stage id (eyfs/ks1/ks2/ks3/ks4/ks5) → template. KS2 defaults to Years 3–4. */
export function templateIdForKeyStage(ks: string | null | undefined): RhythmstixTemplateId | null {
  const s = String(ks || '').trim().toLowerCase();
  if (isRhythmstixTemplateId(s)) return s;
  if (s === 'ks2') return 'lks2';
  return null;
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
  resourcesHtml: string;
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

function stripTags(html: string): string {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|div|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
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

function isHttpUrl(u: unknown): u is string {
  return typeof u === 'string' && /^https?:\/\/[^\s]+$/i.test(u.trim());
}

function pushLink(list: RxLink[], label: string, url: unknown) {
  if (!isHttpUrl(url)) return;
  const u = url.trim();
  if (list.some((l) => l.url === u)) return;
  list.push({ label: label || u, url: u });
}

const ROUTE: Array<[RegExp, keyof RhythmstixDoc | 'toolkit']> = [
  [/^key questions?$/i, 'keyQuestions'],
  [/^(assessment|afl|assessment for learning|look (&|and) listen for|look for)/i, 'assessment'],
  [/^(support|differentiation)$/i, 'support'],
  [/^challenge$/i, 'challenge'],
  [/^safety|health (&|and) safety/i, 'safety'],
  [/^(source|attribution|source (&|and) adaptation)/i, 'sourceHtml'],
  [/^vocabulary|^key vocabulary/i, 'vocabularyHtml'],
  [/^resources$/i, 'resourcesHtml'],
  [/^(i can|success criteria)/i, 'iCan'],
];

function activityLinks(a: AnyLesson | undefined): RxLink[] {
  const out: RxLink[] = [];
  if (!a) return out;
  const name = String(a.activity || 'Activity');
  pushLink(out, `${name} — resource`, a.resourceLink);
  pushLink(out, `${name} — link`, a.link);
  pushLink(out, `${name} — video`, a.videoLink);
  pushLink(out, `${name} — music`, a.musicLink);
  pushLink(out, `${name} — backing track`, a.backingLink);
  return out;
}

/**
 * Map CCDesigner lesson data into the template's document model.
 * Never invents content: empty fields become omitted blocks.
 */
export function buildRhythmstixDoc(
  lesson: AnyLesson,
  opts: { templateId: RhythmstixTemplateId; template?: RhythmstixTemplate; yearGroup?: string; subject?: string; lessonNumber?: string },
): RhythmstixDoc {
  const template = opts.template || getRhythmstixTemplate(opts.templateId);
  const subject = String(opts.subject || lesson.subject || lesson.primarySubject || 'Music').trim();
  const doc: RhythmstixDoc = {
    template,
    subject,
    title: String(lesson.title || '').trim() || 'Untitled lesson',
    strap: String(lesson.lessonName || '').trim() || template.defaultStrap,
    meta: [],
    intentHtml: String(lesson.learningOutcome || lesson.introduction || ''),
    iCan: splitItems(lesson.successCriteria),
    vocabularyHtml: String(lesson.vocabulary || ''),
    resourcesHtml: String(lesson.resources || ''),
    resourceLinks: [],
    steps: [],
    keyQuestions: splitItems(lesson.keyQuestions),
    assessment: splitItems(lesson.assessment),
    toolkit: [],
    support: String(lesson.differentiation || ''),
    challenge: '',
    safety: '',
    sourceHtml: '',
    sourceLinks: [],
  };

  const yg = String(opts.yearGroup || '').trim();
  doc.meta.push(yg ? yg.toUpperCase() : template.yearsLabel);
  const minutes = Number(lesson.totalTime) || 0;
  if (minutes > 0) doc.meta.push(`${minutes} minutes`);
  if (subject) doc.meta.push(subject);
  const strand = String(lesson.strand || lesson.unitName || '').trim();
  if (strand) doc.meta.push(strand);

  pushLink(doc.resourceLinks, 'Resource', lesson.resourceLink);
  pushLink(doc.resourceLinks, 'Video', lesson.videoLink);
  for (const extra of splitItems(lesson.additionalLinks)) pushLink(doc.resourceLinks, extra, extra);

  const toolkitLabels = template.toolkitLabels.map((l) => l.toLowerCase());
  const append = (cur: string, next: string) => (cur ? `${cur}<br>${next}` : next);

  const sections: AnyLesson[] = Array.isArray(lesson.sections) ? lesson.sections : [];
  const activities: AnyLesson[] = sections.length
    ? []
    : Array.isArray(lesson.orderedActivities) && lesson.orderedActivities.length
      ? lesson.orderedActivities
      : (lesson.categoryOrder || []).flatMap((c: string) => lesson.grouped?.[c] || []);

  const addStep = (title: string, minutes: unknown, bodyHtml: string, act?: AnyLesson, cue?: string) => {
    const links = activityLinks(act);
    links.forEach((l) => pushLink(doc.sourceLinks, l.label, l.url));
    const m = Number(minutes);
    doc.steps.push({
      title: title || 'Activity',
      minutes: Number.isFinite(m) && m > 0 ? m : undefined,
      bodyHtml,
      cue: cue || (act?.teacherCue ? String(act.teacherCue) : undefined),
      links,
    });
  };

  for (const s of sections) {
    const title = String(s.title || '').trim();
    const body = String(s.bodyHtml || '');
    if (s.kind === 'activity' || s.activity) {
      addStep(title || s.activity?.activity, s.durationMins ?? s.activity?.time, body || String(s.activity?.description || ''), s.activity);
      continue;
    }
    if (s.kind === 'vocabulary') { doc.vocabularyHtml = append(doc.vocabularyHtml, body); continue; }
    if (s.kind === 'afl') { doc.assessment.push(...splitItems(body)); continue; }
    if (s.kind === 'differentiation') { doc.support = append(doc.support, body); continue; }
    const tk = toolkitLabels.indexOf(title.toLowerCase());
    if (tk >= 0 || /^toolkit\s*:/i.test(title) || (template.stage === 'primary' && / = /.test(title))) {
      doc.toolkit.push({ label: (tk >= 0 ? template.toolkitLabels[tk] : title.replace(/^toolkit\s*:\s*/i, '')).toUpperCase(), bodyHtml: body });
      continue;
    }
    const route = ROUTE.find(([re]) => re.test(title))?.[1];
    if (route === 'keyQuestions') doc.keyQuestions.push(...splitItems(body));
    else if (route === 'assessment') doc.assessment.push(...splitItems(body));
    else if (route === 'iCan') doc.iCan.push(...splitItems(body));
    else if (route === 'support') doc.support = append(doc.support, body);
    else if (route === 'challenge') doc.challenge = append(doc.challenge, body);
    else if (route === 'safety') doc.safety = append(doc.safety, body);
    else if (route === 'sourceHtml') doc.sourceHtml = append(doc.sourceHtml, body);
    else if (route === 'vocabularyHtml') doc.vocabularyHtml = append(doc.vocabularyHtml, body);
    else if (route === 'resourcesHtml') doc.resourcesHtml = append(doc.resourcesHtml, body);
    else if (s.kind === 'homework') addStep(title || 'Homework / next steps', s.durationMins, body);
    else addStep(title, s.durationMins, body);
  }
  for (const a of activities) addStep(String(a.activity || ''), a.time, String(a.description || ''), a);

  if (!sections.length && !activities.length) {
    if (lesson.introduction && lesson.introduction !== doc.intentHtml) addStep('Introduction', undefined, String(lesson.introduction));
    if (lesson.mainActivity) addStep('Main activity', undefined, String(lesson.mainActivity));
    if (lesson.plenary) addStep('Plenary', undefined, String(lesson.plenary));
  }

  const origin = opts.lessonNumber ? `CCDesigner lesson ${opts.lessonNumber}` : 'CCDesigner';
  if (!doc.sourceHtml) doc.sourceHtml = `Prepared in ${origin}. Activity sources and links are listed below; retain provider credit when sharing.`;
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

export interface RenderOptions {
  /** Sanitiser for teacher-authored rich HTML (DOMPurify in the app). Defaults to escaping. */
  sanitizeHtml?: (html: string) => string;
  /** Trusted logo markup for the top-left slot (planLogoHtml in the app). Falls back to a text wordmark. */
  logoHtml?: string;
}

/** Scoped CSS for the document. All text ≥ 13px. */
export function rhythmstixCss(t: RhythmstixTemplate, subject = 'MUSIC'): string {
  const cssText = (v: string) => v.replace(/["\\<>{}]/g, '').toUpperCase();
  const base = RHYTHMSTIX_TEMPLATES.find((b) => b.id === t.id) || RHYTHMSTIX_TEMPLATES[0];
  t = { ...t, accent: safeHexColour(t.accent, base.accent), tint: safeHexColour(t.tint, base.tint) };
  return `
.rx-doc{--rx-accent:${t.accent};--rx-tint:${t.tint};--rx-teal:#1F7A70;--rx-gold:#C9A227;
  font-family:Aptos,"Segoe UI",Calibri,Arial,sans-serif;color:#111;background:#fff;font-size:14px;line-height:1.45;width:100%;max-width:none;box-sizing:border-box}
.rx-doc *{box-sizing:border-box}
.rx-doc a{color:var(--rx-teal);font-weight:700}
.rx-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:2px solid var(--rx-gold);padding-bottom:10px;margin-bottom:14px}
.rx-logo-slot{min-height:40px;min-width:160px;display:flex;align-items:center}
.rx-wordmark{font-weight:800;letter-spacing:.35em;font-size:16px;color:#111}
.rx-phase{font-size:13px;font-weight:700;color:var(--rx-accent);text-transform:uppercase;text-align:right}
.rx-kicker{font-size:13px;font-weight:800;letter-spacing:.04em;color:var(--rx-accent);text-transform:uppercase;margin:0 0 2px}
.rx-title{font-size:30px;font-weight:800;line-height:1.15;margin:0}
.rx-strap{font-size:19px;font-weight:700;color:var(--rx-teal);margin:2px 0 4px}
.rx-meta{font-size:13px;font-weight:700;color:var(--rx-teal);text-transform:uppercase;margin:0 0 10px}
.rx-box{border:1px solid var(--rx-accent);border-radius:4px;padding:8px 12px;margin:10px 0}
.rx-box.tint{background:var(--rx-tint)}
.rx-label{font-size:13px;font-weight:800;color:var(--rx-accent);text-transform:uppercase;margin:0 0 4px}
.rx-ican{margin:14px 0;border:1px solid var(--rx-accent);border-radius:4px;overflow:hidden;break-inside:avoid}
.rx-ican-h{background:#1d1d1f;color:#fff;font-weight:800;font-size:14px;padding:5px 10px}
.rx-ican-grid{display:grid;grid-template-columns:1fr 1fr}
.rx-ican-grid div{padding:7px 10px;background:var(--rx-tint);color:var(--rx-teal);font-weight:700;border-top:1px solid var(--rx-accent)}
.rx-ican-grid div:nth-child(odd){border-right:1px solid var(--rx-accent)}
.rx-two{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #c9c9c9;margin:10px 0;break-inside:avoid}
.rx-two>div{padding:8px 12px}
.rx-two>div+div{border-left:1px solid #c9c9c9}
.rx-cell-a{background:#EEF6F4}.rx-cell-b{background:#FAF6EA}
.rx-h2{font-size:22px;font-weight:800;margin:18px 0 0}
.rx-sub{font-size:14px;color:var(--rx-teal);margin:0 0 8px}
.rx-step{border-bottom:1px solid #ddd;padding:8px 0 10px;break-inside:avoid}
.rx-step-h{display:flex;justify-content:space-between;gap:12px;font-weight:800;font-size:17px}
.rx-step-t{font-size:13px;font-weight:700;color:var(--rx-accent);white-space:nowrap}
.rx-cue{font-size:13px;font-weight:700;color:var(--rx-gold);margin-top:4px}
.rx-links{font-size:13px;margin-top:4px}
.rx-ref{break-before:page;page-break-before:always;padding-top:4px}
.rx-grid2{display:grid;grid-template-columns:1fr 1fr;border:1px solid #c9c9c9;margin:10px 0}
.rx-grid2>div{padding:8px 12px;border-bottom:1px solid #c9c9c9;break-inside:avoid}
.rx-grid2>div:nth-child(odd){border-right:1px solid #c9c9c9;background:#EEF6F4}
.rx-grid2>div:nth-child(even){background:#FAF6EA}
.rx-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;border:1px solid #c9c9c9;margin:10px 0;break-inside:avoid}
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
    @bottom-left{content:"© Rhythmstix 2026";font-size:13px;color:#555}
    @bottom-center{content:"www.rhythmstix.co.uk";font-size:13px;color:#1F7A70}
    @bottom-right{content:"Page " counter(page);font-size:13px;color:#555}}
  @page:first{@top-right{content:none}}
  .rx-foot{display:none}
}`;
}

export function renderRhythmstixHtml(doc: RhythmstixDoc, opts: RenderOptions = {}): string {
  const t = doc.template;
  const rich = (h: string) =>
    opts.sanitizeHtml ? opts.sanitizeHtml(h.includes('<') ? h : h.replace(/\n/g, '<br>')) : escapeText(stripTags(h)).replace(/\n/g, '<br>');
  const link = (l: RxLink) => `<a href="${escapeText(l.url)}" target="_blank" rel="noopener noreferrer">${escapeText(l.label)} ↗</a>`;
  const li = (items: string[]) => `<ul class="rx-list">${items.map((i) => `<li>${escapeText(i)}</li>`).join('')}</ul>`;
  const checks = (items: string[]) => `<ul class="rx-checks">${items.map((i) => `<li>${escapeText(i)}</li>`).join('')}</ul>`;
  const subjectUpper = escapeText(doc.subject.toUpperCase());

  const parts: string[] = [];
  parts.push(`<style>${rhythmstixCss(t, doc.subject)}</style>`);
  parts.push(`<div class="rx-doc" data-rx-template="${t.id}">`);
  parts.push(
    `<header class="rx-head"><div class="rx-logo-slot" data-logo-slot="top-left">${opts.logoHtml || '<span class="rx-wordmark">CCDesigner</span>'}</div>` +
      `<div class="rx-phase">${escapeText(t.headerPhase)} ${subjectUpper} &nbsp;|&nbsp; TEACHING RESOURCE</div></header>`,
  );
  parts.push(`<p class="rx-kicker">Lesson plan</p><h1 class="rx-title">${escapeText(doc.title)}</h1>`);
  parts.push(`<p class="rx-strap">${escapeText(doc.strap)}</p><p class="rx-meta">${doc.meta.map(escapeText).join(' &nbsp;•&nbsp; ')}</p>`);
  if (doc.intentHtml.trim()) parts.push(`<div class="rx-box tint"><p class="rx-label">Lesson intent</p>${rich(doc.intentHtml)}</div>`);

  if (doc.iCan.length) {
    parts.push(`<section class="rx-ican"><div class="rx-ican-h">I CAN…</div><div class="rx-ican-grid">${doc.iCan
      .map((i) => `<div>✓ ${escapeText(i)}</div>`)
      .join('')}${doc.iCan.length % 2 ? '<div></div>' : ''}</div></section>`);
  }

  if (doc.vocabularyHtml.trim() || doc.resourcesHtml.trim() || doc.resourceLinks.length) {
    parts.push(
      `<div class="rx-two"><div class="rx-cell-a"><p class="rx-label">Key vocabulary</p>${doc.vocabularyHtml.trim() ? rich(doc.vocabularyHtml) : ''}</div>` +
        `<div class="rx-cell-b"><p class="rx-label">Resources</p>${doc.resourcesHtml.trim() ? rich(doc.resourcesHtml) : ''}${
          doc.resourceLinks.length ? `<div class="rx-links">${doc.resourceLinks.map(link).join('<br>')}</div>` : ''
        }</div></div>`,
    );
  }

  parts.push(`<h2 class="rx-h2">Lesson sequence</h2><p class="rx-sub">${escapeText(t.sequenceSubtitle)}</p>`);
  if (!doc.steps.length) parts.push(`<p class="rx-empty">No activities in this lesson yet.</p>`);
  doc.steps.forEach((s, i) => {
    parts.push(
      `<div class="rx-step"><div class="rx-step-h"><span>${i + 1}.&nbsp; ${escapeText(s.title)}</span>${
        s.minutes ? `<span class="rx-step-t">${s.minutes} min</span>` : ''
      }</div>${s.bodyHtml.trim() ? `<div>${rich(s.bodyHtml)}</div>` : ''}${
        s.cue ? `<div class="rx-cue">Teacher cue: ${escapeText(s.cue)}</div>` : ''
      }${s.links.length ? `<div class="rx-links">${s.links.map(link).join(' &nbsp; ')}</div>` : ''}</div>`,
    );
  });

  // Reference page
  parts.push(`<section class="rx-ref"><p class="rx-kicker">Reference page</p>`);
  parts.push(`<h2 class="rx-h2">${escapeText(t.referenceHeading)}</h2><p class="rx-sub">${escapeText(t.referenceSubtitle)}</p>`);
  parts.push(
    `<div class="rx-two"><div class="rx-cell-b"><p class="rx-label">Key questions</p>${doc.keyQuestions.length ? li(doc.keyQuestions) : ''}</div>` +
      `<div class="rx-cell-a"><p class="rx-label">${escapeText(t.assessmentLabel)}</p>${doc.assessment.length ? checks(doc.assessment) : ''}</div></div>`,
  );

  const toolkitCards: RxCard[] =
    t.stage === 'secondary'
      ? [
          ...t.toolkitLabels.map((label) => doc.toolkit.find((c) => c.label === label) || { label, bodyHtml: '' }),
          ...doc.toolkit.filter((c) => !t.toolkitLabels.includes(c.label)),
        ]
      : doc.toolkit;
  if (toolkitCards.length) {
    parts.push(`<h2 class="rx-h2">${escapeText(t.toolkitHeading)}</h2>${t.toolkitSubtitle ? `<p class="rx-sub">${escapeText(t.toolkitSubtitle)}</p>` : ''}`);
    parts.push(`<div class="rx-grid2">${toolkitCards.map((c) => `<div><p class="rx-label">${escapeText(c.label)}</p>${c.bodyHtml.trim() ? rich(c.bodyHtml) : ''}</div>`).join('')}</div>`);
  }

  parts.push(`<h2 class="rx-h2">Support, challenge and safety</h2>`);
  parts.push(
    `<div class="rx-grid3"><div><p class="rx-label">Support</p>${doc.support.trim() ? rich(doc.support) : ''}</div>` +
      `<div><p class="rx-label">Challenge</p>${doc.challenge.trim() ? rich(doc.challenge) : ''}</div>` +
      `<div><p class="rx-label">Safety</p>${doc.safety.trim() ? rich(doc.safety) : ''}</div></div>`,
  );
  parts.push(
    `<div class="rx-source"><p class="rx-label" style="color:var(--rx-teal)">${escapeText(t.sourceLabel)}</p>${rich(doc.sourceHtml)}${
      doc.sourceLinks.length ? `<div class="rx-links">${doc.sourceLinks.map(link).join('<br>')}</div>` : ''
    }</div>`,
  );
  parts.push(`</section>`);
  parts.push(`<footer class="rx-foot"><span>© Rhythmstix 2026</span><span>www.rhythmstix.co.uk</span><span></span></footer>`);
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
