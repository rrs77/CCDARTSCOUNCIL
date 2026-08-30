import { Info } from "lucide-react";
import type { CSSProperties } from "react";
import { ContentChart } from "@/components/charts/Charts";
import { LogoMark } from "@/components/LogoMark";
import { getChart, meta } from "@/content/facts.content";
import type { FrameNode, Presentation } from "@/content/layoutPresentation";
import {
  assetUrl,
  isSituationPhotoSection,
  sectionIllustration,
  SITUATION_HERO,
} from "@/content/sectionIllustrations";
import { sectionAccent } from "@/content/sectionAccent";

const MAX_VISIBLE_SATS = 3;
const INFO_HINT = "More information";

function frameHasMoreDetail(frame: FrameNode): boolean {
  return (
    frame.blocks.length > 0 ||
    !!frame.quote ||
    !!frame.sentence ||
    !!frame.chartId ||
    !!frame.heroStat ||
    !!(frame.subsections && frame.subsections.length) ||
    !!(frame.footnotes && frame.footnotes.length)
  );
}

/**
 * One composed place on the canvas.
 * Overview: title + visual cue, detail quiet.
 * Focus: heading → key message → support/chart; one Info; quiet extras.
 */
export function SectionFrame({
  frame,
  presentation,
  highlighted,
  activeChildId,
  layout = "world",
  density = "focus",
  onOpen,
  onOpenDetail,
  onOpenChild,
}: {
  frame: FrameNode;
  presentation: Presentation;
  highlighted?: boolean;
  activeChildId?: string | null;
  layout?: "world" | "scene";
  density?: "overview" | "focus";
  onOpen: () => void;
  onOpenDetail: () => void;
  onOpenChild?: (id: string) => void;
}) {
  const isSources = frame.kind === "sources";
  const quiet = density === "overview" || (density === "focus" && !highlighted);
  const isOverview = quiet;
  const chart = !isSources && !quiet && frame.chartId ? getChart(frame.chartId) : undefined;
  const situationOnly = isSituationPhotoSection(frame.id);
  const illusFile = isSources
    ? undefined
    : situationOnly
      ? SITUATION_HERO
      : sectionIllustration(frame.id) ?? sectionIllustration(frame.mainSectionId);
  const showBrand = frame.kind === "title" && !isOverview;
  const hasMore = frameHasMoreDetail(frame);
  const showInfo = hasMore && !isOverview && !!highlighted;
  // Sources is a register — never optional-fact pills
  const allChildren =
    !isOverview && (frame.kind === "hub" || frame.kind === "title")
      ? frame.childIds
          .map((id) => presentation.frames.find((f) => f.id === id))
          .filter(Boolean)
      : [];
  const children = allChildren.slice(0, MAX_VISIBLE_SATS);
  const overflowCount = Math.max(0, allChildren.length - children.length);
  const sourceNotes =
    !isOverview && isSources && frame.footnotes?.length ? frame.footnotes : [];
  const accent = sectionAccent(frame.id);

  const style: CSSProperties =
    layout === "scene"
      ? { ["--frame-accent" as string]: accent }
      : {
          left: frame.x,
          top: frame.y,
          width: frame.w,
          height: frame.h,
          ["--frame-accent" as string]: accent,
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
        density === "overview" ? "is-overview" : "is-focus",
        quiet && density === "focus" ? "is-peek" : "",
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
        {showInfo ? (
          <button
            type="button"
            className="prezi-info"
            aria-label={`More information about ${frame.title}`}
            title={INFO_HINT}
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail();
            }}
          >
            <Info className="prezi-info-icon" strokeWidth={2.25} aria-hidden />
          </button>
        ) : null}

        {!isSources ? (
          <div className={`prezi-hero${chart && illusFile ? " prezi-hero--split" : ""}`}>
            {illusFile ? (
              <div
                className={`prezi-photo-bubble${situationOnly ? "" : " prezi-photo-bubble--illustration"}`}
              >
                <img
                  src={assetUrl(illusFile)}
                  alt=""
                  draggable={false}
                  className={situationOnly ? `crop-${frame.photoCrop}` : "prezi-illustration"}
                />
              </div>
            ) : null}

            {frame.heroStat && !illusFile ? (
              <div className="prezi-stat-bubble" aria-hidden={false}>
                <p className="prezi-stat-value">{frame.heroStat.value}</p>
                {!quiet ? <p className="prezi-stat-label">{frame.heroStat.label}</p> : null}
              </div>
            ) : null}

            {chart ? (
              <div className="prezi-chart-bubble">
                <ContentChart chart={chart} density="canvas" />
              </div>
            ) : null}
          </div>
        ) : null}

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
            {frame.titleSmall && !quiet ? (
              <p className="prezi-title-small">{frame.titleSmall}</p>
            ) : null}
            <h2 className="prezi-title-giant">{quiet ? frame.title : frame.titleGiant}</h2>
          </div>

          {isSources && sourceNotes.length ? (
            <div className="prezi-body-card prezi-sources-card">
              <p className="prezi-sources-label">Principal sources</p>
              <ol>
                {sourceNotes.map((fn) => (
                  <li key={fn.id}>
                    {fn.url ? (
                      <a href={fn.url} target="_blank" rel="noreferrer">
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

          {!isSources && !quiet && (frame.sentence || frame.quote) ? (
            <div className="prezi-body-card">
              <p>{frame.quote || frame.sentence}</p>
            </div>
          ) : null}
        </div>

        {!quiet && (children.length || overflowCount) ? (
          <div className="prezi-actions">
            <ul className="prezi-satellites" aria-label="Extra facts">
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
                    aria-label={`${overflowCount} more — open detail`}
                  >
                    <span className="prezi-sat-label">+{overflowCount}</span>
                  </button>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
