#!/usr/bin/env node
/**
 * Build the UK Music Hub map data (public/music-hubs/uk/uk-hub-map.json).
 *
 * Inputs (scripts/geo-src/, refresh with the commands in public/music-hubs/uk/README.md):
 *   lad.geojson   ONS Local Authority Districts (December 2024) Boundaries UK BUC
 *   rgn.geojson   ONS Regions (December 2024) Boundaries EN BUC
 *   ctry.geojson  ONS Countries (December 2024) Boundaries UK BUC
 *   hlo.xlsx      Arts Council England, Music Hub Investment Programme – Hub Lead Organisations
 *
 * Licences: ONS boundaries under the Open Government Licence v3.0 (Contains OS data
 * © Crown copyright and database right; Contains National Statistics data © Crown
 * copyright and database right). Hub areas © Arts Council England, published list.
 *
 * The build fails if any English district is not in exactly one Music Hub area, or if
 * an ACE upper-tier authority name cannot be matched.
 *
 * Usage: node artifacts/ccd/scripts/build-uk-hub-map.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('@e965/xlsx');

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(__dirname, 'geo-src');
const OUT_DIR = join(ROOT, 'public/music-hubs/uk');
const OUT = join(OUT_DIR, 'uk-hub-map.json');

const readJson = (f) => JSON.parse(readFileSync(join(SRC, f), 'utf8'));
const lads = readJson('lad.geojson').features;
const regions = readJson('rgn.geojson').features;
const countries = readJson('ctry.geojson').features;

/** Two-tier county membership by ONS E07 district code (stable since the 2023 reorganisation). */
const COUNTY_RANGES = {
  Cambridgeshire: [[8, 12]],
  Derbyshire: [[32, 39]],
  Devon: [[40, 47]],
  'East Sussex': [[61, 65]],
  Essex: [[66, 77]],
  Gloucestershire: [[78, 83]],
  Hampshire: [[84, 94]],
  Hertfordshire: [[95, 103], [240, 243]],
  Kent: [[105, 116]],
  Lancashire: [[117, 128]],
  Leicestershire: [[129, 135]],
  Lincolnshire: [[136, 142]],
  Norfolk: [[143, 149]],
  Nottinghamshire: [[170, 176]],
  Oxfordshire: [[177, 181]],
  Staffordshire: [[192, 199]],
  Suffolk: [[200, 203], [244, 245]],
  Surrey: [[207, 217]],
  Warwickshire: [[218, 222]],
  'West Sussex': [[223, 229]],
  Worcestershire: [[234, 239]],
};

function countyFor(code) {
  if (!code.startsWith('E07')) return null;
  const n = Number(code.slice(3));
  for (const [county, ranges] of Object.entries(COUNTY_RANGES)) {
    if (ranges.some(([a, b]) => n >= a && n <= b)) return county;
  }
  return undefined;
}

/** Verified public names for East of England hubs (official hub/lead sites, checked Oct 2026). */
const HUB_OVERRIDES = {
  'essex-southend-on-sea-and-thurrock': {
    id: 'greater-essex',
    name: 'Greater Essex Music Hub',
    leadOrganisation: 'Essex Music Service',
    leadBody: 'Essex County Council',
    siteUrl: 'https://www.greateressexmusichub.org.uk/site/',
    verified: true,
  },
  hertfordshire: {
    name: 'Hertfordshire Music Hub',
    leadOrganisation: 'Hertfordshire Music Service',
    leadBody: 'Hertfordshire County Council',
    siteUrl: 'https://www.hertsmusicservice.org.uk/hertfordshire-music-hub/',
    verified: true,
  },
  'cambridgeshire-and-peterborough': {
    name: 'Cambridgeshire and Peterborough Music Education Hub',
    leadOrganisation: 'Cambridgeshire Music',
    leadBody: 'Cambridgeshire County Council, in consortium with Peterborough City Council',
    siteUrl: 'https://www.cambridgeshiremusic.org.uk/music-education-hub/',
    verified: true,
  },
  'norfolk-and-suffolk': {
    name: 'Norfolk & Suffolk Music Hub',
    leadOrganisation: 'Norfolk Music Service',
    leadBody: 'Norfolk County Council',
    siteUrl: 'https://www.nmhub.co.uk/site/about-the-hub/',
    verified: true,
  },
  'bedfordshire-and-milton-keynes': {
    id: 'blmk',
    name: 'Bedfordshire, Luton and Milton Keynes (BLMK) Music Hub',
    shortName: 'BLMK Music Hub',
    leadOrganisation: 'Inspiring Music',
    leadBody: 'Central Bedfordshire Council',
    siteUrl: 'https://www.lutonmusicservice.co.uk/blmkmusichub/',
    regionNote: 'Milton Keynes is in the South East region but shares this cross-boundary hub.',
    verified: true,
  },
};

