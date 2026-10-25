import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  FileText,
  FolderOpen,
  Image,
  Link as LinkIcon,
  Minus,
  Music,
  Palette,
  Plus,
  Sparkles,
  Video,
  Volume2,
  X,
} from 'lucide-react';
import { sanitizeHtml } from '../utils/sanitize';
import { useSettings } from '../contexts/SettingsContextNew';
import { useData } from '../contexts/DataContext';
import type { Activity } from '../contexts/DataContext';
import { RichTextEditor } from './RichTextEditor';
import { SimpleNestedCategoryDropdown } from './SimpleNestedCategoryDropdown';
import { NestedStandardsBrowser } from './NestedStandardsBrowser';
import { ActivityCard } from './ActivityCard';
import {
  findSectionIdForYearGroup,
  getDefaultSectionIdForYearGroup,
  resolveYearGroupFromToken,
} from '../utils/yearGroupSectionOrder';
import { customObjectivesApi } from '../config/customObjectivesApi';
import type { CustomObjective, CustomObjectiveArea } from '../types/customObjectives';

const DURATION_CHIPS = [5, 10, 15, 25] as const;

const YEAR_GROUP_DISPLAY_BUCKETS: { id: string; label: string; sectionIds: string[] }[] = [
  { id: 'eyfs', label: 'EYFS', sectionIds: ['eyfs'] },
  { id: 'ks1', label: 'KS1', sectionIds: ['ks1'] },
  { id: 'ks2', label: 'KS2', sectionIds: ['ks2'] },
  { id: 'ks34', label: 'KS3/4', sectionIds: ['ks3', 'ks4'] },
  { id: 'ks5', label: 'KS5', sectionIds: ['ks5'] },
  { id: 'other', label: 'Other', sectionIds: ['other'] },
];

const RESOURCE_VISUALS: Record<
  string,
  { label: string; gradient: string; icon: React.ComponentType<{ className?: string }> }
> = {
  videoLink: { label: 'Video', gradient: 'linear-gradient(135deg,#f97316,#fb7185)', icon: Video },
  musicLink: { label: 'Music', gradient: 'linear-gradient(135deg,#10b981,#0ea5e9)', icon: Music },
  backingLink: {
    label: 'Backing track',
    gradient: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
    icon: Volume2,
  },
  resourceLink: {
    label: 'Resource',
    gradient: 'linear-gradient(135deg,#a855f7,#6366f1)',
    icon: FileText,
  },
  vocalsLink: {
    label: 'Vocals',
    gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)',
    icon: Volume2,
  },
  canvaLink: {
    label: 'Canva',
    gradient: 'linear-gradient(135deg,#06b6d4,#8b5cf6)',
    icon: Palette,
  },
  imageLink: {
    label: 'Image',
    gradient: 'linear-gradient(135deg,#ec4899,#f97316)',
    icon: Image,
  },
  link: {
    label: 'Link',
    gradient: 'linear-gradient(135deg,#64748b,#94a3b8)',
    icon: LinkIcon,
  },
};

type EditorActivity = {
  activity: string;
  description: string;
  activityText: string;
  descriptionHeading: string;
  activityHeading: string;
  linkHeading: string;
  time: number;
  videoLink: string;
  musicLink: string;
  backingLink: string;
  resourceLink: string;
  link: string;
  vocalsLink: string;
  imageLink: string;
  canvaLink: string;
  category: string;
  level: string;
  yearGroups: string[];
  curriculum_type: 'EYFS' | 'CUSTOM';
  custom_objective_year_group_id: string;
  custom_objective_ids: string[];
  unitName: string;
  lessonNumber: string;
  teachingUnit: string;
  requiredPack: string;
  _id?: string;
  id?: string;
};

function emptyActivity(preselectYearGroup?: string | null): EditorActivity {
  return {
    activity: '',
    description: '',
    activityText: '',
    descriptionHeading: 'Introduction/Context',
    activityHeading: 'Activity',
    linkHeading: 'Additional Link',
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
    yearGroups: preselectYearGroup ? [preselectYearGroup] : [],
    curriculum_type: 'EYFS',
    custom_objective_year_group_id: '',
    custom_objective_ids: [],
    unitName: '',
    lessonNumber: '',
    teachingUnit: '',
    requiredPack: '',
  };
}

