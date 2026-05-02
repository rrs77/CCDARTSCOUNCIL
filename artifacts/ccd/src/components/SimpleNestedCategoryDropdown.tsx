import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSettings, Category } from '../contexts/SettingsContextNew';
import { useData } from '../contexts/DataContext';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';

interface SimpleNestedCategoryDropdownProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  placeholder?: string;
  className?: string;
  dropdownBackgroundColor?: string;
  textColor?: string;
  showAllCategories?: boolean; // If true, show all categories regardless of year group filtering
}

export function SimpleNestedCategoryDropdown({
  selectedCategory,
  onCategoryChange,
  placeholder = 'Select Category',
  className = '',
  dropdownBackgroundColor,
  textColor,
  showAllCategories = false
}: SimpleNestedCategoryDropdownProps) {
  const { categories, categoryGroups, customYearGroups, yearGroupSections } = useSettings();
  const { currentSheetInfo } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedKeyStages, setExpandedKeyStages] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const KEY_STAGE_LABELS: Record<string, string> = { eyfs: 'EYFS', ks1: 'KS1', ks2: 'KS2', ks3: 'KS3', ks4: 'KS4', ks5: 'KS5', other: 'Other' };

  // Helper function to get the year group key(s) to check in category.yearGroups
  // This matches the EXACT logic used in UserSettings when saving categories (line 1557-1560)
  // IMPORTANT: Only return the PRIMARY key used when saving - don't include backward compatibility keys
  // This ensures we only show categories explicitly assigned to this year group
  const getCurrentYearGroupKeys = (): string[] => {
    const sheetId = currentSheetInfo?.sheet;
    if (!sheetId) return [];

    const norm = (v: string | undefined | null) => (v || '').trim().toLowerCase();
    const sheetNorm = norm(sheetId);

    // Short-code → long-name matchers for backward compatibility.
    const shortToLong: Record<string, (name: string) => boolean> = {
      lkg: (n) => n.includes('lower') && n.includes('kindergarten'),
      ukg: (n) => n.includes('upper') && n.includes('kindergarten'),
      reception: (n) => n === 'reception',
    };

    // 1) Try exact match by ID, then by name.
    let yearGroup = customYearGroups.find(yg => yg.id === sheetId);
    if (!yearGroup) {
      yearGroup = customYearGroups.find(yg => yg.name === sheetId);
    }
    // 2) Fallback: if sheetId is a legacy short code (LKG / UKG / Reception),
    //    resolve it to the long-named year group saved in Supabase.
    if (!yearGroup && shortToLong[sheetNorm]) {
      const matcher = shortToLong[sheetNorm];
      yearGroup = customYearGroups.find((yg) => matcher(norm(yg.name)));
    }

    const keys: string[] = [];

    if (yearGroup) {
      const nameLower = yearGroup.name.toLowerCase();
      const primaryKey = yearGroup.id ||
        (nameLower.includes('lower') || nameLower.includes('lkg') ? 'LKG' :
         nameLower.includes('upper') || nameLower.includes('ukg') ? 'UKG' :
         nameLower.includes('reception') ? 'Reception' : yearGroup.name);

      if (primaryKey) keys.push(primaryKey);
      if (yearGroup.name && !keys.includes(yearGroup.name)) keys.push(yearGroup.name);
      // Also include derived short codes so categories assigned under either
      // long name or short code both match.
      if ((nameLower.includes('lower') || nameLower.includes('lkg')) && !keys.includes('LKG')) keys.push('LKG');
      if ((nameLower.includes('upper') || nameLower.includes('ukg')) && !keys.includes('UKG')) keys.push('UKG');
      if (nameLower.includes('reception') && !keys.includes('Reception')) keys.push('Reception');
    }

    // Always include the original sheetId as a safety net.
    if (sheetId && !keys.includes(sheetId)) keys.push(sheetId);

    if (import.meta.env.DEV) console.log('🔑 Year group keys:', { sheetId, keys });
    return keys;
  };

  // Get current year group display name for visual indicator
  const getCurrentYearGroupName = (): string | null => {
    const sheetId = currentSheetInfo?.sheet;
    if (!sheetId) return null;
    
    const yearGroup = customYearGroups.find(yg => yg.id === sheetId);
    return yearGroup ? yearGroup.name : currentSheetInfo?.display || null;
  };

  // Filter categories based on current year group
  const filteredCategories = useMemo(() => {
    // If showAllCategories is true, skip filtering and show all categories
    if (showAllCategories) {
      if (import.meta.env.DEV) console.log('📋 Showing all categories (showAllCategories=true)');
      return categories;
    }
    
    const yearGroupKeys = getCurrentYearGroupKeys();
    
    if (import.meta.env.DEV) console.log('🔍 Category filtering:', {
      sheetId: currentSheetInfo?.sheet,
      yearGroupKeys,
      totalCategories: categories.length
    });
    
    // If no year group keys found, show all categories (backward compatibility)
    if (yearGroupKeys.length === 0) {
      if (import.meta.env.DEV) console.log('⚠️ No year group keys found, showing all categories');
      return categories;
    }

    // Filter categories to only show those enabled for the current year group
    const filtered = categories.filter(category => {
      // If category doesn't have yearGroups property or it's empty, don't show it (must be explicitly assigned)
      if (!category.yearGroups || Object.keys(category.yearGroups).length === 0) {
        return false;
      }

      // Check if this category has old default assignments (all legacy keys set to true)
      // This indicates it was never properly assigned and should be ignored
      const hasOldDefaults = 
        category.yearGroups.LKG === true && 
        category.yearGroups.UKG === true && 
        category.yearGroups.Reception === true &&
        Object.keys(category.yearGroups).length === 3;
      
      if (hasOldDefaults) {
        // This category has old default values - ignore it unless explicitly assigned to current year group
        if (import.meta.env.DEV) {
          const categoryIndex = categories.indexOf(category);
          if (categoryIndex < 3) {
            console.log(`⚠️ Category "${category.name}" has old default assignments (LKG, UKG, Reception all true) - ignoring`);
          }
        }
        return false;
      }

      // Get all keys stored in this category's yearGroups
      const storedKeys = Object.keys(category.yearGroups);
      const storedValues = Object.entries(category.yearGroups).map(([k, v]) => `${k}:${v}`);
      
      // EXPLICIT EXCLUSIONS: Never show KS2/KS1 categories for Lower Kindergarten/Reception
      const categoryNameLower = category.name.toLowerCase();
      const primaryKey = yearGroupKeys[0];
      const primaryKeyLower = primaryKey?.toLowerCase() || '';
      
      if ((categoryNameLower.includes('ks2') || categoryNameLower.includes('key stage 2')) && 
          (primaryKeyLower.includes('lower kindergarten') || primaryKeyLower.includes('lkg') || 
           primaryKeyLower.includes('reception') || primaryKeyLower.includes('ukg'))) {
        if (import.meta.env.DEV) console.log(`🚫 EXCLUDING: "${category.name}" (KS2) should not be shown for "${primaryKey}" (Lower Kindergarten/Reception)`);
        return false;
      }
      
      // Check if this category is enabled for the PRIMARY year group key
      // We only check the primary key to ensure strict matching
      const value = category.yearGroups[primaryKey];
      const isEnabled = value === true;
      
      // Log detailed info for debugging (only first 5 categories to avoid spam)
      if (import.meta.env.DEV) {
        const categoryIndex = categories.indexOf(category);
        if (categoryIndex < 5) {
          console.log(`📋 Category "${category.name}":`, {
            storedKeys,
            storedValues,
            primaryKey,
            value,
            isEnabled
          });
        }
      }
      
      return isEnabled;
    });
    
    // Log summary with detailed breakdown
    const categoriesWithYearGroups = categories.filter(c => c.yearGroups && Object.keys(c.yearGroups).length > 0);
    const categoriesWithoutYearGroups = categories.filter(c => !c.yearGroups || Object.keys(c.yearGroups).length === 0);
    
    if (import.meta.env.DEV) console.log(`📊 Category filtering summary:`, {
      yearGroup: getCurrentYearGroupName() || currentSheetInfo?.sheet,
      yearGroupKeys,
      totalCategories: categories.length,
      categoriesWithYearGroups: categoriesWithYearGroups.length,
      categoriesWithoutYearGroups: categoriesWithoutYearGroups.length,
      filteredCount: filtered.length,
      filteredCategories: filtered.map(c => c.name).slice(0, 10)
    });
    
    return filtered;
  }, [categories, currentSheetInfo, customYearGroups, showAllCategories]);

  // Check if filtering is active
  const isFilteringActive = useMemo(() => {
    const yearGroupKeys = getCurrentYearGroupKeys();
    return yearGroupKeys.length > 0;
  }, [currentSheetInfo, customYearGroups]);

  // Get count of filtered vs total categories
  const filteredCount = filteredCategories.length;
  const totalCount = categories.length;

  const getCategoryNameById = (name: string) => {
    if (!name) return name;
    // Try exact match first in filtered categories
    const exactMatch = filteredCategories.find(c => c.name === name);
    if (exactMatch) return exactMatch.name;
    // Try case-insensitive match
    const caseInsensitiveMatch = filteredCategories.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (caseInsensitiveMatch) return caseInsensitiveMatch.name;
    // Return original if no match found (might be a deleted/renamed category)
    return name;
  };
  const getCategoryColorById = (name: string) => {
    if (!name) return '#ccc';
    const exactMatch = filteredCategories.find(c => c.name === name);
    if (exactMatch) return exactMatch.color;
    const caseInsensitiveMatch = filteredCategories.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (caseInsensitiveMatch) return caseInsensitiveMatch.color;
    return '#ccc';
  };

  const currentSelectionName = selectedCategory ? getCategoryNameById(selectedCategory) : placeholder;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset search when opening
  useEffect(() => {
    if (!isOpen) setSearchQuery('');
  }, [isOpen]);

  // Search-filter categories (by name or group name)
  const searchFilteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredCategories;
    return filteredCategories.filter(c => {
      const nameMatch = c.name.toLowerCase().includes(q);
      const groupMatch = (c.group?.toLowerCase().includes(q)) || (c.groups?.some(g => g.toLowerCase().includes(q)));
      return nameMatch || groupMatch;
    });
  }, [filteredCategories, searchQuery]);

  // Group filtered categories by key stage (EYFS, KS1, KS2, KS3, KS4, KS5, Other). Only include key stages that have at least one category assigned.
  const categoriesByKeyStage = useMemo(() => {
    const bySection: { sectionId: string; label: string; sortOrder: number; categories: Category[] }[] = [];
    const sectionIdsSeen = new Set<string>();
    const sortedSections = [...yearGroupSections].sort((a, b) => a.sortOrder - b.sortOrder);
    for (const section of sortedSections) {
      const yearGroupIdsInSection = new Set(section.yearGroupIds || []);
      const catsInSection = searchFilteredCategories.filter(cat => {
        if (!cat.yearGroups || Object.keys(cat.yearGroups).length === 0) return false;
        const assignedToThisSection = Object.entries(cat.yearGroups).some(
          ([key, val]) => val === true && yearGroupIdsInSection.has(key)
        );
        return assignedToThisSection;
      });
      if (catsInSection.length > 0) {
        bySection.push({
          sectionId: section.id,
          label: KEY_STAGE_LABELS[section.id] ?? section.label,
          sortOrder: section.sortOrder,
          categories: catsInSection
        });
        sectionIdsSeen.add(section.id);
      }
    }
    return bySection;
  }, [yearGroupSections, searchFilteredCategories]);

  const handleSelectCategory = (categoryName: string) => {
    onCategoryChange(categoryName);
    setIsOpen(false);
  };

  const toggleGroupExpansion = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) newExpanded.delete(groupName);
    else newExpanded.add(groupName);
    setExpandedGroups(newExpanded);
  };

  const toggleKeyStageExpansion = (sectionId: string) => {
    const next = new Set(expandedKeyStages);
    if (next.has(sectionId)) next.delete(sectionId);
    else next.add(sectionId);
    setExpandedKeyStages(next);
  };

  // Group search-filtered categories by their group(s)
  const groupedCategories = searchFilteredCategories.reduce((acc, category) => {
    // Handle multiple groups (new functionality)
    if (category.groups && category.groups.length > 0) {
      category.groups.forEach(group => {
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(category);
      });
    } else {
      // Handle single group (backward compatibility)
      const group = category.group || 'Ungrouped';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(category);
    }
    return acc;
  }, {} as Record<string, Category[]>);

  // Sort groups: Ungrouped first, then alphabetically
  const sortedGroups = Object.keys(groupedCategories).sort((a, b) => {
    if (a === 'Ungrouped') return -1;
    if (b === 'Ungrouped') return 1;
    return a.localeCompare(b);
  });

  // When searching, expand all groups so results are visible
  const effectiveExpandedGroups = useMemo(() => {
    if (searchQuery.trim()) return new Set(sortedGroups);
    return expandedGroups;
  }, [searchQuery, sortedGroups.join(','), expandedGroups]);

  const currentYearGroupName = getCurrentYearGroupName();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className={`flex justify-between items-center w-full text-left ${className}`}
        style={{ color: textColor }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-current truncate">
          {currentSelectionName}
        </span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} style={{ color: textColor }} />
      </button>

      {isOpen && (
        <div 
          className="absolute z-50 mt-1 w-96 min-w-full rounded-lg shadow-xl max-h-80 overflow-hidden border border-gray-200 flex flex-col"
          style={{ 
            backgroundColor: dropdownBackgroundColor || 'white',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="p-2 border-b border-gray-200 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                onClick={(e) => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSearchQuery(''); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <ul className="py-1 overflow-y-auto flex-1">
            {/* When filtering by year group: show collapsible key stages (EYFS, KS1, KS2, …); only show headings that have categories */}
            {isFilteringActive ? (
              searchFilteredCategories.length === 0 ? (
                <li className="px-4 py-3 text-sm text-gray-500">
                  {searchQuery ? `No categories match "${searchQuery}"` : 'No categories assigned to this year group.'}
                </li>
              ) : categoriesByKeyStage.length === 0 ? (
                <li className="px-4 py-3 text-sm text-gray-500">No categories in any key stage for current selection.</li>
              ) : (
                <>
                  <li
                    className={`px-4 py-2 text-sm cursor-pointer transition-colors duration-150 ${selectedCategory === '' ? 'bg-gray-100 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSelectCategory(''); }}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onMouseUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  >
                    {placeholder}
                  </li>
                  {categoriesByKeyStage.map(({ sectionId, label, categories: sectionCategories }) => {
                    const isKeyStageExpanded = searchQuery.trim() ? true : expandedKeyStages.has(sectionId);
                    return (
                      <React.Fragment key={sectionId}>
                        <li
                          className="px-2 py-2 bg-gray-100 border-t border-gray-200 text-sm font-semibold text-gray-800 flex items-center justify-between cursor-pointer hover:bg-teal-50"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleKeyStageExpansion(sectionId); }}
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onMouseUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        >
                          <div className="flex items-center gap-2">
                            {isKeyStageExpanded ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                            <span>{label}</span>
                          </div>
                          <span className="text-xs text-gray-500">{sectionCategories.length}</span>
                        </li>
                        {isKeyStageExpanded && sectionCategories.map(category => (
                          <li
                            key={category.name}
                            className={`flex items-center gap-2 px-6 py-2 text-sm cursor-pointer transition-colors duration-150 ${
                              selectedCategory === category.name ? 'bg-teal-100 font-medium' : 'text-gray-700 hover:bg-teal-50'
                            }`}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSelectCategory(category.name); }}
                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onMouseUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          >
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                            <span className="truncate">{category.name}</span>
                          </li>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </>
              )
            ) : searchFilteredCategories.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-500">No categories match "{searchQuery}"</li>
            ) : (
              // Original grouped structure when not filtering
              <>
                {/* Placeholder/All Categories Option */}
            <li
              className={`px-4 py-2 text-sm cursor-pointer transition-colors duration-150 ${
                selectedCategory === '' 
                  ? 'bg-gray-100 font-medium' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              style={{
                color: selectedCategory === '' ? '#374151' : undefined
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectCategory('');
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {placeholder}
            </li>
            {sortedGroups.map(groupName => (
              <React.Fragment key={groupName}>
                <li 
                  className="px-2 py-2 bg-gray-50 border-t border-b border-gray-200 text-sm font-semibold text-gray-800 flex items-center justify-between cursor-pointer hover:bg-teal-50 transition-all duration-150"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Group clicked:', groupName);
                    toggleGroupExpansion(groupName);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="text-gray-500">
                      {effectiveExpandedGroups.has(groupName) ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                    </div>
                    {groupName}
                  </div>
                  <span className="text-xs text-gray-500">{groupedCategories[groupName].length}</span>
                </li>
                {effectiveExpandedGroups.has(groupName) && groupedCategories[groupName].map(category => (
                  <li
                    key={category.name}
                    className={`flex items-center gap-2 px-6 py-2 text-sm cursor-pointer transition-colors duration-150 ${
                      selectedCategory === category.name 
                        ? 'bg-teal-100 font-medium' 
                        : 'text-gray-700 hover:bg-teal-50'
                    }`}
                    style={{
                      color: selectedCategory === category.name ? '#374151' : undefined
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelectCategory(category.name);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onMouseUp={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                    {category.name}
                  </li>
                ))}
              </React.Fragment>
            ))}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
