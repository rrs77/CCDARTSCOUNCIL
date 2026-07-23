/**
 * Local-only store of partner-hub packs the user has Add-to-CCDesigner’d.
 * Drives the “Select partner planning” accordion at the top of Activity Library,
 * Lesson Library, and Lesson Builder. Never synced to Supabase.
 */

export const PARTNER_PLANNING_KEY = 'ccd-partner-planning-v1';
export const CCD_PARTNER_PLANNING_UPDATED_EVENT = 'ccd-partner-planning-updated';

export type PartnerPlanningPack = {
  orgId: string;
  orgLabel: string;
  logoSrc: string;
  /** Optional dark strip behind white wordmark logos */
  logoBg?: string;
  /** Invert logo for dark backgrounds */
  logoInvert?: boolean;
  projectId: string;
  projectTitle: string;
  sheetId?: string;
  activityIds: string[];
  lessonKeys: string[];
  addedAt: string;
};

export type PartnerPlanningOrgGroup = {
  orgId: string;
  orgLabel: string;
  logoSrc: string;
  logoBg?: string;
  logoInvert?: boolean;
  projects: PartnerPlanningPack[];
};

function readRaw(): PartnerPlanningPack[] {
  try {
    const raw = localStorage.getItem(PARTNER_PLANNING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(packs: PartnerPlanningPack[]): void {
  try {
    localStorage.setItem(PARTNER_PLANNING_KEY, JSON.stringify(packs));
  } catch {
    /* quota / private mode */
  }
}

function dispatchUpdated(packs: PartnerPlanningPack[]): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(CCD_PARTNER_PLANNING_UPDATED_EVENT, {
      detail: { packs },
    }),
  );
}

export function readPartnerPlanningPacks(): PartnerPlanningPack[] {
  return readRaw();
}

export function clearPartnerPlanningPacks(): void {
  try {
    localStorage.removeItem(PARTNER_PLANNING_KEY);
  } catch {
    /* noop */
  }
  dispatchUpdated([]);
}

/**
 * Upsert a hub pack by orgId + projectId. Local only.
 */
export function registerPartnerPlanningPack(
  pack: Omit<PartnerPlanningPack, 'addedAt'> & { addedAt?: string },
): PartnerPlanningPack[] {
  const nextPack: PartnerPlanningPack = {
    ...pack,
    activityIds: [...new Set((pack.activityIds || []).map(String).filter(Boolean))],
    lessonKeys: [...new Set((pack.lessonKeys || []).map(String).filter(Boolean))],
    addedAt: pack.addedAt || new Date().toISOString(),
  };
  const existing = readRaw().filter(
    (p) => !(p.orgId === nextPack.orgId && p.projectId === nextPack.projectId),
  );
  const packs = [...existing, nextPack];
  writeRaw(packs);
  dispatchUpdated(packs);
  return packs;
}

/** Group packs by organisation for accordion rendering (stable org order by first-added). */
export function groupPartnerPlanningByOrg(
  packs: PartnerPlanningPack[] = readRaw(),
): PartnerPlanningOrgGroup[] {
  const order: string[] = [];
  const map = new Map<string, PartnerPlanningOrgGroup>();
  for (const p of packs) {
    if (!map.has(p.orgId)) {
      order.push(p.orgId);
      map.set(p.orgId, {
        orgId: p.orgId,
        orgLabel: p.orgLabel,
        logoSrc: p.logoSrc,
        logoBg: p.logoBg,
        logoInvert: p.logoInvert,
        projects: [],
      });
    }
    const g = map.get(p.orgId)!;
    g.projects.push(p);
  }
  return order.map((id) => map.get(id)!).filter(Boolean);
}

export function usePartnerPlanningPacks(): {
  packs: PartnerPlanningPack[];
  orgGroups: PartnerPlanningOrgGroup[];
} {
  // Lightweight hook-free reader for non-React callers; React components
  // should subscribe to CCD_PARTNER_PLANNING_UPDATED_EVENT themselves.
  const packs = readPartnerPlanningPacks();
  return { packs, orgGroups: groupPartnerPlanningByOrg(packs) };
}

/** Known hub org constants for seed registration. */
export const PARTNER_PLANNING_ORGS = {
  roh: {
    orgId: 'roh',
    orgLabel: 'Royal Ballet and Opera',
    logoSrc: '/partners/royal-opera-house.svg',
    logoBg: '#1a1033',
    logoInvert: true,
  },
  lso: {
    orgId: 'lso',
    orgLabel: 'London Symphony Orchestra',
    logoSrc: '/partners/lso.svg',
    logoBg: '#0b1f4a',
    logoInvert: false,
  },
  weteachdrama: {
    orgId: 'weteachdrama',
    orgLabel: 'We Teach Drama',
    logoSrc: '/partners/we-teach-drama.svg',
    logoBg: '#111827',
    logoInvert: false,
  },
  ems: {
    orgId: 'ems',
    orgLabel: 'Essex Music Service',
    logoSrc: '/partners/essex-music-service.svg',
    logoBg: '#330968',
    logoInvert: false,
  },
  icompose: {
    orgId: 'icompose',
    orgLabel: 'iCompose',
    logoSrc: '/partners/icompose.svg',
    logoBg: '#0a1628',
    logoInvert: false,
  },
  dramaresource: {
    orgId: 'dramaresource',
    orgLabel: 'Drama Resource',
    logoSrc: '/partners/drama-resource.svg',
    logoBg: '#0F3D2E',
    logoInvert: false,
  },
} as const;
