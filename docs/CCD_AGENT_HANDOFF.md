# CCDesigner — complete agent handoff guide

**Audience:** another AI agent (e.g. Grok) taking over this codebase.  
**Owner / product:** Rob Reich-Storer · Rhythmstix / The Melting Pot · Creative Curriculum Designer (CCD).  
**Repo:** https://github.com/rrs77/CCDARTSCOUNCIL  
**Active design branch:** `design/partner-hubs-uk-map`  
**Production branch:** `main` (live Vercel deploy only from main — do not merge without explicit approval).

Read this whole file before changing anything. Prefer facts in the repo over inventing architecture.

---

## 1. What the product is

**Creative Curriculum Designer (CCD)** is a free national arts planning platform for UK schools. Mission line: *“Exceptional lessons start with a connection.”*

Teachers plan Performing Arts (Music, Drama, Dance) lessons: activities → lessons → units → planner/timetable. Partner Hubs connect them to Music Hubs, arts organisations and teaching resources that can be brought into the Activity Library / Lesson Builder / Planner.

Users include: busy non-specialist teachers, specialist arts teachers, Music Hub / arts-org administrators, and Arts Council England stakeholders viewing a gated prototype.

**Never rename the product to “Planner”.** Branding normalisation replaces “Planner” → “Designer” in settings.

---

## 2. Hard safety rules (non-negotiable)

These come from the product owner and apply to every session:

1. **Live app deploys only from `main`.** Feature work stays on a branch with a **Vercel preview**. Do not push to main or merge without explicit approval.
2. **Same Supabase project** (`wiudrzdkbpyziaodqoog`). Migrations must be **additive only**: new tables and columns; never DROP / TRUNCATE / DELETE of activities, lessons, categories, entitlements, or existing columns. Never weaken RLS.
3. Before any `supabase db push`: dry-run, scan for destructive SQL, then apply only if approved / previously approved.
4. **Demo mode** must never hit the live DB (`isDemoModeActive()` swaps the Supabase client for a localStorage mock). Keep that invariant.
5. The app must **work completely with no errors** (typecheck, build, API tests, no console pageerrors on key journeys).
6. Do not invent partner relationships, premium status, “taught” delivery claims, or fabricated resources. Use real empty states.
7. Locked resource URLs must **not** be readable via normal `resources` SELECT; they live in `resource_private_locations` (service role only) and are released via `/api/music-hubs/resource-access`.

---

## 3. Repo layout

```
CCDesignerARTSCOUNCIL/          # pnpm workspace monorepo
├── artifacts/
│   ├── ccd/                    # MAIN APP (Vite + React + Tailwind)
│   ├── ccd-pitch/              # Pitch deck (built into ccd public)
│   ├── ccd-facts/              # “The facts” microsite
│   ├── ccd-promo/              # Promo / Dreamhost embed
│   └── api-server/             # Historical / fallback; production API is repo-root api/
├── api/                        # Vercel serverless functions (≤12 deployable; use router)
│   ├── router.js               # Single entry; rewrites from vercel.json
│   ├── _authShared.js          # JWT, profiles, rate limit, audit
│   ├── _hubShared.js           # Hub membership checks
│   ├── _resourceAccess.js      # Access-code crypto + decideResourceAccess
│   └── __tests__/              # node:test suite → pnpm test:api
├── server/api/                 # Handlers imported by api/router.js (music-hubs/*, hubs/*, …)
├── supabase/
│   ├── migrations/             # Numbered SQL; CLI needs numeric prefix
│   └── tests/                  # e.g. partner_directory_rls.sql
├── docs/                       # Deploy notes + design kits
│   ├── VERCEL_DEPLOY.md
│   ├── design/partner-hubs-2026/   # Partner Hubs redesign kit + Stage 3 report
│   └── CCD_AGENT_HANDOFF.md    # THIS FILE
├── vercel.json                 # Build + API rewrites
└── package.json                # Workspace scripts
```

