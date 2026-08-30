#!/usr/bin/env node
/**
 * Read-only snapshot of the live CCDesigner Supabase account for the
 * prototype/demo seed. Fetches all content tables (GET requests only —
 * nothing is ever written to the live database) and saves them as raw rows
 * in src/data/demoSnapshot.json. Running it again simply overwrites the
 * snapshot, so repeat runs never create duplicates.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const URL_BASE =
  process.env.VITE_SUPABASE_URL || "https://wiudrzdkbpyziaodqoog.supabase.co";
const KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdWRyemRrYnB5emlhb2Rxb29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzgxNzcsImV4cCI6MjA2NjUxNDE3N30.LpD82hY_1wYzroA09nYfaz13iNx5gRJzmPTt0gPCLMI";

const TABLES = [
  "activities",
  "lessons",
  "lesson_plans",
  "lesson_stacks",
  "activity_stacks",
  "year_groups",
  "custom_categories",
  "category_groups",
  "custom_objective_year_groups",
  "custom_objective_areas",
  "custom_objectives",
  "activity_custom_objectives",
  "half_terms",
  "eyfs_statements",
  // Includes year_group_sections (EYFS/KS1 nesting) for the prototype seed.
  "branding_settings",
];

const PAGE = 1000;

async function fetchAll(table) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const res = await fetch(
      `${URL_BASE}/rest/v1/${table}?select=*&order=created_at.asc.nullslast`,
      {
        headers: {
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
          Range: `${from}-${from + PAGE - 1}`,
        },
      },
    );
    if (!res.ok) {
      throw new Error(`${table}: HTTP ${res.status} ${await res.text()}`);
    }
    const chunk = await res.json();
    rows.push(...chunk);
    if (chunk.length < PAGE) break;
  }
  return rows;
}

const snapshot = { fetchedAt: new Date().toISOString(), tables: {} };
for (const table of TABLES) {
  try {
    snapshot.tables[table] = await fetchAll(table);
    console.log(`${table}: ${snapshot.tables[table].length} rows`);
  } catch (err) {
    console.error(`FAILED ${table}: ${err.message}`);
    snapshot.tables[table] = [];
  }
}

// Strip fields that must never ship in a public demo bundle.
for (const rows of Object.values(snapshot.tables)) {
  for (const row of rows) {
    delete row.user_id;
  }
}

// Extract embedded base64 images to static files so the seed fits in
// localStorage. The seeder prefixes these paths with the app base URL.
const mediaDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "demo-media",
);
mkdirSync(mediaDir, { recursive: true });
for (const row of snapshot.tables.activities) {
  const link = row.image_link;
  if (typeof link === "string" && link.startsWith("data:")) {
    const match = link.match(/^data:image\/(\w+);base64,(.*)$/s);
    if (!match) {
      row.image_link = "";
      continue;
    }
    const ext = match[1] === "jpeg" ? "jpg" : match[1];
    const file = `activity-${row.id}.${ext}`;
    writeFileSync(join(mediaDir, file), Buffer.from(match[2], "base64"));
    row.image_link = `__DEMO_MEDIA__/${file}`;
    console.log(`extracted image: ${file}`);
  }
}

const outPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "data",
  "demoSnapshot.json",
);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(snapshot));
console.log(
  `Wrote ${outPath} (${(JSON.stringify(snapshot).length / 1024 / 1024).toFixed(2)} MB)`,
);
