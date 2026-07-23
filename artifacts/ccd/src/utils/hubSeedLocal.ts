/**
 * Partner-hub + curated prototype packs are standard demo/session seed content
 * (same durability as LSO/ROH: present for the session, re-seeded on prototype
 * entry). They live in the demo local store so they never write to production
 * Supabase — that isolation is not the same as “ephemeral user-local junk”.
 *
 * Helpers detect and merge seeded activities/lessons into the UI.
 */

import { isLsoLibraryCategory } from './lsoBranding';
import { isRohLibraryCategory } from './rohBranding';
import { isWtdLibraryCategory } from './wtdBranding';

const HUB_SEED_NOTE_MARKERS = [
  'ROH_RJ_SEED',
  'LSO_Y6_SEED',
  'WTD_SEED',
  'WTD_BB_SEED',
  'KS3_4CHORDS_SEED',
  'OCR_FILM_COMP_SEED',
  'EMS_SEED',
  'ICC_SEED',
  'DR_SEED',
  'CCD_HUB_SEED',
] as const;

export function isHubSeededActivity(activity: {
  notes?: string | null;
  category?: string | null;
  unitName?: string | null;
} | null | undefined): boolean {
  if (!activity) return false;
  const notes = String(activity.notes || '');
  if (HUB_SEED_NOTE_MARKERS.some((m) => notes.includes(m))) return true;
  const cat = String(activity.category || '');
  if (isRohLibraryCategory(cat) || isLsoLibraryCategory(cat) || isWtdLibraryCategory(cat)) return true;
  if (cat.startsWith('4 Chords')) return true;
  if (cat.startsWith('Film/Computer Music')) return true;
  if (cat.startsWith('EMS') || cat.startsWith('Essex Music')) return true;
  if (
    cat.startsWith('iCompose') ||
    cat.startsWith('I Can Compose') ||
    cat.startsWith('ICC')
  )
    return true;
  if (cat.startsWith('Drama Resource') || cat.startsWith('DR ')) return true;
  return false;
}

export function isHubSeededLesson(lesson: {
  notes?: string | null;
  title?: string | null;
  lessonName?: string | null;
} | null | undefined): boolean {
  if (!lesson) return false;
  const notes = String(lesson.notes || '');
  if (HUB_SEED_NOTE_MARKERS.some((m) => notes.includes(m))) return true;
  const title = `${lesson.title || ''} ${lesson.lessonName || ''}`;
  if (
    /Romeo and Juliet|How to Build an Orchestra|We Teach Drama|Blood Brothers|4 Chords|Film and Computer Music/i.test(
      title,
    ) &&
    notes.includes('SEED')
  ) {
    return true;
  }
  // Partner / curated prototype seed markers
  if (
    notes.includes('ROH') ||
    notes.includes('LSO_Y6') ||
    notes.includes('WTD_') ||
    notes.includes('KS3_4CHORDS') ||
    notes.includes('OCR_FILM_COMP')
  )
    return true;
  return HUB_SEED_NOTE_MARKERS.some((m) => notes.includes(m));
}

export function readLocalLibraryActivities<T = any>(): T[] {
  try {
    const raw = localStorage.getItem('library-activities');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Curated demo/hub seed activities from the session store (not production cloud). */
export function readHubSeededActivitiesFromLocal<T = any>(): T[] {
  return readLocalLibraryActivities<T>().filter((a) => isHubSeededActivity(a as any));
}

/**
 * Merge cloud/base activities with local hub seeds.
 * Local hub packs fully replace cloud/stale copies for the same category or
 * teaching unit — otherwise duplicate rows (different `_id`s) can leave empty
 * resourceLink fields visible next to the real Hachette/LSO links.
 */
export function mergeActivitiesWithHubSeeds<T extends { _id?: string; id?: string; activity?: string; category?: string; unitName?: string; teachingUnit?: string; notes?: string }>(
  base: T[],
  hubLocal: T[] = readHubSeededActivitiesFromLocal<T>(),
): T[] {
  if (!hubLocal.length) return base || [];

  const hubCategories = new Set(
    hubLocal.map((a) => String(a?.category || '').trim()).filter(Boolean),
  );
  const hubUnits = new Set(
    hubLocal
      .flatMap((a) => [String(a?.unitName || '').trim(), String(a?.teachingUnit || '').trim()])
      .filter(Boolean),
  );
  const hubNameCat = new Set(
    hubLocal.map(
      (a) =>
        `${String(a?.activity || '')
          .trim()
          .toLowerCase()}::${String(a?.category || '')
          .trim()
          .toLowerCase()}`,
    ),
  );

  const filteredBase = (base || []).filter((a) => {
    if (!a) return false;
    const nameCat = `${String(a.activity || '')
      .trim()
      .toLowerCase()}::${String(a.category || '')
      .trim()
      .toLowerCase()}`;
    if (hubNameCat.has(nameCat)) return false;
    const cat = String(a.category || '').trim();
    const unit = String(a.unitName || a.teachingUnit || '').trim();
    if (hubCategories.has(cat) || (unit && hubUnits.has(unit))) return false;
    return true;
  });

  return [...filteredBase, ...hubLocal];
}

/** Dispatched after hub seeds write library-activities so DataContext can reload. */
export const CCD_HUB_ACTIVITIES_UPDATED_EVENT = 'ccd-hub-activities-updated';

export function notifyHubActivitiesUpdated(source: string) {
  try {
    window.dispatchEvent(
      new CustomEvent(CCD_HUB_ACTIVITIES_UPDATED_EVENT, { detail: { source } }),
    );
  } catch {
    /* ignore */
  }
}

export function readLocalLessonSheet(sheetId: string): {
  allLessonsData?: Record<string, any>;
  lessonNumbers?: string[];
  teachingUnits?: any[];
  notes?: string;
} | null {
  try {
    const raw = localStorage.getItem(`lesson-data-${sheetId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Overlay hub-seeded lessons from localStorage onto a cloud/base lesson map.
 * Local hub lessons keep their lesson numbers from the local sheet.
 */
export function mergeLessonsWithHubSeeds(
  sheetId: string,
  baseLessons: Record<string, any>,
  baseNumbers: string[],
): { allLessonsData: Record<string, any>; lessonNumbers: string[] } {
  const local = readLocalLessonSheet(sheetId);
  const localData = local?.allLessonsData || {};
  const merged = { ...baseLessons };
  const numbers = new Set(baseNumbers.map(String));

  for (const [key, lesson] of Object.entries(localData)) {
    if (!isHubSeededLesson(lesson as any)) continue;
    merged[key] = lesson;
    numbers.add(String(key));
  }

  return {
    allLessonsData: merged,
    lessonNumbers: [...numbers].sort((a, b) => parseInt(a, 10) - parseInt(b, 10)),
  };
}
