import { copyFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pitchDir = join(root, "public", "ccd-pitch");
const indexHtml = join(pitchDir, "index.html");
const manifestPath = resolve(root, "..", "ccd-pitch", "src", "data", "slides-manifest.json");

if (!existsSync(indexHtml)) {
  console.error(`Missing ${indexHtml} — run build:pitch first.`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const entries = Array.isArray(manifest) ? manifest : manifest.slides;
const positions = entries.map((s) => s.position).filter((p) => Number.isInteger(p));

if (positions.length === 0) {
  console.error("No slide positions found in manifest.");
  process.exit(1);
}

for (const pos of positions) {
  const dir = join(pitchDir, `slide${pos}`);
  mkdirSync(dir, { recursive: true });
  copyFileSync(indexHtml, join(dir, "index.html"));
}

console.log(`Created ${positions.length} slide fallback pages in public/ccd-pitch/`);
