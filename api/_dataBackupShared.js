/**
 * Super-admin curriculum backup / restore helpers.
 * Callers must already have passed requireSuperAdmin().
 *
 * Restore path: zod per-table allowlists → strip identity fields →
 * service.rpc('restore_curriculum_backup') (SECURITY DEFINER txn).
 */

import { z } from 'zod';

export const BACKUP_MAX_BODY_BYTES = 4 * 1024 * 1024;
export const BACKUP_JSON_CONTENT_LENGTH_LIMIT =
  Math.floor(BACKUP_MAX_BODY_BYTES * (4 / 3)) + 8192;
export const BACKUP_ROW_CAP = 10_000;

/** Identity / tenancy / timestamp fields stripped unless an explicit org restore. */
export const STRIP_ALWAYS = Object.freeze([
  'user_id',
  'owner_id',
  'created_by',
  'created_at',
  'updated_at',
  'anonymised_at',
]);

export const STRIP_UNLESS_ORG = Object.freeze([
  'id',
  'organisation_id',
  ...STRIP_ALWAYS,
]);

export const BACKUP_CORE_TABLES = Object.freeze([
  { key: 'yearGroups', table: 'year_groups' },
  { key: 'categoryGroups', table: 'category_groups' },
  { key: 'customCategories', table: 'custom_categories' },
  { key: 'activities', table: 'activities' },
  { key: 'lessons', table: 'lessons' },
  { key: 'standards', table: 'eyfs_statements' },
  { key: 'halfTerms', table: 'half_terms' },
  { key: 'lessonPlans', table: 'lesson_plans' },
  { key: 'lessonStacks', table: 'lesson_stacks' },
  { key: 'activityStacks', table: 'activity_stacks' },
]);

export const BACKUP_OPTIONAL_TABLES = Object.freeze([
  { key: 'customObjectiveYearGroups', table: 'custom_objective_year_groups' },
  { key: 'customObjectiveAreas', table: 'custom_objective_areas' },
  { key: 'customObjectives', table: 'custom_objectives' },
  { key: 'activityCustomObjectives', table: 'activity_custom_objectives' },
]);

const looseProps = z.record(z.string(), z.unknown());

const activityRowSchema = z
  .object({
    activity: z.string().min(1),
    category: z.string().min(1),
    description: z.string().optional().nullable(),
    activity_text: z.string().optional().nullable(),
    activityText: z.string().optional().nullable(),
    time: z.union([z.number(), z.string()]).optional().nullable(),
    video_link: z.string().optional().nullable(),
    videoLink: z.string().optional().nullable(),
    music_link: z.string().optional().nullable(),
    musicLink: z.string().optional().nullable(),
    backing_link: z.string().optional().nullable(),
    backingLink: z.string().optional().nullable(),
    resource_link: z.string().optional().nullable(),
    resourceLink: z.string().optional().nullable(),
    link: z.string().optional().nullable(),
    vocals_link: z.string().optional().nullable(),
    vocalsLink: z.string().optional().nullable(),
    image_link: z.string().optional().nullable(),
    imageLink: z.string().optional().nullable(),
    canva_link: z.string().optional().nullable(),
    canvaLink: z.string().optional().nullable(),
    teaching_unit: z.string().optional().nullable(),
    teachingUnit: z.string().optional().nullable(),
    level: z.string().optional().nullable(),
    unit_name: z.string().optional().nullable(),
    unitName: z.string().optional().nullable(),
    lesson_number: z.union([z.string(), z.number()]).optional().nullable(),
    lessonNumber: z.union([z.string(), z.number()]).optional().nullable(),
    eyfs_standards: z.array(z.string()).optional().nullable(),
    eyfsStandards: z.array(z.string()).optional().nullable(),
  })
  .passthrough();

const lessonRowSchema = z
  .object({
    sheet_name: z.string().min(1).optional(),
    sheetName: z.string().min(1).optional(),
    data: z.unknown().optional(),
    allLessonsData: z.unknown().optional(),
    lesson_numbers: z.unknown().optional(),
    lessonNumbers: z.unknown().optional(),
    teaching_units: z.unknown().optional(),
    teachingUnits: z.unknown().optional(),
  })
  .passthrough();

const namedIdRow = z
  .object({
    id: z.string().optional().nullable(),
    name: z.string().optional().nullable(),
    sort_order: z.union([z.number(), z.string()]).optional().nullable(),
    color: z.string().optional().nullable(),
  })
  .passthrough();

