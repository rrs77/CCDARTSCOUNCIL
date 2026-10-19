import React from 'react';
import {
  Calendar,
  HelpCircle,
  Mail,
  MessageSquare,
  Settings,
  Sparkles,
} from 'lucide-react';
import type { StudioNavId } from './StudioShell';

/** C4: extras only — no Lessons / Slides / Half-terms / Timetable duplicates of the sidebar. */
const TOOLS: {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  action: 'tab' | 'settings' | 'forum' | 'help' | 'walkthrough' | 'class-calendar';
  tab?: StudioNavId;
}[] = [
  {
    id: 'settings',
    title: 'Settings',
    desc: 'My classes, activity folders, objectives and preferences.',
    icon: <Settings className="h-5 w-5" />,
    action: 'settings',
  },
  {
    id: 'class-calendar',
    title: 'Class calendar',
    desc: 'Events and key dates for the selected class.',
    icon: <Calendar className="h-5 w-5" />,
    action: 'class-calendar',
  },
  {
    id: 'forum',
    title: 'Community forum',
    desc: 'Teacher–provider conversation and support.',
    icon: <MessageSquare className="h-5 w-5" />,
    action: 'forum',
  },
  {
    id: 'contact',
    title: 'Contact',
    desc: 'Request access and get in touch.',
    icon: <Mail className="h-5 w-5" />,
    action: 'tab',
    tab: 'contact-us',
  },
  {
    id: 'help',
    title: 'Help guide',
    desc: 'How the main areas fit together.',
    icon: <HelpCircle className="h-5 w-5" />,
    action: 'help',
  },
  {
    id: 'walk',
    title: 'Feature walkthrough',
    desc: 'Guided tour of create and plan flows.',
    icon: <Sparkles className="h-5 w-5" />,
    action: 'walkthrough',
  },
];

interface Props {
  onNavigate: (id: StudioNavId) => void;
}

export function MoreToolsPanel({ onNavigate }: Props) {
  const run = (tool: (typeof TOOLS)[number]) => {
    if (tool.action === 'tab' && tool.tab) {
      onNavigate(tool.tab);
      return;
    }
    if (tool.action === 'class-calendar') {
      onNavigate('unit-viewer');
      window.setTimeout(() => window.dispatchEvent(new CustomEvent('ccd:open-class-calendar')), 0);
      return;
    }
    if (tool.action === 'settings') {
      try {
        sessionStorage.setItem('ccd-open-settings-tab', 'yeargroups');
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new CustomEvent('ccd:open-settings'));
      return;
    }
    if (tool.action === 'forum') {
      window.location.assign('/forum');
      return;
    }
    if (tool.action === 'help') {
      window.dispatchEvent(new CustomEvent('ccd:open-help'));
      return;
    }
    if (tool.action === 'walkthrough') {
      window.dispatchEvent(new CustomEvent('ccd:start-walkthrough'));
    }
  };

  return (
    <div>
      <p className="ccd-studio-eyebrow">
        YOUR TOOLS / <span>MORE</span>
      </p>
      <h1 className="ccd-studio-title">More tools</h1>
      <p className="ccd-studio-sub">
        Shortcuts for settings, calendar, help and community. Planning and lesson tools stay in the
        sidebar.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => run(tool)}
            className="ss-lesson-card min-h-[96px] text-left"
          >
            <span className="inline-flex items-center gap-2 text-[var(--ss-indigo)]">{tool.icon}</span>
            <strong>{tool.title}</strong>
            <span className="ss-desc">{tool.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
