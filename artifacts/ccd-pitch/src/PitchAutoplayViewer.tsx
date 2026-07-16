import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
import { slides } from "@/slideLoader";

const SLIDE_MS = 8000;
const PROGRESS_TICK_MS = 100;
const SITE_URL = "https://www.ccdesigner.co.uk";
const SWIPE_THRESHOLD_PX = 45;

/** Short readable label derived from the slide title. */
function thumbLabel(title: string): string {
  const cleaned = title
    .replace(/^Promo:\s*/i, "")
    .replace(/^Feature:\s*/i, "")
    .replace(/[—–:.].*$/, "")
    .trim();
  const words = cleaned.split(/\s+/);
  let label = words[0] ?? "";
  if (label.length <= 4 && words[1]) label = `${label} ${words[1]}`;
  return label.length > 12 ? `${label.slice(0, 11)}…` : label;
}

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
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setElapsed(0);
    if (!playing) return;
    const start = performance.now();
    const id = window.setInterval(() => {
      setElapsed(performance.now() - start);
    }, PROGRESS_TICK_MS);
    return () => window.clearInterval(id);
  }, [tick, playing]);

  // Keep the active thumbnail visible as the deck advances.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const active = strip.querySelector<HTMLElement>('[data-active="true"]');
    if (!active) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const left =
      active.offsetLeft - strip.clientWidth / 2 + active.clientWidth / 2;
    strip.scrollTo({ left, behavior: reduce ? "auto" : "smooth" });
  }, [activeIndex]);

  const progress = playing && SLIDE_MS > 0 ? Math.min(1, elapsed / SLIDE_MS) : 0;

  return (
    <div ref={stripRef} className="pitch-thumb-strip">
      {slides.map((slide, i) => {
        const isActive = i === activeIndex;
        const fill = isActive ? progress * 100 : i < activeIndex ? 100 : 0;
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
            <span className="pitch-thumb-label">{thumbLabel(slide.title)}</span>
            <span className="pitch-thumb-fill" style={{ width: `${fill}%` }} />
          </button>
        );
      })}
    </div>
  );
}

