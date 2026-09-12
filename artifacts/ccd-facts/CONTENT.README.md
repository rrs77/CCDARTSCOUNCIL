## Edit this file to change the presentation

**Single source of copy:** `CONTENT.md` in this folder (`artifacts/ccd-facts`).

This package ships **inside the CCD app**. A GitHub push that builds CCD also rebuilds The facts into `/the-facts/`.

Canvas path: EYFS → Enrichment Framework → Primary → Secondary → GCSE → A-level → Cold spots → HE → Music Hubs → National plans → A solution. Nest supporting material under `###`.

1. Change any heading or paragraph → that text updates after `pnpm --filter @workspace/ccd run build`.
2. Add a new `## Heading` → a new place on the overview.
3. Add `### Nested` under a section → subsection in the detail modal.
4. Use `> quote` for the stage pull-out, `- **stat** — label` for figure tiles, `<!-- chart:id -->` for charts in `src/content/facts.content.ts`.
5. Put footnotes as `[^n]: …` at the end of `CONTENT.md`.
