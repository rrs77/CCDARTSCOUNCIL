/**
 * Walk the guided path and assert: spaced frames, unique giants, one Teachers.
 * Run from package root: pnpm exec tsx scripts/walk-path.mts
 * (or: node --import tsx scripts/walk-path.mts)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { presentationFromMarkdown } from "../src/content/layoutPresentation.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mdPath = fs.existsSync(path.join(root, "CONTENT.md"))
  ? path.join(root, "CONTENT.md")
  : path.join(process.cwd(), "CONTENT.md");
const md = fs.readFileSync(mdPath, "utf8");
const pres = presentationFromMarkdown(md);

const pathIds = pres.path.filter((p) => p !== "overview");
const errors: string[] = [];

console.log(`Path stops (excl. overview): ${pathIds.length}`);
console.log(`Frames total: ${pres.frames.length}`);
console.log(`Root hubs: ${pres.frames.filter((f) => !f.parentId).length}`);

if (pathIds.length > 48) {
  errors.push(`Path too long (${pathIds.length})`);
}

const giants = new Map<string, string[]>();
for (const f of pres.frames) {
  const g = f.titleGiant.toUpperCase();
  const list = giants.get(g) ?? [];
  list.push(f.id);
  giants.set(g, list);
}
for (const [g, ids] of giants) {
  if (ids.length > 1) {
    errors.push(`Duplicate giant “${g}” on frames: ${ids.join(", ")}`);
  }
}

const teachers = pres.frames.filter((f) => /^teachers$/i.test(f.title));
if (teachers.length !== 1) {
  errors.push(`Expected exactly one Teachers frame, found ${teachers.length}`);
}

for (const id of pathIds) {
  const f = pres.frames.find((x) => x.id === id);
  if (!f) {
    errors.push(`Missing frame ${id}`);
    continue;
  }
  if (!f.titleGiant) errors.push(`${id}: empty giant title`);
  if (f.kind !== "sources" && !f.sentence && !f.quote && !f.heroStat && !f.chartId) {
    errors.push(`${id}: no sentence/stat/chart`);
  }
  if (f.photoHero && f.heroStat) {
    errors.push(`${id}: both photo and stat hero`);
  }
  if (f.childIds.length > 4) {
    errors.push(`${id}: ${f.childIds.length} children (max 4)`);
  }
  for (const otherId of pathIds) {
    if (otherId === id) continue;
    const o = pres.frames.find((x) => x.id === otherId)!;
    const dx = f.x + f.w / 2 - (o.x + o.w / 2);
    const dy = f.y + f.h / 2 - (o.y + o.h / 2);
    const dist = Math.hypot(dx, dy);
    if (dist < 1000) {
      errors.push(`${id} too close to ${otherId} (dist ${Math.round(dist)})`);
    }
  }
}

// Hub title must not be reused by a child (TEACHERS / ACCESS duplication class of bugs)
for (const hub of pres.frames.filter((f) => !f.parentId)) {
  for (const cid of hub.childIds) {
    const ch = pres.frames.find((f) => f.id === cid)!;
    if (ch.title.trim().toLowerCase() === hub.title.trim().toLowerCase()) {
      errors.push(`Child ${cid} reuses hub title “${hub.title}”`);
    }
  }
}

const photoHubs = pres.frames.filter((f) => f.photoHero && !f.parentId);
const crops = new Set(photoHubs.map((f) => f.photoCrop));
console.log(`Photo hubs: ${photoHubs.length}, distinct crops: ${crops.size}`);

if (errors.length) {
  console.error("FAIL\n" + errors.slice(0, 40).join("\n"));
  process.exit(1);
}
console.log("PASS — lean path, spaced frames, unique giants, one Teachers");
