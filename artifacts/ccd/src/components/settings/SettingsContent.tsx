import React, { useState, useRef } from 'react';
import { Settings, Palette, RotateCcw, X, Plus, Trash2, GripVertical, Edit3, Save, Users, Database, AlertTriangle, GraduationCap, Package, Filter, Video, Music, Volume2, FileText, Link as LinkIcon, Image, FileVideo, FileMusic, File, Globe, ExternalLink, Share2, Download, Upload, Eye, Play, Pause, Headphones, Mic, Speaker, Film, Camera, BookOpen, Book, Folder, Cloud, Network, Target, HelpCircle, ChevronDown, ChevronRight, Undo2, Redo2, MapPin, BarChart3, MessageSquare, Shield, Search } from 'lucide-react';
import { useSettings, Category, ResourceLinkConfig, SOCIAL_PLATFORMS, YearGroupSection } from '../../contexts/SettingsContextNew';
import { DataSourceSettings } from '../DataSourceSettings';
import { CustomObjectivesAdmin } from '../CustomObjectivesAdmin';
import { ActivityPacksAdmin } from '../ActivityPacksAdmin';
import { useAuth } from '../../hooks/useAuth';
import { useIsViewOnly } from '../../hooks/useIsViewOnly';
import { isSupabaseConfigured } from '../../config/supabase';
import { UserManagement } from '../Admin/UserManagement';
import { HubContentApprovalQueue } from '../musicHubs/HubContentApprovalQueue';
import { MusicHubAdminPanel } from '../musicHubs/MusicHubAdminPanel';
import { MyHubAdministration } from '../musicHubs/MyHubAdministration';
import { DownloadAnalytics } from '../Admin/DownloadAnalytics';
import { HubAdminDashboard } from '../Admin/HubAdminDashboard';
import { MyDownloads } from '../Downloads/MyDownloads';
import { customCategoriesApi, activityPacksApi, yearGroupSectionsApi } from '../../config/api';
import type { ActivityPack } from '../../config/api';
import { useDrag, useDrop } from 'react-dnd';
import { useDropZoneStyle, useDropFlash } from '../dnd';
import toast from 'react-hot-toast';
import { ColorPickerWithFavorites } from '../ColorPickerWithFavorites';
import { CategoryFoldersPanel } from '../CategoryFoldersPanel';
import {
  findSectionIdForYearGroup,
  moveYearGroupsToSection,
  normalizeSectionYearGroupIdList,
  normalizeYearGroupToken,
  resolveYearGroupFromToken,
} from '../../utils/yearGroupSectionOrder';
import {
  categoryHasYearGroupAssignment,
  isSystemCategory,
  isUserCategory,
} from '../../utils/systemCategories';
import { CategoriesCloudAuthError } from '../../config/api';
import { SystemCategoriesAdmin } from '../Admin/SystemCategoriesAdmin';
import { toastSettingsSaved, toastSettingsError } from './saveToast';
import type { SchoolToolsPanelId, SettingsSectionId } from './settingsSections';
import { SCHOOL_TOOLS_PANELS } from './settingsSections';
import { keyStageAccent } from './keyStageAccents';
import { groupClassesBySubject } from '../../utils/classOrganization';


function YearGroupSectionSelect({
  id,
  value,
  onChange,
  sections,
  className,
  labelledBy,
  emptyLabel,
}: {
  id?: string;
  value: string;
  onChange: (sectionId: string) => void;
  sections: YearGroupSection[];
  className?: string;
  labelledBy?: string;
  emptyLabel?: string;
}) {
  const sorted = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
  const known = sorted.some((s) => s.id === value);
  const selectValue = known ? value : emptyLabel ? '' : (sorted.find((s) => s.id === 'other')?.id ?? sorted[0]?.id ?? '');
  return (
    <select
      id={id}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : 'Section'}
      value={selectValue}
      onChange={(e) => onChange(e.target.value)}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className={
        className ??
        'h-10 min-w-[8.5rem] max-w-full px-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#4338E8] focus:border-transparent focus:outline-none'
      }
    >
      {emptyLabel ? <option value="">{emptyLabel}</option> : null}
      {sorted.map((s) => (
        <option key={s.id} value={s.id}>
          {s.label}
        </option>
      ))}
    </select>
  );
}

function CategoryFolderSelect({
  id,
  value,
  folders,
  onChange,
  className,
  emptyLabel,
}: {
  id?: string;
  value: string;
  folders: { id: string; name: string; position: number }[];
  onChange: (folderName: string) => void;
  className?: string;
  emptyLabel?: string;
}) {
  const sorted = [...folders].sort((a, b) => a.position - b.position);
  return (
    <select
      id={id}
      aria-label="Folder"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className={
        className ??
        'h-10 min-w-[8.5rem] max-w-full px-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#4338E8] focus:border-transparent focus:outline-none'
      }
    >
      <option value="">{emptyLabel || 'Not in a folder'}</option>
      {sorted.map((folder) => (
        <option key={folder.id} value={folder.name}>
          {folder.name}
        </option>
      ))}
    </select>
  );
}

// Draggable Category Item Component
interface DraggableCategoryProps {
  category: Category;
  index: number;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
  onDragEnd?: () => void;
  children: React.ReactNode;
}

function DraggableCategory({ category, index, onReorder, onDragEnd, children }: DraggableCategoryProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { flashClass, triggerFlash } = useDropFlash();

  const [{ handlerId, isOver, canDrop }, drop] = useDrop({
    accept: 'category',
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
    type: 'category',
    item: () => ({ index, categoryName: category.name }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    end: () => {
      if (onDragEnd) onDragEnd();
    }
  });

  drag(drop(ref));

  const dropZoneClass = useDropZoneStyle({ isOver, canDrop, variant: 'inline' });

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      data-handler-id={handlerId}
      className={`rounded-lg transition-all ${isDragging ? 'ring-2 ring-[#a9a3ff] shadow-lg' : ''} ${dropZoneClass} ${flashClass}`}
    >
      {children}
    </div>
  );
}

// Helper function to get icon component by name
const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    Video, Music, Volume2, FileText, Palette, LinkIcon, Image, FileVideo, FileMusic, File, Globe, ExternalLink, Share2, Download, Upload, Eye, Play, Pause, Headphones, Mic, Speaker, Film, Camera, Folder, BookOpen, Book, Cloud, Database, Network
  };
  return iconMap[iconName] || FileText; // Default to FileText if icon not found
};

// Helper function to get available icons for selection
const getAvailableIcons = () => {
  return [
    { name: 'Video', label: 'Video' },
    { name: 'Music', label: 'Music' },
    { name: 'Volume2', label: 'Volume' },
    { name: 'FileText', label: 'File Text' },
    { name: 'Palette', label: 'Palette' },
    { name: 'LinkIcon', label: 'Link' },
    { name: 'Image', label: 'Image' },
    { name: 'FileVideo', label: 'File Video' },
    { name: 'FileMusic', label: 'File Music' },
    { name: 'File', label: 'File' },
    { name: 'Globe', label: 'Globe' },
    { name: 'ExternalLink', label: 'External Link' },
    { name: 'Share2', label: 'Share' },
    { name: 'Download', label: 'Download' },
    { name: 'Upload', label: 'Upload' },
    { name: 'Eye', label: 'Eye' },
    { name: 'Play', label: 'Play' },
    { name: 'Pause', label: 'Pause' },
    { name: 'Headphones', label: 'Headphones' },
    { name: 'Mic', label: 'Microphone' },
    { name: 'Speaker', label: 'Speaker' },
    { name: 'Film', label: 'Film' },
    { name: 'Camera', label: 'Camera' },
    { name: 'BookOpen', label: 'Book Open' },
    { name: 'Book', label: 'Book' },
    { name: 'Folder', label: 'Folder' },
    { name: 'Cloud', label: 'Cloud' },
    { name: 'Database', label: 'Database' },
    { name: 'Network', label: 'Network' },
  ];
};

interface SettingsContentProps {
  section: SettingsSectionId;
  schoolPanel: SchoolToolsPanelId | null;
  schoolPanels: SchoolToolsPanelId[];
  onSchoolPanelChange: (panel: SchoolToolsPanelId) => void;
}

const SECTION_TO_TAB: Record<SettingsSectionId, string> = {
  classes: 'yeargroups',
  folders: 'categories',
  objectives: 'admin',
  preferences: 'resource-links',
  downloads: 'my-downloads',
  users: 'users',
  school: 'school',
};

