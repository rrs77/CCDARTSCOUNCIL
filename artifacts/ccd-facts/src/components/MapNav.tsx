import { Map as MapIcon } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Presentation } from "@/content/layoutPresentation";
import { SECTION_ACCENT } from "@/content/sectionAccent";

type NavItem = { id: string | null; label: string };
type NavGroup = { heading: string; items: NavItem[] };

const ACCENT = SECTION_ACCENT;

/**
 * Nested Map menu — short labels only (never the long document title).
 * Overview → The situation → Key stages → After school → A solution
 */
function buildMenu(presentation: Presentation): {
  lone: NavItem[];
  groups: NavGroup[];
  destIds: Set<string>;
} {
  const byId = new Map(presentation.frames.map((f) => [f.id, f]));
  const pick = (id: string, label: string): NavItem | null =>
    byId.has(id) ? { id, label } : null;

  // Overview + opening title as “The situation” — not the full # document title
  const lone: NavItem[] = [
    { id: null, label: "Overview" },
    ...(pick("title", "The situation") ? [pick("title", "The situation")!] : []),
  ];

  const groups: NavGroup[] = [];

  const stages = [
    pick("primary-eyfs-ks2", "Primary"),
    pick("secondary", "Secondary"),
    pick("gcse", "GCSE"),
    pick("a-level", "A-level"),
  ].filter(Boolean) as NavItem[];
  if (stages.length) groups.push({ heading: "Key stages", items: stages });

  const after = [
    pick("university-he", "Higher education"),
    pick("music-hubs-and-national-centre", "Music Hubs and National Centre"),
  ].filter(Boolean) as NavItem[];
  if (after.length) groups.push({ heading: "After school", items: after });

  const solution = pick("a-solution", "CCDesigner");
  if (solution) groups.push({ heading: "A solution", items: [solution] });

  const sources = pick("sources", "Sources");
  if (sources) groups.push({ heading: "Sources", items: [sources] });

  const destIds = new Set<string>();
  for (const item of [...lone, ...groups.flatMap((g) => g.items)]) {
    if (item.id) destIds.add(item.id);
  }

  return { lone, groups, destIds };
}

/**
 * Map chip: one “Map” label inside the button only (no second Map heading).
 * Closed by default — click/tap to open; click again or mouse leave to close.
 * Does not open on load or on hover.
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
  const { lone, groups, destIds } = buildMenu(presentation);

  const clearClose = useCallback(() => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearClose();
    closeTimer.current = window.setTimeout(() => {
      setPinned(false);
      setOpen(false);
    }, 250);
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
    const focused = presentation.frames.find((x) => x.id === focusId);
    if (!focused) return false;
    // Dedicated Map row (e.g. Music Hubs) owns its own highlight — don’t light the parent
    if (destIds.has(focusId)) return false;
    // Unlisted leaf → highlight its hub row
    return focused.mainSectionId === id;
  };

  const go = (id: string | null) => {
    if (id === null) onOverview();
    else onJump(id);
    setPinned(false);
    setOpen(false);
  };

  const onTabClick = () => {
    if (open) {
      setPinned(false);
      setOpen(false);
      return;
    }
    clearClose();
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
      onMouseLeave={scheduleClose}
      onMouseEnter={clearClose}
    >
      <button
        type="button"
        className="map-nav-tab"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Map"
        title="Map — alternative navigation"
        onClick={onTabClick}
      >
        <MapIcon className="map-nav-tab-icon" strokeWidth={2.25} aria-hidden />
        <span className="map-nav-tab-text">Map</span>
      </button>

      <nav
        id={panelId}
        className="map-nav-panel"
        aria-label="Sections"
        aria-hidden={!open}
        inert={!open ? true : undefined}
      >
        <div className="map-nav-panel-inner">
          {/* One Map label lives in the tab only — never repeat a Map heading here */}
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
