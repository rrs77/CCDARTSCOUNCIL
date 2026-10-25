import { supabase, TABLES } from './supabase';
import { getScopedUserId, resolveOrganisationId } from './api';
import { isDemoModeActive } from '../utils/demoMode';
import type { StackedLesson } from '../hooks/useLessonStacks';
import {
  dropMissingColumn,
  newStackId,
  stackFromDbRow,
  stackToDbRow,
  type StackDbRow,
} from '../utils/lessonStacksLocal';

type StackInput = Omit<StackedLesson, 'id' | 'created_at'> & { id?: string; created_at?: string };

/** Who the stack belongs to. Org is required outside demo mode (no NULL-org rows from the app). */
export async function resolveStackScope(): Promise<{ organisationId: string | null; userId: string | null }> {
  const organisationId = await resolveOrganisationId();
  const userId = getScopedUserId();
  return { organisationId, userId };
}

/**
 * Write with a retry that drops optional columns an older database does not
 * have yet (e.g. `custom_objectives`, `curriculum_type`, `user_id`). The
 * July 2026 live snapshot of `lesson_stacks` had none of those columns, so
 * every insert from the app failed with PGRST204 and fell back to memory.
 */
async function writeWithColumnFallback(
  run: (row: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>,
  row: Record<string, unknown>,
): Promise<StackDbRow> {
  let current = row;
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data, error } = await run(current);
    if (!error) return data as StackDbRow;
    const next = dropMissingColumn(current, error);
    if (!next) throw error;
    console.warn('lesson_stacks: retrying without a column this database does not have yet');
    current = next;
  }
  throw new Error('lesson_stacks: could not save after dropping optional columns');
}

export const lessonStacksApi = {
  /** All stacks visible to the caller (RLS decides which). Throws on failure so callers can fall back. */
  getAllStrict: async (): Promise<StackedLesson[]> => {
    const { data, error } = await supabase
      .from(TABLES.LESSON_STACKS)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ((data || []) as StackDbRow[]).map(stackFromDbRow);
  },

  // Get all lesson stacks ([] on failure — kept for existing callers)
  getAll: async (): Promise<StackedLesson[]> => {
    try {
      return await lessonStacksApi.getAllStrict();
    } catch (error) {
      console.error('❌ Failed to fetch lesson stacks:', error);
      return [];
    }
  },

  // Create a new lesson stack (pass `id` to upload a stack first saved on this device)
  create: async (stackData: StackInput): Promise<StackedLesson> => {
    const { organisationId, userId } = await resolveStackScope();
    if (!organisationId && !isDemoModeActive()) {
      throw new Error('organisation_id is required to save lesson stacks.');
    }
    const row = stackToDbRow(
      { ...stackData, id: stackData.id || newStackId() },
      { organisationId, userId },
    );
    const data = await writeWithColumnFallback(
      (r) => supabase.from(TABLES.LESSON_STACKS).insert(r).select().single(),
      row,
    );
    return stackFromDbRow(data);
  },

  // Update a lesson stack
  update: async (id: string, updates: Partial<Omit<StackedLesson, 'id' | 'created_at'>>): Promise<StackedLesson> => {
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.lessons !== undefined) dbUpdates.lessons = updates.lessons;
    if (updates.totalTime !== undefined) dbUpdates.total_time = updates.totalTime;
    if (updates.totalActivities !== undefined) dbUpdates.total_activities = updates.totalActivities;
    if (updates.customObjectives !== undefined) dbUpdates.custom_objectives = updates.customObjectives;
    if (updates.curriculumType !== undefined) dbUpdates.curriculum_type = updates.curriculumType;
    const data = await writeWithColumnFallback(
      (r) => supabase.from(TABLES.LESSON_STACKS).update(r).eq('id', id).select().single(),
      dbUpdates,
    );
    return stackFromDbRow(data);
  },

  // Delete a lesson stack
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from(TABLES.LESSON_STACKS).delete().eq('id', id);
    if (error) {
      console.error('Failed to delete lesson stack:', error);
      throw error;
    }
  },

  // Get stacks by lesson number
  getByLesson: async (lessonNumber: string): Promise<StackedLesson[]> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.LESSON_STACKS)
        .select('*')
        .contains('lessons', [lessonNumber])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data || []) as StackDbRow[]).map(stackFromDbRow);
    } catch (error) {
      console.error('Failed to fetch stacks by lesson:', error);
      return [];
    }
  },
};
