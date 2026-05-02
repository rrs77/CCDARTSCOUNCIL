import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, User, LogOut, BookOpen, RefreshCw, Settings, HelpCircle, Download, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useIsViewOnly } from '../hooks/useIsViewOnly';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { UserSettings } from './UserSettings';
import { WalkthroughGuide } from './WalkthroughGuide';
import { HelpGuide } from './HelpGuide';
import { LogoSVG } from './Logo';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function Header() {
  const { user, logout } = useAuth();
  const isViewOnly = useIsViewOnly();
  const { currentSheetInfo, setCurrentSheetInfo, refreshData, loading } = useData();
  const { settings, getThemeForClass, customYearGroups, yearGroupSections } = useSettings();
  const yearGroupDropdownRef = useRef<HTMLDivElement>(null);
  const [yearGroupDropdownOpen, setYearGroupDropdownOpen] = useState(false);
  const [yearGroupSectionsExpanded, setYearGroupSectionsExpanded] = useState<Set<string>>(new Set());
  // Restrict class selector to allowed year groups when admin has set them (user cannot change admin-assigned list)
  const allowedIds = user?.profile?.allowed_year_groups ?? null;
  const yearGroupsForSelector = allowedIds != null && allowedIds.length > 0
    ? customYearGroups.filter(g => allowedIds.includes(g.id) || allowedIds.includes(g.name ?? ''))
    : customYearGroups;

  // If user has restricted list and current sheet is not in it, switch to first allowed
  useEffect(() => {
    if (yearGroupsForSelector.length === 0) return;
    const currentInList = yearGroupsForSelector.some(g => g.id === currentSheetInfo.sheet || g.name === currentSheetInfo.display);
    if (!currentInList) {
      const first = yearGroupsForSelector[0];
      const newSheetInfo = { sheet: first.id, display: first.name, eyfs: `${first.id} Statements` };
      setCurrentSheetInfo(newSheetInfo);
      localStorage.setItem('currentSheetInfo', JSON.stringify(newSheetInfo));
    }
  }, [yearGroupsForSelector, currentSheetInfo.sheet, currentSheetInfo.display, setCurrentSheetInfo]);

  const { canInstall, isInstalled, install } = usePWAInstall();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [helpGuideSection, setHelpGuideSection] = useState<'activity' | 'lesson' | 'unit' | 'assign' | undefined>(undefined);

  // Sections that have at least one year group the user can access.
  // Resolve section tokens by id OR name so renamed classes still map correctly.
  const normalizeToken = (value: string | undefined | null) => (value || '').trim().toLowerCase();
  const selectorTokenMap = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; color?: string }>();
    yearGroupsForSelector.forEach((g) => {
      const idKey = normalizeToken(g.id);
      const nameKey = normalizeToken(g.name);
      if (idKey) map.set(idKey, g);
      if (nameKey) map.set(nameKey, g);
    });
    return map;
  }, [yearGroupsForSelector]);

  const visibleSections = React.useMemo(() => {
    return [...yearGroupSections]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter(section => section.yearGroupIds.some(token => selectorTokenMap.has(normalizeToken(token))))
      .map(section => ({
        ...section,
        groups: section.yearGroupIds
          .map(token => selectorTokenMap.get(normalizeToken(token)))
          .filter((g): g is { id: string; name: string; color?: string } => Boolean(g))
          .filter((g, index, arr) => arr.findIndex(x => x.id === g.id) === index)
      }));
  }, [yearGroupSections, selectorTokenMap]);

  // Quick auto-grouping for faster setup (keeps normal custom sections available in Settings).
  const quickSections = React.useMemo(() => {
    const SECTION_LABELS: Record<string, string> = {
      eyfs: 'EYFS',
      ks1: 'KS1',
      ks2: 'KS2',
      ks3: 'KS3',
      ks4: 'KS4',
      ks5: 'KS5',
      other: 'Other',
    };
    const order = ['eyfs', 'ks1', 'ks2', 'ks3', 'ks4', 'ks5', 'other'];

    const getSectionId = (group: { id: string; name: string }) => {
      const text = `${group.name} ${group.id}`.toLowerCase();
      if (
        text.includes('lower kindergarten') ||
        text.includes('upper kindergarten') ||
        text.includes('reception') ||
        /\blkg\b/.test(text) ||
        /\bukg\b/.test(text)
      ) {
        return 'eyfs';
      }
      const yearMatch = text.match(/year\s*([0-9]{1,2})/i);
      const rawNum = yearMatch?.[1] ?? (text.match(/(?:^|[^0-9])([0-9]{1,2})(?:[^0-9]|$)/)?.[1] ?? '');
      const yearNum = Number(rawNum);
      if (Number.isFinite(yearNum) && yearNum > 0) {
        if (yearNum <= 2) return 'ks1';
        if (yearNum <= 6) return 'ks2';
        if (yearNum <= 9) return 'ks3';
        if (yearNum <= 11) return 'ks4';
        if (yearNum <= 14) return 'ks5';
      }
      return 'other';
    };

    const buckets = new Map<string, { id: string; name: string; color?: string }[]>();
    yearGroupsForSelector.forEach((g) => {
      const sid = getSectionId(g);
      if (!buckets.has(sid)) buckets.set(sid, []);
      buckets.get(sid)!.push(g);
    });

    return order
      .map((id) => ({
        id,
        label: SECTION_LABELS[id],
        groups: buckets.get(id) || [],
      }))
      .filter((s) => s.groups.length > 0);
  }, [yearGroupsForSelector]);

  const displaySections = React.useMemo(() => {
    // Prefer user/settings-defined sections so header matches Manage Year Groups exactly.
    // Fallback to quick auto-grouping only when no visible configured sections exist.
    return visibleSections.length > 0 ? visibleSections : quickSections;
  }, [visibleSections, quickSections]);

  const toggleSectionExpanded = (sectionId: string) => {
    setYearGroupSectionsExpanded(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const selectYearGroup = (group: { id: string; name: string }) => {
    const newSheetInfo = { sheet: group.id, display: group.name, eyfs: `${group.id} Statements` };
    setCurrentSheetInfo(newSheetInfo);
    localStorage.setItem('currentSheetInfo', JSON.stringify(newSheetInfo));
    setYearGroupDropdownOpen(false);
  };

  // Keep header label in sync when a class is renamed in Settings.
  useEffect(() => {
    const matchById = yearGroupsForSelector.find(g => g.id === currentSheetInfo.sheet);
    if (!matchById) return;
    if (currentSheetInfo.display !== matchById.name) {
      const synced = {
        ...currentSheetInfo,
        display: matchById.name,
        eyfs: `${matchById.id} Statements`,
      };
      setCurrentSheetInfo(synced);
      localStorage.setItem('currentSheetInfo', JSON.stringify(synced));
    }
  }, [yearGroupsForSelector, currentSheetInfo, setCurrentSheetInfo]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (yearGroupDropdownRef.current && !yearGroupDropdownRef.current.contains(e.target as Node)) {
        setYearGroupDropdownOpen(false);
      }
    };
    if (yearGroupDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [yearGroupDropdownOpen]);

  // Get theme colors for current class
  const theme = getThemeForClass(currentSheetInfo.sheet);

  // Keep document title in sync with branding (tab/window title)
  const productName = settings.branding?.loginTitle || 'Creative Curriculum Designer';
  useEffect(() => {
    document.title = productName;
    return () => { document.title = 'Creative Curriculum Designer'; };
  }, [productName]);

  return (
    <>
      <header className="bg-white fixed top-0 left-0 right-0 z-50" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              {/* Teal gradient logo matching app design */}
              <LogoSVG size="xs-sm" showText={false} letters={settings.branding?.logoLetters} className="flex-shrink-0" />
              <div className="min-w-0 flex-1 flex items-center space-x-2">
                <h1 className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 truncate" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                  <span className="hidden sm:inline">{settings.branding?.loginTitle || 'Creative Curriculum Designer'}</span>
                  <span className="sm:hidden">{settings.branding?.logoLetters || 'CCD'}</span>
                </h1>
                {isViewOnly && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-md border border-yellow-200">
                    View Only
                  </span>
                )}
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2 flex-shrink-0">
              {/* Year Group Selector – collapsible key stages (only sections with resources) */}
              <div className="relative min-w-0" ref={yearGroupDropdownRef}>
                <button
                  type="button"
                  onClick={() => setYearGroupDropdownOpen(prev => !prev)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-xs lg:text-sm rounded-lg focus:border-teal-500 focus:ring-0 focus:outline-none px-3 py-1.5 lg:py-2 pr-8 flex items-center justify-between gap-2 min-w-[120px] lg:min-w-[180px] hover:bg-gray-100 transition-colors"
                >
                  <span className="truncate">{currentSheetInfo.display || currentSheetInfo.sheet}</span>
                  <ChevronDown className={`h-4 w-4 flex-shrink-0 text-gray-500 transition-transform ${yearGroupDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {yearGroupDropdownOpen && displaySections.length > 0 && (
                  <div className="absolute top-full left-0 mt-1 w-64 max-h-[70vh] overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                    {displaySections.map((section) => {
                      const isExpanded = yearGroupSectionsExpanded.has(section.id);
                      return (
                        <div key={section.id} className="border-b border-gray-100 last:border-b-0">
                          <button
                            type="button"
                            onClick={() => toggleSectionExpanded(section.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 flex-shrink-0" />}
                            <span>{section.label}</span>
                            <span className="text-xs font-normal text-gray-500">({section.groups.length})</span>
                          </button>
                          {isExpanded && (
                            <div className="pb-1">
                              {section.groups.map((group) => (
                                <button
                                  key={group.id}
                                  type="button"
                                  onClick={() => selectYearGroup(group)}
                                  className={`w-full flex items-center gap-2 px-3 py-2 pl-8 text-left text-sm hover:bg-teal-50 ${currentSheetInfo.sheet === group.id ? 'bg-teal-50 text-teal-800 font-medium' : 'text-gray-700'}`}
                                >
                                  {currentSheetInfo.sheet === group.id && <Check className="h-4 w-4 flex-shrink-0 text-teal-600" />}
                                  <span className={currentSheetInfo.sheet === group.id ? 'font-medium' : ''}>{group.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {yearGroupDropdownOpen && displaySections.length === 0 && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 text-sm text-gray-500">
                    No year groups. Add and assign key stages in Settings → Year Groups.
                  </div>
                )}
              </div>

              {/* Install App Button */}
              {canInstall && !isInstalled && (
                <button
                  onClick={async () => {
                    // Automatically trigger installation - browser will handle the prompt
                    await install();
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 lg:px-4 lg:py-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors duration-200 flex-shrink-0 border border-teal-200"
                  title="Install this app to your device for quick access and offline use"
                >
                  <Download className="h-4 w-4 lg:h-5 lg:w-5" />
                  <span className="hidden lg:inline text-sm font-medium">Install</span>
                </button>
              )}

              {/* Help Button */}
              <button
                onClick={() => setShowHelpGuide(true)}
                className="p-1.5 lg:p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex-shrink-0"
                title="Help Guide"
                data-help-button
              >
                <HelpCircle className="h-4 w-4 lg:h-5 lg:w-5" />
              </button>

              {/* Settings Button */}
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-1.5 lg:p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex-shrink-0"
                title="User Settings"
              >
                <Settings className="h-4 w-4 lg:h-5 lg:w-5" />
              </button>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-1.5 lg:p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50 flex-shrink-0"
                title="Refresh Data"
              >
                <RefreshCw className={`h-4 w-4 lg:h-5 lg:w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-1 lg:space-x-3 flex-shrink-0 min-w-0">
                <div className="flex items-center space-x-1 lg:space-x-2 min-w-0 p-1 lg:p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-6 w-6 lg:h-8 lg:w-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-6 w-6 lg:h-8 lg:w-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-3 w-3 lg:h-5 lg:w-5 text-gray-600" />
                    </div>
                  )}
                  <span className="text-xs lg:text-sm font-medium text-gray-700 truncate max-w-[80px] lg:max-w-[120px] hidden lg:inline">
                    {user?.name}
                  </span>
                </div>
                <button
                  onClick={() => void logout()}
                  className="p-1.5 lg:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex-shrink-0"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4 lg:h-5 lg:w-5" />
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex-shrink-0"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="space-y-4">
                {/* Year Group Selector Mobile – collapsible key stages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Year Group
                  </label>
                  <div className="space-y-1 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    {displaySections.map((section) => {
                      const isExpanded = yearGroupSectionsExpanded.has(section.id);
                      return (
                        <div key={section.id}>
                          <button
                            type="button"
                            onClick={() => toggleSectionExpanded(section.id)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border-b border-gray-100"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 flex-shrink-0" />}
                            <span>{section.label}</span>
                            <span className="text-xs font-normal text-gray-500">({section.groups.length})</span>
                          </button>
                          {isExpanded && (
                            <div className="bg-gray-50">
                              {section.groups.map((group) => (
                                <button
                                  key={group.id}
                                  type="button"
                                  onClick={() => { selectYearGroup(group); setMobileMenuOpen(false); }}
                                  className={`w-full flex items-center gap-2 px-3 py-2 pl-8 text-left text-sm ${currentSheetInfo.sheet === group.id ? 'bg-teal-100 text-teal-800 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                                >
                                  {currentSheetInfo.sheet === group.id && <Check className="h-4 w-4 flex-shrink-0 text-teal-600" />}
                                  {group.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {displaySections.length === 0 && (
                      <p className="px-3 py-2 text-sm text-gray-500">No year groups. Add key stages in Settings.</p>
                    )}
                  </div>
                </div>

                {/* User Info Mobile */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {user?.name}
                    </span>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    {canInstall && !isInstalled && (
                      <button
                        onClick={async () => {
                          const installed = await install();
                          if (!installed) {
                            alert('To install this app:\n\nDesktop: Look for the install icon (⊕) in your browser\'s address bar\n\niOS: Tap Share → Add to Home Screen\n\nAndroid: Tap Menu → Install app');
                          }
                        }}
                        className="flex items-center space-x-2 px-3 py-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors duration-200 border border-teal-200"
                        title="Install this app to your device"
                      >
                        <Download className="h-5 w-5" />
                        <span className="text-sm font-medium">Install</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowHelpGuide(true)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <HelpCircle className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        setSettingsOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <Settings className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleRefresh}
                      disabled={loading}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => void logout()}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* User Settings Modal */}
      <UserSettings 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />

      {/* Walkthrough Guide */}
      <WalkthroughGuide
        isOpen={showWalkthrough}
        onClose={() => setShowWalkthrough(false)}
      />

      {/* Help Guide */}
      <HelpGuide
        isOpen={showHelpGuide}
        onClose={() => setShowHelpGuide(false)}
        initialSection={helpGuideSection}
      />
    </>
  );

  // Navigation between lessons
  function handleRefresh() {
    refreshData();
  }
}