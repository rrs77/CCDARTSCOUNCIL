import { animate, motion, useMotionValue } from "framer-motion";
import { ArrowLeft, Home, Maximize2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChapterBody } from "@/chapters/ChapterBody";
import { CHAPTERS, type ChapterId } from "@/data/stats";

const CELL_W = 780;
const CELL_H = 860;
const GAP_X = 120;
const GAP_Y = 100;

function clusterOrigin(id: ChapterId) {
  const ch = CHAPTERS.find((c) => c.id === id)!;
  return {
    x: ch.x * (CELL_W + GAP_X),
    y: ch.y * (CELL_H + GAP_Y),
  };
}

function useViewportSize() {
  const [size, setSize] = useState({ w: 1200, h: 800 });
  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

export default function App() {
  const { w, h } = useViewportSize();
  const [active, setActive] = useState<ChapterId | null>(null);
  const [overview, setOverview] = useState(true);

  const scaleMv = useMotionValue(0.28);
  const xMv = useMotionValue(0);
  const yMv = useMotionValue(0);

  const worldW = 3 * CELL_W + 2 * GAP_X;
  const worldH = 5 * CELL_H + 4 * GAP_Y;

  const fitOverview = useCallback(() => {
    const pad = 48;
    const s = Math.min((w - pad) / worldW, (h - pad - 70) / worldH, 0.42);
    const tx = -((worldW * s) / 2);
    const ty = -((worldH * s) / 2) + 10;
    return { s, tx, ty };
  }, [w, h, worldW, worldH]);

  const zoomTo = useCallback(
    (id: ChapterId | null) => {
      if (!id) {
        const { s, tx, ty } = fitOverview();
        animate(scaleMv, s, { duration: 0.55, ease: [0.22, 1, 0.36, 1] });
        animate(xMv, tx, { duration: 0.55, ease: [0.22, 1, 0.36, 1] });
        animate(yMv, ty, { duration: 0.55, ease: [0.22, 1, 0.36, 1] });
        setActive(null);
        setOverview(true);
        return;
      }
      const origin = clusterOrigin(id);
      const targetScale = Math.min(Math.max(Math.min(w / (CELL_W + 40), h / (CELL_H + 120)), 0.72), 1.05);
      const tx = -(origin.x + CELL_W / 2) * targetScale;
      const ty = -(origin.y + CELL_H / 2) * targetScale + 12;
      animate(scaleMv, targetScale, { duration: 0.6, ease: [0.22, 1, 0.36, 1] });
      animate(xMv, tx, { duration: 0.6, ease: [0.22, 1, 0.36, 1] });
      animate(yMv, ty, { duration: 0.6, ease: [0.22, 1, 0.36, 1] });
      setActive(id);
      setOverview(false);
    },
    [fitOverview, h, scaleMv, w, xMv, yMv],
  );

  useEffect(() => {
    const { s, tx, ty } = fitOverview();
    scaleMv.set(s);
    xMv.set(tx);
    yMv.set(ty);
  }, [fitOverview, scaleMv, xMv, yMv]);

  // Deep-link: ?chapter=gcse
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ch = params.get("chapter") as ChapterId | null;
    if (ch && CHAPTERS.some((c) => c.id === ch)) {
      // slight delay so layout has viewport size
      const t = window.setTimeout(() => zoomTo(ch), 80);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [zoomTo]);

  const goHome = () => {
    window.location.href = "/";
  };

  const activeMeta = useMemo(
    () => CHAPTERS.find((c) => c.id === active) ?? null,
    [active],
  );

  return (
    <div className="facts-app">
      <div className="topbar">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}cd-logo.svg`} alt="" className="h-9 w-9" />
          <div className="leading-tight text-white">
            <div className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--lime)]">
              CCDesigner
            </div>
            <div className="text-sm font-semibold">The facts</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!overview ? (
            <button
              type="button"
              onClick={() => zoomTo(null)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--lime)]/40 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-[var(--lime)]"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Map
            </button>
          ) : null}
          {activeMeta && activeMeta.n > 1 ? (
            <button
              type="button"
              onClick={() => {
                const prev = CHAPTERS.find((c) => c.n === activeMeta.n - 1);
                if (prev) zoomTo(prev.id);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/85"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Prev
            </button>
          ) : null}
          {activeMeta && activeMeta.n < 15 ? (
            <button
              type="button"
              onClick={() => {
                const next = CHAPTERS.find((c) => c.n === activeMeta.n + 1);
                if (next) zoomTo(next.id);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/85"
            >
              Next
            </button>
          ) : null}
          <button
            type="button"
            onClick={goHome}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--lime)] px-2.5 py-1.5 text-xs font-bold text-[#002d24]"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </button>
        </div>
      </div>

      <div className="canvas-stage">
        <motion.div
          className="canvas-world"
          style={{ scale: scaleMv, x: xMv, y: yMv }}
        >
          {CHAPTERS.map((ch) => {
            const origin = clusterOrigin(ch.id);
            const isActive = active === ch.id;
            const isCover = ch.id === "cover";
            return (
              <div
                key={ch.id}
                className={`cluster ${isActive ? "active" : ""} ${isCover ? "cover-cluster" : ""}`}
                style={{
                  left: origin.x,
                  top: origin.y,
                  width: CELL_W,
                  minHeight: 420,
                }}
              >
                {isActive ? (
                  <div className="cluster-inner">
                    <div className="cluster-badge">
                      {ch.n}. {ch.label}
                    </div>
                    <ChapterBody id={ch.id} />
                  </div>
                ) : (
                  <button
                    type="button"
                    className="w-full border-0 bg-transparent p-0 text-left"
                    onClick={() => zoomTo(ch.id)}
                    aria-label={`Open ${ch.label}`}
                  >
                    <div className="cluster-inner">
                      <div className="cluster-badge">
                        {ch.n}. {ch.label}
                      </div>
                      <PreviewLabel id={ch.id} label={ch.label} />
                    </div>
                  </button>
                )}
              </div>
            );
          })}
        </motion.div>
      </div>

      <nav className="nav-rail" aria-label="Chapters">
        {CHAPTERS.map((ch) => (
          <button
            key={ch.id}
            type="button"
            aria-current={active === ch.id ? "true" : undefined}
            onClick={() => zoomTo(ch.id)}
          >
            {ch.n}. {ch.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function PreviewLabel({ id, label }: { id: ChapterId; label: string }) {
  const blurb: Record<ChapterId, string> = {
    cover: "Evidence overview for funding & partnership",
    glance: "Headline verified figures",
    longterm: "Chart 1 — contraction since ~2010",
    primary: "Chart 2 — hours gap & subject leads",
    secondary: "Chart 3 — disadvantage & entries",
    availability: "Chart 4 — schools with no GCSE entries",
    gcse: "Chart 5 — indexed 2024–26 GCSE",
    alevel: "Chart 6 — indexed A-level pipeline",
    teachers: "Workforce & teaching time",
    poverty: "Place, FSM & cold spots",
    he: "Chart 7 — Creative Arts & Design HE",
    hubs: "Chart 8 — funding streams (non-additive)",
    centre: "National Centre transition",
    meaning: "How CCD aims to respond",
    conclusion: "Sources & verification note",
  };
  return (
    <div>
      <h2 className={`display text-2xl ${id === "cover" ? "text-white" : "text-[#002d24]"}`}>
        {label}
      </h2>
      <p className={`mt-2 text-sm ${id === "cover" ? "text-white/70" : "text-[#5c6b66]"}`}>
        {blurb[id]}
      </p>
      <p className={`mt-4 text-xs font-semibold ${id === "cover" ? "text-[var(--lime)]" : "text-[#2A9D8F]"}`}>
        Click to zoom in →
      </p>
    </div>
  );
}
