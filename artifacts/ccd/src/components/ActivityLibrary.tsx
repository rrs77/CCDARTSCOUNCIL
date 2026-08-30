import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Plus, 
  BookOpen, 
  Clock, 
  Tag,
  ArrowUpDown,
  ArrowDownUp,
  Eye,
  Upload,
  Download,
  Trash2,
  RotateCcw,
  Edit3,
  Copy,
  Type,
  Star,
  ChevronDown,
  ChevronRight,
  Undo2,
  Redo2,
} from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { ActivityDetails } from './ActivityDetails';
import { ActivityDetailsModal } from './ActivityDetailsModal';
import { openActivityResource } from '../utils/openActivityResource';
import { isLsoLibraryCategory, LSO_LOGO_SRC } from '../utils/lsoBranding';
import { isRohLibraryCategory, ROH_LOGO_SRC } from '../utils/rohBranding';
import { isWtdLibraryCategory, WTD_LOGO_SRC } from '../utils/wtdBranding';
import { ActivityImporter } from './ActivityImporter';
import { ActivityCreator } from './ActivityCreator';
import { SimpleNestedCategoryDropdown } from './SimpleNestedCategoryDropdown';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { useAuth } from '../hooks/useAuth';
import { useIsViewOnly } from '../hooks/useIsViewOnly';
import { activityPacksApi } from '../config/api';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import type { Activity } from '../contexts/DataContext';
import {
  activityMatchesSelectedLibraryCategory,
  activityVisibleForYearGroup,
} from '../utils/activityLibraryCategories';
import {
  categoryAssignedToYearGroupKeys,
  resolveYearGroupMatchKeys,
} from '../utils/yearGroupMatchKeys';
import { isDemoModeActive } from '../utils/demoMode';
import {
  CCD_ACTIVITY_STARS_UPDATED_EVENT,
  getActivityStarKey,
  readLocalStarPrefs,
  writeLocalStarPrefs,
} from '../utils/activityStars';
import { readHubSeededActivitiesFromLocal } from '../utils/hubSeedLocal';
import { PartnerPlanningPanel } from './partners/PartnerPlanningPanel';
import { partnerPlanningProjectKey } from '../utils/partnerPlanning';
import { ActivityLibraryWelcomeModal } from './ActivityLibraryWelcomeModal';
import { ACTIVITY_LIBRARY_WELCOME_STORAGE_KEY } from './login/prototypeCopy';

/**
 * True when curated demo/hub seed packs are present in the session store.
 * Keep star prefs in the session (do not overwrite with / push to production).
 */
function hasLocalHubSeedMarkers(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      if (
        /^ccd-(roh|lso|wtd|ks3|ocr)-.*seeded/.test(k) &&
        localStorage.getItem(k) === '1'
      )
        return true;
    }
    return readHubSeededActivitiesFromLocal().length > 0;
  } catch {
    return false;
  }
}

interface ActivityLibraryProps {
  onActivitySelect: (activity: Activity) => void;
  selectedActivities: Activity[];
  className: string;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
}

type ActivityHistoryAction =
  | { type: 'create'; after: Activity }
  | { type: 'delete'; before: Activity }
  | { type: 'update'; before: Activity; after: Activity };

