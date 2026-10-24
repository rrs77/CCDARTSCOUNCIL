import React, { useState, useEffect } from 'react';
import { LessonPlannerCalendar } from './LessonPlannerCalendar';
import { ActivityLibrary } from './ActivityLibrary';
import { LessonsWorkspace } from './LessonsWorkspace';
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
import { StudioShell, type StudioNavId, type StudioToolAction } from './studio/StudioShell';
import { HalfTermDesigner } from './halfTerm/HalfTermDesigner';
import { BoltOnsView } from './boltOns/BoltOnsView';
import type { BoltOnsPageId } from './boltOns/types';
import {
  clearBoltOnsUrlIfPresent,
  resolveBoltOnsPageFromLocation,
} from './boltOns/routes';
import { SettingsPage, useSettingsAccess } from './settings';
import {
  clearSettingsUrlIfPresent,
  isSettingsPath,
  resolveSettingsSectionFromLocation,
  syncSettingsUrl,
} from './settings/routes';
import { DEFAULT_SETTINGS_SECTION } from './settings/settingsSections';
import { HelpPage } from './help';
import {
  clearHelpUrlIfPresent,
  isHelpPath,
  syncHelpUrl,
  topicFromHelpPath,
} from './help/routes';
import {
  resolveMainTabFromLocation,
  syncMainUrl,
  tabFromMainPath,
} from './studio/mainRoutes';

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
  'lesson-builder', // legacy alias → redirected to lesson-library
  'activity-library',
  'calendar',
  'our-partners',
  'contact-us',
  'curriculum',
  'lesson-viewer',
  'bolt-ons',
  'assessify',
  'perifeedback',
  'settings',
  'help',
]);

/** Old Lesson Builder / Calendar / More tools links land on unified Lessons / Planner. */
function canonicalizeTab(tab: string): string {
  if (tab === 'lesson-builder') return 'lesson-library';
  if (tab === 'calendar') return 'unit-viewer';
  if (tab === 'more' || tab === 'more-tools') return 'unit-viewer';
  return tab;
}

const BOLT_ON_TABS = new Set(['bolt-ons', 'assessify', 'perifeedback']);

