import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Calendar,
  CalendarDays,
  ChevronLeft,
  Clapperboard,
  Compass,
  CornerDownRight,
  FolderOpen,
  Globe2,
  Grid3X3,
  HelpCircle,
  Mail,
  MessageSquare,
  Settings,
  Sparkles,
} from 'lucide-react';

export type StudioNavId =
  | 'our-partners'
  | 'unit-viewer'
  | 'lesson-builder' // legacy; redirects to lesson-library
  | 'activity-library'
  | 'curriculum'
  | 'more' // legacy; redirects away from More tools page
  | 'lesson-library'
  | 'contact-us'
  | 'lesson-viewer'
  | 'bolt-ons'
  | 'assessify'
  | 'perifeedback'
  | 'settings'
  | 'help';

/** Non-tab sidebar actions (open overlay / external / event). */
export type StudioToolAction = 'class-calendar' | 'forum' | 'walkthrough';

const PRIMARY: { id: StudioNavId; label: string; short: string; icon: React.ReactNode; dataTab: string }[] = [
  { id: 'unit-viewer', label: 'Planner', short: 'Planner', icon: <Calendar className="h-[17px] w-[17px]" />, dataTab: 'unit-viewer' },
  { id: 'curriculum', label: 'Half-terms', short: 'Terms', icon: <BookOpen className="h-[17px] w-[17px]" />, dataTab: 'curriculum' },
  { id: 'lesson-library', label: 'Lessons', short: 'Lessons', icon: <FolderOpen className="h-[17px] w-[17px]" />, dataTab: 'lesson-library' },
  { id: 'activity-library', label: 'Activity Library', short: 'Activities', icon: <Grid3X3 className="h-[17px] w-[17px]" />, dataTab: 'activity-library' },
  { id: 'lesson-viewer', label: 'Slides', short: 'Slides', icon: <Clapperboard className="h-[17px] w-[17px]" />, dataTab: 'lesson-viewer' },
  { id: 'our-partners', label: 'Partner Hubs', short: 'Hubs', icon: <Globe2 className="h-[17px] w-[17px]" />, dataTab: 'our-partners' },
];

const BOLT_ON_SUBLINKS: { id: StudioNavId; label: string; dataTab: string }[] = [
  { id: 'assessify', label: 'Assessify', dataTab: 'assessify' },
  { id: 'perifeedback', label: 'PeriFeedback', dataTab: 'perifeedback' },
];

/** Help / community — grouped lower in the column. */
const SUPPORT: {
  kind: 'nav' | 'action';
  id: string;
  label: string;
  icon: React.ReactNode;
  navId?: StudioNavId;
  action?: StudioToolAction;
}[] = [
  {
    kind: 'action',
    id: 'forum',
    label: 'Community forum',
    icon: <MessageSquare className="h-[17px] w-[17px]" />,
    action: 'forum',
  },
  {
    kind: 'nav',
    id: 'help',
    label: 'Help guide',
    icon: <HelpCircle className="h-[17px] w-[17px]" />,
    navId: 'help',
  },
  {
    kind: 'action',
    id: 'walkthrough',
    label: 'Feature walkthrough',
    icon: <Compass className="h-[17px] w-[17px]" />,
    action: 'walkthrough',
  },
  {
    kind: 'nav',
    id: 'contact-us',
    label: 'Contact',
    icon: <Mail className="h-[17px] w-[17px]" />,
    navId: 'contact-us',
  },
];

const isBoltOnsNav = (id: StudioNavId) =>
  id === 'bolt-ons' || id === 'assessify' || id === 'perifeedback';

interface StudioShellProps {
  active: StudioNavId;
  onNavigate: (id: StudioNavId) => void;
  /** Class calendar / forum / walkthrough (not full tabs). */
  onToolAction?: (action: StudioToolAction) => void;
  children: React.ReactNode;
  /** Hub surfaces keep forest/teal padding */
  hubsMode?: boolean;
  /** Drop workspace max-width (Activity Library grid needs the full column) */
  wideCanvas?: boolean;
  /** Flush padding when a full-page editor (create/edit activity) owns the canvas */
  editorFlush?: boolean;
  /** Slim class/settings bar from Header */
  topBar?: React.ReactNode;
}

