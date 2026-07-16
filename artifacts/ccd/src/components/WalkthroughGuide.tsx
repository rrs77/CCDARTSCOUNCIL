import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Info,
  BookOpen,
  Calendar,
  Edit3,
  FolderOpen,
  Tag,
  Settings as SettingsIcon,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContextNew';

type Position = 'top' | 'bottom' | 'left' | 'right' | 'center';

interface WalkthroughStep {
  title: string;
  description: string;
  /**
   * CSS selector for the element to highlight. May be a comma-separated list
   * of fallback selectors — the first one that resolves to a visible element
   * wins. Use 'body' or omit (`'#__none__'`) for a centered modal step.
   */
  target: string;
  position: Position;
  icon: React.ReactNode;
}

interface WalkthroughGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOOLTIP_WIDTH = 400;
const TOOLTIP_HEIGHT_ESTIMATE = 240;
const HIGHLIGHT_PADDING = 8;

/**
 * Resolve a (possibly comma-separated) selector list to the first element
 * that is actually present and laid out in the DOM. Returns null if nothing
 * matches — the caller is responsible for skipping or centering the step.
 */
function resolveTarget(selectorList: string): HTMLElement | null {
  const selectors = selectorList.split(',').map((s) => s.trim()).filter(Boolean);
  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      // Skip elements with zero size — they're hidden / not rendered.
      if (rect.width === 0 && rect.height === 0) continue;
      return el;
    } catch {
      // Bad selector — try the next.
    }
  }
  return null;
}

