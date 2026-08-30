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

const FOREST = '#002D24';

export function HalfTermCard({
  id,
  name,
  months,
  color,
  lessonCount,
  stackCount = 0,
  onClick,
  isComplete,
  theme,
  onLessonClick,
  onLessonEdit,
  halfTerms = []
}: HalfTermCardProps) {
  // Three visual variants:
  //   empty       — light sage band, "Add lessons" affordance
  //   in-progress — forest footer with lesson count
  //   complete    — forest footer with check icon
  const variant: 'empty' | 'in-progress' | 'complete' =
    lessonCount === 0 ? 'empty' : isComplete ? 'complete' : 'in-progress';

  const bandStyle =
    variant === 'empty'
      ? { backgroundColor: '#F1F6F2', color: FOREST, borderTop: '1px dashed #D5E3DA' }
      : { backgroundColor: FOREST, color: '#FFFFFF', borderTop: '1px solid transparent' };

  return (
    <div
      className="bg-white rounded-card shadow-soft ccd-card-lift cursor-pointer group overflow-hidden border border-gray-100 hover:border-[#002D24]/25"
      onClick={onClick}
    >
      {/* TOP SECTION — title, months chip, chevron */}
      <div className="relative px-4 sm:px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <h3
              className="text-[17px] sm:text-[18px] font-semibold leading-tight tracking-tight"
              style={{
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                color: FOREST,
              }}
            >
              {name}
            </h3>
            <p
              className="mt-1 inline-block text-[12px] font-medium text-gray-500 tracking-wide uppercase"
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
            >
              {months}
            </p>
          </div>
          <ChevronRight
            className="h-5 w-5 flex-shrink-0 text-gray-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#002D24]"
          />
        </div>
      </div>

      {/* BOTTOM BAND — status */}
      <div
        className="relative flex items-center justify-between px-4 sm:px-5 py-3"
        style={{ ...bandStyle, transition: 'background-color 250ms var(--ccd-ease-out)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {variant === 'complete' ? (
            <CheckCircle className="h-[18px] w-[18px] flex-shrink-0" />
          ) : variant === 'in-progress' ? (
            <BookOpen className="h-[18px] w-[18px] flex-shrink-0" />
          ) : (
            <Plus className="h-[18px] w-[18px] flex-shrink-0 opacity-70" />
          )}
          <span
            className="text-[14px] font-medium truncate"
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            {variant === 'empty'
              ? 'Add lessons'
              : `${lessonCount} lesson${lessonCount !== 1 ? 's' : ''}`}
            {stackCount > 0 && variant !== 'empty' && (
              <span className="ml-2 opacity-90">
                · {stackCount} stack{stackCount !== 1 ? 's' : ''}
              </span>
            )}
          </span>
        </div>
        {variant === 'complete' && (
          <span className="text-[11px] font-semibold tracking-wide uppercase opacity-90">
            Complete
          </span>
        )}
      </div>
    </div>
  );
}
