import React from 'react';
import { Mic2, Sparkles } from 'lucide-react';
import type { Scene } from '../../types';
import { formatTimecode } from '../../types';

interface LyricsPanelProps {
  scene: Scene;
  sceneTimeMs: number;
  onOpenStudio: () => void;
}

/** Slim lyrics rail — summary + entry to Lyrics Studio (full editor lives in the modal). */
export function LyricsPanel({ scene, sceneTimeMs, onOpenStudio }: LyricsPanelProps) {
  const lyrics = scene.lyrics || [];
  const karaoke = scene.karaokeTracks;
  const active = lyrics.find((l) => sceneTimeMs >= l.startMs && sceneTimeMs < l.endMs);

  return (
    <div className="space-y-3 p-3">
      <div>
        <h3 className="text-sm font-extrabold tracking-tight text-[var(--ss-ink)]">Lyric video</h3>
        <p className="mt-0.5 text-xs text-[var(--ss-muted)]">
          Timing, waveform, tap-sync, Whisper, and display live in Lyric video Studio — not squeezed into this column.
        </p>
      </div>

      <div className="rounded-[12px] border border-[var(--ss-line)] bg-[var(--ss-lilac)] p-3">
        <div className="flex items-start gap-2">
          <Mic2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ss-indigo)]" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[var(--ss-ink)]">
              {lyrics.length === 0
                ? 'No lyric lines yet'
                : `${lyrics.length} line${lyrics.length === 1 ? '' : 's'} · ${formatTimecode(scene.durationMs)}`}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-[var(--ss-muted)]">
              {active ? `Now: “${active.text}”` : 'Open Studio to paste, sync, or style your lyric video.'}
            </p>
            {(karaoke?.vocalUrl || karaoke?.backingUrl || scene.mediaUrl) && (
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--ss-muted)]">
                {karaoke?.vocalUrl || scene.mediaUrl ? 'Vocal' : '—'}
                {karaoke?.backingUrl ? ' · Backing' : ''}
                {karaoke?.defaultVersion === 'backing' ? ' · default: backing' : ' · default: vocals'}
              </p>
            )}
          </div>
        </div>
      </div>

      <button type="button" className="ilv-btn ilv-btn-primary w-full" onClick={onOpenStudio}>
        <Sparkles className="h-4 w-4" />
        Open Lyric video Studio
      </button>

      {lyrics.length > 0 && (
        <ul className="max-h-40 space-y-1 overflow-y-auto">
          {lyrics.slice(0, 8).map((line, i) => (
            <li
              key={line.id}
              className="truncate rounded-[8px] border border-[var(--ss-line)] bg-white px-2 py-1 text-[11px] font-medium text-[var(--ss-ink)]"
            >
              <span className="mr-1.5 text-[var(--ss-muted)]">{i + 1}.</span>
              {line.text}
            </li>
          ))}
          {lyrics.length > 8 && (
            <li className="text-[10px] text-[var(--ss-muted)]">+{lyrics.length - 8} more in Studio</li>
          )}
        </ul>
      )}
    </div>
  );
}
