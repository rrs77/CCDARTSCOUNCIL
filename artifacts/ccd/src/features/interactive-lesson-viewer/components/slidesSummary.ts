import type { InteractiveLesson, InteractiveLessonSummary } from '../types';

/** Local summary helper for attach cards (mirrors store.toSummary fields we need). */
export function toSummary(lesson: InteractiveLesson): InteractiveLessonSummary {
  const first = lesson.scenes[0];
  const sceneTypes: InteractiveLesson['scenes'][number]['type'][] = [];
  for (const s of lesson.scenes) {
    if (!sceneTypes.includes(s.type)) sceneTypes.push(s.type);
  }
  const headline = first?.overlays?.find((o) => o.style === 'headline')?.text;
  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    status: lesson.status,
    ownerId: lesson.ownerId,
    sceneCount: lesson.scenes.length,
    updatedAt: lesson.updatedAt,
    isDemo: lesson.isDemo,
    source: lesson.source || (lesson.isDemo ? 'demo' : lesson.hubId ? 'hub' : 'user'),
    hubId: lesson.hubId,
    hubName: lesson.hubName,
    tags: lesson.tags,
    subject: lesson.subject,
    sceneTypes,
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
