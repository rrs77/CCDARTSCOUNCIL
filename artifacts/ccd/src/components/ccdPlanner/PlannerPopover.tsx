/**
 * Shared planner toolbar popover: focus trap, Esc, click-outside,
 * focus return, and full-width bottom sheet below 640px.
 * Portals to document.body so overflow:hidden ancestors (studio shell) never clip it.
 */
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { cn } from '@/lib/utils';

type PanelPos = { top: number; left: number; width: number; maxHeight: number };

export function PlannerPopover({
  open,
  onOpenChange,
  trigger,
  label,
  children,
  panelClassName,
  align = 'start',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  label: string;
  children: ReactNode;
  panelClassName?: string;
  align?: 'start' | 'end';
}) {
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const ignoreOutsideUntil = useRef(0);
  const [pos, setPos] = useState<PanelPos | null>(null);
  const [narrow, setNarrow] = useState(false);
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  useFocusTrap(panelRef, open, close);

  const updatePosition = useCallback(() => {
    if (typeof window === 'undefined') return;
    const isNarrow = window.matchMedia('(max-width: 639px)').matches;
    setNarrow(isNarrow);
    const triggerEl = rootRef.current;
    if (!triggerEl || isNarrow) {
      setPos(null);
      return;
    }
    const rect = triggerEl.getBoundingClientRect();
    const width = Math.min(window.innerWidth - 16, Math.max(rect.width, 280));
    const left =
      align === 'end'
        ? Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8)
        : Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    const top = Math.min(rect.bottom + 8, window.innerHeight - 120);
    const maxHeight = Math.max(160, window.innerHeight - top - 12);
    setPos({ top, left, width, maxHeight });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    // Ignore the opening gesture so the same pointerdown does not close immediately.
    ignoreOutsideUntil.current = Date.now() + 320;
    updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: PointerEvent) => {
      if (Date.now() < ignoreOutsideUntil.current) return;
      const target = e.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onOpenChange(false);
    };
    document.addEventListener('pointerdown', onDocPointer);
    return () => document.removeEventListener('pointerdown', onDocPointer);
  }, [open, onOpenChange]);

  const panel =
    open && typeof document !== 'undefined' ? (
      <>
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-[80] bg-indigo-950/20 sm:bg-transparent"
          onClick={close}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={cn(
            'fixed z-[90] flex flex-col overflow-hidden border border-indigo-100 bg-white shadow-xl shadow-indigo-900/15 outline-none',
            'max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:max-h-[min(85vh,560px)] max-sm:w-full max-sm:rounded-t-3xl max-sm:rounded-b-none',
            'sm:rounded-2xl',
            panelClassName,
          )}
          style={
            narrow || !pos
              ? undefined
              : {
                  top: pos.top,
                  left: pos.left,
                  width: pos.width,
                  maxHeight: pos.maxHeight,
                }
          }
        >
          <span id={titleId} className="sr-only">
            {label}
          </span>
          {children}
        </div>
      </>
    ) : null;

  return (
    <div className="relative z-[70]" ref={rootRef}>
      {trigger}
      {panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