**Package manager:** pnpm only (preinstall rejects npm/yarn).

---

## 4. Stack & how to run

| Layer | Tech |
| --- | --- |
| Frontend | Vite, React 18, TypeScript, Tailwind, Radix, Lucide, react-hot-toast |
| Data | Supabase (Postgres + Auth + Storage + RLS) |
| API | Vercel serverless (`api/router.js` + `server/api/**`) |
| Hosting | Vercel — Root Directory = repo root, output `public/` |

### Commands

```bash
# Install
pnpm install --frozen-lockfile

# Main app locally
cd artifacts/ccd && pnpm dev
# or: PORT=5199 npx vite --config vite.config.ts --port 5199 --host 127.0.0.1

# Typecheck / build
pnpm -w run typecheck
cd artifacts/ccd && npx tsc --noEmit -p . && npx vite build
pnpm -w run build:vercel          # production static export → public/

# API unit tests
pnpm -w test:api                  # expect 101+ passing

# Migrations (linked CLI; additive only)
supabase db push --dry-run
supabase db push
supabase migration list
```

### Prototype gate (Arts Council demo)

- Gate password: `artscouncil26` (`PrototypeGate.tsx`)
- Demo: “Explore the working prototype” → password → demo mode (`?demo=1`)
- Demo uses localStorage mock DB; Partner Hubs directory falls back to `directorySeed.json`

### Partner Hubs URL switches (branch `design/partner-hubs-uk-map`)

| Query / env | Effect |
| --- | --- |
| (default on this branch) | New redesigned Partner Hubs |
| `?hubs=classic` | Classic `OurPartners` page |
| `VITE_PARTNER_HUBS=classic` | Classic for whole deployment |
| `?hubs=preview` or `?page=browse\|hub\|area` | Opens Partner Hubs tab (deep link) |
| `?page=hub&at=england/east-of-england/greater-essex` | Greater Essex hub |
| `?page=area&at=…/chelmsford` | Local area page |
| `view=about\|contact\|events` | Hub tab (note: **not** `tab=` — Dashboard owns `?tab=`) |

---

## 5. Application mental model

### Dashboard tabs (`Dashboard.tsx`)

Planner / timetable · Lesson Library · Lesson Builder · Activity Library · **Partner Hubs** · Contact. Year-group / class context lives in header settings.

### Core teacher flow

1. Browse/create **activities** (Activity Library)
2. Compose **lessons** / stacks (Lesson Builder)
3. Assign to **planner** / half-terms
4. Optional: print / export (gated in demo)

### Partner Hubs flow (redesign)

UK map / search → region → **Music Hub** → local authority (LAD) → resources → “View and add” → Activity Library / lesson stepper. Parallel browse: **Arts organisations** (not nested under hubs).

Canonical hierarchy:

```
Partner Hubs
  → Nation (England / Scotland / Wales / NI)
  → England region
  → Music Hub (parent partnership)
  → Local area (ONS LAD)
  → Resources / about / contact
Arts organisations = parallel section
```

**Naming:** “Greater Essex Music Hub” = parent hub; “Essex Music Service” = Hub Lead Organisation; Music-on-Sea and Thurrock Music Service = partner services — not three national hubs.

---

## 6. Auth, roles, organisations

- Supabase Auth + `profiles` (`role`, `status`, `can_manage_users`, …)
- Hub staff via `hub_memberships` on an **organisation** id:  
  `hub_viewer` < `hub_editor` < `hub_publisher` < `hub_administrator`
- Functions: `is_super_admin()`, `user_hub_role()`, `user_has_hub_role()`, `hub_role_rank()`
- Partner directory maps hub → org via `music_hubs.organisation_id`; role lookup RPC: `music_hub_role(p_hub)`
- Greater Essex demo org id: **`ems`**

Grant hub access (SQL):

```sql
insert into public.hub_memberships (organisation_id, user_id, role)
values ('ems', '<user uuid>', 'hub_publisher')
on conflict (organisation_id, user_id)
do update set role = excluded.role, updated_at = now();
```

