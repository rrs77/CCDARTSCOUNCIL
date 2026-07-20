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
