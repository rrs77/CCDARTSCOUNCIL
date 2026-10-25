import { supabase, isSupabaseAuthEnabled } from '../../../config/supabase';
import { isAuthorizedDemoMode, isDemoModeActive } from '../../../utils/demoMode';
import { buildDemoInteractiveLesson } from './demoLesson';
import {
  DEMO_INTRO_SCENE_ID,
  ensureDemoIntro,
  isBuiltInDemo,
  isBuiltInDemoId,
} from './demoGuard';
import { buildHubSlidesDecks } from './hubDecks';
import type {
  InteractiveLesson,
  InteractiveLessonSummary,
  SlidesLibraryTab,
} from '../types';

const LOCAL_KEY = 'ccd-interactive-lessons-v1';
const LIBRARY_LINKS_KEY = 'ccd-ilv-library-links-v1';
const TABLE = 'interactive_lessons';
const LINKS_TABLE = 'interactive_lesson_library_links';

/**
 * Prefer localStorage when:
 * - prototype demo is active, or
 * - we want a guaranteed click-through before the Supabase migration is applied.
 * Remote sync still runs for normal logins; failures fall back to local quietly.
 */
function useRemoteSync(): boolean {
  if (isDemoModeActive() || isAuthorizedDemoMode()) return false;
  return isSupabaseAuthEnabled();
}

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

