import { supabase } from '../../config/supabase';
import { isDemoModeActive } from '../demoMode';
import {
  RHYTHMSTIX_TEMPLATES,
  templateFromDbRow,
  type RhythmstixTemplate,
} from './rhythmstixTemplates';

/**
 * Shared lesson plan templates. Reads the NULL-organisation defaults from
 * Supabase (public.lesson_plan_templates, readable by every school, writable
 * by super admins only). Falls back to the bundled copy in demo mode, when
 * signed out, or when the table is not there yet.
 */
let cache: RhythmstixTemplate[] | null = null;
let inflight: Promise<RhythmstixTemplate[]> | null = null;

export function bundledLessonTemplates(): RhythmstixTemplate[] {
  return [...RHYTHMSTIX_TEMPLATES];
}

export function cachedLessonTemplates(): RhythmstixTemplate[] {
  return cache || bundledLessonTemplates();
}

export async function loadLessonTemplates(): Promise<RhythmstixTemplate[]> {
  if (cache) return cache;
  if (isDemoModeActive()) return bundledLessonTemplates();
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_plan_templates')
        .select('template_key,name,description,config,sort_order')
        .is('organisation_id', null)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error || !Array.isArray(data) || data.length === 0) return bundledLessonTemplates();
      const rows = data.map(templateFromDbRow).filter(Boolean) as RhythmstixTemplate[];
      // Keep all seven even if a row is missing in the DB.
      const merged = RHYTHMSTIX_TEMPLATES.map((b) => rows.find((r) => r.id === b.id) || b);
      merged.sort((a, b) => a.sortOrder - b.sortOrder);
      cache = merged;
      return merged;
    } catch {
      return bundledLessonTemplates();
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
