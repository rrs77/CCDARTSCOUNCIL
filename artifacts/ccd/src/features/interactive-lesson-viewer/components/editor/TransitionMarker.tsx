import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Scene, SceneTransition, TransitionType } from '../../types';
import { TRANSITION_OPTIONS } from '../../types';
import { snapTransitionMs } from '../../utils/colorAlpha';
import { PortalPopover } from './PortalPopover';

interface TransitionMarkerProps {
  /** Index of the incoming scene (transition applies when entering this scene). */
  sceneIndex: number;
  scene: Scene;
  /** Pixel width of the transition overlap on the timeline. */
  widthPx: number;
  onChange: (transition: SceneTransition) => void;
  onApplyToAll: (transition: SceneTransition) => void;
  onRemove: () => void;
}

const TYPE_GLYPH: Record<string, string> = {
  none: '·',
  fade: '◐',
  slide: '⇉',
  zoom: '⊕',
  dissolve: '▦',
  'wipe-left': '◁',
  'wipe-right': '▷',
  'push-up': '⇧',
  'push-down': '⇩',
  blur: '▒',
  bounce: '↕',
  flip: '⇄',
};

/**
 * Bowtie / hourglass transition control between scene clips.
 * Click opens popover; drag edges stretch duration (snapped).
 */
export function TransitionMarker({
  sceneIndex,
  scene,
  widthPx,
  onChange,
  onApplyToAll,
  onRemove,
}: TransitionMarkerProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragLabel, setDragLabel] = useState<string | null>(null);
  const tr = scene.transition || { type: 'fade' as TransitionType, durationMs: 500 };
  const glyph = TYPE_GLYPH[tr.type] || '⧖';
  const label = TRANSITION_OPTIONS.find((o) => o.type === tr.type)?.label || tr.type;

  const startStretch = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const orig = tr.durationMs;
    // ~0.5px per ms at default zoom — use widthPx/duration as scale when possible
    const pxPerMs = widthPx > 4 ? widthPx / Math.max(50, orig || 500) : 0.08;
    const move = (ev: PointerEvent) => {
      const dPx = ev.clientX - startX;
      const next = snapTransitionMs(orig + dPx / pxPerMs);
      onChange({ ...tr, durationMs: next, type: next === 0 ? 'none' : tr.type === 'none' ? 'fade' : tr.type });
      setDragLabel(`${next}ms`);
    };
    const up = () => {
      setDragLabel(null);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div
      className={`ilv-tr-marker ${tr.type !== 'none' && tr.durationMs > 0 ? 'has-tr' : ''}`}
      style={{ width: Math.max(18, widthPx) }}
      title={`${label} · ${tr.durationMs}ms`}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="ilv-tr-overlap" onPointerDown={startStretch} aria-hidden />
      <button
        ref={btnRef}
        type="button"
        className="ilv-tr-bowtie"
        aria-label={`Transition into scene ${sceneIndex + 1}: ${label}, ${tr.durationMs} milliseconds. Click to edit.`}
        title={`${label} · ${tr.durationMs}ms`}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span className="ilv-tr-glyph" aria-hidden>
          {glyph}
        </span>
      </button>
      {dragLabel &&
        createPortal(
          <div className="ilv-tr-drag-readout" role="status">
            {dragLabel}
          </div>,
          document.body,
        )}

      <PortalPopover
        open={menuOpen}
        anchorRef={btnRef}
        onClose={() => setMenuOpen(false)}
        aria-label="Edit transition"
        role="dialog"
        minWidth={240}
        maxWidth={280}
        placement="top-start"
      >
        <div className="ilv-insert-menu">
          <p className="ilv-insert-menu-title">Transition</p>
          <p className="mb-1 text-[10px] text-[var(--ss-muted)]">Into scene {sceneIndex + 1}</p>
          <div className="grid grid-cols-2 gap-1">
            {TRANSITION_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                type="button"
                className={`ilv-btn text-[11px] ${tr.type === opt.type ? 'ilv-btn-primary' : 'ilv-btn-secondary'}`}
                onClick={() =>
                  onChange({
                    type: opt.type,
                    durationMs: opt.type === 'none' ? 0 : tr.durationMs || 500,
                  })
                }
              >
                <span className="mr-1 opacity-70">{TYPE_GLYPH[opt.type]}</span>
                {opt.label}
              </button>
            ))}
          </div>
          <label className="ilv-label mt-2">Duration (ms)</label>
          <input
            className="ilv-input min-h-[34px] py-1 text-xs"
            type="number"
            min={0}
            max={5000}
            step={50}
            value={tr.durationMs}
            onChange={(e) =>
              onChange({
                ...tr,
                durationMs: snapTransitionMs(Number(e.target.value) || 0),
              })
            }
          />
          <div className="mt-2 flex flex-col gap-1.5">
            <button
              type="button"
              className="ilv-btn ilv-btn-secondary w-full text-xs"
              onClick={() => {
                onApplyToAll({ ...tr });
                setMenuOpen(false);
              }}
            >
              Apply to all slides
            </button>
            <button
              type="button"
              className="ilv-btn ilv-btn-ghost w-full text-xs"
              onClick={() => {
                onRemove();
                setMenuOpen(false);
              }}
            >
              Remove
            </button>
          </div>
        </div>
      </PortalPopover>
    </div>
  );
}