/** @type {Record<string, z.ZodTypeAny>} */
export const TABLE_ROW_SCHEMAS = Object.freeze({
  activities: activityRowSchema,
  lessons: lessonRowSchema,
  standards: looseProps,
  halfTerms: looseProps,
  lessonPlans: looseProps,
  customCategories: namedIdRow,
  categoryGroups: namedIdRow,
  yearGroups: namedIdRow,
  lessonStacks: looseProps,
  activityStacks: looseProps,
  customObjectiveYearGroups: looseProps,
  customObjectiveAreas: looseProps,
  customObjectives: looseProps,
  activityCustomObjectives: looseProps,
});

/**
 * @param {string | null | undefined} contentLengthHeader
 * @returns {{ status: 411 | 413, error: string } | null}
 */
export function backupContentLengthGate(
  contentLengthHeader,
  limit = BACKUP_JSON_CONTENT_LENGTH_LIMIT,
) {
  if (contentLengthHeader == null || String(contentLengthHeader).trim() === '') {
    return { status: 411, error: 'Content-Length header is required.' };
  }
  const cl = Number(contentLengthHeader);
  if (!Number.isFinite(cl) || cl < 0) {
    return { status: 411, error: 'Content-Length header is required.' };
  }
  if (cl > limit) {
    return {
      status: 413,
      error: `Backup body too large (max ${Math.floor(BACKUP_MAX_BODY_BYTES / (1024 * 1024))} MB).`,
    };
  }
  return null;
}

function stripRow(row, { targetOrg }) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
  const out = { ...row };
  delete out.uniqueId;
  delete out._uniqueId;
  for (const k of STRIP_ALWAYS) {
    delete out[k];
  }
  if (targetOrg) {
    out.organisation_id = targetOrg;
  } else {
    delete out.organisation_id;
    delete out.id;
  }
  return out;
}

function normalizeActivity(row) {
  const out = {
    activity: row.activity,
    category: row.category,
    description: row.description ?? null,
    activity_text: row.activity_text ?? row.activityText ?? null,
    time: row.time ?? null,
    video_link: row.video_link ?? row.videoLink ?? null,
    music_link: row.music_link ?? row.musicLink ?? null,
    backing_link: row.backing_link ?? row.backingLink ?? null,
    resource_link: row.resource_link ?? row.resourceLink ?? null,
    link: row.link ?? null,
    vocals_link: row.vocals_link ?? row.vocalsLink ?? null,
    image_link: row.image_link ?? row.imageLink ?? null,
    canva_link: row.canva_link ?? row.canvaLink ?? '',
    teaching_unit: row.teaching_unit ?? row.teachingUnit ?? null,
    level: row.level ?? null,
    unit_name: row.unit_name ?? row.unitName ?? null,
    lesson_number: row.lesson_number ?? row.lessonNumber ?? null,
    eyfs_standards: row.eyfs_standards ?? row.eyfsStandards ?? null,
  };
  if (row.organisation_id != null) {
    out.organisation_id = row.organisation_id;
  }
  return out;
}

function normalizeLesson(row) {
  if (row.sheet_name) {
    return {
      sheet_name: row.sheet_name,
      data: row.data ?? {},
      lesson_numbers: row.lesson_numbers ?? [],
      teaching_units: row.teaching_units ?? [],
    };
  }
  return null;
}

/**
 * Zod-validate and strip a backup payload for restore.
 * @returns {{ ok: true, data: object, rowCounts: Record<string, number> } | { ok: false, error: string }}
 */
