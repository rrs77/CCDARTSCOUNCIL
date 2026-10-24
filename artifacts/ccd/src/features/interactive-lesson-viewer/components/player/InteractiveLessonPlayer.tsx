import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  X,
  Mic2,
  Pencil,
  Music2,
} from 'lucide-react';
import type { InteractiveLesson, KaraokeTrackDefault, Scene } from '../../types';
import {
  formatTimecode,
  lessonDurationMs,
  resolveAdvanceMode,
  sceneClockMs,
} from '../../types';
import { SceneRenderer } from '../SceneRenderer';
import { isMediaDrivenScene, mediaStalled } from '../../utils/mediaClock';
import { absoluteLayoutMs, useLessonAudioMixer } from '../../hooks/useLessonAudioMixer';

interface InteractiveLessonPlayerProps {
  lesson: InteractiveLesson;
  onClose: () => void;
  startSceneIndex?: number;
  /** Player-only mode: no editor chrome; optional Edit for admins. */
  playerOnly?: boolean;
  canEdit?: boolean;
  onEdit?: () => void;
}

/** Lyric-video scenes that have timed lyric lines — only then show Lyrics on/off. */
function isLyricEnabledScene(scene: Scene | undefined): boolean {
  return Boolean(scene && scene.type === 'lyrics' && scene.lyrics && scene.lyrics.length > 0);
}

function transitionClass(type: string): string {
  switch (type) {
    case 'fade':
      return 'ilv-tr-fade-enter';
    case 'slide':
      return 'ilv-tr-slide-enter';
    case 'zoom':
      return 'ilv-tr-zoom-enter';
    case 'dissolve':
      return 'ilv-tr-dissolve-enter';
    case 'wipe-left':
      return 'ilv-tr-wipe-left-enter';
    case 'wipe-right':
      return 'ilv-tr-wipe-right-enter';
    case 'push-up':
      return 'ilv-tr-push-up-enter';
    case 'push-down':
      return 'ilv-tr-push-down-enter';
    case 'blur':
      return 'ilv-tr-blur-enter';
    case 'bounce':
      return 'ilv-tr-bounce-enter';
    case 'flip':
      return 'ilv-tr-flip-enter';
    default:
      return '';
  }
}

