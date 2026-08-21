import { ZoomIn } from "lucide-react";
import { ContentChart } from "@/components/charts/Charts";
import { getChart } from "@/content/facts.content";
import type { FrameNode } from "@/content/layoutPresentation";
import type { ContentBlock } from "@/content/parseContent";

function teaserFor(frame: FrameNode): string {
  if (frame.lead?.[0]) return frame.lead[0].slice(0, 120) + (frame.lead[0].length > 120 ? "…" : "");
  const stat = frame.section?.blocks.find((b) => b.type === "stat");
  if (stat && stat.type === "stat") return `${stat.value} · ${stat.label}`;
  const para = frame.section?.blocks.find((b) => b.type === "paragraph");
  if (para && para.type === "paragraph") {
    return para.text.slice(0, 110) + (para.text.length > 110 ? "…" : "");
  }
  return "Open to read";
}

function Blocks({ blocks }: { blocks: ContentBlock[] }) {
  const stats = blocks.filter((b) => b.type === "stat");
  const rest = blocks.filter((b) => b.type !== "stat");

  return (
    <>
      {rest.map((b, i) => {
        if (b.type === "paragraph") {
          return (
            <p key={`p-${i}`} className="section-para">
              {b.text}
            </p>
          );
        }
        if (b.type === "list") {
          return (
            <ul key={`l-${i}`} className="section-list">
              {b.items.map((item) => (
                <li key={item.slice(0, 48)}>{item}</li>
              ))}
            </ul>
          );
        }
        if (b.type === "quote") {
          return (
            <aside key={`q-${i}`} className="section-quote">
              <p>{b.text}</p>
            </aside>
          );
        }
        if (b.type === "chart") {
          const chart = getChart(b.chartId);
          if (!chart) return null;
          return (
            <div key={`c-${b.chartId}-${i}`} className="section-chart">
              <ContentChart chart={chart} />
            </div>
          );
        }
        return null;
      })}
      {stats.length ? (
        <div className="section-stats">
          {stats.map((s) =>
            s.type === "stat" ? (
              <article key={s.label} className="section-stat">
                <p className="section-stat-value">{s.value}</p>
                <p className="section-stat-label">{s.label}</p>
              </article>
            ) : null,
          )}
        </div>
      ) : null}
    </>
  );
}

export function SectionFrame({
  frame,
  active,
  overview,
  revealDetail,
  onOpen,
}: {
  frame: FrameNode;
  active: boolean;
  overview: boolean;
  revealDetail: boolean;
  onOpen: () => void;
}) {
  const asCard = overview && !active;
  const showBody = (revealDetail || active) && !asCard;

  return (
    <button
      type="button"
      className={`section-frame level-${frame.level} ${active ? "is-active" : ""} ${asCard ? "is-card" : "is-scene"}`}
      style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      aria-label={frame.title}
      aria-current={active ? "true" : undefined}
    >
      <div className="section-frame-inner">
        <div className="section-frame-head">
          <span className="section-frame-seq">{String(frame.sequence).padStart(2, "0")}</span>
          {asCard ? (
            <span className="section-frame-zoom" aria-hidden>
              <ZoomIn className="h-5 w-5" strokeWidth={2.5} />
            </span>
          ) : null}
        </div>

        <h2 className="section-frame-title">{frame.title}</h2>

        {asCard ? <p className="section-frame-teaser">{teaserFor(frame)}</p> : null}

        {showBody ? (
          <div className="section-frame-body">
            {frame.lead?.map((p) => (
              <p key={p.slice(0, 24)} className="section-para">
                {p}
              </p>
            ))}
            {frame.section ? <Blocks blocks={frame.section.blocks} /> : null}
            {frame.footnotes?.length ? (
              <ol className="section-footnotes">
                {frame.footnotes.map((fn) => (
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
            ) : null}
          </div>
        ) : null}
      </div>
    </button>
  );
}
