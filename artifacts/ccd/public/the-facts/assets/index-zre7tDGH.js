const PARTS = 28;
const base = new URL("./.bundle-parts/", import.meta.url);
const chunks = await Promise.all(
  Array.from({ length: PARTS }, (_, i) => {
    const name = String(i).padStart(2, "0") + ".b64";
    return fetch(new URL(name, base)).then(async (r) => {
      if (!r.ok) throw new Error("bundle part " + name + " " + r.status);
      return (await r.text()).replace(/\s+/g, "");
    });
  })
);
const b64 = chunks.join("");
const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"));
const text = await new Response(stream).text();
(0, eval)(text);
