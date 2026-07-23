/**
 * Local-only store of partner-hub packs the user has Add-to-CCDesigner’d.
 * Drives the “Select partner planning” accordion at the top of Activity Library,
 * Lesson Library, and Lesson Builder. Never synced to Supabase.
 */

import type { Activity } from '../contexts/DataContext';
import { getActivityStarKey } from './activityStars';
import { readLocalLibraryActivities } from './hubSeedLocal';

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
  /** Optional lesson/project thumbnail (e.g. WTD / iCompose cover art) */
  thumbSrc?: string;
};

export type PartnerPlanningActivityRef = Pick<
  Activity,
  '_id' | 'id' | 'activity' | 'category' | 'unitName' | 'teachingUnit' | 'notes' | 'yearGroups'
>;

function nameCatKey(activity: PartnerPlanningActivityRef): string {
  return `${String(activity.activity || '')
    .trim()
    .toLowerCase()}::${String(activity.category || '')
    .trim()
    .toLowerCase()}`;
}

function parseHashActivityId(id: string): { name: string; category: string } | null {
  if (!id.startsWith('h:')) return null;
  const rest = id.slice(2);
  const sep = rest.indexOf('::');
  if (sep < 0) return null;
  return {
    name: rest.slice(0, sep).trim().toLowerCase(),
    category: rest.slice(sep + 2).trim().toLowerCase(),
  };
}

function indexActivities(pool: PartnerPlanningActivityRef[]): Map<string, PartnerPlanningActivityRef> {
  const byKey = new Map<string, PartnerPlanningActivityRef>();
  for (const a of pool) {
    if (!a) continue;
    byKey.set(getActivityStarKey(a), a);
    if (a._id) byKey.set(String(a._id), a);
    if (a.id) byKey.set(String(a.id), a);
    byKey.set(nameCatKey(a), a);
  }
  return byKey;
}

function dedupeActivities<T extends PartnerPlanningActivityRef>(list: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const a of list) {
    const k = getActivityStarKey(a);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(a);
  }
  return out;
}

/** Merge live React activities with the local library store (hub seeds live here). */
export function partnerPlanningActivityPool(
  activities: PartnerPlanningActivityRef[] = [],
): PartnerPlanningActivityRef[] {
  const local = readLocalLibraryActivities<PartnerPlanningActivityRef>();
  return dedupeActivities([...(activities || []), ...(local || [])]);
}

/**
 * Resolve pack.activityIds against the given pool / local library.
 * Falls back to unitName / project title matches when stored IDs are stale
 * after a re-seed.
 */
export function resolvePartnerPlanningActivities<T extends PartnerPlanningActivityRef>(
  pack: PartnerPlanningPack,
  activities: T[] = [],
  activityFilter?: (activity: T) => boolean,
): T[] {
  const pool = partnerPlanningActivityPool(activities) as T[];
  const byKey = indexActivities(pool);
  const resolved: T[] = [];
  const seen = new Set<string>();

  const push = (a: T | undefined | null) => {
    if (!a) return;
    if (activityFilter && !activityFilter(a)) return;
    const k = getActivityStarKey(a);
    if (seen.has(k)) return;
    seen.add(k);
    resolved.push(a);
  };

  for (const rawId of pack.activityIds || []) {
    const id = String(rawId || '');
    if (!id) continue;
    const direct = byKey.get(id) as T | undefined;
    if (direct) {
      push(direct);
      continue;
    }
    const hashed = parseHashActivityId(id);
    if (hashed) {
      const viaName = byKey.get(`${hashed.name}::${hashed.category}`) as T | undefined;
      push(viaName);
    }
  }

  // Stale IDs after re-seed: recover by project / unit title within the pool.
  if (resolved.length === 0 && (pack.activityIds || []).length > 0) {
    const title = String(pack.projectTitle || '')
      .trim()
      .toLowerCase();
    if (title) {
      for (const a of pool) {
        const unit = String(a.unitName || a.teachingUnit || '')
          .trim()
          .toLowerCase();
        if (unit === title || (unit && unit.includes(title)) || (title && title.includes(unit) && unit.length > 3)) {
          push(a as T);
        }
      }
    }
  }

  return resolved;
}

/** Stable key for a partner planning project row. */
export function partnerPlanningProjectKey(orgId: string, projectId: string): string {
  return `${orgId}::${projectId}`;
}

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
    logoSrc: '/partners/we-teach-drama.png',
    logoBg: '#FFFFFF',
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
    logoSrc: '/partners/icompose-logo.svg',
    logoBg: '#FFFFFF',
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
