import { Eye } from "lucide-react";
import type { CSSProperties } from "react";
import { ContentChart } from "@/components/charts/Charts";
import { LogoMark } from "@/components/LogoMark";
import { getChart, meta } from "@/content/facts.content";
import type { FrameNode, Presentation } from "@/content/layoutPresentation";

function heroUrl(file: string) {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${file}`.replace(/\/{2,}/g, "/").replace(":/", "://");
}

const MAX_VISIBLE_SATS = 2;

/**
 * Opened section / title scene: rounded boxes, eye for detail, no left lime rule.
 * Classroom photo on title (start) and Situation only.
 */
export function SectionFrame({
  frame,
  presentation,
  highlighted,
  activeChildId,
  layout = "world",
  onOpen,
  onOpenDetail,
  onOpenChild,
}: {
  frame: FrameNode;
  presentation: Presentation;
  highlighted?: boolean;
  activeChildId?: string | null;
  layout?: "world" | "scene";
  onOpen: () => void;
  onOpenDetail: () => void;
  onOpenChild?: (id: string) => void;
}) {
  const chart = frame.chartId ? getChart(frame.chartId) : undefined;
  const showPhoto =
    (frame.id === "title" || frame.id === "the-situation") &&
    frame.photoHero &&
    !frame.heroStat &&
    !chart;
  const showBrand = frame.kind === "title";
  const allChildren =
    frame.kind === "hub" || frame.kind === "title" || frame.kind === "sources"
      ? frame.childIds
          .map((id) => presentation.frames.find((f) => f.id === id))
          .filter(Boolean)
      : [];
  const children = allChildren.slice(0, MAX_VISIBLE_SATS);
  const overflowCount = Math.max(0, allChildren.length - children.length);

  const style: CSSProperties =
    layout === "scene"
      ? {}
      : {
          left: frame.x,
          top: frame.y,
          width: frame.w,
          height: frame.h,
        };

  return (
    <div
      role="button"
      tabIndex={0}
      className={[
        "prezi-frame",
        layout === "scene" ? "prezi-frame--scene" : "",
        `prezi-${frame.kind}`,
        highlighted ? "is-highlighted" : "",
        `crop-${frame.photoCrop}`,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
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
          <Eye className="prezi-info-icon" strokeWidth={2.25} aria-hidden />
        </button>

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
                <Eye className="prezi-info-icon" strokeWidth={2.25} aria-hidden />
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

        <div className="prezi-copy">
          {showBrand ? (
            <div className="prezi-brand-lockup" aria-label={meta.brand}>
              <LogoMark size={62} title={meta.brand} />
              <div className="prezi-brand-lockup-text">
                <div className="prezi-brand-lockup-name">{meta.brand}</div>
                <div className="prezi-brand-lockup-line">
                  {meta.experienceLead}{" "}
                  <span className="prezi-brand-lockup-accent">{meta.experienceAccent}</span>
                </div>
              </div>
            </div>
          ) : null}

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
                Full footnotes open via the eye icon — readable in the detail panel.
              </p>
            </div>
          ) : null}
        </div>

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
                    <Eye className="prezi-sat-info" strokeWidth={2.25} aria-hidden />
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
                  <Eye className="prezi-sat-info" strokeWidth={2.25} aria-hidden />
                </button>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
