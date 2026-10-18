# CURSOR MASTER PROMPT — CCDesigner “Studio Score” redesign

**Project:** CCDesigner / Rhythmstix / The Melting Pot  
**Task:** Introduce a premium, quiet, visually spacious teacher workspace using the approved **Studio Score** visual direction, while **preserving every current feature, data relationship and Hub workflow**.  
**Status:** This is an implementation brief. The attached Studio Score HTML is an **illustrative front-end reference**, not application code or a specification of existing DB structures.  
**Non-negotiable:** Do **not** deploy, merge to `main`, modify production data, or redesign the existing Hub map implementation without owner approval.

## FIRST: read and inspect — do not start coding immediately

Read in full:

1. `docs/CCD_AGENT_HANDOFF.md` — **authoritative handoff**, including branch protections, demo mode, Supabase, and Hub status.
2. `docs/design/partner-hubs-2026/START_HERE.md`
3. `docs/design/partner-hubs-2026/CURSOR_PROMPT.md`
4. `docs/design/partner-hubs-2026/UK_MAP_PROMPT.md`
5. `docs/design/partner-hubs-2026/STAGE_3_REPORT.md`
6. `docs/design/partner-hubs-2026/previews/*.png`, if available.
7. The existing files identified by the handoff: `artifacts/ccd/src/components/Dashboard.tsx`, `OurPartners.tsx`, `hubsPreview/PartnerHubsPreview.tsx`, `UkHubMap.tsx`, `partnerDirectory.ts`, `ManageHubDialog.tsx`, and related Planner/Library/Builder components discovered in code.
8. Existing Supabase types, lesson/activity/unit/planner schemas, RLS rules, Vercel API routes and tests. **Do not assume names or structures beyond what the code demonstrates.**
9. The two user-approved Studio Score screenshot references and `CCDesigner_Studio_Score_Clean_Mockup.html` supplied with this brief. Treat their layout, spacing and colour direction as design guidance. The HTML uses mock lesson data and does not connect to Supabase.

**Before coding, provide a concise written audit** that inventories every existing accessible view, action, menu item, permission, route, export, demo restriction, event and database dependency. Categorise each as `preserve as-is`, `move in navigation`, `reskin`, or `future concept`. Include a before/after navigation and feature mapping. Identify genuinely missing information rather than guessing.

## Product intent

CCDesigner is a **national connected arts-education ecosystem** for Music, Drama, Dance and the wider creative curriculum, not merely a timetable program. The product promise is **“Exceptional lessons start with a connection.”**

**Partner Hubs are its defining value proposition:** teachers can navigate a national Music Hub directory and a parallel arts-organisation directory, find resources, bring appropriately accessible material into their own Activity Library, turn activities into lessons and units, and assign lessons to teaching schedules. The core workflow remains:

`Discover / Partner Hubs → save resource → Activity Library → Lesson Builder / stacks → units / curriculum → Planner → reflection / reuse`

The UI should look intentionally minimal while keeping all the depth of the working platform. **Clarity means progressive disclosure, not deleting functionality.**

## Creative direction: “Studio Score”

Match the supplied reference image's *feeling*: airy five-day teaching week, concise lesson cards, sunny accents, confident typography, warm pastel tints and generous negative space. The screenshot is a styling reference—not a request to reduce functionality to the few elements depicted.

### Tokens

| Role | Colour | Hex |
|---|---|---|
| Dark ink/sidebar/text | Ink | `#1F1B4D` |
| Primary interactive accent | Indigo | `#4338E8` |
| Warm highlight / brand symbol | Sun | `#FFC93C` |
| Main teacher workspace | Lilac | `#F4F3FA` |
| Lesson / category tint | Mint | `#D5F3EA` |
| Warm lesson / category tint | Sun tint | `#FFF1C2` |
| Additional selected-day tint | Soft lavender | `#E5E2FF` |
| Card surface | White | `#FFFFFF` |
| Subtle border | Pale lilac | `#E2E0EF` |
| Quiet supporting text | Muted | `#77738F` |

