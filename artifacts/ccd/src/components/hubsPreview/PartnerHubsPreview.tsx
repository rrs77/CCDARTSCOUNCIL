import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  ExternalLink,
  FileText,
  Info,
  Library,
  Mail,
  MapPin,
  Music2,
  Phone,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { openPartnerHub } from '../../config/partnerHubs';
import { UkHubMap } from './UkHubMap';
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
  indexMap,
  loadUkHubMap,
  parentFocus,
} from './ukHubMapData';
import {
  DISCIPLINES,
  type Discipline,
  HUB_IDENTITY,
  type HubResource,
  NATION_NOTES,
  ORGANISATIONS,
  PHASES,
  type Phase,
  hubRelationship,
  resourcesForArea,
  resourcesForHub,
  serviceForLad,
} from './hubsPreviewContent';

// ---------------------------------------------------------------------------
// URL state: ?hubs=preview&page=browse|hub|area&at=england/east-of-england/...
// ---------------------------------------------------------------------------

type Page = 'browse' | 'hub' | 'area';
type Section = 'music-hubs' | 'organisations';

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
  return {
    page: ['browse', 'hub', 'area'].includes(page) ? page : 'browse',
    at: (p.get('at') || '').split('/').filter(Boolean),
    section: p.get('section') === 'organisations' ? 'organisations' : 'music-hubs',
    tab: (['resources', 'events', 'about', 'contact'].includes(p.get('tab') || '') ? p.get('tab') : 'resources') as HubTab,
  };
}

