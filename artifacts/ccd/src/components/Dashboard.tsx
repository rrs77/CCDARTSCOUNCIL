import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/Tabs";
import { UnitViewer } from "./UnitViewer";
import { LessonPlanBuilder } from "./LessonPlanBuilder";
import { LessonPlannerCalendar } from "./LessonPlannerCalendar";
import { ActivityLibrary } from "./ActivityLibrary";
import { LessonLibrary } from "./LessonLibrary";
import { Calendar, BookOpen, Edit3, FolderOpen, Tag, Handshake } from 'lucide-react';
import { OurPartners } from './OurPartners';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { useAuth } from '../hooks/useAuth';
import { useIsViewOnly } from '../hooks/useIsViewOnly';
import type { Activity, LessonPlan } from '../contexts/DataContext';
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

// Define half-term periods (for reference only)
const HALF_TERMS = [
  { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct' },
  { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec' },
  { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb' },
  { id: 'SP2', name: 'Spring 2', months: 'Mar-Apr' },
  { id: 'SM1', name: 'Summer 1', months: 'Apr-May' },
  { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul' },
];

export function Dashboard() {
  const { user } = useAuth();
  const isViewOnly = useIsViewOnly();
  const { 
    currentSheetInfo,
    setCurrentSheetInfo,
    allLessonsData, 
    updateHalfTerm, 
    getLessonsForHalfTerm,
    getTermSpecificLessonNumber,
    getLessonDisplayTitle,
    userCreatedLessonPlans,
    addOrUpdateUserLessonPlan,
    deleteUserLessonPlan,
  } = useData();
  const { getThemeForClass } = useSettings();
  const [activeTab, setActiveTab] = useState('unit-viewer');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [units, setUnits] = useState<Unit[]>([]);
  
  // Lesson Builder state for unsaved changes warning
  const [lessonBuilderHasUnsavedChanges, setLessonBuilderHasUnsavedChanges] = useState(false);
  
  // Custom tab change handler - no prompts since drafts auto-save
  const handleTabChange = (newTab: string) => {
    // No prompts needed - drafts are auto-saved to localStorage
    // User can switch tabs freely and continue working when they return
    setActiveTab(newTab);
  };

  // Open tab from `/?tab=our-partners` (Back to CCDesigner from partner hubs)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      const allowed = new Set([
        'unit-viewer',
        'lesson-library',
        'lesson-builder',
        'activity-library',
        'calendar',
        'our-partners',
      ]);
      if (tab && allowed.has(tab)) {
        setActiveTab(tab);
        window.history.replaceState({}, '', window.location.pathname || '/');
      }
    } catch {
      /* ignore */
    }
  }, []);

  // After Add to CCDesigner from /roh, /weteachdrama, or other partner hubs
  useEffect(() => {
    try {
      const raw =
        sessionStorage.getItem('ccd-open-after-partner') ||
        sessionStorage.getItem('ccd-open-after-roh');
      if (!raw) return;
      sessionStorage.removeItem('ccd-open-after-partner');
      sessionStorage.removeItem('ccd-open-after-roh');
      const parsed = JSON.parse(raw) as { sheetId?: string; tab?: string };
      const sheetId = parsed.sheetId || 'Year5';
      setCurrentSheetInfo({
        sheet: sheetId,
        display:
          sheetId === 'Year5'
            ? 'Year 5'
            : sheetId === 'Year6'
              ? 'Year 6'
              : /^Year\d+$/i.test(sheetId)
                ? sheetId.replace(/^(Year)(\d+)$/i, 'Year $2')
                : sheetId,
        eyfs: `${sheetId} Statements`,
      });
      if (sheetId === 'Year5' || String(sheetId).includes('Year 5')) {
        setSelectedCategory('Romeo and Juliet — Explore');
      } else if (sheetId === 'Year6' || String(sheetId).includes('Year 6')) {
        setSelectedCategory('How to Build an Orchestra — Listening');
      } else if (String(sheetId).toLowerCase().includes('drama')) {
        setSelectedCategory('Blood Brothers — Explore');
      }
      setActiveTab(parsed.tab || 'lesson-library');
    } catch {
      /* ignore */
    }
  }, [setCurrentSheetInfo]);
  
  // Get theme colors for current class
  const theme = getThemeForClass(currentSheetInfo.sheet);

  // Helper function to get sequential lesson number within a half-term
  const getSequentialLessonNumber = (lessonNumber: string, halfTermId: string) => {
    const lessonsInHalfTerm = getLessonsForHalfTerm(halfTermId);
    const sortedLessons = [...lessonsInHalfTerm].sort((a, b) => parseInt(a) - parseInt(b));
    return sortedLessons.indexOf(lessonNumber) + 1;
  };

  // Load units from localStorage
  React.useEffect(() => {
    const savedUnits = localStorage.getItem('units');
    if (savedUnits) {
      try {
        const parsedUnits = JSON.parse(savedUnits).map((unit: any) => ({
          ...unit,
          createdAt: new Date(unit.createdAt),
          updatedAt: new Date(unit.updatedAt),
        }));
        setUnits(parsedUnits);
      } catch (error) {
        console.error('Error parsing saved units:', error);
        setUnits([]);
      }
    } else {
      // Create some sample units if none exist
      const sampleUnits: Unit[] = [
        {
          id: 'unit-1',
          name: 'Welcome Songs',
          description: 'A collection of welcome songs and activities to start the lesson.',
          lessonNumbers: ['1', '2', '3'],
          color: '#3B82F6',
          term: 'A1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'unit-2',
          name: 'Rhythm Activities',
          description: 'Activities focused on developing rhythm skills using percussion instruments.',
          lessonNumbers: ['4', '5', '6'],
          color: '#F59E0B',
          term: 'A2',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'unit-3',
          name: 'Movement and Dance',
          description: 'Activities that combine music with movement and dance elements.',
          lessonNumbers: ['7', '8', '9'],
          color: '#10B981',
          term: 'SP1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      setUnits(sampleUnits);
      localStorage.setItem('units', JSON.stringify(sampleUnits));
    }
  }, []);

  // Save units to localStorage
  const saveUnits = (updatedUnits: Unit[]) => {
    localStorage.setItem('units', JSON.stringify(updatedUnits));
    setUnits(updatedUnits);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setActiveTab('lesson-builder');
  };

  const handleCreateLessonPlan = (date: Date) => {
    const weekNumber = Math.ceil(
      (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 
      (7 * 24 * 60 * 60 * 1000)
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
    if (isViewOnly) {
      alert('View-only mode: Changes cannot be saved.');
      return;
    }
    void deleteUserLessonPlan(planId);
  };

  const handleUpdateLessonPlan = async (updatedPlan: LessonPlan) => {
    if (isViewOnly) {
      alert('View-only mode: Changes cannot be saved.');
      return;
    }

    await addOrUpdateUserLessonPlan({
      ...updatedPlan,
      className: updatedPlan.className || currentSheetInfo.sheet,
      updatedAt: new Date(),
    });
  };

  const handleActivityAdd = (activity: Activity) => {
    // This would be handled by the LessonPlanBuilder component
    console.log('Activity added:', activity);
  };

  const handleLessonSelect = (lessonNumber: string) => {
    // Navigate to lesson builder with the selected lesson
    setActiveTab('lesson-builder');
    // The LessonPlanBuilder would need to be updated to accept an initialLessonId prop
    // and load that lesson when it mounts
  };

  // FIXED: Now uses sequential lesson numbering in error messages
  const handleAssignLessonToHalfTerm = (lessonNumber: string, halfTermId: string) => {
    console.log('Dashboard: Assigning lesson', lessonNumber, 'to half-term', halfTermId);
    
    // Get current lessons for this half-term from DataContext
    const currentLessons = getLessonsForHalfTerm(halfTermId);
    console.log('Current lessons in half-term', halfTermId, ':', currentLessons);
    
    // Add the lesson if it's not already there
    if (!currentLessons.includes(lessonNumber)) {
      const updatedLessons = [...currentLessons, lessonNumber];
      console.log('Adding lesson to half-term. Updated lessons:', updatedLessons);
      
      // Use DataContext's updateHalfTerm function
      updateHalfTerm(halfTermId, updatedLessons, false);
      
      // Show a success message with term-specific numbering
      const halfTermName = HALF_TERMS.find(t => t.id === halfTermId)?.name;
      const termSpecificNumber = getTermSpecificLessonNumber(lessonNumber, halfTermId);
      alert(`Lesson ${termSpecificNumber} has been added to the ${halfTermName} half-term.`);
    } else {
      // Get term-specific number for this lesson in the target half-term
      const termSpecificNumber = getTermSpecificLessonNumber(lessonNumber, halfTermId);
      const halfTermName = HALF_TERMS.find(t => t.id === halfTermId)?.name;
      console.log('Lesson already assigned to this half-term');
      alert(`Lesson ${termSpecificNumber} is already assigned to ${halfTermName}.`);
    }
  };


  const dashTabClass =
    'ccd-dash-tab flex flex-col sm:flex-row items-center justify-center gap-1 p-2 sm:p-3 text-xs sm:text-sm min-h-[44px] w-full text-center leading-tight whitespace-normal';

  return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--ccd-sage, #F3F6F3)', paddingTop: '56px' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6 lg:mb-8">
            {/* 6 tabs — grid-cols-3 on mobile; sm+ uses 6 so nothing wraps to a clipped row */}
            <TabsList className="ccd-dash-tabs w-full h-auto grid grid-cols-3 sm:grid-cols-6 gap-1 auto-rows-auto">
              <TabsTrigger
                value="unit-viewer"
                data-tab="unit-viewer"
                className={dashTabClass}
              >
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
                <span className="hidden sm:inline">Unit Viewer</span>
                <span className="sm:hidden">Units</span>
              </TabsTrigger>

              <TabsTrigger
                value="lesson-library"
                data-tab="lesson-library"
                className={dashTabClass}
              >
                <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
                <span className="hidden sm:inline">Lesson Library</span>
                <span className="sm:hidden">Lessons</span>
              </TabsTrigger>

              <TabsTrigger
                value="lesson-builder"
                data-tab="lesson-builder"
                className={dashTabClass}
              >
                <Edit3 className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
                <span className="hidden sm:inline">Lesson Builder</span>
                <span className="sm:hidden">Builder</span>
              </TabsTrigger>

              <TabsTrigger
                value="activity-library"
                data-tab="activity-library"
                className={dashTabClass}
              >
                <Tag className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
                <span className="hidden sm:inline">Activity Library</span>
                <span className="sm:hidden">Activities</span>
              </TabsTrigger>

              <TabsTrigger
                value="calendar"
                data-tab="calendar"
                className={dashTabClass}
              >
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
                <span className="hidden sm:inline">Calendar</span>
                <span className="sm:hidden">Calendar</span>
              </TabsTrigger>

              <TabsTrigger
                value="our-partners"
                data-tab="our-partners"
                className={dashTabClass}
              >
                <Handshake className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
                <span className="hidden sm:inline">Partner Hubs</span>
                <span className="sm:hidden">Hubs</span>
              </TabsTrigger>
            </TabsList>


            {/* `key={activeTab}` on each TabsContent forces a fresh mount when
                the tab changes, which re-triggers the `ccd-fade-in-up` entrance
                so panel switches feel intentional rather than abrupt. The
                underlying components manage their own state via context, so
                remounting the wrapper is purely a visual concern. */}
            <TabsContent value="unit-viewer" className="mt-6 ccd-fade-in-up" key={`uv-${activeTab}`}>
              <UnitViewer />
            </TabsContent>

            <TabsContent value="lesson-library" className="mt-6 ccd-fade-in-up" key={`ll-${activeTab}`}>
              <LessonLibrary 
                className={currentSheetInfo.sheet}
                onAssignToUnit={handleAssignLessonToHalfTerm}
                onNavigateToBuilder={() => handleTabChange('lesson-builder')}
              />
            </TabsContent>

            <TabsContent value="lesson-builder" className="mt-6 ccd-fade-in-up" key={`lb-${activeTab}`}>
              <LessonPlanBuilder 
                onUnsavedChangesChange={setLessonBuilderHasUnsavedChanges}
              />
            </TabsContent>

            <TabsContent value="activity-library" className="mt-6 ccd-fade-in-up" key={`al-${activeTab}`}>
              <ActivityLibrary
                onActivitySelect={handleActivityAdd}
                selectedActivities={[]}
                className={currentSheetInfo.sheet}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            </TabsContent>

            <TabsContent value="calendar" className="mt-6 ccd-fade-in-up" key={`cal-${activeTab}`}>
              <LessonPlannerCalendar
                onDateSelect={handleDateSelect}
                selectedDate={selectedDate}
                lessonPlans={userCreatedLessonPlans}
                onUpdateLessonPlan={handleUpdateLessonPlan}
                onDeleteLessonPlan={handleDeleteLessonPlan}
                onCreateLessonPlan={handleCreateLessonPlan}
                className={currentSheetInfo.sheet}
              />
            </TabsContent>

            <TabsContent value="our-partners" className="mt-6 ccd-fade-in-up" key={`op-${activeTab}`}>
              <OurPartners />
            </TabsContent>
          </Tabs>
        </div>
      </div>
  );
}