Typography: **Bricolage Grotesque** for expressive editorial headings; **Plus Jakarta Sans** for long-form reading, forms, labels and controls. Audit licences and loading strategy; provide resilient system-font fallback and ensure no layout shift makes controls unusable. Do not ship font binaries unnecessarily.

Suggested tokens and layout: 14–20px rounded corners; restrained 1px borders; almost invisible shadows; clearly differentiated focus states; minimum 44px touch targets on mobile; strong text contrast; reduced-motion support. Avoid gradients, floating stat cards, thick containers, excessive labels, gratuitous animations, or colour as the only means of distinguishing statuses.

### Brand coherence with the existing Hubs work

**Do not overwrite the forest-and-teal Partner Hubs design in a blanket reskin.** Existing Partner Hubs tokens include forest ink `#002D24`, teal `#14B8A6` / `#0B6B5F`, and sage `#FBFCFB` / `#EEF3EF`. Preserve its map, layout design kit and role-dependent UI. Studio Score becomes the **outer teacher workspace shell** and planner/lesson surfaces; use intentional bridges between indigo navigation and internally forest/teal Hub content. Whether Hubs should eventually adopt the whole new palette is a **separate design decision**, not part of this change.

## Highest priority: the quiet Planner

### First-visit composition at ~1440px width

- Slim but clearly legible ink-coloured left sidebar, with CCDesigner name and Rhythmstix credit. Navigation includes a **prominent Partner Hubs item**, then Planner, Lesson Builder, Activity Library, Curriculum/Units, and a single “More tools” access point for the remaining capabilities.
- When Planner is active, it may be highlighted without displacing Hubs' prominent discovery position. **Don't rename the entire product “Planner”.**
- Spacious lilac content surface; editorial but restrained title **“Week planner”**.
- Right side of heading: only **“This week”** and **“+ New lesson”**.
- Next row: back/forward week, date range, a single **View** chooser (Day / Week / Month / Half-term / Year / Units), and a compact overflow menu.
- **Five flexible equal-width day columns**. No permanent right-side dashboard, inspector, activity tray, metrics column or “coming up next” panel.
- Day header: large date, short weekday. Highlight the actual current day softly in lavender; yellow Today tag. Do not use a false Today label in production.
- Lesson cards: white, fine stroke, soft radius; tiny time pill; class/subject as a high-contrast title; lesson description; enough vertical breathing space. Colour should be tied to real subject/class status where supported and remain accessible.
- Cards open a contextual **right-hand drawer** only when clicked. Do **not** truncate critical information without providing access on keyboard, touch or click.
- Empty slot: a light dotted “+ Add lesson”, not a large competing card.
- The main Planner should use available width fluidly and adapt to screen size. No artificial 1000px cap on the active weekly grid. At narrower widths, use a purposeful tablet/mobile layout, not unreadably narrow columns.

### Visibility principle

Visible immediately: title, date navigation, view, create lesson, timetable itself.  
Available on demand: timetable settings, class filters, day/month/term/year views, units, export, sharing, duplicates, resource links, reflections, lesson notes, attachments, curriculum mappings, advanced search, Hub resources and AI.  
Advanced management: separate role-gated settings/drawers/pages, **never mixed into the week-view surface**.

Use drawers, sensible overflow menus, searchable tools, and a command palette **only where they genuinely improve access**. Avoid hiding frequently used controls behind several clicks. Provide one-click access to the normal daily actions, and discoverable keyboard alternatives. Tooltips must not be the sole means of understanding a control.

### Planner details and workflows