export function SettingsContent({
  section,
  schoolPanel,
  schoolPanels,
  onSchoolPanelChange,
}: SettingsContentProps) {
  const { user, profile } = useAuth();
  const isViewOnly = useIsViewOnly();
  const { settings, updateSettings, resetToDefaults, categories, updateCategories, resetCategoriesToDefaults, restoreSystemCategoryDefaults, clearUserCreatedCategories, categoryFolders, customYearGroups, updateYearGroups, updateYearGroupSections, getOrderedYearGroups, yearGroupSections, deleteYearGroup, resetYearGroupsToDefaults, ensureYearGroupsInSections, forceSyncYearGroups, forceSyncToSupabase, forceRefreshFromSupabase, forceSyncCurrentYearGroups, forceSafariSync, startUserChange, endUserChange, resourceLinks, updateResourceLinks, resetResourceLinksToDefaults } = useSettings();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);
  const [tempCategories, setTempCategories] = useState(categories);
  const [tempYearGroups, setTempYearGroups] = useState(customYearGroups);
  // Refs hold the latest categories/year groups so Save uses current values (avoids stale closure when user toggles then clicks Save)
  const tempCategoriesRef = useRef(categories);
  const tempYearGroupsRef = useRef(customYearGroups);
  const yearGroupSectionsRef = useRef(yearGroupSections);
  tempCategoriesRef.current = tempCategories;
  tempYearGroupsRef.current = tempYearGroups;
  yearGroupSectionsRef.current = yearGroupSections;
  const [tempResourceLinks, setTempResourceLinks] = useState(resourceLinks);
  const [activeTab, setActiveTab] = useState<string>(SECTION_TO_TAB[section] === 'school' ? (schoolPanel || 'hub-admin') : SECTION_TO_TAB[section]);
  const [downloadsView, setDownloadsView] = useState<'my-downloads' | 'download-analytics'>('my-downloads');
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);
  const adminTriggerRef = useRef<HTMLButtonElement>(null);
  const settingsContentRef = useRef<HTMLDivElement>(null);
  const adminTabContentRef = useRef<HTMLDivElement>(null);
  const [adminDropdownPosition, setAdminDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryYearGroups, setEditingCategoryYearGroups] = useState<string | null>(null); // Track which category's year groups are being edited
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6B7280');
  // Use actual year group IDs/names as keys (not legacy codes)
  const [newCategoryYearGroups, setNewCategoryYearGroups] = useState<{[key: string]: boolean}>({});
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [bulkYearGroupMode, setBulkYearGroupMode] = useState(false); // Bulk assignment mode
  const [bulkStep1Collapsed, setBulkStep1Collapsed] = useState(false); // Collapse Step 1 after year groups chosen so categories are visible
  const [selectedCategoriesForBulk, setSelectedCategoriesForBulk] = useState<Set<string>>(new Set());
  const [selectedYearGroupsForBulk, setSelectedYearGroupsForBulk] = useState<Set<string>>(new Set());

  const [newYearGroupId, setNewYearGroupId] = useState('');
  const [newYearGroupName, setNewYearGroupName] = useState('');
  const [newYearGroupColor, setNewYearGroupColor] = useState('#3B82F6');
  const [newYearGroupSectionId, setNewYearGroupSectionId] = useState('other');
  const [showAddClassForm, setShowAddClassForm] = useState(false);
  /** Secondary Settings areas (folders, objectives, downloads) stay collapsed by default. */
  const [settingsMoreOpen, setSettingsMoreOpen] = useState(false);
  /** Undo / section tools — rare; keep off the main path. */
  const [manageSectionsOpen, setManageSectionsOpen] = useState(false);
  /** Key-stage cards always start collapsed (local UI — not persisted open state). */
  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<string>>(new Set());
  /** Subject sub-groups inside a stage also start collapsed. */
  const [expandedSubjectKeys, setExpandedSubjectKeys] = useState<Set<string>>(new Set());
  const [otherYearGroupQuery, setOtherYearGroupQuery] = useState('');
  const [selectedOtherYearGroupIds, setSelectedOtherYearGroupIds] = useState<Set<string>>(new Set());
  const [bulkOtherTargetSectionId, setBulkOtherTargetSectionId] = useState('');
  const [addInSectionId, setAddInSectionId] = useState<string | null>(null);
  const [inlineNewYearGroupId, setInlineNewYearGroupId] = useState('');
  const [inlineNewYearGroupName, setInlineNewYearGroupName] = useState('');
  const [inlineNewYearGroupColor, setInlineNewYearGroupColor] = useState('#3B82F6');
  const [newCategoryFolder, setNewCategoryFolder] = useState('');
  const [uncategorisedQuery, setUncategorisedQuery] = useState('');
  const [selectedUncategorisedNames, setSelectedUncategorisedNames] = useState<Set<string>>(new Set());
  const [bulkFolderTarget, setBulkFolderTarget] = useState('');
  const [addInFolderName, setAddInFolderName] = useState<string | null>(null);
  const [inlineNewCategoryName, setInlineNewCategoryName] = useState('');
  const [inlineNewCategoryColor, setInlineNewCategoryColor] = useState('#6B7280');
  const [editingYearGroup, setEditingYearGroup] = useState<string | null>(null);
  const [editingYearGroupDraft, setEditingYearGroupDraft] = useState<{ id: string; name: string; color: string } | null>(null);
  const [draggedYearGroup, setDraggedYearGroup] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showYearGroupsModal, setShowYearGroupsModal] = useState(false);
  const [newlyAddedYearGroup, setNewlyAddedYearGroup] = useState<{ id: string; name: string } | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionLabel, setEditingSectionLabel] = useState('');
  const [sectionUndoStack, setSectionUndoStack] = useState<YearGroupSection[][]>([]);
  const [sectionRedoStack, setSectionRedoStack] = useState<YearGroupSection[][]>([]);
  const sectionHistoryPrevRef = useRef<string>(JSON.stringify(yearGroupSections));
  const applyingSectionHistoryRef = useRef(false);
  const [shopPacks, setShopPacks] = useState<ActivityPack[]>([]);

  const isAdmin = user?.role === 'admin' ||
                  user?.role === 'superuser' ||
                  user?.role === 'super_admin' ||
                  profile?.role === 'admin' ||
                  profile?.role === 'superuser' ||
                  profile?.role === 'super_admin';
  const isSuperAdmin =
    user?.role === 'super_admin' ||
    profile?.role === 'super_admin' ||
    user?.role === 'superuser' ||
    profile?.role === 'superuser';
  const canEditSystemCategories = isAdmin || isSuperAdmin;
  const isCreator = profile?.role === 'creator';
  const showUserManagement =
    isAdmin ||
    profile?.role === 'admin' ||
    profile?.role === 'superuser' ||
    profile?.role === 'super_admin' ||
    profile?.can_manage_users === true ||
    user?.role === 'admin' ||
    user?.role === 'superuser' ||
    user?.role === 'super_admin';
  const showDownloadAnalytics =
    isAdmin ||
    profile?.role === 'organisation' ||
    profile?.role === 'super_admin' ||
    profile?.can_view_download_analytics === true;
  const showHubAdmin =
    isAdmin ||
    profile?.role === 'organisation' ||
    profile?.role === 'super_admin' ||
    (profile?.hub_memberships?.some((m) => m.role === 'admin' || m.role === 'owner') ?? false);
  const canAddSubscriberOrgs =
    user?.role === 'superuser' ||
    user?.role === 'super_admin' ||
    profile?.role === 'superuser' ||
    profile?.role === 'super_admin';

  // Drive internal tab from page section / school panel
  React.useEffect(() => {
    if (section === 'school') {
      const panel = schoolPanel && schoolPanels.includes(schoolPanel)
        ? schoolPanel
        : schoolPanels[0] ?? null;
      if (panel) setActiveTab(panel);
      return;
    }
    if (section === 'downloads') {
      setActiveTab(downloadsView);
      return;
    }
    setActiveTab(SECTION_TO_TAB[section]);
  }, [section, schoolPanel, schoolPanels, downloadsView]);

  // Entering My classes always resets stage cards + subject groups to collapsed.
  React.useEffect(() => {
    if (section === 'classes') {
      setExpandedSectionIds(new Set());
      setExpandedSubjectKeys(new Set());
    }
  }, [section]);

  // Keep undo/redo history for year-group sections (key stages).
  React.useEffect(() => {
    const currentSnapshot = JSON.stringify(yearGroupSections);
    const prevSnapshot = sectionHistoryPrevRef.current;
    if (currentSnapshot === prevSnapshot) return;
    if (applyingSectionHistoryRef.current) {
      sectionHistoryPrevRef.current = currentSnapshot;
      applyingSectionHistoryRef.current = false;
      return;
    }
    try {
      const prevSections = JSON.parse(prevSnapshot) as YearGroupSection[];
      if (Array.isArray(prevSections)) {
        setSectionUndoStack((prev) => [...prev, prevSections].slice(-50));
        setSectionRedoStack([]);
      }
    } catch {
      // Ignore parse issues for history snapshots
    }
    sectionHistoryPrevRef.current = currentSnapshot;
  }, [yearGroupSections]);

  const handleUndoSections = () => {
    if (sectionUndoStack.length === 0) return;
    const previous = sectionUndoStack[sectionUndoStack.length - 1];
    const current = yearGroupSections;
    applyingSectionHistoryRef.current = true;
    setSectionUndoStack((prev) => prev.slice(0, -1));
    setSectionRedoStack((prev) => [...prev, current].slice(-50));
    updateYearGroupSections(previous);
  };

  const handleRedoSections = () => {
    if (sectionRedoStack.length === 0) return;
    const next = sectionRedoStack[sectionRedoStack.length - 1];
    const current = yearGroupSections;
    applyingSectionHistoryRef.current = true;
    setSectionRedoStack((prev) => prev.slice(0, -1));
    setSectionUndoStack((prev) => [...prev, current].slice(-50));
    updateYearGroupSections(next);
  };

  // When admin dropdown opens, lock its position (fixed) so it doesn't move when content shifts
  React.useEffect(() => {
    if (!adminMenuOpen) {
      setAdminDropdownPosition(null);
      return;
    }
    const updatePosition = () => {
      const el = adminTriggerRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        setAdminDropdownPosition({ top: r.bottom + 4, left: r.left });
      }
    };
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [adminMenuOpen]);

  // Close admin dropdown when clicking outside (use click so opening click doesn't close immediately)
  React.useEffect(() => {
    if (!adminMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target as Node)) {
        setAdminMenuOpen(false);
      }
    };
    const id = setTimeout(() => document.addEventListener('click', handleClick), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('click', handleClick);
    };
  }, [adminMenuOpen]);

  // Update temp settings when settings change
  React.useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  // Update temp categories when categories change
  // BUT: Skip if we're in the middle of a deletion to prevent restoring deleted items
  const [isDeletingCategory, setIsDeletingCategory] = React.useState(false);
  React.useEffect(() => {
    if (!isDeletingCategory) {
    setTempCategories(categories);
    }
  }, [categories, isDeletingCategory]);

  // Update temp classes when classes change
  // BUT: Skip if we're in the middle of a deletion to prevent restoring deleted items
  const [isDeletingYearGroup, setIsDeletingYearGroup] = React.useState(false);
  React.useEffect(() => {
    if (!isDeletingYearGroup) {
    setTempYearGroups(customYearGroups);
    }
  }, [customYearGroups, isDeletingYearGroup]);

  // Clear notification when switching away from yeargroups tab (except when going to admin)
  React.useEffect(() => {
    if (activeTab !== 'yeargroups' && activeTab !== 'admin' && newlyAddedYearGroup) {
      setNewlyAddedYearGroup(null);
    }
  }, [activeTab]);

  // When opening Year Groups tab, ensure any orphaned year groups (e.g. after a rename) appear under Other.
  // IMPORTANT: This effect is intentionally NOT dependent on `ensureYearGroupsInSections` because that
  // callback's identity changes whenever `customYearGroups` changes, which itself mutates when we call
  // ensureYearGroupsInSections — producing an infinite render loop. We also gate on the classes section so the
  // effect only runs while the modal is actually visible.
  const ensureYearGroupsInSectionsRef = React.useRef(ensureYearGroupsInSections);
  ensureYearGroupsInSectionsRef.current = ensureYearGroupsInSections;
  React.useEffect(() => {
    if (section !== 'classes') return;
    if (activeTab !== 'yeargroups') return;
    ensureYearGroupsInSectionsRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, activeTab]);

  // When switching to Custom Objectives tab, scroll content into view so the panel is visible
  React.useEffect(() => {
    if (activeTab === 'admin' && adminTabContentRef.current && settingsContentRef.current) {
      const t = requestAnimationFrame(() => {
        adminTabContentRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
      });
      return () => cancelAnimationFrame(t);
    }
    return undefined;
  }, [activeTab]);

  // Load activity packs for Resource Library when viewing the tab
  React.useEffect(() => {
    if (activeTab !== 'purchases') return;
    activityPacksApi.getAllPacks().then(setShopPacks).catch(() => setShopPacks([]));
  }, [activeTab]);

  // Update temp resource links when resource links change
  React.useEffect(() => {
    setTempResourceLinks(resourceLinks);
  }, [resourceLinks]);

  // Note: Do NOT auto-sync tempCategories → categories in an effect.
  // Pairing that with the categories → tempCategories effect above causes a
  // maximum-update-depth loop when drag-reorder only updates temp state.
  // Call updateCategories explicitly from save/drop/drag-end handlers instead.

  // Note: Removed automatic refresh when modal opens to prevent race conditions
  // Data should already be up-to-date from the initial load
  // Users can manually refresh if needed using the refresh buttons

  const handleSave = async () => {
    if (isViewOnly) {
      toastSettingsError('Your account is view-only, so settings cannot be changed.');
      return;
    }
    // Use refs so we always save the latest state (avoids stale closure if user toggled year groups then clicked Save)
    const latestCategories = tempCategoriesRef.current;
    const latestYearGroups = tempYearGroupsRef.current;
    try {
      console.log('🔄 Saving all settings...');
      console.log('📋 Latest categories (with yearGroups):', latestCategories.map(cat => ({ 
        name: cat.name, 
        groups: cat.groups, 
        group: cat.group,
        yearGroups: cat.yearGroups 
      })));
      console.log('📋 Latest year groups:', latestYearGroups.map(group => ({
        id: group.id,
        name: group.name,
        color: group.color
      })));
      
      // Save settings (this doesn't need to be async as it's just local state)
    updateSettings(tempSettings);

      // Save resource links to localStorage
    updateResourceLinks(tempResourceLinks);
      
      // Save categories and year groups to state
      console.log('🔄 Saving categories and year groups...');
      updateCategories(latestCategories);
      updateYearGroups(latestYearGroups);
      
      // Push to Supabase immediately so category year group assignments persist
      const synced = await forceSyncToSupabase({ categories: latestCategories, yearGroups: latestYearGroups });
      if (!synced) {
        console.warn('⚠️ Supabase sync returned false - queue may still save shortly');
      }

      // Flush section layout now (not only the debounced autosave) so Save is permanent.
      // Use ref so we never persist a stale "all in Other" snapshot from an older render.
      const sectionsToSave = yearGroupSectionsRef.current;
      const sectionsOk = await yearGroupSectionsApi.upsert(sectionsToSave);
      if (!sectionsOk) {
        console.warn('⚠️ Year-group sections did not confirm to Supabase');
        toast.error(
          'Class sections could not sync to the cloud. Stay signed in and try Save Settings again — otherwise they may revert on reload.',
          { duration: 5000, position: 'top-center' },
        );
        return;
      }
      try {
        localStorage.setItem('year-group-sections', JSON.stringify(sectionsToSave));
        localStorage.setItem('year-group-sections-updated-at', String(Date.now()));
      } catch (_) {
        /* quota */
      }
      
      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000); // Hide after 3 seconds
      
      toastSettingsSaved('Settings saved');
      
      console.log('✅ All settings saved successfully');
    } catch (error: unknown) {
      console.error('❌ Failed to save settings:', error);
      const err = error as Error;
      console.error('❌ Error details:', { message: err?.message, stack: err?.stack, name: err?.name });
      
      toastSettingsError('Failed to save settings. Please try again.');
    }
  };

  const handleCancel = () => {
    setTempSettings(settings);
    setTempCategories(categories);
    setTempYearGroups(customYearGroups);
    setTempResourceLinks(resourceLinks);
  };


  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      resetToDefaults();
      setTempSettings(settings);
    }
  };

  // Handle year group selection using actual year group IDs/names
  const handleYearGroupChange = (yearGroup: { id?: string; name: string }, checked: boolean) => {
    const yearGroupKey = yearGroup.id || yearGroup.name;
    setNewCategoryYearGroups(prev => ({
      ...prev,
      [yearGroupKey]: checked
    }));
  };

  const persistNewCategory = async (opts: {
    name: string;
    color: string;
    folderName: string;
    yearGroups?: Category['yearGroups'];
  }) => {
    if (isViewOnly) {
      toastSettingsError('Your account cannot create categories.');
      return false;
    }
    const name = opts.name.trim();
    if (!name) return false;
    if (tempCategories.some((cat) => cat.name.toLowerCase() === name.toLowerCase())) {
      alert('A category with this name already exists.');
      return false;
    }

    startUserChange();
    try {
      const newCategory: Category = {
        name,
        color: opts.color,
        position: tempCategories.length,
        yearGroups: { ...(opts.yearGroups || {}) },
        group: opts.folderName || undefined,
        source: 'user',
      };
      const updatedCategories = [...tempCategories, newCategory];
      tempCategoriesRef.current = updatedCategories;
      setTempCategories(updatedCategories);
      console.log('🔄 Adding user category and persisting immediately:', newCategory);
      updateCategories(updatedCategories);

      try {
        const synced = await forceSyncToSupabase({ categories: updatedCategories });
        if (!synced) {
          toast.error('Saved on this device. Cloud sync needs a signed-in account with a valid user ID.');
        } else {
          toast.success(`Category “${newCategory.name}” created`);
        }
      } catch (syncErr) {
        if (syncErr instanceof CategoriesCloudAuthError) {
          toast.error('Saved locally only — sign in with a cloud account to sync across devices.');
        } else {
          throw syncErr;
        }
      }

      endUserChange();
      return true;
    } catch (error: unknown) {
      console.error('❌ Failed to add category:', error);
      alert('Failed to add category. Please try again.');
      endUserChange();
      return false;
    }
  };

  const handleAddCategory = async () => {
    if (!categoryHasYearGroupAssignment({
      name: newCategoryName,
      color: newCategoryColor,
      position: 0,
      yearGroups: newCategoryYearGroups,
    })) {
      alert('Select at least one year group so this category appears in the Activity Library (e.g. EYFS classes).');
      setShowYearGroupsModal(true);
      return;
    }
    const added = await persistNewCategory({
      name: newCategoryName,
      color: newCategoryColor,
      folderName: newCategoryFolder,
      yearGroups: newCategoryYearGroups,
    });
    if (!added) return;
    setNewCategoryName('');
    setNewCategoryColor('#6B7280');
    setNewCategoryYearGroups({});
    setNewCategoryFolder('');
  };

  const handleAddCategoryInFolder = async (folderName: string) => {
    const added = await persistNewCategory({
      name: inlineNewCategoryName,
      color: inlineNewCategoryColor,
      folderName,
    });
    if (!added) return;
    setInlineNewCategoryName('');
    setInlineNewCategoryColor('#6B7280');
    setAddInFolderName(null);
  };

  const assignCategoriesToFolder = (categoryNames: string[], folderName: string | null) => {
    if (categoryNames.length === 0) return;
    const nameSet = new Set(categoryNames);
    const updated = tempCategoriesRef.current.map((c) =>
      nameSet.has(c.name) ? { ...c, group: folderName || undefined, groups: undefined } : c
    );
    tempCategoriesRef.current = updated;
    setTempCategories(updated);
    updateCategories(updated);
    setSelectedUncategorisedNames((prev) => {
      const next = new Set(prev);
      categoryNames.forEach((n) => next.delete(n));
      return next;
    });
  };

  const handleBulkAssignUncategorised = () => {
    if (selectedUncategorisedNames.size === 0) return;
    assignCategoriesToFolder([...selectedUncategorisedNames], bulkFolderTarget || null);
    setBulkFolderTarget('');
  };


  const handleDeleteCategory = async (index: number) => {
    if (isViewOnly) {
      toastSettingsError('Your account cannot delete categories.');
      return;
    }
    const categoryToDelete = tempCategories[index];
    if (categoryToDelete && profile?.admin_preset_categories?.includes(categoryToDelete.name)) {
      alert('This category was assigned by an admin and cannot be removed.');
      return;
    }
    if (categoryToDelete && isSystemCategory(categoryToDelete)) {
      alert('App categories cannot be deleted. Hide them or clear year-group assignments instead. Super admins can edit the system catalog under Admin → System categories.');
      return;
    }
    if (confirm('Are you sure you want to delete this category? This may affect existing activities.')) {
      try {
        // Set deletion flag to prevent useEffect from resetting tempCategories
        setIsDeletingCategory(true);
        
        // Start user change to pause real-time sync
        startUserChange();
        
      const updatedCategories = tempCategories.filter((_, i) => i !== index);
        
      // Update positions
      updatedCategories.forEach((cat, i) => {
        cat.position = i;
      });
      setTempCategories(updatedCategories);
        
        // User-created only — system catalog rows are never deleted here
        const isCustomCategory = isUserCategory(categoryToDelete);
        
        // CRITICAL: Delete from Supabase FIRST before updating local state
        // This ensures the deletion completes before any reloads can happen
        if (isCustomCategory && isSupabaseConfigured()) {
          try {
            console.log('🗑️ Deleting category from Supabase:', categoryToDelete.name);
            await customCategoriesApi.delete(categoryToDelete.name);
            console.log('✅ Successfully deleted category from Supabase:', categoryToDelete.name);
            
            // Wait a moment to ensure Supabase deletion is fully processed
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (deleteError) {
            console.error('❌ Failed to delete category from Supabase:', deleteError);
            // Still continue - the category will be removed from local state
            // The cleanup logic in the useEffect will try to delete it again
          }
        }
        
        // Now update local state (this will trigger the save logic and cleanup)
        console.log('🔄 Updating local categories after Supabase deletion');
        await updateCategories(updatedCategories);
        
        console.log('✅ Category deleted and persisted');
        
        // Wait a bit before clearing the deletion flag to ensure state is stable
        setTimeout(() => {
          setIsDeletingCategory(false);
        }, 1000);
        
        // End user change after a longer delay to ensure all sync operations complete
        // This prevents reloads from Supabase from restoring the deleted category
        setTimeout(() => {
        endUserChange();
        }, 3000); // 3 seconds instead of immediate
      } catch (error: unknown) {
        console.error('❌ Failed to delete category:', error);
        alert('Failed to delete category. Please try again.');
        // Clear deletion flag on error
        setIsDeletingCategory(false);
        // End user change even on error, but after a delay
        setTimeout(() => {
        endUserChange();
        }, 2000);
      }
    }
  };

  const handleDragStart = (category: string) => {
    setDraggedCategory(category);
  };

  const handleDragOver = (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedCategory || draggedCategory === targetCategory) return;
    
    const draggedIndex = tempCategories.findIndex(cat => cat.name === draggedCategory);
    const targetIndex = tempCategories.findIndex(cat => cat.name === targetCategory);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    if (draggedIndex === targetIndex) return; // Already in position
    
    // Reorder categories
    const newCategories = [...tempCategories];
    const [removed] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, removed);
    
    // Update positions
    newCategories.forEach((cat, i) => {
      cat.position = i;
    });
    
    setTempCategories(newCategories);
    // Don't call updateCategories here - only on drop to avoid too many updates
  };

  const handleDragEnd = () => {
    setDraggedCategory(null);
  };

  const handleDrop = async (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault();
    if (!draggedCategory || draggedCategory === targetCategory) return;

    try {
      const draggedIndex = tempCategories.findIndex(cat => cat.name === draggedCategory);
      const targetIndex = tempCategories.findIndex(cat => cat.name === targetCategory);

      if (draggedIndex === -1 || targetIndex === -1) return;

      // Reorder categories
      const newCategories = [...tempCategories];
      const [removed] = newCategories.splice(draggedIndex, 1);
      newCategories.splice(targetIndex, 0, removed);
      
      // Update positions
      newCategories.forEach((cat, i) => {
        cat.position = i;
      });
      
      setTempCategories(newCategories);
      
      // Immediately persist changes
      console.log('🔄 Reordering categories and persisting immediately');
      await updateCategories(newCategories);
      
      console.log('✅ Categories reordered and persisted');
    } catch (error: unknown) {
      console.error('❌ Failed to reorder categories:', error);
      alert('Failed to reorder categories. Please try again.');
    }
  };

  const handleResetCategories = () => {
    const choice = window.prompt(
      'Reset categories:\n' +
        '1 = Restore app category defaults (keeps your custom categories & year-group ticks)\n' +
        '2 = Remove only my custom categories\n' +
        '3 = Full reset (app defaults only — removes custom categories)\n' +
        'Cancel = do nothing\n\nType 1, 2, or 3:'
    );
    if (choice === '1') {
      restoreSystemCategoryDefaults();
      toast.success('App categories restored (your customs kept)');
    } else if (choice === '2') {
      if (confirm('Remove all categories you created? App categories stay.')) {
        clearUserCreatedCategories();
        toast.success('Custom categories removed');
      }
    } else if (choice === '3') {
      if (confirm('Full reset to app defaults? Your custom categories will be removed. Activities are not deleted.')) {
        resetCategoriesToDefaults();
        toast.success('Categories reset to app defaults');
      }
    }
  };

  // Class Management
  const persistNewYearGroup = async (opts: {
    id: string;
    name: string;
    color: string;
    sectionId: string;
  }) => {
    const id = opts.id.trim();
    const name = opts.name.trim();
    if (!id || !name) return false;

    if (tempYearGroups.some((group) => group.id.toLowerCase() === id.toLowerCase())) {
      alert('A year group with this ID already exists.');
      return false;
    }

    const newYearGroup = { id, name, color: opts.color };
    const updatedYearGroups = [...tempYearGroups, newYearGroup];
    setTempYearGroups(updatedYearGroups);

    const targetSectionId =
      yearGroupSections.some((s) => s.id === opts.sectionId) ? opts.sectionId : 'other';

    updateYearGroups(updatedYearGroups);
    updateYearGroupSections(
      (prev) => moveYearGroupsToSection(prev, [newYearGroup.id], targetSectionId, updatedYearGroups),
      updatedYearGroups
    );
    try {
      await forceSyncToSupabase({ yearGroups: updatedYearGroups });
    } catch (e) {
      console.warn('Year group added locally; Supabase sync will retry.', e);
    }
    setNewlyAddedYearGroup({ id: newYearGroup.id, name: newYearGroup.name });
    return true;
  };

  const handleAddYearGroup = async () => {
    const added = await persistNewYearGroup({
      id: newYearGroupId,
      name: newYearGroupName,
      color: newYearGroupColor,
      sectionId: newYearGroupSectionId || 'other',
    });
    if (!added) return;
    setNewYearGroupId('');
    setNewYearGroupName('');
    setNewYearGroupColor('#3B82F6');
    setNewYearGroupSectionId('other');
  };

  const handleAddYearGroupInSection = async (sectionId: string) => {
    const added = await persistNewYearGroup({
      id: inlineNewYearGroupId,
      name: inlineNewYearGroupName,
      color: inlineNewYearGroupColor,
      sectionId,
    });
    if (!added) return;
    setInlineNewYearGroupId('');
    setInlineNewYearGroupName('');
    setInlineNewYearGroupColor('#3B82F6');
    setAddInSectionId(null);
  };

  const handleAssignYearGroupSection = (yearGroupId: string, sectionId: string) => {
    const groups = tempYearGroups;
    const currentId = findSectionIdForYearGroup(yearGroupSections, yearGroupId, groups);
    if (currentId === sectionId) return;
    updateYearGroupSections((prev) => moveYearGroupsToSection(prev, [yearGroupId], sectionId, groups));
    setSelectedOtherYearGroupIds((prev) => {
      if (!prev.has(yearGroupId)) return prev;
      const next = new Set(prev);
      next.delete(yearGroupId);
      return next;
    });
  };

  const handleBulkAssignOtherYearGroups = () => {
    if (!bulkOtherTargetSectionId || selectedOtherYearGroupIds.size === 0) return;
    const ids = [...selectedOtherYearGroupIds];
    updateYearGroupSections((prev) =>
      moveYearGroupsToSection(prev, ids, bulkOtherTargetSectionId, tempYearGroups)
    );
    setSelectedOtherYearGroupIds(new Set());
    setBulkOtherTargetSectionId('');
  };

  const handleUpdateYearGroup = async (index: number, id: string, name: string, color: string) => {
    const updatedYearGroups = [...tempYearGroups];
    const oldYearGroup = updatedYearGroups[index];
    const lockedId = oldYearGroup?.id || id;
    updatedYearGroups[index] = { ...oldYearGroup, id: lockedId, name, color };
    setTempYearGroups(updatedYearGroups);
    setEditingYearGroup(null);

    console.log('🔄 Updating year group and persisting immediately:', { id: lockedId, name, color });
    updateYearGroups(updatedYearGroups);
    try {
      await forceSyncToSupabase({ yearGroups: updatedYearGroups });
    } catch (e) {
      console.warn('Year group updated locally; Supabase sync will retry.', e);
    }
  };

  const resolveYearGroupIndex = (yearGroup: { id: string; name: string }) =>
    tempYearGroups.findIndex(
      (g) =>
        g.id === yearGroup.id ||
        normalizeYearGroupToken(g.name) === normalizeYearGroupToken(yearGroup.name) ||
        normalizeYearGroupToken(g.id) === normalizeYearGroupToken(yearGroup.name)
    );

  const handleDeleteYearGroup = async (yearGroup: { id: string; name: string }) => {
    try {
      setIsDeletingYearGroup(true);
      const index = resolveYearGroupIndex(yearGroup);
      const removed =
        index >= 0 ? tempYearGroups[index] : yearGroup;
      const exactId = (removed?.id || '').trim();
      const exactName = (removed?.name || '').trim();
      if (!exactId && !exactName) {
        setIsDeletingYearGroup(false);
        toast.error('Could not resolve this class to delete. Try refreshing settings, then remove it again.');
        return;
      }

      // Optimistic UI update: remove immediately, then delete from Supabase in the background.
      const beforeList = tempYearGroups;
      const updatedYearGroups =
        index >= 0
          ? tempYearGroups.filter((_, i) => i !== index)
          : tempYearGroups.filter(
              (g) =>
                g.id !== removed.id &&
                normalizeYearGroupToken(g.name) !== normalizeYearGroupToken(removed.name)
            );
      setTempYearGroups(updatedYearGroups);
      await updateYearGroups(updatedYearGroups);
      updateYearGroupSections(
        (prev) =>
          prev.map((s) => ({
            ...s,
            yearGroupIds: normalizeSectionYearGroupIdList(
              (s.yearGroupIds || []).filter((token) => {
                const g = resolveYearGroupFromToken(beforeList, token);
                if (g) {
                  return (
                    g.id !== removed.id &&
                    normalizeYearGroupToken(g.name) !== normalizeYearGroupToken(removed.name)
                  );
                }
                return (
                  normalizeYearGroupToken(token) !== normalizeYearGroupToken(removed.id) &&
                  normalizeYearGroupToken(token) !== normalizeYearGroupToken(removed.name)
                );
              }),
              updatedYearGroups
            ),
          })),
        updatedYearGroups
      );

      setIsDeletingYearGroup(false);

      void deleteYearGroup(
        { id: exactId || removed.id, name: exactName || removed.name },
        { skipLocal: true }
      ).catch((error: unknown) => {
        console.error('❌ Supabase delete failed:', error);
        const msg =
          error instanceof Error
            ? error.message
            : error && typeof error === 'object' && 'message' in error
              ? String((error as { message?: string }).message)
              : '';
        alert(
          msg
            ? `Year group removed in the app, but Supabase delete failed:\n\n${msg}\n\nIf this mentions RLS, policy, or permission: open Supabase → SQL Editor → run the migration file year_groups_rls_allow_delete_all_roles.sql from this project (or set can_manage_year_groups / admin on your profile).`
            : 'Year group removed in the app, but Supabase delete failed. Open Supabase → SQL Editor → run year_groups_rls_allow_delete_all_roles.sql, or grant your user admin / can_manage_year_groups on profiles.'
        );
      });
    } catch (error) {
      console.error('❌ Failed to delete year group:', error);
      const message = error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String((error as { message?: string }).message) : 'Failed to delete year group. Please try again.');
      alert(message || 'Failed to delete year group. Please try again.');
      setIsDeletingYearGroup(false);
    }
  };

  const handleYearGroupDragStart = (e: React.DragEvent, yearGroupId: string) => {
    setDraggedYearGroup(yearGroupId);
    e.dataTransfer.setData('text/plain', yearGroupId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleYearGroupDragOver = (e: React.DragEvent, targetYearGroupId: string) => {
    e.preventDefault();
    if (!draggedYearGroup || draggedYearGroup === targetYearGroupId) return;
    
    const draggedIndex = tempYearGroups.findIndex(group => group.id === draggedYearGroup);
    const targetIndex = tempYearGroups.findIndex(group => group.id === targetYearGroupId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Reorder classes
    const newYearGroups = [...tempYearGroups];
    const [removed] = newYearGroups.splice(draggedIndex, 1);
    newYearGroups.splice(targetIndex, 0, removed);
    
    setTempYearGroups(newYearGroups);
  };

  const handleYearGroupDragEnd = () => {
    setDraggedYearGroup(null);
  };

  const handleYearGroupDropInSection = (draggedId: string, targetId: string, sectionId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const groups = tempYearGroups;
    const sourceSectionId = findSectionIdForYearGroup(yearGroupSections, draggedId, groups);
    // Drag only reorders within the same section; section changes use the dropdown.
    if (!sourceSectionId || sourceSectionId !== sectionId) return;
    updateYearGroupSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const ids = normalizeSectionYearGroupIdList([...s.yearGroupIds], groups);
        const dragIdx = ids.indexOf(draggedId);
        const insertIdx = ids.indexOf(targetId);
        if (dragIdx < 0 || insertIdx < 0) return s;
        ids.splice(dragIdx, 1);
        ids.splice(insertIdx, 0, draggedId);
        return { ...s, yearGroupIds: ids };
      })
    );
  };

  const handleYearGroupDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedYearGroup || draggedYearGroup === targetId) return;

    try {
      const draggedIndex = tempYearGroups.findIndex(group => group.id === draggedYearGroup);
      const targetIndex = tempYearGroups.findIndex(group => group.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      // Reorder year groups
      const newYearGroups = [...tempYearGroups];
      const [removed] = newYearGroups.splice(draggedIndex, 1);
      newYearGroups.splice(targetIndex, 0, removed);

      setTempYearGroups(newYearGroups);
      updateYearGroups(newYearGroups);
      try {
        await forceSyncToSupabase({ yearGroups: newYearGroups });
      } catch (e) {
        console.warn('Reorder saved locally; Supabase sync will retry.', e);
      }
    } catch (error: unknown) {
      console.error('❌ Failed to reorder year groups:', error);
      alert('Failed to reorder year groups. Please try again.');
    }
  };

  const handleResetYearGroups = () => {
    const warningMessage = `⚠️ DANGER: This will DELETE ALL your custom year groups and reset to only the 3 defaults:

• Lower Kindergarten Music
• Upper Kindergarten Music  
• Reception Music

This action CANNOT be undone. Are you absolutely sure you want to continue?`;
    
    if (confirm(warningMessage)) {
      const doubleConfirm = confirm('🚨 FINAL WARNING: This will permanently delete all your custom year groups. Click OK only if you are 100% certain.');
      if (doubleConfirm) {
      resetYearGroupsToDefaults();
      setTempYearGroups(customYearGroups);
      }
    }
  };




  const renderYearGroupRow = (
    yearGroup: (typeof tempYearGroups)[number],
    section: YearGroupSection,
    isOther: boolean,
  ) => {
    const isSelectedOther = selectedOtherYearGroupIds.has(yearGroup.id);
    return (
      <div
        key={yearGroup.id}
        draggable
        onDragStart={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('select, input, button, label, a')) {
            e.preventDefault();
            return;
          }
          handleYearGroupDragStart(e, yearGroup.id);
        }}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onDrop={(e) => {
          e.preventDefault();
          const draggedId = draggedYearGroup || e.dataTransfer.getData('text/plain') || null;
          if (draggedId) handleYearGroupDropInSection(draggedId, yearGroup.id, section.id);
          handleYearGroupDragEnd();
        }}
        onDragEnd={handleYearGroupDragEnd}
        className={`rounded-xl px-2.5 py-2 transition-colors ${
          draggedYearGroup === yearGroup.id
            ? 'border border-[#bcb7f4] bg-[#E9E6FF] opacity-50'
            : editingYearGroup === yearGroup.id
              ? 'border border-[#E9E6FF] bg-[#F7F6FC]'
              : 'border border-transparent hover:bg-[#F4F3FA]'
        }`}
      >
        {editingYearGroup === yearGroup.id ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 cursor-move pt-1" title="Drag to reorder within this section" aria-hidden>
                <GripVertical className="h-5 w-5 text-gray-400" />
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">ID (read-only)</label>
                  <input
                    type="text"
                    value={yearGroup.id}
                    readOnly
                    aria-readonly="true"
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm bg-gray-100 text-gray-600 cursor-not-allowed"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Display name</label>
                  <input
                    type="text"
                    value={editingYearGroupDraft?.name ?? yearGroup.name}
                    onChange={(e) => setEditingYearGroupDraft(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Colour</label>
                  <ColorPickerWithFavorites
                    value={editingYearGroupDraft?.color ?? yearGroup.color ?? '#4338E8'}
                    onChange={(color) => setEditingYearGroupDraft(prev => prev ? { ...prev, color } : null)}
                    className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!editingYearGroupDraft) {
                    setEditingYearGroup(null);
                    return;
                  }
                  const idx = resolveYearGroupIndex(yearGroup);
                  if (idx < 0) {
                    toast.error('Could not save: class not found in list. Refresh settings and try again.');
                    return;
                  }
                  handleUpdateYearGroup(
                    idx,
                    yearGroup.id,
                    editingYearGroupDraft.name,
                    editingYearGroupDraft.color
                  );
                  setEditingYearGroupDraft(null);
                  setEditingYearGroup(null);
                }}
                className="p-1.5 text-[#4338E8] hover:bg-[#E9E6FF] rounded"
                title="Save display name and colour"
              >
                <Save className="h-5 w-5" />
              </button>
            </div>
            <div className="ml-8">
              <label htmlFor={`edit-section-${yearGroup.id}`} className="block text-xs font-medium text-gray-600 mb-1">Section</label>
              <YearGroupSectionSelect
                id={`edit-section-${yearGroup.id}`}
                value={section.id}
                onChange={(next) => handleAssignYearGroupSection(yearGroup.id, next)}
                sections={yearGroupSections}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {isOther && (
              <label className="inline-flex shrink-0 items-center" onMouseDown={(e) => e.stopPropagation()}>
                <span className="sr-only">Select {yearGroup.name}</span>
                <input
                  type="checkbox"
                  checked={isSelectedOther}
                  onChange={(e) => {
                    setSelectedOtherYearGroupIds((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(yearGroup.id);
                      else next.delete(yearGroup.id);
                      return next;
                    });
                  }}
                  className="h-3.5 w-3.5 rounded border-[#E2E0EF] text-[#4338E8] focus:ring-[#4338E8]"
                />
              </label>
            )}
            <div className="shrink-0 cursor-grab active:cursor-grabbing text-[#C4C0D8]" title="Drag to reorder">
              <GripVertical className="h-4 w-4" />
            </div>
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: yearGroup.color }}
              aria-hidden
            />
            <button
              type="button"
              onClick={() => {
                setEditingYearGroup(yearGroup.id);
                setEditingYearGroupDraft({
                  id: yearGroup.id,
                  name: yearGroup.name,
                  color: yearGroup.color || '#4338E8',
                });
              }}
              className="min-w-0 flex-1 text-left"
            >
              <span className="ss-settings-class-name block truncate">
                {yearGroup.name}
              </span>
              <span className="block truncate text-[10px] font-medium text-[#9CA3AF]">
                {yearGroup.id}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingYearGroup(yearGroup.id);
                setEditingYearGroupDraft({
                  id: yearGroup.id,
                  name: yearGroup.name,
                  color: yearGroup.color || '#4338E8',
                });
              }}
              className="grid h-8 w-8 place-items-center rounded-lg text-[#77738F] hover:bg-[#E9E6FF] hover:text-[#4338E8]"
              aria-label={`Edit ${yearGroup.name}`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteYearGroup(yearGroup)}
              className="grid h-8 w-8 place-items-center rounded-lg text-[#C4C0D8] hover:bg-red-50 hover:text-red-600"
              aria-label={`Delete ${yearGroup.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="ss-settings-content" ref={settingsContentRef}>

          {saveSuccess && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#E9E6FF] border border-[#E2E0EF] text-[#4338E8]">
              <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Saved</span>
            </div>
          )}

          {section === 'downloads' && showDownloadAnalytics && (
            <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Downloads views">
              <button
                type="button"
                role="tab"
                aria-selected={downloadsView === 'my-downloads'}
                className={`ss-settings-chip ${downloadsView === 'my-downloads' ? 'is-active' : ''}`}
                onClick={() => setDownloadsView('my-downloads')}
              >
                My downloads
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={downloadsView === 'download-analytics'}
                className={`ss-settings-chip ${downloadsView === 'download-analytics' ? 'is-active' : ''}`}
                onClick={() => setDownloadsView('download-analytics')}
              >
                Download stats
              </button>
            </div>
          )}

          {section === 'school' && schoolPanels.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="School tools">
              {SCHOOL_TOOLS_PANELS.filter((p) => schoolPanels.includes(p.id)).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={schoolPanel === p.id}
                  title={p.helper}
                  className={`ss-settings-chip ${schoolPanel === p.id ? 'is-active' : ''}`}
                  onClick={() => onSchoolPanelChange(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'yeargroups' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={handleUndoSections}
                    disabled={sectionUndoStack.length === 0}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-[#E2E0EF] bg-white text-[#5C5878] hover:border-[#bcb7f4] hover:text-[#1F1B4D] disabled:opacity-35"
                    title="Undo"
                    aria-label="Undo section changes"
                  >
                    <Undo2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRedoSections}
                    disabled={sectionRedoStack.length === 0}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-[#E2E0EF] bg-white text-[#5C5878] hover:border-[#bcb7f4] hover:text-[#1F1B4D] disabled:opacity-35"
                    title="Redo"
                    aria-label="Redo section changes"
                  >
                    <Redo2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const sorted = [...yearGroupSections].sort((a, b) => a.sortOrder - b.sortOrder);
                      const maxOrder = sorted.length ? Math.max(...sorted.map((s) => s.sortOrder)) : -1;
                      const newId = `section-${Date.now()}`;
                      updateYearGroupSections((prev) => [
                        ...prev,
                        {
                          id: newId,
                          label: 'New section',
                          sortOrder: maxOrder + 1,
                          collapsed: true,
                          yearGroupIds: [],
                        },
                      ]);
                      setExpandedSectionIds((prev) => new Set(prev).add(newId));
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E2E0EF] bg-white px-3 text-[13px] font-bold text-[#1F1B4D] hover:border-[#bcb7f4]"
                  >
                    <Plus className="h-3.5 w-3.5" /> Section
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddClassForm((v) => !v)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#4338E8] px-3 text-[13px] font-extrabold text-white hover:bg-[#3529d1]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {showAddClassForm ? 'Cancel' : 'Add class'}
                  </button>
              </div>

              <div className="space-y-3">
              {/* Class Management */}
              <div className="rounded-2xl border border-[#E2E0EF] bg-white p-3 sm:p-4 shadow-[0_1px_0_rgba(31,27,77,0.04)]">

                {/* Add class — collapsed by default */}
                {showAddClassForm && (
                <div className="mb-3 rounded-lg border border-[#E2E0EF] bg-[#F4F3FA]/80 p-3">
                  <h4 className="mb-2 text-[13px] font-bold text-[#1F1B4D]">New class</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label htmlFor="newYearGroupId" className="block text-xs font-medium text-[#77738F] mb-1">
                        System ID
                      </label>
                      <input
                        id="newYearGroupId"
                        name="newYearGroupId"
                        type="text"
                        value={newYearGroupId}
                        onChange={(e) => setNewYearGroupId(e.target.value)}
                        placeholder="e.g. Year1"
                        className="w-full h-9 px-3 border border-[#E2E0EF] rounded-lg focus:ring-2 focus:ring-[#4338E8] focus:border-transparent focus:outline-none text-sm"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label htmlFor="newYearGroupName" className="block text-xs font-medium text-[#77738F] mb-1">
                        Display name
                      </label>
                      <input
                        id="newYearGroupName"
                        name="newYearGroupName"
                        type="text"
                        value={newYearGroupName}
                        onChange={(e) => setNewYearGroupName(e.target.value)}
                        placeholder="e.g. Year 1"
                        className="w-full h-9 px-3 border border-[#E2E0EF] rounded-lg focus:ring-2 focus:ring-[#4338E8] focus:border-transparent focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="newYearGroupSection" className="block text-xs font-medium text-[#77738F] mb-1">
                        Section
                      </label>
                      <YearGroupSectionSelect
                        id="newYearGroupSection"
                        value={newYearGroupSectionId}
                        onChange={setNewYearGroupSectionId}
                        sections={yearGroupSections}
                        className="w-full h-9 px-2 border border-[#E2E0EF] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#4338E8] focus:border-transparent focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="newYearGroupColor" className="block text-xs font-medium text-[#77738F] mb-1">
                        Colour
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <ColorPickerWithFavorites
                          id="newYearGroupColor"
                          value={newYearGroupColor}
                          onChange={setNewYearGroupColor}
                          className="h-9 w-12 shrink-0 rounded-lg border border-[#E2E0EF] cursor-pointer"
                        />
                        <button
                          onClick={() => {
                            handleAddYearGroup();
                            setShowAddClassForm(false);
                          }}
                          disabled={!newYearGroupId.trim() || !newYearGroupName.trim()}
                          className="inline-flex h-9 w-full sm:w-auto items-center justify-center gap-2 px-4 bg-[#4338E8] hover:bg-[#3529d1] disabled:bg-[#a9a3ff] text-white font-semibold rounded-lg text-sm"
                        >
                          <Plus className="h-4 w-4 shrink-0" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                )}

                {/* Notification: Link Year Group to Objectives */}
                {newlyAddedYearGroup && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4 mb-4 shadow-md">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Target className="h-5 w-5 text-blue-600" />
                          <h4 className="font-semibold text-gray-900">Link Year Group to Objectives</h4>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                          You've created <strong>"{newlyAddedYearGroup.name}"</strong>. To use objectives in lesson plans for this year group, you need to:
                        </p>
                        <ol className="text-sm text-gray-700 list-decimal list-inside space-y-1 mb-3">
                          <li>Create a custom objective year group in the <strong>Custom Objectives</strong> tab</li>
                          <li>Link it to <strong>"{newlyAddedYearGroup.name}"</strong> when creating/editing objectives</li>
                        </ol>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setActiveTab('admin');
                              setNewlyAddedYearGroup(null);
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                          >
                            <Target className="h-4 w-4" />
                            <span>Go to Custom Objectives</span>
                          </button>
                          <button
                            onClick={() => setNewlyAddedYearGroup(null)}
                            className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => setNewlyAddedYearGroup(null)}
                        className="ml-4 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="ss-settings-stage-grid">
                    {[...yearGroupSections].sort((a, b) => a.sortOrder - b.sortOrder).map((section) => {
                      const yearGroupsInSection = section.yearGroupIds
                        .map(token => resolveYearGroupFromToken(tempYearGroups, token))
                        .filter(Boolean) as typeof tempYearGroups;
                      const otherQuery = otherYearGroupQuery.trim().toLowerCase();
                      const visibleYearGroups =
                        section.id === 'other' && otherQuery
                          ? yearGroupsInSection.filter(
                              (yg) =>
                                yg.name.toLowerCase().includes(otherQuery) ||
                                yg.id.toLowerCase().includes(otherQuery)
                            )
                          : yearGroupsInSection;
                      const isOther = section.id === 'other';
                      const sectionOpen =
                        expandedSectionIds.has(section.id) || (isOther && Boolean(otherQuery));
                      const accent = keyStageAccent(section.id, section.label);
                      const subjectGroups = groupClassesBySubject(visibleYearGroups);
                      const showSubjectGroups = subjectGroups.length > 1;
                      const toggleSection = () => {
                        setExpandedSectionIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(section.id)) next.delete(section.id);
                          else next.add(section.id);
                          return next;
                        });
                      };
                      return (
                        <div
                          key={section.id}
                          className={`ss-settings-stage-card ${sectionOpen ? 'is-open' : ''}`}
                          style={{ borderColor: sectionOpen ? accent.bar : undefined }}
                        >
                          <div
                            className="ss-settings-stage-card-head"
                            style={{ background: accent.tint }}
                          >
                            <button
                              type="button"
                              onClick={toggleSection}
                              aria-expanded={sectionOpen}
                              className={`flex min-w-0 items-center gap-2 text-left ${editingSectionId === section.id ? 'flex-shrink-0' : 'flex-1'}`}
                            >
                              {sectionOpen ? (
                                <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: accent.label }} />
                              ) : (
                                <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: accent.label }} />
                              )}
                              <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: accent.bar }}
                                aria-hidden
                              />
                              {editingSectionId !== section.id && (
                                <span className="ss-settings-stage-label truncate" style={{ color: accent.label }}>
                                  {section.label}
                                </span>
                              )}
                            </button>
                            {editingSectionId === section.id && (
                              <input
                                type="text"
                                value={editingSectionLabel}
                                onChange={(e) => setEditingSectionLabel(e.target.value)}
                                onBlur={() => {
                                  const label = editingSectionLabel.trim();
                                  if (label) {
                                    updateYearGroupSections(prev => prev.map(s => s.id === section.id ? { ...s, label } : s));
                                  }
                                  setEditingSectionId(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const label = editingSectionLabel.trim();
                                    if (label) {
                                      updateYearGroupSections(prev => prev.map(s => s.id === section.id ? { ...s, label } : s));
                                    }
                                    setEditingSectionId(null);
                                  }
                                }}
                                className="flex-1 min-w-0 px-2 py-0.5 border border-[#bcb7f4] rounded text-sm"
                                autoFocus
                              />
                            )}
                            {editingSectionId !== section.id && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setEditingSectionId(section.id); setEditingSectionLabel(section.label); }}
                                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-white/60 rounded"
                                  title="Edit section name"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                {yearGroupSections.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!confirm(`Move all year groups in "${section.label}" to Other and remove this section?`)) return;
                                      const other = yearGroupSections.find(s => s.id === 'other');
                                      if (!other) return;
                                      updateYearGroupSections(prev => prev.filter(s => s.id !== section.id).map(s => s.id === 'other' ? { ...s, yearGroupIds: [...(s.yearGroupIds || []), ...(section.yearGroupIds || [])] } : s));
                                    }}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                    title="Remove section (year groups move to Other)"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                            <span
                              className="ss-settings-stage-count"
                              style={{ background: accent.badge, color: accent.badgeText }}
                            >
                              {yearGroupsInSection.length}
                            </span>
                          </div>
                          {isOther && sectionOpen && (
                            <div className="space-y-2 border-t border-[#E2E0EF] px-2.5 py-2" style={{ background: accent.tint }}>
                              <label htmlFor="other-year-group-search" className="sr-only">Search Other year groups</label>
                              <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C5878] pointer-events-none" />
                                <input
                                  id="other-year-group-search"
                                  type="search"
                                  value={otherYearGroupQuery}
                                  onChange={(e) => setOtherYearGroupQuery(e.target.value)}
                                  placeholder="Search Other year groups"
                                  className="h-10 w-full rounded-lg border border-[#E2E0EF] bg-white pl-8 pr-3 text-sm text-[#1F1B4D] placeholder:text-[#8B879E] focus:border-[#4338E8] focus:outline-none focus:ring-2 focus:ring-[#4338E8]/25"
                                />
                              </div>
                              {visibleYearGroups.length > 0 && (
                                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const allVisible = visibleYearGroups.every((yg) => selectedOtherYearGroupIds.has(yg.id));
                                      setSelectedOtherYearGroupIds((prev) => {
                                        const next = new Set(prev);
                                        if (allVisible) {
                                          visibleYearGroups.forEach((yg) => next.delete(yg.id));
                                        } else {
                                          visibleYearGroups.forEach((yg) => next.add(yg.id));
                                        }
                                        return next;
                                      });
                                    }}
                                    className="inline-flex min-h-[40px] items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-lg border border-[#E2E0EF]"
                                  >
                                    {visibleYearGroups.every((yg) => selectedOtherYearGroupIds.has(yg.id))
                                      ? 'Clear visible'
                                      : 'Select visible'}
                                  </button>
                                  <label htmlFor="bulk-other-section" className="text-xs font-medium text-gray-600">
                                    Move selected to
                                  </label>
                                  <YearGroupSectionSelect
                                    id="bulk-other-section"
                                    value={bulkOtherTargetSectionId || ''}
                                    onChange={setBulkOtherTargetSectionId}
                                    sections={yearGroupSections.filter((s) => s.id !== 'other')}
                                    emptyLabel="Choose section"
                                    className="h-10 min-w-[8.5rem] flex-1 sm:flex-none px-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#4338E8] focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleBulkAssignOtherYearGroups}
                                    disabled={selectedOtherYearGroupIds.size === 0 || !bulkOtherTargetSectionId}
                                    className="inline-flex min-h-[40px] items-center px-3 py-1.5 text-sm font-medium text-white bg-[#4338E8] hover:bg-[#3529d1] disabled:bg-[#bcb7f4] disabled:cursor-not-allowed rounded-lg"
                                  >
                                    Assign {selectedOtherYearGroupIds.size > 0 ? `(${selectedOtherYearGroupIds.size})` : ''}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          {sectionOpen && (
                            <div className="ss-settings-stage-body space-y-2">
                              {visibleYearGroups.length === 0 ? (
                                <div className="flex min-h-[3rem] items-center justify-center rounded-xl border border-dashed border-[#E2E0EF] bg-[#F4F3FA]/50 px-2 py-3">
                                  <p className="text-center text-[12px] text-[#77738F]">
                                    {isOther && otherQuery
                                      ? 'No classes match your search.'
                                      : 'Empty — add a class or move one here.'}
                                  </p>
                                </div>
                              ) : showSubjectGroups ? (
                                subjectGroups.map((sg) => {
                                  const subjectKey = `${section.id}::${sg.subject.id}`;
                                  const subjectOpen = expandedSubjectKeys.has(subjectKey);
                                  return (
                                    <div key={subjectKey} className="ss-settings-subject-group">
                                      <button
                                        type="button"
                                        className="ss-settings-subject-head"
                                        aria-expanded={subjectOpen}
                                        onClick={() => {
                                          setExpandedSubjectKeys((prev) => {
                                            const next = new Set(prev);
                                            if (next.has(subjectKey)) next.delete(subjectKey);
                                            else next.add(subjectKey);
                                            return next;
                                          });
                                        }}
                                      >
                                        {subjectOpen ? (
                                          <ChevronDown className="h-3.5 w-3.5 text-[#77738F]" />
                                        ) : (
                                          <ChevronRight className="h-3.5 w-3.5 text-[#77738F]" />
                                        )}
                                        <span className="ss-settings-subject-dot" style={{ background: sg.subject.color }} />
                                        <span className="flex-1 truncate">{sg.subject.label}</span>
                                        <span className="text-[11px] font-bold tabular-nums text-[#77738F]">{sg.classes.length}</span>
                                      </button>
                                      {subjectOpen && (
                                        <div className="ss-settings-subject-body space-y-1">
                                          {sg.classes.map((yearGroup) => renderYearGroupRow(yearGroup, section, isOther))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="space-y-1">
                                  {(subjectGroups[0]?.classes ?? visibleYearGroups).map((yearGroup) =>
                                    renderYearGroupRow(yearGroup, section, isOther),
                                  )}
                                </div>
                              )}
                              {addInSectionId === section.id ? (
                                <div className="p-3 rounded-lg border border-[#E2E0EF] bg-[#E9E6FF]/60 space-y-3">
                                  <p className="text-sm font-medium text-gray-900">Add year group to {section.label}</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                      <label htmlFor={`inline-yg-id-${section.id}`} className="block text-xs font-medium text-gray-600 mb-1">ID (used in system)</label>
                                      <input
                                        id={`inline-yg-id-${section.id}`}
                                        value={inlineNewYearGroupId}
                                        onChange={(e) => setInlineNewYearGroupId(e.target.value)}
                                        placeholder="e.g., Year1"
                                        className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4338E8] focus:outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label htmlFor={`inline-yg-name-${section.id}`} className="block text-xs font-medium text-gray-600 mb-1">Display name</label>
                                      <input
                                        id={`inline-yg-name-${section.id}`}
                                        value={inlineNewYearGroupName}
                                        onChange={(e) => setInlineNewYearGroupName(e.target.value)}
                                        placeholder="e.g., Year 1"
                                        className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4338E8] focus:outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Colour</label>
                                      <ColorPickerWithFavorites
                                        value={inlineNewYearGroupColor}
                                        onChange={setInlineNewYearGroupColor}
                                        className="h-10 w-12 rounded-lg border border-gray-300 cursor-pointer"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => void handleAddYearGroupInSection(section.id)}
                                      disabled={!inlineNewYearGroupId.trim() || !inlineNewYearGroupName.trim()}
                                      className="inline-flex min-h-[40px] items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#4338E8] hover:bg-[#3529d1] disabled:bg-[#bcb7f4] rounded-lg"
                                    >
                                      <Plus className="h-4 w-4" /> Add
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAddInSectionId(null);
                                        setInlineNewYearGroupId('');
                                        setInlineNewYearGroupName('');
                                        setInlineNewYearGroupColor('#3B82F6');
                                      }}
                                      className="inline-flex min-h-[40px] items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddInSectionId(section.id);
                                    setNewYearGroupSectionId(section.id);
                                  }}
                                  className="inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#4338E8] bg-[#E9E6FF] hover:bg-[#E0DCF8] rounded-lg"
                                >
                                  <Plus className="h-4 w-4" /> Add year group
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              <p className="text-[12px] font-medium leading-relaxed text-[#5C5878]">
                System IDs stay the same so existing lessons keep their links. Stage layout saves automatically.
              </p>
            </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <>

              {/* Category Management */}
              <div className="rounded-xl border border-[#E2E0EF] bg-white p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Palette className="h-5 w-5 text-[#4338E8] shrink-0" />
                    <div>
                      <h3 className="text-[15px] font-extrabold tracking-tight text-[#1F1B4D]">Folders for each class</h3>
                      <p className="text-xs text-[#77738F]">
                        Tick which classes see each folder. Changes save straight away and update the Activity Library.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleResetCategories}
                    className="px-3 py-1.5 bg-[#E9E6FF] hover:bg-[#D8D4F5] text-[#4338E8] text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-1"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset options…</span>
                  </button>
                </div>

                {/* Create My Category */}
                <div className="bg-white rounded-lg border border-[#E2E0EF] p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-1">+ New activity type</h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Add your own activity type. Tick which classes should see it in the Activity Library.
                  </p>
                  {isViewOnly ? (
                    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Your account cannot create categories.
                    </p>
                  ) : (
                  <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <label htmlFor="newCategoryName" className="sr-only">Category name</label>
                      <input
                        id="newCategoryName"
                        name="newCategoryName"
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4338E8] focus:border-transparent focus:outline-none"
                        dir="ltr"
                      />
                    </div>
                    <div className="w-24">
                      <label htmlFor="newCategoryColor" className="sr-only">Category color</label>
                      <ColorPickerWithFavorites
                        id="newCategoryColor"
                        value={newCategoryColor}
                        onChange={setNewCategoryColor}
                        className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                      />
                    </div>
                    <div className="w-full sm:w-auto min-w-[10rem]">
                      <label htmlFor="newCategoryFolder" className="sr-only">Folder</label>
                      <CategoryFolderSelect
                        id="newCategoryFolder"
                        value={newCategoryFolder}
                        folders={categoryFolders}
                        onChange={setNewCategoryFolder}
                        className="w-full h-10 px-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#4338E8] focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={handleAddCategory}
                      disabled={!newCategoryName.trim()}
                      className="px-4 py-2 bg-[#4338E8] hover:bg-[#3529d1] disabled:bg-[#a9a3ff] text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add</span>
                    </button>
                    </div>
                    
                    {/* Year Groups Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Show for these classes <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowYearGroupsModal(true)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors flex items-center space-x-2"
                      >
                        <Users className="h-4 w-4" />
                        <span>
                          {Object.values(newCategoryYearGroups).some(v => v) 
                            ? `${Object.values(newCategoryYearGroups).filter(v => v).length} year group(s) selected`
                            : 'Select year groups (required)'}
                        </span>
                      </button>
                    </div>
                  </div>
                  )}
                </div>

                {/* Year Groups Selection Modal */}
                {showYearGroupsModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                      {/* Header - Teal gradient matching other modals */}
                      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#1F1B4D] to-[#4338E8] text-white flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold">Show for these classes</h2>
                            <p className="text-sm text-white/90 mt-0.5">
                              Select which year groups this category should be available for
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowYearGroupsModal(false)}
                          className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-6 overflow-y-auto flex-1">
                        <div className="space-y-3">
                          {customYearGroups && Array.isArray(customYearGroups) && customYearGroups.length > 0 ? (
                            customYearGroups.map(yearGroup => {
                              // Use actual year group ID/name as key (consistent with rest of app)
                              const yearGroupKey = yearGroup.id || yearGroup.name;
                              const isChecked = newCategoryYearGroups[yearGroupKey] || false;
                              
                              return (
                                <label 
                                  key={yearGroup.id || yearGroup.name} 
                                  className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                            <input
                              type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      handleYearGroupChange(yearGroup, e.target.checked);
                                    }}
                                    className="h-5 w-5 text-[#4338E8] focus:ring-[#4338E8] border-gray-300 rounded"
                                  />
                                  <span className="text-sm font-medium text-gray-700 flex-1">{yearGroup.name}</span>
                          </label>
                              );
                            })
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No year groups available</p>
                          )}
                      </div>
                    </div>

                      {/* Footer */}
                      <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
                        <button
                          onClick={() => {
                            // Clear all selections
                            setNewCategoryYearGroups({});
                          }}
                          className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Clear All
                        </button>
                        <button
                          onClick={() => setShowYearGroupsModal(false)}
                          className="px-4 py-2 bg-[#4338E8] hover:bg-[#3529d1] text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Done
                        </button>
                  </div>
                </div>
                  </div>
                )}

                {/* Category List */}
                <div className="bg-white rounded-lg border border-[#E2E0EF] p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-900">
                      Organise folders
                      {isRefreshing && (
                        <span className="ml-2 text-sm text-[#4338E8]">(Refreshing...)</span>
                      )}
                    </h4>
                    <button
                      onClick={async () => {
                        console.log('🔄 Manual refresh requested for categories...');
                        setIsRefreshing(true);
                        try {
                          const success = await forceRefreshFromSupabase();
                          if (success) {
                            console.log('✅ Manual refresh completed for categories');
                          } else {
                            console.warn('⚠️ Manual refresh partially failed for categories');
                          }
                        } finally {
                          setIsRefreshing(false);
                        }
                      }}
                      disabled={isRefreshing}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-[#E9E6FF] text-[#4338E8] rounded-md hover:bg-[#D8D4F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Refresh categories from server"
                    >
                      <RotateCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Use the Folder menu on each item. Search “Not in a folder” when the list is long. Drag to reorder within a folder.
                  </p>

                  {/* Bulk Year Group Assignment Section */}
                  {bulkYearGroupMode && (
                    <div className="mb-6 p-5 bg-gradient-to-br from-[#E9E6FF] to-[#D8D4F5] border-2 border-[#bcb7f4] rounded-xl shadow-sm">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 mb-1">Assign to classes…</h4>
                          <p className="text-sm text-gray-600">
                            Select categories below, then choose year groups to assign them to
                          </p>
                        </div>
                      <button
                        onClick={() => {
                            setBulkYearGroupMode(false);
                            setBulkStep1Collapsed(false);
                            setSelectedCategoriesForBulk(new Set());
                            setSelectedYearGroupsForBulk(new Set());
                        }}
                          className="ml-4 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
                          title="Close bulk assignment"
                      >
                          <X className="h-5 w-5" />
                      </button>
                    </div>

                      {/* Step 1: Year Groups Selection - collapsible after selection so categories are visible */}
                      <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                        {bulkStep1Collapsed && selectedYearGroupsForBulk.size > 0 ? (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">
                              <span className="font-semibold text-[#4338E8]">{selectedYearGroupsForBulk.size} year group{selectedYearGroupsForBulk.size !== 1 ? 's' : ''} selected</span>
                              {' — '}
                              Select categories below, then apply.
                            </span>
                            <button
                              type="button"
                              onClick={() => setBulkStep1Collapsed(false)}
                              className="px-3 py-1.5 text-sm font-medium text-[#4338E8] hover:text-[#1F1B4D] hover:bg-[#E9E6FF] rounded-lg transition-colors border border-[#E2E0EF]"
                            >
                              Edit year groups
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-3">
                              <label className="block text-sm font-semibold text-gray-700">
                                Step 1: Select Year Groups
                              </label>
                              {selectedYearGroupsForBulk.size > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setBulkStep1Collapsed(true)}
                                  className="px-3 py-1 text-xs font-medium text-[#4338E8] hover:text-[#1F1B4D] hover:bg-[#E9E6FF] rounded transition-colors"
                                  title="Collapse so you can select categories below"
                                >
                                  Collapse — select categories below
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
                              {customYearGroups && Array.isArray(customYearGroups) && customYearGroups.length > 0 ? customYearGroups.map(yearGroup => {
                                // Use yearGroup.id consistently (which is the name from the API)
                                const yearGroupKey = yearGroup.id || yearGroup.name;
                                const isSelected = selectedYearGroupsForBulk.has(yearGroupKey);
                                return (
                                  <button
                                    key={yearGroup.id}
                                    onClick={() => {
                                      const newSelected = new Set(selectedYearGroupsForBulk);
                                      if (isSelected) newSelected.delete(yearGroupKey);
                                      else newSelected.add(yearGroupKey);
                                      setSelectedYearGroupsForBulk(newSelected);
                                    }}
                                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                                      isSelected ? 'bg-[#4338E8] hover:bg-[#3529d1] text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                                    }`}
                                    title={`${isSelected ? 'Deselect' : 'Select'} ${yearGroup.name}`}
                                  >
                                    {yearGroup.name}
                                  </button>
                                );
                              }) : null}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-gray-500">
                                {selectedYearGroupsForBulk.size > 0 ? (
                                  <span className="text-[#4338E8] font-semibold">
                                    {selectedYearGroupsForBulk.size} year group{selectedYearGroupsForBulk.size !== 1 ? 's' : ''} selected
                                  </span>
                                ) : (
                                  <span>No year groups selected</span>
                                )}
                              </div>
                              {selectedYearGroupsForBulk.size > 0 && (
                                <button
                                  onClick={() => setSelectedYearGroupsForBulk(new Set())}
                                  className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                                >
                                  Clear Selection
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Step 2: Category Selection Status */}
                      <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Step 2: Select Categories Below
                        </label>
                        <div className="text-sm text-gray-600">
                          {selectedCategoriesForBulk.size > 0 ? (
                            <span className="text-[#4338E8] font-semibold">
                              {selectedCategoriesForBulk.size} categor{selectedCategoriesForBulk.size !== 1 ? 'ies' : 'y'} selected
                                </span>
                          ) : (
                            <span>Click on categories below to select them</span>
                          )}
                        </div>
                      </div>

                      {/* Step 3: Action Buttons */}
                      {selectedCategoriesForBulk.size > 0 && selectedYearGroupsForBulk.size > 0 && (
                        <div className="p-4 bg-white rounded-lg border-2 border-[#bcb7f4]">
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Step 3: Apply Changes
                          </label>
                          <div className="flex flex-wrap gap-3">
                                <button
                              onClick={async () => {
                                // Apply selected year groups to selected categories
                                const updatedCategories = tempCategories.map(cat => {
                                  if (selectedCategoriesForBulk.has(cat.name)) {
                                    const newYearGroups = { ...(cat.yearGroups || {}) };
                                    selectedYearGroupsForBulk.forEach(yearGroupKey => {
                                      newYearGroups[yearGroupKey] = true;
                                    });
                                    return {
                                      ...cat,
                                      yearGroups: newYearGroups
                                    };
                                  }
                                  return cat;
                                });
                                
                                setTempCategories(updatedCategories);
                                updateCategories(updatedCategories);
                                // Immediately sync to Supabase to ensure persistence
                                try {
                                  await forceSyncToSupabase({ categories: updatedCategories });
                                } catch (error) {
                                  console.error('❌ Failed to sync bulk year group assignment:', error);
                                }
                                setSelectedCategoriesForBulk(new Set());
                                setSelectedYearGroupsForBulk(new Set());
                                setBulkYearGroupMode(false);
                              }}
                              className="px-5 py-2.5 bg-[#4338E8] hover:bg-[#3529d1] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Assign Selected Year Groups
                                </button>
                                <button
                              onClick={async () => {
                                if (confirm('Remove all selected year groups from selected categories?')) {
                                  const updatedCategories = tempCategories.map(cat => {
                                    if (selectedCategoriesForBulk.has(cat.name)) {
                                      const newYearGroups = { ...(cat.yearGroups || {}) };
                                      selectedYearGroupsForBulk.forEach(yearGroupKey => {
                                        newYearGroups[yearGroupKey] = false;
                                      });
                                      return {
                                        ...cat,
                                        yearGroups: newYearGroups
                                      };
                                    }
                                    return cat;
                                  });
                                  
                                  setTempCategories(updatedCategories);
                                  updateCategories(updatedCategories);
                                  // Immediately sync to Supabase to ensure persistence
                                  try {
                                    await forceSyncToSupabase({ categories: updatedCategories });
                                  } catch (error) {
                                    console.error('❌ Failed to sync bulk year group removal:', error);
                                  }
                                  setSelectedCategoriesForBulk(new Set());
                                  setSelectedYearGroupsForBulk(new Set());
                                  setBulkYearGroupMode(false);
                                }
                              }}
                              className="px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2"
                            >
                              <X className="h-4 w-4" />
                              Remove Selected Year Groups
                                </button>
                              </div>
                        </div>
                          )}
                        </div>
                  )}

                  {/* Bulk Assignment Toggle Button */}
                  {!bulkYearGroupMode && (
                    <div className="mb-4 flex gap-2">
                      <button
                        onClick={() => { setBulkYearGroupMode(true); setBulkStep1Collapsed(false); }}
                        className="px-4 py-2 bg-[#4338E8] hover:bg-[#3529d1] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Filter className="h-4 w-4" />
                        Assign to classes…
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Clear which classes see every folder? This removes all class ticks from every folder. You can re-tick them afterwards.')) {
                            const emptyYearGroups: {[key: string]: boolean} = {};
                            customYearGroups.forEach((g) => {
                              emptyYearGroups[g.id] = false;
                              if (g.name) emptyYearGroups[g.name] = false;
                            });
                            // Also clear any leftover keys on each category
                            const updatedCategories = tempCategories.map(cat => {
                              const cleared: {[key: string]: boolean} = { ...emptyYearGroups };
                              Object.keys(cat.yearGroups || {}).forEach((k) => { cleared[k] = false; });
                              return { ...cat, yearGroups: cleared };
                            });
                            setTempCategories(updatedCategories);
                            updateCategories(updatedCategories);
                            // Immediately sync to Supabase to ensure persistence
                            try {
                              await forceSyncToSupabase({ categories: updatedCategories });
                            } catch (error) {
                              console.error('❌ Failed to sync clear all year groups:', error);
                            }
                          }
                        }}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                        title="Remove all year group assignments from all categories"
                      >
                        <X className="h-4 w-4" />
                        Clear all class ticks
                      </button>
                    </div>
                  )}
                  
                  <CategoryFoldersPanel
                    getCategoryCount={(folderName) =>
                      tempCategories.filter((c) =>
                        folderName ? c.group === folderName : !c.group
                      ).length
                    }
                    onAssignCategory={(categoryName, folderName) => {
                      const updated = tempCategoriesRef.current.map((c) =>
                        c.name === categoryName
                          ? { ...c, group: folderName || undefined, groups: undefined }
                          : c
                      );
                      tempCategoriesRef.current = updated;
                      setTempCategories(updated);
                      updateCategories(updated);
                    }}
                    renderFolderCategories={(folderName) => {
                      const inFolder = tempCategories
                        .map((category, index) => ({ category, index }))
                        .filter(({ category }) =>
                          folderName ? category.group === folderName : !category.group
                        );
                      const uncategorisedQueryNorm = uncategorisedQuery.trim().toLowerCase();
                      const visible =
                        !folderName && uncategorisedQueryNorm
                          ? inFolder.filter(({ category }) =>
                              category.name.toLowerCase().includes(uncategorisedQueryNorm)
                            )
                          : inFolder;
                      const folderKey = folderName ?? '';
                      return (
                        <>
                          {!folderName && (
                            <div className="space-y-2 pb-1">
                              <label htmlFor="uncategorised-category-search" className="sr-only">
                                Search uncategorised categories
                              </label>
                              <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                <input
                                  id="uncategorised-category-search"
                                  type="search"
                                  value={uncategorisedQuery}
                                  onChange={(e) => setUncategorisedQuery(e.target.value)}
                                  placeholder="Search not in a folder"
                                  className="w-full h-10 pl-8 pr-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4338E8] focus:outline-none"
                                />
                              </div>
                              {visible.length > 0 && (
                                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const allVisible = visible.every(({ category }) =>
                                        selectedUncategorisedNames.has(category.name)
                                      );
                                      setSelectedUncategorisedNames((prev) => {
                                        const next = new Set(prev);
                                        if (allVisible) {
                                          visible.forEach(({ category }) => next.delete(category.name));
                                        } else {
                                          visible.forEach(({ category }) => next.add(category.name));
                                        }
                                        return next;
                                      });
                                    }}
                                    className="inline-flex min-h-[40px] items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                                  >
                                    {visible.every(({ category }) => selectedUncategorisedNames.has(category.name))
                                      ? 'Clear visible'
                                      : 'Select visible'}
                                  </button>
                                  <label htmlFor="bulk-uncategorised-folder" className="text-xs font-medium text-gray-600">
                                    Move selected to
                                  </label>
                                  <CategoryFolderSelect
                                    id="bulk-uncategorised-folder"
                                    value={bulkFolderTarget}
                                    folders={categoryFolders}
                                    onChange={setBulkFolderTarget}
                                    emptyLabel="Choose folder"
                                    className="h-10 min-w-[8.5rem] flex-1 sm:flex-none px-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#4338E8] focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleBulkAssignUncategorised}
                                    disabled={selectedUncategorisedNames.size === 0 || !bulkFolderTarget}
                                    className="inline-flex min-h-[40px] items-center px-3 py-1.5 text-sm font-medium text-white bg-[#4338E8] hover:bg-[#3529d1] disabled:bg-[#bcb7f4] disabled:cursor-not-allowed rounded-lg"
                                  >
                                    Assign {selectedUncategorisedNames.size > 0 ? `(${selectedUncategorisedNames.size})` : ''}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          {visible.length === 0 ? (
                            <div className="min-h-[3rem] rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center py-3 px-2">
                              <p className="text-sm text-gray-500 text-center">
                                {!folderName && uncategorisedQueryNorm
                                  ? 'No categories match your search.'
                                  : 'No categories here. Use Add category below, or assign one with the Folder dropdown.'}
                              </p>
                            </div>
                          ) : (
                            visible.map(({ category, index }) => {
                      const isEditing = editingCategory === `category-index-${index}`;
                      
                      return (
                      <DraggableCategory
                        key={`category-${index}-${category.position || index}`}
                        category={category}
                        index={index}
                        onReorder={(dragIndex, hoverIndex) => {
                          if (dragIndex === hoverIndex) return;
                          const current = tempCategoriesRef.current;
                          if ((current[dragIndex]?.group || '') !== (current[hoverIndex]?.group || '')) return;
                          setTempCategories((prev) => {
                            const newCategories = [...prev];
                            const [removed] = newCategories.splice(dragIndex, 1);
                            newCategories.splice(hoverIndex, 0, removed);
                            const withPositions = newCategories.map((cat, i) =>
                              cat.position === i ? cat : { ...cat, position: i }
                            );
                            tempCategoriesRef.current = withPositions;
                            return withPositions;
                          });
                        }}
                        onDragEnd={() => {
                          updateCategories(tempCategoriesRef.current);
                        }}
                      >
                      <div 
                        className={`p-3 rounded-lg transition-colors duration-200 ${
                          bulkYearGroupMode && selectedCategoriesForBulk.has(category.name) ? 'bg-[#E9E6FF] border-[#bcb7f4] border-2' :
                          'bg-gray-50 hover:bg-gray-100'
                        } ${!bulkYearGroupMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
                      >
                        {isEditing ? (
                          <div className="flex flex-col space-y-3">
                            {/* Name and Color Row */}
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 cursor-move">
                              <GripVertical className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="flex-1 flex items-center space-x-3 min-w-0">
                              <input
                                id={`editCategoryName-${index}`}
                                name={`editCategoryName-${index}`}
                                type="text"
                                  value={tempCategories[index]?.name || ''}
                                onChange={(e) => {
                                  const updatedCategories = [...tempCategories];
                                  updatedCategories[index] = { ...updatedCategories[index], name: e.target.value };
                                  setTempCategories(updatedCategories);
                                    // Keep edit mode open by maintaining the index-based identifier
                                }}
                                onBlur={async () => {
                                  try {
                                    const updatedCategories = [...tempCategories];
                                    updatedCategories[index] = { ...updatedCategories[index], name: updatedCategories[index].name };
                                    setTempCategories(updatedCategories);
                                    await updateCategories(updatedCategories);
                                  } catch (error: unknown) {
                                    console.error('Failed to save category changes:', error);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const updatedCategories = [...tempCategories];
                                    updatedCategories[index] = { ...updatedCategories[index], name: updatedCategories[index].name };
                                    setTempCategories(updatedCategories);
                                    updateCategories(updatedCategories);
                                  } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    setEditingCategory(null);
                                    setTempCategories(categories);
                                  }
                                }}
                                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#4338E8] focus:border-transparent focus:outline-none"
                                dir="ltr"
                              />
                              <ColorPickerWithFavorites
                                id={`editCategoryColor-${index}`}
                                value={tempCategories[index]?.color || category.color}
                                onChange={(color) => {
                                  const updatedCategories = [...tempCategories];
                                  updatedCategories[index] = { ...updatedCategories[index], color };
                                  setTempCategories(updatedCategories);
                                  updateCategories(updatedCategories);
                                }}
                                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                              />
                              <button
                                  onClick={() => {
                                    updateCategories(tempCategories);
                                    setEditingCategory(null);
                                  }}
                                className="p-1.5 text-[#4338E8] hover:text-[#1F1B4D] hover:bg-[#E9E6FF] rounded-lg transition-colors duration-200"
                                  title="Save changes"
                              >
                                <Save className="h-5 w-5" />
                              </button>
                              </div>
                            </div>
                            
                            <div className="ml-8 pl-2 border-l-2 border-gray-200">
                              <label htmlFor={`editCategoryFolder-${index}`} className="block text-xs font-medium text-gray-700 mb-1">
                                Folder
                              </label>
                              <select
                                id={`editCategoryFolder-${index}`}
                                value={tempCategories[index]?.group || ''}
                                onChange={(e) => {
                                  const group = e.target.value || undefined;
                                  const updatedCategories = [...tempCategories];
                                  updatedCategories[index] = { ...updatedCategories[index], group, groups: undefined };
                                  setTempCategories(updatedCategories);
                                  updateCategories(updatedCategories);
                                }}
                                className="w-full max-w-xs px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4338E8] focus:border-transparent focus:outline-none"
                              >
                                <option value="">Not in a folder</option>
                                {[...categoryFolders].sort((a, b) => a.position - b.position).map((folder) => (
                                  <option key={folder.id} value={folder.name}>{folder.name}</option>
                                ))}
                              </select>
                            </div>

                            {/* Year Groups Editing Section */}
                            <div className="ml-8 pl-2 border-l-2 border-gray-200">
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Show for these classes
                              </label>
                              <div className="flex flex-wrap gap-3">
                                {customYearGroups && Array.isArray(customYearGroups) && customYearGroups.length > 0 ? customYearGroups.map(yearGroup => {
                                  // Use yearGroup.id consistently (which is the name from the API)
                                  const yearGroupKey = yearGroup.id || yearGroup.name;
                                  
                                  const categoryYearGroups = tempCategories[index]?.yearGroups || {};
                                  const isEnabled = categoryYearGroups[yearGroupKey] || false;
                                  return (
                                    <label key={yearGroup.id} className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={isEnabled}
                                        onChange={async (e) => {
                                          const updatedCategories = [...tempCategories];
                                          updatedCategories[index] = {
                                            ...updatedCategories[index],
                                            yearGroups: {
                                              ...(updatedCategories[index].yearGroups || {}),
                                              [yearGroupKey]: e.target.checked
                                            }
                                          };
                                          tempCategoriesRef.current = updatedCategories;
                                          setTempCategories(updatedCategories);
                                          updateCategories(updatedCategories);
                                          // Immediately sync to Supabase to ensure persistence
                                          console.log('🔄 Immediate sync triggered for year group assignment (edit mode):', {
                                            category: updatedCategories[index].name,
                                            yearGroupKey,
                                            checked: e.target.checked,
                                            yearGroups: updatedCategories[index].yearGroups
                                          });
                                          try {
                                            const synced = await forceSyncToSupabase({ categories: updatedCategories });
                                            if (synced) {
                                              console.log('✅ Immediate sync successful for year group assignment');
                                            } else {
                                              console.warn('⚠️ Immediate sync returned false');
                                            }
                                          } catch (error) {
                                            console.error('❌ Failed to sync year group assignment:', error);
                                          }
                                        }}
                                        className="rounded-full border border-gray-300 text-[#4338E8] focus:ring-[#4338E8] focus:ring-offset-0 checked:border-0 checked:bg-[#4338E8]"
                                      />
                                      <span className={`text-sm ${isEnabled ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                        {yearGroup.name}
                                      </span>
                                    </label>
                                  );
                                }) : <span className="text-sm text-gray-500">No year groups available</span>}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0 cursor-move pt-0.5">
                              <GripVertical className="h-5 w-5 text-gray-400" />
                            </div>
                            <div 
                                className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 border border-gray-200"
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2 flex-wrap" dir="ltr">
                                  <span>{category.name}</span>
                                  {isSystemCategory(category) ? (
                                    <span className="text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">App</span>
                                  ) : (
                                    <span className="text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded bg-[#E9E6FF] text-[#4338E8] border border-[#E2E0EF]">Mine</span>
                                  )}
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center mb-2">
                                  {!folderName && (
                                    <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                                      <input
                                        type="checkbox"
                                        checked={selectedUncategorisedNames.has(category.name)}
                                        onChange={(e) => {
                                          setSelectedUncategorisedNames((prev) => {
                                            const next = new Set(prev);
                                            if (e.target.checked) next.add(category.name);
                                            else next.delete(category.name);
                                            return next;
                                          });
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-[#4338E8] focus:ring-[#4338E8]"
                                      />
                                      <span>Select</span>
                                    </label>
                                  )}
                                  <label htmlFor={`view-folder-${index}`} className="text-xs font-medium text-gray-600">
                                    Folder
                                  </label>
                                  <CategoryFolderSelect
                                    id={`view-folder-${index}`}
                                    value={category.group || ''}
                                    folders={categoryFolders}
                                    onChange={(next) => assignCategoriesToFolder([category.name], next || null)}
                                  />
                                </div>
                                
                                {/* Year Groups Display */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {editingCategoryYearGroups === `category-index-${index}` ? (
                                  // Edit mode: show checkboxes for year groups - show ALL year groups
                                  <div className="flex flex-wrap gap-2 w-full">
                                    {customYearGroups && Array.isArray(customYearGroups) && customYearGroups.length > 0 ? customYearGroups.map(yearGroup => {
                                      // Use year group ID as the key (or name if ID not available)
                                      const yearGroupKey = yearGroup.id || yearGroup.name;
                                      
                                      const categoryYearGroups = category.yearGroups || {};
                                      const isEnabled = categoryYearGroups[yearGroupKey] === true;
                                      
                                      return (
                                        <label key={yearGroup.id || yearGroup.name} className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded hover:bg-gray-50">
                                          <input
                                            type="checkbox"
                                            checked={isEnabled}
                                            onChange={async (e) => {
                                          const updatedCategories = [...tempCategories];
                                          updatedCategories[index] = { 
                                            ...updatedCategories[index], 
                                                yearGroups: {
                                                  ...(updatedCategories[index].yearGroups || {}),
                                                  [yearGroupKey]: e.target.checked
                                                }
                                          };
                                          tempCategoriesRef.current = updatedCategories;
                                          setTempCategories(updatedCategories);
                                          updateCategories(updatedCategories);
                                          // Immediately sync to Supabase to ensure persistence
                                          console.log('🔄 Immediate sync triggered for year group assignment (view mode):', {
                                            category: updatedCategories[index].name,
                                            yearGroupKey,
                                            checked: e.target.checked,
                                            yearGroups: updatedCategories[index].yearGroups
                                          });
                                          try {
                                            const synced = await forceSyncToSupabase({ categories: updatedCategories });
                                            if (synced) {
                                              console.log('✅ Immediate sync successful for year group assignment');
                                            } else {
                                              console.warn('⚠️ Immediate sync returned false');
                                            }
                                          } catch (error) {
                                            console.error('❌ Failed to sync year group assignment:', error);
                                          }
                                        }}
                                            className="rounded-full border border-gray-300 text-[#4338E8] focus:ring-[#4338E8] focus:ring-offset-0 checked:border-0 checked:bg-[#4338E8]"
                                          />
                                          <span className={`text-xs ${isEnabled ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{yearGroup.name}</span>
                                        </label>
                                      );
                                    }) : null}
                                    <div className="flex gap-2 items-center w-full mt-2">
                                      <button
                                        onClick={async () => {
                                        const updatedCategories = [...tempCategories];
                                          updatedCategories[index] = { 
                                            ...updatedCategories[index], 
                                            yearGroups: {} // Clear all year group assignments
                                          };
                                          tempCategoriesRef.current = updatedCategories;
                                          setTempCategories(updatedCategories);
                                          updateCategories(updatedCategories);
                                          // Immediately sync to Supabase to ensure persistence
                                          try {
                                            await forceSyncToSupabase({ categories: updatedCategories });
                                          } catch (error) {
                                            console.error('❌ Failed to sync year group assignment clear:', error);
                                          }
                                        }}
                                        className="text-xs text-red-600 hover:text-red-800 px-2 py-1 hover:bg-red-50 rounded"
                                        title="Remove all year group assignments"
                                      >
                                        Clear All
                                      </button>
                                      <button
                                        onClick={() => {
                                          console.log('✅ Closing edit mode for category:', category.name);
                                          setEditingCategoryYearGroups(null);
                                        }}
                                        className="text-xs text-[#4338E8] hover:text-[#1F1B4D] px-2 py-1 hover:bg-[#E9E6FF] rounded font-medium"
                                      >
                                        Done
                                      </button>
                                </div>
                              </div>
                                ) : (
                                  // View mode: show year group tags and edit button
                                  <>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {customYearGroups && Array.isArray(customYearGroups) ? customYearGroups
                                        .filter(yearGroup => {
                                          // Use yearGroup.id consistently (which is the name from the API)
                                          const yearGroupKey = yearGroup.id || yearGroup.name;
                                          return category.yearGroups?.[yearGroupKey] === true;
                                        })
                                        .map(yearGroup => (
                                          <span 
                                            key={yearGroup.id} 
                                            className="px-2 py-1 bg-[#E9E6FF] text-[#1F1B4D] text-xs font-medium rounded-full"
                                            title={yearGroup.name}
                                          >
                                            {yearGroup.name}
                                          </span>
                                        )) : null}
                                      {(!category.yearGroups || Object.values(category.yearGroups).every(v => !v)) && (
                                        <span className="text-xs text-gray-400 italic">No year groups assigned</span>
                                      )}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('🔄 Opening edit mode for category:', category.name, 'index:', index);
                                        setEditingCategoryYearGroups(`category-index-${index}`);
                                      }}
                                      className="px-2 py-1 bg-[#E9E6FF] text-[#4338E8] text-xs font-medium rounded-full hover:bg-[#E9E6FF] transition-colors border border-[#E2E0EF] mt-1"
                                      title="Click to assign or edit year groups"
                                    >
                                      {(!category.yearGroups || Object.values(category.yearGroups).every(v => !v)) 
                                        ? '+ Assign Year Groups' 
                                        : 'Edit Year Groups'}
                                    </button>
                                  </>
                                  )}
                            </div>
                              </div>
                            </div>
                            {/* Edit/Delete Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {bulkYearGroupMode ? (
                                <input
                                  type="checkbox"
                                  checked={selectedCategoriesForBulk.has(category.name)}
                                  onChange={(e) => {
                                    const newSelected = new Set(selectedCategoriesForBulk);
                                    if (e.target.checked) {
                                      newSelected.add(category.name);
                                    } else {
                                      newSelected.delete(category.name);
                                    }
                                    setSelectedCategoriesForBulk(newSelected);
                                  }}
                                  className="w-4 h-4 rounded-full border border-gray-300 text-[#4338E8] focus:ring-[#4338E8] focus:ring-offset-0 checked:border-0 checked:bg-[#4338E8]"
                                />
                              ) : (
                                <>
                              <button
                                    onClick={() => setEditingCategory(`category-index-${index}`)}
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              {!isSystemCategory(category) && (
                              <button
                                onClick={() => handleDeleteCategory(index)}
                                disabled={profile?.admin_preset_categories?.includes(category.name) === true}
                                title={profile?.admin_preset_categories?.includes(category.name) ? 'Assigned by admin; cannot remove' : 'Delete category'}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      </DraggableCategory>
                      );
                    })
                          )}
                          {addInFolderName === folderKey ? (
                            <div className="p-3 rounded-lg border border-[#E2E0EF] bg-[#E9E6FF]/60 space-y-3">
                              <p className="text-sm font-medium text-gray-900">
                                Add item{folderName ? ` to ${folderName}` : ' (not in a folder)'}
                              </p>
                              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                                <div className="flex-1">
                                  <label htmlFor={`inline-cat-name-${folderKey || 'uncategorised'}`} className="block text-xs font-medium text-gray-600 mb-1">
                                    Category name
                                  </label>
                                  <input
                                    id={`inline-cat-name-${folderKey || 'uncategorised'}`}
                                    value={inlineNewCategoryName}
                                    onChange={(e) => setInlineNewCategoryName(e.target.value)}
                                    placeholder="Category name"
                                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4338E8] focus:outline-none"
                                  />
                                </div>
                                <ColorPickerWithFavorites
                                  value={inlineNewCategoryColor}
                                  onChange={setInlineNewCategoryColor}
                                  className="h-10 w-12 rounded-lg border border-gray-300 cursor-pointer"
                                />
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => void handleAddCategoryInFolder(folderKey)}
                                  disabled={!inlineNewCategoryName.trim()}
                                  className="inline-flex min-h-[40px] items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#4338E8] hover:bg-[#3529d1] disabled:bg-[#bcb7f4] rounded-lg"
                                >
                                  <Plus className="h-4 w-4" /> Add
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddInFolderName(null);
                                    setInlineNewCategoryName('');
                                    setInlineNewCategoryColor('#6B7280');
                                  }}
                                  className="inline-flex min-h-[40px] items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setAddInFolderName(folderKey);
                                setNewCategoryFolder(folderKey);
                              }}
                              className="inline-flex min-h-[40px] w-full sm:w-auto items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#4338E8] bg-[#E9E6FF] hover:bg-[#E9E6FF] rounded-lg"
                            >
                              <Plus className="h-4 w-4" /> Add category
                            </button>
                          )}
                        </>
                      );
                    }}
                  />
                </div>
              </div>

            </>
          )}

          {activeTab === 'data' && isAdmin && (
            <div className="space-y-6">
              <DataSourceSettings embedded={true} />
            </div>
          )}

          {activeTab === 'manage-packs' && (
            <div className="space-y-6">
              {/* Activity Packs Management */}
              <div className="border border-[#E2E0EF] bg-gradient-to-br from-[#E9E6FF] to-[#F4F3FA] rounded-lg p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <Package className="h-6 w-6 text-[#4338E8]" />
                  <h3 className="text-lg font-semibold text-gray-900">Activity Packs Management</h3>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Create and manage activity packs. Link categories to packs and assign access to users — every pack is free.
                </p>
                
                <ActivityPacksAdmin userEmail={user?.email || ''} isCreator={isCreator} isAdmin={isAdmin} />
              </div>
            </div>
          )}

          {activeTab === 'system-categories' && canEditSystemCategories && (
            <div className="space-y-6">
              <SystemCategoriesAdmin />
            </div>
          )}

          {activeTab === 'resource-links' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-[#E2E0EF] bg-white p-4 sm:p-5">
                  <h3 className="text-[15px] font-extrabold text-[#1F1B4D]">School name</h3>
                  <p className="mt-1 text-[13px] font-medium text-[#5C5878]">Shown where the app refers to your school. Saves as you type.</p>
                  <input
                    type="text"
                    value={tempSettings.schoolName || ''}
                    onChange={(e) => {
                      const schoolName = e.target.value;
                      setTempSettings((prev) => ({ ...prev, schoolName }));
                      updateSettings({ schoolName });
                    }}
                    onBlur={() => toastSettingsSaved('School name saved')}
                    placeholder="e.g. Oaklands Primary"
                    className="mt-3 w-full rounded-xl border border-[#E2E0EF] bg-[#FAFAFC] px-3 py-2.5 text-[15px] text-[#1F1B4D] focus:border-[#4338E8] focus:outline-none focus:ring-2 focus:ring-[#4338E8]/30"
                  />
                </div>

                <div className="rounded-2xl border border-[#E2E0EF] bg-white p-4 sm:p-5">
                  <h3 className="text-[15px] font-extrabold text-[#1F1B4D]">Button tips</h3>
                  <p className="mt-1 text-[13px] font-medium text-[#5C5878]">Short explanations when you hover toolbar buttons.</p>
                  <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-[#E2E0EF] bg-[#FAFAFC] px-3 py-3">
                    <input
                      type="checkbox"
                      checked={settings.showButtonHelp !== false}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setTempSettings((prev) => ({ ...prev, showButtonHelp: checked }));
                        updateSettings({ showButtonHelp: checked });
                        toastSettingsSaved(checked ? 'Hover tips on' : 'Hover tips off');
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-[#4338E8] focus:ring-[#4338E8]"
                    />
                    <span className="text-[15px] font-semibold text-[#1F1B4D]">Show hover help for buttons</span>
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E2E0EF] bg-white p-4 sm:p-5">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-[15px] font-extrabold text-[#1F1B4D]">Activity resource labels</h3>
                    <p className="mt-1 text-[13px] font-medium text-[#5C5878]">
                      Names and icons for links on an activity. Changes save automatically.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Reset resource labels to the defaults?')) {
                        resetResourceLinksToDefaults();
                        setTempResourceLinks(resourceLinks);
                        toastSettingsSaved('Resource labels reset');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#4338E8] hover:bg-[#E9E6FF]"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </button>
                </div>

                <div className="ss-settings-resource-grid mt-4">
                  {tempResourceLinks.map((link, index) => {
                    const IconComponent = getIconComponent(link.iconName);
                    const persist = (updated: ResourceLinkConfig[]) => {
                      setTempResourceLinks(updated);
                      updateResourceLinks(updated);
                    };
                    return (
                      <div key={link.key} className="ss-settings-resource-tile">
                        <div className="flex items-center gap-2">
                          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#E9E6FF] text-[#4338E8]">
                            <IconComponent className="h-4 w-4" />
                          </span>
                          <select
                            value={link.iconName}
                            onChange={(e) => {
                              const updated = [...tempResourceLinks];
                              updated[index] = { ...updated[index], iconName: e.target.value };
                              persist(updated);
                              toastSettingsSaved('Icon saved');
                            }}
                            className="min-w-0 flex-1 rounded-lg border border-[#E2E0EF] bg-white px-2 py-1.5 text-[13px] font-medium focus:border-[#4338E8] focus:outline-none focus:ring-2 focus:ring-[#4338E8]/30"
                            aria-label={`Icon for ${link.key}`}
                          >
                            {getAvailableIcons().map((icon) => (
                              <option key={icon.name} value={icon.name}>{icon.label}</option>
                            ))}
                          </select>
                        </div>
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => {
                            const updated = [...tempResourceLinks];
                            updated[index] = { ...updated[index], label: e.target.value };
                            persist(updated);
                          }}
                          onBlur={() => toastSettingsSaved('Label saved')}
                          className="mt-2 w-full rounded-lg border border-[#E2E0EF] bg-white px-3 py-2 text-[14px] font-medium text-[#1F1B4D] focus:border-[#4338E8] focus:outline-none focus:ring-2 focus:ring-[#4338E8]/30"
                          placeholder="Label"
                          aria-label={`Label for ${link.key}`}
                        />
                        <label className="mt-2 flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-[#1F1B4D]">
                          <input
                            type="checkbox"
                            checked={link.enabled}
                            onChange={(e) => {
                              const updated = [...tempResourceLinks];
                              updated[index] = { ...updated[index], enabled: e.target.checked };
                              persist(updated);
                              toastSettingsSaved(e.target.checked ? 'Link shown' : 'Link hidden');
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-[#4338E8] focus:ring-[#4338E8]"
                          />
                          Show on activities
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-[#E2E0EF] bg-[#FAFAFC] p-4 text-[13px] font-medium text-[#5C5878]">
                <p className="text-[15px] font-extrabold text-[#1F1B4D]">Looking for timetable or half-terms?</p>
                <p className="mt-1">
                  Weekly slots live in <strong>Planner → Timetable</strong>. The year map is under <strong>Half-terms</strong> in the sidebar. Partner organisations are under <strong>Partner Hubs</strong>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div ref={adminTabContentRef} className="flex min-h-0 w-full flex-1 flex-col">
              <CustomObjectivesAdmin embedded={true} />
            </div>
          )}

          {activeTab === 'my-downloads' && (
            <MyDownloads />
          )}

          {activeTab === 'download-analytics' && showDownloadAnalytics && (
            <DownloadAnalytics />
          )}

          {activeTab === 'hub-admin' && showHubAdmin && (
            <HubAdminDashboard embedded />
          )}

          {activeTab === 'users' && showUserManagement && (
            <div className="ss-settings-users-panel min-h-0 flex-1">
              <UserManagement />
            </div>
          )}
          {activeTab === 'users' && !showUserManagement && (
            <div className="rounded-2xl border border-[#E2E0EF] bg-white p-6 text-[14px] font-medium text-[#5C5878]">
              You don’t have permission to manage users.
            </div>
          )}

          {activeTab === 'hub-content' && isAdmin && (
            <div className="space-y-4">
              <MyHubAdministration />
              <MusicHubAdminPanel
                organisationFilter={null}
                canAddOrganisations={canAddSubscriberOrgs}
              />
              <div className="border border-[#E2E0EF] bg-gradient-to-br from-[#E9E6FF] to-[#F4F3FA] rounded-lg p-6 shadow-sm">
                <HubContentApprovalQueue />
              </div>
            </div>
          )}

          {activeTab === 'branding' && isAdmin && (
            <div className="border border-[#E2E0EF] bg-gradient-to-br from-[#E9E6FF] to-[#F4F3FA] rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Palette className="h-6 w-6 text-[#4338E8]" />
                  <h3 className="text-lg font-semibold text-gray-900">White-label Branding</h3>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Reset branding to defaults (Rhythmstix)?')) {
                      const defaults = {
                        logoLetters: 'CCD',
                        loginTitle: 'Creative Curriculum Designer',
                        loginSubtitle: 'From Rhythmstix',
                        loginSubtitleUrl: 'https://www.rhythmstix.co.uk',
                        loginBackgroundColor: 'rgb(77, 181, 168)',
                        loginButtonColor: '#008272',
                        footerCompanyName: 'Rhythmstix',
                        footerCopyrightYear: '2026',
                        footerContactEmail: 'rob@rhythmstix.co.uk',
                        footerPrivacyUrl: 'https://www.rhythmstix.co.uk/policy',
                        footerBackgroundColor: '#4338E8',
                        showSocialMedia: true,
                        footerSocialLinks: [
                          { platform: 'youtube', url: 'https://www.youtube.com/channel/UCooHhU7FKALUQ4CtqjDFMsw' },
                          { platform: 'linkedin', url: 'https://www.linkedin.com/in/robert-reich-storer-974449144' },
                          { platform: 'facebook', url: 'https://www.facebook.com/Rhythmstix-Music-108327688309431' },
                        ]
                      };
                      updateSettings({ branding: defaults });
                      setTempSettings(prev => ({ ...prev, branding: defaults }));
                      toast.success('Branding reset to defaults');
                    }
                  }}
                  className="px-3 py-1.5 text-sm text-[#4338E8] hover:text-[#3529d1] hover:bg-[#E9E6FF] rounded-lg transition-colors flex items-center space-x-1"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset to defaults</span>
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Customize product name, login page, and footer for client deployments. Your main app stays as-is until you change these. Changes are saved locally for this deployment.
              </p>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800">Login page</h4>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Logo letters (max 3)</label>
                    <input
                      type="text"
                      maxLength={3}
                      value={(tempSettings.branding?.logoLetters ?? '').slice(0, 3)}
                      onChange={e => {
                        const val = e.target.value.slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
                        setTempSettings(prev => ({ ...prev, branding: { ...prev.branding, logoLetters: val || 'CCD' } }));
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 max-w-[6rem]"
                      placeholder="CCD"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Product name (title)</label>
                    <input
                      type="text"
                      value={tempSettings.branding?.loginTitle ?? ''}
                      onChange={e => setTempSettings(prev => ({ ...prev, branding: { ...prev.branding, loginTitle: e.target.value } }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Creative Curriculum Designer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Subtitle (e.g. From Rhythmstix)</label>
                    <input
                      type="text"
                      value={tempSettings.branding?.loginSubtitle ?? ''}
                      onChange={e => setTempSettings(prev => ({ ...prev, branding: { ...prev.branding, loginSubtitle: e.target.value } }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="From Rhythmstix"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Subtitle link URL</label>
                    <input
                      type="text"
                      value={tempSettings.branding?.loginSubtitleUrl ?? ''}
                      onChange={e => setTempSettings(prev => ({ ...prev, branding: { ...prev.branding, loginSubtitleUrl: e.target.value } }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="https://www.rhythmstix.co.uk"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Login background color</label>
                    <input
                      type="text"
                      value={tempSettings.branding?.loginBackgroundColor ?? ''}
                      onChange={e => setTempSettings(prev => ({ ...prev, branding: { ...prev.branding, loginBackgroundColor: e.target.value } }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="rgb(77, 181, 168)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Login button color</label>
                    <input
                      type="text"
                      value={tempSettings.branding?.loginButtonColor ?? ''}
                      onChange={e => setTempSettings(prev => ({ ...prev, branding: { ...prev.branding, loginButtonColor: e.target.value } }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="#008272"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800">Footer</h4>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Company name (footer, PDFs, share links)</label>
                    <input
                      type="text"
                      value={tempSettings.branding?.footerCompanyName ?? ''}
                      onChange={e => setTempSettings(prev => ({ ...prev, branding: { ...prev.branding, footerCompanyName: e.target.value } }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Rhythmstix"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Copyright year</label>
                    <input
                      type="text"
                      value={tempSettings.branding?.footerCopyrightYear ?? ''}
                      onChange={e => setTempSettings(prev => ({ ...prev, branding: { ...prev.branding, footerCopyrightYear: e.target.value } }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="2026"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Contact email</label>
                    <input
                      type="email"
                      value={tempSettings.branding?.footerContactEmail ?? ''}
                      onChange={e => setTempSettings(prev => ({ ...prev, branding: { ...prev.branding, footerContactEmail: e.target.value } }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="rob@rhythmstix.co.uk"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Privacy policy URL</label>
                    <input
                      type="url"
                      value={tempSettings.branding?.footerPrivacyUrl ?? ''}
                      onChange={e => setTempSettings(prev => ({ ...prev, branding: { ...prev.branding, footerPrivacyUrl: e.target.value } }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Footer background color</label>
                    <input
                      type="text"
                      value={tempSettings.branding?.footerBackgroundColor ?? ''}
                      onChange={e => setTempSettings(prev => ({ ...prev, branding: { ...prev.branding, footerBackgroundColor: e.target.value } }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="#4338E8"
                    />
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={tempSettings.branding?.showSocialMedia !== false}
                      onChange={e => setTempSettings(prev => ({ ...prev, branding: { ...prev.branding, showSocialMedia: e.target.checked } }))}
                    />
                    <span className="text-sm text-gray-600">Show social media icons in footer</span>
                  </label>
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Social media links</h5>
                    <p className="text-xs text-gray-500 mb-2">Add, edit, or remove links. Each link shows its platform icon in the footer.</p>
                    {(tempSettings.branding?.footerSocialLinks ?? []).map((link, idx) => (
                      <div key={idx} className="flex items-center gap-2 mb-2">
                        <select
                          value={link.platform}
                          onChange={e => {
                            const next = [...(tempSettings.branding?.footerSocialLinks ?? [])];
                            next[idx] = { ...next[idx], platform: e.target.value };
                            setTempSettings(prev => ({ ...prev, branding: { ...prev.branding, footerSocialLinks: next } }));
                          }}
                          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-36"
                        >
                          {SOCIAL_PLATFORMS.map(p => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                          ))}
                        </select>
                        <input
                          type="url"
                          value={link.url}
                          onChange={e => {
                            const next = [...(tempSettings.branding?.footerSocialLinks ?? [])];
                            next[idx] = { ...next[idx], url: e.target.value };
                            setTempSettings(prev => ({ ...prev, branding: { ...prev.branding, footerSocialLinks: next } }));
                          }}
                          placeholder="https://..."
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = (tempSettings.branding?.footerSocialLinks ?? []).filter((_, i) => i !== idx);
                            setTempSettings(prev => ({ ...prev, branding: { ...prev.branding, footerSocialLinks: next } }));
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          aria-label="Remove link"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...(tempSettings.branding?.footerSocialLinks ?? []), { platform: 'youtube', url: '' }];
                        setTempSettings(prev => ({ ...prev, branding: { ...prev.branding, footerSocialLinks: next } }));
                      }}
                      className="flex items-center gap-1.5 text-sm text-[#4338E8] hover:text-[#3529d1]"
                    >
                      <Plus className="h-4 w-4" />
                      Add social link
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateSettings(tempSettings);
                    toastSettingsSaved('Login & footer saved');
                  }}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[#4338E8] px-4 text-[13px] font-extrabold text-white hover:bg-[#3529d1]"
                >
                  Save login &amp; footer
                </button>
                <p className="text-xs text-[#77738F]">Saves for this school deployment.</p>
              </div>
            </div>
          )}

    </div>
  );
}
