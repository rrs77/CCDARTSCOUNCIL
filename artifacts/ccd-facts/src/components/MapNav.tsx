import { Map as MapIcon } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Presentation } from "@/content/layoutPresentation";
import { SECTION_ACCENT } from "@/content/sectionAccent";

type NavItem = { id: string | null; label: string };
type NavGroup = { heading: string; items: NavItem[] };

const ACCENT = SECTION_ACCENT;

function buildGroups(presentation: Presentation): { lone: NavItem[]; groups: NavGroup[] } {
  const byId = new Map(presentation.frames.filter((f) => !f.parentId).map((f) => [f.id, f]));
  const pick = (id: string, fallback: string): NavItem | null => {
    const f = byId.get(id);
    if (!f) return null;
    return { id: f.id, label: fallback || f.navLabel || f.title };
  };

  const lone: NavItem[] = [{ id: null, label: "Overview" }];
  const situation = pick("the-situation", "The situation");
  if (situation) lone.push(situation);

  const groups: NavGroup[] = [];
  const stages = [
    pick("primary", "Primary"),
    pick("secondary-and-access", "Secondary and access"),
    pick("a-level", "A-level"),
  ].filter(Boolean) as NavItem[];
  if (stages.length) groups.push({ heading: "Key stages", items: stages });

  const after = [
    pick("higher-education", "Higher education"),
    pick("music-hubs-and-national-centre", "Music Hubs / National Centre"),
  ].filter(Boolean) as NavItem[];
  if (after.length) groups.push({ heading: "After school", items: after });

  const solution = pick("a-solution", "A solution");
  if (solution) lone.push(solution);

  const sources = pick("sources", "Sources");
  if (sources) lone.push(sources);

  return { lone, groups };
}

/**
 * Alternative navigation: collapsed Map chip / slim bar;
 * expands to a narrow (~220px) menu on hover, focus, or tap.
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
  const closeTimer = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const { lone, groups } = buildGroups(presentation);

  const clearClose = useCallback(() => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 260);
  }, [clearClose]);

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
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  // Tap outside collapses on touch devices
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
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
    setOpen(false);
  };

  const renderLink = (item: NavItem) => {
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
  };

  return (
    <div
      ref={rootRef}
      className={`map-nav ${open ? "is-open" : "is-collapsed"}`}
      onMouseEnter={openNow}
      onMouseLeave={scheduleClose}
      onFocusCapture={openNow}
    >
      <button
        type="button"
        className="map-nav-tab"
        aria-expanded={open}
        aria-controls={panelId}
        title="Map"
        onClick={() => setOpen((v) => !v)}
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
        <ul className="map-nav-list">{lone.slice(0, 2).map(renderLink)}</ul>

        {groups.map((g) => (
          <div key={g.heading} className="map-nav-group">
            <p className="map-nav-subhead">{g.heading}</p>
            <ul className="map-nav-list">{g.items.map(renderLink)}</ul>
          </div>
        ))}

        {lone.length > 2 ? (
          <ul className="map-nav-list map-nav-list--tail">{lone.slice(2).map(renderLink)}</ul>
        ) : null}
      </nav>
    </div>
  );
}
