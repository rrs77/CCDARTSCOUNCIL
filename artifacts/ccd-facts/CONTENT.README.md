## Edit this file to change the presentation

**Single source of copy:** `artifacts/ccd-facts/CONTENT.md`

The live experience is one connected Prezi-style canvas: Overview shows every section as a place; arrows / Map travel with camera zoom along title → Primary → Secondary → GCSE → A-level → HE → Hubs → Solution → Sources. Nest supporting material under `###`. **A solution** uses its product illustration (not an exam graph); funding charts stay under Music Hubs for the detail modal.

Section circular heroes live in `public/illustrations/` and are mapped in `src/content/sectionIllustrations.ts`. The classroom photo (`hero-arts.jpg`) is **only** for the opening title / The situation. Sources lists principal footnotes on the frame (no filler CCD circle). One Info control per focused place opens the landscape detail modal.

1. Change any heading or paragraph → that text updates after rebuild / `pnpm dev` save.
2. Add a new `## Heading` → a new place on the canvas (sized to its content).
3. Add `### Nested` under a section → subsection in the detail modal.
4. Use `> quote` for the stage “Why this matters” pull-out (once per stage), `- **stat** — label` for figure tiles, `<!-- chart:id -->` for charts defined in `src/content/facts.content.ts` (prefer one chart comment at the `##` level).
5. Put footnotes under `## Sources` as `[^n]: …`.

No code changes are required to add a section — edit `CONTENT.md`, then rebuild.
