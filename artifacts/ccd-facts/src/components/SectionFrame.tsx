import { ContentChart } from "@/components/charts/Charts";
import { getChart } from "@/content/facts.content";
import type { FrameNode } from "@/content/layoutPresentation";

function heroUrl(file: string) {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${file}`.replace(/\/{2,}/g, "/").replace(":/", "://");
}

/**
 * Prezi-style frame: photo/stat bubble hero + two-tier title + one sentence card.
 * Children of hubs are separate frames (satellites) — not decorative pills.
 */
export function SectionFrame({
  frame,
  active,
  overview,
  onOpen,
}: {
  frame: FrameNode;
  active: boolean;
  overview: boolean;
  onOpen: () => void;
}) {
  const asCard = overview && !active;
  const chart = frame.chartId ? getChart(frame.chartId) : undefined;

  return (
    <button
      type="button"
      className={[
        "prezi-frame",
        `prezi-${frame.kind}`,
        active ? "is-active" : "",
        asCard ? "is-overview-card" : "is-open",
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
      aria-current={active ? "true" : undefined}
    >
      <div className="prezi-frame-stage">
        {/* Hero object — ~45–60% visual weight, bottom/right weighted */}
        <div className={`prezi-hero ${frame.heroStat ? "prezi-hero--stat" : "prezi-hero--photo"}`}>
          {frame.heroStat ? (
            <div className="prezi-stat-bubble">
              <p className="prezi-stat-value">{frame.heroStat.value}</p>
              <p className="prezi-stat-label">{frame.heroStat.label}</p>
            </div>
          ) : frame.photoHero || frame.kind === "title" || frame.kind === "hub" ? (
            <div className="prezi-photo-bubble">
              <img src={heroUrl("hero-arts.jpg")} alt="" draggable={false} />
            </div>
          ) : chart ? (
            <div className="prezi-chart-bubble">
              <ContentChart chart={chart} />
            </div>
          ) : (
            <div className="prezi-stat-bubble prezi-stat-bubble--soft">
              <p className="prezi-stat-value">·</p>
            </div>
          )}
        </div>

        {/* Title in dark-green bubble — two-tier type */}
        <div className="prezi-title-bubble">
          {frame.titleSmall ? <p className="prezi-title-small">{frame.titleSmall}</p> : null}
          <h2 className="prezi-title-giant">{frame.titleGiant}</h2>
        </div>

        {/* Body: one sentence (or quote) in a solid card */}
        {frame.sentence || frame.quote ? (
          <div className="prezi-body-card">
            <p>{frame.quote || frame.sentence}</p>
          </div>
        ) : null}

        {frame.kind === "sources" && frame.footnotes?.length ? (
          <div className="prezi-body-card prezi-sources-card">
            <ol>
              {frame.footnotes.slice(0, 6).map((fn) => (
                <li key={fn.id}>
                  {fn.url ? (
                    <a href={fn.url} target="_blank" rel="noopener noreferrer">
                      {fn.text}
                    </a>
                  ) : (
                    fn.text
                  )}
                </li>
              ))}
            </ol>
            {frame.footnotes.length > 6 ? (
              <p className="prezi-more">+{frame.footnotes.length - 6} more in the document</p>
            ) : null}
          </div>
        ) : null}

        {asCard && frame.childIds.length ? (
          <p className="prezi-sat-hint">{frame.childIds.length} places inside</p>
        ) : null}
      </div>
    </button>
  );
}
