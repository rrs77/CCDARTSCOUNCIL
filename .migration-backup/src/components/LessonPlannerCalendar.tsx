import React, { useState, useEffect, useRef, memo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Edit3, 
  Trash2, 
  Clock,
  Users,
  BookOpen,
  Save,
  X,
  FolderOpen,
  Tag,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Printer,
  Download,
  Check,
  AlertCircle,
  Repeat,
  Calendar,
  MoreHorizontal,
  Pencil,
  Copy,
  Eye
} from 'lucide-react';
import { 
  format, 
  startOfWeek, 
  endOfWeek,
  addDays, 
  addWeeks, 
  subWeeks, 
  isSameDay, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  getDay,
  isSameMonth,
  addMonths,
  subMonths,
  parseISO,
  isWithinInterval,
  isBefore,
  isAfter,
  addMinutes,
  setHours,
  setMinutes,
  getHours,
  getMinutes,
  isToday
} from 'date-fns';
import { useDrop, useDrag } from 'react-dnd';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { TimetableModal } from './TimetableModal';
import { TimetableBuilder } from './TimetableBuilder';
import { EventModal } from './EventModal';
import { LessonDetailsModal } from './LessonDetailsModal';
import { LessonPrintModal } from './LessonPrintModal';
import { CalendarLessonAssignmentModal } from './CalendarLessonAssignmentModal';
import { TimeSlotLessonModal } from './TimeSlotLessonModal';
import { WeekLessonView } from './WeekLessonView';
import { useLessonStacks } from '../hooks/useLessonStacks';
import { toast } from 'react-hot-toast';
import type { Activity, LessonPlan } from '../contexts/DataContext';

interface LessonPlannerCalendarProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
  lessonPlans: LessonPlan[];
  onUpdateLessonPlan: (plan: LessonPlan) => void;
  onDeleteLessonPlan?: (planId: string) => void;
  onCreateLessonPlan: (date: Date) => void;
  className: string;
}

// Define the timetable class structure
interface TimetableClass {
  id: string;
  day: number; // 0-6 for Sunday-Saturday
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  className: string;
  location: string;
  color: string;
  recurringUnitId?: string;
}

// Define the holiday/event structure
interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  type: 'holiday' | 'inset' | 'event';
  description?: string;
  color: string;
}

// Map day numbers to names
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Map term IDs to colors
const TERM_COLORS: Record<string, string> = {
  'A1': '#F59E0B', // Amber
  'A2': '#EA580C', // Orange
  'SP1': '#10B981', // Emerald
  'SP2': '#059669', // Green
  'SM1': '#3B82F6', // Blue
  'SM2': '#6366F1', // Indigo
};

// Event type colors
const EVENT_COLORS = {
  'holiday': '#EF4444', // Red
  'inset': '#8B5CF6', // Purple
  'event': '#F59E0B', // Amber
};

