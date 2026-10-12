import React from 'react';
import { Layers, MapPin, MessageSquareText, Plus } from 'lucide-react';
import type { DayEntry, PlannerClass } from './plannerModel';
import { readableInk, tint } from './plannerModel';

interface Props {
  entry: DayEntry;
  cls?: PlannerClass;
  title: string;
  unitLabel?: string;
  hasReflection?: boolean;
  selected?: boolean;
  size?: 'compact' | 'roomy';
  onOpen: (entry: DayEntry) => void;
}

const STATUS_STYLE: Record<string, string> = {
  completed: 'bg-[#E7F5EC] text-[#1E6B3E]',
  draft: 'bg-[#FEF3C7] text-[#8A5300]',
};

export function PlannerLessonCard({ entry, cls, title, unitLabel, hasReflection, selected, size = 'compact', onOpen }: Props) {
  const color = cls?.color || '#475569';
  const ink = readableInk(color);
  const plan = entry.plan;
  const status = plan?.status;
  const roomy = size === 'roomy';

  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      className={`group relative w-full text-left rounded-xl border bg-white transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${
        plan ? 'border-[#E5EDE8] hover:shadow-[0_4px_14px_rgba(0,0,0,0.07)]' : 'border-dashed border-[#D5E0D8] hover:bg-[#F7FAF8]'
      } ${selected ? 'ring-2 ring-[#B6FF7E] border-[#002D24]/40' : ''} ${roomy ? 'pl-5 pr-4 py-3' : 'pl-4 pr-3 py-2.5'}`}
    >
      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r" style={{ background: color }} aria-hidden />
      <span className="flex items-center gap-1.5 min-w-0">
        {entry.time && (
          <span className="text-xs font-semibold tabular-nums text-[#4B5563] shrink-0">{entry.time}</span>
        )}
        <span
          className="text-xs font-bold rounded-md px-1.5 py-px truncate min-w-0"
          style={{ color: ink, background: tint(color, 0.13) }}
        >
          {cls?.name || entry.classId}
        </span>
      </span>
      {plan ? (
        <>
          <span className={`block mt-1 font-semibold text-[#1F2937] leading-snug ${roomy ? 'text-[15.5px]' : 'text-sm'}`}>
            {title}
          </span>
          {unitLabel && (
            <span className="mt-0.5 flex items-center gap-1 text-[12.5px] text-[#4B5563] min-w-0">
              <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{unitLabel}</span>
            </span>
          )}
          {(hasReflection || (status && STATUS_STYLE[status]) || entry.location) && (
            <span className="mt-1.5 flex items-center gap-2.5 text-xs text-[#4B5563]">
              {entry.location && (
                <span className="inline-flex items-center gap-1 min-w-0">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{entry.location}</span>
                </span>
              )}
              {hasReflection && (
                <span className="inline-flex items-center gap-1">
                  <MessageSquareText className="h-3.5 w-3.5" aria-hidden />
                  Reflection
                </span>
              )}
              {status && STATUS_STYLE[status] && (
                <span className={`ml-auto rounded-full px-2 py-px text-[11.5px] font-semibold ${STATUS_STYLE[status]}`}>
                  {status === 'completed' ? 'Taught' : 'Draft'}
                </span>
              )}
            </span>
          )}
        </>
      ) : (
        <>
          <span className="block mt-1 text-sm italic text-[#4B5563]">No lesson planned yet</span>
          <span className="mt-0.5 flex items-center gap-1 text-[12.5px] font-medium text-[#0D9488]">
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Choose a lesson
          </span>
        </>
      )}
    </button>
  );
}
