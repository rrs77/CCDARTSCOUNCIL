import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Repeat,
} from 'lucide-react';
import VideoTemplate, { SCENE_DURATIONS } from './VideoTemplate';
import { useSceneControls } from '@/hooks/useSceneControls';

const PROGRESS_TICK_MS = 80;
const IDLE_HIDE_MS = 2500;
const SWIPE_THRESHOLD_PX = 40;

function ProgressSegments({
  sceneKeys,
  activeIndex,
  activeDuration,
  tick,
  paused,
  onJumpTo,
}: {
  sceneKeys: string[];
  activeIndex: number;
  activeDuration: number;
  tick: number;
  paused: boolean;
  onJumpTo: (index: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const accumRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    accumRef.current = 0;
    lastTsRef.current = null;
    setElapsed(0);
  }, [tick]);

  useEffect(() => {
    if (paused) {
      lastTsRef.current = null;
      return;
    }
    lastTsRef.current = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const last = lastTsRef.current ?? now;
      accumRef.current += now - last;
      lastTsRef.current = now;
      setElapsed(accumRef.current);
    }, PROGRESS_TICK_MS);
    return () => {
      window.clearInterval(id);
      lastTsRef.current = null;
    };
  }, [paused, tick]);

  const progress = activeDuration > 0 ? Math.min(1, elapsed / activeDuration) : 0;

  return (
    <div className="flex-1 flex items-center gap-[3px]">
      {sceneKeys.map((key, i) => {
        const isActive = i === activeIndex;
        const isPast = i < activeIndex;
        const fill = isActive ? progress * 100 : isPast ? 100 : 0;
        return (
          <button
            key={key}
            onClick={() => onJumpTo(i)}
            className="flex-1 h-1 bg-white/15 rounded-full overflow-hidden cursor-pointer hover:bg-white/30 transition-colors relative"
            aria-label={`Jump to scene ${i + 1}`}
            aria-current={isActive ? 'true' : undefined}
          >
            <div
              className="absolute inset-y-0 left-0 bg-white rounded-full transition-[width] duration-100"
              style={{ width: `${fill}%` }}
            />
          </button>
        );
      })}
    </div>
  );
}

interface ControlBarProps {
  visible: boolean;
  locked: boolean;
  paused: boolean;
  isFullscreen: boolean;
  sceneKeys: string[];
  activeIndex: number;
  activeDuration: number;
  tick: number;
  onToggleLock: () => void;
  onTogglePause: () => void;
  onToggleFullscreen: () => void;
  onJumpTo: (index: number) => void;
}

