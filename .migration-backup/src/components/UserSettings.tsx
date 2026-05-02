import React, { useState, useRef } from 'react';
import { Settings, Palette, RotateCcw, X, Plus, Trash2, GripVertical, Edit3, Save, Users, Database, AlertTriangle, GraduationCap, Package, Filter, Video, Music, Volume2, FileText, Link as LinkIcon, Image, FileVideo, FileMusic, File, Globe, ExternalLink, Share2, Download, Upload, Eye, Play, Pause, Headphones, Mic, Speaker, Film, Camera, BookOpen, Book, Folder, Cloud, Network, Target, HelpCircle, ChevronDown, ChevronRight, Undo2, Redo2 } from 'lucide-react';
import { useSettings, Category, ResourceLinkConfig, SOCIAL_PLATFORMS, YearGroupSection } from '../contexts/SettingsContextNew';
import { DataSourceSettings } from './DataSourceSettings';
import { CustomObjectivesAdmin } from './CustomObjectivesAdmin';
import { ActivityPacksAdmin } from './ActivityPacksAdmin';
import { useAuth } from '../hooks/useAuth';
import { useIsViewOnly } from '../hooks/useIsViewOnly';
import { isSupabaseConfigured, isSupabaseAuthEnabled } from '../config/supabase';
import { AuthGuard } from './Auth/AuthGuard';
import { UserManagement } from './Admin/UserManagement';
import { customCategoriesApi, activityPacksApi } from '../config/api';
import type { ActivityPack } from '../config/api';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import toast from 'react-hot-toast';
import {
  normalizeSectionYearGroupIdList,
  normalizeYearGroupToken,
  resolveYearGroupFromToken,
} from '../utils/yearGroupSectionOrder';

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

  const [{ handlerId }, drop] = useDrop({
    accept: 'category',
    collect(monitor) {
      return { handlerId: monitor.getHandlerId() };
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
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'category',
    item: () => ({ index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    end: () => {
      if (onDragEnd) onDragEnd();
    }
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      data-handler-id={handlerId}
      className={`transition-all ${isDragging ? 'ring-2 ring-teal-400 rounded-lg shadow-lg' : ''}`}
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

interface UserSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserSettings({ isOpen, onClose }: UserSettingsProps) {
  const { user, profile } = useAuth();
  const isViewOnly = useIsViewOnly();
  const { settings, updateSettings, resetToDefaults, categories, updateCategories, resetCategoriesToDefaults, customYearGroups, updateYearGroups, updateYearGroupSections, getOrderedYearGroups, yearGroupSections, deleteYearGroup, resetYearGroupsToDefaults, addMissingDefaultYearGroups, ensureYearGroupsInSections, forceSyncYearGroups, forceSyncToSupabase, forceRefreshFromSupabase, forceSyncCurrentYearGroups, forceSafariSync, startUserChange, endUserChange, resourceLinks, updateResourceLinks, resetResourceLinksToDefaults } = useSettings();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);
  const [tempCategories, setTempCategories] = useState(categories);
  const [tempYearGroups, setTempYearGroups] = useState(customYearGroups);
  // Refs hold the latest categories/year groups so Save uses current values (avoids stale closure when user toggles then clicks Save)
  const tempCategoriesRef = useRef(categories);
  const tempYearGroupsRef = useRef(customYearGroups);
  tempCategoriesRef.current = tempCategories;
  tempYearGroupsRef.current = tempYearGroups;
  const [tempResourceLinks, setTempResourceLinks] = useState(resourceLinks);
  const [activeTab, setActiveTab] = useState<'general' | 'yeargroups' | 'categories' | 'purchases' | 'manage-packs' | 'data' | 'admin' | 'resource-links' | 'users' | 'branding'>('yeargroups');
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

  const isAdmin = user?.email === 'rob.reichstorer@gmail.com' ||
                  user?.role === 'administrator' ||
                  user?.role === 'admin' ||
                  user?.role === 'superuser' ||
                  profile?.role === 'admin' ||
                  profile?.role === 'superuser';
  const isCreator = profile?.role === 'creator';
  const showUserManagement = (isSupabaseAuthEnabled() || isSupabaseConfigured()) && (isAdmin || profile?.role === 'admin' || profile?.role === 'superuser' || profile?.can_manage_users === true);

  // When modal opens or permissions change, ensure active tab is one we can show (avoid blank content)
  React.useEffect(() => {
    if (!isOpen) {
      setAdminMenuOpen(false);
      return;
    }
    if (activeTab === 'users' && !showUserManagement) setActiveTab('resource-links');
    if (activeTab === 'branding' && !isAdmin) setActiveTab('resource-links');
    if (activeTab === 'manage-packs' && !isAdmin && !isCreator) setActiveTab('resource-links');
    // general, resource-links, data are under Admin for all users – no redirect
  }, [isOpen, activeTab, showUserManagement, isAdmin, isCreator]);

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
  // ensureYearGroupsInSections — producing an infinite render loop. We also gate on `isOpen` so the
  // effect only runs while the modal is actually visible.
  const ensureYearGroupsInSectionsRef = React.useRef(ensureYearGroupsInSections);
  ensureYearGroupsInSectionsRef.current = ensureYearGroupsInSections;
  React.useEffect(() => {
    if (!isOpen) return;
    if (activeTab !== 'yeargroups') return;
    ensureYearGroupsInSectionsRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab]);

  // When switching to Custom Objectives tab, scroll content into view so the panel is visible
  React.useEffect(() => {
    if (activeTab === 'admin' && adminTabContentRef.current && settingsContentRef.current) {
      const t = requestAnimationFrame(() => {
        adminTabContentRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
      });
      return () => cancelAnimationFrame(t);
    }
  }, [activeTab]);

  // Load activity packs for Resource Shop when viewing purchases tab
  React.useEffect(() => {
    if (activeTab !== 'purchases') return;
    activityPacksApi.getAllPacks().then(setShopPacks).catch(() => setShopPacks([]));
  }, [activeTab]);

  // Update temp resource links when resource links change
  React.useEffect(() => {
    setTempResourceLinks(resourceLinks);
  }, [resourceLinks]);

  // Immediate update for categories to ensure group assignments are saved
  React.useEffect(() => {
    // Skip immediate update if a category is being edited (to prevent losing focus on each keystroke)
    if (editingCategory) {
      return;
    }
    
    // Only update if tempCategories is different from current categories
    // This prevents infinite loops but ensures immediate saves
    if (tempCategories !== categories) {
      console.log('🔄 Immediate update of categories from tempCategories changes');
      updateCategories(tempCategories);
    }
  }, [tempCategories, editingCategory]);

  // Note: Removed automatic refresh when modal opens to prevent race conditions
  // Data should already be up-to-date from the initial load
  // Users can manually refresh if needed using the refresh buttons

  const handleSave = async () => {
    if (isViewOnly) {
      alert('View-only mode: Cannot save settings.');
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
      
      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000); // Hide after 3 seconds
      
      // Show toast notification for better visibility
      toast.success('Settings saved successfully!', {
        duration: 3000,
        position: 'top-center',
        icon: '✅',
        style: {
          background: '#E6F7F5',
          color: '#0BA596',
          border: '1px solid #0BA596',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '500'
        }
      });
      
      console.log('✅ All settings saved successfully');
    } catch (error: unknown) {
      console.error('❌ Failed to save settings:', error);
      const err = error as Error;
      console.error('❌ Error details:', { message: err?.message, stack: err?.stack, name: err?.name });
      
      // Show error toast notification
      toast.error('Failed to save settings. Please try again.', {
        duration: 4000,
        position: 'top-center',
        icon: '❌',
        style: {
          background: '#FEF2F2',
          color: '#DC2626',
          border: '1px solid #DC2626',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '500'
        }
      });
      
      alert('Failed to save settings. Please try again.');
    }
  };

  const handleCancel = () => {
    setTempSettings(settings);
    setTempCategories(categories);
    setTempYearGroups(customYearGroups);
    onClose();
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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    // Check if category already exists
    if (tempCategories.some(cat => cat.name.toLowerCase() === newCategoryName.toLowerCase())) {
      alert('A category with this name already exists.');
      return;
    }
    
    try {
      // Start user change to pause real-time sync
      startUserChange();
      
      // Create new category with year group assignments using actual IDs/names
      const newCategory: Category = {
        name: newCategoryName,
        color: newCategoryColor,
        position: tempCategories.length,
        yearGroups: { ...newCategoryYearGroups } // Use actual year group IDs/names as keys
      };
      
      // Add new category to both temp state and persist it
      const updatedCategories = [...tempCategories, newCategory];
      setTempCategories(updatedCategories);
      
      // Immediately persist to global state and Supabase
      console.log('🔄 Adding category and persisting immediately:', newCategory);
      await updateCategories(updatedCategories);
    
    // Reset form
    setNewCategoryName('');
    setNewCategoryColor('#6B7280');
    setNewCategoryYearGroups({}); // Reset to empty object
      
      console.log('✅ Category added and persisted:', newCategory.name);
      
      // End user change after a delay to allow persistence
      endUserChange();
    } catch (error: unknown) {
      console.error('❌ Failed to add category:', error);
      alert('Failed to add category. Please try again.');
      // End user change even on error
      endUserChange();
    }
  };


  const handleDeleteCategory = async (index: number) => {
    if (isViewOnly) {
      alert('View-only mode: Cannot delete categories.');
      return;
    }
    const categoryToDelete = tempCategories[index];
    if (categoryToDelete && profile?.admin_preset_categories?.includes(categoryToDelete.name)) {
      alert('This category was assigned by an admin and cannot be removed.');
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
        
        // Check if this is a custom category (not in FIXED_CATEGORIES)
        // FIXED_CATEGORIES are: Welcome, Kodaly Songs, Kodaly Action Songs, Action/Games Songs, 
        // Rhythm Sticks, Scarf Songs, General Game, Core Songs, Parachute Games, Percussion Games,
        // Teaching Units, Goodbye, Kodaly Rhythms, Kodaly Games, IWB Games
        const FIXED_CATEGORY_NAMES = [
          'Welcome', 'Kodaly Songs', 'Kodaly Action Songs', 'Action/Games Songs', 'Rhythm Sticks',
          'Scarf Songs', 'General Game', 'Core Songs', 'Parachute Games', 'Percussion Games',
          'Teaching Units', 'Goodbye', 'Kodaly Rhythms', 'Kodaly Games', 'IWB Games'
        ];
        const isCustomCategory = !FIXED_CATEGORY_NAMES.includes(categoryToDelete.name);
        
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
    if (confirm('Are you sure you want to reset categories to defaults? This cannot be undone.')) {
      resetCategoriesToDefaults();
      setTempCategories(categories);
    }
  };

  // Class Management
  const handleAddYearGroup = async () => {
    if (!newYearGroupId.trim() || !newYearGroupName.trim()) return;
    
    // Check if year group already exists
    if (tempYearGroups.some(group => group.id.toLowerCase() === newYearGroupId.toLowerCase())) {
      alert('A year group with this ID already exists.');
      return;
    }
    
    const newYearGroup = {
        id: newYearGroupId,
        name: newYearGroupName,
        color: newYearGroupColor
    };
    
    // Add new year group to temp state
    const updatedYearGroups = [...tempYearGroups, newYearGroup];
    setTempYearGroups(updatedYearGroups);

    console.log('🔄 Adding year group and persisting immediately:', newYearGroup);
    updateYearGroups(updatedYearGroups);
    updateYearGroupSections(
      (prev) => prev.map((s) => (s.id === 'other' ? { ...s, yearGroupIds: [...(s.yearGroupIds || []), newYearGroup.id] } : s)),
      updatedYearGroups
    );
    try {
      await forceSyncToSupabase({ yearGroups: updatedYearGroups });
    } catch (e) {
      console.warn('Year group added locally; Supabase sync will retry.', e);
    }
    // Reset form
    setNewYearGroupId('');
    setNewYearGroupName('');
    setNewYearGroupColor('#3B82F6');
    
    // Set newly added year group to show notification
    setNewlyAddedYearGroup({ id: newYearGroup.id, name: newYearGroup.name });
    
    console.log('✅ Year group added and persisted:', newYearGroup.name);
  };

  const handleUpdateYearGroup = async (index: number, id: string, name: string, color: string) => {
    const updatedYearGroups = [...tempYearGroups];
    const oldYearGroup = updatedYearGroups[index];
    const oldId = oldYearGroup?.id ?? '';
    updatedYearGroups[index] = { ...oldYearGroup, id, name, color };
    setTempYearGroups(updatedYearGroups);
    setEditingYearGroup(null);

    console.log('🔄 Updating year group and persisting immediately:', { id, name, color });
    updateYearGroups(updatedYearGroups);

    // If the id changed, update sections so the year group still appears in the same section (it was disappearing because sections still referenced the old id)
    if (oldId && oldId !== id) {
      updateYearGroupSections(
        (prev) =>
          prev.map((s) => ({
            ...s,
            yearGroupIds: (s.yearGroupIds || []).map((mid) => (mid === oldId ? id : mid)),
          })),
        updatedYearGroups
      );
    }
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
    if (!draggedId) return;
    const groups = tempYearGroups;
    const targetSection = yearGroupSections.find(s => s.id === sectionId);
    const sourceSection = yearGroupSections.find(s =>
      s.yearGroupIds.some(t => resolveYearGroupFromToken(groups, t)?.id === draggedId)
    );
    if (!targetSection) return;
    updateYearGroupSections(prev => {
      return prev.map(s => {
        if (s.id === sectionId) {
          const ids = normalizeSectionYearGroupIdList([...s.yearGroupIds], groups);
          if (ids.includes(draggedId)) {
            const dragIdx = ids.indexOf(draggedId);
            ids.splice(dragIdx, 1);
            const insertIdx = ids.indexOf(targetId);
            ids.splice(insertIdx >= 0 ? insertIdx : ids.length, 0, draggedId);
          } else {
            const insertIdx = ids.indexOf(targetId);
            ids.splice(insertIdx >= 0 ? insertIdx : ids.length, 0, draggedId);
          }
          return { ...s, yearGroupIds: ids };
        }
        if (sourceSection && s.id === sourceSection.id) {
          return {
            ...s,
            yearGroupIds: normalizeSectionYearGroupIdList(
              s.yearGroupIds.filter(t => resolveYearGroupFromToken(groups, t)?.id !== draggedId),
              groups
            ),
          };
        }
        return s;
      });
    });
  };

  /** Drop a year group onto a key stage section (header or empty area) to move it into that section. */
  const handleYearGroupDropOnSection = (draggedId: string, sectionId: string) => {
    if (!draggedId) return;
    const groups = tempYearGroups;
    const targetSection = yearGroupSections.find(s => s.id === sectionId);
    const sourceSection = yearGroupSections.find(s =>
      s.yearGroupIds.some(t => resolveYearGroupFromToken(groups, t)?.id === draggedId)
    );
    if (!targetSection) return;
    if (sourceSection?.id === sectionId) return;
    updateYearGroupSections(prev => prev.map(s => {
      if (s.id === sectionId) {
        const base = normalizeSectionYearGroupIdList([...(s.yearGroupIds || [])], groups);
        if (!base.includes(draggedId)) base.push(draggedId);
        return { ...s, yearGroupIds: base, collapsed: false };
      }
      if (sourceSection && s.id === sourceSection.id) {
        return {
          ...s,
          yearGroupIds: normalizeSectionYearGroupIdList(
            s.yearGroupIds.filter(t => resolveYearGroupFromToken(groups, t)?.id !== draggedId),
            groups
          ),
        };
      }
      return s;
    }));
    setDraggedYearGroup(null);
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



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-[60]">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[98vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600 flex-shrink-0" />
            <h2 
              className="text-lg sm:text-xl font-bold text-gray-900 truncate"
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
            >
              User Settings
            </h2>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex-shrink-0"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Tabs - Wrap so all items visible; scroll horizontally on very small screens */}
        <div 
          className="flex flex-wrap gap-1 sm:gap-3 px-3 sm:px-4 py-2 bg-gray-100 overflow-x-auto relative z-10 border-b border-gray-200 shadow-sm" 
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: '#9CA3AF #F3F4F6',
            minHeight: '48px'
          }}
        >
          {/* Year Groups */}
          <button
            onClick={() => setActiveTab('yeargroups')}
            className={`px-4 sm:px-7 py-3 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 focus:outline-none ${
              activeTab === 'yeargroups' 
                ? 'text-white bg-gradient-to-r from-teal-500 to-teal-600' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-teal-50'
            }`}
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', border: 'none', borderLeft: 'none', borderRight: 'none' }}
          >
            Year Groups
          </button>
          
          {/* Categories */}
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 sm:px-7 py-3 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 focus:outline-none ${
              activeTab === 'categories' 
                ? 'text-white bg-gradient-to-r from-teal-500 to-teal-600' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-teal-50'
            }`}
            style={{ 
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', 
              border: 'none', 
              borderLeft: 'none', 
              borderRight: 'none',
              borderTop: 'none',
              borderBottom: 'none',
              outline: 'none',
              boxShadow: 'none',
              marginLeft: activeTab === 'categories' ? '-1px' : '0',
              marginRight: activeTab === 'categories' ? '-1px' : '0',
              zIndex: activeTab === 'categories' ? 1 : 0
            }}
          >
            Categories
          </button>
          
          {/* Custom Objectives */}
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`px-4 sm:px-7 py-3 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 focus:outline-none ${
              activeTab === 'admin'
                ? 'text-white bg-gradient-to-r from-teal-500 to-teal-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-teal-50'
            }`}
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', border: 'none', borderLeft: 'none', borderRight: 'none' }}
          >
            Custom Objectives
          </button>

          {/* Purchases */}
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-4 sm:px-7 py-3 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 focus:outline-none ${
              activeTab === 'purchases'
                ? 'text-white bg-gradient-to-r from-teal-500 to-teal-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-teal-50'
            }`}
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', border: 'none', borderLeft: 'none', borderRight: 'none' }}
          >
            <span className="hidden sm:inline">🛒</span> Resource Shop
          </button>

          {/* Users – dedicated tab for superuser/admin: user info, types, password reset */}
          {showUserManagement && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 sm:px-7 py-3 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 focus:outline-none ${
                activeTab === 'users'
                  ? 'text-white bg-gradient-to-r from-teal-500 to-teal-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-teal-50'
              }`}
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', border: 'none', borderLeft: 'none', borderRight: 'none' }}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Users</span>
              </div>
            </button>
          )}

          {/* Admin – dropdown: General, Resource Links, Data & Backup (all users); Manage Packs, Branding (admin only) */}
          <div className="relative flex-shrink-0" ref={adminMenuRef}>
            <button
              ref={adminTriggerRef}
              type="button"
              onClick={() => setAdminMenuOpen(prev => !prev)}
              className={`px-4 sm:px-7 py-3 font-medium text-xs sm:text-sm whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 focus:outline-none ${
                (activeTab === 'resource-links' || activeTab === 'data' || activeTab === 'manage-packs' || activeTab === 'branding' || activeTab === 'users')
                  ? 'text-white bg-gradient-to-r from-teal-500 to-teal-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-teal-50'
              }`}
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', border: 'none', borderLeft: 'none', borderRight: 'none' }}
            >
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Admin</span>
              <ChevronDown className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {adminMenuOpen && adminDropdownPosition && (
              <div
                className="fixed py-1 w-52 bg-white rounded-lg border border-gray-200 shadow-xl z-[100]"
                style={{ top: adminDropdownPosition.top, left: adminDropdownPosition.left }}
              >
                {showUserManagement && (
                  <button
                    type="button"
                    onClick={() => { setActiveTab('users'); setAdminMenuOpen(false); }}
                    className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${activeTab === 'users' ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700'}`}
                  >
                    <Users className="h-4 w-4" />
                    Users
                  </button>
                )}
                {(isAdmin || isCreator) && (
                  <button
                    type="button"
                    onClick={() => { setActiveTab('manage-packs'); setAdminMenuOpen(false); }}
                    className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${activeTab === 'manage-packs' ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700'}`}
                  >
                    <Package className="h-4 w-4" />
                    Manage Packs
                  </button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => { setActiveTab('branding'); setAdminMenuOpen(false); }}
                    className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${activeTab === 'branding' ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700'}`}
                  >
                    <Palette className="h-4 w-4" />
                    Branding
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setActiveTab('resource-links'); setAdminMenuOpen(false); }}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${activeTab === 'resource-links' ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700'}`}
                >
                  <LinkIcon className="h-4 w-4" />
                  Resource Links
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  type="button"
                  onClick={() => { setActiveTab('data'); setAdminMenuOpen(false); }}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${activeTab === 'data' ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700'}`}
                >
                  <Database className="h-4 w-4" />
                  Data & Backup
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Content - Responsive padding */}
        <div ref={settingsContentRef} className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-8">
          {/* Settings saved notification - at top like other notifications, auto-hides after 3s */}
          {saveSuccess && (
            <div className="px-4 py-3 rounded-lg border border-teal-200" style={{ backgroundColor: '#E6F7F5' }}>
              <div className="flex items-center space-x-2" style={{ color: '#0BA596' }}>
                <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Settings saved successfully!</span>
              </div>
            </div>
          )}

          {activeTab === 'yeargroups' && (
            <div className="space-y-4">
              {/* Class Management */}
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Users className="h-6 w-6 text-teal-600" />
                    <h3 
                      className="text-lg font-semibold text-gray-900"
                      style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
                    >
                      Class Management
                    </h3>
                  </div>
                  <button
                    onClick={handleResetYearGroups}
                    className="px-3 py-1.5 bg-teal-100 hover:bg-teal-200 text-teal-700 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    title="⚠️ DANGER: This will delete all custom year groups and reset to the 3 defaults!"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Reset to Default</span>
                  </button>
                </div>

                {/* Add New Year Group */}
                <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
                  <h4 
                    className="font-medium text-gray-900 mb-3"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
                  >
                    Add New Year Group
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="newYearGroupId" className="block text-xs font-medium text-gray-500 mb-1">
                        ID (used in system)
                      </label>
                      <input
                        id="newYearGroupId"
                        name="newYearGroupId"
                        type="text"
                        value={newYearGroupId}
                        onChange={(e) => setNewYearGroupId(e.target.value)}
                        placeholder="e.g., Year1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:outline-none text-sm"
                        style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label htmlFor="newYearGroupName" className="block text-xs font-medium text-gray-500 mb-1">
                        Display Name
                      </label>
                      <input
                        id="newYearGroupName"
                        name="newYearGroupName"
                        type="text"
                        value={newYearGroupName}
                        onChange={(e) => setNewYearGroupName(e.target.value)}
                        placeholder="e.g., Year 1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:outline-none text-sm"
                        style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
                      />
                    </div>
                    <div>
                      <label htmlFor="newYearGroupColor" className="block text-xs font-medium text-gray-500 mb-1">
                        Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          id="newYearGroupColor"
                          name="newYearGroupColor"
                          type="color"
                          value={newYearGroupColor}
                          onChange={(e) => setNewYearGroupColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <button
                          onClick={handleAddYearGroup}
                          disabled={!newYearGroupId.trim() || !newYearGroupName.trim()}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                          style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

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

                {/* Year Groups List */}
                <div className="bg-white rounded-lg border border-teal-200 p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-900">Manage Year Groups</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (isRefreshing) return; // Prevent multiple clicks
                          
                          setIsRefreshing(true);
                          try {
                            console.log('🔄 Manual refresh requested...');
                            const success = await forceRefreshFromSupabase();
                            if (success) {
                              console.log('✅ Manual refresh completed');
                              // Update temp state to match refreshed data
                              setTempYearGroups(customYearGroups);
                            }
                          } catch (error) {
                            console.error('❌ Manual refresh failed:', error);
                          } finally {
                            setIsRefreshing(false);
                          }
                        }}
                        disabled={isRefreshing}
                        className={`flex items-center gap-2 px-3 py-1 text-sm rounded-md transition-colors ${
                          isRefreshing 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                        }`}
                        title={isRefreshing ? "Refreshing..." : "Refresh from server"}
                      >
                        <RotateCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Group year groups into collapsible sections (e.g. EYFS, KS1, KS2). Drag to reorder within a section. Sections are customisable.
                  </p>
                  <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleUndoSections}
                      disabled={sectionUndoStack.length === 0}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        sectionUndoStack.length === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title="Undo section changes"
                    >
                      <Undo2 className="h-4 w-4" /> Undo
                    </button>
                    <button
                      type="button"
                      onClick={handleRedoSections}
                      disabled={sectionRedoStack.length === 0}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        sectionRedoStack.length === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title="Redo section changes"
                    >
                      <Redo2 className="h-4 w-4" /> Redo
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await addMissingDefaultYearGroups();
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Add any default year groups that are missing (e.g. Reception)"
                    >
                      Add back missing defaults
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const sorted = [...yearGroupSections].sort((a, b) => a.sortOrder - b.sortOrder);
                        const maxOrder = sorted.length ? Math.max(...sorted.map(s => s.sortOrder)) : -1;
                        updateYearGroupSections(prev => [...prev, { id: `section-${Date.now()}`, label: 'New section', sortOrder: maxOrder + 1, collapsed: false, yearGroupIds: [] }]);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-teal-700 bg-teal-100 hover:bg-teal-200 rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" /> Add section
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[480px] overflow-y-auto">
                    {[...yearGroupSections].sort((a, b) => a.sortOrder - b.sortOrder).map((section) => {
                      const yearGroupsInSection = section.yearGroupIds
                        .map(token => resolveYearGroupFromToken(tempYearGroups, token))
                        .filter(Boolean) as typeof tempYearGroups;
                      return (
                        <div key={section.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                          <div
                            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                            onDrop={(e) => {
                              e.preventDefault();
                              const id = draggedYearGroup || e.dataTransfer.getData('text/plain') || null;
                              if (id) handleYearGroupDropOnSection(id, section.id);
                              handleYearGroupDragEnd();
                            }}
                            className="w-full"
                          >
                          <button
                            type="button"
                            onClick={() => updateYearGroupSections(prev => prev.map(s => s.id === section.id ? { ...s, collapsed: !s.collapsed } : s))}
                            className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-left"
                          >
                            {section.collapsed ? (
                              <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            )}
                            {editingSectionId === section.id ? (
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
                                className="flex-1 min-w-0 px-2 py-0.5 border border-teal-300 rounded text-sm"
                                autoFocus
                              />
                            ) : (
                              <span className="font-medium text-gray-900 flex-1">{section.label}</span>
                            )}
                            {editingSectionId !== section.id && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setEditingSectionId(section.id); setEditingSectionLabel(section.label); }}
                                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
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
                            <span className="text-xs text-gray-500">({yearGroupsInSection.length})</span>
                          </button>
                          </div>
                          {!section.collapsed && (
                            <div className="p-2 pt-0 space-y-1.5 border-t border-gray-100">
                              {yearGroupsInSection.length === 0 ? (
                                <div
                                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    const id = draggedYearGroup || e.dataTransfer.getData('text/plain') || null;
                                    if (id) handleYearGroupDropOnSection(id, section.id);
                                    handleYearGroupDragEnd();
                                  }}
                                  className="min-h-[3rem] rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center py-3 px-2"
                                >
                                  <p className="text-sm text-gray-500 text-center">Drop year groups here, or drag from Other above.</p>
                                </div>
                              ) : (
                                yearGroupsInSection.map((yearGroup) => {
                                  const index = resolveYearGroupIndex(yearGroup);
                                  return (
                                    <div
                                      key={yearGroup.id}
                                      draggable
                                      onDragStart={(e) => handleYearGroupDragStart(e, yearGroup.id)}
                                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        const draggedId = draggedYearGroup || e.dataTransfer.getData('text/plain') || null;
                                        if (draggedId) handleYearGroupDropInSection(draggedId, yearGroup.id, section.id);
                                        handleYearGroupDragEnd();
                                      }}
                                      onDragEnd={handleYearGroupDragEnd}
                                      className={`p-3 rounded-lg transition-colors duration-200 cursor-move ${
                                        draggedYearGroup === yearGroup.id ? 'bg-teal-50 border-2 border-teal-300 opacity-50' : 'bg-gray-50 hover:bg-gray-100'
                                      }`}
                                    >
                                      {editingYearGroup === yearGroup.id ? (
                                        <div className="flex items-center space-x-3">
                                          <div className="flex-shrink-0 cursor-move"><GripVertical className="h-5 w-5 text-gray-400" /></div>
                                          <div className="flex-1 grid grid-cols-3 gap-3">
                                            <input type="text" value={editingYearGroupDraft?.id ?? yearGroup.id} onChange={(e) => setEditingYearGroupDraft(prev => prev ? { ...prev, id: e.target.value } : null)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" dir="ltr" />
                                            <input type="text" value={editingYearGroupDraft?.name ?? yearGroup.name} onChange={(e) => setEditingYearGroupDraft(prev => prev ? { ...prev, name: e.target.value } : null)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                                            <input type="color" value={editingYearGroupDraft?.color ?? yearGroup.color} onChange={(e) => setEditingYearGroupDraft(prev => prev ? { ...prev, color: e.target.value } : null)} className="w-10 h-8 rounded border border-gray-300 cursor-pointer" />
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
                                                  editingYearGroupDraft.id,
                                                  editingYearGroupDraft.name,
                                                  editingYearGroupDraft.color
                                                );
                                                setEditingYearGroupDraft(null);
                                                setEditingYearGroup(null);
                                              }}
                                              className="p-1.5 text-teal-600 hover:bg-teal-50 rounded"
                                            >
                                              <Save className="h-5 w-5" />
                                            </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center space-x-3">
                                          <div className="flex-shrink-0 cursor-move"><GripVertical className="h-5 w-5 text-gray-400" /></div>
                                          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: yearGroup.color }} />
                                          <div className="flex-1 min-w-0 font-medium text-gray-900 truncate">{yearGroup.name}</div>
                                          <select
                                            value={section.id}
                                            onChange={(e) => {
                                              const nextSectionId = e.target.value;
                                              if (!nextSectionId || nextSectionId === section.id) return;
                                              const targetExists = yearGroupSections.some((s) => s.id === nextSectionId);
                                              if (!targetExists) return;
                                              // Atomic move: remove the year group from every section, then add it
                                              // to the target. This avoids any source-resolution edge cases and
                                              // guarantees the dropdown reflects the new section on the next render.
                                              updateYearGroupSections((prev) => prev.map((s) => {
                                                const cleaned = normalizeSectionYearGroupIdList(
                                                  (s.yearGroupIds || []).filter(
                                                    (t) => resolveYearGroupFromToken(tempYearGroups, t)?.id !== yearGroup.id
                                                  ),
                                                  tempYearGroups
                                                );
                                                if (s.id === nextSectionId) {
                                                  return { ...s, yearGroupIds: [...cleaned, yearGroup.id], collapsed: false };
                                                }
                                                return { ...s, yearGroupIds: cleaned };
                                              }));
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                            draggable={false}
                                            className="flex-shrink-0 w-40 max-w-[10rem] px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700 hover:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                            title="Assign to section"
                                          >
                                            <option value="" disabled>Select section</option>
                                            {[...yearGroupSections]
                                              .sort((a, b) => a.sortOrder - b.sortOrder)
                                              .map((s) => (
                                                <option key={s.id} value={s.id}>{s.label}</option>
                                              ))}
                                          </select>
                                          <div className="flex items-center gap-1">
                                            <button type="button" onClick={() => { setEditingYearGroup(yearGroup.id); setEditingYearGroupDraft({ id: yearGroup.id, name: yearGroup.name, color: yearGroup.color || '#14B8A6' }); }} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"><Edit3 className="h-4 w-4" /></button>
                                            <button
                                              type="button"
                                              onClick={() => void handleDeleteYearGroup(yearGroup)}
                                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Warning about changing IDs */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                <div className="flex items-start space-x-3">
                  <div className="text-yellow-600 flex-shrink-0 mt-0.5">⚠️</div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Important Note About Year Group IDs</h4>
                    <p className="text-sm text-gray-600">
                      Changing the ID of an existing year group will break existing lesson assignments and activities.
                      Only modify IDs for newly created year groups.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <>

              {/* Category Management */}
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Palette className="h-6 w-6 text-teal-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Activity Categories</h3>
                  </div>
                  <button
                    onClick={handleResetCategories}
                    className="px-3 py-1.5 bg-teal-100 hover:bg-teal-200 text-teal-700 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-1"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset to Default</span>
                  </button>
                </div>

                {/* Add New Category */}
                <div className="bg-white rounded-lg border border-teal-200 p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Add New Category</h4>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:outline-none"
                        dir="ltr"
                      />
                    </div>
                    <div className="w-24">
                      <label htmlFor="newCategoryColor" className="sr-only">Category color</label>
                      <input
                        id="newCategoryColor"
                        name="newCategoryColor"
                        type="color"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                      />
                    </div>
                    <button
                      onClick={handleAddCategory}
                      disabled={!newCategoryName.trim()}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add</span>
                    </button>
                    </div>
                    
                    {/* Year Groups Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available for Year Groups
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
                            : 'Select year groups'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Year Groups Selection Modal */}
                {showYearGroupsModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                      {/* Header - Teal gradient matching other modals */}
                      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-teal-500 to-teal-600 text-white flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold">Available for Year Groups</h2>
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
                                    className="h-5 w-5 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
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
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Done
                        </button>
                  </div>
                </div>
                  </div>
                )}

                {/* Category List */}
                <div className="bg-white rounded-lg border border-teal-200 p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-900">
                      Manage Categories
                      {isRefreshing && (
                        <span className="ml-2 text-sm text-teal-600">(Refreshing...)</span>
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
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded-md hover:bg-teal-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Refresh categories from server"
                    >
                      <RotateCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Drag and drop to reorder categories. Changes will affect how categories are displayed throughout the application.
                  </p>

                  {/* Bulk Year Group Assignment Section */}
                  {bulkYearGroupMode && (
                    <div className="mb-6 p-5 bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-300 rounded-xl shadow-sm">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 mb-1">Bulk Assign Year Groups</h4>
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
                              <span className="font-semibold text-teal-600">{selectedYearGroupsForBulk.size} year group{selectedYearGroupsForBulk.size !== 1 ? 's' : ''} selected</span>
                              {' — '}
                              Select categories below, then apply.
                            </span>
                            <button
                              type="button"
                              onClick={() => setBulkStep1Collapsed(false)}
                              className="px-3 py-1.5 text-sm font-medium text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors border border-teal-200"
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
                                  className="px-3 py-1 text-xs font-medium text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded transition-colors"
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
                                      isSelected ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
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
                                  <span className="text-teal-600 font-semibold">
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
                            <span className="text-teal-600 font-semibold">
                              {selectedCategoriesForBulk.size} categor{selectedCategoriesForBulk.size !== 1 ? 'ies' : 'y'} selected
                                </span>
                          ) : (
                            <span>Click on categories below to select them</span>
                          )}
                        </div>
                      </div>

                      {/* Step 3: Action Buttons */}
                      {selectedCategoriesForBulk.size > 0 && selectedYearGroupsForBulk.size > 0 && (
                        <div className="p-4 bg-white rounded-lg border-2 border-teal-300">
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
                              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2"
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
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Filter className="h-4 w-4" />
                        Bulk Assign Year Groups
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to remove ALL year group assignments (LKG, UKG, Reception) from ALL categories? This cannot be undone.')) {
                            const updatedCategories = tempCategories.map(cat => ({
                              ...cat,
                              yearGroups: { LKG: false, UKG: false, Reception: false }
                            }));
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
                        Clear All Year Groups
                      </button>
                    </div>
                  )}
                  
                  <DndProvider backend={HTML5Backend}>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-6">
                    {tempCategories.map((category, index) => {
                      // Use index as stable identifier for editing state (not name, which changes)
                      const isEditing = editingCategory === `category-index-${index}`;
                      
                      return (
                      <DraggableCategory
                        key={`category-${index}-${category.position || index}`}
                        category={category}
                        index={index}
                        onReorder={(dragIndex, hoverIndex) => {
                          const newCategories = [...tempCategories];
                          const [removed] = newCategories.splice(dragIndex, 1);
                          newCategories.splice(hoverIndex, 0, removed);
                          newCategories.forEach((cat, i) => {
                            cat.position = i;
                          });
                          setTempCategories(newCategories);
                        }}
                        onDragEnd={() => {
                          // Save the new order when drag ends
                          updateCategories(tempCategories);
                        }}
                      >
                      <div 
                        className={`p-3 rounded-lg transition-colors duration-200 ${
                          bulkYearGroupMode && selectedCategoriesForBulk.has(category.name) ? 'bg-teal-100 border-teal-300 border-2' :
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
                                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:outline-none"
                                dir="ltr"
                              />
                              <input
                                id={`editCategoryColor-${index}`}
                                name={`editCategoryColor-${index}`}
                                type="color"
                                  value={tempCategories[index]?.color || category.color}
                                onChange={(e) => {
                                  const updatedCategories = [...tempCategories];
                                  updatedCategories[index] = { ...updatedCategories[index], color: e.target.value };
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
                                className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors duration-200"
                                  title="Save changes"
                              >
                                <Save className="h-5 w-5" />
                              </button>
                              </div>
                            </div>
                            
                            {/* Year Groups Editing Section */}
                            <div className="ml-8 pl-2 border-l-2 border-gray-200">
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Available for Year Groups
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
                                        className="rounded-full border border-gray-300 text-teal-600 focus:ring-teal-500 focus:ring-offset-0 checked:border-0 checked:bg-teal-600"
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
                                <div className="font-semibold text-gray-900 mb-2" dir="ltr">{category.name}</div>
                                
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
                                            className="rounded-full border border-gray-300 text-teal-600 focus:ring-teal-500 focus:ring-offset-0 checked:border-0 checked:bg-teal-600"
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
                                        className="text-xs text-teal-600 hover:text-teal-800 px-2 py-1 hover:bg-teal-50 rounded font-medium"
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
                                            className="px-2 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full"
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
                                      className="px-2 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full hover:bg-teal-100 transition-colors border border-teal-200 mt-1"
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
                                  className="w-4 h-4 rounded-full border border-gray-300 text-teal-600 focus:ring-teal-500 focus:ring-offset-0 checked:border-0 checked:bg-teal-600"
                                />
                              ) : (
                                <>
                              <button
                                    onClick={() => setEditingCategory(`category-index-${index}`)}
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(index)}
                                disabled={profile?.admin_preset_categories?.includes(category.name) === true}
                                title={profile?.admin_preset_categories?.includes(category.name) ? 'Assigned by admin; cannot remove' : 'Delete category'}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      </DraggableCategory>
                      );
                    })}
                  </div>
                  </DndProvider>
                </div>
              </div>

            </>
          )}

          {activeTab === 'purchases' && (
            <div className="space-y-6">
              {/* Resource Shop Header */}
              <div className="rounded-lg p-6 bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">🛒</span>
                  <h3 className="text-xl font-bold text-gray-900">Resource Shop</h3>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  Expand your curriculum with specialised activity card sets. Each set includes professionally designed activities tailored to specific subjects and age groups.
                </p>
                <p className="text-xs text-gray-600">
                  Connected account: <span className="font-semibold">{user?.email || 'Not signed in'}</span>
                </p>
              </div>

              {/* Available Card Sets */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Available Card Sets</h4>

                {/* Packs from database (e.g. Comedia) – visible for purchase and allocation */}
                {shopPacks.length > 0 && (
                  <div className="space-y-4">
                    {shopPacks.map((pack) => {
                      const paypalReturn = typeof window !== 'undefined' ? window.location.origin : '';
                      const paypalLink = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=rob.reichstorer@gmail.com&amount=${pack.price}&currency_code=GBP&item_name=${encodeURIComponent(pack.name)}&return=${encodeURIComponent(paypalReturn)}`;
                      return (
                        <div key={pack.pack_id} className="rounded-lg border border-teal-200 bg-white p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <span className="text-4xl" aria-hidden>{pack.icon || '📦'}</span>
                                <div>
                                  <h5 className="text-xl font-bold text-gray-900">{pack.name}</h5>
                                  <p className="text-sm text-teal-600 font-medium">
                                    {pack.stack_ids?.length ? 'Full lesson pack' : 'Activity pack'}
                                  </p>
                                </div>
                              </div>
                              {pack.description && (
                                <p className="text-sm text-gray-700 mb-4">{pack.description}</p>
                              )}
                              <div className="flex items-center space-x-4 mb-4">
                                <span className="text-3xl font-bold text-teal-600">£{Number(pack.price || 0).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <a
                              href={paypalLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-center flex items-center justify-center space-x-2"
                            >
                              <span>💳</span>
                              <span>Purchase via PayPal or card</span>
                            </a>
                          </div>
                          <p className="text-xs text-gray-500 mt-3 text-center">
                            After purchase, the pack will be added to your account (or contact support with your order details).
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Drama Games Card Set */}
                <div className="rounded-lg border border-teal-200 bg-white p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-4xl">🎭</span>
                        <div>
                          <h5 className="text-xl font-bold text-gray-900">Drama Games Activity Pack</h5>
                          <p className="text-sm text-teal-600 font-medium">Unlock 50+ Drama Activities</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-700">
                          Transform your drama lessons with this comprehensive collection of engaging drama games and activities suitable for KS1 and KS2.
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1 ml-4">
                          <li>• 50+ Professional Drama Activities</li>
                          <li>• Warm-up Games & Icebreakers</li>
                          <li>• Improvisation Exercises</li>
                          <li>• Character Development Activities</li>
                          <li>• Group Performance Projects</li>
                          <li>• Curriculum-Aligned Objectives</li>
                        </ul>
                      </div>

                      <div className="flex items-center space-x-4 mb-4">
                        <span className="text-3xl font-bold text-teal-600">£24.99</span>
                        <span className="text-sm text-gray-500 line-through">£39.99</span>
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">SAVE 38%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <a
                      href="https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=rob.reichstorer@gmail.com&amount=24.99&currency_code=GBP&item_name=Drama%20Games%20Activity%20Pack&return=http://localhost:5173"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-center flex items-center justify-center space-x-2"
                    >
                      <span>💳</span>
                      <span>Purchase Now via PayPal or debit and credit card</span>
                    </a>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    After purchase, the activities will automatically appear in your Activity Library within 24 hours.
                  </p>
                </div>

                {/* Commedia dell'arte for KS3 */}
                <div className="rounded-lg border border-teal-200 bg-white p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-4xl">🎭</span>
                        <div>
                          <h5 className="text-xl font-bold text-gray-900">Commedia dell'arte – KS3 Drama</h5>
                          <p className="text-sm text-teal-600 font-medium">Full lesson packs ready to use</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-4">
                        Complete lesson packs on Commedia dell'arte for KS3. Just download the pack and add the lessons straight into your built-in teaching calendar—no extra setup.
                      </p>
                      <div className="flex items-center space-x-4 mb-4">
                        <span className="text-3xl font-bold text-teal-600">£24.99</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <a
                      href="https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=rob.reichstorer@gmail.com&amount=24.99&currency_code=GBP&item_name=Commedia%20dell%27arte%20KS3%20Lesson%20Pack&return=http://localhost:5173"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-center flex items-center justify-center space-x-2"
                    >
                      <span>💳</span>
                      <span>Purchase via PayPal or card</span>
                    </a>
                  </div>
                </div>

                {/* Improvisation for KS3 */}
                <div className="rounded-lg border border-teal-200 bg-white p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-4xl">🎪</span>
                        <div>
                          <h5 className="text-xl font-bold text-gray-900">Improvisation – KS3 Drama</h5>
                          <p className="text-sm text-teal-600 font-medium">Full lesson pack</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-4">
                        A full lesson pack focused on improvisation for KS3 drama. Download and add the sessions directly to your teaching calendar.
                      </p>
                      <div className="flex items-center space-x-4 mb-4">
                        <span className="text-3xl font-bold text-teal-600">£24.99</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <a
                      href="https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=rob.reichstorer@gmail.com&amount=24.99&currency_code=GBP&item_name=Improvisation%20KS3%20Lesson%20Pack&return=http://localhost:5173"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-center flex items-center justify-center space-x-2"
                    >
                      <span>💳</span>
                      <span>Purchase via PayPal or card</span>
                    </a>
                  </div>
                </div>

                {/* Kneehigh Theatre – KS3 */}
                <div className="rounded-lg border border-teal-200 bg-white p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-4xl">🎬</span>
                        <div>
                          <h5 className="text-xl font-bold text-gray-900">Kneehigh Theatre – KS3 Drama Practitioner</h5>
                          <p className="text-sm text-teal-600 font-medium">Full lesson pack</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-4">
                        Explore the Kneehigh style and devising techniques with this KS3 drama practitioner pack. Download the lessons and add them to your built-in calendar.
                      </p>
                      <div className="flex items-center space-x-4 mb-4">
                        <span className="text-3xl font-bold text-teal-600">£24.99</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <a
                      href="https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=rob.reichstorer@gmail.com&amount=24.99&currency_code=GBP&item_name=Kneehigh%20Theatre%20KS3%20Lesson%20Pack&return=http://localhost:5173"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-center flex items-center justify-center space-x-2"
                    >
                      <span>💳</span>
                      <span>Purchase via PayPal or card</span>
                    </a>
                  </div>
                </div>

                {/* Brecht for KS3 */}
                <div className="rounded-lg border border-teal-200 bg-white p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-4xl">🎭</span>
                        <div>
                          <h5 className="text-xl font-bold text-gray-900">Brecht – KS3 Drama Practitioner</h5>
                          <p className="text-sm text-teal-600 font-medium">Full lesson pack</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-4">
                        Full lesson packs on Brecht for KS3 drama. Download and slot the sessions into your teaching calendar—no extra setup.
                      </p>
                      <div className="flex items-center space-x-4 mb-4">
                        <span className="text-3xl font-bold text-teal-600">£24.99</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <a
                      href="https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=rob.reichstorer@gmail.com&amount=24.99&currency_code=GBP&item_name=Brecht%20KS3%20Lesson%20Pack&return=http://localhost:5173"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-center flex items-center justify-center space-x-2"
                    >
                      <span>💳</span>
                      <span>Purchase via PayPal or card</span>
                    </a>
                  </div>
                </div>

                {/* Coming Soon - More Card Sets */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 opacity-75">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-4xl grayscale">🎵</span>
                    <div>
                      <h5 className="text-xl font-bold text-gray-700">Music Games Activity Pack</h5>
                      <p className="text-sm text-gray-500 font-medium">Coming Soon</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    50+ Music activities covering rhythm, pitch, ensemble work, and creative composition.
                  </p>
                  </div>
                  
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 opacity-75">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-4xl grayscale">⚽</span>
                    <div>
                      <h5 className="text-xl font-bold text-gray-700">PE Games Activity Pack</h5>
                      <p className="text-sm text-gray-500 font-medium">Coming Soon</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    60+ Physical Education activities including team sports, fitness, and coordination exercises.
                  </p>
                </div>
              </div>

              {/* Support Section */}
              <div className="rounded-lg bg-teal-50 border border-teal-200 p-4 mt-6">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">ℹ️</span>
                  <div className="flex-1">
                    <h6 className="font-semibold text-gray-900 mb-1">Need Help?</h6>
                    <p className="text-sm text-gray-700">
                      If you've purchased a pack but it hasn't appeared in your library, please contact support at{' '}
                      <a href="mailto:support@rhythmstiix.co.uk" className="text-teal-600 hover:text-teal-700 font-medium">
                        support@rhythmstiix.co.uk
                      </a>
                      {' '}with your order number.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <DataSourceSettings embedded={true} />
            </div>
          )}

          {activeTab === 'manage-packs' && (
            <div className="space-y-6">
              {/* Activity Packs Management */}
              <div className="border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <Package className="h-6 w-6 text-teal-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Activity Packs Management</h3>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Create and manage activity packs for purchase. Link categories to packs, set prices, and track purchases.
                </p>
                
                <ActivityPacksAdmin userEmail={user?.email || ''} isCreator={isCreator} isAdmin={isAdmin} />
              </div>
            </div>
          )}

          {activeTab === 'resource-links' && (
            <div className="space-y-6">
              {/* General option (merged here – only one setting) */}
              <div className="bg-white rounded-lg border border-teal-200 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">General</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showButtonHelp !== false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setTempSettings(prev => ({ ...prev, showButtonHelp: checked }));
                      updateSettings({ showButtonHelp: checked });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-gray-900">Show hover help for buttons</span>
                </label>
                <p className="mt-2 text-xs text-gray-500">
                  When on, hovering over toolbar buttons (e.g. in Lesson Library) shows a short explanation.
                </p>
              </div>
              <div className="border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <LinkIcon className="h-6 w-6 text-teal-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Resource Links Customisation</h3>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Reset all resource links to defaults?')) {
                        resetResourceLinksToDefaults();
                        setTempResourceLinks(resourceLinks);
                      }
                    }}
                    className="px-3 py-1.5 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-100 rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Reset to Defaults</span>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Customise the names and icons for resource links in the Activity Creator. You can enable or disable each resource link type.
                </p>

                <div className="space-y-4">
                  {tempResourceLinks.map((link, index) => {
                    // Dynamically import the icon component
                    const IconComponent = getIconComponent(link.iconName);
                    
                    return (
                      <div key={link.key} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2 flex-1">
                            <IconComponent className="h-5 w-5 text-gray-500" />
                            <input
                              type="text"
                              value={link.label}
                              onChange={(e) => {
                                const updated = [...tempResourceLinks];
                                updated[index] = { ...updated[index], label: e.target.value };
                                setTempResourceLinks(updated);
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                              placeholder="Resource link label"
                            />
                          </div>
                          <select
                            value={link.iconName}
                            onChange={(e) => {
                              const updated = [...tempResourceLinks];
                              updated[index] = { ...updated[index], iconName: e.target.value };
                              setTempResourceLinks(updated);
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          >
                            {getAvailableIcons().map(icon => (
                              <option key={icon.name} value={icon.name}>{icon.label}</option>
                            ))}
                          </select>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={link.enabled}
                              onChange={(e) => {
                                const updated = [...tempResourceLinks];
                                updated[index] = { ...updated[index], enabled: e.target.checked };
                                setTempResourceLinks(updated);
                              }}
                              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                            />
                            <span className="text-sm text-gray-700">Enabled</span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setTempResourceLinks(resourceLinks);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      updateResourceLinks(tempResourceLinks);
                      setSaveSuccess(true);
                      setTimeout(() => setSaveSuccess(false), 3000);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div ref={adminTabContentRef} className="min-h-[620px] w-full flex flex-col">
              <CustomObjectivesAdmin embedded={true} />
            </div>
          )}

          {activeTab === 'users' && showUserManagement && (
            <AuthGuard requireCanManageUsers fallback={<div className="p-4 text-gray-600">You don’t have permission to manage users.</div>}>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">User information, user types (roles), and password reset. Manage who can access the app and send reset emails from here.</p>
                <div className="border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-6 shadow-sm">
                  <UserManagement />
                </div>
              </div>
            </AuthGuard>
          )}

          {activeTab === 'branding' && isAdmin && (
            <div className="border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Palette className="h-6 w-6 text-teal-600" />
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
                        footerContactEmail: 'info@rhythmstix.co.uk',
                        footerPrivacyUrl: 'https://www.rhythmstix.co.uk/policy',
                        footerBackgroundColor: '#128c7e',
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
                  className="px-3 py-1.5 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-100 rounded-lg transition-colors flex items-center space-x-1"
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
                      placeholder="info@rhythmstix.co.uk"
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
                      placeholder="#128c7e"
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
                      className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add social link
                    </button>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-500">
                Click &quot;Save Settings&quot; below to apply. Changes persist for this browser/deployment.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Save Settings
          </button>
        </div>
      </div>

    </div>
  );
}
