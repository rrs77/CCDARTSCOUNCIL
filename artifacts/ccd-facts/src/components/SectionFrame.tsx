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

const MAX_VISIBLE_SATS = 2;
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
 * Opened section / title scene: rounded boxes, circled Info for detail.
 * Info only where more detail exists — never Eye/lightbulb.
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
  const isSources = frame.kind === "sources";
  const chart = !isSources && frame.chartId ? getChart(frame.chartId) : undefined;
  const situationOnly = isSituationPhotoSection(frame.id);
  const illusFile = isSources
    ? undefined
    : situationOnly
      ? SITUATION_HERO
      : sectionIllustration(frame.id) ?? sectionIllustration(frame.mainSectionId);
  const showBrand = frame.kind === "title";
  const hasMore = frameHasMoreDetail(frame);
  // Sources is a register — never optional-fact pills / meta satellites
  const allChildren =
    frame.kind === "hub" || frame.kind === "title"
      ? frame.childIds
          .map((id) => presentation.frames.find((f) => f.id === id))
          .filter(Boolean)
      : [];
  const children = allChildren.slice(0, MAX_VISIBLE_SATS);
  const overflowCount = Math.max(0, allChildren.length - children.length);
  const sourceNotes = isSources && frame.footnotes?.length ? frame.footnotes : [];
  const showHint =
    !isSources && layout === "scene" && (hasMore || children.length > 0 || overflowCount > 0);

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
        {hasMore ? (
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
                <p className="prezi-stat-label">{frame.heroStat.label}</p>
              </div>
            ) : null}

            {chart ? (
              <div className="prezi-chart-bubble">
                <ContentChart chart={chart} density="canvas" />
                <button
                  type="button"
                  className="prezi-info prezi-info--chart"
                  aria-label={`More information about ${frame.title} chart`}
                  title={INFO_HINT}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetail();
                  }}
                >
                  <Info className="prezi-info-icon" strokeWidth={2.25} aria-hidden />
                </button>
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
            {frame.titleSmall ? <p className="prezi-title-small">{frame.titleSmall}</p> : null}
            <h2 className="prezi-title-giant">{frame.titleGiant}</h2>
          </div>

          {/* Sources: principal footnotes only — no meta body cards, no CCD filler */}
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

          {!isSources && (frame.sentence || frame.quote) ? (
            <div className="prezi-body-card">
              <p>{frame.quote || frame.sentence}</p>
            </div>
          ) : null}
        </div>

        <div className="prezi-actions">
          {children.length || overflowCount ? (
            <>
              <p className="prezi-extras-label">Optional extra facts</p>
              <ul className="prezi-satellites" aria-label="Optional extra facts">
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
                        <span className="prezi-sat-info-wrap" aria-hidden>
                          <Info className="prezi-sat-info" strokeWidth={2.25} />
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
                      aria-label={`${overflowCount} more topics — open detail`}
                    >
                      <span className="prezi-sat-label">+{overflowCount} more</span>
                      <span className="prezi-sat-info-wrap" aria-hidden>
                        <Info className="prezi-sat-info" strokeWidth={2.25} />
                      </span>
                    </button>
                  </li>
                ) : null}
              </ul>
            </>
          ) : null}
          {showHint ? <p className="prezi-hint">{INFO_HINT}</p> : null}
        </div>
      </div>
    </div>
  );
}
