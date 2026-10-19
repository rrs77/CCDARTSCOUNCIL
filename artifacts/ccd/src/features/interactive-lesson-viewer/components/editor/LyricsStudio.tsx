import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Play,
  Pause,
  Mic,
  Pointer,
  Sparkles,
  AlignLeft,
  Trash2,
  Settings2,
  Split,
  Merge,
  Plus,
  SkipBack,
} from 'lucide-react';
import type { KaraokeTracks, LyricLine, LyricsDisplayOptions, Scene } from '../../types';
import {
  DEFAULT_LYRICS_DISPLAY,
  TEXT_FONT_OPTIONS,
  formatTimecode,
  createId,
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
import { normaliseCloudLink, sceneTypeToCloudKind } from '../../utils/cloudLinks';

interface LyricsStudioProps {
  scene: Scene;
  sceneTimeMs: number;
  playing: boolean;
  focusLineId?: string | null;
  authToken?: string | null;
  onClose: () => void;
  onChange: (lyrics: LyricLine[]) => void;
  onChangeDisplay: (display: LyricsDisplayOptions) => void;
  onChangeKaraoke: (tracks: KaraokeTracks) => void;
  onSeek: (ms: number) => void;
  onTogglePlay: () => void;
  onSetMediaUrl?: (url: string) => void;
}

type StudioTab = 'timing' | 'display' | 'tracks';

function buildBars(seed: string, count = 120): number[] {
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
  return bars;
}

export function LyricsStudio({
  scene,
  sceneTimeMs,
  playing,
  focusLineId,
  authToken,
  onClose,
  onChange,
  onChangeDisplay,
  onChangeKaraoke,
  onSeek,
  onTogglePlay,
  onSetMediaUrl,
}: LyricsStudioProps) {
  const [tab, setTab] = useState<StudioTab>('timing');
  const [paste, setPaste] = useState('');
  const [tapIndex, setTapIndex] = useState(0);
  const [tapMode, setTapMode] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [providerMsg, setProviderMsg] = useState('Checking transcription…');
  const [providerOk, setProviderOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(focusLineId || null);
  const [vocalDraft, setVocalDraft] = useState(scene.karaokeTracks?.vocalUrl || scene.mediaUrl || '');
  const [backingDraft, setBackingDraft] = useState(scene.karaokeTracks?.backingUrl || '');
  const waveRef = useRef<HTMLDivElement>(null);

  const lyrics = scene.lyrics || [];
  const duration = Math.max(1, scene.durationMs || 1);
  const display = { ...DEFAULT_LYRICS_DISPLAY, ...scene.lyricsDisplay };
  const karaoke = scene.karaokeTracks || {};
  const bars = useMemo(
    () => buildBars(scene.id + (scene.karaokeTracks?.vocalUrl || scene.mediaUrl || '')),
    [scene.id, scene.karaokeTracks?.vocalUrl, scene.mediaUrl],
  );

  useEffect(() => {
    void getTranscriptionProviderStatus().then((s) => {
      setProviderOk(s.available);
      setProviderMsg(s.message);
    });
  }, []);

  useEffect(() => {
    if (focusLineId) setSelectedLineId(focusLineId);
  }, [focusLineId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === ' ' && !(e.target as HTMLElement)?.closest('input, textarea, [contenteditable]')) {
        e.preventDefault();
        onTogglePlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onTogglePlay]);

  const patchDisplay = (patch: Partial<LyricsDisplayOptions>) => {
    onChangeDisplay({ ...display, ...patch });
  };

  const updateLine = (id: string, patch: Partial<LyricLine>) => {
    onChange(lyrics.map((l) => (l.id === id ? { ...l, ...patch } : l)));
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
    setStatusMsg('Lyrics auto-aligned evenly — drag blocks to refine.');
  };

  const handleTranscribe = async () => {
    const vocal = karaoke.vocalUrl || scene.mediaUrl;
    if (!vocal) {
      setStatusMsg('Add a vocal track URL first (Tracks tab). Auto-sync runs on the vocal.');
      setTab('tracks');
      return;
    }
    setBusy(true);
    setStatusMsg('Transcribing vocal track…');
    const result = await transcribeAudioForLyrics(vocal, authToken);
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
    const line: LyricLine = {
      id: createId('ly'),
      text: 'New line',
      startMs: start,
      endMs: Math.min(duration, start + 2000),
    };
    onChange([...lyrics, line]);
    setSelectedLineId(line.id);
  };

  const splitLine = (id: string) => {
    const idx = lyrics.findIndex((l) => l.id === id);
    if (idx < 0) return;
    const line = lyrics[idx];
    const mid = Math.floor((line.startMs + line.endMs) / 2);
    const words = line.text.split(/\s+/);
    const half = Math.max(1, Math.floor(words.length / 2));
    const a: LyricLine = {
      ...line,
      id: createId('ly'),
      text: words.slice(0, half).join(' ') || line.text,
      endMs: mid,
    };
    const b: LyricLine = {
      ...line,
      id: createId('ly'),
      text: words.slice(half).join(' ') || '…',
      startMs: mid,
    };
    const next = [...lyrics];
    next.splice(idx, 1, a, b);
    onChange(next);
    setSelectedLineId(b.id);
  };

  const mergeWithNext = (id: string) => {
    const idx = lyrics.findIndex((l) => l.id === id);
    if (idx < 0 || idx >= lyrics.length - 1) return;
    const a = lyrics[idx];
    const b = lyrics[idx + 1];
    const merged: LyricLine = {
      ...a,
      text: `${a.text} ${b.text}`.trim(),
      endMs: b.endMs,
      words: undefined,
    };
    const next = [...lyrics];
    next.splice(idx, 2, merged);
    onChange(next);
    setSelectedLineId(merged.id);
  };

  const applyTracks = () => {
    const vocalNorm = vocalDraft.trim()
      ? normaliseCloudLink(vocalDraft.trim(), sceneTypeToCloudKind('lyrics'))
      : null;
    const backingNorm = backingDraft.trim()
      ? normaliseCloudLink(backingDraft.trim(), sceneTypeToCloudKind('lyrics'))
      : null;
    const vocalUrl = vocalNorm?.streamUrl || vocalDraft.trim() || undefined;
    const backingUrl = backingNorm?.streamUrl || backingDraft.trim() || undefined;
    const defaultVersion = karaoke.defaultVersion || 'vocals';
    onChangeKaraoke({
      vocalUrl,
      backingUrl,
      defaultVersion,
    });
    if (vocalUrl && onSetMediaUrl) {
      const active = defaultVersion === 'backing' && backingUrl ? backingUrl : vocalUrl;
      onSetMediaUrl(active);
    }
    setStatusMsg('Tracks saved — vocal is used for Whisper auto-sync.');
  };

  const seekFromClientX = (clientX: number) => {
    const el = waveRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  };

  return createPortal(
    <div className="ilv-lyrics-studio" role="dialog" aria-modal="true" aria-label="Lyric video Studio">
      <div className="ilv-lyrics-studio-sheet">
        <header className="ilv-lyrics-studio-head">
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-[var(--ss-ink)]">Lyric video Studio</h2>
            <p className="text-xs text-[var(--ss-muted)]">
              Edit lines, drag timing on the waveform, tap-sync or auto-transcribe the vocal track.
            </p>
          </div>
          <button type="button" className="ilv-tool-btn" onClick={onClose} aria-label="Close Lyric video Studio">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="ilv-lyrics-studio-body">
          <aside className="ilv-lyrics-studio-list">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <button type="button" className="ilv-btn ilv-btn-secondary text-xs" onClick={addBlankLine}>
                <Plus className="h-3.5 w-3.5" />
                Line
              </button>
              <button type="button" className="ilv-btn ilv-btn-secondary text-xs" onClick={handleAutoAlign}>
                <AlignLeft className="h-3.5 w-3.5" />
                Align
              </button>
            </div>
            <label className="ilv-label">Paste / import</label>
            <textarea
              className="ilv-textarea mb-2 min-h-[72px] text-xs"
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder={'One line per row…\nClap your hands…'}
            />
            {lyrics.length === 0 && (
              <p className="text-xs text-[var(--ss-muted)]">No lines yet — paste above and Align, or Auto-sync.</p>
            )}
            {lyrics.map((line, i) => {
              const active = sceneTimeMs >= line.startMs && sceneTimeMs < line.endMs;
              return (
                <div
                  key={line.id}
                  className={`ilv-ls-line-row ${selectedLineId === line.id || active ? 'is-active' : ''}`}
                >
                  <span className="w-5 shrink-0 pt-2 text-[10px] font-bold text-[var(--ss-muted)]">{i + 1}</span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <input
                      className="ilv-input min-h-[32px] py-1 text-xs"
                      value={line.text}
                      onFocus={() => setSelectedLineId(line.id)}
                      onChange={(e) => updateLine(line.id, { text: e.target.value })}
                    />
                    <div className="flex flex-wrap items-center gap-1 text-[10px] text-[var(--ss-muted)]">
                      <button
                        type="button"
                        className="ilv-tool-btn"
                        title="Seek to line"
                        onClick={() => {
                          setSelectedLineId(line.id);
                          onSeek(line.startMs);
                        }}
                      >
                        {formatTimecode(line.startMs)}
                      </button>
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
                        title="Split line"
                        onClick={() => splitLine(line.id)}
                      >
                        <Split className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        className="ilv-tool-btn"
                        title="Merge with next"
                        onClick={() => mergeWithNext(line.id)}
                      >
                        <Merge className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        className="ilv-tool-btn"
                        title="Delete"
                        onClick={() => onChange(lyrics.filter((l) => l.id !== line.id))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </aside>

          <div className="ilv-lyrics-studio-main">
            <div className="ilv-lyrics-studio-tabs">
              {(
                [
                  ['timing', 'Timing'],
                  ['display', 'Display'],
                  ['tracks', 'Tracks'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`ilv-lyrics-studio-tab ${tab === id ? 'is-on' : ''}`}
                  onClick={() => setTab(id)}
                >
                  {id === 'display' && <Settings2 className="mr-1 inline h-3.5 w-3.5" />}
                  {label}
                </button>
              ))}
            </div>

            {tab === 'timing' && (
              <>
                <div
                  ref={waveRef}
                  className="ilv-lyrics-studio-wave"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('.ilv-ls-block')) return;
                    seekFromClientX(e.clientX);
                  }}
                >
                  <div className="ilv-lyrics-studio-wave-bars" aria-hidden>
                    {bars.map((amp, i) => (
                      <span
                        key={i}
                        className={sceneTimeMs / duration >= i / bars.length ? 'is-played' : ''}
                        style={{ height: `${amp * 100}%` }}
                      />
                    ))}
                  </div>
                  <div
                    className="ilv-audio-playhead"
                    style={{ left: `${(sceneTimeMs / duration) * 100}%`, zIndex: 5 }}
                  />
                  {lyrics.map((line) => {
                    const left = (line.startMs / duration) * 100;
                    const width = Math.max(1.2, ((line.endMs - line.startMs) / duration) * 100);
                    const active = sceneTimeMs >= line.startMs && sceneTimeMs < line.endMs;
                    return (
                      <div
                        key={line.id}
                        className={`ilv-ls-block ${active || selectedLineId === line.id ? 'is-active' : ''}`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        title={line.text}
                        onPointerDown={(e) => {
                          if ((e.target as HTMLElement).closest('.ilv-lyrics-lane-handle')) return;
                          e.stopPropagation();
                          e.preventDefault();
                          setSelectedLineId(line.id);
                          const startX = e.clientX;
                          const origS = line.startMs;
                          const origE = line.endMs;
                          const trackW = waveRef.current?.getBoundingClientRect().width || 1;
                          const move = (ev: PointerEvent) => {
                            const dMs = ((ev.clientX - startX) / trackW) * duration;
                            onChange(resizeLyric(lyrics, line.id, origS + dMs, origE + dMs, duration));
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
                            const trackW = waveRef.current?.getBoundingClientRect().width || 1;
                            const move = (ev: PointerEvent) => {
                              const dMs = ((ev.clientX - startX) / trackW) * duration;
                              onChange(resizeLyric(lyrics, line.id, origS + dMs, line.endMs, duration));
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
                            const trackW = waveRef.current?.getBoundingClientRect().width || 1;
                            const move = (ev: PointerEvent) => {
                              const dMs = ((ev.clientX - startX) / trackW) * duration;
                              onChange(resizeLyric(lyrics, line.id, line.startMs, origE + dMs, duration));
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

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="ilv-btn ilv-btn-secondary text-xs"
                    onClick={() => onSeek(0)}
                    title="Back to start"
                  >
                    <SkipBack className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className="ilv-play-btn" onClick={onTogglePlay} aria-label={playing ? 'Pause' : 'Play'}>
                    {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
                  </button>
                  <span className="tabular-nums text-sm font-semibold">
                    {formatTimecode(sceneTimeMs)} / {formatTimecode(duration)}
                  </span>
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
                  <button
                    type="button"
                    className="ilv-btn ilv-btn-primary text-xs"
                    disabled={busy || !providerOk}
                    onClick={handleTranscribe}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Auto-sync (Whisper)
                  </button>
                </div>
                {tapMode && (
                  <button type="button" className="ilv-btn ilv-btn-primary w-full" onClick={handleTap}>
                    <Mic className="h-4 w-4" />
                    Tap now — line {Math.min(tapIndex + 1, lyrics.length || 1)} ({formatTimecode(sceneTimeMs)})
                  </button>
                )}
                <div
                  className="rounded-[12px] border border-[var(--ss-line)] p-2 text-xs"
                  style={{ background: providerOk ? 'var(--ss-mint)' : 'var(--ss-suntint)' }}
                >
                  {providerMsg}
                </div>
              </>
            )}

            {tab === 'display' && (
              <div className="space-y-3 overflow-y-auto pr-1">
                <p className="text-xs text-[var(--ss-muted)]">
                  Lyric video look on the stage — kept here so the side panel stays uncluttered.
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
                <ColorSwatchPicker
                  label="Past colour"
                  compact
                  value={display.pastColor || 'rgba(255,255,255,0.28)'}
                  onChange={(c) => patchDisplay({ pastColor: c })}
                />
                <div className="flex flex-wrap gap-3">
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
                {display.background && (
                  <ColorSwatchPicker
                    label="Backdrop colour"
                    value={display.backgroundColor || 'rgba(31,27,77,0.55)'}
                    onChange={(c) => patchDisplay({ backgroundColor: c })}
                  />
                )}
                <label className="ilv-label">Lead-in shift (ms)</label>
                <input
                  className="ilv-input"
                  type="number"
                  min={0}
                  max={3000}
                  step={100}
                  value={display.leadInMs || 0}
                  onChange={(e) => patchDisplay({ leadInMs: Math.max(0, Number(e.target.value) || 0) })}
                />
              </div>
            )}

            {tab === 'tracks' && (
              <div className="space-y-3 overflow-y-auto pr-1">
                <p className="text-xs text-[var(--ss-muted)]">
                  Lyric video scenes keep a <strong>vocal</strong> (full) and <strong>backing</strong> (instrumental)
                  track time-aligned. Auto-sync always uses the vocal. Players can switch versions live.
                </p>
                <label className="ilv-label">Vocal track (full version)</label>
                <input
                  className="ilv-input"
                  value={vocalDraft}
                  onChange={(e) => setVocalDraft(e.target.value)}
                  placeholder="https://… or cloud share link"
                />
                <label className="ilv-label">Backing track (instrumental)</label>
                <input
                  className="ilv-input"
                  value={backingDraft}
                  onChange={(e) => setBackingDraft(e.target.value)}
                  placeholder="https://… optional"
                />
                <label className="ilv-label">Default in player</label>
                <div className="flex gap-1.5">
                  {(['vocals', 'backing'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`ilv-btn flex-1 text-xs ${
                        (karaoke.defaultVersion || 'vocals') === v ? 'ilv-btn-primary' : 'ilv-btn-secondary'
                      }`}
                      onClick={() =>
                        onChangeKaraoke({
                          ...karaoke,
                          vocalUrl: vocalDraft.trim() || karaoke.vocalUrl,
                          backingUrl: backingDraft.trim() || karaoke.backingUrl,
                          defaultVersion: v,
                        })
                      }
                    >
                      {v === 'vocals' ? 'With vocals' : 'Backing only'}
                    </button>
                  ))}
                </div>
                <button type="button" className="ilv-btn ilv-btn-primary w-full" onClick={applyTracks}>
                  Save tracks
                </button>
              </div>
            )}

            {statusMsg && <p className="text-xs text-[var(--ss-muted)]">{statusMsg}</p>}
          </div>
        </div>

        <footer className="ilv-lyrics-studio-foot">
          <span className="text-xs text-[var(--ss-muted)]">
            {lyrics.length} line{lyrics.length === 1 ? '' : 's'} · Esc to close · Space play/pause
          </span>
          <button type="button" className="ilv-btn ilv-btn-primary text-xs" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
