/**
 * Partner Hubs directory data.
 *
 * Geometry and ONS codes come from uk-hub-map.json; hub, service, area and
 * resource records come from Supabase (music_hubs, music_hub_services,
 * music_hub_areas, resources + resource_scopes). Demo visitors, and any
 * session where those tables can't be read, get the same records from
 * directorySeed.json — the file the database seed is generated from.
 */
import { supabase } from '../../config/supabase';
import { hasScopedUser } from '../../config/api';
import { getVercelApiUrl } from '../../utils/apiUrl';
import { isDemoModeActive } from '../../utils/demoMode';
import seed from './directorySeed.json';
import { type MapHub, type MapIndex, type MapLad, type UkHubMapData, indexMap, loadUkHubMap } from './ukHubMapData';

export type Phase = 'EYFS' | 'KS1' | 'KS2' | 'KS3' | 'KS4' | 'KS5';
export const PHASES: Phase[] = ['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5'];

export type AccessLevel = 'free' | 'access_code' | 'subscription' | 'external_link';
export const ACCESS_LABEL: Record<AccessLevel, string> = {
  free: 'Free',
  access_code: 'Organisation access code',
  subscription: 'Provider subscription',
  external_link: 'External link',
};
export const isLocked = (a: AccessLevel) => a === 'access_code' || a === 'subscription';

export type Relationship = 'demonstration' | 'directory_listing' | 'confirmed_contributor';
export const RELATIONSHIP_LABEL: Record<Relationship, string> = {
  demonstration: 'Working example',
  directory_listing: 'Directory listing',
  confirmed_contributor: 'Confirmed contributor',
};

export interface ContactSocial {
  label: string;
  href: string;
}

export interface Contact {
  lines?: string[];
  /** Venue or postal address, only when published on an official page. */
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  socials?: ContactSocial[];
  sourceUrl?: string;
}

export interface HubDetail {
  id: string;
  relationship: Relationship;
  organisationId?: string;
  about?: string;
  contact?: Contact;
}

export interface HubService {
  id: string;
  hubId: string;
  name: string;
  role: 'lead' | 'partner';
  siteUrl?: string;
  organisationId?: string;
}

export interface AreaDetail {
  code: string;
  serviceId?: string;
  about?: string;
  siteUrl?: string;
  contact?: Contact;
  /** Official outbound links verified on the organisation’s own site. */
  links?: { label: string; href: string }[];
}

export type ScopeType = 'national' | 'nation' | 'region' | 'hub' | 'area';

export interface HubResource {
  id: string;
  organisationId?: string;
  title: string;
  description: string;
  type: string;
  phases: Phase[];
  phaseLabel: string;
  subject: string;
  provider: string;
  access: AccessLevel;
  /** Only present for open resources; locked ones go through /api/music-hubs/resource-access. */
  previewHref?: string;
  sourceHref?: string;
  licence?: string;
  /** Existing CCDesigner seeder that copies this into the teacher's own library. */
  libraryPack?: string;
  scopes: { type: ScopeType; id: string }[];
}

export interface Directory {
  source: 'database' | 'bundled';
  hub: (id: string) => HubDetail;
  services: (hubId: string) => HubService[];
  serviceFor: (lad: MapLad) => HubService | undefined;
  area: (code: string) => AreaDetail | undefined;
  resources: HubResource[];
  resourcesForHub: (hubId: string) => HubResource[];
  resourcesForArea: (hubId: string, code: string) => { local: HubResource[]; shared: HubResource[] };
}

export interface PartnerData {
  ix: MapIndex;
  dir: Directory;
}

// ---------------------------------------------------------------------------

interface Records {
  hubs: HubDetail[];
  services: HubService[];
  areas: AreaDetail[];
  resources: HubResource[];
  hubPatches: Partial<Record<string, Partial<MapHub>>>;
}

const asPhases = (ks: unknown): Phase[] =>
  Array.isArray(ks) ? (ks.filter((k) => PHASES.includes(k as Phase)) as Phase[]) : [];

export const paragraphs = (s?: string | null) => (s ? s.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) : []);

