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
  ChevronDown,
  Undo2,
  Redo2
} from 'lucide-react';

const DURATION_CHIPS = [5, 10, 15, 25] as const;
import { useSettings, ResourceLinkConfig } from '../contexts/SettingsContextNew';
import { RichTextEditor } from './RichTextEditor';
import { SimpleNestedCategoryDropdown } from './SimpleNestedCategoryDropdown';
import { NestedStandardsBrowser } from './NestedStandardsBrowser';
import { CompactActivityResources } from './CompactActivityResources';
import { activityPacksApi, ActivityPack } from '../config/api';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../contexts/DataContext';
import {
  findSectionIdForYearGroup,
  getDefaultSectionIdForYearGroup,
  resolveYearGroupFromToken,
} from '../utils/yearGroupSectionOrder';

/** Display buckets for the compact year-group picker (KS3+KS4 combined). */
const YEAR_GROUP_DISPLAY_BUCKETS: { id: string; label: string; sectionIds: string[] }[] = [
  { id: 'eyfs', label: 'EYFS', sectionIds: ['eyfs'] },
  { id: 'ks1', label: 'KS1', sectionIds: ['ks1'] },
  { id: 'ks2', label: 'KS2', sectionIds: ['ks2'] },
  { id: 'ks34', label: 'KS3/4', sectionIds: ['ks3', 'ks4'] },
  { id: 'ks5', label: 'KS5', sectionIds: ['ks5'] },
  { id: 'other', label: 'Other', sectionIds: ['other'] },
];

interface ActivityCreatorProps {
  onClose: () => void;
  onSave: (activity: any) => void;
  categories: string[];
  levels: string[];
}

