import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Returns Tailwind classes that should be applied to a drop zone container
 * to give consistent visual feedback across the entire app:
 *  - idle:        no extra style
 *  - canDrop:     dashed teal outline so users can see *where* they can drop
 *  - isOver:      solid teal ring + tinted background to confirm the active
 *                 target the pointer is hovering over
 */
export function useDropZoneStyle({
  isOver,
  canDrop = true,
  variant = 'panel',
}: {
  isOver: boolean;
  canDrop?: boolean;
  variant?: 'panel' | 'inline' | 'cell';
}): string {
  if (!canDrop) return '';
  if (isOver) {
    switch (variant) {
      case 'inline':
        return 'ring-2 ring-[#4338E8] bg-[#E9E6FF]/70';
      case 'cell':
        return 'ring-2 ring-inset ring-[#4338E8] bg-[#E9E6FF]';
      case 'panel':
      default:
        return 'ring-2 ring-[#4338E8] ring-offset-2 ring-offset-white bg-[#E9E6FF]/60';
    }
  }
  // canDrop (but not currently over) — softer cue so eligible targets are visible
  switch (variant) {
    case 'inline':
      return 'ring-1 ring-dashed ring-[#a9a3ff]/60';
    case 'cell':
      return 'ring-1 ring-inset ring-[#bcb7f4]';
    case 'panel':
    default:
      return 'ring-1 ring-dashed ring-[#a9a3ff]';
  }
}

/**
 * Briefly applies a green flash animation class after a successful drop so
 * the user gets clear confirmation the drop "stuck". Returns:
 *  - flashClass: append to your drop-zone container
 *  - triggerFlash: call from your drop handler after the drop succeeds
 */
export function useDropFlash(durationMs = 600): {
  flashClass: string;
  triggerFlash: () => void;
} {
  const [flashing, setFlashing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerFlash = useCallback(() => {
    setFlashing(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setFlashing(false);
      timerRef.current = null;
    }, durationMs);
  }, [durationMs]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    flashClass: flashing ? 'ccd-drop-flash' : '',
    triggerFlash,
  };
}