const slugify = (s) =>
  s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const norm = (s) =>
  s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bst\.\s*/g, 'st ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// ---------- projection: sinusoidal centred on 2.5°W, integer units ≈ 100 m ----------
const LON0 = -2.5;
const K = 1110; // units per degree of latitude (~100 m per unit)
const projectRaw = ([lon, lat]) => [
  (lon - LON0) * Math.cos((lat * Math.PI) / 180) * K,
  -lat * K,
];

/**
 * Shetland is drawn as a same-scale inset in the North Sea (the ONS convention),
 * so the whole UK frames well. Rings are moved after projection, so shape and
 * scale are unchanged. The inset is outlined on the map.
 */
const INSET_MIN_LAT = 59.45;
const INSET_SHIFT = (() => {
  const [sx, sy] = projectRaw([-1.3, 60.35]);
  const [tx, ty] = projectRaw([-0.25, 58.55]);
  return [tx - sx, ty - sy];
})();
const isInsetRing = (ring) => ring.reduce((s, p) => s + p[1], 0) / ring.length > INSET_MIN_LAT;
const project = (p, inset) => {
  const [x, y] = projectRaw(p);
  return inset ? [x + INSET_SHIFT[0], y + INSET_SHIFT[1]] : [x, y];
};

let minX = Infinity;
let minY = Infinity;
let maxX = -Infinity;
let maxY = -Infinity;
const insetRaw = [Infinity, Infinity, -Infinity, -Infinity];
for (const f of countries) {
  forEachRing(f.geometry, (ring) => {
    const inset = isInsetRing(ring);
    ring.forEach((p) => {
      const [x, y] = project(p, inset);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      if (inset) {
        insetRaw[0] = Math.min(insetRaw[0], x);
        insetRaw[1] = Math.min(insetRaw[1], y);
        insetRaw[2] = Math.max(insetRaw[2], x);
        insetRaw[3] = Math.max(insetRaw[3], y);
      }
    });
  });
}
const PAD = 60;
const toView = (p, inset = false) => {
  const [x, y] = project(p, inset);
  return [Math.round(x - minX + PAD), Math.round(y - minY + PAD)];
};
const INSET_PAD = 70;
const INSET_BOX = [
  Math.round(insetRaw[0] - minX + PAD - INSET_PAD),
  Math.round(insetRaw[1] - minY + PAD - INSET_PAD),
  Math.round(insetRaw[2] - insetRaw[0] + INSET_PAD * 2),
  Math.round(insetRaw[3] - insetRaw[1] + INSET_PAD * 2),
];
const VIEW_W = Math.round(maxX - minX + PAD * 2);
const VIEW_H = Math.round(maxY - minY + PAD * 2);

function forEachRing(geom, fn) {
  if (geom.type === 'Polygon') geom.coordinates.forEach(fn);
  else if (geom.type === 'MultiPolygon') geom.coordinates.forEach((poly) => poly.forEach(fn));
}

function ringArea(r) {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1];
  return a / 2;
}

function ringCentroid(r) {
  let cx = 0;
  let cy = 0;
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const f = r[j][0] * r[i][1] - r[i][0] * r[j][1];
    cx += (r[j][0] + r[i][0]) * f;
    cy += (r[j][1] + r[i][1]) * f;
    a += f;
  }
  if (Math.abs(a) < 1e-9) return r[0];
  return [cx / (3 * a), cy / (3 * a)];
}

