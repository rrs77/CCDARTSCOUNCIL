export type BBox = [number, number, number, number];

export interface MapShape {
  code: string;
  name: string;
  d: string;
  bbox: BBox;
  label: [number, number];
  tone?: number;
}

export interface MapHub {
  id: string;
  name: string;
  shortName?: string;
  aceAreaName: string;
  leadOrganisation: string | null;
  leadBody: string | null;
  onsRegion: string;
  regionNote?: string;
  siteUrl?: string;
  verified: boolean;
  authorities: string[];
  lads: string[];
  region: string;
  regions: string[];
  bbox: BBox;
  label: [number, number];
  outline: string;
  tone: number;
  neighbours: string[];
}

export interface MapLad {
  code: string;
  name: string;
  nation: string;
  region: string | null;
  hub: string | null;
  county: string | null;
  d: string;
  label: [number, number];
  bbox: BBox;
  tone: number;
}

export interface UkHubMapData {
  viewBox: BBox;
  /** Same-scale insets (e.g. Shetland) moved so the UK frames well; outlined on the map. */
  insets: { name: string; box: BBox }[];
  sources: { boundaries: string; attribution: string; hubs: string; hubsUrl: string };
  nations: MapShape[];
  regions: MapShape[];
  hubs: MapHub[];
  lads: MapLad[];
}

export type MapFocus =
  | { level: 'uk' }
  | { level: 'region'; id: string }
  | { level: 'nation'; id: string }
  | { level: 'hub'; id: string }
  | { level: 'lad'; id: string };

export const ENGLAND = 'E92000001';

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const hubLabel = (h: MapHub) => h.shortName ?? h.name;

let cache: Promise<UkHubMapData> | null = null;

export function loadUkHubMap(): Promise<UkHubMapData> {
  if (!cache) {
    cache = fetch('/music-hubs/uk/uk-hub-map.json')
      .then((r) => {
        if (!r.ok) throw new Error(`Map data ${r.status}`);
        return r.json() as Promise<UkHubMapData>;
      })
      .catch((e) => {
        cache = null;
        throw e;
      });
  }
  return cache;
}

export interface MapIndex {
  data: UkHubMapData;
  hub: (id: string) => MapHub | undefined;
  lad: (code: string) => MapLad | undefined;
  region: (code: string) => MapShape | undefined;
  nation: (code: string) => MapShape | undefined;
  hubsInRegion: (code: string) => MapHub[];
  ladsInHub: (id: string) => MapLad[];
  ladsInNation: (code: string) => MapLad[];
  ladBySlug: (hubId: string, slug: string) => MapLad | undefined;
  regionBySlug: (slug: string) => MapShape | undefined;
  nationBySlug: (slug: string) => MapShape | undefined;
}

export function indexMap(data: UkHubMapData): MapIndex {
  const hubs = new Map(data.hubs.map((h) => [h.id, h]));
  const lads = new Map(data.lads.map((l) => [l.code, l]));
  const regions = new Map(data.regions.map((r) => [r.code, r]));
  const nations = new Map(data.nations.map((n) => [n.code, n]));
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
  return {
    data,
    hub: (id) => hubs.get(id),
    lad: (code) => lads.get(code),
    region: (code) => regions.get(code),
    nation: (code) => nations.get(code),
    hubsInRegion: (code) => data.hubs.filter((h) => h.region === code).sort(byName),
    ladsInHub: (id) => data.lads.filter((l) => l.hub === id).sort(byName),
    ladsInNation: (code) => data.lads.filter((l) => l.nation === code).sort(byName),
    ladBySlug: (hubId, slug) => data.lads.find((l) => l.hub === hubId && slugify(l.name) === slug),
    regionBySlug: (slug) => data.regions.find((r) => slugify(r.name) === slug),
    nationBySlug: (slug) => data.nations.find((n) => slugify(n.name) === slug),
  };
}

/** Bounding box the camera should frame for a focus. */
export function focusBBox(ix: MapIndex, f: MapFocus): BBox {
  switch (f.level) {
    case 'uk':
      return ix.data.viewBox;
    case 'region':
      return ix.region(f.id)?.bbox ?? ix.data.viewBox;
    case 'nation':
      return ix.nation(f.id)?.bbox ?? ix.data.viewBox;
    case 'hub':
      return ix.hub(f.id)?.bbox ?? ix.data.viewBox;
    case 'lad': {
      const l = ix.lad(f.id);
      if (!l) return ix.data.viewBox;
      const h = l.hub ? ix.hub(l.hub) : undefined;
      return h ? h.bbox : l.bbox;
    }
  }
}

/** Display name, URL path segments and parent for every focus. */
export function focusPath(ix: MapIndex, f: MapFocus): string[] {
  switch (f.level) {
    case 'uk':
      return [];
    case 'nation': {
      const n = ix.nation(f.id);
      return n ? [slugify(n.name)] : [];
    }
    case 'region': {
      const r = ix.region(f.id);
      return r ? ['england', slugify(r.name)] : [];
    }
    case 'hub': {
      const h = ix.hub(f.id);
      return h ? [...focusPath(ix, { level: 'region', id: h.region }), h.id] : [];
    }
    case 'lad': {
      const l = ix.lad(f.id);
      if (!l) return [];
      if (l.hub) return [...focusPath(ix, { level: 'hub', id: l.hub }), slugify(l.name)];
      return [...focusPath(ix, { level: 'nation', id: l.nation }), slugify(l.name)];
    }
  }
}

export function focusFromPath(ix: MapIndex, segs: string[]): MapFocus {
  if (segs.length === 0) return { level: 'uk' };
  if (segs[0] !== 'england') {
    const n = ix.nationBySlug(segs[0]);
    if (!n) return { level: 'uk' };
    if (segs[1]) {
      const l = ix.ladsInNation(n.code).find((x) => slugify(x.name) === segs[1]);
      if (l) return { level: 'lad', id: l.code };
    }
    return { level: 'nation', id: n.code };
  }
  const r = segs[1] ? ix.regionBySlug(segs[1]) : undefined;
  if (!r) return { level: 'nation', id: ENGLAND };
  const h = segs[2] ? ix.hub(segs[2]) : undefined;
  if (!h) return { level: 'region', id: r.code };
  const l = segs[3] ? ix.ladBySlug(h.id, segs[3]) : undefined;
  return l ? { level: 'lad', id: l.code } : { level: 'hub', id: h.id };
}

export function parentFocus(ix: MapIndex, f: MapFocus): MapFocus | null {
  switch (f.level) {
    case 'uk':
      return null;
    case 'nation':
      return { level: 'uk' };
    case 'region':
      return { level: 'nation', id: ENGLAND };
    case 'hub':
      return { level: 'region', id: ix.hub(f.id)?.region ?? '' };
    case 'lad': {
      const l = ix.lad(f.id);
      if (l?.hub) return { level: 'hub', id: l.hub };
      return l ? { level: 'nation', id: l.nation } : { level: 'uk' };
    }
  }
}

export function focusName(ix: MapIndex, f: MapFocus): string {
  switch (f.level) {
    case 'uk':
      return 'United Kingdom';
    case 'nation':
      return ix.nation(f.id)?.name ?? '';
    case 'region':
      return ix.region(f.id)?.name ?? '';
    case 'hub': {
      const h = ix.hub(f.id);
      return h ? hubLabel(h) : '';
    }
    case 'lad':
      return ix.lad(f.id)?.name ?? '';
  }
}

export function sameFocus(a: MapFocus, b: MapFocus) {
  return a.level === b.level && (a.level === 'uk' || (a as { id: string }).id === (b as { id: string }).id);
}
