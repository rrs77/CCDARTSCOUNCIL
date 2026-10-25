/**
 * Client for /api/slides-links/* with localStorage fallback when offline.
 */

import { supabase } from '../../../config/supabase';
import { getVercelApiUrl } from '../../../utils/apiUrl';

export const LINKS_LS_KEY = 'ccd-lesson-viewer-links-v1';
export const PICKS_LS_KEY = 'ccd-lesson-viewer-picks-v1';
/** Legacy single-id map (sheet:lessonNumber → viewerId). Read for migration only. */
export const LEGACY_ATTACH_KEY = 'ccd-ilv-attachments-v1';

export interface LessonViewerLinkDto {
  id: string;
  viewerId: string;
  title: string;
  thumb: string | null;
  status: string;
  isOriginal: boolean;
  derivedFrom: string | null;
  rootViewerId?: string | null;
  orgName: string | null;
  origin: 'manual' | 'scheme' | 'migrated' | string;
  position: number;
  available: boolean;
  reason: string | null;
  slideCount: number;
  source?: string;
}

export interface ListLinksResult {
  links: LessonViewerLinkDto[];
  defaultViewerId: string | null;
  lastScene?: number | null;
  canEdit: boolean;
  offline?: boolean;
}

export interface LessonRef {
  year: string;
  sheet: string;
  lesson: string;
}

function lessonStorageKey(ref: LessonRef): string {
  return `${ref.year}/${ref.sheet}/${ref.lesson}`;
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  try {
    const res = await fetch(getVercelApiUrl(path), {
      ...init,
      headers: { ...(await authHeaders()), ...(init?.headers as Record<string, string> | undefined) },
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      return { ok: false, status: res.status, error: json.error || `Request failed (${res.status})` };
    }
    return { ok: true, data: json as T };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : 'network error' };
  }
}

type LocalStore = Record<string, LessonViewerLinkDto[]>;
type LocalPicks = Record<string, { viewerId: string; lastScene?: number | null; pickedAt: string }>;