- Clicking a lesson opens a drawer with **Overview | Activities | Resources | Curriculum | Reflection**; retain all existing fields/actions and real relationships, mapping rather than replacing them.
- Drawer actions include Edit and optionally **✦ Polish with AI**; include existing duplicate, move, share, print/export or relevant operations where they actually exist. Keep these under a concise More menu if necessary, but map each existing action.
- A week change must preserve scheduling invariants, term exceptions, classes and recurring timetable rules. Audit before refactoring.
- Reusing an existing lesson must never silently overwrite the source. Clear copy, move, replace and undo semantics.
- Support the full range of existing lesson/planner navigation and previously built academic-year/half-term operations. No destructive changes to saved data.
- Do not invent “taught” statuses merely because a lesson appears on a timetable.

## Hub experience — the unique CCDesigner feature

**Do not rebuild, regress, flatten or replace the existing UK map and Partner Hubs architecture.** Make the existing experience easily discoverable from every part of the application, with a coherent transition to the quiet shell. Hub staff keep an obvious route to their administration tools where permissions allow.

Canonical hierarchy from the handoff:

`Partner Hubs → Nation → England region → parent Music Hub → ONS Local Authority District → resources/about/contact`

**Arts organisations are parallel** to Music Hubs, not nested under them. Maintain real naming and relationships: Greater Essex Music Hub is a parent partnership; Essex Music Service is its Hub Lead Organisation; Music-on-Sea and Thurrock Music Service are partner services, not additional parent Music Hubs.

East of England must show **exactly five parent Hubs**: Greater Essex, Hertfordshire, Cambridgeshire & Peterborough, Norfolk & Suffolk, BLMK. The handoff describes 43 national Hubs, 361 local areas, and 14 Greater Essex local areas; verify these counts against code/seed at current branch tip instead of assuming dates or screenshots are authoritative.

Keep the working components, data layer, access controls and role-based management. Honour existing URL switches, including `?hubs=classic`, `?hubs=preview`, `?page=browse|hub|area`, and `view=about|contact|events`; note that **Dashboard owns `?tab=`**, so do not hijack that key. Preserve back/forward/deep links and existing classic rollback.

### Critical integrity boundaries

- `relationship_status` (`directory_listing` / `demonstration` / `confirmed_contributor`) **is not** resource `access_level` (`free` / `access_code` / `subscription` / `external_link`). Display accurately.
- Preserve `hub_memberships` and the hierarchy `hub_viewer < hub_editor < hub_publisher < hub_administrator`, using existing functions and RPCs.
- Restricted URLs stay in `resource_private_locations`, not general `resources` SELECT; continue authorising via `/api/music-hubs/resource-access`. Do not expose locked URLs to the browser before authorisation.
- Preserve draft/publish/approval/history, role permissions, reach reporting, access-code workflows, Hub branding and resource attribution. Only allow actions when the corresponding existing permission grants them.
- Current implemented engagement events are **viewed** and **added_to_library**. Do not render other events (`placed_in_lesson`, `assigned_to_planner`, `taught_reflected`) as real until genuinely wired and verified. No fabricated teaching impacts or contributor claims.
- Preserve existing suppressed reach reporting for groups under three teachers.
- CPD and events should retain honest empty states when no provider-backed data exists. No invented courses or dates.

## Lesson Studio and optional “Polish with AI”

The Activity Library and Lesson Builder are core working features. Keep their activity-to-lesson/stacks-to-unit relationships and existing edit/reorder/save/share/export functions. **Don't replace the current builder with an AI-only editor.**

Introduce **Polish with AI** as an *optional* action from the Lesson Builder / lesson drawer, not a large persistent dashboard widget. The interaction should be:

1. Teacher builds or opens a lesson as usual.
2. Teacher explicitly clicks “✦ Polish with AI.”
3. Show the intended inputs/data that will be shared with the AI; avoid sensitive pupil details and respect privacy.
4. Display **proposed changes as a diff or before/after**, grouped into: sequencing/transitions, learning objectives and “I can” statements, differentiation / inclusion, pacing, and optional Rhythmstix export formatting.
5. Teacher can accept individual proposals, all proposals, or none; original preserved until approved. Provide undo/version history and clear cost/rate-limit/error messaging.
6. Suggestions never silently change resource licences, Hub attribution, original provider text, lesson schedule, curriculum standards or underlying teacher library.
7. AI endpoint, model, price per request, caching, quotas and privacy/security review are **future implementation decisions** until explicitly approved. First implement the interface safely using a stub that is unmistakably labelled **preview**, with no real model calls or token spending.
8. AI is never required for ordinary planner operations or document export. Avoid automatic background requests as users drag/drop, type or navigate.

