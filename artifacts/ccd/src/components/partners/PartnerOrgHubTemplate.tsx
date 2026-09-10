/**
 * Shared Partner Organisation Hub template (Jazz North + LSO first).
 *
 * Sections use a fixed palette (About, Featured, Resources, Forums & information,
 * Courses, Events, CTA). Admins can add sections and persist a localStorage draft.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Pencil,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import type {
  PartnerOrgHubCard,
  PartnerOrgHubLayout,
  PartnerOrgHubSection,
  PartnerOrgPlannerAction,
  PartnerOrgSectionType,
} from '../../types/partnerOrgHub';
import {
  PARTNER_ORG_PLANNER_ACTION_OPTIONS,
  PARTNER_ORG_SECTION_PALETTE,
  resolvePartnerOrgPlannerAction,
} from '../../types/partnerOrgHub';
import {
  clearPartnerOrgHubDraft,
  createBlankSection,
  resolvePartnerOrgHubLayout,
  writePartnerOrgHubDraft,
} from '../../utils/partnerOrgHubDraft';
import {
  getKeyDateSuggestionsForOrg,
  getPartnerDisplayName,
  upsertImportantDatesFromSuggestions,
} from '../../utils/partnerKeyDates';
import {
  ImportantDatesConfirmPopup,
  PartnerKeyDatesModal,
} from './PartnerKeyDatesModal';
import { PartnerHubResourceCard } from './PartnerHubResourceCard';
import type { PartnerKeyDateSuggestion } from '../../utils/partnerKeyDates';

export type PartnerOrgSeedMode = 'activities' | 'lesson' | 'all';

export type PartnerOrgSeedHandler = (
  seedKey: string,
  mode: PartnerOrgSeedMode,
) => Promise<void>;

interface PartnerOrgHubTemplateProps {
  defaults: PartnerOrgHubLayout;
  /** Brand accent for borders / links */
  accentBorderClassName?: string;
  linkClassName?: string;
  featuredAccentClassName?: string;
  featuredEyebrowClassName?: string;
  onSeed?: PartnerOrgSeedHandler;
  /** Extra block under subscribe (e.g. programme gallery) */
  footerSlot?: ReactNode;
}

function canEditPartnerOrgHub(role: string | undefined): boolean {
  const r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'superuser' || r === 'administrator' || r === 'creator';
}

