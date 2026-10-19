import { useEffect, useRef } from 'react';
import type { AudioClip, InteractiveLesson } from '../types';
import { resolveAdvanceMode } from '../types';
import { applyFadeEnvelope, sampleVolumeCurve } from '../utils/timelineAudio';
import { sceneLayoutOffsets } from '../utils/timelineAudio';

/**
 * Mixes lesson audioClips with Web Audio GainNodes, synced to absolute
 * lesson timeline time. Continues across scene transitions when clips span.
 */
export function useLessonAudioMixer(
  lesson: InteractiveLesson,
  absoluteMs: number,
  playing: boolean,
  sceneIndex: number,
) {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<
    Map<
      string,
      {
        el: HTMLAudioElement;
        src: MediaElementAudioSourceNode;
        gain: GainNode;
      }
    >
  >(null!);
  if (!nodesRef.current) nodesRef.current = new Map();

  useEffect(() => {
    return () => {
      nodesRef.current.forEach((n) => {
        try {
          n.el.pause();
          n.el.src = '';
        } catch {
          /* ignore */
        }
      });
      nodesRef.current.clear();
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  useEffect(() => {
    const clips = lesson.audioClips || [];
    const mix = lesson.audioMix || {};
    const { starts } = sceneLayoutOffsets(lesson.scenes);
    const scene = lesson.scenes[sceneIndex];
    const isManual = scene ? resolveAdvanceMode(scene) === 'manual' : false;
    const pauseMusic =
      isManual && (mix.manualAdvanceMusic || 'keep-playing') === 'pause-until-next' && !playing;

    const ensureCtx = () => {
      if (!ctxRef.current) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ctxRef.current = new AC();
      }
      return ctxRef.current;
    };

    const laneMuted = (lane: string) => mix.lanes?.find((l) => l.kind === lane)?.muted ?? false;
    const anySolo = mix.lanes?.some((l) => l.solo) ?? false;
    const laneSolo = (lane: string) => mix.lanes?.find((l) => l.kind === lane)?.solo ?? false;

    const voiceActive = clips.some(
      (c) =>
        c.lane === 'voiceover' &&
        absoluteMs >= c.startMs &&
        absoluteMs < c.startMs + c.durationMs &&
        !laneMuted('voiceover'),
    );

    const activeIds = new Set<string>();

    for (const clip of clips) {
      const local = absoluteMs - clip.startMs;
      const inRange = local >= 0 && local < clip.durationMs;
      if (!inRange) continue;
      if (laneMuted(clip.lane)) continue;
      if (anySolo && !laneSolo(clip.lane)) continue;
      if (clip.lane === 'music' && pauseMusic) continue;
      activeIds.add(clip.id);

      const ctx = ensureCtx();
      let node = nodesRef.current.get(clip.id);
      if (!node) {
        const el = new Audio();
        el.crossOrigin = 'anonymous';
        el.preload = 'auto';
        el.loop = Boolean(clip.loop);
        el.src = clip.mediaUrl;
        const src = ctx.createMediaElementSource(el);
        const gain = ctx.createGain();
        src.connect(gain);
        gain.connect(ctx.destination);
        node = { el, src, gain };
        nodesRef.current.set(clip.id, node);
      }

      if (node.el.loop !== Boolean(clip.loop)) node.el.loop = Boolean(clip.loop);

      const trim = clip.trimStartMs || 0;
      const sourceT = (trim + (clip.loop ? local % Math.max(1, clip.durationMs) : local)) / 1000;
      try {
        if (Math.abs(node.el.currentTime - sourceT) > 0.35) node.el.currentTime = Math.max(0, sourceT);
      } catch {
        /* ignore */
      }

      let g = sampleVolumeCurve(clip.volumeCurve, local / Math.max(1, clip.durationMs), clip.volume ?? 1);
      g = applyFadeEnvelope(g, local, clip.durationMs, clip.fadeInMs || 0, clip.fadeOutMs || 0);
      if (
        clip.lane === 'music' &&
        mix.duckMusicUnderVoiceover !== false &&
        voiceActive
      ) {
        g *= 1 - (mix.duckAmount ?? 0.7);
      }

      const now = ctx.currentTime;
      node.gain.gain.cancelScheduledValues(now);
      node.gain.gain.setValueAtTime(node.gain.gain.value, now);
      node.gain.gain.linearRampToValueAtTime(Math.max(0.0001, g), now + 0.05);

      if (playing || (clip.lane === 'music' && isManual && mix.manualAdvanceMusic !== 'pause-until-next')) {
        void ctx.resume();
        if (node.el.paused) void node.el.play().catch(() => undefined);
      } else if (!node.el.paused) {
        node.el.pause();
      }
    }

    // Pause nodes that are no longer active
    nodesRef.current.forEach((n, id) => {
      if (!activeIds.has(id) && !n.el.paused) n.el.pause();
    });
  }, [lesson, absoluteMs, playing, sceneIndex]);
}

/** Absolute lesson time from scene index + scene-local time (layout clock). */
export function absoluteLayoutMs(
  lesson: InteractiveLesson,
  sceneIndex: number,
  sceneTimeMs: number,
): number {
  const { starts } = sceneLayoutOffsets(lesson.scenes);
  return (starts[sceneIndex] || 0) + sceneTimeMs;
}

export type { AudioClip };