---

## 7. Partner Hubs redesign — current state (Oct 2026)

**Status:** Stages 1–3 delivered on branch `design/partner-hubs-uk-map`. Migrations applied to shared Supabase. Vercel preview builds succeeded. **Not merged to main.**

### Key docs

| File | Purpose |
| --- | --- |
| `docs/design/partner-hubs-2026/START_HERE.md` | Kit entry |
| `docs/design/partner-hubs-2026/CURSOR_PROMPT.md` | Master product prompt |
| `docs/design/partner-hubs-2026/UK_MAP_PROMPT.md` | Map quality brief |
| `docs/design/partner-hubs-2026/STAGE_3_REPORT.md` | What shipped, admin steps, limitations |
| `docs/design/partner-hubs-2026/previews/*.png` | Screenshots 1440/1280/768/390 |

### Key code

| Path | Role |
| --- | --- |
| `artifacts/ccd/src/components/hubsPreview/PartnerHubsPreview.tsx` | UI + URL routing + map/list/search |
| `artifacts/ccd/src/components/hubsPreview/UkHubMap.tsx` | SVG map |
| `artifacts/ccd/src/components/hubsPreview/ukHubMapData.ts` | Geometry index (`uk-hub-map.json`) |
| `artifacts/ccd/src/components/hubsPreview/partnerDirectory.ts` | Data layer (DB + bundled seed), engagement, codes, drafts |
| `artifacts/ccd/src/components/hubsPreview/directorySeed.json` | Source of truth for demo + seed generator |
| `artifacts/ccd/src/components/hubsPreview/ManageHubDialog.tsx` | Draft / approve / history / reach / access codes |
| `artifacts/ccd/src/components/hubsPreview/hubsPreviewContent.ts` | Org brands, disciplines, organisation cards |
| `artifacts/ccd/src/components/OurPartners.tsx` | Classic page (kept behind switch) |
| `artifacts/ccd/scripts/build-hub-directory-seed.mjs` | Regenerates SQL seed from map + directorySeed.json |
| `supabase/migrations/20261013120000_partner_directory.sql` | Schema + RLS + RPCs |
| `supabase/migrations/20261013120100_partner_directory_seed.sql` | 43 hubs, 361 areas, EMS resources |
| `server/api/music-hubs/{resource-access,redeem-code,access-codes}.js` | Locked resources + codes |
| `api/_resourceAccess.js` | Hashing + `decideResourceAccess` |

### Data rules

- Presentation is **data-driven** — do not hardcode hub-specific UI for Greater Essex beyond relationship badges / featured list driven by `relationship_status`.
- Access level (`free` / `access_code` / `subscription` / `external_link`) ≠ relationship status (`directory_listing` / `demonstration` / `confirmed_contributor`).
- Engagement: only `viewed` and `added_to_library` are wired; never claim “taught”. Reach suppresses groups &lt; 3 teachers.
- East of England must always show **exactly five** parent hubs: Greater Essex, Hertfordshire, Cambridgeshire & Peterborough, Norfolk & Suffolk, BLMK.

### Known gaps / next work

1. Wire `placed_in_lesson` / `assigned_to_planner` / `taught_reflected` engagement events (honest labels only).
2. Area-level editing UI (DB already supports area drafts).
3. CPD & events data source (currently empty state).
4. Confirm contributor agreements; promote hubs from `demonstration` → `confirmed_contributor` when real.
5. TBC lead organisations left as ACE published (owner said leave for now).
6. Merge to main only after owner approval + classic rollback plan.

---

## 8. Design language (Rhythmstix / CCD)

When extending Partner Hubs or branded surfaces:

