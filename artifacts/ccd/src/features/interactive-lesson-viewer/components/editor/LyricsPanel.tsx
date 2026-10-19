import React, { useEffect, useState } from 'react';
import { Mic, Pointer, Sparkles, AlignLeft, Trash2, Settings2 } from 'lucide-react';
import type { LyricLine, LyricsDisplayOptions, Scene } from '../../types';
import {
  DEFAULT_LYRICS_DISPLAY,
  TEXT_FONT_OPTIONS,
  formatTimecode,
} from '../../types';
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
import { ColorSwatchPicker } from './ColorSwatchPicker';

interface LyricsPanelProps {
  scene: Scene;
  sceneTimeMs: number;
  playing: boolean;
  onChange: (lyrics: LyricLine[]) => void;
  onChangeDisplay: (display: LyricsDisplayOptions) => void;
  onSeek: (ms: number) => void;
  onTogglePlay: () => void;
  authToken?: string | null;
}

export function LyricsPanel({
  scene,
  sceneTimeMs,
  playing,
  onChange,
  onChangeDisplay,
  onSeek,
  onTogglePlay,
  authToken,
}: LyricsPanelProps) {
  const [paste, setPaste] = useState('');
  const [tapIndex, setTapIndex] = useState(0);
  const [tapMode, setTapMode] = useState(false);
  const [showOptions, setShowOptions] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const [providerMsg, setProviderMsg] = useState('Checking transcription…');
  const [providerOk, setProviderOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const lyrics = scene.lyrics || [];
  const duration = scene.durationMs;
  const pxPerMs = 240 / Math.max(1, duration);
  const display = { ...DEFAULT_LYRICS_DISPLAY, ...scene.lyricsDisplay };

  useEffect(() => {
    void getTranscriptionProviderStatus().then((s) => {
      setProviderOk(s.available);
      setProviderMsg(s.message);
    });
  }, []);

  const patchDisplay = (patch: Partial<LyricsDisplayOptions>) => {
    onChangeDisplay({ ...display, ...patch });
  };

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

  const addBlankLine = () => {
    const start = Math.min(sceneTimeMs, Math.max(0, duration - 2000));
    onChange([
      ...lyrics,
      {
        id: `ly_${Math.random().toString(36).slice(2, 8)}`,
        text: 'New line',
        startMs: start,
        endMs: Math.min(duration, start + 2000),
      },
    ]);
  };

  const shiftAll = (deltaMs: number) => {
    onChange(
      lyrics.map((l) => ({
        ...l,
        startMs: Math.max(0, Math.min(duration - 50, l.startMs + deltaMs)),
        endMs: Math.max(50, Math.min(duration, l.endMs + deltaMs)),
      })),
    );
  };

  return (
    <div className="space-y-3 p-3">
      <div>
        <h3 className="text-sm font-extrabold tracking-tight text-[var(--ss-ink)]">Lyrics track</h3>
        <p className="mt-0.5 text-xs text-[var(--ss-muted)]">
          Auto-transcribe, paste + auto-align, tap to sync, then refine on the waveform dock under the timeline.
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
        <button type="button" className="ilv-btn ilv-btn-secondary text-xs" onClick={addBlankLine}>
          + Line
        </button>
        <button
          type="button"
          className={`ilv-btn text-xs ${showOptions ? 'ilv-btn-primary' : 'ilv-btn-secondary'}`}
          onClick={() => setShowOptions((v) => !v)}
        >
          <Settings2 className="h-3.5 w-3.5" />
          Display
        </button>
      </div>

      {tapMode && (
        <button type="button" className="ilv-btn ilv-btn-primary w-full" onClick={handleTap}>
          <Mic className="h-4 w-4" />
          Tap now — line {Math.min(tapIndex + 1, lyrics.length || 1)} ({formatTimecode(sceneTimeMs)})
        </button>
      )}

      {showOptions && (
        <div className="space-y-2 rounded-[12px] border border-[var(--ss-line)] bg-[var(--ss-lilac)] p-2.5">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--ss-muted)]">
            Karaoke display
          </p>
          <label className="ilv-label">Font</label>
          <select
            className="ilv-select"
            value={display.fontFamily || 'plus-jakarta'}
            onChange={(e) => patchDisplay({ fontFamily: e.target.value })}
          >
            {TEXT_FONT_OPTIONS.map((f) => (
              <option key={f.id} value={f.id} style={{ fontFamily: f.stack }}>
                {f.label}
              </option>
            ))}
          </select>
          <label className="ilv-label">Size</label>
          <input
            className="ilv-input"
            type="number"
            min={14}
            max={72}
            value={display.fontSize || 28}
            onChange={(e) => patchDisplay({ fontSize: Math.max(14, Number(e.target.value) || 28) })}
          />
          <label className="ilv-label">Position</label>
          <div className="flex gap-1.5">
            {(['top', 'center', 'bottom'] as const).map((pos) => (
              <button
                key={pos}
                type="button"
                className={`ilv-btn flex-1 text-xs ${display.position === pos ? 'ilv-btn-primary' : 'ilv-btn-secondary'}`}
                onClick={() => patchDisplay({ position: pos })}
              >
                {pos}
              </button>
            ))}
          </div>
          <ColorSwatchPicker
            label="Active colour"
            value={display.activeColor || '#FFFFFF'}
            onChange={(c) => patchDisplay({ activeColor: c })}
          />
          <ColorSwatchPicker
            label="Upcoming colour"
            compact
            value={display.upcomingColor || 'rgba(255,255,255,0.45)'}
            onChange={(c) => patchDisplay({ upcomingColor: c })}
          />
          <div className="flex flex-wrap gap-3 pt-1">
            <label className="flex items-center gap-1.5 text-xs font-semibold">
              <input
                type="checkbox"
                checked={display.showUpcoming !== false}
                onChange={(e) => patchDisplay({ showUpcoming: e.target.checked })}
              />
              Show upcoming
            </label>
            <label className="flex items-center gap-1.5 text-xs font-semibold">
              <input
                type="checkbox"
                checked={display.showPast !== false}
                onChange={(e) => patchDisplay({ showPast: e.target.checked })}
              />
              Show past
            </label>
            <label className="flex items-center gap-1.5 text-xs font-semibold">
              <input
                type="checkbox"
                checked={Boolean(display.background)}
                onChange={(e) => patchDisplay({ background: e.target.checked })}
              />
              Backdrop
            </label>
          </div>
          <label className="ilv-label">Lead-in (ms)</label>
          <input
            className="ilv-input"
            type="number"
            min={0}
            max={3000}
            step={100}
            value={display.leadInMs || 0}
            onChange={(e) => patchDisplay({ leadInMs: Math.max(0, Number(e.target.value) || 0) })}
          />
          <div className="flex gap-1.5">
            <button type="button" className="ilv-btn ilv-btn-secondary flex-1 text-xs" onClick={() => shiftAll(-200)}>
              Shift −200ms
            </button>
            <button type="button" className="ilv-btn ilv-btn-secondary flex-1 text-xs" onClick={() => shiftAll(200)}>
              Shift +200ms
            </button>
          </div>
        </div>
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

      <div className="ilv-lyrics-track">
        <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-[var(--ss-muted)]">
          <span>Panel timeline</span>
          <span>
            {formatTimecode(sceneTimeMs)} / {formatTimecode(duration)}
          </span>
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
                width: Math.max(28, (line.endMs - line.startMs) * pxPerMs),
                top: 18,
              }}
              title={line.text}
              onPointerDown={(e) => {
                if ((e.target as HTMLElement).closest('.ilv-lyric-delete')) return;
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
              <span className="ilv-lyric-block-text">{line.text}</span>
              <button
                type="button"
                className="ilv-lyric-delete"
                aria-label={`Delete lyric: ${line.text}`}
                title="Delete line"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(lyrics.filter((l) => l.id !== line.id));
                }}
              >
                <Trash2 className="h-3 w-3" />
              </button>
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
            <button
              type="button"
              className="ilv-tool-btn"
              title="Delete line"
              aria-label={`Delete lyric line ${i + 1}`}
              onClick={() => onChange(lyrics.filter((l) => l.id !== line.id))}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {statusMsg && <p className="text-xs text-[var(--ss-muted)]">{statusMsg}</p>}
    </div>
  );
}