/** Projected, de-duplicated integer rings. */
function projectedRings(geom) {
  const out = [];
  forEachRing(geom, (ring) => {
    const pts = [];
    const inset = isInsetRing(ring);
    for (const p of ring) {
      const q = toView(p, inset);
      const last = pts[pts.length - 1];
      if (!last || last[0] !== q[0] || last[1] !== q[1]) pts.push(q);
    }
    if (pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts.pop();
    if (pts.length >= 3) out.push(pts);
  });
  return out;
}

function pathFromRings(rings) {
  return rings
    .map((r) => {
      let s = `M${r[0][0]} ${r[0][1]}`;
      for (let i = 1; i < r.length; i++) s += `l${r[i][0] - r[i - 1][0]} ${r[i][1] - r[i - 1][1]}`;
      return `${s}z`;
    })
    .join('');
}

function bboxOf(rings) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const r of rings)
    for (const [x, y] of r) {
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  return [x0, y0, x1 - x0, y1 - y0];
}

function labelPoint(rings) {
  let best = rings[0];
  for (const r of rings) if (Math.abs(ringArea(r)) > Math.abs(ringArea(best))) best = r;
  return ringCentroid(best).map((v) => Math.round(v));
}

function pointInRings([x, y], rings) {
  let inside = false;
  for (const r of rings)
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i];
      const [xj, yj] = r[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  return inside;
}

/** Outline of a set of polygons: drop every edge shared by two of them, chain the rest. */
function outlinePath(ringSets) {
  const key = (a, b) => `${a[0]},${a[1]}|${b[0]},${b[1]}`;
  const count = new Map();
  const edges = [];
  for (const rings of ringSets)
    for (const r of rings)
      for (let i = 0; i < r.length; i++) {
        const a = r[i];
        const b = r[(i + 1) % r.length];
        edges.push([a, b]);
        const k1 = key(a, b);
        const k2 = key(b, a);
        count.set(k1, (count.get(k1) || 0) + 1);
        count.set(k2, (count.get(k2) || 0) + 1);
      }
  const keep = edges.filter(([a, b]) => count.get(key(a, b)) === 1);
  const byStart = new Map();
  for (const e of keep) {
    const k = `${e[0][0]},${e[0][1]}`;
    if (!byStart.has(k)) byStart.set(k, []);
    byStart.get(k).push(e);
  }
  const used = new Set();
  let d = '';
  for (const e of keep) {
    if (used.has(e)) continue;
    used.add(e);
    const line = [e[0], e[1]];
    for (;;) {
      const end = line[line.length - 1];
      const next = (byStart.get(`${end[0]},${end[1]}`) || []).find((n) => !used.has(n));
      if (!next) break;
      used.add(next);
      line.push(next[1]);
    }
    d += `M${line[0][0]} ${line[0][1]}`;
    for (let i = 1; i < line.length; i++) d += `l${line[i][0] - line[i - 1][0]} ${line[i][1] - line[i - 1][1]}`;
  }
  return d;
}

// ---------- ACE hub areas ----------
const wb = XLSX.readFile(join(SRC, 'hlo.xlsx'));
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
const header = rows.findIndex((r) => r[0] === 'Name of Music Hub Area');
const hubRows = rows.slice(header + 1).filter((r) => r[0] && r[6]);

const ladByNorm = new Map(lads.map((f) => [norm(f.properties.LAD24NM), f.properties.LAD24CD]));
const UTLA_ALIASES = { durham: 'county durham' };
const utlaNames = new Set([...ladByNorm.keys(), ...Object.keys(COUNTY_RANGES).map(norm)]);

/** ACE separates authorities with commas, but some ONS names contain commas too. */
function splitUtlas(text) {
  const parts = String(text).split(',').map((s) => s.trim());
  const out = [];
  for (let i = 0; i < parts.length; ) {
    let matched = null;
    for (let len = Math.min(3, parts.length - i); len >= 1; len--) {
      const candidate = norm(parts.slice(i, i + len).join(', '));
      const resolved = UTLA_ALIASES[candidate] || candidate;
      if (utlaNames.has(resolved)) {
        matched = { name: parts.slice(i, i + len).join(', '), key: resolved, len };
        break;
      }
    }
    if (!matched) throw new Error(`Unmatched ACE authority "${parts[i]}" in "${text}"`);
    out.push(matched);
    i += matched.len;
  }
  return out;
}

