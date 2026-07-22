import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, ExternalLink, Handshake, X } from 'lucide-react';
import { PARTNER_LOGOS } from '../config/partnerLogos';
import { LSO_LOGO_SRC } from '../utils/lsoBranding';
import { openActivityResource } from '../utils/openActivityResource';
import { useSettings } from '../contexts/SettingsContextNew';
import { useAuth } from '../hooks/useAuth';

const LSO_SITE = 'https://www.lso.co.uk/';
const HTBAO_PAGE =
  'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/how-to-build-an-orchestra/';

/** Same dark green as login hero — partner SVGs are white wordmarks. */
const LOGO_STRIP_BG = '#002D24';

const HTBAO_ID = 'htbao';

/** Real LSO Learn & Discover project / resource names. Only HTBAO is interactive. */
const LSO_PROJECTS = [
  { id: HTBAO_ID, name: 'How to Build an Orchestra', interactive: true },
  { id: 'planets', name: 'The Planets', interactive: false },
  { id: 'alice', name: 'The Alice Sound', interactive: false },
  { id: 'space', name: 'Space', interactive: false },
  { id: 'leon', name: 'Leon and the Place Between', interactive: false },
  { id: 'lso-play', name: 'LSO Play', interactive: false },
  { id: 'rachel-leach', name: 'Rachel Leach listening activities', interactive: false },
] as const;

type LsoProjectId = (typeof LSO_PROJECTS)[number]['id'];

export type HtbaoYearGroupChoice = { id: string; name: string };

interface OurPartnersProps {
  /** Jump to in-app content for How to Build an Orchestra (e.g. Activity Library). */
  onOpenHtbaoInApp?: (yearGroup: HtbaoYearGroupChoice) => void;
}

