import { Map as MapIcon } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Presentation } from "@/content/layoutPresentation";
import { SECTION_ACCENT } from "@/content/sectionAccent";

type NavItem = { id: string | null; label: string };
type NavGroup = { heading: string; items: NavItem[] };

const ACCENT = SECTION_ACCENT;

/** Short Map labels — nested menu, not the long document title. */
function buildMenu(presentation: Presentation): {
  lone: NavItem[];
  groups: NavGroup[];
} {
  const byId = new Map(presentation.frames.filter((f) => !f.parentId).map((f) => [f.id, f]));
  const pick = (id: string, label: string): NavItem | null =>
    byId.has(id) ? { id, label } : null;

  const lone: NavItem[] = [{ id: null, label: "Overview" }];

  const groups: NavGroup[] = [];
  const stages = [
    pick("primary-eyfs-ks2", "Primary"),
    pick("secondary-ks3-ks4", "Secondary and access"),
    pick("ks5-a-level", "A-level"),
  ].filter(Boolean) as NavItem[];
  if (stages.length) groups.push({ heading: "Key stages", items: stages });

  const after = [pick("university-he", "Higher education")].filter(Boolean) as NavItem[];
  if (after.length) groups.push({ heading: "After school", items: after });

  const solution = pick("a-solution", "CCDesigner");
  if (solution) {
    groups.push({ heading: "A solution", items: [solution] });
  }

  const sources = pick("sources", "Sources");
  if (sources) lone.push(sources);

  return { lone, groups };
}

/**
 * Alternative navigation: collapsed Map chip by default (does not cover canvas).
 * Hover/focus expands a narrow panel; mouse leave (≈250ms) closes it.
 * Touch: tap chip to open/pin, tap canvas or chip again to close.
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
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const { lone, groups } = buildMenu(presentation);

  const clearClose = useCallback(() => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    if (pinned) return;
    clearClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 250);
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

  // Tap outside closes (touch / click on canvas)
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
    // Keep panel usable on desktop hover; on touch, close after navigate
    if (pinned) {
      setPinned(false);
      setOpen(false);
    }
  };

  const onTabClick = () => {
    if (open) {
      setPinned(false);
      setOpen(false);
      return;
    }
    setPinned(true);
    setOpen(true);
  };

  const renderLink = (item: NavItem) => {
    const accent = ACCENT[item.id ?? "overview"] ?? "#B6FF7E";
    const current = isCurrent(item.id);
    return (
      <li key={`${item.id ?? "overview"}-${item.label}`}>
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
  };

  return (
    <div
      ref={rootRef}
      className={`map-nav ${open ? "is-open" : "is-collapsed"} ${pinned ? "is-pinned" : ""}`}
      onMouseEnter={openNow}
      onMouseLeave={scheduleClose}
      onFocusCapture={openNow}
    >
      <button
        type="button"
        className="map-nav-tab"
        aria-expanded={open}
        aria-controls={panelId}
        title="Map — alternative navigation"
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
        <ul className="map-nav-list">{lone.slice(0, 1).map(renderLink)}</ul>

        {groups.map((g) => (
          <div key={g.heading} className="map-nav-group">
            <p className="map-nav-subhead">{g.heading}</p>
            <ul className="map-nav-list">{g.items.map(renderLink)}</ul>
          </div>
        ))}

        {lone.length > 1 ? (
          <ul className="map-nav-list map-nav-list--tail">{lone.slice(1).map(renderLink)}</ul>
        ) : null}
      </nav>
    </div>
  );
}
