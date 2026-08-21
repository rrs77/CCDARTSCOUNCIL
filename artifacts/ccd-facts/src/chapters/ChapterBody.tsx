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
        Why this matters for CCDesigner
        {showKeys ? <span className="edit-key"> whyThisMattersForCcd</span> : null}
      </strong>
      <p>{children}</p>
    </aside>
  );
}

function Drill({ text, onClear }: { text: string; onClear: () => void }) {
  return (
    <div className="drill-panel">
      <div className="mb-1 flex items-center justify-between gap-2">
        <strong className="text-sm text-[#002d24]">Detail</strong>
        <button type="button" className="text-xs font-semibold text-[#14b8a6]" onClick={onClear}>
          Clear
        </button>
      </div>
      {text}
    </div>
  );
}

export function ChapterBody({
  cluster,
  showKeys,
}: {
  cluster: ClusterDef;
  showKeys?: boolean;
}) {
  const [drill, setDrill] = useState<string | null>(null);
  const isCover = cluster.id === "cover";

  return (
    <div className={isCover ? "space-y-4 text-[#fffaf7]" : ""}>
      {isCover ? (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--lime)]">
          {meta.brand}
          {showKeys ? <span className="edit-key"> meta.brand</span> : null}
        </p>
      ) : null}

      <h2
        className={`display mb-2 leading-tight ${
          isCover ? "text-3xl text-white sm:text-4xl" : "text-2xl text-[#002d24]"
        }`}
      >
        {isCover ? meta.title : cluster.title}
        {showKeys ? (
          <span className="edit-key"> {isCover ? "meta.title" : `clusters.${cluster.id}.title`}</span>
        ) : null}
      </h2>

      {isCover ? (
        <p className="text-base text-white/80 sm:text-lg">
          {meta.subtitle}
          {showKeys ? <span className="edit-key"> meta.subtitle</span> : null}
        </p>
      ) : (
        <p className="mb-3 text-sm font-medium text-[#14b8a6]">
          {cluster.investorLine}
          {showKeys ? <span className="edit-key"> investorLine</span> : null}
        </p>
      )}

      <div
        className={`space-y-3 text-sm leading-relaxed ${
          isCover ? "text-white/85 sm:text-[0.95rem]" : "text-[#33443e]"
        }`}
      >
        {(isCover ? meta.coverFraming : cluster.body).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {isCover ? (
          <p className="italic text-white/70">
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
                <div className="num">
                  {s.value}
                  {showKeys ? <span className="edit-key"> stats.{id}</span> : null}
                </div>
                <div className="lbl">
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
          <div key={cid} className="mt-4">
            <ContentChart
              chart={chart}
              showKeys={showKeys}
              onDrill={(label) => setDrill(label ? `Selected: ${label}` : null)}
            />
          </div>
        );
      })}

      {cluster.id === "conclusion" ? (
        <ol className="mt-4 list-decimal space-y-1.5 pl-4 text-sm text-[#33443e]">
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

      <WhyCcd showKeys={showKeys}>{cluster.whyThisMattersForCcd}</WhyCcd>

      {isCover ? (
        <p className="text-xs text-white/55">Click any topic on the map — or follow the suggested journey.</p>
      ) : null}
    </div>
  );
}
