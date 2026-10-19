/**
 * Activity Library hierarchy: Key Stage → Subject → Category (leaf).
 *
 * Leaf categories keep their names/colours. Hierarchy metadata lives on
 * `Category.groups` as `[keyStageId, subject]` and `Category.group` as the
 * subject (Settings folder). Display can also fall back to name heuristics
 * and the currently selected class key stage.
 */

export type LibraryKeyStageId = 'eyfs' | 'ks1' | 'ks2' | 'ks3' | 'ks4' | 'ks5';

export type LibrarySubject =
  | 'Music'
  | 'Drama'
  | 'Dance'
  | 'Art'
  | 'Photography';

export const LIBRARY_KEY_STAGES: {
  id: LibraryKeyStageId;
  label: string;
  sortOrder: number;
}[] = [
  { id: 'eyfs', label: 'EYFS', sortOrder: 0 },
  { id: 'ks1', label: 'KS1', sortOrder: 1 },
  { id: 'ks2', label: 'KS2', sortOrder: 2 },
  { id: 'ks3', label: 'KS3', sortOrder: 3 },
  { id: 'ks4', label: 'KS4 (GCSE)', sortOrder: 4 },
  { id: 'ks5', label: 'KS5 (A level)', sortOrder: 5 },
];

export const LIBRARY_SUBJECTS: LibrarySubject[] = [
  'Music',
  'Drama',
  'Dance',
  'Art',
  'Photography',
];

/** Subjects offered at each key stage (Photography from KS4). */
export function subjectsForKeyStage(ks: LibraryKeyStageId): LibrarySubject[] {
  if (ks === 'ks4' || ks === 'ks5') {
    return ['Music', 'Drama', 'Dance', 'Art', 'Photography'];
  }
  return ['Music', 'Drama', 'Dance', 'Art'];
}

export function keyStageLabel(id: string): string {
  return LIBRARY_KEY_STAGES.find((k) => k.id === id)?.label ?? id.toUpperCase();
}

export function isLibraryKeyStageId(value: string | undefined | null): value is LibraryKeyStageId {
  return LIBRARY_KEY_STAGES.some((k) => k.id === value);
}

export function isLibrarySubject(value: string | undefined | null): value is LibrarySubject {
  return LIBRARY_SUBJECTS.includes(value as LibrarySubject);
}

const SUBJECT_COLORS: Record<LibrarySubject, string> = {
  Music: '#14B8A6',
  Drama: '#8B5CF6',
  Dance: '#EC4899',
  Art: '#F59E0B',
  Photography: '#6366F1',
};

export function subjectColor(subject: LibrarySubject): string {
  return SUBJECT_COLORS[subject];
}

/**
 * Known leaf category → default subject (+ optional home key stage when the
 * category is historically EYFS/primary-only). Display still prefers the
 * viewing class key stage when available.
 */
const CATEGORY_PLACEMENT: Record<
  string,
  { subject: LibrarySubject; keyStage?: LibraryKeyStageId }
> = {
  // EYFS / early primary music
  welcome: { subject: 'Music', keyStage: 'eyfs' },
  goodbye: { subject: 'Music', keyStage: 'eyfs' },
  'kodaly songs': { subject: 'Music', keyStage: 'eyfs' },
  'kodaly action songs': { subject: 'Music', keyStage: 'eyfs' },
  'action/games songs': { subject: 'Music', keyStage: 'eyfs' },
  'rhythm sticks': { subject: 'Music', keyStage: 'eyfs' },
  'scarf songs': { subject: 'Music', keyStage: 'eyfs' },
  'general game': { subject: 'Music', keyStage: 'eyfs' },
  'core songs': { subject: 'Music', keyStage: 'eyfs' },
  'parachute games': { subject: 'Music', keyStage: 'eyfs' },
  'percussion games': { subject: 'Music', keyStage: 'eyfs' },
  'teaching units': { subject: 'Music', keyStage: 'eyfs' },
  'kodaly rhythms': { subject: 'Music', keyStage: 'eyfs' },
  'kodaly games': { subject: 'Music', keyStage: 'eyfs' },
  'iwb games': { subject: 'Music', keyStage: 'eyfs' },
  hello: { subject: 'Music', keyStage: 'eyfs' },
  'bubble songs': { subject: 'Music', keyStage: 'eyfs' },
  songs: { subject: 'Music', keyStage: 'eyfs' },
  rhythm: { subject: 'Music', keyStage: 'ks1' },
  singing: { subject: 'Music', keyStage: 'ks1' },
  'ks2 songs': { subject: 'Music', keyStage: 'ks2' },

  // Drama — multi-stage; per-activity year-group tags decide filing
  'drama games': { subject: 'Drama' },
  'ks1 drama': { subject: 'Drama', keyStage: 'ks1' },

  // Vocal warm-ups (Music) — multi-stage via tags / "All"
  'vocal warmups': { subject: 'Music' },
  'vocal warm-ups': { subject: 'Music' },
  'vocal warmup': { subject: 'Music' },
  'physical starters': { subject: 'Music' },
  'breathing exercises': { subject: 'Music' },
  'facial warm-ups / diction': { subject: 'Music' },
  'facial warm ups / diction': { subject: 'Music' },
  'pitch exercises': { subject: 'Music' },

  // OCR Film / Computer Music (KS4)
  'film/computer music — listen': { subject: 'Music', keyStage: 'ks4' },
  'film/computer music — technology': { subject: 'Music', keyStage: 'ks4' },
  'film/computer music — compose': { subject: 'Music', keyStage: 'ks4' },
  'film/computer music — evaluate': { subject: 'Music', keyStage: 'ks4' },
  'film and computer game music': { subject: 'Music', keyStage: 'ks4' },
};

function normalizeKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function inferSubjectFromCategoryName(categoryName: string): LibrarySubject | null {
  const n = normalizeKey(categoryName);
  if (CATEGORY_PLACEMENT[n]) return CATEGORY_PLACEMENT[n].subject;
  if (n.includes('photograph')) return 'Photography';
  if (n.includes('drama') || n.includes('theatre') || n.includes('devis')) return 'Drama';
  if (n.includes('dance') || n.includes('choreograph')) return 'Dance';
  if (n.includes('art') || n.includes('drawing') || n.includes('paint') || n.includes('printmak'))
    return 'Art';
  if (
    n.includes('music') ||
    n.includes('song') ||
    n.includes('vocal') ||
    n.includes('kodaly') ||
    n.includes('rhythm') ||
    n.includes('pitch') ||
    n.includes('breathing') ||
    n.includes('percussion') ||
    n.includes('film/computer')
  ) {
    return 'Music';
  }
  return null;
}

export function inferKeyStageFromCategoryName(categoryName: string): LibraryKeyStageId | null {
  const n = normalizeKey(categoryName);
  if (CATEGORY_PLACEMENT[n]?.keyStage) return CATEGORY_PLACEMENT[n].keyStage!;
  if (/\bks5\b|a[\s-]?level/.test(n)) return 'ks5';
  if (/\bks4\b|gcse|film\/computer/.test(n)) return 'ks4';
  if (/\bks3\b/.test(n)) return 'ks3';
  if (/\bks2\b/.test(n)) return 'ks2';
  if (/\bks1\b/.test(n)) return 'ks1';
  if (/\beyfs\b|reception|kindergarten|scarf|parachute|bubble songs/.test(n)) return 'eyfs';
  return null;
}

export interface CategoryHierarchyMeta {
  name: string;
  group?: string | null;
  groups?: string[] | null;
}

/** Map a single year-group / level tag to a key stage (or null). */
export function keyStageFromYearGroupTag(tag: string): LibraryKeyStageId | null {
  const lower = String(tag || '').trim().toLowerCase();
  if (!lower || lower === 'all') return null;

  if (
    /\b(lkg|ukg)\b/.test(lower) ||
    lower.includes('lower kindergarten') ||
    lower.includes('upper kindergarten') ||
    /\breception\b/.test(lower) ||
    /\beyfs\b/.test(lower) ||
    lower.includes('early years')
  ) {
    return 'eyfs';
  }

  if (/\b(gcse|ks4|key stage 4)\b/.test(lower)) return 'ks4';
  if (/\b(a[\s-]?level|ks5|key stage 5|sixth form)\b/.test(lower)) return 'ks5';
  if (/\b(ks3|key stage 3)\b/.test(lower)) return 'ks3';
  if (/\b(ks2|key stage 2)\b/.test(lower)) return 'ks2';
  if (/\b(ks1|key stage 1)\b/.test(lower)) return 'ks1';

  const yearMatch = lower.match(/\byear\s*(\d{1,2})\b/) || lower.match(/\by(\d{1,2})\b/);
  if (yearMatch) {
    const y = Number(yearMatch[1]);
    if (y === 1 || y === 2) return 'ks1';
    if (y >= 3 && y <= 6) return 'ks2';
    if (y >= 7 && y <= 9) return 'ks3';
    if (y === 10 || y === 11) return 'ks4';
    if (y >= 12 && y <= 14) return 'ks5';
  }

  return null;
}

/**
 * Key stages implied by an activity's year-group tags (and optional level).
 * "All" / empty → empty array (caller falls back to category defaults).
 */
