import { useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
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

const HUB_TAG_SETS: string[][] = [
  ['CPD', 'Ensembles', 'Projects'],
  ['CPD', 'Resources', 'Youth'],
  ['CPD', 'Teacher support'],
  ['Resources', 'Ensembles', 'Projects'],
  ['CPD', 'Resources', 'Ensembles'],
];

function OrgTag({ label }: { label: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TAG_TONE[label] ?? 'bg-[#F4F3FA] text-[#1F1B4D]'}`}>
      {label}
    </span>
  );
}

/**
 * Wide wordmark strip — partner logos are landscape marks; keep full mark readable (never crop).
 */
function OrgLogoStrip({ hub }: { hub: PartnerHubConfig }) {
  const src = hub.logoSrcOnDark || hub.logoSrc;
  const onDark = Boolean(hub.logoSrcOnDark) || hub.logoInvert;
  const usePlate = !hub.logoSrcOnDark && hub.logoOnPlate;
  const bg = usePlate
    ? hub.logoPanelColor && hub.logoPanelColor !== 'transparent'
      ? hub.logoPanelColor
      : '#FFFFFF'
    : hub.logoPanelColor || hub.primaryColor || '#1F1B4D';
  const needsInvert = onDark && !hub.logoSrcOnDark && hub.logoInvert;
  return (
    <div
      className="flex h-[5.25rem] w-full items-center justify-center overflow-hidden rounded-xl px-4 py-2.5"
      style={{ backgroundColor: bg === 'transparent' ? '#FFFFFF' : bg }}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        className={`h-full max-h-[4.5rem] w-auto max-w-[92%] object-contain ${needsInvert ? 'brightness-0 invert' : ''}`}
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

function DirectoryTopBar({
  children,
  view,
  onView,
  accent = '#1A1A40',
}: {
  children: React.ReactNode;
  view: 'grid' | 'list';
  onView: (v: 'grid' | 'list') => void;
  accent?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {children}
      <button
        type="button"
        onClick={() => onView(view === 'grid' ? 'list' : 'grid')}
        className={`ml-auto inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition ${
          view === 'list'
            ? 'text-white'
            : 'bg-white text-[#1F1B4D] ring-1 ring-inset ring-[#1F1B4D]/12'
        }`}
        style={view === 'list' ? { backgroundColor: accent } : undefined}
      >
        {view === 'list' ? <List className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />}
        {view === 'list' ? 'List view' : 'List view'}
      </button>
    </div>
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

/** Arts organisations — left art-form/age facets + card grid (composite mockup). */
export function ArtsOrganisationsDirectoryView() {
  const [artForm, setArtForm] = useState<ArtFormFilter>('All');
  const [ages, setAges] = useState<Set<string>>(new Set());
  const [resourceType, setResourceType] = useState<ResourceTypeFilter>('All');
  const [q, setQ] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [saved, setSaved] = useState<Set<string>>(new Set());

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

  return (
    <div className="space-y-5">
      <DirectorySearch value={q} onChange={setQ} placeholder="Search organisations…" />

      <DirectoryTopBar view={view} onView={setView} accent="#5B4BDB">
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
      </DirectoryTopBar>

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

        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-[22px] font-bold tracking-tight text-[#1F1B4D]">
              {shown.length} arts organisation{shown.length === 1 ? '' : 's'}
            </h2>
            <button
              type="button"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-white px-3.5 text-[12px] font-semibold text-[#1F1B4D] ring-1 ring-inset ring-[#1F1B4D]/10"
            >
              Sort by: A–Z
              <ChevronDown className="h-3.5 w-3.5 opacity-50" aria-hidden />
            </button>
          </div>

          {view === 'grid' ? (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" role="list">
              {shown.map((o) => {
                const meta = orgListingMeta(o.hub.slug);
                const isSaved = saved.has(o.hub.slug);
                return (
                  <li key={o.hub.slug}>
                    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#1F1B4D]/[0.08] bg-white transition hover:border-[#5B4BDB]/35 hover:shadow-[0_14px_32px_-18px_rgba(91,75,219,0.4)]">
                      <div className="relative p-3 pb-0">
                        <OrgLogoStrip hub={o.hub} />
                        <button
                          type="button"
                          aria-label={isSaved ? 'Remove from saved' : 'Save organisation'}
                          aria-pressed={isSaved}
                          onClick={() => toggleSaved(o.hub.slug)}
                          className={`absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-[#1F1B4D]/10 transition ${
                            isSaved ? 'text-[#E11D48]' : 'text-[#1F1B4D]/40 hover:text-[#E11D48]'
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
                        <h3 className={`text-[15px] font-bold tracking-tight ${ink}`}>{o.hub.displayName}</h3>
                        <p className="mt-0.5 text-[12px] font-semibold text-[#5B4BDB]">{artFormSubtitle(o)}</p>
                        <p className={`mt-2 line-clamp-2 text-[12px] leading-snug ${muted}`}>
                          {o.hub.tagline || meta.location}
                        </p>
                        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                          <div className="flex flex-wrap gap-1.5">
                            {meta.tags.slice(0, 3).map((t) => (
                              <OrgTag key={t} label={t} />
                            ))}
                          </div>
                          <button
                            type="button"
                            aria-label={`Open ${o.hub.displayName}`}
                            onClick={() => openPartnerHub(o.hub.slug)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E9E6FF] text-[#5B4BDB] transition group-hover:bg-[#5B4BDB] group-hover:text-white"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="overflow-hidden rounded-2xl border border-[#1F1B4D]/[0.08] bg-white" role="list">
              {shown.map((o) => {
                const meta = orgListingMeta(o.hub.slug);
                return (
                  <li key={o.hub.slug} className="border-b border-[#1F1B4D]/[0.06] last:border-0">
                    <button
                      type="button"
                      onClick={() => openPartnerHub(o.hub.slug)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#F4F3FA]"
                    >
                      <OrgLogoMark hub={o.hub} />
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-[14px] font-bold ${ink}`}>{o.hub.displayName}</span>
                        <span className="block truncate text-[12px] font-semibold text-[#5B4BDB]">{artFormSubtitle(o)}</span>
                        <span className={`block truncate text-[12px] ${muted}`}>{meta.location}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-[#5B4BDB]" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
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

/** Paid resources — subject/age/type facets + priced product cards (composite mockup). */
export function PaidResourcesDirectoryView() {
  const listings = useMemo(() => buildPaidListings(), []);
  const [subject, setSubject] = useState<ArtFormFilter>('All');
  const [ages, setAges] = useState<Set<string>>(new Set());
  const [resourceType, setResourceType] = useState<PaidTypeFilter>('All');
  const [q, setQ] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [saved, setSaved] = useState<Set<string>>(new Set());

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
    if (l.hub) openPartnerHub(l.hub.slug);
  };

  return (
    <div className="space-y-5">
      <DirectorySearch value={q} onChange={setQ} placeholder="Search paid resources…" />

      <DirectoryTopBar view={view} onView={setView} accent="#B45309">
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
      </DirectoryTopBar>

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

        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-[22px] font-bold tracking-tight text-[#1F1B4D]">
              {shown.length} paid resource{shown.length === 1 ? '' : 's'}
            </h2>
            <button
              type="button"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-white px-3.5 text-[12px] font-semibold text-[#1F1B4D] ring-1 ring-inset ring-[#1F1B4D]/10"
            >
              Sort by: Popular
              <ChevronDown className="h-3.5 w-3.5 opacity-50" aria-hidden />
            </button>
          </div>

          <ul
            className={
              view === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-2'
            }
            role="list"
          >
            {shown.map((l) => {
              const isSaved = saved.has(l.id);
              return (
                <li key={l.id}>
                  <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#1F1B4D]/[0.08] bg-white transition hover:border-[#B45309]/40 hover:shadow-[0_14px_32px_-18px_rgba(180,83,9,0.35)]">
                    <div className="relative p-3 pb-0">
                      {l.hub ? (
                        <OrgLogoStrip hub={l.hub} />
                      ) : (
                        <div
                          className="flex h-[4.25rem] items-center justify-center rounded-xl px-4 text-[13px] font-bold text-white"
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
                        className={`absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-[#1F1B4D]/10 transition ${
                          isSaved ? 'text-[#E11D48]' : 'text-[#1F1B4D]/40 hover:text-[#E11D48]'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
                      <p className="text-[12px] font-semibold text-[#B45309]">{l.subject}</p>
                      <h3 className={`mt-0.5 text-[15px] font-bold leading-snug tracking-tight ${ink}`}>{l.title}</h3>
                      <p className={`mt-1.5 line-clamp-2 text-[12px] leading-snug ${muted}`}>{l.description}</p>
                      <span className={`mt-2 w-fit rounded-full px-2.5 py-0.5 text-[11px] font-bold ${PAID_TYPE_TONE[l.type]}`}>
                        {l.type}
                      </span>
                      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                        <p className="text-[14px] font-bold text-[#92400E]">{l.priceLabel}</p>
                        <button
                          type="button"
                          aria-label={`Open ${l.title}`}
                          onClick={() => openListing(l)}
                          disabled={!l.hub}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[#92400E] transition enabled:group-hover:bg-[#B45309] enabled:group-hover:text-white disabled:opacity-50"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
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
  view?: 'grid' | 'list';
  onView?: (v: 'grid' | 'list') => void;
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
          <button
            type="button"
            onClick={() => onView(view === 'list' ? 'grid' : 'list')}
            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition ${
              view === 'list'
                ? 'bg-[#0B6B5F] text-white'
                : 'bg-white text-[#1F1B4D] ring-1 ring-inset ring-[#1F1B4D]/12'
            }`}
          >
            <List className="h-3.5 w-3.5" aria-hidden />
            List view
          </button>
        )}
      </div>
    </div>
  );
}

/** Real hub logos for the card badge circle (official assets only — no text placeholders). */
const HUB_CARD_LOGOS: Record<string, string> = {
  'greater-essex': '/music-hubs/logos/greater-essex-music-hub.png',
  'essex-southend-on-sea-and-thurrock': '/music-hubs/logos/greater-essex-music-hub.png',
  'tri-borough': '/music-hubs/logos/tri-borough-icon.jpg',
  triborough: '/music-hubs/logos/tri-borough-icon.jpg',
};

/** Resolve a hub id to its dedicated cover asset (one file per hub). */
export function hubCoverSrc(id: string) {
  const coverId = HUB_COVER_ALIASES[id] ?? id;
  return `/music-hubs/covers/${coverId}.jpg`;
}

function hubTagsFor(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n + id.charCodeAt(i) * (i + 3)) % 991;
  return HUB_TAG_SETS[n % HUB_TAG_SETS.length];
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
  const tags = hubTagsFor(id);
  const [saved, setSaved] = useState(false);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#1F1B4D]/[0.08] bg-white text-left shadow-[0_1px_2px_rgba(31,27,77,0.04)] transition hover:border-[#0B6B5F]/35 hover:shadow-[0_12px_28px_-16px_rgba(11,107,95,0.35)]">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 flex-col text-left">
        <div className="relative aspect-[16/9] overflow-hidden bg-[#E4F4EF]">
          <img
            src={hubCoverSrc(id)}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-[#1F1B4D] shadow-sm">
            {region}
          </span>
        </div>
        <div className="relative flex flex-1 flex-col px-3 pb-3 pt-0">
          {logo ? (
            <span className="-mt-5 mb-1.5 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-[3px] ring-white">
              <img src={logo} alt="" className="h-[78%] w-[78%] object-contain" />
            </span>
          ) : (
            <span className="-mt-5 mb-1.5 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#0B6B5F] text-[13px] font-bold text-white ring-[3px] ring-white">
              {initial}
            </span>
          )}
          <h3 className={`text-[14px] font-bold leading-snug tracking-tight ${ink}`}>{name}</h3>
          <p className={`mt-0.5 text-[11px] font-medium ${muted}`}>{location}</p>
          <p className={`mt-1 line-clamp-2 text-[11px] leading-snug ${muted}`}>{detail}</p>
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => (
                <OrgTag key={t} label={t === 'Youth ensembles' ? 'Youth' : t} />
              ))}
            </div>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E4F4EF] text-[#0B6B5F] transition group-hover:bg-[#0B6B5F] group-hover:text-white">
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
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
        className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-[#1F1B4D]/10 ${
          saved ? 'text-[#E11D48]' : 'text-[#1F1B4D]/40 hover:text-[#E11D48]'
        }`}
      >
        <Heart className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />
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
  photoSrc = '/music-hubs/covers/greater-essex.jpg',
  statLabel,
}: {
  title: string;
  hubCount: number;
  blurb: string;
  localAreas: string[];
  onViewHubs: () => void;
  onSelectLocalArea?: (name: string) => void;
  photoSrc?: string;
  /** Override the default “N Music Hubs Across {title}” line. */
  statLabel?: string;
}) {
  const stat =
    statLabel ??
    `${hubCount} Music Hub${hubCount === 1 ? '' : 's'} Across ${title === 'England' ? 'England' : title}`;

  return (
    <aside className="flex h-full min-h-[260px] flex-col rounded-2xl border border-[#1F1B4D]/[0.08] bg-white p-5 shadow-[0_1px_2px_rgba(31,27,77,0.04)] sm:p-6">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#1F1B4D]/45">Selected area</p>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[22px] font-bold leading-tight tracking-tight text-[#1F1B4D] sm:text-[24px]">{title}</h3>
          <p className="mt-2 flex items-center gap-2 text-[14px] font-semibold text-[#1F1B4D]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E4F4EF] text-[#0B6B5F]" aria-hidden>
              <Users className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            <span>{stat}</span>
          </p>
        </div>
        <img
          src={photoSrc}
          alt=""
          className="h-[4.5rem] w-[6.5rem] shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-[#1F1B4D]/[0.06] sm:h-20 sm:w-28"
        />
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
