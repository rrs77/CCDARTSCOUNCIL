import type { Activity, LessonData } from '../../contexts/DataContext';
import type { LessonSection, LessonSectionKind } from '../../types/lessonSections';

function uid(prefix = 'sec'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function textSection(
  kind: Exclude<LessonSectionKind, 'activity'>,
  title: string,
  body: string | undefined,
): LessonSection | null {
  const trimmed = (body || '').trim();
  if (!trimmed) return null;
  return {
    id: uid(kind),
    kind,
    title,
    bodyHtml: trimmed,
    lastWrittenBy: 'teacher',
  };
}

function orderedActivitiesFromLesson(lesson: LessonData): Activity[] {
  if (Array.isArray(lesson.orderedActivities) && lesson.orderedActivities.length > 0) {
    return lesson.orderedActivities;
  }
  const order = Array.isArray(lesson.categoryOrder) ? lesson.categoryOrder : Object.keys(lesson.grouped || {});
  const out: Activity[] = [];
  for (const cat of order) {
    const acts = lesson.grouped?.[cat];
    if (Array.isArray(acts)) out.push(...acts);
  }
  // Any categories not in categoryOrder
  for (const [cat, acts] of Object.entries(lesson.grouped || {})) {
    if (order.includes(cat)) continue;
    if (Array.isArray(acts)) out.push(...acts);
  }
  return out;
}

/**
 * Map a legacy LessonData into ordered sections without data loss.
 * Activity blocks first (canvas order), then known free-text plan fields.
 */
export function legacyLessonToSections(lesson: LessonData): LessonSection[] {
  if (Array.isArray((lesson as LessonData & { sections?: LessonSection[] }).sections)
    && (lesson as LessonData & { sections?: LessonSection[] }).sections!.length > 0) {
    return (lesson as LessonData & { sections: LessonSection[] }).sections;
  }

  const sections: LessonSection[] = [];

  const intro = textSection('free_text', 'Introduction', lesson.introduction);
  if (intro) sections.push(intro);

  for (const activity of orderedActivitiesFromLesson(lesson)) {
    sections.push({
      id: uid('activity'),
      kind: 'activity',
      title: activity.activity || 'Activity',
      bodyHtml: activity.description || activity.activityText || '',
      activity,
      durationMins: typeof activity.time === 'number' ? activity.time : undefined,
      lastWrittenBy: 'teacher',
    });
  }

  const main = textSection('free_text', 'Main activity', lesson.mainActivity);
  if (main) sections.push(main);

  const plenary = textSection('free_text', 'Plenary', lesson.plenary);
  if (plenary) sections.push(plenary);

  const vocab = textSection('vocabulary', 'Vocabulary', lesson.vocabulary);
  if (vocab) sections.push(vocab);

  const diff = textSection('differentiation', 'Differentiation', lesson.differentiation);
  if (diff) sections.push(diff);

  const afl = textSection('afl', 'Assessment for learning', lesson.assessment);
  if (afl) sections.push(afl);

  const resources = textSection('free_text', 'Resources', lesson.resources);
  if (resources) sections.push(resources);

  const keyQ = textSection('free_text', 'Key questions', lesson.keyQuestions);
  if (keyQ) sections.push(keyQ);

  return sections;
}

/** Ensure lesson has sections[] (mutates a shallow copy). */
export function ensureLessonSections<T extends LessonData>(lesson: T): T & { sections: LessonSection[] } {
  const existing = (lesson as T & { sections?: LessonSection[] }).sections;
  if (Array.isArray(existing) && existing.length > 0) {
    return { ...lesson, sections: existing };
  }
  return { ...lesson, sections: legacyLessonToSections(lesson) };
}