function bundledRecords(data: UkHubMapData): Records {
  const hubs = Object.entries(seed.hubs).map(([id, h]) => ({
    id,
    relationship: h.relationship as Relationship,
    organisationId: h.organisationId,
    about: h.about,
    contact: h.contact,
  }));
  const services: HubService[] = seed.services.map((s) => ({
    id: s.id,
    hubId: s.hubId,
    name: s.name,
    role: s.role as HubService['role'],
    siteUrl: s.siteUrl,
    organisationId: s.organisationId,
  }));
  const areaSeed = (seed as { areas?: Record<string, Partial<AreaDetail> & { serviceId?: string }> }).areas ?? {};
  const areas: AreaDetail[] = data.lads.flatMap((l) => {
    const s = seed.services.find(
      (x) => x.hubId === l.hub && ('county' in x.covers ? l.county === x.covers.county : l.name === x.covers.name),
    );
    const extra = areaSeed[l.code];
    if (!s && !extra) return [];
    return [
      {
        code: l.code,
        serviceId: extra?.serviceId ?? s?.id,
        about: extra?.about,
        siteUrl: extra?.siteUrl,
        contact: extra?.contact,
        links: extra?.links,
      },
    ];
  });
  const resources: HubResource[] = seed.resources.map((r) => ({
    id: r.id,
    organisationId: r.organisationId,
    title: r.title,
    description: r.description,
    type: r.type,
    phases: asPhases(r.keyStages),
    phaseLabel: r.phaseLabel,
    subject: r.subjects.join(' · '),
    provider: r.contributor,
    access: r.access as AccessLevel,
    previewHref: r.previewHref,
    sourceHref: r.sourceHref,
    licence: r.licence,
    libraryPack: r.libraryPack,
    scopes: r.scopes as HubResource['scopes'],
  }));
  return { hubs, services, areas, resources, hubPatches: {} };
}

type Row = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v : undefined);

