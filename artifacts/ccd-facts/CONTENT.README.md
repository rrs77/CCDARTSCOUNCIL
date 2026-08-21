## Edit this file to change the presentation

**Single source of copy:** `artifacts/ccd-facts/CONTENT.md`

Canvas zones follow the key-stage pathway `##` headings (Primary / EYFS–KS2 → Secondary / KS3–KS4 → KS5 / A-level → University / HE → A solution). Nest supporting material under `###` rather than inventing new stats. The **A solution** zone shows a simple product diagram on the pathway (not an exam graph); funding charts stay nested under Music Hubs for the detail modal.

1. Change any heading or paragraph → that text updates after rebuild / `pnpm dev` save.
2. Add a new `## Heading` → a new pathway zone (sized to its content).
3. Add `### Nested` under a section → subsection in the detail modal.
4. Use `> quote` for the stage “Why this matters” pull-out (once per stage), `- **stat** — label` for figure tiles, `<!-- chart:id -->` for charts defined in `src/content/facts.content.ts` (prefer one chart comment at the `##` level).
5. Put footnotes under `## Sources` as `[^n]: …`.

No code changes are required to add a section — edit `CONTENT.md`, then rebuild.

