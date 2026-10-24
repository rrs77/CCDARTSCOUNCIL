import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Calendar,
  Clapperboard,
  Clock,
  Eye,
  FileText,
  Pencil,
  Plus,
  Search,
  Tag,
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
} from '../utils/libraryHierarchy';
import { ensureLessonSections, legacyLessonToSections } from '../utils/planner/legacyLessonToSections';
import type { PlanTemplate } from '../types/lessonSections';
import { LibraryMenu } from './ccdPlanner/LibraryMenu';
import { MyUnitsMenu } from './ccdPlanner/MyUnitsMenu';
import { ActivityStepsModal } from './ccdPlanner/ActivityStepsModal';
import { LessonPlanModal } from './ccdPlanner/LessonPlanModal';
import { PlannerLessonCanvas } from './ccdPlanner/PlannerLessonCanvas';
import { RunThroughModal } from './ccdPlanner/RunThroughModal';
import { TemplatePickerModal } from './ccdPlanner/TemplatePickerModal';
import { YearOverviewScreen } from './ccdPlanner/YearOverviewScreen';
import { loadPlannerTerms } from '../utils/planner/plannerCurriculumStore';
import { syncSettingsUrl } from './settings/routes';

const UI_FONT = "var(--ss-font-ui, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)";
const DISPLAY_FONT =
  "var(--ss-font-display, 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif)";

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
  } = useData();

  const derivedKs = useMemo((): LibraryKeyStageId => {
    const fromSheet = keyStageFromYearGroupTag(currentSheetInfo?.sheet || '');
    return fromSheet && isLibraryKeyStageId(fromSheet) ? fromSheet : 'ks2';
  }, [currentSheetInfo?.sheet]);

  const [keyStage, setKeyStage] = useState<LibraryKeyStageId>(derivedKs);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [unitsOpen, setUnitsOpen] = useState(false);
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
  }, [allLessonsData, lessonNumbers, searchQuery, selectedHalfTerm, halfTerms]);

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
    } else {
      setEditingLessonForForm(null);
    }
    setLessonPlanOpen(true);
  };

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
          <p className="text-sm text-[#77738F]">
            Lesson planner for{' '}
            <strong className="text-[#1F1B4D]">{classLabel}</strong>
            {' · '}
            full-width canvas — open Library or My units from the toolbar.
          </p>
        </div>

        {/* Toolbar — Library / My units as Classes-style menus */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#E2E0EF] bg-white/90 p-2 shadow-sm">
          <LibraryMenu
            keyStage={keyStage}
            onKeyStageChange={setKeyStage}
            open={libraryOpen}
            onOpenChange={(v) => {
              setLibraryOpen(v);
              if (v) setUnitsOpen(false);
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
              if (v) setLibraryOpen(false);
            }}
            activeLessonNumber={editingLessonNumber}
            onSelectLesson={(num) => {
              openLessonInBuilder(num);
              setUnitsOpen(false);
            }}
            onYearOverview={goYearOverview}
          />

          <div className="mx-1 hidden h-8 w-px bg-[#E2E0EF] sm:block" aria-hidden />

          <button
            type="button"
            onClick={() => setTemplateOpen(true)}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[#E2E0EF] bg-white px-3 text-sm font-bold text-[#1F1B4D] hover:border-indigo-300 hover:bg-indigo-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <FileText className="h-4 w-4 text-indigo-600" />
            <span className="hidden sm:inline">Choose plan template</span>
            <span className="sm:hidden">Template</span>
          </button>
          <button
            type="button"
            disabled={!editingLessonNumber}
            onClick={() => setRunThroughOpen(true)}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[#E2E0EF] bg-white px-3 text-sm font-bold text-[#1F1B4D] hover:border-indigo-300 hover:bg-indigo-50/40 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Eye className="h-4 w-4 text-indigo-600" />
            Run-through
          </button>
          {/* Lesson Viewer (Slides) — reserved toolbar slot for Interactive Lesson Viewer hook-in */}
          <button
            type="button"
            data-planner-extension="lesson-viewer"
            title="Open Lesson Viewer (Slides)"
            onClick={goLessonViewer}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[#E2E0EF] bg-white px-3 text-sm font-bold text-[#1F1B4D] hover:border-indigo-300 hover:bg-indigo-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Clapperboard className="h-4 w-4 text-indigo-600" />
            <span className="hidden sm:inline">Lesson Viewer</span>
            <span className="sm:hidden">Slides</span>
          </button>
          <button
            type="button"
            onClick={() => openLessonForm(editingLessonNumber)}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-indigo-600 px-3 text-sm font-bold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">Lesson plan</span>
            <span className="sm:hidden">Plan</span>
          </button>
          <button
            type="button"
            onClick={createLesson}
            disabled={isViewOnly}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl border-2 border-indigo-200 bg-indigo-50 px-3 text-sm font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Plus className="h-4 w-4" />
            New
          </button>

          <div className="ml-auto hidden items-center gap-2 lg:flex">
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
              className="h-11 rounded-xl border border-[#E2E0EF] bg-white px-2 text-xs font-bold text-[#1F1B4D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
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

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[minmax(14rem,16rem)_minmax(0,1fr)]">
        {/* Compact saved-lessons rail (not a third planner column) */}
        <aside className="flex max-h-[min(40vh,22rem)] flex-col overflow-hidden rounded-2xl border border-[#E2E0EF] bg-white shadow-[0_1px_3px_rgba(31,27,77,0.05)] xl:max-h-[calc(100vh-11rem)] xl:sticky xl:top-2">
          <div className="shrink-0 border-b border-[#E2E0EF] bg-gradient-to-r from-[#2DD4BF] to-[#4338E8] px-3 py-3 text-white">
            <div className="flex items-center justify-between gap-2">
              <h2
                className="truncate text-[15px] font-extrabold tracking-tight"
                style={{ fontFamily: DISPLAY_FONT }}
              >
                Your lessons
              </h2>
              <button
                type="button"
                onClick={createLesson}
                disabled={isViewOnly}
                className="inline-flex h-11 shrink-0 items-center gap-1 rounded-lg bg-white/20 px-2.5 text-[12px] font-extrabold text-white hover:bg-white/30 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <Plus className="h-3.5 w-3.5" />
                Create
              </button>
            </div>
            <div className="mt-2.5 flex flex-col gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/70" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search lessons…"
                  className="h-11 w-full rounded-lg border border-white/25 bg-white/15 py-1 pl-8 pr-2 text-[12px] font-medium text-white placeholder:text-white/65 focus:border-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                />
              </div>
              <select
                value={selectedHalfTerm}
                onChange={(e) => setSelectedHalfTerm(e.target.value)}
                className="h-11 w-full rounded-lg border border-white/25 bg-white/15 px-2 text-[12px] font-semibold text-white focus:border-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                aria-label="Filter by half-term"
              >
                <option value="all" className="text-[#1F1B4D]">
                  All half-terms
                </option>
                {plannerTerms.map((t) => (
                  <option key={t.id} value={t.id} className="text-[#1F1B4D]">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#4338E8] border-t-transparent" />
                <p className="text-[12px] font-medium text-[#77738F]">Loading lessons…</p>
              </div>
            ) : filteredLessons.length === 0 ? (
              <div className="flex flex-col items-center px-3 py-10 text-center">
                <BookOpen className="mb-3 h-10 w-10 text-[#D8D5E8]" aria-hidden />
                <p className="text-[13px] font-extrabold text-[#1F1B4D]">
                  {searchQuery || selectedHalfTerm !== 'all'
                    ? 'No lessons match'
                    : `No lessons for ${classLabel}`}
                </p>
                <button
                  type="button"
                  onClick={createLesson}
                  disabled={isViewOnly}
                  className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#4338E8] px-3.5 text-[12px] font-extrabold text-white hover:bg-[#3529d1] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create lesson
                </button>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {filteredLessons.map((num, index) => {
                  const data = allLessonsData[num];
                  if (!data) return null;
                  const activityCount = Object.values(data.grouped || {}).reduce(
                    (sum: number, acts: unknown) =>
                      sum + (Array.isArray(acts) ? acts.length : 0),
                    0,
                  );
                  const termId = getLessonHalfTerm(num);
                  const term = plannerTerms.find((t) => t.id === termId);
                  const active = editingLessonNumber === num;
                  return (
                    <li key={num}>
                      <div
                        className={`rounded-xl border px-2.5 py-2 transition ${
                          active
                            ? 'border-[#4338E8] bg-[#F4F3FA] shadow-sm'
                            : 'border-[#E2E0EF]/90 bg-white hover:border-[#bcb7f4]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => openLessonInBuilder(num)}
                          className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-md bg-[#E9E6FF] px-1 text-[10px] font-extrabold text-[#4338E8]">
                              {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-extrabold text-[#1F1B4D]">
                                {data.title || `Lesson ${num}`}
                              </p>
                              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-[#77738F]">
                                <span className="inline-flex items-center gap-0.5">
                                  <Clock className="h-3 w-3" />
                                  {data.totalTime || 0}m
                                </span>
                                <span className="inline-flex items-center gap-0.5">
                                  <Tag className="h-3 w-3" />
                                  {activityCount}
                                </span>
                                {term ? (
                                  <span className="inline-flex items-center gap-0.5 text-[#4338E8]">
                                    <Calendar className="h-3 w-3" />
                                    {term.name}
                                  </span>
                                ) : null}
                              </p>
                            </div>
                          </div>
                        </button>
                        <div className="mt-1.5 flex gap-1">
                          <button
                            type="button"
                            onClick={() => openLessonForm(num)}
                            disabled={isViewOnly}
                            className="inline-flex h-11 flex-1 items-center justify-center gap-1 rounded-lg text-[11px] font-bold text-[#5C5878] hover:bg-[#F4F3FA] hover:text-[#4338E8] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit plan
                          </button>
                          <button
                            type="button"
                            onClick={() => openLessonInBuilder(num)}
                            className="inline-flex h-11 flex-1 items-center justify-center gap-1 rounded-lg text-[11px] font-bold text-[#5C5878] hover:bg-[#F4F3FA] hover:text-[#4338E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                          >
                            Canvas
                          </button>
                        </div>
                        {onAssignToUnit && !isViewOnly ? (
                          <button
                            type="button"
                            onClick={() => setAssignLessonNumber(num)}
                            className="mt-1 inline-flex h-11 w-full items-center justify-center gap-1 rounded-lg text-[11px] font-bold text-[#5C5878] hover:bg-[#F4F3FA] hover:text-[#4338E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                          >
                            <Calendar className="h-3 w-3" />
                            {term ? 'Reassign half-term' : 'Assign to half-term'}
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Full-width lesson canvas (mock LessonCanvas port — not three-column) */}
        <div className="planner-shell-surface flex min-h-[28rem] min-w-0 flex-col overflow-hidden rounded-[1.75rem] p-2 shadow-[0_1px_3px_rgba(31,27,77,0.04)] sm:p-3">
          <PlannerLessonCanvas
            key={`${builderKey}-${editingLessonNumber ?? 'empty'}`}
            lessonNumber={editingLessonNumber}
            lessonData={activeLessonData}
            keyStageLabel={keyStageLabel(keyStage)}
            classLabel={classLabel}
            yearGroupLabel={currentSheetInfo.sheet}
            canEdit={!isViewOnly}
            onSave={saveCanvasLesson}
            onOpenLessonPlan={() => openLessonForm(editingLessonNumber)}
            onOpenActivity={(a) => setActivityForSteps(a)}
            onDuplicate={
              editingLessonNumber && !isViewOnly ? () => void duplicateActiveLesson() : undefined
            }
          />
        </div>
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

      <LessonPlanModal
        open={lessonPlanOpen}
        onClose={() => {
          setLessonPlanOpen(false);
          setEditingLessonForForm(null);
        }}
        onSave={handleSaveLessonPlan}
        lessonNumber={editingLessonForForm?.lessonNumber}
        lessonData={editingLessonForForm?.lessonData}
        yearGroup={currentSheetInfo.sheet}
      />

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
    </div>
  );
}
