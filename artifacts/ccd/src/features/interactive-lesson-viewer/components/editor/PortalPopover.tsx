import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface PortalPopoverProps {
  open: boolean;
  /** Anchor element — popover positions relative to this. */
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  children: React.ReactNode;
  /** Preferred placement; will flip if clipped. */
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  /** Min width of the panel. */
  minWidth?: number;
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
  /** Accessible label for the dialog/menu. */
  'aria-label'?: string;
  role?: 'menu' | 'dialog' | 'listbox';
}

const Z = 12000;
const GAP = 6;
const PAD = 8;

/**
 * Collision-aware popover portaled to document.body.
 * Flips / shifts to stay in the viewport — never clipped by overflow:hidden ancestors.
 */
export function PortalPopover({
  open,
  anchorRef,
  onClose,
  children,
  placement = 'bottom-start',
  minWidth = 220,
  maxWidth = 360,
  maxHeight = 420,
  className = '',
  'aria-label': ariaLabel,
  role = 'dialog',
}: PortalPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; maxH: number }>({
    top: 0,
    left: 0,
    width: minWidth,
    maxH: maxHeight,
  });

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const anchor = anchorRef.current;
      const panel = panelRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = Math.min(maxWidth, Math.max(minWidth, rect.width, 240));
      const measuredH = panel?.offsetHeight || Math.min(maxHeight, 280);

      let preferBottom = placement.startsWith('bottom');
      let preferEnd = placement.endsWith('end');

      const spaceBelow = vh - rect.bottom - PAD;
      const spaceAbove = rect.top - PAD;
      if (preferBottom && spaceBelow < Math.min(measuredH, 160) && spaceAbove > spaceBelow) {
        preferBottom = false;
      } else if (!preferBottom && spaceAbove < Math.min(measuredH, 160) && spaceBelow > spaceAbove) {
        preferBottom = true;
      }

      const available = preferBottom ? spaceBelow : spaceAbove;
      const maxH = Math.max(120, Math.min(maxHeight, available - GAP));

      let top = preferBottom ? rect.bottom + GAP : rect.top - GAP - Math.min(measuredH, maxH);
      if (!preferBottom && top < PAD) top = PAD;
      if (preferBottom && top + Math.min(measuredH, maxH) > vh - PAD) {
        top = Math.max(PAD, vh - PAD - Math.min(measuredH, maxH));
      }

      let left = preferEnd ? rect.right - width : rect.left;
      if (left + width > vw - PAD) left = vw - PAD - width;
      if (left < PAD) left = PAD;

      setPos({ top, left, width, maxH });
    };

    place();
    // Re-measure after paint once content is known
    const t = window.requestAnimationFrame(place);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.cancelAnimationFrame(t);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, anchorRef, placement, minWidth, maxWidth, maxHeight]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={panelRef}
      className={`ilv-portal-popover ${className}`}
      role={role}
      aria-label={ariaLabel}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: pos.width,
        maxHeight: pos.maxH,
        zIndex: Z,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