async function databaseRecords(): Promise<Records> {
  const [hubs, services, areas, scopes] = await Promise.all([
    supabase
      .from('music_hubs')
      .select('id,name,short_name,lead_organisation_name,site_url,region_note,verified,organisation_id,about,contact,relationship_status'),
    supabase.from('music_hub_services').select('id,hub_id,name,role,organisation_id,site_url,sort_order').order('sort_order'),
    supabase.from('music_hub_areas').select('code,service_id,about,site_url,contact').not('hub_id', 'is', null),
    supabase.from('resource_scopes').select('resource_id,scope_type,scope_id'),
  ]);
  const failed = [hubs, services, areas, scopes].find((r) => r.error);
  if (failed?.error) throw failed.error;
  if (!hubs.data?.length) throw new Error('Directory is empty');

  const scopeRows = (scopes.data ?? []) as Row[];
  const ids = [...new Set(scopeRows.map((s) => String(s.resource_id)))];
  let resourceRows: Row[] = [];
  if (ids.length) {
    const res = await supabase
      .from('resources')
      .select('id,organisation_id,title,description,key_stages,subjects,metadata,access_level,contributor_name,licence,source_url,download_url,status')
      .in('id', ids)
      .eq('status', 'published');
    if (res.error) throw res.error;
    resourceRows = (res.data ?? []) as Row[];
  }

  const hubPatches: Records['hubPatches'] = {};
  for (const h of hubs.data as Row[]) {
    hubPatches[String(h.id)] = {
      name: String(h.name),
      shortName: str(h.short_name),
      leadOrganisation: str(h.lead_organisation_name) ?? null,
      siteUrl: str(h.site_url),
      regionNote: str(h.region_note),
      verified: Boolean(h.verified),
    };
  }

  return {
    hubPatches,
    hubs: (hubs.data as Row[]).map((h) => ({
      id: String(h.id),
      relationship: (str(h.relationship_status) ?? 'directory_listing') as Relationship,
      organisationId: str(h.organisation_id),
      about: str(h.about),
      contact: h.contact && Object.keys(h.contact as object).length ? (h.contact as Contact) : undefined,
    })),
    services: ((services.data ?? []) as Row[]).map((s) => ({
      id: String(s.id),
      hubId: String(s.hub_id),
      name: String(s.name),
      role: s.role === 'lead' ? 'lead' : 'partner',
      siteUrl: str(s.site_url),
      organisationId: str(s.organisation_id),
    })),
    areas: ((areas.data ?? []) as Row[]).map((a) => {
      // Area "links" have no dedicated column; data-updates store them on contact.links.
      const raw = a.contact && typeof a.contact === 'object' ? ({ ...(a.contact as Row) } as Row) : null;
      const linkRows = Array.isArray(raw?.links) ? (raw!.links as { label?: unknown; href?: unknown }[]) : [];
      const links = linkRows
        .map((l) => ({ label: str(l.label), href: str(l.href) }))
        .filter((l): l is { label: string; href: string } => Boolean(l.label && l.href));
      if (raw) delete raw.links;
      const contactKeys = raw ? Object.keys(raw).filter((k) => raw[k] != null && raw[k] !== '') : [];
      return {
        code: String(a.code),
        serviceId: str(a.service_id),
        about: str(a.about),
        siteUrl: str(a.site_url),
        contact: contactKeys.length ? (raw as Contact) : undefined,
        links: links.length ? links : undefined,
      };
    }),
    resources: resourceRows.map((r) => {
      const meta = (r.metadata ?? {}) as Row;
      const access = (str(r.access_level) ?? 'free') as AccessLevel;
      const phases = asPhases(r.key_stages);
      return {
        id: String(r.id),
        organisationId: str(r.organisation_id),
        title: String(r.title),
        description: str(r.description) ?? '',
        type: str(meta.type) ?? 'Resource',
        phases,
        phaseLabel: str(meta.phase_label) ?? (phases.join('–') || 'All phases'),
        subject: Array.isArray(r.subjects) ? (r.subjects as string[]).join(' · ') : '',
        provider: str(r.contributor_name) ?? 'Partner organisation',
        access,
        previewHref: isLocked(access) ? undefined : str(r.download_url),
        sourceHref: str(r.source_url),
        licence: str(r.licence),
        libraryPack: str(meta.library_pack),
        scopes: scopeRows
          .filter((s) => s.resource_id === r.id)
          .map((s) => ({ type: s.scope_type as ScopeType, id: String(s.scope_id) })),
      };
    }),
  };
}

function buildDirectory(source: Directory['source'], rec: Records, ix: MapIndex): Directory {
  const hubs = new Map(rec.hubs.map((h) => [h.id, h]));
  const services = new Map(rec.services.map((s) => [s.id, s]));
  const areas = new Map(rec.areas.map((a) => [a.code, a]));
  const inHub = (r: HubResource, hubId: string) =>
    r.scopes.some((s) => (s.type === 'hub' && s.id === hubId) || (s.type === 'area' && ix.lad(s.id)?.hub === hubId));
  return {
    source,
    hub: (id) => hubs.get(id) ?? { id, relationship: 'directory_listing' },
    services: (hubId) => rec.services.filter((s) => s.hubId === hubId),
    serviceFor: (lad) => {
      const id = areas.get(lad.code)?.serviceId;
      return id ? services.get(id) : undefined;
    },
    area: (code) => areas.get(code),
    resources: rec.resources,
    resourcesForHub: (hubId) => rec.resources.filter((r) => inHub(r, hubId)),
    resourcesForArea: (hubId, code) => ({
      local: rec.resources.filter((r) => r.scopes.some((s) => s.type === 'area' && s.id === code)),
      shared: rec.resources.filter((r) => r.scopes.some((s) => s.type === 'hub' && s.id === hubId)),
    }),
  };
}

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

let cache: Promise<PartnerData> | null = null;