const hubByLad = new Map();
const hubs = [];
for (const r of hubRows) {
  const areaName = String(r[0]).trim();
  const base = slugify(areaName);
  const o = HUB_OVERRIDES[base] || {};
  const utlas = splitUtlas(r[6]);
  if (utlas.length !== Number(r[5])) throw new Error(`${areaName}: expected ${r[5]} authorities, matched ${utlas.length}`);
  const lead = String(r[1]).trim();
  const tbc = /^TBC/i.test(lead);
  const hub = {
    id: o.id || base,
    name: o.name || `${areaName} Music Hub`,
    shortName: o.shortName,
    aceAreaName: areaName,
    leadOrganisation: o.leadOrganisation || (tbc ? null : lead),
    leadBody: o.leadBody || (tbc ? null : String(r[2]).trim()),
    onsRegion: String(r[4]).trim(),
    regionNote: o.regionNote,
    siteUrl: o.siteUrl,
    verified: Boolean(o.verified),
    authorities: utlas
      .map((u) => ({ name: u.name.replace(/, (City|County) of$/, ''), county: COUNTY_RANGES[u.name] ? 1 : 0 }))
      .sort((a, b) => b.county - a.county || a.name.localeCompare(b.name))
      .map((a) => a.name),
    lads: [],
  };
  for (const u of utlas) {
    const county = Object.keys(COUNTY_RANGES).find((c) => norm(c) === u.key);
    const codes = county
      ? lads.map((f) => f.properties.LAD24CD).filter((c) => countyFor(c) === county)
      : [ladByNorm.get(u.key)];
    for (const c of codes) {
      if (hubByLad.has(c)) throw new Error(`${c} assigned to both ${hubByLad.get(c)} and ${hub.id}`);
      hubByLad.set(c, hub.id);
      hub.lads.push(c);
    }
  }
  hubs.push(hub);
}

// ---------- geometry ----------
const regionShapes = regions.map((f) => ({
  code: f.properties.RGN24CD,
  name: f.properties.RGN24NM,
  rings: projectedRings(f.geometry),
}));
const nationShapes = countries.map((f) => ({
  code: f.properties.CTRY24CD,
  name: f.properties.CTRY24NM,
  rings: projectedRings(f.geometry),
}));

const NATION_BY_PREFIX = { E: 'E92000001', W: 'W92000004', S: 'S92000003', N: 'N92000002' };
const ladOut = [];
const ladRings = new Map();
const unassigned = [];
for (const f of lads) {
  const code = f.properties.LAD24CD;
  const rings = projectedRings(f.geometry);
  ladRings.set(code, rings);
  const label = labelPoint(rings);
  let region = null;
  if (code.startsWith('E')) {
    region = regionShapes.find((r) => pointInRings(label, r.rings))?.code;
    if (!region) {
      const [bx, by, bw, bh] = bboxOf(rings);
      region = regionShapes.find((r) => pointInRings([bx + bw / 2, by + bh / 2], r.rings))?.code ?? null;
    }
    if (!hubByLad.has(code)) unassigned.push(`${code} ${f.properties.LAD24NM}`);
  }
  ladOut.push({
    code,
    name: f.properties.LAD24NM,
    nation: NATION_BY_PREFIX[code[0]],
    region,
    hub: hubByLad.get(code) ?? null,
    county: countyFor(code) ?? null,
    d: pathFromRings(rings),
    label,
    bbox: bboxOf(rings),
  });
}
if (unassigned.length) throw new Error(`English districts with no hub:\n${unassigned.join('\n')}`);

const REGION_CODE_BY_NAME = Object.fromEntries(regionShapes.map((r) => [norm(r.name), r.code]));
for (const hub of hubs) {
  const ringSets = hub.lads.map((c) => ladRings.get(c));
  const all = ringSets.flat();
  hub.bbox = bboxOf(all);
  const weights = hub.lads.map((c) => {
    const rs = ladRings.get(c);
    const area = rs.reduce((s, r) => s + Math.abs(ringArea(r)), 0);
    return { p: labelPoint(rs), area };
  });
  const total = weights.reduce((s, w) => s + w.area, 0);
  hub.label = [0, 1].map((i) => Math.round(weights.reduce((s, w) => s + w.p[i] * w.area, 0) / total));
  hub.outline = outlinePath(ringSets);
  const onsKey = norm(hub.onsRegion.replace(/^Mixed.*$/, ''));
  hub.region =
    REGION_CODE_BY_NAME[onsKey] ??
    (hub.id === 'blmk' ? REGION_CODE_BY_NAME[norm('East of England')] : null);
  if (!hub.region) throw new Error(`${hub.id}: unknown ONS region "${hub.onsRegion}"`);
  const touched = new Set(hub.lads.map((c) => ladOut.find((l) => l.code === c).region));
  hub.regions = [hub.region, ...[...touched].filter((r) => r !== hub.region)];
}

