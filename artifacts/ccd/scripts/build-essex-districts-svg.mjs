#!/usr/bin/env node
/**
 * Build accurate Essex district SVG paths from ONS LAD GeoJSON.
 *
 * Prefers Generalised (BGC) source with Douglas–Peucker simplification for
 * coastline fidelity at map scale; falls back to Ultra Generalised (BUC).
 *
 * Source: ONS Local Authority Districts (December 2024) Boundaries UK BGC/BUC
 * Licence: Open Government Licence v3.0 (OGL) — Contains OS data © Crown copyright
 *          and database right; Contains National Statistics data © Crown copyright
 *          and database right.
 *
 * Usage: node artifacts/ccd/scripts/build-essex-districts-svg.mjs
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public/music-hubs/essex');
const SRC_BGC = join(OUT_DIR, 'essex-districts-source-bgc.geojson');
const SRC_BUC = join(OUT_DIR, 'essex-districts-source.geojson');
const TS_OUT = join(ROOT, 'src/components/musicHubs/essexDistrictPaths.ts');

const VIEW_W = 720;
const VIEW_H = 560;
const PAD = 18;
/** Simplification tolerance in Web-Mercator units used by this script (~map metres proxy). */
const SIMPLIFY_TOLERANCE = 0.012;
/** Drop island rings smaller than this share of the district’s largest ring area. */
const MIN_RING_AREA_RATIO = 0.002;

/** Map ONS LAD24NM → app slug */
const SLUG_BY_NAME = {
  Basildon: 'basildon',
  Braintree: 'braintree',
  Brentwood: 'brentwood',
  'Castle Point': 'castle-point',
  Chelmsford: 'chelmsford',
  Colchester: 'colchester',
  'Epping Forest': 'epping-forest',
  Harlow: 'harlow',
  Maldon: 'maldon',
  Rochford: 'rochford',
  Tendring: 'tendring',
  Uttlesford: 'uttlesford',
};

function mercator([lon, lat]) {
  const x = ((lon + 180) / 360) * 1000;
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(Math.PI / 4 + latRad / 2)) / Math.PI) / 2) * 1000;
  return [x, y];
}

function ringArea(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return a / 2;
}

function ringCentroid(ring) {
  let cx = 0;
  let cy = 0;
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    cx += (ring[j][0] + ring[i][0]) * f;
    cy += (ring[j][1] + ring[i][1]) * f;
    a += f;
  }
  a *= 0.5;
  if (Math.abs(a) < 1e-12) {
    const xs = ring.map((p) => p[0]);
    const ys = ring.map((p) => p[1]);
    return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  }
  return [cx / (6 * a), cy / (6 * a)];
}

function polygonsFromGeometry(geometry) {
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  throw new Error(`Unsupported geometry: ${geometry.type}`);
}

function projectRing(ring, project) {
  return ring.map((c) => project(c));
}

function perpendicularDistance(point, a, b) {
  const [x, y] = point;
  const [x1, y1] = a;
  const [x2, y2] = b;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    const ex = x - x1;
    const ey = y - y1;
    return Math.hypot(ex, ey);
  }
  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  const px = x1 + t * dx;
  const py = y1 + t * dy;
  return Math.hypot(x - px, y - py);
}

/** Douglas–Peucker; keeps first/last (closed rings must re-close after). */
function simplifyOpen(points, tolerance) {
  if (points.length <= 2) return points.slice();
  let maxDist = 0;
  let index = 0;
  const end = points.length - 1;
  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > maxDist) {
      index = i;
      maxDist = d;
    }
  }
  if (maxDist > tolerance) {
    const left = simplifyOpen(points.slice(0, index + 1), tolerance);
    const right = simplifyOpen(points.slice(index), tolerance);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[end]];
}

function simplifyRing(ring, tolerance) {
  if (ring.length < 4) return ring;
  const closed =
    ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1];
  const open = closed ? ring.slice(0, -1) : ring.slice();
  const simplified = simplifyOpen(open, tolerance);
  if (simplified.length < 3) return ring;
  const out = simplified.slice();
  out.push(out[0]);
  return out;
}

function pathFromProjectedPolygons(polygons, round = 1) {
  const fmt = (n) => Number(n.toFixed(round));
  const parts = [];
  for (const poly of polygons) {
    for (const ring of poly) {
      if (!ring.length) continue;
      const [x0, y0] = ring[0];
      parts.push(`M${fmt(x0)} ${fmt(y0)}`);
      for (let i = 1; i < ring.length; i++) {
        const [x, y] = ring[i];
        parts.push(`L${fmt(x)} ${fmt(y)}`);
      }
      parts.push('Z');
    }
  }
  return parts.join('');
}

