/**
 * Same-repo The Facts loader.
 * Fetches gzip+base64 bundle parts from this repo, concatenates, gunzips, and evals.
 * Does not fetch from any external repository.
 * Optional partN.fix files (lines "index:char") correct known MCP transcription errors.
 */
(async function loadTheFactsBundle() {
  const PART_COUNT = 112;
  const PART_BASE = "./bundle-parts/part";

  async function fetchText(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) {
      throw new Error("Failed to fetch " + url + ": " + res.status);
    }
    return res.text();
  }

  async function fetchOptionalText(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) return null;
    return res.text();
  }

  function applyFixes(text, fixText) {
    if (!fixText) return text;
    const chars = text.split("");
    for (const line of fixText.split(/\n+/)) {
      const t = line.trim();
      if (!t) continue;
      const colon = t.indexOf(":");
      if (colon < 0) continue;
      const idx = Number(t.slice(0, colon));
      const ch = t.slice(colon + 1);
      if (!Number.isFinite(idx) || ch.length !== 1) continue;
      chars[idx] = ch;
    }
    return chars.join("");
  }

  function base64ToUint8Array(b64) {
    const bin = atob(b64.replace(/\s+/g, ""));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function gunzipBytes(bytes) {
    if (typeof DecompressionStream !== "undefined") {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
      const buf = await new Response(stream).arrayBuffer();
      return new TextDecoder("utf-8").decode(buf);
    }
    throw new Error("DecompressionStream is required to load The Facts bundle");
  }

  try {
    const parts = [];
    for (let i = 0; i < PART_COUNT; i++) {
      let text = await fetchText(PART_BASE + i + ".b64");
      const fix = await fetchOptionalText(PART_BASE + i + ".fix");
      text = applyFixes(text, fix);
      parts.push(text);
    }
    const b64 = parts.join("");
    const compressed = base64ToUint8Array(b64);
    const js = await gunzipBytes(compressed);
    (0, eval)(js);
  } catch (err) {
    console.error("[the-facts] loader failed", err);
    const root = document.getElementById("root");
    if (root) {
      root.innerHTML =
        '<p style="font-family:system-ui;padding:2rem;color:#b91c1c">Failed to load The Facts. Please refresh.</p>';
    }
  }
})();