function fromActivity(a: Activity, preselectFallback?: string | null): EditorActivity {
  const yearGroups =
    Array.isArray(a.yearGroups) && a.yearGroups.length > 0
      ? a.yearGroups
      : a.level
        ? [a.level]
        : preselectFallback
          ? [preselectFallback]
          : [];
  return {
    activity: a.activity || '',
    description: a.description || '',
    activityText: a.activityText || '',
    descriptionHeading: (a as { descriptionHeading?: string }).descriptionHeading || 'Introduction/Context',
    activityHeading: (a as { activityHeading?: string }).activityHeading || 'Activity',
    linkHeading: (a as { linkHeading?: string }).linkHeading || 'Additional Link',
    time: a.time || 0,
    videoLink: a.videoLink || '',
    musicLink: a.musicLink || '',
    backingLink: a.backingLink || '',
    resourceLink: a.resourceLink || '',
    link: a.link || '',
    vocalsLink: a.vocalsLink || '',
    imageLink: a.imageLink || '',
    canvaLink: a.canvaLink || '',
    category: a.category || '',
    level: a.level || '',
    yearGroups,
    curriculum_type: ((a as { curriculum_type?: string }).curriculum_type as 'EYFS' | 'CUSTOM') || 'EYFS',
    custom_objective_year_group_id:
      (a as { custom_objective_year_group_id?: string }).custom_objective_year_group_id || '',
    custom_objective_ids:
      (a as { custom_objective_ids?: string[] }).custom_objective_ids ||
      a.customObjectives ||
      [],
    unitName: a.unitName || '',
    lessonNumber: a.lessonNumber || '',
    teachingUnit: a.teachingUnit || '',
    requiredPack: (a as { requiredPack?: string }).requiredPack || '',
    _id: a._id,
    id: a.id,
  };
}

function resourceDisplayName(url: string, fallback: string): string {
  if (!url) return fallback;
  try {
    const u = new URL(url);
    const last = u.pathname.split('/').filter(Boolean).pop();
    if (last && last.includes('.')) return decodeURIComponent(last);
    if (u.hostname.includes('youtu')) return 'YouTube video';
    if (u.hostname.includes('canva')) return 'Canva design';
    return decodeURIComponent(last || u.hostname);
  } catch {
    return url.length > 40 ? `${url.slice(0, 37)}…` : url;
  }
}

function resourceMeta(key: string, url: string): string {
  if (!url) return '';
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (key === 'videoLink') return host.includes('youtu') ? 'YouTube' : host;
    if (key === 'musicLink' || key === 'backingLink' || key === 'vocalsLink') return `Audio · ${host}`;
    if (key === 'canvaLink') return 'Canva design';
    if (key === 'imageLink') return 'Image';
    return host;
  } catch {
    return 'Link';
  }
}

export interface ActivityEditorPageProps {
  mode: 'create' | 'edit';
  initialActivity?: Activity | null;
  onSave: (activity: Activity) => void | Promise<void>;
  onCancel: () => void;
  /** Optional draft-only save (does not close). */
  onSaveDraft?: (activity: Activity) => void | Promise<void>;
}