function ControlBar({
  visible,
  locked,
  paused,
  isFullscreen,
  sceneKeys,
  activeIndex,
  activeDuration,
  tick,
  onToggleLock,
  onTogglePause,
  onToggleFullscreen,
  onJumpTo,
}: ControlBarProps) {
  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-50 flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-t from-black/55 via-black/30 to-transparent transition-all duration-300 ease-out ${
        visible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-2 opacity-0 pointer-events-none'
      }`}
      aria-hidden={!visible}
    >
      <button
        onClick={onTogglePause}
        className="w-9 h-9 flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors rounded-full shrink-0"
        title={paused ? 'Play' : 'Pause'}
        aria-label={paused ? 'Play' : 'Pause'}
        aria-pressed={paused}
      >
        {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
      </button>

      <button
        onClick={onToggleLock}
        className={`hidden sm:flex w-9 h-9 items-center justify-center transition-colors rounded-full shrink-0 hover:bg-white/10 ${
          locked ? 'text-white' : 'text-white/55 hover:text-white'
        }`}
        title={locked ? 'Loop scene: on' : 'Loop scene: off'}
        aria-label={locked ? 'Loop scene: on' : 'Loop scene: off'}
        aria-pressed={locked}
      >
        <Repeat className="w-4 h-4" />
      </button>

      <ProgressSegments
        sceneKeys={sceneKeys}
        activeIndex={activeIndex}
        activeDuration={activeDuration}
        tick={tick}
        paused={paused}
        onJumpTo={onJumpTo}
      />

      <div className="text-[11px] text-white/65 font-mono tabular-nums shrink-0 px-1">
        {String(activeIndex + 1).padStart(2, '0')}
        <span className="text-white/30"> / {String(sceneKeys.length).padStart(2, '0')}</span>
      </div>

      <button
        onClick={onToggleFullscreen}
        className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors rounded-full shrink-0"
        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
    </div>
  );
}

interface EdgeArrowProps {
  direction: 'left' | 'right';
  visible: boolean;
  disabled: boolean;
  onClick: () => void;
}

function EdgeArrow({ direction, visible, disabled, onClick }: EdgeArrowProps) {
  const isLeft = direction === 'left';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`absolute top-1/2 -translate-y-1/2 z-40 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white/90 hover:bg-black/50 hover:text-white active:scale-95 transition-all duration-200 ${
        isLeft ? 'left-2 sm:left-4' : 'right-2 sm:right-4'
      } ${
        visible && !disabled
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none'
      } disabled:opacity-0`}
      title={isLeft ? 'Previous scene' : 'Next scene'}
      aria-label={isLeft ? 'Previous scene' : 'Next scene'}
    >
      {isLeft ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
    </button>
  );
}

export default function VideoWithControls() {
  const {
    sceneKeys,
    activeIndex,
    locked,
    paused,
    mountKey,
    tick,
    durations,
    activeDuration,
    onSceneChange,
    jumpTo,
    toggleLock,
    togglePause,
  } = useSceneControls(SCENE_DURATIONS);

  // Deep-link support: ?scene=N (1-indexed) jumps to that scene on first mount.
  const appliedDeepLink = useRef(false);
  useEffect(() => {
    if (appliedDeepLink.current) return;
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('scene');
    if (!raw) return;
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 1 && n <= sceneKeys.length) {
      appliedDeepLink.current = true;
      jumpTo(n - 1);
    }
  }, [sceneKeys.length, jumpTo]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const [active, setActive] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const bumpActive = useCallback(() => {
    setActive(true);
    if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      setActive(false);
    }, IDLE_HIDE_MS);
  }, []);

  useEffect(() => {
    bumpActive();
    return () => {
      if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    };
  }, [bumpActive]);

  // Track fullscreen changes (user can exit via Esc).
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const goPrev = useCallback(() => {
    if (activeIndex > 0) jumpTo(activeIndex - 1);
    bumpActive();
  }, [activeIndex, jumpTo, bumpActive]);

  const goNext = useCallback(() => {
    if (activeIndex < sceneKeys.length - 1) jumpTo(activeIndex + 1);
    bumpActive();
  }, [activeIndex, sceneKeys.length, jumpTo, bumpActive]);

  const toggleFullscreen = useCallback(() => {
    bumpActive();
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => undefined);
    } else {
      document.exitFullscreen?.().catch(() => undefined);
    }
  }, [bumpActive]);

  // Keyboard navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePause();
        bumpActive();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, togglePause, toggleFullscreen, bumpActive]);

  // Touch / swipe.
  const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      bumpActive();
      const t = e.touches[0];
      touchStartRef.current = { x: t.clientX, y: t.clientY, t: performance.now() };
    },
    [bumpActive],
  );
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      // Horizontal swipe wins
      if (Math.abs(dx) > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) goNext();
        else goPrev();
      }
    },
    [goNext, goPrev],
  );

  // Keep controls visible while paused so the user can read / navigate.
  const visible = active || paused;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100dvh] overflow-hidden bg-black select-none touch-pan-y"
      onPointerMove={bumpActive}
      onPointerDown={bumpActive}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <VideoTemplate
        key={mountKey}
        durations={durations}
        loop
        paused={paused}
        onSceneChange={onSceneChange}
      />

      <EdgeArrow
        direction="left"
        visible={visible}
        disabled={activeIndex === 0}
        onClick={goPrev}
      />
      <EdgeArrow
        direction="right"
        visible={visible}
        disabled={activeIndex === sceneKeys.length - 1}
        onClick={goNext}
      />

      <ControlBar
        visible={visible}
        locked={locked}
        paused={paused}
        isFullscreen={isFullscreen}
        sceneKeys={sceneKeys}
        activeIndex={activeIndex}
        activeDuration={activeDuration}
        tick={tick}
        onToggleLock={() => {
          toggleLock();
          bumpActive();
        }}
        onTogglePause={() => {
          togglePause();
          bumpActive();
        }}
        onToggleFullscreen={toggleFullscreen}
        onJumpTo={(i) => {
          jumpTo(i);
          bumpActive();
        }}
      />
    </div>
  );
}
