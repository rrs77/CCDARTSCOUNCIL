import React, { useMemo, useRef } from 'react';
import type { LyricLine, Scene } from '../../types';
import { formatTimecode } from '../../types';
import { resizeLyric } from '../../utils/lyricsSync';

interface LyricsWaveformDockProps {
  scene: Scene;
  sceneTimeMs: number;
  onSeek: (ms: number) => void;
  onChangeLyrics: (lyrics: LyricLine[]) => void;
}

/** Deterministic pseudo-waveform bars for the lyrics dock (no audio decode required). */
function buildBars(durationMs: number, seed: string, count = 96): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const t = i / count;
    const envelope = 0.35 + 0.65 * Math.sin(Math.PI * t);
    const noise = (h % 1000) / 1000;
    bars.push(Math.max(0.08, Math.min(1, envelope * (0.35 + noise * 0.9))));
  }
  void durationMs;
  return bars;
}

export function LyricsWaveformDock({
  scene,
  sceneTimeMs,
  onSeek,
  onChangeLyrics,
}: LyricsWaveformDockProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const lyrics = scene.lyrics || [];
  const duration = Math.max(1, scene.durationMs || 1);
  const bars = useMemo(
    () => buildBars(duration, scene.id + (scene.mediaUrl || '')),
    [duration, scene.id, scene.mediaUrl],
  );

  const seekFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <div className="ilv-waveform-dock" aria-label="Lyric video waveform timeline">
      <div className="ilv-waveform-dock-head">
        <strong>Lyric video waveform</strong>
        <span className="tabular-nums">
          {formatTimecode(sceneTimeMs)} / {formatTimecode(duration)}
        </span>
      </div>
      <div
        ref={trackRef}
        className="ilv-waveform-track"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('.ilv-waveform-block')) return;
          seekFromClientX(e.clientX);
        }}
      >
        <div className="ilv-waveform-bars" aria-hidden>
          {bars.map((amp, i) => (
            <span
              key={i}
              className={`ilv-waveform-bar ${sceneTimeMs / duration >= i / bars.length ? 'is-played' : ''}`}
              style={{ height: `${amp * 100}%` }}
            />
          ))}
        </div>
        <div
          className="ilv-waveform-playhead"
          style={{ left: `${(sceneTimeMs / duration) * 100}%` }}
        />
        {lyrics.map((line) => {
          const left = (line.startMs / duration) * 100;
          const width = Math.max(1.2, ((line.endMs - line.startMs) / duration) * 100);
          const active = sceneTimeMs >= line.startMs && sceneTimeMs < line.endMs;
          return (
            <div
              key={line.id}
              className={`ilv-waveform-block ${active ? 'is-active' : ''}`}
              style={{ left: `${left}%`, width: `${width}%` }}
              title={`${line.text} (${formatTimecode(line.startMs)})`}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                const startX = e.clientX;
                const origStart = line.startMs;
                const origEnd = line.endMs;
                const trackW = trackRef.current?.getBoundingClientRect().width || 1;
                const move = (ev: PointerEvent) => {
                  const dMs = ((ev.clientX - startX) / trackW) * duration;
                  onChangeLyrics(resizeLyric(lyrics, line.id, origStart + dMs, origEnd + dMs, duration));
                };
                const up = () => {
                  window.removeEventListener('pointermove', move);
                  window.removeEventListener('pointerup', up);
                };
                window.addEventListener('pointermove', move);
                window.addEventListener('pointerup', up);
              }}
            >
              <span>{line.text}</span>
            </div>
          );
        })}
      </div>
      {lyrics.length === 0 && (
        <p className="ilv-waveform-empty">
          Open Lyric video in the rail to paste, auto-align, or tap-sync lines — they appear on this waveform.
        </p>
      )}
    </div>
  );
}
