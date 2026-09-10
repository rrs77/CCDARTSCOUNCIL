/**
 * Local draft overrides for Partner Organisation Hub layouts.
 * Prefer this on main until a cloud hub-admin store is available.
 */

import type {
  PartnerOrgHubCard,
  PartnerOrgHubLayout,
  PartnerOrgHubSection,
} from '../types/partnerOrgHub';
import { resolvePartnerOrgPlannerAction } from '../types/partnerOrgHub';

const STORAGE_PREFIX = 'ccd-partner-org-hub-layout-v1:';

export function partnerOrgHubDraftKey(orgSlug: string): string {
  return `${STORAGE_PREFIX}${String(orgSlug || '').toLowerCase()}`;
}

function normalizeCard(card: PartnerOrgHubCard): PartnerOrgHubCard {
  const plannerAction = resolvePartnerOrgPlannerAction(card);
  const next: PartnerOrgHubCard = { ...card, plannerAction };
  delete next.seedable;
  return next;
}

function normalizeLayout(layout: PartnerOrgHubLayout): PartnerOrgHubLayout {
  return {
    ...layout,
    version: 1,
    sections: (layout.sections || []).map((section) => ({
      ...section,
      cards: section.cards?.map(normalizeCard),
    })),
  };
}

export function readPartnerOrgHubDraft(orgSlug: string): PartnerOrgHubLayout | null {
  try {
    const raw = localStorage.getItem(partnerOrgHubDraftKey(orgSlug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PartnerOrgHubLayout;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.sections)) return null;
    return normalizeLayout(parsed);
  } catch {
    return null;
  }
}

export function writePartnerOrgHubDraft(layout: PartnerOrgHubLayout): void {
  localStorage.setItem(partnerOrgHubDraftKey(layout.orgSlug), JSON.stringify(layout));
  try {
    window.dispatchEvent(
      new CustomEvent('ccd-partner-org-hub-layout-updated', {
        detail: { orgSlug: layout.orgSlug },
      }),
    );
  } catch {
    /* ignore */
  }
}

export function clearPartnerOrgHubDraft(orgSlug: string): void {
  localStorage.removeItem(partnerOrgHubDraftKey(orgSlug));
  try {
    window.dispatchEvent(
      new CustomEvent('ccd-partner-org-hub-layout-updated', {
        detail: { orgSlug },
      }),
    );
  } catch {
    /* ignore */
  }
}

/** Merge draft sections over defaults (draft wins when present). */
export function resolvePartnerOrgHubLayout(
  defaults: PartnerOrgHubLayout,
): PartnerOrgHubLayout {
  const draft = readPartnerOrgHubDraft(defaults.orgSlug);
  if (!draft) return normalizeLayout(defaults);
  return normalizeLayout({
    ...defaults,
    ...draft,
    orgSlug: defaults.orgSlug,
    orgDisplayName: draft.orgDisplayName || defaults.orgDisplayName,
    version: 1,
    sections: Array.isArray(draft.sections) ? draft.sections : defaults.sections,
  });
}

export function newSectionId(type: string): string {
  return `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createBlankSection(
  type: PartnerOrgHubSection['type'],
  title?: string,
): PartnerOrgHubSection {
  const labels: Record<PartnerOrgHubSection['type'], string> = {
    about: 'About',
    featured: 'Featured',
    resources: 'Resources',
    'info-accordion': 'Forums & information',
    courses: 'Courses',
    events: 'Events',
    cta: 'Get involved',
  };
  return {
    id: newSectionId(type),
    type,
    title: title || labels[type],
    subtitle: '',
    body: '',
    defaultOpen: type === 'info-accordion' ? false : true,
    cards: type === 'resources' || type === 'info-accordion' || type === 'courses' ? [] : undefined,
    links: [],
  };
}
