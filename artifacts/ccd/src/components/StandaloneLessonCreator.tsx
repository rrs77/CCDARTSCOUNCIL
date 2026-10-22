import React, { useState, useMemo, useRef } from 'react';
import { sanitizeHtml } from '../utils/sanitize';
import { useDrag, useDrop } from 'react-dnd';
import { useDropZoneStyle, useDropFlash } from './dnd';
import { X, Plus, Trash2, Eye, BookOpen, Target, Link2, Clock, Search, GripVertical, ChevronDown, ChevronUp, List, Layers, Upload, Save, HelpCircle, Columns2, Pencil, ArrowLeft } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { ActivityCard } from './ActivityCard';
import { SimpleNestedCategoryDropdown } from './SimpleNestedCategoryDropdown';
import { ActivitySearchModal } from './ActivitySearchModal';
import { ObjectiveSelector } from './ObjectiveSelector';
import { LessonImportModal, ParsedLessonData } from './LessonImportModal';
import { LessonPrintPreview } from './LessonPrintPreview';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { useAuth } from '../hooks/useAuth';
import type { Activity, LessonPlan } from '../contexts/DataContext';
import type { LessonPdfData } from '../utils/lessonPdfHtml';

// Example content for each section - shown in ? modal when creating new lessons
const SECTION_EXAMPLES: Record<string, { title: string; content: string }> = {
  lessonTitle: { title: 'Lesson Title', content: 'Exploring Rhythm and Beat' },
  lessonName: { title: 'Lesson Subtitle', content: 'Introduction to Musical Patterns' },
  learningOutcome: {
    title: 'Learning Outcome',
    content: '<p>Children will be able to:</p><p>Maintain a steady beat when clapping or playing instruments<br/>Identify the difference between rhythm and beat<br/>Create simple 4-beat rhythm patterns</p>',
  },
  successCriteria: {
    title: 'Success Criteria',
    content: '<p>I can:</p><p>Keep a steady beat for at least 8 counts<br/>Copy a simple rhythm pattern<br/>Create my own rhythm using body percussion</p>',
  },
  introduction: {
    title: 'Introduction/Context',
    content: '<p>Begin by playing a familiar song and ask children to clap along. Discuss: "What are we clapping? Is it the same all the way through?"</p><p>Introduce the concept of a steady beat like a heartbeat - always the same speed.</p>',
  },
  mainActivity: {
    title: 'Main Activity',
    content: '<p><strong>Activity 1: Beat vs Rhythm</strong></p><p>Play "We Will Rock You" - demonstrate the steady beat (stomp stomp clap) vs the rhythm of the words.</p><p><strong>Activity 2: Rhythm Patterns</strong></p><p>Using rhythm cards, children practice 4-beat patterns in pairs. Progress from copying to creating.</p>',
  },
  plenary: {
    title: 'Plenary/Conclusion',
    content: '<p>Performance circle: Each pair shares their created rhythm pattern. Class tries to copy it back.</p><p>Exit question: "What is the difference between beat and rhythm?"</p>',
  },
  vocabulary: {
    title: 'Vocabulary',
    content: '<p><strong>Beat</strong> - The steady pulse in music<br/><strong>Rhythm</strong> - The pattern of long and short sounds<br/><strong>Tempo</strong> - How fast or slow the beat is<br/><strong>Pattern</strong> - A sequence that repeats</p>',
  },
  keyQuestions: {
    title: 'Key Questions',
    content: '<ul><li>Can you feel the beat in this music?</li><li>Is the rhythm the same as the beat?</li><li>How many beats are in your pattern?</li><li>What happens if we speed up the tempo?</li></ul>',
  },
  resources: {
    title: 'Resources',
    content: '<ul><li>Rhythm cards (sets of 8)</li><li>Untuned percussion instruments</li><li>Audio: "We Will Rock You" by Queen</li><li>Interactive whiteboard for visual patterns</li></ul>',
  },
  differentiation: {
    title: 'Differentiation',
    content: '<p><strong>Support:</strong> Use visual rhythm cards with symbols, pair with confident partner</p><p><strong>Challenge:</strong> Create 8-beat patterns, add dynamics (loud/quiet)</p>',
  },
  assessment: {
    title: 'Assessment',
    content: '<p>Observe children during activities - can they maintain the beat independently?</p><p>Use exit tickets: Draw your favourite rhythm pattern</p>',
  },
};

interface StandaloneLessonCreatorProps {
  onSave: (lessonData: any) => void | Promise<void>;
  onClose: () => void;
  editingLesson?: {
    lessonNumber: string;
    lessonData: any;
  };
  yearGroup?: string; // Current year group for filtering objectives
}

// Compact Draggable Activity Item Component
interface CompactDraggableActivityProps {
  activity: Activity;
  index: number;
  onRemove: () => void;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
}

