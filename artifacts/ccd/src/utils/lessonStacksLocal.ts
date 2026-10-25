/**
 * Lesson stacks (schemes of work / units): pure helpers shared by
 * `config/lessonStacksApi.ts` and `hooks/useLessonStacks.ts`.
 *
 * Why this exists: a stack whose Supabase insert failed used to live only in
 * React state (plus an unscoped `lesson-stacks` cache that was never read
 * back), so it vanished on leaving the Lessons page or reloading, and
 * Half-terms › Add scheme never saw it. Failed saves are now kept in a
 * per-user, per-organisation localStorage list (LOCAL FALLBACK — this device
 * only) and retried against Supabase on the next load.
 *
 * No React or Supabase imports here so node tests can load it directly.
 */

export interface LessonStackLike {
  id: string;
  name: string;
  description?: string;
  color: string;
  lessons: string[];
  totalTime: number;
  totalActivities: number;
  customObjectives?: string[];
  curriculumType?: 'EYFS' | 'CUSTOM';
  created_at: string;
  /** Saved on this device only (Supabase save failed); retried on next load. */
  localOnly?: boolean;
  /** 'unit' = read-only view of a My units entry (localStorage `units-<class>`). */
  source?: 'stack' | 'unit';
  /** Class/sheet a My units entry belongs to. */
  classSheet?: string;
}

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> & {
  readonly length?: number;
  key?: (index: number) => string | null;
};

export const LOCAL_STACKS_PREFIX = 'ccd-lesson-stacks-local:v1:';

/** One list per signed-in user and organisation, so stacks never leak across accounts on a shared browser. */
export function localStacksKey(userId: string | null | undefined, orgId: string | null | undefined): string {
  const u = (userId || '').trim() || 'anon';
  const o = (orgId || '').trim() || 'no-org';
  return `${LOCAL_STACKS_PREFIX}${o}:${u}`;
}

function isStackLike(v: unknown): v is LessonStackLike {
  if (!v || typeof v !== 'object') return false;
  const s = v as Record<string, unknown>;
  return typeof s.id === 'string' && !!s.id && typeof s.name === 'string' && Array.isArray(s.lessons);
}

export function readLocalStacks(storage: StorageLike | null | undefined, key: string): LessonStackLike[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStackLike).map((s) => ({
      ...s,
      lessons: s.lessons.map(String),
      totalTime: Number(s.totalTime) || 0,
      totalActivities: Number(s.totalActivities) || 0,
      localOnly: true,
      source: 'stack' as const,
    }));
  } catch {
    return [];
  }
}

export function writeLocalStacks(storage: StorageLike | null | undefined, key: string, stacks: LessonStackLike[]): void {
  if (!storage) return;
  try {
    const rows = stacks.filter((s) => s.source !== 'unit');
    if (rows.length === 0) storage.removeItem(key);
    else storage.setItem(key, JSON.stringify(rows.map((s) => ({ ...s, localOnly: true }))));
  } catch {
    /* quota or private mode: nothing else we can do */
  }
}

/** Server rows first; local-only rows added when the server does not already have that id. */
export function mergeStacks(remote: LessonStackLike[], local: LessonStackLike[]): LessonStackLike[] {
  const seen = new Set(remote.map((s) => s.id));
  const merged: LessonStackLike[] = remote.map((s) => ({ ...s, localOnly: false, source: 'stack' as const }));
  for (const s of local) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    merged.push({ ...s, localOnly: true, source: 'stack' });
  }
  return merged;
}

/**
 * PostgREST "column not in schema cache" (PGRST204) or Postgres undefined_column (42703).
 * Returns the missing column name when it can be read from the message.
 */
export function missingColumnFromError(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null;
  const e = err as { code?: string; message?: string };
  const msg = String(e.message || '');
  if (e.code !== 'PGRST204' && e.code !== '42703' && !/column/i.test(msg)) return null;
  const m =
    /Could not find the '([^']+)' column/i.exec(msg) ||
    /column "?([a-z_][a-z0-9_]*)"? (?:of relation "[^"]+" )?does not exist/i.exec(msg);
  return m ? m[1] : null;
}

/** Columns the app can safely drop when an older database does not have them yet. */
export const OPTIONAL_STACK_COLUMNS = [
  'custom_objectives',
  'curriculum_type',
  'user_id',
  'organisation_id',
  'description',
] as const;

