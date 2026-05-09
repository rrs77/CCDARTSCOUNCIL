import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, Repeat } from 'lucide-react';
import VideoTemplate, { SCENE_DURATIONS, SCENE_LABELS } from './VideoTemplate';
import { useSceneControls } from '@/hooks/useSceneControls';

const PROGRESS_TICK_MS = 60;
const IDLE_HIDE_MS = 2500;

interface ControlBarProps {
  visible: boolean;
  locked: boolean;
  paused: boolean;
  sceneKeys: string[];
  activeIndex: number;
  activeDuration: number;
  tick: number;
  onToggleLock: () => void;
  onTogglePause: () => void;
  onJumpTo: (index: number) => void;
}

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

  // Reset on scene change / jump
  useEffect(() => {
    accumRef.current = 0;
    lastTsRef.current = null;
    setElapsed(0);
  }, [tick]);

  // Tick that respects pause (does not accumulate while paused)
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
    <div className="flex-1 flex items-center gap-1.5">
      {sceneKeys.map((key, i) => {
        const isActive = i === activeIndex;
        const fill = isActive ? progress * 100 : 0;
        return (
          <button
            key={key}
            onClick={() => onJumpTo(i)}
            className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden cursor-pointer hover:h-4 hover:bg-white/25 transition-all relative min-h-[12px]"
            aria-label={`Jump to scene ${i + 1}`}
            aria-current={isActive ? 'true' : undefined}
          >
            <div
              className="absolute inset-y-0 left-0 bg-white/90 rounded-full transition-[width] duration-100"
              style={{ width: `${fill}%` }}
            />
          </button>
        );
      })}
    </div>
  );
}

function ThumbnailStrip({
  sceneKeys,
  activeIndex,
  visible,
  onJumpTo,
}: {
  sceneKeys: string[];
  activeIndex: number;
  visible: boolean;
  onJumpTo: (index: number) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!visible) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const active = scroller.querySelector<HTMLElement>(`[data-thumb-index="${activeIndex}"]`);
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeIndex, visible]);

  return (
    <div
      className={`bg-black/50 backdrop-blur-sm transition-all duration-200 ease-out ${
        visible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-2 opacity-0 pointer-events-none'
      }`}
      aria-hidden={!visible}
    >
      <div ref={scrollerRef} className="flex gap-2 px-5 py-3 overflow-x-auto scrollbar-thin">
        {sceneKeys.map((key, i) => {
          const isActive = i === activeIndex;
          const label = SCENE_LABELS[key as keyof typeof SCENE_LABELS] ?? key;
          return (
            <button
              key={key}
              data-thumb-index={i}
              onClick={() => onJumpTo(i)}
              className={`shrink-0 w-32 rounded-lg overflow-hidden border transition-all text-left ${
                isActive
                  ? 'border-white/80 ring-2 ring-white/50 scale-[1.02]'
                  : 'border-white/15 hover:border-white/40'
              }`}
              aria-label={`Jump to scene ${i + 1}: ${label}`}
              aria-current={isActive ? 'true' : undefined}
              title={`${i + 1}. ${label}`}
            >
              <div className="aspect-video relative bg-gradient-to-br from-slate-800 to-slate-900">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display font-black text-white/70 text-3xl tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                {isActive && (
                  <div className="absolute inset-0 bg-white/10 ring-1 ring-white/30 ring-inset" />
                )}
              </div>
              <div
                className={`px-2 py-1.5 text-xs font-medium truncate ${
                  isActive ? 'bg-white text-black' : 'bg-black/60 text-white/80'
                }`}
              >
                {label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ControlBar({
  visible,
  locked,
  paused,
  sceneKeys,
  activeIndex,
  activeDuration,
  tick,
  onToggleLock,
  onTogglePause,
  onJumpTo,
}: ControlBarProps) {
  return (
    <div
      className={`flex items-center gap-3 bg-black/50 backdrop-blur-sm px-5 py-4 transition-all duration-200 ease-out ${
        visible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-full opacity-0 pointer-events-none'
      }`}
      aria-hidden={!visible}
    >
      <button
        onClick={onTogglePause}
        className="w-14 h-14 flex items-center justify-center text-white bg-white/15 hover:bg-white/25 transition-colors rounded-lg shrink-0"
        title={paused ? 'Play' : 'Pause'}
        aria-label={paused ? 'Play' : 'Pause'}
        aria-pressed={paused}
      >
        {paused ? <Play className="w-8 h-8" /> : <Pause className="w-8 h-8" />}
      </button>

      <button
        onClick={onToggleLock}
        className={`w-14 h-14 flex items-center justify-center transition-colors rounded-lg shrink-0 ${
          locked
            ? 'text-white bg-white/15 hover:bg-white/25'
            : 'text-white/60 hover:text-white hover:bg-white/10'
        }`}
        title={locked ? 'Loop current scene: on' : 'Loop current scene: off'}
        aria-label={locked ? 'Loop current scene: on' : 'Loop current scene: off'}
        aria-pressed={locked}
      >
        <Repeat className="w-8 h-8" />
      </button>

      <div className="w-px self-stretch bg-white/15" aria-hidden="true" />

      <ProgressSegments
        sceneKeys={sceneKeys}
        activeIndex={activeIndex}
        activeDuration={activeDuration}
        tick={tick}
        paused={paused}
        onJumpTo={onJumpTo}
      />

      <div className="text-xl text-white/60 font-mono tabular-nums shrink-0">
        {activeIndex + 1}/{sceneKeys.length}
      </div>
    </div>
  );
}

export default function VideoWithControls() {
  const isIframed = typeof window !== 'undefined' && window.self !== window.top;

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
  const [active, setActive] = useState(true); // controls visible if true (mouse moved recently)

  const bumpActive = useCallback(() => {
    setActive(true);
    if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      setActive(false);
    }, IDLE_HIDE_MS);
  }, []);

  // Show on mount briefly, then auto-hide.
  useEffect(() => {
    bumpActive();
    return () => {
      if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    };
  }, [bumpActive]);

  // Keep controls visible while paused so the user can read / navigate.
  const visible = active || paused;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100dvh]"
      onPointerMove={bumpActive}
      onPointerDown={bumpActive}
      onTouchStart={bumpActive}
    >
      <VideoTemplate
        key={mountKey}
        durations={durations}
        loop
        paused={paused}
        onSceneChange={onSceneChange}
      />
      {isIframed && (
        <div className="absolute bottom-0 left-0 right-0 z-50 flex flex-col">
          <ThumbnailStrip
            sceneKeys={sceneKeys}
            activeIndex={activeIndex}
            visible={visible}
            onJumpTo={(i) => {
              jumpTo(i);
              bumpActive();
            }}
          />
          <ControlBar
            visible={visible}
            locked={locked}
            paused={paused}
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
            onJumpTo={(i) => {
              jumpTo(i);
              bumpActive();
            }}
          />
        </div>
      )}
    </div>
  );
}
