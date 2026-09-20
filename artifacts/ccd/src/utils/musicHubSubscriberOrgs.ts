/**
 * Subscriber-password organisation keys for Music Hubs admin.
 * Seed/directory orgs plus super-admin–added custom keys (localStorage until DB).
 */

import {
  getMusicHubsDirectory,
  walkMusicHubNodes,
} from '../config/musicHubsDirectory';

export const MUSIC_HUB_SUBSCRIBER_ORGS_KEY = 'ccd-music-hub-subscriber-orgs-v1';

/** Known defaults when seed has no organisationId yet. */
export const DEFAULT_SUBSCRIBER_ORG_IDS = ['ems', 'triborough'] as const;

const ORG_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;

export function normaliseSubscriberOrgId(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidSubscriberOrgId(raw: string): boolean {
  const id = normaliseSubscriberOrgId(raw);
  return ORG_ID_PATTERN.test(id);
}

function readCustomOrgIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MUSIC_HUB_SUBSCRIBER_ORGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return [
      ...new Set(
        parsed
          .filter((v): v is string => typeof v === 'string')
          .map(normaliseSubscriberOrgId)
          .filter(isValidSubscriberOrgId),
      ),
    ].sort();
  } catch {
    return [];
  }
}

function writeCustomOrgIds(ids: string[]): void {
  if (typeof window === 'undefined') return;
  const cleaned = [
    ...new Set(ids.map(normaliseSubscriberOrgId).filter(isValidSubscriberOrgId)),
  ].sort();
  localStorage.setItem(MUSIC_HUB_SUBSCRIBER_ORGS_KEY, JSON.stringify(cleaned));
  try {
    window.dispatchEvent(new CustomEvent('ccd:music-hub-subscriber-orgs-changed'));
  } catch {
    /* ignore */
  }
}

/** Custom org keys added by super admin (excludes seed defaults). */
export function getCustomSubscriberOrgIds(): string[] {
  return readCustomOrgIds();
}

/** Unique organisationIds from the Music Hubs directory tree. */
export function getDirectorySubscriberOrgIds(): string[] {
  const ids = new Set<string>();
  walkMusicHubNodes(getMusicHubsDirectory().countries, (node) => {
    if (node.organisationId && isValidSubscriberOrgId(node.organisationId)) {
      ids.add(normaliseSubscriberOrgId(node.organisationId));
    }
  });
  return [...ids].sort();
}

/**
 * Full dropdown list: defaults ∪ directory ∪ custom.
 * When organisationFilter is set, only that org is returned (org admins).
 */
export function listSubscriberOrgIds(organisationFilter?: string | null): string[] {
  if (organisationFilter && isValidSubscriberOrgId(organisationFilter)) {
    return [normaliseSubscriberOrgId(organisationFilter)];
  }
  const ids = new Set<string>([
    ...DEFAULT_SUBSCRIBER_ORG_IDS,
    ...getDirectorySubscriberOrgIds(),
    ...getCustomSubscriberOrgIds(),
  ]);
  return [...ids].sort();
}

/** Add a custom subscriber org key. */
export function addCustomSubscriberOrgId(
  raw: string,
): { ok: true; id: string } | { ok: false; error: string } {
  const id = normaliseSubscriberOrgId(raw);
  if (!id) return { ok: false, error: 'Organisation id is required.' };
  if (!isValidSubscriberOrgId(id)) {
    return {
      ok: false,
      error: 'Use lowercase letters, numbers, hyphens or underscores (max 64).',
    };
  }
  const existing = new Set(listSubscriberOrgIds());
  if (existing.has(id)) {
    return { ok: false, error: 'That organisation is already in the list.' };
  }
  writeCustomOrgIds([...getCustomSubscriberOrgIds(), id]);
  return { ok: true, id };
}

/** Remove a custom org key (cannot remove seed/directory defaults). */
export function removeCustomSubscriberOrgId(raw: string): boolean {
  const id = normaliseSubscriberOrgId(raw);
  const custom = getCustomSubscriberOrgIds();
  if (!custom.includes(id)) return false;
  writeCustomOrgIds(custom.filter((x) => x !== id));
  return true;
}

export function isCustomSubscriberOrgId(raw: string): boolean {
  return getCustomSubscriberOrgIds().includes(normaliseSubscriberOrgId(raw));
}
