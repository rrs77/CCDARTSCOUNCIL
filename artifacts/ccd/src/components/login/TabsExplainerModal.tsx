import { useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  Edit3,
  FolderOpen,
  Handshake,
  Mail,
  Tag,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  TABS_EXPLAINER_CTA,
  TABS_EXPLAINER_INTRO,
  TABS_EXPLAINER_ITEMS,
  TABS_EXPLAINER_TITLE,
  type TabsExplainerTabId,
} from './prototypeCopy';

const TAB_ICONS: Record<TabsExplainerTabId, LucideIcon> = {
  'unit-viewer': BookOpen,
  'lesson-library': FolderOpen,
  'lesson-builder': Edit3,
  'activity-library': Tag,
  calendar: Calendar,
  'our-partners': Handshake,
  'contact-us': Mail,
};

interface TabsExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional: switch Dashboard to the chosen tab after dismiss. */
  onOpenTab?: (tabId: TabsExplainerTabId) => void;
}

export function TabsExplainerModal({
  isOpen,
  onClose,
  onOpenTab,
}: TabsExplainerModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const openTab = (tabId: TabsExplainerTabId) => {
    onClose();
    onOpenTab?.(tabId);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tabs-explainer-title"
    >
      <div
        className="w-full max-w-lg max-h-[min(90vh,40rem)] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xl animate-scale-in sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2
              id="tabs-explainer-title"
              className="text-xl font-semibold tracking-tight text-[#002D24]"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              {TABS_EXPLAINER_TITLE}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
              {TABS_EXPLAINER_INTRO}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
          {TABS_EXPLAINER_ITEMS.map((item) => {
            const Icon = TAB_ICONS[item.id];
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => openTab(item.id)}
                  className="flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-[#F3F6F3] focus-visible:bg-[#F3F6F3] focus-visible:outline-none sm:px-4"
                >
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F0EA] text-[#002D24]"
                    aria-hidden
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[#002D24]">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-gray-600 sm:text-sm">
                      {item.description}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95"
            style={{ backgroundColor: '#002D24' }}
          >
            {TABS_EXPLAINER_CTA}
          </button>
        </div>
      </div>
    </div>
  );
}
