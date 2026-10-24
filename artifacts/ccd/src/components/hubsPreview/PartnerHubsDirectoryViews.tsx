import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Heart,
  Landmark,
  LayoutGrid,
  List,
  MapPin,
  Rows3,
  Search,
  ShoppingBag,
  Users,
} from 'lucide-react';
import {
  consumePaidResourcesReturn,
  openPartnerHub,
  stashPaidResourcesReturn,
  type PartnerHubConfig,
} from '../../config/partnerHubs';
import {
  formatPricePence,
  getPaidProductsForPartner,
  type PaidPartnerSlug,
} from '../../config/paidPartnerProducts';
import {
  ARTS_ORGANISATIONS,
  DISCIPLINES,
  type Discipline,
  type OrgEntry,
  PAID_RESOURCES,
  orgListingMeta,
} from './hubsPreviewContent';

const ink = 'text-[#1F1B4D]';
const muted = 'text-[#1F1B4D]/65';

const AGE_GROUPS = ['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5'] as const;
const ART_FORMS = ['Music', 'Drama', 'Dance', 'Art & design', 'Cross-arts'] as const;
type ArtFormFilter = (typeof ART_FORMS)[number] | 'All';
const RESOURCE_TYPES = ['Resources', 'CPD', 'Projects', 'Workshops', 'Schemes of work', 'Lesson packs'] as const;
type ResourceTypeFilter = (typeof RESOURCE_TYPES)[number] | 'All';
const PAID_RESOURCE_TYPES = ['Scheme of work', 'Lesson packs', 'CPD course'] as const;
type PaidTypeFilter = (typeof PAID_RESOURCE_TYPES)[number] | 'All';

/**
 * One unique venue/building photo per Music Hub — never reuse across cards,
 * never the rehearsal collage. Files live at `/music-hubs/covers/{hubId}.jpg`.
 */
const HUB_COVER_ALIASES: Record<string, string> = {
  'essex-southend-on-sea-and-thurrock': 'greater-essex',
  triborough: 'tri-borough',
  'west-of-england': 'west-of-england-avon',
};

/**
 * Wide wordmark strip — partner logos are landscape marks; keep full mark readable (never crop).
 * Size matches Activity Library card density (grid ≈ activity card; compact tighter).
 */
function OrgLogoStrip({
  hub,
  size = 'grid',
}: {
  hub: PartnerHubConfig;
  size?: 'grid' | 'compact';
}) {
  const src = hub.logoSrcOnDark || hub.logoSrc;
  const onDark = Boolean(hub.logoSrcOnDark) || hub.logoInvert;
  const usePlate = !hub.logoSrcOnDark && hub.logoOnPlate;
  const bg = usePlate
    ? hub.logoPanelColor && hub.logoPanelColor !== 'transparent'
      ? hub.logoPanelColor
      : '#FFFFFF'
    : hub.logoPanelColor || hub.primaryColor || '#1F1B4D';
  const needsInvert = onDark && !hub.logoSrcOnDark && hub.logoInvert;
  const shell =
    size === 'compact'
      ? 'flex h-9 w-full items-center justify-start overflow-hidden rounded-lg py-1 pl-3 pr-12'
      : 'flex h-12 w-full items-center justify-start overflow-hidden rounded-lg py-2 pl-4 pr-14';
  /** Fixed logo box: every logo renders at one height, left-aligned, clear of the heart (pr = safe zone). */
  const img =
    size === 'compact'
      ? 'h-6 max-h-6 w-auto max-w-full object-contain object-left'
      : 'h-8 max-h-8 w-auto max-w-full object-contain object-left';
  return (
    <div
      className={shell}
      style={{ backgroundColor: bg === 'transparent' ? '#FFFFFF' : bg }}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        className={`${img} ${needsInvert ? 'brightness-0 invert' : ''}`}
      />
    </div>
  );
}

/** Compact mark for list rows only. */
function OrgLogoMark({ hub }: { hub: PartnerHubConfig }) {
  const src = hub.logoSrcOnDark || hub.logoSrc;
  const usePlate = !hub.logoSrcOnDark && hub.logoOnPlate;
  const invert = !hub.logoSrcOnDark && !hub.logoOnPlate && hub.logoInvert;
  return (
    <span
      className="flex h-11 w-[4.5rem] shrink-0 items-center justify-center overflow-hidden rounded-lg px-1.5 ring-1 ring-[#1F1B4D]/10"
      style={{
        backgroundColor: usePlate
          ? hub.logoPanelColor && hub.logoPanelColor !== 'transparent'
            ? hub.logoPanelColor
            : '#FFFFFF'
          : hub.primaryColor || '#1F1B4D',
      }}
    >
      <img src={src} alt="" className={`h-6 w-auto max-w-full object-contain ${invert ? 'brightness-0 invert' : ''}`} />
    </span>
  );
}

function FacetGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1F1B4D]/45">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function FacetRow({
  label,
  count,
  active,
  onClick,
  accent = '#4338E8',
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  accent?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] font-medium transition ${
        active ? 'text-white' : 'text-[#1F1B4D] hover:bg-[#F4F3FA]'
      }`}
      style={active ? { backgroundColor: accent } : undefined}
    >
      <span>{label}</span>
      {typeof count === 'number' && (
        <span className={`tabular-nums text-[12px] ${active ? 'text-white/80' : 'text-[#1F1B4D]/45'}`}>{count}</span>
      )}
    </button>
  );
}

function DirectorySearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-[#1F1B4D]/10 bg-white px-3.5 focus-within:border-[#4338E8]/45 focus-within:ring-4 focus-within:ring-[#4338E8]/10">
      <Search className="h-4 w-4 shrink-0 text-[#1F1B4D]/40" aria-hidden />
      <span className="sr-only">{placeholder}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-[#1F1B4D] outline-none placeholder:text-[#1F1B4D]/40"
      />
    </label>
  );
}

function matchesAge(entry: OrgEntry, age: string | 'All'): boolean {
  if (age === 'All') return true;
  const hay = orgListingMeta(entry.hub.slug).ageRanges.join(' ').toLowerCase();
  if (age === 'EYFS') return /eyfs|early|all ages/i.test(hay);
  if (age === 'KS1') return /ks1|primary|5–11|5-11|all ages/i.test(hay);
  if (age === 'KS2') return /ks2|primary|5–11|5-11|all ages/i.test(hay);
  if (age === 'KS3') return /ks3|secondary|11–16|11-16|11–14|all ages/i.test(hay);
  if (age === 'KS4') return /ks4|gcse|secondary|11–16|14|ks5|all ages/i.test(hay);
  if (age === 'KS5') return /ks5|a-level|sixth|post-16|all ages|secondary/i.test(hay);
  return true;
}

function matchesArtForm(entry: OrgEntry, form: ArtFormFilter): boolean {
  if (form === 'All') return true;
  if (form === 'Cross-arts') return entry.disciplines.length >= 2;
  return entry.disciplines.includes(form as Discipline);
}

function matchesResourceType(entry: OrgEntry, type: ResourceTypeFilter): boolean {
  if (type === 'All') return true;
  const tags = orgListingMeta(entry.hub.slug).tags;
  if (type === 'Schemes of work') return tags.some((t) => /scheme|pack|curriculum/i.test(t));
  if (type === 'Lesson packs') return tags.some((t) => /pack|resources|teacher/i.test(t));
  return tags.includes(type);
}

function artFormSubtitle(entry: OrgEntry): string {
  if (entry.disciplines.length === 0) return orgListingMeta(entry.hub.slug).artForms[0] || 'Arts';
  if (entry.disciplines.length >= 2) return entry.disciplines.slice(0, 2).join(' · ');
  return entry.disciplines[0];
}

function FilterChip({
  label,
  active,
  onClick,
  accent = '#1A1A40',
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  accent?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition ${
        active
          ? 'text-white shadow-[0_6px_16px_-10px_rgba(26,26,64,0.55)]'
          : 'bg-white text-[#1F1B4D] ring-1 ring-inset ring-[#1F1B4D]/12 hover:ring-[#1F1B4D]/25'
      }`}
      style={active ? { backgroundColor: accent } : undefined}
    >
      {label}
      <ChevronDown className={`h-3.5 w-3.5 ${active ? 'opacity-80' : 'opacity-45'}`} aria-hidden />
    </button>
  );
}

