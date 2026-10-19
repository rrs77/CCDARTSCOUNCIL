import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { sanitizeHtml } from '../utils/sanitize';
import toast from 'react-hot-toast';
import { 
  Tag, 
  Plus, 
  Save, 
  X, 
  Edit3, 
  Palette,
  Image,
  Upload,
  ChevronDown,
  Video,
  Music,
  FileText,
  Link as LinkIcon,
  Volume2,
  Undo2,
  Redo2
} from 'lucide-react';

const DURATION_CHIPS = [5, 10, 15, 25] as const;
import { useSettings, ResourceLinkConfig } from '../contexts/SettingsContextNew';
import { RichTextEditor } from './RichTextEditor';
import { SimpleNestedCategoryDropdown } from './SimpleNestedCategoryDropdown';
import { NestedStandardsBrowser } from './NestedStandardsBrowser';
import { activityPacksApi, ActivityPack } from '../config/api';

// Helper function to get icon component by name for resource links
const getIconComponentForResourceLink = (iconName: string) => {
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    Video, Music, Volume2, FileText, Palette, LinkIcon, Image
  };
  return iconMap[iconName] || FileText; // Default to FileText if icon not found
};
import { useAuth } from '../hooks/useAuth';

interface ActivityCreatorProps {
  onClose: () => void;
  onSave: (activity: any) => void;
  categories: string[];
  levels: string[];
}

