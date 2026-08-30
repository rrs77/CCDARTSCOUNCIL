# The facts — standalone evidence canvas

Self-contained Prezi-style “The facts” app for **Creative Curriculum Designer**.

**Not merged into CCD / `main` yet.** Work here on branch `cursor/the-facts-interactive-c544`, then fold into CCDesigner later when ready.

## Folder

```
artifacts/ccd-facts
```

## Open in Replit

1. In Replit: **Import from GitHub** → repo `rrs77/CCDARTSCOUNCIL`
2. Branch: `cursor/the-facts-interactive-c544`
3. Set the Repl **root / working directory** to `artifacts/ccd-facts` (this folder)
4. Run (or let `.replit` run): `npm install && npm run dev`
5. App listens on `0.0.0.0:5173`

Import shortcut (GitHub → Replit):  
https://replit.com/github/rrs77/CCDARTSCOUNCIL

After import, switch to branch `cursor/the-facts-interactive-c544` and open `artifacts/ccd-facts` as the project root.

## Edit content

- **Copy source:** `CONTENT.md` (headings, stats, footnotes, chart markers)
- Notes for editors: `CONTENT.README.md`
- No monorepo install required — this package pins its own npm versions

## Scripts

| Command | What it does |
|--------|----------------|
| `npm run dev` | Vite dev server (host `0.0.0.0`, port `5173`) |
| `npm run build` | Production build → `dist/public` |
| `npm run serve` | Preview the production build |
| `npm run typecheck` | TypeScript check |

## Later: into CCDesigner

When you are ready to ship into the main CCD app, copy/build this package into CCD (e.g. static `/the-facts/`) on a deliberate merge — **do not merge this PR into `main` until then**.