function readLocalLinks(): LocalStore {
  try {
    const raw = localStorage.getItem(LINKS_LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LocalStore;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalLinks(store: LocalStore) {
  localStorage.setItem(LINKS_LS_KEY, JSON.stringify(store));
}

function readLocalPicks(): LocalPicks {
  try {
    const raw = localStorage.getItem(PICKS_LS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as LocalPicks;
  } catch {
    return {};
  }
}

function writeLocalPicks(store: LocalPicks) {
  localStorage.setItem(PICKS_LS_KEY, JSON.stringify(store));
}

/** One-time: promote legacy single attach into local multi-link store. */
export function migrateLegacyAttachmentsIntoLocal(ref: LessonRef): void {
  try {
    const legacyRaw = localStorage.getItem(LEGACY_ATTACH_KEY);
    if (!legacyRaw) return;
    const legacy = JSON.parse(legacyRaw) as Record<string, string>;
    const oldKey = `${ref.sheet}:${ref.lesson}`;
    const viewerId = legacy[oldKey];
    if (!viewerId) return;
    const key = lessonStorageKey(ref);
    const store = readLocalLinks();
    const existing = store[key] || [];
    if (existing.some((l) => l.viewerId === viewerId)) return;
    existing.unshift({
      id: `local-migrated-${viewerId}`,
      viewerId,
      title: 'Linked slides',
      thumb: null,
      status: 'published',
      isOriginal: true,
      derivedFrom: null,
      orgName: null,
      origin: 'migrated',
      position: 0,
      available: true,
      reason: null,
      slideCount: 0,
    });
    store[key] = existing;
    writeLocalLinks(store);
  } catch {
    /* ignore */
  }
}

function sortLinks(links: LessonViewerLinkDto[]): LessonViewerLinkDto[] {
  return [...links].sort((a, b) => {
    if (a.isOriginal !== b.isOriginal) return a.isOriginal ? -1 : 1;
    if (a.position !== b.position) return a.position - b.position;
    return a.title.localeCompare(b.title);
  });
}

function chooseDefault(links: LessonViewerLinkDto[], pickId: string | null, lastId: string | null): string | null {
  const usable = links.filter((l) => l.available);
  if (pickId && usable.some((l) => l.viewerId === pickId)) return pickId;
  if (lastId && usable.some((l) => l.viewerId === lastId)) return lastId;
  const original = usable.find((l) => l.isOriginal);
  if (original) return original.viewerId;
  return usable[0]?.viewerId || null;
}

function localList(ref: LessonRef): ListLinksResult {
  migrateLegacyAttachmentsIntoLocal(ref);
  const key = lessonStorageKey(ref);
  const links = sortLinks(readLocalLinks()[key] || []);
  const picks = readLocalPicks();
  const pick = picks[key];
  const last = Object.values(picks).sort((a, b) => b.pickedAt.localeCompare(a.pickedAt))[0];
  return {
    links,
    defaultViewerId: chooseDefault(links, pick?.viewerId || null, last?.viewerId || null),
    lastScene: pick?.lastScene ?? null,
    canEdit: true,
    offline: true,
  };
}

export async function listLessonViewerLinks(ref: LessonRef): Promise<ListLinksResult> {
  const q = new URLSearchParams({ year: ref.year, sheet: ref.sheet, lesson: ref.lesson });
  const res = await apiFetch<ListLinksResult>(`/api/slides-links/list?${q}`);
  if (!res.ok) {
    return localList(ref);
  }
  // Mirror to local
  const key = lessonStorageKey(ref);
  const store = readLocalLinks();
  store[key] = res.data.links;
  writeLocalLinks(store);
  return { ...res.data, offline: false };
}

export async function attachLessonViewer(
  ref: LessonRef,
  viewerId: string,
  meta?: Partial<LessonViewerLinkDto>,
): Promise<{ ok: true } | { ok: false; error: string; status?: number }> {
  const res = await apiFetch<{ link: { id: string } }>('/api/slides-links/attach', {
    method: 'POST',
    body: JSON.stringify({ ...ref, viewerId }),
  });
  if (!res.ok) {
    if (res.status === 0) {
      // offline local attach
      const key = lessonStorageKey(ref);
      const store = readLocalLinks();
      const list = store[key] || [];
      if (list.some((l) => l.viewerId === viewerId)) return { ok: false, error: 'Already linked', status: 409 };
      if (list.length >= 12) return { ok: false, error: 'Limit 12 slideshows per lesson', status: 422 };
      list.push({
        id: `local-${viewerId}-${Date.now()}`,
        viewerId,
        title: meta?.title || 'Slides',
        thumb: meta?.thumb || null,
        status: meta?.status || 'published',
        isOriginal: Boolean(meta?.isOriginal),
        derivedFrom: meta?.derivedFrom || null,
        orgName: meta?.orgName || null,
        origin: 'manual',
        position: list.length,
        available: meta?.available !== false,
        reason: null,
        slideCount: meta?.slideCount || 0,
        source: meta?.source,
      });
      store[key] = list;
      writeLocalLinks(store);
      return { ok: true };
    }
    return { ok: false, error: res.error, status: res.status };
  }
  await listLessonViewerLinks(ref);
  return { ok: true };
}

export async function detachLessonViewerLink(
  ref: LessonRef,
  linkId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await apiFetch<{ ok: boolean }>('/api/slides-links/detach', {
    method: 'POST',
    body: JSON.stringify({ linkId }),
  });
  if (!res.ok) {
    if (res.status === 0) {
      const key = lessonStorageKey(ref);
      const store = readLocalLinks();
      store[key] = (store[key] || []).filter((l) => l.id !== linkId);
      writeLocalLinks(store);
      return { ok: true };
    }
    return { ok: false, error: res.error };
  }
  await listLessonViewerLinks(ref);
  return { ok: true };
}

export async function pickLessonViewer(
  ref: LessonRef,
  viewerId: string,
  lastScene?: number | null,
): Promise<void> {
  const key = lessonStorageKey(ref);
  const picks = readLocalPicks();
  picks[key] = { viewerId, lastScene: lastScene ?? null, pickedAt: new Date().toISOString() };
  writeLocalPicks(picks);
  void apiFetch('/api/slides-links/pick', {
    method: 'POST',
    body: JSON.stringify({ ...ref, viewerId, lastScene }),
  });
}

export async function reorderLessonViewerLinks(
  ref: LessonRef,
  orderedLinkIds: string[],
): Promise<void> {
  const res = await apiFetch('/api/slides-links/reorder', {
    method: 'POST',
    body: JSON.stringify({ ...ref, orderedLinkIds }),
  });
  if (!res.ok && res.status === 0) {
    const key = lessonStorageKey(ref);
    const store = readLocalLinks();
    const byId = new Map((store[key] || []).map((l) => [l.id, l]));
    store[key] = orderedLinkIds.map((id, i) => ({ ...byId.get(id)!, position: i })).filter(Boolean);
    writeLocalLinks(store);
    return;
  }
  await listLessonViewerLinks(ref);
}

export async function applySchemeViewerLinks(input: {
  schemeId: string;
  year: string;
  sheet: string;
  lessonNumbers: string[];
}): Promise<{ added: number; skipped: number }> {
  const res = await apiFetch<{ added: number; skipped: number }>('/api/slides-links/apply-scheme', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.ok) return { added: 0, skipped: 0 };
  return res.data;
}

/** Default viewer id for a lesson — prefers multi-link store, falls back to legacy single id. */
export function getDefaultViewerIdSync(ref: LessonRef, legacyInteractiveLessonId?: string | null): string | null {
  const listed = localList(ref);
  if (listed.defaultViewerId) return listed.defaultViewerId;
  return legacyInteractiveLessonId || null;
}
