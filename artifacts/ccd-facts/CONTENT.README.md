# Edit this file to change the presentation

**Single source of copy:** `artifacts/ccd-facts/CONTENT.md`

Every heading, comment, stat label, and pull-out on the canvas and in detail modals comes from that Markdown file. There is no in-canvas editor.

1. Change any heading or paragraph → that text updates after rebuild / `pnpm dev` save.
2. Add a new `## Heading` → a new main canvas section appears (sized to its content).
3. Add `### Nested` under a section → a nested path stop (and subsection in the detail modal).
4. Use `> quote` for lime pull-outs, `- **stat** — label` for figure tiles, `<!-- chart:id -->` for charts defined in `src/content/facts.content.ts`.
5. Put footnotes under `## Sources` as `[^n]: …`.

No code changes are required to add a section — edit `CONTENT.md`, then rebuild.
