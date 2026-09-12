import { ChevronLeft, ChevronRight } from "lucide-react";
import { STAGE_SHORT } from "@/content/stackLabels";

export type SlideNavItem = { id: string; title: string };

export function SlideNav({
  items,
  currentId,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onJump,
  tone = "dark",
}: {
  items: SlideNavItem[];
  currentId: string | null;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onJump: (id: string) => void;
  tone?: "dark" | "light";
}) {
  const index = Math.max(0, items.findIndex((item) => item.id === currentId));
  const current = items[index];

  return (
    <div className={`slide-nav slide-nav--${tone}`}>
      <button
        type="button"
        className="stack-arrow stack-arrow--left world-arrow"
        aria-label="Previous stage"
        disabled={!canPrev}
        onClick={onPrev}
      >
        <ChevronLeft className="stack-arrow-icon" strokeWidth={2.5} aria-hidden />
      </button>
      <button
        type="button"
        className="stack-arrow stack-arrow--right world-arrow"
        aria-label="Next stage"
        disabled={!canNext}
        onClick={onNext}
      >
        <ChevronRight className="stack-arrow-icon" strokeWidth={2.5} aria-hidden />
      </button>

      <nav className="slide-jump" aria-label="Jump to a stage">
        <p className="slide-jump-status">
          {current ? `${String(index + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}` : ""}
          {current ? <span>{current.title}</span> : null}
        </p>
        <div className="slide-jump-row">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`slide-jump-btn${item.id === currentId ? " is-current" : ""}`}
              aria-label={`Jump to ${item.title}`}
              aria-current={item.id === currentId ? "step" : undefined}
              onClick={() => onJump(item.id)}
            >
              {STAGE_SHORT[item.id] ?? item.title}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
