import { useEffect, useId, useMemo, useState } from 'react';
import type { LibraryKeyStageId } from '../../utils/libraryHierarchy';
import type { PlanTemplate } from '../../types/lessonSections';
import { loadPlannerCurriculum } from '../../utils/planner/plannerCurriculumStore';
import {
  isRhythmstixTemplateId,
  getRhythmstixTemplate,
  rhythmstixPlanTemplate,
  templateIdForKeyStage,
  templateIdForYearGroup,
  type RhythmstixTemplate,
  type RhythmstixTemplateId,
} from '../../utils/lessonTemplates/rhythmstixTemplates';
import { cachedLessonTemplates, loadLessonTemplates } from '../../utils/lessonTemplates/lessonTemplateStore';
import { renderLessonTemplateHtml } from '../../utils/lessonTemplates/renderLessonTemplate';
import { ModalBody, ModalFooter, ModalHeader, ModalShell } from './ModalShell';
import { TemplatePreviewDialog, TemplatePreviewPanel } from './TemplatePreview';
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
  lesson,
  lessonNumber,
}: {
  open: boolean;
  /**
   * Lesson data to preview. "Use template" starts a new lesson, so by default the
   * preview shows exactly that new plan (the template's starter sections, year group).
   */
  lesson?: Record<string, any> | null;
  lessonNumber?: string;
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
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [previewShown, setPreviewShown] = useState(true);
  const [fullOpen, setFullOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedId(defaultId);
    setHoverId(null);
    setPreviewShown(true);
    setFullOpen(false);
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
  // Preview follows the hovered/focused option, else the selected one.
  const shown = (hoverId && options.find((o) => o.id === hoverId)) || selected;
  const shownRxId: RhythmstixTemplateId = isRhythmstixTemplateId(shown.rxId) ? shown.rxId : defaultId;
  const shownTemplate = getRhythmstixTemplate(shownRxId, rx);
  const previewHtml = useMemo(() => {
    if (!open) return '';
    const base =
      lesson && typeof lesson === 'object'
        ? lesson
        : {
            grouped: {},
            categoryOrder: [],
            totalTime: 0,
            title: 'New lesson',
            sections: (shown.plan.defaultSectionBlueprints || []).map((b, i) => ({
              id: `preview-${i}`,
              kind: b.kind,
              title: b.title,
              bodyHtml: '',
            })),
          };
    return renderLessonTemplateHtml(base, { templateId: shownRxId, template: shownTemplate, yearGroup, lessonNumber });
  }, [open, lesson, shown, shownRxId, shownTemplate, yearGroup, lessonNumber]);

  return (
    <ModalShell
      open={open}
      onClose={fullOpen ? () => setFullOpen(false) : onClose}
      labelledBy={titleId}
    >
      <ModalHeader
        title="Choose lesson plan template"
        subtitle={`Rhythmstix templates EYFS to KS5. Your year group's template is preselected; you can pick any.`}
        onClose={onClose}
        titleId={titleId}
      />
      <ModalBody>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <ul
          className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
          role="listbox"
          aria-label="Lesson plan templates"
          onMouseLeave={() => setHoverId(null)}
        >
          {options.map((o) => {
            const active = selected.id === o.id;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  data-template-id={o.id}
                  onClick={() => {
                    setSelectedId(o.id);
                    setPreviewShown(true);
                  }}
                  onMouseEnter={() => setHoverId(o.id)}
                  onFocus={() => setHoverId(o.id)}
                  onBlur={() => setHoverId(null)}
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
        <div className="min-w-0 lg:sticky lg:top-0">
          {previewShown && previewHtml ? (
            <TemplatePreviewPanel
              html={previewHtml}
              templateName={shownTemplate.name}
              onOpenFull={() => setFullOpen(true)}
              onDismiss={() => setPreviewShown(false)}
              frameClassName="h-[min(52vh,600px)]"
              testId="template-picker-preview"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPreviewShown(true)}
              className="inline-flex h-11 items-center rounded-full border-2 border-indigo-200 px-4 text-sm font-semibold text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              Show preview
            </button>
          )}
          {!isRhythmstixTemplateId(shown.rxId) ? (
            <p className="mt-2 text-[13px] text-slate-600">
              {shown.name} prints with the {shownTemplate.name} template (your year group default).
            </p>
          ) : null}
        </div>
        </div>
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
      <TemplatePreviewDialog
        open={open && fullOpen}
        html={previewHtml}
        templateName={shownTemplate.name}
        onClose={() => setFullOpen(false)}
      />
    </ModalShell>
  );
}
