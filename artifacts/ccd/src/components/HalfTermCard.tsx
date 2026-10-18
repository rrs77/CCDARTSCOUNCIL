import React from 'react';
import { BookOpen, ChevronRight, CheckCircle, Plus } from 'lucide-react';

interface HalfTermCardProps {
  id: string;
  name: string;
  months: string;
  color: string;
  lessonCount: number;
  stackCount?: number;
  onClick: () => void;
  isComplete: boolean;
  theme?: {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
  };
  onLessonClick?: (lessonNumber: string) => void;
  onLessonEdit?: (lessonNumber: string) => void;
  halfTerms?: Array<{ id: string; name: string; lessons: string[] }>;
}

/**
 * Compact half-term row — dense Studio Score control, not a large status card.
 */
export function HalfTermCard({
  name,
  months,
  color,
  lessonCount,
  stackCount = 0,
  onClick,
  isComplete,
}: HalfTermCardProps) {
  const empty = lessonCount === 0;
  const status = empty
    ? 'Add lessons'
    : `${lessonCount} lesson${lessonCount !== 1 ? 's' : ''}${
        stackCount > 0 ? ` · ${stackCount} stack${stackCount !== 1 ? 's' : ''}` : ''
      }`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-[#E2E0EF] bg-white px-3 py-2.5 text-left transition-colors hover:border-[#bcb7f4] hover:bg-[#F7F6FC]"
    >
      <span
        className="h-8 w-1.5 shrink-0 rounded-full"
        style={{ background: color || '#4338E8' }}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span
            className="truncate text-[13px] font-extrabold tracking-tight text-[#1F1B4D]"
            style={{ fontFamily: "var(--ss-font-ui, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)" }}
          >
            {name}
          </span>
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-[#77738F]">
            {months}
          </span>
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-[#77738F]">
          {isComplete ? (
            <CheckCircle className="h-3 w-3 text-[#4338E8]" aria-hidden />
          ) : empty ? (
            <Plus className="h-3 w-3" aria-hidden />
          ) : (
            <BookOpen className="h-3 w-3" aria-hidden />
          )}
          {isComplete ? `Complete · ${status}` : status}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#C4C0D8] transition-transform group-hover:translate-x-0.5 group-hover:text-[#4338E8]" />
    </button>
  );
}
