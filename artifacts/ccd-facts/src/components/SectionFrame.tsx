import { Info } from "lucide-react";
import type { CSSProperties } from "react";
import { ContentChart } from "@/components/charts/Charts";
import { getChart } from "@/content/facts.content";
import type { FrameNode, Presentation } from "@/content/layoutPresentation";
import { sectionAccent } from "@/content/sectionAccent";

function heroUrl(file: string) {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${file}`.replace(/\/{2,}/g, "/").replace(":/", "://");
}

const MAX_VISIBLE_SATS = 2;

/**
 * One scene: one green ring around the hero (photo/stat), title + sentence in
 * the empty left third — never overlapping the ring. Optional small satellites
 * (text chips only, not rings) for children on hubs.
 * Info icon on every frame / sat / chart: further detail is available.
 */
export function SectionFrame({
  frame,
  presentation,
  highlighted,
  activeChildId,
  onOpen,
  onOpenDetail,
  onOpenChild,
}: {
  frame: FrameNode;
  presentation: Presentation;
  highlighted?: boolean;
  /** When path lands on a child, emphasise that satellite label */
  activeChildId?: string | null;
  onOpen: () => void;
  /** Direct open of the large detail modal (info affordance). */
  onOpenDetail: () => void;
  onOpenChild?: (id: string) => void;
}) {
  const chart = frame.chartId ? getChart(frame.chartId) : undefined;
  const showPhoto = frame.photoHero && !frame.heroStat && !chart;
  const allChildren =
    frame.kind === "hub" || frame.kind === "title"
      ? frame.childIds
          .map((id) => presentation.frames.find((f) => f.id === id))
          .filter(Boolean)
      : [];
  const children = allChildren.slice(0, MAX_VISIBLE_SATS);
  const overflowCount = Math.max(0, allChildren.length - children.length);
  const accent = sectionAccent(frame.id);

  return (
    <div
      role="button"
      tabIndex={0}
      className={[
        "prezi-frame",
        `prezi-${frame.kind}`,
        highlighted ? "is-highlighted" : "",
        `crop-${frame.photoCrop}`,
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          left: frame.x,
          top: frame.y,
          width: frame.w,
          height: frame.h,
          ["--frame-accent" as string]: accent,
        } as CSSProperties
      }
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onOpen();
        }
      }}
      aria-label={frame.title}
      aria-current={highlighted ? "true" : undefined}
    >
      <div className="prezi-frame-stage">
        <span className="prezi-accent-bar" aria-hidden />

        <button
          type="button"
          className="prezi-info"
          aria-label={`More about ${frame.title}`}
          title="Open full detail"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail();
          }}
        >
          <Info className="prezi-info-icon" strokeWidth={2.25} aria-hidden />
        </button>

        {/* Hero — the ONE green ring for this section */}
        <div className="prezi-hero">
          {frame.heroStat ? (
            <div className="prezi-stat-bubble" aria-hidden={false}>
              <p className="prezi-stat-value">{frame.heroStat.value}</p>
              <p className="prezi-stat-label">{frame.heroStat.label}</p>
            </div>
          ) : chart ? (
            <div className="prezi-chart-bubble">
              <ContentChart chart={chart} density="canvas" />
              <button
                type="button"
                className="prezi-info prezi-info--chart"
                aria-label={`Chart detail for ${frame.title}`}
                title="Open full detail"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetail();
                }}
              >
                <Info className="prezi-info-icon" strokeWidth={2.25} aria-hidden />
              </button>
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

        {/* Copy column — left; never under the ring */}
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

          {frame.kind === "sources" ? (
            <div className="prezi-body-card prezi-sources-card">
              <p className="prezi-sources-hint">
                Full footnotes open via the info icon — readable in the detail panel.
              </p>
            </div>
          ) : null}
        </div>

        {/* Text chips only — overflow goes to modal via info */}
        {children.length || overflowCount ? (
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
                    <span className="prezi-sat-label">
                      {ch.heroStat?.value && ch.heroStat.value.length <= 12
                        ? ch.heroStat.value
                        : ch.title}
                    </span>
                    <Info className="prezi-sat-info" strokeWidth={2.25} aria-hidden />
                  </button>
                </li>
              ) : null,
            )}
            {overflowCount > 0 ? (
              <li>
                <button
                  type="button"
                  className="prezi-sat prezi-sat--more"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetail();
                  }}
                  aria-label={`${overflowCount} more topics — open detail`}
                >
                  <span className="prezi-sat-label">+{overflowCount} more</span>
                  <Info className="prezi-sat-info" strokeWidth={2.25} aria-hidden />
                </button>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
