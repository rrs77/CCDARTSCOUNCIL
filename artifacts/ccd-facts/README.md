# The facts — evidence canvas for Creative Curriculum Designer

Prezi-style evidence overview shipped as part of the **CCD Cursor / Vercel** deployment at `/the-facts/`.

Edit here in the monorepo; the CCD build copies the production bundle into the live site. **No separate Replit project.**

## Live URL

After Vercel / Cursor deploy of this repo:

`https://ccdesigner.co.uk/the-facts/index.html`

(Use `index.html` so the SPA rewrite does not swallow the path.)

## Folder

```
artifacts/ccd-facts
```

## Develop (Cursor / monorepo)

From the repo root:

```bash
pnpm install
pnpm --filter ccd-facts run dev
```

Or rebuild into CCD’s static tree (what production uses):

```bash
pnpm --filter @workspace/ccd run build:facts
```

Full production static export (includes Facts):

```bash
pnpm -w run build:vercel
```

## Edit content

- **Copy source:** `CONTENT.md` (headings, stats, footnotes, chart markers)
- Editor notes: `CONTENT.README.md`
- Chart series: `src/content/facts.content.ts`

## Scripts

| Command | What it does |
|--------|----------------|
| `pnpm run dev` | Vite dev server (port `5173`) |
| `pnpm run build` | Production build → `dist/public` |
| `pnpm run typecheck` | TypeScript check |

## How it reaches production

`artifacts/ccd` `prebuild` / `build:facts` builds this package with `BASE_PATH=/the-facts/` and copies it to `artifacts/ccd/public/the-facts`. Root `scripts/vercel-build.sh` then publishes CCD (including `/the-facts/`) to Vercel’s `public/` output.
