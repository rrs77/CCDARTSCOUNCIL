# UK Music Hubs directory — deploy notes

Branch: `feature/uk-music-hubs-directory`

## What shipped

- Partner Hubs → **MUSIC HUBS** directory (featured EMS, Explore by Area countries, search)
- Hierarchical seed: `artifacts/ccd/src/data/musicHubsDirectory.seed.json`
- Routes: `/music-hubs`, `/music-hubs/*`, legacy `/ems` + `/triborough` preserved
- Clean aliases: `/essex/chelmsford` (public) and `/essex/chelmsford/admin` (hub admin)
- EMS: interactive Essex district map (lazy-loaded) + district pages
  - Paths from **ONS Local Authority Districts (December 2024) Boundaries UK BUC** (Open Geography / OGL v3.0; contains OS data © Crown copyright)
  - Assets: `artifacts/ccd/public/music-hubs/essex/essex-districts.svg` (+ per-district SVGs); rebuild via `node artifacts/ccd/scripts/build-essex-districts-svg.mjs`
- Resource access: FREE / EXTERNAL / SUBSCRIBER with server unlock APIs
- Per-hub editable templates (`HubPageTemplate`) with pencil → modal drafts
- Content approval workflow (draft → pending → published / changes requested / rejected)
- Hub area assignment via Settings → Users → **Manage Access** (extends existing users; no Hub login accounts)

## Routes

| URL | Who | What |
|-----|-----|------|
| `/music-hubs` | signed-in | Directory root |
| `/music-hubs/<path>` | signed-in | Hub / district template (published content) |
| `/essex/chelmsford` | signed-in | Alias → Chelmsford district page |
| `/essex/<district>/admin` | hub admin / system admin | Permission-gated admin dashboard |
| `/ems/admin` | hub admin / system admin | EMS node admin (bare `/ems` stays Partner Hub) |
| `/music-hubs/<path>/admin` | hub admin / system admin | Same dashboard via long path |

`/admin` is **not** security by itself. Access = logged-in user + Music Hub assignment (or system admin role). Unauthorized users see: *You do not have permission to administer this page.*

## Approval flow

1. Hub editor opens public page or `/…/admin`, edits via pencils → **draft** (live unchanged).
2. **Submit for approval** → `pending_approval`.
3. Settings → Admin → **Hub content** (system admin / superuser): **Approve & Publish**, **Request Changes**, or **Reject**.
4. Editors cannot approve their own submissions.
5. Audit trail stored with revisions (`ccd-music-hub-content-v1` localStorage; API/DB migration later).

States: `draft` | `pending_approval` | `published` | `changes_requested` | `rejected` | `archived`.

## Hub admin assignment

- Settings → Users → ⋮ Actions → **Manage Access**
- Multi-select hubs/districts; option **EMS + all Essex areas** (inherit children)
- **My Hub Administration** shortcuts appear in Settings for assigned users
- Reuses CCDesigner profiles/roles — no separate HubUser accounts
- Content links reuse Activity / Lesson stack / pack / `MusicHubResource` ids (no HubActivity duplicates)

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

1. Seed JSON + localStorage overlays (directory status, content revisions, hub assignments) are source of truth for this prototype.
2. When merging hub-admin from `feature/user-mgmt-download-tracking`, map nodes → `organisations` / `hub_pages` / `hub_memberships` and replace overlays with DB.
3. Move subscriber hashes from env JSON into org-scoped DB columns.
4. Do **not** duplicate org rows for Featured — keep `featured` flag on the node.
5. Hierarchy parent changes remain central (system) admin only.

## Tests

```bash
node --test api/__tests__/musicHubUnlock.test.mjs
node --test artifacts/ccd/src/config/musicHubsDirectory.test.mjs
node --test artifacts/ccd/src/config/musicHubRoute.test.mjs
```

## SPA rewrite

Existing `vercel.json` already sends non-API paths to `index.html`, so `/music-hubs/*` and `/essex/*` work without extra rewrites.
