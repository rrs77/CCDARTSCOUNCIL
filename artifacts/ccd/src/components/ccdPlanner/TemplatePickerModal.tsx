import { useId, useMemo, useState } from 'react';
import type { LibraryKeyStageId } from '../../utils/libraryHierarchy';
import { keyStageLabel } from '../../utils/libraryHierarchy';
import type { PlanTemplate } from '../../types/lessonSections';
import { loadPlannerCurriculum } from '../../utils/planner/plannerCurriculumStore';
import { ModalBody, ModalFooter, ModalHeader, ModalShell } from './ModalShell';
import { cn } from '@/lib/utils';

export function TemplatePickerModal({
  open,
  onClose,
  keyStage,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  keyStage: LibraryKeyStageId | string;
  onApply: (template: PlanTemplate) => void;
}) {
  const titleId = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const templates = useMemo(() => {
    const stored = loadPlannerCurriculum().planTemplates.filter(
      (t) => String(t.keyStageId).toLowerCase() === String(keyStage).toLowerCase(),
    );
    // Empty defaults only — nothing hard-coded per KS beyond a blank starter
    if (stored.length === 0) {
      return [
        {
          id: 'blank',
          keyStageId: keyStage,
          name: 'Blank plan',
          description: 'Start empty and add activities or sections.',
          defaultSectionBlueprints: [],
        } satisfies PlanTemplate,
      ];
    }
    return stored as PlanTemplate[];
  }, [keyStage, open]);

  const selected = templates.find((t) => t.id === selectedId) || templates[0];

  return (
    <ModalShell open={open} onClose={onClose} labelledBy={titleId}>
      <ModalHeader
        title="Choose plan template"
        subtitle={`Templates for ${keyStageLabel(String(keyStage))} — managed in Settings`}
        onClose={onClose}
        titleId={titleId}
      />
      <ModalBody>
        <ul className="space-y-2">
          {templates.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setSelectedId(t.id)}
                className={cn(
                  'flex min-h-[44px] w-full flex-col rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
                  (selectedId || templates[0]?.id) === t.id
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-slate-100 hover:border-indigo-200',
                )}
              >
                <span className="text-sm font-extrabold text-slate-900">{t.name}</span>
                {t.description ? (
                  <span className="mt-0.5 text-xs text-slate-500">{t.description}</span>
                ) : null}
                <span className="mt-1 text-[11px] font-semibold text-indigo-600">
                  {t.defaultSectionBlueprints.length} section
                  {t.defaultSectionBlueprints.length === 1 ? '' : 's'}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {templates.length === 1 && templates[0].id === 'blank' ? (
          <p className="mt-4 text-xs text-slate-500">
            Add named templates under Settings → Curriculum (plan templates).
          </p>
        ) : null}
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
            if (selected) onApply(selected);
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