export function newStackId(now = Date.now(), rand = Math.random): string {
  return `stack-${now}-${rand().toString(36).slice(2, 11)}`;
}

export interface StackDbRow {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  lessons?: unknown;
  total_time?: number | null;
  total_activities?: number | null;
  custom_objectives?: string[] | null;
  curriculum_type?: string | null;
  organisation_id?: string | null;
  user_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  data?: Record<string, unknown> | null;
}

export function stackFromDbRow(row: StackDbRow): LessonStackLike {
  const data = (row.data && typeof row.data === 'object' ? row.data : {}) as Record<string, unknown>;
  const lessonsRaw = Array.isArray(row.lessons) ? row.lessons : Array.isArray(data.lessons) ? data.lessons : [];
  return {
    id: row.id,
    name: row.name ?? String(data.name ?? ''),
    description: row.description ?? (data.description as string | undefined) ?? '',
    color: row.color ?? (data.color as string | undefined) ?? '#4338E8',
    lessons: (lessonsRaw as unknown[]).map(String),
    totalTime: Number(row.total_time ?? data.totalTime ?? 0) || 0,
    totalActivities: Number(row.total_activities ?? data.totalActivities ?? 0) || 0,
    customObjectives: (row.custom_objectives ?? (data.customObjectives as string[] | undefined)) || [],
    curriculumType: (row.curriculum_type ?? data.curriculumType ?? undefined) as LessonStackLike['curriculumType'],
    created_at: row.created_at || new Date().toISOString(),
    localOnly: false,
    source: 'stack',
  };
}

export function stackToDbRow(
  stack: Omit<LessonStackLike, 'created_at'> & { created_at?: string },
  scope: { organisationId?: string | null; userId?: string | null },
  nowIso = new Date().toISOString(),
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    id: stack.id,
    name: stack.name,
    description: stack.description ?? '',
    color: stack.color,
    lessons: stack.lessons,
    total_time: stack.totalTime,
    total_activities: stack.totalActivities,
    custom_objectives: stack.customObjectives || [],
    curriculum_type: stack.curriculumType ?? null,
    created_at: stack.created_at || nowIso,
    updated_at: nowIso,
  };
  if (scope.organisationId) row.organisation_id = scope.organisationId;
  if (scope.userId) row.user_id = scope.userId;
  return row;
}

/** Drop a column the database reported missing; null when it is not safe to drop. */
export function dropMissingColumn(row: Record<string, unknown>, err: unknown): Record<string, unknown> | null {
  const col = missingColumnFromError(err);
  if (!col || !(OPTIONAL_STACK_COLUMNS as readonly string[]).includes(col) || !(col in row)) return null;
  const next = { ...row };
  delete next[col];
  return next;
}

/** My units (localStorage `units-<class>`) shown as read-only schemes in Half-terms › Add scheme. */
export interface UnitLike {
  id: string;
  name: string;
  description?: string;
  lessonNumbers?: string[];
  color?: string;
  classSheet?: string;
  createdAt?: string | Date;
}

function safeIso(v: unknown): string {
  const d = v ? new Date(v as string) : new Date(0);
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
}

export function unitsAsSchemes(storage: StorageLike | null | undefined): LessonStackLike[] {
  if (!storage || typeof storage.key !== 'function') return [];
  const out: LessonStackLike[] = [];
  const seen = new Set<string>();
  const len = Number(storage.length) || 0;
  for (let i = 0; i < len; i++) {
    const key = storage.key(i);
    if (!key || !key.startsWith('units-')) continue;
    const sheet = key.slice('units-'.length);
    let parsed: unknown;
    try {
      parsed = JSON.parse(storage.getItem(key) || '[]');
    } catch {
      continue;
    }
    if (!Array.isArray(parsed)) continue;
    for (const u of parsed as UnitLike[]) {
      if (!u || typeof u.id !== 'string' || typeof u.name !== 'string' || seen.has(u.id)) continue;
      seen.add(u.id);
      const lessons = Array.isArray(u.lessonNumbers) ? u.lessonNumbers.map(String) : [];
      out.push({
        id: u.id,
        name: u.name,
        description: u.description || 'My unit',
        color: u.color || '#4338E8',
        lessons,
        totalTime: 0,
        totalActivities: 0,
        created_at: safeIso(u.createdAt),
        source: 'unit',
        classSheet: u.classSheet || sheet,
      });
    }
  }
  return out;
}
