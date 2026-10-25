import React, { useMemo, type ReactNode } from 'react';
import { DataContext, useData } from '../../contexts/DataContext';

/**
 * Wraps a unit / half-term export so it sees the listed lessons without their saved
 * print header (customHeader). The shared print modal uses that header as every
 * lesson's title in multi-lesson exports, so without this each lesson in a unit was
 * titled with one stale header (e.g. "A2 Performance To Parents") instead of its own
 * title. Saved lesson data is not changed.
 */
export function ExportDataScope({
  lessonNumbers,
  children,
}: {
  lessonNumbers: string[];
  children: ReactNode;
}) {
  const ctx = useData();
  const key = lessonNumbers.join(',');
  const value = useMemo(() => {
    const src = ctx.allLessonsData || {};
    const scoped = { ...src };
    for (const n of lessonNumbers) {
      const lesson = src[n];
      if (lesson && lesson.customHeader) {
        scoped[n] = { ...lesson, customHeader: undefined };
      }
    }
    return { ...ctx, allLessonsData: scoped };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, key]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
