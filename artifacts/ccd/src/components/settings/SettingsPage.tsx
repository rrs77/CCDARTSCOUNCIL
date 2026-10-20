import React, { useEffect, useMemo, useState } from 'react';
import { Search, Settings } from 'lucide-react';
import { SettingsContent } from './SettingsContent';
import {
  DEFAULT_SETTINGS_SECTION,
  SETTINGS_SECTIONS,
  type SchoolToolsPanelId,
  type SettingsSectionId,
} from './settingsSections';
import {
  resolveSettingsSectionFromLocation,
  sectionFromLegacyTab,
  syncSettingsUrl,
} from './routes';

export interface SettingsAccess {
  showDownloads: boolean;
  /** Top-level Users section (admins / school leads / demo) */
  showUsers: boolean;
  showSchoolTools: boolean;
  /** Which school-tool panels this user can open */
  schoolPanels: SchoolToolsPanelId[];
}

interface SettingsPageProps {
  access: SettingsAccess;
  /** Optional initial section (from Dashboard deep-link) */
  initialSection?: SettingsSectionId;
  initialSchoolPanel?: SchoolToolsPanelId;
}

function readSchoolPanelFromUrl(): SchoolToolsPanelId | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const panel = params.get('panel');
    // Legacy /settings/school?panel=users → top-level Users
    if (panel === 'users' && typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/settings/users');
      return null;
    }
    if (
      panel === 'hub-admin' ||
      panel === 'hub-content' ||
      panel === 'branding' ||
      panel === 'manage-packs' ||
      panel === 'system-categories' ||
      panel === 'data'
    ) {
      return panel;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function syncSchoolPanelQuery(panel: SchoolToolsPanelId | null): void {
  if (typeof window === 'undefined') return;
  if (!window.location.pathname.startsWith('/settings/school')) return;
  const url = new URL(window.location.href);
  if (panel) url.searchParams.set('panel', panel);
  else url.searchParams.delete('panel');
  const next = `${url.pathname}${url.search}`;
  const current = `${window.location.pathname}${window.location.search}`;
  if (next !== current) window.history.replaceState({}, '', next);
}

export function SettingsPage({ access, initialSection, initialSchoolPanel }: SettingsPageProps) {
  const [section, setSection] = useState<SettingsSectionId>(() => {
    return (
      initialSection ||
      resolveSettingsSectionFromLocation() ||
      DEFAULT_SETTINGS_SECTION
    );
  });
  const [schoolPanel, setSchoolPanel] = useState<SchoolToolsPanelId | null>(() => {
    return initialSchoolPanel || readSchoolPanelFromUrl();
  });
  const [navQuery, setNavQuery] = useState('');

  const visibleSections = useMemo(() => {
    return SETTINGS_SECTIONS.filter((s) => {
      if (s.requires === 'downloads') return access.showDownloads;
      if (s.requires === 'users') return access.showUsers;
      if (s.requires === 'school') return access.showSchoolTools;
      return true;
    });
  }, [access.showDownloads, access.showUsers, access.showSchoolTools]);

  const filteredSections = useMemo(() => {
    const q = navQuery.trim().toLowerCase();
    if (!q) return visibleSections;
    return visibleSections.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.helper.toLowerCase().includes(q) ||
        s.keywords.some((k) => k.includes(q)),
    );
  }, [visibleSections, navQuery]);

  // Keep section valid when permissions change
  useEffect(() => {
    if (!visibleSections.some((s) => s.id === section)) {
      const fallback = visibleSections[0]?.id ?? DEFAULT_SETTINGS_SECTION;
      setSection(fallback);
      syncSettingsUrl(fallback);
    }
  }, [visibleSections, section]);

  // URL ↔ section sync (back/forward)
  useEffect(() => {
    const onPop = () => {
      const next = resolveSettingsSectionFromLocation();
      if (next) setSection(next);
      setSchoolPanel(readSchoolPanelFromUrl());
    };
    const onSectionEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ section?: string }>).detail;
      const mapped = sectionFromLegacyTab(detail?.section);
      if (mapped) {
        setSection(mapped);
        syncSettingsUrl(mapped);
        if (mapped === 'school') {
          const panel = detail?.section as SchoolToolsPanelId | undefined;
          if (
            panel === 'hub-admin' ||
            panel === 'hub-content' ||
            panel === 'branding' ||
            panel === 'manage-packs' ||
            panel === 'system-categories' ||
            panel === 'data'
          ) {
            setSchoolPanel(panel);
            syncSchoolPanelQuery(panel);
          }
        }
      }
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('ccd:settings-section', onSectionEvent);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('ccd:settings-section', onSectionEvent);
    };
  }, []);

  // Consume legacy sessionStorage deep-link once
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem('ccd-open-settings-tab');
      if (!pending) return;
      sessionStorage.removeItem('ccd-open-settings-tab');
      const mapped = sectionFromLegacyTab(pending);
      if (mapped) {
        setSection(mapped);
        syncSettingsUrl(mapped);
        if (
          pending === 'hub-admin' ||
          pending === 'hub-content' ||
          pending === 'branding' ||
          pending === 'data' ||
          pending === 'manage-packs' ||
          pending === 'system-categories'
        ) {
          setSchoolPanel(pending as SchoolToolsPanelId);
          syncSchoolPanelQuery(pending as SchoolToolsPanelId);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const selectSection = (id: SettingsSectionId) => {
    setSection(id);
    syncSettingsUrl(id);
    if (id !== 'school') {
      setSchoolPanel(null);
    } else if (!schoolPanel && access.schoolPanels[0]) {
      setSchoolPanel(access.schoolPanels[0]);
      syncSchoolPanelQuery(access.schoolPanels[0]);
    }
  };

  const selectSchoolPanel = (panel: SchoolToolsPanelId) => {
    setSchoolPanel(panel);
    syncSchoolPanelQuery(panel);
  };

  const activeMeta = SETTINGS_SECTIONS.find((s) => s.id === section);

  return (
    <div className="ss-settings-page">
      <header className="ss-settings-page-head">
        <div className="ss-settings-page-head-icon" aria-hidden>
          <Settings className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="ccd-studio-eyebrow mb-0.5">
            WORKSPACE / <span>SETTINGS</span>
          </p>
          <h1 className="ss-settings-page-title">Settings</h1>
          <p className="ss-settings-page-sub">
            Set up your classes and folders once — everything else in the app follows.
          </p>
        </div>
      </header>

      <div className="ss-settings-layout">
        <aside className="ss-settings-nav" aria-label="Settings sections">
          {visibleSections.length > 5 && (
            <div className="ss-settings-nav-search">
              <Search className="h-3.5 w-3.5 text-[#5C5878]" aria-hidden />
              <input
                type="search"
                value={navQuery}
                onChange={(e) => setNavQuery(e.target.value)}
                placeholder="Find a setting…"
                aria-label="Search settings"
              />
            </div>
          )}
          <nav className="ss-settings-nav-list">
            {filteredSections.length === 0 ? (
              <p className="px-3 py-2 text-sm text-[#5C5878]">No sections match “{navQuery}”.</p>
            ) : (
              filteredSections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`ss-settings-nav-item ${section === s.id ? 'is-active' : ''}`}
                  aria-current={section === s.id ? 'page' : undefined}
                  onClick={() => selectSection(s.id)}
                >
                  <span className="ss-settings-nav-label">{s.label}</span>
                  <span className="ss-settings-nav-hint">{s.helper}</span>
                </button>
              ))
            )}
          </nav>
        </aside>

        <div className="ss-settings-main">
          {activeMeta && (
            <div className="ss-settings-section-intro">
              <h2 className="ss-settings-section-title">{activeMeta.title}</h2>
              <p className="ss-settings-section-helper">{activeMeta.helper}</p>
            </div>
          )}
          <SettingsContent
            section={section}
            schoolPanel={schoolPanel}
            schoolPanels={access.schoolPanels}
            onSchoolPanelChange={selectSchoolPanel}
          />
        </div>
      </div>
    </div>
  );
}