export function sanitizeRestorePayload(raw, { targetOrg = null } = {}) {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Invalid backup payload.' };
  }
  const source =
    raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)
      ? raw.data
      : raw;

  const out = {};
  const rowCounts = {};

  for (const { key } of [...BACKUP_CORE_TABLES, ...BACKUP_OPTIONAL_TABLES]) {
    let rows = source[key];
    if (rows == null) continue;

    // lessons may arrive as a sheet→data map from older clients
    if (key === 'lessons' && rows && !Array.isArray(rows) && typeof rows === 'object') {
      rows = Object.entries(rows).map(([sheet, sheetData]) => ({
        sheet_name: sheet,
        data: sheetData?.allLessonsData || sheetData?.data || {},
        lesson_numbers: sheetData?.lessonNumbers || sheetData?.lesson_numbers || [],
        teaching_units: sheetData?.teachingUnits || sheetData?.teaching_units || [],
      }));
    }
    if (key === 'standards' && rows && !Array.isArray(rows) && typeof rows === 'object') {
      rows = Object.entries(rows).map(([sheet, sheetData]) => ({
        sheet_name: sheet,
        all_statements: sheetData?.allStatements || sheetData?.all_statements || [],
        structured_statements:
          sheetData?.structuredStatements || sheetData?.structured_statements || {},
      }));
    }

    if (!Array.isArray(rows)) {
      return { ok: false, error: `Table ${key} must be an array.` };
    }
    if (rows.length > BACKUP_ROW_CAP) {
      return {
        ok: false,
        error: `Table ${key} exceeds row cap (${BACKUP_ROW_CAP}).`,
      };
    }

    const schema = TABLE_ROW_SCHEMAS[key] || looseProps;
    const cleaned = [];
    for (let i = 0; i < rows.length; i++) {
      const parsed = schema.safeParse(rows[i]);
      if (!parsed.success) {
        return {
          ok: false,
          error: `Invalid row in ${key}[${i}]: ${parsed.error.issues[0]?.message || 'schema'}`,
        };
      }
      let row = stripRow(parsed.data, { targetOrg });
      if (!row) continue;
      if (key === 'activities') row = normalizeActivity(row);
      if (key === 'lessons') {
        row = normalizeLesson(row) || {
          sheet_name: row.sheet_name,
          data: row.data ?? {},
          lesson_numbers: row.lesson_numbers ?? [],
          teaching_units: row.teaching_units ?? [],
        };
      }
      if (key === 'lessonPlans') {
        row = {
          id: targetOrg ? row.id : undefined,
          date: row.date,
          week: row.week,
          class_name: row.class_name ?? row.className,
          activities: row.activities,
          duration: row.duration,
          notes: row.notes,
          status: row.status,
          unit_id: row.unit_id ?? row.unitId,
          unit_name: row.unit_name ?? row.unitName,
          lesson_number: row.lesson_number ?? row.lessonNumber,
          title: row.title,
          term: row.term,
          time: row.time,
        };
        if (!targetOrg) delete row.id;
      }
      cleaned.push(row);
    }
    out[key] = cleaned;
    rowCounts[key] = cleaned.length;
  }

  if (!Object.keys(out).length) {
    return { ok: false, error: 'Backup payload contained no importable tables.' };
  }
  return { ok: true, data: out, rowCounts };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} service
 * @param {{ organisationId?: string | null }} [opts]
 */
export async function exportCurriculumBackup(service, opts = {}) {
  const organisationId =
    typeof opts.organisationId === 'string' && opts.organisationId.trim()
      ? opts.organisationId.trim()
      : null;
  const out = {};
  const rowCounts = {};

  for (const { key, table } of [...BACKUP_CORE_TABLES, ...BACKUP_OPTIONAL_TABLES]) {
    try {
      const { data, error } = await service
        .from(table)
        .select('*')
        .limit(BACKUP_ROW_CAP + 1);
      if (error) {
        if (BACKUP_OPTIONAL_TABLES.some((t) => t.key === key)) {
          out[key] = [];
          rowCounts[key] = 0;
          continue;
        }
        const err = new Error(error.message || `Failed to export ${table}`);
        err.status = 500;
        throw err;
      }
      let rows = data || [];
      // R7: optional org filter — keep system rows (no organisation_id) + matching org.
      if (organisationId) {
        rows = rows.filter(
          (r) =>
            r == null ||
            r.organisation_id == null ||
            r.organisation_id === organisationId,
        );
      }
      if (rows.length > BACKUP_ROW_CAP) {
        const err = new Error(
          `Export of ${key} exceeds row cap (${BACKUP_ROW_CAP}).`,
        );
        err.status = 413;
        throw err;
      }
      out[key] = rows;
      rowCounts[key] = rows.length;
    } catch (e) {
      if (BACKUP_OPTIONAL_TABLES.some((t) => t.key === key) && !e?.status) {
        out[key] = [];
        rowCounts[key] = 0;
        continue;
      }
      throw e;
    }
  }
  return { data: out, rowCounts };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} service
 * @param {object} sanitizedPayload
 * @param {{ organisationId?: string | null, dryRun?: boolean }} [opts]
 */
export async function restoreCurriculumBackupRpc(service, sanitizedPayload, opts = {}) {
  const { data, error } = await service.rpc('restore_curriculum_backup', {
    p_payload: sanitizedPayload,
    p_organisation_id: opts.organisationId || null,
    p_dry_run: Boolean(opts.dryRun),
  });
  if (error) {
    const err = new Error(error.message || 'Restore RPC failed.');
    err.status = 500;
    throw err;
  }
  return data;
}
