import React from 'react';
import {
  BookOpen,
  CalendarCog,
  Clapperboard,
  FolderOpen,
  HelpCircle,
  Mail,
  MessageSquare,
  Settings,
  Sparkles,
} from 'lucide-react';
import type { StudioNavId } from './StudioShell';

const TOOLS: {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  action: 'tab' | 'settings' | 'forum' | 'help' | 'walkthrough';
  tab?: StudioNavId;
}[] = [
  {
    id: 'lessons',
    title: 'Lessons',
    desc: 'Saved lessons from Lesson Builder for the class in the header — also on the Lessons tab.',
    icon: <FolderOpen className="h-5 w-5" />,
    action: 'tab',
    tab: 'lesson-library',
  },
  {
    id: 'lesson-viewer',
    title: 'Lesson Viewer',
    desc: 'Interactive classroom player — Canva, YouTube, Slides, lyric videos and more.',
    icon: <Clapperboard className="h-5 w-5" />,
    action: 'tab',
    tab: 'lesson-viewer',
  },
  {
    id: 'curriculum',
    title: 'Half-terms',
    desc: 'Year map of half-terms for every class — open a cell to plan that term.',
    icon: <BookOpen className="h-5 w-5" />,
    action: 'tab',
    tab: 'curriculum',
  },
  {
    id: 'contact',
    title: 'Contact',
    desc: 'Existing contact and support flows.',
    icon: <Mail className="h-5 w-5" />,
    action: 'tab',
    tab: 'contact-us',
  },
  {
    id: 'settings',
    title: 'Settings',
    desc: 'Classes, activity folders per class, objectives and preferences.',
    icon: <Settings className="h-5 w-5" />,
    action: 'settings',
  },
  {
    id: 'timetable',
    title: 'Timetable builder',
    desc: 'Planner → Timetable builder — set weekly slots for the selected class.',
    icon: <CalendarCog className="h-5 w-5" />,
    action: 'tab',
    tab: 'unit-viewer',
  },
  {
    id: 'forum',
    title: 'Forum & support',
    desc: 'Teacher–provider conversation.',
    icon: <MessageSquare className="h-5 w-5" />,
    action: 'forum',
  },
  {
    id: 'help',
    title: 'Help guide',
    desc: 'How CCDesigner fits together.',
    icon: <HelpCircle className="h-5 w-5" />,
    action: 'help',
  },
  {
    id: 'walk',
    title: 'Feature walkthrough',
    desc: 'Guided tour of the main areas.',
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
        WORKSPACE / <span>ALL TOOLS</span>
      </p>
      <h1 className="ccd-studio-title">All your tools</h1>
      <p className="ccd-studio-sub">
        Everything stays available. The Activity Library still filters by the class selected in the header — change class there, or manage folder visibility in Settings.
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
