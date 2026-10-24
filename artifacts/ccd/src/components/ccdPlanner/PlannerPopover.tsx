/**
 * Shared planner toolbar popover: focus trap, Esc, click-outside,
 * focus return, and full-width bottom sheet below 640px.
 */
import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { cn } from '@/lib/utils';

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
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  useFocusTrap(panelRef, open, close);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onOpenChange(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onOpenChange]);

  return (
    <div className="relative" ref={rootRef}>
      {trigger}
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-indigo-950/20 sm:hidden"
            onClick={close}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={cn(
              'z-50 flex flex-col overflow-hidden border border-indigo-100 bg-white shadow-xl shadow-indigo-900/15 outline-none',
              // Desktop: anchored popover
              'max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:max-h-[min(85vh,560px)] max-sm:w-full max-sm:rounded-t-3xl max-sm:rounded-b-none',
              'sm:absolute sm:top-[calc(100%+8px)] sm:max-h-[min(70vh,560px)] sm:rounded-2xl',
              align === 'end' ? 'sm:right-0 sm:left-auto' : 'sm:left-0 sm:right-auto',
              panelClassName,
            )}
          >
            <span id={titleId} className="sr-only">
              {label}
            </span>
            {children}
          </div>
        </>
      ) : null}
    </div>
  );
}
