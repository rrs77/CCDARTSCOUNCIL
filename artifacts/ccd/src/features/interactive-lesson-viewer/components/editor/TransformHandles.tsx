import React, { useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { snapBoxPosition, type GuideLine, type SnapBox } from '../../utils/snapGuides';

export interface TransformBox {
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  flipH?: boolean;
  flipV?: boolean;
  locked?: boolean;
  /** Text overlays: font size scales on corner resize. */
  fontSize?: number;
}

export type TransformMode = 'box' | 'text' | 'lyrics';

interface TransformHandlesProps {
  box: TransformBox;
  stageEl: HTMLElement | null;
  onChange: (patch: Partial<TransformBox> & { fontSize?: number }) => void;
  /** Sibling boxes for alignment snapping while moving via handles area (optional). */
  siblings?: SnapBox[];
  onGuides?: (guides: GuideLine[]) => void;
  /**
   * box = images/shapes/video (aspect lock with Shift)
   * text = corners scale font+box; side handles change width only (rewrap)
   * lyrics = same as text but height auto
   */
  mode?: TransformMode;
  lockAspect?: boolean;
  /** Allow positions slightly outside 0–100 (overflow past stage edges). */
  allowOverflow?: boolean;
}

type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const CORNERS: Handle[] = ['nw', 'ne', 'se', 'sw'];
const EDGES: Handle[] = ['n', 'e', 's', 'w'];

function snapRotation(deg: number, shift: boolean): number {
  let d = ((deg % 360) + 360) % 360;
  if (d > 180) d -= 360;
  if (shift) d = Math.round(d / 15) * 15;
  return Math.round(d * 10) / 10;
}

function clampPos(v: number, allowOverflow: boolean): number {
  if (allowOverflow) return Math.max(-20, Math.min(120, v));
  return Math.max(0, Math.min(96, v));
}

function clampSize(v: number): number {
  return Math.max(4, Math.min(120, v));
}

/**
 * Unified Canva-style transform chrome for text, images, shapes, video, lyrics.
 * Corner resize · edge width/height · rotate (Shift=15°) · overflow allowed.
 */
export function TransformHandles({
  box,
  stageEl,
  onChange,
  siblings = [],
  onGuides,
  mode = 'box',
  lockAspect,
  allowOverflow = true,
}: TransformHandlesProps) {
  const dragRef = useRef<{
    mode: 'resize' | 'rotate';
    handle?: Handle;
    startX: number;
    startY: number;
    orig: TransformBox;
    aspect: number;
    centerX: number;
    centerY: number;
    startAngle: number;
    baseFont: number;
  } | null>(null);
  const [liveGuides, setLiveGuides] = useState<GuideLine[]>([]);

  if (box.locked) return null;

  const isTextish = mode === 'text' || mode === 'lyrics';
  const handles: Handle[] = isTextish
    ? [...CORNERS, 'e', 'w'] // text: corners + horizontal sides (width/rewrap); optional n/s omit for auto height
    : [...CORNERS, ...EDGES];

  const emitGuides = (g: GuideLine[]) => {
    setLiveGuides(g);
    onGuides?.(g);
  };

  const onResizeDown = (e: React.PointerEvent, handle: Handle) => {
    e.stopPropagation();
    e.preventDefault();
    if (!stageEl) return;
    const rect = stageEl.getBoundingClientRect();
    const isCorner = CORNERS.includes(handle);
    dragRef.current = {
      mode: 'resize',
      handle,
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...box },
      aspect: Math.max(0.05, box.width / Math.max(0.05, box.height || 10)),
      centerX: 0,
      centerY: 0,
      startAngle: 0,
      baseFont: box.fontSize || 28,
    };

    const move = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d || d.mode !== 'resize') return;
      const dx = ((ev.clientX - d.startX) / rect.width) * 100;
      const dy = ((ev.clientY - d.startY) / rect.height) * 100;
      const h = d.handle!;
      let { x, y, width, height } = d.orig;
      height = height || 10;

      // Text side handles: width only → rewrap (no font scale)
      if (isTextish && (h === 'e' || h === 'w')) {
        if (h === 'e') width = d.orig.width + dx;
        if (h === 'w') {
          width = d.orig.width - dx;
          x = d.orig.x + dx;
        }
        width = clampSize(width);
        x = clampPos(x, allowOverflow);
        onChange({ x, width });
        emitGuides([]);
        return;
      }

      if (h.includes('e')) width = d.orig.width + dx;
      if (h.includes('w')) {
        width = d.orig.width - dx;
        x = d.orig.x + dx;
      }
      if (h.includes('s')) height = (d.orig.height || 10) + dy;
      if (h.includes('n')) {
        height = (d.orig.height || 10) - dy;
        y = d.orig.y + dy;
      }

      const keepAspect =
        lockAspect ||
        ev.shiftKey ||
        (isTextish && isCorner) || // Canva: corner scales text proportionally
        (!isTextish && isCorner && !ev.altKey);

      if (keepAspect) {
        if (h === 'n' || h === 's') {
          width = height * d.aspect;
        } else if (h === 'e' || h === 'w') {
          height = width / d.aspect;
        } else {
          if (Math.abs(dx) * d.aspect > Math.abs(dy)) height = width / d.aspect;
          else width = height * d.aspect;
          if (h.includes('w')) x = d.orig.x + d.orig.width - width;
          if (h.includes('n')) y = d.orig.y + (d.orig.height || 10) - height;
        }
      }

      width = clampSize(width);
      height = clampSize(height);
      x = clampPos(x, allowOverflow);
      y = clampPos(y, allowOverflow);

      const patch: Partial<TransformBox> & { fontSize?: number } = { x, y, width, height };

      // Proportional font scaling for text corners (Canva-style)
      if (isTextish && isCorner) {
        const scale = width / Math.max(0.05, d.orig.width);
        patch.fontSize = Math.max(10, Math.min(160, Math.round(d.baseFont * scale)));
      }

      onChange(patch);
      emitGuides([]);
    };

    const up = () => {
      dragRef.current = null;
      emitGuides([]);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const onRotateDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!stageEl) return;
    const rect = stageEl.getBoundingClientRect();
    const cx = rect.left + ((box.x + box.width / 2) / 100) * rect.width;
    const cy = rect.top + ((box.y + (box.height || 8) / 2) / 100) * rect.height;
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
    dragRef.current = {
      mode: 'rotate',
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...box },
      aspect: 1,
      centerX: cx,
      centerY: cy,
      startAngle,
      baseFont: box.fontSize || 28,
    };
    const move = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d || d.mode !== 'rotate') return;
      const ang = Math.atan2(ev.clientY - d.centerY, ev.clientX - d.centerX);
      const deltaDeg = ((ang - d.startAngle) * 180) / Math.PI;
      onChange({ rotation: snapRotation((d.orig.rotation || 0) + deltaDeg, ev.shiftKey) });
    };
    const up = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const hPct = Math.max(box.height || 8, isTextish ? 6 : 4);

  return (
    <>
      {liveGuides.map((g, i) => (
        <div
          key={`${g.orientation}-${g.pos}-${i}`}
          className={`ilv-snap-guide ilv-snap-guide-${g.orientation} is-${g.kind}`}
          style={g.orientation === 'v' ? { left: `${g.pos}%` } : { top: `${g.pos}%` }}
        />
      ))}
      <div
        className={`ilv-transform-box is-${mode}`}
        style={{
          left: `${box.x}%`,
          top: `${box.y}%`,
          width: `${box.width}%`,
          height: `${hPct}%`,
          transform: box.rotation ? `rotate(${box.rotation}deg)` : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {handles.map((h) => (
          <button
            key={h}
            type="button"
            className={`ilv-transform-handle ilv-th-${h} ${CORNERS.includes(h) ? 'is-corner' : 'is-edge'}`}
            aria-label={
              isTextish && (h === 'e' || h === 'w')
                ? 'Resize width (text rewraps)'
                : isTextish && CORNERS.includes(h)
                  ? 'Scale text proportionally'
                  : `Resize ${h}`
            }
            title={
              isTextish && CORNERS.includes(h)
                ? 'Scale · Shift keeps aspect'
                : isTextish && (h === 'e' || h === 'w')
                  ? 'Change width · text rewraps'
                  : 'Resize · Shift locks aspect'
            }
            onPointerDown={(e) => onResizeDown(e, h)}
          />
        ))}
        <button
          type="button"
          className="ilv-transform-rotate"
          aria-label="Rotate (hold Shift to snap 15°)"
          title="Rotate · Shift snaps 15°"
          onPointerDown={onRotateDown}
        >
          <RotateCw className="h-3.5 w-3.5" />
        </button>
      </div>
    </>
  );
}

/** Apply snap while dragging a box body; call from move handlers. */
export function applyMoveSnap(
  next: SnapBox,
  siblings: SnapBox[],
): { x: number; y: number; guides: GuideLine[] } {
  return snapBoxPosition(next, siblings);
}
