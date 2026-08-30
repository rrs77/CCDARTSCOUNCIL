#!/bin/sh
set -e

if [ "$VITE_USE_SUPABASE_AUTH" = "false" ]; then
  echo "ERROR: VITE_USE_SUPABASE_AUTH=false is not permitted in production builds" >&2
  exit 1
fi

pnpm --filter @workspace/ccd run build
rm -rf public
mkdir -p public
cp -R artifacts/ccd/dist/public/. public/

# Recorder scratch must never ship (can appear in local dist copies).
rm -rf public/feature-demo/raw-video

MP4="public/feature-demo/ccdesigner-feature-demo.mp4"
if [ ! -f "$MP4" ]; then
  echo "ERROR: feature demo mp4 missing from build output: $MP4" >&2
  ls -la artifacts/ccd/public/feature-demo/ >&2 || true
  ls -la artifacts/ccd/dist/public/feature-demo/ >&2 || true
  exit 1
fi

echo "feature-demo mp4: $(wc -c < "$MP4") bytes"
du -sh public public/feature-demo 2>/dev/null || true
