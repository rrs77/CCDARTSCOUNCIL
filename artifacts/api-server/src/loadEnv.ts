import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function parseEnv(contents: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key) out[key] = val;
  }
  return out;
}

function applyEnvFile(filePath: string, override: boolean) {
  if (!fs.existsSync(filePath)) return;
  const parsed = parseEnv(fs.readFileSync(filePath, "utf8"));
  for (const [key, val] of Object.entries(parsed)) {
    if (!val) continue;
    if (!override && process.env[key]) continue;
    process.env[key] = val;
  }
}

/**
 * Load repo-root .env files without overwriting a non-empty process env value
 * (so a shell-injected service role key wins) and without applying empty values.
 */
export function loadLocalEnv() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const roots = [
    process.cwd(),
    path.resolve(process.cwd(), "../.."),
    path.resolve(here, "../../.."),
    path.resolve(here, "../../../.."),
  ];
  const seen = new Set<string>();
  for (const root of roots) {
    const envPath = path.resolve(root, ".env");
    if (seen.has(envPath)) continue;
    seen.add(envPath);
    applyEnvFile(envPath, false);
    applyEnvFile(path.resolve(root, ".env.local"), false);
  }
}
