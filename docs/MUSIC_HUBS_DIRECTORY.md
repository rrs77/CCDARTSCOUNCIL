# UK Music Hubs directory — deploy notes

Branch: `feature/uk-music-hubs-directory`

## What shipped

- Partner Hubs → **MUSIC HUBS** directory (featured EMS, Explore by Area countries, search)
- Hierarchical seed: `artifacts/ccd/src/data/musicHubsDirectory.seed.json`
- Routes: `/music-hubs`, `/music-hubs/*`, legacy `/ems` + `/triborough` preserved
- EMS: interactive Essex district map (lazy-loaded) + district pages
- Resource access: FREE / EXTERNAL / SUBSCRIBER with server unlock APIs
- Admin overlay panel (admins) + password hash API

## Vercel env

| Variable | Purpose |
|----------|---------|
| `MUSIC_HUB_UNLOCK_SECRET` | HMAC secret for session unlock tokens (falls back to `SUPABASE_JWT_SECRET`) |
| `MUSIC_HUB_SUBSCRIBER_HASHES` | JSON map `{"ems":"scrypt$salt$hash",...}` |
| `MUSIC_HUB_ADMIN_TOKEN` | Bearer token for `/api/music-hubs/admin/password` |
| `MUSIC_HUB_ALLOW_DEMO_PASSWORD=1` | Optional local/demo only |
| `MUSIC_HUB_DEMO_PASSWORD` | Demo unlock password when flag set |

### Generate a hash

```bash
node -e "const {randomBytes,scryptSync}=require('crypto'); const s=randomBytes(16); const h=scryptSync('YOUR_PASSWORD',s,64); console.log('scrypt$'+s.toString('hex')+'$'+h.toString('hex'))"
```

Set `MUSIC_HUB_SUBSCRIBER_HASHES={"ems":"<hash>"}`.

## Migration path

1. Seed JSON is source of truth today (`musicHubsDirectory.ts` + localStorage overlay for admin status/featured).
2. When merging hub-admin from `feature/user-mgmt-download-tracking`, map nodes → `organisations` / `hub_pages` and replace overlay with DB.
3. Move subscriber hashes from env JSON into org-scoped DB columns (collection override column reserved, unused in UI).
4. Do **not** duplicate org rows for Featured — keep `featured` flag on the node.

## Tests

```bash
node --test api/__tests__/musicHubUnlock.test.mjs
node --test artifacts/ccd/src/config/musicHubsDirectory.test.mjs
```

## SPA rewrite

Existing `vercel.json` already sends non-API paths to `index.html`, so `/music-hubs/*` works without extra rewrites.