function initialDashboardTab(): string {
  const fromBoltOns = resolveBoltOnsPageFromLocation();
  if (fromBoltOns) return fromBoltOns;
  if (typeof window !== 'undefined' && isHelpPath(window.location.pathname)) {
    return 'help';
  }
  if (typeof window !== 'undefined' && isSettingsPath(window.location.pathname)) {
    return 'settings';
  }
  if (resolveSettingsSectionFromLocation()) return 'settings';
  const fromMain = resolveMainTabFromLocation();
  if (fromMain) return fromMain;
  if (isPartnerHubsLink()) return 'our-partners';
  return 'unit-viewer';
}

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
  const settingsAccess = useSettingsAccess();
  const [activeTab, setActiveTabRaw] = useState<string>(initialDashboardTab);
  const newPartnerHubs = newPartnerHubsEnabled();
  const setActiveTab = (tab: string) => {
    const next = canonicalizeTab(tab);
    setActiveTabRaw(next);
    if (!BOLT_ON_TABS.has(next)) {
      clearBoltOnsUrlIfPresent();
    }
    if (next === 'settings') {
      clearHelpUrlIfPresent();
      const section = resolveSettingsSectionFromLocation() || DEFAULT_SETTINGS_SECTION;
      syncSettingsUrl(section);
    } else if (next === 'help') {
      clearSettingsUrlIfPresent();
      const topic = typeof window !== 'undefined' ? topicFromHelpPath(window.location.pathname) : null;
      syncHelpUrl(topic);
    } else if (BOLT_ON_TABS.has(next)) {
      clearSettingsUrlIfPresent();
      clearHelpUrlIfPresent();
    } else {
      clearSettingsUrlIfPresent();
      clearHelpUrlIfPresent();
      syncMainUrl(next);
    }
  };

  useEffect(() => {
    const tab = canonicalizeTab(activeTab);
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
  const [activityEditorOpen, setActivityEditorOpen] = useState(false);

  const handleTabChange = (newTab: string) => setActiveTab(newTab);

  useEffect(() => {
    try {
      const fromPath = resolveBoltOnsPageFromLocation();
      if (fromPath) {
        setActiveTab(fromPath);
        return;
      }
      if (isHelpPath(window.location.pathname)) {
        setActiveTab('help');
        return;
      }
      if (isSettingsPath(window.location.pathname) || resolveSettingsSectionFromLocation()) {
        setActiveTab('settings');
        return;
      }
      const fromMain = resolveMainTabFromLocation();
      if (fromMain) {
        setActiveTabRaw(canonicalizeTab(fromMain));
        // Clean legacy ?tab= once we have a path (keep Lesson Viewer play/mode).
        const params = new URLSearchParams(window.location.search);
        if (params.has('tab')) {
          const keep = new URLSearchParams();
          const play = params.get('play');
          const mode = params.get('mode');
          if (play) keep.set('play', play);
          if (mode) keep.set('mode', mode);
          const qs = keep.toString();
          const path = window.location.pathname || '/';
          window.history.replaceState({}, '', `${path}${qs ? `?${qs}` : ''}`);
        }
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && ALLOWED.has(tab)) {
        setActiveTab(tab);
        if (BOLT_ON_TABS.has(tab)) return;
        if (tab === 'settings' || tab === 'help') return;
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const page = resolveBoltOnsPageFromLocation();
      if (page) {
        setActiveTab(page);
        return;
      }
      if (isHelpPath(window.location.pathname)) {
        setActiveTab('help');
        return;
      }
      if (isSettingsPath(window.location.pathname)) {
        setActiveTab('settings');
        return;
      }
      const fromMain = tabFromMainPath(window.location.pathname);
      if (fromMain) {
        setActiveTabRaw(canonicalizeTab(fromMain));
        return;
      }
      if (activeTab === 'settings' || activeTab === 'help') {
        setActiveTab('unit-viewer');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [activeTab]);

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
    setActiveTab('lesson-library');
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
    setActiveTab('lesson-library');
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
    /* Standalone Activity Library tab; Lessons workspace keeps its own DnD path */
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
  const navId = canonicalizeTab(activeTab) as StudioNavId;
  const hubsMode = activeTab === 'our-partners';
  const wideCanvas =
    activeTab === 'activity-library' ||
    activeTab === 'lesson-library' ||
    activeTab === 'lesson-builder' ||
    activeTab === 'lesson-viewer' ||
    activeTab === 'unit-viewer' ||
    activeTab === 'curriculum' ||
    activeTab === 'settings' ||
    activeTab === 'help' ||
    activeTab === 'contact-us';
  const editorFlush = activeTab === 'activity-library' && activityEditorOpen;

  const shellNavigate = (id: StudioNavId) => {
    // Help / Contact stay inside StudioShell — never bounce through /forum.
    handleTabChange(id);
  };

  const shellToolAction = (action: StudioToolAction) => {
    if (action === 'class-calendar') {
      handleTabChange('unit-viewer');
      window.setTimeout(() => {
        try {
          window.dispatchEvent(new CustomEvent('ccd:open-class-calendar'));
        } catch {
          /* ignore */
        }
      }, 0);
      return;
    }
    if (action === 'forum') {
      window.location.assign('/forum');
      return;
    }
    if (action === 'walkthrough') {
      // Stay in the main shell (sidebar visible). Do not enter /forum chrome.
      try {
        if (window.location.pathname.replace(/\/+$/, '') !== '/walkthrough') {
          window.history.pushState({}, '', '/walkthrough');
        }
        window.dispatchEvent(new CustomEvent('ccd:start-walkthrough'));
      } catch {
        /* ignore */
      }
    }
  };

  void getThemeForClass;
  void setUnits;

  return (
    <StudioShell
      active={navId}
      onNavigate={shellNavigate}
      onToolAction={shellToolAction}
      hubsMode={hubsMode}
      wideCanvas={wideCanvas}
      editorFlush={editorFlush}
    >
      {showTabsExplainerButton && activeTab !== 'our-partners' && activeTab !== 'help' && !editorFlush && (
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

      {(activeTab === 'lesson-library' || activeTab === 'lesson-builder') && (
        <div className="ccd-fade-in-up" key="ll">
          <LessonsWorkspace
            onAssignToUnit={handleAssignLessonToHalfTerm}
            onUnsavedChangesChange={setLessonBuilderHasUnsavedChanges}
          />
        </div>
      )}

      {activeTab === 'activity-library' && (
        <div className={`ccd-fade-in-up ${editorFlush ? 'h-full min-h-0' : ''}`} key="al">
          {!editorFlush && (
            <>
              <p className="ccd-studio-eyebrow mb-1">
                CONNECT &amp; CREATE / <span>ACTIVITY LIBRARY</span>
              </p>
              <p className="mb-4 text-sm text-[#77738F]">
                Folders and activities for{' '}
                <strong className="text-[#1F1B4D]">{currentSheetInfo.display || currentSheetInfo.sheet}</strong>.
                Switch class in the header to see that class&apos;s library.
              </p>
            </>
          )}
          <ActivityLibrary
            onActivitySelect={handleActivityAdd}
            selectedActivities={[]}
            className={currentSheetInfo.sheet}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onEditorOpenChange={setActivityEditorOpen}
          />
        </div>
      )}

      {activeTab === 'lesson-viewer' && (
        <div className="ccd-fade-in-up" key="lv">
          <p className="ccd-studio-eyebrow mb-1">
            CONNECT &amp; CREATE / <span>SLIDES</span>
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

      {activeTab === 'settings' && (
        <div className="ccd-fade-in-up h-full min-h-0" key="settings">
          <SettingsPage
            access={settingsAccess}
            initialSection={resolveSettingsSectionFromLocation() || DEFAULT_SETTINGS_SECTION}
          />
        </div>
      )}

      {activeTab === 'help' && (
        <div className="ccd-fade-in-up h-full min-h-0 -mx-1 sm:mx-0" key="help">
          <HelpPage initialTopic={topicFromHelpPath(window.location.pathname)} />
        </div>
      )}

      {BOLT_ON_TABS.has(activeTab) && (
        <BoltOnsView
          key="boltons"
          page={activeTab as BoltOnsPageId}
          onNavigate={(page) => handleTabChange(page)}
        />
      )}
    </StudioShell>
  );
}
