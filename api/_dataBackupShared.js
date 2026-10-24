/**
 * Super-admin curriculum backup / restore helpers (service-role only).
 * Callers must already have passed requireSuperAdmin().
 */

/** Core tables always exported. */
export const BACKUP_CORE_TABLES = Object.freeze([
  { key: 'activities', table: 'activities' },
  { key: 'lessons', table: 'lessons' },
  { key: 'lessonPlans', table: 'lesson_plans' },
  { key: 'standards', table: 'eyfs_statements' },
  { key: 'halfTerms', table: 'half_terms' },
  { key: 'customCategories', table: 'custom_categories' },
  { key: 'categoryGroups', table: 'category_groups' },
  { key: 'yearGroups', table: 'year_groups' },
  { key: 'lessonStacks', table: 'lesson_stacks' },
  { key: 'activityStacks', table: 'activity_stacks' },
]);

/** Optional tables (migration may not exist yet). */
export const BACKUP_OPTIONAL_TABLES = Object.freeze([
  { key: 'customObjectiveYearGroups', table: 'custom_objective_year_groups' },
  { key: 'customObjectiveAreas', table: 'custom_objective_areas' },
  { key: 'customObjectives', table: 'custom_objectives' },
  { key: 'activityCustomObjectives', table: 'activity_custom_objectives' },
]);

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} service
 */
export async function exportCurriculumBackup(service) {
  const out = {};
  for (const { key, table } of BACKUP_CORE_TABLES) {
    const { data, error } = await service.from(table).select('*');
    if (error) {
      const err = new Error(error.message || `Failed to export ${table}`);
      err.status = 500;
      throw err;
    }
    out[key] = data || [];
  }
  for (const { key, table } of BACKUP_OPTIONAL_TABLES) {
    try {
      const { data, error } = await service.from(table).select('*');
      out[key] = error ? [] : data || [];
    } catch {
      out[key] = [];
    }
  }
  return out;
}

/**
 * Best-effort restore: upsert rows for known keys. Does not drop existing rows
 * outside the payload. Service-role only.
 * @param {import('@supabase/supabase-js').SupabaseClient} service
 * @param {Record<string, unknown>} data
 */
