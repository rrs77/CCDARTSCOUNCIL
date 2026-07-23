/**
 * Prototype / demo seeding from a snapshot of the owner's real account.
 *
 * `demoSnapshot.json` is a build-time copy (see scripts/fetch-demo-snapshot.mjs)
 * of every content table in the live account — activities, lessons, plans,
 * stacks, year groups, categories, objectives, half terms. At demo activation
 * we copy it into:
 *   1. `demo-db-<table>` localStorage tables served by the mock Supabase
 *      client (utils/demoDb.ts) — no request ever reaches the live database.
 *   2. The legacy localStorage keys DataContext reads directly in demo mode
 *      (library-activities, lesson-data-<sheet>, half-terms-…, planner plans).
 *
 * Seeding is idempotent per browser session (guarded by DEMO_SEED_MARKER_KEY)
 * and re-runs from the pristine snapshot on every new session, so visitor
 * edits are temporary and never duplicated.
 *
 * It also appends generated Secondary / KS4 Music & Drama example content
 * (Four Chords, Blood Brothers AQA, OCR Film & Computer Music) with
 * pre-attached curriculum objectives, and populates the planner.
 */

import { DEMO_SEED_MARKER_KEY, clearDemoLocalStorage } from './demoMode';
import { writeDemoTable } from './demoDb';
import {
  buildDemoYearGroupSections,
  demoteSecondarySectionsToOther,
  mergeSectionsWithYearGroups,
  remapYearGroupSectionsToGroups,
  sectionsHaveResolvableGroups,
  type YearGroupLike,
  type YearGroupSectionLike,
} from './yearGroupSectionOrder';
import {
  ALL_GENERATED_SHEETS,
  EYFS_DEMO_SHEETS,
  EYFS_ELG_TEXTS,
  EYFS_MUSIC_DRAMA_OBJECTIVE_IDS,
  YEAR6_MUSIC_OBJECTIVE_IDS,
  flattenDemoObjectiveRows,
  type DemoGenSheet,
} from './demoPrototypeCurriculum';
import { setupKS3FourChords } from './setupKS3FourChords';
import { setupOCRFilmComputerMusic } from './setupOCRFilmComputerMusic';
import { setupWTDBloodBrothers } from './setupWTDBloodBrothers';
import { setupLSOYear6Example } from './setupLSOYear6';
import { setupROHRomeoJuliet } from './setupROHRomeoJuliet';

type Row = Record<string, any>;

const YEAR_GROUP_SECTIONS_STORAGE_KEY = 'year-group-sections';
const YEAR_GROUP_SECTIONS_AUTO_MIGRATION_KEY = 'year-group-sections-auto-migrated-v3';

