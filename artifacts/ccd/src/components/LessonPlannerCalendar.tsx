import React, { useState, useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
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
  Eye,
  Star,
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
  setHours,
  setMinutes,
  getHours,
  getMinutes,
  isToday
} from 'date-fns';
import { useDrop, useDrag } from 'react-dnd';
import { useDropZoneStyle, useDropFlash } from './dnd';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { generatePdfViaProxy } from '../utils/pdfApi';
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
import { downloadIcsFile, generateIcsFromLessonPlans } from '../utils/exportIcal';
import {
  PartnerKeyDatesModal,
  ImportantDatesConfirmPopup,
} from './partners/PartnerKeyDatesModal';
import { ImportantDatesPanel } from './partners/ImportantDatesPanel';
import {
  getPartnerHubsForKeyDates,
  importantDateToCalendarEvent,
  upsertImportantDatesFromSuggestions,
  readImportantDates,
  CCD_IMPORTANT_DATES_UPDATED_EVENT,
  type PartnerKeyDateSuggestion,
} from '../utils/partnerKeyDates';

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
  type: 'holiday' | 'inset' | 'event' | 'key-date';
  description?: string;
  color: string;
  /** Partner hub slug when type is key-date */
  orgId?: string;
  keyStage?: string;
  importantDateId?: string;
  attendReminder?: boolean;
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
  'key-date': '#0F766E', // Teal — partner important dates
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
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [nowTick, setNowTick] = useState(() => new Date());
  const [keyDatesOrgId, setKeyDatesOrgId] = useState('');
  const [showKeyDatesModal, setShowKeyDatesModal] = useState(false);
  const [confirmImportantDates, setConfirmImportantDates] = useState<{
    orgId: string;
    dates: PartnerKeyDateSuggestion[];
  } | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const keyDatesSelectRef = useRef<HTMLSelectElement>(null);
  const { stacks } = useLessonStacks();
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showActionsMenu) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [showActionsMenu]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  
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
        const merged = (() => {
          const important = readImportantDates();
          if (!important.length) {
            return eventsWithDates.filter((e: CalendarEvent) => e.type !== 'key-date');
          }
          const withoutStale = eventsWithDates.filter((e: CalendarEvent) => e.type !== 'key-date');
          const keyEvents = important.map((d) => {
            const mapped = importantDateToCalendarEvent(d);
            return {
              id: mapped.id,
              title: mapped.title,
              startDate: mapped.startDate,
              endDate: mapped.endDate,
              type: 'key-date' as const,
              description: mapped.description,
              color: mapped.color,
              orgId: mapped.orgId,
              keyStage: mapped.keyStage,
              importantDateId: mapped.importantDateId,
              attendReminder: mapped.attendReminder,
            };
          });
          return [...withoutStale, ...keyEvents];
        })();
        setCalendarEvents(merged);
      } catch (error) {
        console.error('Error loading calendar events:', error);
        setCalendarEvents([]);
      }
    } else {
      // Still surface Important dates if the class has none yet
      try {
        const important = readImportantDates();
        if (important.length) {
          setCalendarEvents(
            important.map((d) => {
              const mapped = importantDateToCalendarEvent(d);
              return {
                id: mapped.id,
                title: mapped.title,
                startDate: mapped.startDate,
                endDate: mapped.endDate,
                type: 'key-date' as const,
                description: mapped.description,
                color: mapped.color,
                orgId: mapped.orgId,
                keyStage: mapped.keyStage,
                importantDateId: mapped.importantDateId,
                attendReminder: mapped.attendReminder,
              };
            }),
          );
        }
      } catch {
        /* ignore */
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

  /** Merge Important dates (partner key dates) onto the calendar event list. */
  const mergeImportantDatesOntoCalendar = (baseEvents: CalendarEvent[]): CalendarEvent[] => {
    const important = readImportantDates();
    if (!important.length) {
      return baseEvents.filter((e) => e.type !== 'key-date');
    }
    const withoutStaleKeyDates = baseEvents.filter((e) => e.type !== 'key-date');
    const keyEvents: CalendarEvent[] = important.map((d) => {
      const mapped = importantDateToCalendarEvent(d);
      return {
        id: mapped.id,
        title: mapped.title,
        startDate: mapped.startDate,
        endDate: mapped.endDate,
        type: 'key-date' as const,
        description: mapped.description,
        color: mapped.color,
        orgId: mapped.orgId,
        keyStage: mapped.keyStage,
        importantDateId: mapped.importantDateId,
        attendReminder: mapped.attendReminder,
      };
    });
    return [...withoutStaleKeyDates, ...keyEvents];
  };

  // Keep calendar key-date events in sync with Important dates store
  useEffect(() => {
    const sync = () => {
      setCalendarEvents((prev) => {
        const merged = mergeImportantDatesOntoCalendar(prev);
        localStorage.setItem(`calendar-events-${className}`, JSON.stringify(merged));
        return merged;
      });
    };
    window.addEventListener(CCD_IMPORTANT_DATES_UPDATED_EVENT, sync);
    return () => window.removeEventListener(CCD_IMPORTANT_DATES_UPDATED_EVENT, sync);
  }, [className]);

  const handleKeyDatesConfirm = (selected: PartnerKeyDateSuggestion[]) => {
    if (!keyDatesOrgId || selected.length === 0) return;
    const touched = upsertImportantDatesFromSuggestions(selected, { attendReminder: true });
    setCalendarEvents((prev) => {
      const merged = mergeImportantDatesOntoCalendar(prev);
      localStorage.setItem(`calendar-events-${className}`, JSON.stringify(merged));
      return merged;
    });
    setShowKeyDatesModal(false);
    setConfirmImportantDates({ orgId: keyDatesOrgId, dates: selected });
    setKeyDatesOrgId('');
    if (keyDatesSelectRef.current) keyDatesSelectRef.current.value = '';
    toast.success(
      `${touched.length} important date${touched.length === 1 ? '' : 's'} added · reminder set (demo)`,
    );
    // Jump calendar toward the earliest selected date so KS1/KS2 examples are visible
    const earliest = [...selected].sort((a, b) => a.date.localeCompare(b.date))[0];
    if (earliest) {
      const [y, m] = earliest.date.split('-').map(Number);
      setCurrentDate(new Date(y, (m || 1) - 1, 1));
      setViewMode('month');
    }
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

  // School week (Mon–Fri) — matches Week Lessons / school timetable
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 4);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Timed grid: 8:00–18:00 (school day)
  const GRID_START_HOUR = 8;
  const GRID_END_HOUR = 18;
  const HOUR_HEIGHT_PX = 64;
  const DEFAULT_LESSON_MINS = 45;
  const dayViewHours = Array.from(
    { length: GRID_END_HOUR - GRID_START_HOUR },
    (_, i) => GRID_START_HOUR + i
  );
  const gridHeightPx = dayViewHours.length * HOUR_HEIGHT_PX;

  const parseTimeToMinutes = (time?: string): number | null => {
    if (!time || typeof time !== 'string') return null;
    const parts = time.split(':');
    if (parts.length < 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };

  const minutesToY = (minutes: number) =>
    ((minutes - GRID_START_HOUR * 60) / 60) * HOUR_HEIGHT_PX;

  const durationToHeight = (durationMin: number) =>
    Math.max((Math.max(durationMin, 15) / 60) * HOUR_HEIGHT_PX, 22);

  /** Simple overlap columns (Google Calendar style) */
  const layoutTimedBlocks = <T extends { startMin: number; endMin: number }>(
    items: T[]
  ): Array<T & { col: number; colCount: number }> => {
    if (items.length === 0) return [];
    const sorted = [...items].sort(
      (a, b) => a.startMin - b.startMin || b.endMin - a.endMin
    );
    type LaidOut = T & { col: number; colCount: number };
    const result: LaidOut[] = sorted.map((item) => ({ ...item, col: 0, colCount: 1 }));
    const colEnds: number[] = [];
    result.forEach((item) => {
      let col = colEnds.findIndex((end) => end <= item.startMin);
      if (col === -1) {
        col = colEnds.length;
        colEnds.push(item.endMin);
      } else {
        colEnds[col] = item.endMin;
      }
      item.col = col;
    });
    let i = 0;
    while (i < result.length) {
      let groupEnd = result[i].endMin;
      let j = i + 1;
      let maxCol = result[i].col;
      while (j < result.length && result[j].startMin < groupEnd) {
        groupEnd = Math.max(groupEnd, result[j].endMin);
        maxCol = Math.max(maxCol, result[j].col);
        j += 1;
      }
      const colCount = maxCol + 1;
      for (let k = i; k < j; k++) result[k].colCount = colCount;
      i = j;
    }
    return result;
  };

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
        id: crypto.randomUUID(),
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

  const handleExportIcal = () => {
    if (filteredLessonPlans.length === 0) {
      toast.error('No scheduled lessons to export.');
      return;
    }

    const calendarName = `${className} Lessons`;
    const ics = generateIcsFromLessonPlans(filteredLessonPlans, calendarName);
    const safeClassName = className.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'lessons';
    downloadIcsFile(ics, `${safeClassName}-calendar.ics`);
    toast.success(`Exported ${filteredLessonPlans.length} lesson(s) to calendar file.`);
  };

  // Handle Calendar PDF Export - generates well-designed PDF with branding
  const handlePrintCalendar = async () => {
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

    const openPrintFallback = () => {
      const printWin = window.open('', '_blank');
      if (!printWin) {
        throw new Error('Pop-up blocked. Allow pop-ups to export the calendar, or disable the blocker and try again.');
      }
      printWin.document.write(fullHtml);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 150);
    };

    setIsExportingPdf(true);
    try {
      try {
        const pdfBlob = await generatePdfViaProxy({
          html: encodeUnicodeBase64(fullHtml),
          printBackground: true,
          waitUntil: 'networkidle',
          format: 'A4',
          margin: { top: '15px', right: '20px', left: '20px', bottom: '55px' },
          displayHeaderFooter: true,
          footerTemplate: encodeUnicodeBase64(footerContent),
          headerTemplate: encodeUnicodeBase64('<div></div>'),
          emulateMediaType: 'screen',
        });
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
      } catch (proxyError: unknown) {
        // Local/dev often has no API server or PDFBOLT_API_KEY — fall back to browser print → Save as PDF
        console.warn('PDF proxy failed, falling back to print dialog:', proxyError);
        openPrintFallback();
        toast.success('Opened print dialog — choose “Save as PDF” to export', { duration: 5000 });
      }
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
          id: crypto.randomUUID(),
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
    const { flashClass: calFlash, triggerFlash: triggerCalFlash } = useDropFlash();

    const [{ isOver, canDrop }, drop] = useDrop(() => ({
      accept: ['activity', 'unit'],
      drop: (item: any) => {
        if (item.activity) {
          const weekNumber = getWeekNumber(date);
          
          const newPlan = {
            id: crypto.randomUUID(),
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
          triggerCalFlash();
        } else if (item.unit) {
          console.log('Unit dropped:', item.unit);
          triggerCalFlash();
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      })
    }), [date.toISOString(), onUpdateLessonPlan, className, getWeekNumber]);

    const calDropClass = useDropZoneStyle({ isOver, canDrop, variant: 'cell' });

    let cellBgColor = isCurrentMonth ? 'bg-white' : 'bg-[#F7FAF8] opacity-70';
    if (isHolidayDate) cellBgColor = 'bg-red-50';
    if (isInsetDayDate) cellBgColor = 'bg-purple-50';
    
    return (
      <div
        ref={drop as unknown as React.Ref<HTMLDivElement>}
        onClick={() => !isHolidayDate && !isInsetDayDate && handleDateClick(date)}
        className={`
          relative w-full min-h-[5.5rem] sm:h-24 p-1.5 border border-[#E5EDE8] rounded-md
          hover:bg-[rgba(0,45,36,0.03)] transition-colors duration-200
          ${isSelected ? 'bg-[rgba(182,255,126,0.18)] border-[#002D24]/30' : cellBgColor}
          ${isTodayDate ? 'ring-2 ring-[#002D24]/35 ring-offset-1' : ''}
          ${hasPlans && !isSelected ? 'bg-[#F1F6F2]' : ''}
          ${isSelectedWithPlans && isLessonSummaryOpen ? 'bg-[rgba(182,255,126,0.28)] border-[#002D24]/40 ring-2 ring-[#002D24]/40' : ''}
          ${isHolidayDate || isInsetDayDate ? 'cursor-default' : 'cursor-pointer'}
          ${calDropClass} ${calFlash}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-start">
            <span
              className={`text-sm font-medium ${
                isTodayDate
                  ? 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#002D24] text-white text-xs'
                  : 'text-gray-800'
              }`}
            >
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
            <div className="mt-0.5 space-y-0.5">
              {eventsForDate.slice(0, 2).map((event, idx) => {
                const isKeyDate = event.type === 'key-date';
                return (
                  <div 
                    key={idx}
                    className={`text-xs px-1 py-0.5 truncate rounded-sm flex items-center gap-0.5 ${
                      isKeyDate ? 'font-semibold ring-1 ring-teal-700/20' : ''
                    }`}
                    style={{ 
                      backgroundColor: isKeyDate ? 'rgba(15, 118, 110, 0.12)' : `${event.color}20`,
                      color: isKeyDate ? '#0F766E' : event.color
                    }}
                    title={
                      isKeyDate
                        ? `${event.title}${event.attendReminder ? ' · Reminder set' : ''}`
                        : event.title
                    }
                    data-ccd-calendar-key-date={isKeyDate ? '1' : undefined}
                  >
                    {isKeyDate ? (
                      <Star className="h-2.5 w-2.5 shrink-0" fill="currentColor" aria-hidden />
                    ) : null}
                    <span className="truncate">{event.title}</span>
                  </div>
                );
              })}
              {eventsForDate.length > 2 && (
                <div className="text-xs text-gray-500">+{eventsForDate.length - 2} more</div>
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

  // Timed day column (Outlook/Google style) — absolute event blocks + drop target
  const TimedDayColumn = memo(({
    date,
    showHourLabels,
    compact,
  }: {
    date: Date;
    showHourLabels?: boolean;
    compact?: boolean;
  }) => {
    const columnRef = useRef<HTMLDivElement>(null);
    const dayOfWeek = getDay(date);
    const isTodayDate = isSameDay(date, nowTick);
    const isHolidayDate = isHoliday(date);
    const isInsetDayDate = isInsetDay(date);
    const plansForDate = getLessonPlansForDate(date);

    const hourFromClientY = (clientY: number) => {
      const el = columnRef.current;
      if (!el) return GRID_START_HOUR;
      const rect = el.getBoundingClientRect();
      const y = Math.max(0, Math.min(clientY - rect.top, gridHeightPx - 1));
      return Math.min(
        GRID_END_HOUR - 1,
        Math.max(GRID_START_HOUR, GRID_START_HOUR + Math.floor(y / HOUR_HEIGHT_PX))
      );
    };

    const { flashClass, triggerFlash } = useDropFlash();
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
      accept: ['activity', 'unit'],
      drop: (item: any, monitor) => {
        if (isHolidayDate || isInsetDayDate) return;
        const offset = monitor.getClientOffset();
        const hour = offset ? hourFromClientY(offset.y) : GRID_START_HOUR;
        if (item.activity) {
          const weekNumber = getWeekNumber(date);
          const newPlan = {
            id: crypto.randomUUID(),
            date,
            week: weekNumber,
            className,
            activities: [item.activity],
            duration: item.activity.time || 0,
            notes: '',
            status: 'planned',
            time: `${String(hour).padStart(2, '0')}:00`,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          onUpdateLessonPlan(newPlan as any);
          triggerFlash();
        } else if (item.unit) {
          triggerFlash();
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }), [date, className, isHolidayDate, isInsetDayDate, gridHeightPx]);

    const setDropRef = (node: HTMLDivElement | null) => {
      columnRef.current = node;
      drop(node);
    };

    const dropClass = useDropZoneStyle({ isOver, canDrop, variant: 'cell' });

    type TimedItem = {
      id: string;
      kind: 'timetable' | 'lesson';
      title: string;
      subtitle?: string;
      startMin: number;
      endMin: number;
      color: string;
      plan?: LessonPlan;
      tClass?: TimetableClass;
    };

    const timedItems: TimedItem[] = [];

    if (!isHolidayDate && !isInsetDayDate) {
      getTimetableClassesForDay(dayOfWeek).forEach((tClass) => {
        const startMin = parseTimeToMinutes(tClass.startTime);
        const endMin = parseTimeToMinutes(tClass.endTime);
        if (startMin == null || endMin == null || endMin <= startMin) return;
        if (endMin <= GRID_START_HOUR * 60 || startMin >= GRID_END_HOUR * 60) return;
        timedItems.push({
          id: `tt-${tClass.id}`,
          kind: 'timetable',
          title: tClass.className,
          subtitle: tClass.location || `${tClass.startTime}–${tClass.endTime}`,
          startMin: Math.max(startMin, GRID_START_HOUR * 60),
          endMin: Math.min(endMin, GRID_END_HOUR * 60),
          color: tClass.color || '#3D6B5E',
          tClass,
        });
      });

      plansForDate.forEach((plan) => {
        const startMin = parseTimeToMinutes(plan.time);
        if (startMin == null) return;
        const duration =
          plan.duration && plan.duration > 0 ? plan.duration : DEFAULT_LESSON_MINS;
        const endMin = startMin + duration;
        if (endMin <= GRID_START_HOUR * 60 || startMin >= GRID_END_HOUR * 60) return;
        const unitColor = plan.unitId
          ? units.find((u) => u.id === plan.unitId)?.color || theme.primary
          : theme.primary;
        timedItems.push({
          id: `plan-${plan.id}`,
          kind: 'lesson',
          title: plan.title || `Lesson ${plan.lessonNumber || ''}`,
          subtitle: plan.time,
          startMin: Math.max(startMin, GRID_START_HOUR * 60),
          endMin: Math.min(endMin, GRID_END_HOUR * 60),
          color: unitColor || '#3D6B5E',
          plan,
        });
      });
    }

    const laidOut = layoutTimedBlocks(timedItems);

    const nowMinutes = nowTick.getHours() * 60 + nowTick.getMinutes();
    const showNow =
      isTodayDate &&
      nowMinutes >= GRID_START_HOUR * 60 &&
      nowMinutes < GRID_END_HOUR * 60;

    return (
      <div
        ref={setDropRef}
        className={`relative flex-1 min-w-0 border-l border-[#E5EDE8] ${
          isHolidayDate ? 'bg-red-50/40' : isInsetDayDate ? 'bg-purple-50/40' : 'bg-white'
        } ${isTodayDate ? 'bg-[#F1F6F2]/70' : ''} ${dropClass} ${flashClass}`}
        style={{ height: gridHeightPx }}
        onClick={(e) => {
          if (isHolidayDate || isInsetDayDate) return;
          if ((e.target as HTMLElement).closest('[data-event-block]')) return;
          const hour = hourFromClientY(e.clientY);
          handleTimeSlotClick(dayOfWeek, date, hour);
        }}
      >
        {/* Hour grid lines */}
        {dayViewHours.map((hour) => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-t border-[#E5EDE8] pointer-events-none"
            style={{ top: (hour - GRID_START_HOUR) * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX }}
          >
            {showHourLabels && (
              <span className="absolute -left-14 -top-2.5 w-12 text-right text-[11px] text-gray-500 tabular-nums">
                {format(setHours(setMinutes(new Date(), 0), hour), 'H:mm')}
              </span>
            )}
          </div>
        ))}

        {(isHolidayDate || isInsetDayDate) && (
          <div className="absolute inset-x-1 top-2 z-[1] text-center pointer-events-none">
            <span
              className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded ${
                isHolidayDate ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'
              }`}
            >
              {isHolidayDate ? 'Holiday' : 'Inset Day'}
            </span>
          </div>
        )}

        {/* Timed event blocks */}
        {laidOut.map((item) => {
          const top = minutesToY(item.startMin);
          const height = durationToHeight(item.endMin - item.startMin);
          const widthPct = 100 / item.colCount;
          const leftPct = item.col * widthPct;
          const pad = compact ? 1 : 2;
          return (
            <div
              key={item.id}
              data-event-block
              role="button"
              tabIndex={0}
              title={`${item.title}${item.subtitle ? ` · ${item.subtitle}` : ''}`}
              className="absolute z-[2] overflow-hidden rounded-md border border-black/5 shadow-sm cursor-pointer hover:brightness-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#002D24]/35"
              style={{
                top: top + 1,
                height: Math.max(height - 2, 20),
                left: `calc(${leftPct}% + ${pad}px)`,
                width: `calc(${widthPct}% - ${pad * 2}px)`,
                backgroundColor: `${item.color}22`,
                borderLeft: `3px solid ${item.color}`,
                color: '#1a2e28',
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (item.kind === 'timetable' && item.tClass) {
                  setEditingTimetableClass(item.tClass);
                  setShowTimetableBuilder(true);
                } else if (item.plan) {
                  setSelectedDateWithPlans({ date, plans: [item.plan] });
                  setIsLessonSummaryOpen(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).click();
                }
              }}
            >
              <div className={`px-1.5 py-0.5 leading-tight ${compact ? 'text-[10px]' : 'text-xs'}`}>
                <div className="font-semibold truncate" style={{ color: item.color }}>
                  {item.title}
                </div>
                {!compact && item.subtitle && (
                  <div className="text-[10px] text-gray-600 truncate">{item.subtitle}</div>
                )}
              </div>
            </div>
          );
        })}

        {/* Current time indicator */}
        {showNow && (
          <div
            className="absolute left-0 right-0 z-[3] pointer-events-none"
            style={{ top: minutesToY(nowMinutes) }}
          >
            <div className="relative">
              <div className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-[#C45C26]" />
              <div className="h-[2px] w-full bg-[#C45C26]" />
            </div>
          </div>
        )}
      </div>
    );
  });

  // Render the week view — Outlook / Google Calendar style timed grid
  const renderWeekView = () => {
    const allDayByDate = weekDays.map((date) => {
      const events = getEventsForDate(date);
      const untimedPlans = getLessonPlansForDate(date).filter(
        (p) => parseTimeToMinutes(p.time) == null
      );
      return { date, events, untimedPlans };
    });
    const hasAllDay = allDayByDate.some(
      (d) => d.events.length > 0 || d.untimedPlans.length > 0 || isHoliday(d.date) || isInsetDay(d.date)
    );

    return (
      <div className="flex flex-col rounded-xl border border-[#E5EDE8] overflow-hidden bg-white">
        {/* Day headers */}
        <div className="flex border-b border-[#E5EDE8]" style={{ backgroundColor: 'var(--ccd-sage, #F3F6F3)' }}>
          <div className="w-14 sm:w-16 shrink-0 border-r border-[#E5EDE8]" />
          {weekDays.map((date) => {
            const today = isSameDay(date, nowTick);
            return (
              <button
                type="button"
                key={date.toISOString()}
                onClick={() => {
                  setDayViewDate(date);
                  setCalendarViewMode('day');
                }}
                className={`flex-1 min-w-0 py-1 text-center transition-colors hover:bg-white/60 ${
                  today ? 'bg-white' : ''
                }`}
              >
                <div className={`text-[10px] leading-none uppercase tracking-wide ${today ? 'text-[#002D24] font-semibold' : 'text-gray-500'}`}>
                  {format(date, 'EEE')}
                </div>
                <div
                  className={`mt-px inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold leading-none ${
                    today ? 'bg-[#002D24] text-white' : 'text-[#002D24]'
                  }`}
                >
                  {format(date, 'd')}
                </div>
              </button>
            );
          })}
        </div>

        {/* All-day row */}
        {hasAllDay && (
          <div className="flex border-b border-[#E5EDE8] min-h-[36px]" style={{ backgroundColor: '#FAFCFA' }}>
            <div className="w-14 sm:w-16 shrink-0 flex items-start justify-end pr-2 pt-1.5 border-r border-[#E5EDE8]">
              <span className="text-[10px] uppercase tracking-wide text-gray-400">All day</span>
            </div>
            {allDayByDate.map(({ date, events, untimedPlans }) => (
              <div key={`allday-${date.toISOString()}`} className="flex-1 min-w-0 border-l border-[#E5EDE8] px-1 py-1 space-y-0.5">
                {events.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => {
                        setEditingEvent(event);
                        setShowEventModal(true);
                      }}
                      className="block w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate font-medium"
                      style={{ backgroundColor: `${event.color}22`, color: event.color }}
                      title={event.title}
                    >
                      {event.title}
                    </button>
                  ))}
                {untimedPlans.map((plan) => {
                  const unitColor = plan.unitId
                    ? units.find((u) => u.id === plan.unitId)?.color || theme.primary
                    : theme.primary;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => {
                        setSelectedDateWithPlans({ date, plans: [plan] });
                        setIsLessonSummaryOpen(true);
                      }}
                      className="block w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate font-medium"
                      style={{ backgroundColor: `${unitColor}22`, color: unitColor }}
                      title={plan.title || `Lesson ${plan.lessonNumber || ''}`}
                    >
                      {plan.title || `Lesson ${plan.lessonNumber || ''}`}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Scrollable timed grid */}
        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
          <div className="flex relative" style={{ height: gridHeightPx }}>
            {/* Time gutter */}
            <div className="w-14 sm:w-16 shrink-0 relative border-r border-[#E5EDE8] bg-[#FAFCFA]">
              {dayViewHours.map((hour) => (
                <div
                  key={hour}
                  className="absolute right-2 text-[11px] text-gray-500 tabular-nums -translate-y-1/2"
                  style={{ top: (hour - GRID_START_HOUR) * HOUR_HEIGHT_PX }}
                >
                  {format(setHours(setMinutes(new Date(), 0), hour), 'H:mm')}
                </div>
              ))}
            </div>

            {/* Day columns */}
            <div className="flex flex-1 min-w-0">
              {weekDays.map((date) => (
                <TimedDayColumn key={date.toISOString()} date={date} compact />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render the day view — same timed grid pattern as week
  const renderDayView = () => {
    try {
      const isValid = dayViewDate instanceof Date && !isNaN(dayViewDate.getTime());
      const safeDate = isValid ? dayViewDate : new Date();
      if (!isValid) setDayViewDate(safeDate);

      const isHolidayDate = isHoliday(safeDate);
      const isInsetDayDate = isInsetDay(safeDate);
      const eventsForDate = getEventsForDate(safeDate);
      const untimedPlans = getLessonPlansForDate(safeDate).filter(
        (p) => parseTimeToMinutes(p.time) == null
      );
      const today = isSameDay(safeDate, nowTick);
      const dayNavBtn =
        'inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors duration-200 hover:border-[#002D24] hover:text-[#002D24]';

      return (
        <div className="flex flex-col rounded-xl border border-[#E5EDE8] overflow-hidden bg-white">
          <div
            className={`px-4 py-3 border-b border-[#E5EDE8] ${
              isHolidayDate ? 'bg-red-50' : isInsetDayDate ? 'bg-purple-50' : ''
            }`}
            style={
              !isHolidayDate && !isInsetDayDate
                ? { backgroundColor: 'var(--ccd-sage, #F3F6F3)' }
                : undefined
            }
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2
                  className="text-lg sm:text-xl font-semibold text-[#002D24]"
                  style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                >
                  {format(safeDate, 'EEEE, MMMM d, yyyy')}
                </h2>
                <div className="flex items-center flex-wrap gap-2 mt-1">
                  {today && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#002D24] text-white font-medium">
                      Today
                    </span>
                  )}
                  {isHolidayDate && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-medium">
                      Holiday
                    </span>
                  )}
                  {isInsetDayDate && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">
                      Inset Day
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDayViewDate(addDays(safeDate, -1))}
                  className={dayNavBtn}
                  aria-label="Previous day"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDayViewDate(new Date())}
                  className="inline-flex min-h-[40px] items-center px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-[#002D24] hover:text-[#002D24]"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setDayViewDate(addDays(safeDate, 1))}
                  className={dayNavBtn}
                  aria-label="Next day"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {(eventsForDate.length > 0 || untimedPlans.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {eventsForDate.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => {
                      setEditingEvent(event);
                      setShowEventModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md font-medium"
                    style={{ backgroundColor: `${event.color}18`, color: event.color }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: event.color }}
                    />
                    {event.title}
                    <Edit3 className="h-3 w-3 opacity-60" />
                  </button>
                ))}
                {untimedPlans.map((plan) => {
                  const unitColor = plan.unitId
                    ? units.find((u) => u.id === plan.unitId)?.color || theme.primary
                    : theme.primary;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => {
                        setSelectedDateWithPlans({ date: safeDate, plans: [plan] });
                        setIsLessonSummaryOpen(true);
                      }}
                      className="inline-flex items-center text-xs px-2 py-1 rounded-md font-medium"
                      style={{ backgroundColor: `${unitColor}18`, color: unitColor }}
                    >
                      {plan.title || `Lesson ${plan.lessonNumber || ''}`}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
            <div className="flex relative" style={{ height: gridHeightPx }}>
              <div className="w-14 sm:w-16 shrink-0 relative border-r border-[#E5EDE8] bg-[#FAFCFA]">
                {dayViewHours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute right-2 text-[11px] text-gray-500 tabular-nums -translate-y-1/2"
                    style={{ top: (hour - GRID_START_HOUR) * HOUR_HEIGHT_PX }}
                  >
                    {format(setHours(setMinutes(new Date(), 0), hour), 'H:mm')}
                  </div>
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <TimedDayColumn date={safeDate} />
              </div>
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
            className="mt-2 px-4 py-2 bg-[#002D24] text-white rounded-lg"
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
      <div className="grid grid-cols-7 gap-1.5">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="text-center font-medium text-[11px] sm:text-xs tracking-wide uppercase text-gray-500 py-2"
          >
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
    
    return createPortal(
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50"
          aria-hidden="true"
          onClick={() => {
            setIsLessonSummaryOpen(false);
            setRemoveFromDayDropdownOpen(false);
          }}
        />
        <div
          className="relative z-10 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden w-[90%] max-w-4xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
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
      </div>,
      document.body,
    );
  };

  const viewModeLabel =
    viewMode === 'month'
      ? 'Month View'
      : viewMode === 'week'
        ? 'Week View'
        : viewMode === 'week-lessons'
          ? 'Week Lessons'
          : 'Day View';

  const periodLabel =
    viewMode === 'month'
      ? format(currentDate, 'MMMM yyyy')
      : viewMode === 'week'
        ? `Week of ${format(weekStart, 'MMM d, yyyy')}`
        : viewMode === 'week-lessons'
          ? `Week of ${format(weekStart, 'MMM d, yyyy')}`
          : format(dayViewDate, 'MMMM d, yyyy');

  const setCalendarViewMode = (mode: 'month' | 'week' | 'day' | 'week-lessons') => {
    try {
      setViewMode(mode);
    } catch (error) {
      console.error(`Error switching to ${mode} view:`, error);
    }
  };

  const navBtnClass =
    'inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors duration-200 hover:border-[#002D24] hover:text-[#002D24]';

  const viewBtnClass = (active: boolean) =>
    `flex-1 min-w-0 sm:flex-none min-h-[40px] md:min-h-[44px] px-2 sm:px-2.5 md:px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 ${
      active
        ? 'bg-[#002D24] text-white shadow-sm'
        : 'text-gray-600 hover:text-[#002D24] hover:bg-white'
    }`;

  return (
    <div className="bg-white rounded-card shadow-soft border border-gray-100 overflow-hidden ccd-fade-in-up" ref={calendarRef}>
      {/* Calendar Header — light forest/sage, split primary vs tools */}
      <div
        className="border-b border-[#E5EDE8]"
        style={{ backgroundColor: 'var(--ccd-sage, #F3F6F3)' }}
      >
        {/* Primary row: title + primary CTA + overflow tools */}
        <div className="px-3 sm:px-5 md:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#002D24]/12"
              style={{ backgroundColor: 'rgba(182, 255, 126, 0.35)' }}
            >
              <CalendarIcon className="h-5 w-5" style={{ color: '#002D24' }} />
            </div>
            <div className="min-w-0">
              <h2
                className="text-xl sm:text-2xl font-semibold tracking-tight"
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  color: '#002D24',
                }}
              >
                Calendar
              </h2>
              <p className="mt-0.5 text-xs sm:text-sm text-gray-600 truncate">
                {className}
                <span className="mx-1.5 text-gray-300">·</span>
                {viewModeLabel}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 sm:justify-end sm:shrink-0">
            <button
              onClick={() => {
                setEditingEvent(null);
                setShowEventModal(true);
              }}
              className="inline-flex min-h-[44px] sm:min-h-[48px] flex-1 sm:flex-none items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-opacity duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#002D24]/30 focus:ring-offset-2"
              style={{ backgroundColor: '#B6FF7E', color: '#002D24' }}
            >
              <Plus className="h-5 w-5 shrink-0" />
              <span>Add Event</span>
            </button>

            <div className="relative shrink-0" ref={actionsMenuRef}>
              <button
                type="button"
                onClick={() => setShowActionsMenu((open) => !open)}
                aria-expanded={showActionsMenu}
                aria-haspopup="menu"
                className={`${navBtnClass} gap-1.5 px-3 min-h-[44px] sm:min-h-[48px] min-w-[44px] sm:min-w-0`}
                title="More calendar tools"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="text-sm font-medium hidden md:inline">Tools</span>
              </button>

              {showActionsMenu && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 z-50 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowActionsMenu(false);
                      void handlePrintCalendar();
                    }}
                    disabled={isExportingPdf}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-[#F1F6F2] disabled:opacity-60"
                  >
                    <Printer className="h-4 w-4 text-gray-500 shrink-0" />
                    {isExportingPdf ? 'Exporting…' : 'Export PDF'}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowActionsMenu(false);
                      handleExportIcal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-[#F1F6F2]"
                  >
                    <Download className="h-4 w-4 text-gray-500 shrink-0" />
                    Export iCal
                  </button>
                  <div className="my-1 border-t border-gray-100" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowActionsMenu(false);
                      setShowTimetableBuilder(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-[#F1F6F2]"
                  >
                    <Users className="h-4 w-4 text-gray-500 shrink-0" />
                    Timetable Builder
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowActionsMenu(false);
                      setShowTimetableModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-[#F1F6F2]"
                  >
                    <Repeat className="h-4 w-4 text-gray-500 shrink-0" />
                    Timetable sync
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Partner key dates — populate Important dates across months */}
        <div
          className="px-3 sm:px-5 md:px-6 pb-3 sm:pb-3.5"
          data-ccd-key-dates-populate="1"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3 rounded-xl border border-[#E5EDE8] bg-white/80 px-3 py-2.5 sm:px-4">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="ccd-populate-key-dates"
                className="block text-xs font-semibold text-[#002D24]"
              >
                Populate with key dates from
              </label>
              <p className="mt-0.5 text-[11px] text-gray-500">
                KS1 &amp; KS2 partner examples across the year — tick to attend &amp; remind
              </p>
            </div>
            <div className="relative w-full sm:w-64 shrink-0">
              <select
                id="ccd-populate-key-dates"
                ref={keyDatesSelectRef}
                data-ccd-key-dates-select="1"
                defaultValue=""
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) return;
                  setKeyDatesOrgId(value);
                  setShowKeyDatesModal(true);
                }}
                className="w-full min-h-[40px] appearance-none rounded-lg border border-[#002D24]/20 bg-white py-2 pl-3 pr-9 text-sm text-[#002D24] focus:border-[#002D24] focus:outline-none focus:ring-2 focus:ring-[#002D24]/20"
              >
                <option value="">Choose a partner…</option>
                {getPartnerHubsForKeyDates().map((hub) => (
                  <option key={hub.slug} value={hub.slug}>
                    {hub.shortName}
                    {hub.paid ? ' (paid)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#002D24]/50" />
            </div>
          </div>
          <ImportantDatesPanel
            className="mt-2.5"
            compact
            onJumpToDate={(date) => {
              setCurrentDate(date);
              setViewMode('month');
              onDateSelect(date);
            }}
          />
        </div>

        {/* Secondary row: period nav + view switcher */}
        <div className="px-3 sm:px-5 md:px-6 pb-3 sm:pb-4 flex flex-col gap-2.5 sm:gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
            <button
              onClick={() => {
                if (viewMode === 'month') {
                  setCurrentDate(subMonths(currentDate, 1));
                } else if (viewMode === 'week' || viewMode === 'week-lessons') {
                  setCurrentDate(subWeeks(currentDate, 1));
                } else {
                  setDayViewDate(addDays(dayViewDate, -1));
                }
              }}
              aria-label="Previous period"
              className={navBtnClass}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              onClick={() => {
                setCurrentDate(new Date());
                setDayViewDate(new Date());
              }}
              className="inline-flex min-h-[40px] md:min-h-[44px] items-center px-3 sm:px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-colors duration-200 hover:border-[#002D24] hover:text-[#002D24]"
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
              aria-label="Next period"
              className={navBtnClass}
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <h3
              className="ml-0.5 sm:ml-1 basis-full sm:basis-auto text-base sm:text-lg font-semibold tracking-tight text-[#002D24] truncate"
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
            >
              {periodLabel}
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0 w-full lg:w-auto lg:shrink-0">
            {units.length > 0 && (
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="w-full sm:w-auto min-h-[40px] md:min-h-[44px] px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#002D24]/25 focus:border-[#002D24]"
              >
                <option value="all">All Units</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            )}

            <div
              className="flex w-full lg:w-auto min-w-0 p-1 rounded-lg border border-gray-200 bg-[#E8F0EA]/60"
              role="tablist"
              aria-label="Calendar view"
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'month'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCalendarViewMode('month');
                }}
                className={viewBtnClass(viewMode === 'month')}
              >
                Month
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'week'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCalendarViewMode('week');
                }}
                className={viewBtnClass(viewMode === 'week')}
              >
                Week
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'week-lessons'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCalendarViewMode('week-lessons');
                }}
                className={viewBtnClass(viewMode === 'week-lessons')}
              >
                <span className="hidden sm:inline">Week Lessons</span>
                <span className="sm:hidden">Lessons</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'day'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCalendarViewMode('day');
                }}
                className={viewBtnClass(viewMode === 'day')}
              >
                Day
              </button>
            </div>
          </div>
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
        <div className="p-4 sm:p-5 bg-white">
          {viewMode === 'month' ? renderMonthView() : viewMode === 'week' ? renderWeekView() : renderDayView()}
        </div>
      )}

      {/* Legend */}
      <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-[#E5EDE8]" style={{ backgroundColor: 'var(--ccd-sage, #F3F6F3)' }}>
        <div className="flex items-center justify-center flex-wrap gap-x-5 gap-y-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#3D6B5E]" />
            <span className="text-gray-600">Planned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-gray-600">Holiday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-gray-600">Inset Day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-gray-600">Event</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-gray-600">Timetabled Class</span>
          </div>
        </div>
      </div>

      {/* Lesson Summary Modal */}
      {renderLessonSummary()}

      {/* Edit Plan Modal */}
      {editingPlan && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" onClick={() => setEditingPlan(null)} />
          <div
            className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
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
        </div>,
        document.body,
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

      {/* Partner key dates populate flow */}
      <PartnerKeyDatesModal
        isOpen={showKeyDatesModal}
        orgId={keyDatesOrgId || null}
        onClose={() => {
          setShowKeyDatesModal(false);
          setKeyDatesOrgId('');
          if (keyDatesSelectRef.current) keyDatesSelectRef.current.value = '';
        }}
        onConfirm={handleKeyDatesConfirm}
      />
      <ImportantDatesConfirmPopup
        isOpen={Boolean(confirmImportantDates)}
        orgId={confirmImportantDates?.orgId || null}
        dates={confirmImportantDates?.dates || []}
        onClose={() => setConfirmImportantDates(null)}
      />

      {/* Lesson Details Modal */}
      {selectedLessonForDetails && (
        <LessonDetailsModal
          lessonNumber={selectedLessonForDetails}
          onClose={() => setSelectedLessonForDetails(null)}
          theme={theme as any}
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
          initialEditClass={editingTimetableClass as any}
        />
      )}
    </div>
  );
}