export function keyStagesFromActivityTags(
  yearGroups: unknown,
  level?: string | null,
): LibraryKeyStageId[] {
  const tags = Array.isArray(yearGroups)
    ? yearGroups.map((t) => String(t || '').trim()).filter(Boolean)
    : [];
  const stages = new Set<LibraryKeyStageId>();
  const hasAll = tags.some((t) => t.toLowerCase() === 'all');
  if (!hasAll) {
    for (const tag of tags) {
      const ks = keyStageFromYearGroupTag(tag);
      if (ks) stages.add(ks);
    }
  }
  if (stages.size === 0 && level) {
    const fromLevel = keyStageFromYearGroupTag(level);
    if (fromLevel) stages.add(fromLevel);
  }
  return LIBRARY_KEY_STAGES.map((k) => k.id).filter((id) => stages.has(id));
}

/** Default stages when an activity is tagged All / untagged, by subject category. */
export function defaultKeyStagesForCategory(categoryName: string): LibraryKeyStageId[] {
  const n = normalizeKey(categoryName);
  if (n.includes('drama games') || n === 'drama games') return ['eyfs', 'ks1', 'ks2'];
  if (
    n.includes('vocal') ||
    n.includes('breathing') ||
    n.includes('physical starters') ||
    n.includes('facial') ||
    n.includes('pitch exercises')
  ) {
    return ['ks1', 'ks2', 'ks3'];
  }
  const single = inferKeyStageFromCategoryName(categoryName);
  return single ? [single] : ['eyfs'];
}

/**
 * Resolve subject for a leaf category (key stage comes from activity tags).
 */
export function resolveCategorySubject(category: CategoryHierarchyMeta): LibrarySubject {
  const groups = Array.isArray(category.groups) ? category.groups.filter(Boolean) : [];
  const fromGroupsSubject = groups.find((g) => isLibrarySubject(g));
  return (
    (fromGroupsSubject as LibrarySubject | undefined) ||
    (isLibrarySubject(category.group) ? (category.group as LibrarySubject) : null) ||
    inferSubjectFromCategoryName(category.name) ||
    'Music'
  );
}

/**
 * Resolve key stage + subject for a leaf category.
 * Prefer explicit `groups` metadata, then `group` as subject, then name heuristics.
 * When `viewerKeyStage` is set (class selected), it wins for the key-stage heading
 * so multi-stage folders (e.g. Vocal Warm-Ups) nest under the class stage.
 */
export function resolveCategoryHierarchy(
  category: CategoryHierarchyMeta,
  viewerKeyStage?: LibraryKeyStageId | null,
): { keyStage: LibraryKeyStageId; subject: LibrarySubject } {
  const groups = Array.isArray(category.groups) ? category.groups.filter(Boolean) : [];
  const fromGroupsKs = groups.find((g) => isLibraryKeyStageId(g.toLowerCase()));
  const subject = resolveCategorySubject(category);

  const metaKs = fromGroupsKs
    ? (fromGroupsKs.toLowerCase() as LibraryKeyStageId)
    : inferKeyStageFromCategoryName(category.name);

  const keyStage: LibraryKeyStageId =
    viewerKeyStage && viewerKeyStage !== ('other' as LibraryKeyStageId)
      ? viewerKeyStage
      : metaKs || 'eyfs';

  // Photography only from KS4 — bump if misplaced
  if (subject === 'Photography' && (keyStage === 'eyfs' || keyStage === 'ks1' || keyStage === 'ks2' || keyStage === 'ks3')) {
    return { keyStage: viewerKeyStage && (viewerKeyStage === 'ks4' || viewerKeyStage === 'ks5') ? viewerKeyStage : 'ks4', subject };
  }

  return { keyStage, subject };
}

export interface HierarchyNode {
  keyStageId: LibraryKeyStageId;
  keyStageLabel: string;
  subjects: {
    subject: LibrarySubject;
    categories: {
      name: string;
      activities: unknown[];
      count: number;
    }[];
    count: number;
  }[];
  count: number;
}

type ActivityLike = {
  yearGroups?: unknown;
  yeargroups?: unknown;
  level?: string | null;
};

function activityYearGroupTags(activity: ActivityLike): unknown {
  return activity.yearGroups ?? activity.yeargroups;
}

/**
 * Nest activities into key stage → subject → category.
 *
 * Each activity is filed under every key stage implied by its year-group tags
 * (or category defaults when tags are All/empty). When a class is selected,
 * `viewerKeyStage` limits filing to that stage so the tree matches the filter.
 */
