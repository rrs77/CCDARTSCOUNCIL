import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  ExternalLink,
  FileText,
  Info,
  KeyRound,
  LayoutGrid,
  Library,
  List,
  Lock,
  Mail,
  MapPin,
  Music2,
  Pencil,
  Phone,
  Rows3,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { openPartnerHub } from '../../config/partnerHubs';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContextNew';
import { getDefaultSectionIdForYearGroup } from '../../utils/yearGroupSectionOrder';
import { UkHubMap } from './UkHubMap';
import { ManageHubDialog } from './ManageHubDialog';
import {
  ENGLAND,
  type MapFocus,
  type MapHub,
  type MapIndex,
  type MapLad,
  focusFromPath,
  focusName,
  focusPath,
  hubLabel,
  parentFocus,
} from './ukHubMapData';
import {
  DISCIPLINES,
  type Discipline,
  NATION_NOTES,
  ORGANISATIONS,
  type OrgEntry,
  organisationBrand,
} from './hubsPreviewContent';
import {
  ArtsOrganisationsDirectoryView,
  HUBS_GRID_CARD_MIN_PX,
  HUBS_GRID_COLS_MAX,
  HUBS_GRID_COLS_MIN,
  MusicHubListRow,
  MusicHubResultCard,
  MusicHubToolbar,
  PaidResourcesDirectoryView,
  PartnerHubsHeaderActions,
  PartnerSectionTabs,
  musicHubCardDetail,
  musicHubCardTitle,
} from './PartnerHubsDirectoryViews';
import {
  ACCESS_LABEL,
  type Contact,
  type Directory,
  type HubResource,
  type HubRole,
  type HubService,
  PHASES,
  type Phase,
  RELATIONSHIP_LABEL,
  atLeast,
  canUseAccessCodes,
  isLocked,
  loadPartnerData,
  logEngagement,
  myHubRole,
  openLockedResource,
  paragraphs,
  redeemAccessCode,
  reloadPartnerData,
} from './partnerDirectory';

const LOADING_DIRECTORY: Directory = {
  source: 'bundled',
  hub: (id) => ({ id, relationship: 'directory_listing' }),
  services: () => [],
  serviceFor: () => undefined,
  area: () => undefined,
  resources: [],
  resourcesForHub: () => [],
  resourcesForArea: () => ({ local: [], shared: [] }),
};
const DirectoryContext = createContext<Directory>(LOADING_DIRECTORY);
const useDirectory = () => useContext(DirectoryContext);

const serviceRole = (s: HubService) => (s.role === 'lead' ? 'Hub Lead Organisation' : 'Music service');
const shortHubName = (hub: MapHub) => hubLabel(hub).replace(/ Music( Education)? Hub$/, '');

// ---------------------------------------------------------------------------
// URL state: ?page=browse|hub|area&at=england/east-of-england/...&section=&view=
// ---------------------------------------------------------------------------

type Page = 'browse' | 'hub' | 'area';
type Section = 'music-hubs' | 'organisations' | 'paid-resources';

const SECTIONS: Section[] = ['music-hubs', 'organisations', 'paid-resources'];

interface Route {
  page: Page;
  at: string[];
  section: Section;
  tab: HubTab;
}

type HubTab = 'resources' | 'events' | 'about' | 'contact';

function readRoute(): Route {
  const p = new URLSearchParams(window.location.search);
  const page = (p.get('page') as Page) || 'browse';
  const sectionRaw = p.get('section') || '';
  const section: Section = SECTIONS.includes(sectionRaw as Section)
    ? (sectionRaw as Section)
    : 'music-hubs';
  return {
    page: ['browse', 'hub', 'area'].includes(page) ? page : 'browse',
    at: (p.get('at') || '').split('/').filter(Boolean),
    section,
    tab: (['resources', 'events', 'about', 'contact'].includes(p.get('view') || '') ? p.get('view') : 'resources') as HubTab,
  };
}

function writeRoute(r: Partial<Route>, replace = false) {
  const cur = readRoute();
  const next = { ...cur, ...r };
  const p = new URLSearchParams(window.location.search);
  p.delete('hubs');
  p.set('page', next.page);
  if (next.at.length) p.set('at', next.at.join('/'));
  else p.delete('at');
  if (next.section !== 'music-hubs') p.set('section', next.section);
  else p.delete('section');
  if (next.page === 'hub' && next.tab !== 'resources') p.set('view', next.tab);
  else p.delete('view');
  const url = `${window.location.pathname}?${p.toString()}`;
  if (replace) window.history.replaceState(null, '', url);
  else window.history.pushState(null, '', url);
  window.dispatchEvent(new Event('ccd:hubs-route'));
}

function useRoute() {
  const [route, setRoute] = useState<Route>(readRoute);
  useEffect(() => {
    const on = () => setRoute(readRoute());
    window.addEventListener('popstate', on);
    window.addEventListener('ccd:hubs-route', on);
    return () => {
      window.removeEventListener('popstate', on);
      window.removeEventListener('ccd:hubs-route', on);
    };
  }, []);
  return route;
}

/**
 * The redesigned Partner Hubs page is on unless switched off with
 * VITE_PARTNER_HUBS=classic (deployment) or ?hubs=classic (one visit).
 */
export const newPartnerHubsEnabled = () => {
  if (typeof window === 'undefined') return true;
  if (import.meta.env.VITE_PARTNER_HUBS === 'classic') return false;
  return new URLSearchParams(window.location.search).get('hubs') !== 'classic';
};

/** True when the URL is a Partner Hubs deep link, so the Dashboard opens that tab. */
export const isPartnerHubsLink = () => {
  if (typeof window === 'undefined') return false;
  const p = new URLSearchParams(window.location.search);
  return p.get('hubs') === 'preview' || ['browse', 'hub', 'area'].includes(p.get('page') ?? '');
};

// ---------------------------------------------------------------------------