function AgeCheckboxRow({
  label,
  count,
  checked,
  onChange,
  accent = '#4338E8',
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
  accent?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-[13px] font-medium text-[#1F1B4D] hover:bg-[#F4F3FA]"
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
          checked ? 'border-transparent text-white' : 'border-[#1F1B4D]/25 bg-white'
        }`}
        style={checked ? { backgroundColor: accent } : undefined}
        aria-hidden
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M2 6.2 4.8 9 10 3.5" />
          </svg>
        )}
      </span>
      <span className="min-w-0 flex-1">{label}</span>
      <span className="tabular-nums text-[12px] text-[#1F1B4D]/45">{count}</span>
    </button>
  );
}

function ViewToggle({
  view,
  onView,
}: {
  view: 'grid' | 'list';
  onView: (v: 'grid' | 'list') => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-xl ring-1 ring-inset ring-[#1F1B4D]/12" role="group" aria-label="Result layout">
      <button
        type="button"
        aria-pressed={view === 'grid'}
        aria-label="Grid view"
        onClick={() => onView('grid')}
        className={`flex h-9 w-9 items-center justify-center transition ${
          view === 'grid' ? 'bg-[#1F1B4D] text-white' : 'bg-white text-[#1F1B4D]/55 hover:text-[#1F1B4D]'
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-pressed={view === 'list'}
        aria-label="List view"
        onClick={() => onView('list')}
        className={`flex h-9 w-9 items-center justify-center transition ${
          view === 'list' ? 'bg-[#1F1B4D] text-white' : 'bg-white text-[#1F1B4D]/55 hover:text-[#1F1B4D]'
        }`}
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}

function orgAgeCount(age: (typeof AGE_GROUPS)[number], pool: OrgEntry[]) {
  return pool.filter((o) => matchesAge(o, age)).length;
}

function artFormCount(form: ArtFormFilter, pool: OrgEntry[]) {
  if (form === 'All') return pool.length;
  return pool.filter((o) => matchesArtForm(o, form)).length;
}

type OrgViewMode = 'grid' | 'list' | 'compact';

/** Shared Activity Library–style density for Partner Hubs card grids. */
export const HUBS_GRID_COLS_MIN = 2;
export const HUBS_GRID_COLS_MAX = 7;
export const HUBS_GRID_CARD_MIN_PX = 210;
const ORG_GRID_COLS_MIN = HUBS_GRID_COLS_MIN;
const ORG_GRID_COLS_MAX = HUBS_GRID_COLS_MAX;
const ORG_GRID_CARD_MIN_PX = HUBS_GRID_CARD_MIN_PX;
const ORG_VIEW_STORAGE_KEY = 'ccd-orgs-directory-view';
const ORG_COLS_STORAGE_KEY = 'ccd-orgs-directory-grid-cols';
const ORG_COLS_PINNED_KEY = 'ccd-orgs-directory-grid-cols-pinned';

/** Arts organisations — left art-form/age facets + Activity Library–sized cards. */
export function ArtsOrganisationsDirectoryView() {
  const [artForm, setArtForm] = useState<ArtFormFilter>('All');
  const [ages, setAges] = useState<Set<string>>(new Set());
  const [resourceType, setResourceType] = useState<ResourceTypeFilter>('All');
  const [q, setQ] = useState('');
  const [view, setView] = useState<OrgViewMode>(() => {
    try {
      const raw = localStorage.getItem(ORG_VIEW_STORAGE_KEY);
      if (raw === 'grid' || raw === 'list' || raw === 'compact') return raw;
    } catch {
      /* ignore */
    }
    return 'grid';
  });
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const colsForWidth = useCallback((width: number) => {
    if (width <= 0) return 4;
    return Math.max(
      ORG_GRID_COLS_MIN,
      Math.min(ORG_GRID_COLS_MAX, Math.floor(width / ORG_GRID_CARD_MIN_PX)),
    );
  }, []);

  const [gridCols, setGridCols] = useState(() => {
    if (typeof window === 'undefined') return 5;
    try {
      const pinned = localStorage.getItem(ORG_COLS_PINNED_KEY) === '1';
      const raw = localStorage.getItem(ORG_COLS_STORAGE_KEY);
      if (pinned && raw) {
        const n = Number(raw);
        if (Number.isFinite(n)) {
          return Math.max(ORG_GRID_COLS_MIN, Math.min(ORG_GRID_COLS_MAX, Math.round(n)));
        }
      }
    } catch {
      /* ignore */
    }
    return colsForWidth(window.innerWidth - 360);
  });
  const [gridColsPinned, setGridColsPinned] = useState(() => {
    try {
      return localStorage.getItem(ORG_COLS_PINNED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const gridMeasureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(ORG_VIEW_STORAGE_KEY, view);
    } catch {
      /* ignore */
    }
  }, [view]);

  useEffect(() => {
    const el = gridMeasureRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (gridColsPinned) return;
      setGridCols(colsForWidth(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [gridColsPinned, colsForWidth]);

  const setGridColsFromSlider = (value: number) => {
    const next = Math.max(ORG_GRID_COLS_MIN, Math.min(ORG_GRID_COLS_MAX, Math.round(value)));
    setGridCols(next);
    setGridColsPinned(true);
    try {
      localStorage.setItem(ORG_COLS_STORAGE_KEY, String(next));
      localStorage.setItem(ORG_COLS_PINNED_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const resetGridColsAuto = () => {
    setGridColsPinned(false);
    try {
      localStorage.removeItem(ORG_COLS_PINNED_KEY);
    } catch {
      /* ignore */
    }
    const w = gridMeasureRef.current?.clientWidth ?? 0;
    setGridCols(colsForWidth(w));
  };

  const artFormCounts = useMemo(() => {
    const c: Record<string, number> = { All: ARTS_ORGANISATIONS.length };
    for (const f of ART_FORMS) c[f] = artFormCount(f, ARTS_ORGANISATIONS);
    return c;
  }, []);

  const ageCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of AGE_GROUPS) c[a] = orgAgeCount(a, ARTS_ORGANISATIONS);
    return c;
  }, []);

  const shown = useMemo(() => {
    return ARTS_ORGANISATIONS.filter((o) => {
      if (!matchesArtForm(o, artForm)) return false;
      if (ages.size > 0 && ![...ages].some((a) => matchesAge(o, a))) return false;
      if (!matchesResourceType(o, resourceType)) return false;
      if (
        q.trim() &&
        !`${o.hub.displayName} ${o.hub.tagline ?? ''} ${orgListingMeta(o.hub.slug).location}`
          .toLowerCase()
          .includes(q.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    }).sort((a, b) =>
      a.hub.displayName.replace(/^The /, '').localeCompare(b.hub.displayName.replace(/^The /, '')),
    );
  }, [artForm, ages, resourceType, q]);

  const toggleAge = (a: string) => {
    setAges((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a);
      else next.add(a);
      return next;
    });
  };

  const toggleSaved = (slug: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const toolBtn =
    'inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#5C5878] hover:bg-[#E9E6FF] hover:text-[#4338E8]';
  const toolBtnOn = 'bg-[#E9E6FF] text-[#4338E8]';

  const renderOrgCard = (o: OrgEntry, density: 'grid' | 'compact') => {
    const meta = orgListingMeta(o.hub.slug);
    const isSaved = saved.has(o.hub.slug);
    const tight = density === 'compact';
    return (
      <article
        className={`group relative flex h-full flex-col overflow-hidden rounded-lg border border-[#1F1B4D]/[0.08] bg-white shadow-soft transition hover:border-[#5B4BDB]/35 hover:shadow-hover ${
          tight ? 'min-h-[7.5rem]' : 'min-h-[9.5rem]'
        }`}
      >
        <div className={`relative ${tight ? 'p-1.5 pb-0' : 'p-2 pb-0'}`}>
          <OrgLogoStrip hub={o.hub} size={density} />
          <button
            type="button"
            aria-label={isSaved ? 'Remove from saved' : 'Save organisation'}
            aria-pressed={isSaved}
            onClick={() => toggleSaved(o.hub.slug)}
            className={`absolute flex items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-[#1F1B4D]/10 transition ${
              tight ? 'right-2.5 top-2.5 h-6 w-6' : 'right-3.5 top-3.5 h-7 w-7'
            } ${isSaved ? 'text-[#E11D48]' : 'text-[#1F1B4D]/40 hover:text-[#E11D48]'}`}
          >
            <Heart className={`${tight ? 'h-3 w-3' : 'h-3.5 w-3.5'} ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
        <div className={`flex flex-1 flex-col ${tight ? 'px-2 pb-2 pt-1.5' : 'px-2.5 pb-2.5 pt-2'}`}>
          <h3
            className={`font-bold tracking-tight leading-snug line-clamp-2 ${ink} ${
              tight ? 'text-[12px]' : 'text-[13px]'
            }`}
            title={o.hub.displayName}
          >
            {o.hub.displayName}
          </h3>
          <p className={`mt-0.5 font-semibold text-[#5B4BDB] ${tight ? 'text-[10px]' : 'text-[11px]'}`}>
            {artFormSubtitle(o)}
          </p>
          <p
            className={`mt-1 leading-snug ${muted} ${
              tight ? 'line-clamp-1 text-[10px]' : 'line-clamp-2 text-[11px]'
            }`}
          >
            {o.hub.tagline || meta.location}
          </p>
          <div className="mt-auto flex justify-end pt-1.5">
            <button
              type="button"
              aria-label={`Open ${o.hub.displayName}`}
              onClick={() => openPartnerHub(o.hub.slug)}
              className={`flex shrink-0 items-center justify-center rounded-full bg-[#E9E6FF] text-[#5B4BDB] transition group-hover:bg-[#5B4BDB] group-hover:text-white ${
                tight ? 'h-6 w-6' : 'h-7 w-7'
              }`}
            >
              <ArrowRight className={tight ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-5">
      <DirectorySearch value={q} onChange={setQ} placeholder="Search organisations…" />

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          label={artForm === 'All' ? 'All art forms' : artForm}
          active={artForm !== 'All'}
          accent="#5B4BDB"
          onClick={() => setArtForm('All')}
        />
        <FilterChip
          label={ages.size ? `Age groups (${ages.size})` : 'Age groups'}
          active={ages.size > 0}
          accent="#5B4BDB"
          onClick={() => setAges(new Set())}
        />
        <FilterChip
          label={resourceType === 'All' ? 'Resource type' : resourceType}
          active={resourceType !== 'All'}
          accent="#5B4BDB"
          onClick={() => setResourceType(resourceType === 'All' ? 'Resources' : 'All')}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="space-y-6 rounded-2xl border border-[#1F1B4D]/[0.08] bg-white p-4 sm:p-5">
          <FacetGroup title="All art forms">
            <FacetRow
              label="All"
              count={artFormCounts.All}
              active={artForm === 'All'}
              onClick={() => setArtForm('All')}
              accent="#5B4BDB"
            />
            {ART_FORMS.map((f) => (
              <FacetRow
                key={f}
                label={f}
                count={artFormCounts[f] ?? 0}
                active={artForm === f}
                onClick={() => setArtForm(f)}
                accent="#5B4BDB"
              />
            ))}
          </FacetGroup>
          <FacetGroup title="Age groups">
            {AGE_GROUPS.map((a) => (
              <AgeCheckboxRow
                key={a}
                label={a}
                count={ageCounts[a] ?? 0}
                checked={ages.has(a)}
                onChange={() => toggleAge(a)}
                accent="#5B4BDB"
              />
            ))}
          </FacetGroup>
        </aside>

        <div className="min-w-0 space-y-3">
          {/* Activity Library–style toolbar */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-xl border border-[#E2E0EF] bg-[#F4F3FA] px-3 py-2">
            <div className="min-w-0 shrink-0 pr-1">
              <h2 className="truncate text-sm font-extrabold tracking-tight text-[#1F1B4D] sm:text-base">
                {shown.length} arts organisation{shown.length === 1 ? '' : 's'}
              </h2>
              <p className="text-[10px] font-medium leading-tight text-[#77738F]">A–Z</p>
            </div>

            {(view === 'grid' || view === 'compact') && (
              <label
                className="flex items-center gap-1.5 rounded-lg border border-[#E2E0EF] bg-white px-2 py-1"
                title={
                  gridColsPinned
                    ? `${gridCols} columns (drag to change; click Auto to fit width)`
                    : `${gridCols} columns (auto-fits to width)`
                }
              >
                <span className="text-[10px] font-bold tabular-nums text-[#5C5878]">{gridCols}</span>
                <input
                  type="range"
                  min={ORG_GRID_COLS_MIN}
                  max={ORG_GRID_COLS_MAX}
                  step={1}
                  value={gridCols}
                  onChange={(e) => setGridColsFromSlider(Number(e.target.value))}
                  className="h-1 w-16 cursor-pointer accent-[#4338E8] sm:w-20"
                  aria-label="Organisations per row"
                />
                <button
                  type="button"
                  onClick={resetGridColsAuto}
                  className={`rounded px-1 text-[9px] font-extrabold uppercase tracking-wide ${
                    gridColsPinned ? 'text-[#4338E8] hover:bg-[#E9E6FF]' : 'text-[#77738F]'
                  }`}
                >
                  Auto
                </button>
              </label>
            )}

            <div className="ml-auto flex flex-wrap items-center gap-0.5">
              <button
                type="button"
                onClick={() => setView('grid')}
                className={`${toolBtn} ${view === 'grid' ? toolBtnOn : ''}`}
                title="Grid view"
                aria-pressed={view === 'grid'}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className={`${toolBtn} ${view === 'list' ? toolBtnOn : ''}`}
                title="List view"
                aria-pressed={view === 'list'}
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setView('compact')}
                className={`${toolBtn} ${view === 'compact' ? toolBtnOn : ''}`}
                title="Compact view"
                aria-pressed={view === 'compact'}
              >
                <Rows3 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div ref={gridMeasureRef}>
            {view === 'list' ? (
              <ul className="overflow-hidden rounded-xl border border-[#1F1B4D]/[0.08] bg-white" role="list">
                {shown.map((o) => {
                  const meta = orgListingMeta(o.hub.slug);
                  const isSaved = saved.has(o.hub.slug);
                  return (
                    <li key={o.hub.slug} className="border-b border-[#1F1B4D]/[0.06] last:border-0">
                      <div className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-[#F4F3FA]">
                        <button
                          type="button"
                          onClick={() => openPartnerHub(o.hub.slug)}
                          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                        >
                          <OrgLogoMark hub={o.hub} />
                          <span className="min-w-0 flex-1">
                            <span className={`block truncate text-[13px] font-bold ${ink}`}>
                              {o.hub.displayName}
                            </span>
                            <span className="block truncate text-[11px] font-semibold text-[#5B4BDB]">
                              {artFormSubtitle(o)}
                            </span>
                            <span className={`block truncate text-[11px] ${muted}`}>
                              {o.hub.tagline || meta.location}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          aria-label={isSaved ? 'Remove from saved' : 'Save organisation'}
                          aria-pressed={isSaved}
                          onClick={() => toggleSaved(o.hub.slug)}
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
                            isSaved ? 'text-[#E11D48]' : 'text-[#1F1B4D]/35 hover:text-[#E11D48]'
                          }`}
                        >
                          <Heart className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Open ${o.hub.displayName}`}
                          onClick={() => openPartnerHub(o.hub.slug)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E9E6FF] text-[#5B4BDB]"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ul
                className="grid gap-3"
                style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
                role="list"
              >
                {shown.map((o) => (
                  <li key={o.hub.slug}>{renderOrgCard(o, view === 'compact' ? 'compact' : 'grid')}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type PaidListing = {
  id: string;
  title: string;
  partnerSlug: string;
  partnerName: string;
  description: string;
  type: (typeof PAID_RESOURCE_TYPES)[number];
  pricePence: number;
  priceLabel: string;
  subject: Discipline | 'Cross-arts';
  ages: string[];
  hub?: PartnerHubConfig;
  logoLabel?: string;
  logoBg?: string;
};

function paidTypeFromMeta(title: string, meta?: string): (typeof PAID_RESOURCE_TYPES)[number] {
  const hay = `${title} ${meta ?? ''}`.toLowerCase();
  if (/cpd|course|forum|workshop/.test(hay)) return 'CPD course';
  if (/scheme|curriculum|pathway|milestones/.test(hay)) return 'Scheme of work';
  return 'Lesson packs';
}

function paidSubjectFromPartner(slug: string, name: string): Discipline | 'Cross-arts' {
  if (/drama|theatre|weteachdrama|dramaresource/i.test(`${slug} ${name}`)) return 'Drama';
  if (/dance|step into/i.test(`${slug} ${name}`)) return 'Dance';
  if (/art|kapow|gallery|tate/i.test(`${slug} ${name}`)) return 'Art & design';
  if (/music|compose|jazz|charanga|ems|triborough/i.test(`${slug} ${name}`)) return 'Music';
  return 'Music';
}

/**
 * Paid resources tab — only these three companies (owner brief).
 * Music Hub offerings and other catalogues are excluded.
 */
const PAID_TAB_SLUGS = new Set(['dramaresource', 'icompose', 'weteachdrama']);

/**
 * One card per company — Drama Resource, iCompose, We Teach Drama only.
 */
function buildPaidListings(): PaidListing[] {
  return PAID_RESOURCES.filter((o) => PAID_TAB_SLUGS.has(o.hub.slug))
    .map((o) => {
      const products = getPaidProductsForPartner(o.hub.slug as PaidPartnerSlug);
      const priced = products.filter((p) => p.pricePence > 0);
      const from = priced.sort((a, b) => a.pricePence - b.pricePence)[0] ?? products[0];
      const type = from ? paidTypeFromMeta(from.title, from.meta) : 'Lesson packs';
      return {
        id: o.hub.slug,
        title: o.hub.displayName,
        partnerSlug: o.hub.slug,
        partnerName: o.hub.displayName,
        description: o.hub.tagline || 'Schemes, packs and courses for the classroom.',
        type,
        pricePence: from?.pricePence ?? 0,
        priceLabel: from
          ? from.pricePence === 0
            ? 'Free'
            : `From ${formatPricePence(from.pricePence)} / year`
          : 'See pricing',
        subject: (o.disciplines[0] as Discipline) || paidSubjectFromPartner(o.hub.slug, o.hub.displayName),
        ages: ['EYFS', 'KS1', 'KS2', 'KS3', 'KS4'],
        hub: o.hub,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

const PAID_TYPE_TONE: Record<(typeof PAID_RESOURCE_TYPES)[number], string> = {
  'Scheme of work': 'bg-[#FEF3C7] text-[#92400E]',
  'Lesson packs': 'bg-[#E0E7FF] text-[#4338E8]',
  'CPD course': 'bg-[#FCE7F3] text-[#9D174D]',
};

const PAID_VIEW_STORAGE_KEY = 'ccd-paid-directory-view';
const PAID_COLS_STORAGE_KEY = 'ccd-paid-directory-grid-cols';
const PAID_COLS_PINNED_KEY = 'ccd-paid-directory-grid-cols-pinned';
type PaidViewMode = 'grid' | 'list' | 'compact';

/** Paid resources — Activity Library–sized cards + size slider / grid / list / compact. */
export function PaidResourcesDirectoryView() {
  const listings = useMemo(() => buildPaidListings(), []);
  const restoredRef = useRef(false);
  const [subject, setSubject] = useState<ArtFormFilter>('All');
  const [ages, setAges] = useState<Set<string>>(new Set());
  const [resourceType, setResourceType] = useState<PaidTypeFilter>('All');
  const [q, setQ] = useState('');
  const [view, setView] = useState<PaidViewMode>(() => {
    try {
      const raw = localStorage.getItem(PAID_VIEW_STORAGE_KEY);
      if (raw === 'grid' || raw === 'list' || raw === 'compact') return raw;
    } catch {
      /* ignore */
    }
    return 'grid';
  });
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const colsForWidth = useCallback((width: number) => {
    if (width <= 0) return 4;
    return Math.max(
      ORG_GRID_COLS_MIN,
      Math.min(ORG_GRID_COLS_MAX, Math.floor(width / ORG_GRID_CARD_MIN_PX)),
    );
  }, []);

  const [gridCols, setGridCols] = useState(() => {
    if (typeof window === 'undefined') return 5;
    try {
      const pinned = localStorage.getItem(PAID_COLS_PINNED_KEY) === '1';
      const raw = localStorage.getItem(PAID_COLS_STORAGE_KEY);
      if (pinned && raw) {
        const n = Number(raw);
        if (Number.isFinite(n)) {
          return Math.max(ORG_GRID_COLS_MIN, Math.min(ORG_GRID_COLS_MAX, Math.round(n)));
        }
      }
    } catch {
      /* ignore */
    }
    return colsForWidth(window.innerWidth - 360);
  });
  const [gridColsPinned, setGridColsPinned] = useState(() => {
    try {
      return localStorage.getItem(PAID_COLS_PINNED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const gridMeasureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(PAID_VIEW_STORAGE_KEY, view);
    } catch {
      /* ignore */
    }
  }, [view]);

  useEffect(() => {
    const el = gridMeasureRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (gridColsPinned) return;
      setGridCols(colsForWidth(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [gridColsPinned, colsForWidth]);

  const setGridColsFromSlider = (value: number) => {
    const next = Math.max(ORG_GRID_COLS_MIN, Math.min(ORG_GRID_COLS_MAX, Math.round(value)));
    setGridCols(next);
    setGridColsPinned(true);
    try {
      localStorage.setItem(PAID_COLS_STORAGE_KEY, String(next));
      localStorage.setItem(PAID_COLS_PINNED_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const resetGridColsAuto = () => {
    setGridColsPinned(false);
    try {
      localStorage.removeItem(PAID_COLS_PINNED_KEY);
    } catch {
      /* ignore */
    }
    const w = gridMeasureRef.current?.clientWidth ?? 0;
    setGridCols(colsForWidth(w));
  };

  // Restore filters + scroll after returning from a paid Partner Hub.
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const stashed = consumePaidResourcesReturn();
    if (!stashed?.filters) {
      if (stashed && stashed.scrollY > 0) {
        requestAnimationFrame(() => window.scrollTo(0, stashed.scrollY));
      }
      return;
    }
    const f = stashed.filters;
    if (ART_FORMS.includes(f.subject as (typeof ART_FORMS)[number]) || f.subject === 'All') {
      setSubject(f.subject as ArtFormFilter);
    }
    if (Array.isArray(f.ages)) setAges(new Set(f.ages.filter(Boolean)));
    if (
      PAID_RESOURCE_TYPES.includes(f.resourceType as (typeof PAID_RESOURCE_TYPES)[number]) ||
      f.resourceType === 'All'
    ) {
      setResourceType(f.resourceType as PaidTypeFilter);
    }
    if (typeof f.q === 'string') setQ(f.q);
    if (f.view === 'grid' || f.view === 'list' || f.view === 'compact') setView(f.view);
    const y = stashed.scrollY;
    if (y > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => window.scrollTo(0, y));
      });
    }
  }, []);

  const subjectCounts = useMemo(() => {
    const c: Record<string, number> = { All: listings.length };
    for (const f of ART_FORMS) {
      c[f] =
        f === 'Cross-arts'
          ? listings.filter((l) => l.subject === 'Cross-arts').length
          : listings.filter((l) => l.subject === f).length;
    }
    return c;
  }, [listings]);

  const ageCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of AGE_GROUPS) c[a] = listings.filter((l) => l.ages.includes(a)).length;
    return c;
  }, [listings]);

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = { All: listings.length };
    for (const t of PAID_RESOURCE_TYPES) c[t] = listings.filter((l) => l.type === t).length;
    return c;
  }, [listings]);

  const shown = useMemo(() => {
    return listings
      .filter((l) => {
        if (subject !== 'All' && subject !== 'Cross-arts' && l.subject !== subject) return false;
        if (subject === 'Cross-arts' && l.subject !== 'Cross-arts') return false;
        if (ages.size > 0 && ![...ages].some((a) => l.ages.includes(a))) return false;
        if (resourceType !== 'All' && l.type !== resourceType) return false;
        if (
          q.trim() &&
          !`${l.title} ${l.partnerName} ${l.description}`.toLowerCase().includes(q.trim().toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.pricePence - a.pricePence || a.title.localeCompare(b.title));
  }, [listings, subject, ages, resourceType, q]);

  const toggleAge = (a: string) => {
    setAges((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a);
      else next.add(a);
      return next;
    });
  };

  const toggleSaved = (id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openListing = (l: PaidListing) => {
    if (!l.hub) return;
    const params = new URLSearchParams(window.location.search);
    params.set('page', 'browse');
    params.set('section', 'paid-resources');
    stashPaidResourcesReturn({
      path: `${window.location.pathname}?${params.toString()}`,
      scrollY: window.scrollY,
      filters: {
        subject,
        ages: [...ages],
        resourceType,
        q,
        view,
      },
    });
    openPartnerHub(l.hub.slug);
  };

  const toolBtn =
    'inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#5C5878] hover:bg-[#FEF3C7] hover:text-[#B45309]';
  const toolBtnOn = 'bg-[#FEF3C7] text-[#B45309]';

  const renderPaidCard = (l: PaidListing, density: 'grid' | 'compact') => {
    const isSaved = saved.has(l.id);
    const tight = density === 'compact';
    return (
      <article
        className={`group relative flex h-full flex-col overflow-hidden rounded-lg border border-[#1F1B4D]/[0.08] bg-white shadow-soft transition hover:border-[#B45309]/40 hover:shadow-hover ${
          tight ? 'min-h-[7.5rem]' : 'min-h-[9.5rem]'
        }`}
      >
        <div className={`relative ${tight ? 'p-1.5 pb-0' : 'p-2 pb-0'}`}>
          {l.hub ? (
            <OrgLogoStrip hub={l.hub} size={density} />
          ) : (
            <div
              className={`flex w-full items-center justify-center overflow-hidden rounded-lg px-2 text-[11px] font-bold text-white ${
                tight ? 'h-9' : 'h-12'
              }`}
              style={{ backgroundColor: l.logoBg || '#92400E' }}
            >
              {l.logoLabel || l.partnerName}
            </div>
          )}
          <button
            type="button"
            aria-label={isSaved ? 'Remove from saved' : 'Save resource'}
            aria-pressed={isSaved}
            onClick={() => toggleSaved(l.id)}
            className={`absolute flex items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-[#1F1B4D]/10 transition ${
              tight ? 'right-2.5 top-2.5 h-6 w-6' : 'right-3.5 top-3.5 h-7 w-7'
            } ${isSaved ? 'text-[#E11D48]' : 'text-[#1F1B4D]/40 hover:text-[#E11D48]'}`}
          >
            <Heart className={`${tight ? 'h-3 w-3' : 'h-3.5 w-3.5'} ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
        <div className={`flex flex-1 flex-col ${tight ? 'px-2 pb-2 pt-1.5' : 'px-2.5 pb-2.5 pt-2'}`}>
          <p className={`font-semibold text-[#B45309] ${tight ? 'text-[10px]' : 'text-[11px]'}`}>{l.subject}</p>
          <h3
            className={`mt-0.5 font-bold leading-snug tracking-tight line-clamp-2 ${ink} ${
              tight ? 'text-[12px]' : 'text-[13px]'
            }`}
            title={l.title}
          >
            {l.title}
          </h3>
          <p
            className={`mt-1 leading-snug ${muted} ${
              tight ? 'line-clamp-1 text-[10px]' : 'line-clamp-2 text-[11px]'
            }`}
          >
            {l.description}
          </p>
          <span
            className={`mt-1.5 w-fit rounded-full font-bold ${PAID_TYPE_TONE[l.type]} ${
              tight ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
            }`}
          >
            {l.type}
          </span>
          <div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
            <p className={`font-bold text-[#92400E] ${tight ? 'text-[11px]' : 'text-[12px]'}`}>{l.priceLabel}</p>
            <button
              type="button"
              aria-label={`Open ${l.title}`}
              onClick={() => openListing(l)}
              disabled={!l.hub}
              className={`flex shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[#92400E] transition enabled:group-hover:bg-[#B45309] enabled:group-hover:text-white disabled:opacity-50 ${
                tight ? 'h-6 w-6' : 'h-7 w-7'
              }`}
            >
              <ArrowRight className={tight ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-5">
      <DirectorySearch value={q} onChange={setQ} placeholder="Search paid resources…" />

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          label={subject === 'All' ? 'Subject' : subject}
          active={subject !== 'All'}
          accent="#B45309"
          onClick={() => setSubject('All')}
        />
        <FilterChip
          label={ages.size ? `Age groups (${ages.size})` : 'Age groups'}
          active={ages.size > 0}
          accent="#B45309"
          onClick={() => setAges(new Set())}
        />
        <FilterChip
          label={resourceType === 'All' ? 'Resource type' : resourceType}
          active={resourceType !== 'All'}
          accent="#B45309"
          onClick={() => setResourceType(resourceType === 'All' ? 'Scheme of work' : 'All')}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="space-y-6 rounded-2xl border border-[#1F1B4D]/[0.08] bg-white p-4 sm:p-5">
          <FacetGroup title="Subject">
            <FacetRow
              label="All"
              count={subjectCounts.All}
              active={subject === 'All'}
              onClick={() => setSubject('All')}
              accent="#B45309"
            />
            {ART_FORMS.map((f) => (
              <FacetRow
                key={f}
                label={f}
                count={subjectCounts[f] ?? 0}
                active={subject === f}
                onClick={() => setSubject(f)}
                accent="#B45309"
              />
            ))}
          </FacetGroup>
          <FacetGroup title="Age groups">
            {AGE_GROUPS.map((a) => (
              <AgeCheckboxRow
                key={a}
                label={a}
                count={ageCounts[a] ?? 0}
                checked={ages.has(a)}
                onChange={() => toggleAge(a)}
                accent="#B45309"
              />
            ))}
          </FacetGroup>
          <FacetGroup title="Resource type">
            <FacetRow
              label="All"
              count={typeCounts.All}
              active={resourceType === 'All'}
              onClick={() => setResourceType('All')}
              accent="#B45309"
            />
            {PAID_RESOURCE_TYPES.map((t) => (
              <FacetRow
                key={t}
                label={t}
                count={typeCounts[t] ?? 0}
                active={resourceType === t}
                onClick={() => setResourceType(t)}
                accent="#B45309"
              />
            ))}
          </FacetGroup>
        </aside>

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-xl border border-[#E2E0EF] bg-[#F4F3FA] px-3 py-2">
            <div className="min-w-0 shrink-0 pr-1">
              <h2 className="truncate text-sm font-extrabold tracking-tight text-[#1F1B4D] sm:text-base">
                {shown.length} paid resource{shown.length === 1 ? '' : 's'}
              </h2>
              <p className="text-[10px] font-medium leading-tight text-[#77738F]">Popular</p>
            </div>

            {(view === 'grid' || view === 'compact') && (
              <label
                className="flex items-center gap-1.5 rounded-lg border border-[#E2E0EF] bg-white px-2 py-1"
                title={
                  gridColsPinned
                    ? `${gridCols} columns (drag to change; click Auto to fit width)`
                    : `${gridCols} columns (auto-fits to width)`
                }
              >
                <span className="text-[10px] font-bold tabular-nums text-[#5C5878]">{gridCols}</span>
                <input
                  type="range"
                  min={ORG_GRID_COLS_MIN}
                  max={ORG_GRID_COLS_MAX}
                  step={1}
                  value={gridCols}
                  onChange={(e) => setGridColsFromSlider(Number(e.target.value))}
                  className="h-1 w-16 cursor-pointer accent-[#B45309] sm:w-20"
                  aria-label="Paid resources per row"
                />
                <button
                  type="button"
                  onClick={resetGridColsAuto}
                  className={`rounded px-1 text-[9px] font-extrabold uppercase tracking-wide ${
                    gridColsPinned ? 'text-[#B45309] hover:bg-[#FEF3C7]' : 'text-[#77738F]'
                  }`}
                >
                  Auto
                </button>
              </label>
            )}

            <div className="ml-auto flex flex-wrap items-center gap-0.5">
              <button
                type="button"
                onClick={() => setView('grid')}
                className={`${toolBtn} ${view === 'grid' ? toolBtnOn : ''}`}
                title="Grid view"
                aria-pressed={view === 'grid'}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className={`${toolBtn} ${view === 'list' ? toolBtnOn : ''}`}
                title="List view"
                aria-pressed={view === 'list'}
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setView('compact')}
                className={`${toolBtn} ${view === 'compact' ? toolBtnOn : ''}`}
                title="Compact view"
                aria-pressed={view === 'compact'}
              >
                <Rows3 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div ref={gridMeasureRef}>
            {view === 'list' ? (
              <ul className="overflow-hidden rounded-xl border border-[#1F1B4D]/[0.08] bg-white" role="list">
                {shown.map((l) => {
                  const isSaved = saved.has(l.id);
                  return (
                    <li key={l.id} className="border-b border-[#1F1B4D]/[0.06] last:border-0">
                      <div className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-[#FFFBEB]">
                        <button
                          type="button"
                          onClick={() => openListing(l)}
                          disabled={!l.hub}
                          className="flex min-w-0 flex-1 items-center gap-2.5 text-left disabled:opacity-50"
                        >
                          {l.hub ? (
                            <OrgLogoMark hub={l.hub} />
                          ) : (
                            <span
                              className="flex h-9 w-14 shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white"
                              style={{ backgroundColor: l.logoBg || '#92400E' }}
                            >
                              {(l.logoLabel || l.partnerName).slice(0, 3)}
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className={`block truncate text-[13px] font-bold ${ink}`}>{l.title}</span>
                            <span className="block truncate text-[11px] font-semibold text-[#B45309]">
                              {l.subject} · {l.type}
                            </span>
                            <span className={`block truncate text-[11px] ${muted}`}>{l.priceLabel}</span>
                          </span>
                        </button>
                        <button
                          type="button"
                          aria-label={isSaved ? 'Remove from saved' : 'Save resource'}
                          aria-pressed={isSaved}
                          onClick={() => toggleSaved(l.id)}
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
                            isSaved ? 'text-[#E11D48]' : 'text-[#1F1B4D]/35 hover:text-[#E11D48]'
                          }`}
                        >
                          <Heart className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Open ${l.title}`}
                          onClick={() => openListing(l)}
                          disabled={!l.hub}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[#92400E] disabled:opacity-50"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ul
                className="grid gap-3"
                style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
                role="list"
              >
                {shown.map((l) => (
                  <li key={l.id}>{renderPaidCard(l, view === 'compact' ? 'compact' : 'grid')}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Section tabs — large coloured cards; each tab keeps its own selected tint. */
export function PartnerSectionTabs({
  section,
  onSection,
}: {
  section: 'music-hubs' | 'organisations' | 'paid-resources';
  onSection: (s: 'music-hubs' | 'organisations' | 'paid-resources') => void;
}) {
  const tabs = [
    {
      id: 'music-hubs' as const,
      label: 'Music Hubs',
      hint: 'Map and local areas',
      Icon: Users,
      on: 'bg-[#0F5C52] text-white shadow-[0_8px_20px_-12px_rgba(15,92,82,0.55)]',
      off: 'bg-[#E8F3EF] text-[#1F1B4D] hover:bg-[#DCEEE7]',
      chipOn: 'bg-white/15',
      chipOff: 'bg-[#0F5C52]',
      hintOn: 'text-white/75',
    },
    {
      id: 'organisations' as const,
      label: 'Arts organisations',
      hint: 'Free cultural resources',
      Icon: Landmark,
      on: 'bg-[#6B5CE0] text-white shadow-[0_8px_20px_-12px_rgba(107,92,224,0.5)]',
      off: 'bg-[#EEEAFB] text-[#1F1B4D] hover:bg-[#E4DEF8]',
      chipOn: 'bg-white/15',
      chipOff: 'bg-[#6B5CE0]',
      hintOn: 'text-white/75',
    },
    {
      id: 'paid-resources' as const,
      label: 'Paid resources',
      hint: 'Schemes and courses',
      Icon: ShoppingBag,
      // Pale yellow selected (mockup) — not a heavy solid orange
      on: 'bg-[#F5E7A0] text-[#6B4410] shadow-[0_8px_20px_-12px_rgba(180,140,40,0.35)] ring-1 ring-[#E5C84A]/70',
      off: 'bg-[#FBF3D8] text-[#7A4E0C] hover:bg-[#F7EAC0]',
      chipOn: 'bg-[#C47A1A]',
      chipOff: 'bg-[#C47A1A]',
      hintOn: 'text-[#6B4410]/70',
    },
  ];

  return (
    <div role="tablist" aria-label="Partner Hubs sections" className="flex flex-wrap items-stretch gap-2.5">
      {tabs.map((tab) => {
        const selected = section === tab.id;
        const Icon = tab.Icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSection(tab.id)}
            className={`inline-flex max-w-full items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-left transition sm:px-4 sm:py-3 ${
              selected ? tab.on : tab.off
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${
                selected ? tab.chipOn : tab.chipOff
              }`}
              aria-hidden
            >
              <Icon className="h-4 w-4 text-white" strokeWidth={2.2} />
            </span>
            <span className="min-w-0 pr-1">
              <span className="block text-[14px] font-bold tracking-tight sm:text-[15px]">{tab.label}</span>
              <span className={`mt-0.5 block text-[11px] font-medium sm:text-[12px] ${selected ? tab.hintOn : 'opacity-70'}`}>
                {tab.hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Search + All regions / Music / Age groups / Opportunities + List view (target). */
export function MusicHubToolbar({
  searchSlot,
  view,
  onView,
}: {
  searchSlot?: React.ReactNode;
  view?: 'grid' | 'list' | 'compact';
  onView?: (v: 'grid' | 'list' | 'compact') => void;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="min-w-0 flex-1">
        {searchSlot ?? (
          <label className="flex h-11 items-center gap-2.5 rounded-2xl border border-[#1F1B4D]/10 bg-white px-4 shadow-[0_1px_2px_rgba(31,27,77,0.04)]">
            <Search className="h-4 w-4 text-[#1F1B4D]/40" aria-hidden />
            <input
              placeholder="Search hubs, places or resources…"
              className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-[#1F1B4D] outline-none placeholder:text-[#1F1B4D]/40"
            />
          </label>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {['All regions', 'Music', 'Age groups', 'Opportunities'].map((label) => (
          <button
            key={label}
            type="button"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-[#1F1B4D] ring-1 ring-inset ring-[#1F1B4D]/12"
          >
            {label}
            <ChevronDown className="h-3.5 w-3.5 opacity-45" aria-hidden />
          </button>
        ))}
        {onView && (
          <div className="ml-auto inline-flex items-center gap-0.5 rounded-xl border border-[#E2E0EF] bg-white p-0.5">
            <button
              type="button"
              onClick={() => onView('grid')}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
                view === 'grid' ? 'bg-[#E4F4EF] text-[#0B6B5F]' : 'text-[#5C5878] hover:bg-[#F4FBF7]'
              }`}
              title="Grid view"
              aria-pressed={view === 'grid'}
            >
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onView('list')}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
                view === 'list' ? 'bg-[#E4F4EF] text-[#0B6B5F]' : 'text-[#5C5878] hover:bg-[#F4FBF7]'
              }`}
              title="List view"
              aria-pressed={view === 'list'}
            >
              <List className="h-3.5 w-3.5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onView('compact')}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
                view === 'compact' ? 'bg-[#E4F4EF] text-[#0B6B5F]' : 'text-[#5C5878] hover:bg-[#F4FBF7]'
              }`}
              title="Compact view"
              aria-pressed={view === 'compact'}
            >
              <Rows3 className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Resolve a hub id to its dedicated cover asset (one file per hub). */
export function hubCoverSrc(id: string) {
  const coverId = HUB_COVER_ALIASES[id] ?? id;
  return `/music-hubs/covers/${coverId}.jpg`;
}

/**
 * Hub card badge logo — favicon/site mark when available, neat monogram fallback otherwise.
 * Assets live at `/music-hubs/logos/hub/{hubId}.png`.
 */
export function hubLogoSrc(id: string) {
  const logoId = HUB_COVER_ALIASES[id] ?? id;
  return `/music-hubs/logos/hub/${logoId}.png`;
}

/**
 * Card hero mark — official hub logo on a light panel, or a brand-colour wordmark tile.
 * Assets live at `/music-hubs/logos/hero/{hubId}.png` (640×280, object-fit: contain).
 */
export function hubHeroSrc(id: string) {
  const logoId = HUB_COVER_ALIASES[id] ?? id;
  return `/music-hubs/logos/hero/${logoId}.png`;
}

/** Soft-tint wordmark fallbacks when no official logo is available (full panel fill). */
const HUB_WORDMARKS: Record<string, { color: string; tint: string; label: string }> = {
  berkshire: { color: '#9D174D', tint: '#F3E0E8', label: 'Berkshire Music Hub' },
  'cheshire-and-wirral': { color: '#0F766E', tint: '#DCEEEB', label: 'Cheshire & Wirral Music Hub' },
  'cornwall-and-the-isles-of-scilly': { color: '#1D4ED8', tint: '#DDE6FA', label: 'Cornwall & Isles of Scilly Music Hub' },
  cumbria: { color: '#1E3A8A', tint: '#DEE4F1', label: 'Cumbria Music Hub' },
  'derby-and-derbyshire': { color: '#7C2D12', tint: '#EFE0D9', label: 'Derby & Derbyshire Music Hub' },
  'devon-plymouth-and-torbay': { color: '#4C1D95', tint: '#E7DFF2', label: 'Devon, Plymouth & Torbay Music Hub' },
  'gloucestershire-swindon-and-wiltshire': {
    color: '#BE123C',
    tint: '#F6DCE4',
    label: 'Gloucestershire, Swindon & Wiltshire Music Hub',
  },
  'leicester-and-leicestershire': { color: '#4338E8', tint: '#E4E2FB', label: 'Leicester & Leicestershire Music Hub' },
  'london-south-east': { color: '#4338E8', tint: '#E4E2FB', label: 'London South East Music Hub' },
  'north-and-south-of-tyne-and-darlington': {
    color: '#A16207',
    tint: '#F3E9D6',
    label: 'North & South of Tyne and Darlington Music Hub',
  },
  surrey: { color: '#1E3A8A', tint: '#DEE4F1', label: 'Surrey Music Hub' },
  sussex: { color: '#0F766E', tint: '#DCEEEB', label: 'Sussex Music Hub' },
  'tri-borough': { color: '#0B6B5F', tint: '#D9EEEA', label: 'Tri-borough Music Hub' },
  'west-of-england-avon': { color: '#1D4ED8', tint: '#DDE6FA', label: 'West of England (Avon) Music Hub' },
};

export function hubWordmark(id: string) {
  const logoId = HUB_COVER_ALIASES[id] ?? id;
  return HUB_WORDMARKS[logoId] ?? null;
}

/** Friendly card title — e.g. "Essex Music Hub", "Cambridgeshire Music". */
export function musicHubCardTitle(id: string, fullName: string, lead?: string) {
  if (id === 'cambridgeshire-and-peterborough') return 'Cambridgeshire Music';
  if (id.includes('essex') || /essex/i.test(fullName)) return 'Greater Essex Music Hub';
  if (id === 'tri-borough' || id === 'triborough' || /tri-?borough/i.test(fullName)) return 'Tri-borough Music Hub';
  if (/suffolk/i.test(fullName) || id.includes('suffolk')) return 'Suffolk Music Hub';
  if (lead && /music$/i.test(lead) && lead.length < 40) return lead;
  return fullName
    .replace(/ Music Education Hub$/i, ' Music Hub')
    .replace(/ and Peterborough/i, '')
    .replace(/ \(BLMK\)/, '');
}

export function musicHubCardDetail(id: string, lead?: string, ladCount?: number): string {
  if (id.includes('essex')) return 'Music education, projects and CPD across Essex.';
  if (id === 'cambridgeshire-and-peterborough') return 'Inspiring music making across Cambridgeshire.';
  if (id === 'tri-borough' || id === 'triborough') return 'Supporting music education across the tri-borough area.';
  if (lead) return `${lead} delivers music education across ${ladCount ?? 0} local areas.`;
  return `Music education hub covering ${ladCount ?? 0} local areas.`;
}

/** Compact hub card for the map+cards side-by-side layout (target). */
export function MusicHubResultCard({
  id,
  name,
  region,
  location,
  detail,
  onOpen,
  compact = false,
}: {
  id: string;
  name: string;
  region: string;
  location: string;
  detail: string;
  onOpen: () => void;
  compact?: boolean;
}) {
  const [saved, setSaved] = useState(false);
  const [heroFailed, setHeroFailed] = useState(false);
  const wordmark = hubWordmark(id);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-[#1F1B4D]/[0.08] bg-white text-left shadow-soft transition hover:border-[#0B6B5F]/35 hover:shadow-hover">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-col text-left">
        <div
          className={`relative flex shrink-0 items-center justify-center overflow-hidden ring-1 ring-inset ring-[#1F1B4D]/[0.04] ${
            compact ? 'h-12' : 'h-[72px]'
          }`}
          style={wordmark ? { backgroundColor: wordmark.tint } : { backgroundColor: '#FFFFFF' }}
        >
          {wordmark ? (
            <span
              className="line-clamp-2 px-2 text-center text-[13px] font-bold leading-snug tracking-tight"
              style={{ color: wordmark.color }}
            >
              {wordmark.label}
            </span>
          ) : !heroFailed ? (
            <img
              src={hubHeroSrc(id)}
              alt=""
              className={`w-[82%] object-contain transition duration-500 group-hover:scale-[1.02] ${
                compact ? 'h-[78%] max-h-8' : 'h-[80%] max-h-[56px]'
              }`}
              loading="lazy"
              onError={() => setHeroFailed(true)}
            />
          ) : (
            <span
              className="line-clamp-2 px-2 text-center text-[13px] font-bold leading-snug text-[#0B6B5F]"
            >
              {name}
            </span>
          )}
          <span className="absolute left-1 top-1 inline-flex max-w-[70%] truncate items-center rounded-full bg-white/95 px-1.5 py-0.5 text-[13px] font-bold leading-none text-[#1F1B4D] shadow-sm ring-1 ring-[#1F1B4D]/[0.06]">
            {region}
          </span>
        </div>
        <div className={`relative flex flex-col ${compact ? 'px-2 pb-1.5 pt-1.5' : 'px-2.5 pb-2 pt-2'}`}>
          <h3
            className={`line-clamp-2 font-bold leading-snug tracking-tight ${ink} ${
              compact ? 'text-[13px]' : 'text-[14px]'
            }`}
          >
            {name}
          </h3>
          <p className={`mt-0.5 truncate font-medium ${muted} text-[13px]`}>
            {location}
          </p>
          {!compact && <p className={`mt-1 line-clamp-2 text-[13px] leading-snug ${muted}`}>{detail}</p>}
          <div className="mt-1.5 flex justify-end">
            <span
              className={`flex shrink-0 items-center justify-center rounded-full bg-[#E4F4EF] text-[#0B6B5F] transition group-hover:bg-[#0B6B5F] group-hover:text-white ${
                compact ? 'h-5 w-5' : 'h-6 w-6'
              }`}
            >
              <ArrowRight className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} aria-hidden />
            </span>
          </div>
        </div>
      </button>
      <button
        type="button"
        aria-label={saved ? 'Remove from saved' : 'Save hub'}
        aria-pressed={saved}
        onClick={(e) => {
          e.stopPropagation();
          setSaved((v) => !v);
        }}
        className={`absolute z-10 flex items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-[#1F1B4D]/10 ${
          compact ? 'right-1 top-1 h-5 w-5' : 'right-1.5 top-1.5 h-6 w-6'
        } ${saved ? 'text-[#E11D48]' : 'text-[#1F1B4D]/40 hover:text-[#E11D48]'}`}
      >
        <Heart className={`${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} ${saved ? 'fill-current' : ''}`} />
      </button>
    </article>
  );
}

export function MusicHubListRow({
  name,
  region,
  location,
  onOpen,
}: {
  name: string;
  region: string;
  location: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl border border-[#1F1B4D]/[0.08] bg-white px-4 py-3.5 text-left transition hover:border-[#4338E8]/30 hover:bg-[#F8F7FF]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E9E6FF] text-[13px] font-bold text-[#4338E8]">
        {name.replace(/^The /, '').charAt(0)}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[14px] font-bold ${ink}`}>{name}</span>
        <span className={`mt-0.5 flex items-center gap-1 truncate text-[12px] ${muted}`}>
          <MapPin className="h-3 w-3 shrink-0" aria-hidden />
          {location || region}
        </span>
      </span>
      <span className="hidden text-[12px] font-semibold text-[#4338E8] sm:inline">Explore →</span>
    </button>
  );
}

/** Results header controls — sort + grid/list. */
export function MusicHubsResultsHeader({
  title,
  subtitle,
  view,
  onView,
}: {
  title: string;
  subtitle: string;
  view: 'grid' | 'list';
  onView: (v: 'grid' | 'list') => void;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 id="music-hubs-results" className="text-[22px] font-bold tracking-tight text-[#1F1B4D] sm:text-[24px]">
          {title}
        </h2>
        <p className={`mt-0.5 max-w-xl text-[14px] leading-snug ${muted}`}>{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-white px-3.5 text-[12px] font-semibold text-[#1F1B4D] ring-1 ring-inset ring-[#1F1B4D]/10"
        >
          Sort by: A–Z
          <ChevronDown className="h-3.5 w-3.5 opacity-50" aria-hidden />
        </button>
        <ViewToggle view={view} onView={onView} />
      </div>
    </div>
  );
}

/** Selected area panel — chips and CTA are interactive. */
export function SelectedAreaPanel({
  title,
  hubCount,
  blurb,
  localAreas,
  onViewHubs,
  onSelectLocalArea,
  statLabel,
}: {
  title: string;
  hubCount: number;
  blurb: string;
  localAreas: string[];
  onViewHubs: () => void;
  onSelectLocalArea?: (name: string) => void;
  /** Override the default “N Music Hubs Across {title}” line. */
  statLabel?: string;
}) {
  const stat =
    statLabel ??
    `${hubCount} Music Hub${hubCount === 1 ? '' : 's'} Across ${title === 'England' ? 'England' : title}`;

  return (
    <aside className="flex h-full min-h-[260px] flex-col rounded-2xl border border-[#1F1B4D]/[0.08] bg-white p-5 shadow-[0_1px_2px_rgba(31,27,77,0.04)] sm:p-6">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#1F1B4D]/45">Selected area</p>

      <div className="mt-3 min-w-0">
        <h3 className="text-[22px] font-bold leading-tight tracking-tight text-[#1F1B4D] sm:text-[24px]">{title}</h3>
        <p className="mt-2 flex items-center gap-2 text-[14px] font-semibold text-[#1F1B4D]">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E4F4EF] text-[#0B6B5F]" aria-hidden>
            <Users className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <span>{stat}</span>
        </p>
      </div>

      <p className={`mt-3 text-[13px] leading-relaxed ${muted}`}>{blurb}</p>

      {localAreas.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#1F1B4D]/45">Local areas</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {localAreas.slice(0, 8).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => onSelectLocalArea?.(a)}
                className="rounded-full bg-[#E4F4EF] px-2.5 py-1 text-[12px] font-semibold text-[#0B6B5F] transition hover:bg-[#0B6B5F] hover:text-white"
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onViewHubs}
        className="mt-auto inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0B6B5F] px-4 text-[14px] font-bold text-white shadow-[0_10px_24px_-14px_rgba(11,107,95,0.55)] transition hover:bg-[#085549]"
      >
        View hubs in {title} <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </aside>
  );
}

/** Saved + Browse map actions for the Partner Hubs page header. */
export function PartnerHubsHeaderActions({
  savedCount = 3,
  onBrowseMap,
}: {
  savedCount?: number;
  onBrowseMap?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-white px-3.5 text-[13px] font-semibold text-[#1F1B4D] ring-1 ring-inset ring-[#1F1B4D]/10"
      >
        <Heart className="h-4 w-4 text-[#4338E8]" aria-hidden />
        Saved ({savedCount})
      </button>
      <button
        type="button"
        onClick={onBrowseMap}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-[#E9E6FF] px-3.5 text-[13px] font-semibold text-[#4338E8] transition hover:bg-[#D8D4F5]"
      >
        <MapPin className="h-4 w-4" aria-hidden />
        Browse map
      </button>
    </div>
  );
}