export function ActivityEditorPage({
  mode,
  initialActivity = null,
  onSave,
  onCancel,
  onSaveDraft,
}: ActivityEditorPageProps) {
  const { customYearGroups, resourceLinks, yearGroupSections, getCategoryColor } = useSettings();
  const { currentSheetInfo } = useData();

  const currentClassGroup = useMemo(() => {
    const sheet = currentSheetInfo?.sheet;
    const display = currentSheetInfo?.display;
    return (
      resolveYearGroupFromToken(customYearGroups, sheet || '') ||
      resolveYearGroupFromToken(customYearGroups, display || '') ||
      customYearGroups.find(
        (g) => g.id === sheet || g.name === display || g.name === sheet || g.id === display,
      ) ||
      null
    );
  }, [customYearGroups, currentSheetInfo?.sheet, currentSheetInfo?.display]);

  const [form, setForm] = useState<EditorActivity>(() =>
    mode === 'edit' && initialActivity
      ? fromActivity(initialActivity, currentClassGroup?.name)
      : emptyActivity(currentClassGroup?.name),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [textTab, setTextTab] = useState<'introduction' | 'activity'>('introduction');
  const [topicInput, setTopicInput] = useState('');
  const [showAllYearGroups, setShowAllYearGroups] = useState(false);
  const [showObjectivesBrowser, setShowObjectivesBrowser] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [editingResourceKey, setEditingResourceKey] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved'>('saved');
  const [objectiveMeta, setObjectiveMeta] = useState<{
    objectives: CustomObjective[];
    areas: CustomObjectiveArea[];
  }>({ objectives: [], areas: [] });
  const addMenuRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const draftTimer = useRef<number | null>(null);
  const draftSkipFirst = useRef(true);
  const didPreselect = useRef(Boolean(form.yearGroups.length));

  useEffect(() => {
    if (didPreselect.current || !currentClassGroup?.name) return;
    didPreselect.current = true;
    setForm((prev) =>
      prev.yearGroups.length > 0 ? prev : { ...prev, yearGroups: [currentClassGroup.name] },
    );
  }, [currentClassGroup]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [objectives, areas] = await Promise.all([
          customObjectivesApi.objectives.getAll(),
          customObjectivesApi.areas.getAll(),
        ]);
        if (!cancelled) setObjectiveMeta({ objectives, areas });
      } catch {
        /* optional enrichment */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!addMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [addMenuOpen]);

  // Autosave draft indicator — skip the mount tick so we don't flash "Saving…"
  useEffect(() => {
    if (draftSkipFirst.current) {
      draftSkipFirst.current = false;
      try {
        sessionStorage.setItem(
          `ccd-activity-draft-${mode}-${form.id || form._id || 'new'}`,
          JSON.stringify(form),
        );
      } catch {
        /* ignore */
      }
      setDraftStatus('saved');
      return;
    }
    if (draftTimer.current) window.clearTimeout(draftTimer.current);
    setDraftStatus('saving');
    draftTimer.current = window.setTimeout(() => {
      try {
        sessionStorage.setItem(
          `ccd-activity-draft-${mode}-${form.id || form._id || 'new'}`,
          JSON.stringify(form),
        );
      } catch {
        /* ignore */
      }
      setDraftStatus('saved');
      if (onSaveDraft) void onSaveDraft(form as unknown as Activity);
    }, 650);
    return () => {
      if (draftTimer.current) window.clearTimeout(draftTimer.current);
    };
  }, [form, mode, onSaveDraft]);

  const resolveGroupSectionId = useCallback(
    (group: { id: string; name: string }) => {
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

  const currentStageBucketId = useMemo(() => {
    if (!currentClassGroup) return 'other';
    const sectionId = resolveGroupSectionId(currentClassGroup);
    return (
      YEAR_GROUP_DISPLAY_BUCKETS.find((b) => b.sectionIds.includes(sectionId))?.id || 'other'
    );
  }, [currentClassGroup, resolveGroupSectionId]);

  const yearGroupBuckets = useMemo(() => {
    const grouped = YEAR_GROUP_DISPLAY_BUCKETS.map((bucket) => {
      const groups = customYearGroups.filter((g) =>
        bucket.sectionIds.includes(resolveGroupSectionId(g)),
      );
      // Current class first within its stage so the selected pill wraps near the top.
      if (currentClassGroup && bucket.sectionIds.includes(resolveGroupSectionId(currentClassGroup))) {
        groups.sort((a, b) => {
          if (a.id === currentClassGroup.id || a.name === currentClassGroup.name) return -1;
          if (b.id === currentClassGroup.id || b.name === currentClassGroup.name) return 1;
          return a.name.localeCompare(b.name);
        });
      }
      return { ...bucket, groups };
    }).filter((b) => b.groups.length > 0);

    if (!showAllYearGroups) {
      const focused = grouped.filter((b) => b.id === currentStageBucketId);
      return focused.length > 0 ? focused : grouped.slice(0, 1);
    }
    // Current stage first, then the rest.
    const current = grouped.filter((b) => b.id === currentStageBucketId);
    const rest = grouped.filter((b) => b.id !== currentStageBucketId);
    return [...current, ...rest];
  }, [
    customYearGroups,
    resolveGroupSectionId,
    showAllYearGroups,
    currentStageBucketId,
    currentClassGroup,
  ]);

  const hiddenYearGroupCount = useMemo(() => {
    if (showAllYearGroups) return 0;
    const visible = new Set(yearGroupBuckets.flatMap((b) => b.groups.map((g) => g.id)));
    return customYearGroups.filter((g) => !visible.has(g.id)).length;
  }, [showAllYearGroups, yearGroupBuckets, customYearGroups]);

  const parseTopics = (value: string): string[] =>
    value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

  const addTopic = () => {
    const topic = topicInput.trim();
    if (!topic) return;
    setForm((prev) => {
      const existing = parseTopics(prev.unitName);
      if (existing.some((t) => t.toLowerCase() === topic.toLowerCase())) return prev;
      return { ...prev, unitName: [...existing, topic].join(', ') };
    });
    setTopicInput('');
  };

  const removeTopic = (topicToRemove: string) => {
    setForm((prev) => ({
      ...prev,
      unitName: parseTopics(prev.unitName)
        .filter((t) => t.toLowerCase() !== topicToRemove.toLowerCase())
        .join(', '),
    }));
  };

  const setResource = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resourceOptions = useMemo(() => {
    const fromSettings = resourceLinks
      .filter((l) => l.enabled)
      .map((l) => ({
        key: l.key,
        label: RESOURCE_VISUALS[l.key]?.label || l.label.replace(/\s*URL\s*$/i, ''),
      }));
    const extras = [
      { key: 'imageLink', label: 'Image' },
      { key: 'link', label: 'Link' },
    ];
    const keys = new Set(fromSettings.map((o) => o.key));
    return [...fromSettings, ...extras.filter((e) => !keys.has(e.key))];
  }, [resourceLinks]);

  const attachedResources = useMemo(
    () =>
      resourceOptions.filter((o) => Boolean((form[o.key as keyof EditorActivity] as string)?.trim())),
    [resourceOptions, form],
  );

  const availableToAdd = resourceOptions.filter(
    (o) =>
      !attachedResources.some((a) => a.key === o.key) &&
      editingResourceKey !== o.key,
  );

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.activity.trim()) next.activity = 'Activity name is required';
    if (!form.category) next.category = 'Category is required';
    if (form.yearGroups.length === 0) next.yearGroups = 'At least one year group is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = (): Activity => {
    const sanitizeText = (value: string) =>
      (value || '')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/\u00A0/g, ' ')
        .replace(/\r\n/g, '\n');

    return {
      ...(initialActivity || {}),
      ...form,
      activity: sanitizeText(form.activity).trim(),
      description: sanitizeHtml(sanitizeText(form.description)),
      activityText: sanitizeHtml(sanitizeText(form.activityText)),
      category: sanitizeText(form.category).trim(),
      unitName: sanitizeText(form.unitName).trim(),
      lessonNumber: sanitizeText(form.lessonNumber).trim(),
      teachingUnit: sanitizeText(form.teachingUnit || form.category).trim(),
      level: form.yearGroups[0] || 'All',
      customObjectives: form.custom_objective_ids,
    } as Activity;
  };

  const handleCreateOrSave = async () => {
    if (!validate()) return;
    await onSave(buildPayload());
  };

  const handleDraftClick = async () => {
    setDraftStatus('saving');
    const payload = buildPayload();
    if (onSaveDraft) await onSaveDraft(payload);
    try {
      sessionStorage.setItem(
        `ccd-activity-draft-${mode}-${form.id || form._id || 'new'}`,
        JSON.stringify(form),
      );
    } catch {
      /* ignore */
    }
    setDraftStatus('saved');
  };

  const previewActivity = useMemo(() => {
    return {
      ...(initialActivity || {}),
      ...form,
      activity: form.activity || 'Untitled activity',
      level: form.yearGroups[0] || form.level || 'All',
    } as Activity;
  }, [form, initialActivity]);

  const categoryColor = getCategoryColor(form.category) || '#4338E8';
  const stageLabel =
    YEAR_GROUP_DISPLAY_BUCKETS.find((b) => b.id === currentStageBucketId)?.label || 'EYFS';

  const selectedObjectiveCards = useMemo(() => {
    return form.custom_objective_ids
      .map((id) => {
        const obj = objectiveMeta.objectives.find((o) => o.id === id);
        if (!obj) return { id, code: 'OBJ', text: id };
        const area = objectiveMeta.areas.find((a) => a.id === obj.area_id);
        return {
          id,
          code: (obj.objective_code || area?.name || 'OBJ').slice(0, 8).toUpperCase(),
          text: obj.objective_text || obj.description || id,
        };
      })
      .slice(0, 4);
  }, [form.custom_objective_ids, objectiveMeta]);

  const fieldLab = 'mb-1.5 flex items-center gap-1.5 text-[13px] font-bold text-[#3b3960]';

  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#F4F3FA]"
      style={{
        fontFamily: "var(--ss-font-ui, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)",
      }}
    >
      {/* Top bar — page header when library chrome is hidden */}
      <header className="z-10 flex shrink-0 flex-wrap items-center gap-2 border-b border-[#E2E0EF] bg-white px-4 py-2.5 sm:px-5">
        <div className="inline-flex max-w-[min(100%,16rem)] items-center gap-1.5 truncate rounded-lg border border-[#E2E0EF] bg-[#F4F3FA] px-2.5 py-1.5 text-[13px] font-bold text-[#1F1B4D]">
          <span className="rounded-md bg-[#E9E6FF] px-1.5 py-0.5 text-[13px] font-extrabold uppercase tracking-wide text-[#4338E8]">
            {stageLabel}
          </span>
          <span className="truncate">{currentSheetInfo?.display || 'Class'}</span>
        </div>
        <div className="text-[13px] font-semibold text-[#77738F]">
          Activity library /{' '}
          <strong className="text-[#1F1B4D]">
            {mode === 'create' ? 'New activity' : 'Edit activity'}
          </strong>
        </div>
        <div className="grow" />
        <div
          className={`inline-flex min-w-[6.5rem] items-center gap-1 text-[13px] font-semibold ${
            draftStatus === 'saved' ? 'text-[#16a34a]' : 'text-[#77738F]'
          }`}
          aria-live="polite"
        >
          {draftStatus === 'saved' ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : null}
          {draftStatus === 'saving' ? 'Saving…' : 'Draft saved'}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-9 items-center rounded-xl px-3 text-[13px] font-bold text-[#77738F] hover:bg-[#F4F3FA] hover:text-[#1F1B4D]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleDraftClick()}
          className="inline-flex h-9 items-center rounded-xl border border-[#E2E0EF] bg-white px-3 text-[13px] font-bold text-[#1F1B4D] hover:border-[#bcb7f4]"
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={() => void handleCreateOrSave()}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#4338E8] px-3.5 text-[13px] font-extrabold text-white shadow-[0_3px_10px_rgba(79,70,229,0.25)] hover:bg-[#3529d1]"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          {mode === 'create' ? 'Create activity' : 'Save changes'}
        </button>
      </header>

      {/* Two-column body: left scrolls; right column sticky with Details scrolling alone */}
      <div className="mx-auto grid min-h-0 w-full max-w-none flex-1 grid-cols-1 gap-5 overflow-y-auto p-4 min-[1101px]:grid-cols-[minmax(0,1fr)_384px] min-[1101px]:overflow-hidden min-[1101px]:p-5">
          {/* Left main card */}
          <div className="min-h-0 min-[1101px]:overflow-y-auto">
          <section className="flex flex-col gap-6 rounded-2xl border border-[#E2E0EF] bg-white p-6 shadow-[0_8px_30px_rgba(31,27,77,0.06)] sm:p-8">
            <div>
              <p className="mb-2 text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#77738F]">
                {mode === 'create' ? 'New activity' : 'Edit activity'}
              </p>
              <input
                type="text"
                value={form.activity}
                onChange={(e) => {
                  setForm((p) => ({ ...p, activity: e.target.value }));
                  if (errors.activity) setErrors((er) => ({ ...er, activity: '' }));
                }}
                placeholder="Untitled activity"
                className={`w-full border-0 bg-transparent p-0 text-[28px] font-extrabold tracking-tight text-[#1F1B4D] outline-none placeholder:text-[#c4c2da] focus:ring-0 sm:text-[30px] ${
                  errors.activity ? 'underline decoration-red-400' : ''
                }`}
                style={{ letterSpacing: '-0.7px' }}
                dir="ltr"
              />
              <p className="mt-1.5 text-[13px] font-medium text-[#9a98b8]">
                Give it a name your class will recognise ·{' '}
                <b className="font-bold text-[#55537a]">Required</b>
              </p>
              {errors.activity && (
                <p className="mt-1 text-[13px] font-semibold text-red-500">{errors.activity}</p>
              )}
            </div>

            {/* Text tabs + editor */}
            <div>
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-[10px] bg-[#f1f0f7] p-[3px]">
                  <button
                    type="button"
                    onClick={() => setTextTab('introduction')}
                    className={`rounded-lg px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
                      textTab === 'introduction'
                        ? 'bg-white text-[#1F1B4D] shadow-sm'
                        : 'text-[#6b6990]'
                    }`}
                  >
                    Introduction
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextTab('activity')}
                    className={`rounded-lg px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
                      textTab === 'activity'
                        ? 'bg-white text-[#1F1B4D] shadow-sm'
                        : 'text-[#6b6990]'
                    }`}
                  >
                    Activity text
                  </button>
                </div>
                <div className="grow" />
                <button
                  type="button"
                  className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-[#E2E0EF] bg-[#F4F3FA] px-3 text-[13px] font-bold text-[#4338E8]"
                  title="Coming soon"
                  disabled
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Help me write
                </button>
              </div>
              {textTab === 'introduction' ? (
                <RichTextEditor
                  value={form.description}
                  onChange={(value) => setForm((p) => ({ ...p, description: value }))}
                  placeholder="Enter introduction / context…"
                  minHeight="220px"
                />
              ) : (
                <RichTextEditor
                  value={form.activityText}
                  onChange={(value) => setForm((p) => ({ ...p, activityText: value }))}
                  placeholder="Enter activity instructions…"
                  minHeight="220px"
                />
              )}
            </div>

            {/* Resources */}
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h4 className="text-[15px] font-extrabold tracking-tight text-[#1F1B4D]">
                  Resources
                </h4>
                {attachedResources.length > 0 && (
                  <span className="text-[13px] font-semibold text-[#9a98b8]">
                    {attachedResources.length} attached
                  </span>
                )}
                <div className="grow" />
                <span className="text-[13px] font-semibold text-[#9a98b8]">
                  Drag files here or paste a link
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {attachedResources.map((res) => {
                  const visual = RESOURCE_VISUALS[res.key] || RESOURCE_VISUALS.link;
                  const Icon = visual.icon;
                  const url = (form[res.key as keyof EditorActivity] as string) || '';
                  const isImage = res.key === 'imageLink' && url;
                  return (
                    <div
                      key={res.key}
                      className="overflow-hidden rounded-[14px] border border-[#ecebf5] bg-white"
                    >
                      <div
                        className="relative flex h-[88px] items-center justify-center"
                        style={{
                          background: isImage ? undefined : visual.gradient,
                          backgroundImage: isImage ? `url(${url})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        <span className="absolute left-2 top-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[13px] font-extrabold uppercase tracking-wide text-[#1F1B4D]">
                          {visual.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => setResource(res.key, '')}
                          className="absolute right-2 top-2 rounded-full bg-white/90 p-0.5 text-[#77738F] hover:text-red-600"
                          title="Remove"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        {!isImage && (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#1F1B4D] shadow-md">
                            <Icon className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5 p-2.5">
                        <div className="truncate text-[12.5px] font-bold text-[#1F1B4D]">
                          {resourceDisplayName(url, visual.label)}
                        </div>
                        <div className="truncate text-[13px] font-medium text-[#9a98b8]">
                          {resourceMeta(res.key, url)}
                        </div>
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => setResource(res.key, e.target.value)}
                          className="h-7 w-full rounded-md border border-[#E2E0EF] px-2 text-[13px] text-[#1F1B4D] focus:border-[#4338E8] focus:outline-none"
                          placeholder={`${visual.label} URL`}
                          dir="ltr"
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Pending edit row when just added empty */}
                {editingResourceKey &&
                  !attachedResources.some((a) => a.key === editingResourceKey) && (
                    <div className="overflow-hidden rounded-[14px] border border-[#bcb7f4] bg-white">
                      <div
                        className="relative flex h-[88px] items-center justify-center"
                        style={{
                          background:
                            RESOURCE_VISUALS[editingResourceKey]?.gradient ||
                            RESOURCE_VISUALS.link.gradient,
                        }}
                      >
                        <span className="absolute left-2 top-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[13px] font-extrabold uppercase tracking-wide">
                          {RESOURCE_VISUALS[editingResourceKey]?.label || 'Resource'}
                        </span>
                      </div>
                      <div className="p-2.5">
                        <input
                          type="url"
                          autoFocus
                          value={(form[editingResourceKey as keyof EditorActivity] as string) || ''}
                          onChange={(e) => setResource(editingResourceKey, e.target.value)}
                          onBlur={() => {
                            const v = (form[editingResourceKey as keyof EditorActivity] as string) || '';
                            if (!v.trim()) setEditingResourceKey(null);
                          }}
                          className="h-8 w-full rounded-md border border-[#E2E0EF] px-2 text-[13px] focus:border-[#4338E8] focus:outline-none"
                          placeholder="Paste URL…"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  )}

                <div className="relative" ref={addMenuRef}>
                  <button
                    type="button"
                    onClick={() => setAddMenuOpen((v) => !v)}
                    className="flex h-full min-h-[160px] w-full flex-col items-center justify-center gap-2.5 rounded-[14px] border-2 border-dashed border-[#d6d9fb] bg-[#f8f8ff] text-[12.5px] font-bold text-[#4338E8] transition-colors hover:border-[#4338E8]"
                  >
                    <Plus className="h-5 w-5" strokeWidth={2.5} />
                    Add resource
                    <span className="flex gap-1.5 text-[#8b8fd8]">
                      <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-lg border border-[#e0e3fb] bg-white">
                        <Video className="h-3 w-3" />
                      </span>
                      <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-lg border border-[#e0e3fb] bg-white">
                        <Music className="h-3 w-3" />
                      </span>
                      <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-lg border border-[#e0e3fb] bg-white">
                        <Image className="h-3 w-3" />
                      </span>
                      <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-lg border border-[#e0e3fb] bg-white">
                        <LinkIcon className="h-3 w-3" />
                      </span>
                    </span>
                  </button>
                  {addMenuOpen && availableToAdd.length > 0 && (
                    <div className="absolute bottom-full left-0 z-20 mb-2 min-w-[12rem] overflow-hidden rounded-xl border border-[#E2E0EF] bg-white py-1 shadow-xl">
                      {availableToAdd.map((opt) => {
                        const Icon = RESOURCE_VISUALS[opt.key]?.icon || FileText;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-semibold text-[#1F1B4D] hover:bg-[#F4F3FA]"
                            onClick={() => {
                              setAddMenuOpen(false);
                              if (opt.key === 'imageLink') {
                                setEditingResourceKey('imageLink');
                                imageInputRef.current?.click();
                              } else {
                                setEditingResourceKey(opt.key);
                              }
                            }}
                          >
                            <Icon className="h-3.5 w-3.5 text-[#4338E8]" />
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setResource('imageLink', (ev.target?.result as string) || '');
                        setEditingResourceKey(null);
                      };
                      reader.readAsDataURL(file);
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
          </div>

          {/* Right column: sticky as a whole; preview stays visible; Details scrolls */}
          <aside className="flex min-h-0 flex-col gap-4 self-stretch max-[1100px]:max-h-none max-[1100px]:overflow-visible min-[1101px]:overflow-hidden">
            <div className="shrink-0 rounded-2xl border border-[#e4e2fb] bg-gradient-to-br from-[#eef2ff] to-[#faf5ff] p-4 shadow-[0_8px_30px_rgba(31,27,77,0.05)]">
              <div className="mb-2.5 flex items-center gap-1.5 text-[13px] font-extrabold uppercase tracking-[0.06em] text-[#6366f1]">
                Live preview
                <span className="ml-auto text-[13px] font-semibold normal-case tracking-normal text-[#9a98b8]">
                  How it appears in your library
                </span>
              </div>
              <div className="pointer-events-none">
                <ActivityCard
                  activity={previewActivity}
                  categoryColor={categoryColor}
                  viewMode="grid"
                  draggable={false}
                />
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto rounded-2xl border border-[#E2E0EF] bg-white p-5 shadow-[0_8px_30px_rgba(31,27,77,0.05)] max-[1100px]:overflow-visible">
              <h4 className="flex shrink-0 items-center text-[15px] font-extrabold text-[#1F1B4D]">
                Details
                <span className="ml-auto text-[11.5px] font-semibold text-[#9a98b8]">* required</span>
              </h4>

              <div>
                <div className={fieldLab}>
                  Category <span className="text-[#e11d48]">*</span>
                </div>
                <div
                  className={`overflow-hidden rounded-[10px] border bg-white ${
                    errors.category ? 'border-red-400' : 'border-[#e3e2ee]'
                  }`}
                >
                  <SimpleNestedCategoryDropdown
                    selectedCategory={form.category}
                    onCategoryChange={(category) => {
                      setForm((p) => ({ ...p, category }));
                      if (errors.category) setErrors((er) => ({ ...er, category: '' }));
                    }}
                    placeholder="Select a category"
                    className="h-10 w-full bg-white px-3 text-[13px] font-semibold"
                    dropdownBackgroundColor="#F4F3FA"
                    showAllCategories={true}
                  />
                </div>
                {errors.category && (
                  <p className="mt-1 text-[13px] text-red-500">{errors.category}</p>
                )}
              </div>

              <div>
                <div className={fieldLab}>
                  Duration
                  <span className="ml-auto text-[11.5px] font-semibold text-[#9a98b8]">minutes</span>
                </div>
                <div className="flex flex-nowrap items-center gap-2">
                  <div className="inline-flex h-10 w-[118px] shrink-0 overflow-hidden rounded-[10px] border border-[#e3e2ee]">
                    <button
                      type="button"
                      className="grid w-9 place-items-center bg-[#fbfbfe] text-[#6b6990] hover:bg-[#F4F3FA]"
                      onClick={() =>
                        setForm((p) => ({ ...p, time: Math.max(0, (p.time || 0) - 1) }))
                      }
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={form.time}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          time: Number.isNaN(parseInt(e.target.value, 10))
                            ? 0
                            : parseInt(e.target.value, 10),
                        }))
                      }
                      className="min-w-0 flex-1 border-0 bg-transparent text-center text-[14px] font-bold text-[#1F1B4D] focus:outline-none focus:ring-0"
                    />
                    <button
                      type="button"
                      className="grid w-9 place-items-center bg-[#fbfbfe] text-[#6b6990] hover:bg-[#F4F3FA]"
                      onClick={() => setForm((p) => ({ ...p, time: (p.time || 0) + 1 }))}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-nowrap gap-1.5">
                    {DURATION_CHIPS.map((mins) => {
                      const on = form.time === mins;
                      return (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, time: mins }))}
                          className={`inline-flex h-[34px] min-w-0 flex-1 items-center justify-center rounded-[9px] text-[12.5px] font-bold tabular-nums ${
                            on
                              ? 'bg-[#4338E8] text-white shadow-[0_3px_10px_rgba(79,70,229,0.25)]'
                              : 'border border-[#e3e2ee] bg-white text-[#55537a]'
                          }`}
                        >
                          {mins}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <div className={fieldLab}>
                  Year groups <span className="text-[#e11d48]">*</span>
                  {(hiddenYearGroupCount > 0 || showAllYearGroups) && (
                    <button
                      type="button"
                      onClick={() => setShowAllYearGroups((v) => !v)}
                      className="ml-auto text-[11.5px] font-bold text-[#4338E8] hover:underline"
                    >
                      {showAllYearGroups
                        ? 'Show current stage'
                        : `Show all ${hiddenYearGroupCount}`}
                    </button>
                  )}
                </div>
                <div className="space-y-2.5">
                  {yearGroupBuckets.map((bucket) => (
                    <div key={bucket.id} className="min-w-0">
                      <p className="mb-1.5 text-[13px] font-extrabold uppercase tracking-wide text-[#77738F]">
                        {bucket.label}
                      </p>
                      <div className="flex max-w-full flex-wrap gap-1.5">
                        {bucket.groups.map((group) => {
                          const selected = form.yearGroups.includes(group.name);
                          const color = group.color || '#4338E8';
                          return (
                            <button
                              key={group.id}
                              type="button"
                              onClick={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  yearGroups: selected
                                    ? prev.yearGroups.filter((g) => g !== group.name)
                                    : [...prev.yearGroups, group.name],
                                }))
                              }
                              aria-pressed={selected}
                              className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[13px] font-semibold leading-tight ${
                                selected
                                  ? 'border-[#a5b4fc] bg-[#eef2ff] text-[#3730a3]'
                                  : 'border-[#e3e2ee] bg-white text-[#55537a]'
                              }`}
                            >
                              <span
                                className="h-[7px] w-[7px] shrink-0 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              <span className="min-w-0 truncate">{group.name}</span>
                              {selected ? (
                                <span className="shrink-0 text-[13px] font-extrabold text-[#4338E8]">
                                  ✓
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                {errors.yearGroups && (
                  <p className="mt-1 text-[13px] text-red-500">{errors.yearGroups}</p>
                )}
              </div>

              <div>
                <div className={fieldLab}>
                  Curriculum objectives
                  <button
                    type="button"
                    onClick={() => setShowObjectivesBrowser(true)}
                    className="ml-auto text-[11.5px] font-bold text-[#4338E8] hover:underline"
                  >
                    + Choose
                  </button>
                </div>
                {selectedObjectiveCards.length > 0 ? (
                  <div className="space-y-2">
                    {selectedObjectiveCards.map((obj) => (
                      <div
                        key={obj.id}
                        className="flex items-start gap-2.5 rounded-[10px] border border-[#efeef6] bg-[#f8f8fc] px-3 py-2.5"
                      >
                        <b className="mt-0.5 shrink-0 rounded-md bg-[#e0e7ff] px-1.5 py-0.5 text-[10.5px] font-extrabold text-[#4338E8]">
                          {obj.code}
                        </b>
                        <div className="text-[13px] font-medium leading-snug text-[#4b4970]">
                          {obj.text}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] font-medium text-[#9a98b8]">No objectives selected</p>
                )}
              </div>

              <div>
                <div className={fieldLab}>Topics</div>
                <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-[10px] border border-[#e3e2ee] bg-white px-2 py-1.5">
                  {parseTopics(form.unitName).map((topic) => (
                    <span
                      key={topic}
                      className="inline-flex h-[26px] items-center gap-1 rounded-full bg-[#f1f0f7] pl-2.5 pr-1.5 text-[13px] font-semibold text-[#3b3960]"
                    >
                      {topic}
                      <button
                        type="button"
                        onClick={() => removeTopic(topic)}
                        className="text-[#9a98b8] hover:text-[#1F1B4D]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
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
                    placeholder="Add topic…"
                    className="min-w-[6rem] flex-1 border-0 bg-transparent px-1 text-[13px] font-medium text-[#1F1B4D] outline-none placeholder:text-[#9a98b8] focus:ring-0"
                  />
                </div>
              </div>

              <div className="mt-auto flex items-center gap-2.5 rounded-xl bg-[#f8f8fc] px-3 py-3 text-[13px] font-medium text-[#6b6990]">
                <FolderOpen className="h-4 w-4 shrink-0" />
                <div>
                  Will be saved to{' '}
                  <b className="font-bold text-[#3b3960]">
                    {form.category || 'your categories'}
                  </b>{' '}
                  in your library
                </div>
              </div>
            </div>
          </aside>
      </div>

      {showObjectivesBrowser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            aria-hidden
            onClick={() => setShowObjectivesBrowser(false)}
          />
          <div className="relative z-10 max-h-[min(90vh,40rem)] w-full max-w-2xl overflow-hidden rounded-2xl border border-[#E2E0EF] bg-white shadow-2xl">
            <NestedStandardsBrowser
              isOpen={showObjectivesBrowser}
              onClose={() => setShowObjectivesBrowser(false)}
              selectedObjectives={form.custom_objective_ids}
              onAddObjective={(id) =>
                setForm((p) => ({
                  ...p,
                  custom_objective_ids: p.custom_objective_ids.includes(id)
                    ? p.custom_objective_ids
                    : [...p.custom_objective_ids, id],
                }))
              }
              onRemoveObjective={(id) =>
                setForm((p) => ({
                  ...p,
                  custom_objective_ids: p.custom_objective_ids.filter((x) => x !== id),
                }))
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