export function PartnerOrgHubTemplate({
  defaults,
  accentBorderClassName = 'border-teal-200',
  linkClassName = 'text-teal-800',
  featuredAccentClassName = 'border-teal-200 bg-teal-50/60',
  featuredEyebrowClassName = 'text-teal-800',
  onSeed,
  footerSlot,
}: PartnerOrgHubTemplateProps) {
  const { user, profile } = useAuth();
  const role = profile?.role || user?.role;
  const editable = canEditPartnerOrgHub(role);

  const [layout, setLayout] = useState<PartnerOrgHubLayout>(() =>
    resolvePartnerOrgHubLayout(defaults),
  );
  const [editMode, setEditMode] = useState(false);
  const [addingSeed, setAddingSeed] = useState<string | null>(null);
  const [addedSeed, setAddedSeed] = useState<Record<string, boolean>>({});
  const [infoOpen, setInfoOpen] = useState<Record<string, boolean>>({});
  const [showAddPalette, setShowAddPalette] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [confirmDates, setConfirmDates] = useState<{
    orgId: string;
    dates: PartnerKeyDateSuggestion[];
  } | null>(null);

  useEffect(() => {
    const sync = () => setLayout(resolvePartnerOrgHubLayout(defaults));
    window.addEventListener('ccd-partner-org-hub-layout-updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('ccd-partner-org-hub-layout-updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, [defaults]);

  const orgName = layout.orgDisplayName || getPartnerDisplayName(layout.orgSlug);
  const suggestionCount = useMemo(
    () => getKeyDateSuggestionsForOrg(layout.orgSlug).length,
    [layout.orgSlug],
  );

  const persist = (next: PartnerOrgHubLayout) => {
    setLayout(next);
    writePartnerOrgHubDraft(next);
  };

  const runSeed = async (seedKey: string, mode: PartnerOrgSeedMode) => {
    if (!onSeed) return;
    const busyId = `${seedKey}:${mode}`;
    setAddingSeed(busyId);
    try {
      await onSeed(seedKey, mode);
      setAddedSeed((prev) => ({ ...prev, [busyId]: true }));
    } finally {
      setAddingSeed(null);
    }
  };

  const handleSubscribeConfirm = (selected: PartnerKeyDateSuggestion[]) => {
    if (selected.length === 0) return;
    const touched = upsertImportantDatesFromSuggestions(selected, { attendReminder: true });
    setSubscribeOpen(false);
    setConfirmDates({ orgId: layout.orgSlug, dates: selected });
    toast.success(
      `${touched.length} important date${touched.length === 1 ? '' : 's'} added · reminder set`,
    );
  };

  const addSection = (type: PartnerOrgSectionType) => {
    const section = createBlankSection(type);
    persist({ ...layout, sections: [...layout.sections, section] });
    setShowAddPalette(false);
    toast.success(`Added “${section.title}” section`);
  };

  const removeSection = (id: string) => {
    persist({ ...layout, sections: layout.sections.filter((s) => s.id !== id) });
  };

  const updateSectionTitle = (id: string, title: string) => {
    persist({
      ...layout,
      sections: layout.sections.map((s) => (s.id === id ? { ...s, title } : s)),
    });
  };

  const updateCardPlannerAction = (
    sectionId: string,
    cardId: string,
    plannerAction: PartnerOrgPlannerAction,
  ) => {
    persist({
      ...layout,
      sections: layout.sections.map((s) => {
        if (s.id !== sectionId || !s.cards) return s;
        return {
          ...s,
          cards: s.cards.map((c) => {
            if (c.id !== cardId) return c;
            const next: PartnerOrgHubCard = { ...c, plannerAction };
            delete next.seedable;
            return next;
          }),
        };
      }),
    });
  };

  const resetDraft = () => {
    clearPartnerOrgHubDraft(defaults.orgSlug);
    setLayout(resolvePartnerOrgHubLayout(defaults));
    toast.success('Reset to default layout');
  };

  const renderCard = (card: PartnerOrgHubCard, sectionId: string) => {
    const plannerAction = resolvePartnerOrgPlannerAction(card);
    const canSeed = Boolean(card.seedKey && onSeed && plannerAction !== 'none');
    const showActivities = canSeed && plannerAction === 'activities';
    const showLesson = canSeed && plannerAction === 'lesson';

    return (
      <li key={card.id} className="flex h-full flex-col gap-2">
        <PartnerHubResourceCard
          title={card.title}
          meta={card.meta}
          description={card.description}
          accentBorderClassName={accentBorderClassName}
          linkClassName={linkClassName}
          siteUrl={card.siteUrl}
          openUrl={card.openUrl}
          openLabel={card.openLabel || 'Open'}
          downloadUrl={card.downloadUrl}
          downloadFilename={card.downloadFilename}
          downloadLabel={card.downloadLabel || 'Download'}
          onAddActivities={
            showActivities ? () => void runSeed(card.seedKey!, 'activities') : undefined
          }
          onAddLessonPlan={
            showLesson ? () => void runSeed(card.seedKey!, 'lesson') : undefined
          }
          addingActivities={addingSeed === `${card.seedKey}:activities`}
          addingLesson={addingSeed === `${card.seedKey}:lesson`}
          addedActivities={!!addedSeed[`${card.seedKey}:activities`]}
          addedLesson={!!addedSeed[`${card.seedKey}:lesson`]}
          disabled={addingSeed !== null}
        />
        {editMode && (
          <label className="flex flex-col gap-1 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <span className="font-semibold uppercase tracking-wide text-gray-500">
              Planner action
            </span>
            <select
              value={plannerAction}
              onChange={(e) =>
                updateCardPlannerAction(
                  sectionId,
                  card.id,
                  e.target.value as PartnerOrgPlannerAction,
                )
              }
              className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900"
              aria-label={`Planner action for ${card.title}`}
            >
              {PARTNER_ORG_PLANNER_ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {plannerAction !== 'none' && !card.seedKey && (
              <span className="text-amber-700">
                Needs a seed key in defaults before the button can run.
              </span>
            )}
          </label>
        )}
      </li>
    );
  };

  const renderSection = (section: PartnerOrgHubSection) => {
    const isInfo = section.type === 'info-accordion';
    const open = infoOpen[section.id] ?? Boolean(section.defaultOpen);
    const cards = section.cards || [];

    const headingRow = (
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {editMode ? (
            <input
              value={section.title}
              onChange={(e) => updateSectionTitle(section.id, e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-900"
              aria-label="Section title"
            />
          ) : isInfo ? (
            <button
              type="button"
              onClick={() => setInfoOpen((prev) => ({ ...prev, [section.id]: !open }))}
              className="flex w-full items-center gap-2 text-left"
              aria-expanded={open}
            >
              {open ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
              )}
              <span>
                <span className="block text-sm font-semibold uppercase tracking-wide text-gray-500">
                  {section.title}
                </span>
                {section.subtitle && (
                  <span className="mt-1 block text-sm font-normal normal-case tracking-normal text-gray-600">
                    {section.subtitle}
                  </span>
                )}
              </span>
            </button>
          ) : (
            <>
              {section.eyebrow && (
                <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${featuredEyebrowClassName}`}>
                  {section.eyebrow}
                </p>
              )}
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                {section.title}
              </h3>
              {section.subtitle && (
                <p className="mt-1 text-sm text-gray-600">{section.subtitle}</p>
              )}
            </>
          )}
        </div>
        {editMode && (
          <button
            type="button"
            onClick={() => removeSection(section.id)}
            className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            <X className="h-3.5 w-3.5" />
            Remove
          </button>
        )}
      </div>
    );

    if (section.type === 'featured') {
      return (
        <section
          key={section.id}
          className={`rounded-2xl border px-5 py-6 shadow-sm sm:px-7 sm:py-7 ${featuredAccentClassName}`}
        >
          {headingRow}
          {section.body && (
            <p className="max-w-3xl text-sm leading-relaxed text-gray-600">{section.body}</p>
          )}
          {section.links && section.links.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {section.links.map((link) => (
                <a
                  key={link.href + link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 font-medium hover:underline ${featuredEyebrowClassName}`}
                >
                  {link.icon === 'file' && <FileText className="h-3.5 w-3.5" aria-hidden />}
                  {link.label}
                  {link.icon !== 'file' && <ExternalLink className="h-3.5 w-3.5" aria-hidden />}
                </a>
              ))}
            </div>
          )}
          {cards.length > 0 && (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {cards.map((c) => renderCard(c, section.id))}
            </ul>
          )}
        </section>
      );
    }

    if (section.type === 'about' || section.type === 'cta' || section.type === 'events') {
      return (
        <section
          key={section.id}
          className={`rounded-xl border bg-white p-4 shadow-sm ${accentBorderClassName}`}
        >
          {headingRow}
          {section.body && <p className="text-sm leading-relaxed text-gray-600">{section.body}</p>}
          {section.links && section.links.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              {section.links.map((link) => (
                <a
                  key={link.href + link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 font-medium hover:underline ${linkClassName}`}
                >
                  {link.label}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              ))}
            </div>
          )}
          {section.ctaHref && section.ctaLabel && (
            <a
              href={section.ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-4 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50 ${linkClassName} ${accentBorderClassName}`}
            >
              {section.ctaLabel}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
        </section>
      );
    }

    if (isInfo) {
      return (
        <section key={section.id} className="space-y-3">
          {headingRow}
          {open && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {cards.map((c) => renderCard(c, section.id))}
            </ul>
          )}
        </section>
      );
    }

    // resources | courses
    return (
      <section key={section.id} className="space-y-3">
        {headingRow}
        <ul className="grid gap-3 sm:grid-cols-2">
          {cards.map((c) => renderCard(c, section.id))}
        </ul>
      </section>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Organisation hub
          </p>
          <p className="truncate text-sm text-gray-700">
            Resources, forums &amp; key dates for {orgName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubscribeOpen(true)}
            disabled={suggestionCount === 0}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#002D24] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: '#B6FF7E' }}
            title={
              suggestionCount === 0
                ? 'No key dates catalogued for this organisation yet'
                : 'Add organisation key dates to Important dates / calendar'
            }
          >
            <Bell className="h-4 w-4" aria-hidden />
            Subscribe to {orgName}
          </button>
          {editable && (
            <>
              <button
                type="button"
                onClick={() => setEditMode((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium ${
                  editMode
                    ? 'border-[#002D24] bg-[#002D24] text-white'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {editMode ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                {editMode ? 'Done' : 'Edit layout'}
              </button>
              {editMode && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowAddPalette((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add section
                  </button>
                  <button
                    type="button"
                    onClick={resetDraft}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {editMode && showAddPalette && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Predefined section types
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PARTNER_ORG_SECTION_PALETTE.map((item) => (
              <li key={item.type}>
                <button
                  type="button"
                  onClick={() => addSection(item.type)}
                  className="flex w-full flex-col rounded-lg border border-gray-200 bg-white px-3 py-2 text-left hover:border-teal-300 hover:bg-teal-50/40"
                >
                  <span className="text-sm font-semibold text-gray-900">{item.label}</span>
                  <span className="text-xs text-gray-500">{item.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {layout.sections.map(renderSection)}

      {footerSlot}

      <PartnerKeyDatesModal
        isOpen={subscribeOpen}
        orgId={layout.orgSlug}
        onClose={() => setSubscribeOpen(false)}
        onConfirm={handleSubscribeConfirm}
      />
      <ImportantDatesConfirmPopup
        isOpen={!!confirmDates}
        orgId={confirmDates?.orgId || null}
        dates={confirmDates?.dates || []}
        onClose={() => setConfirmDates(null)}
      />
    </div>
  );
}