function readLibraryLinks(userId: string): string[] {
  try {
    const raw = localStorage.getItem(LIBRARY_LINKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, string[]>;
    return Array.isArray(parsed[userId]) ? parsed[userId] : [];
  } catch {
    return [];
  }
}

function writeLibraryLinks(userId: string, ids: string[]) {
  try {
    const raw = localStorage.getItem(LIBRARY_LINKS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    parsed[userId] = Array.from(new Set(ids));
    localStorage.setItem(LIBRARY_LINKS_KEY, JSON.stringify(parsed));
  } catch {
    /* ignore */
  }
}

function canonicalIntroScene(): InteractiveLesson['scenes'][number] {
  const intro = buildDemoInteractiveLesson().scenes.find((s) => s.id === DEMO_INTRO_SCENE_ID);
  if (!intro) throw new Error('[ILV] built-in demo is missing its intro sting');
  return intro;
}

/** The built-in demo, rebuilt from code every time, with the sting forced to scene 1. */
function builtInDemo(ownerId = 'system-demo'): InteractiveLesson {
  return ensureDemoIntro(
    {
      ...buildDemoInteractiveLesson(ownerId),
      source: 'demo' as const,
      tags: ['demo', 'lyric-videos', 'youtube', 'canva'],
      subject: 'Performing arts',
    },
    canonicalIntroScene(),
  );
}

/** Copies of the demo keep the sting as scene 1, even if a stored copy lost it. */
function guardDerived(lesson: InteractiveLesson): InteractiveLesson {
  return lesson.derivedFromDemo ? ensureDemoIntro(lesson, canonicalIntroScene()) : lesson;
}

function ensureDemo(lessons: InteractiveLesson[], ownerId: string): InteractiveLesson[] {
  const demo = builtInDemo(ownerId);
  const withoutStaleDemo = lessons
    .filter((l) => !isBuiltInDemo(l))
    .map(guardDerived);
  // Always refresh the shipped demo so preview works without the Supabase migration.
  return [demo, ...withoutStaleDemo];
}

function ensureHubDecks(lessons: InteractiveLesson[]): InteractiveLesson[] {
  const hubs = buildHubSlidesDecks();
  const hubIds = new Set(hubs.map((h) => h.id));
  const withoutStaleHubs = lessons.filter((l) => !hubIds.has(l.id) && l.source !== 'hub');
  // Refresh hub packs so prototype content stays polished.
  return [...withoutStaleHubs, ...hubs];
}

function ensureLibrary(lessons: InteractiveLesson[], ownerId: string): InteractiveLesson[] {
  return ensureHubDecks(ensureDemo(lessons, ownerId));
}

function toSummary(lesson: InteractiveLesson): InteractiveLessonSummary {
  const first = lesson.scenes[0];
  const sceneTypes: InteractiveLesson['scenes'][number]['type'][] = [];
  for (const s of lesson.scenes) {
    if (!sceneTypes.includes(s.type)) sceneTypes.push(s.type);
  }
  const headline = first?.overlays?.find((o) => o.style === 'headline')?.text;
  const source =
    lesson.source || (lesson.isDemo ? 'demo' : lesson.hubId ? 'hub' : 'user');
  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    status: lesson.status,
    ownerId: lesson.ownerId,
    sceneCount: lesson.scenes.length,
    updatedAt: lesson.updatedAt,
    isDemo: lesson.isDemo,
    sceneTypes,
    source,
    hubId: lesson.hubId,
    hubName: lesson.hubName,
    tags: lesson.tags,
    subject: lesson.subject,
    cover: first
      ? {
          type: first.type,
          title: first.title,
          backgroundColor: first.background?.color || first.backgroundColor,
          backgroundGradient: first.background?.gradient || first.backgroundGradient,
          mediaUrl: first.mediaUrl,
          posterUrl: first.posterUrl,
          embedUrl: first.embedUrl,
          headline,
        }
      : undefined,
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
    isDemo: data.isDemo === true,
    derivedFromDemo: Boolean(data.derivedFromDemo),
    source:
      (row.source as InteractiveLesson['source']) ||
      data.source ||
      (data.isDemo === true ? 'demo' : undefined),
    hubId: (row.hub_id as string) || data.hubId,
    hubName: (row.hub_name as string) || data.hubName,
    tags: (row.tags as string[]) || data.tags,
    subject: (row.subject as string) || data.subject,
  };
}

function matchesQuery(summary: InteractiveLessonSummary, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    summary.title,
    summary.description,
    summary.subject || '',
    summary.hubName || '',
    ...(summary.tags || []),
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

export async function listInteractiveLessons(opts: {
  userId: string;
  canEdit: boolean;
}): Promise<InteractiveLessonSummary[]> {
  const local = ensureLibrary(readLocal(), opts.userId);
  writeLocal(local);

  let remote: InteractiveLesson[] = [];
  if (useRemoteSync()) {
    try {
      let query = supabase.from(TABLE).select('*').order('updated_at', { ascending: false });
      if (!opts.canEdit) {
        query = query.eq('status', 'published');
      } else {
        // Editors see own lessons + published demos
        query = query.or(`owner_id.eq.${opts.userId},status.eq.published`);
      }
      const { data, error } = await query;
      // Missing table / RLS (migration not applied) → stay on localStorage demo.
      if (!error && data) {
        // A stored row can never replace the built-in demo.
        remote = data
          .map((r) => rowToLesson(r as Record<string, unknown>))
          .filter((l) => !isBuiltInDemo(l))
          .map(guardDerived);
      } else if (error) {
        console.warn('[ILV] remote list skipped (using local/demo):', error.message);
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
    ? all.filter(
        (l) =>
          l.ownerId === opts.userId ||
          l.isDemo ||
          l.source === 'hub' ||
          l.status === 'published',
      )
    : all.filter((l) => l.status === 'published' || l.source === 'hub' || l.isDemo);

  return visible
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(toSummary);
}

/**
 * Slides library for the picker + Slides tab.
 * - mine: decks the teacher owns (plus the shipped demo starter)
 * - hubs: partner-hub decks linked into the teacher library (prototype seeds two)
 * - all: both
 */
export async function listSlidesLibrary(opts: {
  userId: string;
  canEdit: boolean;
  tab?: SlidesLibraryTab;
  query?: string;
}): Promise<InteractiveLessonSummary[]> {
  const tab = opts.tab || 'all';
  const all = await listInteractiveLessons({ userId: opts.userId, canEdit: opts.canEdit });
  const linkedHubIds = new Set(readLibraryLinks(opts.userId));

  // Prototype: seeded hub decks are always linked so "From hubs" isn't empty.
  for (const h of buildHubSlidesDecks()) linkedHubIds.add(h.id);
  writeLibraryLinks(opts.userId, Array.from(linkedHubIds));

  const filtered = all.filter((item) => {
    const source = item.source || (item.isDemo ? 'demo' : item.hubId ? 'hub' : 'user');
    if (tab === 'mine') {
      return (
        source !== 'hub' &&
        (item.ownerId === opts.userId || item.isDemo || source === 'demo' || source === 'user')
      );
    }
    if (tab === 'hubs') {
      return source === 'hub' && linkedHubIds.has(item.id);
    }
    return true;
  });

  return filtered.filter((item) => matchesQuery(item, opts.query || ''));
}

/** Record that a hub slides deck is available in this teacher's library. */
export function linkHubSlidesToLibrary(userId: string, interactiveLessonId: string) {
  const ids = readLibraryLinks(userId);
  if (!ids.includes(interactiveLessonId)) {
    writeLibraryLinks(userId, [...ids, interactiveLessonId]);
  }
  if (useRemoteSync()) {
    void supabase
      .from(LINKS_TABLE)
      .upsert(
        {
          user_id: userId,
          interactive_lesson_id: interactiveLessonId,
          source: 'hub',
        },
        { onConflict: 'user_id,interactive_lesson_id' },
      )
      .then(({ error }) => {
        if (error) console.warn('[ILV] library link upsert skipped', error.message);
      });
  }
}

export async function getInteractiveLesson(id: string): Promise<InteractiveLesson | null> {
  // Always rebuild the shipped demo so preview content stays polished (no stale placeholders).
  if (isBuiltInDemoId(id)) {
    const demo = builtInDemo();
    const rest = readLocal().filter((l) => !isBuiltInDemo(l));
    writeLocal(ensureHubDecks([demo, ...rest]));
    return demo;
  }

  const hubMatch = buildHubSlidesDecks().find((h) => h.id === id);
  if (hubMatch) {
    const rest = readLocal().filter((l) => l.id !== id);
    writeLocal(ensureHubDecks([hubMatch, ...rest]));
    return hubMatch;
  }

  const local = ensureLibrary(readLocal(), 'anonymous').find((l) => l.id === id);
  if (local) return local;

  if (useRemoteSync()) {
    try {
      const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
      if (!error && data) {
        const row = rowToLesson(data as Record<string, unknown>);
        if (!isBuiltInDemo(row)) return guardDerived(row);
      }
    } catch (err) {
      console.warn('[ILV] get remote failed', err);
    }
  }
  return null;
}

/**
 * Read-only classroom fetch: published (or demo) lessons only.
 * Used by player deep links — never returns drafts to non-owners.
 */
export async function getPublishedInteractiveLessonForPlayer(
  id: string,
): Promise<{ lesson: InteractiveLesson | null; reason?: 'not-found' | 'unpublished' }> {
  const lesson = await getInteractiveLesson(id);
  if (!lesson) return { lesson: null, reason: 'not-found' };
  if (lesson.isDemo || lesson.status === 'published') return { lesson };
  // Remote published-only check when sync is on
  if (useRemoteSync()) {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .maybeSingle();
      if (!error && data) return { lesson: rowToLesson(data as Record<string, unknown>) };
    } catch {
      /* fall through */
    }
  }
  return { lesson: null, reason: 'unpublished' };
}

export class BuiltInDemoLockedError extends Error {
  constructor() {
    super('The built-in demo can’t be edited, saved over or deleted. Make a copy to change it.');
    this.name = 'BuiltInDemoLockedError';
  }
}

export async function saveInteractiveLesson(lesson: InteractiveLesson): Promise<InteractiveLesson> {
  // Built-in demo is read-only for everyone; also blocks overwriting its id with a copy.
  if (isBuiltInDemo(lesson)) throw new BuiltInDemoLockedError();
  const next: InteractiveLesson = {
    ...guardDerived(lesson),
    source: lesson.source || (lesson.isDemo ? 'demo' : lesson.hubId ? 'hub' : 'user'),
    updatedAt: new Date().toISOString(),
  };
  const local = readLocal().filter((l) => l.id !== next.id);
  local.unshift(next);
  writeLocal(ensureHubDecks(local));

  if (useRemoteSync() && !next.isDemo && next.source !== 'hub') {
    try {
      const payload = {
        id: next.id,
        owner_id: next.ownerId,
        title: next.title,
        description: next.description,
        status: next.status,
        attached_lesson_keys: next.attachedLessonKeys,
        source: next.source || 'user',
        hub_id: next.hubId || null,
        hub_name: next.hubName || null,
        tags: next.tags || [],
        subject: next.subject || null,
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
  if (isBuiltInDemoId(id)) throw new BuiltInDemoLockedError();
  if (id.startsWith('hub-slides-')) return;
  writeLocal(readLocal().filter((l) => !(l.id === id && l.ownerId === userId)));
  if (useRemoteSync()) {
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
  // Legacy keys (no user/year) — kept readable for migration; prefer lesson_viewer_links.
  const key = `${sheet}:${lessonNumber}`;
  try {
    const mapRaw = localStorage.getItem('ccd-ilv-attachments-v1');
    const map = mapRaw ? (JSON.parse(mapRaw) as Record<string, string>) : {};
    map[key] = interactiveId;
    localStorage.setItem('ccd-ilv-attachments-v1', JSON.stringify(map));
  } catch {
    /* ignore */
  }
  // Stop growing attached_lesson_keys; links live in lesson_viewer_links going forward.
  // Keep existing array intact for one release so older clients still resolve.
  // The built-in demo is never written back; the attachment map above is enough.
  if (isBuiltInDemo(lesson)) return lesson;
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
  const local = ensureLibrary(readLocal(), userId);
  writeLocal(local);
  const hubIds = buildHubSlidesDecks().map((h) => h.id);
  writeLibraryLinks(userId, [...readLibraryLinks(userId), ...hubIds]);
}
