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

/** Organisation id shape for restore / export filters. */
export const ORGANISATION_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Identity / tenancy / timestamp fields always stripped from client payload. */
export const STRIP_ALWAYS = Object.freeze([
  'user_id',
  'owner_id',
  'created_by',
  'created_at',
  'updated_at',
  'anonymised_at',
]);

/**
 * @param {string | null | undefined} value
 * @returns {string | null}
 */
export function normalizeOrganisationId(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || !ORGANISATION_ID_RE.test(trimmed)) return null;
  return trimmed;
}

/**
 * Keep a zod-validated UUID id for ON CONFLICT(id); drop anything else.
 * @param {Record<string, unknown>} row
 */
function keepValidatedUuidId(row) {
  if (typeof row.id === 'string' && UUID_RE.test(row.id)) {
    return;
  }
  delete row.id;
}

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
    id: z.string().uuid().optional().nullable(),
    name: z.string().optional().nullable(),
    sort_order: z.union([z.number(), z.string()]).optional().nullable(),
    color: z.string().optional().nullable(),
  })
  .passthrough();

/** Stacks: `data` must be a plain object (RPC no longer COALESCEs whole row). */
const stackRowSchema = z
  .object({
    id: z.string().uuid().optional().nullable(),
    name: z.string().optional().nullable(),
    data: z.record(z.string(), z.unknown()),
  })
  .passthrough();

const uuidIdRow = z
  .object({
    id: z.string().uuid().optional().nullable(),
  })
  .passthrough();

/** @type {Record<string, z.ZodTypeAny>} */
export const TABLE_ROW_SCHEMAS = Object.freeze({
  activities: activityRowSchema,
  lessons: lessonRowSchema,
  standards: looseProps,
  halfTerms: uuidIdRow,
  lessonPlans: uuidIdRow,
  customCategories: namedIdRow,
  categoryGroups: namedIdRow,
  yearGroups: namedIdRow,
  lessonStacks: stackRowSchema,
  activityStacks: stackRowSchema,
  customObjectiveYearGroups: namedIdRow,
  customObjectiveAreas: uuidIdRow,
  customObjectives: uuidIdRow,
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
  // Always force org from validated server target; never trust client org/owner.
  out.organisation_id = targetOrg;
  keepValidatedUuidId(out);
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
  if (!row.sheet_name) return null;
  const out = {
    sheet_name: row.sheet_name,
    academic_year: row.academic_year ?? null,
    data: row.data ?? {},
    lesson_numbers: row.lesson_numbers ?? [],
    teaching_units: row.teaching_units ?? [],
  };
  // Keep lessons.user_id when it is a valid UUID (needed for 4-col unique / ownership).
  if (typeof row.user_id === 'string' && UUID_RE.test(row.user_id)) {
    out.user_id = row.user_id;
  }
  if (row.organisation_id != null) {
    out.organisation_id = row.organisation_id;
  }
  return out;
}

/**
 * Zod-validate and strip a backup payload for restore.
 * @returns {{ ok: true, data: object, rowCounts: Record<string, number> } | { ok: false, error: string }}
 */
export function sanitizeRestorePayload(raw, { targetOrg = null } = {}) {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Invalid backup payload.' };
  }
  const org = normalizeOrganisationId(targetOrg);
  if (!org) {
    return { ok: false, error: 'organisationId is required.' };
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
      let row = stripRow(parsed.data, { targetOrg: org });
      if (!row) continue;
      if (key === 'activities') row = normalizeActivity(row);
      if (key === 'lessons') {
        // stripRow removes user_id; re-apply validated UUID + keep academic_year.
        const rawUserId = parsed.data.user_id;
        const rawYear = parsed.data.academic_year;
        row = normalizeLesson({
          ...row,
          academic_year: rawYear ?? row.academic_year ?? null,
          user_id:
            typeof rawUserId === 'string' && UUID_RE.test(rawUserId)
              ? rawUserId
              : undefined,
        }) || {
          sheet_name: row.sheet_name,
          academic_year: rawYear ?? null,
          data: row.data ?? {},
          lesson_numbers: row.lesson_numbers ?? [],
          teaching_units: row.teaching_units ?? [],
        };
        row.organisation_id = org;
        if (typeof rawUserId === 'string' && UUID_RE.test(rawUserId)) {
          row.user_id = rawUserId;
        }
      }
      if (key === 'lessonStacks' || key === 'activityStacks') {
        if (!row.data || typeof row.data !== 'object' || Array.isArray(row.data)) {
          return {
            ok: false,
            error: `Invalid row in ${key}[${i}]: data must be an object`,
          };
        }
      }
      if (key === 'lessonPlans') {
        row = {
          id: row.id,
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
          organisation_id: org,
        };
        keepValidatedUuidId(row);
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
  const organisationId = normalizeOrganisationId(opts.organisationId);
  if (!organisationId) {
    const err = new Error('organisationId is required.');
    err.status = 400;
    throw err;
  }
  const { data, error } = await service.rpc('restore_curriculum_backup', {
    p_payload: sanitizedPayload,
    p_organisation_id: organisationId,
    p_dry_run: Boolean(opts.dryRun),
  });
  if (error) {
    const msg = error.message || 'Restore RPC failed.';
    const err = new Error(msg);
    if (/organisation_id (required|not found)/i.test(msg) || /invalid payload/i.test(msg)) {
      err.status = 400;
    } else if (/custom_objective|missing/i.test(msg)) {
      err.status = 400;
    } else {
      err.status = 500;
    }
    throw err;
  }
  return data;
}

/**
 * Persist a pre-restore snapshot into private curriculum_backups (service-role).
 * @returns {{ id: string, storageKey: string }}
 */
export async function saveCurriculumBackupSnapshot(service, {
  userId,
  organisationId,
  payload,
  rowCounts,
}) {
  const org = normalizeOrganisationId(organisationId);
  if (!org) {
    const err = new Error('organisationId is required.');
    err.status = 400;
    throw err;
  }
  const storageKey = `backups/${Date.now()}-${userId}.json`;
  const { data, error } = await service
    .from('curriculum_backups')
    .insert({
      created_by: userId,
      organisation_id: org,
      storage_key: storageKey,
      payload,
      row_counts: rowCounts || {},
    })
    .select('id, storage_key')
    .single();
  if (error || !data?.id) {
    const err = new Error(error?.message || 'Failed to persist pre-restore snapshot.');
    err.status = 500;
    throw err;
  }
  return { id: data.id, storageKey: data.storage_key || storageKey };
}
