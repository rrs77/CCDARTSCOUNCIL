import type { InteractiveLesson } from '../types';

/** Built-in demo deck: same for every user, cannot be deleted, edited or overwritten. */
export const DEMO_LESSON_ID = 'demo-interactive-lesson';
export const DEMO_INTRO_SCENE_ID = 'demo-scene-intro';
/** 1080p faststart H.264 re-encode of the CCDesigner logo sting (4K original kept alongside). */
export const DEMO_INTRO_VIDEO = '/interactive-lessons/ccdesigner-intro-1080.mp4';
/** Real length of the sting file (8.067s). */
export const DEMO_INTRO_DURATION_MS = 8067;

export function isBuiltInDemoId(id: string | null | undefined): boolean {
  return id === DEMO_LESSON_ID;
}

export function isBuiltInDemo(lesson: Pick<InteractiveLesson, 'id' | 'isDemo'> | null | undefined): boolean {
  return Boolean(lesson && (lesson.id === DEMO_LESSON_ID || lesson.isDemo));
}

/**
 * Force scene 0 to be the canonical intro sting. Any stale / edited intro scene
 * anywhere in the deck is removed and replaced with the code's version.
 * Used for the built-in demo and for user copies made from it.
 */
export function ensureDemoIntro<T extends Pick<InteractiveLesson, 'scenes'>>(
  lesson: T,
  canonicalIntro: InteractiveLesson['scenes'][number],
): T {
  const rest = (lesson.scenes || []).filter((s) => s.id !== DEMO_INTRO_SCENE_ID);
  return { ...lesson, scenes: [structuredClone(canonicalIntro), ...rest] };
}
