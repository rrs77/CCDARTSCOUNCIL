import React, { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  X,
  LogIn,
  Users,
  Folder,
  Music,
  Calendar,
  Target,
  Package,
  Settings as SettingsIcon,
  Lightbulb,
} from 'lucide-react';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ManualSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  steps: string[];
}

const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: LogIn,
    steps: [
      'Sign in with your email and password. Tick "Stay signed in" to remain logged in on this device.',
      'No account yet? Use the "Preview Full App" button on the login screen to explore with sample data — no sign-up required.',
      'Forgot your password? Click "Forgot password" on the login screen and follow the reset email.',
      'Once signed in, use the top navigation to move between Activity Library, Lessons, Units, and Settings.',
    ],
  },
  {
    id: 'year-groups',
    title: 'Year Groups & Sections',
    icon: Users,
    steps: [
      'Open Settings (cog icon) → Year Groups tab to see all your classes.',
      'To add a class: enter an ID, display name and colour, then click Add Year Group.',
      'To edit or delete a class: use the pencil and trash icons on its row.',
      'To group classes into sections (EYFS, KS1, KS2, ...) use the dropdown on each row, or drag the row into a different section.',
      'Use "Add section" to create a new section, and the pencil icon on a section to rename it.',
      'Section assignments are saved automatically and remembered across devices.',
    ],
  },
  {
    id: 'categories',
    title: 'Activity Categories',
    icon: Folder,
    steps: [
      'Categories (e.g. "Welcome", "Kodaly Songs") control which activities appear in the sidebar for each class.',
      'In Settings → Categories, click a category, then tick the year groups that should see it.',
      'Tip: use Bulk Assignment to assign many categories to many year groups in two clicks.',
      'A category with no year groups assigned will not appear anywhere in the sidebar.',
    ],
  },
  {
    id: 'activities',
    title: 'Activities',
    icon: Music,
    steps: [
      'In the Activity Library, choose a class from the top bar to filter activities for that year group.',
      'Use the search box, category dropdown, and topic chips to narrow the list. The active topic chip is shown in bold.',
      'Click any activity to see details, resources, and standards.',
      'Click the pencil icon to edit. The dropdown at the top of the edit view pre-ticks all classes already assigned — toggle classes to add or remove them.',
      'Use the red Delete button in the edit view to permanently remove an activity (with confirmation).',
      'Click Save Changes to persist edits across all lessons that use this activity.',
    ],
  },
  {
    id: 'lessons',
    title: 'Lessons & Half-Terms',
    icon: Calendar,
    steps: [
      'Open the Lessons view to plan a sequence of activities for a class.',
      'Lessons are organised by half-term (A1, A2, SP1, SP2, SM1, SM2) within an academic year.',
      'Add activities to a lesson by dragging from the Activity Library, or by clicking an activity and choosing "Add to Lesson".',
      'Edit an activity inside a lesson without affecting the master activity by using the lesson builder context — your changes apply to this lesson only.',
      'Use the duration field to set how long each activity should take.',
    ],
  },
  {
    id: 'units',
    title: 'Units',
    icon: Package,
    steps: [
      'Units group related lessons together (for example, "Voice Drama" or "Movement").',
      'Open the Unit Viewer to see all lessons under a unit and reorder them.',
      'Assign an activity to a unit by setting its "Unit" field in the activity edit view.',
    ],
  },
  {
    id: 'custom-objectives',
    title: 'Custom Objectives',
    icon: Target,
    steps: [
      'Open Settings → Admin (or "Custom Objectives" tab) to manage learning objectives per class.',
      'Objectives are listed under the same section headings (EYFS, KS1, KS2, ...) that you configured in Year Groups.',
      'Click a class to expand it and edit its objectives.',
      'Objectives can be referenced when planning lessons and exported with lesson PDFs.',
    ],
  },
  {
    id: 'settings',
    title: 'Settings & Branding',
    icon: SettingsIcon,
    steps: [
      'Open Settings (cog icon) to manage Year Groups, Categories, Custom Objectives, Resource Packs and more.',
      'Under General/Branding you can change the login title, subtitle, logo letters and button colour.',
      'Use the Refresh button on Manage Year Groups to pull the latest year-group data from the server if you suspect data is out of sync.',
      'All saves happen automatically — there is no separate "Save" step for most settings.',
    ],
  },
  {
    id: 'tips',
    title: 'Tips & Troubleshooting',
    icon: Lightbulb,
    steps: [
      "Can't see activities? Make sure the current class has categories assigned (Settings → Categories) — activities are filtered by enabled categories.",
      'Categories disappearing for a class? The class name in Year Groups must match the names used in your category assignments. The app maps short codes (LKG, UKG, Reception) to the matching long names automatically.',
      'Category year-group links (Settings → Categories) are saved to your account in the cloud, so they follow you across devices when you are signed in.',
      "Console errors? Open DevTools → Console and look for messages prefixed with ❌ — that's usually the quickest path to a fix.",
      'Working offline? Once installed as a PWA the app caches recent data. Sign in at least once while online to populate the cache.',
    ],
  },
];

export function UserManualModal({ isOpen, onClose }: UserManualModalProps) {
  const [openSectionId, setOpenSectionId] = useState<string | null>(MANUAL_SECTIONS[0]?.id ?? null);

  if (!isOpen) return null;

  const toggleSection = (id: string) => {
    setOpenSectionId((prev) => (prev === id ? null : id));
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="User Manual"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">User Manual</h2>
              <p className="text-xs text-gray-500">Step-by-step guide to using the app</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close user manual"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sections */}
        <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
          {MANUAL_SECTIONS.map((section) => {
            const isOpenSection = openSectionId === section.id;
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                className="rounded-xl border border-gray-200 bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                  aria-expanded={isOpenSection}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-semibold text-gray-900">{section.title}</span>
                  </div>
                  {isOpenSection ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                {isOpenSection && (
                  <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3">
                    <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-gray-700">
                      {section.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3">
          <p className="text-xs text-gray-500">
            Still stuck? Contact{' '}
            <a
              href="mailto:support@rhythmstix.co.uk"
              className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              support@rhythmstix.co.uk
            </a>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserManualModal;
