import { Map as MapIcon } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Presentation } from "@/content/layoutPresentation";
import { SECTION_ACCENT } from "@/content/sectionAccent";
import { STAGE_ORDER, stageLabel } from "@/content/stackLabels";

type NavItem = { id: string | null; label: string };

const ACCENT = SECTION_ACCENT;

function buildItems(presentation: Presentation): NavItem[] {
  const byId = new Map(presentation.frames.filter((f) => !f.parentId).map((f) => [f.id, f]));
  const items: NavItem[] = [{ id: null, label: "Overview" }];
  for (const id of STAGE_ORDER) {
    const f = byId.get(id);
    if (f) items.push({ id: f.id, label: stageLabel(f.id, f.title) });
  }
  const sources = byId.get("sources");
  if (sources) items.push({ id: sources.id, label: stageLabel(sources.id, sources.title) });
  return items;
}

/**
 * Map column: open on load; whole column slides off on mouse leave.
 * Labels match key-stage pathway names.
 */
export function MapNav({
  presentation,
  focusId,
  onOverview,
  onJump,
}: {
  presentation: Presentation;
  focusId: string | null;
  onOverview: () => void;
  onJump: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [pinned, setPinned] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const items = buildItems(presentation);

  const clearClose = useCallback(() => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    if (pinned) return;
    clearClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 220);
  }, [clearClose, pinned]);

  const openNow = useCallback(() => {
    clearClose();
    setOpen(true);
  }, [clearClose]);

  useEffect(() => () => clearClose(), [clearClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        e.preventDefault();
        e.stopPropagation();
        setPinned(false);
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setPinned(false);
      setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  const isCurrent = (id: string | null) => {
    if (id === null) return focusId === null;
    if (focusId === id) return true;
    if (!focusId) return false;
    const f = presentation.frames.find((x) => x.id === focusId);
    return f?.mainSectionId === id;
  };

  const go = (id: string | null) => {
    if (id === null) onOverview();
    else onJump(id);
  };

  const onTabClick = () => {
    if (open && pinned) {
      setPinned(false);
      setOpen(false);
      return;
    }
    if (open) {
      setPinned(true);
      return;
    }
    setPinned(true);
    setOpen(true);
  };

  return (
    <>
      <div
        className={`map-edge-hit ${open ? "is-hidden" : ""}`}
        onMouseEnter={openNow}
        onFocus={openNow}
        aria-hidden={open}
      >
        <button
          type="button"
          className="map-edge-chip"
          aria-label="Show map"
          onClick={() => {
            setPinned(true);
            setOpen(true);
          }}
        >
          <MapIcon className="map-nav-tab-icon" strokeWidth={2.25} aria-hidden />
        </button>
      </div>

      <div
        ref={rootRef}
        className={`map-nav ${open ? "is-open" : "is-collapsed"} ${pinned ? "is-pinned" : ""}`}
        onMouseEnter={openNow}
        onMouseLeave={scheduleClose}
        onFocusCapture={openNow}
      >
        <div className="map-nav-column">
          <button
            type="button"
            className="map-nav-tab"
            aria-expanded={open}
            aria-controls={panelId}
            title={pinned ? "Unpin map" : "Map"}
            onClick={onTabClick}
          >
            <MapIcon className="map-nav-tab-icon" strokeWidth={2.25} aria-hidden />
            <span className="map-nav-tab-text">Map</span>
          </button>

          <nav
            id={panelId}
            className="map-nav-panel"
            aria-label="Map"
            aria-hidden={!open}
            inert={!open ? true : undefined}
          >
            <p className="map-nav-heading">Map</p>
            <ul className="map-nav-list">
              {items.map((item) => {
                const accent = ACCENT[item.id ?? "overview"] ?? "#B6FF7E";
                const current = isCurrent(item.id);
                return (
                  <li key={item.id ?? "overview"}>
                    <button
                      type="button"
                      className={`map-nav-link ${current ? "is-current" : ""}`}
                      style={{ ["--map-accent" as string]: accent }}
                      onClick={() => go(item.id)}
                    >
                      <span className="map-nav-pip" aria-hidden />
                      <span className="map-nav-link-label">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
