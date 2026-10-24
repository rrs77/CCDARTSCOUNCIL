import React, { useMemo, useRef, useState } from 'react';
import { Mic, Music2, Plus, Volume2, VolumeX, Headphones } from 'lucide-react';
import type { AudioClip, AudioLaneKind, InteractiveLesson, ManualAdvanceAudioMode, VolumeKeyframe } from '../../types';
import { createId, formatTimecode } from '../../types';
import {
  buildWaveformBars,
  emptyAudioClip,
  sceneLayoutMs,
  sceneLayoutOffsets,
  snapToSceneBoundary,
  snapToTimelineGuides,
} from '../../utils/timelineAudio';

interface AudioTracksProps {
  lesson: InteractiveLesson;
  elapsedMs: number;
  pxPerMs: number;
  onChange: (patch: Partial<InteractiveLesson>) => void;
  onSeek: (ms: number) => void;
}

type DragMode = 'move' | 'resize-l' | 'resize-r' | 'fade-in' | 'fade-out' | 'curve';

export function AudioTracks({ lesson, elapsedMs, pxPerMs, onChange, onSeek }: AudioTracksProps) {
  const { starts, total } = useMemo(() => sceneLayoutOffsets(lesson.scenes), [lesson.scenes]);
  const clips = lesson.audioClips || [];
  const mix = lesson.audioMix || {};
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const trackWidth = Math.max(320, total * pxPerMs);

  const laneMuted = (kind: AudioLaneKind) =>
    mix.lanes?.find((l) => l.kind === kind)?.muted ?? false;
  const laneSolo = (kind: AudioLaneKind) =>
    mix.lanes?.find((l) => l.kind === kind)?.solo ?? false;

  const patchLane = (kind: AudioLaneKind, patch: { muted?: boolean; solo?: boolean }) => {
    const lanes = [...(mix.lanes || [])];
    const idx = lanes.findIndex((l) => l.kind === kind);
    if (idx >= 0) lanes[idx] = { ...lanes[idx], ...patch };
    else lanes.push({ kind, ...patch });
    onChange({ audioMix: { ...mix, lanes } });
  };

  const updateClip = (id: string, patch: Partial<AudioClip>) => {
    onChange({
      audioClips: clips.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };

  const removeClip = (id: string) => {
    onChange({ audioClips: clips.filter((c) => c.id !== id) });
    if (selectedId === id) setSelectedId(null);
  };

  const addClip = (lane: AudioLaneKind, mediaUrl: string, name: string, mediaId?: string, durationMs?: number) => {
    const clip = emptyAudioClip(lane, {
      mediaUrl,
      name,
      mediaId,
      startMs: snapToSceneBoundary(elapsedMs, lesson.scenes),
      durationMs: durationMs || Math.min(12000, Math.max(4000, total - elapsedMs || 8000)),
      loop: lane === 'music',
    });
    onChange({ audioClips: [...clips, clip] });
    setSelectedId(clip.id);
  };

  const onLaneDrop = (lane: AudioLaneKind, e: React.DragEvent) => {
    e.preventDefault();
    const raw =
      e.dataTransfer.getData('application/ilv-freemedia') ||
      e.dataTransfer.getData('application/ilv-audio') ||
      e.dataTransfer.getData('application/ilv-media');
    if (!raw) return;
    try {
      const m = JSON.parse(raw) as {
        url: string;
        name?: string;
        title?: string;
        id?: string;
        durationMs?: number;
        kind?: string;
        mediaType?: string;
      };
      if (!m.url) return;
      const isAudio =
        m.mediaType === 'audio' || m.kind === 'audio' || /\.(mp3|wav|m4a|ogg|webm)(\?|$)/i.test(m.url);
      if (!isAudio && m.kind === 'image') return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left + (e.currentTarget as HTMLElement).scrollLeft;
      const startMs = snapToSceneBoundary(x / pxPerMs, lesson.scenes);
      const clip = emptyAudioClip(lane, {
        mediaUrl: m.url,
        name: m.title || m.name || 'Audio',
        mediaId: m.id,
        startMs,
        durationMs: m.durationMs || 8000,
        fadeInMs: lane === 'music' ? 400 : 0,
        fadeOutMs: lane === 'music' ? 600 : 0,
        volume: lane === 'music' ? 0.85 : 1,
        loop: lane === 'music',
      });
      onChange({ audioClips: [...clips, clip] });
      setSelectedId(clip.id);
    } catch {
      /* ignore */
    }
  };

  const beginDrag = (
    e: React.PointerEvent,
    clip: AudioClip,
    mode: DragMode,
    curveIndex?: number,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(clip.id);
    const startX = e.clientX;
    const origStart = clip.startMs;
    const origDur = clip.durationMs;
    const origFadeIn = clip.fadeInMs || 0;
    const origFadeOut = clip.fadeOutMs || 0;
    const origCurve = [...(clip.volumeCurve || [{ t: 0, gain: 1 }, { t: 1, gain: 1 }])];

    const otherEdges = clips
      .filter((c) => c.id !== clip.id)
      .flatMap((c) => [c.startMs, c.startMs + c.durationMs]);
    const guides = [elapsedMs, ...otherEdges];
    const snap = (v: number, altKey: boolean) =>
      altKey ? Math.max(0, Math.min(total, v)) : snapToTimelineGuides(v, lesson.scenes, guides);

    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / pxPerMs;
      if (mode === 'move') {
        const next = snap(Math.max(0, origStart + dx), ev.altKey);
        updateClip(clip.id, { startMs: Math.min(next, Math.max(0, total - origDur)) });
      } else if (mode === 'resize-l') {
        let start = snap(origStart + dx, ev.altKey);
        let dur = origDur - (start - origStart);
        if (dur < 500) {
          start = origStart + origDur - 500;
          dur = 500;
        }
        const delta = start - origStart;
        updateClip(clip.id, {
          startMs: Math.max(0, start),
          durationMs: dur,
          // Keep source in/out aligned when trimming the left edge (Vids-style).
          trimStartMs: Math.max(0, (clip.trimStartMs || 0) + delta),
        });
      } else if (mode === 'resize-r') {
        const end = snap(origStart + origDur + dx, ev.altKey);
        updateClip(clip.id, { durationMs: Math.max(500, end - origStart) });
      } else if (mode === 'fade-in') {
        updateClip(clip.id, {
          fadeInMs: Math.max(0, Math.min(origDur / 2, origFadeIn + dx)),
        });
      } else if (mode === 'fade-out') {
        updateClip(clip.id, {
          fadeOutMs: Math.max(0, Math.min(origDur / 2, origFadeOut - dx)),
        });
      } else if (mode === 'curve' && curveIndex != null) {
        const t = Math.max(0.02, Math.min(0.98, origCurve[curveIndex].t + dx / Math.max(1, origDur)));
        const gain = Math.max(
          0,
          Math.min(1, origCurve[curveIndex].gain - (ev.clientY - e.clientY) / 60),
        );
        const next: VolumeKeyframe[] = origCurve.map((p, i) => (i === curveIndex ? { t, gain } : p));
        updateClip(clip.id, { volumeCurve: next });
      }
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const addCurvePoint = (clip: AudioClip, clientX: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const t = Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));
    const curve = [...(clip.volumeCurve || [{ t: 0, gain: 1 }, { t: 1, gain: 1 }])];
    curve.push({ t, gain: clip.volume ?? 1 });
    curve.sort((a, b) => a.t - b.t);
    updateClip(clip.id, { volumeCurve: curve });
  };

  const startRecording = async (lane: AudioLaneKind) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (ev) => {
        if (ev.data.size) chunksRef.current.push(ev.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const itemId = createId('media');
        const mediaLibrary = [
          ...lesson.mediaLibrary,
          {
            id: itemId,
            name: `Voiceover ${new Date().toLocaleTimeString()}`,
            kind: 'audio' as const,
            url,
            durationMs: 8000,
            addedAt: new Date().toISOString(),
          },
        ];
        const clip = emptyAudioClip(lane, {
          mediaUrl: url,
          name: 'Recorded voiceover',
          mediaId: itemId,
          startMs: snapToSceneBoundary(elapsedMs, lesson.scenes),
          durationMs: 8000,
        });
        onChange({ mediaLibrary, audioClips: [...clips, clip] });
        setSelectedId(clip.id);
        setRecording(false);
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setRecording(false);
      window.alert('Microphone access is required to record a voiceover.');
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
  };

  const selected = clips.find((c) => c.id === selectedId) || null;

  const renderLane = (kind: AudioLaneKind) => {
    const label = kind === 'voiceover' ? 'Voiceover' : 'Music';
    const color = kind === 'voiceover' ? '#14B8A6' : '#6366F1';
    const laneClips = clips.filter((c) => c.lane === kind);
    return (
      <div className={`ilv-audio-lane is-${kind}`} key={kind}>
        <div className="ilv-audio-lane-meta">
          <span className="ilv-audio-lane-label" style={{ color }}>
            {kind === 'voiceover' ? <Mic className="h-3.5 w-3.5" /> : <Music2 className="h-3.5 w-3.5" />}
            {label}
          </span>
          <button
            type="button"
            className={`ilv-tool-btn ${laneMuted(kind) ? 'is-active' : ''}`}
            title="Mute lane"
            onClick={() => patchLane(kind, { muted: !laneMuted(kind) })}
          >
            {laneMuted(kind) ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            className={`ilv-tool-btn ${laneSolo(kind) ? 'is-active' : ''}`}
            title="Solo lane"
            onClick={() => patchLane(kind, { solo: !laneSolo(kind) })}
          >
            <Headphones className="h-3.5 w-3.5" />
          </button>
        </div>
        <div
          className="ilv-audio-lane-track"
          style={{ width: trackWidth }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onLaneDrop(kind, e)}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('.ilv-audio-clip')) return;
            const rect = e.currentTarget.getBoundingClientRect();
            onSeek(((e.clientX - rect.left) / pxPerMs) || 0);
            setSelectedId(null);
          }}
        >
          {/* scene tick marks */}
          {starts.map((s, i) => (
            <div
              key={lesson.scenes[i]?.id || i}
              className="ilv-audio-scene-tick"
              style={{ left: s * pxPerMs, width: sceneLayoutMs(lesson.scenes[i]) * pxPerMs }}
            />
          ))}
          <div className="ilv-audio-playhead" style={{ left: elapsedMs * pxPerMs }} />
          {laneClips.map((clip) => {
            const bars = buildWaveformBars(clip.id + clip.mediaUrl);
            const active = selectedId === clip.id;
            const fadeInW = ((clip.fadeInMs || 0) / Math.max(1, clip.durationMs)) * 100;
            const fadeOutW = ((clip.fadeOutMs || 0) / Math.max(1, clip.durationMs)) * 100;
            const curve = clip.volumeCurve || [
              { t: 0, gain: clip.volume ?? 1 },
              { t: 1, gain: clip.volume ?? 1 },
            ];
            return (
              <div
                key={clip.id}
                className={`ilv-audio-clip ${active ? 'is-active' : ''}`}
                style={{
                  left: clip.startMs * pxPerMs,
                  width: Math.max(24, clip.durationMs * pxPerMs),
                  ['--ilv-audio-clip-color' as string]: color,
                }}
                title={`${clip.name} · ${formatTimecode(clip.startMs)}–${formatTimecode(clip.startMs + clip.durationMs)}`}
                onPointerDown={(e) => beginDrag(e, clip, 'move')}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  addCurvePoint(clip, e.clientX, e.currentTarget);
                }}
              >
                <div className="ilv-audio-clip-wave" aria-hidden>
                  {bars.map((a, i) => (
                    <span key={i} style={{ height: `${a * 100}%` }} />
                  ))}
                </div>
                <svg className="ilv-audio-curve" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="rgba(255,255,255,0.85)"
                    strokeWidth="2"
                    points={curve.map((p) => `${p.t * 100},${100 - p.gain * 100}`).join(' ')}
                  />
                </svg>
                {fadeInW > 0 && <div className="ilv-audio-fade is-in" style={{ width: `${fadeInW}%` }} />}
                {fadeOutW > 0 && <div className="ilv-audio-fade is-out" style={{ width: `${fadeOutW}%` }} />}
                <span className="ilv-audio-clip-name">{clip.name}</span>
                <button
                  type="button"
                  className="ilv-audio-handle is-left"
                  aria-label="Trim start"
                  onPointerDown={(e) => beginDrag(e, clip, 'resize-l')}
                />
                <button
                  type="button"
                  className="ilv-audio-handle is-right"
                  aria-label="Trim end"
                  onPointerDown={(e) => beginDrag(e, clip, 'resize-r')}
                />
                <button
                  type="button"
                  className="ilv-audio-fade-handle is-in"
                  aria-label="Fade in"
                  style={{ left: `${fadeInW}%` }}
                  onPointerDown={(e) => beginDrag(e, clip, 'fade-in')}
                />
                <button
                  type="button"
                  className="ilv-audio-fade-handle is-out"
                  aria-label="Fade out"
                  style={{ right: `${fadeOutW}%` }}
                  onPointerDown={(e) => beginDrag(e, clip, 'fade-out')}
                />
                {active &&
                  curve.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      className="ilv-audio-curve-pt"
                      style={{ left: `${p.t * 100}%`, top: `${(1 - p.gain) * 100}%` }}
                      aria-label="Volume point"
                      onPointerDown={(e) => beginDrag(e, clip, 'curve', i)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (curve.length <= 2) return;
                        updateClip(clip.id, { volumeCurve: curve.filter((_, j) => j !== i) });
                      }}
                    />
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="ilv-audio-tracks">
      <div className="ilv-audio-tracks-head">
        <strong>Audio tracks</strong>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            className="ilv-btn ilv-btn-secondary text-[11px]"
            onClick={() => {
              const audio = lesson.mediaLibrary.find((m) => m.kind === 'audio');
              if (audio) addClip('voiceover', audio.url, audio.name, audio.id, audio.durationMs);
              else window.alert('Add an audio URL to the media library first, or record a voiceover.');
            }}
          >
            <Plus className="h-3 w-3" />
            Add voiceover
          </button>
          <button
            type="button"
            className="ilv-btn ilv-btn-secondary text-[11px]"
            onClick={() => {
              const audio = lesson.mediaLibrary.find((m) => m.kind === 'audio');
              if (audio) addClip('music', audio.url, audio.name, audio.id, audio.durationMs);
              else window.alert('Add an audio URL to the media library first.');
            }}
          >
            <Plus className="h-3 w-3" />
            Add music
          </button>
          <button
            type="button"
            className={`ilv-btn text-[11px] ${recording ? 'ilv-btn-primary' : 'ilv-btn-secondary'}`}
            onClick={() => (recording ? stopRecording() : void startRecording('voiceover'))}
          >
            <Mic className="h-3 w-3" />
            {recording ? 'Stop recording' : 'Record voiceover'}
          </button>
        </div>
      </div>

      <div className="ilv-audio-tracks-scroll">
        {renderLane('voiceover')}
        {renderLane('music')}
      </div>

      <div className="ilv-audio-mix-opts">
        <label className="flex items-center gap-1.5 text-[11px] font-semibold">
          <input
            type="checkbox"
            checked={mix.duckMusicUnderVoiceover !== false}
            onChange={(e) => onChange({ audioMix: { ...mix, duckMusicUnderVoiceover: e.target.checked } })}
          />
          Duck music under voiceover
        </label>
        <label className="flex items-center gap-1 text-[11px] font-semibold text-[var(--ss-muted)]">
          Amount
          <input
            className="ilv-input min-h-[28px] w-16 py-0.5 text-xs"
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={mix.duckAmount ?? 0.7}
            onChange={(e) =>
              onChange({ audioMix: { ...mix, duckAmount: Math.max(0, Math.min(1, Number(e.target.value) || 0)) } })
            }
          />
        </label>
        <label className="flex items-center gap-1 text-[11px] font-semibold text-[var(--ss-muted)]">
          Manual scenes
          <select
            className="ilv-select min-h-[28px] py-0.5 text-xs"
            value={mix.manualAdvanceMusic || 'keep-playing'}
            onChange={(e) =>
              onChange({
                audioMix: { ...mix, manualAdvanceMusic: e.target.value as ManualAdvanceAudioMode },
              })
            }
          >
            <option value="keep-playing">Keep music playing</option>
            <option value="pause-until-next">Pause until Next</option>
          </select>
        </label>
      </div>

      {selected && (
        <div className="ilv-audio-clip-inspector">
          <strong className="text-xs">{selected.name}</strong>
          <label className="ilv-label">Volume</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={selected.volume ?? 1}
            onChange={(e) => updateClip(selected.id, { volume: Number(e.target.value) })}
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="ilv-label">Fade in (ms)</label>
              <input
                className="ilv-input min-h-[32px] py-1 text-xs"
                type="number"
                min={0}
                value={selected.fadeInMs || 0}
                onChange={(e) => updateClip(selected.id, { fadeInMs: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
            <div>
              <label className="ilv-label">Fade out (ms)</label>
              <input
                className="ilv-input min-h-[32px] py-1 text-xs"
                type="number"
                min={0}
                value={selected.fadeOutMs || 0}
                onChange={(e) => updateClip(selected.id, { fadeOutMs: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
            <div>
              <label className="ilv-label">Source trim start (ms)</label>
              <input
                className="ilv-input min-h-[32px] py-1 text-xs"
                type="number"
                min={0}
                value={selected.trimStartMs || 0}
                onChange={(e) =>
                  updateClip(selected.id, { trimStartMs: Math.max(0, Number(e.target.value) || 0) })
                }
              />
            </div>
            <div>
              <label className="ilv-label">Duration (ms)</label>
              <input
                className="ilv-input min-h-[32px] py-1 text-xs"
                type="number"
                min={500}
                value={selected.durationMs}
                onChange={(e) =>
                  updateClip(selected.id, { durationMs: Math.max(500, Number(e.target.value) || 500) })
                }
              />
            </div>
          </div>
          {selected.lane === 'music' && (
            <label className="flex items-center gap-1.5 text-xs font-semibold">
              <input
                type="checkbox"
                checked={Boolean(selected.loop)}
                onChange={(e) => updateClip(selected.id, { loop: e.target.checked })}
              />
              Loop across lesson span
            </label>
          )}
          <p className="text-[10px] text-[var(--ss-muted)]">
            Double-click clip to add a volume curve point. Double-click a point to delete.
          </p>
          <button type="button" className="ilv-btn ilv-btn-secondary text-xs" onClick={() => removeClip(selected.id)}>
            Remove clip
          </button>
        </div>
      )}
    </div>
  );
}
