import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import {
  useCallback,
  useId,
  useRef,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '../../hooks/useFocusTrap';

/**
 * Shared modal shell for genuine planner dialogs only: activity stepped card,
 * template picker, Settings editors and confirms. (Run-through also uses it.)
 * Lesson plan is inline in the lesson canvas — not ModalShell.
 * One size: 760px wide × min(88vh, 760px) tall.
 */
export const MODAL_SHELL_SIZE = 'h-[min(88vh,760px)] w-full max-w-[760px]';

export function ModalShell({
  open,
  onClose,
  children,
  className,
  labelledBy,
  describedBy,
  initialFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  describedBy?: string;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}) {
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const handleClose = useCallback(() => onClose(), [onClose]);
  useFocusTrap(dialogRef, open, handleClose);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 md:p-6"
          data-ccd-modal-shell
        >
          <motion.button
            type="button"
            aria-label="Close overlay"
            className="absolute inset-0 bg-indigo-950/35 backdrop-blur-[2px]"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
            onClick={handleClose}
          />
          <motion.div
            ref={(node) => {
              (dialogRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
              if (node && initialFocusRef?.current) {
                // focus trap still runs; this only seeds preferenced focus
              }
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
            tabIndex={-1}
            data-modal-shell
            initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.99 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
            }
            className={cn(
              // Match feat/planner-mock ModalShell: 28px radius, indigo shadow
              'relative z-10 flex flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-2xl shadow-indigo-900/20',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2',
              MODAL_SHELL_SIZE,
              className,
            )}
          >
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export function ModalHeader({
  title,
  subtitle,
  onClose,
  titleId,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  titleId?: string;
  children?: ReactNode;
  className?: string;
}) {
  const autoId = useId();
  const id = titleId || autoId;
  return (
    <div
      className={cn(
        'flex shrink-0 items-start justify-between gap-3 border-b border-indigo-50 px-5 py-4 sm:px-6',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <h2 id={id} className="text-lg font-extrabold text-slate-900">
          {title}
        </h2>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
        {children}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

export function ModalBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('soft-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6', className)}>
      {children}
    </div>
  );
}

export function ModalFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-indigo-50 px-5 py-3 sm:px-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ModalConfirm({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  const titleId = useId();
  return (
    <ModalShell open={open} onClose={onClose} labelledBy={titleId}>
      <ModalHeader title={title} onClose={onClose} titleId={titleId} />
      <ModalBody>
        <p className="text-sm leading-relaxed text-slate-600">{message}</p>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-full border-2 border-indigo-200 px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={cn(
            'inline-flex h-11 min-w-[44px] items-center justify-center rounded-full px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
            danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700',
          )}
        >
          {confirmLabel}
        </button>
      </ModalFooter>
    </ModalShell>
  );
}