export function ActivityCreator({ onClose, onSave, categories, levels }: ActivityCreatorProps) {
  const { categories: allCategories, customYearGroups, resourceLinks, yearGroupSections } =
    useSettings();
  const { currentSheetInfo } = useData();
  const { user } = useAuth();
  const [topicInput, setTopicInput] = useState('');

  const currentClassGroup = React.useMemo(() => {
    const sheet = currentSheetInfo?.sheet;
    const display = currentSheetInfo?.display;
    return (
      resolveYearGroupFromToken(customYearGroups, sheet || '') ||
      resolveYearGroupFromToken(customYearGroups, display || '') ||
      customYearGroups.find(
        (g) =>
          g.id === sheet ||
          g.name === display ||
          g.name === sheet ||
          g.id === display,
      ) ||
      null
    );
  }, [customYearGroups, currentSheetInfo?.sheet, currentSheetInfo?.display]);

  const [activity, setActivity] = useState(() => ({
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
    // Pre-select the class currently open in the Activity Library / header.
    yearGroups: currentClassGroup?.name ? [currentClassGroup.name] : ([] as string[]),
    curriculum_type: 'EYFS' as 'EYFS' | 'CUSTOM', // New field for curriculum type
    custom_objective_year_group_id: '', // New field for custom objectives year group
    custom_objective_ids: [] as string[], // New field for selected custom objectives
    unitName: '',
    lessonNumber: '',
    teachingUnit: '',
    requiredPack: '' // New field for pack requirement
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showObjectivesBrowser, setShowObjectivesBrowser] = useState(false);
  const [availablePacks, setAvailablePacks] = useState<ActivityPack[]>([]);
  const isAdmin = user?.email === 'rob.reichstorer@gmail.com';
  const [formUndoStack, setFormUndoStack] = useState<Array<typeof activity>>([]);
  const [formRedoStack, setFormRedoStack] = useState<Array<typeof activity>>([]);
  const applyingFormHistoryRef = useRef(false);
  const prevActivityRef = useRef(activity);
  /** Longer rich-text stays collapsed so the essentials fit on a laptop. */
  const [writingOpen, setWritingOpen] = useState(false);
  /** Year-group picker: current stage only until Show all. */
  const [showAllYearGroups, setShowAllYearGroups] = useState(false);
  const didPreselectYearGroup = useRef(Boolean(currentClassGroup?.name));

  // If year groups load after mount, pre-select the current class once.
  useEffect(() => {
    if (didPreselectYearGroup.current || !currentClassGroup?.name) return;
    didPreselectYearGroup.current = true;
    setActivity((prev) => {
      if (prev.yearGroups.length > 0) return prev;
      return { ...prev, yearGroups: [currentClassGroup.name] };
    });
  }, [currentClassGroup]);

  const resolveGroupSectionId = React.useCallback(
    (group: { id: string; name: string }) => {
      // Prefer an explicit Settings key-stage assignment; if the class still
      // sits in "Other" (or is unassigned), fall back to name-based staging so
      // the picker groups EYFS / KS1 / KS2 / KS3/4 usefully.
      const fromSettings = findSectionIdForYearGroup(
        yearGroupSections,
        group.id,
        customYearGroups,
      );
      if (fromSettings && fromSettings !== 'other') return fromSettings;
      return getDefaultSectionIdForYearGroup(group.id, group.name);
    },
    [yearGroupSections, customYearGroups],
  );

  const currentStageBucketId = React.useMemo(() => {
    if (!currentClassGroup) return 'other';
    const sectionId = resolveGroupSectionId(currentClassGroup);
    const bucket = YEAR_GROUP_DISPLAY_BUCKETS.find((b) => b.sectionIds.includes(sectionId));
    return bucket?.id || 'other';
  }, [currentClassGroup, resolveGroupSectionId]);

  const yearGroupBuckets = React.useMemo(() => {
    const grouped = YEAR_GROUP_DISPLAY_BUCKETS.map((bucket) => ({
      ...bucket,
      groups: customYearGroups.filter((g) =>
        bucket.sectionIds.includes(resolveGroupSectionId(g)),
      ),
    })).filter((b) => b.groups.length > 0);

    if (!showAllYearGroups) {
      const focused = grouped.filter((b) => b.id === currentStageBucketId);
      return focused.length > 0 ? focused : grouped.slice(0, 1);
    }
    return grouped;
  }, [customYearGroups, resolveGroupSectionId, showAllYearGroups, currentStageBucketId]);

  const hiddenYearGroupCount = React.useMemo(() => {
    if (showAllYearGroups) return 0;
    const visible = new Set(yearGroupBuckets.flatMap((b) => b.groups.map((g) => g.id)));
    return customYearGroups.filter((g) => !visible.has(g.id)).length;
  }, [showAllYearGroups, yearGroupBuckets, customYearGroups]);

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

  const setResourceValue = (key: string, value: string) => {
    setActivity((prev) => ({ ...prev, [key]: value }));
  };

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

            {/* Category + Duration — duration chips stay on one row */}
            <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
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

              <div className="sm:shrink-0">
                <label className={fieldLabel}>Duration</label>
                <div className="flex flex-nowrap items-center gap-1">
                  <div className="inline-flex h-8 shrink-0 items-center overflow-hidden rounded-lg border border-[#E2E0EF] bg-white focus-within:border-[#4338E8] focus-within:ring-2 focus-within:ring-[#4338E8]/20">
                    <input
                      type="number"
                      name="time"
                      value={activity.time}
                      onChange={handleTimeChange}
                      min={0}
                      className="h-full w-9 border-0 bg-transparent px-1.5 text-[13px] tabular-nums text-[#1F1B4D] focus:outline-none focus:ring-0"
                      placeholder="0"
                      dir="ltr"
                      aria-label="Duration in minutes"
                    />
                    <span className="border-l border-[#E2E0EF] px-1.5 text-[10px] font-semibold text-[#77738F]">
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
                        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold tabular-nums transition-colors ${
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

            {/* Year groups — stage-grouped pills; current stage first */}
            <div>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <label className="text-[11px] font-bold tracking-wide text-[#1F1B4D]">
                  Year groups <span className="text-red-500">*</span>
                  {currentClassGroup?.name && (
                    <span className="ml-1.5 font-medium text-[#77738F]">
                      · {currentClassGroup.name}
                    </span>
                  )}
                </label>
                {hiddenYearGroupCount > 0 || showAllYearGroups ? (
                  <button
                    type="button"
                    onClick={() => setShowAllYearGroups((v) => !v)}
                    className="text-[11px] font-bold text-[#4338E8] hover:underline"
                  >
                    {showAllYearGroups
                      ? 'Show current stage'
                      : `Show all (${hiddenYearGroupCount} more)`}
                  </button>
                ) : null}
              </div>
              <div className="space-y-2">
                {yearGroupBuckets.map((bucket) => (
                  <div key={bucket.id}>
                    <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-[#77738F]">
                      {bucket.label}
                      {!showAllYearGroups && currentClassGroup ? ' · current stage' : ''}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {bucket.groups.map((group) => {
                        const selected = activity.yearGroups.includes(group.name);
                        const color = group.color || '#4338E8';
                        const isCurrent = currentClassGroup?.id === group.id;
                        return (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => handleYearGroupChange(group.name, !selected)}
                            aria-pressed={selected}
                            className="inline-flex max-w-full items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold transition-colors"
                            style={{
                              borderColor: selected ? color : isCurrent ? color : '#E2E0EF',
                              backgroundColor: selected ? `${color}22` : '#fff',
                              color: selected || isCurrent ? '#1F1B4D' : '#77738F',
                              boxShadow: isCurrent && !selected ? `inset 0 0 0 1px ${color}55` : undefined,
                            }}
                            title={group.name}
                          >
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: color }}
                              aria-hidden
                            />
                            <span className="truncate">{group.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
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

            {/* Resources — compact chips; empty types stay hidden */}
            <CompactActivityResources
              values={{
                videoLink: activity.videoLink,
                musicLink: activity.musicLink,
                backingLink: activity.backingLink,
                resourceLink: activity.resourceLink,
                vocalsLink: activity.vocalsLink,
                canvaLink: activity.canvaLink,
                imageLink: activity.imageLink,
                link: activity.link,
              }}
              onChange={setResourceValue}
              resourceLinks={resourceLinks}
              linkHeading={activity.linkHeading || 'Additional Link'}
              onLinkHeadingChange={(value) =>
                setActivity((prev) => ({ ...prev, linkHeading: value }))
              }
              onImageFile={(file) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const imageUrl = event.target?.result as string;
                  setActivity((prev) => ({ ...prev, imageLink: imageUrl }));
                };
                reader.readAsDataURL(file);
              }}
            />
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