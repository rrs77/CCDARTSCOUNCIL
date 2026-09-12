/**
 * Same-repo The Facts loader.
 * Fetches gzip+base64 bundle from this repo, gunzips, and evals.
 * Does not fetch from any external repository.
 */
(async function loadTheFactsBundle() {
  async function fetchText(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error("Failed to fetch " + url + ": " + res.status);
    return res.text();
  }
  function base64ToUint8Array(b64) {
    const bin = atob(b64.replace(/\s+/g, ""));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  async function gunzipBytes(bytes) {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("DecompressionStream is required to load The Facts bundle");
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    const buf = await new Response(stream).arrayBuffer();
    return new TextDecoder("utf-8").decode(buf);
  }
  try {
    const b64 = await fetchText("./the-facts-bundle.b64");
    const js = await gunzipBytes(base64ToUint8Array(b64));
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