export function loadPartnerData(): Promise<PartnerData> {
  if (!cache) {
    cache = (async () => {
      const data = await loadUkHubMap();
      if (!isDemoModeActive()) {
        try {
          const rec = await withTimeout(databaseRecords(), 6000);
          const patched: UkHubMapData = {
            ...data,
            hubs: data.hubs.map((h) => ({ ...h, ...Object.fromEntries(Object.entries(rec.hubPatches[h.id] ?? {}).filter(([, v]) => v !== undefined)) })),
          };
          const ix = indexMap(patched);
          return { ix, dir: buildDirectory('database', rec, ix) };
        } catch {
          // Tables not migrated yet, offline, or blocked: the bundled records are identical to the seed.
        }
      }
      const ix = indexMap(data);
      return { ix, dir: buildDirectory('bundled', bundledRecords(data), ix) };
    })().catch((e) => {
      cache = null;
      throw e;
    });
  }
  return cache;
}

/** Re-read after an approved edit. */
export function reloadPartnerData() {
  cache = null;
  return loadPartnerData();
}

// ---------------------------------------------------------------------------
// Engagement (signed-in teachers only; never blocks the UI)
// ---------------------------------------------------------------------------

export type EngagementEvent = 'viewed' | 'added_to_library' | 'placed_in_lesson' | 'assigned_to_planner' | 'taught_reflected';

export function logEngagement(dir: Directory, r: HubResource, event: EngagementEvent, ctx: { hubId?: string; areaCode?: string } = {}) {
  if (dir.source !== 'database' || !hasScopedUser()) return;
  void supabase
    .from('resource_engagement_events')
    .upsert(
      { resource_id: r.id, event_type: event, hub_id: ctx.hubId ?? null, area_code: ctx.areaCode ?? null },
      { onConflict: 'user_id,resource_id,event_type,event_day', ignoreDuplicates: true },
    )
    .then(
      () => undefined,
      () => undefined,
    );
}

// ---------------------------------------------------------------------------
// Locked resources and organisation access codes
// ---------------------------------------------------------------------------

async function authorisedFetch(path: string, init?: RequestInit) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false as const, status: 401, body: { error: 'Sign in to use organisation access codes.' } };
  const res = await fetch(getVercelApiUrl(path), {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, body };
}

export const canUseAccessCodes = () => hasScopedUser() && !isDemoModeActive();

export async function openLockedResource(resourceId: string): Promise<{ url: string } | { error: string; needsCode: boolean }> {
  if (!canUseAccessCodes()) return { error: 'Sign in with your CCDesigner account to open this resource.', needsCode: false };
  const r = await authorisedFetch(`/api/music-hubs/resource-access?resourceId=${encodeURIComponent(resourceId)}`);
  if (r.ok && typeof r.body.url === 'string') return { url: r.body.url };
  return { error: String(r.body.error ?? 'This resource is not available.'), needsCode: r.status === 403 };
}

export async function redeemAccessCode(organisationId: string, code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canUseAccessCodes()) return { ok: false, error: 'Sign in with your CCDesigner account to use an access code.' };
  const r = await authorisedFetch('/api/music-hubs/redeem-code', { method: 'POST', body: JSON.stringify({ organisationId, code }) });
  return r.ok ? { ok: true } : { ok: false, error: String(r.body.error ?? 'That code was not recognised.') };
}

export interface AccessCodeRecord {
  id: string;
  label: string;
  active: boolean;
  expires_at: string | null;
  max_redemptions: number | null;
  redemption_count: number;
  grant_days: number | null;
  created_at: string;
}

const apiError = (body: Record<string, unknown>) => new Error(String(body.error ?? 'Request failed'));

export async function listAccessCodes(organisationId: string): Promise<AccessCodeRecord[]> {
  const r = await authorisedFetch(`/api/music-hubs/access-codes?organisationId=${encodeURIComponent(organisationId)}`);
  if (!r.ok) throw apiError(r.body);
  return (r.body.codes ?? []) as AccessCodeRecord[];
}

/** The plaintext code is returned once and never stored. */
export async function createAccessCode(
  organisationId: string,
  input: { label?: string; expiresAt?: string; maxRedemptions?: number; grantDays?: number },
): Promise<{ code: string; record: AccessCodeRecord }> {
  const r = await authorisedFetch('/api/music-hubs/access-codes', { method: 'POST', body: JSON.stringify({ organisationId, ...input }) });
  if (!r.ok) throw apiError(r.body);
  return { code: String(r.body.code), record: r.body.record as AccessCodeRecord };
}