## Every function stays accessible

Do not interpret the sparse left navigation as removal of these features. Discover their exact existing implementation and expose them via contextual controls and a structured **More tools** page or search where appropriate:

- Planner, recurring schedule, academic year, classes/year-group settings, timetable management.
- Activity Library, activity blocks, import/save/adapt, partner resources and source attribution.
- Lesson Library, Lesson Builder, lessons/stacks, unit planning, lesson sharing and reuse.
- Partner Hubs, UK map, Hub/area/arts-organisation pages, contact/about, search/filter, member administration, resource gating and usage tracking.
- Existing teacher–provider forum and contact tools.
- Curriculum objectives EYFS–KS5, teacher-written objectives/“I can”, subject/year-group filtering and curriculum links.
- Existing print, export, PDF/Word possibilities, sharing and demo limitations; do not promise features not yet delivered.
- Existing analytics, profiles, roles, settings, premium/entitlement checks, moderation, security and accessibility behaviour.
- Reflections and assessment connections **only to the extent actually implemented**; identify proposed additions separately. Assessify/ProgressPath integration is not implied to be complete by their inclusion in a design.

**Required deliverable:** a screen-by-screen feature preservation matrix showing *old route/component/action → new route/surface/action → preserved behaviour and permission → test*.

## Responsive, accessible and professional

Review at **1440, 1280, 768 and 390px**. At 1440 and 1280, show a legible full five-day timetable. At 768, consider gentle horizontal scrolling with visible affordance or focused day navigation; at 390 use day cards/list plus a compact week/date switcher; do not display tiny five-column text. Mobile Hub area selection must retain the working bottom sheet (`.ccd-sheet-up`).

Provide proper focus management when opening/closing dialogs, ESC/back handling, keyboard controls, semantic labels, accessible contrast, loading/empty/error states and visible user feedback. Respect `prefers-reduced-motion`. Support touch without hover-only features. Prevent horizontal document overflow.

### Implementation discipline and safe branch workflow

Repo: `rrs77/CCDARTSCOUNCIL` / workspace `artifacts/ccd`. Tech: React 18 + TypeScript + Vite + Tailwind + Radix + Lucide; Supabase Auth/Postgres/Storage/RLS; Vercel serverless API router; **pnpm only**.

- Start from the current **`design/partner-hubs-uk-map`** state after inspecting branch tip and local changes. Do **not** overwrite or discard uncommitted changes. For Studio Score work, create a *separate feature branch* from the appropriate reviewed branch point, e.g. `design/studio-score-ux`, if safe to do so. **Do not merge to `main`**.
- Stage 1 should be a **UI-only redesign**. Reuse data hooks, stores, components, server endpoints, permissions and routes. Avoid database migrations entirely unless a genuinely necessary field is explicitly justified and approved.
- Shared Supabase project reference in handoff: `wiudrzdkbpyziaodqoog`. If migrations ever become necessary, they must be **additive only** and must first undergo `supabase db push --dry-run`, a destructive-SQL scan, explicit owner approval, and RLS review. Never DROP/TRUNCATE/DELETE existing entities or weaken RLS.
- Keep demo mode entirely off the live DB: `isDemoModeActive()` selects the localStorage mock. No production resource/private URL leakage, no real demo writes.
- Production Vercel deploys only from `main`. Work goes to a feature preview branch; do not push, merge or deploy without explicit user approval. If later authorised to publish the feature branch, share its Vercel preview URL and rollback instructions.
- Preserve the `OurPartners` classic route and rollback setting.
- Use design tokens, not scattered literal colours. Keep stable, modular components and mobile-specific layouts rather than a broad Dashboard rewrite.
- Never invent Hub partnerships, verified contributor levels, resource inventory, lesson teaching status, CPD dates, people, grants or analytics results.

