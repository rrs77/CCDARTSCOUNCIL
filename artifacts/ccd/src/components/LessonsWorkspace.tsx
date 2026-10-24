import React, { useMemo, useState } from 'react';
import {
  Clapperboard,
  Eye,
  FileText,
  Pencil,
  Plus,
  Share2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AssignToHalfTermModal } from './AssignToHalfTermModal';
import { useData, type Activity, type LessonData } from '../contexts/DataContext';
import { useIsViewOnly } from '../hooks/useIsViewOnly';
import {
  LIBRARY_KEY_STAGES,
  type LibraryKeyStageId,
  isLibraryKeyStageId,
  keyStageFromYearGroupTag,
  keyStageLabel,
  lessonMatchesKeyStage,
} from '../utils/libraryHierarchy';
import { ensureLessonSections, legacyLessonToSections } from '../utils/planner/legacyLessonToSections';
import type { PlanTemplate } from '../types/lessonSections';
import { LibraryMenu } from './ccdPlanner/LibraryMenu';
import { MyUnitsMenu } from './ccdPlanner/MyUnitsMenu';
import { YourLessonsMenu } from './ccdPlanner/YourLessonsMenu';
import { ActivityStepsModal } from './ccdPlanner/ActivityStepsModal';
import { LessonPlanPanel } from './ccdPlanner/LessonPlanModal';
import { PlannerLessonCanvas } from './ccdPlanner/PlannerLessonCanvas';
import { RunThroughModal } from './ccdPlanner/RunThroughModal';
import { TemplatePickerModal } from './ccdPlanner/TemplatePickerModal';
import { YearOverviewScreen } from './ccdPlanner/YearOverviewScreen';
import { SharePlanningModal } from './ccdPlanner/SharePlanningModal';
import { loadPlannerTerms } from '../utils/planner/plannerCurriculumStore';
import { syncSettingsUrl } from './settings/routes';
import {
  lessonEditorFromPath,
  syncLessonEditorUrl,
} from './studio/plannerRoutes';

const UI_FONT = "var(--ss-font-ui, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)";

interface LessonsWorkspaceProps {
  onAssignToUnit?: (lessonNumber: string, halfTermId: string) => void;
  onUnsavedChangesChange?: (hasChanges: boolean) => void;
}

/**
 * Lesson planner: full-width canvas. Library and My units open from toolbar
 * menus (like Classes) — not a three-column layout.
 */
