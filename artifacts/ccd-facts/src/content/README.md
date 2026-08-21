# Editing “The facts”

**To change a headline, edit [`facts.content.ts`](./facts.content.ts).**  
(`content.ts` re-exports the same module.)

All user-facing copy, stats, captions, sources, chart series, journey order, map positions, and chrome labels live in that one file. Adding a fact or cluster is adding an object — not editing the Prezi canvas React code.

## Shape

| Export | Purpose |
| --- | --- |
| `meta` | Title (`titleLead`/`titleAccent`), subtitle, date, CCD framing, hero beat, experience name, `ui` chrome strings |
| `journey` | Ordered cluster ids (suggested path) |
| `clusters` | Topics: `id`, `x`/`y`, `title`, `investorLine`, `body`, `whyThisMattersForCCD`, `sourceIds`, optional `chartIds` / `statIds` |
| `stats` | Key-finding tiles: `id`, `label`, `value`, `unit?`, `footnote`, `sourceId`, `zoomClusterId?` |
| `overviewStatIds` | Which stats appear on the overview (investor glance) |
| `charts` | Chart defs: `type`, `series`, `caption`, `sourceNote`, `axis` labels, colours |
| `sources` | Citation register |

## Common edits

- **Headline / paragraph** → `meta` or `clusters[n]`
- **Key fact tile** → add/edit in `stats`, then include its id in `overviewStatIds` and/or a cluster’s `statIds`
- **Chart number or caption** → `charts[id]` (`series`, `caption`, `sourceNote`, `axis`)
- **Map layout** → cluster `x` / `y`
- **Journey order** → `journey` array
- **Buttons / chrome** → `meta.ui`

## New cluster checklist

1. Add a `ClusterDef` object to `clusters`
2. Append its `id` to `journey` if it belongs on the path
3. Optionally add `charts` / `stats` and reference them by id

## Optional on-screen keys

Open with `?edit=1` to show content keys beside on-screen blocks (local only — not a CMS).

## Rules

- Verify numbers against CLA / Ofqual / DfE (or omit)
- “No entries” ≠ “not taught”
- Use “aims to”, not “will solve”
- Organisation logos remain demonstration-only