export function OurPartners({ onOpenHtbaoInApp }: OurPartnersProps) {
  const [view, setView] = useState<'list' | 'lso'>('list');

  if (view === 'lso') {
    return (
      <LsoPartnerDetail
        onBack={() => setView('list')}
        onOpenHtbaoInApp={onOpenHtbaoInApp}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-teal-600/10 p-2 text-teal-700">
            <Handshake className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">Our Partners</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-600 sm:text-base">
              Cultural organisations whose resources can enrich classroom music and the arts.
              Select a partner to explore projects available in CCDesigner.
            </p>
          </div>
        </div>
      </div>

      <ul
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Partner organisations"
      >
        {PARTNER_LOGOS.map((partner) => {
          const isLso = partner.id === 'lso';
          const invertClass = partner.invert ? 'brightness-0 invert' : '';

          const cardInner = (
            <>
              <div
                className="flex h-20 w-full shrink-0 items-center justify-center px-4"
                style={{ backgroundColor: LOGO_STRIP_BG }}
              >
                <img
                  src={partner.src}
                  alt=""
                  className={`h-10 w-auto max-w-[11rem] object-contain sm:h-11 ${invertClass}`}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-1 px-4 py-4 text-center">
                <span className="text-sm font-medium leading-snug text-gray-800">{partner.name}</span>
                {isLso ? (
                  <span className="text-xs font-medium text-teal-700">View projects →</span>
                ) : (
                  <span className="text-xs text-gray-400">Coming soon</span>
                )}
              </div>
            </>
          );

          const baseCard =
            'flex h-full min-h-[11.5rem] w-full flex-col overflow-hidden rounded-xl border bg-white text-center shadow-sm transition-all duration-150 ease-out hover:shadow-md hover:scale-[1.02] active:scale-105';

          if (isLso) {
            return (
              <li key={partner.id} className="h-full">
                <button
                  type="button"
                  onClick={() => setView('lso')}
                  className={`${baseCard} border-teal-200 hover:border-teal-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500`}
                  aria-label={`Open ${partner.name} partner details`}
                >
                  {cardInner}
                </button>
              </li>
            );
          }

          return (
            <li key={partner.id} className="h-full">
              <button
                type="button"
                className={`${baseCard} cursor-default border-gray-200 opacity-95`}
                aria-label={`${partner.name} — coming soon`}
                aria-disabled="true"
              >
                {cardInner}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface LsoPartnerDetailProps {
  onBack: () => void;
  onOpenHtbaoInApp?: (yearGroup: HtbaoYearGroupChoice) => void;
}

function LsoPartnerDetail({ onBack, onOpenHtbaoInApp }: LsoPartnerDetailProps) {
  /** Accordion: one open at a time. All projects start collapsed. */
  const [openProjectId, setOpenProjectId] = useState<LsoProjectId | null>(null);

  const toggleProject = (id: LsoProjectId) => {
    setOpenProjectId((current) => (current === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to Our Partners
      </button>

      <div className="rounded-xl border border-gray-200 bg-white px-5 py-6 sm:px-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex h-16 w-40 items-center justify-center rounded-lg bg-[#0a1628] px-4">
            <img
              src={LSO_LOGO_SRC}
              alt="London Symphony Orchestra"
              className="h-10 w-auto max-w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
              London Symphony Orchestra
            </h2>
            <a
              href={LSO_SITE}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm text-teal-700 hover:text-teal-800"
            >
              lso.co.uk
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </div>

        <div className="mt-5 space-y-3 text-sm leading-relaxed text-gray-700 sm:text-base">
          <p>
            The London Symphony Orchestra is one of the world’s great orchestras, based at the
            Barbican in London. Through <strong>LSO Discovery</strong>, its education and community
            programme, the LSO creates projects, films, and classroom resources that help children
            meet the orchestra, its instruments, and its music.
          </p>
          <p>
            CCDesigner includes LSO Discovery content so teachers can plan listening, practical, and
            composition work alongside the orchestra’s digital activities.
          </p>
        </div>
      </div>

      <section>
        <h3 className="text-lg font-semibold text-gray-900">LSO projects &amp; resources</h3>
        <p className="mt-1 text-sm text-gray-600">
          Expand a project to see details. Only How to Build an Orchestra is linked in the app for
          now.
        </p>
        <ul className="mt-3 divide-y divide-teal-100 overflow-hidden rounded-xl border border-teal-200 bg-white">
          {LSO_PROJECTS.map((project) => {
            const isOpen = openProjectId === project.id;
            const panelId = `lso-project-${project.id}`;
            const headingId = `${panelId}-heading`;

            return (
              <li key={project.id} className={isOpen ? 'bg-gradient-to-r from-teal-50 to-cyan-50' : ''}>
                <button
                  type="button"
                  id={headingId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleProject(project.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500"
                >
                  <span
                    className={`text-sm font-semibold sm:text-base ${
                      project.interactive ? 'text-teal-900' : 'text-gray-800'
                    }`}
                  >
                    {project.name}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-teal-700">
                    {isOpen ? 'Hide details' : 'Show details'}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                      aria-hidden
                    />
                  </span>
                </button>

                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={headingId}
                    className="border-t border-teal-100 px-4 pb-4 pt-3"
                  >
                    {project.interactive ? (
                      <HtbaoProjectPanel onOpenHtbaoInApp={onOpenHtbaoInApp} />
                    ) : (
                      <ComingSoonProjectPanel projectName={project.name} />
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function HtbaoProjectPanel({
  onOpenHtbaoInApp,
}: {
  onOpenHtbaoInApp?: (yearGroup: HtbaoYearGroupChoice) => void;
}) {
  const { user } = useAuth();
  const { customYearGroups, getOrderedYearGroups } = useSettings();
  const [pickerOpen, setPickerOpen] = useState(false);

  const yearGroupsForPicker = useMemo(() => {
    const ordered =
      typeof getOrderedYearGroups === 'function' ? getOrderedYearGroups() : customYearGroups;
    const base = Array.isArray(ordered) && ordered.length > 0 ? ordered : customYearGroups || [];
    const allowedIds = user?.profile?.allowed_year_groups ?? null;
    if (allowedIds != null && allowedIds.length > 0) {
      return base.filter((g) => allowedIds.includes(g.id) || allowedIds.includes(g.name ?? ''));
    }
    return base;
  }, [customYearGroups, getOrderedYearGroups, user?.profile?.allowed_year_groups]);

  const handlePick = (group: HtbaoYearGroupChoice) => {
    setPickerOpen(false);
    onOpenHtbaoInApp?.(group);
  };

  useEffect(() => {
    if (!pickerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPickerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pickerOpen]);

  return (
    <div className="space-y-3 text-sm text-gray-700 sm:text-base">
      <p className="leading-relaxed">
        A Year 6 classroom unit based on the Hachette / LSO KS2 project packs and Mary Auld’s book
        with the LSO. Pupils explore the orchestra with conductor Simon, meet the instrument
        families, watch the classroom film with Sir Simon Rattle and Rachel Leach, then compose a
        Beethoven storm and a class Boléro inspired by Ravel.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
        <li>Classroom film and family videos from the LSO How to Build an Orchestra page</li>
        <li>Instrument families and Orchestra sing-along</li>
        <li>Beethoven storm composition</li>
        <li>Ravel’s Boléro — colour score and class performance (with LSO Play)</li>
      </ul>
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => openActivityResource(HTBAO_PAGE)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-300 bg-white px-3.5 py-2 text-sm font-medium text-teal-800 hover:bg-teal-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          LSO resource page
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      <div className="rounded-lg border border-teal-200 bg-white px-4 py-4 text-sm text-gray-700">
        <p className="font-medium text-gray-900">In this app</p>
        <p className="mt-1.5 leading-relaxed">
          Activities live under the <strong>LSO</strong> folder in Activity Library (Listening,
          Practical, Composition, Warm-up) and as a lesson stack named{' '}
          <strong>How to Build an Orchestra</strong> in Lesson Library / Unit Viewer. Choose which
          class/year group to open — that class will be selected and the LSO categories assigned to
          it in Settings.
        </p>
        {onOpenHtbaoInApp && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="mt-3 rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            Go to Activity Library
          </button>
        )}
      </div>

      {pickerOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-teal-900/10 p-4"
          role="presentation"
          onClick={() => setPickerOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="htbao-year-group-title"
            aria-describedby="htbao-year-group-desc"
            className="flex w-full max-w-md max-h-[80vh] flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-5 py-4">
              <div className="min-w-0">
                <h2 id="htbao-year-group-title" className="text-lg font-semibold text-gray-900">
                  Open LSO activities
                </h2>
                <p id="htbao-year-group-desc" className="mt-1 text-sm text-gray-600">
                  Choose which class/year group to open in Activity Library.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {yearGroupsForPicker.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No year groups are set up yet. Add classes in Settings, then try again.
                </p>
              ) : (
                <ul className="max-h-64 space-y-2 overflow-y-auto" role="listbox" aria-label="Year groups">
                  {yearGroupsForPicker.map((group) => (
                    <li key={group.id}>
                      <button
                        type="button"
                        role="option"
                        onClick={() => handlePick({ id: group.id, name: group.name })}
                        className="w-full rounded-lg border border-teal-300 bg-white px-3.5 py-2.5 text-left text-sm font-medium text-gray-800 hover:bg-teal-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                      >
                        {group.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-shrink-0 justify-end border-t border-gray-200 px-5 py-3">
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ComingSoonProjectPanel({ projectName }: { projectName: string }) {
  return (
    <div className="space-y-2 text-sm text-gray-600">
      <p className="leading-relaxed">
        Placeholder for the LSO Learn &amp; Discover project <strong>{projectName}</strong>. Full
        classroom resources and in-app links will appear here when this unit is added to CCDesigner.
      </p>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Coming soon</p>
    </div>
  );
}
