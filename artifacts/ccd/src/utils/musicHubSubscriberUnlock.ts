/**
 * Client session helpers for Music Hub subscriber unlock.
 * Never stores plaintext passwords. Protected URLs come only from the unlock/resource APIs.
 */

const SESSION_KEY = 'ccd-music-hub-subscriber-unlocks';

export type SubscriberUnlockRecord = {
  organisationId: string;
  token: string;
  expiresAt: number;
};

function readAll(): Record<string, SubscriberUnlockRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, SubscriberUnlockRecord>;
    const now = Date.now();
    const next: Record<string, SubscriberUnlockRecord> = {};
    for (const [k, v] of Object.entries(parsed || {})) {
      if (v?.token && v.expiresAt > now) next[k] = v;
    }
    return next;
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, SubscriberUnlockRecord>): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(map));
}

export function isOrganisationUnlocked(organisationId: string): boolean {
  const rec = readAll()[organisationId];
  return Boolean(rec && rec.expiresAt > Date.now());
}

export function getOrganisationUnlockToken(organisationId: string): string | null {
  const rec = readAll()[organisationId];
  if (!rec || rec.expiresAt <= Date.now()) return null;
  return rec.token;
}

export function storeOrganisationUnlock(rec: SubscriberUnlockRecord): void {
  const map = readAll();
  map[rec.organisationId] = rec;
  writeAll(map);
}

export function clearOrganisationUnlock(organisationId: string): void {
  const map = readAll();
  delete map[organisationId];
  writeAll(map);
}

export async function unlockMusicHubOrganisation(
  organisationId: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/music-hubs/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organisationId, password }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      token?: string;
      expiresAt?: number;
    };
    if (!res.ok || !data.token || !data.expiresAt) {
      return { ok: false, error: data.error || 'Unlock failed.' };
    }
    storeOrganisationUnlock({
      organisationId,
      token: data.token,
      expiresAt: data.expiresAt,
    });
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not reach unlock service.' };
  }
}

export async function fetchSubscriberResourceUrl(
  resourceId: string,
  organisationId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const token = getOrganisationUnlockToken(organisationId);
  if (!token) return { ok: false, error: 'Organisation not unlocked.' };
  try {
    const res = await fetch(
      `/api/music-hubs/resource?resourceId=${encodeURIComponent(resourceId)}&organisationId=${encodeURIComponent(organisationId)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = (await res.json().catch(() => ({}))) as { error?: string; url?: string };
    if (!res.ok || !data.url) {
      return { ok: false, error: data.error || 'Resource unavailable.' };
    }
    return { ok: true, url: data.url };
  } catch {
    return { ok: false, error: 'Could not load resource.' };
  }
}