export function LessonPlannerCalendar({
  onDateSelect,
  selectedDate,
  lessonPlans,
  onUpdateLessonPlan,
  onDeleteLessonPlan,
  onCreateLessonPlan,
  className
}: LessonPlannerCalendarProps) {
  const { allLessonsData, units: dataContextUnits, halfTerms, updateHalfTerm } = useData();
  const { getThemeForClass, getCategoryColor, customYearGroups, settings } = useSettings();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'week-lessons'>('month');
  const [editingPlan, setEditingPlan] = useState<LessonPlan | null>(null);
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [selectedPlan, setSelectedPlan] = useState<LessonPlan | null>(null);
  const [selectedDateWithPlans, setSelectedDateWithPlans] = useState<{date: Date, plans: LessonPlan[]} | null>(null);
  const [isLessonSummaryOpen, setIsLessonSummaryOpen] = useState(false);
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [timetableClasses, setTimetableClasses] = useState<TimetableClass[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedLessonForDetails, setSelectedLessonForDetails] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{day: number, date: Date, hour: number} | null>(null);
  const [showTimeSlotLessonModal, setShowTimeSlotLessonModal] = useState(false);
  const [showTimetableBuilder, setShowTimetableBuilder] = useState(false);
  const [editingTimetableClass, setEditingTimetableClass] = useState<TimetableClass | null>(null);
  const [dayViewDate, setDayViewDate] = useState<Date>(new Date());
  const [units, setUnits] = useState<any[]>([]); // Units from UnitViewer
  const [termTimeConfigs, setTermTimeConfigs] = useState<Array<{termId: string, startDate: Date, endDate: Date, startTime?: string, endTime?: string}>>([]);
  const [showTermTimeConfig, setShowTermTimeConfig] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentDate, setAssignmentDate] = useState<Date | null>(null);
  const [removeFromDayDropdownOpen, setRemoveFromDayDropdownOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const { stacks } = useLessonStacks();
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Get theme colors for current class
  const theme = getThemeForClass(className);

  // Load units from UnitViewer's localStorage
  useEffect(() => {
    const savedUnits = localStorage.getItem(`units-${className}`);
    if (savedUnits) {
      try {
        const parsedUnits = JSON.parse(savedUnits).map((unit: any) => ({
          ...unit,
          createdAt: new Date(unit.createdAt),
          updatedAt: new Date(unit.updatedAt),
        }));
        setUnits(parsedUnits);
      } catch (error) {
        console.error('Error loading units from UnitViewer:', error);
        setUnits([]);
      }
    }
  }, [className]);

  // Load term time configurations
  useEffect(() => {
    const savedConfigs = localStorage.getItem(`term-time-configs-${className}`);
    if (savedConfigs) {
      try {
        const parsed = JSON.parse(savedConfigs).map((config: any) => ({
          ...config,
          startDate: new Date(config.startDate),
          endDate: new Date(config.endDate),
        }));
        setTermTimeConfigs(parsed);
      } catch (error) {
        console.error('Error loading term time configs:', error);
        setTermTimeConfigs([]);
      }
    }
  }, [className]);

  // Load timetable classes from localStorage
  useEffect(() => {
    const savedTimetable = localStorage.getItem(`timetable-${className}`);
    if (savedTimetable) {
      try {
        setTimetableClasses(JSON.parse(savedTimetable));
      } catch (error) {
        console.error('Error loading timetable:', error);
        setTimetableClasses([]);
      }
    }
    
    // Load calendar events from localStorage
    const savedEvents = localStorage.getItem(`calendar-events-${className}`);
    if (savedEvents) {
      try {
        const parsedEvents = JSON.parse(savedEvents);
        // Convert date strings to Date objects
        const eventsWithDates = parsedEvents.map((event: any) => ({
          ...event,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate)
        }));
        setCalendarEvents(eventsWithDates);
      } catch (error) {
        console.error('Error loading calendar events:', error);
        setCalendarEvents([]);
      }
    }
  }, [className]);

  // Save timetable classes to localStorage
  const saveTimetableClasses = (classes: TimetableClass[]) => {
    localStorage.setItem(`timetable-${className}`, JSON.stringify(classes));
    setTimetableClasses(classes);
  };

  // Save calendar events to localStorage
  const saveCalendarEvents = (events: CalendarEvent[]) => {
    localStorage.setItem(`calendar-events-${className}`, JSON.stringify(events));
    setCalendarEvents(events);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDay = getDay(monthStart);
  
  // Calculate days from previous month to show
  const daysFromPrevMonth = startDay;
  const prevMonthDays = Array.from({ length: daysFromPrevMonth }, (_, i) => 
    addDays(monthStart, -daysFromPrevMonth + i)
  );
  
  // Current month days
  const currentMonthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate days from next month to show (to complete the grid)
  const totalDaysShown = Math.ceil((daysFromPrevMonth + currentMonthDays.length) / 7) * 7;
  const daysFromNextMonth = totalDaysShown - (daysFromPrevMonth + currentMonthDays.length);
  const nextMonthDays = Array.from({ length: daysFromNextMonth }, (_, i) => 
    addDays(addDays(monthEnd, 1), i)
  );
  
  // Combine all days
  const calendarDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  // Week view days
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Day view hours (8am to 6pm)
  const dayViewHours = Array.from({ length: 11 }, (_, i) => i + 8);

  // Filter lesson plans based on unit filter and class
  // Match by exact className or by year group ID/name (e.g., "LKG" matches "Lower Kindergarten Music")
  const filteredLessonPlans = React.useMemo(() => {
    // Get the current year group to help with matching
    // Ensure customYearGroups is an array
    const yearGroups = Array.isArray(customYearGroups) ? customYearGroups : [];
    const currentYearGroup = yearGroups.find(yg => yg && (yg.id === className || yg.name === className));
    const matchingKeys = currentYearGroup 
      ? [currentYearGroup.id, currentYearGroup.name, className].filter(Boolean)
      : [className];
    
    let filtered = lessonPlans.filter(plan => {
      if (!plan.className) return false;
      
      // Exact match
      if (matchingKeys.some(key => plan.className === key)) {
        return true;
      }
      
      // If className doesn't match exactly, check if it's a year group match
      // This handles cases where Supabase has "LKG" but className prop is "Lower Kindergarten Music"
      const planClassLower = plan.className.toLowerCase();
      
      // Check against all matching keys
      for (const key of matchingKeys) {
        if (!key) continue;
        const keyLower = key.toLowerCase();
        
        // Check if one contains the other (e.g., "Lower Kindergarten Music" contains "LKG")
        if (planClassLower.includes(keyLower) || keyLower.includes(planClassLower)) {
          return true;
        }
      }
      
      // Also check for common abbreviations
      const classNameLower = className.toLowerCase();
      if ((planClassLower.includes('lkg') || planClassLower.includes('lower kindergarten')) && 
          (classNameLower.includes('lkg') || classNameLower.includes('lower kindergarten'))) {
        return true;
      }
      if ((planClassLower.includes('ukg') || planClassLower.includes('upper kindergarten')) && 
          (classNameLower.includes('ukg') || classNameLower.includes('upper kindergarten'))) {
        return true;
      }
      if (planClassLower.includes('reception') && classNameLower.includes('reception')) {
        return true;
      }
      
      return false;
    });
    
    if (unitFilter !== 'all') {
      filtered = filtered.filter(plan => plan.unitId === unitFilter);
    }
    
    return filtered;
  }, [lessonPlans, unitFilter, className, customYearGroups]);

  // Get lesson plans for a specific date (guard against invalid plan.date to avoid day view crash)
  const getLessonPlansForDate = (date: Date): LessonPlan[] => {
    if (!(date instanceof Date) || isNaN(date.getTime())) return [];
    return filteredLessonPlans.filter(plan => {
      try {
        const planDate = plan.date ? new Date(plan.date) : null;
        return planDate && !isNaN(planDate.getTime()) && isSameDay(planDate, date);
      } catch {
        return false;
      }
    });
  };

  // Get timetable classes for a specific day
  const getTimetableClassesForDay = (day: number): TimetableClass[] => {
    return timetableClasses.filter(tClass => tClass.day === day);
  };

  // Safe date check for event intervals (avoid day view crash on invalid event dates)
  const isDateValid = (d: Date) => d instanceof Date && !isNaN(d.getTime());
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    if (!isDateValid(date)) return [];
    return calendarEvents.filter(event => {
      try {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        if (!isDateValid(start) || !isDateValid(end)) return false;
        return isWithinInterval(date, { start, end });
      } catch {
        return false;
      }
    });
  };

  const isHoliday = (date: Date): boolean => {
    if (!isDateValid(date)) return false;
    return calendarEvents.some(event => {
      try {
        if (event.type !== 'holiday') return false;
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        if (!isDateValid(start) || !isDateValid(end)) return false;
        return isWithinInterval(date, { start, end });
      } catch {
        return false;
      }
    });
  };

  const isInsetDay = (date: Date): boolean => {
    if (!isDateValid(date)) return false;
    return calendarEvents.some(event => {
      try {
        if (event.type !== 'inset') return false;
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        if (!isDateValid(start) || !isDateValid(end)) return false;
        return isWithinInterval(date, { start, end });
      } catch {
        return false;
      }
    });
  };

  // Get the week number
  const getWeekNumber = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - start.getTime();
    return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
  };

  const handleDateClick = (date: Date) => {
    const plansForDate = getLessonPlansForDate(date);
    
    if (plansForDate.length > 0) {
      // If plans exist, show summary with option to view/edit
      setSelectedDateWithPlans({date, plans: plansForDate});
      setIsLessonSummaryOpen(true);
    } else {
      // If no plans exist, show assignment modal to add lesson or stack
      setAssignmentDate(date);
      setShowAssignmentModal(true);
    }
  };

  const handleEditPlan = (plan: LessonPlan) => {
    setEditingPlan({ ...plan });
  };

  const handleSavePlan = () => {
    if (editingPlan) {
      onUpdateLessonPlan(editingPlan);
      setEditingPlan(null);
    }
  };

  const handleDeletePlan = (planId: string, options?: { skipConfirm?: boolean }) => {
    const proceed = options?.skipConfirm ?? confirm('Are you sure you want to delete this lesson plan?');
    if (!proceed) return;
    onDeleteLessonPlan?.(planId);
    if (selectedDateWithPlans) {
      const remainingPlans = selectedDateWithPlans.plans.filter(p => p.id !== planId);
      if (remainingPlans.length === 0) {
        setRemoveFromDayDropdownOpen(false);
        setIsLessonSummaryOpen(false);
        setSelectedDateWithPlans(null);
      } else {
        setSelectedDateWithPlans({ ...selectedDateWithPlans, plans: remainingPlans });
      }
    }
  };

  // Add a new timetable class
  const handleAddTimetableClass = (newClass: TimetableClass) => {
    const updatedClasses = [...timetableClasses, newClass];
    saveTimetableClasses(updatedClasses);
    setShowTimetableModal(false);
  };

  // Update an existing timetable class
  const handleUpdateTimetableClass = (updatedClass: TimetableClass) => {
    const updatedClasses = timetableClasses.map(tClass => 
      tClass.id === updatedClass.id ? updatedClass : tClass
    );
    saveTimetableClasses(updatedClasses);
    setShowTimetableModal(false);
  };

  // Delete a timetable class
  const handleDeleteTimetableClass = (classId: string) => {
    const updatedClasses = timetableClasses.filter(tClass => tClass.id !== classId);
    saveTimetableClasses(updatedClasses);
  };

  // Add a new calendar event
  const handleAddCalendarEvent = (newEvent: CalendarEvent) => {
    const updatedEvents = [...calendarEvents, newEvent];
    saveCalendarEvents(updatedEvents);
    setShowEventModal(false);
    setEditingEvent(null);
  };

  // Update an existing calendar event
  const handleUpdateCalendarEvent = (updatedEvent: CalendarEvent) => {
    const updatedEvents = calendarEvents.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    );
    saveCalendarEvents(updatedEvents);
    setShowEventModal(false);
    setEditingEvent(null);
  };

  // Delete a calendar event
  const handleDeleteCalendarEvent = (eventId: string) => {
    const updatedEvents = calendarEvents.filter(event => event.id !== eventId);
    saveCalendarEvents(updatedEvents);
    setShowEventModal(false);
    setEditingEvent(null);
  };

  // Handle time slot click in day view
  const handleTimeSlotClick = (day: number, date: Date, hour: number) => {
    setSelectedTimeSlot({ day, date, hour });
    setShowTimeSlotLessonModal(true);
  };

  // Handle view lesson details
  const handleViewLessonDetails = (lessonNumber: string) => {
    setSelectedLessonForDetails(lessonNumber);
  };

  // Handle print lesson
  const handlePrintLesson = (lessonNumber: string) => {
    setSelectedLessonForDetails(lessonNumber);
    setShowPrintModal(true);
  };

  // Handle assigning a lesson to calendar dates
  const handleAssignLesson = (lessonNumber: string, dates: Date[]) => {
    const lessonData = allLessonsData[lessonNumber];
    if (!lessonData) return;

    // Create lesson plans for each date
    dates.forEach((date, index) => {
      const weekNumber = getWeekNumber(date);
      const activities = Object.values(lessonData.grouped || {}).flat();
      
      const newPlan: LessonPlan = {
        id: `plan-${Date.now()}-${index}`,
        date,
        week: weekNumber,
        className,
        activities: activities.map(activity => ({
          ...activity,
          lessonNumber
        })),
        duration: lessonData.totalTime || 0,
        notes: '',
        status: 'planned' as const,
        lessonNumber,
        unitId: unitFilter !== 'all' ? unitFilter : undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      onUpdateLessonPlan(newPlan);
    });
  };

  // Handle Calendar PDF Export - generates well-designed PDF with branding
  const handlePrintCalendar = async () => {
    const PDFBOLT_API_KEY = import.meta.env.VITE_PDFBOLT_API_KEY || '146bdd01-146f-43f8-92aa-26201c38aa11';
    const PDFBOLT_API_URL = 'https://api.pdfbolt.com/v1/direct';
    if (!PDFBOLT_API_KEY || PDFBOLT_API_KEY === 'd089165b-e1da-43bb-a7dc-625ce514ed1b') {
      toast.error('PDF export requires VITE_PDFBOLT_API_KEY in environment.');
      return;
    }

    const escape = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const escapeUrl = (u: string) => (u || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const RESOURCE_KEYS: { key: keyof Activity; label: string }[] = [
      { key: 'videoLink', label: 'Video' },
      { key: 'musicLink', label: 'Music' },
      { key: 'backingLink', label: 'Backing' },
      { key: 'resourceLink', label: 'Resource' },
      { key: 'link', label: 'Link' },
      { key: 'vocalsLink', label: 'Vocals' },
      { key: 'imageLink', label: 'Image' },
      { key: 'canvaLink', label: 'Canva' }
    ];
    const getResourceLinksForPlan = (plan: LessonPlan): { label: string; url: string }[] => {
      const activities = plan.activities?.length
        ? plan.activities
        : (plan.lessonNumber && allLessonsData[plan.lessonNumber])
          ? (allLessonsData[plan.lessonNumber].orderedActivities || Object.values(allLessonsData[plan.lessonNumber].grouped || {}).flat())
          : [];
      const seen = new Set<string>();
      const links: { label: string; url: string }[] = [];
      for (const act of activities) {
        if (!act) continue;
        for (const { key, label } of RESOURCE_KEYS) {
          const url = (act as any)[key];
          if (url && typeof url === 'string' && url.trim() && !seen.has(url.trim())) {
            seen.add(url.trim());
            links.push({ label, url: url.trim() });
          }
        }
      }
      return links;
    };
    const renderResourceLinksHtml = (plan: LessonPlan, compact = false) => {
      const links = getResourceLinksForPlan(plan);
      if (links.length === 0) return '';
      if (compact) {
        return links.slice(0, 3).map(r =>
          `<a href="${escapeUrl(r.url)}" target="_blank" rel="noopener noreferrer" style="font-size:9px;color:#0d9488;text-decoration:underline;display:block;margin-top:1px">${escape(r.label)}</a>`
        ).join('');
      }
      return `<div class="print-resource-links" style="margin-top:6px;font-size:9px">${links.map(r =>
        `<a href="${escapeUrl(r.url)}" target="_blank" rel="noopener noreferrer" style="color:#0d9488;text-decoration:underline;margin-right:8px;display:inline-block">${escape(r.label)}</a>`
      ).join('')}</div>`;
    };
    const branding = settings?.branding || {};
    const productName = branding.loginTitle || settings?.schoolName || 'Creative Curriculum Designer';
    const productSubtitle = branding.loginSubtitle || 'Rhythmstix';
    const companyName = branding.footerCompanyName || 'Rhythmstix';
    const copyrightYear = branding.footerCopyrightYear || new Date().getFullYear().toString();
    const contactEmail = branding.footerContactEmail || '';
    const headerColor = branding.loginButtonColor || branding.loginBackgroundColor || '#0d9488';

    const viewTitle = viewMode === 'month'
      ? format(currentDate, 'MMMM yyyy')
      : viewMode === 'week' || viewMode === 'week-lessons'
        ? `Week of ${format(weekStart, 'MMM d, yyyy')}`
        : format(dayViewDate, 'MMMM d, yyyy');
    const viewLabel = viewMode === 'month' ? 'Month' : viewMode === 'week' ? 'Week' : viewMode === 'week-lessons' ? 'Week Lessons' : 'Day';

    const printStyles = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Inter', -apple-system, sans-serif; font-size: 11px; line-height: 1.4; color: #1a1a1a; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .brand-header { background: ${escape(headerColor)}; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0; margin-bottom: 0; }
      .brand-header h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
      .brand-header .subtitle { font-size: 12px; opacity: 0.95; }
      .brand-header .meta { font-size: 10px; opacity: 0.9; margin-top: 8px; }
      .print-content { padding: 20px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
      .print-section-title { font-size: 16px; font-weight: 600; color: #0f766e; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
      th { background: #f1f5f9; font-weight: 600; }
      .print-month-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0; }
      .print-day { border: 1px solid #e2e8f0; padding: 8px; min-height: 72px; }
      .print-day.other-month { background: #f8fafc; color: #94a3b8; }
      .print-day.today { background: #e0f2fe; border-color: #0ea5e9; }
      .print-day.holiday { background: #fef2f2; }
      .print-day.inset { background: #f5f3ff; }
      .print-day-num { font-weight: 600; margin-bottom: 4px; }
      .print-day-content { font-size: 10px; }
      .print-day-content .plan, .print-day-content .event { margin: 2px 0; padding: 2px 4px; border-radius: 4px; }
      .print-day-content .badge { padding: 1px 4px; border-radius: 4px; font-size: 9px; }
      .print-lessons-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0; }
      .print-day-col { border: 1px solid #e2e8f0; padding: 12px; }
      .print-day-col h3 { font-size: 12px; margin: 0 0 8px 0; color: #64748b; }
      .print-lesson-block { padding: 8px; margin-bottom: 8px; border-radius: 8px; border-left: 4px solid; page-break-inside: avoid; }
      .print-lesson-block .time { font-size: 10px; color: #64748b; }
      .print-lesson-block .title { font-weight: 600; }
      .print-resource-links a { color: #0d9488; text-decoration: underline; }
      .brand-footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #64748b; text-align: center; }
    `;

    let bodyHtml = '';

    if (viewMode === 'month') {
      bodyHtml = `
        <div class="print-section-title">${escape(viewLabel)} View • ${escape(viewTitle)}</div>
        <div class="print-month-grid">
          ${DAY_NAMES.map(d => `<div class="print-day" style="font-weight:600;text-align:center;background:#f1f5f9;padding:6px;">${escape(d)}</div>`).join('')}
          ${calendarDays.map((date: Date) => {
            const plans = getLessonPlansForDate(date);
            const events = getEventsForDate(date);
            const isHolidayDate = isHoliday(date);
            const isInsetDayDate = isInsetDay(date);
            const isCurrentMonth = isSameMonth(date, currentDate);
            const isTodayDate = isToday(date);
            let classes = 'print-day';
            if (!isCurrentMonth) classes += ' other-month';
            if (isTodayDate) classes += ' today';
            if (isHolidayDate) classes += ' holiday';
            if (isInsetDayDate) classes += ' inset';
            let content = '';
            if (isHolidayDate) content += '<div class="badge" style="background:#fecaca;color:#b91c1c;">Holiday</div>';
            if (isInsetDayDate) content += '<div class="badge" style="background:#ddd6fe;color:#6d28d9;">Inset</div>';
            events.slice(0, 2).forEach(e => {
              content += `<div class="event" style="background:${escape(e.color)}20;color:${escape(e.color)}">${escape(e.title)}</div>`;
            });
            plans.slice(0, 2).forEach(p => {
              const unitColor = p.unitId ? units.find(u => u.id === p.unitId)?.color || theme.primary : theme.primary;
              content += `<div class="plan" style="background:${escape(unitColor)}20;color:${escape(unitColor)}">${escape(p.title || `Lesson ${p.lessonNumber || ''}`)}${renderResourceLinksHtml(p, true)}</div>`;
            });
            if (plans.length > 2) content += `<div style="font-size:9px;color:#64748b">+${plans.length - 2} more</div>`;
            return `<div class="${classes}"><div class="print-day-num">${format(date, 'd')}</div><div class="print-day-content">${content}</div></div>`;
          }).join('')}
        </div>
      `;
    } else if (viewMode === 'week') {
      const hours = Array.from({ length: 11 }, (_, i) => i + 8);
      bodyHtml = `
        <div class="print-section-title">${escape(viewLabel)} View • ${escape(viewTitle)}</div>
        <table>
          <thead><tr><th style="width:60px">Time</th>${weekDays.map(d => `<th>${format(d, 'EEE d')}</th>`).join('')}</tr></thead>
          <tbody>
            ${hours.map(hour => `
              <tr>
                <td style="background:#f1f5f9;font-weight:500">${hour}:00</td>
                ${weekDays.map(date => {
                  const plans = getLessonPlansForDate(date);
                  const dayOfWeek = getDay(date);
                  const tClasses = timetableClasses.filter(t => t.day === dayOfWeek);
                  const slotClasses = tClasses.filter(t => {
                    const sh = parseInt(t.startTime.split(':')[0], 10);
                    const eh = parseInt(t.endTime.split(':')[0], 10);
                    return hour >= sh && hour < eh;
                  });
                  const slotPlans = plans.filter(p => {
                    const t = p.time || '00:00';
                    const ph = parseInt(t.split(':')[0], 10);
                    return ph === hour;
                  });
                  const isH = isHoliday(date);
                  const isI = isInsetDay(date);
                  let cell = '';
                  if (isH) cell = '<span style="color:#b91c1c">Holiday</span>';
                  else if (isI) cell = '<span style="color:#6d28d9">Inset</span>';
                  else {
                    slotClasses.forEach(t => { cell += `<div style="font-size:10px;padding:2px">${escape(t.className)}</div>`; });
                    slotPlans.forEach(p => {
                      cell += `<div style="font-size:10px;padding:2px">${escape(p.title || `Lesson ${p.lessonNumber || ''}`)}${renderResourceLinksHtml(p, true)}</div>`;
                    });
                  }
                  return `<td style="vertical-align:top">${cell || '&nbsp;'}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (viewMode === 'week-lessons') {
      const schoolWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const schoolWeekEnd = endOfWeek(schoolWeekStart, { weekStartsOn: 1 });
      const schoolWeekDays = eachDayOfInterval({ start: schoolWeekStart, end: schoolWeekEnd }).slice(0, 5);
      bodyHtml = `
        <div class="print-section-title">${escape(viewLabel)} View • ${escape(viewTitle)}</div>
        <div class="print-lessons-grid">
          ${schoolWeekDays.map((date, idx) => {
            const plans = getLessonPlansForDate(date).sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
            const tClasses = timetableClasses.filter(t => t.day === getDay(date));
            const items: Array<{ type: 't' | 'p'; data: any }> = [
              ...tClasses.map(t => ({ type: 't' as const, data: t })),
              ...plans.map(p => ({ type: 'p' as const, data: p }))
            ].sort((a, b) => {
              const timeA = a.type === 't' ? a.data.startTime : a.data.time || '00:00';
              const timeB = b.type === 't' ? b.data.startTime : b.data.time || '00:00';
              return timeA.localeCompare(timeB);
            });
            const isH = isHoliday(date);
            const isI = isInsetDay(date);
            let colContent = `<h3>Day ${idx + 1} | ${format(date, 'EEE (MMM d)')}</h3>`;
            if (isH) colContent += '<div style="padding:8px;background:#fef2f2;color:#b91c1c;border-radius:8px">Holiday</div>';
            else if (isI) colContent += '<div style="padding:8px;background:#f5f3ff;color:#6d28d9;border-radius:8px">Inset Day</div>';
            else items.forEach(item => {
              if (item.type === 't') {
                const color = item.data.color;
                const time = `${item.data.startTime}-${item.data.endTime}`;
                const title = item.data.className;
                colContent += `<div class="print-lesson-block" style="border-left-color:${escape(color)};background:${escape(color)}15"><div class="time">${escape(time)}</div><div class="title">${escape(title)}</div></div>`;
              } else {
                const plan = item.data as LessonPlan;
                const color = plan.unitId ? '#8B5CF6' : '#EC4899';
                const time = plan.time || '';
                const title = plan.title || `Lesson ${plan.lessonNumber || ''}`;
                colContent += `<div class="print-lesson-block" style="border-left-color:${escape(color)};background:${escape(color)}15"><div class="time">${escape(time)}</div><div class="title">${escape(title)}</div>${renderResourceLinksHtml(plan, false)}</div>`;
              }
            });
            return `<div class="print-day-col">${colContent}</div>`;
          }).join('')}
        </div>
      `;
    } else {
      const hours = Array.from({ length: 11 }, (_, i) => i + 8);
      const plans = getLessonPlansForDate(dayViewDate).sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
      const dayOfWeek = getDay(dayViewDate);
      const tClasses = timetableClasses.filter(t => t.day === dayOfWeek);
      const isH = isHoliday(dayViewDate);
      const isI = isInsetDay(dayViewDate);
      const events = getEventsForDate(dayViewDate);
      bodyHtml = `
        <div class="print-section-title">${escape(viewLabel)} View • ${escape(viewTitle)}</div>
        <table>
          <thead><tr><th style="width:80px">Time</th><th>Schedule</th></tr></thead>
          <tbody>
            ${hours.map(hour => {
              const slotClasses = tClasses.filter(t => {
                const sh = parseInt(t.startTime.split(':')[0], 10);
                const eh = parseInt(t.endTime.split(':')[0], 10);
                return hour >= sh && hour < eh;
              });
              const slotPlans = plans.filter(p => {
                const ph = parseInt((p.time || '00:00').split(':')[0], 10);
                return ph === hour;
              });
              let cell = '';
              if (isH && hour === 8) cell = '<span style="color:#b91c1c">Holiday</span>';
              else if (isI && hour === 8) cell = '<span style="color:#6d28d9">Inset Day</span>';
              else {
                slotClasses.forEach(t => { cell += `<div style="margin:4px 0">${escape(t.className)} (${escape(t.startTime)}-${escape(t.endTime)})</div>`; });
                slotPlans.forEach(p => { cell += `<div style="margin:4px 0">${escape(p.title || `Lesson ${p.lessonNumber || ''}`)}${renderResourceLinksHtml(p, false)}</div>`; });
              }
              return `<tr><td style="background:#f1f5f9;font-weight:500">${hour}:00</td><td>${cell || '&nbsp;'}</td></tr>`;
            }).join('')}
          </tbody>
        </table>
        ${events.length > 0 ? `<div style="margin-top:16px">${events.map(e => `<div style="padding:8px;margin:4px 0;background:${escape(e.color)}20;color:${escape(e.color)};border-radius:8px">${escape(e.title)}</div>`).join('')}</div>` : ''}
      `;
    }

    const logoLetters = branding.logoLetters || 'CCD';
    const logoHtml = branding.loginLogoUrl
      ? `<img src="${escape(branding.loginLogoUrl)}" alt="" style="height:36px;margin-bottom:8px;" onerror="this.style.display='none'">`
      : `<div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;margin-bottom:8px;">${escape(logoLetters.slice(0, 3))}</div>`;
    const brandHeader = `
      <div class="brand-header">
        ${logoHtml}
        <h1>${escape(productName)}</h1>
        <div class="subtitle">${escape(productSubtitle)}</div>
        <div class="meta">${escape(className)} • ${escape(viewLabel)} View • ${escape(viewTitle)}</div>
      </div>
    `;

    const brandFooter = `
      <div class="brand-footer">
        ${escape(companyName)} • © ${escape(copyrightYear)}${contactEmail ? ` • ${escape(contactEmail)}` : ''}
      </div>
    `;

    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escape(className)} - ${escape(viewTitle)}</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><style>${printStyles}</style></head><body>${brandHeader}<div class="print-content">${bodyHtml}${brandFooter}</div></body></html>`;

    const encodeUnicodeBase64 = (str: string) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      let binaryString = '';
      for (let i = 0; i < data.length; i++) binaryString += String.fromCharCode(data[i]);
      return btoa(binaryString);
    };

    const footerContent = `
      <div style="width:100%;font-size:9px;padding:8px 20px;display:flex;justify-content:space-between;align-items:center;color:#5F6368;font-family:'Inter',sans-serif;">
        <span>${escape(productName)}</span>
        <span>${escape(className)} • ${escape(viewLabel)}</span>
        <span style="background:#E8EAEF;color:#0f766e;padding:4px 12px;border-radius:50px;font-weight:500;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `;

    setIsExportingPdf(true);
    try {
      const response = await fetch(PDFBOLT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'API_KEY': PDFBOLT_API_KEY },
        body: JSON.stringify({
          html: encodeUnicodeBase64(fullHtml),
          printBackground: true,
          waitUntil: 'networkidle',
          format: 'A4',
          margin: { top: '15px', right: '20px', left: '20px', bottom: '55px' },
          displayHeaderFooter: true,
          footerTemplate: encodeUnicodeBase64(footerContent),
          headerTemplate: encodeUnicodeBase64('<div></div>'),
          emulateMediaType: 'screen'
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`PDF export failed: ${response.status} - ${errText}`);
      }

      const pdfBlob = await response.blob();
      const fileName = `Calendar_${className.replace(/\s+/g, '_')}_${viewLabel.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('PDF exported successfully', { icon: '📄' });
    } catch (e: any) {
      console.error('PDF export failed:', e);
      toast.error(e?.message || 'Failed to export PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handle assigning a stack to calendar dates
  const handleAssignStack = (stackId: string, dates: Date[]) => {
    const stack = stacks.find(s => s.id === stackId);
    if (!stack) return;

    // Distribute stack lessons across the dates
    const lessonsPerDate = Math.ceil(stack.lessons.length / dates.length);
    
    dates.forEach((date, dateIndex) => {
      const startLessonIndex = dateIndex * lessonsPerDate;
      const endLessonIndex = Math.min(startLessonIndex + lessonsPerDate, stack.lessons.length);
      const lessonsForThisDate = stack.lessons.slice(startLessonIndex, endLessonIndex);

      lessonsForThisDate.forEach((lessonNumber, lessonIndex) => {
        const lessonData = allLessonsData[lessonNumber];
        if (!lessonData) return;

        const weekNumber = getWeekNumber(date);
        const activities = Object.values(lessonData.grouped || {}).flat();
        
        const newPlan: LessonPlan = {
          id: `plan-${Date.now()}-${dateIndex}-${lessonIndex}`,
          date,
          week: weekNumber,
          className,
          activities: activities.map(activity => ({
            ...activity,
            lessonNumber
          })),
          duration: lessonData.totalTime || 0,
          notes: `Part of stack: ${stack.name}`,
          status: 'planned' as const,
          lessonNumber,
          unitId: unitFilter !== 'all' ? unitFilter : undefined,
          stackId: stackId,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        onUpdateLessonPlan(newPlan);
      });
    });
  };

  // CalendarDay component - separate component to allow hooks
  const CalendarDay = memo(({ 
    date, 
    isCurrentMonth,
    getLessonPlansForDate,
    getEventsForDate,
    getTimetableClassesForDay,
    isHoliday,
    isInsetDay,
    getWeekNumber,
    selectedDate,
    selectedDateWithPlans,
    isLessonSummaryOpen,
    className,
    onUpdateLessonPlan,
    handleDateClick,
    units,
    theme
  }: {
    date: Date;
    isCurrentMonth: boolean;
    getLessonPlansForDate: (date: Date) => LessonPlan[];
    getEventsForDate: (date: Date) => CalendarEvent[];
    getTimetableClassesForDay: (day: number) => TimetableClass[];
    isHoliday: (date: Date) => boolean;
    isInsetDay: (date: Date) => boolean;
    getWeekNumber: (date: Date) => number;
    selectedDate: Date | null;
    selectedDateWithPlans: {date: Date, plans: LessonPlan[]} | null;
    isLessonSummaryOpen: boolean;
    className: string;
    onUpdateLessonPlan: (plan: LessonPlan) => void;
    handleDateClick: (date: Date) => void;
    units: any[];
    theme: any;
  }): React.ReactElement => {
    const plansForDate = getLessonPlansForDate(date);
    const eventsForDate = getEventsForDate(date);
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const isTodayDate = isToday(date);
    const isSelectedWithPlans = selectedDateWithPlans && isSameDay(date, selectedDateWithPlans.date);
    const isHolidayDate = isHoliday(date);
    const isInsetDayDate = isInsetDay(date);
    const dayOfWeek = getDay(date);
    const timetableClassesForDay = getTimetableClassesForDay(dayOfWeek);
    
    // Check if there are plans for this date
    const hasPlans = plansForDate.length > 0;
    const hasMultiplePlans = plansForDate.length > 1;

    // Set up drop target for activities and units
    const [{ isOver }, drop] = useDrop(() => ({
      accept: ['activity', 'unit'],
      drop: (item: any) => {
        if (item.activity) {
          // Create a new lesson plan with this activity
          const weekNumber = getWeekNumber(date);
          
          const newPlan = {
            id: `plan-${Date.now()}`,
            date,
            week: weekNumber,
            className,
            activities: [item.activity],
            duration: item.activity.time || 0,
            notes: '',
            status: 'planned' as const,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          onUpdateLessonPlan(newPlan);
        } else if (item.unit) {
          // Handle dropped unit - schedule all lessons in the unit
          console.log('Unit dropped:', item.unit);
          
          // This would be implemented in the parent component
          // For now, we'll just log it
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver()
      })
    }), [date.toISOString(), onUpdateLessonPlan, className, getWeekNumber]);

    // Determine cell background color based on events
    let cellBgColor = isCurrentMonth ? 'bg-white' : 'bg-gray-50 opacity-60';
    if (isHolidayDate) cellBgColor = 'bg-red-50';
    if (isInsetDayDate) cellBgColor = 'bg-purple-50';
    
    return (
      <div
        ref={drop}
        onClick={() => !isHolidayDate && !isInsetDayDate && handleDateClick(date)}
        className={`
          relative w-full h-24 p-1 border border-gray-200 hover:bg-blue-50 transition-colors duration-200
          ${isSelected ? 'bg-blue-100 border-blue-300' : cellBgColor}
          ${isTodayDate ? 'ring-2 ring-blue-400' : ''}
          ${hasPlans ? 'bg-green-50' : ''}
          ${isOver ? 'bg-blue-100 border-blue-300' : ''}
          ${isSelectedWithPlans && isLessonSummaryOpen ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-500' : ''}
          ${isHolidayDate || isInsetDayDate ? 'cursor-default' : 'cursor-pointer'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-start">
            <span className={`text-sm font-medium ${isTodayDate ? 'text-blue-600' : 'text-gray-900'}`}>
              {format(date, 'd')}
            </span>
            
            {/* Timetable indicator */}
            {timetableClassesForDay.length > 0 && !isHolidayDate && !isInsetDayDate && (
              <div className="flex space-x-0.5">
                {timetableClassesForDay.slice(0, 2).map((tClass, idx) => (
                  <div 
                    key={idx}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: tClass.color }}
                    title={`${tClass.className} (${tClass.startTime}-${tClass.endTime})`}
                  ></div>
                ))}
                {timetableClassesForDay.length > 2 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400" title={`+${timetableClassesForDay.length - 2} more classes`}></div>
                )}
              </div>
            )}
          </div>
          
          {/* Holiday or Inset Day Indicator */}
          {(isHolidayDate || isInsetDayDate) && (
            <div className="flex-1 flex items-center justify-center">
              <div className={`text-xs px-1 py-0.5 rounded-sm ${
                isHolidayDate ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {isHolidayDate ? 'Holiday' : 'Inset Day'}
              </div>
            </div>
          )}
          
          {/* Events */}
          {eventsForDate.length > 0 && !isHolidayDate && !isInsetDayDate && (
            <div className="mt-0.5">
              {eventsForDate.slice(0, 1).map((event, idx) => (
                <div 
                  key={idx}
                  className="text-xs px-1 py-0.5 truncate rounded-sm"
                  style={{ 
                    backgroundColor: `${event.color}20`,
                    color: event.color
                  }}
                  title={event.title}
                >
                  {event.title}
                </div>
              ))}
              {eventsForDate.length > 1 && (
                <div className="text-xs text-gray-500">+{eventsForDate.length - 1} more</div>
              )}
            </div>
          )}
          
          {/* Lesson Plans */}
          {hasPlans && !isHolidayDate && !isInsetDayDate && (
            <div className="flex-1 mt-1">
              {plansForDate.slice(0, 1).map((plan, idx) => {
                // Get the unit color if this plan is part of a unit
                const unitColor = plan.unitId 
                  ? units.find(u => u.id === plan.unitId)?.color || theme.primary
                  : theme.primary;
                
                return (
                  <div 
                    key={idx}
                    className={`
                      text-xs px-1 py-0.5 truncate rounded-sm
                      ${plan.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        plan.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}
                    `}
                    style={{
                      backgroundColor: `${unitColor}20`,
                      color: unitColor
                    }}
                  >
                    {plan.title || `Lesson ${plan.lessonNumber || ''}`}
                  </div>
                );
              })}
              {hasMultiplePlans && (
                <div className="text-xs text-gray-500">+{plansForDate.length - 1} more</div>
              )}
            </div>
          )}
          
          {/* Empty state */}
          {!hasPlans && !isHolidayDate && !isInsetDayDate && !eventsForDate.length && (
            <div className="flex-1 flex items-center justify-center">
              <Plus className={`h-3 w-3 text-gray-300 ${isOver ? 'text-blue-500' : ''}`} />
            </div>
          )}
        </div>
      </div>
    );
  });

  // DayTimeSlot component - separate component to allow hooks in day view
  const DayTimeSlot = memo(({
    date,
    hour,
    dayOfWeek,
    getLessonPlansForDate,
    isHoliday,
    isInsetDay,
    timetableClasses,
    getWeekNumber,
    className,
    onUpdateLessonPlan,
    handleTimeSlotClick,
    units,
    theme,
    setSelectedDateWithPlans,
    setIsLessonSummaryOpen
  }: {
    date: Date;
    hour: number;
    dayOfWeek: number;
    getLessonPlansForDate: (date: Date) => LessonPlan[];
    isHoliday: (date: Date) => boolean;
    isInsetDay: (date: Date) => boolean;
    timetableClasses: TimetableClass[];
    getWeekNumber: (date: Date) => number;
    className: string;
    onUpdateLessonPlan: (plan: LessonPlan) => void;
    handleTimeSlotClick: (day: number, date: Date, hour: number) => void;
    units: any[];
    theme: any;
    setSelectedDateWithPlans: (data: {date: Date, plans: LessonPlan[]}) => void;
    setIsLessonSummaryOpen: (open: boolean) => void;
  }) => {
    const plansForDate = getLessonPlansForDate(date);
    const isHolidayDate = isHoliday(date);
    const isInsetDayDate = isInsetDay(date);
    
    // Find timetable classes that overlap with this time slot
    const timetableClassesForSlot = (timetableClasses || []).filter(tClass => {
      if (!tClass || tClass.day !== dayOfWeek) return false;
      if (!tClass.startTime || !tClass.endTime) return false;
      try {
        const classStartHour = parseInt(tClass.startTime.split(':')[0], 10);
        const classEndHour = parseInt(tClass.endTime.split(':')[0], 10);
        return hour >= classStartHour && hour < classEndHour;
      } catch {
        return false;
      }
    });
    
    // Find lesson plans for this time slot (guard against invalid plan.time)
    const plansForTimeSlot = plansForDate.filter(plan => {
      if (typeof plan.time !== 'string' || !plan.time) return false;
      try {
        const planHour = parseInt(plan.time.split(':')[0], 10);
        return !isNaN(planHour) && planHour === hour;
      } catch {
        return false;
      }
    });
    
    // Set up drop target for activities and units
    const [{ isOver }, drop] = useDrop(() => ({
      accept: ['activity', 'unit'],
      drop: (item: any) => {
        if (item.activity) {
          // Create a new lesson plan with this activity at this time
          const weekNumber = getWeekNumber(date);
          
          const newPlan = {
            id: `plan-${Date.now()}`,
            date,
            week: weekNumber,
            className,
            activities: [item.activity],
            duration: item.activity.time || 0,
            notes: '',
            status: 'planned',
            time: `${hour}:00`, // Set the time to this hour
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          onUpdateLessonPlan(newPlan);
        } else if (item.unit) {
          // Handle dropped unit - schedule all lessons in the unit
          console.log('Unit dropped:', item.unit);
          
          // This would be implemented in the parent component
          // For now, we'll just log it
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver()
      })
    }), [date, hour, className, getWeekNumber, onUpdateLessonPlan, dayOfWeek, timetableClasses, units, theme, setSelectedDateWithPlans, setIsLessonSummaryOpen]);

    return (
      <div 
        ref={drop}
        className={`border border-gray-200 p-2 min-h-[100px] ${
          isOver ? 'bg-blue-100' : 'bg-white'
        } ${isHolidayDate || isInsetDayDate ? 'bg-gray-100' : ''}`}
        onClick={() => !isHolidayDate && !isInsetDayDate && handleTimeSlotClick(dayOfWeek, date, hour)}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="text-sm font-medium text-gray-700">{hour}:00</div>
          {!isHolidayDate && !isInsetDayDate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTimeSlotClick(dayOfWeek, date, hour);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Timetable classes */}
        {timetableClassesForSlot.length > 0 && !isHolidayDate && !isInsetDayDate && (
          <div className="space-y-1 mb-2">
            {timetableClassesForSlot.map((tClass, idx) => (
              <div 
                key={idx}
                className="text-sm p-1 rounded"
                style={{ 
                  backgroundColor: `${tClass.color}10`,
                  color: tClass.color,
                  borderLeft: `3px solid ${tClass.color}`
                }}
              >
                <div className="font-medium">{tClass.className}</div>
                <div className="text-xs">{tClass.startTime} - {tClass.endTime}</div>
                {tClass.location && (
                  <div className="text-xs">{tClass.location}</div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Lesson plans */}
        {plansForTimeSlot.length > 0 && !isHolidayDate && !isInsetDayDate && (
          <div className="space-y-1">
            {plansForTimeSlot.map((plan, idx) => {
              // Get the unit color if this plan is part of a unit
              const unitColor = plan.unitId 
                ? units.find(u => u.id === plan.unitId)?.color || theme.primary
                : theme.primary;
              
              return (
                <div 
                  key={idx}
                  className="text-sm p-1 rounded"
                  style={{
                    backgroundColor: `${unitColor}10`,
                    color: unitColor,
                    borderLeft: `3px solid ${unitColor}`
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDateWithPlans({date, plans: [plan]});
                    setIsLessonSummaryOpen(true);
                  }}
                >
                  <div className="font-medium">{plan.title || `Lesson ${plan.lessonNumber || ''}`}</div>
                  {plan.time && (
                    <div className="text-xs">{plan.time}</div>
                  )}
                  {plan.activities && plan.activities.length > 0 && (
                    <div className="text-xs text-gray-500">
                      {plan.activities.length} {plan.activities.length === 1 ? 'activity' : 'activities'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  });

  // WeekTimeSlot component - separate component to allow hooks
  const WeekTimeSlot = memo(({ 
    date, 
    hour,
    getLessonPlansForDate,
    isHoliday,
    isInsetDay,
    timetableClasses,
    getWeekNumber,
    className,
    onUpdateLessonPlan,
    handleTimeSlotClick,
    units,
    theme,
    setSelectedDateWithPlans,
    setIsLessonSummaryOpen
  }: { 
    date: Date; 
    hour: number;
    getLessonPlansForDate: (date: Date) => LessonPlan[];
    isHoliday: (date: Date) => boolean;
    isInsetDay: (date: Date) => boolean;
    timetableClasses: TimetableClass[];
    getWeekNumber: (date: Date) => number;
    className: string;
    onUpdateLessonPlan: (plan: LessonPlan) => void;
    handleTimeSlotClick: (day: number, date: Date, hour: number) => void;
    units: any[];
    theme: any;
    setSelectedDateWithPlans: (data: {date: Date, plans: LessonPlan[]}) => void;
    setIsLessonSummaryOpen: (open: boolean) => void;
  }) => {
    const startTime = setHours(setMinutes(date, 0), hour);
    const endTime = addMinutes(startTime, 59);
    const plansForDate = getLessonPlansForDate(date);
    const isHolidayDate = isHoliday(date);
    const isInsetDayDate = isInsetDay(date);
    const dayOfWeek = getDay(date);
    
    // Find timetable classes that overlap with this time slot
    const timetableClassesForSlot = timetableClasses.filter(tClass => {
      if (tClass.day !== dayOfWeek) return false;
      
      const classStartHour = parseInt(tClass.startTime.split(':')[0]);
      const classEndHour = parseInt(tClass.endTime.split(':')[0]);
      
      return hour >= classStartHour && hour < classEndHour;
    });
    
    // Set up drop target for activities and units
    const [{ isOver }, drop] = useDrop(() => ({
      accept: ['activity', 'unit'],
      drop: (item: any) => {
        if (item.activity) {
          // Create a new lesson plan with this activity at this time
          const weekNumber = getWeekNumber(date);
          
          const newPlan = {
            id: `plan-${Date.now()}`,
            date,
            week: weekNumber,
            className,
            activities: [item.activity],
            duration: item.activity.time || 0,
            notes: '',
            status: 'planned',
            time: `${hour}:00`, // Set the time to this hour
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          onUpdateLessonPlan(newPlan);
        } else if (item.unit) {
          // Handle dropped unit - schedule all lessons in the unit
          console.log('Unit dropped:', item.unit);
          
          // This would be implemented in the parent component
          // For now, we'll just log it
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver()
      })
    }), [date, hour, className, getWeekNumber, onUpdateLessonPlan, handleTimeSlotClick, timetableClasses, units, theme, setSelectedDateWithPlans, setIsLessonSummaryOpen]);

    // Determine cell background color based on events
    let cellBgColor = 'bg-white';
    if (isHolidayDate) cellBgColor = 'bg-red-50';
    if (isInsetDayDate) cellBgColor = 'bg-purple-50';
    
    return (
      <div
        ref={drop}
        onClick={() => !isHolidayDate && !isInsetDayDate && handleTimeSlotClick(dayOfWeek, date, hour)}
        className={`
          relative border border-gray-200 p-1 h-16 transition-colors duration-200
          ${isOver ? 'bg-blue-100' : cellBgColor}
          ${isHolidayDate || isInsetDayDate ? 'cursor-default' : 'cursor-pointer hover:bg-blue-50'}
        `}
      >
        {/* Time indicator */}
        <div className="text-xs text-gray-500 mb-1">{hour}:00</div>
        
        {/* Timetable classes */}
        {timetableClassesForSlot.length > 0 && !isHolidayDate && !isInsetDayDate && (
          <div className="flex flex-col space-y-0.5">
            {timetableClassesForSlot.map((tClass, idx) => (
              <div 
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingTimetableClass(tClass);
                  setShowTimetableBuilder(true);
                }}
                className="text-xs px-1 py-0.5 truncate rounded-sm cursor-pointer hover:opacity-80 transition-opacity group"
                style={{ 
                  backgroundColor: `${tClass.color}20`,
                  color: tClass.color,
                  borderLeft: `2px solid ${tClass.color}`
                }}
                title={`${tClass.className} (${tClass.startTime}-${tClass.endTime}) - Click to edit`}
              >
                <div className="flex items-center justify-between">
                  <span>{tClass.className}</span>
                  <Edit3 className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Lesson plans for this time slot */}
        {plansForDate.filter(plan => {
          if (!plan.time) return false;
          const planHour = parseInt(plan.time.split(':')[0]);
          return planHour === hour;
        }).map((plan, idx) => {
          // Get the unit color if this plan is part of a unit
          const unitColor = plan.unitId 
            ? units.find(u => u.id === plan.unitId)?.color || theme.primary
            : theme.primary;
          
          return (
            <div 
              key={idx}
              className="text-xs px-1 py-0.5 truncate rounded-sm mt-0.5"
              style={{
                backgroundColor: `${unitColor}20`,
                color: unitColor,
                borderLeft: `2px solid ${unitColor}`
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDateWithPlans({date, plans: [plan]});
                setIsLessonSummaryOpen(true);
              }}
            >
              {plan.title || `Lesson ${plan.lessonNumber || ''}`}
            </div>
          );
        })}
        
        {/* Holiday or Inset Day Indicator */}
        {(isHolidayDate || isInsetDayDate) && (
          <div className="flex-1 flex items-center justify-center">
            <div className={`text-xs px-1 py-0.5 rounded-sm ${
              isHolidayDate ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'
            }`}>
              {isHolidayDate ? 'Holiday' : 'Inset Day'}
            </div>
          </div>
        )}
      </div>
    );
  });

  // Render a day column for the week view
  const renderWeekDayColumn = (date: Date) => {
    const isToday = isSameDay(date, new Date());
    const isHolidayDate = isHoliday(date);
    const isInsetDayDate = isInsetDay(date);
    
    return (
      <div key={date.toISOString()} className="flex-1">
        <div className={`text-center p-2 font-medium ${
          isToday ? 'bg-blue-100 text-blue-800' : 'bg-gray-50 text-gray-700'
        } ${isHolidayDate ? 'bg-red-100 text-red-800' : ''} 
          ${isInsetDayDate ? 'bg-purple-100 text-purple-800' : ''}`}>
          <div>{format(date, 'EEE')}</div>
          <div className={`text-lg ${isToday ? 'font-bold' : ''}`}>{format(date, 'd')}</div>
        </div>
        <div className="flex flex-col">
          {dayViewHours.map(hour => (
            <WeekTimeSlot 
              key={`${date.toISOString()}-${hour}`} 
              date={date} 
              hour={hour}
              getLessonPlansForDate={getLessonPlansForDate}
              isHoliday={isHoliday}
              isInsetDay={isInsetDay}
              timetableClasses={timetableClasses}
              getWeekNumber={getWeekNumber}
              className={className}
              onUpdateLessonPlan={onUpdateLessonPlan}
              handleTimeSlotClick={handleTimeSlotClick}
              units={units}
              theme={theme}
              setSelectedDateWithPlans={setSelectedDateWithPlans}
              setIsLessonSummaryOpen={setIsLessonSummaryOpen}
            />
          ))}
        </div>
      </div>
    );
  };

  // Render the week view
  const renderWeekView = () => {
    return (
      <div className="flex flex-col h-full">
        {/* Time labels column + day columns */}
        <div className="flex">
          {/* Empty corner cell */}
          <div className="w-16 bg-gray-50 border border-gray-200 p-2"></div>
          
          {/* Day headers */}
          {weekDays.map(date => (
            <div 
              key={date.toISOString()} 
              className={`flex-1 text-center p-2 font-medium ${
                isSameDay(date, new Date()) ? 'bg-blue-100 text-blue-800' : 'bg-gray-50 text-gray-700'
              } ${isHoliday(date) ? 'bg-red-100 text-red-800' : ''} 
                ${isInsetDay(date) ? 'bg-purple-100 text-purple-800' : ''}`}
            >
              <div>{format(date, 'EEE')}</div>
              <div className={`text-lg ${isSameDay(date, new Date()) ? 'font-bold' : ''}`}>{format(date, 'd')}</div>
            </div>
          ))}
        </div>
        
        {/* Time grid */}
        <div className="flex flex-1 overflow-y-auto" style={{ height: 'calc(100vh - 300px)' }}>
          {/* Time labels */}
          <div className="w-16 flex flex-col flex-shrink-0">
            {dayViewHours.map(hour => (
              <div key={hour} className="h-16 border border-gray-200 p-1 text-xs text-gray-500 bg-gray-50">
                {hour}:00
              </div>
            ))}
          </div>
          
          {/* Day columns with time slots */}
          {weekDays.map(date => (
            <div key={date.toISOString()} className="flex-1 flex flex-col">
              {dayViewHours.map(hour => (
                <WeekTimeSlot 
                  key={`${date.toISOString()}-${hour}`} 
                  date={date} 
                  hour={hour}
                  getLessonPlansForDate={getLessonPlansForDate}
                  isHoliday={isHoliday}
                  isInsetDay={isInsetDay}
                  timetableClasses={timetableClasses}
                  getWeekNumber={getWeekNumber}
                  className={className}
                  onUpdateLessonPlan={onUpdateLessonPlan}
                  handleTimeSlotClick={handleTimeSlotClick}
                  units={units}
                  theme={theme}
                  setSelectedDateWithPlans={setSelectedDateWithPlans}
                  setIsLessonSummaryOpen={setIsLessonSummaryOpen}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render the day view
  const renderDayView = () => {
    try {
      // Ensure we have a valid date (avoid crash from invalid or missing dayViewDate)
      const isValid = dayViewDate instanceof Date && !isNaN(dayViewDate.getTime());
      const safeDate = isValid ? dayViewDate : new Date();
      if (!isValid) setDayViewDate(safeDate);

      const dayOfWeek = getDay(safeDate);
      const isHolidayDate = isHoliday(safeDate);
      const isInsetDayDate = isInsetDay(safeDate);
      const eventsForDate = getEventsForDate(safeDate);
      const plansForDate = getLessonPlansForDate(safeDate);
    
    return (
      <div className="flex flex-col h-full">
        {/* Day header */}
        <div className={`p-4 ${
          isSameDay(safeDate, new Date()) ? 'bg-blue-100' : 'bg-gray-50'
        } ${isHolidayDate ? 'bg-red-100' : ''} 
          ${isInsetDayDate ? 'bg-purple-100' : ''}`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">
                {format(safeDate, 'EEEE, MMMM d, yyyy')}
              </h2>
              <div className="flex items-center space-x-2 mt-1">
                {isSameDay(safeDate, new Date()) && (
                  <span className="text-xs px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full">Today</span>
                )}
                {isHolidayDate && (
                  <span className="text-xs px-2 py-0.5 bg-red-200 text-red-800 rounded-full">Holiday</span>
                )}
                {isInsetDayDate && (
                  <span className="text-xs px-2 py-0.5 bg-purple-200 text-purple-800 rounded-full">Inset Day</span>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setDayViewDate(addDays(dayViewDate, -1))}
                className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setDayViewDate(new Date())}
                className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
              >
                Today
              </button>
              <button
                onClick={() => setDayViewDate(addDays(dayViewDate, 1))}
                className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Events for this day */}
          {eventsForDate.length > 0 && (
            <div className="mt-2 space-y-1">
              {eventsForDate.map((event, idx) => (
                <div 
                  key={idx}
                  className="flex items-center space-x-2 text-sm p-1 rounded"
                  style={{ 
                    backgroundColor: `${event.color}10`,
                    color: event.color
                  }}
                >
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: event.color }}
                  ></div>
                  <span>{event.title}</span>
                  {event.description && (
                    <span className="text-xs text-gray-500">{event.description}</span>
                  )}
                  <button
                    onClick={() => {
                      setEditingEvent(event);
                      setShowEventModal(true);
                    }}
                    className="ml-auto p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Timetable for this day - use DayTimeSlot so useDrop is not called inside a loop (Rules of Hooks) */}
        <div className="flex-1 overflow-y-auto" style={{ height: 'calc(100vh - 300px)' }}>
          <div className="flex flex-col">
            {dayViewHours.map(hour => (
              <DayTimeSlot
                key={hour}
                date={safeDate}
                hour={hour}
                dayOfWeek={dayOfWeek}
                getLessonPlansForDate={getLessonPlansForDate}
                isHoliday={isHoliday}
                isInsetDay={isInsetDay}
                timetableClasses={timetableClasses || []}
                getWeekNumber={getWeekNumber}
                className={className}
                onUpdateLessonPlan={onUpdateLessonPlan}
                handleTimeSlotClick={handleTimeSlotClick}
                units={units}
                theme={theme}
                setSelectedDateWithPlans={setSelectedDateWithPlans}
                setIsLessonSummaryOpen={setIsLessonSummaryOpen}
              />
            ))}
          </div>
        </div>
      </div>
    );
    } catch (error) {
      console.error('Error rendering day view:', error);
      return (
        <div className="p-4 text-red-600">
          <p>Error loading day view. Please try again.</p>
          <button 
            onClick={() => setViewMode('month')}
            className="mt-2 px-4 py-2 bg-teal-600 text-white rounded-lg"
          >
            Return to Month View
          </button>
        </div>
      );
    }
  };

  // Render the month view
  const renderMonthView = () => {
    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-medium text-gray-700 py-1 text-xs">
            {day}
          </div>
        ))}
        {calendarDays.map((date, i) => {
          const isCurrentMonth = i >= daysFromPrevMonth && i < (daysFromPrevMonth + currentMonthDays.length);
          return (
            <CalendarDay
              key={date.toISOString()}
              date={date}
              isCurrentMonth={isCurrentMonth}
              getLessonPlansForDate={getLessonPlansForDate}
              getEventsForDate={getEventsForDate}
              getTimetableClassesForDay={getTimetableClassesForDay}
              isHoliday={isHoliday}
              isInsetDay={isInsetDay}
              getWeekNumber={getWeekNumber}
              selectedDate={selectedDate}
              selectedDateWithPlans={selectedDateWithPlans}
              isLessonSummaryOpen={isLessonSummaryOpen}
              className={className}
              onUpdateLessonPlan={onUpdateLessonPlan}
              handleDateClick={handleDateClick}
              units={units}
              theme={theme}
            />
          );
        })}
      </div>
    );
  };

  // Render the lesson summary box
  const renderLessonSummary = () => {
    if (!selectedDateWithPlans || !isLessonSummaryOpen) return null;
    
    const { date, plans } = selectedDateWithPlans;
    
    // Group plans by time
    const groupedPlans: Record<string, LessonPlan[]> = {};
    
    // Sort plans by time
    const sortedPlans = [...plans].sort((a, b) => {
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      return timeA.localeCompare(timeB);
    });
    
    // Group by time
    sortedPlans.forEach(plan => {
      const time = plan.time || 'Unscheduled';
      if (!groupedPlans[time]) {
        groupedPlans[time] = [];
      }
      groupedPlans[time].push(plan);
    });
    
    const timeSlots = Object.keys(groupedPlans).sort();
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden w-[90%] max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div 
            className="p-4 text-white relative"
            style={{ 
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` 
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">
                  {format(date, 'MMMM d, yyyy')}
                </h2>
                <p className="text-white text-opacity-90 text-sm">
                  {plans.length} {plans.length === 1 ? 'lesson' : 'lessons'} planned
                </p>
              </div>
              <div className="flex items-center gap-2 relative">
                {plans.length > 0 && (
                  <>
                    <button
                      onClick={() => {
                        const dateStr = format(date, 'MMMM d, yyyy');
                        if (plans.length === 1) {
                          const plan = plans[0];
                          const title = plan.title || (plan.lessonNumber ? `Lesson ${plan.lessonNumber}` : 'this lesson');
                          if (window.confirm(`You are removing "${title}" from the diary for ${dateStr}. The lesson will still be in your library.`)) {
                            handleDeletePlan(plan.id, { skipConfirm: true });
                          }
                        } else {
                          setRemoveFromDayDropdownOpen((open) => !open);
                        }
                      }}
                      className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200"
                      title="Remove from day"
                    >
                      <Trash2 className="h-5 w-5 text-white" />
                    </button>
                    {removeFromDayDropdownOpen && plans.length > 1 && (
                      <div 
                        className="absolute right-0 top-full mt-2 z-50 py-1 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[200px]"
                        role="menu"
                      >
                        <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
                          Remove from {format(date, 'MMM d')}
                        </div>
                        {plans.map((plan) => {
                          const title = plan.title || (plan.lessonNumber ? `Lesson ${plan.lessonNumber}` : `Week ${plan.week} Lesson`);
                          const dateStr = format(date, 'MMMM d, yyyy');
                          return (
                            <button
                              key={plan.id}
                              onClick={() => {
                                if (window.confirm(`You are removing "${title}" from the diary for ${dateStr}. The lesson will still be in your library.`)) {
                                  handleDeletePlan(plan.id, { skipConfirm: true });
                                  setRemoveFromDayDropdownOpen(false);
                                }
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              role="menuitem"
                            >
                              <Trash2 className="h-4 w-4 text-red-500 shrink-0" />
                              {title}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
                <button
                  onClick={() => {
                    setIsLessonSummaryOpen(false);
                    setRemoveFromDayDropdownOpen(false);
                  }}
                  className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Lesson Plans */}
          <div className="p-6 overflow-y-auto flex-1">
            {timeSlots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No lessons scheduled for this date</p>
              </div>
            ) : (
              <div className="space-y-6">
                {timeSlots.map(timeSlot => (
                  <div key={timeSlot} className="space-y-4">
                    <h3 className="font-medium text-gray-900 flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{timeSlot === 'Unscheduled' ? 'Unscheduled' : timeSlot}</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {groupedPlans[timeSlot].map((plan) => {
                        // Get the unit color if this plan is part of a unit
                        const unitColor = plan.unitId 
                          ? units.find(u => u.id === plan.unitId)?.color || theme.primary
                          : theme.primary;
                        
                        return (
                          <div 
                            key={plan.id}
                            className="bg-white rounded-card shadow-soft border border-gray-200 overflow-hidden hover:shadow-hover transition-all duration-200 cursor-pointer"
                            onClick={(e) => {
                              if (plan.lessonNumber) {
                                e.stopPropagation();
                                handleViewLessonDetails(plan.lessonNumber);
                                setIsLessonSummaryOpen(false);
                              }
                            }}
                          >
                            {/* Plan Header */}
                            <div 
                              className="p-3 border-b border-gray-200"
                              style={{ 
                                background: plan.unitId 
                                  ? `linear-gradient(to right, ${unitColor}15, ${unitColor}05)` 
                                  : `linear-gradient(to right, ${theme.primary}15, ${theme.primary}05)`,
                                borderLeft: `4px solid ${plan.unitId ? unitColor : theme.primary}`
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-semibold text-gray-900">
                                    {plan.title || (plan.lessonNumber ? `Lesson ${plan.lessonNumber}` : `Week ${plan.week} Lesson`)}
                                  </h3>
                                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                                    <span>Week {plan.week}</span>
                                    {plan.unitName && (
                                      <>
                                        <span>•</span>
                                        <span>{plan.unitName}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {plan.lessonNumber ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewLessonDetails(plan.lessonNumber!);
                                        setIsLessonSummaryOpen(false);
                                      }}
                                      className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-button transition-colors duration-200"
                                      title="View/Edit Lesson"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </button>
                                  ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDateSelect(date);
                                      setIsLessonSummaryOpen(false);
                                    }}
                                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-button transition-colors duration-200"
                                      title="Edit Lesson Plan"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Plan Content */}
                            <div className="p-3">
                              {/* Stats */}
                              <div className="flex items-center space-x-4 mb-2 text-xs text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3.5 w-3.5 text-gray-500" />
                                  <span>{plan.duration} mins</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Users className="h-3.5 w-3.5 text-gray-500" />
                                  <span>{plan.activities.length} activities</span>
                                </div>
                              </div>
                              
                              {/* Categories or Activities */}
                              {plan.lessonNumber && allLessonsData[plan.lessonNumber] ? (
                                <div className="mb-2">
                                  <div className="flex flex-wrap gap-1">
                                    {allLessonsData[plan.lessonNumber].categoryOrder.slice(0, 3).map((category) => (
                                      <span
                                        key={category}
                                        className="px-1.5 py-0.5 text-xs font-medium rounded-full"
                                        style={{
                                          backgroundColor: `${getCategoryColor(category)}20`,
                                          color: getCategoryColor(category)
                                        }}
                                      >
                                        {category}
                                      </span>
                                    ))}
                                    {allLessonsData[plan.lessonNumber].categoryOrder.length > 3 && (
                                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                        +{allLessonsData[plan.lessonNumber].categoryOrder.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : plan.activities.length > 0 ? (
                                <div className="mb-2">
                                  <div className="flex flex-wrap gap-1">
                                    {Array.from(new Set(plan.activities.map(a => a.category))).slice(0, 3).map((category, idx) => (
                                      <span
                                        key={idx}
                                        className="px-1.5 py-0.5 text-xs font-medium rounded-full"
                                        style={{
                                          backgroundColor: `${getCategoryColor(category)}20`,
                                          color: getCategoryColor(category)
                                        }}
                                      >
                                        {category}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                              
                              {/* Action Buttons */}
                              <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between">
                                {plan.lessonNumber ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewLessonDetails(plan.lessonNumber!);
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                  >
                                    <Eye className="h-3 w-3" />
                                    <span>View Details</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDateSelect(date);
                                      setIsLessonSummaryOpen(false);
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                    <span>Edit Lesson</span>
                                  </button>
                                )}
                                
                                {plan.lessonNumber && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePrintLesson(plan.lessonNumber!);
                                    }}
                                    className="text-xs text-gray-600 hover:text-gray-800 flex items-center space-x-1"
                                  >
                                    <Printer className="h-3 w-3" />
                                    <span>Print</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add New Lesson/Stack Button */}
            <div className="mt-6 text-center space-y-3">
              <button
                onClick={() => {
                  setAssignmentDate(selectedDateWithPlans.date);
                  setIsLessonSummaryOpen(false);
                  setShowAssignmentModal(true);
                }}
                className="btn-accent inline-flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Lesson or Stack</span>
              </button>
              <div className="text-xs text-gray-500">
                Choose from lesson library or stacks, spread over multiple days
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" ref={calendarRef}>
      {/* Calendar Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Calendar</h2>
              <p className="text-teal-100 text-sm">
                {className} • {viewMode === 'month' ? 'Month View' : viewMode === 'week' ? 'Week View' : viewMode === 'week-lessons' ? 'Week Lessons' : 'Day View'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Print / Export PDF Button */}
            <button
              onClick={handlePrintCalendar}
              disabled={isExportingPdf}
              className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Printer className="h-4 w-4" />
              <span>{isExportingPdf ? 'Exporting…' : 'Export PDF'}</span>
            </button>
            
            {/* Timetable Builder Button */}
            <button
              onClick={() => setShowTimetableBuilder(true)}
              className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Timetable Builder</span>
            </button>
            
            {/* View Mode Selector */}
            <div className="flex bg-white bg-opacity-20 rounded-lg overflow-hidden">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    setViewMode('month');
                  } catch (error) {
                    console.error('Error switching to month view:', error);
                  }
                }}
                className={`px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                  viewMode === 'month' ? 'bg-white text-teal-600' : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                Month
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    setViewMode('week');
                  } catch (error) {
                    console.error('Error switching to week view:', error);
                  }
                }}
                className={`px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                  viewMode === 'week' ? 'bg-white text-teal-600' : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                Week
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    setViewMode('week-lessons');
                  } catch (error) {
                    console.error('Error switching to week-lessons view:', error);
                  }
                }}
                className={`px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                  viewMode === 'week-lessons' ? 'bg-white text-teal-600' : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                Week Lessons
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    setViewMode('day');
                  } catch (error) {
                    console.error('Error switching to day view:', error);
                  }
                }}
                className={`px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                  viewMode === 'day' ? 'bg-white text-teal-600' : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                Day
              </button>
            </div>
            
            {/* Unit Filter */}
            {units.length > 0 && (
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="px-3 py-1.5 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent text-sm"
              >
                <option value="all" className="text-gray-900">All Units</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id} className="text-gray-900">
                    {unit.name}
                  </option>
                ))}
              </select>
            )}
            
            {/* Timetable Button */}
            <button
              onClick={() => setShowTimetableModal(true)}
              className="px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
            >
              <Repeat className="h-4 w-4" />
              <span>Timetable</span>
            </button>
            
            {/* Add Event Button */}
            <button
              onClick={() => {
                setEditingEvent(null);
                setShowEventModal(true);
              }}
              className="px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add Event</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (viewMode === 'month') {
                  setCurrentDate(subMonths(currentDate, 1));
                } else if (viewMode === 'week') {
                  setCurrentDate(subWeeks(currentDate, 1));
                } else {
                  setDayViewDate(addDays(dayViewDate, -1));
                }
              }}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => {
                setCurrentDate(new Date());
                setDayViewDate(new Date());
              }}
              className="px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Today
            </button>
            
            <button
              onClick={() => {
                if (viewMode === 'month') {
                  setCurrentDate(addMonths(currentDate, 1));
                } else if (viewMode === 'week' || viewMode === 'week-lessons') {
                  setCurrentDate(addWeeks(currentDate, 1));
                } else {
                  setDayViewDate(addDays(dayViewDate, 1));
                }
              }}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          
          {viewMode !== 'week-lessons' && (
            <h3 className="text-lg font-semibold">
              {viewMode === 'month' 
                ? format(currentDate, 'MMMM yyyy')
                : viewMode === 'week'
                ? `Week of ${format(weekStart, 'MMM d, yyyy')}`
                : format(dayViewDate, 'MMMM d, yyyy')
              }
            </h3>
          )}
          
          <div className="w-24"></div> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Calendar Grid */}
      {viewMode === 'week-lessons' ? (
        <WeekLessonView
          currentDate={currentDate}
          lessonPlans={filteredLessonPlans}
          onDateChange={setCurrentDate}
          onLessonClick={(plan) => {
            if (plan.lessonNumber) {
              handleViewLessonDetails(plan.lessonNumber);
            } else {
              setSelectedDateWithPlans({ date: new Date(plan.date), plans: [plan] });
              setIsLessonSummaryOpen(true);
            }
          }}
          onAddLesson={(date) => {
            onDateSelect(date);
          }}
          className={className}
          timetableClasses={timetableClasses}
          allLessonsData={allLessonsData}
        />
      ) : (
        <div className="p-4">
          {viewMode === 'month' ? renderMonthView() : viewMode === 'week' ? renderWeekView() : renderDayView()}
        </div>
      )}

      {/* Legend */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-center flex-wrap gap-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Planned</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Holiday</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-gray-600">Inset Day</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span className="text-gray-600">Event</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-gray-600">Timetabled Class</span>
          </div>
        </div>
      </div>

      {/* Lesson Summary Modal */}
      {renderLessonSummary()}

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Edit Lesson Plan</h3>
                <button
                  onClick={() => setEditingPlan(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lesson Title
                </label>
                <input
                  type="text"
                  value={editingPlan.title || ''}
                  onChange={(e) => setEditingPlan(prev => prev ? { ...prev, title: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter lesson title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Time
                </label>
                <input
                  type="time"
                  value={editingPlan.time || ''}
                  onChange={(e) => setEditingPlan(prev => prev ? { ...prev, time: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Week Number
                </label>
                <input
                  type="number"
                  value={editingPlan.week}
                  onChange={(e) => setEditingPlan(prev => prev ? { ...prev, week: parseInt(e.target.value) } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={editingPlan.status}
                  onChange={(e) => setEditingPlan(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="planned">Planned</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              {/* Unit Information (if part of a unit) */}
              {editingPlan.unitName && (
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <FolderOpen className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-900">Unit: {editingPlan.unitName}</span>
                  </div>
                  {editingPlan.lessonNumber && (
                    <p className="text-sm text-indigo-700">
                      Lesson {editingPlan.lessonNumber} from this unit
                    </p>
                  )}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={editingPlan.notes}
                  onChange={(e) => setEditingPlan(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                  placeholder="Add notes about this lesson..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlan}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timetable Modal */}
      {showTimetableModal && (
        <TimetableModal
          isOpen={showTimetableModal}
          onClose={() => {
            setShowTimetableModal(false);
            setSelectedTimeSlot(null);
          }}
          timetableClasses={timetableClasses}
          onAddClass={handleAddTimetableClass}
          onUpdateClass={handleUpdateTimetableClass}
          onDeleteClass={handleDeleteTimetableClass}
          initialDay={selectedTimeSlot?.day}
          initialHour={selectedTimeSlot?.hour}
          units={units}
          className={className}
        />
      )}

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          isOpen={showEventModal}
          onClose={() => {
            setShowEventModal(false);
            setEditingEvent(null);
          }}
          onAddEvent={handleAddCalendarEvent}
          onUpdateEvent={handleUpdateCalendarEvent}
          onDeleteEvent={handleDeleteCalendarEvent}
          editingEvent={editingEvent}
          className={className}
        />
      )}

      {/* Lesson Details Modal */}
      {selectedLessonForDetails && (
        <LessonDetailsModal
          lessonNumber={selectedLessonForDetails}
          onClose={() => setSelectedLessonForDetails(null)}
          theme={theme}
          onEdit={() => {
            // Open lesson builder for editing
            setSelectedLessonForDetails(null);
            // The lesson can be edited through the modal's built-in edit functionality
          }}
        />
      )}

      {/* Print Modal */}
      {showPrintModal && selectedLessonForDetails && (
        <LessonPrintModal
          lessonNumber={selectedLessonForDetails}
          onClose={() => {
            setShowPrintModal(false);
            setSelectedLessonForDetails(null);
          }}
        />
      )}

      {/* Calendar Lesson Assignment Modal */}
      {showAssignmentModal && assignmentDate && (
        <CalendarLessonAssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => {
            setShowAssignmentModal(false);
            setAssignmentDate(null);
          }}
          selectedDate={assignmentDate}
          className={className}
          onAssignLesson={handleAssignLesson}
          onAssignStack={handleAssignStack}
          timetableClasses={timetableClasses}
        />
      )}

      {/* Time Slot Lesson Selection Modal */}
      {showTimeSlotLessonModal && selectedTimeSlot && (
        <TimeSlotLessonModal
          isOpen={showTimeSlotLessonModal}
          onClose={() => {
            setShowTimeSlotLessonModal(false);
            setSelectedTimeSlot(null);
          }}
          date={selectedTimeSlot.date}
          hour={selectedTimeSlot.hour}
          className={className}
          onAddLesson={onUpdateLessonPlan}
          timetableClasses={timetableClasses}
        />
      )}

      {/* Timetable Builder Modal */}
      {showTimetableBuilder && (
        <TimetableBuilder
          isOpen={showTimetableBuilder}
          onClose={() => {
            setShowTimetableBuilder(false);
            setEditingTimetableClass(null);
          }}
          className={className}
          onTimetableUpdate={(classes) => {
            saveTimetableClasses(classes);
          }}
          initialEditClass={editingTimetableClass}
        />
      )}
    </div>
  );
}