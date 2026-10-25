/**
 * Nest learning-objective sets for Settings → Learning objectives:
 * Key stage (EYFS…KS5) → Subject (Drama, Dance, Music, Art, …) → sets.
 * "Other" is only for sets that match no key stage.
 */
import {
  DEFAULT_YEAR_GROUP_SECTION_LABELS,
  getDefaultSectionIdForYearGroup,
  normalizeYearGroupToken,
  resolveYearGroupFromToken,
  type YearGroupLike,
  type YearGroupSectionLike,
} from './yearGroupSectionOrder.ts';

export type ObjectiveSetLike = {
  id: string;
  name: string;
  linked_year_groups?: string[] | null;
};

export type ObjectiveSubjectFolder<T extends ObjectiveSetLike> = {
  id: string;
  label: string;
  items: T[];
};

export type ObjectiveKeyStageFolder<T extends ObjectiveSetLike> = {
  id: string;
  label: string;
  subjects: ObjectiveSubjectFolder<T>[];
  /** Flat count of sets under this key stage (all subjects). */
  itemCount: number;
};

/** Known subjects shown as nested folders (order preserved). */
export const OBJECTIVE_SUBJECT_LABELS = [
  'Drama',
  'Dance',
  'Music',
  'Art',
  'PE',
  'English',
  'Maths',
  'Science',
] as const;

const SUBJECT_PATTERN = new RegExp(
  `\\b(${OBJECTIVE_SUBJECT_LABELS.map((s) => s.replace(/\s+/g, '\\s+')).join('|')})\\b`,
  'i',
);

const KS_LABEL_BY_ID: Record<string, string> = Object.fromEntries(
  DEFAULT_YEAR_GROUP_SECTION_LABELS.map((s) => [s.id, s.label]),
);

export function inferObjectiveSetSubject(name: string): string {
  const m = (name || '').match(SUBJECT_PATTERN);
  if (!m) return 'General';
  const hit = m[1];
  const canonical = OBJECTIVE_SUBJECT_LABELS.find(
    (s) => s.toLowerCase() === hit.toLowerCase(),
  );
  return canonical || 'General';
}

/**
 * Resolve key-stage id for an objective set:
 * 1) linked class year groups mapped via Settings sections (majority wins)
 * 2) name/id pattern (EYFS Early Learning Goals → eyfs, Year 7 Drama → ks3)
 * 3) other
 */
export function inferObjectiveSetKeyStageId(
  set: ObjectiveSetLike,
  options: {
    sections: YearGroupSectionLike[];
    customYearGroups: YearGroupLike[];
    /** Map linked class name/id → section label (EYFS, KS1, …). */
    sectionLabelByLinkedName?: Map<string, string>;
  },
): string {
  const linked = set.linked_year_groups || [];
  const counts = new Map<string, number>();

  if (options.sectionLabelByLinkedName && linked.length > 0) {
    linked.forEach((name) => {
      const label = options.sectionLabelByLinkedName!.get(normalizeYearGroupToken(name));
      if (!label) return;
      const id =
        DEFAULT_YEAR_GROUP_SECTION_LABELS.find((s) => s.label === label)?.id ||
        normalizeYearGroupToken(label);
      if (id === 'other') return;
      counts.set(id, (counts.get(id) || 0) + 1);
    });
  }

  // Also resolve linked tokens through Settings section membership.
  if (linked.length > 0 && options.sections.length > 0) {
    linked.forEach((token) => {
      const group = resolveYearGroupFromToken(options.customYearGroups, token);
      if (!group) return;
      for (const section of options.sections) {
        if (section.id === 'other') continue;
        const ids = section.yearGroupIds || [];
        const hit = ids.some((t) => {
          const resolved = resolveYearGroupFromToken(options.customYearGroups, t);
          return (
            normalizeYearGroupToken(t) === normalizeYearGroupToken(group.id) ||
            normalizeYearGroupToken(t) === normalizeYearGroupToken(group.name) ||
            (resolved && resolved.id === group.id)
          );
        });
        if (hit) counts.set(section.id, (counts.get(section.id) || 0) + 1);
      }
    });
  }

  if (counts.size > 0) {
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  return getDefaultSectionIdForYearGroup(set.id, set.name);
}

export function buildObjectiveSetFolderTree<T extends ObjectiveSetLike>(
  sets: T[],
  options: {
    sections?: YearGroupSectionLike[] | null;
    customYearGroups?: YearGroupLike[] | null;
    sectionLabelByLinkedName?: Map<string, string>;
  } = {},
): ObjectiveKeyStageFolder<T>[] {
  const sections =
    options.sections && options.sections.length > 0
      ? [...options.sections].sort((a, b) => a.sortOrder - b.sortOrder)
      : DEFAULT_YEAR_GROUP_SECTION_LABELS.map((s) => ({
          id: s.id,
          label: s.label,
          sortOrder: s.sortOrder,
          yearGroupIds: [] as string[],
        }));

  const customYearGroups = options.customYearGroups || [];
  const byKs = new Map<string, Map<string, T[]>>();

  const ensureKs = (id: string) => {
    if (!byKs.has(id)) byKs.set(id, new Map());
    return byKs.get(id)!;
  };

  sets.forEach((set) => {
    const ksId = inferObjectiveSetKeyStageId(set, {
      sections,
      customYearGroups,
      sectionLabelByLinkedName: options.sectionLabelByLinkedName,
    });
    const subject = inferObjectiveSetSubject(set.name);
    const subjects = ensureKs(ksId);
    const list = subjects.get(subject) || [];
    list.push(set);
    subjects.set(subject, list);
  });

  const subjectSort = (a: string, b: string) => {
    if (a === 'General' && b !== 'General') return 1;
    if (b === 'General' && a !== 'General') return -1;
    const ia = OBJECTIVE_SUBJECT_LABELS.indexOf(a as (typeof OBJECTIVE_SUBJECT_LABELS)[number]);
    const ib = OBJECTIVE_SUBJECT_LABELS.indexOf(b as (typeof OBJECTIVE_SUBJECT_LABELS)[number]);
    if (ia >= 0 && ib >= 0) return ia - ib;
    if (ia >= 0) return -1;
    if (ib >= 0) return 1;
    return a.localeCompare(b);
  };

  const orderedIds = [
    ...sections.map((s) => s.id),
    ...[...byKs.keys()].filter((id) => !sections.some((s) => s.id === id)),
  ];

  const folders: ObjectiveKeyStageFolder<T>[] = [];
  for (const ksId of orderedIds) {
    const subjectMap = byKs.get(ksId);
    if (!subjectMap || subjectMap.size === 0) continue;
    const sectionMeta = sections.find((s) => s.id === ksId);
    const label = sectionMeta?.label || KS_LABEL_BY_ID[ksId] || ksId.toUpperCase();
    const subjects: ObjectiveSubjectFolder<T>[] = [...subjectMap.keys()]
      .sort(subjectSort)
      .map((subjectLabel) => ({
        id: `${ksId}::${subjectLabel}`,
        label: subjectLabel,
        items: subjectMap.get(subjectLabel) || [],
      }));
    folders.push({
      id: ksId,
      label,
      subjects,
      itemCount: subjects.reduce((n, s) => n + s.items.length, 0),
    });
  }

  return folders;
}