const ink = 'text-[#1F1B4D]';
const muted = 'text-[#1F1B4D]/65';

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'teal' | 'amber' | 'brand' }) {
  const cls = {
    neutral: 'bg-[#002D24]/[0.05] text-[#002D24]/75 ring-[#002D24]/[0.06]',
    teal: 'bg-[#14B8A6]/10 text-[#0B6B5F] ring-[#14B8A6]/20',
    amber: 'bg-[#F59E0B]/10 text-[#8A5300] ring-[#F59E0B]/25',
    brand: 'bg-white/15 text-white ring-white/25',
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] font-medium ring-1 ring-inset ${cls}`}>
      {children}
    </span>
  );
}

function Crumbs({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-[14px]">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-[#1F1B4D]/30" aria-hidden />}
          {it.onClick ? (
            <button type="button" onClick={it.onClick} className="rounded px-1 py-0.5 text-[#1F1B4D]/60 hover:text-[#1F1B4D] hover:underline">
              {it.label}
            </button>
          ) : (
            <span aria-current="page" className="px-1 font-medium text-[#1F1B4D]">
              {it.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

function PrimaryButton({
  children,
  onClick,
  className = '',
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#4338E8] px-4 text-[15px] font-medium text-white shadow-[0_1px_2px_rgba(67,56,232,0.25)] transition hover:bg-[#3529d1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338E8] ${className}`}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  href,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const cls = `inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#1F1B4D]/12 bg-white px-4 text-[15px] font-medium text-[#1F1B4D] transition hover:border-[#1F1B4D]/25 hover:bg-[#F4F3FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338E8] ${className}`;
  if (href)
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {children}
      </a>
    );
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#002D24]/15 bg-white/60 px-6 py-8 text-center">
      <p className={`text-[16px] font-medium ${ink}`}>{title}</p>
      {body && <p className={`mx-auto mt-1 max-w-md text-[15px] ${muted}`}>{body}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Global search
// ---------------------------------------------------------------------------

interface SearchHit {
  group: 'Places' | 'Music Hubs' | 'Organisations' | 'Resources';
  label: string;
  detail: string;
  go: () => void;
}

function GlobalSearch({ ix, onFocusMap }: { ix: MapIndex | null; onFocusMap: (f: MapFocus, page?: Page) => void }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const dir = useContext(DirectoryContext);

  const hits = useMemo<SearchHit[]>(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    const out: SearchHit[] = [];
    const starts = (s: string) => s.toLowerCase().split(/[\s,&()-]+/).some((w) => w.startsWith(term)) || s.toLowerCase().startsWith(term);
    if (ix) {
      const places = ix.data.lads
        .filter((l) => starts(l.name))
        .slice(0, 4)
        .map<SearchHit>((l) => {
          const h = l.hub ? ix.hub(l.hub) : undefined;
          return {
            group: 'Places',
            label: l.name,
            detail: h ? `Local area · ${hubLabel(h)}` : `Local authority · ${ix.nation(l.nation)?.name}`,
            go: () => onFocusMap({ level: 'lad', id: l.code }),
          };
        });
      const regions = ix.data.regions
        .filter((r) => starts(r.name))
        .map<SearchHit>((r) => ({
          group: 'Places',
          label: r.name,
          detail: `Region · ${ix.hubsInRegion(r.code).length} Music Hubs`,
          go: () => onFocusMap({ level: 'region', id: r.code }),
        }));
      out.push(...regions, ...places);
      const hubs = ix.data.hubs
        .filter((h) => starts(h.name) || starts(h.aceAreaName) || (h.leadOrganisation && starts(h.leadOrganisation)) || h.authorities.some(starts))
        .slice(0, 4)
        .map<SearchHit>((h) => ({
          group: 'Music Hubs',
          label: hubLabel(h),
          detail: `Music Hub · ${h.lads.length} areas${h.leadOrganisation ? ` · lead: ${h.leadOrganisation}` : ''}`,
          go: () => onFocusMap({ level: 'hub', id: h.id }, 'hub'),
        }));
      out.push(...hubs);
    }
    out.push(
      ...ORGANISATIONS.filter((o) => starts(o.hub.displayName) || o.disciplines.some((d) => starts(d)))
        .slice(0, 4)
        .map<SearchHit>((o) => ({
          group: 'Organisations',
          label: o.hub.displayName,
          detail: `Organisation · ${o.disciplines.join(', ') || 'Arts'}`,
          go: () => openPartnerHub(o.hub.slug),
        })),
    );
    if (ix && dir) {
      out.push(
        ...dir.resources
          .filter((r) => starts(r.title) || starts(r.subject) || starts(r.provider))
          .slice(0, 3)
          .flatMap<SearchHit>((r) => {
            const scope = r.scopes.find((s) => s.type === 'hub' || s.type === 'area');
            if (!scope) return [];
            const f: MapFocus = scope.type === 'hub' ? { level: 'hub', id: scope.id } : { level: 'lad', id: scope.id };
            return [
              {
                group: 'Resources',
                label: r.title,
                detail: `${r.type} · ${r.provider} · ${r.phaseLabel}`,
                go: () => onFocusMap(f, scope.type === 'hub' ? 'hub' : 'area'),
              },
            ];
          }),
      );
    }
    return out;
  }, [q, ix, dir, onFocusMap]);

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const choose = (h: SearchHit) => {
    setOpen(false);
    setQ('');
    h.go();
  };

  let lastGroup = '';
  return (
    <div ref={boxRef} className="relative">
      <label htmlFor="hubs-search" className="sr-only">
        Search hubs, places, organisations and resources
      </label>
      <div className="flex h-12 items-center gap-3 rounded-2xl border border-[#1F1B4D]/10 bg-white px-4 shadow-[0_1px_2px_rgba(31,27,77,0.04),0_8px_24px_-12px_rgba(31,27,77,0.12)] focus-within:border-[#4338E8]/50 focus-within:ring-4 focus-within:ring-[#4338E8]/12">
        <Search className="h-5 w-5 shrink-0 text-[#1F1B4D]/40" aria-hidden />
        <input
          id="hubs-search"
          role="combobox"
          aria-expanded={open && hits.length > 0}
          aria-controls="hubs-search-list"
          aria-activedescendant={open && hits[active] ? `hubs-hit-${active}` : undefined}
          autoComplete="off"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(hits.length - 1, a + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === 'Enter' && hits[active]) {
              e.preventDefault();
              choose(hits[active]);
            } else if (e.key === 'Escape') setOpen(false);
          }}
          placeholder="Search hubs, places, organisations and resources…"
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-[#1F1B4D] outline-none placeholder:text-[#1F1B4D]/40"
        />
        {q && (
          <button type="button" aria-label="Clear search" onClick={() => setQ('')} className="rounded-full p-1.5 text-[#1F1B4D]/45 hover:bg-[#4338E8]/10">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && q.trim().length >= 2 && (
        <div
          id="hubs-search-list"
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+8px)] z-30 max-h-[420px] overflow-auto rounded-2xl border border-[#1F1B4D]/10 bg-white p-2 shadow-[0_24px_48px_-16px_rgba(31,27,77,0.28)]"
        >
          {hits.length === 0 && <p className={`px-3 py-4 text-[15px] ${muted}`}>No matches for “{q.trim()}”.</p>}
          {hits.map((h, i) => {
            const header = h.group !== lastGroup;
            lastGroup = h.group;
            return (
              <div key={`${h.group}-${h.label}-${i}`}>
                {header && <p className="px-3 pb-1 pt-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1F1B4D]/45">{h.group}</p>}
                <div
                  id={`hubs-hit-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(h);
                  }}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${i === active ? 'bg-[#E9E6FF]' : ''}`}
                >
                  <span className="min-w-0">
                    <span className={`block truncate text-[15px] font-medium ${ink}`}>{h.label}</span>
                    <span className={`block truncate text-[14px] ${muted}`}>{h.detail}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#1F1B4D]/35" aria-hidden />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Map side panel (browse)
// ---------------------------------------------------------------------------

function HubCard({ ix, hub, onOpen, onHover, hovered, regionCode }: {
  ix: MapIndex;
  hub: MapHub;
  onOpen: () => void;
  onHover: (id: string | null) => void;
  hovered: boolean;
  regionCode?: string;
}) {
  const rel = useDirectory().hub(hub.id).relationship;
  const crossNote = regionCode && hub.region !== regionCode ? `Based in ${ix.region(hub.region)?.name}; covers part of this region.` : hub.regionNote;
  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => onHover(hub.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(hub.id)}
      onBlur={() => onHover(null)}
      className={`group w-full rounded-2xl border bg-white p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14B8A6] ${
        hovered ? 'border-[#14B8A6]/50 shadow-[0_8px_24px_-12px_rgba(0,45,36,0.25)]' : 'border-[#002D24]/[0.08] hover:border-[#002D24]/20'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[16px] font-semibold leading-snug ${ink}`}>{hubLabel(hub)}</p>
          <p className={`mt-0.5 text-[14px] ${muted}`}>
            {hub.leadOrganisation ? <>Lead: {hub.leadOrganisation}</> : <>Lead organisation: check Arts Council England</>}
          </p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#002D24]/30 transition group-hover:translate-x-0.5 group-hover:text-[#002D24]" aria-hidden />
      </div>
      <p className={`mt-2 text-[14px] leading-snug ${muted}`}>{hub.authorities.join(' · ')}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge>{hub.lads.length} local areas</Badge>
        {rel !== 'directory_listing' && <Badge tone="teal">{RELATIONSHIP_LABEL[rel]}</Badge>}
      </div>
      {crossNote && <p className="mt-2 text-[13px] text-[#8A5300]">{crossNote}</p>}
    </button>
  );
}

function AreaList({ lads, selected, hover, onHover, onSelect, filter }: {
  lads: MapLad[];
  selected?: string | null;
  hover: string | null;
  onHover: (id: string | null) => void;
  onSelect: (l: MapLad) => void;
  filter: string;
}) {
  const f = filter.trim().toLowerCase();
  const shown = f ? lads.filter((l) => l.name.toLowerCase().includes(f)) : lads;
  if (shown.length === 0) return <p className={`px-1 py-3 text-[15px] ${muted}`}>No area matches “{filter}”.</p>;
  return (
    <ul className="grid grid-cols-2 gap-1.5" role="list">
      {shown.map((l) => {
        const isSel = selected === l.code;
        return (
          <li key={l.code}>
            <button
              type="button"
              aria-pressed={isSel}
              onClick={() => onSelect(l)}
              onMouseEnter={() => onHover(l.code)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(l.code)}
              onBlur={() => onHover(null)}
              className={`flex min-h-[44px] w-full items-center rounded-xl px-3 text-left text-[15px] leading-tight transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#14B8A6] ${
                isSel
                  ? 'bg-[#002D24] font-medium text-white'
                  : hover === l.code
                    ? 'bg-[#8ED5C6]/35 text-[#002D24]'
                    : 'bg-white text-[#002D24] ring-1 ring-inset ring-[#002D24]/[0.07] hover:bg-[#F6F9F7] hover:ring-[#002D24]/15'
              }`}
            >
              {l.name}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The selected area's summary. On large screens it sits in the side panel;
 * on phones and tablets it docks to the bottom of the screen so it is visible
 * straight after tapping the map.
 */
function AreaPreview({ hub, lad, onExplore, onClose }: { hub: MapHub; lad: MapLad; onExplore: () => void; onClose: () => void }) {
  const dir = useDirectory();
  const svc = dir.serviceFor(lad);
  const { local, shared } = dir.resourcesForArea(hub.id, lad.code);
  const body = (
    <>
      <p className={`text-[17px] font-semibold ${ink}`}>{lad.name}</p>
      <p className={`mt-0.5 text-[14px] ${muted}`}>{svc ? `Served by ${svc.name}` : `Part of ${hubLabel(hub)}`}</p>
      {(local.length > 0 || shared.length > 0) && (
        <p className={`mt-2 text-[14px] ${ink}`}>
          {local.length > 0 && (
            <>
              {local.length} local resource{local.length === 1 ? '' : 's'}
              {shared.length > 0 ? ' · ' : ''}
            </>
          )}
          {shared.length > 0 && (
            <>
              {shared.length} shared across {shortHubName(hub)}
            </>
          )}
        </p>
      )}
      <PrimaryButton className="mt-3 w-full" onClick={onExplore}>
        Explore {lad.name} <ArrowRight className="h-4 w-4" />
      </PrimaryButton>
    </>
  );
  return (
    <>
      <div className="hidden rounded-2xl border border-[#14B8A6]/30 bg-[#F2FBF9] p-4 lg:block" aria-live="polite">
        {body}
      </div>
      {createPortal(
        <div
          role="region"
          aria-label={`${lad.name} selected`}
          className="ccd-partner-hubs ccd-sheet-up fixed inset-x-0 bottom-0 z-[70] rounded-t-3xl border-t border-[#002D24]/10 bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-16px_40px_-16px_rgba(0,45,36,0.35)] lg:hidden"
        >
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[#002D24]/15" aria-hidden />
          <button
            type="button"
            onClick={onClose}
            aria-label="Clear selection"
            className="absolute right-3 top-3 rounded-full p-2 text-[#002D24]/55 hover:bg-[#002D24]/5"
          >
            <X className="h-5 w-5" />
          </button>
          {body}
        </div>,
        document.body,
      )}
    </>
  );
}

function FindArea({ value, onChange, label = 'Find your area' }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-xl border border-[#002D24]/10 bg-white px-3 focus-within:border-[#14B8A6]/60 focus-within:ring-4 focus-within:ring-[#14B8A6]/10">
      <MapPin className="h-4 w-4 text-[#002D24]/40" aria-hidden />
      <span className="sr-only">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-[#002D24] outline-none placeholder:text-[#002D24]/40"
      />
    </label>
  );
}

function BrowsePanel({ ix, focus, hover, onHover, go }: {
  ix: MapIndex;
  focus: MapFocus;
  hover: string | null;
  onHover: (id: string | null) => void;
  go: (f: MapFocus, page?: Page) => void;
}) {
  const dir = useDirectory();
  const [filter, setFilter] = useState('');
  useEffect(() => setFilter(''), [focus.level]);

  if (focus.level === 'uk' || (focus.level === 'nation' && focus.id === ENGLAND)) {
    return (
      <div className="space-y-5">
        <div>
          <h3 className={`text-[18px] font-semibold ${ink}`}>England</h3>
          <p className={`mt-1 text-[15px] ${muted}`}>
            {ix.data.hubs.length} Music Hubs funded by Arts Council England, across nine regions.
          </p>
          <ul className="mt-3 divide-y divide-[#002D24]/[0.06] overflow-hidden rounded-2xl border border-[#002D24]/[0.08] bg-white">
            {[...ix.data.regions]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((r) => (
                <li key={r.code}>
                  <button
                    type="button"
                    onClick={() => go({ level: 'region', id: r.code })}
                    onMouseEnter={() => onHover(r.code)}
                    onMouseLeave={() => onHover(null)}
                    onFocus={() => onHover(r.code)}
                    onBlur={() => onHover(null)}
                    className={`flex min-h-[48px] w-full items-center justify-between px-4 text-left text-[15px] transition focus-visible:bg-[#E8F0EA] focus-visible:outline-none ${
                      hover === r.code ? 'bg-[#E8F0EA]' : 'hover:bg-[#F6F8F6]'
                    }`}
                  >
                    <span className={`font-medium ${ink}`}>{r.name}</span>
                    <span className={`flex items-center gap-2 text-[14px] ${muted}`}>
                      {ix.hubsInRegion(r.code).length} hubs <ChevronRight className="h-4 w-4 text-[#002D24]/30" aria-hidden />
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        </div>
        {focus.level === 'uk' && (
          <div>
            <h3 className={`text-[16px] font-semibold ${ink}`}>Wales, Scotland and Northern Ireland</h3>
            <p className={`mt-1 text-[14px] ${muted}`}>Each nation has its own music education structure.</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {['W92000004', 'S92000003', 'N92000002'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => go({ level: 'nation', id: code })}
                  onMouseEnter={() => onHover(code)}
                  onMouseLeave={() => onHover(null)}
                  className={`min-h-[44px] rounded-xl px-2 text-[14px] font-medium transition ${
                    hover === code
                      ? 'bg-[#8ED5C6]/35 text-[#002D24] ring-1 ring-inset ring-[#14B8A6]/30'
                      : 'bg-white text-[#002D24] ring-1 ring-inset ring-[#002D24]/[0.07] hover:ring-[#002D24]/15'
                  }`}
                >
                  {ix.nation(code)?.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (focus.level === 'nation' || (focus.level === 'lad' && !ix.lad(focus.id)?.hub)) {
    const nationCode = focus.level === 'nation' ? focus.id : ix.lad(focus.id)!.nation;
    const note = NATION_NOTES[nationCode];
    const lads = ix.ladsInNation(nationCode);
    const sel = focus.level === 'lad' ? ix.lad(focus.id) : undefined;
    return (
      <div className="space-y-4">
        <div>
          <h3 className={`text-[18px] font-semibold ${ink}`}>{note?.title}</h3>
          <p className={`mt-1 text-[15px] leading-relaxed ${muted}`}>{note?.body}</p>
        </div>
        {sel && (
          <div className="rounded-2xl border border-[#002D24]/[0.08] bg-white p-4">
            <p className={`text-[16px] font-semibold ${ink}`}>{sel.name}</p>
            <p className={`mt-1 text-[14px] ${muted}`}>No verified music service listing yet.</p>
          </div>
        )}
        <div>
          <p className={`mb-2 text-[14px] font-medium ${muted}`}>{lads.length} local authority areas</p>
          <FindArea value={filter} onChange={setFilter} />
          <div className="mt-2">
            <AreaList lads={lads} selected={sel?.code} hover={hover} onHover={onHover} filter={filter} onSelect={(l) => go({ level: 'lad', id: l.code })} />
          </div>
        </div>
      </div>
    );
  }

  if (focus.level === 'region') {
    const r = ix.region(focus.id)!;
    const hubs = ix.hubsInRegion(r.code);
    const home = hubs.filter((h) => h.region === r.code);
    const cross = hubs.filter((h) => h.region !== r.code);
    return (
      <div className="space-y-3">
        <p className={`text-[15px] ${muted}`}>
          <span className={`font-semibold ${ink}`}>{home.length} Music Hubs</span>
          {cross.length ? `, plus ${cross.length} cross-boundary` : ''}. Choose a hub to see its local areas.
        </p>
        {[...home, ...cross].map((h) => (
          <HubCard key={h.id} ix={ix} hub={h} regionCode={r.code} hovered={hover === h.id} onHover={onHover} onOpen={() => go({ level: 'hub', id: h.id })} />
        ))}
      </div>
    );
  }

  const lad = focus.level === 'lad' ? ix.lad(focus.id) : undefined;
  const hub = ix.hub(focus.level === 'hub' ? focus.id : lad!.hub!)!;
  const lads = ix.ladsInHub(hub.id);
  const rel = dir.hub(hub.id).relationship;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#002D24]/[0.08] bg-white p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge>Music Hub</Badge>
          {rel !== 'directory_listing' && <Badge tone="teal">{RELATIONSHIP_LABEL[rel]}</Badge>}
        </div>
        <p className={`mt-2 text-[17px] font-semibold leading-snug ${ink}`}>{hub.name}</p>
        <p className={`mt-1 text-[14px] ${muted}`}>
          {hub.leadOrganisation ? `Lead organisation: ${hub.leadOrganisation}` : 'Lead organisation: check Arts Council England'}
        </p>
        <PrimaryButton className="mt-3 w-full" onClick={() => go({ level: 'hub', id: hub.id }, 'hub')}>
          Open {hubLabel(hub).replace(/ Music( Education)? Hub$/, '')} hub page <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </div>

      {lad && (
        <AreaPreview
          hub={hub}
          lad={lad}
          onExplore={() => go({ level: 'lad', id: lad.code }, 'area')}
          onClose={() => go({ level: 'hub', id: hub.id })}
        />
      )}

      <div>
        <p className={`mb-2 text-[14px] font-medium ${muted}`}>{lads.length} local areas</p>
        <FindArea value={filter} onChange={setFilter} />
        <div className="mt-2">
          <AreaList lads={lads} selected={lad?.code} hover={hover} onHover={onHover} filter={filter} onSelect={(l) => go({ level: 'lad', id: l.code })} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Organisations grid
// ---------------------------------------------------------------------------

function OrgDirectorySection({
  headingId,
  title,
  blurb,
  entries,
  emptyLabel,
}: {
  headingId: string;
  title: string;
  blurb: string;
  entries: OrgEntry[];
  emptyLabel: string;
}) {
  const [discipline, setDiscipline] = useState<Discipline | 'All'>('All');
  const [q, setQ] = useState('');
  const shown = entries.filter(
    (o) =>
      (discipline === 'All' || o.disciplines.includes(discipline)) &&
      (!q.trim() || `${o.hub.displayName} ${o.hub.tagline ?? ''}`.toLowerCase().includes(q.trim().toLowerCase())),
  );
  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id={headingId} className={`text-[22px] font-semibold tracking-tight ${ink}`}>
            {title}
          </h2>
          <p className={`mt-1 text-[14px] leading-snug ${muted}`}>{blurb}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="Filter by discipline" className="flex flex-wrap gap-1.5">
            {(['All', ...DISCIPLINES] as const).map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={discipline === d}
                onClick={() => setDiscipline(d)}
                className={`min-h-[36px] rounded-full px-3 text-[13px] font-medium transition ${
                  discipline === d ? 'bg-[#002D24] text-white' : 'bg-white text-[#002D24] ring-1 ring-inset ring-[#002D24]/10 hover:ring-[#002D24]/25'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <label className="flex h-9 items-center gap-2 rounded-full bg-white px-3 ring-1 ring-inset ring-[#002D24]/10 focus-within:ring-[#14B8A6]/60">
            <Search className="h-4 w-4 text-[#002D24]/40" aria-hidden />
            <span className="sr-only">Filter by name</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name" className="w-36 bg-transparent text-[13px] outline-none" />
          </label>
        </div>
      </div>
      <p className={`text-[13px] ${muted}`}>
        {shown.length} {shown.length === 1 ? 'listing' : 'listings'} · A–Z
      </p>
      {shown.length === 0 ? (
        <EmptyState title={emptyLabel} action={<SecondaryButton onClick={() => { setDiscipline('All'); setQ(''); }}>Clear filters</SecondaryButton>} />
      ) : (
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="list">
          {shown.map((o) => {
            const h = o.hub;
            const usePlate = !h.logoSrcOnDark && h.logoOnPlate;
            const invert = !h.logoSrcOnDark && !h.logoOnPlate && h.logoInvert;
            return (
              <li key={h.slug}>
                <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#002D24]/[0.08] bg-white transition hover:border-[#002D24]/20">
                  <div className="flex h-14 items-center justify-center bg-[#002D24] px-4">
                    {usePlate ? (
                      <span
                        className="flex h-9 w-full max-w-[10rem] items-center justify-center rounded-lg px-2"
                        style={{ backgroundColor: h.logoPanelColor || '#FFFFFF' }}
                      >
                        <img src={h.logoSrc} alt="" loading="lazy" className="h-6 w-auto max-w-full object-contain" />
                      </span>
                    ) : (
                      <img
                        src={h.logoSrcOnDark || h.logoSrc}
                        alt=""
                        loading="lazy"
                        className={`h-8 w-auto max-w-[70%] object-contain ${invert ? 'brightness-0 invert' : ''}`}
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <h3 className={`text-[14px] font-semibold leading-snug ${ink}`}>{h.displayName}</h3>
                    <p className={`text-[12px] ${muted}`}>{o.disciplines.join(' · ') || 'Arts'}</p>
                    {h.tagline && <p className={`line-clamp-1 text-[12px] leading-snug ${muted}`}>{h.tagline}</p>}
                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      <Badge tone={o.access === 'free' ? 'teal' : 'amber'}>{ACCESS_LABEL[o.access]}</Badge>
                      <button
                        type="button"
                        onClick={() => openPartnerHub(h.slug)}
                        className="inline-flex min-h-[32px] items-center gap-1 rounded-lg px-1.5 text-[12px] font-medium text-[#0B6B5F] hover:bg-[#14B8A6]/10"
                        aria-label={`Explore resources from ${h.displayName}`}
                      >
                        Explore <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
      <p className={`text-[12px] ${muted}`}>
        Listings show publicly available resources. A listing does not mean the organisation has endorsed or partnered with CCDesigner.
      </p>
    </section>
  );
}

function OrganisationsSection() {
  return <ArtsOrganisationsDirectoryView />;
}

function PaidResourcesSection() {
  return <PaidResourcesDirectoryView />;
}

// ---------------------------------------------------------------------------
// Resources and the planning workflow
// ---------------------------------------------------------------------------

/** Resources with an existing CCDesigner import; others offer Preview and Source only. */
const PACK_SETUP: Record<string, () => Promise<{ skipped?: boolean }>> = {
  'ems-schools-brochure': async () => (await import('../../utils/setupEMSSchoolsExample')).setupEMSSchoolsExample({ force: true, registerPartnerPlanning: true }),
  'ems-dj-workshop': async () => (await import('../../utils/setupEMSWorkshops')).setupEMSWorkshop('dj', { force: true, registerPartnerPlanning: true }),
  'ems-rap-it-workshop': async () => (await import('../../utils/setupEMSWorkshops')).setupEMSWorkshop('rap-it', { force: true, registerPartnerPlanning: true }),
};

const ADDED_KEY = 'ccd-hubs-preview-added';
const readAdded = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(ADDED_KEY) || '[]');
  } catch {
    return [];
  }
};

const openTab = (tab: string) => {
  window.dispatchEvent(new CustomEvent('ccd:open-tab', { detail: { tab } }));
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function ResourceCard({ r, scopeLabel, onOpen }: { r: HubResource; scopeLabel?: string; onOpen: () => void }) {
  const Icon = r.type === 'PDF' ? FileText : Music2;
  const brand = organisationBrand(r.organisationId)?.color ?? '#002D24';
  const locked = isLocked(r.access);
  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#002D24]/[0.08] bg-white p-5 transition hover:border-[#002D24]/20 hover:shadow-[0_16px_32px_-24px_rgba(0,45,36,0.4)]">
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${brand}12`, color: brand }}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className={`text-[17px] font-semibold leading-snug ${ink}`}>{r.title}</h3>
          <p className={`text-[14px] ${muted}`}>
            {r.type} · {r.subject} · {r.phaseLabel}
          </p>
        </div>
      </div>
      <p className={`mt-3 text-[15px] leading-relaxed ${muted}`}>{r.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone={locked ? 'amber' : 'teal'}>
          {locked && <Lock className="h-3 w-3" aria-hidden />}
          {ACCESS_LABEL[r.access]}
        </Badge>
        <Badge>By {r.provider}</Badge>
        {scopeLabel && <Badge>{scopeLabel}</Badge>}
      </div>
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <PrimaryButton onClick={onOpen}>
          {r.libraryPack && PACK_SETUP[r.libraryPack] ? 'View and add' : 'View resource'} <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </div>
    </article>
  );
}

/** Enter an organisation access code; the server checks it and records the grant. */
function AccessCodeForm({ r, onUnlocked }: { r: HubResource; onUnlocked: () => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!canUseAccessCodes()) {
    return (
      <p className={`flex gap-2 text-[15px] leading-snug ${muted}`}>
        <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        Sign in with your CCDesigner account to enter the access code {r.provider} gave your school.
      </p>
    );
  }
  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!r.organisationId) return;
        setBusy(true);
        setError(null);
        const res = await redeemAccessCode(r.organisationId, code);
        setBusy(false);
        if (res.ok) {
          toast.success(`Access confirmed for ${r.provider} resources`);
          onUnlocked();
        } else setError(res.error);
      }}
    >
      <label htmlFor={`code-${r.id}`} className={`block text-[15px] font-medium ${ink}`}>
        Organisation access code
      </label>
      <div className="flex gap-2">
        <input
          id={`code-${r.id}`}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="e.g. K7QM-4XHP-2RTA"
          aria-describedby={error ? `code-err-${r.id}` : undefined}
          className="h-11 min-w-0 flex-1 rounded-xl border border-[#002D24]/15 bg-white px-3 font-mono text-[15px] tracking-wider text-[#002D24] outline-none focus:border-[#14B8A6]/60 focus:ring-4 focus:ring-[#14B8A6]/10"
        />
        <PrimaryButton type="submit" className={busy || code.trim().length < 6 ? 'pointer-events-none opacity-60' : ''}>
          <KeyRound className="h-4 w-4" /> {busy ? 'Checking…' : 'Unlock'}
        </PrimaryButton>
      </div>
      {error && (
        <p id={`code-err-${r.id}`} role="alert" className="text-[14px] text-[#B42318]">
          {error}
        </p>
      )}
      <p className={`text-[14px] ${muted}`}>Codes come from {r.provider}. Ask them if your school doesn’t have one.</p>
    </form>
  );
}

const STEPS = ['Preview', 'Add to CCDesigner', 'Use in a lesson', 'Place in Planner', 'Reflect after teaching'];

function ResourceSheet({ r, onClose, hubId, areaCode }: { r: HubResource; onClose: () => void; hubId: string; areaCode?: string }) {
  const dir = useDirectory();
  const [added, setAdded] = useState(() => readAdded().includes(r.id));
  const [busy, setBusy] = useState(false);
  const [needsCode, setNeedsCode] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const setup = r.libraryPack ? PACK_SETUP[r.libraryPack] : undefined;
  const locked = isLocked(r.access);
  useEffect(() => {
    closeRef.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);
  useEffect(() => logEngagement(dir, r, 'viewed', { hubId, areaCode }), [dir, r, hubId, areaCode]);

  const add = async () => {
    if (!setup) return;
    setBusy(true);
    try {
      const res = await setup();
      localStorage.setItem(ADDED_KEY, JSON.stringify([...new Set([...readAdded(), r.id])]));
      setAdded(true);
      logEngagement(dir, r, 'added_to_library', { hubId, areaCode });
      toast.success(res?.skipped ? 'Already in your library' : `Added to your library · Originally provided by ${r.provider}`);
    } catch (e) {
      console.error(e);
      toast.error('Could not add this to your library');
    } finally {
      setBusy(false);
    }
  };

  const openLocked = async () => {
    const res = await openLockedResource(r.id);
    if ('url' in res) {
      window.open(res.url, '_blank', 'noopener,noreferrer');
      setNeedsCode(false);
    } else if (res.needsCode || !canUseAccessCodes()) setNeedsCode(true);
    else toast.error(res.error);
  };

  const step = added ? 2 : 1;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="res-title">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-[#002D24]/25 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-[520px] flex-col overflow-y-auto bg-[#FBFCFB] shadow-[-24px_0_48px_-24px_rgba(0,45,36,0.35)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#002D24]/[0.06] bg-[#FBFCFB]/90 px-6 py-4 backdrop-blur">
          <p className={`text-[14px] font-medium ${muted}`}>{r.provider}</p>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-[#002D24]/60 hover:bg-[#002D24]/5">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-6 px-6 py-6">
          <div>
            <h2 id="res-title" className={`text-[24px] font-semibold tracking-tight ${ink}`}>
              {r.title}
            </h2>
            <p className={`mt-2 text-[16px] leading-relaxed ${muted}`}>{r.description}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border border-[#002D24]/[0.08] bg-white p-4 text-[15px]">
            {[
              ['Type', r.type],
              ['Phase', r.phaseLabel],
              ['Subject', r.subject],
              ['Access', ACCESS_LABEL[r.access]],
              ['Provided by', r.provider],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[13px] text-[#002D24]/55">{k}</dt>
                <dd className={`font-medium ${ink}`}>{v}</dd>
              </div>
            ))}
            <div className="col-span-2">
              <dt className="text-[13px] text-[#002D24]/55">Licence</dt>
              <dd className={`text-[14px] leading-snug ${ink}`}>{r.licence ?? 'As published by the provider'}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            {locked ? (
              <SecondaryButton onClick={openLocked}>
                <Lock className="h-4 w-4" /> Open resource
              </SecondaryButton>
            ) : (
              r.previewHref && (
                <SecondaryButton href={r.previewHref}>
                  <FileText className="h-4 w-4" /> Preview {r.type === 'PDF' ? 'PDF' : 'course notes'}
                </SecondaryButton>
              )
            )}
            {r.sourceHref && (
              <SecondaryButton href={r.sourceHref}>
                <ExternalLink className="h-4 w-4" /> Source
              </SecondaryButton>
            )}
          </div>
          {locked && needsCode && (
            <div className="rounded-2xl border border-[#F59E0B]/30 bg-[#FFFBF2] p-4">
              <AccessCodeForm r={r} onUnlocked={openLocked} />
            </div>
          )}

          {!setup ? (
            <p className={`flex gap-2 text-[15px] leading-snug ${muted}`}>
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              This resource opens from {r.provider}. It can’t be copied into your library automatically yet.
            </p>
          ) : (
          <section aria-labelledby="flow-title" className="rounded-2xl border border-[#002D24]/[0.08] bg-white p-5">
            <h3 id="flow-title" className={`text-[16px] font-semibold ${ink}`}>
              Bring it into your planning
            </h3>
            <ol className="mt-4 space-y-3">
              {STEPS.map((s, i) => {
                const done = i < step;
                const current = i === step;
                return (
                  <li key={s} className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${
                        done ? 'bg-[#14B8A6] text-white' : current ? 'bg-[#002D24] text-white' : 'bg-[#002D24]/[0.06] text-[#002D24]/50'
                      }`}
                      aria-hidden
                    >
                      {done ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <span className={`text-[15px] ${current ? `font-medium ${ink}` : done ? ink : 'text-[#002D24]/50'}`}>
                      {s}
                      {done && <span className="sr-only"> (done)</span>}
                    </span>
                  </li>
                );
              })}
            </ol>
            <div className="mt-5 flex flex-wrap gap-2">
              {!added ? (
                <PrimaryButton onClick={add} className={busy ? 'pointer-events-none opacity-70' : ''}>
                  <Library className="h-4 w-4" /> {busy ? 'Adding…' : 'Add to CCDesigner'}
                </PrimaryButton>
              ) : (
                <>
                  <PrimaryButton onClick={() => { onClose(); openTab('lesson-library'); }}>
                    <BookOpen className="h-4 w-4" /> Use in a lesson
                  </PrimaryButton>
                  <SecondaryButton onClick={() => { onClose(); openTab('activity-library'); }}>Open Activity Library</SecondaryButton>
                </>
              )}
            </div>
            <p className={`mt-4 flex gap-2 text-[14px] leading-snug ${muted}`}>
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              You get your own copy to adapt. It keeps “Originally provided by {r.provider}” and a link to the source; the provider’s original is never changed.
            </p>
          </section>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Key stage of the class chosen in the header: its Settings section, else a name-based guess. */
function useClassPhase(): { phase: Phase; className: string } | null {
  const { currentSheetInfo } = useData();
  const { yearGroupSections } = useSettings();
  return useMemo(() => {
    const id = currentSheetInfo?.sheet ?? '';
    const name = currentSheetInfo?.display || id;
    if (!id && !name) return null;
    const section = yearGroupSections.find((s) => s.yearGroupIds?.includes(id));
    const asPhase = (s?: string) => PHASES.find((p) => p === (s ?? '').toUpperCase().replace(/\s+/g, ''));
    const phase = asPhase(section?.label) ?? asPhase(getDefaultSectionIdForYearGroup(id, name));
    return phase ? { phase, className: name } : null;
  }, [currentSheetInfo?.sheet, currentSheetInfo?.display, yearGroupSections]);
}

function PhaseFilter({ value, onChange }: { value: Phase | 'All'; onChange: (p: Phase | 'All') => void }) {
  const mine = useClassPhase();
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {mine && (
        <button
          type="button"
          aria-pressed={value === mine.phase}
          onClick={() => onChange(value === mine.phase ? 'All' : mine.phase)}
          className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3.5 text-[14px] font-medium transition ${
            value === mine.phase ? 'bg-[#14B8A6] text-white' : 'bg-[#14B8A6]/10 text-[#0B6B5F] hover:bg-[#14B8A6]/15'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          For {mine.className} · {mine.phase}
        </button>
      )}
      <PhaseRadios value={value} onChange={onChange} />
    </div>
  );
}

function PhaseRadios({ value, onChange }: { value: Phase | 'All'; onChange: (p: Phase | 'All') => void }) {
  return (
    <div role="radiogroup" aria-label="Filter by phase" className="flex flex-wrap gap-1.5">
      {(['All', ...PHASES] as const).map((p) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={value === p}
          onClick={() => onChange(p)}
          className={`min-h-[40px] rounded-full px-3.5 text-[14px] font-medium transition ${
            value === p ? 'bg-[#002D24] text-white' : 'bg-white text-[#002D24] ring-1 ring-inset ring-[#002D24]/10 hover:ring-[#002D24]/25'
          }`}
        >
          {p === 'All' ? 'All phases' : p}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

function HubHeader({ ix, hub, crumbs }: { ix: MapIndex; hub: MapHub; crumbs: { label: string; onClick?: () => void }[] }) {
  const dir = useDirectory();
  const detail = dir.hub(hub.id);
  const brand = organisationBrand(detail.organisationId);
  const rel = detail.relationship;
  const [role, setRole] = useState<HubRole | null>(null);
  const [managing, setManaging] = useState(false);
  useEffect(() => {
    let live = true;
    myHubRole(dir, hub.id).then((r) => live && setRole(r));
    return () => {
      live = false;
    };
  }, [dir, hub.id]);
  return (
    <header className="space-y-4">
      <Crumbs items={crumbs} />
      <div className="flex flex-col gap-5 rounded-3xl border border-[#002D24]/[0.07] bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          {brand?.logoSrc ? (
            <span className="flex h-16 w-28 shrink-0 items-center justify-center rounded-2xl px-4" style={{ backgroundColor: brand.color }}>
              <img src={brand.logoSrc} alt={brand.name} className="max-h-10 w-full object-contain" />
            </span>
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#E8F0EA] text-[20px] font-semibold text-[#002D24]">
              {hubLabel(hub)
                .replace(/\(.*\)/, '')
                .split(/[\s,&]+/)
                .filter((w) => /^[A-Z]/.test(w) && !['Music', 'Hub', 'Education', 'and'].includes(w))
                .slice(0, 2)
                .map((w) => w[0])
                .join('')}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={`text-[26px] font-semibold leading-tight tracking-tight sm:text-[30px] ${ink}`}>{hub.name}</h1>
              {rel !== 'directory_listing' && <Badge tone="teal">{RELATIONSHIP_LABEL[rel]}</Badge>}
            </div>
            <p className={`mt-1 text-[16px] ${ink}`}>{hub.authorities.join(' · ')}</p>
            <p className={`mt-0.5 text-[14px] ${muted}`}>
              {hub.leadOrganisation ? `Lead organisation: ${hub.leadOrganisation}` : 'Lead organisation: check Arts Council England'}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {hub.siteUrl && (
            <SecondaryButton href={hub.siteUrl}>
              Official website <ExternalLink className="h-4 w-4" />
            </SecondaryButton>
          )}
          {atLeast(role, 'hub_editor') && (
            <SecondaryButton onClick={() => setManaging(true)}>
              <Pencil className="h-4 w-4" /> Manage hub
            </SecondaryButton>
          )}
        </div>
      </div>
      {hub.regionNote && <p className="text-[14px] text-[#8A5300]">{hub.regionNote}</p>}
      {managing && role && (
        <ManageHubDialog
          ix={ix}
          hub={hub}
          detail={detail}
          role={role}
          onClose={() => setManaging(false)}
          onPublished={() => {
            void reloadPartnerData().then(() => window.dispatchEvent(new Event('ccd:hubs-data')));
          }}
        />
      )}
    </header>
  );
}

function HubPage({ ix, hub, area, tab, go, regionCrumbs }: {
  ix: MapIndex;
  hub: MapHub;
  area: MapLad | null;
  tab: HubTab;
  go: (f: MapFocus, page?: Page) => void;
  regionCrumbs: { label: string; onClick?: () => void }[];
}) {
  const [hover, setHover] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState<HubResource | null>(null);
  const [phase, setPhase] = useState<Phase | 'All'>('All');
  const tabsRef = useRef<HTMLDivElement>(null);
  const dir = useDirectory();
  const detail = dir.hub(hub.id);
  const services = dir.services(hub.id);
  const lads = ix.ladsInHub(hub.id);
  const allResources = dir.resourcesForHub(hub.id);
  const resources = allResources.filter((r) => phase === 'All' || r.phases.includes(phase));
  const short = shortHubName(hub);
  const focus: MapFocus = area ? { level: 'lad', id: area.code } : { level: 'hub', id: hub.id };
  const about = paragraphs(detail.about);
  const contact = detail.contact;
  const covers = (s: HubService) => {
    const names = lads.filter((l) => dir.serviceFor(l)?.id === s.id).map((l) => l.name);
    return names.length > 3 ? `${names.length} local areas` : names.join(', ');
  };

  const setTab = (t: HubTab) => writeRoute({ tab: t }, true);

  return (
    <div className={`space-y-6 ${area ? 'pb-56 lg:pb-0' : ''}`}>
      <HubHeader ix={ix} hub={hub} crumbs={[...regionCrumbs, { label: short }]} />

      <section aria-labelledby="areas-heading" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <h2 id="areas-heading" className="sr-only">
          Local areas
        </h2>
        <UkHubMap
          ix={ix}
          focus={focus}
          hover={hover}
          onHover={setHover}
          showBreadcrumb={false}
          onFocus={(f) => {
            if (f.level === 'lad' && ix.lad(f.id)?.hub === hub.id) go(f, 'hub');
            else if (f.level === 'hub' && f.id === hub.id) go(f, 'hub');
            else go(f, f.level === 'hub' || f.level === 'lad' ? 'hub' : 'browse');
          }}
          className="h-[420px] sm:h-[520px] lg:h-[600px]"
        />
        <div className="flex flex-col gap-4">
          <div>
            <h3 className={`text-[18px] font-semibold ${ink}`}>Find your area</h3>
            <p className={`mt-0.5 text-[14px] ${muted}`}>
              {lads.length} local areas. Resources shared across {short} appear on every area page.
            </p>
          </div>
          <FindArea value={filter} onChange={setFilter} label="Search areas" />
          <div className="pr-0.5">
            <AreaList
              lads={lads}
              selected={area?.code}
              hover={hover}
              onHover={setHover}
              filter={filter}
              onSelect={(l) => go({ level: 'lad', id: l.code }, 'hub')}
            />
          </div>
          {area ? (
            <AreaPreview
              hub={hub}
              lad={area}
              onExplore={() => go({ level: 'lad', id: area.code }, 'area')}
              onClose={() => go({ level: 'hub', id: hub.id }, 'hub')}
            />
          ) : (
            <SecondaryButton
              onClick={() => {
                setTab('resources');
                tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              View all {short} resources
            </SecondaryButton>
          )}
        </div>
      </section>

      <section ref={tabsRef} className="scroll-mt-24">
        <div role="tablist" aria-label={`${short} sections`} className="flex gap-1 overflow-x-auto border-b border-[#002D24]/[0.08]">
          {(
            [
              ['resources', 'Resources'],
              ['events', 'CPD & events'],
              ['about', 'About the hub'],
              ['contact', 'Contact'],
            ] as [HubTab, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              role="tab"
              type="button"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`-mb-px min-h-[48px] whitespace-nowrap border-b-2 px-4 text-[15px] font-medium transition ${
                tab === k ? 'border-[#002D24] text-[#002D24]' : 'border-transparent text-[#002D24]/55 hover:text-[#002D24]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="pt-6">
          {tab === 'resources' &&
            (allResources.length === 0 ? (
              <EmptyState
                title={`No resources published for ${short} yet.`}
                body="When the hub publishes resources in CCDesigner they will appear here and on every local area page."
                action={hub.siteUrl ? <SecondaryButton href={hub.siteUrl}>Visit the hub’s website <ExternalLink className="h-4 w-4" /></SecondaryButton> : undefined}
              />
            ) : (
              <div className="space-y-4">
                <PhaseFilter value={phase} onChange={setPhase} />
                {resources.length === 0 ? (
                  <EmptyState title={`No ${phase} resources yet.`} action={<SecondaryButton onClick={() => setPhase('All')}>Show all phases</SecondaryButton>} />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {resources.map((r) => (
                      <ResourceCard key={r.id} r={r} onOpen={() => setOpen(r)} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          {tab === 'events' && (
            <EmptyState
              title="No CPD or events published here yet."
              body={hub.siteUrl ? 'Current courses and events are on the hub’s own website.' : undefined}
              action={hub.siteUrl ? <SecondaryButton href={hub.siteUrl}>Visit the hub’s website <ExternalLink className="h-4 w-4" /></SecondaryButton> : undefined}
            />
          )}
          {tab === 'about' && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className={`max-w-[68ch] space-y-3 text-[16px] leading-relaxed ${ink}`}>
                {(about.length
                  ? about
                  : [
                      `${hub.name} is the Arts Council England Music Hub for ${hub.authorities.join(', ')}.`,
                      hub.leadOrganisation
                        ? `${hub.leadOrganisation} is the Hub Lead Organisation.`
                        : 'The Hub Lead Organisation is listed by Arts Council England.',
                    ]
                ).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                <p className={`text-[14px] ${muted}`}>Hub area: Arts Council England, Music Hub Investment Programme.</p>
              </div>
              {services.length > 0 && (
                <div className="rounded-2xl border border-[#002D24]/[0.08] bg-white p-5">
                  <h3 className={`text-[16px] font-semibold ${ink}`}>Music services in this hub</h3>
                  <ul className="mt-3 space-y-3">
                    {services.map((s) => (
                      <li key={s.id} className="text-[15px]">
                        <p className={`font-medium ${ink}`}>
                          {s.siteUrl ? (
                            <a href={s.siteUrl} target="_blank" rel="noreferrer" className="hover:underline">
                              {s.name}
                            </a>
                          ) : (
                            s.name
                          )}
                        </p>
                        <p className={muted}>
                          {serviceRole(s)}
                          {covers(s) && ` · ${covers(s)}`}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {tab === 'contact' &&
            (contact ? (
              <ContactCard contact={contact} />
            ) : (
              <EmptyState
                title="Contact details haven’t been verified yet."
                action={hub.siteUrl ? <SecondaryButton href={hub.siteUrl}>Official website <ExternalLink className="h-4 w-4" /></SecondaryButton> : undefined}
              />
            ))}
        </div>
      </section>
      {open && <ResourceSheet r={open} hubId={hub.id} onClose={() => setOpen(null)} />}
    </div>
  );
}

function MiniMap({ ix, hub, lad, onClick }: { ix: MapIndex; hub: MapHub; lad: MapLad; onClick: () => void }) {
  const [x, y, w, h] = hub.bbox;
  const pad = Math.max(w, h) * 0.06;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Show ${lad.name} on the ${hubLabel(hub)} map`}
      className="group block w-full overflow-hidden rounded-2xl border border-[#002D24]/[0.07] bg-[#F6F8F5] p-3 transition hover:border-[#002D24]/20"
    >
      <svg viewBox={`${x - pad} ${y - pad} ${w + pad * 2} ${h + pad * 2}`} className="h-40 w-full" aria-hidden>
        {ix.ladsInHub(hub.id).map((l) => (
          <path
            key={l.code}
            d={l.d}
            fill={l.code === lad.code ? '#002D24' : '#D3E8DC'}
            stroke="#fff"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <span className={`mt-1 block text-[13px] font-medium ${muted} group-hover:text-[#002D24]`}>View on map</span>
    </button>
  );
}

function ContactCard({ contact }: { contact: Contact }) {
  return (
    <div className="max-w-md space-y-3 rounded-2xl border border-[#002D24]/[0.08] bg-white p-5 text-[15px]">
      {contact.lines?.length ? <p className={`font-semibold ${ink}`}>{contact.lines.join(' · ')}</p> : null}
      {contact.address && (
        <p className={`flex items-start gap-2 ${ink}`}>
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#002D24]/50" aria-hidden />
          <span>{contact.address}</span>
        </p>
      )}
      {contact.phone && (
        <a className={`flex items-center gap-2 ${ink} hover:underline`} href={`tel:${contact.phone.replace(/\s/g, '')}`}>
          <Phone className="h-4 w-4 text-[#002D24]/50" /> {contact.phone}
        </a>
      )}
      {contact.email && (
        <a className={`flex items-center gap-2 ${ink} hover:underline`} href={`mailto:${contact.email}`}>
          <Mail className="h-4 w-4 text-[#002D24]/50" /> {contact.email}
        </a>
      )}
      {contact.website && (
        <a className={`flex items-center gap-2 ${ink} hover:underline`} href={contact.website} target="_blank" rel="noreferrer">
          <ExternalLink className="h-4 w-4 text-[#002D24]/50" /> Website
        </a>
      )}
      {contact.socials && contact.socials.length > 0 && (
        <ul className="flex flex-wrap gap-2 pt-1">
          {contact.socials.map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[36px] items-center rounded-lg bg-[#F6F9F7] px-3 text-[14px] font-medium text-[#002D24] ring-1 ring-inset ring-[#002D24]/[0.08] hover:bg-[#E8F0EA]"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      )}
      {contact.sourceUrl && (
        <p className={`text-[13px] ${muted}`}>
          From the{' '}
          <a href={contact.sourceUrl} target="_blank" rel="noreferrer" className="underline">
            official contact page
          </a>
          .
        </p>
      )}
    </div>
  );
}

function AreaPage({ ix, hub, lad, go, regionCrumbs }: {
  ix: MapIndex;
  hub: MapHub;
  lad: MapLad;
  go: (f: MapFocus, page?: Page) => void;
  regionCrumbs: { label: string; onClick?: () => void }[];
}) {
  const [phase, setPhase] = useState<Phase | 'All'>('All');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<HubResource | null>(null);
  const dir = useDirectory();
  const short = shortHubName(hub);
  const svc = dir.serviceFor(lad);
  const areaDetail = dir.area(lad.code);
  const { local, shared } = dir.resourcesForArea(hub.id, lad.code);
  const match = (r: HubResource) =>
    (phase === 'All' || r.phases.includes(phase)) &&
    (!q.trim() || `${r.title} ${r.description} ${r.subject}`.toLowerCase().includes(q.trim().toLowerCase()));
  const sharedShown = shared.filter(match);
  const localShown = local.filter(match);
  const links = areaDetail?.links ?? [];

  return (
    <div className="space-y-6">
      <Crumbs items={[...regionCrumbs, { label: short, onClick: () => go({ level: 'hub', id: hub.id }, 'hub') }, { label: lad.name }]} />
      <header className="grid gap-5 rounded-3xl border border-[#002D24]/[0.07] bg-white p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_240px] md:items-start">
        <div>
          <p className={`text-[14px] font-medium ${muted}`}>Local area</p>
          <h1 className={`mt-0.5 text-[30px] font-semibold leading-tight tracking-tight sm:text-[34px] ${ink}`}>{lad.name}</h1>
          <p className={`mt-2 text-[16px] ${ink}`}>
            Part of{' '}
            <button type="button" onClick={() => go({ level: 'hub', id: hub.id }, 'hub')} className="font-medium underline decoration-[#002D24]/25 underline-offset-4 hover:decoration-[#002D24]">
              {hub.name}
            </button>
          </p>
          {svc && (
            <p className={`mt-0.5 text-[15px] ${muted}`}>
              Local music service: {svc.name}
              {svc.role === 'lead' ? ' (Hub Lead Organisation)' : ''}
            </p>
          )}
          {paragraphs(areaDetail?.about).map((p, i) => (
            <p key={i} className={`mt-3 max-w-[68ch] text-[15px] leading-relaxed ${ink}`}>
              {p}
            </p>
          ))}
          <div className="mt-4 flex flex-wrap gap-2">
            {areaDetail?.siteUrl && (
              <SecondaryButton href={areaDetail.siteUrl}>
                Local website <ExternalLink className="h-4 w-4" />
              </SecondaryButton>
            )}
            {svc?.siteUrl && (
              <SecondaryButton href={svc.siteUrl}>
                {svc.name} website <ExternalLink className="h-4 w-4" />
              </SecondaryButton>
            )}
          </div>
        </div>
        <MiniMap ix={ix} hub={hub} lad={lad} onClick={() => go({ level: 'lad', id: lad.code }, 'hub')} />
      </header>

      {(areaDetail?.contact || links.length > 0) && (
        <section aria-labelledby="area-contact-heading" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {areaDetail?.contact && (
            <div>
              <h2 id="area-contact-heading" className={`mb-3 text-[20px] font-semibold tracking-tight ${ink}`}>
                Contact
              </h2>
              <ContactCard contact={areaDetail.contact} />
            </div>
          )}
          {links.length > 0 && (
            <div>
              <h2 id="area-links-heading" className={`mb-3 text-[20px] font-semibold tracking-tight ${ink}`}>
                Official links
              </h2>
              <ul className="space-y-2 rounded-2xl border border-[#002D24]/[0.08] bg-white p-4">
                {links.map((link) => (
                  <li key={link.href + link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-2 text-[15px] font-medium ${ink} hover:underline`}
                    >
                      {link.label}
                      <ExternalLink className="h-3.5 w-3.5 text-[#002D24]/45" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <PhaseFilter value={phase} onChange={setPhase} />
        <label className="flex h-11 items-center gap-2 rounded-xl border border-[#002D24]/10 bg-white px-3 lg:w-72">
          <Search className="h-4 w-4 text-[#002D24]/40" aria-hidden />
          <span className="sr-only">Search resources</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search resources" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
        </label>
      </div>

      <section aria-labelledby="local-res" className="space-y-3">
        <h2 id="local-res" className={`text-[20px] font-semibold tracking-tight ${ink}`}>
          {lad.name}
        </h2>
        {localShown.length === 0 ? (
          <EmptyState
            title={`No resources published for ${lad.name} yet.`}
            body={shared.length ? `${short} resources below are available to every school in ${lad.name}.` : undefined}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {localShown.map((r) => (
              <ResourceCard key={r.id} r={r} onOpen={() => setOpen(r)} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="shared-res" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="shared-res" className={`text-[20px] font-semibold tracking-tight ${ink}`}>
            Shared across {short}
          </h2>
          <span className={`text-[14px] ${muted}`}>{sharedShown.length} resources</span>
        </div>
        {sharedShown.length === 0 ? (
          <EmptyState
            title={shared.length ? 'No shared resources match these filters.' : `No resources published for ${short} yet.`}
            action={shared.length ? <SecondaryButton onClick={() => { setPhase('All'); setQ(''); }}>Clear filters</SecondaryButton> : undefined}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sharedShown.map((r) => (
              <ResourceCard key={r.id} r={r} scopeLabel={`${short} · shared`} onOpen={() => setOpen(r)} />
            ))}
          </div>
        )}
      </section>
      {open && <ResourceSheet r={open} hubId={hub.id} areaCode={lad.code} onClose={() => setOpen(null)} />}
    </div>
  );
}

function FeaturedHubs({ ix, go }: { ix: MapIndex; go: (f: MapFocus, page?: Page) => void }) {
  const dir = useDirectory();
  const featured = ix.data.hubs.filter((h) => dir.hub(h.id).relationship !== 'directory_listing');
  return (
    <>
      {featured.map((hub) => {
        const detail = dir.hub(hub.id);
        const brand = organisationBrand(detail.organisationId);
        const short = shortHubName(hub);
        const areas = ix.ladsInHub(hub.id).length;
        const count = dir.resourcesForHub(hub.id).length;
        return (
          <section
            key={hub.id}
            aria-labelledby={`featured-${hub.id}`}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#002D24]/[0.07] bg-white px-3.5 py-2.5 sm:gap-4 sm:px-4"
          >
            {brand?.logoSrc && (
              <span
                className="flex h-11 w-20 shrink-0 items-center justify-center rounded-xl px-2.5"
                style={{ backgroundColor: brand.color }}
              >
                <img src={brand.logoSrc} alt={brand.name} className="max-h-7 w-full object-contain" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <h2 id={`featured-${hub.id}`} className={`text-[15px] font-semibold leading-snug ${ink}`}>
                  {hub.name}
                </h2>
                <Badge tone="teal">
                  <Sparkles className="h-3 w-3" aria-hidden /> {RELATIONSHIP_LABEL[detail.relationship]}
                </Badge>
              </div>
              <p className={`mt-0.5 text-[13px] leading-snug ${muted}`}>
                {areas} local areas{count ? `, ${count} shared ${count === 1 ? 'resource' : 'resources'}` : ''} · open map below or explore the hub
              </p>
            </div>
            <PrimaryButton onClick={() => go({ level: 'hub', id: hub.id }, 'hub')}>
              Explore {short} <ArrowRight className="h-4 w-4" />
            </PrimaryButton>
          </section>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------

export function PartnerHubsPreview() {
  const [data, setData] = useState<{ ix: MapIndex; dir: Directory } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    const load = () =>
      loadPartnerData()
        .then((d) => live && setData(d))
        .catch(() => live && setError(true));
    load();
    window.addEventListener('ccd:hubs-data', load);
    return () => {
      live = false;
      window.removeEventListener('ccd:hubs-data', load);
    };
  }, []);

  return (
    <DirectoryContext.Provider value={data?.dir ?? LOADING_DIRECTORY}>
      <div className="ccd-partner-hubs">
        <PartnerHubsPage ix={data?.ix ?? null} error={error} />
      </div>
    </DirectoryContext.Provider>
  );
}

function PartnerHubsPage({ ix, error }: { ix: MapIndex | null; error: boolean }) {
  const route = useRoute();
  const [hover, setHover] = useState<string | null>(null);

  const focus = useMemo<MapFocus>(() => (ix ? focusFromPath(ix, route.at) : { level: 'uk' }), [ix, route.at]);

  const go = useCallback(
    (f: MapFocus, page: Page = 'browse') => {
      if (!ix) return;
      writeRoute({ page, at: focusPath(ix, f), section: 'music-hubs', tab: 'resources' });
      if (page !== 'browse') window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [ix],
  );

  useEffect(() => {
    if (!ix) return;
    const canonical = focusPath(ix, focus).join('/');
    if (canonical !== route.at.join('/')) writeRoute({ at: canonical.split('/').filter(Boolean) }, true);
  }, [ix, focus, route.at]);

  useEffect(() => {
    if (!ix) return;
    const title =
      route.page === 'browse' ? 'Partner Hubs' : `${focusName(ix, focus)} · Partner Hubs`;
    document.title = `${title} · CCDesigner`;
  }, [ix, focus, route.page]);

  const regionCrumbs = useCallback(
    (hub: MapHub) => [
      { label: 'Partner Hubs', onClick: () => go({ level: 'uk' }) },
      { label: 'England', onClick: () => go({ level: 'nation', id: ENGLAND }) },
      { label: ix!.region(hub.region)!.name, onClick: () => go({ level: 'region', id: hub.region }) },
    ],
    [go, ix],
  );

  // Detail pages — must not share hooks with the browse view (hooks-after-return crash).
  if (ix && route.page !== 'browse') {
    const lad = focus.level === 'lad' ? ix.lad(focus.id) : undefined;
    const hub = focus.level === 'hub' ? ix.hub(focus.id) : lad?.hub ? ix.hub(lad.hub) : undefined;
    if (hub && route.page === 'area' && lad) {
      return <AreaPage ix={ix} hub={hub} lad={lad} go={go} regionCrumbs={regionCrumbs(hub)} />;
    }
    if (hub) {
      return <HubPage ix={ix} hub={hub} area={lad ?? null} tab={route.tab} go={go} regionCrumbs={regionCrumbs(hub)} />;
    }
  }

  return (
    <PartnerHubsBrowse
      ix={ix}
      error={error}
      route={route}
      focus={focus}
      hover={hover}
      setHover={setHover}
      go={go}
    />
  );
}

function PartnerHubsBrowse({
  ix,
  error,
  route,
  focus,
  hover,
  setHover,
  go,
}: {
  ix: MapIndex | null;
  error: boolean;
  route: Route;
  focus: MapFocus;
  hover: string | null;
  setHover: (id: string | null) => void;
  go: (f: MapFocus, page?: Page) => void;
}) {
  const resultsRef = useRef<HTMLElement | null>(null);
  const hubsGridMeasureRef = useRef<HTMLDivElement | null>(null);
  const [hubsView, setHubsView] = useState<'grid' | 'list' | 'compact'>('grid');
  const hubsColsForWidth = useCallback((width: number) => {
    if (width <= 0) return 4;
    return Math.max(
      HUBS_GRID_COLS_MIN,
      Math.min(HUBS_GRID_COLS_MAX, Math.floor(width / HUBS_GRID_CARD_MIN_PX)),
    );
  }, []);
  const [hubsGridCols, setHubsGridCols] = useState(() =>
    typeof window === 'undefined' ? 5 : Math.max(HUBS_GRID_COLS_MIN, Math.min(HUBS_GRID_COLS_MAX, Math.floor((window.innerWidth - 80) / HUBS_GRID_CARD_MIN_PX))),
  );
  const [hubsGridColsPinned, setHubsGridColsPinned] = useState(false);

  useEffect(() => {
    const el = hubsGridMeasureRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (hubsGridColsPinned) return;
      setHubsGridCols(hubsColsForWidth(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [hubsGridColsPinned, hubsColsForWidth]);

  const atMapLanding =
    focus.level === 'uk' || (focus.level === 'nation' && focus.id === ENGLAND);
  const atRegion = focus.level === 'region';

  const browseCrumbs: { label: string; onClick?: () => void }[] = [];
  if (ix && atRegion) {
    browseCrumbs.push(
      { label: 'Partner Hubs', onClick: () => go({ level: 'uk' }) },
      { label: 'England', onClick: () => go({ level: 'uk' }) },
      { label: focusName(ix, focus) },
    );
  }

  const regionHubs = useMemo(() => {
    if (!ix || !atRegion) return [] as MapHub[];
    return [...ix.hubsInRegion(focus.id)].sort((a, b) =>
      musicHubCardTitle(a.id, hubLabel(a), a.leadOrganisation ?? undefined).localeCompare(
        musicHubCardTitle(b.id, hubLabel(b), b.leadOrganisation ?? undefined),
      ),
    );
  }, [ix, focus, atRegion]);

  const regionRows = useMemo(() => {
    if (!ix) return [] as { code: string; name: string; count: number }[];
    return [...ix.data.regions]
      .map((r) => ({ code: r.code, name: r.name, count: ix.hubsInRegion(r.code).length }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [ix]);

  const onMapFocus = (f: MapFocus) => {
    // Map landing: only open regions (or jump to hub/area for search-driven deep links).
    if (atMapLanding && f.level === 'lad') {
      const lad = ix?.lad(f.id);
      if (lad?.region) {
        go({ level: 'region', id: lad.region });
        return;
      }
    }
    if (f.level === 'hub') {
      go(f, 'hub');
      return;
    }
    go(f);
  };

  const backToMap = () => go({ level: 'uk' });

  const [regionMapOpen, setRegionMapOpen] = useState(false);
  const [regionMapModal, setRegionMapModal] = useState(false);
  const [pinnedHub, setPinnedHub] = useState<string | null>(null);
  useEffect(() => {
    setPinnedHub(null);
    setRegionMapModal(false);
  }, [focus]);
  const activatePin = (id: string) => {
    setPinnedHub(id);
    const card = document.querySelector<HTMLElement>(`[data-hub-card="${CSS.escape(id)}"]`);
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const regionName = ix && atRegion ? focusName(ix, focus) : '';
  const regionHubCount = regionHubs.length;

  return (
    <div className="space-y-6">
      <header className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {atRegion && <Crumbs items={browseCrumbs} />}
            <p className="ccd-studio-eyebrow mb-1">
              CONNECT &amp; CREATE / <span>PARTNER HUBS</span>
            </p>
            <h1
              className={`text-[32px] font-bold leading-[1.1] tracking-tight text-[#1F1B4D] sm:text-[40px] ${
                atRegion ? 'mt-2' : ''
              }`}
            >
              Partner Hubs
            </h1>
            <p className="ccd-page-lede ccd-page-lede--single mt-2 max-w-2xl text-[16px] leading-snug text-[#1F1B4D]/65">
              Explore Music Hubs, arts organisations and teaching resources. Bring the ideas you find straight into your
              planning.
            </p>
          </div>
          <PartnerHubsHeaderActions
            onBrowseMap={() => {
              writeRoute({ section: 'music-hubs', page: 'browse' });
              go({ level: 'uk' });
            }}
          />
        </div>
        <PartnerSectionTabs section={route.section} onSection={(s) => writeRoute({ section: s })} />
      </header>

      {route.section === 'organisations' ? (
        <OrganisationsSection />
      ) : route.section === 'paid-resources' ? (
        <PaidResourcesSection />
      ) : (
        <div className="space-y-5">
          <MusicHubToolbar
            searchSlot={<GlobalSearch ix={ix} onFocusMap={onMapFocus} />}
            view={hubsView}
            onView={setHubsView}
          />

          {error ? (
            <EmptyState
              title="The map couldn’t load."
              body="Check your connection and try again."
              action={<SecondaryButton onClick={() => window.location.reload()}>Try again</SecondaryButton>}
            />
          ) : !ix ? (
            <div className="h-[420px] animate-pulse rounded-2xl bg-[#EEF0F8]" aria-label="Loading map" />
          ) : atMapLanding ? (
            <section className="space-y-4" aria-labelledby="music-hubs-map-heading">
              <div className="min-w-0">
                <h2
                  id="music-hubs-map-heading"
                  className="text-[22px] font-bold tracking-tight text-[#1F1B4D] sm:text-[24px]"
                >
                  {ix.data.hubs.length} Music Hubs across England
                </h2>
                <p className={`mt-1 max-w-2xl text-[14px] leading-snug ${muted}`}>
                  Choose a region on the map — or from the list — to see the Music Hubs that serve schools there.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-stretch">
                <div className="overflow-hidden rounded-2xl border border-[#1F1B4D]/[0.08] bg-white shadow-[0_1px_2px_rgba(31,27,77,0.04)]">
                  <UkHubMap
                    ix={ix}
                    focus={{ level: 'nation', id: ENGLAND }}
                    hover={hover}
                    onHover={setHover}
                    onFocus={onMapFocus}
                    showBreadcrumb={false}
                    regionLabelMode="names"
                    frameEngland
                    showControls={false}
                    showAttribution={false}
                    showFeatureLabels={false}
                    palette="green"
                    className="h-[440px] !rounded-2xl !border-0 sm:h-[520px] lg:h-[560px]"
                  />
                </div>

                <div className="flex min-h-0 flex-col rounded-2xl border border-[#1F1B4D]/[0.08] bg-white p-3 shadow-[0_1px_2px_rgba(31,27,77,0.04)] sm:p-4">
                  <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#1F1B4D]/45">
                    Regions
                  </h3>
                  <ul
                    className="mt-2 flex flex-1 flex-col gap-1 overflow-y-auto"
                    role="list"
                    aria-label="Music Hub regions"
                  >
                    {regionRows.map((r) => {
                      const active = hover === r.code;
                      return (
                        <li key={r.code}>
                          <button
                            type="button"
                            onMouseEnter={() => setHover(r.code)}
                            onMouseLeave={() => setHover(null)}
                            onFocus={() => setHover(r.code)}
                            onBlur={() => setHover(null)}
                            onClick={() => go({ level: 'region', id: r.code })}
                            className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                              active
                                ? 'bg-[#E4F4EF] text-[#0B6B5F] ring-1 ring-[#0B6B5F]/25'
                                : 'text-[#1F1B4D] hover:bg-[#F4FBF7]'
                            }`}
                          >
                            <span className="min-w-0 truncate text-[13px] font-semibold">{r.name}</span>
                            <span
                              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
                                active ? 'bg-[#0B6B5F] text-white' : 'bg-[#E4F4EF] text-[#0B6B5F]'
                              }`}
                            >
                              {r.count}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              <p className={`flex items-center gap-2 text-[12px] ${muted}`}>
                <Info className="h-3.5 w-3.5" aria-hidden />
                Hub areas from Arts Council England’s published list. Map boundaries © ONS, Open Government Licence.
              </p>
            </section>
          ) : atRegion ? (
            <section ref={resultsRef} className="min-w-0 space-y-4" aria-labelledby="music-hubs-results">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={backToMap}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-[#0B6B5F] ring-1 ring-inset ring-[#0B6B5F]/20 transition hover:bg-[#E4F4EF]"
                >
                  ← Back to map
                </button>
              </div>

              <div className="rounded-2xl border border-[#1F1B4D]/[0.08] bg-white px-5 py-3 shadow-[0_1px_2px_rgba(31,27,77,0.04)] sm:px-6">
                <h2
                  id="music-hubs-results"
                  className="text-[26px] font-bold tracking-tight text-[#1F1B4D] sm:text-[30px]"
                >
                  {regionName}
                </h2>
                <p className="mt-1 text-[13px] font-semibold text-[#0B6B5F]">
                  {regionHubCount} Music Hub{regionHubCount === 1 ? '' : 's'} in {regionName}
                </p>
                <p className={`mt-1 text-[14px] leading-snug ${muted}`}>
                  These Music Hubs serve schools across this region. Open a hub to explore resources and local
                  services, or pick a pin on the map to find its card.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setRegionMapOpen((v) => !v)}
                aria-expanded={regionMapOpen}
                className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-[#1F1B4D]/[0.08] bg-white px-4 text-[14px] font-semibold text-[#0B6B5F] sm:hidden"
              >
                {regionMapOpen ? 'Hide map' : 'Show map'}
                <span aria-hidden>{regionMapOpen ? '▴' : '▾'}</span>
              </button>

              <div className="grid gap-6 lg:grid-cols-[clamp(360px,40%,520px)_minmax(0,1fr)] lg:items-start">
                <div
                  className={`${regionMapOpen ? 'block' : 'hidden'} relative h-[240px] overflow-hidden rounded-xl border border-[#1F1B4D]/[0.08] bg-white shadow-[0_1px_2px_rgba(31,27,77,0.04)] sm:block sm:h-[320px] lg:sticky lg:top-[calc(var(--ccd-sticky-header-h,65px)+16px)] lg:h-auto lg:aspect-[4/5] lg:max-h-[calc(100vh-var(--ccd-sticky-header-h,65px)-40px)]`}
                >
                  <UkHubMap
                    ix={ix}
                    focus={focus}
                    hover={hover ?? pinnedHub}
                    onHover={setHover}
                    onFocus={onMapFocus}
                    showBreadcrumb={false}
                    regionLabelMode="none"
                    showFeatureLabels={false}
                    showAttribution={false}
                    controlsPosition="bottom-right"
                    showReset
                    pins
                    onPinActivate={activatePin}
                    palette="green"
                    className="h-full w-full !rounded-xl !border-0"
                  />
                  <button
                    type="button"
                    onClick={() => setRegionMapModal(true)}
                    className="absolute right-3 top-3 z-[6] inline-flex min-h-[40px] items-center rounded-full bg-white/95 px-4 text-[13px] font-semibold text-[#0B6B5F] shadow-[0_1px_2px_rgba(31,27,77,0.06),0_6px_20px_rgba(31,27,77,0.1)] ring-1 ring-inset ring-[#0B6B5F]/20 hover:bg-[#E4F4EF]"
                  >
                    View full map
                  </button>
                </div>

                <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-xl border border-[#E2E0EF] bg-[#F4F3FA] px-3 py-2">
                <div className="min-w-0 shrink-0 pr-1">
                  <h3 className="truncate text-sm font-extrabold tracking-tight text-[#1F1B4D] sm:text-base">
                    {regionHubCount} Music Hub{regionHubCount === 1 ? '' : 's'}
                  </h3>
                  <p className="text-[13px] font-medium leading-tight text-[#77738F]">A–Z</p>
                </div>
                <div className="ml-auto flex flex-wrap items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setHubsView('grid')}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                      hubsView === 'grid' ? 'bg-[#E4F4EF] text-[#0B6B5F]' : 'text-[#5C5878] hover:bg-[#E4F4EF]'
                    }`}
                    title="Grid view"
                    aria-pressed={hubsView === 'grid'}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setHubsView('list')}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                      hubsView === 'list' ? 'bg-[#E4F4EF] text-[#0B6B5F]' : 'text-[#5C5878] hover:bg-[#E4F4EF]'
                    }`}
                    title="List view"
                    aria-pressed={hubsView === 'list'}
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setHubsView('compact')}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                      hubsView === 'compact' ? 'bg-[#E4F4EF] text-[#0B6B5F]' : 'text-[#5C5878] hover:bg-[#E4F4EF]'
                    }`}
                    title="Compact view"
                    aria-pressed={hubsView === 'compact'}
                  >
                    <Rows3 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {regionHubs.length === 0 ? (
                <EmptyState
                  title="No Music Hubs listed here yet."
                  body="Try another region from the map."
                  action={<SecondaryButton onClick={backToMap}>Back to map</SecondaryButton>}
                />
              ) : hubsView === 'list' ? (
                <ul className="space-y-2" role="list">
                  {regionHubs.map((h) => (
                    <li key={h.id}>
                      <MusicHubListRow
                        name={musicHubCardTitle(h.id, hubLabel(h), h.leadOrganisation ?? undefined)}
                        region={ix.region(h.region)?.name || h.aceAreaName || 'England'}
                        location={h.authorities[0] || h.aceAreaName || 'England'}
                        onOpen={() => go({ level: 'hub', id: h.id }, 'hub')}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <div ref={hubsGridMeasureRef}>
                  <ul
                    className="grid items-start gap-6 max-[639px]:!grid-cols-1"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
                    role="list"
                  >
                    {regionHubs.map((h) => (
                      <li
                        key={h.id}
                        data-hub-card={h.id}
                        onPointerEnter={() => setHover(h.id)}
                        onPointerLeave={() => setHover(null)}
                        className={`min-w-0 scroll-mt-24 rounded-2xl transition-shadow ${
                          hover === h.id || pinnedHub === h.id
                            ? 'shadow-[0_0_0_3px_#0B6B5F]'
                            : ''
                        }`}
                      >
                        <MusicHubResultCard
                          id={h.id}
                          name={musicHubCardTitle(h.id, hubLabel(h), h.leadOrganisation ?? undefined)}
                          region={ix.region(h.region)?.name || h.aceAreaName || 'England'}
                          location={h.authorities[0] || h.aceAreaName || 'England'}
                          detail={musicHubCardDetail(h.id, h.leadOrganisation ?? undefined, h.lads.length)}
                          onOpen={() => go({ level: 'hub', id: h.id }, 'hub')}
                          compact={hubsView === 'compact'}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

                </div>
              </div>

              {regionMapModal &&
                createPortal(
                  <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1F1B4D]/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Map of ${regionName}`}
                    onClick={(e) => {
                      if (e.target === e.currentTarget) setRegionMapModal(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setRegionMapModal(false);
                    }}
                  >
                    <div className="relative h-[85vh] w-[90vw] max-w-[90vw] overflow-hidden rounded-2xl bg-white shadow-2xl">
                      <UkHubMap
                        ix={ix}
                        focus={focus}
                        hover={hover ?? pinnedHub}
                        onHover={setHover}
                        onFocus={onMapFocus}
                        showBreadcrumb={false}
                        regionLabelMode="none"
                        controlsPosition="bottom-right"
                        showReset
                        pins
                        onPinActivate={(id) => {
                          setRegionMapModal(false);
                          activatePin(id);
                        }}
                        palette="green"
                        className="h-full w-full !rounded-2xl !border-0"
                      />
                      <button
                        type="button"
                        autoFocus
                        onClick={() => setRegionMapModal(false)}
                        className="absolute right-3 top-3 z-[6] inline-flex min-h-[40px] items-center rounded-full bg-white px-4 text-[13px] font-semibold text-[#1F1B4D] shadow ring-1 ring-inset ring-[#1F1B4D]/15"
                      >
                        Close map
                      </button>
                    </div>
                  </div>,
                  document.body,
                )}

              <p className={`flex items-center gap-2 text-[13px] ${muted}`}>
                <Info className="h-3.5 w-3.5" aria-hidden />
                Hub areas from Arts Council England’s published list. Map boundaries © ONS, Open Government Licence.
              </p>
            </section>
          ) : (
            // lad / other browse focuses: keep a simple redirect path via panel
            <div className="grid gap-4 lg:grid-cols-[minmax(260px,360px)_minmax(0,1fr)] lg:items-start">
              <div className="overflow-hidden rounded-2xl border border-[#1F1B4D]/[0.08] bg-white shadow-[0_1px_2px_rgba(31,27,77,0.04)]">
                <UkHubMap
                  ix={ix}
                  focus={focus}
                  hover={hover}
                  onHover={setHover}
                  onFocus={onMapFocus}
                  showBreadcrumb={false}
                  showRegionCounts={false}
                  palette="green"
                  className="h-[300px] !rounded-2xl !border-0 sm:h-[340px]"
                />
              </div>
              <BrowsePanel ix={ix} focus={focus} hover={hover} onHover={setHover} go={go} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
