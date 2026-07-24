# Archived Feature Walkthrough slides

These slides are **not** in the active `slides-manifest.json` sequence.

To restore a slide later:
1. Move the `.tsx` file back to `src/pages/slides/`
2. Add an entry to `src/data/slides-manifest.json` with a contiguous `position`
3. See also `src/data/slides-archive.json` for titles and archive reasons
4. Rebuild with `pnpm --filter @workspace/ccd run build:pitch`
