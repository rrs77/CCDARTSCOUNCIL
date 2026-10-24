import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, RefreshCw, HelpCircle, Download, ChevronDown, ChevronRight, Check, MessageSquare } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useIsViewOnly } from '../hooks/useIsViewOnly';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { navigateToSettings } from './settings';
import { WalkthroughGuide } from './WalkthroughGuide';
import { navigateToHelp } from './help';
import { LogoSVG } from './Logo';
import { AccountMenu } from './AccountMenu';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { flattenClassesNatural } from '../utils/classOrganization';
import { isDemoModeActive, shouldShowPreviewBanner } from '../utils/demoMode';

export function Header() {
  const { user } = useAuth();
  const isViewOnly = useIsViewOnly();
  const { currentSheetInfo, setCurrentSheetInfo, refreshData, loading } = useData();
  const { settings, customYearGroups, yearGroupSections } = useSettings();
  const yearGroupDropdownRef = useRef<HTMLDivElement>(null);
  const [yearGroupDropdownOpen, setYearGroupDropdownOpen] = useState(false);
  const [yearGroupSectionsExpanded, setYearGroupSectionsExpanded] = useState<Set<string>>(new Set());
  // Demo keeps a curated primary-only selector; real teachers need unassigned classes too.
  const demoMode = isDemoModeActive();
  // Restrict class selector to allowed year groups when admin has set them (user cannot change admin-assigned list)
  const allowedIds = user?.profile?.allowed_year_groups ?? null;
  const yearGroupsForSelector = allowedIds != null && allowedIds.length > 0
    ? customYearGroups.filter(g => allowedIds.includes(g.id) || allowedIds.includes(g.name ?? ''))
    : customYearGroups;

  const { canInstall, isInstalled, install } = usePWAInstall();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  /** Persistent class context on every tab (C1). Planner can be All-class or One-class. */
  const [studioTab, setStudioTab] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.dataset.ccdTab || 'unit-viewer' : 'unit-viewer',
  );
  const [plannerFocusMode, setPlannerFocusMode] = useState<'all' | 'one'>(() =>
    typeof document !== 'undefined' && document.documentElement.dataset.ccdPlannerFocus === 'one'
      ? 'one'
      : 'all',
  );
  const onPlannerTab = studioTab === 'unit-viewer';
  const allClassPlannerView = onPlannerTab && plannerFocusMode === 'all';
  const showYearGroupSelector = true;

  // Auto-open the walkthrough when the user arrived via the login page's
  // "Feature Walkthrough" button (which sets a one-shot session flag and
  // reloads to '/'), and when any other component dispatches the
  // 'ccd:start-walkthrough' window event. The flag is consumed so a normal
  // refresh later in the session does not re-trigger the tour.
  useEffect(() => {
    let shouldOpen = false;
    try {
      if (sessionStorage.getItem('ccd-start-walkthrough') === '1') {
        sessionStorage.removeItem('ccd-start-walkthrough');
        shouldOpen = true;
      }
    } catch {
      /* sessionStorage may be blocked – noop */
    }
    if (!shouldOpen) return undefined;
    // Defer one frame so the Dashboard tabs have mounted and their
    // [data-tab="..."] targets are queryable.
    const t = window.setTimeout(() => setShowWalkthrough(true), 250);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = () => setShowWalkthrough(true);
    window.addEventListener('ccd:start-walkthrough', handler);
    return () => window.removeEventListener('ccd:start-walkthrough', handler);
  }, []);

  // Deep link /walkthrough — open tour inside the main shell (not /forum).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname.replace(/\/+$/, '') === '/walkthrough') {
      const t = window.setTimeout(() => setShowWalkthrough(true), 200);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, []);

  useEffect(() => {
    const openSettings = () => navigateToSettings();
    window.addEventListener('ccd:open-settings', openSettings);
    return () => window.removeEventListener('ccd:open-settings', openSettings);
  }, []);

  useEffect(() => {
    const openHelp = () => navigateToHelp();
    window.addEventListener('ccd:open-help', openHelp);
    return () => window.removeEventListener('ccd:open-help', openHelp);
  }, []);

  useEffect(() => {
    const onTab = (e: Event) => {
      const tab = (e as CustomEvent<{ tab?: string }>).detail?.tab;
      if (tab) setStudioTab(tab);
    };
    window.addEventListener('ccd:active-tab', onTab);
    return () => window.removeEventListener('ccd:active-tab', onTab);
  }, []);

  useEffect(() => {
    const onFocus = (e: Event) => {
      const mode = (e as CustomEvent<{ mode?: string }>).detail?.mode;
      if (mode === 'all' || mode === 'one') setPlannerFocusMode(mode);
    };
    window.addEventListener('ccd:planner-focus', onFocus);
    return () => window.removeEventListener('ccd:planner-focus', onFocus);
  }, []);

  useEffect(() => {
    try {
      const pending = sessionStorage.getItem('ccd-open-settings-tab');
      if (pending) {
        navigateToSettings(pending);
      }
    } catch {
      /* ignore */
    }
  }, []);

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

  // Key-stage folders from Settings (EYFS, KS1…). Skip "Other" as a labelled bucket —
  // demo hides those classes entirely; real logins surface them as a flat list below.
  const isOtherSection = (section: { id: string; label?: string }) =>
    section.id === 'other' || normalizeToken(section.label) === 'other';

  const displaySections = React.useMemo(() => {
    return [...yearGroupSections]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter((section) => !isOtherSection(section))
      .map((section) => ({
        ...section,
        groups: flattenClassesNatural(
          section.yearGroupIds
            .map((token) => selectorTokenMap.get(normalizeToken(token)))
            .filter((g): g is { id: string; name: string; color?: string } => Boolean(g))
            .filter((g, index, arr) => arr.findIndex((x) => x.id === g.id) === index),
        ),
      }))
      .filter((section) => section.groups.length > 0);
  }, [yearGroupSections, selectorTokenMap]);

  // Classes in Other / not assigned to a key stage. Always surface them when no
  // key-stage section has classes — otherwise Settings → My classes won't reach the header chip.
  const uncategorizedGroups = React.useMemo(() => {
    const assignedIds = new Set<string>();
    displaySections.forEach((section) => {
      section.groups.forEach((g) => assignedIds.add(g.id));
    });
    return flattenClassesNatural(
      yearGroupsForSelector.filter((g) => !assignedIds.has(g.id)),
    );
  }, [displaySections, yearGroupsForSelector]);

  // Flat list of selectable classes (key-stage folders, then unassigned).
  const selectableYearGroups = React.useMemo(() => {
    const groups: { id: string; name: string; color?: string }[] = [];
    const seen = new Set<string>();
    displaySections.forEach((section) => {
      section.groups.forEach((g) => {
        if (seen.has(g.id)) return;
        seen.add(g.id);
        groups.push(g);
      });
    });
    uncategorizedGroups.forEach((g) => {
      if (seen.has(g.id)) return;
      seen.add(g.id);
      groups.push(g);
    });
    return groups;
  }, [displaySections, uncategorizedGroups]);

  const hasSelectorItems = displaySections.length > 0 || uncategorizedGroups.length > 0;

  const emptySelectorMessage = demoMode
    ? 'Your classes will appear here once you add them in Settings → My classes.'
    : 'No classes in this list yet. Add them in Settings → My classes.';

  // If current class is not under a key stage (or not allowed), switch to the first assigned one.
  useEffect(() => {
    if (selectableYearGroups.length === 0) return;
    const currentInList = selectableYearGroups.some(
      (g) => g.id === currentSheetInfo.sheet || g.name === currentSheetInfo.display,
    );
    if (!currentInList) {
      const first = selectableYearGroups[0];
      setCurrentSheetInfo({ sheet: first.id, display: first.name, eyfs: `${first.id} Statements` });
    }
  }, [selectableYearGroups, currentSheetInfo.sheet, currentSheetInfo.display, setCurrentSheetInfo]);

  const currentSection = React.useMemo(() => {
    return (
      displaySections.find((section) =>
        section.groups.some(
          (g) => g.id === currentSheetInfo.sheet || g.name === currentSheetInfo.display,
        ),
      ) ?? null
    );
  }, [displaySections, currentSheetInfo.sheet, currentSheetInfo.display]);

  const classSelectorLabel = currentSection
    ? `${currentSection.label} · ${currentSheetInfo.display || currentSheetInfo.sheet}`
    : currentSheetInfo.display || currentSheetInfo.sheet;

  const selectYearGroup = (group: { id: string; name: string }) => {
    setCurrentSheetInfo({ sheet: group.id, display: group.name, eyfs: `${group.id} Statements` });
    setYearGroupDropdownOpen(false);
    // Only switch All → one when the user explicitly picks a class from the menu
    // while already viewing the planner in one-class mode. Never force a switch
    // silently when navigating tabs or when All classes is the intentional view.
    if (onPlannerTab && !allClassPlannerView) {
      window.dispatchEvent(new CustomEvent('ccd:planner-focus-request', { detail: { mode: 'one' } }));
    }
  };

  const openYearGroupDropdown = () => {
    setYearGroupDropdownOpen((prev) => {
      const next = !prev;
      if (next && currentSection) {
        setYearGroupSectionsExpanded((expanded) => {
          if (expanded.has(currentSection.id)) return expanded;
          const copy = new Set(expanded);
          copy.add(currentSection.id);
          return copy;
        });
      }
      return next;
    });
  };

  const toggleSectionExpanded = (sectionId: string) => {
    setYearGroupSectionsExpanded(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  // Keep header label in sync when a class is renamed in Settings.
  // Depend on stable primitives (sheet id + current display) so this effect doesn't
  // re-run on every unrelated currentSheetInfo identity change.
  useEffect(() => {
    const matchById = yearGroupsForSelector.find(g => g.id === currentSheetInfo.sheet);
    if (!matchById) return;
    if (currentSheetInfo.display !== matchById.name) {
      setCurrentSheetInfo({
        sheet: matchById.id,
        display: matchById.name,
        eyfs: `${matchById.id} Statements`,
      });
    }
  }, [yearGroupsForSelector, currentSheetInfo.sheet, currentSheetInfo.display, setCurrentSheetInfo]);

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
    return undefined;
  }, [yearGroupDropdownOpen]);

  useEffect(() => {
    if (mobileMenuOpen && currentSection) {
      setYearGroupSectionsExpanded((expanded) => {
        if (expanded.has(currentSection.id)) return expanded;
        const copy = new Set(expanded);
        copy.add(currentSection.id);
        return copy;
      });
    }
  }, [mobileMenuOpen, currentSection]);

  // Document title is always CCDesigner (never the long legacy product name).
  const productName = 'CCDesigner';
  useEffect(() => {
    document.title = productName;
    return () => {
      document.title = 'CCDesigner';
    };
  }, [productName]);

  return (
    <>
      <header
        className={`ccd-app-header bg-white fixed left-0 right-0 z-50 ${shouldShowPreviewBanner() ? 'top-[var(--preview-banner-height,0px)]' : 'top-0'}`}
        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}
      >
        <div className="mx-auto w-full max-w-none px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Brand hidden on desktop when Studio Score sidebar owns branding */}
            <div className="ccd-studio-brand-slot flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 md:flex-none">
              <LogoSVG size="xs-sm" showText letters={settings.branding?.logoLetters} className="flex-shrink-0 md:hidden max-w-[140px]" />
              <div className="min-w-0 flex items-center space-x-2 md:hidden">
                {isViewOnly && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-md border border-yellow-200">
                    View Only
                  </span>
                )}
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2 flex-shrink-0">
              {/* Persistent class context chip (C1) — every tab */}
              {showYearGroupSelector && (
              <div className="relative min-w-0 flex items-center gap-2" ref={yearGroupDropdownRef} data-walkthrough="year-group-selector">
                <button
                  type="button"
                  onClick={() => {
                    // Open the menu only — do not silently leave All classes.
                    openYearGroupDropdown();
                  }}
                  className="bg-white border border-[#E2E0EF] text-[#1F1B4D] text-xs lg:text-sm rounded-xl focus:border-[#4338E8] focus:ring-2 focus:ring-[#4338E8]/20 focus:outline-none px-3 py-1.5 lg:py-2 pr-8 flex items-center justify-between gap-2 min-w-[140px] lg:min-w-[220px] max-w-[320px] hover:border-[#bcb7f4] transition-colors"
                  title={allClassPlannerView ? 'All classes · Week overview' : classSelectorLabel}
                  aria-label={allClassPlannerView ? 'All classes · Week overview' : `Class: ${classSelectorLabel}`}
                >
                  <span className="truncate">
                    {allClassPlannerView ? (
                      <>
                        <span className="font-semibold text-[#4338E8]">All classes</span>
                        <span className="text-[#77738F]"> · </span>
                        <span>Week overview</span>
                      </>
                    ) : currentSection ? (
                      <>
                        <span className="font-semibold text-[#4338E8]">{currentSection.label}</span>
                        <span className="text-[#77738F]"> · </span>
                        <span>{currentSheetInfo.display || currentSheetInfo.sheet}</span>
                      </>
                    ) : (
                      currentSheetInfo.display || currentSheetInfo.sheet
                    )}
                  </span>
                  <ChevronDown className={`h-4 w-4 flex-shrink-0 text-gray-500 transition-transform ${yearGroupDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                <span
                  className={`hidden lg:inline-flex shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                    allClassPlannerView
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-[#E9E6FF] text-[#4338E8]'
                  }`}
                >
                  {allClassPlannerView ? 'All-class view' : 'Class context'}
                </span>
                {yearGroupDropdownOpen && hasSelectorItems && (
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
                                  className={`w-full flex items-center gap-2 px-3 py-2 pl-8 text-left text-sm hover:bg-[#E9E6FF] ${currentSheetInfo.sheet === group.id ? 'bg-[#E9E6FF] text-[#1F1B4D] font-medium' : 'text-gray-700'}`}
                                >
                                  {currentSheetInfo.sheet === group.id && <Check className="h-4 w-4 flex-shrink-0 text-[#4338E8]" />}
                                  <span className={currentSheetInfo.sheet === group.id ? 'font-medium' : ''}>{group.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {uncategorizedGroups.length > 0 && (
                      <div className={displaySections.length > 0 ? 'border-t border-gray-100 pt-1' : ''}>
                        {uncategorizedGroups.map((group) => (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => selectYearGroup(group)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#E9E6FF] ${currentSheetInfo.sheet === group.id ? 'bg-[#E9E6FF] text-[#1F1B4D] font-medium' : 'text-gray-700'}`}
                          >
                            {currentSheetInfo.sheet === group.id && <Check className="h-4 w-4 flex-shrink-0 text-[#4338E8]" />}
                            <span className={currentSheetInfo.sheet === group.id ? 'font-medium' : ''}>{group.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {yearGroupDropdownOpen && !hasSelectorItems && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 text-sm text-gray-500">
                    {emptySelectorMessage}
                  </div>
                )}
              </div>
              )}

              {/* Install App Button */}
              {canInstall && !isInstalled && (
                <button
                  onClick={async () => {
                    // Automatically trigger installation - browser will handle the prompt
                    await install();
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 lg:px-4 lg:py-2 text-[#4338E8] hover:text-[#3529d1] hover:bg-[#E9E6FF] rounded-lg transition-colors duration-200 flex-shrink-0 border border-[#E2E0EF]"
                  title="Install this app to your device for quick access and offline use"
                >
                  <Download className="h-4 w-4 lg:h-5 lg:w-5" />
                  <span className="hidden lg:inline text-sm font-medium">Install</span>
                </button>
              )}

              <a
                href="/forum"
                className="p-1.5 lg:p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex-shrink-0"
                title="Community Forum"
                aria-label="Open community forum"
                data-walkthrough="forum"
              >
                <MessageSquare className="h-4 w-4 lg:h-5 lg:w-5" />
              </a>

              {/* Help / Settings live in the left sidebar (Help & community + bottom cog). */}

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-1.5 lg:p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50 flex-shrink-0"
                title="Refresh Data"
              >
                <RefreshCw className={`h-4 w-4 lg:h-5 lg:w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* Account menu — real profile name/initials; never "Demo Visitor" */}
              <AccountMenu compact />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden inline-flex min-h-[44px] min-w-[44px] items-center justify-center p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex-shrink-0"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="space-y-4">
                {/* Year Group Selector Mobile — persistent on every tab (C1) */}
                {showYearGroupSelector && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {allClassPlannerView ? 'Class context (currently all classes)' : 'Select class'}
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
                                  className={`w-full flex items-center gap-2 px-3 py-2 pl-8 text-left text-sm ${currentSheetInfo.sheet === group.id ? 'bg-[#E9E6FF] text-[#1F1B4D] font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                                >
                                  {currentSheetInfo.sheet === group.id && <Check className="h-4 w-4 flex-shrink-0 text-[#4338E8]" />}
                                  {group.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {uncategorizedGroups.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => { selectYearGroup(group); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm bg-white border-b border-gray-100 last:border-b-0 ${currentSheetInfo.sheet === group.id ? 'bg-[#E9E6FF] text-[#1F1B4D] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        {currentSheetInfo.sheet === group.id && <Check className="h-4 w-4 flex-shrink-0 text-[#4338E8]" />}
                        {group.name}
                      </button>
                    ))}
                    {!hasSelectorItems && (
                      <p className="px-3 py-2 text-sm text-gray-500">{emptySelectorMessage}</p>
                    )}
                  </div>
                </div>
                )}

                {/* Account + quick actions (mobile) */}
                <div className="flex items-center justify-between gap-2 pt-4 border-t border-gray-200">
                  <AccountMenu compact={false} onNavigate={() => setMobileMenuOpen(false)} />
                  <div className="flex space-x-2 flex-shrink-0">
                    {canInstall && !isInstalled && (
                      <button
                        onClick={async () => {
                          const installed = await install();
                          if (!installed) {
                            alert('To install this app:\n\nDesktop: Look for the install icon (⊕) in your browser\'s address bar\n\niOS: Tap Share → Add to Home Screen\n\nAndroid: Tap Menu → Install app');
                          }
                        }}
                        className="flex items-center space-x-2 px-3 py-2 text-[#4338E8] hover:text-[#3529d1] hover:bg-[#E9E6FF] rounded-lg transition-colors duration-200 border border-[#E2E0EF]"
                        title="Install this app to your device"
                      >
                        <Download className="h-5 w-5" />
                        <span className="text-sm font-medium">Install</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        navigateToHelp();
                        setMobileMenuOpen(false);
                      }}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                      aria-label="Open help"
                    >
                      <HelpCircle className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleRefresh}
                      disabled={loading}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Walkthrough Guide */}
      <WalkthroughGuide
        isOpen={showWalkthrough}
        onClose={() => {
          setShowWalkthrough(false);
          try {
            if (window.location.pathname.replace(/\/+$/, '') === '/walkthrough') {
              window.history.pushState({}, '', '/planner');
            }
          } catch {
            /* ignore */
          }
        }}
      />

    </>
  );

  // Navigation between lessons
  function handleRefresh() {
    refreshData();
  }
}