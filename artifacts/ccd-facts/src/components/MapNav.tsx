import { Map as MapIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Presentation } from "@/content/layoutPresentation";
import { SECTION_ACCENT } from "@/content/sectionAccent";

type NavItem = { id: string | null; label: string };
type NavGroup = { heading: string; items: NavItem[] };

const ACCENT = SECTION_ACCENT;

/**
 * Nested Map menu — short labels only (never the long document title).
 * Overview → Key stages → After school
 */
function buildMenu(presentation: Presentation): {
  lone: NavItem[];
  groups: NavGroup[];
  destIds: Set<string>;
} {
  const byId = new Map(presentation.frames.map((f) => [f.id, f]));
  const pick = (id: string, label: string): NavItem | null =>
    byId.has(id) ? { id, label } : null;

  const lone: NavItem[] = [{ id: null, label: "Overview" }];

  const groups: NavGroup[] = [];

  const stages = [
    pick("eyfs", "EYFS"),
    pick("enrichment-framework", "Enrichment"),
    pick("primary-ks1-ks2", "Primary"),
    pick("secondary", "Secondary"),
    pick("gcse", "GCSE"),
    pick("a-level", "A-level"),
  ].filter(Boolean) as NavItem[];
  if (stages.length) groups.push({ heading: "Key stages", items: stages });

  const place = [
    pick("cold-spots-place-and-income", "Cold spots"),
    pick("university-he", "Higher education"),
  ].filter(Boolean) as NavItem[];
  if (place.length) groups.push({ heading: "Place and HE", items: place });

  const after = [
    pick("music-hubs-and-national-centre", "Music Hubs and National Centre"),
    pick("national-plans-and-free-resources", "National plans"),
    pick("a-solution", "A solution"),
  ].filter(Boolean) as NavItem[];
  if (after.length) groups.push({ heading: "After school", items: after });

  const destIds = new Set<string>();
  for (const item of [...lone, ...groups.flatMap((g) => g.items)]) {
    if (item.id) destIds.add(item.id);
  }

  return { lone, groups, destIds };
}

/**
 * Map chip: one “Map” label inside the button only.
 * Closed by default — click/tap to open; click again, Escape, or outside click to close.
 * No mouse-leave close (panel sits outside the tab hitbox).
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
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const { lone, groups, destIds } = buildMenu(presentation);

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

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  const isCurrent = (id: string | null) => {
    if (id === null) return focusId === null;
    if (focusId === id) return true;
    if (!focusId) return false;
    const focused = presentation.frames.find((x) => x.id === focusId);
    if (!focused) return false;
    if (destIds.has(focusId)) return false;
    return focused.mainSectionId === id;
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
    <div ref={rootRef} className={`map-nav ${open ? "is-open" : "is-collapsed"}`}>
      <button
        type="button"
        className="map-nav-tab"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Map"
        title="Map — alternative navigation"
        onClick={() => setOpen((was) => !was)}
      >
        <MapIcon className="map-nav-tab-icon" strokeWidth={2.25} aria-hidden />
      </button>

      <nav
        id={panelId}
        className="map-nav-panel"
        aria-label="Sections"
        aria-hidden={!open}
        inert={!open ? true : undefined}
      >
        <div className="map-nav-panel-inner">
          <ul className="map-nav-list">{lone.map(renderLink)}</ul>

          {groups.map((g) => (
            <div key={g.heading} className="map-nav-group">
              <p className="map-nav-subhead">{g.heading}</p>
              <ul className="map-nav-list">{g.items.map(renderLink)}</ul>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