export function buildLibraryHierarchyTree<T extends ActivityLike>(
  categoryGroups: { name: string; activities: T[] }[],
  categoryMetaByName: Map<string, CategoryHierarchyMeta>,
  viewerKeyStage?: LibraryKeyStageId | null,
): HierarchyNode[] {
  type CatBucket = { name: string; activities: T[]; count: number };
  const tree = new Map<
    LibraryKeyStageId,
    Map<LibrarySubject, Map<string, CatBucket>>
  >();

  const ensureBucket = (ks: LibraryKeyStageId, subject: LibrarySubject, catName: string) => {
    if (!tree.has(ks)) tree.set(ks, new Map());
    const bySubject = tree.get(ks)!;
    if (!bySubject.has(subject)) bySubject.set(subject, new Map());
    const byCat = bySubject.get(subject)!;
    if (!byCat.has(catName)) {
      byCat.set(catName, { name: catName, activities: [], count: 0 });
    }
    return byCat.get(catName)!;
  };

  for (const group of categoryGroups) {
    const meta = categoryMetaByName.get(group.name) || { name: group.name };
    const subject = resolveCategorySubject(meta);

    for (const activity of group.activities) {
      let stages = keyStagesFromActivityTags(activityYearGroupTags(activity), activity.level);
      if (stages.length === 0) {
        stages = defaultKeyStagesForCategory(group.name);
      }
      // Category metadata may list additional stages (e.g. groups: eyfs, ks1, ks2, Drama)
      const metaStages = (meta.groups || [])
        .map((g) => g.toLowerCase())
        .filter((g): g is LibraryKeyStageId => isLibraryKeyStageId(g));
      if (metaStages.length > 0 && stages.length === 0) {
        stages = metaStages;
      }

      if (viewerKeyStage && isLibraryKeyStageId(viewerKeyStage)) {
        // Class selected: only show under that stage (activities already filtered).
        // Still require the activity to be plausible for this stage when tags are specific.
        const tagged = keyStagesFromActivityTags(activityYearGroupTags(activity), activity.level);
        if (tagged.length > 0 && !tagged.includes(viewerKeyStage)) {
          // Tagged for other stages only — skip under this viewer (shouldn't normally appear).
          continue;
        }
        stages = [viewerKeyStage];
      }

      let effectiveSubject = subject;
      if (
        effectiveSubject === 'Photography' &&
        stages.every((s) => s === 'eyfs' || s === 'ks1' || s === 'ks2' || s === 'ks3')
      ) {
        stages = stages.map(() => 'ks4' as LibraryKeyStageId);
        stages = [...new Set(stages)];
      }

      for (const ks of stages) {
        if (effectiveSubject === 'Photography' && (ks === 'eyfs' || ks === 'ks1' || ks === 'ks2' || ks === 'ks3')) {
          continue;
        }
        const bucket = ensureBucket(ks, effectiveSubject, group.name);
        bucket.activities.push(activity);
        bucket.count = bucket.activities.length;
      }
    }
  }

  const nodes: HierarchyNode[] = [];
  for (const ks of LIBRARY_KEY_STAGES) {
    const bySubject = tree.get(ks.id);
    if (!bySubject || bySubject.size === 0) continue;
    const subjects = subjectsForKeyStage(ks.id)
      .filter((s) => bySubject.has(s))
      .map((subject) => {
        const cats = [...bySubject.get(subject)!.values()].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        const count = cats.reduce((sum, c) => sum + c.count, 0);
        return { subject, categories: cats, count };
      });
    for (const [subject, catMap] of bySubject) {
      if (subjects.some((s) => s.subject === subject)) continue;
      const cats = [...catMap.values()].sort((a, b) => a.name.localeCompare(b.name));
      subjects.push({
        subject,
        categories: cats,
        count: cats.reduce((sum, c) => sum + c.count, 0),
      });
    }
    const count = subjects.reduce((sum, s) => sum + s.count, 0);
    nodes.push({
      keyStageId: ks.id,
      keyStageLabel: ks.label,
      subjects,
      count,
    });
  }
  return nodes;
}

const EXPANDED_SESSION_KEY = 'ccd-library-hierarchy-expanded';

export function loadExpandedHierarchyKeys(): Set<string> {
  try {
    const raw = sessionStorage.getItem(EXPANDED_SESSION_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed.map(String));
  } catch {
    /* ignore */
  }
  return new Set();
}

export function saveExpandedHierarchyKeys(keys: Set<string>): void {
  try {
    sessionStorage.setItem(EXPANDED_SESSION_KEY, JSON.stringify([...keys]));
  } catch {
    /* ignore */
  }
}

export function hierarchyKeyStageKey(ksId: string): string {
  return `ks:${ksId}`;
}

export function hierarchySubjectKey(ksId: string, subject: string): string {
  return `sub:${ksId}:${subject}`;
}

export function hierarchyCategoryKey(ksId: string, subject: string, category: string): string {
  return `cat:${ksId}:${subject}:${category}`;
}