function CompactDraggableActivity({ activity, index, onRemove, onReorder }: CompactDraggableActivityProps) {
  const { getCategoryColor } = useSettings();
  const ref = useRef<HTMLDivElement>(null);
  const categoryColor = getCategoryColor(activity.category);

  const { flashClass, triggerFlash } = useDropFlash();

  const [{ handlerId, isOver, canDrop }, drop] = useDrop({
    accept: 'compact-activity',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      };
    },
    hover(item: { index: number }, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      onReorder(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    drop() {
      triggerFlash();
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'compact-activity',
    item: () => ({ index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));
  const dropZoneClass = useDropZoneStyle({ isOver, canDrop, variant: 'inline' });

  return (
    <div
      ref={ref}
      style={{ opacity }}
      data-handler-id={handlerId}
      className={`flex items-center py-2.5 px-3 group cursor-grab active:cursor-grabbing transition-all rounded-lg ${
        isDragging 
          ? 'bg-[#E9E6FF] shadow-lg ring-2 ring-[#a9a3ff]' 
          : 'hover:bg-gray-50'
      } ${dropZoneClass} ${flashClass}`}
    >
      <div className="p-1 mr-2 rounded hover:bg-gray-200 transition-colors">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      <div 
        className="w-1 h-6 rounded-full mr-2 flex-shrink-0"
        style={{ backgroundColor: categoryColor }}
      />
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-900 font-medium">{activity.activity}</span>
      </div>
      <span 
        className="px-2 py-0.5 text-white text-xs font-medium rounded-full mr-2"
        style={{ backgroundColor: categoryColor }}
      >
        {activity.category}
      </span>
      {activity.time > 0 && (
        <div className="flex items-center space-x-1 text-gray-500 mr-2">
          <Clock className="h-3 w-3" />
          <span className="text-xs">{activity.time}m</span>
        </div>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        title="Remove Activity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export const StandaloneLessonCreator: React.FC<StandaloneLessonCreatorProps> = ({ onSave, onClose, editingLesson, yearGroup }) => {
  const { allActivities, updateLessonData, currentSheetInfo } = useData();
  const { categories, customYearGroups, getCategoryColor } = useSettings();
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'admin' || user?.role === 'superuser';
  
  const [activeTab, setActiveTab] = useState<'main' | 'extended'>('main');
  /** Edit form / A4 print preview / side-by-side split (live PDF HTML). */
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Initialize lesson state - populate if editing
  const [lesson, setLesson] = useState(() => {
    if (editingLesson?.lessonData) {
      const lessonData = editingLesson.lessonData;
      return {
        lessonTitle: lessonData.title || '',
        lessonName: lessonData.lessonName || '',
        lessonCategory: lessonData.lessonCategory || '',
        duration: lessonData.totalTime || 60,
        assessmentObjectives: lessonData.assessmentObjectives || [] as string[],
        learningOutcome: lessonData.learningOutcome || '',
        successCriteria: lessonData.successCriteria || '',
        introduction: lessonData.introduction || '',
        mainActivity: lessonData.mainActivity || '',
        plenary: lessonData.plenary || '',
        vocabulary: lessonData.vocabulary || '',
        keyQuestions: lessonData.keyQuestions || '',
        resources: lessonData.resources || '',
        differentiation: lessonData.differentiation || '',
        assessment: lessonData.assessment || '',
        videoLink: lessonData.videoLink || '',
        resourceLink: lessonData.resourceLink || '',
        imageLink: lessonData.imageLink || '',
        additionalLinks: lessonData.additionalLinks || [] as Array<{ url: string; label: string }>,
      };
    }
    // Empty fields for new lessons - examples available via ? icon next to each section
    return {
      lessonTitle: '',
      lessonName: '',
      lessonCategory: '',
      duration: 45,
      assessmentObjectives: [] as string[],
      learningOutcome: '',
      successCriteria: '',
      introduction: '',
      mainActivity: '',
      plenary: '',
      vocabulary: '',
      keyQuestions: '',
      resources: '',
      differentiation: '',
      assessment: '',
      videoLink: '',
      resourceLink: '',
      imageLink: '',
      additionalLinks: [] as Array<{ url: string; label: string }>,
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Activity library state - populate if editing
  const [selectedActivities, setSelectedActivities] = useState<Activity[]>(() => {
    if (editingLesson?.lessonData) {
      const lessonData = editingLesson.lessonData;
      // Use orderedActivities if available, otherwise flatten grouped
      let activities: Activity[] = [];
      if (lessonData.orderedActivities && Array.isArray(lessonData.orderedActivities)) {
        activities = lessonData.orderedActivities.map((activity: Activity) => ({
          ...activity,
          _uniqueId: Date.now() + Math.random().toString(36).substring(2, 9)
        }));
      } else if (lessonData.grouped) {
        const categoryOrder = lessonData.categoryOrder || Object.keys(lessonData.grouped);
        activities = categoryOrder
          .filter((category: any) => lessonData.grouped[category])
          .flatMap((category: any) => lessonData.grouped[category] || [])
          .map((activity: Activity) => ({
            ...activity,
            _uniqueId: Date.now() + Math.random().toString(36).substring(2, 9)
          }));
      }
      return activities;
    }
    return [];
  });
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showActivitiesSection, setShowActivitiesSection] = useState(editingLesson ? true : false);
  const [showAssessmentObjectivesSelector, setShowAssessmentObjectivesSelector] = useState(false);
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [exampleSection, setExampleSection] = useState<string | null>(null);

  // Auto-resize textareas on mount and when values change
  React.useEffect(() => {
    const textareas = document.querySelectorAll('textarea[name]');
    textareas.forEach((textarea) => {
      const ta = textarea as HTMLTextAreaElement;
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    });
  }, [lesson]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLesson((prev) => ({ ...prev, [name]: name === 'duration' ? parseInt(value) || 0 : value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleRichTextChange = (field: string, value: string) => {
    setLesson((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddLink = () => {
    setLesson((prev) => ({
      ...prev,
      additionalLinks: [...prev.additionalLinks, { url: '', label: '' }],
    }));
  };

  // Handle importing lesson content
  const handleImportLesson = (importedData: ParsedLessonData) => {
    setLesson((prev) => ({
      ...prev,
      lessonTitle: importedData.lessonTitle || prev.lessonTitle,
      lessonName: importedData.lessonName || prev.lessonName,
      duration: importedData.duration || prev.duration,
      learningOutcome: importedData.learningOutcome || prev.learningOutcome,
      successCriteria: importedData.successCriteria || prev.successCriteria,
      introduction: importedData.introduction || prev.introduction,
      mainActivity: importedData.mainActivity || prev.mainActivity,
      plenary: importedData.plenary || prev.plenary,
      vocabulary: importedData.vocabulary || prev.vocabulary,
      keyQuestions: importedData.keyQuestions || prev.keyQuestions,
      resources: importedData.resources || prev.resources,
      differentiation: importedData.differentiation || prev.differentiation,
      assessment: importedData.assessment || prev.assessment,
    }));
  };

  const handleRemoveLink = (index: number) => {
    setLesson((prev) => ({
      ...prev,
      additionalLinks: prev.additionalLinks.filter((_: any, i: number) => i !== index),
    }));
  };

  const handleLinkChange = (index: number, field: 'url' | 'label', value: string) => {
    setLesson((prev) => ({
      ...prev,
      additionalLinks: prev.additionalLinks.map((link: any, i: number) =>
        i === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!lesson.lessonTitle.trim()) newErrors.lessonTitle = 'Lesson title is required';
    if (!lesson.lessonName.trim()) newErrors.lessonName = 'Lesson name is required';
    if (!lesson.duration || lesson.duration <= 0) newErrors.duration = 'Duration must be greater than 0';

    setErrors(newErrors);
    
    // If there are errors, show an alert and scroll to the top
    if (Object.keys(newErrors).length > 0) {
      const errorMessages = Object.values(newErrors).join('\n• ');
      alert(`Please fill in the required fields:\n\n• ${errorMessages}`);
      
      // Switch to main tab where the errors are
      setActiveTab('main');
      
      // Scroll to top of the modal content
      const modalContent = document.querySelector('.overflow-y-auto');
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
    }
    
    return Object.keys(newErrors).length === 0;
  };

  // Handle activity selection from modal
  const handleSelectActivity = (activity: Activity) => {
    const activityCopy = JSON.parse(JSON.stringify(activity));
    const uniqueActivity = {
      ...activityCopy,
      _uniqueId: Date.now() + Math.random().toString(36).substring(2, 9)
    };
    
    // Check if already added
    const isAlreadyAdded = selectedActivities.some(
      a => (a._id || a.id) === (activity._id || activity.id)
    );
    
    if (!isAlreadyAdded) {
      setSelectedActivities(prev => [...prev, uniqueActivity]);
      
      // Update duration
      setLesson(prev => ({
        ...prev,
        duration: prev.duration + (uniqueActivity.time || 0)
      }));
    }
  };

  // Handle activity removal from modal
  const handleRemoveActivity = (activity: Activity) => {
    const activityToRemove = selectedActivities.find(
      a => (a._id || a.id) === (activity._id || activity.id)
    );
    
    if (activityToRemove) {
      setSelectedActivities(prev => prev.filter(
        a => (a._id || a.id) !== (activity._id || activity.id)
      ));
      
      // Update duration
      setLesson(prev => ({
        ...prev,
        duration: Math.max(0, prev.duration - (activityToRemove.time || 0))
      }));
    }
  };

  // Handle adding activity from library
  const handleActivityAdd = (activity: Activity) => {
    const activityCopy = JSON.parse(JSON.stringify(activity));
    const uniqueActivity = {
      ...activityCopy,
      _uniqueId: Date.now() + Math.random().toString(36).substring(2, 9)
    };
    setSelectedActivities(prev => [...prev, uniqueActivity]);
    
    // Update duration
    setLesson(prev => ({
      ...prev,
      duration: prev.duration + (uniqueActivity.time || 0)
    }));
  };

  // Handle removing activity
  const handleActivityRemove = (index: number) => {
    const removedActivity = selectedActivities[index];
    setSelectedActivities(prev => prev.filter((_, i) => i !== index));
    
    // Update duration
    setLesson(prev => ({
      ...prev,
      duration: Math.max(0, prev.duration - (removedActivity.time || 0))
    }));
  };

  // Handle reordering activities
  const handleActivityReorder = (dragIndex: number, hoverIndex: number) => {
    setSelectedActivities(prev => {
      const newActivities = [...prev];
      const [movedActivity] = newActivities.splice(dragIndex, 1);
      newActivities.splice(hoverIndex, 0, movedActivity);
      return newActivities;
    });
  };

  /** Unsaved form → PDF HTML shape for live print preview. */
  const livePdfLessonData = useMemo((): LessonPdfData => {
    const grouped: Record<string, Activity[]> = {};
    const categoryOrder: string[] = [];
    selectedActivities.forEach((activity) => {
      const category = activity.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
        categoryOrder.push(category);
      }
      grouped[category].push(activity);
    });
    return {
      title: lesson.lessonTitle,
      lessonName: lesson.lessonName,
      totalTime: lesson.duration,
      assessmentObjectives: lesson.assessmentObjectives,
      learningOutcome: lesson.learningOutcome,
      successCriteria: lesson.successCriteria,
      introduction: lesson.introduction,
      mainActivity: lesson.mainActivity,
      plenary: lesson.plenary,
      vocabulary: lesson.vocabulary,
      keyQuestions: lesson.keyQuestions,
      resources: lesson.resources,
      differentiation: lesson.differentiation,
      assessment: lesson.assessment,
      orderedActivities: selectedActivities,
      grouped,
      categoryOrder,
    };
  }, [lesson, selectedActivities]);

  const printPreviewOptions = useMemo(
    () => ({
      lessonData: livePdfLessonData,
      sheetDisplay: currentSheetInfo?.display || currentSheetInfo?.sheet || yearGroup || 'Class',
      lessonNumber: editingLesson?.lessonNumber || 'new',
      getCategoryColor: (cat: string) => getCategoryColor?.(cat) || '#0f766e',
      printTitle: lesson.lessonTitle || 'Lesson Plan',
    }),
    [livePdfLessonData, currentSheetInfo, yearGroup, editingLesson, getCategoryColor, lesson.lessonTitle],
  );

  const handleSubmit = async () => {
    console.log('📝 Submit button clicked');
    console.log('📊 Current lesson data:', lesson);
    
    if (!validate()) {
      console.log('❌ Validation failed');
      return;
    }

    console.log('✅ Validation passed');

    try {
      // Group activities by category
      const grouped: Record<string, Activity[]> = {};
      const categoryOrder: string[] = [];
      
      selectedActivities.forEach(activity => {
        const category = activity.category || 'Other';
        if (!grouped[category]) {
          grouped[category] = [];
          categoryOrder.push(category);
        }
        grouped[category].push(activity);
      });

      const lessonData = {
        title: lesson.lessonTitle,
        lessonName: lesson.lessonName,
        lessonCategory: lesson.lessonCategory || undefined,
        totalTime: lesson.duration,
        type: 'standalone',
        createdAt: editingLesson?.lessonData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assessmentObjectives: lesson.assessmentObjectives,
        learningOutcome: sanitizeHtml(lesson.learningOutcome || ''),
        successCriteria: sanitizeHtml(lesson.successCriteria || ''),
        introduction: sanitizeHtml(lesson.introduction || ''),
        mainActivity: sanitizeHtml(lesson.mainActivity || ''),
        plenary: sanitizeHtml(lesson.plenary || ''),
        vocabulary: sanitizeHtml(lesson.vocabulary || ''),
        keyQuestions: sanitizeHtml(lesson.keyQuestions || ''),
        resources: sanitizeHtml(lesson.resources || ''),
        differentiation: sanitizeHtml(lesson.differentiation || ''),
        assessment: sanitizeHtml(lesson.assessment || ''),
        videoLink: lesson.videoLink,
        resourceLink: lesson.resourceLink,
        imageLink: lesson.imageLink,
        additionalLinks: lesson.additionalLinks,
        grouped: grouped,
        categoryOrder: categoryOrder,
        orderedActivities: selectedActivities.map(a => {
          const { _uniqueId, ...cleanActivity } = a;
          return cleanActivity;
        })
      };

      console.log('📦 Final lesson data to save:', lessonData);

      // If editing, use updateLessonData
      if (editingLesson && updateLessonData) {
        console.log('💾 Updating existing lesson:', editingLesson.lessonNumber);
        await updateLessonData(editingLesson.lessonNumber, lessonData);
        console.log('✅ Lesson updated successfully');
        onClose();
      } else {
        console.log('💾 Creating new lesson - calling onSave...');
        await onSave(lessonData);
        console.log('✅ onSave completed');
      }
    } catch (error) {
      console.error('❌ Error saving lesson:', error);
      alert(`Error saving lesson: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const showEditor = viewMode === 'edit' || viewMode === 'split';
  const showPrintPreview = viewMode === 'preview' || viewMode === 'split';

  return (
    <>
      {/* Full-screen Create / Edit Lesson */}
      <div className="fixed inset-0 z-[100] flex flex-col bg-[#F4F3FA]">
        {/* Header */}
        <div className="shrink-0 border-b border-[#E2E0EF] bg-white px-3 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E2E0EF] bg-white px-3 text-[13px] font-bold text-[#5C5878] hover:border-[#bcb7f4] hover:text-[#1F1B4D]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="flex min-w-0 items-center gap-2">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#0BA596]/15 text-[#0BA596]">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#77738F]">
                    {editingLesson ? 'Edit lesson' : 'Create lesson'}
                  </p>
                  <h2 className="truncate text-[15px] font-extrabold tracking-tight text-[#1F1B4D] sm:text-[17px]">
                    {editingLesson
                      ? editingLesson.lessonData?.title || `Lesson ${editingLesson.lessonNumber}`
                      : lesson.lessonTitle || 'New lesson plan'}
                  </h2>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div
                className="inline-flex rounded-xl border border-[#E2E0EF] bg-[#F4F3FA] p-0.5"
                role="group"
                aria-label="Editor view mode"
              >
                {(
                  [
                    { id: 'edit' as const, label: 'Edit', icon: Pencil },
                    { id: 'preview' as const, label: 'Preview', icon: Eye },
                    { id: 'split' as const, label: 'Split', icon: Columns2 },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setViewMode(id)}
                    aria-pressed={viewMode === id}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-[12px] font-extrabold transition ${
                      viewMode === id
                        ? 'bg-white text-[#1F1B4D] shadow-sm'
                        : 'text-[#77738F] hover:text-[#1F1B4D]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E2E0EF] bg-white px-3 text-[12px] font-bold text-[#5C5878] hover:border-[#bcb7f4]"
                  title="Import Lesson Content"
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Import</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-xl text-[#77738F] hover:bg-[#F4F3FA] hover:text-[#1F1B4D]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {showEditor ? (
            <div
              className={`flex min-h-0 min-w-0 flex-col bg-white ${
                viewMode === 'split' ? 'lg:w-1/2 lg:border-r lg:border-[#E2E0EF]' : 'w-full'
              }`}
            >
        {/* Tabs */}
        <div className="flex shrink-0 bg-gray-50 border-0" style={{ border: 'none', borderBottom: 'none', outline: 'none' }}>
          <button
            onClick={() => setActiveTab('main')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'main'
                ? 'text-white'
                : 'text-gray-600 hover:text-[#4338E8] hover:bg-[#E9E6FF]'
            }`}
            style={{
              ...(activeTab === 'main' ? { background: 'linear-gradient(135deg, #0BA596 0%, #0BA596 100%)' } : {}),
              border: 'none !important', 
              borderBottom: 'none !important', 
              borderTop: 'none !important',
              borderLeft: 'none !important',
              borderRight: 'none !important',
              outline: 'none !important',
              boxShadow: 'none !important',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none'
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.border = 'none';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.border = 'none';
            }}
          >
            <div className="flex items-center justify-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Key Information</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('extended')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'extended'
                ? 'text-white'
                : 'text-gray-600 hover:text-[#4338E8] hover:bg-[#E9E6FF]'
            }`}
            style={{
              ...(activeTab === 'extended' ? { background: 'linear-gradient(135deg, #0BA596 0%, #0BA596 100%)' } : {}),
              border: 'none !important',
              borderBottom: 'none !important',
              borderTop: 'none !important',
              borderLeft: 'none !important',
              borderRight: 'none !important',
              outline: 'none !important',
              boxShadow: 'none !important',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none'
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.border = 'none';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.border = 'none';
            }}
          >
            <div className="flex items-center justify-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Extended Details</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === 'main' ? (
            <div className="p-6 space-y-6">
              {/* Basic Information Card */}
              <div className="bg-gradient-to-br from-[#E9E6FF] to-[#F4F3FA] border border-[#E2E0EF] rounded-lg p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <BookOpen className="h-5 w-5 text-[#4338E8]" />
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <div className="flex items-center gap-1 mb-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Lesson Title (for card) <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => { setExampleSection('lessonTitle'); setShowExampleModal(true); }}
                        className="p-0.5 text-[#4338E8] hover:text-[#1F1B4D] hover:bg-[#E9E6FF] rounded-full transition-colors"
                        title="View example"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      name="lessonTitle"
                      value={lesson.lessonTitle}
                      onChange={handleChange}
                      className={`w-full h-10 px-3 border ${errors.lessonTitle ? 'border-red-500' : 'border-gray-300'} rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#4338E8] focus:border-transparent`}
                      style={{ '--tw-ring-color': '#0BA596' } as React.CSSProperties}
                      placeholder="e.g., Musical Rhythms"
                    />
                    {errors.lessonTitle && (
                      <p className="mt-1 text-xs text-red-500">{errors.lessonTitle}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1 mb-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Lesson Name <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => { setExampleSection('lessonName'); setShowExampleModal(true); }}
                        className="p-0.5 text-[#4338E8] hover:text-[#1F1B4D] hover:bg-[#E9E6FF] rounded-full transition-colors"
                        title="View example"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      name="lessonName"
                      value={lesson.lessonName}
                      onChange={handleChange}
                      className={`w-full h-10 px-3 border ${errors.lessonName ? 'border-red-500' : 'border-gray-300'} rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#4338E8] focus:border-transparent`}
                      style={{ '--tw-ring-color': '#0BA596' } as React.CSSProperties}
                      placeholder="e.g., Exploring Tempo"
                    />
                    {errors.lessonName && (
                      <p className="mt-1 text-xs text-red-500">{errors.lessonName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Duration (mins) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="duration"
                      value={lesson.duration || ''}
                      onChange={handleChange}
                      className={`w-full h-10 px-3 border ${errors.duration ? 'border-red-500' : 'border-gray-300'} rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#4338E8] focus:border-transparent`}
                      style={{ '--tw-ring-color': '#0BA596' } as React.CSSProperties}
                      placeholder="60"
                      min="0"
                    />
                    {errors.duration && (
                      <p className="mt-1 text-xs text-red-500">{errors.duration}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Category
                    </label>
                    <div className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white flex items-center">
                      <SimpleNestedCategoryDropdown
                        selectedCategory={lesson.lessonCategory || ''}
                        onCategoryChange={(category) => setLesson(prev => ({ ...prev, lessonCategory: category }))}
                        placeholder="Select category (for this class)"
                        className="w-full text-sm"
                        showAllCategories={false}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Categories available for the current class</p>
                  </div>
                </div>
              </div>

              {/* Assessment Objectives Card - Applies to whole lesson */}
              <div className="bg-gradient-to-br from-[#E9E6FF] to-[#F4F3FA] border border-[#E2E0EF] rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-[#4338E8]" />
                    <h3 className="text-lg font-semibold text-gray-900">Assessment Objectives</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAssessmentObjectivesSelector(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-white text-xs font-medium rounded-lg transition-colors"
                    style={{ background: 'linear-gradient(135deg, #0BA596 0%, #0BA596 100%)' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <List className="h-3.5 w-3.5" />
                    <span>Select Objectives</span>
                  </button>
                </div>
                <p className="text-xs text-[#4338E8] mb-3">
                  Select curriculum objectives that this lesson addresses. These apply to the entire lesson.
                </p>
                {lesson.assessmentObjectives.length > 0 ? (
                  <div className="space-y-2">
                    {lesson.assessmentObjectives.map((objective: string, index: number) => (
                      <div 
                        key={index}
                        className="flex items-start space-x-2 bg-white rounded-lg p-3 border border-[#E2E0EF]"
                      >
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#E9E6FF] flex items-center justify-center mt-0.5">
                          <span className="text-xs font-medium text-[#4338E8]">{index + 1}</span>
                        </div>
                        <p className="text-sm text-gray-700 flex-1">{objective}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setLesson(prev => ({
                              ...prev,
                              assessmentObjectives: prev.assessmentObjectives.filter((_: any, i: number) => i !== index)
                            }));
                          }}
                          className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-4 border border-dashed border-[#E2E0EF] text-center">
                    <p className="text-sm text-gray-500">No assessment objectives selected</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Select Objectives" to add curriculum objectives</p>
                  </div>
                )}
              </div>

              {/* Learning Objectives Card */}
              <div className="bg-gradient-to-br from-[#E9E6FF] to-[#F4F3FA] border border-[#E2E0EF] rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-[#4338E8]" />
                    <h3 className="text-lg font-semibold text-gray-900">Learning Objectives</h3>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center gap-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Learning Outcome
                      </label>
                      <button
                        type="button"
                        onClick={() => { setExampleSection('learningOutcome'); setShowExampleModal(true); }}
                        className="p-0.5 text-[#4338E8] hover:text-[#1F1B4D] hover:bg-[#E9E6FF] rounded-full transition-colors"
                        title="View example"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-300">
                      <RichTextEditor
                        value={lesson.learningOutcome}
                        onChange={(value) => handleRichTextChange('learningOutcome', value)}
                        placeholder="Students will be able to identify and perform different musical tempos (e.g., adagio, andante, allegro)"
                      />
                    </div>
                    {errors.learningOutcome && (
                      <p className="mt-1 text-xs text-red-500">{errors.learningOutcome}</p>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Success Criteria
                      </label>
                      <button
                        type="button"
                        onClick={() => { setExampleSection('successCriteria'); setShowExampleModal(true); }}
                        className="p-0.5 text-[#4338E8] hover:text-[#1F1B4D] hover:bg-[#E9E6FF] rounded-full transition-colors"
                        title="View example"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-300">
                      <RichTextEditor
                        value={lesson.successCriteria}
                        onChange={(value) => handleRichTextChange('successCriteria', value)}
                        placeholder="• Students can clap rhythms at different tempos • Can identify tempo changes when listening • Can explain the difference between fast and slow tempo"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Introduction Card */}
              <div className={`bg-gradient-to-br from-[#E9E6FF] to-[#F4F3FA] border border-[#E2E0EF] rounded-lg transition-all duration-300 ${lesson.introduction ? 'p-5' : 'p-4'}`}>
                <div className="flex items-center space-x-2 mb-3">
                  <BookOpen className="h-5 w-5 text-[#4338E8]" />
                  <h3 className="text-base font-semibold text-gray-900">Introduction/Context</h3>
                  <button
                    type="button"
                    onClick={() => { setExampleSection('introduction'); setShowExampleModal(true); }}
                    className="p-0.5 text-[#4338E8] hover:text-[#1F1B4D] hover:bg-[#E9E6FF] rounded-full transition-colors"
                    title="View example"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </div>
                {lesson.introduction || true ? (
                  <textarea
                    name="introduction"
                    value={lesson.introduction}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none"
                    style={{ height: lesson.introduction ? 'auto' : '60px', minHeight: '60px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                    placeholder="Warm-up: Sing familiar song at normal tempo, then experiment with different speeds"
                  />
                ) : null}
              </div>

              {/* Main Activity Card */}
              <div className={`bg-gradient-to-br from-[#E9E6FF] to-[#F4F3FA] border border-[#E2E0EF] rounded-lg transition-all duration-300 ${lesson.mainActivity ? 'p-5' : 'p-4'}`}>
                <div className="flex items-center space-x-2 mb-3">
                  <Target className="h-5 w-5 text-[#4338E8]" />
                  <h3 className="text-base font-semibold text-gray-900">Main Activity</h3>
                  <button
                    type="button"
                    onClick={() => { setExampleSection('mainActivity'); setShowExampleModal(true); }}
                    className="p-0.5 text-[#4338E8] hover:text-[#1F1B4D] hover:bg-[#E9E6FF] rounded-full transition-colors"
                    title="View example"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </div>
                {lesson.mainActivity || true ? (
                  <div className="bg-white rounded-lg border border-gray-300">
                    <RichTextEditor
                      value={lesson.mainActivity}
                      onChange={(value) => handleRichTextChange('mainActivity', value)}
                      placeholder="Describe the main activity in detail. For music: Include instrumental work, singing, movement, listening activities, and performance elements."
                    />
                  </div>
                ) : null}
              </div>

              {/* Activities Section - Standalone card below Main Activity */}
              <div className="bg-gradient-to-br from-[#E9E6FF] to-[#F4F3FA] border border-[#E2E0EF] rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Layers className="h-5 w-5 text-[#4338E8]" />
                    <h3 className="text-base font-semibold text-gray-900">Activities from Library</h3>
                    {selectedActivities.length > 0 && (
                      <span className="text-xs text-gray-500 bg-[#E9E6FF] px-2 py-0.5 rounded-full">
                        {selectedActivities.length} selected
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowActivityModal(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-white text-xs font-medium rounded-lg transition-colors"
                    style={{ background: 'linear-gradient(135deg, #0BA596 0%, #0BA596 100%)' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Activities</span>
                  </button>
                </div>
                
                  {selectedActivities.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                      <p className="text-sm text-gray-500">
                        Click "Add Activities" to select activities from your library.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                      {selectedActivities.map((activity, index) => (
                        <CompactDraggableActivity
                          key={activity._uniqueId || `${activity._id || activity.id || activity.activity}-${index}`}
                          activity={activity}
                          index={index}
                          onRemove={() => handleActivityRemove(index)}
                          onReorder={handleActivityReorder}
                        />
                      ))}
                    </div>
                  )}
              </div>

              {/* Plenary Card */}
              <div className={`bg-gradient-to-br from-[#E9E6FF] to-[#F4F3FA] border border-[#E2E0EF] rounded-lg transition-all duration-300 ${lesson.plenary ? 'p-5' : 'p-4'}`}>
                <div className="flex items-center space-x-2 mb-3">
                  <Target className="h-5 w-5 text-[#4338E8]" />
                  <h3 className="text-base font-semibold text-gray-900">Plenary/Conclusion</h3>
                  <button
                    type="button"
                    onClick={() => { setExampleSection('plenary'); setShowExampleModal(true); }}
                    className="p-0.5 text-[#4338E8] hover:text-[#1F1B4D] hover:bg-[#E9E6FF] rounded-full transition-colors"
                    title="View example"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </div>
                {lesson.plenary || true ? (
                  <textarea
                    name="plenary"
                    value={lesson.plenary}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none"
                    style={{ height: lesson.plenary ? 'auto' : '60px', minHeight: '60px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                    placeholder="Performance: Groups perform their pieces at chosen tempos, class discusses effectiveness"
                  />
                ) : null}
              </div>
            </div>
          ) : activeTab === 'extended' ? (
            <div className="p-6 space-y-5">
              {/* Extended Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lesson.vocabulary || true ? (
                  <div className={`bg-gray-50 border border-gray-200 rounded-lg transition-all duration-300 ${lesson.vocabulary ? 'p-4' : 'p-3'}`}>
                    <div className="flex items-center gap-1 mb-2">
                      <label className="block text-sm font-medium text-gray-700">Vocabulary</label>
                      <button
                        type="button"
                        onClick={() => { setExampleSection('vocabulary'); setShowExampleModal(true); }}
                        className="p-0.5 text-[#4338E8] hover:text-[#1F1B4D] hover:bg-[#E9E6FF] rounded-full transition-colors"
                        title="View example"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea
                      name="vocabulary"
                      value={lesson.vocabulary}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none"
                      style={{ height: lesson.vocabulary ? 'auto' : '60px', minHeight: '60px' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                      placeholder="Tempo, Adagio, Andante, Allegro, Beat, Rhythm"
                    />
                  </div>
                ) : null}

                {lesson.keyQuestions || true ? (
                  <div className={`bg-gray-50 border border-gray-200 rounded-lg transition-all duration-300 ${lesson.keyQuestions ? 'p-4' : 'p-3'}`}>
                    <div className="flex items-center gap-1 mb-2">
                      <label className="block text-sm font-medium text-gray-700">Key Questions</label>
                      <button
                        type="button"
                        onClick={() => { setExampleSection('keyQuestions'); setShowExampleModal(true); }}
                        className="p-0.5 text-[#4338E8] hover:text-[#1F1B4D] hover:bg-[#E9E6FF] rounded-full transition-colors"
                        title="View example"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea
                      name="keyQuestions"
                      value={lesson.keyQuestions}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none"
                      style={{ height: lesson.keyQuestions ? 'auto' : '60px', minHeight: '60px' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                      placeholder="How does tempo affect the mood? What happens when we play faster/slower?"
                    />
                  </div>
                ) : null}

                {lesson.resources || true ? (
                  <div className={`bg-gray-50 border border-gray-200 rounded-lg transition-all duration-300 ${lesson.resources ? 'p-4' : 'p-3'}`}>
                    <div className="flex items-center gap-1 mb-2">
                      <label className="block text-sm font-medium text-gray-700">Resources</label>
                      <button
                        type="button"
                        onClick={() => { setExampleSection('resources'); setShowExampleModal(true); }}
                        className="p-0.5 text-[#4338E8] hover:text-[#1F1B4D] hover:bg-[#E9E6FF] rounded-full transition-colors"
                        title="View example"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea
                      name="resources"
                      value={lesson.resources}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none"
                      style={{ height: lesson.resources ? 'auto' : '60px', minHeight: '60px' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                      placeholder="Percussion instruments, metronome, audio player, tempo cards"
                    />
                  </div>
                ) : null}

                {lesson.assessment || true ? (
                  <div className={`bg-gray-50 border border-gray-200 rounded-lg transition-all duration-300 ${lesson.assessment ? 'p-4' : 'p-3'}`}>
                    <div className="flex items-center gap-1 mb-2">
                      <label className="block text-sm font-medium text-gray-700">Assessment</label>
                      <button
                        type="button"
                        onClick={() => { setExampleSection('assessment'); setShowExampleModal(true); }}
                        className="p-0.5 text-[#4338E8] hover:text-[#1F1B4D] hover:bg-[#E9E6FF] rounded-full transition-colors"
                        title="View example"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea
                      name="assessment"
                      value={lesson.assessment}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none"
                      style={{ height: lesson.assessment ? 'auto' : '60px', minHeight: '60px' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                      placeholder="Observe: Can students match tempo? Do they understand terminology?"
                    />
                  </div>
                ) : null}
              </div>

              {lesson.differentiation || true ? (
                <div className={`bg-gray-50 border border-gray-200 rounded-lg transition-all duration-300 ${lesson.differentiation ? 'p-4' : 'p-3'}`}>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="block text-sm font-medium text-gray-700">Differentiation</label>
                    <button
                      type="button"
                      onClick={() => { setExampleSection('differentiation'); setShowExampleModal(true); }}
                      className="p-0.5 text-[#4338E8] hover:text-[#1F1B4D] hover:bg-[#E9E6FF] rounded-full transition-colors"
                      title="View example"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    name="differentiation"
                    value={lesson.differentiation}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none"
                    style={{ height: lesson.differentiation ? 'auto' : '80px', minHeight: '80px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                    placeholder="Support: Use visual tempo indicators, simplified patterns. Extension: Compose using multiple tempo changes"
                  />
                </div>
              ) : null}

              {/* Web Links Card */}
              <div className="bg-gradient-to-br from-[#E9E6FF] to-[#F4F3FA] border border-[#E2E0EF] rounded-lg p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <Link2 className="h-5 w-5 text-[#4338E8]" />
                  <h3 className="text-base font-semibold text-gray-900">Web Links & Resources</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Video Link
                    </label>
                    <input
                      type="url"
                      name="videoLink"
                      value={lesson.videoLink}
                      onChange={handleChange}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                      placeholder="https://youtube.com/..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Resource Link
                    </label>
                    <input
                      type="url"
                      name="resourceLink"
                      value={lesson.resourceLink}
                      onChange={handleChange}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Image Link
                    </label>
                    <input
                      type="url"
                      name="imageLink"
                      value={lesson.imageLink}
                      onChange={handleChange}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* Additional Links */}
                {lesson.additionalLinks.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {lesson.additionalLinks.map((link: any, index: number) => (
                      <div key={index} className="grid grid-cols-[1fr_auto_auto] gap-2">
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                          className="h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                          placeholder="https://..."
                        />
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => handleLinkChange(index, 'label', e.target.value)}
                          className="h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white w-40"
                          placeholder="Label"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(index)}
                          className="h-10 px-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddLink}
                  className="flex items-center space-x-2 px-3 py-2 text-[#4338E8] hover:bg-[#E9E6FF] rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Link</span>
                </button>
              </div>
            </div>
            ) : null}
          </div>
            </div>
          ) : null}

          {showPrintPreview ? (
            <div
              className={`flex min-h-0 min-w-0 flex-col ${
                viewMode === 'split' ? 'lg:w-1/2' : 'w-full'
              }`}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-[#E2E0EF] bg-white px-4 py-2.5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#77738F]">
                    Print preview
                  </p>
                  <p className="text-[13px] font-semibold text-[#1F1B4D]">
                    A4 · same HTML as PDF export · live from unsaved fields
                  </p>
                </div>
              </div>
              <LessonPrintPreview
                options={printPreviewOptions}
                className="min-h-0 flex-1"
              />
            </div>
          ) : null}
        </div>

        {/* Sticky action bar */}
        <div className="shrink-0 border-t border-[#E2E0EF] bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12px] font-medium text-[#77738F]">
              {viewMode === 'preview'
                ? 'Preview updates as you edit — switch to Edit or Split to change fields.'
                : 'Changes save only when you click Save / Create Lesson.'}
            </p>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 items-center rounded-xl bg-[#5C5878] px-5 text-[13px] font-extrabold text-white hover:bg-[#4a4666]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-[13px] font-extrabold text-white hover:brightness-95"
                style={{ backgroundColor: '#0BA596' }}
              >
                <Save className="h-4 w-4" />
                <span>{editingLesson ? 'Save Changes' : 'Create Lesson'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Search Modal */}
      <ActivitySearchModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        onSelectActivity={handleSelectActivity}
        onRemoveActivity={handleRemoveActivity}
        selectedActivities={selectedActivities}
      />

      {/* Objective Selector for Assessment Objectives (whole lesson) */}
      <ObjectiveSelector
        isOpen={showAssessmentObjectivesSelector}
        onClose={() => setShowAssessmentObjectivesSelector(false)}
        onSelect={(objectiveText) => {
          // Add single objective if not already present
          if (!lesson.assessmentObjectives.includes(objectiveText)) {
            setLesson(prev => ({
              ...prev,
              assessmentObjectives: [...prev.assessmentObjectives, objectiveText]
            }));
          }
        }}
        selectedObjectives={lesson.assessmentObjectives}
        multiSelect={true}
        onMultiSelect={(objectives) => {
          setLesson(prev => ({
            ...prev,
            assessmentObjectives: objectives
          }));
        }}
        filterByYearGroup={yearGroup}
      />

      {/* Lesson Import Modal - Admin Only */}
      {isAdmin && (
        <LessonImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImportLesson}
        />
      )}

      {/* Section Example Modal - shows example when ? is clicked */}
      {showExampleModal && exampleSection && SECTION_EXAMPLES[exampleSection] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Example: {SECTION_EXAMPLES[exampleSection].title}
              </h3>
              <button
                onClick={() => { setShowExampleModal(false); setExampleSection(null); }}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div 
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: SECTION_EXAMPLES[exampleSection].content }}
              />
              <p className="mt-4 text-sm text-gray-500 italic">
                Use this as a guide. Type your own content in the empty field for that section.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
