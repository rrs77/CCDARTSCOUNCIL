import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import { slides } from "@/slideLoader";

const SLIDE_MS = 8000;
const PROGRESS_TICK_MS = 60;

function ProgressSegments({
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
    <div className="flex flex-1 items-center gap-1.5">
      {slides.map((slide, i) => {
        const isActive = i === activeIndex;
        const fill = isActive ? progress * 100 : i < activeIndex ? 100 : 0;
        return (
          <button
            key={slide.id}
            type="button"
            onClick={() => onJumpTo(i)}
            className="relative h-3 min-h-[12px] flex-1 cursor-pointer overflow-hidden rounded-full bg-white/20 transition-all hover:h-4 hover:bg-white/25"
            aria-label={`Go to slide ${i + 1}: ${slide.title}`}
            aria-current={isActive ? "true" : undefined}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/90 transition-[width] duration-100"
              style={{ width: `${fill}%` }}
            />
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

  const bump = useCallback(() => setTick((t) => t + 1), []);

  const jumpTo = useCallback(
    (next: number) => {
      setIndex((next + slides.length) % slides.length);
      bump();
    },
    [bump],
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

  const slide = slides[index];

  return (
    <div className="relative h-screen w-screen select-none overflow-hidden bg-black">
      <div key={slide.id} className="absolute inset-0 bottom-[4.5rem] overflow-hidden">
        <div className="h-full w-full [&_.h-screen]:!h-full [&_.w-screen]:!w-full">
          <slide.Component />
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 z-50 flex items-center gap-3 border-t border-white/10 bg-black/60 px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-4"
        role="toolbar"
        aria-label="Promo playback controls"
      >
        <button
          type="button"
          onClick={() => {
            setPlaying((p) => !p);
            bump();
          }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:h-12 sm:w-12"
          title={playing ? "Pause" : "Play"}
          aria-label={playing ? "Pause" : "Play"}
          aria-pressed={playing}
        >
          {playing ? <Pause className="h-6 w-6 sm:h-7 sm:w-7" /> : <Play className="h-6 w-6 sm:h-7 sm:w-7" />}
        </button>

        <button
          type="button"
          onClick={goPrev}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white sm:h-12 sm:w-12"
          title="Previous slide"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-7 w-7 sm:h-8 sm:w-8" />
        </button>

        <button
          type="button"
          onClick={goNext}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white sm:h-12 sm:w-12"
          title="Next slide"
          aria-label="Next slide"
        >
          <ChevronRight className="h-7 w-7 sm:h-8 sm:w-8" />
        </button>

        <div className="hidden w-px self-stretch bg-white/15 sm:block" aria-hidden="true" />

        <ProgressSegments
          activeIndex={index}
          tick={tick}
          playing={playing}
          onJumpTo={jumpTo}
        />

        <div className="shrink-0 font-mono text-sm tabular-nums text-white/60 sm:text-lg">
          {index + 1}/{slides.length}
        </div>
      </div>
    </div>
  );
}