export function StudioShell({
  active,
  onNavigate,
  onToolAction,
  children,
  hubsMode,
  wideCanvas,
  editorFlush,
  topBar,
}: StudioShellProps) {
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add('ccd-studio');
    return () => {
      document.documentElement.classList.remove('ccd-studio');
      document.documentElement.classList.remove('ccd-studio-nav-collapsed');
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('ccd-studio-nav-collapsed', collapsed);
  }, [collapsed]);

  const mobileActive =
    active === 'contact-us' ||
    active === 'settings' ||
    active === 'help' ||
    isBoltOnsNav(active)
      ? 'settings'
      : active;

  const boltOnsOpen = isBoltOnsNav(active);

  const runTool = (action: StudioToolAction) => {
    onToolAction?.(action);
  };

  return (
    <div className={`ccd-studio-app ${collapsed ? 'is-collapsed' : ''}`}>
      <aside className="ccd-studio-sidebar" aria-label="Main navigation">
        <div className="ccd-studio-brand">
          {collapsed ? (
            <img
              src="/login/ccd-mark.png?v=logo-5"
              alt="CCDesigner"
              width={28}
              height={28}
              className="ccd-studio-brand-mark"
              decoding="async"
            />
          ) : (
            <span className="ccd-studio-brand-logo" role="img" aria-label="CCDesigner">
              <img
                src="/login/ccd-mark.png?v=logo-5"
                alt=""
                width={42}
                height={42}
                className="ccd-studio-brand-mark"
                decoding="async"
              />
              <span className="ccd-studio-brand-word" aria-hidden>
                designer
              </span>
            </span>
          )}
        </div>

        <nav className="ccd-studio-nav" aria-label="Workspace">
          <div className="ccd-studio-section">Connect &amp; create</div>
          {PRIMARY.map((item) => (
            <button
              key={item.id}
              type="button"
              data-tab={item.dataTab}
              className={`ccd-studio-nav-item ${active === item.id ? 'is-active' : ''}`}
              aria-current={active === item.id ? 'page' : undefined}
              aria-label={item.label}
              title={collapsed ? item.label : undefined}
              onClick={() => onNavigate(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}

          <button
            type="button"
            className="ccd-studio-nav-item"
            aria-label="Class calendar"
            title={collapsed ? 'Class calendar' : undefined}
            onClick={() => runTool('class-calendar')}
          >
            <CalendarDays className="h-[17px] w-[17px]" />
            <span>Class calendar</span>
          </button>

          <button
            type="button"
            data-tab="bolt-ons"
            className={`ccd-studio-nav-item ${boltOnsOpen ? 'is-active' : ''}`}
            aria-current={active === 'bolt-ons' ? 'page' : undefined}
            aria-expanded={boltOnsOpen}
            aria-label="Bolt-ons"
            title={collapsed ? 'Bolt-ons' : undefined}
            onClick={() => onNavigate('bolt-ons')}
          >
            <Sparkles className="h-[17px] w-[17px]" />
            <span>+ Bolt-ons</span>
            <span className="ccd-studio-nav-badge" aria-label="2 bolt-ons">
              2
            </span>
          </button>
          {boltOnsOpen && !collapsed ? (
            <div className="ccd-studio-subnav" role="group" aria-label="Bolt-ons products">
              {BOLT_ON_SUBLINKS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-tab={item.dataTab}
                  className={`ccd-studio-subnav-item ${active === item.id ? 'is-active' : ''}`}
                  aria-current={active === item.id ? 'page' : undefined}
                  onClick={() => onNavigate(item.id)}
                >
                  <CornerDownRight className="h-3.5 w-3.5 opacity-70" aria-hidden />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="ccd-studio-section" style={{ marginTop: 12 }}>
            Help &amp; community
          </div>
          {SUPPORT.map((item) => {
            if (item.kind === 'nav' && item.navId) {
              const navId = item.navId;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-tab={navId}
                  className={`ccd-studio-nav-item ${active === navId ? 'is-active' : ''}`}
                  aria-current={active === navId ? 'page' : undefined}
                  aria-label={item.label}
                  title={collapsed ? item.label : undefined}
                  onClick={() => onNavigate(navId)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            }
            return (
              <button
                key={item.id}
                type="button"
                className="ccd-studio-nav-item"
                aria-label={item.label}
                title={collapsed ? item.label : undefined}
                onClick={() => item.action && runTool(item.action)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="ccd-studio-sidebar-foot">
          <button
            type="button"
            data-tab="settings"
            data-walkthrough="settings"
            className={`ccd-studio-nav-item ${active === 'settings' ? 'is-active' : ''}`}
            aria-current={active === 'settings' ? 'page' : undefined}
            aria-label="Settings"
            title={collapsed ? 'Settings' : undefined}
            onClick={() => onNavigate('settings')}
          >
            <Settings className="h-[17px] w-[17px]" />
            <span>Settings</span>
          </button>
          <button
            type="button"
            className="ccd-studio-collapse"
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            <span>Collapse menu</span>
          </button>
        </div>
      </aside>

      <div className="ccd-studio-workspace">
        {topBar ? <div className="ccd-studio-topbar">{topBar}</div> : null}
        <div
          className={`ccd-studio-workspace-inner ${hubsMode ? 'hubs-bridge' : ''} ${wideCanvas ? 'wide-canvas' : ''} ${editorFlush ? 'editor-flush' : ''}`}
        >
          {children}
        </div>
      </div>

      <nav className="ccd-studio-mobile-nav" aria-label="Mobile navigation">
        {PRIMARY.filter((p) => p.id !== 'our-partners' && p.id !== 'curriculum').map((item) => (
          <button
            key={item.id}
            type="button"
            data-tab={item.dataTab}
            className={mobileActive === item.id ? 'is-active' : ''}
            aria-label={item.label}
            onClick={() => onNavigate(item.id)}
          >
            {item.icon}
            <span>{item.short}</span>
          </button>
        ))}
        <button
          type="button"
          className={mobileActive === 'settings' ? 'is-active' : ''}
          aria-label="Settings"
          onClick={() => onNavigate('settings')}
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
}