export function ActivityCreator({ onClose, onSave, categories, levels }: ActivityCreatorProps) {
  const { categories: allCategories, customYearGroups, resourceLinks } = useSettings();
  const { user } = useAuth();
  const [topicInput, setTopicInput] = useState('');
  const [activity, setActivity] = useState({
    activity: '',
    description: '',
    activityText: '', // New field for activity text
    descriptionHeading: 'Introduction/Context', // Editable heading for description
    activityHeading: 'Activity', // Editable heading for activity text
    linkHeading: 'Additional Link', // Editable heading for link field
    time: 0,
    videoLink: '',
    musicLink: '',
    backingLink: '',
    resourceLink: '',
    link: '',
    vocalsLink: '',
    imageLink: '',
    canvaLink: '',
    category: '',
    level: '',
    yearGroups: [] as string[], // New field for multiple year groups
    curriculum_type: 'EYFS' as 'EYFS' | 'CUSTOM', // New field for curriculum type
    custom_objective_year_group_id: '', // New field for custom objectives year group
    custom_objective_ids: [] as string[], // New field for selected custom objectives
    unitName: '',
    lessonNumber: '',
    teachingUnit: '',
    requiredPack: '' // New field for pack requirement
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [showObjectivesBrowser, setShowObjectivesBrowser] = useState(false);
  const [availablePacks, setAvailablePacks] = useState<ActivityPack[]>([]);
  const isAdmin = user?.email === 'rob.reichstorer@gmail.com';
  const [formUndoStack, setFormUndoStack] = useState<Array<typeof activity>>([]);
  const [formRedoStack, setFormRedoStack] = useState<Array<typeof activity>>([]);
  const applyingFormHistoryRef = useRef(false);
  const prevActivityRef = useRef(activity);
  /** Longer rich-text / media blocks stay collapsed so the essentials fit on a laptop. */
  const [writingOpen, setWritingOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);

  const sanitizeText = (value: string): string =>
    (value || '')
      // Normalize smart punctuation and long dashes from copied docs
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      // Remove zero-width/non-printing chars that can break DB parsing
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\u00A0/g, ' ')
      .replace(/\r\n/g, '\n');

  const parseTopics = (value: string): string[] =>
    value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

  const addTopic = () => {
    const topic = topicInput.trim();
    if (!topic) return;
    setActivity((prev) => {
      const existing = parseTopics(prev.unitName);
      if (existing.some((t) => t.toLowerCase() === topic.toLowerCase())) {
        return prev;
      }
      return { ...prev, unitName: [...existing, topic].join(', ') };
    });
    setTopicInput('');
  };

  const removeTopic = (topicToRemove: string) => {
    setActivity((prev) => {
      const next = parseTopics(prev.unitName).filter(
        (t) => t.toLowerCase() !== topicToRemove.toLowerCase()
      );
      return { ...prev, unitName: next.join(', ') };
    });
  };

  // Track creator form history for undo/redo
  useEffect(() => {
    if (applyingFormHistoryRef.current) {
      prevActivityRef.current = activity;
      applyingFormHistoryRef.current = false;
      return;
    }
    const prev = prevActivityRef.current;
    const same = JSON.stringify(prev) === JSON.stringify(activity);
    if (same) return;
    setFormUndoStack((stack) => [...stack, prev].slice(-100));
    setFormRedoStack([]);
    prevActivityRef.current = activity;
  }, [activity]);

  const handleUndoForm = () => {
    if (formUndoStack.length === 0) return;
    const prev = formUndoStack[formUndoStack.length - 1];
    applyingFormHistoryRef.current = true;
    setFormUndoStack((stack) => stack.slice(0, -1));
    setFormRedoStack((stack) => [...stack, activity].slice(-100));
    setActivity(prev);
  };

  const handleRedoForm = () => {
    if (formRedoStack.length === 0) return;
    const next = formRedoStack[formRedoStack.length - 1];
    applyingFormHistoryRef.current = true;
    setFormRedoStack((stack) => stack.slice(0, -1));
    setFormUndoStack((stack) => [...stack, activity].slice(-100));
    setActivity(next);
  };

  // Load available packs for admin
  useEffect(() => {
    if (isAdmin) {
      const loadPacks = async () => {
        try {
          const packs = await activityPacksApi.getAllPacksAdmin();
          setAvailablePacks(packs);
        } catch (error) {
          console.error('Failed to load packs:', error);
        }
      };
      loadPacks();
    }
  }, [isAdmin]);

  // Dynamic level options based on year groups
  const simplifiedLevels = ['All', ...customYearGroups.map(group => group.name)];

  // Handlers for objectives browser
  const handleAddObjective = (objectiveId: string) => {
    setActivity(prev => ({
      ...prev,
      custom_objective_ids: [...prev.custom_objective_ids, objectiveId]
    }));
  };

  const handleRemoveObjective = (objectiveId: string) => {
    setActivity(prev => ({
      ...prev,
      custom_objective_ids: prev.custom_objective_ids.filter(id => id !== objectiveId)
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setActivity(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setActivity(prev => ({ ...prev, time: isNaN(value) ? 0 : value }));
  };

  const handleYearGroupChange = (yearGroup: string, checked: boolean) => {
    setActivity(prev => ({
      ...prev,
      yearGroups: checked 
        ? [...prev.yearGroups, yearGroup]
        : prev.yearGroups.filter(g => g !== yearGroup)
    }));
  };

  const handleCurriculumTypeChange = (curriculumType: 'EYFS' | 'CUSTOM') => {
    setActivity(prev => ({
      ...prev,
      curriculum_type: curriculumType,
      custom_objective_year_group_id: curriculumType === 'CUSTOM' ? prev.custom_objective_year_group_id : '',
      custom_objective_ids: curriculumType === 'CUSTOM' ? prev.custom_objective_ids : []
    }));
  };

  const handleCustomObjectiveYearGroupChange = (yearGroupId: string) => {
    setActivity(prev => ({
      ...prev,
      custom_objective_year_group_id: yearGroupId,
      custom_objective_ids: [] // Reset selected objectives when year group changes
    }));
  };

  const handleCustomObjectivesChange = (objectiveIds: string[]) => {
    setActivity(prev => ({
      ...prev,
      custom_objective_ids: objectiveIds
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 for demo purposes
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setActivity(prev => ({
        ...prev,
        imageLink: imageUrl
      }));
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!activity.activity.trim()) {
      newErrors.activity = 'Activity name is required';
    }
    
    if (!activity.category) {
      newErrors.category = 'Category is required';
    }
    
    if (activity.yearGroups.length === 0) {
      newErrors.yearGroups = 'At least one year group is required';
    }

    // Custom objectives validation
    // Custom objectives validation removed - now optional with unified selector
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Set teachingUnit to match category if not specified
      // Set level to first year group for backward compatibility
      const newActivity = {
        ...activity,
        activity: sanitizeText(activity.activity).trim(),
        description: sanitizeHtml(sanitizeText(activity.description)),
        activityText: sanitizeHtml(sanitizeText(activity.activityText)),
        category: sanitizeText(activity.category).trim(),
        unitName: sanitizeText(activity.unitName).trim(),
        lessonNumber: sanitizeText(activity.lessonNumber).trim(),
        teachingUnit: sanitizeText(activity.teachingUnit || activity.category).trim(),
        level: activity.yearGroups[0] || 'All' // Use first year group for backward compatibility
      };
      
      onSave(newActivity);
      onClose();
    }
  };

  const fieldLabel = 'mb-1 block text-[11px] font-bold tracking-wide text-[#1F1B4D]';
  const fieldInput =
    'h-8 w-full rounded-lg border border-[#E2E0EF] bg-white px-2.5 text-[13px] text-[#1F1B4D] placeholder:text-[#77738F] focus:border-[#4338E8] focus:outline-none focus:ring-2 focus:ring-[#4338E8]/20';
  const sectionToggle =
    'flex w-full items-center justify-between gap-2 rounded-lg border border-[#E2E0EF] bg-white px-3 py-2 text-left transition-colors hover:border-[#bcb7f4]';

  const writingFilled =
    Boolean(activity.description?.replace(/<[^>]+>/g, '').trim()) ||
    Boolean(activity.activityText?.replace(/<[^>]+>/g, '').trim());
  const mediaFilled =
    Boolean(activity.imageLink) ||
    resourceLinks.some(
      (link) => link.enabled && Boolean(activity[link.key as keyof typeof activity]),
    ) ||
    Boolean(activity.link);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-activity-title"
    >
      {/* Full-viewport dim — portaled so it is not clipped by ActivityLibrary overflow-hidden */}
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" onClick={onClose} />
      <div
        className="relative z-10 flex w-full max-w-2xl max-h-[min(90vh,42rem)] flex-col overflow-hidden rounded-2xl border border-[#E2E0EF] bg-white shadow-[0_24px_80px_rgba(31,27,77,0.22)]"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "var(--ss-font-ui, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)" }}
      >
        {/* Header — Studio Score */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#E2E0EF] bg-[#1F1B4D] px-3.5 py-2.5 text-white">
          <div className="flex items-center gap-2">
            <Tag className="h-3.5 w-3.5 text-[#FFC93C]" />
            <h2 id="create-activity-title" className="text-[14px] font-extrabold tracking-tight">
              Create activity
            </h2>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleUndoForm}
              disabled={formUndoStack.length === 0}
              className="rounded-lg p-1.5 text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
              title="Undo"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRedoForm}
              disabled={formRedoStack.length === 0}
              className="rounded-lg p-1.5 text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
              title="Redo"
            >
              <Redo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-white transition-colors hover:bg-white/15"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Form Content — essentials first; rich sections collapsed */}
        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto bg-[#F4F3FA]/50 px-3.5 py-3">
          <div className="space-y-3">
            {/* Activity name */}
            <div>
              <label className={fieldLabel}>
                Activity name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="activity"
                value={activity.activity}
                onChange={handleChange}
                className={`${fieldInput} ${errors.activity ? 'border-red-500' : ''}`}
                placeholder="Enter activity name"
                dir="ltr"
              />
              {errors.activity && (
                <p className="mt-1 text-[11px] text-red-500">{errors.activity}</p>
              )}
            </div>

            {/* Category + Duration */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <label className={fieldLabel}>
                  Category <span className="text-red-500">*</span>
                </label>
                <div
                  className={`overflow-hidden rounded-lg border bg-white focus-within:border-[#4338E8] focus-within:ring-2 focus-within:ring-[#4338E8]/20 ${
                    errors.category ? 'border-red-500' : 'border-[#E2E0EF]'
                  }`}
                >
                  <SimpleNestedCategoryDropdown
                    selectedCategory={activity.category}
                    onCategoryChange={(category) => setActivity((prev) => ({ ...prev, category }))}
                    placeholder="Select a category"
                    className="h-8 w-full bg-white px-2.5 text-[13px] font-medium"
                    dropdownBackgroundColor="#F4F3FA"
                    showAllCategories={true}
                  />
                </div>
                {errors.category && (
                  <p className="mt-1 text-[11px] text-red-500">{errors.category}</p>
                )}
              </div>

              <div className="sm:w-[13.5rem]">
                <label className={fieldLabel}>Duration</label>
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="inline-flex h-8 items-center overflow-hidden rounded-lg border border-[#E2E0EF] bg-white focus-within:border-[#4338E8] focus-within:ring-2 focus-within:ring-[#4338E8]/20">
                    <input
                      type="number"
                      name="time"
                      value={activity.time}
                      onChange={handleTimeChange}
                      min={0}
                      className="h-full w-14 border-0 bg-transparent px-2 text-[13px] text-[#1F1B4D] focus:outline-none focus:ring-0"
                      placeholder="0"
                      dir="ltr"
                      aria-label="Duration in minutes"
                    />
                    <span className="border-l border-[#E2E0EF] px-2 text-[11px] font-semibold text-[#77738F]">
                      min
                    </span>
                  </div>
                  {DURATION_CHIPS.map((mins) => {
                    const active = activity.time === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setActivity((prev) => ({ ...prev, time: mins }))}
                        className={`inline-flex h-7 min-w-[2rem] items-center justify-center rounded-md px-1.5 text-[11px] font-bold transition-colors ${
                          active
                            ? 'bg-[#4338E8] text-white'
                            : 'border border-[#E2E0EF] bg-white text-[#77738F] hover:border-[#bcb7f4] hover:text-[#1F1B4D]'
                        }`}
                      >
                        {mins}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Year groups — compact colour pills */}
            <div>
              <label className={fieldLabel}>
                Year groups <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {customYearGroups.map((group) => {
                  const selected = activity.yearGroups.includes(group.name);
                  const color = group.color || '#4338E8';
                  return (
                    <button
                      key={group.name}
                      type="button"
                      onClick={() => handleYearGroupChange(group.name, !selected)}
                      aria-pressed={selected}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold transition-colors"
                      style={{
                        borderColor: selected ? color : '#E2E0EF',
                        backgroundColor: selected ? `${color}22` : '#fff',
                        color: selected ? '#1F1B4D' : '#77738F',
                      }}
                      title={group.name}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                        aria-hidden
                      />
                      <span className="truncate">{group.name}</span>
                    </button>
                  );
                })}
              </div>
              {errors.yearGroups && (
                <p className="mt-1 text-[11px] text-red-500">{errors.yearGroups}</p>
              )}
            </div>

            {/* Objectives + Topics row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={fieldLabel}>Curriculum objectives</label>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowObjectivesBrowser(true)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E2E0EF] bg-white px-2.5 text-[12px] font-semibold text-[#1F1B4D] transition-colors hover:border-[#4338E8] hover:bg-[#E9E6FF]"
                  >
                    <Tag className="h-3.5 w-3.5 text-[#4338E8]" />
                    {activity.custom_objective_ids.length > 0
                      ? `${activity.custom_objective_ids.length} selected`
                      : 'Choose objectives'}
                  </button>
                  {activity.custom_objective_ids.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActivity((prev) => ({ ...prev, custom_objective_ids: [] }))}
                      className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-[#77738F] hover:text-red-600"
                      title="Clear objectives"
                    >
                      <X className="h-3 w-3" />
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className={fieldLabel}>Topics</label>
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTopic();
                        }
                      }}
                      className={fieldInput}
                      placeholder="Type a topic, then +"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={addTopic}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#bcb7f4] bg-[#E9E6FF] text-[#4338E8] hover:bg-[#ddd8ff]"
                      title="Add topic"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {parseTopics(activity.unitName).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {parseTopics(activity.unitName).map((topic) => (
                        <span
                          key={topic}
                          className="inline-flex items-center gap-1 rounded-full bg-[#E9E6FF] px-2 py-0.5 text-[11px] font-medium text-[#1F1B4D]"
                        >
                          {topic}
                          <button
                            type="button"
                            onClick={() => removeTopic(topic)}
                            className="text-[#4338E8] hover:text-[#1F1B4D]"
                            title={`Remove ${topic}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Required Pack (Admin Only) */}
            {isAdmin && availablePacks.length > 0 && (
              <div>
                <label htmlFor="requiredPack" className={fieldLabel}>
                  Required pack <span className="font-medium text-[#77738F]">(optional)</span>
                </label>
                <select
                  id="requiredPack"
                  name="requiredPack"
                  value={activity.requiredPack}
                  onChange={handleChange}
                  className={fieldInput}
                >
                  <option value="">No pack required</option>
                  {availablePacks
                    .filter((p) => p.is_active)
                    .map((pack) => (
                      <option key={pack.pack_id} value={pack.pack_id}>
                        {pack.icon} {pack.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Collapsible: writing */}
            <div className="space-y-2">
              <button
                type="button"
                className={sectionToggle}
                aria-expanded={writingOpen}
                onClick={() => setWritingOpen((v) => !v)}
              >
                <span className="min-w-0">
                  <span className="block text-[12px] font-extrabold text-[#1F1B4D]">
                    Introduction &amp; activity text
                  </span>
                  <span className="block text-[11px] text-[#77738F]">
                    {writingFilled ? 'Content added' : 'Optional rich text — expand to edit'}
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-[#77738F] transition-transform ${writingOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {writingOpen && (
                <div className="space-y-3 rounded-lg border border-[#E2E0EF] bg-white p-3">
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={activity.descriptionHeading || 'Introduction/Context'}
                        onChange={(e) =>
                          setActivity((prev) => ({ ...prev, descriptionHeading: e.target.value }))
                        }
                        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[12px] font-bold text-[#1F1B4D] outline-none focus:ring-0"
                        placeholder="Introduction/Context"
                      />
                      <Edit3 className="h-3.5 w-3.5 shrink-0 text-[#77738F]" />
                    </div>
                    <RichTextEditor
                      value={activity.description}
                      onChange={(value) => setActivity((prev) => ({ ...prev, description: value }))}
                      placeholder="Enter introduction/context..."
                      minHeight="100px"
                    />
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={activity.activityHeading || 'Activity'}
                        onChange={(e) =>
                          setActivity((prev) => ({ ...prev, activityHeading: e.target.value }))
                        }
                        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[12px] font-bold text-[#1F1B4D] outline-none focus:ring-0"
                        placeholder="Activity"
                      />
                      <Edit3 className="h-3.5 w-3.5 shrink-0 text-[#77738F]" />
                    </div>
                    <RichTextEditor
                      value={activity.activityText}
                      onChange={(value) => setActivity((prev) => ({ ...prev, activityText: value }))}
                      placeholder="Enter activity instructions..."
                      minHeight="100px"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Collapsible: media & links */}
            <div className="space-y-2">
              <button
                type="button"
                className={sectionToggle}
                aria-expanded={mediaOpen}
                onClick={() => setMediaOpen((v) => !v)}
              >
                <span className="min-w-0">
                  <span className="block text-[12px] font-extrabold text-[#1F1B4D]">
                    Image &amp; resource links
                  </span>
                  <span className="block text-[11px] text-[#77738F]">
                    {mediaFilled ? 'Media or links added' : 'Optional image and resource URLs'}
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-[#77738F] transition-transform ${mediaOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {mediaOpen && (
                <div className="space-y-3 rounded-lg border border-[#E2E0EF] bg-white p-3">
                  <div>
                    <label className={fieldLabel}>Activity image</label>
                    <div className="flex items-start gap-3">
                      {activity.imageLink ? (
                        <div className="relative shrink-0">
                          <img
                            src={activity.imageLink}
                            alt="Activity"
                            className="h-16 w-16 rounded-lg border border-[#E2E0EF] object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setActivity((prev) => ({ ...prev, imageLink: '' }))}
                            className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-[#E2E0EF] bg-[#F4F3FA]">
                          <Image className="h-5 w-5 text-[#77738F]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#4338E8] px-2.5 text-[11px] font-bold text-white hover:bg-[#3529d1]"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            Upload
                          </button>
                          <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </div>
                        <input
                          type="url"
                          name="imageLink"
                          value={activity.imageLink}
                          onChange={handleChange}
                          placeholder="Or paste image URL"
                          className={fieldInput}
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className={fieldLabel}>Resources</p>
                    {resourceLinks
                      .filter((link) => link.enabled)
                      .map((linkConfig) => {
                        const IconComponent = getIconComponentForResourceLink(linkConfig.iconName);
                        return (
                          <div key={linkConfig.key} className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4 shrink-0 text-[#77738F]" />
                            <input
                              type="text"
                              name={linkConfig.key}
                              value={activity[linkConfig.key as keyof typeof activity] as string}
                              onChange={handleChange}
                              className={fieldInput}
                              placeholder={linkConfig.label}
                              dir="ltr"
                            />
                          </div>
                        );
                      })}
                    <div>
                      <div className="mb-1 flex items-center gap-1.5">
                        <LinkIcon className="h-3.5 w-3.5 shrink-0 text-[#77738F]" />
                        <input
                          type="text"
                          value={activity.linkHeading || 'Additional Link'}
                          onChange={(e) =>
                            setActivity((prev) => ({ ...prev, linkHeading: e.target.value }))
                          }
                          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[11px] font-bold text-[#1F1B4D] outline-none focus:ring-0"
                          placeholder="Additional Link"
                        />
                        <Edit3 className="h-3 w-3 shrink-0 text-[#77738F]" />
                      </div>
                      <input
                        type="text"
                        name="link"
                        value={activity.link}
                        onChange={handleChange}
                        className={fieldInput}
                        placeholder="Link URL"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Sticky footer */}
        <div className="flex shrink-0 justify-end gap-2 border-t border-[#E2E0EF] bg-white px-3.5 py-2.5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-xl border border-[#E2E0EF] bg-white px-3.5 text-[12px] font-bold text-[#77738F] hover:border-[#bcb7f4] hover:text-[#1F1B4D]"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#4338E8] px-3.5 text-[12px] font-extrabold text-white hover:bg-[#3529d1]"
          >
            <Save className="h-3.5 w-3.5" />
            Create activity
          </button>
        </div>
      </div>

      {/* Objectives Browser Modal */}
      {showObjectivesBrowser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" onClick={() => setShowObjectivesBrowser(false)} />
          <div className="relative z-10 max-h-[min(90vh,40rem)] w-full max-w-2xl overflow-hidden rounded-2xl border border-[#E2E0EF] bg-white shadow-2xl">
            <NestedStandardsBrowser
              isOpen={showObjectivesBrowser}
              onClose={() => setShowObjectivesBrowser(false)}
              selectedObjectives={activity.custom_objective_ids}
              onAddObjective={handleAddObjective}
              onRemoveObjective={handleRemoveObjective}
            />
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}