export function ActivityLibrary({ 
  onActivitySelect, 
  selectedActivities, 
  className,
  selectedCategory = 'all',
  onCategoryChange
}: ActivityLibraryProps) {
  const isViewOnly = useIsViewOnly();
  const { 
    allActivities, 
    addActivity, 
    updateActivity, 
    deleteActivity, 
    loading: dataLoading, 
    refreshData,
    currentSheetInfo
  } = useData();
  const { getCategoryColor, categories, updateCategories, customYearGroups, mapActivityLevelToYearGroup } = useSettings();
  
  const normalizeKey = React.useCallback((value: string | undefined | null) => (value || '').trim().toLowerCase(), []);

  // Keys that match Settings category.yearGroups ticks + activity tags (id/name/aliases).
  const getCurrentYearGroupKeys = React.useCallback((): string[] => {
    const sheetId = className || currentSheetInfo?.sheet;
    return resolveYearGroupMatchKeys(sheetId, customYearGroups);
  }, [className, currentSheetInfo, customYearGroups]);
  
  // Categories assigned to current year group (alias-aware: LKG↔Lower Kindergarten, Year6↔Year 6).
  const availableCategoriesForYearGroup = React.useMemo(() => {
    if (!categories || categories.length === 0) {
      if (import.meta.env.DEV) console.log('📚 ActivityLibrary: No categories available');
      return null;
    }
    
    const currentYearGroupKey = className || currentSheetInfo?.sheet;
    
    if (!currentYearGroupKey) {
      if (import.meta.env.DEV) console.log('📚 ActivityLibrary: No year group selected, showing NO categories');
      return [];
    }

    // Prefer loaded year groups, but still resolve aliases from the sheet id alone
    // so EYFS/Year 6 visibility is not blocked while bands finish loading.
    const keysToCheck = getCurrentYearGroupKeys();
    if (keysToCheck.length === 0) {
      if (import.meta.env.DEV) console.log('📚 ActivityLibrary: No year group keys yet');
      return [];
    }
    
    if (import.meta.env.DEV) console.log('📚 Category Filtering:', {
      currentYearGroupKey,
      keysToCheck,
      totalCategories: categories.length
    });
    
    const filteredCategories = categories.filter((category) => {
      if (!category?.name) return false;
      const isAssigned = categoryAssignedToYearGroupKeys(category.yearGroups, keysToCheck);
      if (import.meta.env.DEV) {
        if (isAssigned) console.log(`✅ Category "${category.name}" assigned for`, currentYearGroupKey);
        else if (category.yearGroups && Object.values(category.yearGroups).some((v) => v === true)) {
          console.log(`❌ Category "${category.name}" NOT assigned. Has:`, category.yearGroups, 'Need:', keysToCheck);
        }
      }
      return isAssigned;
    });
    
    const categoryNames = [...new Set(filteredCategories.flatMap(c => {
      const name = c.name;
      if (name === 'Vocal Warm-Ups' || name === 'Vocal Warmups') return ['Vocal Warmups', 'Vocal Warm-Ups'];
      return [name];
    }))];
    
    if (import.meta.env.DEV) console.log(`📚 Filtering Result: ${categoryNames.length} categories for "${currentYearGroupKey}":`, categoryNames);
    
    // Empty list still allows activity-tag fallback via activityVisibleForYearGroup
    return categoryNames;
  }, [categories, className, currentSheetInfo, getCurrentYearGroupKeys]);
  
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchQuery(searchQuery), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);
  const [localSelectedCategory, setLocalSelectedCategory] = useState(selectedCategory);
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'time' | 'level'>('category');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  // Default to the lightweight list view on small screens. The grid view renders
  // each ActivityCard with rich-text (dangerouslySetInnerHTML) descriptions, and on
  // iOS Safari rendering hundreds of those at once exceeds the per-page memory
  // budget and triggers the "A problem repeatedly occurred" crash. List view keeps
  // each card to ~3 elements (title + time + buttons), which mobile handles cleanly.
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window === 'undefined') return 'grid';
    return window.matchMedia('(max-width: 640px)').matches ? 'list' : 'grid';
  });
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [selectedActivityDetails, setSelectedActivityDetails] = useState<Activity | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivityForModal, setSelectedActivityForModal] = useState<Activity | null>(null);
  const [initialResource, setInitialResource] = useState<{url: string, title: string, type: string} | null>(null);
  const [showImporter, setShowImporter] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [userOwnedPacks, setUserOwnedPacks] = useState<string[]>([]);
  const [topicsExpanded, setTopicsExpanded] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [historyUndoStack, setHistoryUndoStack] = useState<ActivityHistoryAction[]>([]);
  const [historyRedoStack, setHistoryRedoStack] = useState<ActivityHistoryAction[]>([]);
  const [isApplyingHistory, setIsApplyingHistory] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [partnerSelectedActivityKeys, setPartnerSelectedActivityKeys] = useState<string[]>([]);
  const [partnerSelectedProjectKeys, setPartnerSelectedProjectKeys] = useState<string[]>([]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(ACTIVITY_LIBRARY_WELCOME_STORAGE_KEY) === '1') return;
    } catch {
      // still show
    }
    setShowWelcomeModal(true);
  }, []);

  const dismissWelcomeModal = () => {
    try {
      sessionStorage.setItem(ACTIVITY_LIBRARY_WELCOME_STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setShowWelcomeModal(false);
  };

  const [starredIds, setStarredIds] = useState<Set<string>>(() => new Set(readLocalStarPrefs().starredIds));
  const [globalStarredFirst, setGlobalStarredFirst] = useState(() => readLocalStarPrefs().globalStarredFirst);
  const [starredFirstCategories, setStarredFirstCategories] = useState<Set<string>>(
    () => new Set(readLocalStarPrefs().starredFirstCategories),
  );
  const [hasLoadedStarPrefs, setHasLoadedStarPrefs] = useState(false);

  // Partner hub seeds write stars to localStorage — keep React state in sync.
  useEffect(() => {
    const applyLocal = () => {
      const local = readLocalStarPrefs();
      setStarredIds(new Set(local.starredIds));
      setStarredFirstCategories(new Set(local.starredFirstCategories));
      setGlobalStarredFirst(local.globalStarredFirst);
    };
    const onStarsUpdated = () => applyLocal();
    window.addEventListener(CCD_ACTIVITY_STARS_UPDATED_EVENT, onStarsUpdated);
    return () => window.removeEventListener(CCD_ACTIVITY_STARS_UPDATED_EVENT, onStarsUpdated);
  }, []);

  useEffect(() => {
    const loadStarPrefsFromSupabase = async () => {
      // Demo / hub seed packs: keep star prefs in the session store — never
      // pull production profile stars over curated demo stars.
      if (isDemoModeActive() || hasLocalHubSeedMarkers() || !user?.id || !isSupabaseConfigured()) {
        setHasLoadedStarPrefs(true);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('starred_activity_ids, starred_first_activity_categories, starred_first_activity_global')
          .eq('id', user.id)
          .maybeSingle();
        if (error) {
          if (import.meta.env.DEV) console.warn('Failed to load star prefs from Supabase:', error);
          setHasLoadedStarPrefs(true);
          return;
        }

        const remoteStarredIds = Array.isArray(data?.starred_activity_ids)
          ? (data?.starred_activity_ids || []).map(String)
          : null;
        const remoteStarredCategories = Array.isArray(data?.starred_first_activity_categories)
          ? (data?.starred_first_activity_categories || []).map(String)
          : null;
        const remoteGlobal = typeof data?.starred_first_activity_global === 'boolean'
          ? data.starred_first_activity_global
          : null;

        // Union with local so hub-seeded stars are not wiped by an empty/older remote.
        if (remoteStarredIds) {
          setStarredIds((prev) => new Set([...prev, ...remoteStarredIds]));
        }
        if (remoteStarredCategories) {
          setStarredFirstCategories((prev) => new Set([...prev, ...remoteStarredCategories]));
        }
        if (remoteGlobal === true) setGlobalStarredFirst(true);
      } catch (e) {
        if (import.meta.env.DEV) console.warn('Error loading star prefs from Supabase:', e);
      } finally {
        setHasLoadedStarPrefs(true);
      }
    };

    loadStarPrefsFromSupabase();
  }, [user?.id]);

  useEffect(() => {
    if (!hasLoadedStarPrefs) return;
    // Always mirror to localStorage (hub seeds + offline / demo).
    writeLocalStarPrefs({
      starredIds: [...starredIds],
      starredFirstCategories: [...starredFirstCategories],
      globalStarredFirst,
    });
    // Demo / hub seed packs: do not sync star prefs to production Supabase.
    if (isDemoModeActive() || hasLocalHubSeedMarkers() || !user?.id || !isSupabaseConfigured()) return;
    const timeout = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            starred_activity_ids: [...starredIds],
            starred_first_activity_categories: [...starredFirstCategories],
            starred_first_activity_global: globalStarredFirst,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        if (error && import.meta.env.DEV) {
          console.warn('Failed to save star prefs to Supabase:', error);
        }
      } catch (e) {
        if (import.meta.env.DEV) console.warn('Error saving star prefs to Supabase:', e);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [hasLoadedStarPrefs, user?.id, starredIds, starredFirstCategories, globalStarredFirst]);

  const toggleActivityStarred = React.useCallback((activity: Activity) => {
    const key = getActivityStarKey(activity);
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleStarredFirstForCategory = React.useCallback((categoryName: string) => {
    setStarredFirstCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) next.delete(categoryName);
      else next.add(categoryName);
      return next;
    });
  }, []);

  // Sync local category with prop
  React.useEffect(() => {
    setLocalSelectedCategory(selectedCategory);
  }, [selectedCategory]);

  // When the selected class/year group changes, clear library filters so
  // users immediately see activities for the newly selected class.
  React.useEffect(() => {
    setLocalSelectedCategory('all');
    setSelectedTopic('all');
    if (onCategoryChange) onCategoryChange('all');
  }, [className, currentSheetInfo?.sheet, onCategoryChange]);

  // Load user's owned packs (purchases + admin-preset packs; user cannot remove admin presets)
  React.useEffect(() => {
    const loadUserPacks = async () => {
      if (user?.email) {
        try {
          const purchased = await activityPacksApi.getUserPurchases(user.email);
          const preset = profile?.admin_preset_activity_pack_ids ?? [];
          const combined = [...new Set([...purchased, ...preset])];
          setUserOwnedPacks(combined);
          if (import.meta.env.DEV && (preset.length > 0 || purchased.length > 0)) {
            console.log('📦 User packs (purchased + admin preset):', combined);
          }
        } catch (error) {
          console.error('Failed to load user packs:', error);
        }
      }
    };

    loadUserPacks();
  }, [user?.email, profile?.admin_preset_activity_pack_ids]);

  // Handle local category change
  const handleCategoryChange = (category: string) => {
    setLocalSelectedCategory(category);
    setSelectedTopic('all');
    if (onCategoryChange) {
      onCategoryChange(category);
    }
  };

  // Get unique categories — Settings year-group assignment is authoritative.
  const uniqueCategories = useMemo(() => {
    if (availableCategoriesForYearGroup === null) {
      const cats = new Set(allActivities.map(a => a.category));
      return Array.from(cats).sort();
    }
    const ygKeys = getCurrentYearGroupKeys();
    const settingsCategoryNames = categories.map((c) => c.name);
    const filteredActivities = allActivities.filter((activity) =>
      activityVisibleForYearGroup({
        activityCategory: activity.category,
        availableCategoriesForYearGroup,
        activityYearGroups: activity.yearGroups,
        yearGroupKeys: ygKeys,
        settingsCategoryNames,
        normalizeKey,
      }),
    );
    const cats = new Set(filteredActivities.map(a => a.category));
    return Array.from(cats).sort();
  }, [allActivities, availableCategoriesForYearGroup, categories, getCurrentYearGroupKeys, normalizeKey]);

  const uniqueLevels = useMemo(() => {
    // Use custom year groups from settings instead of database levels
    return customYearGroups.map(group => group.name);
  }, [customYearGroups]);

  // Generate stable unique key for each activity - FIXED
  const generateActivityKey = (activity: Activity, index: number) => {
    // Priority: Use database ID, then fallback ID, then create stable key
    if (activity._id) return `activity-${activity._id}`;
    if (activity.id) return `activity-${activity.id}`;
    
    // Create a stable key based on activity content and index
    // Use a hash of the activity name and category for consistency
    const stableHash = btoa(`${activity.activity}${activity.category}${activity.description || ''}${activity.time}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    return `activity-${stableHash}-${index}`;
  };

  // Helper function to get activity identifier - FIXED
  const getActivityId = (activity: Activity) => {
    return activity._id || activity.id || `${activity.activity}-${activity.category}-${activity.description || ''}`;
  };

  const getPersistedActivityId = (activity: Activity): string | undefined => activity._id || activity.id;

  const findCurrentActivityId = (snapshot: Activity): string | undefined => {
    const snapshotId = getPersistedActivityId(snapshot);
    if (snapshotId) {
      const hit = allActivities.find((a) => (a._id || a.id) === snapshotId);
      if (hit) return hit._id || hit.id;
    }
    const fallback = allActivities.find((a) =>
      a.activity === snapshot.activity &&
      a.category === snapshot.category &&
      (a.lessonNumber || '') === (snapshot.lessonNumber || '') &&
      (a.unitName || '') === (snapshot.unitName || '')
    );
    return fallback?._id || fallback?.id;
  };

  const pushHistoryAction = (action: ActivityHistoryAction) => {
    if (isApplyingHistory) return;
    setHistoryUndoStack((prev) => [...prev, action].slice(-100));
    setHistoryRedoStack([]);
  };

  const getTopicsFromActivity = (activity: Activity): string[] =>
    String(activity.unitName || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

  // Filter activities, group by category, sort within groups
  const { displayGroups, filteredActivityCount } = useMemo(() => {
    const query = debouncedSearchQuery;
    const filteredActivities = allActivities.filter(activity => {
      const matchesSearch = query === '' ||
                           activity.activity.toLowerCase().includes(query.toLowerCase()) ||
                           activity.description.toLowerCase().includes(query.toLowerCase());
      
      // Filter by category if one is selected
      const matchesCategory = activityMatchesSelectedLibraryCategory(
        activity.category,
        localSelectedCategory
      );
      const topics = getTopicsFromActivity(activity);
      const matchesTopic = selectedTopic === 'all' || topics.includes(selectedTopic);
      
      // Level filtering removed - show all levels
      const matchesLevel = true;
      
      // OR-style: category assigned in Settings, or activity tagged for this year group.
      const visibleForYearGroup = activityVisibleForYearGroup({
        activityCategory: activity.category,
        availableCategoriesForYearGroup,
        activityYearGroups: activity.yearGroups,
        yearGroupKeys: getCurrentYearGroupKeys(),
        settingsCategoryNames: categories.map((c) => c.name),
        normalizeKey,
      });

      // Check if user owns required pack (if activity requires one)
      const hasPackAccess = !activity.requiredPack || userOwnedPacks.includes(activity.requiredPack);

      return matchesSearch && matchesCategory && matchesTopic && matchesLevel && visibleForYearGroup && hasPackAccess;
    });

    const compareActivitiesInCategory = (a: Activity, b: Activity, categoryName: string) => {
      const starredFirst = globalStarredFirst || starredFirstCategories.has(categoryName);
      if (starredFirst) {
        const sa = starredIds.has(getActivityStarKey(a)) ? 0 : 1;
        const sb = starredIds.has(getActivityStarKey(b)) ? 0 : 1;
        if (sa !== sb) return sa - sb;
      }

      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.activity.localeCompare(b.activity);
          break;
        case 'category': {
          const catA = categories.find(c => c.name === a.category);
          const catB = categories.find(c => c.name === b.category);
          comparison = (catA ? catA.position : 999) - (catB ? catB.position : 999);
          break;
        }
        case 'time':
          comparison = a.time - b.time;
          break;
        case 'level':
          comparison = (a.level || '').localeCompare(b.level || '');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    };

    const byCat = new Map<string, Activity[]>();
    for (const activity of filteredActivities) {
      const cat = activity.category || 'Uncategorized';
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat)!.push(activity);
    }

    const categoryNames = [...byCat.keys()];
    categoryNames.sort((a, b) => {
      const ca = categories.find(c => c.name === a);
      const cb = categories.find(c => c.name === b);
      return (ca?.position ?? 999) - (cb?.position ?? 999) || a.localeCompare(b);
    });

    const groups = categoryNames.map((name) => ({
      name,
      activities: [...byCat.get(name)!].sort((x, y) => compareActivitiesInCategory(x, y, name))
    }));

    return {
      displayGroups: groups,
      filteredActivityCount: filteredActivities.length
    };
  }, [allActivities, debouncedSearchQuery, localSelectedCategory, selectedTopic, sortBy, sortOrder, categories, userOwnedPacks, availableCategoriesForYearGroup, getCurrentYearGroupKeys, normalizeKey, globalStarredFirst, starredFirstCategories, starredIds]);

  // Calculate total activities available for the current year group (without search/category filters)
  const totalActivitiesForYearGroup = useMemo(() => {
    const ygKeys = getCurrentYearGroupKeys();
    const settingsCategoryNames = categories.map((c) => c.name);
    return allActivities.filter(activity => {
      const visibleForYearGroup = activityVisibleForYearGroup({
        activityCategory: activity.category,
        availableCategoriesForYearGroup,
        activityYearGroups: activity.yearGroups,
        yearGroupKeys: ygKeys,
        settingsCategoryNames,
        normalizeKey,
      });
      const hasPackAccess = !activity.requiredPack || userOwnedPacks.includes(activity.requiredPack);
      return visibleForYearGroup && hasPackAccess;
    }).length;
  }, [allActivities, availableCategoriesForYearGroup, categories, getCurrentYearGroupKeys, normalizeKey, userOwnedPacks]);

  const availableTopicsForSelection = useMemo(() => {
    const topics = new Set<string>();
    displayGroups.forEach((group) => {
      group.activities.forEach((activity) => {
        getTopicsFromActivity(activity).forEach((t) => topics.add(t));
      });
    });
    return [...topics].sort((a, b) => a.localeCompare(b));
  }, [displayGroups]);

  const toggleSort = (field: 'name' | 'category' | 'time' | 'level') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleActivityUpdate = async (updatedActivity: Activity) => {
    try {
      const existing = allActivities.find((a) => getActivityId(a) === getActivityId(updatedActivity));
      // Convert any "EYFS U" levels to "UKG"
      if (updatedActivity.level === "EYFS U") {
        updatedActivity.level = "UKG";
      }
      
      const saved = await updateActivity(updatedActivity);
      if (existing) {
        pushHistoryAction({ type: 'update', before: existing, after: saved || updatedActivity });
      }
      setEditingActivity(null);
      setSelectedActivityDetails(null);
    } catch (error) {
      console.error('Failed to update activity:', error);
      alert('Failed to update activity. Please try again.');
    }
  };

  const handleActivityDelete = async (activityId: string) => {
    if (isViewOnly) {
      alert('View-only mode: Cannot delete activities.');
      return;
    }
    setShowDeleteConfirm(activityId);
  };

  const confirmDeleteActivity = async () => {
    if (!showDeleteConfirm) return;
    
    try {
      const existing = allActivities.find((a) => (a._id || a.id) === showDeleteConfirm);
      await deleteActivity(showDeleteConfirm);
      if (existing) {
        pushHistoryAction({ type: 'delete', before: existing });
      }
      setShowDeleteConfirm(null);
      
      // If the deleted activity was being viewed, close the details modal
      if (selectedActivityDetails && (selectedActivityDetails._id === showDeleteConfirm || selectedActivityDetails.id === showDeleteConfirm)) {
        setSelectedActivityDetails(null);
      }
    } catch (error) {
      console.error('Failed to delete activity:', error);
      alert('Failed to delete activity. Please try again.');
      setShowDeleteConfirm(null);
    }
  };

  // Duplicate activity removed by request

  const handleRefreshActivities = async () => {
    try {
      setLoading(true);
      console.log('🔄 Refreshing activities from Supabase...');
      await refreshData();
      console.log('✅ Activities refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh activities:', error);
      alert('Failed to refresh activities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewActivityDetails = (activity: Activity, initialResource?: {url: string, title: string, type: string}) => {
    // Convert any "EYFS U" levels to "UKG"
    if (activity.level === "EYFS U") {
      activity.level = "UKG";
    }
    
    setSelectedActivityDetails(activity);
    if (initialResource) {
      setInitialResource(initialResource);
    } else {
      setInitialResource(null);
    }
  };

  const handleActivityClick = (activity: Activity) => {
    // Convert any "EYFS U" levels to "UKG"
    if (activity.level === "EYFS U") {
      activity.level = "UKG";
    }
    
    setSelectedActivityForModal(activity);
    setShowActivityModal(true);
  };

  const handleResourceClick = (url: string, _title: string, _type: string) => {
    // Open packs / LSO / external media in a new tab (do not trap in ResourceViewer)
    openActivityResource(url);
  };

  const handleEditActivity = (activity: Activity) => {
    if (isViewOnly) {
      alert('View-only mode: Cannot edit activities.');
      return;
    }
    // Convert any "EYFS U" levels to "UKG"
    if (activity.level === "EYFS U") {
      activity.level = "UKG";
    }
    
    setEditingActivity(activity);
    setSelectedActivityDetails(activity);
  };

  const handleImportActivities = async (activities: Activity[]) => {
    try {
      setLoading(true);
      
      // Convert any "EYFS U" levels to "UKG" and ensure yearGroups field exists
      const normalizedActivities = activities.map(activity => {
        if (activity.level === "EYFS U") {
          return { 
            ...activity, 
            level: "UKG",
            yearGroups: activity.yearGroups || (activity.level ? [activity.level] : [])
          };
        }
        return {
          ...activity,
          yearGroups: activity.yearGroups || (activity.level ? [activity.level] : [])
        };
      });

      // Ensure imported categories exist in settings so they can be assigned in Manage Categories.
      const existingCategoryNames = new Set(categories.map((c) => c.name.toLowerCase().trim()));
      const missingCategoryNames = [...new Set(
        normalizedActivities
          .map((a) => (a.category || '').trim())
          .filter(Boolean)
          .filter((name) => !existingCategoryNames.has(name.toLowerCase()))
      )];

      if (missingCategoryNames.length > 0) {
        const palette = ['#14B8A6', '#0EA5E9', '#F59E0B', '#A855F7', '#EF4444', '#10B981', '#6366F1', '#EC4899'];
        const addedCategories = missingCategoryNames.map((name, idx) => ({
          name,
          color: palette[(categories.length + idx) % palette.length],
          position: categories.length + idx,
          yearGroups: {} as Record<string, boolean>
        }));
        updateCategories([...categories, ...addedCategories]);
      }
      
      // Add each activity using the centralized function
      for (const activity of normalizedActivities) {
        await addActivity(activity);
      }
      
      setShowImporter(false);
    } catch (error) {
      console.error('Failed to import activities:', error);
      alert('Failed to import activities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActivity = async (newActivity: Activity) => {
    if (isViewOnly) {
      alert('View-only mode: Cannot create activities.');
      return;
    }
    const loadingToast = toast.loading('Creating activity...');
    
    try {
      setLoading(true);
      
      // Convert any "EYFS U" levels to "UKG" and ensure yearGroups field exists
      if (newActivity.level === "EYFS U") {
        newActivity.level = "UKG";
      }
      
      // CRITICAL: Preserve yearGroups array - don't overwrite if it exists
      // Only set default if yearGroups is missing or empty
      if (!newActivity.yearGroups || !Array.isArray(newActivity.yearGroups) || newActivity.yearGroups.length === 0) {
        newActivity.yearGroups = newActivity.level ? [newActivity.level] : [];
      }
      
      // Ensure yearGroups is properly formatted as an array
      newActivity.yearGroups = Array.isArray(newActivity.yearGroups) ? newActivity.yearGroups : [];
      
      console.log('💾 Saving activity with yearGroups:', {
        activity: newActivity.activity,
        yearGroups: newActivity.yearGroups,
        yearGroupsLength: newActivity.yearGroups.length
      });
      
      const created = await addActivity(newActivity);
      pushHistoryAction({ type: 'create', after: created });
      setShowCreator(false);
      
      toast.success(`Activity "${newActivity.activity}" created successfully!`, {
        id: loadingToast,
      });
    } catch (error) {
      console.error('Failed to create activity:', error);
      const message =
        error instanceof Error
          ? error.message
          : (error && typeof error === 'object' && 'message' in error
              ? String((error as { message?: string }).message)
              : 'Failed to create activity. Please try again.');
      toast.error(message, {
        id: loadingToast,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUndoActivityChange = async () => {
    if (historyUndoStack.length === 0 || isApplyingHistory) return;
    const action = historyUndoStack[historyUndoStack.length - 1];
    setIsApplyingHistory(true);
    try {
      if (action.type === 'create') {
        const id = findCurrentActivityId(action.after);
        if (id) await deleteActivity(id);
      } else if (action.type === 'delete') {
        await addActivity(action.before);
      } else {
        await updateActivity(action.before);
      }
      setHistoryUndoStack((prev) => prev.slice(0, -1));
      setHistoryRedoStack((prev) => [...prev, action].slice(-100));
    } catch (error) {
      console.error('Failed to undo activity change:', error);
      alert('Undo failed. Please try again.');
    } finally {
      setIsApplyingHistory(false);
    }
  };

  const handleRedoActivityChange = async () => {
    if (historyRedoStack.length === 0 || isApplyingHistory) return;
    const action = historyRedoStack[historyRedoStack.length - 1];
    setIsApplyingHistory(true);
    try {
      if (action.type === 'create') {
        await addActivity(action.after);
      } else if (action.type === 'delete') {
        const id = findCurrentActivityId(action.before);
        if (id) await deleteActivity(id);
      } else {
        await updateActivity(action.after);
      }
      setHistoryRedoStack((prev) => prev.slice(0, -1));
      setHistoryUndoStack((prev) => [...prev, action].slice(-100));
    } catch (error) {
      console.error('Failed to redo activity change:', error);
      alert('Redo failed. Please try again.');
    } finally {
      setIsApplyingHistory(false);
    }
  };

  // Check if an activity is being edited - FIXED
  const isActivityBeingEdited = (activity: Activity) => {
    if (!editingActivity) return false;
    
    // First try to match by ID
    if (editingActivity._id && activity._id) {
      return editingActivity._id === activity._id;
    }
    if (editingActivity.id && activity.id) {
      return editingActivity.id === activity.id;
    }
    
    // If no IDs match, use content-based matching as fallback
    return getActivityId(editingActivity) === getActivityId(activity);
  };


  return (
    <div className="bg-white rounded-xl shadow-lg  overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 text-white" style={{ background: 'linear-gradient(to right, #14B8A6, #0D9488)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-4">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                {className ? `${className} Activity Library` : 'Activity Library'}
              </h2>
              <p className="text-white text-xs sm:text-sm">
                {getCurrentYearGroupKeys().length > 0
                  ? `${filteredActivityCount} of ${totalActivitiesForYearGroup} activities`
                  : `${filteredActivityCount} activities`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-2">
            <button
              onClick={() => {
                if (isViewOnly) {
                  alert('View-only mode: Cannot create activities.');
                  return;
                }
                setShowCreator(true);
              }}
              disabled={isViewOnly}
              className={`btn-accent px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm ${isViewOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Create Activity</span>
              <span className="sm:hidden">Create</span>
            </button>
            
            <button
              onClick={handleRefreshActivities}
              disabled={loading}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
              title="Refresh activities from Supabase"
            >
              <RotateCcw className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleUndoActivityChange}
              disabled={historyUndoStack.length === 0 || isApplyingHistory}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
              title="Undo last activity change"
            >
              <Undo2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Undo</span>
            </button>
            <button
              type="button"
              onClick={handleRedoActivityChange}
              disabled={historyRedoStack.length === 0 || isApplyingHistory}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
              title="Redo last activity change"
            >
              <Redo2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Redo</span>
            </button>
            
            <button
              onClick={() => setShowImporter(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200 flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
            >
              <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Import/Export</span>
              <span className="sm:hidden">Import</span>
            </button>
          </div>
        </div>

        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:flex-1 sm:min-w-[180px]">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-teal-500" 
            />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-teal-400 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
              style={{
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), 0 0 0 3px rgba(20, 184, 166, 0.1)'
              }}
              dir="ltr"
            />
          </div>

          {/* Category Filter Dropdown */}
          <div className="relative w-full sm:w-auto sm:min-w-[180px]">
            <SimpleNestedCategoryDropdown
              selectedCategory={localSelectedCategory === 'all' ? '' : localSelectedCategory}
              onCategoryChange={(category) => handleCategoryChange(category === '' ? 'all' : category)}
              placeholder="All Categories"
              className="px-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent font-semibold"
              showAllCategories={false}
            />
          </div>

          {/* Sort and View Icons - Properly spaced */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => toggleSort('category')}
              className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center p-2 rounded-lg transition-colors duration-200 ${
                sortBy === 'category' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
              title="Sort by Category"
            >
              <Tag className="h-4 w-4" />
              {sortBy === 'category' && (sortOrder === 'asc' ? <ArrowUpDown className="h-3 w-3 ml-1" /> : <ArrowDownUp className="h-3 w-3 ml-1" />)}
            </button>
            <button
              onClick={() => toggleSort('time')}
              className={`flex items-center justify-center p-2 rounded-lg transition-colors duration-200 ${
                sortBy === 'time' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
              title="Sort by Time"
            >
              <Clock className="h-4 w-4" />
              {sortBy === 'time' && (sortOrder === 'asc' ? <ArrowUpDown className="h-3 w-3 ml-1" /> : <ArrowDownUp className="h-3 w-3 ml-1" />)}
            </button>
            <button
              onClick={() => {
                toggleSort('name');
                setSortOrder('asc'); // Always A-Z when clicking A-Z button
              }}
              className={`flex items-center justify-center p-2 rounded-lg transition-colors duration-200 ${
                sortBy === 'name' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
              title="Sort A-Z by Name"
            >
              <Type className="h-4 w-4" />
              {sortBy === 'name' && sortOrder === 'asc' && <span className="text-xs ml-1">A-Z</span>}
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'grid' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'list' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setGlobalStarredFirst((v) => !v)}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                globalStarredFirst ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
              title={
                globalStarredFirst
                  ? 'Turn off: show starred first in every category'
                  : 'Show starred activities first in every category'
              }
            >
              <Star
                className={`h-4 w-4 ${globalStarredFirst ? 'fill-amber-300 text-amber-200' : 'text-white'}`}
                strokeWidth={globalStarredFirst ? 0 : 2}
              />
            </button>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="flex relative">
        
        <div className="p-6 flex-1">
        {availableTopicsForSelection.length > 0 && (
          <div className="mb-4 rounded-xl border border-teal-100 bg-teal-50/40">
            <button
              type="button"
              onClick={() => setTopicsExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-teal-800">
                  Topics for {className || 'selected class/year group'}
                </p>
                <p className="text-xs text-teal-700/80">
                  {availableTopicsForSelection.length} topic{availableTopicsForSelection.length === 1 ? '' : 's'} available
                </p>
              </div>
              {topicsExpanded ? (
                <ChevronDown className="h-4 w-4 text-teal-700" />
              ) : (
                <ChevronRight className="h-4 w-4 text-teal-700" />
              )}
            </button>
            {topicsExpanded && (
              <div className="px-4 pb-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTopic('all')}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    selectedTopic === 'all'
                      ? 'bg-teal-600 text-white border-teal-600 font-bold shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 font-medium hover:bg-gray-50'
                  }`}
                >
                  All Topics
                </button>
                {availableTopicsForSelection.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setSelectedTopic(topic)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                      selectedTopic === topic
                        ? 'bg-teal-600 text-white border-teal-600 font-bold shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 font-medium hover:bg-gray-50'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <PartnerPlanningPanel
          className="mb-4"
          activities={allActivities}
          currentSheetId={className || currentSheetInfo?.sheet}
          selectable
          selectedActivityKeys={partnerSelectedActivityKeys}
          selectedProjectKeys={partnerSelectedProjectKeys}
          activityFilter={(activity) =>
            activityVisibleForYearGroup({
              activityCategory: activity.category,
              availableCategoriesForYearGroup,
              activityYearGroups: activity.yearGroups,
              yearGroupKeys: getCurrentYearGroupKeys(),
              normalizeKey,
            })
          }
          onActivitySelectionChange={(activity, selected) => {
            const key = getActivityStarKey(activity);
            setPartnerSelectedActivityKeys((prev) =>
              selected
                ? prev.includes(key)
                  ? prev
                  : [...prev, key]
                : prev.filter((k) => k !== key),
            );
            if (selected) {
              handleActivityClick(activity);
            }
          }}
          onProjectSelectionChange={(pack, packActs, selected) => {
            const pKey = partnerPlanningProjectKey(pack.orgId, pack.projectId);
            setPartnerSelectedProjectKeys((prev) =>
              selected
                ? prev.includes(pKey)
                  ? prev
                  : [...prev, pKey]
                : prev.filter((k) => k !== pKey),
            );
            const keys = packActs.map((a) => getActivityStarKey(a));
            setPartnerSelectedActivityKeys((prev) => {
              if (selected) return [...new Set([...prev, ...keys])];
              const drop = new Set(keys);
              return prev.filter((k) => !drop.has(k));
            });
            if (selected && packActs[0]) {
              handleActivityClick(packActs[0]);
            }
          }}
          onActivityOpen={(activity) => handleActivityClick(activity)}
          renderActivity={({ activity, selected }) => {
            const isStarred = starredIds.has(getActivityStarKey(activity));
            return (
              <ActivityCard
                key={getActivityStarKey(activity)}
                activity={activity}
                onActivityClick={() => handleActivityClick(activity)}
                categoryColor={getCategoryColor(activity.category)}
                viewMode="compact"
                isStarred={isStarred}
                onStarToggle={() => toggleActivityStarred(activity)}
                selectable
                isSelected={selected}
                onSelectionChange={(_id, next) => {
                  const key = getActivityStarKey(activity);
                  setPartnerSelectedActivityKeys((prev) =>
                    next
                      ? prev.includes(key)
                        ? prev
                        : [...prev, key]
                      : prev.filter((k) => k !== key),
                  );
                  if (next) handleActivityClick(activity);
                }}
              />
            );
          }}
        />
        {loading || dataLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading activities...</p>
          </div>
        ) : filteredActivityCount === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
            <p className="text-gray-600">
              {searchQuery || localSelectedCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No activities available in the library. Create a new activity or import activities to get started.'
              }
            </p>
            {(searchQuery || localSelectedCategory !== 'all') && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  handleCategoryChange('all');
                }}
                className="mt-4 px-4 py-2 btn-primary text-white rounded-lg text-sm"
              >
                Clear Filters
              </button>
            )}
            {!searchQuery && localSelectedCategory === 'all' && (
              <button 
                onClick={() => {
                  if (isViewOnly) {
                    alert('View-only mode: Cannot create activities.');
                    return;
                  }
                  setShowCreator(true);
                }}
                disabled={isViewOnly}
                className={`mt-4 px-4 py-2 btn-primary text-white rounded-lg text-sm flex items-center space-x-2 mx-auto ${isViewOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Plus className="h-4 w-4" />
                <span>Create First Activity</span>
              </button>
            )}
          </div>
        ) : (
          viewMode === 'list' ? (
          // List View — grouped by category with starred-first control per heading
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displayGroups.map((group) => (
              <React.Fragment key={`cat-${group.name}`}>
                <div className="col-span-full flex flex-wrap items-center gap-2 py-2 px-1 border-b-2 border-teal-200 bg-white/95 backdrop-blur sticky top-0 z-10">
                  {isLsoLibraryCategory(group.name) && (
                    <div
                      className="flex items-center justify-center rounded-md px-2 py-1 flex-shrink-0"
                      style={{ backgroundColor: '#0b1f4a' }}
                      title="London Symphony Orchestra"
                    >
                      <img src={LSO_LOGO_SRC} alt="LSO" className="h-6 w-auto" />
                    </div>
                  )}
                  {isRohLibraryCategory(group.name) && (
                    <div
                      className="flex items-center justify-center rounded-md px-2 py-1 flex-shrink-0"
                      style={{ backgroundColor: '#1a1033' }}
                      title="Royal Ballet and Opera"
                    >
                      <img
                        src={ROH_LOGO_SRC}
                        alt="ROH"
                        className="h-6 w-auto brightness-0 invert"
                      />
                    </div>
                  )}
                  {isWtdLibraryCategory(group.name) && (
                    <div
                      className="flex items-center justify-center rounded-md px-2 py-1 flex-shrink-0"
                      style={{ backgroundColor: '#111111' }}
                      title="We Teach Drama"
                    >
                      <img src={WTD_LOGO_SRC} alt="We Teach Drama" className="h-6 w-auto" />
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-teal-700">{group.name}</h3>
                  <button
                    type="button"
                    onClick={() => toggleStarredFirstForCategory(group.name)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      starredFirstCategories.has(group.name)
                        ? 'bg-amber-100 ring-1 ring-amber-300'
                        : 'hover:bg-gray-100 text-gray-500'
                    }`}
                    title={
                      starredFirstCategories.has(group.name)
                        ? 'Turn off starred-first for this category'
                        : 'Put starred activities at the top in this category'
                    }
                  >
                    <Star
                      className={`h-5 w-5 ${
                        starredFirstCategories.has(group.name) ? 'fill-amber-400 text-amber-500' : 'text-gray-400'
                      }`}
                      strokeWidth={starredFirstCategories.has(group.name) ? 0 : 1.75}
                    />
                  </button>
                  <span className="text-sm text-gray-500">{group.activities.length} activities</span>
                </div>
                {group.activities.map((activity, index) => {
                  const firstLetter = activity.activity.charAt(0).toUpperCase();
                  const isNewLetter =
                    index === 0 ||
                    group.activities[index - 1].activity.charAt(0).toUpperCase() !== firstLetter;
                  const isStarred = starredIds.has(getActivityStarKey(activity));

                  return (
                    <React.Fragment key={generateActivityKey(activity, index)}>
                      {isNewLetter && sortBy === 'name' && /[A-Z]/.test(firstLetter) && (
                        <div
                          data-letter-index={firstLetter}
                          className="col-span-full py-2 sticky top-0 bg-white z-[9] border-b border-teal-100"
                        >
                          <h4 className="text-base font-semibold text-teal-500">{firstLetter}</h4>
                        </div>
                      )}
                      <div
                        className="bg-white shadow-soft hover:shadow-hover transition-shadow duration-200 p-3 relative group"
                        style={{
                          borderLeft: `4px solid ${getCategoryColor(activity.category)}`,
                          borderRadius: '6px',
                          minHeight: '80px'
                        }}
                      >
                        <div
                          className="h-full flex flex-col justify-between cursor-pointer"
                          onClick={() => handleActivityClick(activity)}
                        >
                          <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 break-words mb-2" title={activity.activity}>
                            {activity.activity}
                          </h3>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center text-xs text-gray-500">
                              <span className="flex items-center whitespace-nowrap">
                                <Clock className="h-3 w-3 mr-1" />
                                {activity.time || 0}m
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleActivityStarred(activity);
                                }}
                                className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                title={isStarred ? 'Remove from starred' : 'Star this activity'}
                              >
                                <Star
                                  className={`h-3.5 w-3.5 ${isStarred ? 'fill-amber-400 text-amber-500' : ''}`}
                                  strokeWidth={isStarred ? 0 : 1.75}
                                />
                              </button>
                              {!isViewOnly && (
                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditActivity(activity);
                                    }}
                                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Edit activity"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleActivityDelete(activity._id || activity.id || '');
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete activity"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        ) : (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayGroups.map((group) => (
              <React.Fragment key={`grid-cat-${group.name}`}>
                <div className="col-span-full flex flex-wrap items-center gap-2 py-2 px-1 border-b-2 border-teal-200 bg-white/95 backdrop-blur sticky top-0 z-10">
                  {isLsoLibraryCategory(group.name) && (
                    <div
                      className="flex items-center justify-center rounded-md px-2 py-1 flex-shrink-0"
                      style={{ backgroundColor: '#0b1f4a' }}
                      title="London Symphony Orchestra"
                    >
                      <img src={LSO_LOGO_SRC} alt="LSO" className="h-6 w-auto" />
                    </div>
                  )}
                  {isRohLibraryCategory(group.name) && (
                    <div
                      className="flex items-center justify-center rounded-md px-2 py-1 flex-shrink-0"
                      style={{ backgroundColor: '#1a1033' }}
                      title="Royal Ballet and Opera"
                    >
                      <img
                        src={ROH_LOGO_SRC}
                        alt="ROH"
                        className="h-6 w-auto brightness-0 invert"
                      />
                    </div>
                  )}
                  {isWtdLibraryCategory(group.name) && (
                    <div
                      className="flex items-center justify-center rounded-md px-2 py-1 flex-shrink-0"
                      style={{ backgroundColor: '#111111' }}
                      title="We Teach Drama"
                    >
                      <img src={WTD_LOGO_SRC} alt="We Teach Drama" className="h-6 w-auto" />
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-teal-700">{group.name}</h3>
                  <button
                    type="button"
                    onClick={() => toggleStarredFirstForCategory(group.name)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      starredFirstCategories.has(group.name)
                        ? 'bg-amber-100 ring-1 ring-amber-300'
                        : 'hover:bg-gray-100 text-gray-500'
                    }`}
                    title={
                      starredFirstCategories.has(group.name)
                        ? 'Turn off starred-first for this category'
                        : 'Put starred activities at the top in this category'
                    }
                  >
                    <Star
                      className={`h-5 w-5 ${
                        starredFirstCategories.has(group.name) ? 'fill-amber-400 text-amber-500' : 'text-gray-400'
                      }`}
                      strokeWidth={starredFirstCategories.has(group.name) ? 0 : 1.75}
                    />
                  </button>
                  <span className="text-sm text-gray-500">{group.activities.length} activities</span>
                </div>
                {group.activities.map((activity, index) => {
                  const firstLetter = activity.activity.charAt(0).toUpperCase();
                  const isNewLetter =
                    index === 0 ||
                    group.activities[index - 1].activity.charAt(0).toUpperCase() !== firstLetter;

                  return (
                    <React.Fragment key={generateActivityKey(activity, index)}>
                      {isNewLetter && sortBy === 'name' && /[A-Z]/.test(firstLetter) && (
                        <div
                          data-letter-index={firstLetter}
                          className="col-span-full py-2 sticky top-0 bg-white z-[9] border-b border-teal-100"
                        >
                          <h4 className="text-base font-semibold text-teal-500">{firstLetter}</h4>
                        </div>
                      )}
                      <div className="h-full">
                        <ActivityCard
                          activity={activity}
                          onUpdate={handleActivityUpdate}
                          onDelete={handleActivityDelete}
                          isEditing={isActivityBeingEdited(activity)}
                          onEditToggle={() => handleEditActivity(activity)}
                          categoryColor={getCategoryColor(activity.category)}
                          viewMode="grid"
                          onActivityClick={handleActivityClick}
                          onResourceClick={handleResourceClick}
                          draggable={true}
                          selectable={false}
                          isSelected={false}
                          onSelectionChange={() => {}}
                          isStarred={starredIds.has(getActivityStarKey(activity))}
                          onStarToggle={toggleActivityStarred}
                        />
                      </div>
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          )
        )}
        </div>
      </div>

      {/* Activity Details Modal */}
      {selectedActivityDetails && (
        <ActivityDetails
          activity={selectedActivityDetails}
          onClose={() => {
            setSelectedActivityDetails(null);
            setEditingActivity(null);
            setInitialResource(null);
          }}
          onAddToLesson={() => {
            onActivitySelect(selectedActivityDetails);
            setSelectedActivityDetails(null);
          }}
          isEditing={selectedActivityDetails === editingActivity}
          onUpdate={(updatedActivity) => {
            handleActivityUpdate(updatedActivity);
            setEditingActivity(null);
            setSelectedActivityDetails(null);
          }}
          initialResource={initialResource}
          onDelete={deleteActivity}
        />
      )}

      {/* Activity Creator Modal */}
      {showCreator && (
        <ActivityCreator 
          onSave={handleCreateActivity}
          onClose={() => setShowCreator(false)}
          categories={uniqueCategories}
          levels={uniqueLevels}
        />
      )}

      {/* Activity Importer Modal */}
      {showImporter && (
        <ActivityImporter 
          onImport={handleImportActivities}
          onClose={() => setShowImporter(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-activity-title"
        >
          <div
            className="fixed inset-0 bg-black/50"
            aria-hidden="true"
            onClick={() => setShowDeleteConfirm(null)}
          />
          <div className="relative z-10 bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 id="delete-activity-title" className="text-lg font-bold text-gray-900 mb-4">Delete Activity</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this activity? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteActivity}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Activity</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Activity Details Modal - Simple view for clicking activities */}
      <ActivityDetailsModal
        isOpen={showActivityModal}
        onClose={() => {
          setShowActivityModal(false);
          setSelectedActivityForModal(null);
        }}
        activity={selectedActivityForModal}
        onEdit={(activity) => {
          handleEditActivity(activity);
          setShowActivityModal(false);
          setSelectedActivityForModal(null);
        }}
      />

      <ActivityLibraryWelcomeModal
        isOpen={showWelcomeModal}
        onClose={dismissWelcomeModal}
      />

    </div>
  );
}