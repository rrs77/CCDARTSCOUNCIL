import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LyricAnimScope, LyricsDisplayOptions, TextAnimationType } from '../../types';
import { DEFAULT_LYRICS_DISPLAY, TEXT_FONT_OPTIONS } from '../../types';
import { ColorSwatchPicker } from './ColorSwatchPicker';
import { PortalPopover } from './PortalPopover';

const LYRIC_ANIMS: { id: TextAnimationType; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'karaoke-wipe', label: 'Karaoke wipe' },
  { id: 'karaoke-fill', label: 'Karaoke fill' },
  { id: 'bounce-in', label: 'Bounce in' },
  { id: 'word-pop', label: 'Word pop' },
  { id: 'typewriter', label: 'Typewriter' },
  { id: 'fade-up', label: 'Fade up' },
  { id: 'glow-pulse', label: 'Glow pulse' },
  { id: 'scale-highlight', label: 'Scale highlight' },
  { id: 'slide-in-line', label: 'Slide in' },
  { id: 'colour-sweep', label: 'Colour sweep' },
  { id: 'fade-in', label: 'Fade' },
  { id: 'pulse', label: 'Pulse' },
];

interface LyricsCanvasToolbarProps {
  display: LyricsDisplayOptions;
  anchorEl: HTMLElement | null;
  onChange: (patch: Partial<LyricsDisplayOptions>) => void;
  onOpenStudio?: () => void;
}