function main() {
  const useBgc = existsSync(SRC_BGC);
  const srcPath = useBgc ? SRC_BGC : SRC_BUC;
  const sourceLabel = useBgc
    ? 'ONS Local Authority Districts (December 2024) Boundaries UK BGC (generalised), simplified for SVG'
    : 'ONS Local Authority Districts (December 2024) Boundaries UK BUC (ultra generalised)';

  const geo = JSON.parse(readFileSync(srcPath, 'utf8'));
  if (!geo.features?.length) throw new Error('No features in source GeoJSON');

  const districts = [];
  for (const feature of geo.features) {
    const name = feature.properties.LAD24NM;
    const code = feature.properties.LAD24CD;
    const slug = SLUG_BY_NAME[name];
    if (!slug) throw new Error(`Unexpected LAD name: ${name}`);

    const polys = polygonsFromGeometry(feature.geometry);
    let projected = polys.map((poly) => poly.map((ring) => projectRing(ring, mercator)));

    if (useBgc) {
      projected = projected.map((poly) =>
        poly.map((ring) => simplifyRing(ring, SIMPLIFY_TOLERANCE)),
      );
      // Drop tiny rings (noise from simplification / tiny islets) relative to largest exterior
      const exteriors = projected.map((poly) => Math.abs(ringArea(poly[0])));
      const maxExterior = Math.max(...exteriors, 0);
      projected = projected
        .map((poly) =>
          poly.filter((ring, idx) => {
            const area = Math.abs(ringArea(ring));
            if (idx === 0) return area >= maxExterior * MIN_RING_AREA_RATIO;
            return area >= maxExterior * MIN_RING_AREA_RATIO;
          }),
        )
        .filter((poly) => poly.length > 0);
    }

    let best = null;
    let bestAbs = 0;
    for (const poly of projected) {
      const exterior = poly[0];
      const area = Math.abs(ringArea(exterior));
      if (area > bestAbs) {
        bestAbs = area;
        best = ringCentroid(exterior);
      }
    }

    districts.push({
      slug,
      name,
      code,
      projected,
      label: best,
    });
  }

  if (districts.length !== 12) {
    throw new Error(`Expected 12 districts, got ${districts.length}`);
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const d of districts) {
    for (const poly of d.projected) {
      for (const ring of poly) {
        for (const [x, y] of ring) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
  }

  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const scale = Math.min((VIEW_W - PAD * 2) / spanX, (VIEW_H - PAD * 2) / spanY);
  const offsetX = PAD + ((VIEW_W - PAD * 2) - spanX * scale) / 2;
  const offsetY = PAD + ((VIEW_H - PAD * 2) - spanY * scale) / 2;

  const toSvg = ([x, y]) => [offsetX + (x - minX) * scale, offsetY + (y - minY) * scale];

  const mapped = districts
    .map((d) => {
      const svgPolys = d.projected.map((poly) => poly.map((ring) => ring.map(toSvg)));
      const [lx, ly] = toSvg(d.label);
      return {
        slug: d.slug,
        name: d.name,
        code: d.code,
        d: pathFromProjectedPolygons(svgPolys),
        labelX: Number(lx.toFixed(1)),
        labelY: Number(ly.toFixed(1)),
        pointCount: svgPolys.reduce(
          (n, poly) => n + poly.reduce((m, ring) => m + ring.length, 0),
          0,
        ),
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));

  mkdirSync(OUT_DIR, { recursive: true });

  // Persist a compact derived GeoJSON for repos that prefer not to commit full BGC
  if (useBgc) {
    const compact = {
      type: 'FeatureCollection',
      name: 'essex-districts-derived',
      crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
      properties: {
        source: sourceLabel,
        licence: 'OGL v3.0',
        note: 'Coordinates remain WGS84; geometry vertices reduced via Douglas–Peucker after mercator projection for SVG build. This file is the committed BUC-scale stand-in regenerated from BGC.',
      },
      features: geo.features.map((feature) => {
        const name = feature.properties.LAD24NM;
        const slug = SLUG_BY_NAME[name];
        const d = districts.find((x) => x.slug === slug);
        // Reverse mercator approx for archival lon/lat (optional skip — keep original simplified in SVG only)
        return {
          type: 'Feature',
          properties: {
            LAD24CD: feature.properties.LAD24CD,
            LAD24NM: name,
            slug,
          },
          geometry: feature.geometry,
        };
      }),
    };
    // Keep BUC file as lightweight committed source; do not overwrite with full BGC
    void compact;
  }

  const svgPaths = mapped
    .map(
      (d) =>
        `  <path id="${d.slug}" data-district="${d.slug}" data-ons-code="${d.code}" d="${d.d}"/>`,
    )
    .join('\n');

  const combined = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  Essex district / borough boundaries for EMS Music Hub map.
  Source: ${sourceLabel}
  https://geoportal.statistics.gov.uk/ (Open Geography)
  Licence: Open Government Licence v3.0 — Contains OS data © Crown copyright
  and database right; Contains National Statistics data © Crown copyright
  and database right.
  Generated by artifacts/ccd/scripts/build-essex-districts-svg.mjs
-->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}" role="img" aria-label="Map of Essex districts">
  <title>Essex districts</title>
  <g fill="#FFFFFF" stroke="#002D24" stroke-width="1.2" stroke-linejoin="round">
${svgPaths}
  </g>
</svg>
`;

  writeFileSync(join(OUT_DIR, 'essex-districts.svg'), combined);

  for (const d of mapped) {
    const feature = geo.features.find((f) => SLUG_BY_NAME[f.properties.LAD24NM] === d.slug);
    const polysRaw = polygonsFromGeometry(feature.geometry).map((poly) =>
      poly.map((ring) => projectRing(ring, mercator)),
    );
    let polys = useBgc
      ? polysRaw.map((poly) => poly.map((ring) => simplifyRing(ring, SIMPLIFY_TOLERANCE)))
      : polysRaw;
    let dMinX = Infinity;
    let dMinY = Infinity;
    let dMaxX = -Infinity;
    let dMaxY = -Infinity;
    for (const poly of polys) {
      for (const ring of poly) {
        for (const [x, y] of ring) {
          dMinX = Math.min(dMinX, x);
          dMinY = Math.min(dMinY, y);
          dMaxX = Math.max(dMaxX, x);
          dMaxY = Math.max(dMaxY, y);
        }
      }
    }
    const pad = 8;
    const w = 200;
    const h = 160;
    const s = Math.min((w - pad * 2) / (dMaxX - dMinX), (h - pad * 2) / (dMaxY - dMinY));
    const ox = pad + ((w - pad * 2) - (dMaxX - dMinX) * s) / 2;
    const oy = pad + ((h - pad * 2) - (dMaxY - dMinY) * s) / 2;
    const localToSvg = ([x, y]) => [ox + (x - dMinX) * s, oy + (y - dMinY) * s];
    const localPolys = polys.map((poly) => poly.map((ring) => ring.map(localToSvg)));
    const pathD = pathFromProjectedPolygons(localPolys);
    const one = `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${sourceLabel} · OGL v3.0 · ${d.name} (${d.code}) -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${d.name}">
  <path id="${d.slug}" data-district="${d.slug}" data-ons-code="${d.code}" fill="#FFFFFF" stroke="#002D24" stroke-width="1.5" stroke-linejoin="round" d="${pathD}"/>
</svg>
`;
    writeFileSync(join(OUT_DIR, `${d.slug}.svg`), one);
  }

  const tsClean = `/**
 * Accurate Essex district SVG path data for the EMS Music Hub map.
 *
 * Source: ${sourceLabel}
 * Open Geography Portal — https://geoportal.statistics.gov.uk/
 * Licence: Open Government Licence v3.0 (OGL).
 * Contains OS data © Crown copyright and database right.
 * Contains National Statistics data © Crown copyright and database right.
 *
 * Regenerated by: node artifacts/ccd/scripts/build-essex-districts-svg.mjs
 * Do not hand-edit path \`d\` strings — re-run the builder from the GeoJSON source.
 */

import type { EssexDistrictSlug } from '../../config/musicHubsDirectory';

export const ESSEX_MAP_VIEWBOX = '0 0 ${VIEW_W} ${VIEW_H}' as const;

export type EssexDistrictPath = {
  slug: EssexDistrictSlug;
  name: string;
  /** ONS LAD24CD */
  onsCode: string;
  d: string;
  labelX: number;
  labelY: number;
};

export const ESSEX_DISTRICT_PATHS: EssexDistrictPath[] = [
${mapped
  .map(
    (d) =>
      `  {\n    slug: '${d.slug}',\n    name: '${d.name}',\n    onsCode: '${d.code}',\n    d: '${d.d}',\n    labelX: ${d.labelX},\n    labelY: ${d.labelY},\n  }`,
  )
  .join(',\n')}
];
`;

  writeFileSync(TS_OUT, tsClean);

  const totalPts = mapped.reduce((n, d) => n + d.pointCount, 0);
  console.log(`Source: ${useBgc ? 'BGC+simplify' : 'BUC'} (${srcPath})`);
  console.log(`Wrote ${mapped.length} districts, ${totalPts} vertices →`);
  console.log(`  ${join(OUT_DIR, 'essex-districts.svg')}`);
  console.log(`  ${TS_OUT}`);
  console.log(`  ${OUT_DIR}/<slug>.svg (×${mapped.length})`);
  console.log('Slugs:', mapped.map((d) => d.slug).join(', '));
}

main();
