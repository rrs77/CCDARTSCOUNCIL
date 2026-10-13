# CURSOR MASTER PROMPT — CCDesigner Partner Hubs redesign

You are the lead product designer, senior UX architect, accessibility specialist and full-stack engineer responsible for CCDesigner (Creative Curriculum Designer), part of the Rhythmstix / The Melting Pot platform. Treat this as a careful redesign of an established national-scale education application, NOT a disconnected new feature or a cosmetic reskin. The standard is an exceptionally considered, calm, beautifully refined Apple-quality interface with outstanding practical functionality. The result must be intuitive to a busy non-specialist teacher, a specialist performing arts teacher, and a Music Hub or arts-organisation administrator.

**Core mission:** “Exceptional lessons start with a connection.” CCDesigner is a free national arts planning platform connecting teachers, Music Hubs, cultural organisations, providers and excellent resources so they can be discovered, adapted, planned, delivered and evaluated. Users must be able to move naturally from a provider resource into the Activity Library, Lesson Builder, units and Planner. Organisations should be able to understand the reach and *verified level of use* of their resources without implying that every download equals classroom delivery. Collaboration should reduce duplication of planning and investment and improve access in underserved, rural and coastal areas.

## 0. Reference materials — READ FIRST

These three real screenshots are included in `reference-images/` next to this prompt. Open and analyse each visually before designing:

1. `reference-images/01-current-partner-hubs-overview.png` — current overall Partner Hubs directory: featured EMS, country accordions, premium section, extremely long A–Z arts organisation cards. Problems: tiny typography, weak hierarchy, oversized blank spaces, disconnected sections, excessive scrolling and poor discoverability.
2. `reference-images/02-current-explore-by-area.png` — Scotland accordion example. Problems: generic “instrumental/music service” placeholders, an unexplained additional directory link, mixed actual/demonstration listings, and a hard-to-follow regional model.
3. `reference-images/03-current-greater-essex-hub.png` — EMS/Greater Essex hub details. Problems: the useful interactive Essex map is buried far down; several paragraphs, admin notices, nested lists and district selectors appear before or after the main action; the relationship among the parent Hub, the lead organisation and its local areas is confusing.

The screenshots document the *current problems*, not designs to copy. Keep the useful established elements: Rhythmstix visual identity, partner logos, underlying regional/local data, district mapping, user roles, existing links, settings and working library/planner integrations. Do not imitate any outside website or add a visual bolt-on.

**FIRST RESPONSE / APPROVAL GATE:** Inspect the actual codebase, routes, data model, reusable components, design tokens, auth, admin capabilities, search, image assets, existing map/SVG, and activity/lesson/planner APIs. Present (a) a concise architecture audit, (b) a proposed revised site map, (c) the main user journeys, (d) desktop and mobile *visual design previews/screenshots* for the three key views below, and (e) a sequenced implementation plan including migrations and risks. Create those previews in a safe mock/preview branch or isolated design route. **Do not overwrite the working production UI or perform destructive migrations until I approve the previews.** Once approved, implement fully rather than merely returning design notes.

## 1. Information architecture: one discoverable national system

Use this canonical model (adapt to existing schemas and routes instead of duplicating them):

Partner Hubs / Discover
  → Country / nation
  → England: region
  → Music Hub (regional partnership / parent)
  → Local authority, district or sub-area (where relevant)
  → Resources, CPD, events, contacts and partner information

Arts organisations and specialist providers are a **parallel browse type**, NOT artificially nested under Music Hubs. They can associate with multiple hubs or areas and can share the same resource catalogue through links/tags, never duplicate uploaded master files.

England has the formal Arts Council England Music Hub network. Wales, Scotland and Northern Ireland have their own music education structures; display appropriate “Music services and networks” terminology and VERIFIED organisations, not fictional English-style Hub Lead Organisations. Provide expandable national/region hierarchy without treating temporary placeholders as real providers.

There should be a single source of truth for organisations, Hub Lead Organisations, local services, areas, affiliation, programme scope, published resources, access levels, and verification status. Search, map, area list and page navigation must use the **same records**.

**Crucial distinction:** “Greater Essex Music Hub” is the parent Music Hub; “Essex Music Service” is its lead delivery partner; “Music-on-Sea (Southend)” and “Thurrock Music Service” are other constituent services. Do NOT relabel Essex Music Service alone as the entirety of Greater Essex, and do not list these three services as three separate national Hubs.

## 2. Redesign the national Partner Hubs landing page

