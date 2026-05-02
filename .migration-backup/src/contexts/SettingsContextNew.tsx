import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured, TABLES } from '../config/supabase';
import { yearGroupsApi, customCategoriesApi, categoryGroupsApi, brandingApi } from '../config/api';
import { useAuth } from '../hooks/useAuth';
import {
  getOrderedYearGroupsFromSections,
  mergeSectionsWithYearGroups,
  normalizeSectionYearGroupIdList,
} from '../utils/yearGroupSectionOrder';

// Safari detection for enhanced sync handling
const isSafari = () => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('safari') && !ua.includes('chrome');
};

interface Theme {
  primary: string;
  secondary: string;
  accent: string;
}

export interface Category {
  id?: string; // Supabase primary key – preserved across round-trips so upserts don't fail
  name: string;
  color: string;
  position: number;
  group?: string; // Optional single group name (for backward compatibility)
  groups?: string[]; // Optional multiple group names
  yearGroups: {
    LKG?: boolean;
    UKG?: boolean;
    Reception?: boolean;
    [key: string]: boolean | undefined; // Allow dynamic year group IDs
  };
}

export interface ResourceLinkConfig {
  key: string; // e.g., 'videoLink', 'musicLink', etc.
  label: string; // Custom label
  iconName: string; // Lucide icon name (e.g., 'Video', 'Music', 'Palette')
  enabled: boolean; // Whether this resource link is enabled
}

export interface BrandingSettings {
  // Login page customization
  loginLogoUrl?: string; // URL to custom logo image (if empty, uses default Logo component)
  logoLetters?: string; // Letters in logo circle, max 3 (e.g., "CCD")
  loginTitle?: string; // Custom title text (e.g., "Creative Curriculum Designer")
  loginSubtitle?: string; // Custom subtitle text (e.g., "From Rhythmstix")
  loginSubtitleUrl?: string; // URL for login subtitle link (default: https://www.rhythmstix.co.uk)
  loginBackgroundColor?: string; // Background color for login page (default: rgb(77, 181, 168))
  loginButtonColor?: string; // Button color (default: #008272)
  
  // Footer customization
  footerCompanyName?: string; // Company name in footer (default: "Rhythmstix")
  footerCopyrightYear?: string; // Copyright year (default: "2026")
  footerContactEmail?: string; // Contact email (default: "info@rhythmstix.co.uk")
  footerPrivacyUrl?: string; // Privacy policy URL (default: "https://www.rhythmstix.co.uk/policy")
  footerBackgroundColor?: string; // Footer background color (default: "#128c7e")
  
  // Social media links (optional - if not provided, defaults are used)
  footerYoutubeUrl?: string;
  footerLinkedinUrl?: string;
  footerFacebookUrl?: string;
  /** Customizable social links with platform + URL. Overrides legacy URLs when set. */
  footerSocialLinks?: { platform: string; url: string }[];
  
  // Show/hide social media icons
  showSocialMedia?: boolean; // Default: true
}

