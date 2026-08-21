import { ContentChart } from "@/components/charts/Charts";
import { getChart } from "@/content/facts.content";
import type { FrameNode, Presentation } from "@/content/layoutPresentation";

function heroUrl(file: string) {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${file}`.replace(/\/{2,}/g, "/").replace(":/", "://");
}

/**
 * One scene: one green ring around the hero (photo/stat), title + sentence in
 * the empty left third — never overlapping the ring. Optional small satellites
 * (text chips only, not rings) for children on hubs.
 */
export function SectionFrame({
  frame,
  presentation,
  highlighted,
  activeChildId,
  onOpen,
  onOpenChild,
}: {
  frame: FrameNode;
  presentation: Presentation;
  highlighted?: boolean;
  /** When path lands on a child, emphasise that satellite label */
  activeChildId?: string | null;
  onOpen: () => void;
  onOpenChild?: (id: string) => void;
}) {
  const chart = frame.chartId ? getChart(frame.chartId) : undefined;
  const showPhoto = frame.photoHero && !frame.heroStat && !chart;
  const children =
    frame.kind === "hub" || frame.kind === "title"
      ? frame.childIds
          .map((id) => presentation.frames.find((f) => f.id === id))
          .filter(Boolean)
          .slice(0, 4)
      : [];

  return (
    <button
      type="button"
      className={[
        "prezi-frame",
        `prezi-${frame.kind}`,
        highlighted ? "is-highlighted" : "",
        `crop-${frame.photoCrop}`,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      aria-label={frame.title}
      aria-current={highlighted ? "true" : undefined}
    >
      <div className="prezi-frame-stage">
        {/* Hero — the ONE green ring for this section */}
        <div className="prezi-hero">
          {frame.heroStat ? (
            <div className="prezi-stat-bubble" aria-hidden={false}>
              <p className="prezi-stat-value">{frame.heroStat.value}</p>
              <p className="prezi-stat-label">{frame.heroStat.label}</p>
            </div>
          ) : chart ? (
            <div className="prezi-chart-bubble">
              <ContentChart chart={chart} />
            </div>
          ) : showPhoto ? (
            <div className="prezi-photo-bubble">
              <img
                src={heroUrl("hero-arts.jpg")}
                alt=""
                draggable={false}
                className={`crop-${frame.photoCrop}`}
              />
            </div>
          ) : (
            <div className="prezi-stat-bubble prezi-stat-bubble--plain" aria-hidden>
              <p className="prezi-stat-value prezi-stat-value--quiet">CCD</p>
            </div>
          )}
        </div>

        {/* Copy column — left third / below; never under the ring */}
        <div className="prezi-copy">
          <div className="prezi-title-bubble">
            {frame.titleSmall ? <p className="prezi-title-small">{frame.titleSmall}</p> : null}
            <h2 className="prezi-title-giant">{frame.titleGiant}</h2>
          </div>

          {frame.sentence || frame.quote ? (
            <div className="prezi-body-card">
              <p>{frame.quote || frame.sentence}</p>
            </div>
          ) : null}

          {frame.kind === "sources" && frame.footnotes?.length ? (
            <div className="prezi-body-card prezi-sources-card">
              <ol>
                {frame.footnotes.slice(0, 5).map((fn) => (
                  <li key={fn.id}>
                    {fn.url ? (
                      <a
                        href={fn.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {fn.text}
                      </a>
                    ) : (
                      fn.text
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>

        {/* Text chips only — not destination rings */}
        {children.length ? (
          <ul className="prezi-satellites" aria-label="Inside this section">
            {children.map((ch, i) =>
              ch ? (
                <li
                  key={ch.id}
                  style={{ ["--i" as string]: String(i) }}
                  className={activeChildId === ch.id ? "is-active-sat" : undefined}
                >
                  <button
                    type="button"
                    className="prezi-sat"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenChild?.(ch.id);
                    }}
                  >
                    {ch.title}
                  </button>
                </li>
              ) : null,
            )}
          </ul>
        ) : null}
      </div>
    </button>
  );
}
