#!/bin/sh
set -e

REPO_ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if [ "$VITE_USE_SUPABASE_AUTH" = "false" ]; then
  echo "ERROR: VITE_USE_SUPABASE_AUTH=false is not permitted in production builds" >&2
  exit 1
fi

pnpm --filter @workspace/ccd run build

sync_public() {
  dest="$1"
  rm -rf "$dest"
  mkdir -p "$dest"
  cp -R artifacts/ccd/dist/public/. "$dest/"
  # Recorder scratch must never ship (can appear in local dist copies).
  rm -rf "$dest/feature-demo/raw-video"
}

sync_public "$REPO_ROOT/public"

# If Vercel Root Directory was wrongly set to artifacts/api-server, mirror there too.
if [ -d "$REPO_ROOT/artifacts/api-server" ]; then
  sync_public "$REPO_ROOT/artifacts/api-server/public"
fi

MP4="$REPO_ROOT/public/feature-demo/ccdesigner-feature-demo.mp4"
if [ ! -f "$MP4" ]; then
  echo "ERROR: feature demo mp4 missing from build output: $MP4" >&2
  ls -la artifacts/ccd/public/feature-demo/ >&2 || true
  ls -la artifacts/ccd/dist/public/feature-demo/ >&2 || true
  exit 1
fi

echo "feature-demo mp4: $(wc -c < "$MP4") bytes"
du -sh public public/feature-demo 2>/dev/null || true
if [ -d artifacts/api-server/public ]; then
  du -sh artifacts/api-server/public 2>/dev/null || true
fi
