import React, { useState } from 'react';
import type { Scene, SceneBackground, SceneBackgroundKind } from '../../types';
import { ColorSwatchPicker } from './ColorSwatchPicker';

interface SceneBackgroundPanelProps {
  scene: Scene;
  onChange: (background: SceneBackground) => void;
  onPickImage?: () => void;
  onPickVideo?: () => void;
}

/** Solid / gradient / image / video background for lyric (and other) slides. */
export function SceneBackgroundPanel({
  scene,
  onChange,
  onPickImage,
  onPickVideo,
}: SceneBackgroundPanelProps) {
  const bg: SceneBackground = scene.background || {
    kind: 'color',
    color: scene.backgroundColor || '#1F1B4D',
    gradient: scene.backgroundGradient,
  };
  const [kind, setKind] = useState<SceneBackgroundKind>(bg.kind || 'color');

  const set = (patch: Partial<SceneBackground>) => {
    const next = { ...bg, kind, ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-2 rounded-[12px] border border-[var(--ss-line)] bg-[var(--ss-lilac)] p-2.5">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--ss-muted)]">
        Slide background
      </p>
      <div className="flex flex-wrap gap-1">
        {(['color', 'gradient', 'image', 'video'] as SceneBackgroundKind[]).map((k) => (
          <button
            key={k}
            type="button"
            className={`ilv-btn text-xs ${kind === k ? 'ilv-btn-primary' : 'ilv-btn-secondary'}`}
            onClick={() => {
              setKind(k);
              set({ kind: k });
            }}
          >
            {k}
          </button>
        ))}
      </div>
      {kind === 'color' && (
        <ColorSwatchPicker
          label="Colour"
          value={bg.color || scene.backgroundColor || '#1F1B4D'}
          onChange={(c) => set({ kind: 'color', color: c })}
        />
      )}
      {kind === 'gradient' && (
        <>
          <label className="ilv-label">CSS gradient</label>
          <input
            className="ilv-input text-xs"
            value={bg.gradient || 'linear-gradient(160deg, #1F1B4D, #4338E8)'}
            onChange={(e) => set({ kind: 'gradient', gradient: e.target.value })}
          />
          <ColorSwatchPicker
            compact
            label="Start colour shortcut"
            value="#1F1B4D"
            onChange={(c) =>
              set({
                kind: 'gradient',
                gradient: `linear-gradient(160deg, ${c}, #4338E8)`,
              })
            }
          />
        </>
      )}
      {kind === 'image' && (
        <>
          <label className="ilv-label">Image URL</label>
          <input
            className="ilv-input text-xs"
            value={bg.imageUrl || ''}
            placeholder="https://… or upload via Free media / Insert image"
            onChange={(e) => set({ kind: 'image', imageUrl: e.target.value })}
          />
          {onPickImage && (
            <button type="button" className="ilv-btn ilv-btn-secondary w-full text-xs" onClick={onPickImage}>
              Choose image…
            </button>
          )}
        </>
      )}
      {kind === 'video' && (
        <>
          <label className="ilv-label">Video URL</label>
          <input
            className="ilv-input text-xs"
            value={bg.videoUrl || ''}
            placeholder="https://… looping muted bed"
            onChange={(e) => set({ kind: 'video', videoUrl: e.target.value, loop: true, muted: true })}
          />
          {onPickVideo && (
            <button type="button" className="ilv-btn ilv-btn-secondary w-full text-xs" onClick={onPickVideo}>
              Choose video…
            </button>
          )}
          <label className="flex items-center gap-1.5 text-xs font-semibold">
            <input
              type="checkbox"
              checked={bg.loop !== false}
              onChange={(e) => set({ loop: e.target.checked })}
            />
            Loop
          </label>
          <label className="flex items-center gap-1.5 text-xs font-semibold">
            <input
              type="checkbox"
              checked={bg.muted !== false}
              onChange={(e) => set({ muted: e.target.checked })}
            />
            Muted
          </label>
        </>
      )}
      {(kind === 'image' || kind === 'video') && (
        <>
          <label className="ilv-label">Dim {(Math.round((bg.dim || 0) * 100))}%</label>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round((bg.dim || 0) * 100)}
            onChange={(e) => set({ dim: Number(e.target.value) / 100 })}
            className="w-full"
          />
          <label className="ilv-label">Blur {bg.blur || 0}px</label>
          <input
            type="range"
            min={0}
            max={24}
            value={bg.blur || 0}
            onChange={(e) => set({ blur: Number(e.target.value) })}
            className="w-full"
          />
          <label className="ilv-label">Opacity {Math.round((bg.opacity ?? 1) * 100)}%</label>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round((bg.opacity ?? 1) * 100)}
            onChange={(e) => set({ opacity: Number(e.target.value) / 100 })}
            className="w-full"
          />
        </>
      )}
    </div>
  );
}
