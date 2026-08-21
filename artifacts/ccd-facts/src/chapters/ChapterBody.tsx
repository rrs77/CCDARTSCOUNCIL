import { useState } from "react";
import { ContentChart } from "@/components/charts/Charts";
import {
  getChart,
  getStat,
  meta,
  principalSourceIds,
  sources,
  type ClusterDef,
} from "@/content/facts.content";

function WhyCcd({ children, showKeys }: { children: React.ReactNode; showKeys?: boolean }) {
  return (
    <aside className="why-ccd">
      <strong>
        {meta.ui.whyCcdLabel}
        {showKeys ? <span className="edit-key"> whyThisMattersForCCD</span> : null}
      </strong>
      <p className="pitch-body">{children}</p>
    </aside>
  );
}

function Drill({ text, onClear }: { text: string; onClear: () => void }) {
  return (
    <div className="drill-panel">
      <div className="mb-1 flex items-center justify-between gap-2">
        <strong className="text-sm text-[#002d24]">{meta.ui.drillLabel}</strong>
        <button type="button" className="text-xs font-semibold text-[#14b8a6]" onClick={onClear}>
          {meta.ui.drillClear}
        </button>
      </div>
      <p className="pitch-body m-0">{text}</p>
    </div>
  );
}

export function ChapterBody({
  cluster,
  showKeys,
  hideTitle,
}: {
  cluster: ClusterDef;
  showKeys?: boolean;
  /** Title lives in the modal header when true */
  hideTitle?: boolean;
}) {
  const [drill, setDrill] = useState<string | null>(null);
  const isCover = cluster.id === "cover";

  return (
    <div className={`slide-auto-enter ${isCover ? "text-[#fffaf7]" : ""}`}>
      {!hideTitle && isCover ? (
        <p className="pitch-eyebrow text-[var(--lime)]">
          {meta.brand}
          {showKeys ? <span className="edit-key"> meta.brand</span> : null}
        </p>
      ) : null}

      {!hideTitle ? (
        <h2 className={`display mb-2 leading-tight ${isCover ? "pitch-h1 text-white" : "pitch-h2 text-[#002d24]"}`}>
          {isCover ? (
            <>
              {meta.titleLead}{" "}
              <span className="italic font-normal" style={{ fontFamily: "var(--font-serif)", color: "#B6FF7E" }}>
                {meta.titleAccent}
              </span>
            </>
          ) : (
            cluster.title
          )}
          {showKeys ? (
            <span className="edit-key"> {isCover ? "meta.title" : `clusters.${cluster.id}.title`}</span>
          ) : null}
        </h2>
      ) : null}

      {isCover ? (
        <p className="pitch-body-lg text-white/80">
          {meta.subtitle}
          {showKeys ? <span className="edit-key"> meta.subtitle</span> : null}
        </p>
      ) : (
        <p className="mb-3 pitch-body font-medium text-[#14b8a6]">
          {cluster.investorLine}
          {showKeys ? <span className="edit-key"> investorLine</span> : null}
        </p>
      )}

      <div className={`mt-3 space-y-2.5 ${isCover ? "text-white/85" : "text-[#33443e]"}`}>
        {(isCover ? meta.coverFraming : cluster.body).map((p, i) => (
          <p key={i} className="pitch-body m-0">
            {p}
          </p>
        ))}
        {isCover ? (
          <p className="pitch-caption m-0 italic text-white/65">
            {meta.earlyYearsPrinciple}
            {showKeys ? <span className="edit-key"> meta.earlyYearsPrinciple</span> : null}
          </p>
        ) : null}
      </div>

      {cluster.statIds?.length ? (
        <div className="stat-grid mt-4">
          {cluster.statIds.map((id) => {
            const s = getStat(id);
            if (!s) return null;
            return (
              <div key={id} className="stat-pill">
                <div className="num pitch-stat">
                  {s.value}
                  {showKeys ? <span className="edit-key"> stats.{id}</span> : null}
                </div>
                <div className="lbl pitch-caption">
                  <strong>{s.label}</strong>
                  <br />
                  {s.footnote}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {cluster.chartIds?.map((cid) => {
        const chart = getChart(cid);
        if (!chart) return null;
        return (
          <div key={cid} className="mt-4 chart-hero">
            <ContentChart
              chart={chart}
              showKeys={showKeys}
              onDrill={(label) => setDrill(label ? `Selected: ${label}` : null)}
            />
          </div>
        );
      })}

      {cluster.id === "conclusion" ? (
        <ol className="mt-4 list-decimal space-y-1.5 pl-4 pitch-caption text-[#33443e]">
          {principalSourceIds.map((id) => {
            const s = sources[id];
            if (!s) return null;
            return (
              <li key={id}>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.label} ({s.year})
                  </a>
                ) : (
                  `${s.label} (${s.year})`
                )}
              </li>
            );
          })}
        </ol>
      ) : null}

      {drill ? <Drill text={drill} onClear={() => setDrill(null)} /> : null}

      <WhyCcd showKeys={showKeys}>{cluster.whyThisMattersForCCD}</WhyCcd>
    </div>
  );
}
