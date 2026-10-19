import { useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Heart,
  Landmark,
  LayoutGrid,
  List,
  MapPin,
  Search,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { openPartnerHub, type PartnerHubConfig } from '../../config/partnerHubs';
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
  TAG_TONE,
  orgListingMeta,
} from './hubsPreviewContent';

const ink = 'text-[#1F1B4D]';
const muted = 'text-[#1F1B4D]/65';

const AGE_GROUPS = ['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'Teachers'] as const;

function OrgTag({ label }: { label: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TAG_TONE[label] ?? 'bg-[#F4F3FA] text-[#1F1B4D]'}`}>
      {label}
    </span>
  );
}

/**
 * Wide wordmark strip — partner logos are landscape marks; a tiny square makes them unreadable.
 */
function OrgLogoStrip({ hub }: { hub: PartnerHubConfig }) {
  const src = hub.logoSrcOnDark || hub.logoSrc;
  const onDark = Boolean(hub.logoSrcOnDark) || hub.logoInvert;
  const usePlate = !hub.logoSrcOnDark && hub.logoOnPlate;
  const bg = usePlate
    ? hub.logoPanelColor && hub.logoPanelColor !== 'transparent'
      ? hub.logoPanelColor
      : '#FFFFFF'
    : hub.primaryColor || '#1F1B4D';
  const needsInvert = onDark && !hub.logoSrcOnDark && hub.logoInvert;
  return (
    <div
      className="flex h-[4.25rem] w-full items-center justify-center rounded-xl px-4"
      style={{ backgroundColor: bg === 'transparent' ? '#F4F3FA' : bg }}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        className={`h-9 w-auto max-w-[85%] object-contain sm:h-10 ${needsInvert ? 'brightness-0 invert' : ''}`}
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
  if (age === 'Teachers') return /teacher|cpd|all ages/i.test(hay);
  if (age === 'EYFS') return /eyfs|early|all ages/i.test(hay);
  if (age === 'KS1') return /ks1|primary|5–11|5-11|all ages/i.test(hay);
  if (age === 'KS2') return /ks2|primary|5–11|5-11|all ages/i.test(hay);
  if (age === 'KS3') return /ks3|secondary|11–16|11-16|11–14|all ages/i.test(hay);
  if (age === 'KS4') return /ks4|gcse|secondary|11–16|14|ks5|all ages/i.test(hay);
  return true;
}

/** Arts organisations — left facets + logo cards (mockup). */
export function ArtsOrganisationsDirectoryView() {
  const [discipline, setDiscipline] = useState<Discipline | 'All'>('All');
  const [age, setAge] = useState<(typeof AGE_GROUPS)[number] | 'All'>('All');
  const [q, setQ] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const disciplineCounts = useMemo(() => {
    const c: Record<string, number> = { All: ARTS_ORGANISATIONS.length };
    for (const d of DISCIPLINES) c[d] = ARTS_ORGANISATIONS.filter((o) => o.disciplines.includes(d)).length;
    return c;
  }, []);

  const shown = ARTS_ORGANISATIONS.filter(
    (o) =>
      (discipline === 'All' || o.disciplines.includes(discipline)) &&
      matchesAge(o, age) &&
      (!q.trim() ||
        `${o.hub.displayName} ${o.hub.tagline ?? ''} ${orgListingMeta(o.hub.slug).location}`
          .toLowerCase()
          .includes(q.trim().toLowerCase())),
  );

  return (
    <div className="space-y-5">
      <DirectorySearch value={q} onChange={setQ} placeholder="Search organisations…" />

      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="space-y-5 rounded-2xl border border-[#1F1B4D]/[0.08] bg-white p-4">
          <FacetGroup title="Art forms">
            <FacetRow
              label="All art forms"
              count={disciplineCounts.All}
              active={discipline === 'All'}
              onClick={() => setDiscipline('All')}
              accent="#5B4BDB"
            />
            {DISCIPLINES.map((d) => (
              <FacetRow
                key={d}
                label={d}
                count={disciplineCounts[d]}
                active={discipline === d}
                onClick={() => setDiscipline(d)}
                accent="#5B4BDB"
              />
            ))}
          </FacetGroup>
          <FacetGroup title="Age groups">
            <FacetRow label="All ages" active={age === 'All'} onClick={() => setAge('All')} accent="#5B4BDB" />
            {AGE_GROUPS.map((a) => (
              <FacetRow key={a} label={a} active={age === a} onClick={() => setAge(a)} accent="#5B4BDB" />
            ))}
          </FacetGroup>
        </aside>

        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className={`text-[20px] font-bold tracking-tight ${ink}`}>Arts organisations</h2>
              <p className={`mt-0.5 text-[13px] ${muted}`}>
                {shown.length} organisation{shown.length === 1 ? '' : 's'} with free classroom resources
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex min-h-[34px] items-center gap-1 rounded-full bg-white px-3 text-[12px] font-semibold text-[#1F1B4D] ring-1 ring-inset ring-[#1F1B4D]/10">
                A–Z <ChevronDown className="h-3.5 w-3.5 opacity-50" aria-hidden />
              </span>
              <div className="inline-flex rounded-full bg-white p-0.5 ring-1 ring-inset ring-[#1F1B4D]/10">
                <button
                  type="button"
                  aria-pressed={view === 'grid'}
                  onClick={() => setView('grid')}
                  className={`rounded-full p-1.5 ${view === 'grid' ? 'bg-[#5B4BDB] text-white' : 'text-[#1F1B4D]/55'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-pressed={view === 'list'}
                  onClick={() => setView('list')}
                  className={`rounded-full p-1.5 ${view === 'list' ? 'bg-[#5B4BDB] text-white' : 'text-[#1F1B4D]/55'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {shown.length === 0 ? (
            <p className={`rounded-2xl border border-dashed border-[#1F1B4D]/15 bg-white px-4 py-8 text-center text-[14px] ${muted}`}>
              No organisations match these filters.
            </p>
          ) : view === 'grid' ? (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" role="list">
              {shown.map((o) => {
                const meta = orgListingMeta(o.hub.slug);
                return (
                  <li key={o.hub.slug}>
                    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#1F1B4D]/[0.08] bg-white transition hover:border-[#5B4BDB]/35 hover:shadow-[0_12px_28px_-18px_rgba(91,75,219,0.45)]">
                      <div className="p-3 pb-0">
                        <OrgLogoStrip hub={o.hub} />
                      </div>
                      <div className="flex flex-1 flex-col p-4 pt-3">
                        <h3 className={`text-[15px] font-bold leading-snug ${ink}`}>{o.hub.displayName}</h3>
                        <p className={`mt-0.5 text-[12px] ${muted}`}>{o.disciplines.join(', ') || 'Arts'}</p>
                        <p className={`mt-2 line-clamp-2 text-[13px] leading-snug ${muted}`}>
                          {o.hub.tagline || o.hub.description[0]}
                        </p>
                        <div className="mt-auto flex flex-wrap gap-1 pt-3">
                          {meta.tags.slice(0, 3).map((t) => (
                            <OrgTag key={t} label={t} />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => openPartnerHub(o.hub.slug)}
                          className="mt-3 inline-flex min-h-[36px] items-center gap-1 self-start text-[13px] font-semibold text-[#5B4BDB] hover:underline"
                        >
                          Explore <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="divide-y divide-[#1F1B4D]/[0.06] overflow-hidden rounded-2xl border border-[#1F1B4D]/[0.08] bg-white">
              {shown.map((o) => (
                <li key={o.hub.slug}>
                  <button
                    type="button"
                    onClick={() => openPartnerHub(o.hub.slug)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#F4F3FA]"
                  >
                    <OrgLogoMark hub={o.hub} />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[14px] font-semibold ${ink}`}>{o.hub.displayName}</span>
                      <span className={`block truncate text-[12px] ${muted}`}>{o.hub.tagline}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#1F1B4D]/30" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function paidFromLabel(slug: string): string {
  const products = getPaidProductsForPartner(slug as PaidPartnerSlug);
  if (!products.length) return 'Subscription';
  const priced = products.filter((p) => p.pricePence > 0);
  if (!priced.length) return 'Free starter available';
  const min = Math.min(...priced.map((p) => p.pricePence));
  return `From ${formatPricePence(min)}`;
}

const PAID_TYPES = ['All types', 'Schemes of work', 'Lesson packs', 'CPD courses'] as const;

/** Paid resources — left facets + company cards with prices (existing paid hubs). */
export function PaidResourcesDirectoryView() {
  const [subject, setSubject] = useState<Discipline | 'All'>('All');
  const [age, setAge] = useState<(typeof AGE_GROUPS)[number] | 'All'>('All');
  const [rtype, setRtype] = useState<(typeof PAID_TYPES)[number]>('All types');
  const [q, setQ] = useState('');

  const shown = PAID_RESOURCES.filter((o) => {
    if (subject !== 'All' && !o.disciplines.includes(subject)) return false;
    if (!matchesAge(o, age)) return false;
    if (q.trim()) {
      const hay = `${o.hub.displayName} ${o.hub.tagline ?? ''}`.toLowerCase();
      if (!hay.includes(q.trim().toLowerCase())) return false;
    }
    // Resource type is illustrative for the three demo companies
    if (rtype === 'Schemes of work' && o.hub.slug === 'icompose') return false;
    if (rtype === 'CPD courses' && o.hub.slug === 'weteachdrama') return true;
    return true;
  });

  return (
    <div className="space-y-5">
      <DirectorySearch value={q} onChange={setQ} placeholder="Search paid resources…" />

      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="space-y-5 rounded-2xl border border-[#1F1B4D]/[0.08] bg-white p-4">
          <FacetGroup title="Subject">
            <FacetRow label="All subjects" active={subject === 'All'} onClick={() => setSubject('All')} accent="#B45309" />
            {DISCIPLINES.map((d) => (
              <FacetRow
                key={d}
                label={d}
                count={PAID_RESOURCES.filter((o) => o.disciplines.includes(d)).length}
                active={subject === d}
                onClick={() => setSubject(d)}
                accent="#B45309"
              />
            ))}
          </FacetGroup>
          <FacetGroup title="Age groups">
            <FacetRow label="All ages" active={age === 'All'} onClick={() => setAge('All')} accent="#B45309" />
            {AGE_GROUPS.map((a) => (
              <FacetRow key={a} label={a} active={age === a} onClick={() => setAge(a)} accent="#B45309" />
            ))}
          </FacetGroup>
          <FacetGroup title="Resource type">
            {PAID_TYPES.map((t) => (
              <FacetRow key={t} label={t} active={rtype === t} onClick={() => setRtype(t)} accent="#B45309" />
            ))}
          </FacetGroup>
        </aside>

        <div className="space-y-4">
          <div>
            <h2 className={`text-[20px] font-bold tracking-tight ${ink}`}>Paid resources</h2>
            <p className={`mt-0.5 text-[13px] ${muted}`}>
              {shown.length} provider{shown.length === 1 ? '' : 's'} · demo pricing only
            </p>
          </div>

          {shown.length === 0 ? (
            <p className={`rounded-2xl border border-dashed border-[#1F1B4D]/15 bg-white px-4 py-8 text-center text-[14px] ${muted}`}>
              No paid resources match these filters.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" role="list">
              {shown.map((o) => (
                <li key={o.hub.slug}>
                  <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#1F1B4D]/[0.08] bg-white transition hover:border-[#B45309]/40 hover:shadow-[0_12px_28px_-18px_rgba(180,83,9,0.4)]">
                    <div className="p-3 pb-0">
                      <OrgLogoStrip hub={o.hub} />
                    </div>
                    <div className="flex flex-1 flex-col p-4 pt-3">
                      <h3 className={`text-[15px] font-bold leading-snug ${ink}`}>{o.hub.displayName}</h3>
                      <p className={`mt-0.5 text-[12px] ${muted}`}>{o.disciplines.join(', ') || 'Arts'}</p>
                      <p className={`mt-2 line-clamp-2 text-[13px] leading-snug ${muted}`}>
                        {o.hub.tagline || o.hub.description[0]}
                      </p>
                      <div className="mt-auto flex items-end justify-between gap-2 pt-4">
                        <p className="text-[14px] font-bold text-[#B45309]">{paidFromLabel(o.hub.slug)}</p>
                        <button
                          type="button"
                          onClick={() => openPartnerHub(o.hub.slug)}
                          className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-[#FEF3C7] px-2.5 text-[12px] font-bold text-[#92400E] hover:bg-[#FDE68A]"
                        >
                          Open hub <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/** Page title row actions (mockup: top-right). */
export function PartnerHubsHeaderActions({ savedCount = 0 }: { savedCount?: number }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-white px-3.5 text-[13px] font-semibold text-[#1F1B4D] ring-1 ring-inset ring-[#1F1B4D]/12"
      >
        <Heart className="h-4 w-4 fill-[#E11D48] text-[#E11D48]" aria-hidden />
        Saved ({savedCount})
      </button>
    </div>
  );
}

/** Section tabs with icons — Music Hubs selected = solid green (mockup). */
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
      on: 'bg-[#1F1B4D] text-white shadow-[0_10px_24px_-14px_rgba(31,27,77,0.7)]',
      off: 'bg-[#E9E6FF] text-[#1F1B4D] hover:bg-[#D8D4F5]',
      chipOn: 'bg-white/20',
      chipOff: 'bg-[#4338E8]',
    },
    {
      id: 'organisations' as const,
      label: 'Arts organisations',
      hint: 'Free cultural resources',
      Icon: Landmark,
      on: 'bg-[#1F1B4D] text-white shadow-[0_10px_24px_-14px_rgba(31,27,77,0.7)]',
      off: 'bg-[#EDE9FE] text-[#1F1B4D] hover:bg-[#DDD6FE]',
      chipOn: 'bg-white/20',
      chipOff: 'bg-[#5B4BDB]',
    },
    {
      id: 'paid-resources' as const,
      label: 'Paid resources',
      hint: 'Schemes and courses',
      Icon: ShoppingBag,
      on: 'bg-[#1F1B4D] text-white shadow-[0_10px_24px_-14px_rgba(31,27,77,0.7)]',
      off: 'bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A]',
      chipOn: 'bg-white/20',
      chipOff: 'bg-[#B45309]',
    },
  ];

  return (
    <div role="tablist" aria-label="Partner Hubs sections" className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
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
            className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition sm:px-5 ${
              selected ? tab.on : tab.off
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                selected ? tab.chipOn : tab.chipOff
              }`}
              aria-hidden
            >
              <Icon className="h-5 w-5 text-white" strokeWidth={2.25} />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-extrabold tracking-tight">{tab.label}</span>
              <span className={`mt-0.5 block text-[12px] font-medium ${selected ? 'text-white/80' : 'opacity-80'}`}>
                {tab.hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Search + discipline pills + Filters (Music Hubs mockup). */
export function MusicHubToolbar({
  discipline,
  onDiscipline,
  searchSlot,
}: {
  discipline: Discipline | 'All';
  onDiscipline: (d: Discipline | 'All') => void;
  searchSlot?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
      <div className="min-w-0 flex-1">
        {searchSlot ?? (
          <label className="flex h-11 items-center gap-2.5 rounded-2xl border border-[#1F1B4D]/10 bg-white px-3.5">
            <Search className="h-4 w-4 text-[#1F1B4D]/40" aria-hidden />
            <input
              placeholder="Search hubs, places, organisations and resources…"
              className="h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#1F1B4D]/40"
            />
          </label>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Filter by discipline">
        {(['All', ...DISCIPLINES] as const).map((d) => (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={discipline === d}
            onClick={() => onDiscipline(d)}
            className={`min-h-[40px] rounded-full px-3.5 text-[13px] font-semibold transition ${
              discipline === d
                ? 'bg-[#1F1B4D] text-white'
                : 'bg-white text-[#1F1B4D] ring-1 ring-inset ring-[#1F1B4D]/12 hover:ring-[#1F1B4D]/25'
            }`}
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-[#1F1B4D] ring-1 ring-inset ring-[#1F1B4D]/12"
        >
          Filters
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      </div>
    </div>
  );
}

const HUB_CARD_LOGOS: Record<string, string> = {
  'greater-essex': '/music-hubs/logos/essex-music-service.svg',
  'essex-southend-on-sea-and-thurrock': '/music-hubs/logos/essex-music-service.svg',
  'cambridgeshire-and-peterborough': '/music-hubs/logos/essex-music-service.svg',
  'west-of-england': '/music-hubs/logos/west-of-england-music-hub.svg',
  'tri-borough': '/music-hubs/logos/tri-borough-music-hub.png',
  triborough: '/music-hubs/logos/tri-borough-music-hub.png',
};

export function MusicHubResultCard({
  id,
  name,
  region,
  location,
  detail,
  onOpen,
}: {
  id: string;
  name: string;
  region: string;
  location: string;
  detail: string;
  onOpen: () => void;
}) {
  const logo = HUB_CARD_LOGOS[id];
  const initial = name.replace(/^The /, '').charAt(0).toUpperCase();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-[#1F1B4D]/[0.08] bg-white text-left shadow-[0_1px_2px_rgba(31,27,77,0.04)] transition hover:border-[#4338E8]/35 hover:shadow-[0_14px_32px_-18px_rgba(67,56,232,0.35)]"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-[#E9E6FF]">
        <img
          src="/login/hero-arts-clean.jpg"
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          loading="lazy"
        />
        <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-[#1F1B4D] shadow-sm">
          {region}
        </span>
      </div>
      <div className="relative flex flex-1 flex-col px-3.5 pb-3.5 pt-0">
        <span className="-mt-6 mb-2 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#1F1B4D] text-[14px] font-bold text-white ring-4 ring-white">
          {logo ? <img src={logo} alt="" className="h-7 w-7 object-contain brightness-0 invert" /> : initial}
        </span>
        <h3 className={`text-[15px] font-bold leading-snug tracking-tight ${ink}`}>{name}</h3>
        <p className={`mt-0.5 flex items-center gap-1 text-[12px] ${muted}`}>
          <MapPin className="h-3 w-3 shrink-0" aria-hidden />
          <span className="truncate">{location}</span>
        </p>
        <p className={`mt-1.5 line-clamp-2 text-[12px] leading-snug ${muted}`}>{detail}</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-2.5">
          {['CPD', 'Resources', 'Ensembles', 'Projects'].map((t) => (
            <OrgTag key={t} label={t} />
          ))}
        </div>
      </div>
    </button>
  );
}

/** Right-hand selected area panel beside the map (mockup). */
export function SelectedAreaPanel({
  title,
  hubCount,
  blurb,
  localAreas,
  onViewHubs,
  photoSrc = '/login/hero-arts-clean.jpg',
}: {
  title: string;
  hubCount: number;
  blurb: string;
  localAreas: string[];
  onViewHubs: () => void;
  photoSrc?: string;
}) {
  return (
    <aside className="flex h-full min-h-[320px] flex-col rounded-2xl bg-white p-5 sm:p-6">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#4338E8]">Selected area</p>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[22px] font-bold leading-tight tracking-tight text-[#1F1B4D]">{title}</h3>
          <p className="mt-1 text-[14px] font-semibold text-[#1F1B4D]">
            {hubCount} Music Hub{hubCount === 1 ? '' : 's'}
            {title !== 'England' ? ` across ${title}` : ' across England'}
          </p>
        </div>
        <img src={photoSrc} alt="" className="h-16 w-24 shrink-0 rounded-xl object-cover sm:h-20 sm:w-28" />
      </div>
      <p className={`mt-3 text-[13px] leading-relaxed ${muted}`}>{blurb}</p>
      {localAreas.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#1F1B4D]/45">Local areas</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {localAreas.slice(0, 8).map((a) => (
              <span
                key={a}
                className="rounded-full bg-[#E9E6FF] px-2.5 py-1 text-[12px] font-semibold text-[#4338E8]"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onViewHubs}
        className="mt-auto inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#4338E8] px-4 text-[14px] font-bold text-white shadow-[0_10px_24px_-14px_rgba(67,56,232,0.65)] transition hover:bg-[#3529d1]"
      >
        View hubs in {title} <ArrowRight className="h-4 w-4" />
      </button>
    </aside>
  );
}
