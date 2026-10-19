import React, { useState, useEffect } from 'react';
import { UnitViewer } from './UnitViewer';
import { LessonPlanBuilder } from './LessonPlanBuilder';
import { LessonPlannerCalendar } from './LessonPlannerCalendar';
import { ActivityLibrary } from './ActivityLibrary';
import { LessonLibrary } from './LessonLibrary';
import { CircleHelp } from 'lucide-react';
import { OurPartners } from './OurPartners';
import { PartnerHubsPreview, isPartnerHubsLink, newPartnerHubsEnabled } from './hubsPreview/PartnerHubsPreview';
import { ContactUsPanel } from './ContactUsPanel';
import { Planner } from './planner/Planner';
import { InteractiveLessonHub } from '../features/interactive-lesson-viewer';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { isAuthorizedDemoMode } from '../utils/demoMode';
import type { Activity, LessonPlan } from '../contexts/DataContext';
import { StudioShell, type StudioNavId } from './studio/StudioShell';
import { MoreToolsPanel } from './studio/MoreToolsPanel';
import { HalfTermDesigner } from './halfTerm/HalfTermDesigner';

interface Unit {
  id: string;
  name: string;
  description: string;
  lessonNumbers: string[];
  color: string;
  term?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HALF_TERMS = [
  { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct' },
  { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec' },
  { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb' },
  { id: 'SP2', name: 'Spring 2', months: 'Mar-Apr' },
  { id: 'SM1', name: 'Summer 1', months: 'Apr-May' },
  { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul' },
];

const ALLOWED = new Set([
  'unit-viewer',
  'lesson-library',
  'lesson-builder',
  'activity-library',
  'calendar',
  'our-partners',
  'contact-us',
  'curriculum',
  'more',
  'lesson-viewer',
]);

export function Dashboard() {
  const {
    currentSheetInfo,
    setCurrentSheetInfo,
    updateHalfTerm,
    getLessonsForHalfTerm,
    getTermSpecificLessonNumber,
    userCreatedLessonPlans,
    addOrUpdateUserLessonPlan,
    deleteUserLessonPlan,
  } = useData();
  const { getThemeForClass } = useSettings();
  const [activeTab, setActiveTabRaw] = useState<string>(() =>
    isPartnerHubsLink() ? 'our-partners' : 'unit-viewer',
  );
  const newPartnerHubs = newPartnerHubsEnabled();
  const setActiveTab = (tab: string) => setActiveTabRaw(tab === 'calendar' ? 'unit-viewer' : tab);

  useEffect(() => {
    const tab = activeTab === 'calendar' ? 'unit-viewer' : activeTab;
    try {
      document.documentElement.dataset.ccdTab = tab;
      window.dispatchEvent(new CustomEvent('ccd:active-tab', { detail: { tab } }));
    } catch {
      /* ignore */
    }
  }, [activeTab]);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [, setUnits] = useState<Unit[]>([]);
  const [, setLessonBuilderHasUnsavedChanges] = useState(false);

  const handleTabChange = (newTab: string) => setActiveTab(newTab);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && ALLOWED.has(tab)) {
        setActiveTab(tab);
        // Preserve player deep-link params for Lesson Viewer hub to consume.
        const keep = new URLSearchParams();
        const play = params.get('play');
        const mode = params.get('mode');
        if (play) keep.set('play', play);
        if (mode) keep.set('mode', mode);
        const qs = keep.toString();
        window.history.replaceState({}, '', `${window.location.pathname || '/'}${qs ? `?${qs}` : ''}`);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const openContact = () => setActiveTab('contact-us');
    const openPartners = () => setActiveTab('our-partners');
    const openTab = (e: Event) => {
      const tab = (e as CustomEvent<{ tab?: string }>).detail?.tab;
      if (tab && ALLOWED.has(tab)) setActiveTab(tab);
    };
    window.addEventListener('ccd:open-contact-us', openContact);
    window.addEventListener('ccd:open-our-partners', openPartners);
    window.addEventListener('ccd:open-tab', openTab);
    return () => {
      window.removeEventListener('ccd:open-contact-us', openContact);
      window.removeEventListener('ccd:open-our-partners', openPartners);
      window.removeEventListener('ccd:open-tab', openTab);
    };
  }, []);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setActiveTab('lesson-builder');
  };

  const handleCreateLessonPlan = (date: Date) => {
    const weekNumber = Math.ceil(
      (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
    const newPlan: LessonPlan = {
      id: crypto.randomUUID(),
      date,
      week: weekNumber,
      className: currentSheetInfo.sheet,
      activities: [],
      duration: 0,
      notes: '',
      status: 'planned',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    void addOrUpdateUserLessonPlan(newPlan);
    setActiveTab('lesson-builder');
  };

  const handleDeleteLessonPlan = (planId: string) => {
    void deleteUserLessonPlan(planId);
  };

  const handleUpdateLessonPlan = async (updatedPlan: LessonPlan) => {
    await addOrUpdateUserLessonPlan({
      ...updatedPlan,
      className: updatedPlan.className || currentSheetInfo.sheet,
      updatedAt: new Date(),
    });
  };

  const handleActivityAdd = (_activity: Activity) => {
    /* Standalone Activity Library tab; Lesson Builder keeps its own DnD path */
  };

  const handleAssignLessonToHalfTerm = (lessonNumber: string, halfTermId: string) => {
    const currentLessons = getLessonsForHalfTerm(halfTermId);
    if (!currentLessons.includes(lessonNumber)) {
      updateHalfTerm(halfTermId, [...currentLessons, lessonNumber], false);
      const halfTermName = HALF_TERMS.find((t) => t.id === halfTermId)?.name;
      const termSpecificNumber = getTermSpecificLessonNumber(lessonNumber, halfTermId);
      alert(`Lesson ${termSpecificNumber} has been added to the ${halfTermName} half-term.`);
    } else {
      const termSpecificNumber = getTermSpecificLessonNumber(lessonNumber, halfTermId);
      const halfTermName = HALF_TERMS.find((t) => t.id === halfTermId)?.name;
      alert(`Lesson ${termSpecificNumber} is already assigned to ${halfTermName}.`);
    }
  };

  const showTabsExplainerButton = isAuthorizedDemoMode();
  const navId = (activeTab === 'calendar' ? 'unit-viewer' : activeTab) as StudioNavId;
  const hubsMode = activeTab === 'our-partners';
  const wideCanvas = activeTab === 'activity-library';

  const shellNavigate = (id: StudioNavId) => handleTabChange(id);

  void getThemeForClass;
  void setUnits;

  return (
    <StudioShell active={navId} onNavigate={shellNavigate} hubsMode={hubsMode} wideCanvas={wideCanvas}>
      {showTabsExplainerButton && activeTab !== 'our-partners' && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => {
              try {
                window.dispatchEvent(new CustomEvent('ccd:open-tabs-explainer'));
              } catch {
                /* ignore */
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[#1F1B4D]/70 transition-colors hover:bg-white/70"
            title="About these areas"
            aria-label="About these areas"
          >
            <CircleHelp className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">About these areas</span>
          </button>
        </div>
      )}

      {activeTab === 'unit-viewer' && (
        <div className="ccd-fade-in-up" key="uv">
          <Planner
            renderTerm={() => (
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#E2E0EF] bg-white px-3 py-2.5">
                  <p className="text-[12px] text-[#77738F]">
                    Editing <strong className="text-[#1F1B4D]">{currentSheetInfo.display || currentSheetInfo.sheet}</strong> only.
                    Open the full map to see every year group.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        window.dispatchEvent(new CustomEvent('ccd:open-tab', { detail: { tab: 'curriculum' } }));
                      } catch {
                        handleTabChange('curriculum');
                      }
                    }}
                    className="inline-flex h-8 items-center rounded-lg bg-[#4338E8] px-2.5 text-[12px] font-extrabold text-white hover:bg-[#3529d1]"
                  >
                    All year groups →
                  </button>
                </div>
                <UnitViewer />
              </div>
            )}
            renderClassic={() => (
              <LessonPlannerCalendar
                onDateSelect={handleDateSelect}
                selectedDate={selectedDate}
                lessonPlans={userCreatedLessonPlans}
                onUpdateLessonPlan={handleUpdateLessonPlan}
                onDeleteLessonPlan={handleDeleteLessonPlan}
                onCreateLessonPlan={handleCreateLessonPlan}
                className={currentSheetInfo.sheet}
              />
            )}
          />
        </div>
      )}

      {activeTab === 'curriculum' && (
        <div className="ccd-fade-in-up" key="cu-units">
          <HalfTermDesigner />
        </div>
      )}

      {activeTab === 'lesson-library' && (
        <div className="ccd-fade-in-up" key="ll">
          <p className="ccd-studio-eyebrow mb-1">
            YOUR TEACHING / <span>LESSONS</span>
          </p>
          <p className="mb-4 text-sm text-[#77738F]">
            Lessons saved from Lesson Builder for{' '}
            <strong className="text-[#1F1B4D]">{currentSheetInfo.display || currentSheetInfo.sheet}</strong>.
            Filter by half-term, open a plan, or assign it into the Half-terms map.
          </p>
          <LessonLibrary
            className={currentSheetInfo.sheet}
            onAssignToUnit={handleAssignLessonToHalfTerm}
            onNavigateToBuilder={() => handleTabChange('lesson-builder')}
          />
        </div>
      )}

      {activeTab === 'lesson-builder' && (
        <div className="ccd-fade-in-up" key="lb">
          <p className="ccd-studio-eyebrow mb-1">
            YOUR TEACHING / <span>LESSON BUILDER</span>
          </p>
          <p className="mb-3 text-sm text-[#77738F]">
            Drag activities into a lesson, then <strong className="text-[#1F1B4D]">Save Lesson</strong>. It appears under{' '}
            <button
              type="button"
              onClick={() => handleTabChange('lesson-library')}
              className="font-semibold text-[#4338E8] underline-offset-2 hover:underline"
            >
              Lessons
            </button>
            .
          </p>
          {/* DnD: LessonDropZone + ActivityCard remain inside LessonPlanBuilder; DndRoot wraps the app */}
          <LessonPlanBuilder onUnsavedChangesChange={setLessonBuilderHasUnsavedChanges} />
        </div>
      )}

      {activeTab === 'activity-library' && (
        <div className="ccd-fade-in-up" key="al">
          <p className="ccd-studio-eyebrow mb-1">
            YOUR TEACHING / <span>ACTIVITY LIBRARY</span>
          </p>
          <p className="mb-4 text-sm text-[#77738F]">
            Showing folders and activities for{' '}
            <strong className="text-[#1F1B4D]">{currentSheetInfo.display || currentSheetInfo.sheet}</strong>. Switch
            class in the header to see that class&apos;s library. Manage which folders each class sees in Settings.
          </p>
          <ActivityLibrary
            onActivitySelect={handleActivityAdd}
            selectedActivities={[]}
            className={currentSheetInfo.sheet}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>
      )}

      {activeTab === 'lesson-viewer' && (
        <div className="ccd-fade-in-up" key="lv">
          <p className="ccd-studio-eyebrow mb-1">
            CONNECT &amp; CREATE / <span>LESSON VIEWER</span>
          </p>
          <p className="mb-4 text-sm text-[#77738F]">
            Build and present interactive classroom lessons — attach a player-only link to any CCD lesson.
          </p>
          <InteractiveLessonHub />
        </div>
      )}

      {activeTab === 'our-partners' && (
        <div className="ccd-fade-in-up" key="op">
          {newPartnerHubs ? <PartnerHubsPreview /> : <OurPartners />}
        </div>
      )}

      {activeTab === 'contact-us' && (
        <div className="ccd-fade-in-up" key="contact">
          <ContactUsPanel />
        </div>
      )}

      {activeTab === 'more' && (
        <div className="ccd-fade-in-up" key="more">
          <MoreToolsPanel onNavigate={shellNavigate} />
        </div>
      )}
    </StudioShell>
  );
}
