import { useEffect, useId, useMemo, useState } from 'react';
import type { LibraryKeyStageId } from '../../utils/libraryHierarchy';
import type { PlanTemplate } from '../../types/lessonSections';
import { loadPlannerCurriculum } from '../../utils/planner/plannerCurriculumStore';
import {
  isRhythmstixTemplateId,
  rhythmstixPlanTemplate,
  templateIdForKeyStage,
  templateIdForYearGroup,
  type RhythmstixTemplate,
  type RhythmstixTemplateId,
} from '../../utils/lessonTemplates/rhythmstixTemplates';
import { cachedLessonTemplates, loadLessonTemplates } from '../../utils/lessonTemplates/lessonTemplateStore';
import { ModalBody, ModalFooter, ModalHeader, ModalShell } from './ModalShell';
import { cn } from '@/lib/utils';

const BLANK_ID = 'blank';

/**
 * Lists all seven Rhythmstix lesson plan templates (EYFS → KS5), with the
 * year group's template preselected, plus Blank plan and any templates saved
 * under Settings. The choice is saved on the lesson (lessonTemplateId).
 */
export function TemplatePickerModal({
  open,
  onClose,
  keyStage,
  yearGroup,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  keyStage: LibraryKeyStageId | string;
  yearGroup?: string;
  onApply: (template: PlanTemplate, lessonTemplateId?: RhythmstixTemplateId) => void;
}) {
  const titleId = useId();
  const [rx, setRx] = useState<RhythmstixTemplate[]>(() => cachedLessonTemplates());
  const defaultId: RhythmstixTemplateId =
    templateIdForYearGroup(yearGroup) || templateIdForKeyStage(String(keyStage)) || 'eyfs';
  const [selectedId, setSelectedId] = useState<string>(defaultId);

  useEffect(() => {
    if (!open) return;
    setSelectedId(defaultId);
    let alive = true;
    void loadLessonTemplates().then((list) => alive && setRx(list));
    return () => {
      alive = false;
    };
  }, [open, defaultId]);

  const custom = useMemo(
    () =>
      loadPlannerCurriculum().planTemplates.filter(
        (t) => String(t.keyStageId).toLowerCase() === String(keyStage).toLowerCase(),
      ) as PlanTemplate[],
    [keyStage, open],
  );

  const options: Array<{ id: string; name: string; description?: string; accent?: string; badge?: string; plan: PlanTemplate; rxId?: RhythmstixTemplateId }> = [
    ...rx.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      accent: t.accent,
      badge: t.id === defaultId ? 'Year group default' : undefined,
      plan: rhythmstixPlanTemplate(t),
      rxId: t.id,
    })),
    ...custom.map((t) => ({ id: t.id, name: t.name, description: t.description, plan: t })),
    {
      id: BLANK_ID,
      name: 'Blank plan',
      description: 'Start empty and add activities or sections.',
      plan: { id: BLANK_ID, keyStageId: String(keyStage), name: 'Blank plan', defaultSectionBlueprints: [] },
    },
  ];
  const selected = options.find((o) => o.id === selectedId) || options[0];

  return (
    <ModalShell open={open} onClose={onClose} labelledBy={titleId}>
      <ModalHeader
        title="Choose lesson plan template"
        subtitle={`Rhythmstix templates EYFS to KS5. Your year group's template is preselected; you can pick any.`}
        onClose={onClose}
        titleId={titleId}
      />
      <ModalBody>
        <ul className="grid gap-2 sm:grid-cols-2" role="listbox" aria-label="Lesson plan templates">
          {options.map((o) => {
            const active = selected.id === o.id;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  data-template-id={o.id}
                  onClick={() => setSelectedId(o.id)}
                  className={cn(
                    'flex h-full min-h-[44px] w-full flex-col rounded-2xl border-2 px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
                    active ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-indigo-200',
                  )}
                  style={o.accent ? { borderLeft: `6px solid ${o.accent}` } : undefined}
                >
                  <span className="text-sm font-extrabold text-slate-900">{o.name}</span>
                  {o.description ? <span className="mt-0.5 text-[13px] text-slate-600">{o.description}</span> : null}
                  {o.badge ? (
                    <span className="mt-1 text-[13px] font-semibold text-indigo-700">{o.badge}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center rounded-full border-2 border-indigo-200 px-4 text-sm font-semibold text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onApply(selected.plan, isRhythmstixTemplateId(selected.rxId) ? selected.rxId : defaultId);
            onClose();
          }}
          className="inline-flex h-11 items-center rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          Use template
        </button>
      </ModalFooter>
    </ModalShell>
  );
}