export async function importCurriculumBackup(service, data) {
  if (!data || typeof data !== 'object') {
    const err = new Error('Invalid backup payload.');
    err.status = 400;
    throw err;
  }

  const upserts = [];

  if (Array.isArray(data.activities) && data.activities.length > 0) {
    const cleaned = data.activities.map((row) => {
      if (row && typeof row === 'object' && 'activity' in row && 'category' in row) {
        // Already snake_case DB row or mixed client shape — prefer as-is keys when present.
        if ('activity_text' in row || 'teaching_unit' in row) {
          const { uniqueId: _u, ...rest } = row;
          return rest;
        }
        const { uniqueId: _u, ...activity } = row;
        return {
          activity: activity.activity,
          description: activity.description,
          activity_text: activity.activityText ?? activity.activity_text,
          time: activity.time,
          video_link: activity.videoLink ?? activity.video_link,
          music_link: activity.musicLink ?? activity.music_link,
          backing_link: activity.backingLink ?? activity.backing_link,
          resource_link: activity.resourceLink ?? activity.resource_link,
          link: activity.link,
          vocals_link: activity.vocalsLink ?? activity.vocals_link,
          image_link: activity.imageLink ?? activity.image_link,
          canva_link: activity.canvaLink ?? activity.canva_link ?? '',
          teaching_unit: activity.teachingUnit ?? activity.teaching_unit,
          category: activity.category,
          level: activity.level,
          unit_name: activity.unitName ?? activity.unit_name,
          lesson_number: activity.lessonNumber ?? activity.lesson_number,
          eyfs_standards: activity.eyfsStandards ?? activity.eyfs_standards,
        };
      }
      return row;
    });
    upserts.push(
      service.from('activities').upsert(cleaned, {
        onConflict: 'activity,category,lesson_number',
        ignoreDuplicates: false,
      }),
    );
  }

  if (data.lessons) {
    let lessonsData;
    if (Array.isArray(data.lessons)) {
      lessonsData = data.lessons;
    } else if (typeof data.lessons === 'object') {
      lessonsData = Object.entries(data.lessons).map(([sheet, sheetData]) => ({
        sheet_name: sheet,
        data: sheetData?.allLessonsData || sheetData?.data || {},
        lesson_numbers: sheetData?.lessonNumbers || sheetData?.lesson_numbers || [],
        teaching_units: sheetData?.teachingUnits || sheetData?.teaching_units || [],
      }));
    }
    if (lessonsData?.length) {
      upserts.push(
        service.from('lessons').upsert(lessonsData, { onConflict: 'sheet_name' }),
      );
    }
  }

  if (Array.isArray(data.lessonPlans) && data.lessonPlans.length > 0) {
    const lessonPlansData = data.lessonPlans.map((plan) => {
      if (plan && 'class_name' in plan) return plan;
      return {
        id: plan.id,
        date: plan.date ? new Date(plan.date).toISOString() : plan.date,
        week: plan.week,
        class_name: plan.className ?? plan.class_name,
        activities: plan.activities,
        duration: plan.duration,
        notes: plan.notes,
        status: plan.status,
        unit_id: plan.unitId ?? plan.unit_id,
        unit_name: plan.unitName ?? plan.unit_name,
        lesson_number: plan.lessonNumber ?? plan.lesson_number,
        title: plan.title,
        term: plan.term,
        time: plan.time,
      };
    });
    upserts.push(
      service.from('lesson_plans').upsert(lessonPlansData, { onConflict: 'id' }),
    );
  }

  const standards = data.standards || data.eyfs;
  if (standards) {
    let eyfsData;
    if (Array.isArray(standards)) {
      eyfsData = standards;
    } else if (typeof standards === 'object') {
      eyfsData = Object.entries(standards).map(([sheet, sheetData]) => ({
        sheet_name: sheet,
        all_statements: sheetData?.allStatements || sheetData?.all_statements || [],
        structured_statements:
          sheetData?.structuredStatements || sheetData?.structured_statements || {},
      }));
    }
    if (eyfsData?.length) {
      upserts.push(
        service.from('eyfs_statements').upsert(eyfsData, { onConflict: 'sheet_name' }),
      );
    }
  }

  const simple = [
    ['halfTerms', 'half_terms', 'id'],
    ['customCategories', 'custom_categories', 'id'],
    ['categoryGroups', 'category_groups', 'id'],
    ['yearGroups', 'year_groups', 'id'],
    ['lessonStacks', 'lesson_stacks', 'id'],
    ['activityStacks', 'activity_stacks', 'id'],
    ['customObjectiveYearGroups', 'custom_objective_year_groups', 'id'],
    ['customObjectiveAreas', 'custom_objective_areas', 'id'],
    ['customObjectives', 'custom_objectives', 'id'],
  ];
  for (const [key, table, onConflict] of simple) {
    if (Array.isArray(data[key]) && data[key].length > 0) {
      upserts.push(service.from(table).upsert(data[key], { onConflict }));
    }
  }

  if (
    Array.isArray(data.activityCustomObjectives) &&
    data.activityCustomObjectives.length > 0
  ) {
    upserts.push(
      service.from('activity_custom_objectives').upsert(data.activityCustomObjectives, {
        onConflict: 'activity_id,objective_id',
      }),
    );
  }

  if (!upserts.length) {
    const err = new Error('Backup payload contained no importable tables.');
    err.status = 400;
    throw err;
  }

  const results = await Promise.all(upserts);
  for (const result of results) {
    if (result?.error) {
      const err = new Error(result.error.message || 'Restore failed.');
      err.status = 500;
      throw err;
    }
  }
  return { success: true };
}