/** Floating Canva-style toolbar when lyrics on the canvas are selected. */
export function LyricsCanvasToolbar({
  display,
  anchorEl,
  onChange,
  onOpenStudio,
}: LyricsCanvasToolbarProps) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [animOpen, setAnimOpen] = useState(false);
  const animBtnRef = useRef<HTMLButtonElement>(null);
  const d = { ...DEFAULT_LYRICS_DISPLAY, ...display };

  useEffect(() => {
    if (!anchorEl) return;
    const place = () => {
      const rect = anchorEl.getBoundingClientRect();
      const width = 520;
      let left = rect.left + rect.width / 2 - width / 2;
      left = Math.max(8, Math.min(window.innerWidth - width - 8, left));
      const top = Math.max(8, rect.top - 56);
      setPos({ top, left });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [anchorEl]);

  if (!anchorEl || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="ilv-lyrics-canvas-toolbar"
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 11000, width: 520 }}
      role="toolbar"
      aria-label="Lyrics display"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <select
        className="ilv-select min-h-[32px] w-[130px] py-1 text-xs"
        value={d.fontFamily || 'plus-jakarta'}
        aria-label="Lyric font"
        onChange={(e) => onChange({ fontFamily: e.target.value })}
      >
        {TEXT_FONT_OPTIONS.map((f) => (
          <option key={f.id} value={f.id}>
            {f.label}
          </option>
        ))}
      </select>
      <input
        className="ilv-input min-h-[32px] w-[56px] py-1 text-xs"
        type="number"
        min={14}
        max={72}
        value={d.fontSize || 28}
        aria-label="Lyric size"
        onChange={(e) => onChange({ fontSize: Math.max(14, Number(e.target.value) || 28) })}
      />
      <div className="flex gap-0.5">
        {(['top', 'center', 'bottom'] as const).map((p) => (
          <button
            key={p}
            type="button"
            className={`ilv-tool-btn ${d.position === p ? 'is-active' : ''}`}
            title={`Position ${p}`}
            aria-label={`Position ${p}`}
            onClick={() => onChange({ position: p })}
          >
            {p[0].toUpperCase()}
          </button>
        ))}
      </div>
      <ColorSwatchPicker
        compact
        label="Active"
        value={d.activeColor || '#FFFFFF'}
        onChange={(c) => onChange({ activeColor: c })}
      />
      <ColorSwatchPicker
        compact
        label="Upcoming"
        value={d.upcomingColor || 'rgba(255,255,255,0.45)'}
        onChange={(c) => onChange({ upcomingColor: c })}
      />
      <button
        type="button"
        className={`ilv-tool-btn text-[10px] font-bold ${d.background ? 'is-active' : ''}`}
        title="Backdrop"
        aria-label="Toggle lyric backdrop"
        onClick={() => onChange({ background: !d.background })}
      >
        BG
      </button>
      <button
        type="button"
        className={`ilv-tool-btn text-[10px] font-bold ${d.showPast !== false ? 'is-active' : ''}`}
        title="Show past lines"
        aria-label="Show past lines"
        onClick={() => onChange({ showPast: d.showPast === false })}
      >
        Past
      </button>
      <button
        type="button"
        className={`ilv-tool-btn text-[10px] font-bold ${d.showUpcoming !== false ? 'is-active' : ''}`}
        title="Show upcoming"
        aria-label="Show upcoming lines"
        onClick={() => onChange({ showUpcoming: d.showUpcoming === false })}
      >
        Next
      </button>
      <input
        className="ilv-input min-h-[32px] w-[64px] py-1 text-xs"
        type="number"
        min={0}
        max={3000}
        step={100}
        value={d.leadInMs || 0}
        title="Lead-in ms"
        aria-label="Lead-in milliseconds"
        onChange={(e) => onChange({ leadInMs: Math.max(0, Number(e.target.value) || 0) })}
      />
      <button
        ref={animBtnRef}
        type="button"
        className={`ilv-tool-btn text-[10px] font-bold ${d.animation && d.animation !== 'none' ? 'is-active' : ''}`}
        title="Lyric animation"
        aria-label="Lyric animation"
        onClick={() => setAnimOpen((v) => !v)}
      >
        Anim
      </button>
      {onOpenStudio && (
        <button type="button" className="ilv-btn ilv-btn-secondary text-[10px]" onClick={onOpenStudio}>
          Studio
        </button>
      )}

      <PortalPopover
        open={animOpen}
        anchorRef={animBtnRef}
        onClose={() => setAnimOpen(false)}
        aria-label="Lyric animations"
        minWidth={280}
        maxWidth={320}
        maxHeight={420}
        placement="bottom-end"
      >
        <div className="ilv-insert-menu">
          <p className="ilv-insert-menu-title">Lyric animation</p>
          <div className="grid grid-cols-2 gap-1">
            {LYRIC_ANIMS.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`ilv-btn text-[11px] ${
                  (d.animation || 'none') === a.id ? 'ilv-btn-primary' : 'ilv-btn-secondary'
                }`}
                onClick={() => onChange({ animation: a.id })}
              >
                {a.label}
              </button>
            ))}
          </div>
          <label className="ilv-label mt-2">Scope</label>
          <div className="flex gap-1">
            {(['line', 'word'] as LyricAnimScope[]).map((s) => (
              <button
                key={s}
                type="button"
                className={`ilv-btn flex-1 text-xs ${(d.animScope || 'line') === s ? 'ilv-btn-primary' : 'ilv-btn-secondary'}`}
                onClick={() => onChange({ animScope: s })}
              >
                Per {s}
              </button>
            ))}
          </div>
          <label className="ilv-label mt-2">Speed {(d.animSpeed ?? 1).toFixed(2)}×</label>
          <input
            type="range"
            min={0.25}
            max={3}
            step={0.05}
            value={d.animSpeed ?? 1}
            onChange={(e) => onChange({ animSpeed: Number(e.target.value) })}
            className="w-full"
            aria-label="Animation speed"
          />
          <label className="ilv-label">Duration ms</label>
          <input
            className="ilv-input min-h-[32px] py-1 text-xs"
            type="number"
            min={100}
            max={4000}
            step={50}
            value={d.animDurationMs || 700}
            onChange={(e) => onChange({ animDurationMs: Math.max(100, Number(e.target.value) || 700) })}
          />
        </div>
      </PortalPopover>
    </div>,
    document.body,
  );
}