export function LessonsWorkspace({
  onAssignToUnit,
  onUnsavedChangesChange: _onUnsavedChangesChange,
}: LessonsWorkspaceProps) {
  const isViewOnly = useIsViewOnly();
  const {
    allLessonsData,
    lessonNumbers,
    currentSheetInfo,
    halfTerms,
    loading,
    currentAcademicYear,
    updateLessonData,
    deleteLesson,
  } = useData();

  const derivedKs = useMemo((): LibraryKeyStageId => {
    const fromSheet = keyStageFromYearGroupTag(currentSheetInfo?.sheet || '');
    return fromSheet && isLibraryKeyStageId(fromSheet) ? fromSheet : 'ks2';
  }, [currentSheetInfo?.sheet]);

  const [keyStage, setKeyStage] = useState<LibraryKeyStageId>(derivedKs);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [unitsOpen, setUnitsOpen] = useState(false);
  const [lessonsOpen, setLessonsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHalfTerm, setSelectedHalfTerm] = useState('all');
  const [editingLessonNumber, setEditingLessonNumber] = useState<string | undefined>();
  const [builderKey, setBuilderKey] = useState(0);
  const [assignLessonNumber, setAssignLessonNumber] = useState<string | null>(null);
  const [lessonPlanOpen, setLessonPlanOpen] = useState(false);
  const [editingLessonForForm, setEditingLessonForForm] = useState<{
    lessonNumber: string;
    lessonData: LessonData;
  } | null>(null);
  const [activityForSteps, setActivityForSteps] = useState<Activity | null>(null);
  const [runThroughOpen, setRunThroughOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');
  const [showYearOverview, setShowYearOverview] = useState(false);
  const [termsTick, setTermsTick] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);

  const plannerTerms = useMemo(
    () => loadPlannerTerms(currentAcademicYear),
    [currentAcademicYear, termsTick],
  );

  React.useEffect(() => {
    setKeyStage(derivedKs);
  }, [derivedKs]);

  React.useEffect(() => {
    const onUpdate = () => setTermsTick((n) => n + 1);
    window.addEventListener('ccd:planner-curriculum-updated', onUpdate);
    return () => window.removeEventListener('ccd:planner-curriculum-updated', onUpdate);
  }, []);

  const getLessonHalfTerm = (lessonNumber: string): string | null => {
    for (const halfTerm of halfTerms || []) {
      if (Array.isArray(halfTerm?.lessons) && halfTerm.lessons.includes(lessonNumber)) {
        return halfTerm.id;
      }
    }
    return null;
  };

  const filteredLessons = useMemo(() => {
    if (!allLessonsData || typeof allLessonsData !== 'object') return [];

    const keys = new Set<string>();
    if (Array.isArray(lessonNumbers)) {
      lessonNumbers.forEach((n) => keys.add(n));
    }
    Object.keys(allLessonsData).forEach((n) => {
      if (allLessonsData[n]) keys.add(n);
    });

    const q = searchQuery.trim().toLowerCase();
    const list = Array.from(keys).filter((num) => {
      const data = allLessonsData[num];
      if (!data) return false;
      if (!lessonMatchesKeyStage(data, keyStage)) return false;
      if (selectedHalfTerm !== 'all' && getLessonHalfTerm(num) !== selectedHalfTerm) {
        return false;
      }
      if (!q) return true;
      const title = (data.title || '').toLowerCase();
      if (num.toLowerCase().includes(q) || title.includes(q)) return true;
      return Object.values(data.grouped || {}).some(
        (acts: unknown) =>
          Array.isArray(acts) &&
          acts.some(
            (a: { activity?: string }) => (a.activity || '').toLowerCase().includes(q),
          ),
      );
    });

    list.sort((a, b) => {
      const na = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const nb = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return na - nb;
    });
    return list;
  }, [allLessonsData, lessonNumbers, searchQuery, selectedHalfTerm, halfTerms, keyStage]);

  // Drop an open lesson that no longer matches the toolbar key stage.
  React.useEffect(() => {
    if (!editingLessonNumber || !allLessonsData) return;
    const data = allLessonsData[editingLessonNumber];
    if (data && !lessonMatchesKeyStage(data, keyStage)) {
      setEditingLessonNumber(undefined);
      setLessonPlanOpen(false);
      setEditingLessonForForm(null);
    }
  }, [keyStage, editingLessonNumber, allLessonsData]);

  const activeLessonData = editingLessonNumber
    ? allLessonsData?.[editingLessonNumber]
    : null;

  const activeSections = useMemo(() => {
    if (!activeLessonData) return [];
    return ensureLessonSections(activeLessonData).sections;
  }, [activeLessonData]);

  const openLessonInBuilder = (lessonNumber: string) => {
    setEditingLessonNumber(lessonNumber);
    setBuilderKey((k) => k + 1);
    setLiveMessage(`Opened ${lessonNumber} on the canvas`);
    syncLessonEditorUrl(lessonNumber);
  };

  const openLessonForm = (lessonNumber?: string) => {
    if (isViewOnly) {
      toast.error('View-only mode: cannot edit lessons.');
      return;
    }
    if (lessonNumber && allLessonsData[lessonNumber]) {
      setEditingLessonForForm({
        lessonNumber,
        lessonData: allLessonsData[lessonNumber],
      });
      syncLessonEditorUrl(lessonNumber);
    } else {
      setEditingLessonForForm(null);
      syncLessonEditorUrl(null);
    }
    setLessonPlanOpen(true);
  };

  // Deep-link /lessons/edit/:id — open on the canvas when data is ready
  React.useEffect(() => {
    const fromUrl = lessonEditorFromPath();
    if (!fromUrl || !allLessonsData?.[fromUrl]) return;
    if (editingLessonNumber === fromUrl) return;
    setEditingLessonNumber(fromUrl);
    setBuilderKey((k) => k + 1);
  }, [allLessonsData, editingLessonNumber]);

  React.useEffect(() => {
    const onPop = () => {
      const fromUrl = lessonEditorFromPath();
      if (fromUrl && allLessonsData?.[fromUrl]) {
        setEditingLessonNumber(fromUrl);
        setBuilderKey((k) => k + 1);
        return;
      }
      if (!fromUrl && window.location.pathname.replace(/\/+$/, '') === '/lessons') {
        setEditingLessonNumber(undefined);
        setLessonPlanOpen(false);
        setEditingLessonForForm(null);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [allLessonsData]);

  const createLesson = () => openLessonForm();

  const handleSaveLessonPlan = async (lessonData: LessonData) => {
    const loadingToast = toast.loading('Saving lesson…');
    try {
      if (!updateLessonData) throw new Error('Save function not available');
      const withSections = ensureLessonSections(lessonData);
      if (editingLessonForForm?.lessonNumber) {
        await updateLessonData(editingLessonForForm.lessonNumber, {
          ...withSections,
          academicYear: currentAcademicYear,
        });
        setEditingLessonNumber(editingLessonForForm.lessonNumber);
        toast.success('Lesson saved', { id: loadingToast });
      } else {
        const maxLessonNumber = Math.max(
          0,
          ...Object.keys(allLessonsData || {}).map((num) => {
            const numStr = num.replace('lesson', '');
            return parseInt(numStr, 10) || 0;
          }),
        );
        const newLessonNumber = `lesson${maxLessonNumber + 1}`;
        await updateLessonData(newLessonNumber, {
          ...withSections,
          isUserCreated: true,
          academicYear: currentAcademicYear,
        });
        setEditingLessonNumber(newLessonNumber);
        toast.success(`Lesson "${lessonData.title || newLessonNumber}" created`, {
          id: loadingToast,
        });
      }
      setLessonPlanOpen(false);
      setEditingLessonForForm(null);
      setBuilderKey((k) => k + 1);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save lesson',
        { id: loadingToast, duration: 5000 },
      );
    }
  };

  const handleAssign = (halfTermId: string) => {
    if (!assignLessonNumber) return;
    onAssignToUnit?.(assignLessonNumber, halfTermId);
    setAssignLessonNumber(null);
  };

  const addActivityToActiveLesson = async (activity: Activity) => {
    if (isViewOnly) {
      toast.error('View-only mode');
      return;
    }
    if (!editingLessonNumber || !allLessonsData[editingLessonNumber]) {
      toast('Open a lesson on the canvas first, then add from Library.');
      setActivityForSteps(activity);
      return;
    }
    const current = ensureLessonSections(allLessonsData[editingLessonNumber]);
    const sections = [
      ...current.sections,
      {
        id: `activity-${Date.now()}`,
        kind: 'activity' as const,
        title: activity.activity || 'Activity',
        bodyHtml: activity.description || '',
        activity,
        durationMins: activity.time,
        lastWrittenBy: 'teacher' as const,
      },
    ];
    const orderedActivities = [
      ...(current.orderedActivities || []),
      activity,
    ];
    const cat = activity.category || 'Activities';
    const grouped = { ...(current.grouped || {}) };
    grouped[cat] = [...(grouped[cat] || []), activity];
    const categoryOrder = current.categoryOrder?.includes(cat)
      ? current.categoryOrder
      : [...(current.categoryOrder || []), cat];
    const totalTime = (current.totalTime || 0) + (activity.time || 0);
    if (!updateLessonData) {
      toast.error('Save function not available');
      return;
    }
    await updateLessonData(editingLessonNumber, {
      ...current,
      sections,
      orderedActivities,
      grouped,
      categoryOrder,
      totalTime,
    });
    setBuilderKey((k) => k + 1);
    setLiveMessage(`Added ${activity.activity} to lesson`);
    toast.success('Added to lesson');
  };

  const applyTemplate = async (template: PlanTemplate) => {
    if (isViewOnly) return;
    const blueprints = template.defaultSectionBlueprints || [];
    const sections = blueprints.map((b) => ({
      id: `sec-${Math.random().toString(36).slice(2, 8)}`,
      kind: b.kind,
      title: b.title,
      customTypeId: b.customTypeId,
      bodyHtml: '',
      lastWrittenBy: 'teacher' as const,
    }));
    openLessonForm();
    setEditingLessonForForm({
      lessonNumber: '',
      lessonData: {
        grouped: {},
        categoryOrder: [],
        totalTime: 0,
        title: template.name,
        planTemplateId: template.id,
        sections,
      },
    });
    setLessonPlanOpen(true);
    setLiveMessage(`Applied template ${template.name}`);
  };

  const saveCanvasLesson = async (lessonData: LessonData) => {
    if (!editingLessonNumber || !updateLessonData) return;
    const withSections = ensureLessonSections(lessonData);
    await updateLessonData(editingLessonNumber, {
      ...withSections,
      academicYear: currentAcademicYear,
    });
    setBuilderKey((k) => k + 1);
  };

  const duplicateActiveLesson = async () => {
    if (isViewOnly || !editingLessonNumber || !activeLessonData || !updateLessonData) return;
    const loadingToast = toast.loading('Duplicating lesson…');
    try {
      const maxLessonNumber = Math.max(
        0,
        ...Object.keys(allLessonsData || {}).map((num) => {
          const numStr = num.replace('lesson', '');
          return parseInt(numStr, 10) || 0;
        }),
      );
      const newLessonNumber = `lesson${maxLessonNumber + 1}`;
      const source = ensureLessonSections(activeLessonData);
      await updateLessonData(newLessonNumber, {
        ...source,
        title: `${source.title || editingLessonNumber} (copy)`,
        isUserCreated: true,
        academicYear: currentAcademicYear,
      });
      setEditingLessonNumber(newLessonNumber);
      setBuilderKey((k) => k + 1);
      setLiveMessage(`Duplicated as ${newLessonNumber}`);
      toast.success('Lesson duplicated', { id: loadingToast });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to duplicate',
        { id: loadingToast },
      );
    }
  };

  React.useEffect(() => {
    const onAnnounce = (e: Event) => {
      const message = (e as CustomEvent<{ message?: string }>).detail?.message;
      if (message) setLiveMessage(message);
    };
    window.addEventListener('ccd:planner-canvas-announce', onAnnounce);
    return () => window.removeEventListener('ccd:planner-canvas-announce', onAnnounce);
  }, []);

  const classLabel = currentSheetInfo.display || currentSheetInfo.sheet;
  /** True when the header class/year group belongs to the toolbar key stage. */
  const classMatchesToolbarKs = useMemo(() => {
    const sheetKs = keyStageFromYearGroupTag(currentSheetInfo?.sheet || '');
    const displayKs = keyStageFromYearGroupTag(currentSheetInfo?.display || '');
    return sheetKs === keyStage || displayKs === keyStage;
  }, [currentSheetInfo?.sheet, currentSheetInfo?.display, keyStage]);
  /** Context chip: matching class name, otherwise only the selected key stage (no LKG under KS3). */
  const contextChipLabel = classMatchesToolbarKs ? classLabel : undefined;
  const yearGroupChipLabel = contextChipLabel;

  const goYearOverview = () => {
    setUnitsOpen(false);
    setShowYearOverview(true);
    setLiveMessage('Opened year overview');
  };

  const goEditTermDates = () => {
    syncSettingsUrl('curriculum');
    window.dispatchEvent(new CustomEvent('ccd:open-tab', { detail: { tab: 'settings' } }));
  };

  /** Extension point: open Interactive Lesson Viewer (Slides) hub — PR #32. */
  const goLessonViewer = () => {
    window.dispatchEvent(new CustomEvent('ccd:open-tab', { detail: { tab: 'lesson-viewer' } }));
  };

  if (showYearOverview) {
    return (
      <div style={{ fontFamily: UI_FONT }}>
        <YearOverviewScreen
          onBack={() => setShowYearOverview(false)}
          onOpenLesson={(num) => {
            setShowYearOverview(false);
            openLessonInBuilder(num);
          }}
          onEditTermDates={goEditTermDates}
        />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-[calc(100vh-7.5rem)] flex-col gap-3"
      style={{ fontFamily: UI_FONT }}
      data-testid="lessons-planner"
    >
      <div className="shrink-0 space-y-3">
        <div>
          <p className="ccd-studio-eyebrow mb-1">
            CONNECT &amp; CREATE / <span>LESSONS</span>
          </p>
          <p className="text-[13px] text-[#5F5B7A]">
            Lesson planner ·{' '}
            <strong className="text-[#1F1B4D]">{keyStageLabel(keyStage)}</strong>
            {contextChipLabel ? (
              <>
                {' · '}
                <strong className="text-[#1F1B4D]">{contextChipLabel}</strong>
              </>
            ) : null}
            {' · '}
            open Your lessons, Library or My units from the toolbar.
          </p>
        </div>

        {/* Toolbar — compact chrome; year-group/KS select always pinned far right */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#E2E0EF] bg-white/90 p-1.5 shadow-sm">
          <YourLessonsMenu
            open={lessonsOpen}
            onOpenChange={(v) => {
              setLessonsOpen(v);
              if (v) {
                setLibraryOpen(false);
                setUnitsOpen(false);
              }
            }}
            loading={loading}
            filteredLessons={filteredLessons}
            allLessonsData={allLessonsData || {}}
            plannerTerms={plannerTerms}
            getLessonHalfTerm={getLessonHalfTerm}
            editingLessonNumber={editingLessonNumber}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            selectedHalfTerm={selectedHalfTerm}
            onSelectedHalfTermChange={setSelectedHalfTerm}
            isViewOnly={isViewOnly}
            classLabel={contextChipLabel || keyStageLabel(keyStage)}
            onCreate={createLesson}
            onOpenCanvas={openLessonInBuilder}
            onOpenPlan={(num) => openLessonForm(num)}
            onAssign={onAssignToUnit ? (num) => setAssignLessonNumber(num) : undefined}
            onDeleteLesson={(num) => {
              deleteLesson(num);
              if (editingLessonNumber === num) {
                setEditingLessonNumber(undefined);
                setLessonPlanOpen(false);
                setEditingLessonForForm(null);
                syncLessonEditorUrl(null);
              }
              toast.success('Lesson moved to trash');
            }}
          />
          <LibraryMenu
            keyStage={keyStage}
            onKeyStageChange={setKeyStage}
            open={libraryOpen}
            onOpenChange={(v) => {
              setLibraryOpen(v);
              if (v) {
                setUnitsOpen(false);
                setLessonsOpen(false);
              }
            }}
            onOpenActivity={(a) => {
              setActivityForSteps(a);
              setLibraryOpen(false);
            }}
            onAddToLesson={(a) => {
              void addActivityToActiveLesson(a);
            }}
          />
          <MyUnitsMenu
            open={unitsOpen}
            onOpenChange={(v) => {
              setUnitsOpen(v);
              if (v) {
                setLibraryOpen(false);
                setLessonsOpen(false);
              }
            }}
            activeLessonNumber={editingLessonNumber}
            onSelectLesson={(num) => {
              openLessonInBuilder(num);
              setUnitsOpen(false);
            }}
            onYearOverview={goYearOverview}
          />

          <div className="mx-0.5 hidden h-5 w-px bg-[#E2E0EF] sm:block" aria-hidden />

          <button
            type="button"
            onClick={() => setTemplateOpen(true)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E2E0EF] bg-white px-2 text-xs font-bold text-[#1F1B4D] hover:border-indigo-300 hover:bg-indigo-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 pointer-coarse:h-11 pointer-coarse:min-h-[44px] pointer-coarse:gap-1.5 pointer-coarse:rounded-xl pointer-coarse:px-3 pointer-coarse:text-sm"
          >
            <FileText className="h-3.5 w-3.5 text-indigo-600 pointer-coarse:h-4 pointer-coarse:w-4" />
            <span className="hidden sm:inline">Choose plan template</span>
            <span className="sm:hidden">Template</span>
          </button>
          <button
            type="button"
            disabled={!editingLessonNumber}
            onClick={() => setRunThroughOpen(true)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E2E0EF] bg-white px-2 text-xs font-bold text-[#1F1B4D] hover:border-indigo-300 hover:bg-indigo-50/40 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 pointer-coarse:h-11 pointer-coarse:min-h-[44px] pointer-coarse:gap-1.5 pointer-coarse:rounded-xl pointer-coarse:px-3 pointer-coarse:text-sm"
          >
            <Eye className="h-3.5 w-3.5 text-indigo-600 pointer-coarse:h-4 pointer-coarse:w-4" />
            Run-through
          </button>
          {/* Lesson Viewer (Slides) — reserved toolbar slot for Interactive Lesson Viewer hook-in */}
          <button
            type="button"
            data-planner-extension="lesson-viewer"
            title="Open Lesson Viewer (Slides)"
            aria-label="Lesson Viewer"
            onClick={goLessonViewer}
            className="inline-flex h-8 min-w-[44px] items-center justify-center gap-1 rounded-lg border border-[#E2E0EF] bg-white px-2 text-xs font-bold text-[#1F1B4D] hover:border-indigo-300 hover:bg-indigo-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 pointer-coarse:h-11 pointer-coarse:min-h-[44px] pointer-coarse:gap-1.5 pointer-coarse:rounded-xl pointer-coarse:px-3 pointer-coarse:text-sm"
          >
            <Clapperboard className="h-3.5 w-3.5 text-indigo-600 pointer-coarse:h-4 pointer-coarse:w-4" />
            <span className="hidden sm:inline">Lesson Viewer</span>
            <span className="sr-only sm:hidden">Lesson Viewer</span>
          </button>
          <button
            type="button"
            onClick={() => openLessonForm(editingLessonNumber)}
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-indigo-600 px-2 text-xs font-bold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 pointer-coarse:h-11 pointer-coarse:min-h-[44px] pointer-coarse:gap-1.5 pointer-coarse:rounded-xl pointer-coarse:px-3 pointer-coarse:text-sm"
          >
            <Pencil className="h-3.5 w-3.5 pointer-coarse:h-4 pointer-coarse:w-4" />
            <span className="hidden sm:inline">Lesson plan</span>
            <span className="sm:hidden">Plan</span>
          </button>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            disabled={!editingLessonNumber || isViewOnly}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E2E0EF] bg-white px-2 text-xs font-bold text-[#1F1B4D] hover:border-indigo-300 hover:bg-indigo-50/40 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 pointer-coarse:h-11 pointer-coarse:min-h-[44px] pointer-coarse:gap-1.5 pointer-coarse:rounded-xl pointer-coarse:px-3 pointer-coarse:text-sm"
            aria-label="Share planning"
          >
            <Share2 className="h-3.5 w-3.5 text-indigo-600 pointer-coarse:h-4 pointer-coarse:w-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button
            type="button"
            onClick={createLesson}
            disabled={isViewOnly}
            className="inline-flex h-8 items-center gap-1 rounded-lg border-2 border-indigo-200 bg-indigo-50 px-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 pointer-coarse:h-11 pointer-coarse:min-h-[44px] pointer-coarse:gap-1.5 pointer-coarse:rounded-xl pointer-coarse:px-3 pointer-coarse:text-sm"
          >
            <Plus className="h-3.5 w-3.5 pointer-coarse:h-4 pointer-coarse:w-4" />
            New
          </button>

          <div className="ml-auto flex shrink-0 items-center">
            <label className="sr-only" htmlFor="planner-toolbar-ks">
              Key stage
            </label>
            <select
              id="planner-toolbar-ks"
              value={keyStage}
              onChange={(e) => {
                const v = e.target.value;
                if (isLibraryKeyStageId(v)) setKeyStage(v);
              }}
              className="h-8 rounded-lg border border-[#E2E0EF] bg-white px-1.5 text-[11px] font-bold text-[#1F1B4D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 pointer-coarse:h-11 pointer-coarse:min-h-[44px] pointer-coarse:rounded-xl pointer-coarse:px-2 pointer-coarse:text-xs"
            >
              {LIBRARY_KEY_STAGES.map((ks) => (
                <option key={ks.id} value={ks.id}>
                  {ks.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Full-width lesson area: canvas OR inline lesson plan (Your lessons is a toolbar menu) */}
      <div className="planner-shell-surface flex min-h-[28rem] min-w-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] p-2 shadow-[0_1px_3px_rgba(31,27,77,0.04)] sm:p-3">
        {lessonPlanOpen ? (
          <LessonPlanPanel
            open={lessonPlanOpen}
            onClose={() => {
              setLessonPlanOpen(false);
              setEditingLessonForForm(null);
            }}
            onSave={handleSaveLessonPlan}
            lessonNumber={editingLessonForForm?.lessonNumber}
            lessonData={editingLessonForForm?.lessonData}
            yearGroup={yearGroupChipLabel}
          />
        ) : (
          <PlannerLessonCanvas
            key={`${builderKey}-${editingLessonNumber ?? 'empty'}`}
            lessonNumber={editingLessonNumber}
            lessonData={activeLessonData}
            keyStageLabel={keyStageLabel(keyStage)}
            classLabel={contextChipLabel}
            yearGroupLabel={undefined}
            canEdit={!isViewOnly}
            onSave={saveCanvasLesson}
            onOpenLessonPlan={() => openLessonForm(editingLessonNumber)}
            onOpenActivity={(a) => setActivityForSteps(a)}
            onDuplicate={
              editingLessonNumber && !isViewOnly
                ? () => void duplicateActiveLesson()
                : undefined
            }
          />
        )}
      </div>

      <div className="sr-only" aria-live="polite">
        {liveMessage}
      </div>

      {assignLessonNumber && (
        <AssignToHalfTermModal
          isOpen
          onClose={() => setAssignLessonNumber(null)}
          onAssign={handleAssign}
          lessonNumber={assignLessonNumber}
          halfTerms={(halfTerms || []) as any}
        />
      )}

      <ActivityStepsModal
        open={!!activityForSteps}
        activity={activityForSteps}
        onClose={() => setActivityForSteps(null)}
        onAddToLesson={(a) => {
          void addActivityToActiveLesson(a);
        }}
      />

      <RunThroughModal
        open={runThroughOpen}
        onClose={() => setRunThroughOpen(false)}
        title={activeLessonData?.title || editingLessonNumber || 'Lesson'}
        sections={
          activeSections.length > 0
            ? activeSections
            : activeLessonData
              ? legacyLessonToSections(activeLessonData)
              : []
        }
        durationMins={activeLessonData?.totalTime}
      />

      <TemplatePickerModal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        keyStage={keyStage}
        onApply={(tpl) => {
          void applyTemplate(tpl);
        }}
      />

      <SharePlanningModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        resourceType="lesson"
        resourceId={editingLessonNumber || 'draft'}
        title={activeLessonData?.title || editingLessonNumber || 'Lesson'}
        summary={`${keyStageLabel(keyStage)} · ${classLabel}`}
      />
    </div>
  );
}
