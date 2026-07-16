import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  X,
} from "lucide-react";
import { slides } from "@/slideLoader";

const SLIDE_MS = 8000;
const PROGRESS_TICK_MS = 60;
const NAV_IDLE_MS = 2800;
const SITE_URL = "https://www.ccdesigner.co.uk";

/** Short labels for thumbnail strip — keep readable at ~36px height. */
const THUMB_LABELS = [
  "Title",
  "Problem",
  "Solution",
  "Coverage",
  "Partners",
  "Who for",
  "Planner",
  "Calendar",
  "Library",
  "Stacks",
  "Links",
  "Create",
  "PDF",
  "Settings",
  "Homepage",
  "How to",
  "Try CCD",
];

function leaveWalkthrough() {
  try {
    if (window.top && window.top !== window) {
      window.top.location.href = SITE_URL;
      return;
    }
  } catch {
    // Cross-origin top — fall through
  }
  window.location.href = SITE_URL;
}

function ThumbStrip({
  activeIndex,
  tick,
  playing,
  onJumpTo,
}: {
  activeIndex: number;
  tick: number;
  playing: boolean;
  onJumpTo: (index: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(0);
    if (!playing) return;
    const start = performance.now();
    const id = window.setInterval(() => {
      setElapsed(performance.now() - start);
    }, PROGRESS_TICK_MS);
    return () => window.clearInterval(id);
  }, [tick, playing]);

  const progress = playing && SLIDE_MS > 0 ? Math.min(1, elapsed / SLIDE_MS) : 0;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      {slides.map((slide, i) => {
        const isActive = i === activeIndex;
        const fill = isActive ? progress * 100 : i < activeIndex ? 100 : 0;
        const label = THUMB_LABELS[i] ?? `S${i + 1}`;
        return (
          <button
            key={slide.id}
            type="button"
            onClick={() => onJumpTo(i)}
            className="pitch-thumb"
            data-active={isActive ? "true" : undefined}
            aria-label={`Go to slide ${i + 1}: ${slide.title}`}
            aria-current={isActive ? "true" : undefined}
            title={slide.title}
          >
            <span className="pitch-thumb-label">{label}</span>
            <span className="pitch-thumb-fill" style={{ width: `${fill}%` }} />
          </button>
        );
      })}
    </div>
  );
}

export function PitchAutoplayViewer() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [tick, setTick] = useState(0);
  const [navVisible, setNavVisible] = useState(true);
  const idleTimerRef = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const bump = useCallback(() => setTick((t) => t + 1), []);

  const showNav = useCallback(() => {
    setNavVisible(true);
    if (idleTimerRef.current != null) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      setNavVisible(false);
    }, NAV_IDLE_MS);
  }, []);

  const jumpTo = useCallback(
    (next: number) => {
      setIndex((next + slides.length) % slides.length);
      bump();
      showNav();
    },
    [bump, showNav],
  );

  const goPrev = useCallback(() => {
    jumpTo(index - 1);
  }, [index, jumpTo]);

  const goNext = useCallback(() => {
    jumpTo(index + 1);
  }, [index, jumpTo]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
      setTick((t) => t + 1);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [playing, tick]);

  useEffect(() => {
    showNav();
    const onMove = () => showNav();
    const onKey = () => showNav();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("keydown", onKey);
      if (idleTimerRef.current != null) window.clearTimeout(idleTimerRef.current);
    };
  }, [showNav]);

  const slide = slides[index];

  return (
    <div ref={rootRef} className="relative h-screen w-screen select-none overflow-hidden bg-black">
      <div className="absolute inset-0 overflow-hidden">
        <div key={slide.id} className="h-full w-full [&_.h-screen]:!h-full [&_.w-screen]:!w-full">
          <slide.Component />
        </div>
      </div>

      {/* Hover hot-zone so strip reappears when cursor nears bottom */}
      <div
        className="absolute inset-x-0 bottom-0 z-40 h-14"
        onMouseEnter={showNav}
        aria-hidden="true"
      />

      <div
        className="pitch-nav-strip absolute bottom-0 left-0 right-0 z-50 flex items-center gap-2 border-t border-white/10 bg-[#002D24]/92 px-2.5 py-1.5 backdrop-blur-md"
        data-hidden={navVisible ? "false" : "true"}
        role="toolbar"
        aria-label="Promo playback controls"
        onMouseEnter={showNav}
        onMouseMove={showNav}
      >
        <button
          type="button"
          onClick={() => {
            setPlaying((p) => !p);
            bump();
            showNav();
          }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          title={playing ? "Pause" : "Play"}
          aria-label={playing ? "Pause" : "Play"}
          aria-pressed={playing}
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>

        <button
          type="button"
          onClick={goPrev}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          title="Previous slide"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={goNext}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          title="Next slide"
          aria-label="Next slide"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="hidden h-4 w-px shrink-0 bg-white/15 sm:block" aria-hidden="true" />

        <ThumbStrip
          activeIndex={index}
          tick={tick}
          playing={playing}
          onJumpTo={jumpTo}
        />

        <div className="shrink-0 px-1 font-mono text-[0.65rem] tabular-nums text-white/55">
          {index + 1}/{slides.length}
        </div>

        <button
          type="button"
          onClick={leaveWalkthrough}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          title="Close and return to ccdesigner.co.uk"
          aria-label="Close walkthrough"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