function writeRoute(r: Partial<Route>, replace = false) {
  const cur = readRoute();
  const next = { ...cur, ...r };
  const p = new URLSearchParams(window.location.search);
  p.set('hubs', 'preview');
  p.set('page', next.page);
  if (next.at.length) p.set('at', next.at.join('/'));
  else p.delete('at');
  if (next.section === 'organisations') p.set('section', 'organisations');
  else p.delete('section');
  if (next.page === 'hub' && next.tab !== 'resources') p.set('tab', next.tab);
  else p.delete('tab');
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

export const isHubsPreview = () =>
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('hubs') === 'preview';

// ---------------------------------------------------------------------------

const ink = 'text-[#002D24]';
const muted = 'text-[#002D24]/65';

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
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-[#002D24]/30" aria-hidden />}
          {it.onClick ? (
            <button type="button" onClick={it.onClick} className="rounded px-1 py-0.5 text-[#002D24]/60 hover:text-[#002D24] hover:underline">
              {it.label}
            </button>
          ) : (
            <span aria-current="page" className="px-1 font-medium text-[#002D24]">
              {it.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

function PrimaryButton({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#002D24] px-4 text-[15px] font-medium text-white shadow-[0_1px_2px_rgba(0,45,36,0.2)] transition hover:bg-[#0B3B30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14B8A6] ${className}`}
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
  const cls = `inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#002D24]/12 bg-white px-4 text-[15px] font-medium text-[#002D24] transition hover:border-[#002D24]/25 hover:bg-[#F6F8F6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14B8A6] ${className}`;
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
    if (ix) {
      out.push(
        ...resourcesForHub('greater-essex')
          .filter((r) => starts(r.title) || starts(r.subject) || starts(r.provider))
          .slice(0, 3)
          .map<SearchHit>((r) => ({
            group: 'Resources',
            label: r.title,
            detail: `${r.type} · ${r.provider} · ${r.phaseLabel}`,
            go: () => onFocusMap({ level: 'hub', id: 'greater-essex' }, 'hub'),
          })),
      );
    }
    return out;
  }, [q, ix, onFocusMap]);

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
      <div className="flex h-14 items-center gap-3 rounded-2xl border border-[#002D24]/10 bg-white px-4 shadow-[0_1px_2px_rgba(0,45,36,0.04),0_8px_24px_-12px_rgba(0,45,36,0.18)] focus-within:border-[#14B8A6]/60 focus-within:ring-4 focus-within:ring-[#14B8A6]/10">
        <Search className="h-5 w-5 shrink-0 text-[#002D24]/45" aria-hidden />
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
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-[#002D24] outline-none placeholder:text-[#002D24]/40"
        />
        {q && (
          <button type="button" aria-label="Clear search" onClick={() => setQ('')} className="rounded-full p-1.5 text-[#002D24]/45 hover:bg-[#002D24]/5">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && q.trim().length >= 2 && (
        <div
          id="hubs-search-list"
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+8px)] z-30 max-h-[420px] overflow-auto rounded-2xl border border-[#002D24]/10 bg-white p-2 shadow-[0_24px_48px_-16px_rgba(0,45,36,0.28)]"
        >
          {hits.length === 0 && <p className={`px-3 py-4 text-[15px] ${muted}`}>No matches for “{q.trim()}”.</p>}
          {hits.map((h, i) => {
            const header = h.group !== lastGroup;
            lastGroup = h.group;
            return (
              <div key={`${h.group}-${h.label}-${i}`}>
                {header && <p className="px-3 pb-1 pt-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#002D24]/45">{h.group}</p>}
                <div
                  id={`hubs-hit-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(h);
                  }}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${i === active ? 'bg-[#E8F0EA]' : ''}`}
                >
                  <span className="min-w-0">
                    <span className={`block truncate text-[15px] font-medium ${ink}`}>{h.label}</span>
                    <span className={`block truncate text-[14px] ${muted}`}>{h.detail}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#002D24]/35" aria-hidden />
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
  const rel = hubRelationship(hub.id);
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
        {rel === 'Working example' && <Badge tone="teal">Working example</Badge>}
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
  const svc = lad ? serviceForLad(hub, lad) : undefined;
  const shared = resourcesForHub(hub.id).length;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#002D24]/[0.08] bg-white p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge>Music Hub</Badge>
          {hubRelationship(hub.id) === 'Working example' && <Badge tone="teal">Working example</Badge>}
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
        <div className="rounded-2xl border border-[#14B8A6]/30 bg-[#F2FBF9] p-4" aria-live="polite">
          <p className={`text-[17px] font-semibold ${ink}`}>{lad.name}</p>
          <p className={`mt-0.5 text-[14px] ${muted}`}>{svc ? `Served by ${svc.name}` : `Part of ${hubLabel(hub)}`}</p>
          {shared > 0 && <p className={`mt-2 text-[14px] ${ink}`}>{shared} shared {hubLabel(hub).replace(/ Music Hub$/, '')} resources</p>}
          <PrimaryButton className="mt-3 w-full" onClick={() => go({ level: 'lad', id: lad.code }, 'area')}>
            Explore {lad.name} <ArrowRight className="h-4 w-4" />
          </PrimaryButton>
        </div>
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

function OrganisationsSection() {
  const [discipline, setDiscipline] = useState<Discipline | 'All'>('All');
  const [q, setQ] = useState('');
  const shown = ORGANISATIONS.filter(
    (o) =>
      (discipline === 'All' || o.disciplines.includes(discipline)) &&
      (!q.trim() || `${o.hub.displayName} ${o.hub.tagline ?? ''}`.toLowerCase().includes(q.trim().toLowerCase())),
  );
  return (
    <section aria-labelledby="orgs-heading" className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="orgs-heading" className={`text-[22px] font-semibold tracking-tight ${ink}`}>
            Arts organisations
          </h2>
          <p className={`mt-1 text-[15px] ${muted}`}>National organisations and specialist providers with resources for schools.</p>
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
                className={`min-h-[40px] rounded-full px-3.5 text-[14px] font-medium transition ${
                  discipline === d ? 'bg-[#002D24] text-white' : 'bg-white text-[#002D24] ring-1 ring-inset ring-[#002D24]/10 hover:ring-[#002D24]/25'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <label className="flex h-10 items-center gap-2 rounded-full bg-white px-3 ring-1 ring-inset ring-[#002D24]/10 focus-within:ring-[#14B8A6]/60">
            <Search className="h-4 w-4 text-[#002D24]/40" aria-hidden />
            <span className="sr-only">Filter organisations</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name" className="w-36 bg-transparent text-[14px] outline-none" />
          </label>
        </div>
      </div>
      <p className={`text-[14px] ${muted}`}>
        {shown.length} organisations · A–Z
      </p>
      {shown.length === 0 ? (
        <EmptyState title="No organisations match these filters." action={<SecondaryButton onClick={() => { setDiscipline('All'); setQ(''); }}>Clear filters</SecondaryButton>} />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="list">
          {shown.map((o) => {
            const h = o.hub;
            const usePlate = !h.logoSrcOnDark && h.logoOnPlate;
            const invert = !h.logoSrcOnDark && !h.logoOnPlate && h.logoInvert;
            return (
              <li key={h.slug}>
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#002D24]/[0.08] bg-white transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-20px_rgba(0,45,36,0.35)] motion-reduce:hover:translate-y-0">
                  <div className="flex h-24 items-center justify-center bg-[#002D24] px-6">
                    {usePlate ? (
                      <span
                        className="flex h-14 w-full max-w-[12rem] items-center justify-center rounded-xl px-3"
                        style={{ backgroundColor: h.logoPanelColor || '#FFFFFF' }}
                      >
                        <img src={h.logoSrc} alt="" loading="lazy" className="h-9 w-auto max-w-full object-contain" />
                      </span>
                    ) : (
                      <img
                        src={h.logoSrcOnDark || h.logoSrc}
                        alt=""
                        loading="lazy"
                        className={`h-11 w-auto max-w-[75%] object-contain ${invert ? 'brightness-0 invert' : ''}`}
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className={`text-[16px] font-semibold leading-snug ${ink}`}>{h.displayName}</h3>
                    <p className={`mt-0.5 text-[14px] ${muted}`}>{o.disciplines.join(' · ') || 'Arts'}</p>
                    <p className={`mt-2 line-clamp-2 text-[14px] leading-snug ${muted}`}>{h.tagline}</p>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                      <Badge tone={o.access === 'Free' ? 'teal' : 'amber'}>{o.access}</Badge>
                      <button
                        type="button"
                        onClick={() => openPartnerHub(h.slug)}
                        className="inline-flex min-h-[40px] items-center gap-1 rounded-lg px-2 text-[14px] font-medium text-[#0B6B5F] hover:bg-[#14B8A6]/10"
                        aria-label={`Explore resources from ${h.displayName}`}
                      >
                        Explore resources <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
      <p className={`text-[13px] ${muted}`}>
        Listings show publicly available resources. A listing does not mean the organisation has endorsed or partnered with CCDesigner.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Resources and the planning workflow
// ---------------------------------------------------------------------------

const PACK_SETUP: Record<HubResource['packId'], () => Promise<{ skipped?: boolean }>> = {
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
  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#002D24]/[0.08] bg-white p-5 transition hover:border-[#002D24]/20 hover:shadow-[0_16px_32px_-24px_rgba(0,45,36,0.4)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#330968]/[0.07] text-[#330968]">
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
        <Badge tone="teal">{r.access}</Badge>
        <Badge>By {r.provider}</Badge>
        {scopeLabel && <Badge>{scopeLabel}</Badge>}
      </div>
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <PrimaryButton onClick={onOpen}>
          View and add <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </div>
    </article>
  );
}

const STEPS = ['Preview', 'Add to my library', 'Use in a lesson', 'Place in Planner', 'Reflect after teaching'];

function ResourceSheet({ r, onClose }: { r: HubResource; onClose: () => void }) {
  const [added, setAdded] = useState(() => readAdded().includes(r.id));
  const [busy, setBusy] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const add = async () => {
    setBusy(true);
    try {
      const res = await PACK_SETUP[r.packId]();
      localStorage.setItem(ADDED_KEY, JSON.stringify([...new Set([...readAdded(), r.id])]));
      setAdded(true);
      toast.success(res?.skipped ? 'Already in your library' : `Added to your library · Originally provided by ${r.provider}`);
    } catch (e) {
      console.error(e);
      toast.error('Could not add this to your library');
    } finally {
      setBusy(false);
    }
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
              ['Access', r.access],
              ['Provided by', r.provider],
              ['Terms', 'As published by the provider'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[13px] text-[#002D24]/55">{k}</dt>
                <dd className={`font-medium ${ink}`}>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-2">
            <SecondaryButton href={r.previewHref}>
              <FileText className="h-4 w-4" /> Preview {r.type === 'PDF' ? 'PDF' : 'course notes'}
            </SecondaryButton>
            <SecondaryButton href={r.sourceHref}>
              <ExternalLink className="h-4 w-4" /> Source
            </SecondaryButton>
          </div>

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
                  <Library className="h-4 w-4" /> {busy ? 'Adding…' : 'Add to my library'}
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
        </div>
      </div>
    </div>,
    document.body,
  );
}

function PhaseFilter({ value, onChange }: { value: Phase | 'All'; onChange: (p: Phase | 'All') => void }) {
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

function HubHeader({ hub, crumbs }: { hub: MapHub; crumbs: { label: string; onClick?: () => void }[] }) {
  const id = HUB_IDENTITY[hub.id];
  const rel = hubRelationship(hub.id);
  return (
    <header className="space-y-4">
      <Crumbs items={crumbs} />
      <div className="flex flex-col gap-5 rounded-3xl border border-[#002D24]/[0.07] bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          {id?.logoSrc ? (
            <span className="flex h-16 w-28 shrink-0 items-center justify-center rounded-2xl px-4" style={{ backgroundColor: id.brandColor }}>
              <img src={id.logoSrc} alt="" className="max-h-10 w-full object-contain" />
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
              {rel === 'Working example' && <Badge tone="teal">Working example</Badge>}
            </div>
            <p className={`mt-1 text-[16px] ${ink}`}>{hub.authorities.join(' · ')}</p>
            <p className={`mt-0.5 text-[14px] ${muted}`}>
              {hub.leadOrganisation ? `Lead organisation: ${hub.leadOrganisation}` : 'Lead organisation: check Arts Council England'}
            </p>
          </div>
        </div>
        {hub.siteUrl && (
          <SecondaryButton href={hub.siteUrl} className="shrink-0">
            Official website <ExternalLink className="h-4 w-4" />
          </SecondaryButton>
        )}
      </div>
      {hub.regionNote && <p className="text-[14px] text-[#8A5300]">{hub.regionNote}</p>}
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
  const lads = ix.ladsInHub(hub.id);
  const id = HUB_IDENTITY[hub.id];
  const resources = resourcesForHub(hub.id).filter((r) => phase === 'All' || r.phases.includes(phase));
  const short = hubLabel(hub).replace(/ Music( Education)? Hub$/, '');
  const focus: MapFocus = area ? { level: 'lad', id: area.code } : { level: 'hub', id: hub.id };
  const svc = area ? serviceForLad(hub, area) : undefined;

  const setTab = (t: HubTab) => writeRoute({ tab: t }, true);

  return (
    <div className="space-y-6">
      <HubHeader hub={hub} crumbs={[...regionCrumbs, { label: short }]} />

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
        <div className="flex flex-col gap-4 lg:max-h-[600px]">
          <div>
            <h3 className={`text-[18px] font-semibold ${ink}`}>Find your area</h3>
            <p className={`mt-0.5 text-[14px] ${muted}`}>
              {lads.length} local areas. Resources shared across {short} appear on every area page.
            </p>
          </div>
          <FindArea value={filter} onChange={setFilter} label="Search areas" />
          <div className="min-h-0 flex-1 overflow-auto pr-0.5">
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
            <div className="rounded-2xl border border-[#14B8A6]/30 bg-[#F2FBF9] p-4" aria-live="polite">
              <p className={`text-[17px] font-semibold ${ink}`}>{area.name}</p>
              <p className={`text-[14px] ${muted}`}>{svc ? `Served by ${svc.name}` : `Part of ${short}`}</p>
              <PrimaryButton className="mt-3 w-full" onClick={() => go({ level: 'lad', id: area.code }, 'area')}>
                Explore {area.name} <ArrowRight className="h-4 w-4" />
              </PrimaryButton>
            </div>
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
            (resourcesForHub(hub.id).length === 0 ? (
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
                {(id?.about ?? [
                  `${hub.name} is the Arts Council England Music Hub for ${hub.authorities.join(', ')}.`,
                  hub.leadOrganisation ? `${hub.leadOrganisation} is the Hub Lead Organisation.` : 'The Hub Lead Organisation is listed by Arts Council England.',
                ]).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                <p className={`text-[14px] ${muted}`}>Hub area: Arts Council England, Music Hub Investment Programme.</p>
              </div>
              {id?.services && (
                <div className="rounded-2xl border border-[#002D24]/[0.08] bg-white p-5">
                  <h3 className={`text-[16px] font-semibold ${ink}`}>Music services in this hub</h3>
                  <ul className="mt-3 space-y-3">
                    {id.services.map((s) => (
                      <li key={s.name} className="text-[15px]">
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
                          {s.role} · {s.covers}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {tab === 'contact' &&
            (id?.contact ? (
              <div className="max-w-md space-y-3 rounded-2xl border border-[#002D24]/[0.08] bg-white p-5 text-[15px]">
                <p className={`font-semibold ${ink}`}>{id.contact.lines.join(' · ')}</p>
                {id.contact.phone && (
                  <a className={`flex items-center gap-2 ${ink} hover:underline`} href={`tel:${id.contact.phone.replace(/\s/g, '')}`}>
                    <Phone className="h-4 w-4 text-[#002D24]/50" /> {id.contact.phone}
                  </a>
                )}
                {id.contact.email && (
                  <a className={`flex items-center gap-2 ${ink} hover:underline`} href={`mailto:${id.contact.email}`}>
                    <Mail className="h-4 w-4 text-[#002D24]/50" /> {id.contact.email}
                  </a>
                )}
                {id.contact.sourceUrl && (
                  <p className={`text-[13px] ${muted}`}>
                    From the{' '}
                    <a href={id.contact.sourceUrl} target="_blank" rel="noreferrer" className="underline">
                      official contact page
                    </a>
                    .
                  </p>
                )}
              </div>
            ) : (
              <EmptyState
                title="Contact details haven’t been verified yet."
                action={hub.siteUrl ? <SecondaryButton href={hub.siteUrl}>Official website <ExternalLink className="h-4 w-4" /></SecondaryButton> : undefined}
              />
            ))}
        </div>
      </section>
      {open && <ResourceSheet r={open} onClose={() => setOpen(null)} />}
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
  const short = hubLabel(hub).replace(/ Music( Education)? Hub$/, '');
  const svc = serviceForLad(hub, lad);
  const { local, shared } = resourcesForArea(hub.id, lad.code);
  const match = (r: HubResource) =>
    (phase === 'All' || r.phases.includes(phase)) &&
    (!q.trim() || `${r.title} ${r.description} ${r.subject}`.toLowerCase().includes(q.trim().toLowerCase()));
  const sharedShown = shared.filter(match);
  const localShown = local.filter(match);

  return (
    <div className="space-y-6">
      <Crumbs items={[...regionCrumbs, { label: short, onClick: () => go({ level: 'hub', id: hub.id }, 'hub') }, { label: lad.name }]} />
      <header className="grid gap-5 rounded-3xl border border-[#002D24]/[0.07] bg-white p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_240px] md:items-center">
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
              {svc.role === 'Hub Lead Organisation' ? ' (Hub Lead Organisation)' : ''}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {svc?.siteUrl && (
              <SecondaryButton href={svc.siteUrl}>
                {svc.name} website <ExternalLink className="h-4 w-4" />
              </SecondaryButton>
            )}
          </div>
        </div>
        <MiniMap ix={ix} hub={hub} lad={lad} onClick={() => go({ level: 'lad', id: lad.code }, 'hub')} />
      </header>

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
      {open && <ResourceSheet r={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function PartnerHubsPreview() {
  const route = useRoute();
  const [ix, setIx] = useState<MapIndex | null>(null);
  const [error, setError] = useState(false);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    loadUkHubMap()
      .then((d) => live && setIx(indexMap(d)))
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, []);

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

  const regionCrumbs = (hub: MapHub) => [
    { label: 'Partner Hubs', onClick: () => go({ level: 'uk' }) },
    { label: 'England', onClick: () => go({ level: 'nation', id: ENGLAND }) },
    { label: ix!.region(hub.region)!.name, onClick: () => go({ level: 'region', id: hub.region }) },
  ];

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

  const atUk = focus.level === 'uk';
  const browseCrumbs: { label: string; onClick?: () => void }[] = [];
  if (ix && !atUk) {
    const chain: MapFocus[] = [];
    for (let f: MapFocus | null = focus; f; f = parentFocus(ix, f)) chain.unshift(f);
    chain.forEach((f, i) =>
      browseCrumbs.push({
        label: i === 0 ? 'Partner Hubs' : focusName(ix, f),
        onClick: i < chain.length - 1 ? () => go(f) : undefined,
      }),
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-5">
        {atUk ? (
          <div className="max-w-3xl">
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#0B6B5F]">Exceptional lessons start with a connection</p>
            <h1 className={`mt-2 text-[34px] font-semibold leading-[1.1] tracking-tight sm:text-[40px] ${ink}`}>Partner Hubs</h1>
            <p className={`mt-3 text-[17px] leading-relaxed ${muted}`}>
              Explore Music Hubs, arts organisations and teaching resources. Bring the ideas you find straight into your planning.
            </p>
          </div>
        ) : (
          <Crumbs items={browseCrumbs} />
        )}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <GlobalSearch ix={ix} onFocusMap={go} />
          <div role="tablist" aria-label="Partner Hubs sections" className="inline-flex h-14 rounded-2xl bg-[#002D24]/[0.05] p-1.5">
            {(
              [
                ['music-hubs', 'Music Hubs'],
                ['organisations', 'Arts organisations'],
              ] as [Section, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                role="tab"
                type="button"
                aria-selected={route.section === k}
                onClick={() => writeRoute({ section: k })}
                className={`flex-1 whitespace-nowrap rounded-xl px-5 text-[15px] font-medium transition ${
                  route.section === k ? 'bg-white text-[#002D24] shadow-[0_1px_3px_rgba(0,45,36,0.12)]' : 'text-[#002D24]/60 hover:text-[#002D24]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {route.section === 'organisations' ? (
        <OrganisationsSection />
      ) : (
        <>
          <section aria-labelledby="browse-heading" className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id="browse-heading" className={`text-[22px] font-semibold tracking-tight ${ink}`}>
                  {atUk || !ix ? 'Browse by location' : focusName(ix, focus)}
                </h2>
                <p className={`mt-1 text-[15px] ${muted}`}>
                  {atUk ? 'Zoom from the UK to your Music Hub and local area, or choose from the list.' : 'Select an area on the map or in the list.'}
                </p>
              </div>
            </div>
            {error ? (
              <EmptyState title="The map couldn’t load." body="Check your connection and try again." action={<SecondaryButton onClick={() => window.location.reload()}>Try again</SecondaryButton>} />
            ) : !ix ? (
              <div className="h-[560px] animate-pulse rounded-2xl bg-[#EEF3EF]" aria-label="Loading map" />
            ) : (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
                <UkHubMap
                  ix={ix}
                  focus={focus}
                  hover={hover}
                  onHover={setHover}
                  onFocus={(f) => go(f)}
                  showBreadcrumb={false}
                  className="h-[440px] sm:h-[560px] lg:h-[680px]"
                />
                <div className="lg:max-h-[680px] lg:overflow-y-auto lg:pr-1">
                  <BrowsePanel ix={ix} focus={focus} hover={hover} onHover={setHover} go={go} />
                </div>
              </div>
            )}
          </section>

          {atUk && ix && (
            <section aria-labelledby="example-heading" className="grid items-center gap-5 rounded-3xl border border-[#002D24]/[0.07] bg-white p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:p-6">
              <span className="flex h-16 w-28 items-center justify-center rounded-2xl bg-[#330968] px-4">
                <img src="/music-hubs/logos/essex-music-service.svg" alt="" className="max-h-10 w-full object-contain" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="example-heading" className={`text-[18px] font-semibold ${ink}`}>
                    Greater Essex Music Hub
                  </h2>
                  <Badge tone="teal">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden /> Working example
                  </Badge>
                </div>
                <p className={`mt-1 text-[15px] ${muted}`}>
                  See how a hub page works: 14 local areas, shared resources and a direct route into your planning.
                </p>
              </div>
              <PrimaryButton onClick={() => go({ level: 'hub', id: 'greater-essex' }, 'hub')}>
                Explore Greater Essex <ArrowRight className="h-4 w-4" />
              </PrimaryButton>
            </section>
          )}
          {atUk && (
            <p className={`flex items-center gap-2 text-[13px] ${muted}`}>
              <Info className="h-4 w-4" aria-hidden />
              Hub areas and lead organisations from Arts Council England’s published list. Map boundaries © ONS, Open Government Licence.
            </p>
          )}
        </>
      )}
    </div>
  );
}
