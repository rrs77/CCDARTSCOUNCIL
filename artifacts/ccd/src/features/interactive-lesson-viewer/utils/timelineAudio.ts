import type { AudioClip, AudioLaneKind, InteractiveLesson, Scene, VolumeKeyframe } from '../types';
import { createId, sceneClockMs } from '../types';

/** Scene start offsets on the lesson clock (manual scenes contribute 0). */
export function sceneStartOffsets(scenes: Scene[]): number[] {
  const starts: number[] = [];
  let t = 0;
  for (const s of scenes) {
    starts.push(t);
    t += Math.max(0, sceneClockMs(s) || (s.durationMs > 0 ? s.durationMs : 0));
  }
  return starts;
}

/** Prefer wall-clock duration for timeline layout (manual scenes still occupy their durationMs when > 0, else a nominal slot). */
export function sceneLayoutMs(scene: Scene): number {
  if (scene.durationMs > 0) return scene.durationMs;
  return 4000; // nominal width for manual / zero-duration embeds
}

export function sceneLayoutOffsets(scenes: Scene[]): { starts: number[]; total: number } {
  const starts: number[] = [];
  let t = 0;
  for (const s of scenes) {
    starts.push(t);
    t += sceneLayoutMs(s);
  }
  return { starts, total: t };
}

export function snapToSceneBoundary(ms: number, scenes: Scene[], thresholdMs = 400): number {
  const { starts, total } = sceneLayoutOffsets(scenes);
  const bounds = [...starts, total];
  let best = ms;
  let bestDist = Infinity;
  for (const b of bounds) {
    const d = Math.abs(b - ms);
    if (d < bestDist && d <= thresholdMs) {
      bestDist = d;
      best = b;
    }
  }
  return Math.max(0, Math.min(total, best));
}

export function emptyAudioClip(
  lane: AudioLaneKind,
  partial: Partial<AudioClip> & { mediaUrl: string; name: string },
): AudioClip {
  return {
    id: createId('aclip'),
    lane,
    startMs: 0,
    durationMs: partial.durationMs || 8000,
    volume: 1,
    fadeInMs: 0,
    fadeOutMs: 0,
    volumeCurve: [
      { t: 0, gain: 1 },
      { t: 1, gain: 1 },
    ],
    loop: lane === 'music' ? false : false,
    ...partial,
  };
}

export function countMediaUsages(
  lesson: InteractiveLesson,
  item: { id?: string; url: string },
): { scenes: number; audioClips: number; total: number } {
  const url = item.url;
  const id = item.id;
  let scenes = 0;
  for (const s of lesson.scenes) {
    if (s.mediaUrl === url || s.embedUrl === url || (id && (s.mediaUrl?.includes(id) || s.embedUrl?.includes(id)))) {
      scenes += 1;
    }
  }
  let audioClips = 0;
  for (const c of lesson.audioClips || []) {
    if (c.mediaUrl === url || (id && c.mediaId === id)) audioClips += 1;
  }
  return { scenes, audioClips, total: scenes + audioClips };
}

/** Sample gain from a volume curve at normalised t (0–1). */
export function sampleVolumeCurve(curve: VolumeKeyframe[] | undefined, t: number, baseVolume = 1): number {
  const pts = (curve && curve.length ? [...curve] : [{ t: 0, gain: 1 }, { t: 1, gain: 1 }]).sort(
    (a, b) => a.t - b.t,
  );
  const x = Math.max(0, Math.min(1, t));
  if (x <= pts[0].t) return pts[0].gain * baseVolume;
  if (x >= pts[pts.length - 1].t) return pts[pts.length - 1].gain * baseVolume;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (x >= a.t && x <= b.t) {
      const u = (x - a.t) / Math.max(1e-6, b.t - a.t);
      return (a.gain + (b.gain - a.gain) * u) * baseVolume;
    }
  }
  return baseVolume;
}

export function applyFadeEnvelope(
  gain: number,
  localMs: number,
  durationMs: number,
  fadeInMs = 0,
  fadeOutMs = 0,
): number {
  let g = gain;
  if (fadeInMs > 0 && localMs < fadeInMs) g *= localMs / fadeInMs;
  if (fadeOutMs > 0 && localMs > durationMs - fadeOutMs) {
    g *= Math.max(0, (durationMs - localMs) / fadeOutMs);
  }
  return Math.max(0, Math.min(1, g));
}

/** Deterministic pseudo-waveform for clip thumbnails. */
export function buildWaveformBars(seed: string, count = 48): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const t = i / count;
    const envelope = 0.3 + 0.7 * Math.sin(Math.PI * t);
    bars.push(Math.max(0.1, Math.min(1, envelope * (0.35 + (h % 1000) / 1000))));
  }
  return bars;
}
