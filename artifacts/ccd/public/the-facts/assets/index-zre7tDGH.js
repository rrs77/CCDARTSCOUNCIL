const PARTS = 28;
const base = new URL("./.bundle-parts/", import.meta.url);
const [chunkList, patchJson] = await Promise.all([
  Promise.all(
    Array.from({ length: PARTS }, (_, i) => {
      const name = String(i).padStart(2, "0") + ".b64";
      return fetch(new URL(name, base)).then(async (r) => {
        if (!r.ok) throw new Error("bundle part " + name + " " + r.status);
        return (await r.text()).replace(/\s+/g, "");
      });
    })
  ),
  fetch(new URL("patches.json", base)).then(async (r) => (r.ok ? r.json() : {})),
]);
const chunks = chunkList.map((text, i) => {
  const ops = patchJson[String(i)];
  if (!ops || !ops.length) return text;
  let s = text;
  for (let k = ops.length - 1; k >= 0; k--) {
    const [tag, i1, i2, rep] = ops[k];
    s = s.slice(0, i1) + rep + s.slice(i2);
  }
  return s;
});
const b64 = chunks.join("");
const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"));
const text = await new Response(stream).text();
(0, eval)(text);