export async function setAccessCodeActive(organisationId: string, id: string, active: boolean) {
  const r = await authorisedFetch('/api/music-hubs/access-codes', { method: 'PATCH', body: JSON.stringify({ organisationId, id, active }) });
  if (!r.ok) throw apiError(r.body);
}

// ---------------------------------------------------------------------------
// Hub management (hub editors / publishers via existing hub_memberships)
// ---------------------------------------------------------------------------

export type HubRole = 'hub_viewer' | 'hub_editor' | 'hub_publisher' | 'hub_administrator';
const RANK: Record<HubRole, number> = { hub_viewer: 1, hub_editor: 2, hub_publisher: 3, hub_administrator: 4 };
export const atLeast = (role: HubRole | null, min: HubRole) => (role ? RANK[role] >= RANK[min] : false);

export async function myHubRole(dir: Directory, hubId: string): Promise<HubRole | null> {
  if (dir.source !== 'database' || !hasScopedUser()) return null;
  const { data, error } = await supabase.rpc('music_hub_role', { p_hub: hubId });
  if (error || typeof data !== 'string') return null;
  return data in RANK ? (data as HubRole) : null;
}

export interface HubEditableFields {
  short_name?: string;
  site_url?: string;
  about?: string;
  contact?: Contact;
}

export interface DirectoryDraft {
  id: string;
  hub_id: string;
  area_code: string | null;
  changes: HubEditableFields;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'withdrawn';
  proposed_by: string;
  review_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface DirectoryRevision {
  id: string;
  area_code: string | null;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  created_at: string;
}

const fail = (error: { message?: string } | null) => {
  if (error) throw new Error(error.message || 'Request failed');
};

export async function listDrafts(hubId: string): Promise<DirectoryDraft[]> {
  const { data, error } = await supabase
    .from('music_hub_directory_drafts')
    .select('id,hub_id,area_code,changes,status,proposed_by,review_note,created_at,updated_at')
    .eq('hub_id', hubId)
    .order('updated_at', { ascending: false })
    .limit(50);
  fail(error);
  return (data ?? []) as DirectoryDraft[];
}

export async function saveDraft(input: {
  id?: string;
  hubId: string;
  areaCode?: string | null;
  changes: HubEditableFields;
  submit: boolean;
}): Promise<void> {
  const status = input.submit ? 'pending' : 'draft';
  if (input.id) {
    const { error } = await supabase
      .from('music_hub_directory_drafts')
      .update({ changes: input.changes, status, updated_at: new Date().toISOString() })
      .eq('id', input.id);
    fail(error);
    return;
  }
  const { error } = await supabase
    .from('music_hub_directory_drafts')
    .insert({ hub_id: input.hubId, area_code: input.areaCode ?? null, changes: input.changes, status });
  fail(error);
}

export async function withdrawDraft(id: string) {
  const { error } = await supabase.from('music_hub_directory_drafts').update({ status: 'withdrawn' }).eq('id', id);
  fail(error);
}

export async function reviewDraft(id: string, decision: 'approved' | 'rejected', note?: string) {
  const { error } = await supabase.rpc('review_music_hub_draft', { p_draft: id, p_decision: decision, p_note: note ?? null });
  fail(error);
}

export async function listRevisions(hubId: string): Promise<DirectoryRevision[]> {
  const { data, error } = await supabase
    .from('music_hub_directory_revisions')
    .select('id,area_code,before,after,created_at')
    .eq('hub_id', hubId)
    .order('created_at', { ascending: false })
    .limit(20);
  fail(error);
  return (data ?? []) as DirectoryRevision[];
}

export interface ReachRow {
  resource_id: string;
  event_type: EngagementEvent;
  events: number | null;
  teachers: number | null;
}

export async function engagementSummary(organisationId: string, days = 365): Promise<ReachRow[]> {
  const { data, error } = await supabase.rpc('resource_engagement_summary', { p_org: organisationId, p_days: days });
  fail(error);
  return (data ?? []) as ReachRow[];
}
