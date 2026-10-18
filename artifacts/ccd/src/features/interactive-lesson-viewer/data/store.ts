import { supabase, isSupabaseAuthEnabled } from '../../../config/supabase';
import { buildDemoInteractiveLesson } from './demoLesson';
import type { InteractiveLesson, InteractiveLessonSummary } from '../types';

const LOCAL_KEY = 'ccd-interactive-lessons-v1';
const TABLE = 'interactive_lessons';

function readLocal(): InteractiveLesson[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as InteractiveLesson[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(lessons: InteractiveLesson[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(lessons));
}

function ensureDemo(lessons: InteractiveLesson[], ownerId: string): InteractiveLesson[] {
  if (lessons.some((l) => l.id === 'demo-interactive-lesson' || l.isDemo)) {
    return lessons;
  }
  return [buildDemoInteractiveLesson(ownerId), ...lessons];
}

function toSummary(lesson: InteractiveLesson): InteractiveLessonSummary {
  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    status: lesson.status,
    ownerId: lesson.ownerId,
    sceneCount: lesson.scenes.length,
    updatedAt: lesson.updatedAt,
    isDemo: lesson.isDemo,
  };
}

function rowToLesson(row: Record<string, unknown>): InteractiveLesson {
  const data = (row.data || {}) as Partial<InteractiveLesson>;
  return {
    id: String(row.id),
    title: String(row.title || data.title || 'Untitled'),
    description: String(row.description || data.description || ''),
    ownerId: String(row.owner_id || data.ownerId || ''),
    ownerEmail: data.ownerEmail,
    status: (row.status as InteractiveLesson['status']) || data.status || 'draft',
    scenes: data.scenes || [],
    mediaLibrary: data.mediaLibrary || [],
    attachedLessonKeys: (row.attached_lesson_keys as string[]) || data.attachedLessonKeys || [],
    createdAt: String(row.created_at || data.createdAt || new Date().toISOString()),
    updatedAt: String(row.updated_at || data.updatedAt || new Date().toISOString()),
    isDemo: Boolean(data.isDemo),
  };
}

export async function listInteractiveLessons(opts: {
  userId: string;
  canEdit: boolean;
}): Promise<InteractiveLessonSummary[]> {
  const local = ensureDemo(readLocal(), opts.userId);
  writeLocal(local);

  let remote: InteractiveLesson[] = [];
  if (isSupabaseAuthEnabled()) {
    try {
      let query = supabase.from(TABLE).select('*').order('updated_at', { ascending: false });
      if (!opts.canEdit) {
        query = query.eq('status', 'published');
      } else {
        // Editors see own lessons + published demos
        query = query.or(`owner_id.eq.${opts.userId},status.eq.published`);
      }
      const { data, error } = await query;
      if (!error && data) {
        remote = data.map((r) => rowToLesson(r as Record<string, unknown>));
      }
    } catch (err) {
      console.warn('[ILV] list remote failed, using local', err);
    }
  }

  const byId = new Map<string, InteractiveLesson>();
  for (const l of local) byId.set(l.id, l);
  for (const l of remote) byId.set(l.id, l);

  const all = Array.from(byId.values());
  const visible = opts.canEdit
    ? all.filter((l) => l.ownerId === opts.userId || l.isDemo || l.status === 'published')
    : all.filter((l) => l.status === 'published');

  return visible
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(toSummary);
}

export async function getInteractiveLesson(id: string): Promise<InteractiveLesson | null> {
  const local = readLocal().find((l) => l.id === id);
  if (local) return local;

  if (id === 'demo-interactive-lesson') {
    return buildDemoInteractiveLesson();
  }

  if (isSupabaseAuthEnabled()) {
    try {
      const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
      if (!error && data) return rowToLesson(data as Record<string, unknown>);
    } catch (err) {
      console.warn('[ILV] get remote failed', err);
    }
  }
  return null;
}

export async function saveInteractiveLesson(lesson: InteractiveLesson): Promise<InteractiveLesson> {
  const next = { ...lesson, updatedAt: new Date().toISOString() };
  const local = readLocal().filter((l) => l.id !== next.id);
  local.unshift(next);
  writeLocal(local);

  if (isSupabaseAuthEnabled() && !next.isDemo) {
    try {
      const payload = {
        id: next.id,
        owner_id: next.ownerId,
        title: next.title,
        description: next.description,
        status: next.status,
        attached_lesson_keys: next.attachedLessonKeys,
        data: next,
        updated_at: next.updatedAt,
        created_at: next.createdAt,
      };
      const { error } = await supabase.from(TABLE).upsert(payload, { onConflict: 'id' });
      if (error) console.warn('[ILV] upsert failed (local kept)', error.message);
    } catch (err) {
      console.warn('[ILV] upsert exception (local kept)', err);
    }
  }

  return next;
}

export async function deleteInteractiveLesson(id: string, userId: string): Promise<void> {
  if (id === 'demo-interactive-lesson') return;
  writeLocal(readLocal().filter((l) => !(l.id === id && l.ownerId === userId)));
  if (isSupabaseAuthEnabled()) {
    try {
      await supabase.from(TABLE).delete().eq('id', id).eq('owner_id', userId);
    } catch (err) {
      console.warn('[ILV] delete remote failed', err);
    }
  }
}

export async function attachInteractiveLessonToCcdLesson(
  interactiveId: string,
  sheet: string,
  lessonNumber: string,
  userId: string,
): Promise<InteractiveLesson | null> {
  const lesson = await getInteractiveLesson(interactiveId);
  if (!lesson) return null;
  if (lesson.ownerId !== userId && !lesson.isDemo) {
    // Teachers can attach published lessons to their CCD lessons
    if (lesson.status !== 'published') return null;
  }
  const key = `${sheet}:${lessonNumber}`;
  if (!lesson.attachedLessonKeys.includes(key)) {
    lesson.attachedLessonKeys = [...lesson.attachedLessonKeys, key];
  }
  // Also stamp on CCD lesson JSON via localStorage helper key for fast lookup
  try {
    const mapRaw = localStorage.getItem('ccd-ilv-attachments-v1');
    const map = mapRaw ? (JSON.parse(mapRaw) as Record<string, string>) : {};
    map[key] = interactiveId;
    localStorage.setItem('ccd-ilv-attachments-v1', JSON.stringify(map));
  } catch {
    /* ignore */
  }
  return saveInteractiveLesson(lesson);
}

export function getAttachedInteractiveLessonId(sheet: string, lessonNumber: string): string | null {
  try {
    const mapRaw = localStorage.getItem('ccd-ilv-attachments-v1');
    const map = mapRaw ? (JSON.parse(mapRaw) as Record<string, string>) : {};
    return map[`${sheet}:${lessonNumber}`] || null;
  } catch {
    return null;
  }
}

export function seedInteractiveLessonsForDemo(userId: string) {
  const local = ensureDemo(readLocal(), userId);
  writeLocal(local);
}
