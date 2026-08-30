---
name: CCD demo mode architecture
description: How Preview/Demo mode stays isolated from live Supabase and how seeding/reset works
---

# CCD demo mode

Rule: in demo mode the app must never construct the real Supabase client. `config/supabase.ts` picks a localStorage-backed mock at module evaluation time, so the demo flag (`sessionStorage["ccd-demo-mode"]`) must already be set before any module runs — an inline script in `index.html` handles direct `?demo=1` loads; the demo buttons set it before navigating.

**Why:** the safety guarantee "no demo write ever reaches live Supabase" is enforced structurally (mock client), not by scattered runtime checks; a late-set flag would silently create the real client.

**How to apply:**
- Any new demo entry point must set the flag before page load/navigation, never after React mounts.
- `api.ts` fail-closed guards require a UUID-shaped user id; demo sessions use a fixed synthetic UUID, and the mock store ignores `user_id` filters (single-tenant, per-browser).
- Reset semantics: seeding is idempotent per session (sessionStorage marker) and wipes all demo-owned localStorage (prefix-based: `demo-db-`, `lesson-data-`, `half-terms-`, …) before reseeding, so new sessions always start pristine even after an unclean exit.
- `clearDemoMode()` wipes keys real signed-in users also use locally — only call it when the session actually was a demo.
- Demo snapshot data is a build-time copy (`scripts/fetch-demo-snapshot.mjs` → `src/data/demoSnapshot.json`); re-running the script overwrites (no duplicates). Large base64 images are extracted to `public/demo-media/`.