- Forest ink `#002D24`, teal accent `#14B8A6` / `#0B6B5F`, sage backgrounds (`#FBFCFB`, `#EEF3EF`).
- Partner Hubs font stack: **Aptos** (where installed) → Inter → system (`.ccd-partner-hubs`).
- Prefer calm, Apple-quality hierarchy: one job per section; real empty states; WCAG; responsive **1440 / 1280 / 768 / 390**.
- Mobile: bottom sheet for selected area (`.ccd-sheet-up`); respect `prefers-reduced-motion`.
- Do not invent a purple-on-white marketing theme for Partner Hubs; stay on forest/teal.

Frontend design rules from the owner (summarised): brand-first on marketing surfaces; avoid card soup in heroes; no detached promo badges on hero media; purposeful motion (2–3 intentional), not noise.

---

## 9. API conventions

- Prefer extending `api/router.js` + `server/api/...` over new top-level Vercel functions (function count limit).
- Auth: Bearer JWT; helpers in `_authShared.js` (`requireAuth`, `loadProfile`, `assertRateLimit`, `writeAuditLog`).
- Hub routes: `requireHubAccess` from `_hubShared.js`.
- Music hub access codes: plaintext returned **once** on create; store scrypt hash only.
- Rewrites in `vercel.json` map `/api/music-hubs/:path*` → router.

---

## 10. Testing checklist before you hand work back

1. `npx tsc --noEmit -p artifacts/ccd` clean  
2. `npx vite build` in `artifacts/ccd` succeeds  
3. `pnpm test:api` all green  
4. Manual or Playwright: demo login → Partner Hubs map East of England (5 hubs) → Greater Essex (14 areas) → Chelmsford area → resource sheet → add to library; check `?hubs=classic` still works  
5. Zero console `pageerror`s on those journeys  
6. Screenshots at 390 and 1440 if UI changed  
7. Commit on the feature branch; push; confirm Vercel preview status  
8. **Do not merge to main** unless asked  

Playwright scripts previously lived under `/tmp/pw/` (`journeys.mjs`, `shoot.mjs`, `errs.mjs`) against `http://127.0.0.1:5199/` — recreate locally if needed; they are not committed.

---

## 11. Git & GitHub

```
origin  https://github.com/rrs77/CCDARTSCOUNCIL.git
branch  design/partner-hubs-uk-map   # Partner Hubs redesign (current)
branch  main                        # production
```

Useful commits on the design branch:

- `41e4a55` Stage 1 preview (map, hub/area pages)
- `7b2e840` Additive schema + seed + access API
- `68c804d` Data-driven UI + Manage hub + switch
- `d5b2c01` Stage 3 report

Commit style: short imperative sentences focusing on **why**. Only commit when the user asks. Never force-push main; never amend pushed commits without explicit request. Never update git config.

---

## 12. Owner decisions already made (do not re-ask)

| Topic | Decision |
| --- | --- |
| Logos in prototype | Fine to use |
| TBC leads | Leave for now |
| Font | Aptos OK |
| Stage 2 sequence | Approved and largely shipped |
| Migrations | Approved and applied (additive) |
| Hosting | Branch + Vercel preview; main = live only |
| Same Supabase | Yes, additive only |

---

## 13. How to start a new session

1. `git checkout design/partner-hubs-uk-map && git pull`
2. Read `docs/design/partner-hubs-2026/STAGE_3_REPORT.md` and this file
3. Confirm with the user: goal for this session, stay off `main`, additive DB only
4. Inspect relevant files; prefer small commits on the design branch
5. End with: what changed, how to verify, any risks, preview URL if pushed

---

## 14. Quick glossary

| Term | Meaning |
| --- | --- |
| EMS | Essex Music Service (org id `ems`) |
| ACE | Arts Council England |
| LAD | Local Authority District (ONS code) |
| Hub Lead Organisation | Delivery lead for a Music Hub partnership |
| Working example | `relationship_status = demonstration` |
| Classic Partner Hubs | Pre-redesign `OurPartners` UI |
| Resource scope | Row in `resource_scopes` tying a resource to national/nation/region/hub/area |

---

*Last updated for handoff: October 2026. Prefer verifying branch tip and migration list over trusting dates alone.*