/** Snapshot of the logged-in account's year groups / sections before demo wipe. */
function captureLiveYearGroupConfig(): {
  yearGroups: YearGroupLike[];
  sections: YearGroupSectionLike[] | null;
} {
  let yearGroups: YearGroupLike[] = [];
  let sections: YearGroupSectionLike[] | null = null;
  const pushGroup = (g: any) => {
    if (!g || typeof g.name !== 'string' || !g.name.trim()) return;
    const id = String(g.id || g.name);
    if (yearGroups.some((y) => y.name === g.name || y.id === id)) return;
    yearGroups.push({
      id,
      name: String(g.name),
      color: typeof g.color === 'string' ? g.color : undefined,
    });
  };
  try {
    const rawGroups = localStorage.getItem('custom-year-groups');
    if (rawGroups) {
      const parsed = JSON.parse(rawGroups);
      if (Array.isArray(parsed)) parsed.forEach(pushGroup);
    }
  } catch {
    /* ignore */
  }
  // Bands are the Settings UI source of truth when flat custom-year-groups is stale.
  try {
    const rawBands = localStorage.getItem('year-group-bands');
    if (rawBands) {
      const parsed = JSON.parse(rawBands);
      if (Array.isArray(parsed)) {
        for (const band of parsed) {
          pushGroup(band);
          if (Array.isArray(band?.classes)) band.classes.forEach(pushGroup);
        }
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const rawSections = localStorage.getItem(YEAR_GROUP_SECTIONS_STORAGE_KEY);
    if (rawSections) {
      const parsed = JSON.parse(rawSections);
      if (Array.isArray(parsed) && parsed.length > 0) {
        sections = parsed as YearGroupSectionLike[];
      }
    }
  } catch {
    /* ignore */
  }
  return { yearGroups, sections };
}

function extractSnapshotSections(tables: Record<string, Row[]>): YearGroupSectionLike[] | null {
  const branding = tables.branding_settings || [];
  const row = branding.find((r) => r.key === 'year_group_sections');
  const sections = (row?.data as { sections?: YearGroupSectionLike[] } | undefined)?.sections;
  return Array.isArray(sections) && sections.length > 0 ? sections : null;
}

/**
 * Prefer the user's Manage Year Groups sections (captured from login localStorage
 * before the demo wipe), then snapshot branding_settings.year_group_sections,
 * then a curated EYFS/KS1/KS2 demo subset (KS3+ stay in Other / Header-hidden).
 * Always remaps tokens onto the seeded year-group ids (sheet names in demo).
 * Re-run `pnpm exec node scripts/fetch-demo-snapshot.mjs` after changing live
 * section nesting if cold-start Preview should pick up account headings.
 */
function resolveDemoYearGroupSections(
  targetGroups: YearGroupLike[],
  captured: { yearGroups: YearGroupLike[]; sections: YearGroupSectionLike[] | null },
  snapshotSections: YearGroupSectionLike[] | null,
): YearGroupSectionLike[] {
  const targetIds = targetGroups.map((g) => g.id);
  const prefer =
    captured.sections &&
    captured.sections.length > 0 &&
    (sectionsHaveResolvableGroups(captured.sections, targetGroups) ||
      sectionsHaveResolvableGroups(captured.sections, captured.yearGroups))
      ? captured.sections
      : snapshotSections && snapshotSections.length > 0
        ? snapshotSections
        : null;

  if (prefer) {
    const remapped = remapYearGroupSectionsToGroups(
      prefer,
      targetGroups,
      captured.yearGroups.length > 0 ? captured.yearGroups : undefined,
    );
    // Keep user labels/order; park any demo-only sheets (e.g. generated KS3) in Other.
    // Also demote KS3+ out of key stages so Header only shows explicitly primary-allocated
    // classes when the snapshot used full name-based auto-bucketing.
    const merged = mergeSectionsWithYearGroups(remapped, targetIds, targetGroups);
    return demoteSecondarySectionsToOther(merged, targetGroups);
  }

  return buildDemoYearGroupSections(targetGroups);
}

const CURRENT_ACADEMIC_YEAR = '2026-2027';
const SNAPSHOT_ACADEMIC_YEARS = ['2025-2026', '2026-2027'];

/** Lesson sheets in the snapshot that are junk/test rows we don't surface. */
const SKIP_SHEETS = new Set(['0', '1', '2', '3', 'DEMO', 'Reception Music', 'Year 2 Music']);

// ---------- snapshot transforms ----------

function mediaUrl(link: string | null | undefined): string {
  if (!link) return '';
  if (link.startsWith('__DEMO_MEDIA__/')) {
    return `${import.meta.env.BASE_URL}demo-media/${link.slice('__DEMO_MEDIA__/'.length)}`;
  }
  return link;
}

/** snake_case DB activity row -> camelCase Activity used by the frontend. */
function toCamelActivity(item: Row): Row {
  return {
    _id: item.id,
    activity: item.activity,
    description: item.description || '',
    activityText: item.activity_text || '',
    descriptionHeading: item.description_heading || 'Introduction/Context',
    activityHeading: item.activity_heading || 'Activity',
    linkHeading: item.link_heading || 'Additional Link',
    time: item.time ?? 0,
    videoLink: item.video_link || '',
    musicLink: item.music_link || '',
    backingLink: item.backing_link || '',
    resourceLink: item.resource_link || '',
    link: item.link || '',
    vocalsLink: item.vocals_link || '',
    imageLink: mediaUrl(item.image_link),
    canvaLink: item.canva_link || '',
    teachingUnit: item.teaching_unit || '',
    category: item.category || '',
    level: item.level || '',
    unitName: item.unit_name || '',
    lessonNumber: item.lesson_number || '',
    eyfsStandards: item.eyfs_standards || [],
    yearGroups: item.yeargroups || item.year_groups || [],
  };
}

const HALF_TERM_DEFS = [
  { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct' },
  { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec' },
  { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb' },
  { id: 'SP2', name: 'Spring 2', months: 'Feb-Mar' },
  { id: 'SM1', name: 'Summer 1', months: 'Apr-May' },
  { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul' },
];

// ---------- generated Secondary / KS4 supplement ----------

const KS3_KS4_SHEETS: DemoGenSheet[] = ALL_GENERATED_SHEETS;

function buildGeneratedSheetData(sheet: DemoGenSheet) {
  const allLessonsData: Row = {};
  const activities: Row[] = [];
  const teachingUnits = new Set<string>();
  const lessonStandardsMap: Record<string, string[]> = {};

  for (const lesson of sheet.lessons) {
    teachingUnits.add(lesson.unit);
    const orderedActivities = lesson.activities.map((a, i) => {
      const row = {
        _id: `demo-gen-${sheet.sheet}-${lesson.number}-${i}`.replace(/\s+/g, '-').toLowerCase(),
        activity: a.activity,
        description: a.description,
        activityText: '',
        descriptionHeading: 'Introduction/Context',
        activityHeading: 'Activity',
        linkHeading: 'Additional Link',
        time: a.time,
        videoLink: '',
        musicLink: '',
        backingLink: '',
        resourceLink: a.resourceLink || '',
        link: a.link || '',
        vocalsLink: '',
        imageLink: '',
        canvaLink: '',
        teachingUnit: a.unitName,
        category: a.category,
        level: a.level,
        unitName: a.unitName,
        lessonNumber: lesson.number,
        eyfsStandards: lesson.curriculumType === 'EYFS' ? lesson.lessonStandards || [] : [],
        customObjectives: lesson.customObjectives || [],
        curriculumType: lesson.curriculumType || 'CUSTOM',
        yearGroups: [sheet.sheet],
      };
      activities.push(row);
      return row;
    });

    const grouped: Row = {};
    const categoryOrder: string[] = [];
    for (const a of orderedActivities) {
      if (!grouped[a.category]) {
        grouped[a.category] = [];
        categoryOrder.push(a.category);
      }
      grouped[a.category].push(a);
    }

    if (lesson.lessonStandards?.length) {
      lessonStandardsMap[lesson.number] = [...lesson.lessonStandards];
    }

    allLessonsData[lesson.number] = {
      grouped,
      categoryOrder,
      totalTime: lesson.activities.reduce((sum, a) => sum + a.time, 0),
      title: lesson.title,
      lessonName: lesson.unit,
      academicYear: CURRENT_ACADEMIC_YEAR,
      orderedActivities,
      isUserCreated: false,
      customObjectives: lesson.customObjectives || [],
      curriculumType: lesson.curriculumType || 'CUSTOM',
      lessonStandards: lesson.lessonStandards || [],
    };
  }

  return {
    allLessonsData,
    activities,
    teachingUnits: [...teachingUnits],
    lessonStandards: lessonStandardsMap,
  };
}

/** Pre-attach EYFS ELGs (or Year 6 music objectives) to snapshot lessons by phase. */
function attachPhaseStandardsToSnapshotLesson(
  sheetName: string,
  allLessonsData: Row,
  lessonStandardsMap: Record<string, string[]>,
): void {
  const isEyfs = EYFS_DEMO_SHEETS.has(sheetName);
  const isYear6Music = sheetName === 'Year 6 Music';
  if (!isEyfs && !isYear6Music) return;

  for (const [num, lesson] of Object.entries(allLessonsData)) {
    if (!lesson || typeof lesson !== 'object') continue;
    if (['teachingUnits', 'lessonStandards'].includes(num)) continue;

    if (isEyfs) {
      // Store ELG texts in lessonStandards (legacy EYFS path) AND custom objective
      // IDs so ObjectiveSelector / print views resolve against the EYFS bank.
      lesson.curriculumType = 'CUSTOM';
      lesson.customObjectives = [...EYFS_MUSIC_DRAMA_OBJECTIVE_IDS];
      lesson.lessonStandards = [...EYFS_ELG_TEXTS];
      lessonStandardsMap[num] = [...EYFS_ELG_TEXTS];
    } else if (isYear6Music) {
      lesson.curriculumType = 'CUSTOM';
      lesson.customObjectives = [...YEAR6_MUSIC_OBJECTIVE_IDS];
    }
  }
}

function nextWeekday(base: Date, offsetDays: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + offsetDays);
  const day = d.getDay();
  if (day === 6) d.setDate(d.getDate() + 2); // Sat -> Mon
  if (day === 0) d.setDate(d.getDate() + 1); // Sun -> Mon
  return d;
}

function atTime(d: Date, hours: number, minutes: number): Date {
  const out = new Date(d);
  out.setHours(hours, minutes, 0, 0);
  return out;
}

/**
 * Populate the demo. Async because the ~1.3MB snapshot is code-split and
 * loaded on demand. Idempotent per session; each new session reseeds from
 * the pristine snapshot (restoring the original demonstration data).
 */
export async function seedDemoData(): Promise<void> {
  try {
    if (sessionStorage.getItem(DEMO_SEED_MARKER_KEY) === '1') return;

    // Capture the logged-in account's year-group / section config BEFORE wipe,
    // so Settings nesting (EYFS → classes, etc.) transfers into the prototype.
    const capturedYearGroupConfig = captureLiveYearGroupConfig();

    // Start pristine: remove any demo-owned keys left behind by a previous
    // session that ended without an explicit logout, so a new session never
    // sees stale visitor edits or orphaned per-sheet keys.
    clearDemoLocalStorage();

    const { default: snapshot } = await import('../data/demoSnapshot.json');
    const tables: Record<string, Row[]> = (snapshot as any).tables || {};

    // ---- 1. Activities (snapshot + generated Secondary/KS4 examples) ----
    const snapshotActivities = (tables.activities || []).map(toCamelActivity);
    const generatedPerSheet = KS3_KS4_SHEETS.map((s) => ({ sheet: s, data: buildGeneratedSheetData(s) }));
    const generatedActivities = generatedPerSheet.flatMap((g) => g.data.activities);
    const allActivities = [...snapshotActivities, ...generatedActivities];
    localStorage.setItem('library-activities', JSON.stringify(allActivities));

    // Mock-DB copy in snake_case so activitiesApi reads/writes work in demo.
    const dbActivities = [
      ...(tables.activities || []).map((r) => ({ ...r, image_link: mediaUrl(r.image_link) })),
      ...generatedActivities.map((a) => ({
        id: a._id,
        activity: a.activity,
        description: a.description,
        activity_text: a.activityText,
        time: a.time,
        category: a.category,
        level: a.level,
        unit_name: a.unitName,
        teaching_unit: a.teachingUnit,
        lesson_number: a.lessonNumber,
        link: a.link,
        resource_link: a.resourceLink || '',
        yeargroups: a.yearGroups,
      })),
    ];
    writeDemoTable('activities', dbActivities);

    // ---- 2. Lessons per sheet ----
    const sheetNames: { sheet: string; color?: string }[] = [];
    const dbLessons: Row[] = [];

    for (const row of tables.lessons || []) {
      if (SKIP_SHEETS.has(row.sheet_name)) continue;
      const raw = row.data || {};
      const allLessonsData: Row = structuredClone(raw.allLessonsData ?? raw);
      if (!allLessonsData || Object.keys(allLessonsData).length === 0) continue;

      const lessonStandardsMap: Record<string, string[]> = {
        ...(raw.lessonStandards || {}),
      };
      attachPhaseStandardsToSnapshotLesson(row.sheet_name, allLessonsData, lessonStandardsMap);

      const bundle = {
        allLessonsData,
        lessonNumbers: row.lesson_numbers || Object.keys(allLessonsData),
        teachingUnits: raw.teachingUnits || row.teaching_units || [],
        lessonStandards: lessonStandardsMap,
      };
      localStorage.setItem(`lesson-data-${row.sheet_name}`, JSON.stringify(bundle));
      sheetNames.push({ sheet: row.sheet_name });
      dbLessons.push({ ...row, data: { ...(typeof raw === 'object' ? raw : {}), allLessonsData, lessonStandards: lessonStandardsMap } });
    }

    for (const { sheet, data } of generatedPerSheet) {
      const bundle = {
        allLessonsData: data.allLessonsData,
        lessonNumbers: Object.keys(data.allLessonsData),
        teachingUnits: data.teachingUnits,
        lessonStandards: data.lessonStandards || {},
      };
      localStorage.setItem(`lesson-data-${sheet.sheet}`, JSON.stringify(bundle));
      sheetNames.push({ sheet: sheet.sheet, color: sheet.color });
      dbLessons.push({
        sheet_name: sheet.sheet,
        data: data.allLessonsData,
        lesson_numbers: Object.keys(data.allLessonsData),
        teaching_units: data.teachingUnits,
        academic_year: CURRENT_ACADEMIC_YEAR,
      });
    }
    writeDemoTable('lessons', dbLessons);

    // ---- 3. Half terms ----
    const validTermIds = new Set(HALF_TERM_DEFS.map((t) => t.id));
    const bySheet: Record<string, Record<string, string[]>> = {};
    for (const ht of tables.half_terms || []) {
      if (!validTermIds.has(ht.term_id)) continue;
      if (SKIP_SHEETS.has(ht.sheet_name)) continue;
      bySheet[ht.sheet_name] = bySheet[ht.sheet_name] || {};
      bySheet[ht.sheet_name][ht.term_id] = ht.lessons || [];
    }
    for (const { sheet: gen } of generatedPerSheet) {
      const map: Record<string, string[]> = {};
      for (const lesson of gen.lessons) {
        map[lesson.term] = [...(map[lesson.term] || []), lesson.number];
      }
      bySheet[gen.sheet] = map;
    }

    const now = new Date().toISOString();
    for (const { sheet } of sheetNames) {
      const lessonsByTerm = bySheet[sheet] || {};
      const halfTerms = HALF_TERM_DEFS.map((t) => ({
        id: t.id,
        name: t.name,
        months: t.months,
        lessons: lessonsByTerm[t.id] || [],
        stacks: [],
        isComplete: false,
        createdAt: now,
        updatedAt: now,
      }));
      for (const year of SNAPSHOT_ACADEMIC_YEARS) {
        localStorage.setItem(`half-terms-${sheet}-${year}`, JSON.stringify(halfTerms));
      }
    }
    writeDemoTable('half_terms', (tables.half_terms || []).filter((h) => validTermIds.has(h.term_id)));

    // ---- 4. Year groups / sheets selector ----
    const palette = ['#10B981', '#0EA5E9', '#8B5CF6', '#F59E0B', '#EF4444', '#14B8A6', '#6366F1', '#EC4899'];
    const snapshotNames = new Set((tables.year_groups || []).map((y) => y.name));
    // Use sheet name as the id so the class selector maps 1:1 onto seeded
    // lesson-data-<sheet> keys.
    const yearGroups: Row[] = [];
    let colorIdx = 0;
    for (const { sheet, color } of sheetNames) {
      const snapRow = (tables.year_groups || []).find((y) => y.name === sheet);
      yearGroups.push({
        id: sheet,
        name: sheet,
        color: color || snapRow?.color || palette[colorIdx++ % palette.length],
        sort_order: yearGroups.length,
      });
    }
    // Include remaining snapshot year groups (e.g. Assembly Songs, Warmups)
    // that have no lesson sheet yet, so library filters match the account.
    for (const y of tables.year_groups || []) {
      if (!yearGroups.some((g) => g.name === y.name)) {
        yearGroups.push({ id: y.name, name: y.name, color: y.color, sort_order: yearGroups.length });
      }
    }
    // Merge classes the user configured while logged in (not yet in the snapshot).
    for (const g of capturedYearGroupConfig.yearGroups) {
      if (!yearGroups.some((y) => y.name === g.name || y.id === g.id)) {
        yearGroups.push({
          id: g.name,
          name: g.name,
          color: g.color || palette[colorIdx++ % palette.length],
          sort_order: yearGroups.length,
        });
      }
    }
    void snapshotNames;

    const yearGroupsForSettings: YearGroupLike[] = yearGroups.map((g) => ({
      id: String(g.id),
      name: String(g.name),
      color: typeof g.color === 'string' ? g.color : undefined,
    }));
    const snapshotSections = extractSnapshotSections(tables);
    const demoSections = resolveDemoYearGroupSections(
      yearGroupsForSettings,
      capturedYearGroupConfig,
      snapshotSections,
    );

    writeDemoTable('year_groups', yearGroups);
    localStorage.setItem(
      'custom-year-groups',
      JSON.stringify(yearGroupsForSettings),
    );
    // Keep bands in sync so SettingsContext does not rebuild a flat list that
    // drifts from section nesting (and so hub seeds can append without wiping).
    try {
      const bands = yearGroupsForSettings.map((g) => ({
        id: g.id,
        name: g.name,
        color: g.color,
        classes: [{ id: g.id, name: g.name }],
      }));
      localStorage.setItem('year-group-bands', JSON.stringify(bands));
    } catch {
      /* quota / private mode */
    }
    // Persist section presets for Header + Settings (and the mock branding API).
    try {
      localStorage.setItem(YEAR_GROUP_SECTIONS_STORAGE_KEY, JSON.stringify(demoSections));
      localStorage.setItem(YEAR_GROUP_SECTIONS_AUTO_MIGRATION_KEY, 'true');
    } catch {
      /* quota / private mode */
    }

    // ---- 5. Categories, groups, objectives (served by the mock client) ----
    writeDemoTable('custom_categories', tables.custom_categories || []);
    writeDemoTable('category_groups', tables.category_groups || []);

    // Merge snapshot objective banks with demo KS3 Music / OCR / AQA banks.
    const extraObjectives = flattenDemoObjectiveRows();
    const snapYg = tables.custom_objective_year_groups || [];
    const snapAreas = tables.custom_objective_areas || [];
    const snapObjs = tables.custom_objectives || [];
    const ygIds = new Set(snapYg.map((y) => y.id));
    writeDemoTable('custom_objective_year_groups', [
      ...snapYg,
      ...extraObjectives.yearGroups.filter((y) => !ygIds.has(String(y.id))),
    ]);
    const areaIds = new Set(snapAreas.map((a) => a.id));
    writeDemoTable('custom_objective_areas', [
      ...snapAreas,
      ...extraObjectives.areas.filter((a) => !areaIds.has(String(a.id))),
    ]);
    const objIds = new Set(snapObjs.map((o) => o.id));
    writeDemoTable('custom_objectives', [
      ...snapObjs,
      ...extraObjectives.objectives.filter((o) => !objIds.has(String(o.id))),
    ]);
    writeDemoTable('activity_custom_objectives', tables.activity_custom_objectives || []);
    writeDemoTable('eyfs_statements', tables.eyfs_statements || []);
    // Keep any other branding_settings rows from the snapshot, but always
    // ensure year_group_sections is present so SettingsContext remote load
    // does not rebuild defaults and wipe the transferred nesting.
    const brandingRows = [...(tables.branding_settings || [])].filter(
      (r) => r.key !== 'year_group_sections',
    );
    brandingRows.push({
      key: 'year_group_sections',
      data: { sections: demoSections },
      updated_at: new Date().toISOString(),
    });
    writeDemoTable('branding_settings', brandingRows);
    writeDemoTable('timetable_classes', []);
    writeDemoTable('profiles', []);

    // Categories also live in localStorage for the settings UI fallback.
    const savedCategories = (tables.custom_categories || []).map((cat, i) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color || '#6B7280',
      position: cat.position ?? i,
      yearGroups: cat.year_groups || cat.yearGroups || {},
      groups: cat.groups || [],
      group: cat.group ?? null,
    }));
    localStorage.setItem('saved-categories', JSON.stringify(savedCategories));

    // ---- 6. Stacks ----
    writeDemoTable('lesson_stacks', tables.lesson_stacks || []);
    writeDemoTable('activity_stacks', tables.activity_stacks || []);
    const activityStacks = (tables.activity_stacks || []).map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description || '',
      color: s.color || '#3B82F6',
      activities: s.activities || [],
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));
    localStorage.setItem('activity-stacks', JSON.stringify(activityStacks));

    // ---- 7. Planner: snapshot plans + featured prototype schedule ----
    const plans: Row[] = [];
    for (const p of tables.lesson_plans || []) {
      plans.push({
        id: p.id,
        date: p.date,
        week: p.week ?? 1,
        className: p.class_name || 'LKG',
        activities: p.activities || [],
        duration: p.duration ?? 60,
        notes: p.notes || '',
        status: p.status || 'planned',
        unitId: p.unit_id || '',
        unitName: p.unit_name || '',
        lessonNumber: p.lesson_number || '',
        title: p.title || '',
        term: p.term || '',
        time: p.time || '09:00',
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      });
    }

    // Curated prototype packs + partner units — first-class demo seed (same as
    // LSO/ROH): always present after activate, starred, share setup* with hubs.
    // Isolation from production Supabase is via demo mode, not “ephemeral packs”.
    await Promise.all([
      setupLSOYear6Example({ force: true, registerPartnerPlanning: true }),
      setupROHRomeoJuliet({ force: true, registerPartnerPlanning: true }),
      setupKS3FourChords({ force: true }),
      // WTD / iCompose paid packs are hub-Add only — not auto-seeded on demo activate.
      setupOCRFilmComputerMusic({ force: true }),
    ]);

    const readLessonKeys = (storageKey: string): string[] => {
      try {
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        return [];
      }
    };
    const fourChordLessons = readLessonKeys('ccd-ks3-4chords-lesson-keys');
    const ocrFilmLessons = readLessonKeys('ccd-ocr-film-comp-lesson-keys');

    // Featured prototype examples + representative mix across key stages.
    const monday = new Date();
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); // this week's Monday
    const scheduleSpec: { dayOffset: number; hour: number; minute: number; sheet: string; lessonNumber: string }[] = [
      // Featured prototypes (high visibility) — KS3 4 Chords, OCR Film/Computer
      { dayOffset: 0, hour: 11, minute: 0, sheet: 'Year 8 Music', lessonNumber: fourChordLessons[0] || '1' },
      { dayOffset: 1, hour: 11, minute: 0, sheet: 'Year 10 Music (OCR)', lessonNumber: ocrFilmLessons[0] || '1' },
      { dayOffset: 2, hour: 11, minute: 0, sheet: 'Year 8 Music', lessonNumber: fourChordLessons[1] || '2' },
      { dayOffset: 4, hour: 11, minute: 0, sheet: 'Year 10 Music (OCR)', lessonNumber: ocrFilmLessons[1] || '2' },
      { dayOffset: 8, hour: 11, minute: 0, sheet: 'Year 8 Music', lessonNumber: fourChordLessons[2] || '3' },
      { dayOffset: 9, hour: 14, minute: 0, sheet: 'Year 10 Music (OCR)', lessonNumber: ocrFilmLessons[2] || '3' },
      // EYFS / primary (ELG / Y6 objectives pre-attached — not secondary banks)
      { dayOffset: 0, hour: 9, minute: 0, sheet: 'LKG', lessonNumber: '3' },
      { dayOffset: 1, hour: 9, minute: 30, sheet: 'Reception Drama', lessonNumber: 'lesson1' },
      { dayOffset: 1, hour: 14, minute: 0, sheet: 'Year 6 Music', lessonNumber: '1' },
      { dayOffset: 2, hour: 9, minute: 0, sheet: 'Lower Kindergarten Music', lessonNumber: '3' },
      { dayOffset: 3, hour: 9, minute: 45, sheet: 'UKG', lessonNumber: '1' },
      { dayOffset: 9, hour: 9, minute: 30, sheet: 'Reception', lessonNumber: '1' },
      // Supporting KS3/KS4
      { dayOffset: 2, hour: 13, minute: 0, sheet: 'Year 9 Drama', lessonNumber: '1' },
      { dayOffset: 4, hour: 13, minute: 30, sheet: 'Year 9 Music', lessonNumber: '1' },
      { dayOffset: 7, hour: 11, minute: 0, sheet: 'Lower Kindergarten Music', lessonNumber: '4' },
      { dayOffset: 8, hour: 10, minute: 0, sheet: 'Year 11 Music (GCSE)', lessonNumber: '1' },
      { dayOffset: 8, hour: 13, minute: 30, sheet: 'Year 9 Drama', lessonNumber: '2' },
    ];

    const lessonBundleCache: Record<string, Row | null> = {};
    const getLesson = (sheet: string, num: string): Row | null => {
      if (!(sheet in lessonBundleCache)) {
        try {
          const raw = localStorage.getItem(`lesson-data-${sheet}`);
          lessonBundleCache[sheet] = raw ? JSON.parse(raw) : null;
        } catch {
          lessonBundleCache[sheet] = null;
        }
      }
      const bundle = lessonBundleCache[sheet];
      const lesson = bundle?.allLessonsData?.[num];
      if (lesson) return lesson;
      // fall back to the first available lesson on the sheet
      const first = bundle?.allLessonsData ? Object.entries(bundle.allLessonsData)[0] : null;
      return first ? (first[1] as Row) : null;
    };

    let seq = 0;
    for (const spec of scheduleSpec) {
      const lesson = getLesson(spec.sheet, spec.lessonNumber);
      if (!lesson) continue;
      const date = atTime(nextWeekday(monday, spec.dayOffset), spec.hour, spec.minute);
      plans.push({
        id: `demo-plan-${seq++}`,
        date: date.toISOString(),
        week: spec.dayOffset < 7 ? 1 : 2,
        className: spec.sheet,
        activities: lesson.orderedActivities || [],
        duration: Math.max(30, Number(lesson.totalTime) || 45),
        notes: '',
        status: 'planned',
        unitId: '',
        unitName: lesson.lessonName || '',
        lessonNumber: spec.lessonNumber,
        title: lesson.title || `Lesson ${spec.lessonNumber}`,
        term: '',
        time: `${String(spec.hour).padStart(2, '0')}:${String(spec.minute).padStart(2, '0')}`,
        createdAt: now,
        updatedAt: now,
      });
    }

    localStorage.setItem('user-created-lesson-plans', JSON.stringify(plans));
    writeDemoTable(
      'lesson_plans',
      plans.map((p) => ({
        id: p.id,
        date: p.date,
        week: p.week,
        class_name: p.className,
        activities: p.activities,
        duration: p.duration,
        notes: p.notes,
        status: p.status,
        unit_id: p.unitId,
        unit_name: p.unitName,
        lesson_number: p.lessonNumber,
        title: p.title,
        term: p.term,
        time: p.time,
        created_at: p.createdAt,
        updated_at: p.updatedAt,
      })),
    );

    // ---- 8. Current sheet ----
    localStorage.setItem(
      'currentSheetInfo',
      JSON.stringify({
        sheet: 'Lower Kindergarten Music',
        display: 'Lower Kindergarten Music',
        eyfs: 'Lower Kindergarten Music Statements',
      }),
    );

    sessionStorage.setItem(DEMO_SEED_MARKER_KEY, '1');
  } catch (err) {
    console.warn('Failed to seed demo data:', err);
  }
}
