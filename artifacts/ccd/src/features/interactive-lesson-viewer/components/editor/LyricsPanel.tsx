import React, { useEffect, useState } from 'react';
import { Mic, Pointer, Sparkles, AlignLeft } from 'lucide-react';
import type { LyricLine, Scene } from '../../types';
import {
  applyTapSync,
  autoAlignLyrics,
  nudgeLyric,
  parseLyricLines,
  resizeLyric,
} from '../../utils/lyricsSync';
import {
  getTranscriptionProviderStatus,
  transcribeAudioForLyrics,
} from '../../utils/whisperProvider';
import { formatTimecode } from '../../types';

interface LyricsPanelProps {
  scene: Scene;
  sceneTimeMs: number;
  playing: boolean;
  onChange: (lyrics: LyricLine[]) => void;
  onSeek: (ms: number) => void;
  onTogglePlay: () => void;
  authToken?: string | null;
}

export function LyricsPanel({
  scene,
  sceneTimeMs,
  playing,
  onChange,
  onSeek,
  onTogglePlay,
  authToken,
}: LyricsPanelProps) {
  const [paste, setPaste] = useState('');
  const [tapIndex, setTapIndex] = useState(0);
  const [tapMode, setTapMode] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [providerMsg, setProviderMsg] = useState('Checking transcription…');
  const [providerOk, setProviderOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const lyrics = scene.lyrics || [];
  const duration = scene.durationMs;
  const pxPerMs = 240 / Math.max(1, duration);

  useEffect(() => {
    void getTranscriptionProviderStatus().then((s) => {
      setProviderOk(s.available);
      setProviderMsg(s.message);
    });
  }, []);

  useEffect(() => {
    if (!tapMode || !playing) return;
    // Tap mode listens for Space / click — handled by buttons below
  }, [tapMode, playing]);

  const handleTap = () => {
    if (!tapMode) return;
    const next = applyTapSync(lyrics, sceneTimeMs, tapIndex, duration);
    onChange(next);
    setTapIndex((i) => Math.min(i + 1, Math.max(0, lyrics.length - 1)));
    setStatusMsg(`Synced line ${tapIndex + 1} at ${formatTimecode(sceneTimeMs)}`);
  };

  const handleAutoAlign = () => {
    const texts = paste.trim() ? parseLyricLines(paste) : lyrics.map((l) => l.text);
    if (!texts.length) {
      setStatusMsg('Paste lyrics first, or add lines manually.');
      return;
    }
    onChange(autoAlignLyrics(texts, duration));
    setStatusMsg('Lyrics auto-aligned evenly across the track — drag or nudge to refine.');
  };

  const handleTranscribe = async () => {
    if (!scene.mediaUrl) {
      setStatusMsg('Add an audio or video URL on this lyrics scene first.');
      return;
    }
    setBusy(true);
    setStatusMsg('Transcribing…');
    const result = await transcribeAudioForLyrics(scene.mediaUrl, authToken);
    setBusy(false);
    if (result.lines.length) {
      onChange(result.lines);
      setStatusMsg(`Imported ${result.lines.length} timed lines via ${result.provider}.`);
    } else {
      setStatusMsg(result.message || 'No lines returned.');
    }
  };

  return (
    <div className="space-y-3 p-3">
      <div>
        <h3 className="text-sm font-extrabold tracking-tight text-[var(--ss-ink)]">Lyrics track</h3>
        <p className="mt-0.5 text-xs text-[var(--ss-muted)]">
          Auto-transcribe when a provider key is set, paste + auto-align, or Tap to sync while the track plays.
        </p>
      </div>

      <div
        className="rounded-[12px] border border-[var(--ss-line)] p-2.5 text-xs"
        style={{ background: providerOk ? 'var(--ss-mint)' : 'var(--ss-suntint)' }}
      >
        {providerMsg}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="ilv-btn ilv-btn-primary text-xs" disabled={busy || !providerOk} onClick={handleTranscribe}>
          <Sparkles className="h-3.5 w-3.5" />
          Auto-transcribe
        </button>
        <button
          type="button"
          className={`ilv-btn text-xs ${tapMode ? 'ilv-btn-primary' : 'ilv-btn-secondary'}`}
          onClick={() => {
            setTapMode((v) => !v);
            setTapIndex(0);
            if (!playing) onTogglePlay();
          }}
        >
          <Pointer className="h-3.5 w-3.5" />
          Tap to sync
        </button>
        <button type="button" className="ilv-btn ilv-btn-secondary text-xs" onClick={handleAutoAlign}>
          <AlignLeft className="h-3.5 w-3.5" />
          Auto-align paste
        </button>
      </div>

      {tapMode && (
        <button type="button" className="ilv-btn ilv-btn-primary w-full" onClick={handleTap}>
          <Mic className="h-4 w-4" />
          Tap now — line {Math.min(tapIndex + 1, lyrics.length || 1)} ({formatTimecode(sceneTimeMs)})
        </button>
      )}

      <div>
        <label className="ilv-label">Paste known lyrics</label>
        <textarea
          className="ilv-textarea min-h-[88px]"
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder={'One line per row…\nClap your hands…'}
        />
      </div>

      {/* Waveform-ish track with draggable line blocks */}
      <div className="ilv-lyrics-track">
        <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-[var(--ss-muted)]">
          <span>Timeline</span>
          <span>{formatTimecode(sceneTimeMs)} / {formatTimecode(duration)}</span>
        </div>
        <div
          className="relative h-16 overflow-hidden rounded-[10px] border border-[var(--ss-line)]"
          style={{
            background:
              'repeating-linear-gradient(90deg, #E9E6FF 0 2px, transparent 2px 8px), linear-gradient(180deg, #fff, #F4F3FA)',
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            onSeek(ratio * duration);
          }}
        >
          {/* playhead */}
          <div
            className="absolute top-0 bottom-0 z-10 w-0.5 bg-[var(--ss-indigo)]"
            style={{ left: `${(sceneTimeMs / duration) * 100}%` }}
          />
          {lyrics.map((line) => (
            <div
              key={line.id}
              className="ilv-lyric-block"
              style={{
                left: line.startMs * pxPerMs,
                width: Math.max(24, (line.endMs - line.startMs) * pxPerMs),
                top: 18,
              }}
              title={line.text}
              onPointerDown={(e) => {
                e.stopPropagation();
                const startX = e.clientX;
                const origStart = line.startMs;
                const origEnd = line.endMs;
                const move = (ev: PointerEvent) => {
                  const dx = ev.clientX - startX;
                  const dMs = dx / pxPerMs;
                  onChange(resizeLyric(lyrics, line.id, origStart + dMs, origEnd + dMs, duration));
                };
                const up = () => {
                  window.removeEventListener('pointermove', move);
                  window.removeEventListener('pointerup', up);
                };
                window.addEventListener('pointermove', move);
                window.addEventListener('pointerup', up);
              }}
            >
              {line.text}
            </div>
          ))}
        </div>
      </div>

      <ul className="max-h-48 space-y-1.5 overflow-y-auto">
        {lyrics.map((line, i) => (
          <li
            key={line.id}
            className="flex items-center gap-2 rounded-[10px] border border-[var(--ss-line)] bg-white px-2 py-1.5"
          >
            <span className="w-5 text-[10px] font-bold text-[var(--ss-muted)]">{i + 1}</span>
            <input
              className="ilv-input min-h-[32px] flex-1 py-1 text-xs"
              value={line.text}
              onChange={(e) =>
                onChange(lyrics.map((l) => (l.id === line.id ? { ...l, text: e.target.value } : l)))
              }
            />
            <button
              type="button"
              className="ilv-tool-btn"
              title="Nudge −100ms"
              onClick={() => onChange(nudgeLyric(lyrics, line.id, -100, duration))}
            >
              −
            </button>
            <button
              type="button"
              className="ilv-tool-btn"
              title="Nudge +100ms"
              onClick={() => onChange(nudgeLyric(lyrics, line.id, 100, duration))}
            >
              +
            </button>
          </li>
        ))}
      </ul>

      {statusMsg && <p className="text-xs text-[var(--ss-muted)]">{statusMsg}</p>}
    </div>
  );
}
