# Editing “The facts”

**All user-facing copy, stats, captions, sources, chart series, and cluster order live in [`facts.content.ts`](./facts.content.ts).**

## To change a headline or paragraph
Edit the matching field on a cluster in `clusters`, or the shared strings in `meta`.

## To add or change a key fact tile
Add/edit an object in `stats`, then reference its `id` from a cluster’s `statIds` (and from the overview if it should stay prominent).

## To change a chart number or caption
Edit the chart object in `charts` (`caption`, `sourceNote`, `series`). The canvas reads these — do not bury copy inside chart React components.

## To move topics on the map
Edit each cluster’s `x` and `y` world coordinates in `clusters`. That is the Prezi landscape — not a slide index.

## To reorder the suggested journey path
Edit the `journey` array (ordered cluster ids). Users can still tap any heading freely.

## To add a new cluster
1. Add a `ClusterDef` to `clusters` with a unique `id`, grid `x`/`y`, and copy.
2. Append the id to `journey` if it belongs on the path.
3. Optionally add charts/stats and reference them by id.

## Optional on-screen keys
Open with `?edit=1` to show content keys beside on-screen blocks (local only — not a CMS).

## Rules
- Verify numbers against CLA / Ofqual / DfE (or omit).
- “No entries” ≠ “not taught”.
- Use “aims to”, not “will solve”.
- Organisation logos remain demonstration-only.