export function InteractiveLessonPlayer({
  lesson,
  onClose,
  startSceneIndex = 0,
  playerOnly = false,
  canEdit = false,
  onEdit,
}: InteractiveLessonPlayerProps) {
  const [sceneIndex, setSceneIndex] = useState(startSceneIndex);
  const [playing, setPlaying] = useState(true);
  const [showLyrics, setShowLyrics] = useState(true);
  const [sceneTimeMs, setSceneTimeMs] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [trKey, setTrKey] = useState(0);
  const [vocalVersion, setVocalVersion] = useState<KaraokeTrackDefault>(() => {
    const s = lesson.scenes[startSceneIndex];
    return s?.karaokeTracks?.defaultVersion || 'vocals';
  });
  const [showStrip, setShowStrip] = useState(false);
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const scene = lesson.scenes[sceneIndex];
  const advanceMode = scene ? resolveAdvanceMode(scene) : 'manual';
  const totalMs = useMemo(() => lessonDurationMs(lesson), [lesson]);
  const elapsedMs = useMemo(() => {
    const before = lesson.scenes.slice(0, sceneIndex).reduce((s, sc) => s + sceneClockMs(sc), 0);
    return before + (advanceMode === 'manual' ? 0 : sceneTimeMs);
  }, [lesson.scenes, sceneIndex, sceneTimeMs, advanceMode]);
  const absoluteMs = absoluteLayoutMs(lesson, sceneIndex, sceneTimeMs);
  useLessonAudioMixer(lesson, absoluteMs, playing, sceneIndex);

  const karaoke = scene?.karaokeTracks;
  const lyricEnabled = isLyricEnabledScene(scene);
  const mediaOverride = useMemo(() => {
    if (!karaoke) return null;
    if (vocalVersion === 'backing' && karaoke.backingUrl) return karaoke.backingUrl;
    if (vocalVersion === 'vocals' && karaoke.vocalUrl) return karaoke.vocalUrl;
    return null;
  }, [karaoke, vocalVersion]);
  const mediaDriven = isMediaDrivenScene(scene, advanceMode, mediaOverride);
  const lastMediaProgressRef = useRef(0);
  const limitMs = scene ? Math.max(500, scene.durationMs || 5000) : 5000;
  const onMediaTime = useCallback(
    (ms: number) => {
      lastMediaProgressRef.current = performance.now();
      setSceneTimeMs(Math.min(ms, limitMs));
    },
    [limitMs],
  );
  const hasKaraokeToggle = Boolean(lyricEnabled && karaoke?.vocalUrl && karaoke?.backingUrl);

  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= lesson.scenes.length) return;
      setSceneIndex(idx);
      setSceneTimeMs(0);
      setTrKey((k) => k + 1);
      setPlaying(true);
    },
    [lesson.scenes.length],
  );

  const next = useCallback(() => goTo(sceneIndex + 1), [goTo, sceneIndex]);
  const prev = useCallback(() => goTo(sceneIndex - 1), [goTo, sceneIndex]);

  const advanceFromMediaEnd = useCallback(() => {
    if (sceneIndex < lesson.scenes.length - 1) goTo(sceneIndex + 1);
    else {
      setPlaying(false);
    }
  }, [goTo, lesson.scenes.length, sceneIndex]);

  // Timer / media-end clock — never auto-advance manual scenes.
  useEffect(() => {
    if (!playing || !scene) return;
    if (advanceMode === 'manual') return;

    const limit =
      advanceMode === 'timer'
        ? Math.max(500, scene.advanceAfterMs ?? (scene.durationMs || 5000))
        : Math.max(500, scene.durationMs || 5000);

    // For media-end with video/audio/youtube, SceneRenderer fires onMediaEnded.
    // Still run a soft clock for UI timecode; only auto-advance on timer mode here.
    const started = performance.now() - sceneTimeMs;
    lastMediaProgressRef.current = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      if (mediaDriven) {
        // The media element drives the clock (onMediaTime). Safety net only: advance if it stalls.
        if (mediaStalled(now, lastMediaProgressRef.current)) {
          advanceFromMediaEnd();
          return;
        }
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = now - started;
      setSceneTimeMs(Math.min(t, limit));
      if (advanceMode === 'timer' && t >= limit) {
        if (sceneIndex < lesson.scenes.length - 1) goTo(sceneIndex + 1);
        else {
          setSceneTimeMs(limit);
          setPlaying(false);
        }
        return;
      }
      if (advanceMode === 'media-end' && t >= limit && scene.type !== 'youtube' && scene.type !== 'video' && scene.type !== 'audio') {
        // Fallback when no media API is available
        advanceFromMediaEnd();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, sceneIndex, scene?.id, advanceMode, scene?.advanceAfterMs, scene?.durationMs, goTo, lesson.scenes.length, mediaDriven]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        if (e.key === ' ') setPlaying((p) => !p);
        else next();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prev();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key.toLowerCase() === 'l' && lyricEnabled) {
        setShowLyrics((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose, lyricEnabled]);

  useEffect(() => {
    let startX = 0;
    const el = document.getElementById('ilv-player-stage');
    if (!el) return;
    const onStart = (e: TouchEvent) => {
      startX = e.touches[0]?.clientX || 0;
    };
    const onEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0]?.clientX || 0;
      const dx = endX - startX;
      if (Math.abs(dx) > 60) {
        if (dx < 0) next();
        else prev();
      }
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchend', onEnd);
    };
  }, [next, prev]);

  const toggleFullscreen = async () => {
    const root = document.getElementById('ilv-player-root');
    if (!root) return;
    if (!document.fullscreenElement) {
      await root.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  if (!scene) return null;

  const advanceHint =
    advanceMode === 'manual'
      ? 'Manual — press Next when ready'
      : advanceMode === 'timer'
        ? `Advances after ${(((scene.advanceAfterMs ?? scene.durationMs) || 0) / 1000).toFixed(0)}s`
        : 'Advances when media ends';

  return createPortal(
    <div id="ilv-player-root" className="ilv-root ilv-player" role="dialog" aria-modal="true" aria-label={lesson.title}>
      <div className="ilv-player-header">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-white">{lesson.title}</h2>
          <p className="text-xs text-white/60">
            Scene {sceneIndex + 1} of {lesson.scenes.length} · {scene.title}
            <span className="ml-2 text-white/40">· {advanceHint}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {playerOnly && canEdit && onEdit && (
            <button
              type="button"
              className="ilv-ctrl"
              onClick={onEdit}
              title={lesson.isDemo ? 'Built-in demo — make an editable copy' : 'Edit lesson'}
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">{lesson.isDemo ? 'Make a copy' : 'Edit'}</span>
            </button>
          )}
          <button
            type="button"
            className="ilv-ctrl"
            onClick={onClose}
            aria-label="Close player"
            style={{
              border: '1px solid rgba(226,224,239,0.25)',
              borderRadius: 12,
              padding: '0.5rem',
              background: 'transparent',
              color: '#fff',
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div id="ilv-player-stage" className="ilv-player-stage" onClick={() => setPlaying((p) => !p)}>
        <div className="ilv-player-frame">
          <SceneRenderer
            key={`${scene.id}-${trKey}-${vocalVersion}`}
            scene={scene}
            timeMs={sceneTimeMs}
            playing={playing}
            showLyrics={showLyrics}
            mediaUrlOverride={mediaOverride}
            transitionClass={transitionClass(scene.transition.type)}
            reducedMotion={reducedMotion}
            onMediaEnded={advanceMode === 'media-end' ? advanceFromMediaEnd : undefined}
            mediaDriven={mediaDriven}
            onMediaTime={mediaDriven ? onMediaTime : undefined}
          />
        </div>
      </div>

      {showStrip && (
        <div className="ilv-player-strip" onClick={(e) => e.stopPropagation()}>
          {lesson.scenes.map((sc, i) => (
            <button
              key={sc.id}
              type="button"
              className={`ilv-player-strip-thumb ${i === sceneIndex ? 'is-active' : ''}`}
              onClick={() => goTo(i)}
              title={sc.title}
            >
              <span>{i + 1}</span>
              <em>{sc.title}</em>
            </button>
          ))}
        </div>
      )}

      <div className="ilv-player-controls" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <button type="button" className="ilv-ctrl" onClick={prev} disabled={sceneIndex === 0} aria-label="Previous scene">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="ilv-ctrl"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <button
            type="button"
            className="ilv-ctrl"
            onClick={next}
            disabled={sceneIndex >= lesson.scenes.length - 1}
            aria-label="Next scene"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            className={`ilv-ctrl ${showStrip ? 'is-on' : ''}`}
            onClick={() => setShowStrip((v) => !v)}
            aria-label="Scene picker"
            title="Jump to scene"
          >
            Scenes
          </button>
          <span className="ml-2 tabular-nums text-sm text-white/80">
            {advanceMode === 'manual'
              ? `Scene ${sceneIndex + 1} / ${lesson.scenes.length}`
              : `${formatTimecode(elapsedMs)} / ${formatTimecode(totalMs)}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {lyricEnabled && (
            <button
              type="button"
              className={`ilv-ctrl ${showLyrics ? 'is-on' : ''}`}
              onClick={() => setShowLyrics((v) => !v)}
              aria-pressed={showLyrics}
              title="Toggle lyrics (L)"
            >
              <Mic2 className="h-4 w-4" />
              <span className="hidden sm:inline">{showLyrics ? 'Lyrics on' : 'Lyrics off'}</span>
            </button>
          )}
          {hasKaraokeToggle && (
            <button
              type="button"
              className={`ilv-ctrl ${vocalVersion === 'vocals' ? 'is-on' : ''}`}
              onClick={() =>
                setVocalVersion((v) => (v === 'vocals' ? 'backing' : 'vocals'))
              }
              aria-pressed={vocalVersion === 'vocals'}
              title="Toggle vocals / backing at the same timestamp"
            >
              <Music2 className="h-4 w-4" />
              <span className="hidden sm:inline">
                {vocalVersion === 'vocals' ? 'With vocals' : 'Backing only'}
              </span>
            </button>
          )}
          <button type="button" className="ilv-ctrl" onClick={toggleFullscreen} aria-label="Fullscreen">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