### Acceptance tests — run before requesting approval

Run and report actual outcomes (no invented “passed” claims):

```bash
pnpm install --frozen-lockfile
pnpm -w run typecheck
cd artifacts/ccd && npx tsc --noEmit -p . && npx vite build
cd ../.. && pnpm -w run build:vercel
pnpm -w test:api
```

Test through the **actual working app**, not the HTML mock-up:

1. Demo gate → demo mode, then verify zero live Supabase requests/writes; open ordinary teacher navigation.
2. Go to Partner Hubs via persistent navigation; navigate UK → East of England (five parent Hubs) → Greater Essex (14 areas) → Chelmsford → a real permitted resource → View and add to Activity Library. Confirm the original workflow survives.
3. Hub staff role checks; access-code and locked-resource failures/successes; draft/publish; original classic toggle; deep links and browser back.
4. Create/save/edit/reorder an activity; build a lesson/stack; attach valid resource; add it to a unit; assign to Planner; revisit and export/print according to existing capabilities. Data remains intact.
5. Verify Day, Week, Month, Half-term, Year, and Unit views **where actually implemented**; newly proposed views must be identified and tested separately without claiming they existed before.
6. Open/close lesson drawer, keyboard escape, Focus return, edit/duplicate/move behaviours, no data loss, responsive layout.
7. Polish with AI preview is explicit, opt-in, never calls a real AI service or spends tokens, and never mutates original lesson data without confirmation.
8. Existing class/year-group, contact, forum and other tools remain discoverable within one or two clear steps.
9. Screenshots and manual or Playwright checks at 1440, 1280, 768, 390px, light mode; note contrast and overflow issues.
10. Zero console `pageerror`s on core journeys; no React key/warning errors, no broken links or regressions.

## Work in reviewable phases

**Phase 0 — Audit only:** branch, repo and migration state; complete feature/access matrix; risks; existing components worth reusing; proposed route mapping. Do not edit code until audit is reviewed.

**Phase 1 — Design system + shell:** CSS tokens, typography, high-quality left nav with Partner Hubs prominent, contextual/More tools access, responsive foundation. Keep routes and internals wired as they already are.

**Phase 2 — Quiet Planner:** full-width week layout, day/card spacing, view switch, drawers, compact top actions; use real data; no unapproved schema changes.

**Phase 3 — Lesson workflows:** better organisation for Lesson Builder, Activity Library, Library, Units and optional *scripted* Polish with AI UX; preserve actual features.

**Phase 4 — Hubs integration & regression:** visually harmonise outer shell, reuse internal forest/teal Partner Hubs, verify map, directory, admin, gated resources, demo routing, classic rollback and analytics protections.

**Phase 5 — Quality gate:** tests, accessibility, 4 responsive screenshots, old/new feature checklist, zero-error journeys, documented preview / rollback; await approval before push/merge to production.

## Final design acceptance criteria

**A teacher opening Planner should see almost nothing except their own teaching week.** A teacher seeking rich controls should find them effortlessly. A teacher needing inspiration should immediately recognise **Partner Hubs** as CCDesigner's central differentiator. Every existing feature and control must remain available and functional, without making the interface busy. This is a complete experience redesign, not a data migration or a rewrite of working Hub functionality.

### What to return after each implementation phase

- What was audited and what actually changed, with paths/components.
- Feature preservation checklist and any genuine gaps.
- Actual commands/tests run and their pass/fail results.
- Screenshots at desktop and mobile widths.
- Remaining risks, including permissions, demo mode or usability.
- Branch and preview information **only if a preview has actually been created**.
- Explicit statement that **`main` and the live Supabase data were not changed** unless authorised.

**Start with Phase 0 and show the inventory/plan for approval before coding.**
