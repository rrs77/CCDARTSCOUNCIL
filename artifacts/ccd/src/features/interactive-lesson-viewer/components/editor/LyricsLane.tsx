import React, { useMemo } from 'react';
import { Mic2 } from 'lucide-react';
import type { LyricLine, Scene } from '../../types';
import { formatTimecode } from '../../types';
import { resizeLyric } from '../../utils/lyricsSync';
import { sceneLayoutMs, sceneLayoutOffsets } from '../../utils/timelineAudio';

interface LyricsLaneProps {
  /** Scenes for aligning absolute timeline — when provided with sceneIndex, maps line times to absolute. */
  scenes: Scene[];
  sceneIndex: number;
  scene: Scene;
  sceneTimeMs: number;
  pxPerMs: number;
  onChange: (lyrics: LyricLine[]) => void;
  onSeekScene: (ms: number) => void;
  onOpenStudio: (lineId?: string) => void;
}

/**
 * Lyrics lane on the main editor timeline — blocks sit under scene thumbnails
 * at the karaoke scene's absolute span (and within-scene local times).
 */
export function LyricsLane({
  scenes,
  sceneIndex,
  scene,
  sceneTimeMs,
  pxPerMs,
  onChange,
  onSeekScene,
  onOpenStudio,
}: LyricsLaneProps) {
  const lyrics = scene.lyrics || [];
  const { starts } = useMemo(() => sceneLayoutOffsets(scenes), [scenes]);
  const sceneStart = starts[sceneIndex] || 0;
  const sceneDur = Math.max(1, sceneLayoutMs(scene));
  const trackWidth = Math.max(320, sceneLayoutOffsets(scenes).total * pxPerMs);

  if (scene.type !== 'lyrics' && lyrics.length === 0) return null;

  return (
    <div className="ilv-lyrics-lane" aria-label="Lyric video timeline lane">
      <div className="ilv-lyrics-lane-label">
        <Mic2 className="h-3.5 w-3.5" />
        Lyric video
      </div>
      <div
        className="ilv-lyrics-lane-track"
        style={{ width: trackWidth }}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('.ilv-lyrics-lane-block')) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const abs = (e.clientX - rect.left) / pxPerMs;
          if (abs >= sceneStart && abs <= sceneStart + sceneDur) {
            onSeekScene(abs - sceneStart);
          }
        }}
      >
        <div
          className="ilv-audio-playhead"
          style={{ left: (sceneStart + sceneTimeMs) * pxPerMs }}
        />
        {lyrics.map((line) => {
          const left = (sceneStart + line.startMs) * pxPerMs;
          const width = Math.max(18, (line.endMs - line.startMs) * pxPerMs);
          const active = sceneTimeMs >= line.startMs && sceneTimeMs < line.endMs;
          return (
            <div
              key={line.id}
              className={`ilv-lyrics-lane-block ${active ? 'is-active' : ''}`}
              style={{ left, width }}
              title={`${line.text} (${formatTimecode(line.startMs)})`}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onOpenStudio(line.id);
              }}
              onPointerDown={(e) => {
                if ((e.target as HTMLElement).closest('.ilv-lyrics-lane-handle')) return;
                e.stopPropagation();
                e.preventDefault();
                const startX = e.clientX;
                const origS = line.startMs;
                const origE = line.endMs;
                const move = (ev: PointerEvent) => {
                  const dMs = (ev.clientX - startX) / pxPerMs;
                  onChange(resizeLyric(lyrics, line.id, origS + dMs, origE + dMs, sceneDur));
                };
                const up = () => {
                  window.removeEventListener('pointermove', move);
                  window.removeEventListener('pointerup', up);
                };
                window.addEventListener('pointermove', move);
                window.addEventListener('pointerup', up);
              }}
            >
              <button
                type="button"
                className="ilv-lyrics-lane-handle"
                style={{ left: 0 }}
                aria-label="Resize start"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const startX = e.clientX;
                  const origS = line.startMs;
                  const move = (ev: PointerEvent) => {
                    const dMs = (ev.clientX - startX) / pxPerMs;
                    onChange(resizeLyric(lyrics, line.id, origS + dMs, line.endMs, sceneDur));
                  };
                  const up = () => {
                    window.removeEventListener('pointermove', move);
                    window.removeEventListener('pointerup', up);
                  };
                  window.addEventListener('pointermove', move);
                  window.addEventListener('pointerup', up);
                }}
              />
              <span>{line.text}</span>
              <button
                type="button"
                className="ilv-lyrics-lane-handle"
                style={{ right: 0, left: 'auto' }}
                aria-label="Resize end"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const startX = e.clientX;
                  const origE = line.endMs;
                  const move = (ev: PointerEvent) => {
                    const dMs = (ev.clientX - startX) / pxPerMs;
                    onChange(resizeLyric(lyrics, line.id, line.startMs, origE + dMs, sceneDur));
                  };
                  const up = () => {
                    window.removeEventListener('pointermove', move);
                    window.removeEventListener('pointerup', up);
                  };
                  window.addEventListener('pointermove', move);
                  window.addEventListener('pointerup', up);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