export function WalkthroughGuide({ isOpen, onClose }: WalkthroughGuideProps) {
  const { settings } = useSettings();
  const productName = settings?.branding?.loginTitle || 'Creative Curriculum Designer';

  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [arrowSide, setArrowSide] = useState<'top' | 'bottom' | 'left' | 'right' | 'none'>('none');
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // Steps are intentionally tied to stable selectors that exist in the DOM:
  //   - tab triggers (`[data-tab="..."]`) live in Dashboard.tsx
  //   - header controls have explicit `[data-walkthrough="..."]` markers
  //   - `[data-help-button]` is the existing help/tour button
  // Any step whose target can't be resolved is skipped automatically rather
  // than silently breaking the flow.
  const steps: WalkthroughStep[] = useMemo(
    () => [
      {
        title: `Welcome to ${productName}`,
        description:
          "Let's take a quick tour of the app. We'll point out the key features so you can hit the ground running. Use Next / Back to move through the steps, or Skip to exit at any time.",
        target: 'body',
        position: 'center',
        icon: <Sparkles className="h-7 w-7 text-teal-500" />,
      },
      {
        title: 'Pick a Class',
        description:
          'Use this selector to switch between your year groups. The whole app — activities, lessons, units, and the calendar — updates to show the content for the selected class.',
        target: '[data-walkthrough="year-group-selector"]',
        position: 'bottom',
        icon: <Tag className="h-7 w-7 text-pink-500" />,
      },
      {
        title: 'Unit Viewer',
        description:
          'Browse units of work for the selected class. Open a unit to see its lessons, objectives, and how it sits across the school year.',
        target: '[data-tab="unit-viewer"]',
        position: 'bottom',
        icon: <BookOpen className="h-7 w-7 text-indigo-500" />,
      },
      {
        title: 'Lesson Library',
        description:
          'Every lesson you or your team has built lives here. Reuse, duplicate, edit, or assign lessons to the calendar.',
        target: '[data-tab="lesson-library"]',
        position: 'bottom',
        icon: <FolderOpen className="h-7 w-7 text-amber-500" />,
      },
      {
        title: 'Lesson Builder',
        description:
          'Build a new lesson by dragging activities in from the library. Re-order, edit, and save — your lesson then shows up in the Lesson Library and on the Calendar.',
        target: '[data-tab="lesson-builder"]',
        position: 'bottom',
        icon: <Edit3 className="h-7 w-7 text-teal-500" />,
      },
      {
        title: 'Activity Library',
        description:
          'All teaching activities for the selected class, grouped by category. Search, filter, drag activities into a lesson, or open one to see full details and resources.',
        target: '[data-tab="activity-library"]',
        position: 'bottom',
        icon: <Layers className="h-7 w-7 text-purple-500" />,
      },
      {
        title: 'Calendar',
        description:
          'Plan the year by dropping units or individual lessons onto specific dates. Switch between month, week, and day views to map out your teaching at a glance.',
        target: '[data-tab="calendar"]',
        position: 'bottom',
        icon: <Calendar className="h-7 w-7 text-cyan-500" />,
      },
      {
        title: 'Settings',
        description:
          'Manage year groups, categories, objectives, and branding from Settings. This is also where you tweak which categories appear for each class.',
        target: '[data-walkthrough="settings"]',
        position: 'left',
        icon: <SettingsIcon className="h-7 w-7 text-slate-500" />,
      },
      {
        title: 'Help & Restart Tour',
        description:
          'Click this button at any time to bring up help. You can also restart this tour from the same place whenever you need a refresher.',
        target: '[data-help-button]',
        position: 'left',
        icon: <HelpCircle className="h-7 w-7 text-blue-500" />,
      },
      {
        title: "You're all set",
        description:
          "That's the whirlwind tour. Pick a class, open the Activity Library or Calendar, and start designing — you can reopen this tour any time from the Help button.",
        target: 'body',
        position: 'center',
        icon: <Sparkles className="h-7 w-7 text-teal-500" />,
      },
    ],
    [productName]
  );

  // Reset to the first step every time the walkthrough is (re)opened so that
  // restarting from the help button always begins at step 1, not where the
  // user previously closed.
  useEffect(() => {
    if (isOpen) setCurrentStep(0);
  }, [isOpen]);

  // Body scroll lock while the walkthrough is active so the tooltip stays
  // pinned over its target.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  /**
   * Compute tooltip + highlight position for the current step. If the target
   * can't be found we transparently advance to the next step (or close on the
   * last step) so the user never sees a blank/dead overlay.
   */
  const positionForStep = useCallback(
    (stepIndex: number) => {
      const step = steps[stepIndex];
      if (!step) return;

      // Centered "modal" step.
      if (step.position === 'center' || step.target === 'body') {
        setHighlightRect(null);
        setArrowSide('none');
        setTooltipPos({
          left: Math.max(10, window.innerWidth / 2 - TOOLTIP_WIDTH / 2),
          top: Math.max(10, window.innerHeight / 2 - TOOLTIP_HEIGHT_ESTIMATE / 2),
        });
        return;
      }

      const el = resolveTarget(step.target);
      if (!el) {
        // Auto-skip missing targets so the tour keeps flowing.
        if (stepIndex < steps.length - 1) {
          setCurrentStep(stepIndex + 1);
        } else {
          onClose();
        }
        return;
      }

      // Bring the target into view first so its rect is meaningful.
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      } catch {
        /* older browsers */
      }

      // Re-measure on the next frame so any scroll has settled.
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        setHighlightRect(rect);

        let top = 0;
        let left = 0;
        let arrow: 'top' | 'bottom' | 'left' | 'right' | 'none' = 'none';

        switch (step.position) {
          case 'top':
            top = rect.top - TOOLTIP_HEIGHT_ESTIMATE - 16;
            left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
            arrow = 'bottom';
            break;
          case 'bottom':
            top = rect.bottom + 20;
            left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
            arrow = 'top';
            break;
          case 'left':
            top = rect.top + rect.height / 2 - TOOLTIP_HEIGHT_ESTIMATE / 2;
            left = rect.left - TOOLTIP_WIDTH - 20;
            arrow = 'right';
            break;
          case 'right':
            top = rect.top + rect.height / 2 - TOOLTIP_HEIGHT_ESTIMATE / 2;
            left = rect.right + 20;
            arrow = 'left';
            break;
        }

        // If the chosen side spills off-screen, flip it.
        if (left < 10) {
          left = rect.right + 20;
          arrow = 'left';
        }
        if (left + TOOLTIP_WIDTH > window.innerWidth - 10) {
          left = rect.left - TOOLTIP_WIDTH - 20;
          arrow = 'right';
        }
        if (top < 10) {
          top = rect.bottom + 20;
          arrow = 'top';
        }
        if (top + TOOLTIP_HEIGHT_ESTIMATE > window.innerHeight - 10) {
          top = rect.top - TOOLTIP_HEIGHT_ESTIMATE - 20;
          arrow = 'bottom';
        }

        // Final clamp so we always stay in viewport even if both flips fail.
        left = Math.max(10, Math.min(left, window.innerWidth - TOOLTIP_WIDTH - 10));
        top = Math.max(10, Math.min(top, window.innerHeight - TOOLTIP_HEIGHT_ESTIMATE - 10));

        setTooltipPos({ top, left });
        setArrowSide(arrow);
      });
    },
    [steps, onClose]
  );

  // Recompute on step change, open, resize, and scroll. We poll briefly on
  // step change because the target tab/menu may not be in the DOM yet on the
  // very first tick (e.g. a panel that mounts lazily).
  useEffect(() => {
    if (!isOpen) return;

    let attempts = 0;
    const tryPosition = () => {
      attempts += 1;
      const step = steps[currentStep];
      if (!step) return;
      if (step.position === 'center' || step.target === 'body') {
        positionForStep(currentStep);
        return;
      }
      const el = resolveTarget(step.target);
      if (el || attempts >= 6) {
        positionForStep(currentStep);
      } else {
        setTimeout(tryPosition, 80);
      }
    };
    tryPosition();

    const onResize = () => positionForStep(currentStep);
    const onScroll = () => positionForStep(currentStep);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [isOpen, currentStep, steps, positionForStep]);

  // Esc to close.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
      if (e.key === 'ArrowLeft') setCurrentStep((s) => Math.max(s - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, steps.length, onClose]);

  if (!isOpen) return null;

  const isLast = currentStep >= steps.length - 1;
  const step = steps[currentStep];

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };
  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };
  const handleSkip = () => onClose();

  return (
    // Highest in-app stack: above modals (z-50), below browser-native overlays.
    <div className="fixed inset-0" style={{ zIndex: 9998 }} aria-live="polite" role="dialog" aria-modal="true">
      {/* Dim backdrop. Clicks on the backdrop close the tour. */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={handleSkip}
      />

      {/* Highlight ring around the active target. Pointer-events: none so the
          user can still see the element underneath; clicks fall through to
          the backdrop and close the tour. */}
      {highlightRect && (
        <div
          className="pointer-events-none absolute rounded-xl ring-4 ring-teal-400 ring-offset-2 ring-offset-transparent transition-all duration-200"
          style={{
            top: highlightRect.top - HIGHLIGHT_PADDING,
            left: highlightRect.left - HIGHLIGHT_PADDING,
            width: highlightRect.width + HIGHLIGHT_PADDING * 2,
            height: highlightRect.height + HIGHLIGHT_PADDING * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
            zIndex: 9999,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute bg-white rounded-2xl shadow-2xl pointer-events-auto transition-all duration-200"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: TOOLTIP_WIDTH,
          zIndex: 10000,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <span className="bg-teal-50 text-teal-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              Step {currentStep + 1} of {steps.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              aria-label="Close walkthrough"
              title="Skip tour"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-start gap-4 mb-5">
            <div className="flex-shrink-0 bg-gray-50 p-3 rounded-xl">{step.icon}</div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{step.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              onClick={handleSkip}
              className="text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              Skip tour
            </button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-4 py-2 text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-1 shadow-sm"
              >
                {isLast ? 'Finish' : 'Next'}
                {!isLast && <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {arrowSide !== 'none' && (
          <div
            className="absolute w-3 h-3 bg-white rotate-45"
            style={{
              top: arrowSide === 'top' ? -6 : arrowSide === 'bottom' ? 'auto' : '50%',
              bottom: arrowSide === 'bottom' ? -6 : 'auto',
              left: arrowSide === 'left' ? -6 : arrowSide === 'right' ? 'auto' : '50%',
              right: arrowSide === 'right' ? -6 : 'auto',
              transform:
                arrowSide === 'top' || arrowSide === 'bottom'
                  ? 'translateX(-50%) rotate(45deg)'
                  : 'translateY(-50%) rotate(45deg)',
              boxShadow:
                arrowSide === 'top'
                  ? '-1px -1px 1px rgba(0,0,0,0.04)'
                  : arrowSide === 'bottom'
                  ? '1px 1px 1px rgba(0,0,0,0.04)'
                  : arrowSide === 'left'
                  ? '-1px 1px 1px rgba(0,0,0,0.04)'
                  : '1px -1px 1px rgba(0,0,0,0.04)',
            }}
          />
        )}
      </div>
    </div>
  );
}