The landing page must answer within seconds: “Where is my local hub?”, “Which organisation has teaching resources for me?”, and “How can I put them into my planning?”

Desired composition, designed for a 1280–1440 px browser:

- Keep the established CCDesigner top navigation, logo, year-group context and existing Rhythmstix design language. Use a wider, comfortably constrained content container; eliminate the current narrow column with huge unused side margins.
- H1 **Partner Hubs**; short, purposeful subheading such as: “Explore Music Hubs, arts organisations and teaching resources. Bring the ideas you find straight into your planning.” A restrained display of the existing strapline “Exceptional lessons start with a connection.” is appropriate but not a giant marketing hero.
- One strong, prominent global search: **“Search hubs, places, organisations and resources…”** with grouped suggestions and direct links (e.g. “Chelmsford — local area”, “Greater Essex Music Hub — music hub”, “BBC Ten Pieces — organisation”). Search must not be restricted to the active year group, although a clear “Show resources for KS2 · Year 6” filter can be offered.
- Clean segmented section navigation: **Music Hubs | Arts organisations | Saved** (Saved only when supported by current data/auth). Never force users to scroll through all three content types on one enormous page.
- Under Music Hubs: a clearly titled “Browse by location” country/region explorer. England expands to familiar regions; East of England shows its five parent hub cards directly, without burying them in several confusing accordions. An optional compact UK regional illustration is fine only if genuinely functional; a good searchable list is more important than a decorative map.
- Modest featured Greater Essex area while this is the working demonstrator: one clear card, labelled **“Working example”** or **“Demonstration hub”** as appropriate, with a **“Explore Greater Essex”** button. Do not suggest a signed CCDesigner partnership if one has not been formally confirmed.
- Under Arts organisations: compact, consistent responsive grid (4/3/2/1 columns depending on width), real logos with correct aspect ratios, name, discipline, one-line description and a simple “Explore resources” action. Search and filter by music, drama, dance/performance, age phase, access. Retain A–Z as an optional sort/jump control, NOT 25 headings with empty space or a full-page letter rail. Never fabricate memberships or premium status.
- Separate **access status** (“Free”, “Requires organisation access code”, “Provider subscription”, “External link”) from **partner/relationship status** (“Directory listing”, “Confirmed contributor”, etc.). Do not use “Premium partner” as a claim of endorsement or payment unless backed by real records.

## 3. Fix East of England coverage — NO omissions

Populate the **East of England** region with all **five** relevant current parent Music Hubs, sourced and cross-checked against primary sources:

1. **Greater Essex Music Hub** — Essex, Southend-on-Sea and Thurrock; lead organisation Essex Music Service / Essex County Council.
2. **Hertfordshire Music Hub** — led by Hertfordshire Music Service.
3. **Cambridgeshire and Peterborough Music Education Hub** — Cambridgeshire and Peterborough; led by Cambridgeshire County Council in consortium with Peterborough City Council.
4. **Norfolk & Suffolk Music Hub** — combined hub, led by Norfolk Music Service / Norfolk County Council. **Do not list Norfolk and Suffolk as separate post-2024 parent Hubs.**
5. **Bedfordshire, Luton and Milton Keynes (BLMK) Music Hub** — Bedford Borough, Central Bedfordshire, Luton and Milton Keynes; lead delivery organisation Inspiring Music / Central Bedfordshire. Be transparent that Milton Keynes is geographically outside the standard East of England region but shares this cross-boundary parent Hub.

Do not split post-2024 hub partnerships into outdated former hubs, mislabel individual services as whole Hubs, or invent logos. Use verified official URLs and safely fall back to well-designed typographic logos if permission/assets are missing. Only show teaching resources as available when the database actually holds them.

The East of England regional view should have clear breadcrumbs (**Partner Hubs › England › East of England**), region heading, short helpful explanation, count of parent Hubs, five beautifully laid-out hub cards, their real constituent area coverage, and useful forward links. Selecting a hub goes directly to its useful landing page. Design for expansion to all English regions without hardcoded one-off UI.

Useful primary checks:
- Arts Council England Music Hubs: https://www.artscouncil.org.uk/our-open-funds/music-hub-investment
- Greater Essex: https://www.greateressexmusichub.org.uk/site/
- Essex Music Service: https://www.essexmusicservice.org.uk/site/
- Hertfordshire: https://www.hertsmusicservice.org.uk/hertfordshire-music-hub/music-hub-lead-organisation.aspx
- Cambridgeshire/Peterborough: https://www.cambridgeshiremusic.org.uk/music-education-hub/
- Norfolk/Suffolk: https://www.nmhub.co.uk/site/about-the-hub/
- BLMK: https://www.lutonmusicservice.co.uk/blmkmusichub/
Verify the current official names/relationships at implementation time rather than blindly pasting text from a prompt.

