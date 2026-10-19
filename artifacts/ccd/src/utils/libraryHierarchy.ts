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

  // Drama
  'drama games': { subject: 'Drama', keyStage: 'ks1' },
  'ks1 drama': { subject: 'Drama', keyStage: 'ks1' },

  // Vocal warm-ups (Music)
  'vocal warmups': { subject: 'Music', keyStage: 'ks2' },
  'vocal warm-ups': { subject: 'Music', keyStage: 'ks2' },
  'vocal warmup': { subject: 'Music', keyStage: 'ks2' },
  'physical starters': { subject: 'Music', keyStage: 'ks2' },
  'breathing exercises': { subject: 'Music', keyStage: 'ks2' },
  'facial warm-ups / diction': { subject: 'Music', keyStage: 'ks2' },
  'facial warm ups / diction': { subject: 'Music', keyStage: 'ks2' },
  'pitch exercises': { subject: 'Music', keyStage: 'ks2' },

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
  const fromGroupsSubject = groups.find((g) => isLibrarySubject(g));

  const subject: LibrarySubject =
    (fromGroupsSubject as LibrarySubject | undefined) ||
    (isLibrarySubject(category.group) ? (category.group as LibrarySubject) : null) ||
    inferSubjectFromCategoryName(category.name) ||
    'Music';

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

/**
 * Nest flat category activity groups into key stage → subject → category.
 */
export function buildLibraryHierarchyTree<T>(
  categoryGroups: { name: string; activities: T[] }[],
  categoryMetaByName: Map<string, CategoryHierarchyMeta>,
  viewerKeyStage?: LibraryKeyStageId | null,
): HierarchyNode[] {
  type CatBucket = { name: string; activities: T[]; count: number };
  const tree = new Map<
    LibraryKeyStageId,
    Map<LibrarySubject, Map<string, CatBucket>>
  >();

  for (const group of categoryGroups) {
    const meta = categoryMetaByName.get(group.name) || { name: group.name };
    const { keyStage, subject } = resolveCategoryHierarchy(meta, viewerKeyStage);
    if (!tree.has(keyStage)) tree.set(keyStage, new Map());
    const bySubject = tree.get(keyStage)!;
    if (!bySubject.has(subject)) bySubject.set(subject, new Map());
    const byCat = bySubject.get(subject)!;
    byCat.set(group.name, {
      name: group.name,
      activities: group.activities,
      count: group.activities.length,
    });
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
    // Any unexpected subjects
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
