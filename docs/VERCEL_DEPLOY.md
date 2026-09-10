# Vercel deploy

Static export for production is produced by `scripts/vercel-build.sh` into repo-root `public/` (see `vercel.json` `outputDirectory`).

## Project settings (dashboard)

| Setting | Value |
| --- | --- |
| **Root Directory** | Blank / repository root (`.`) — **not** `artifacts/api-server` |
| **Build Command** | From `vercel.json`: `pnpm -w run build:vercel` |
| **Output Directory** | `public` |
| **Install Command** | `pnpm install --frozen-lockfile` |

## Critical: do not gitignore `public/`

Vercel skips Output Directory paths that match `.gitignore`. If `/public` (or similar) is ignored, the build can create a large `public/` folder and still fail with **No Output Directory named public**.

- `public/` is build-only — **do not commit** it.
- After changing `.gitignore` or `vercel-build.sh`, **Redeploy** (new deployment from the fixed commit).

## Local / CI notes

- Build: `pnpm -w run build:vercel`
- Clean local artifact: `rm -rf public artifacts/api-server/public`
- The build script also mirrors to `artifacts/api-server/public` as a fallback if Root Directory was set incorrectly; fix Root Directory in the dashboard rather than relying on that mirror.