// ---------- neighbour-aware tones (shared boundary vertices ⇒ adjacent) ----------
const vertexOwners = new Map();
for (const [code, rings] of ladRings)
  for (const r of rings)
    for (const [x, y] of r) {
      const k = `${x},${y}`;
      if (!vertexOwners.has(k)) vertexOwners.set(k, new Set());
      vertexOwners.get(k).add(code);
    }
const ladAdj = new Map([...ladRings.keys()].map((c) => [c, new Set()]));
for (const owners of vertexOwners.values()) {
  if (owners.size < 2) continue;
  for (const a of owners) for (const b of owners) if (a !== b) ladAdj.get(a).add(b);
}

function colour(ids, neighbours, tones) {
  const order = [...ids].sort((a, b) => neighbours(b).size - neighbours(a).size);
  const tone = new Map();
  for (const id of order) {
    const used = new Set([...neighbours(id)].map((n) => tone.get(n)).filter((t) => t !== undefined));
    let t = 0;
    while (used.has(t) && t < tones - 1) t++;
    tone.set(id, t);
  }
  return tone;
}

const ladTone = colour([...ladRings.keys()], (c) => ladAdj.get(c), 5);
for (const l of ladOut) l.tone = ladTone.get(l.code);

const hubAdj = new Map(hubs.map((h) => [h.id, new Set()]));
for (const [a, ns] of ladAdj)
  for (const b of ns) {
    const ha = hubByLad.get(a);
    const hb = hubByLad.get(b);
    if (ha && hb && ha !== hb) hubAdj.get(ha).add(hb);
  }
const hubTone = colour(hubs.map((h) => h.id), (id) => hubAdj.get(id), 5);
for (const h of hubs) {
  h.tone = hubTone.get(h.id);
  h.neighbours = [...hubAdj.get(h.id)];
}

const regionAdj = new Map(regionShapes.map((r) => [r.code, new Set()]));
for (const [a, ns] of ladAdj)
  for (const b of ns) {
    const ra = ladOut.find((l) => l.code === a).region;
    const rb = ladOut.find((l) => l.code === b).region;
    if (ra && rb && ra !== rb) regionAdj.get(ra).add(rb);
  }
const regionTone = colour(regionShapes.map((r) => r.code), (c) => regionAdj.get(c), 4);

const out = {
  version: 1,
  generatedAt: new Date().toISOString().slice(0, 10),
  viewBox: [0, 0, VIEW_W, VIEW_H],
  insets: [{ name: 'Shetland Islands', box: INSET_BOX }],
  sources: {
    boundaries:
      'ONS Local Authority Districts, Regions and Countries (December 2024) Boundaries, ultra generalised (BUC). Open Government Licence v3.0.',
    attribution:
      'Contains OS data © Crown copyright and database right 2024. Contains National Statistics data © Crown copyright and database right 2024.',
    hubs: 'Arts Council England, Music Hub Investment Programme: Hub Lead Organisations (published May 2024).',
    hubsUrl:
      'https://www.artscouncil.org.uk/sites/default/files/2024-05/Music%20Hub%20Investment%20Programme%20-%20Hub%20Lead%20Organisations.xlsx',
  },
  nations: nationShapes.map((n) => ({
    code: n.code,
    name: n.name,
    d: pathFromRings(n.rings),
    bbox: bboxOf(n.rings),
    label: labelPoint(n.rings),
  })),
  regions: regionShapes.map((r) => ({
    code: r.code,
    name: r.name,
    d: pathFromRings(r.rings),
    bbox: bboxOf(r.rings),
    label: labelPoint(r.rings),
    tone: regionTone.get(r.code),
  })),
  hubs,
  lads: ladOut,
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, JSON.stringify(out));
const kb = (JSON.stringify(out).length / 1024).toFixed(0);
console.log(`Wrote ${OUT} (${kb} KB): ${hubs.length} hubs, ${ladOut.length} districts, ${regionShapes.length} regions`);
for (const h of hubs.filter((x) => x.region === REGION_CODE_BY_NAME[norm('East of England')]))
  console.log(`  EoE  ${h.name}  [${h.lads.length} districts]  lead: ${h.leadOrganisation}`);