export function PitchAutoplayViewer() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [tick, setTick] = useState(0);
  const [stageDims, setStageDims] = useState({ width: 0, height: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const indexRef = useRef(0);
  indexRef.current = index;

  const bump = useCallback(() => setTick((t) => t + 1), []);

  const jumpTo = useCallback(
    (next: number) => {
      const wrapped = (next + slides.length) % slides.length;
      setIndex(wrapped);
      bump();
      iframeRef.current?.contentWindow?.postMessage(
        { type: "navigateToSlide", position: slides[wrapped].position },
        "*",
      );
    },
    [bump],
  );

  const goPrev = useCallback(() => jumpTo(indexRef.current - 1), [jumpTo]);
  const goNext = useCallback(() => jumpTo(indexRef.current + 1), [jumpTo]);

  // Autoplay.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      jumpTo(indexRef.current + 1);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [playing, tick, jumpTo]);

  // Fit a 16:9 stage into the available area (recomputes on resize/rotation).
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const update = () => {
      const rect = stage.getBoundingClientRect();
      const width = Math.min(rect.width, rect.height * (16 / 9));
      const height = Math.min(rect.height, rect.width * (9 / 16));
      setStageDims({ width, height });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    window.addEventListener("orientationchange", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  // Keyboard navigation (the overlay keeps focus in this window).
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        goPrev();
      } else if (
        event.key === "ArrowRight" ||
        event.key === "ArrowDown" ||
        event.key === " "
      ) {
        event.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goPrev, goNext]);

  // Tap / swipe on the stage overlay — exactly one step per gesture.
  const touchRef = useRef<{ x: number; y: number; handled: boolean } | null>(null);

  const onOverlayTouchStart = (event: React.TouchEvent) => {
    touchRef.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
      handled: false,
    };
  };

  const onOverlayTouchEnd = (event: React.TouchEvent) => {
    const start = touchRef.current;
    touchRef.current = null;
    if (!start) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) >= SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext();
      else goPrev();
    } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      // Tap: left 35% goes back, the rest advances.
      const fraction = start.x / window.innerWidth;
      if (fraction < 0.35) goPrev();
      else goNext();
    }
    // Mark so the synthetic click that follows a tap is ignored.
    if (touchClickGuard.current != null) window.clearTimeout(touchClickGuard.current);
    touchClickGuardActive.current = true;
    touchClickGuard.current = window.setTimeout(() => {
      touchClickGuardActive.current = false;
    }, 500);
  };

  const touchClickGuard = useRef<number | null>(null);
  const touchClickGuardActive = useRef(false);

  const onOverlayClick = (event: React.MouseEvent) => {
    if (touchClickGuardActive.current) return;
    const fraction = event.clientX / window.innerWidth;
    if (fraction < 0.35) goPrev();
    else goNext();
  };

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const firstPosition = slides.length > 0 ? slides[0].position : 1;

  return (
    <div className="flex h-[100dvh] w-screen select-none flex-col overflow-hidden bg-black">
      {/* Stage — slide letterboxed to 16:9 inside the space above the nav bar */}
      <div ref={stageRef} className="relative min-h-0 flex-1">
        <div className="absolute inset-0 flex items-center justify-center">
          <iframe
            ref={iframeRef}
            src={`${base}/slide${firstPosition}`}
            tabIndex={-1}
            style={{
              width: Math.floor(stageDims.width),
              height: Math.floor(stageDims.height),
              border: "none",
            }}
            title="Feature walkthrough slide"
            aria-label={`Slide ${index + 1} of ${slides.length}: ${slides[index]?.title ?? ""}`}
          />
        </div>
        {/* Transparent overlay: viewer owns all tap/swipe/click navigation */}
        <div
          className="absolute inset-0 z-10"
          style={{ touchAction: "pan-y" }}
          onClick={onOverlayClick}
          onTouchStart={onOverlayTouchStart}
          onTouchEnd={onOverlayTouchEnd}
          role="presentation"
        />
      </div>

      {/* Nav bar — reserved space below the stage, never covers the slide */}
      <div
        className="pitch-nav-strip z-20 flex shrink-0 items-center gap-1.5 border-t border-white/10 bg-[#002D24] px-2 py-1.5 sm:gap-2 sm:px-2.5"
        role="toolbar"
        aria-label="Walkthrough navigation"
      >
        <button
          type="button"
          onClick={() => {
            setPlaying((p) => !p);
            bump();
          }}
          className="pitch-nav-btn"
          title={playing ? "Pause" : "Play"}
          aria-label={playing ? "Pause autoplay" : "Play autoplay"}
          aria-pressed={playing}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={goPrev}
          className="pitch-nav-btn"
          title="Previous slide"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-4.5 w-4.5" />
        </button>

        <button
          type="button"
          onClick={goNext}
          className="pitch-nav-btn"
          title="Next slide"
          aria-label="Next slide"
        >
          <ChevronRight className="h-4.5 w-4.5" />
        </button>

        <div className="hidden h-4 w-px shrink-0 bg-white/15 sm:block" aria-hidden="true" />

        <ThumbStrip
          activeIndex={index}
          tick={tick}
          playing={playing}
          onJumpTo={jumpTo}
        />

        <div
          className="shrink-0 whitespace-nowrap px-1 font-mono text-[0.7rem] tabular-nums text-white/70"
          aria-live="polite"
        >
          {index + 1} of {slides.length}
        </div>

        <button
          type="button"
          onClick={leaveWalkthrough}
          className="pitch-nav-btn"
          title="Close and return to ccdesigner.co.uk"
          aria-label="Close walkthrough and return to ccdesigner.co.uk"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
