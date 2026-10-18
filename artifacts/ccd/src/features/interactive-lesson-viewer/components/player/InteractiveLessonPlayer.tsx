import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import type { InteractiveLesson } from '../../types';
import { formatTimecode, lessonDurationMs } from '../../types';
import { SceneRenderer } from '../SceneRenderer';

interface InteractiveLessonPlayerProps {
  lesson: InteractiveLesson;
  onClose: () => void;
  startSceneIndex?: number;
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
    default:
      return '';
  }
}

export function InteractiveLessonPlayer({
  lesson,
  onClose,
  startSceneIndex = 0,
}: InteractiveLessonPlayerProps) {
  const [sceneIndex, setSceneIndex] = useState(startSceneIndex);
  const [playing, setPlaying] = useState(true);
  const [showLyrics, setShowLyrics] = useState(true);
  const [sceneTimeMs, setSceneTimeMs] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [trKey, setTrKey] = useState(0);
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const scene = lesson.scenes[sceneIndex];
  const totalMs = useMemo(() => lessonDurationMs(lesson), [lesson]);
  const elapsedMs = useMemo(() => {
    const before = lesson.scenes.slice(0, sceneIndex).reduce((s, sc) => s + sc.durationMs, 0);
    return before + sceneTimeMs;
  }, [lesson.scenes, sceneIndex, sceneTimeMs]);

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

  useEffect(() => {
    if (!playing || !scene) return;
    const started = performance.now() - sceneTimeMs;
    let raf = 0;
    const tick = (now: number) => {
      const t = now - started;
      if (t >= scene.durationMs) {
        if (sceneIndex < lesson.scenes.length - 1) {
          goTo(sceneIndex + 1);
        } else {
          setSceneTimeMs(scene.durationMs);
          setPlaying(false);
        }
        return;
      }
      setSceneTimeMs(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // intentionally omit sceneTimeMs to avoid reset loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, sceneIndex, scene?.id, scene?.durationMs, goTo, lesson.scenes.length]);

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
      } else if (e.key.toLowerCase() === 'l') {
        setShowLyrics((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  // Touch swipe
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

  // Portal to body so dashboard transform ancestors can't trap position:fixed.
  return createPortal(
    <div id="ilv-player-root" className="ilv-root ilv-player" role="dialog" aria-modal="true" aria-label={lesson.title}>
      <div className="ilv-player-header">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-white">{lesson.title}</h2>
          <p className="text-xs text-white/60">
            Scene {sceneIndex + 1} of {lesson.scenes.length} · {scene.title}
          </p>
        </div>
        <button type="button" className="ilv-ctrl" onClick={onClose} aria-label="Close player" style={{ border: '1px solid rgba(226,224,239,0.25)', borderRadius: 12, padding: '0.5rem', background: 'transparent', color: '#fff' }}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div id="ilv-player-stage" className="ilv-player-stage" onClick={() => setPlaying((p) => !p)}>
        <div className="ilv-player-frame">
          <SceneRenderer
            key={`${scene.id}-${trKey}`}
            scene={scene}
            timeMs={sceneTimeMs}
            playing={playing}
            showLyrics={showLyrics}
            transitionClass={transitionClass(scene.transition.type)}
            reducedMotion={reducedMotion}
          />
        </div>
      </div>

      {/* Bottom controls — classroom presenter (prev/next, play, lyrics, fullscreen) */}
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
          <span className="ml-2 tabular-nums text-sm text-white/80">
            {formatTimecode(elapsedMs)} / {formatTimecode(totalMs)}
          </span>
        </div>

        <div className="flex items-center gap-2">
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
          <button type="button" className="ilv-ctrl" onClick={toggleFullscreen} aria-label="Fullscreen">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