## 4. Greater Essex page: lead with the interactive map

This is the most important individual page to redesign and the template for other hubs.

**Top of page:** understated branded header with genuine EMS / Greater Essex identity and hierarchy: “Greater Essex Music Hub”; subtitle “Essex · Southend-on-Sea · Thurrock”; smaller line “Lead organisation: Essex Music Service”. Breadcrumbs above. Small actions “Official website” and, only for authorised users, “Manage hub”. Remove the prominent public-facing admin instruction box from the main teacher view and put management actions in the appropriate restricted control.

**Above the fold, immediately under the header, place the INTERACTIVE AREA MAP** — not multiple introductions, not a long list of related hubs, not sample links. On desktop, display a generous accurate map (roughly two-thirds width) beside a search-and-area selector (one-third). On mobile, map first with an easily available accessible searchable area list below or via a clearly labelled control. The map is the hero *function*, not a static image.

Map requirements:
- The official Greater Essex footprint = **12 Essex County Council districts + Southend-on-Sea + Thurrock = 14 areas**. Current screenshot map only shows the 12 county districts. Make the map geographically accurate including the two unitary areas when boundary data permits. If the existing artwork cannot represent all 14 accurately, show it clearly as **“Essex County districts”** and display equally prominent adjacent Southend-on-Sea and Thurrock selectors pending a verified combined map; do NOT silently omit them.
- Essex county districts: Basildon, Braintree, Brentwood, Castle Point, Chelmsford, Colchester, Epping Forest, Harlow, Maldon, Rochford, Tendring, Uttlesford. Additional areas: Southend-on-Sea and Thurrock. The map/list/search must expose all 14.
- Use accurate, appropriately licensed boundary SVG/GeoJSON data (ONS Open Geography Portal: https://geoportal.statistics.gov.uk/; Greater Essex reference: https://data.essex.gov.uk/). Preserve licences and attribution. Do not draw approximate fictional boundaries or distort geography for visual effect.
- Hover/focus gently highlights the same area on map and list; selected area has a stronger accessible state. Click/tap/Enter/Space opens or updates the district details. Add tooltips, accessible names, logical keyboard focus and a fully equivalent text-list fallback. Do not rely on tiny map labels as the only way in.
- The adjoining selector offers **“Find your area”**, district search and the same 14 area names in compact two-column selectable rows where space allows. On selection, display an unobtrusive preview (name, resource/event counts only if real) and an obvious **“Explore [area]”** action; direct map click can also navigate straight to the local page if that proves faster and is consistent across map and list.
- Give users a real **“View all Greater Essex resources”** option so the map is a helpful route, not a gate. Districts inherit shared hub resources; a user should never have to browse the same file repeatedly under every district.
- Preserve browser Back, deep links, refresh and screen-reader navigation. Maintain selected/expanded state using URL routes or query params where appropriate.

**Below the map:** show the content users came for, via clear tabs or in-page sections: **Resources | CPD & events | About the hub | Contact**. Lead with actual resource cards (title, educational phase, subject, contributor, access status, concise description and action). No “demo explanation” copy interleaved in the public teaching journey. Short hub introduction and verified official links can sit below useful material or in About. Optional Planner demo controls belong in a discreet secondary panel only where functional and intentional.

## 5. Every local-area hub uses a reusable template

Example: **Partner Hubs › England › East of England › Greater Essex › Chelmsford**.

A district page should immediately show:
- Clear local-area title and associated parent Hub/lead service.
- Relevant local resources/events/CPD first; shared Greater Essex and national provider resources appropriately identified and filterable, with no duplicate records.
- Useful local information, official link and contact only when verified.
- Faceted filters: age/phase (EYFS, KS1, KS2, KS3, KS4, KS5, university where supported by the current app), subject, topic, resource type, access, contributor; and text search.
- Meaningful empty states (“No resources published for Chelmsford yet. Browse Greater Essex resources”) instead of invented resource cards, broken links or a large blank page.

The hub, local authority and provider pages must use a coherent shared data-driven template with optional sections, distinct verified brands, consistent card system and reusable admin forms. Keep the existing settings/route model where present, including local-area admin URLs such as `/essex/chelmsford/admin` if already supported. Do not create dozens of manually coded pages.

## 6. The unique CCDesigner workflow: organisation → teacher → planning

Do not build a directory with pretty outbound links and stop there. Make this workflow highly visible and reliably functional:

**Find a resource → Preview the source and licence → Add to My Activity Library (or relevant current library) → Use in Lesson Builder → Place in unit/Planner → Reflect after teaching.**

- Use EXISTING Activity Library, Lesson Library, unit/stack and Planner APIs, schema and workflows; do not invent parallel libraries or duplicate the resource file.
- Where the source is a link, PDF, audio, video, example activity, CPD or event, show the correct next action. Examples: **“Add to my library”**, **“Use in a lesson”**, **“Add event to Planner”**. Never offer “Add to lesson” for an item the current builder cannot support without integration work.
- Preserve attribution, original author/organisation, licence, canonical resource identifier, version and source URL when a teacher adds/copies/adapts an item. Teacher-owned adaptations must not silently change the provider's master.
- Support free resources, locked member-only resources via verified organisation access code, and subscriptions where genuine. Server-side authorisation is mandatory; the badge must match actual entitlement. For locked content, provide a useful “Request access / Enter organisation code” path without exposing private files or making fake promises.
- Make partner reach analytics meaningful: distinguish **viewed**, **added to library**, **placed in lesson**, **assigned to Planner** and **teacher-confirmed taught/reflected**, where those states exist. **Do not label a resource “delivered in classrooms” based only on a click, download or add-to-library event.** Provide aggregated statistics to authorised contributors and respect privacy, consent and retention settings.
- Allow shared resources to be tagged to multiple hubs/regions and cross-curricular themes without copying planning work. This supports the national mission to extend access, collaborate and avoid duplication.

## 7. Administration, governance and accurate representation

Before creating admin UI, inspect existing **Settings → Users / organisation hub admin** role controls and permission checks. Extend that system only as necessary.

- Roles should reflect current app authorisation: Rhythmstix superuser, approved Hub/organisation administrators, delegated local-area editors/contributors and normal teachers. If roles differ in code, map cleanly to them; do not break existing permissions.
- Each hub and area should be editable via neat, accessible inline edit/pencil actions or focused, well-designed dialog panels, not a giant exposed CMS form.
- Editors can propose changes; the existing/current superuser approval or authorised hub-admin review queue must approve drafts before publication according to role. Include save draft, preview, pending, approve/reject, version history and audit trail as supported by the app.
- Allow authorised admins to update names, logo/branding, overview, coverage, local areas, official links, resources, CPD/events, contacts and publication/access settings through an organised interface — not hardcoded React/HTML edits.
- Publish only verified affiliation and collaboration claims. Differentiate **publicly listed organisations** from organisations that have formally agreed to contribute to CCDesigner. Use “Demonstration”, “Listed organisation” or a neutral status as appropriate. The user has had discussions with potential partners; those discussions do not authorise partnership logos/claims or the release of private resources.
- Preserve existing forum/community features and any ring-fenced Hub workspaces; expose them only if functional and role-appropriate. Do not add non-functional buttons, imaginary analytics or sample data disguised as live content.

## 8. Visual language — highly refined, not showy

Aim for a mature, beautiful, restrained Apple-like experience that feels *native to CCDesigner*:

- Reuse the real Rhythmstix/CCDesigner palette, typography (Aptos if available in the project), spacing tokens, components, shapes and icon family. No unrelated new brand, neon palette, excessive green gradients, giant marketing illustrations or generic dashboard widgets.
- Primary CCDesigner surfaces: clean white / warm off-white; crisp dark forest-green/ink typography; controlled teal accents; subtle hairline borders; thoughtful shadows only where helpful. Allow partner-specific brand colour, e.g. EMS purple, to appear **inside the partner identity/header**, not to redefine the whole interface.
- Readable type: typical body ~16px, secondary text no smaller than 14px except nonessential metadata; clear headings; line lengths and paragraph spacing suitable for teachers. Do NOT reproduce the microscopic type in screenshot 1.
- Comfortable density: 8pt-based spacing; 12–16px radii; aligned baseline/grid; visually stable card heights; generous but not wasteful whitespace; strong accessible contrast.
- Desktop breakpoints should make meaningful use of 1200–1440px. Tablet and mobile are fully usable. Use gentle, brief transitions with reduced-motion support. No unnecessary carousels, auto-play or ornamental bouncing.
- Cross-page consistency: the national directory, regional page, Greater Essex hub, district pages and organisation pages should unmistakably share one design system.
- Functional clarity matters more than decoration: buttons named by action, one obvious primary action per panel, intuitive search, breadcrumbs, visible focus, keyboard navigation and no confusing nested accordion labyrinth.

## 9. Design previews required BEFORE production changes

Present actual previews/screenshots, using the inspected application's real tokens and plausible verified content, for:

**A. National Partner Hubs directory — desktop and mobile**
Show compact header, search, “Music Hubs | Arts organisations” control, browse England regions, clearly labelled Greater Essex working example and a tidy organisation grid.

**B. East of England regional landing — desktop and mobile**
Show all five verified Hub cards with geographic coverage, appropriate lead identities and direct entry points. Demonstrate what happens on selecting an area.

**C. Greater Essex Music Hub — desktop and mobile**
Show accurate high-priority interactive map in the first screen, district search/list beside it on desktop and accessible controls on mobile, along with Resources immediately underneath. Include visible Southend-on-Sea and Thurrock access.

**D. Chelmsford local area or resource detail — at least one desktop example**
Show how a teacher can use a real resource in an existing CCDesigner lesson or activity, not just leave for an external website.

For each, provide a brief rationale: what the teacher does, which elements are clickable, what appears next, and why it is simpler. Use screenshots/mock views to obtain my approval before replacing working pages. Do not claim a screenshot exists unless you produced it.

## 10. Engineering quality and acceptance criteria

Audit existing dependency stack before choosing map/search libraries. Prefer the application's current technologies and a lightweight, accessible SVG/GeoJSON region map to avoid unnecessary bundle weight, licence issues or external map billing. Use real data models and safe reversible migration scripts. Add loading/empty/error states and sensible image fallbacks. Preserve SEO/deep links if present. Handle mouse, touch, keyboard and screen reader. Respect WCAG 2.2 AA, reduced motion, focus order, responsive layouts and 44px-ish touch targets.

Before marking complete, demonstrate all of the following in a short test report:

1. From Partner Hubs, finding **Chelmsford** by search or region navigation takes a teacher to the correct Greater Essex local page in no more than a few clear interactions.
2. East of England displays **all five** distinct parent Hubs, correctly named, without duplicates or previous-hub confusion.
3. Greater Essex shows **all 14** eligible local areas across the accurate map and/or clearly labelled equal-status selectors; area names, URL routes and data stay synchronised.
4. Clicking Chelmsford on the map or list takes users to the SAME local area; browser Back and page reload work.
5. A teacher can find an authorised resource, inspect it, add it to the EXISTING library and use it in Lesson Builder/Planner while attribution and access permissions remain intact.
6. Locked provider materials cannot be accessed through a copied URL or browser API call without valid permissions.
7. A delegated hub editor can save a draft, and publication requires the appropriate existing approval checks. Normal teachers cannot edit hub listings.
8. National directory search and filters work with real published records; unloaded areas show accurate empty states, not fabricated samples.
9. Desktop at 1440/1280, tablet at ~768 and mobile at ~390 widths are checked with real screenshots. No overflow, clipped labels, duplicate floating widgets, dead buttons, or huge blank columns.
10. Existing Planner, Lesson Builder, Activity Library, settings, hub pages, public links and contributor resources still work; all changes are covered by relevant automated tests.

## 11. Implementation discipline and required handoff

**Stage 1 — Discover & design:** inspect the repository and the 3 screenshots; report current code/data problems, entity relationships and source-of-truth plan; provide the navigational diagram and actual screenshots in a preview branch; identify outstanding questions. Wait for approval of look and structure.

**Stage 2 — Implement:** build shared directory/search/region/hub/district components; correct regional data; implement the Greater Essex map including comprehensive area access; wire existing resource/planner integrations; extend permissions/admin as needed. Use small well-explained commits. Do not erase data, change unrelated areas, replace functioning routes unnecessarily or hardcode the five hubs into presentation components.

**Stage 3 — Validate & document:** run build, type-checks/lint and user-journey tests; provide desktop/mobile screenshots of working screens, summary of changed files, migrations, real/demonstration content status, source links for geography and hub names, known limitations and exact steps for administrators to maintain a hub.

**Final standard:** A teacher who has never seen CCDesigner should immediately be able to locate the right hub, choose their area, discover something useful, and bring it into teaching. A Hub Lead Organisation should see a credible, professional, scalable platform for reaching teachers and understanding genuine use of the resources it has contributed. It must feel like the next natural evolution of CCDesigner, not a separate directory bolted onto the platform.
