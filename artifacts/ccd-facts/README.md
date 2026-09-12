# The facts

Evidence canvas for **Creative Curriculum Designer**. It is part of the main CCD app — not a separate product or deploy branch.

## How it ships

A GitHub push that builds CCD also builds this package and copies it to `/the-facts/`:

```
pnpm --filter @workspace/ccd run build
```

`prebuild` runs `build:facts`, which compiles `artifacts/ccd-facts` with `BASE_PATH=/the-facts/` into `artifacts/ccd/public/the-facts`. Vercel (`pnpm -w run build:vercel`) then publishes the CCD app, including The facts.

Live path after deploy: `/the-facts/index.html` (linked from the login hero).

## Edit content

- **Copy source:** `CONTENT.md`
- Editor notes: `CONTENT.README.md`
- Then rebuild the app (`pnpm --filter @workspace/ccd run build`) so `/the-facts/` updates.

## Local

```
pnpm --filter ccd-facts run dev
```
