import type { RhythmstixTemplate, RhythmstixTemplateId } from '../../utils/lessonTemplates/rhythmstixTemplates';
import { isRhythmstixTemplateId } from '../../utils/lessonTemplates/rhythmstixTemplates';
import { cn } from '@/lib/utils';

/**
 * Lesson plan template chooser (all 7 Rhythmstix templates). The year group
 * sets the default; the teacher can pick any template, saved on the lesson.
 */
export function LessonTemplateSelect({
  id,
  value,
  defaultId,
  templates,
  onChange,
  compact,
}: {
  id: string;
  value: RhythmstixTemplateId;
  defaultId: RhythmstixTemplateId | null;
  templates: RhythmstixTemplate[];
  onChange: (id: RhythmstixTemplateId) => void;
  compact?: boolean;
}) {
  return (
    <label htmlFor={id} className={cn('inline-flex items-center gap-2 text-[13px] font-semibold text-slate-700', compact && 'font-medium')}>
      <span>{compact ? 'Template' : 'Plan template'}</span>
      <select
        id={id}
        data-testid={compact ? 'lesson-template-select-export' : 'lesson-template-select'}
        value={value}
        onChange={(e) => {
          if (isRhythmstixTemplateId(e.target.value)) onChange(e.target.value);
        }}
        className="h-9 rounded-full border-2 border-indigo-200 bg-white px-3 text-[13px] font-semibold text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
            {t.id === defaultId ? ' (year group default)' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