/** Supported social platforms for footer icons */
export const SOCIAL_PLATFORMS = [
  { id: 'youtube', label: 'YouTube', icon: 'youtube' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
  { id: 'facebook', label: 'Facebook', icon: 'facebook' },
  { id: 'twitter', label: 'X (Twitter)', icon: 'twitter' },
  { id: 'instagram', label: 'Instagram', icon: 'instagram' },
  { id: 'tiktok', label: 'TikTok', icon: 'music' },
  { id: 'other', label: 'Other / Website', icon: 'globe' },
] as const;

interface UserSettings {
  schoolName: string;
  schoolLogo: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  customTheme: boolean;
  resourceLinks?: ResourceLinkConfig[]; // Custom resource link configurations
  branding?: BrandingSettings; // White-label branding settings
  /** When true, show hover tooltips on toolbar buttons (e.g. Lesson Library sort/view). */
  showButtonHelp?: boolean;
}

interface YearGroup {
  id: string;
  name: string;
  color?: string;
}

/** A subheading (e.g. "Year 1") containing one or more classes (e.g. 1s, 1b, 1d). */
export interface YearGroupBand {
  id: string;
  name: string;
  color: string;
  classes: { id: string; name: string }[];
}

/** Collapsible section for grouping year groups (e.g. EYFS, KS1, KS2, KS3, KS4). */
export interface YearGroupSection {
  id: string;
  label: string;
  sortOrder: number;
  collapsed?: boolean;
  yearGroupIds: string[];
}

function flattenBands(bands: YearGroupBand[]): YearGroup[] {
  const out: YearGroup[] = [];
  bands.forEach(band => {
    band.classes.forEach(c => {
      out.push({ id: c.id, name: c.name, color: band.color });
    });
  });
  return out;
}

function flatToBands(flat: YearGroup[]): YearGroupBand[] {
  return flat.map(g => ({
    id: g.id,
    name: g.name,
    color: g.color || '#14B8A6',
    classes: [{ id: g.id, name: g.name }]
  }));
}

// Simple group management - just an array of group names
interface CategoryGroups {
  groups: string[];
}

interface SettingsContextType {
  getThemeForClass: (className: string) => Theme;
  getThemeForSubject: (subjectId: string) => Theme;
  categories: Category[];
  getCategoryColor: (categoryName: string) => string;
  getCategoryByName: (categoryName: string) => Category | null;
  addCategoryPermanently: (name: string, color: string) => Promise<void>;
  getSubjectCategories: () => any[];
  getCategoryColorById: (categoryId: string) => string;
  getCategoryNameById: (categoryId: string) => string;
  defaultViewMode: 'grid' | 'list' | 'compact';
  setDefaultViewMode: (mode: 'grid' | 'list' | 'compact') => void;
  isAdmin: boolean;
  setIsAdmin: (admin: boolean) => void;
  settings: UserSettings;
  customYearGroups: YearGroup[];
  yearGroupBands: YearGroupBand[];
  yearGroupSections: YearGroupSection[];
  updateYearGroups: (newYearGroups: YearGroup[]) => void;
  updateYearGroupSections: (
    sections: YearGroupSection[] | ((prev: YearGroupSection[]) => YearGroupSection[]),
    yearGroupsOverride?: YearGroup[]
  ) => void;
  /** Ordered year groups by section (for display/sync). Pass sections to use a candidate list before state updates. */
  getOrderedYearGroups: (sections?: YearGroupSection[]) => YearGroup[];
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  updateCategories: (newCategories: Category[]) => void;
  updateYearGroupBands: (bands: YearGroupBand[]) => void;
  deleteYearGroup: (
    yearGroupId: string | { id: string; name: string },
    opts?: { skipLocal?: boolean }
  ) => Promise<void>;
  deleteYearGroupClass: (bandIndex: number, classIndex: number) => void;
  addClassToBand: (bandIndex: number, classId: string, className: string) => void;
  forceSyncYearGroups: () => Promise<YearGroup[] | null>;
  cleanupDuplicates: () => Promise<void>;
  forceSyncToSupabase: (override?: { categories?: Category[]; yearGroups?: YearGroup[] }) => Promise<boolean>;
  forceRefreshFromSupabase: () => Promise<boolean>;
  forceSyncCurrentYearGroups: () => Promise<boolean>;
  forceSafariSync: () => Promise<boolean>;
  mapActivityLevelToYearGroup: (level: string) => string;
  mapYearGroupToActivityLevel: (yearGroupName: string) => string;
  resetToDefaults: () => void;
  resetCategoriesToDefaults: () => void;
  resetYearGroupsToDefaults: () => void;
  /** Add any default year groups (e.g. Reception) that are missing from the current list. */
  addMissingDefaultYearGroups: () => Promise<void>;
  /** Put any year group that exists in the list but is not in any section into Other (recovers e.g. renamed year groups that disappeared). */
  ensureYearGroupsInSections: () => void;
  // Simple Category Groups
  categoryGroups: CategoryGroups;
  addCategoryGroup: (groupName: string) => void;
  removeCategoryGroup: (groupName: string) => void;
  updateCategoryGroup: (oldName: string, newName: string) => void;
  // User change management
  startUserChange: () => void;
  endUserChange: () => void;
  // Resource link customization
  resourceLinks: ResourceLinkConfig[];
  updateResourceLinks: (links: ResourceLinkConfig[]) => void;
  resetResourceLinksToDefaults: () => void;
}

const FIXED_CATEGORIES: Category[] = [
  {
    name: 'Welcome',
    color: '#10b981',
    position: 0,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Kodaly Songs',
    color: '#3b82f6',
    position: 1,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Kodaly Action Songs',
    color: '#f97316',
    position: 2,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Action/Games Songs',
    color: '#f59e0b',
    position: 3,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Rhythm Sticks',
    color: '#d97706',
    position: 4,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Scarf Songs',
    color: '#10b981',
    position: 5,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'General Game',
    color: '#06b6d4',
    position: 6,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Core Songs',
    color: '#84cc16',
    position: 7,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Parachute Games',
    color: '#ef4444',
    position: 8,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Percussion Games',
    color: '#06b6d4',
    position: 9,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Teaching Units',
    color: '#6366f1',
    position: 10,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Goodbye',
    color: '#14b8a6',
    position: 11,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Kodaly Rhythms',
    color: '#8b5cf6',
    position: 12,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Kodaly Games',
    color: '#ec4899',
    position: 13,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'IWB Games',
    color: '#f59e0b',
    position: 14,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Drama Games',
    color: '#8b5cf6',
    position: 15,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
  {
    name: 'Vocal Warmups',
    color: '#ec4899',
    position: 16,
    yearGroups: {}, // Empty - must be explicitly assigned in settings
  },
];

// Default branding settings
const DEFAULT_BRANDING: BrandingSettings = {
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
  footerYoutubeUrl: 'https://www.youtube.com/channel/UCooHhU7FKALUQ4CtqjDFMsw',
  footerLinkedinUrl: 'https://www.linkedin.com/in/robert-reich-storer-974449144',
  footerFacebookUrl: 'https://www.facebook.com/Rhythmstix-Music-108327688309431',
  footerSocialLinks: [
    { platform: 'youtube', url: 'https://www.youtube.com/channel/UCooHhU7FKALUQ4CtqjDFMsw' },
    { platform: 'linkedin', url: 'https://www.linkedin.com/in/robert-reich-storer-974449144' },
    { platform: 'facebook', url: 'https://www.facebook.com/Rhythmstix-Music-108327688309431' },
  ],
  showSocialMedia: true
};

// Default settings
const DEFAULT_SETTINGS: UserSettings = {
  schoolName: 'Curriculum Designer',
  schoolLogo: '/cd-logo.svg',
  primaryColor: '#3B82F6',
  secondaryColor: '#2563EB',
  accentColor: '#60A5FA',
  customTheme: false,
  branding: DEFAULT_BRANDING,
  showButtonHelp: true
};

// Default year groups (flat list for backward compatibility)
const DEFAULT_YEAR_GROUPS: YearGroup[] = [
  { id: 'LKG', name: 'Lower Kindergarten', color: '#14B8A6' },
  { id: 'UKG', name: 'Upper Kindergarten', color: '#14B8A6' },
  { id: 'Reception', name: 'Reception', color: '#14B8A6' },
  { id: 'Year1', name: 'Year 1', color: '#14B8A6' },
  { id: 'Year2', name: 'Year 2', color: '#14B8A6' },
  { id: 'Year3', name: 'Year 3', color: '#14B8A6' },
  { id: 'Year4', name: 'Year 4', color: '#14B8A6' },
  { id: 'Year5', name: 'Year 5', color: '#14B8A6' },
  { id: 'Year6', name: 'Year 6', color: '#14B8A6' },
  { id: 'ReceptionDrama', name: 'Reception Drama', color: '#8B5CF6' },
  { id: 'Year1Drama', name: 'Year 1 Drama', color: '#8B5CF6' },
  { id: 'Year2Drama', name: 'Year 2 Drama', color: '#8B5CF6' },
  { id: 'Year3Drama', name: 'Year 3 Drama', color: '#8B5CF6' },
  { id: 'Year4Drama', name: 'Year 4 Drama', color: '#8B5CF6' },
  { id: 'Year5Drama', name: 'Year 5 Drama', color: '#8B5CF6' },
  { id: 'Year6Drama', name: 'Year 6 Drama', color: '#8B5CF6' },
  { id: 'Year7Drama', name: 'Year 7 Drama', color: '#8B5CF6' },
  { id: 'Year8Drama', name: 'Year 8 Drama', color: '#8B5CF6' }
];

const DEFAULT_YEAR_GROUP_BANDS: YearGroupBand[] = flatToBands(DEFAULT_YEAR_GROUPS);

const YEAR_GROUP_SECTIONS_STORAGE_KEY = 'year-group-sections';
const YEAR_GROUP_SECTIONS_AUTO_MIGRATION_KEY = 'year-group-sections-auto-migrated-v2';

/** Default section labels (user can customise). */
const DEFAULT_SECTION_LABELS = [
  { id: 'eyfs', label: 'EYFS', sortOrder: 0 },
  { id: 'ks1', label: 'KS1', sortOrder: 1 },
  { id: 'ks2', label: 'KS2', sortOrder: 2 },
  { id: 'ks3', label: 'KS3', sortOrder: 3 },
  { id: 'ks4', label: 'KS4', sortOrder: 4 },
  { id: 'ks5', label: 'KS5', sortOrder: 5 },
  { id: 'other', label: 'Other', sortOrder: 6 },
];

/** Assign a year group id to a section key by name/id pattern. EYFS=LKG/UKG/Reception, KS1=1-2, KS2=3-6, KS3=7-9, KS4=10-11, KS5=12-14. */
function getDefaultSectionIdForYearGroup(id: string, name: string): string {
  const n = name || id || '';
  const lower = n.toLowerCase();
  if (['lkg', 'ukg', 'lower kindergarten', 'upper kindergarten', 'reception'].some(k => lower.includes(k))) return 'eyfs';
  if (lower.includes('year 1') || lower.includes('year1')) return 'ks1';
  if (lower.includes('year 2') || lower.includes('year2')) return 'ks1';
  if (['year 3', 'year 4', 'year 5', 'year 6'].some(y => lower.includes(y.replace(' ', '')) || lower.includes(y))) return 'ks2';
  if (['year 7', 'year 8', 'year 9'].some(y => lower.includes(y.replace(' ', '')) || lower.includes(y))) return 'ks3';
  if (['year 10', 'year 11'].some(y => lower.includes(y.replace(' ', '')) || lower.includes(y))) return 'ks4';
  if (['year 12', 'year 13', 'year 14'].some(y => lower.includes(y.replace(' ', '')) || lower.includes(y))) return 'ks5';
  return 'other';
}

/** Build default sections with yearGroupIds from a flat list of year groups. */
function buildDefaultYearGroupSections(yearGroups: YearGroup[]): YearGroupSection[] {
  const bySection = new Map<string, string[]>();
  DEFAULT_SECTION_LABELS.forEach(s => bySection.set(s.id, []));
  yearGroups.forEach(g => {
    const sectionId = getDefaultSectionIdForYearGroup(g.id, g.name);
    const arr = bySection.get(sectionId) ?? bySection.get('other')!;
    arr.push(g.id);
  });
  return DEFAULT_SECTION_LABELS.map(s => ({
    id: s.id,
    label: s.label,
    sortOrder: s.sortOrder,
    collapsed: true,
    yearGroupIds: bySection.get(s.id) || []
  }));
}

// Default category groups
const DEFAULT_CATEGORY_GROUPS: CategoryGroups = {
  groups: []
};

// Default resource link configurations
const DEFAULT_RESOURCE_LINKS: ResourceLinkConfig[] = [
  { key: 'videoLink', label: 'Video URL', iconName: 'Video', enabled: true },
  { key: 'musicLink', label: 'Music URL', iconName: 'Music', enabled: true },
  { key: 'backingLink', label: 'Backing Track URL', iconName: 'Volume2', enabled: true },
  { key: 'resourceLink', label: 'Resource URL', iconName: 'FileText', enabled: true },
  { key: 'vocalsLink', label: 'Vocals URL', iconName: 'Volume2', enabled: true },
  { key: 'canvaLink', label: 'Canva Design URL', iconName: 'Palette', enabled: true },
];

const SettingsContextNew = createContext<SettingsContextType | undefined>(
  undefined
);

export const useSettings = () => {
  const context = useContext(SettingsContextNew);
  if (context === undefined) {
    // Return a default context instead of throwing to prevent React hooks errors
    console.error('useSettings must be used within a SettingsProviderNew');
    // Return minimal default context to prevent crashes
    return {
      getThemeForClass: () => ({ primary: '#3B82F6', secondary: '#2563EB', accent: '#60A5FA' }),
      getThemeForSubject: () => ({ primary: '#3B82F6', secondary: '#2563EB', accent: '#60A5FA' }),
      categories: [],
      getCategoryColor: () => '#6B7280',
      getCategoryByName: () => null,
      addCategoryPermanently: async () => {},
      getSubjectCategories: () => [],
      getCategoryColorById: () => '#6B7280',
      getCategoryNameById: () => '',
      defaultViewMode: 'grid' as const,
      setDefaultViewMode: () => {},
      isAdmin: false,
      setIsAdmin: () => {},
      settings: {
        schoolName: '',
        schoolLogo: '',
        primaryColor: '#3B82F6',
        secondaryColor: '#2563EB',
        accentColor: '#60A5FA',
        customTheme: false
      },
      customYearGroups: [],
      yearGroupBands: [],
      yearGroupSections: [],
      updateYearGroups: () => {},
      updateYearGroupSections: () => {},
      getOrderedYearGroups: () => [],
      updateSettings: () => {},
      updateCategories: () => {},
      updateYearGroupBands: () => {},
      deleteYearGroup: async () => {},
      deleteYearGroupClass: () => {},
      addClassToBand: () => {},
      forceSyncYearGroups: async () => null,
      cleanupDuplicates: async () => {},
      forceSyncToSupabase: async (_override?) => false,
      forceRefreshFromSupabase: async () => false,
      forceSyncCurrentYearGroups: async () => false,
      forceSafariSync: async () => false,
      mapActivityLevelToYearGroup: () => '',
      mapYearGroupToActivityLevel: () => '',
      resetToDefaults: () => {},
      resetCategoriesToDefaults: () => {},
      resetYearGroupsToDefaults: () => {},
      addMissingDefaultYearGroups: async () => {},
      ensureYearGroupsInSections: () => {},
      categoryGroups: { groups: [] },
      addCategoryGroup: () => {},
      removeCategoryGroup: () => {},
      updateCategoryGroup: () => {},
      startUserChange: () => {},
      endUserChange: () => {},
      resourceLinks: DEFAULT_RESOURCE_LINKS,
      updateResourceLinks: () => {},
      resetResourceLinksToDefaults: () => {}
    } as SettingsContextType;
  }
  return context;
};

export const SettingsProviderNew: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, profile } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;

  const [categories, setCategories] = useState<Category[]>(FIXED_CATEGORIES);
  const [deletedFixedCategories, setDeletedFixedCategories] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [yearGroupBands, setYearGroupBands] = useState<YearGroupBand[]>(DEFAULT_YEAR_GROUP_BANDS);
  const customYearGroups = React.useMemo(() => flattenBands(yearGroupBands), [yearGroupBands]);
  const setCustomYearGroups = React.useCallback((value: YearGroup[] | ((prev: YearGroup[]) => YearGroup[])) => {
    const newGroups = typeof value === 'function' ? value(customYearGroups) : value;
    setYearGroupBands(flatToBands(newGroups));
  }, [customYearGroups]);

  const [yearGroupSections, setYearGroupSectionsState] = useState<YearGroupSection[]>(() => {
    try {
      const stored = localStorage.getItem(YEAR_GROUP_SECTIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as YearGroupSection[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return buildDefaultYearGroupSections(DEFAULT_YEAR_GROUPS);
  });
  const updateYearGroupSections: (
    sections: YearGroupSection[] | ((prev: YearGroupSection[]) => YearGroupSection[]),
    yearGroupsOverride?: YearGroup[]
  ) => void = React.useCallback((sections, yearGroupsOverride) => {
    const groupsBasis = yearGroupsOverride ?? customYearGroups;
    setYearGroupSectionsState((prev) => {
      const rawNext = typeof sections === 'function' ? sections(prev) : sections;
      const next = rawNext.map((s) => ({
        ...s,
        yearGroupIds: normalizeSectionYearGroupIdList(s.yearGroupIds || [], groupsBasis),
      }));
      // Skip state update when nothing actually changed (prevents render loops caused
      // by callers that run ensureYearGroupsInSections repeatedly).
      const prevJson = JSON.stringify(prev);
      const nextJson = JSON.stringify(next);
      if (prevJson === nextJson) {
        // Still recompute bands in case they're stale vs. sections, but only apply if different
        setYearGroupBands((currentBands) => {
          const candidate = flatToBands(getOrderedYearGroupsFromSections(next, groupsBasis));
          return JSON.stringify(currentBands) === JSON.stringify(candidate) ? currentBands : candidate;
        });
        return prev;
      }
      try {
        localStorage.setItem(YEAR_GROUP_SECTIONS_STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      setYearGroupBands((currentBands) => {
        const candidate = flatToBands(getOrderedYearGroupsFromSections(next, groupsBasis));
        return JSON.stringify(currentBands) === JSON.stringify(candidate) ? currentBands : candidate;
      });
      return next;
    });
  }, [customYearGroups]);

  const getOrderedYearGroups = React.useCallback((sectionsOverride?: YearGroupSection[]) => {
    const sec = sectionsOverride ?? yearGroupSections;
    return getOrderedYearGroupsFromSections(sec, customYearGroups);
  }, [yearGroupSections, customYearGroups]);

  // One-time quick reassignment of existing classes into EYFS/KS1-KS5 sections.
  // Users can still customize sections normally afterwards.
  useEffect(() => {
    if (!customYearGroups?.length) return;
    try {
      const alreadyMigrated = localStorage.getItem(YEAR_GROUP_SECTIONS_AUTO_MIGRATION_KEY) === 'true';
      if (alreadyMigrated) return;

      const next = buildDefaultYearGroupSections(customYearGroups);
      setYearGroupSectionsState(next);
      localStorage.setItem(YEAR_GROUP_SECTIONS_STORAGE_KEY, JSON.stringify(next));
      localStorage.setItem(YEAR_GROUP_SECTIONS_AUTO_MIGRATION_KEY, 'true');
    } catch (_) {
      // no-op
    }
  }, [customYearGroups]);

  const [resourceLinks, setResourceLinks] = useState<ResourceLinkConfig[]>(DEFAULT_RESOURCE_LINKS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [defaultViewMode, setDefaultViewMode] = useState<
    'grid' | 'list' | 'compact'
  >('grid');
  const [isAdmin, setIsAdmin] = useState(false);

  // Global save queue and locking mechanisms to prevent race conditions
  const isSavingToSupabase = useRef(false);
  const loadingFromSupabase = useRef(false);
  const dataLoadedFromSupabase = useRef(false);
  const saveQueue = useRef<{ type: string; data: any }[]>([]);
  const saveQueueTimeout = useRef<NodeJS.Timeout | null>(null);
  const isCurrentlyLoading = useRef(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Ensure admin-preset categories are always in the list (user cannot remove them)
  React.useEffect(() => {
    const preset = profile?.admin_preset_categories ?? [];
    if (preset.length === 0) return;
    setCategories(prev => {
      const existingNames = new Set(prev.map(c => c.name));
      const toAdd = preset.filter((n: string) => !existingNames.has(n));
      if (toAdd.length === 0) return prev;
      const newCats = toAdd.map((name: string) => {
        const f = FIXED_CATEGORIES.find((fixed: Category) => fixed.name === name);
        return { name, color: f?.color ?? '#6B7280', position: prev.length, yearGroups: {} as Record<string, boolean> };
      });
      return [...prev, ...newCats];
    });
  }, [profile?.admin_preset_categories]);

  // Centralized save queue processor to prevent race conditions
  const processSaveQueue = async () => {
    if (isSavingToSupabase.current || saveQueue.current.length === 0) return;
    
    isSavingToSupabase.current = true;
    if (import.meta.env.DEV) {
      console.log('🔄 Processing save queue with', saveQueue.current.length, 'items');
    }
    
    const items = [...saveQueue.current];
    saveQueue.current = [];
    
    try {
      for (const item of items) {
        if (import.meta.env.DEV) {
          console.log('🔄 Processing save queue item:', item.type);
        }
        
        switch (item.type) {
          case 'yearGroups':
            // Deduplicate year groups by name to prevent constraint violations
            const uniqueYearGroups = item.data.reduce((acc: any[], yearGroup: any) => {
              const existing = acc.find(yg => yg.name === yearGroup.name);
              if (!existing) {
                acc.push(yearGroup);
              }
              return acc;
            }, []);
            await yearGroupsApi.upsert(uniqueYearGroups);
            console.log('✅ Year groups saved from queue');
            break;
          case 'categories':
            // Deduplicate categories by name to prevent constraint violations
            const uniqueCategories = item.data.reduce((acc: any[], category: any) => {
              const existing = acc.find(c => c.name === category.name);
              if (!existing) {
                acc.push(category);
              }
              return acc;
            }, []);
            await customCategoriesApi.upsert(uniqueCategories);
            console.log('✅ Categories saved from queue');
            break;
          case 'categoryGroups':
            // Deduplicate category groups by name to prevent constraint violations
            const uniqueCategoryGroups = item.data.reduce((acc: any[], group: any) => {
              const existing = acc.find(g => g.name === group.name);
              if (!existing) {
                acc.push(group);
              }
              return acc;
            }, []);
            await categoryGroupsApi.upsert(uniqueCategoryGroups);
            console.log('✅ Category groups saved from queue');
            break;
          default:
            console.warn('⚠️ Unknown save queue item type:', item.type);
        }
      }
      
      console.log('✅ Save queue processing completed');
    } catch (error) {
      console.error('❌ Error processing save queue:', error);
      // Re-queue failed items
      saveQueue.current.unshift(...items);
    } finally {
      isSavingToSupabase.current = false;
      
      // Process any new items that were queued during processing
      if (saveQueue.current.length > 0) {
        setTimeout(() => processSaveQueue(), 100);
      }
    }
  };

  // Queue save function with improved batching
  const queueSave = (type: string, data: any) => {
    if (!isSupabaseConfigured()) return;
    
    // Remove any existing items of the same type to prevent duplicates
    saveQueue.current = saveQueue.current.filter(item => item.type !== type);
    
    // Add new item
    saveQueue.current.push({ type, data });
    
    if (import.meta.env.DEV) {
      console.log('📝 Queued save:', type, 'Queue length:', saveQueue.current.length);
    }
    
    // Clear existing timeout and set new one for debouncing
    if (saveQueueTimeout.current) {
      clearTimeout(saveQueueTimeout.current);
    }
    
    // Increase debounce time for better batching
    saveQueueTimeout.current = setTimeout(() => {
      processSaveQueue();
    }, 1000); // 1 second debounce for better batching
  };
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroups>(DEFAULT_CATEGORY_GROUPS);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number>(0);
  const [isUserMakingChanges, setIsUserMakingChanges] = useState<boolean>(false);
  const [realTimePaused, setRealTimePaused] = useState<boolean>(false);

  useEffect(() => {
    if (import.meta.env.DEV) console.log('🎯 NEW SettingsProviderNew useEffect running...');

    const savedViewMode = localStorage.getItem('defaultViewMode') as
      | 'grid'
      | 'list'
      | 'compact';
    if (savedViewMode) {
      setDefaultViewMode(savedViewMode);
    }

    // Load category groups
    const savedCategoryGroups = localStorage.getItem('category-groups');
    if (savedCategoryGroups) {
      try {
        const parsedGroups = JSON.parse(savedCategoryGroups);
        setCategoryGroups(parsedGroups);
      } catch (error) {
        console.warn('Failed to parse category groups:', error);
      }
    } else {
      // Check for old nested categories config and migrate
      const oldNestedConfig = localStorage.getItem('nested-categories-config');
      if (oldNestedConfig) {
        try {
          const oldConfig = JSON.parse(oldNestedConfig);
          if (oldConfig.groups && Array.isArray(oldConfig.groups)) {
            const migratedGroups = oldConfig.groups.map((group: any) => group.name).filter(Boolean);
            if (migratedGroups.length > 0) {
              const migratedCategoryGroups = { groups: migratedGroups };
              setCategoryGroups(migratedCategoryGroups);
              localStorage.setItem('category-groups', JSON.stringify(migratedCategoryGroups));
              console.log('🔄 Migrated old nested categories config to new simple groups:', migratedGroups);
            }
          }
          // Remove old config
          localStorage.removeItem('nested-categories-config');
        } catch (error) {
          console.warn('Failed to migrate old nested categories config:', error);
        }
      }
    }

    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    setIsAdmin(adminStatus);

    // Load resource links from localStorage
    try {
      const savedResourceLinks = localStorage.getItem('resource-links');
      if (savedResourceLinks) {
        const parsed = JSON.parse(savedResourceLinks);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setResourceLinks(parsed);
        }
      }
    } catch (error) {
      console.warn('Failed to load resource links from localStorage:', error);
    }

    // Load settings from localStorage
    try {
      const savedSettings = localStorage.getItem('lesson-viewer-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
      
      const savedYearGroups = localStorage.getItem('custom-year-groups');
      if (savedYearGroups) {
        const parsed = JSON.parse(savedYearGroups);
        // Apply deduplication immediately when loading from localStorage
        const deduplicated = parsed.filter((group: any, index: number, arr: any[]) => 
          arr.findIndex(g => g.name === group.name) === index
        );
        setCustomYearGroups(deduplicated);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }

    // Load any saved categories from localStorage (always merge in Drama Games, Vocal Warmups if missing)
    try {
      const savedCategories = localStorage.getItem('saved-categories');
      if (savedCategories) {
        const parsed = JSON.parse(savedCategories);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const deletedCats = new Set<string>();
          try {
            const deletedStr = localStorage.getItem('deleted-fixed-categories');
            if (deletedStr) {
              const arr = JSON.parse(deletedStr);
              if (Array.isArray(arr)) arr.forEach((n: string) => deletedCats.add(n));
            }
          } catch (_) {}
          const namesInSaved = new Set(parsed.map((c: any) => c.name));
          const requiredFixedNames = new Set(['Drama Games', 'Vocal Warmups']);
          const missingFixed = FIXED_CATEGORIES.filter(f =>
            !namesInSaved.has(f.name) &&
            (requiredFixedNames.has(f.name) || !deletedCats.has(f.name))
          );
          const merged = missingFixed.length > 0
            ? (() => {
                const combined = [...parsed];
                missingFixed.forEach(f => combined.push({ ...f }));
                combined.sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));
                return combined;
              })()
            : parsed;
          setCategories(merged);
          if (import.meta.env.DEV) console.log('📦 Loading saved categories from localStorage:', merged.length, missingFixed.length ? `(added ${missingFixed.map(c => c.name).join(', ')})` : '');
        }
      }
      
      // Load list of deleted fixed categories
      const deletedCats = localStorage.getItem('deleted-fixed-categories');
      if (deletedCats) {
        try {
          const parsed = JSON.parse(deletedCats);
          if (Array.isArray(parsed)) {
            setDeletedFixedCategories(new Set(parsed));
            if (import.meta.env.DEV) console.log('🗑️ Loaded deleted fixed categories:', parsed);
          }
        } catch (e) {
          console.warn('Failed to parse deleted fixed categories:', e);
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to load saved categories:', error);
    }

    // Load data from Supabase if configured
    const loadFromSupabase = async () => {
      if (isSupabaseConfigured()) {
        loadingFromSupabase.current = true;
        try {
          // Load categories FIRST so activities show immediately on refresh (don't wait for year groups retries)
          if (import.meta.env.DEV) console.log('🔄 Loading categories from Supabase first...');
          const supabaseCategories = await customCategoriesApi.getAll();
          if (import.meta.env.DEV) console.log('📦 Raw categories from Supabase:', supabaseCategories);

          if (supabaseCategories && supabaseCategories.length > 0) {
            isCurrentlyLoading.current = true;
            const formattedCategories = supabaseCategories.map((cat: any) => {
              let yearGroups = cat.yearGroups || {};
              if (yearGroups && typeof yearGroups === 'object') {
                const hasOldDefaults =
                  yearGroups.LKG === true &&
                  yearGroups.UKG === true &&
                  yearGroups.Reception === true &&
                  Object.keys(yearGroups).length === 3;
                if (hasOldDefaults) yearGroups = {};
              }
              return {
                id: cat.id,
                name: cat.name,
                color: cat.color,
                position: cat.position || 0,
                group: cat.group,
                groups: cat.groups || (cat.group ? [cat.group] : []),
                yearGroups: yearGroups
              };
            });
            const namesInSupabase = new Set(formattedCategories.map((c: any) => c.name));
            const requiredNames = new Set(['Drama Games', 'Vocal Warmups']);
            const missingFixed = FIXED_CATEGORIES.filter((f: any) => {
              if (namesInSupabase.has(f.name)) return false;
              if (f.name === 'Vocal Warmups' && namesInSupabase.has('Vocal Warm-Ups')) return false;
              return requiredNames.has(f.name) || !deletedFixedCategories.has(f.name);
            });
            const merged = [...formattedCategories];
            if (missingFixed.length > 0) {
              missingFixed.forEach((f: any) => merged.push({ ...f }));
              merged.sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));
            }
            setCategories(merged);
            localStorage.setItem('saved-categories', JSON.stringify(merged));
            setTimeout(() => { isCurrentlyLoading.current = false; }, 1000);
            console.log('📦 Loaded categories from Supabase (first):', merged.length, 'categories');
          } else {
            const requiredFixedNames = new Set(['Drama Games', 'Vocal Warmups']);
            const localStorageCategories = localStorage.getItem('saved-categories');
            if (localStorageCategories) {
              try {
                const localCategories = JSON.parse(localStorageCategories);
                const namesInLocal = new Set(localCategories.map((c: any) => c.name));
                const missingFixed = FIXED_CATEGORIES.filter((f: any) =>
                  !namesInLocal.has(f.name) &&
                  (requiredFixedNames.has(f.name) || !deletedFixedCategories.has(f.name))
                );
                const merged = missingFixed.length > 0
                  ? (() => {
                      const combined = [...localCategories];
                      missingFixed.forEach((f: any) => combined.push({ ...f }));
                      combined.sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));
                      return combined;
                    })()
                  : localCategories;
                setCategories(merged);
              } catch (_) {
                const activeFixed = FIXED_CATEGORIES.filter((f: any) =>
                  requiredFixedNames.has(f.name) || !deletedFixedCategories.has(f.name)
                );
                setCategories(activeFixed);
              }
            } else {
              const activeFixed = FIXED_CATEGORIES.filter((f: any) =>
                requiredFixedNames.has(f.name) || !deletedFixedCategories.has(f.name)
              );
              setCategories(activeFixed);
            }
          }

          // Then load year groups (retries can take several seconds; categories already applied above)
          console.log('🔄 Attempting to load year groups from Supabase...');
          const browserIsSafari = isSafari();
          const maxRetries = browserIsSafari ? 5 : 3; // More retries for Safari
          const baseDelay = browserIsSafari ? 2000 : 1000; // Longer delays for Safari
          
          let supabaseYearGroups;
          let retryCount = 0;
          
          console.log(`🌐 Browser-specific sync settings: Safari=${browserIsSafari}, maxRetries=${maxRetries}, baseDelay=${baseDelay}ms`);
          
          while (retryCount < maxRetries) {
            try {
              console.log(`🔄 Fetching year groups from Supabase (attempt ${retryCount + 1}/${maxRetries})...`);
              supabaseYearGroups = await yearGroupsApi.getAll();
              console.log(`✅ Successfully fetched ${supabaseYearGroups?.length || 0} year groups from Supabase`);
              break; // Success, exit retry loop
            } catch (error) {
              retryCount++;
              console.warn(`⚠️ Supabase year groups fetch attempt ${retryCount} failed:`, error);
              if (retryCount < maxRetries) {
                const delay = baseDelay * retryCount; // Exponential backoff
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              } else {
                console.error(`❌ All ${maxRetries} attempts failed for year groups fetch`);
                throw error; // Final attempt failed
              }
            }
          }
          
          console.log('📦 Raw year groups from Supabase:', supabaseYearGroups);
          
          if (supabaseYearGroups && supabaseYearGroups.length > 0) {
            const formattedYearGroups = supabaseYearGroups.map(group => ({
              id: group.id,
              name: group.name,
              color: group.color
            }));
            
            // Apply deduplication by name
            const deduplicated = formattedYearGroups.filter((group: any, index: number, arr: any[]) => 
              arr.findIndex(g => g.name === group.name) === index
            );
            
            // Prefer bands from localStorage if they match Supabase (preserve user grouping)
            const storedBands = localStorage.getItem('year-group-bands');
            let bandsToUse: YearGroupBand[];
            if (storedBands) {
              try {
                const parsed = JSON.parse(storedBands) as YearGroupBand[];
                const flatFromBands = flattenBands(parsed);
                const supabaseIds = new Set(deduplicated.map(g => g.id));
                const bandIds = new Set(flatFromBands.map(g => g.id));
                if (bandIds.size === supabaseIds.size && [...bandIds].every(id => supabaseIds.has(id))) {
                  bandsToUse = parsed;
                  console.log('📦 Using stored year group bands (grouping preserved)');
                } else {
                  bandsToUse = flatToBands(deduplicated);
                }
              } catch {
                bandsToUse = flatToBands(deduplicated);
              }
            } else {
              bandsToUse = flatToBands(deduplicated);
            }
            setYearGroupBands(bandsToUse);
            setYearGroupSectionsState(prev => {
              const loadedIds = deduplicated.map((g: any) => g.id);
              const hasMatchingIds = prev.length > 0 && prev.some(s => s.yearGroupIds.some((id: string) => loadedIds.includes(id)));
              const next = hasMatchingIds
                ? mergeSectionsWithYearGroups(prev, loadedIds, deduplicated)
                : buildDefaultYearGroupSections(deduplicated);
              try {
                localStorage.setItem(YEAR_GROUP_SECTIONS_STORAGE_KEY, JSON.stringify(next));
              } catch (_) {}
              return next;
            });
            console.log('📦 Loaded year groups from Supabase:', deduplicated.length, '(deduplicated from', formattedYearGroups.length, ')');
            localStorage.setItem('year-group-bands', JSON.stringify(bandsToUse));
            localStorage.setItem('custom-year-groups', JSON.stringify(deduplicated));
          } else {
            // No year groups in Supabase yet, load from localStorage and sync to Supabase
            console.log('📦 No year groups in Supabase, loading from localStorage...');
            const localStorageYearGroups = localStorage.getItem('custom-year-groups');
            if (localStorageYearGroups) {
              try {
                const localGroups = JSON.parse(localStorageYearGroups);
                // Filter out unwanted entries like "test" and apply deduplication
                const filteredGroups = localGroups.filter((group: any) => 
                  group.name && 
                  !group.name.toLowerCase().includes('test') &&
                  group.name.trim() !== ''
                );
                
                // Apply deduplication by name
                const deduplicatedGroups = filteredGroups.filter((group: any, index: number, arr: any[]) => 
                  arr.findIndex(g => g.name === group.name) === index
                );
                
                if (deduplicatedGroups.length > 0) {
                  const bands = flatToBands(deduplicatedGroups);
                  setYearGroupBands(bands);
                  setYearGroupSectionsState(prev => {
                    const merged = mergeSectionsWithYearGroups(prev, deduplicatedGroups.map((g: any) => g.id), deduplicatedGroups);
                    try {
                      localStorage.setItem(YEAR_GROUP_SECTIONS_STORAGE_KEY, JSON.stringify(merged));
                    } catch (_) {}
                    return merged;
                  });
                  console.log('📦 Loaded year groups from localStorage:', deduplicatedGroups.length, '(deduplicated from', filteredGroups.length, ', filtered from', localGroups.length, ')');
                  localStorage.setItem('year-group-bands', JSON.stringify(bands));
                  // Sync to Supabase (use deduplicated groups)
                  yearGroupsApi.upsert(deduplicatedGroups)
                    .then(() => console.log('✅ Synced filtered year groups to Supabase'))
                    .catch(error => console.warn('Failed to sync year groups to Supabase:', error));
                } else {
                  // localStorage data is empty or invalid, use defaults
                  console.log('📦 localStorage data is empty/invalid, using defaults');
                  setCustomYearGroups(DEFAULT_YEAR_GROUPS);
                  yearGroupsApi.upsert(DEFAULT_YEAR_GROUPS)
                    .then(() => console.log('✅ Synced default year groups to Supabase'))
                    .catch(error => console.warn('Failed to sync default year groups to Supabase:', error));
                }
              } catch (error) {
                console.warn('Failed to parse localStorage year groups:', error);
                console.log('📦 Using default year groups due to localStorage parse error');
                setCustomYearGroups(DEFAULT_YEAR_GROUPS);
                yearGroupsApi.upsert(DEFAULT_YEAR_GROUPS)
                  .then(() => console.log('✅ Synced default year groups to Supabase'))
                  .catch(error => console.warn('Failed to sync default year groups to Supabase:', error));
              }
            } else {
              // No data anywhere, use defaults and sync to Supabase
              console.log('📦 No data anywhere, using defaults');
              setCustomYearGroups(DEFAULT_YEAR_GROUPS);
              yearGroupsApi.upsert(DEFAULT_YEAR_GROUPS)
                .then(() => console.log('✅ Synced default year groups to Supabase'))
                .catch(error => console.warn('Failed to sync default year groups to Supabase:', error));
            }
          }

          // Load category groups from Supabase
          console.log('🔄 Attempting to load category groups from Supabase...');
          const supabaseCategoryGroups = await categoryGroupsApi.getAll();
          console.log('📦 Raw category groups from Supabase:', supabaseCategoryGroups);
          
          if (supabaseCategoryGroups && supabaseCategoryGroups.length > 0) {
            const groupNames = supabaseCategoryGroups.map(group => group.name);
            setCategoryGroups({ groups: groupNames });
            console.log('📦 Loaded category groups from Supabase:', groupNames);
            
            // Update localStorage to match Supabase data
            localStorage.setItem('category-groups', JSON.stringify({ groups: groupNames }));
          } else {
            // No category groups in Supabase, check localStorage and sync to Supabase
            console.log('📦 No category groups in Supabase, checking localStorage...');
            const localStorageCategoryGroups = localStorage.getItem('category-groups');
            if (localStorageCategoryGroups) {
              try {
                const localGroups = JSON.parse(localStorageCategoryGroups);
                if (localGroups.groups && Array.isArray(localGroups.groups) && localGroups.groups.length > 0) {
                  setCategoryGroups(localGroups);
                  console.log('📦 Loaded category groups from localStorage:', localGroups.groups);
                  
                  // Sync to Supabase
                  try {
                    await categoryGroupsApi.upsert(localGroups.groups);
                    console.log('✅ Synced category groups from localStorage to Supabase');
                  } catch (error) {
                    console.warn('Failed to sync category groups to Supabase:', error);
                  }
                } else {
                  // Use defaults and sync to Supabase
                  setCategoryGroups(DEFAULT_CATEGORY_GROUPS);
                  console.log('📦 Using default category groups');
                  try {
                    await categoryGroupsApi.upsert(DEFAULT_CATEGORY_GROUPS.groups);
                    console.log('✅ Synced default category groups to Supabase');
                  } catch (error) {
                    console.warn('Failed to sync default category groups to Supabase:', error);
                  }
                }
              } catch (error) {
                console.warn('Failed to parse localStorage category groups:', error);
                setCategoryGroups(DEFAULT_CATEGORY_GROUPS);
              }
            } else {
              // No data anywhere, use defaults and sync to Supabase
              setCategoryGroups(DEFAULT_CATEGORY_GROUPS);
              console.log('📦 No category groups anywhere, using defaults');
              try {
                await categoryGroupsApi.upsert(DEFAULT_CATEGORY_GROUPS.groups);
                console.log('✅ Synced default category groups to Supabase');
              } catch (error) {
                console.warn('Failed to sync default category groups to Supabase:', error);
              }
            }
          }

          // Load branding from Supabase (footer, login page - persists across devices)
          try {
            const supabaseBranding = await brandingApi.get();
            if (supabaseBranding && typeof supabaseBranding === 'object' && Object.keys(supabaseBranding).length > 0) {
              setSettings(prev => ({
                ...prev,
                branding: { ...DEFAULT_BRANDING, ...(prev.branding || {}), ...supabaseBranding }
              }));
              if (import.meta.env.DEV) console.log('📦 Loaded branding from Supabase');
            }
          } catch (e) {
            if (import.meta.env.DEV) console.warn('Failed to load branding from Supabase:', e);
          }

          // If we had no categories from Supabase, sync custom categories from localStorage to Supabase
          if (!supabaseCategories || supabaseCategories.length === 0) {
            const localStorageCategories = localStorage.getItem('saved-categories');
            if (localStorageCategories) {
              try {
                const localCategories = JSON.parse(localStorageCategories);
                const customCategories = localCategories.filter((cat: any) =>
                  !FIXED_CATEGORIES.some((fixed: any) => fixed.name === cat.name)
                );
                if (customCategories.length > 0) {
                  const categoriesForSupabase = customCategories.map((cat: any) => ({
                    id: cat.id,
                    name: cat.name,
                    color: cat.color,
                    position: cat.position || 0,
                    group: cat.group,
                    groups: cat.groups || (cat.group ? [cat.group] : []),
                    yearGroups: cat.yearGroups || {}
                  }));
                  await customCategoriesApi.upsert(categoriesForSupabase).catch(() => {});
                }
              } catch (_) {}
            }
          }
        } catch (error: any) {
          // Silently handle Supabase errors - fallback to localStorage
          // This prevents 500 errors from showing in console as failures
          if (isDevelopment) {
            console.warn('⚠️ Supabase load failed (using localStorage fallback):', error?.message || error);
            console.warn('⚠️ Error details:', {
              message: error?.message,
              code: error?.code,
              userAgent: navigator.userAgent
            });
          }
          
          // Enhanced fallback for Safari compatibility
          if (isDevelopment) {
            console.log('📦 Supabase failed, falling back to localStorage with Safari-safe approach...');
          }
          
          // Try multiple localStorage keys in case of browser differences
          const possibleKeys = ['custom-year-groups', 'year-groups', 'customYearGroups'];
          let localStorageYearGroups = null;
          
          for (const key of possibleKeys) {
            const data = localStorage.getItem(key);
            if (data) {
              localStorageYearGroups = data;
              console.log(`📦 Found year groups in localStorage key: ${key}`);
              break;
            }
          }
          
          if (localStorageYearGroups) {
            try {
              const localGroups = JSON.parse(localStorageYearGroups);
              console.log('📦 Raw localStorage year groups:', localGroups);
              
              // Filter out unwanted entries and apply deduplication
              const filteredGroups = localGroups.filter((group: any) => 
                group && 
                group.name && 
                !group.name.toLowerCase().includes('test') &&
                group.name.trim() !== ''
              );
              
              const deduplicatedGroups = filteredGroups.filter((group: any, index: number, arr: any[]) => 
                arr.findIndex(g => g.name === group.name) === index
              );
              
              if (deduplicatedGroups.length > 0) {
                setCustomYearGroups(deduplicatedGroups);
                console.log('📦 Fallback: Loaded year groups from localStorage:', deduplicatedGroups.length, 'groups');
                console.log('📦 Fallback: Year group names:', deduplicatedGroups.map(g => g.name));
              } else {
                setCustomYearGroups(DEFAULT_YEAR_GROUPS);
                console.log('📦 Fallback: No valid groups in localStorage, using defaults');
              }
            } catch (parseError) {
              console.error('❌ Failed to parse localStorage fallback:', parseError);
              setCustomYearGroups(DEFAULT_YEAR_GROUPS);
              console.log('📦 Fallback: Using default year groups due to parse error');
            }
          } else {
            setCustomYearGroups(DEFAULT_YEAR_GROUPS);
            console.log('📦 Fallback: No localStorage data found, using default year groups');
          }
          
          // Fallback for categories
          const localStorageCategories = localStorage.getItem('saved-categories');
          if (localStorageCategories) {
            try {
              const localCategories = JSON.parse(localStorageCategories);
              setCategories(localCategories);
              console.log('📦 Fallback: Loaded categories from localStorage:', localCategories.length);
            } catch (parseError) {
              console.error('❌ Failed to parse localStorage categories fallback:', parseError);
              const requiredNames = new Set(['Drama Games', 'Vocal Warmups']);
              const activeFixed = FIXED_CATEGORIES.filter(fixed => requiredNames.has(fixed.name) || !deletedFixedCategories.has(fixed.name));
              setCategories(activeFixed);
              console.log('📦 Fallback: Using fixed categories due to parse error (excluding deleted)');
            }
          } else {
            const requiredNames = new Set(['Drama Games', 'Vocal Warmups']);
            const activeFixed = FIXED_CATEGORIES.filter(fixed => requiredNames.has(fixed.name) || !deletedFixedCategories.has(fixed.name));
            setCategories(activeFixed);
            console.log('📦 Fallback: Using fixed categories (no localStorage data, excluding deleted)');
          }
          
          // Fallback for category groups
          const localStorageCategoryGroups = localStorage.getItem('category-groups');
          if (localStorageCategoryGroups) {
            try {
              const localCategoryGroups = JSON.parse(localStorageCategoryGroups);
              setCategoryGroups(localCategoryGroups);
              console.log('📦 Fallback: Loaded category groups from localStorage:', localCategoryGroups);
            } catch (parseError) {
              console.error('❌ Failed to parse localStorage category groups fallback:', parseError);
              setCategoryGroups(DEFAULT_CATEGORY_GROUPS);
              console.log('📦 Fallback: Using default category groups due to parse error');
            }
          } else {
            setCategoryGroups(DEFAULT_CATEGORY_GROUPS);
            console.log('📦 Fallback: Using default category groups (no localStorage data)');
          }
        }
      }
    };

    loadFromSupabase().then(() => {
      // Set initial load to false and mark data as loaded from Supabase
      console.log('✅ loadFromSupabase completed, setting isInitialLoad to false');
      setIsInitialLoad(false);
      dataLoadedFromSupabase.current = true;
      loadingFromSupabase.current = false;
      
      // Safari-specific verification and sync
      if (isSafari()) {
        console.log('🍎 Safari detected - performing additional verification...');
        setTimeout(async () => {
          try {
            console.log('🔍 Safari: Verifying data consistency...');
            const verificationYearGroups = await yearGroupsApi.getAll();
            const verificationCategories = await customCategoriesApi.getAll();
            
            console.log('🔍 Safari verification results:', {
              yearGroups: verificationYearGroups?.length || 0,
              categories: verificationCategories?.length || 0,
              currentYearGroups: customYearGroups.length,
              currentCategories: categories.length
            });
            
            // If there's a mismatch, force a refresh
            if (verificationYearGroups && verificationYearGroups.length !== customYearGroups.length) {
              console.log('⚠️ Safari: Data mismatch detected, forcing refresh...');
              await forceRefreshFromSupabase();
            }
          } catch (error) {
            console.warn('⚠️ Safari verification failed:', error);
          }
        }, 2000); // Wait 2 seconds after initial load
      }
    }).catch((error) => {
      console.error('❌ loadFromSupabase failed:', error);
      // Even if loading fails, we need to allow saving
      console.log('⚠️ Setting isInitialLoad to false despite load failure');
      setIsInitialLoad(false);
      dataLoadedFromSupabase.current = true; // Allow saves even if load failed
      loadingFromSupabase.current = false;
    });

    // Fallback timeout to ensure isInitialLoad is set to false
    setTimeout(() => {
      if (isInitialLoad) {
        if (import.meta.env.DEV) console.log('⏰ Timeout fallback: Setting isInitialLoad to false');
        setIsInitialLoad(false);
        dataLoadedFromSupabase.current = true; // Allow saves even after timeout
        loadingFromSupabase.current = false;
      }
    }, 5000); // 5 second timeout

    // DISABLED: Force sync any local changes to Supabase after loading
    // This function was causing race conditions and overwriting data from Supabase
    const syncLocalChangesToSupabase = async () => {
      console.log('🚫 syncLocalChangesToSupabase DISABLED - was causing race conditions');
      console.log('🚫 Data should already be current from initial load');
      return; // Exit immediately
    };

    // Note: syncLocalChangesToSupabase is disabled to prevent race conditions

    // Set up real-time subscriptions for year groups and categories
    let yearGroupsChannel: any = null;
    let categoriesChannel: any = null;
    let categoryGroupsChannel: any = null;
    let syncInterval: NodeJS.Timeout | null = null;
    
    if (isSupabaseConfigured()) {
      console.log('🔄 Setting up real-time subscriptions for year groups and categories...');
      
      // Enhanced sync function with timestamp tracking
      const syncYearGroups = async (source: string = 'unknown') => {
        try {
          console.log(`🔄 Syncing year groups from ${source}...`);
          const newYearGroups = await yearGroupsApi.getAll();
          const formattedYearGroups = newYearGroups.map(group => ({
            id: group.id,
            name: group.name,
            color: group.color
          }));
          
          // Apply deduplication
          const deduplicated = formattedYearGroups.filter((group: any, index: number, arr: any[]) => 
            arr.findIndex(g => g.name === group.name) === index
          );
          
          console.log(`📡 Updated year groups from ${source}:`, deduplicated);
          setCustomYearGroups(deduplicated);
          setLastSyncTimestamp(Date.now());
          
          // Update localStorage to match
          localStorage.setItem('custom-year-groups', JSON.stringify(deduplicated));
          return deduplicated;
        } catch (error) {
          console.error(`❌ Failed to sync year groups from ${source}:`, error);
          return null;
        }
      };
      
      // Real-time subscriptions removed to prevent race conditions
      // Using visibility change detection and queue-based saves instead
      if (import.meta.env.DEV) console.log('✅ Real-time subscriptions disabled - using queue-based sync instead');
    }

    if (import.meta.env.DEV) console.log('✅ NEW SettingsContext loaded with', categories.length, 'categories');

    // Cleanup function
    return () => {
      if (yearGroupsChannel) {
        console.log('🧹 Cleaning up year groups real-time subscription...');
        supabase.removeChannel(yearGroupsChannel);
      }
      if (categoriesChannel) {
        console.log('🧹 Cleaning up categories real-time subscription...');
        supabase.removeChannel(categoriesChannel);
      }
      if (categoryGroupsChannel) {
        console.log('🧹 Cleaning up category groups real-time subscription...');
        supabase.removeChannel(categoryGroupsChannel);
      }
      if (syncInterval) {
        console.log('🧹 Cleaning up sync intervals...');
        clearInterval(syncInterval);
      }
    };
  }, []);

  // Ensure Drama Games and Vocal Warmups always appear (DB may have "Vocal Warm-Ups" - treat as same)
  const REQUIRED_FIXED_NAMES = ['Drama Games', 'Vocal Warmups'];
  useEffect(() => {
    const names = new Set(categories.map(c => c.name));
    const missing = REQUIRED_FIXED_NAMES.filter(name => {
      if (names.has(name)) return false;
      if (name === 'Vocal Warmups' && names.has('Vocal Warm-Ups')) return false; // DB uses hyphen
      return true;
    });
    if (missing.length === 0) return;
    const toAdd = FIXED_CATEGORIES.filter(f => missing.includes(f.name));
    if (toAdd.length === 0) return;
    const merged = [...categories];
    toAdd.forEach(f => merged.push({ ...f }));
    merged.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    setCategories(merged);
    // Remove these from "deleted" set so they stay visible and aren't re-excluded on next load
    setDeletedFixedCategories(prev => {
      const next = new Set(prev);
      toAdd.forEach(f => next.delete(f.name));
      if (next.size === prev.size) return prev;
      try {
        localStorage.setItem('deleted-fixed-categories', JSON.stringify(Array.from(next)));
      } catch (_) {}
      return next;
    });
    console.log('📦 Ensured missing categories in list:', missing.join(', '));
  }, [categories]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('lesson-viewer-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [settings]);
  
  // Save year groups using queue-based system to prevent race conditions
  useEffect(() => {
    if (import.meta.env.DEV) console.log('🔄 Year groups useEffect triggered - dataLoadedFromSupabase:', dataLoadedFromSupabase.current, 'customYearGroups length:', customYearGroups.length);
    
    if (!dataLoadedFromSupabase.current) {
      if (import.meta.env.DEV) console.log('⏭️ Skipping year groups save - data not loaded from Supabase yet');
      return;
    }
    
    if (loadingFromSupabase.current) {
      if (import.meta.env.DEV) console.log('⏭️ Skipping year groups save - currently loading from Supabase');
      return;
    }
    
    // Save to localStorage immediately
    localStorage.setItem('custom-year-groups', JSON.stringify(customYearGroups));
    if (import.meta.env.DEV) console.log('💾 Year groups saved to localStorage');

    // Queue Supabase save
    queueSave('yearGroups', customYearGroups);
  }, [customYearGroups]);

  // Save categories using queue-based system to prevent race conditions
  useEffect(() => {
    if (import.meta.env.DEV) console.log('🔄 Categories useEffect triggered - dataLoadedFromSupabase:', dataLoadedFromSupabase.current, 'isCurrentlyLoading:', isCurrentlyLoading.current, 'categories length:', categories.length);
    
    if (!dataLoadedFromSupabase.current) {
      if (import.meta.env.DEV) console.log('⏭️ Skipping categories save - data not loaded from Supabase yet');
      return;
    }
    
    if (loadingFromSupabase.current) {
      if (import.meta.env.DEV) console.log('⏭️ Skipping categories save - currently loading from Supabase');
      return;
    }
    
    if (isCurrentlyLoading.current) {
      if (import.meta.env.DEV) console.log('⏭️ Skipping categories save - currently loading categories');
      return;
    }
    
    // Track which FIXED_CATEGORIES have been deleted
    const currentCategoryNames = new Set(categories.map(c => c.name));
    const newDeleted = new Set(deletedFixedCategories);
    let deletionsChanged = false;
    
    FIXED_CATEGORIES.forEach(fixed => {
      if (!currentCategoryNames.has(fixed.name) && !newDeleted.has(fixed.name)) {
        newDeleted.add(fixed.name);
        deletionsChanged = true;
        console.log(`🗑️ Tracking deletion of fixed category: ${fixed.name}`);
      }
    });
    
    if (deletionsChanged) {
      setDeletedFixedCategories(newDeleted);
      localStorage.setItem('deleted-fixed-categories', JSON.stringify(Array.from(newDeleted)));
      console.log('💾 Saved deleted fixed categories:', Array.from(newDeleted));
    }
    
    // Save to localStorage immediately
    localStorage.setItem('saved-categories', JSON.stringify(categories));
    console.log('💾 Categories saved to localStorage');
    
    // Filter categories for Supabase save
    // Save ALL categories that have:
    // 1. Custom categories (not in FIXED_CATEGORIES)
    // 2. Categories with group assignments
    // 3. Categories with yearGroups assignments (to preserve user's year group assignments)
    const categoriesToSave = categories.filter(cat => {
      const isCustom = !FIXED_CATEGORIES.some(fixed => fixed.name === cat.name);
      const hasGroupAssignments = (cat.groups && cat.groups.length > 0) || cat.group;
      const hasYearGroupAssignments = cat.yearGroups && Object.keys(cat.yearGroups).length > 0 && 
        Object.values(cat.yearGroups).some(v => v === true);
      
      const shouldSave = isCustom || hasGroupAssignments || hasYearGroupAssignments;
      
      // Debug logging for first few categories
      if (categories.indexOf(cat) < 5) {
        console.log(`🔍 Category "${cat.name}":`, {
          isCustom,
          hasGroupAssignments,
          hasYearGroupAssignments,
          yearGroups: cat.yearGroups,
          shouldSave
        });
      }
      
      return shouldSave;
    });
    
    console.log('💾 Categories save filter results:', {
      totalCategories: categories.length,
      categoriesToSave: categoriesToSave.length,
      categoriesWithYearGroups: categoriesToSave.filter(c => c.yearGroups && Object.keys(c.yearGroups).length > 0).length,
      categoriesExcluded: categories.length - categoriesToSave.length,
      sampleYearGroups: categoriesToSave.slice(0, 5).map(c => ({ 
        name: c.name, 
        yearGroups: c.yearGroups,
        hasYearGroups: !!(c.yearGroups && Object.keys(c.yearGroups).length > 0)
      }))
    });
    
    if (categoriesToSave.length > 0) {
      const categoriesForSupabase = categoriesToSave.map(cat => ({
        id: cat.id,  // Preserve Supabase PK so upserts don't fail on missing id
        name: cat.name,
        color: cat.color,
        position: cat.position,
        group: cat.group,
        groups: cat.groups || [],
        yearGroups: cat.yearGroups || {} // Preserve yearGroups assignments
      }));
      
      console.log('💾 Queueing categories save to Supabase:', {
        count: categoriesForSupabase.length,
        sample: categoriesForSupabase.slice(0, 3).map(c => ({ name: c.name, yearGroups: c.yearGroups }))
      });
      
      // Delete from Supabase any category no longer in the list (so deleted categories stay deleted)
      const currentCategoryNames = new Set(categoriesToSave.map(c => c.name));
      (async () => {
        if (!isSupabaseConfigured() || !dataLoadedFromSupabase.current) return;
        try {
          const supabaseCategories = await customCategoriesApi.getAll();
          const categoriesToDelete = supabaseCategories
            .filter(supabaseCat => {
              const isFixed = FIXED_CATEGORIES.some(fixed => fixed.name === supabaseCat.name);
              return !isFixed && !currentCategoryNames.has(supabaseCat.name);
            })
            .map(cat => cat.name);
          if (categoriesToDelete.length > 0) {
            console.log('🗑️ Deleting categories from Supabase no longer in list:', categoriesToDelete);
            for (const name of categoriesToDelete) {
              try {
                await customCategoriesApi.delete(name);
              } catch (e) {
                console.warn('Failed to delete category from Supabase:', name, e);
              }
            }
          }
        } catch (e) {
          console.warn('Error during category cleanup:', e);
        }
      })();

      // Queue Supabase save
      queueSave('categories', categoriesForSupabase);
    } else {
      console.warn('⚠️ No categories to save - all categories were filtered out!');
    }
  }, [categories]);

  // Save category groups using queue-based system to prevent race conditions
  useEffect(() => {
    console.log('🔄 Category groups useEffect triggered - dataLoadedFromSupabase:', dataLoadedFromSupabase.current, 'categoryGroups length:', categoryGroups.groups.length);
    
    if (!dataLoadedFromSupabase.current) {
      if (import.meta.env.DEV) console.log('⏭️ Skipping category groups save - data not loaded from Supabase yet');
      return;
    }
    
    if (loadingFromSupabase.current) {
      if (import.meta.env.DEV) console.log('⏭️ Skipping category groups save - currently loading from Supabase');
      return;
    }
    
    if (!categoryGroups.groups || categoryGroups.groups.length === 0) {
      if (import.meta.env.DEV) console.log('🚨 Skipping save of empty category groups to prevent infinite loop');
      return;
    }
    
    // Save to localStorage immediately
    localStorage.setItem('category-groups', JSON.stringify(categoryGroups));
    console.log('💾 Category groups saved to localStorage');
    
    // Queue Supabase save
    queueSave('categoryGroups', categoryGroups.groups);
  }, [categoryGroups]);

  // Visibility change handler for cross-browser sync (debounced)
  useEffect(() => {
    let visibilityTimeout: NodeJS.Timeout;
    let lastVisibilityChange = 0;
    
    const handleVisibilityChange = async () => {
      // Don't run on login page – avoids reloads while user is typing password
      if (!userRef.current) return;

      const now = Date.now();
      
      // Debounce visibility changes - only process if it's been at least 5 seconds since last change
      if (now - lastVisibilityChange < 5000) {
        console.log('👁️ Skipping visibility change - too recent');
        return;
      }
      
      if (document.visibilityState === 'visible' && 
          !loadingFromSupabase.current && 
          !isSavingToSupabase.current &&
          dataLoadedFromSupabase.current) {
        
        lastVisibilityChange = now;
        console.log('👁️ Page became visible - checking for data sync...');
        
        // Clear any pending visibility timeout
        clearTimeout(visibilityTimeout);
        
        // Debounce the actual reload operation
        visibilityTimeout = setTimeout(async () => {
          // Wait for any pending saves to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Only reload if we're not currently saving
          if (!isSavingToSupabase.current) {
            console.log('🔄 Reloading data from Supabase due to visibility change...');
            loadingFromSupabase.current = true;
            
            try {
              // Reload year groups
              const yearGroups = await yearGroupsApi.getAll();
              if (yearGroups && yearGroups.length > 0) {
                const formatted = yearGroups.map(group => ({
                  id: group.id,
                  name: group.name,
                  color: group.color
                }));
                setCustomYearGroups(formatted);
                console.log('✅ Year groups reloaded from visibility change');
              }
              
              // Reload categories - but only if user is not actively making changes
              // This prevents reloading categories that were just deleted
              if (!isUserMakingChanges) {
                const categories = await customCategoriesApi.getAll();
                if (categories && categories.length > 0) {
                  // Merge with existing categories
                  setCategories(prev => {
                    const merged = [...prev];
                    categories.forEach(supabaseCat => {
                      const existingIndex = merged.findIndex(cat => cat.name === supabaseCat.name);
                      if (existingIndex >= 0) {
                        // Update existing category with ALL Supabase data (including yearGroups!)
                        merged[existingIndex] = {
                          ...merged[existingIndex],
                          id: supabaseCat.id,
                          color: supabaseCat.color || merged[existingIndex].color,
                          position: supabaseCat.position ?? merged[existingIndex].position,
                          group: supabaseCat.group,
                          groups: supabaseCat.groups || [],
                          yearGroups: supabaseCat.yearGroups ?? merged[existingIndex].yearGroups
                        };
                      }
                    });
                    return merged;
                  });
                  console.log('✅ Categories reloaded from visibility change');
                }
              } else {
                console.log('⏸️ Skipping category reload from visibility change - user is actively making changes');
              }
    } catch (error) {
              console.warn('⚠️ Error reloading data from visibility change:', error);
            } finally {
              loadingFromSupabase.current = false;
            }
          }
        }, 2000); // 2 second delay to allow for rapid tab switches
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearTimeout(visibilityTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...newSettings };
      // Persist branding to Supabase when it changes (survives cache clears, different devices)
      if (newSettings.branding && isSupabaseConfigured()) {
        brandingApi.upsert(newSettings.branding).catch(() => {});
      }
      return next;
    });
  };

  const updateResourceLinks = (links: ResourceLinkConfig[]) => {
    setResourceLinks(links);
    // Save to localStorage
    try {
      localStorage.setItem('resource-links', JSON.stringify(links));
    } catch (error) {
      console.error('Failed to save resource links to localStorage:', error);
    }
  };

  const resetResourceLinksToDefaults = () => {
    setResourceLinks(DEFAULT_RESOURCE_LINKS);
    try {
      localStorage.setItem('resource-links', JSON.stringify(DEFAULT_RESOURCE_LINKS));
    } catch (error) {
      console.error('Failed to save default resource links to localStorage:', error);
    }
  };
  
  const updateCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
    // Supabase save is now handled automatically in the useEffect hook
  };

  // Functions to manage user change state
  const startUserChange = () => {
    setIsUserMakingChanges(true);
    setRealTimePaused(true);
    console.log('🔄 User started making changes - pausing real-time sync');
  };

  const endUserChange = () => {
    setTimeout(() => {
      setIsUserMakingChanges(false);
      setRealTimePaused(false);
      console.log('✅ User finished making changes - resuming real-time sync');
    }, 5000); // 5-second buffer after user finishes
  };
  
  const updateYearGroups = (newYearGroups: YearGroup[]) => {
    console.log('🔄 updateYearGroups called with:', newYearGroups);
    setCustomYearGroups(newYearGroups);
    // Supabase save is now handled automatically in the useEffect hook
  };

  const updateYearGroupBands = React.useCallback((bands: YearGroupBand[]) => {
    setYearGroupBands(bands);
  }, []);

  // Manual sync function to force refresh from Supabase
  const forceSyncYearGroups = async () => {
    if (isSupabaseConfigured()) {
      try {
        console.log('🔄 Manual sync: Fetching year groups from Supabase...');
        const supabaseYearGroups = await yearGroupsApi.getAll();
        const formattedYearGroups = supabaseYearGroups.map(group => ({
          id: group.id,
          name: group.name,
          color: group.color
        }));
        
        const deduplicated = formattedYearGroups.filter((group: any, index: number, arr: any[]) => 
          arr.findIndex(g => g.name === group.name) === index
        );
        
        console.log('🔄 Manual sync: Updating year groups from Supabase:', deduplicated);
        setCustomYearGroups(deduplicated);
        localStorage.setItem('custom-year-groups', JSON.stringify(deduplicated));
        
        return deduplicated;
      } catch (error) {
        console.error('❌ Manual sync failed:', error);
        return null;
      }
    }
    return null;
  };

  const isUuidString = (s: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

  const deleteYearGroup = async (
    yearGroupNameOrId: string | { id: string; name: string },
    opts?: { skipLocal?: boolean }
  ) => {
    const rawId = typeof yearGroupNameOrId === 'string' ? yearGroupNameOrId : yearGroupNameOrId.id;
    const rawName = typeof yearGroupNameOrId === 'string' ? '' : yearGroupNameOrId.name;
    const candidates = [...new Set([rawId, rawName].map((s) => (s || '').trim()).filter(Boolean))];
    if (candidates.length === 0) return;

    const lowerCandidates = new Set(candidates.map((c) => c.toLowerCase()));

    try {
      console.log('🗑️ Deleting year group (candidates):', candidates);

      if (isSupabaseConfigured()) {
        // Load all rows once and match case-insensitively on name/id.
        // Fixes deletes for "Other" when UI id slug ≠ DB name, and avoids brittle .eq chains.
        const { data: allRows, error: listError } = await supabase
          .from(TABLES.YEAR_GROUPS)
          .select('id, name');

        if (listError) {
          console.error('❌ Failed to list year_groups for delete:', listError);
          throw new Error(listError.message || `Database error: ${JSON.stringify(listError)}`);
        }

        const norm = (s: string) => (s || '').trim().toLowerCase();
        const want = new Set(candidates.map(norm));
        const uuidWant = new Set(candidates.filter(isUuidString));

        const matched = (allRows || []).filter((row) => {
          const idStr = String((row as { id: unknown }).id ?? '');
          const rowName = String((row as { name: unknown }).name ?? '');
          if (uuidWant.has(idStr)) return true;
          if (want.has(norm(rowName))) return true;
          if (want.has(norm(idStr))) return true;
          return false;
        });

        const rows = [...new Map(matched.map((r) => [String(r.id), r])).values()] as {
          id: string;
          name: string;
        }[];

        if (!rows.length) {
          console.warn(
            '⚠️ No year group in Supabase matching — treating as OK (e.g. local-only or never synced):',
            candidates
          );
        } else {
          if (rows.length > 1) {
            console.warn('⚠️ Multiple rows matching delete — deleting all matched:', rows);
          }

          const deleteOneRow = async (row: { id: string; name: string }) => {
            const fmt = (err: { message?: string; code?: string; details?: string; hint?: string } | null) =>
              err
                ? [err.message, err.code ? `code=${err.code}` : '', err.details, err.hint]
                    .filter(Boolean)
                    .join(' ')
                : '';
            const { error: e1 } = await supabase.from(TABLES.YEAR_GROUPS).delete().eq('id', row.id);
            if (!e1) return;
            const { error: e2 } = await supabase.from(TABLES.YEAR_GROUPS).delete().eq('name', row.name);
            if (e2) {
              const msg = [fmt(e1), fmt(e2)].filter(Boolean).join(' | ');
              throw new Error(
                msg ||
                  'Year group delete failed (check Supabase RLS: run year_groups_rls_allow_delete_all_roles.sql)'
              );
            }
          };

          await Promise.all(rows.map((row) => deleteOneRow(row)));
          console.log('✅ Deleted year group(s) from Supabase:', rows.map((r) => r.name).join(', '));
        }
      }

      if (!opts?.skipLocal) {
        setCustomYearGroups((prev) => {
          const filtered = prev.filter((g) => {
            const id = (g.id || '').trim();
            const name = (g.name || '').trim();
            if (!id && !name) return true;
            return !(
              lowerCandidates.has(id.toLowerCase()) || lowerCandidates.has(name.toLowerCase())
            );
          });
          localStorage.setItem('custom-year-groups', JSON.stringify(filtered));
          return filtered;
        });
      }
    } catch (error) {
      console.error('❌ Failed to delete year group:', error);
      throw error;
    }
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('lesson-viewer-settings');
  };
  
  const resetCategoriesToDefaults = () => {
    setCategories(FIXED_CATEGORIES);
    setDeletedFixedCategories(new Set()); // Clear deleted list on reset
    localStorage.removeItem('saved-categories');
    localStorage.removeItem('deleted-fixed-categories');
  };
  
  const resetYearGroupsToDefaults = () => {
    setCustomYearGroups(DEFAULT_YEAR_GROUPS);
    setYearGroupSectionsState(buildDefaultYearGroupSections(DEFAULT_YEAR_GROUPS));
    localStorage.removeItem('custom-year-groups');
    try {
      localStorage.setItem(YEAR_GROUP_SECTIONS_STORAGE_KEY, JSON.stringify(buildDefaultYearGroupSections(DEFAULT_YEAR_GROUPS)));
    } catch (_) {}
  };

  const addMissingDefaultYearGroups = async () => {
    const current = customYearGroups;
    const existingIds = new Set(current.map(g => g.id));
    const toAdd = DEFAULT_YEAR_GROUPS.filter(g => !existingIds.has(g.id));
    if (toAdd.length === 0) return;
    const merged = [...current, ...toAdd];
    setCustomYearGroups(merged);
    setYearGroupSectionsState(prev => {
      return prev.map(s => {
        const toAppend = toAdd.filter(g => (getDefaultSectionIdForYearGroup(g.id, g.name) === s.id)).map(g => g.id);
        if (toAppend.length === 0) return s;
        return { ...s, yearGroupIds: [...(s.yearGroupIds || []), ...toAppend] };
      });
    });
    try {
      await yearGroupsApi.upsert(merged);
    } catch (e) {
      console.warn('Supabase sync for added default year groups failed:', e);
    }
  };

  const ensureYearGroupsInSections = React.useCallback(() => {
    const ids = customYearGroups.map((g) => g.id);
    updateYearGroupSections(
      (prev) => mergeSectionsWithYearGroups(prev, ids, customYearGroups),
      customYearGroups
    );
  }, [customYearGroups, updateYearGroupSections]);

  const saveCategoryToSupabase = async (name: string, color: string) => {
    console.log('💾 NEW: Starting Supabase save for:', name);

    try {
      // Find or create Music subject
      let { data: subjects, error: subjectError } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', 'Music')
        .single();

      if (subjectError || !subjects) {
        console.log('📝 NEW: Creating Music subject...');
        const { data: newSubject, error: createError } = await supabase
          .from('subjects')
          .insert([
            {
              name: 'Music',
              description: 'Music education activities',
              color: '#3b82f6',
              is_active: true,
            },
          ])
          .select('id')
          .single();

        if (createError) {
          console.error('❌ NEW: Subject creation failed:', createError);
          throw createError;
        }
        subjects = newSubject;
      }

      console.log('🎯 NEW: Using subject ID:', subjects.id);

      // Save the category
      const { data, error } = await supabase
        .from('subject_categories')
        .insert([
          {
            subject_id: subjects.id,
            name: name,
            color: color,
            sort_order: categories.length,
            is_locked: false,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ NEW: Category save failed:', error);
        throw error;
      }

      console.log('✅ NEW: Category saved to Supabase successfully!');
      return data;
    } catch (error) {
      console.error('❌ NEW: Supabase save error:', error);
      throw error;
    }
  };

  const addCategoryPermanently = async (name: string, color: string) => {
    console.log('🚀 NEW: Adding category permanently:', name);

    try {
      // Save to Supabase first
      await saveCategoryToSupabase(name, color);

      // Create new category object
      const newCategory: Category = {
        name,
        color,
        position: categories.length,
        yearGroups: {}, // Empty - must be explicitly assigned in settings
      };

      // Update state
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);

      // Save to localStorage
      localStorage.setItem(
        'saved-categories',
        JSON.stringify(updatedCategories)
      );

      console.log('🎉 NEW: Category added permanently and saved!');
      alert(`✅ NEW VERSION: Category "${name}" saved permanently!`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      console.error('❌ NEW: Failed to add category:', error);
      alert(`❌ NEW VERSION: Failed to save category: ${errorMessage}`);
    }
  };

  const getThemeForClass = (className: string): Theme => {
    // If custom theme is enabled, use user's custom colors
    if (settings.customTheme) {
      return {
        primary: settings.primaryColor,
        secondary: settings.secondaryColor,
        accent: settings.accentColor,
      };
    }

    // Map class names to year group names
    const classToYearGroupMap: Record<string, string> = {
      'LKG': 'Lower Kindergarten Music',
      'UKG': 'Upper Kindergarten Music',
      'Reception': 'Reception Music'
    };

    // Find the custom year group by ID or mapped name
    const yearGroup = customYearGroups.find(group => 
      group.id === className || 
      group.name === className ||
      group.name === classToYearGroupMap[className]
    );
    
    if (yearGroup && yearGroup.color) {
      // If the year group has a custom color, use it
      return {
        primary: yearGroup.color,
        secondary: adjustColor(yearGroup.color, -20),
        accent: adjustColor(yearGroup.color, 20),
      };
    }

    // Default teal theme
    return {
      primary: '#14B8A6',
      secondary: '#0D9488',
      accent: '#2DD4BF',
    };
  };

  // Manual sync function to force save to Supabase.
  // Optional override: when provided (e.g. from Save Settings), sync that data so it persists immediately.
  // Uses same filter as categories useEffect: include fixed categories that have year group assignments.
  const forceSyncToSupabase = async (override?: { categories?: Category[]; yearGroups?: YearGroup[] }) => {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured, cannot sync');
      return false;
    }

    try {
      const categoriesToSync = override?.categories ?? categories;
      const yearGroupsToSync = override?.yearGroups ?? customYearGroups;
      console.log('🔄 Force syncing settings to Supabase...', { categoriesCount: categoriesToSync.length, yearGroupsCount: yearGroupsToSync.length });
      
      const yearGroupsSuccess = await yearGroupsApi.upsert(yearGroupsToSync)
        .then(() => {
          console.log('✅ Year groups synced to Supabase');
          return true;
        })
        .catch(error => {
          console.error('❌ Failed to sync year groups:', error);
          return false;
        });

      // Same filter as categories useEffect: save custom OR with group assignments OR with year group assignments (including fixed categories like Welcome, Kodaly Songs)
      const categoriesToSave = categoriesToSync.filter(cat => {
        const isCustom = !FIXED_CATEGORIES.some(fixed => fixed.name === cat.name);
        const hasGroupAssignments = (cat.groups && cat.groups.length > 0) || cat.group;
        const hasYearGroupAssignments = cat.yearGroups && Object.keys(cat.yearGroups).length > 0 && 
          Object.values(cat.yearGroups).some(v => v === true);
        return isCustom || hasGroupAssignments || hasYearGroupAssignments;
      });
      
      let categoriesSuccess = true;
      if (categoriesToSave.length > 0) {
        const categoriesForSupabase = categoriesToSave.map(cat => {
          // Ensure all required fields are present and valid
          const categoryData: any = {
            id: cat.id,  // Preserve Supabase PK for round-trip upserts
            name: cat.name || '',
            color: cat.color || '#6B7280',
            position: typeof cat.position === 'number' ? cat.position : (cat.position ? parseInt(cat.position, 10) : 0),
            group: cat.group || null,
            groups: Array.isArray(cat.groups) ? cat.groups : (cat.group ? [cat.group] : []),
            yearGroups: typeof cat.yearGroups === 'object' && cat.yearGroups !== null && !Array.isArray(cat.yearGroups) ? cat.yearGroups : {}
          };
          
          // Validate required fields
          if (!categoryData.name) {
            console.warn(`⚠️ Skipping category with missing name:`, cat);
            return null;
          }
          
          return categoryData;
        }).filter(cat => cat !== null); // Remove any invalid categories
        
        if (categoriesForSupabase.length === 0) {
          console.warn('⚠️ No valid categories to sync after validation');
          categoriesSuccess = true; // Not an error, just nothing to sync
        } else {
          const withYearGroups = categoriesForSupabase.filter(c => c.yearGroups && Object.keys(c.yearGroups).length > 0 && Object.values(c.yearGroups).some(v => v === true));
          if (override?.categories && withYearGroups.length > 0) {
            console.log('📤 Syncing categories with year group assignments:', withYearGroups.length, withYearGroups.map(c => ({ name: c.name, yearGroups: c.yearGroups })));
          }
          
          console.log('📤 Preparing to upsert categories:', {
            total: categoriesForSupabase.length,
            withYearGroups: withYearGroups.length,
            sample: categoriesForSupabase[0]
          });
          
          categoriesSuccess = await customCategoriesApi.upsert(categoriesForSupabase)
            .then(() => {
              console.log('✅ Categories synced to Supabase', categoriesForSupabase.length);
              return true;
            })
            .catch(error => {
              console.error('❌ Failed to sync categories:', error);
              console.error('❌ Categories that failed:', categoriesForSupabase.slice(0, 3));
              return false;
            });
        }
      }

      const allSuccess = yearGroupsSuccess && categoriesSuccess;
      if (allSuccess) {
        console.log('✅ All settings synced to Supabase successfully');
      } else {
        console.warn('⚠️ Some settings failed to sync to Supabase');
      }
      
      return allSuccess;
    } catch (error) {
      console.error('❌ Failed to force sync to Supabase:', error);
      return false;
    }
  };

  // Manual refresh function to load data from Supabase
  const forceRefreshFromSupabase = async () => {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured, cannot refresh');
      return false;
    }

    // Prevent multiple simultaneous refresh operations
    if (isRefreshing) {
      console.log('⚠️ Refresh already in progress, skipping...');
      return false;
    }

    setIsRefreshing(true);

    try {
      const browserIsSafari = isSafari();
      console.log(`🔄 Force refreshing settings from Supabase... (Browser: ${browserIsSafari ? 'Safari' : 'Other'})`);
      
      // Enhanced Safari-specific refresh with retry logic
      const maxRetries = browserIsSafari ? 3 : 1;
      const baseDelay = browserIsSafari ? 1500 : 500;
      
      let supabaseYearGroups;
      let retryCount = 0;
      
      // Refresh year groups with Safari-specific retry logic
      while (retryCount < maxRetries) {
        try {
          console.log(`🔄 Fetching year groups from Supabase (refresh attempt ${retryCount + 1}/${maxRetries})...`);
          supabaseYearGroups = await yearGroupsApi.getAll();
          console.log(`✅ Successfully refreshed ${supabaseYearGroups?.length || 0} year groups from Supabase`);
          break;
        } catch (error) {
          retryCount++;
          console.warn(`⚠️ Year groups refresh attempt ${retryCount} failed:`, error);
          if (retryCount < maxRetries) {
            const delay = baseDelay * retryCount;
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.error(`❌ All ${maxRetries} year groups refresh attempts failed`);
            throw error;
          }
        }
      }
      if (supabaseYearGroups && supabaseYearGroups.length > 0) {
        const formattedYearGroups = supabaseYearGroups.map(group => ({
          id: group.id,
          name: group.name,
          color: group.color
        }));
        
        const deduplicated = formattedYearGroups.filter((group: any, index: number, arr: any[]) => 
          arr.findIndex(g => g.name === group.name) === index
        );
        
        setCustomYearGroups(deduplicated);
        localStorage.setItem('custom-year-groups', JSON.stringify(deduplicated));
        console.log('✅ Year groups refreshed from Supabase:', deduplicated.length);
      }

      // Refresh categories
      const supabaseCategories = await customCategoriesApi.getAll();
      if (supabaseCategories && supabaseCategories.length > 0) {
        const formattedCategories = supabaseCategories.map((cat: any) => {
          // Clean old default yearGroups assignments
          let yearGroups = cat.yearGroups || {};
          
          // If category has old default assignments (all legacy keys = true), clear them
          if (yearGroups && typeof yearGroups === 'object') {
            const hasOldDefaults = 
              yearGroups.LKG === true && 
              yearGroups.UKG === true && 
              yearGroups.Reception === true &&
              Object.keys(yearGroups).length === 3;
            
            if (hasOldDefaults) {
              console.log(`🧹 Cleaning old default yearGroups for category "${cat.name}"`);
              yearGroups = {}; // Clear old defaults
            }
          }
          
          return {
            id: cat.id,  // Preserve Supabase PK
            name: cat.name,
            color: cat.color,
            position: cat.position || 0,
            group: cat.group, // Single group (backward compatibility)
            groups: cat.groups || (cat.group ? [cat.group] : []), // Multiple groups
            yearGroups: yearGroups // Cleaned yearGroups
          };
        });
        
        // Use categories from Supabase directly - deleted categories stay deleted
        if (formattedCategories.length > 0) {
          setCategories(formattedCategories);
          localStorage.setItem('saved-categories', JSON.stringify(formattedCategories));
          console.log('✅ Categories refreshed from Supabase:', formattedCategories.length);
        }
      }

      // Refresh category groups
      const supabaseCategoryGroups = await categoryGroupsApi.getAll();
      if (supabaseCategoryGroups && supabaseCategoryGroups.length > 0) {
        const groupNames = supabaseCategoryGroups.map(group => group.name);
        setCategoryGroups({ groups: groupNames });
        localStorage.setItem('category-groups', JSON.stringify({ groups: groupNames }));
        console.log('✅ Category groups refreshed from Supabase:', groupNames);
      }

      // Refresh branding from Supabase
      try {
        const supabaseBranding = await brandingApi.get();
        if (supabaseBranding && typeof supabaseBranding === 'object' && Object.keys(supabaseBranding).length > 0) {
          setSettings(prev => ({
            ...prev,
            branding: { ...DEFAULT_BRANDING, ...(prev.branding || {}), ...supabaseBranding }
          }));
          console.log('✅ Branding refreshed from Supabase');
        }
      } catch (e) {
        if (import.meta.env.DEV) console.warn('Failed to refresh branding from Supabase:', e);
      }
      
      console.log('✅ All settings refreshed from Supabase successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to refresh from Supabase:', error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  // New function to force sync current year groups to Supabase (for Safari issues)
  const forceSyncCurrentYearGroups = async () => {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase not configured - cannot sync');
      return false;
    }

    try {
      console.log('🔄 Force syncing current year groups to Supabase...');
      console.log('📦 Current year groups to sync:', customYearGroups);
      
      if (customYearGroups && customYearGroups.length > 0) {
        await yearGroupsApi.upsert(customYearGroups);
        console.log('✅ Successfully synced current year groups to Supabase');
        return true;
      } else {
        console.log('⚠️ No year groups to sync');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to sync current year groups to Supabase:', error);
      return false;
    }
  };

  // Safari-specific sync function with enhanced retry logic
  const forceSafariSync = async () => {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured, cannot sync');
      return false;
    }

    const browserIsSafari = isSafari();
    if (!browserIsSafari) {
      console.log('ℹ️ Not Safari browser, using standard sync...');
      return await forceRefreshFromSupabase();
    }

    console.log('🍎 Safari-specific sync initiated...');
    
    try {
      // Step 1: Clear any cached data
      console.log('🧹 Clearing Safari cache...');
      if (typeof Storage !== 'undefined') {
        try {
          localStorage.removeItem('year-groups-cache');
          localStorage.removeItem('categories-cache');
          console.log('✅ Safari cache cleared');
        } catch (e) {
          console.warn('⚠️ Could not clear Safari cache:', e);
        }
      }

      // Step 2: Force refresh with multiple attempts
      console.log('🔄 Safari: Force refreshing with enhanced retry logic...');
      let refreshSuccess = false;
      const maxRefreshAttempts = 3;
      
      for (let attempt = 1; attempt <= maxRefreshAttempts; attempt++) {
        try {
          console.log(`🍎 Safari sync attempt ${attempt}/${maxRefreshAttempts}...`);
          refreshSuccess = await forceRefreshFromSupabase();
          if (refreshSuccess) {
            console.log(`✅ Safari sync attempt ${attempt} succeeded`);
            break;
          }
        } catch (error) {
          console.warn(`⚠️ Safari sync attempt ${attempt} failed:`, error);
          if (attempt < maxRefreshAttempts) {
            const delay = 2000 * attempt; // Increasing delay
            console.log(`⏳ Waiting ${delay}ms before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // Step 3: Verify the sync worked
      if (refreshSuccess) {
        console.log('🔍 Safari: Verifying sync results...');
        try {
          const verificationYearGroups = await yearGroupsApi.getAll();
          const verificationCategories = await customCategoriesApi.getAll();
          
          console.log('🔍 Safari sync verification:', {
            yearGroups: verificationYearGroups?.length || 0,
            categories: verificationCategories?.length || 0,
            localYearGroups: customYearGroups.length,
            localCategories: categories.length
          });
          
          return true;
        } catch (error) {
          console.warn('⚠️ Safari sync verification failed:', error);
          return false;
        }
      } else {
        console.error('❌ All Safari sync attempts failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Safari sync failed:', error);
      return false;
    }
  };

  // Helper function to clean up duplicates in the database
  const cleanupDuplicates = async () => {
    if (!isSupabaseConfigured()) return;
    
    try {
      console.log('🧹 Cleaning up duplicate year groups in database...');
      const allGroups = await yearGroupsApi.getAll();
      
      // Group by name and keep only the first occurrence
      const uniqueGroups = allGroups.reduce((acc: any[], group: any) => {
        const existing = acc.find(g => g.name === group.name);
        if (!existing) {
          acc.push(group);
        }
        return acc;
      }, []);
      
      if (uniqueGroups.length !== allGroups.length) {
        console.log(`🧹 Found ${allGroups.length - uniqueGroups.length} duplicates, cleaning up...`);
        
        // Delete all existing year groups
        await supabase.from('year_groups').delete().neq('id', '');
        
        // Re-insert only unique groups
        if (uniqueGroups.length > 0) {
          await yearGroupsApi.upsert(uniqueGroups);
        }
        
        console.log('✅ Database cleanup completed');
      } else {
        console.log('✅ No duplicates found in database');
      }
    } catch (error) {
      console.error('❌ Failed to cleanup duplicates:', error);
    }
  };

  // Helper function to map old activity level names to new year group names
  const mapActivityLevelToYearGroup = (level: string): string => {
    // Create a mapping from old names to new names
    const levelMapping: Record<string, string> = {
      'LKG': 'Lower Kindergarten Music',
      'UKG': 'Upper Kindergarten Music',
      'Reception': 'Reception Music',
      'EYFS U': 'Upper Kindergarten Music', // Handle this legacy case too
      'EYFS L': 'Lower Kindergarten Music',  // Handle this legacy case too
      'Lower Kindergarten': 'Lower Kindergarten Music', // Handle transition period
      'Upper Kindergarten': 'Upper Kindergarten Music' // Handle transition period
    };
    
    // If it's already a full name, return as is
    if (customYearGroups.some(group => group.name === level)) {
      return level;
    }
    
    // If it's a short name, map to full name
    if (levelMapping[level]) {
      return levelMapping[level];
    }
    
    // If no mapping found, return original
    return level;
  };

  // Helper function to map year group names back to activity level names
  const mapYearGroupToActivityLevel = (yearGroupName: string): string => {
    // Create reverse mapping from new names to old names for backward compatibility
    const reverseMapping: Record<string, string> = {
      'Lower Kindergarten Music': 'LKG',
      'Upper Kindergarten Music': 'UKG',
      'Reception Music': 'Reception'
    };
    
    return reverseMapping[yearGroupName] || yearGroupName;
  };

  // Helper function to adjust a color's brightness
  const adjustColor = (color: string, amount: number): string => {
    // Convert hex to RGB
    let r = parseInt(color.substring(1, 3), 16);
    let g = parseInt(color.substring(3, 5), 16);
    let b = parseInt(color.substring(5, 7), 16);
    
    // Adjust RGB values
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const getThemeForSubject = (subjectId: string): Theme => {
    return {
      primary: '#3b82f6',
      secondary: '#60a5fa',
      accent: '#1d4ed8',
    };
  };

  const getCategoryColor = (categoryName: string): string => {
    const category = categories.find((cat) => cat.name === categoryName);
    return category?.color || '#6b7280';
  };

  const getCategoryByName = (categoryName: string): Category | null => {
    return categories.find((cat) => cat.name === categoryName) || null;
  };

  const getSubjectCategories = () => {
    return categories.map((cat, index) => ({
      id: `fixed-${index}`,
      name: cat.name,
      color: cat.color,
      description: '',
      is_locked: false,
      is_active: true,
      sort_order: cat.position,
    }));
  };

  const getCategoryColorById = (categoryId: string): string => {
    return '#6b7280';
  };

  const getCategoryNameById = (categoryId: string): string => {
    return 'Unknown Category';
  };

  const handleSetDefaultViewMode = (mode: 'grid' | 'list' | 'compact') => {
    setDefaultViewMode(mode);
    localStorage.setItem('defaultViewMode', mode);
  };

  const handleSetIsAdmin = (admin: boolean) => {
    setIsAdmin(admin);
    localStorage.setItem('isAdmin', admin.toString());
  };

  // DUPLICATE useEffect REMOVED - This was causing the infinite loop!
  // The category groups save logic is handled in the useEffect above (line 932)

  const addCategoryGroup = async (groupName: string) => {
    if (!categoryGroups.groups.includes(groupName)) {
      const updatedGroups = {
        ...categoryGroups,
        groups: [...categoryGroups.groups, groupName]
      };
      setCategoryGroups(updatedGroups);
      localStorage.setItem('category-groups', JSON.stringify(updatedGroups));
      
      // Also save to Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          await categoryGroupsApi.upsert(updatedGroups.groups);
          console.log('✅ Category group added and saved to Supabase:', groupName);
        } catch (error) {
          console.error('❌ Failed to save category group to Supabase:', error);
        }
      }
    }
  };

  const removeCategoryGroup = async (groupName: string) => {
    const updatedGroups = {
      ...categoryGroups,
      groups: categoryGroups.groups.filter(g => g !== groupName)
    };
    setCategoryGroups(updatedGroups);
    localStorage.setItem('category-groups', JSON.stringify(updatedGroups));
    
    // Also save to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        await categoryGroupsApi.upsert(updatedGroups.groups);
        console.log('✅ Category group removed and saved to Supabase:', groupName);
      } catch (error) {
        console.error('❌ Failed to save category group removal to Supabase:', error);
      }
    }
    
    // Remove group from all categories that have it (both single group and multiple groups)
    const updatedCategories = categories.map(cat => {
      // Handle single group field (backward compatibility)
      if (cat.group === groupName) {
        return { ...cat, group: undefined };
      }
      
      // Handle multiple groups field (new functionality)
      if (cat.groups && cat.groups.includes(groupName)) {
        const newGroups = cat.groups.filter(g => g !== groupName);
        return { 
          ...cat, 
          groups: newGroups.length > 0 ? newGroups : undefined 
        };
      }
      
      return cat;
    });
    updateCategories(updatedCategories);
  };

  const updateCategoryGroup = async (oldName: string, newName: string) => {
    const updatedGroups = {
      ...categoryGroups,
      groups: categoryGroups.groups.map(g => g === oldName ? newName : g)
    };
    setCategoryGroups(updatedGroups);
    localStorage.setItem('category-groups', JSON.stringify(updatedGroups));
    
    // Also save to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        await categoryGroupsApi.upsert(updatedGroups.groups);
        console.log('✅ Category group updated and saved to Supabase:', oldName, '->', newName);
      } catch (error) {
        console.error('❌ Failed to save category group update to Supabase:', error);
      }
    }
    
    // Update group name in all categories that have it (both single group and multiple groups)
    const updatedCategories = categories.map(cat => {
      // Handle single group field (backward compatibility)
      if (cat.group === oldName) {
        return { ...cat, group: newName };
      }
      
      // Handle multiple groups field (new functionality)
      if (cat.groups && cat.groups.includes(oldName)) {
        return { 
          ...cat, 
          groups: cat.groups.map(g => g === oldName ? newName : g)
        };
      }
      
      return cat;
    });
    updateCategories(updatedCategories);
  };

  const contextValue: SettingsContextType = {
    getThemeForClass,
    getThemeForSubject,
    categories,
    getCategoryColor,
    getCategoryByName,
    addCategoryPermanently,
    getSubjectCategories,
    getCategoryColorById,
    getCategoryNameById,
    defaultViewMode,
    setDefaultViewMode: handleSetDefaultViewMode,
    isAdmin,
    setIsAdmin: handleSetIsAdmin,
    settings,
    customYearGroups,
    yearGroupBands,
    yearGroupSections,
    updateSettings,
    updateCategories,
    updateYearGroups,
    updateYearGroupSections,
    getOrderedYearGroups,
    updateYearGroupBands,
    deleteYearGroup,
    forceSyncYearGroups,
    cleanupDuplicates,
    forceSyncToSupabase,
    forceRefreshFromSupabase,
    forceSyncCurrentYearGroups,
    forceSafariSync,
    mapActivityLevelToYearGroup,
    mapYearGroupToActivityLevel,
    resetToDefaults,
    resetCategoriesToDefaults,
    resetYearGroupsToDefaults,
    addMissingDefaultYearGroups,
    ensureYearGroupsInSections,
    // Simple Category Groups
    categoryGroups,
    addCategoryGroup,
    removeCategoryGroup,
    updateCategoryGroup,
    // User change management
    startUserChange,
    endUserChange,
    // Resource link customization
    resourceLinks,
    updateResourceLinks,
    resetResourceLinksToDefaults
  };

  return (
    <SettingsContextNew.Provider value={contextValue}>
      {children}
    </SettingsContextNew.Provider>
  );
};

export default SettingsProviderNew;
