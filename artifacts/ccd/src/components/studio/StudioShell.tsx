import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  Edit3,
  Globe2,
  Grid3X3,
  MoreHorizontal,
} from 'lucide-react';

export type StudioNavId =
  | 'our-partners'
  | 'unit-viewer'
  | 'lesson-builder'
  | 'activity-library'
  | 'curriculum'
  | 'more'
  | 'lesson-library'
  | 'contact-us';

const PRIMARY: { id: StudioNavId; label: string; short: string; icon: React.ReactNode; dataTab: string }[] = [
  { id: 'unit-viewer', label: 'Planner', short: 'Planner', icon: <Calendar className="h-[17px] w-[17px]" />, dataTab: 'unit-viewer' },
  { id: 'curriculum', label: 'Curriculum & Units', short: 'Units', icon: <BookOpen className="h-[17px] w-[17px]" />, dataTab: 'curriculum' },
  { id: 'lesson-builder', label: 'Lesson Builder', short: 'Builder', icon: <Edit3 className="h-[17px] w-[17px]" />, dataTab: 'lesson-builder' },
  { id: 'activity-library', label: 'Activity Library', short: 'Activities', icon: <Grid3X3 className="h-[17px] w-[17px]" />, dataTab: 'activity-library' },
  { id: 'our-partners', label: 'Partner Hubs', short: 'Hubs', icon: <Globe2 className="h-[17px] w-[17px]" />, dataTab: 'our-partners' },
];

interface StudioShellProps {
  active: StudioNavId;
  onNavigate: (id: StudioNavId) => void;
  children: React.ReactNode;
  /** Hub surfaces keep forest/teal padding */
  hubsMode?: boolean;
  /** Slim class/settings bar from Header */
  topBar?: React.ReactNode;
}

export function StudioShell({ active, onNavigate, children, hubsMode, topBar }: StudioShellProps) {
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
    active === 'lesson-library' || active === 'contact-us' || active === 'more' || active === 'curriculum'
      ? active === 'curriculum'
        ? 'curriculum'
        : 'more'
      : active;

  return (
    <div className={`ccd-studio-app ${collapsed ? 'is-collapsed' : ''}`}>
      <aside className="ccd-studio-sidebar" aria-label="Main navigation">
        <div className="ccd-studio-brand">
          {collapsed ? (
            <img
              src="/login/ccd-mark.png?v=logo-5"
              alt="designer"
              width={28}
              height={28}
              className="ccd-studio-brand-mark"
              decoding="async"
            />
          ) : (
            <span className="ccd-studio-brand-logo" role="img" aria-label="designer">
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

        <nav className="ccd-studio-nav">
          <div className="ccd-studio-section">Connect &amp; create</div>
          {PRIMARY.map((item) => (
            <button
              key={item.id}
              type="button"
              data-tab={item.dataTab}
              className={`ccd-studio-nav-item ${active === item.id ? 'is-active' : ''}`}
              aria-current={active === item.id ? 'page' : undefined}
              onClick={() => onNavigate(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <div className="ccd-studio-section" style={{ marginTop: 12 }}>
            Your tools
          </div>
          <button
            type="button"
            data-tab="more"
            className={`ccd-studio-nav-item ${active === 'more' || active === 'lesson-library' || active === 'contact-us' ? 'is-active' : ''}`}
            aria-current={active === 'more' || active === 'lesson-library' || active === 'contact-us' ? 'page' : undefined}
            onClick={() => onNavigate('more')}
          >
            <MoreHorizontal className="h-[17px] w-[17px]" />
            <span>More tools</span>
          </button>
        </nav>

        <div className="ccd-studio-sidebar-foot">
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
        {topBar}
        <div className={`ccd-studio-workspace-inner ${hubsMode ? 'hubs-bridge' : ''}`}>{children}</div>
      </div>

      <nav className="ccd-studio-mobile-nav" aria-label="Mobile navigation">
        {PRIMARY.filter((p) => p.id !== 'curriculum').map((item) => (
          <button
            key={item.id}
            type="button"
            data-tab={item.dataTab}
            className={mobileActive === item.id ? 'is-active' : ''}
            onClick={() => onNavigate(item.id)}
          >
            {item.icon}
            <span>{item.short}</span>
          </button>
        ))}
        <button
          type="button"
          className={mobileActive === 'more' || mobileActive === 'curriculum' ? 'is-active' : ''}
          onClick={() => onNavigate('more')}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
