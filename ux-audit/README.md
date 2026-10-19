# CCDesigner / Studio Score — UX audit (19 Oct 2026)

**Branch audited:** `preview/oct19-audit`  
**Audit branch (this folder only):** `ux-audit/oct19`  
**Viewport:** 1440×900 · Demo visitor via `/oakhill` → prototype password → `?demo=1`  
**Scope:** Audit only — no app code changes.

## Summary

The Oct 19 redesign is already a large step forward: navy studio sidebar, indigo accent, clearer names (**Planner**, **Half-terms**, **Slides**, **Partner Hubs**), a serious week planner, a full-page activity editor, and a Music Hubs map that feels like a product rather than a link farm.

What still hurts teachers is **mental model friction**, not polish:

1. The sidebar groups everything under “Connect & create,” so plan vs build vs discover is unclear.
2. **Scheme / stack / unit / lesson** vocabulary still fights itself across Half-terms, Lessons, and assign panels.
3. Dense action rows (Lessons) and chrome (Activity Library, More tools) slow down the core journey: *classes → timetable → half-term schemes → week → teach*.

**In progress elsewhere (not scored as blockers):** timetable class panel, week-planner outline slots, Music Hubs region map. Those surfaces are noted only where copy or IA still misleads.

**Broken behaviour found:** Share / Copy Link PDF returned **500** in demo (`Share PDF failed: 500`). Export/share is part of the teach journey and needs a reliable path.

Screenshots of every major area live in [`screens/`](screens/). Ranked proposals with before/after mockups are in [`images/`](images/). Proposed IA: [`images/00-sitemap.png`](images/00-sitemap.png).

---

## Ranked suggestions

### 1. Critical — Re-group the sidebar around the teacher journey  
**Images:** [01-before](images/01-before.png) · [01-after](images/01-after.png) · [sitemap](images/00-sitemap.png)

| | |
|---|---|
| **Problem** | Primary nav sits under one “Connect & create” bucket. Planner, Half-terms, Lesson Builder, Lessons, Activities, Slides, and Partner Hubs read as peers. New teachers get no order of operations. |
| **Why it matters** | Without a path, people bounce between Builder and Planner, miss Half-terms, and never connect timetable slots to the week view. |
| **Recommendation** | Group as **Plan your year** (Planner, Half-terms) → **Build lessons** (Builder, Lessons, Activities, Slides) → **Discover** (Partner Hubs) → **Workspace** (More, Bolt-ons). Add a light “planning path” strip on Planner for first-run / incomplete setup. Rename “Activities” short label OK; keep full “Activity Library” in page chrome if needed. |
| **Effort** | **M** |

---

### 2. Critical — One glossary: scheme of work (retire stack / unit in UI)  
**Images:** [04-before](images/04-before.png) · [04-after](images/04-after.png) · [05-before](images/05-before.png) · [05-after](images/05-after.png) · [03-before](images/03-before.png) · [03-after](images/03-after.png)

| | |
|---|---|
| **Problem** | Half-term map subtitle says “add or review **lessons**,” but cells open **Assign scheme of work**, which says individual lessons are *not* assigned here. Lessons page still says **“Lesson Stacks / Units.”** Available schemes include demo names like “Stacks Test.” |
| **Why it matters** | Teachers cannot tell whether they’re planning a half-term, a unit, or a single lesson. They abandon the map or double-enter work in Lesson Builder. |
| **Recommendation** | Teacher-facing glossary: **Activity → Lesson → Scheme of work → Slide deck**. Replace stack/unit/lesson-stack in UI copy. Map empty cells: “+ Assign scheme.” Filled cells: “N schemes · M lessons.” Keep “unit” only where it means curriculum unit in specialist contexts. |
| **Effort** | **M** (copy + a few labels; data model can stay) |

---

### 3. High — Simplify Lessons row actions  
**Images:** [03-before](images/03-before.png) · [03-after](images/03-after.png)

| | |
|---|---|
| **Problem** | Each lesson shows six coloured buttons: Copy Link, Reassign/Assign, Copy, To Year, Edit, Delete — plus Create/Copy Lesson in the toolbar. |
| **Why it matters** | High misclick risk on a touch laptop; secondary actions drown the primary job (open/edit and place into a half-term). |
| **Recommendation** | Keep **Edit** + **Assign to half-term** visible. Move Copy link, Duplicate, Move to class, Export PDF, Delete into a **⋯** menu. Group schemes of work above single lessons. |
| **Effort** | **S** |

---

### 4. High — Align Half-term map promise with assign behaviour  
**Images:** [04-before](images/04-before.png) · [04-after](images/04-after.png) · [05-before](images/05-before.png) · [05-after](images/05-after.png)

| | |
|---|---|
| **Problem** | Copy promises “lessons”; interaction delivers schemes only. Progress “17 / 204 planned” is opaque (cells? lessons?). |
| **Why it matters** | First click on the map feels like a bait-and-switch. |
| **Recommendation** | Rewrite map lede and cell CTAs around schemes. Progress: “17 / 204 cells with a scheme.” Optionally offer “Add a single lesson” as a secondary link that jumps to Lessons filtered to that class × term — don’t pretend the cell does it. |
| **Effort** | **S** |

---

### 5. High — Calm Activity Library chrome  
**Images:** [06-before](images/06-before.png) · [06-after](images/06-after.png)

| | |
|---|---|
| **Problem** | Class name repeats (header + eyebrow + title). Toolbar packs search, two dropdowns, density slider, five view icons, star, yellow Create, filter. Partner planning banner sits between tools and content. |
| **Why it matters** | Finding “Create activity” and scanning folders is harder than it should be for non-specialists. |
| **Recommendation** | One title line + count; primary **+ Create activity** (indigo, not yellow-only). Collapse density/view extras under a “Display” control. Move Partner planning to a filter chip, not a full-width bar. |
| **Effort** | **M** |

---

### 6. High — Timetable empty state must explain the week planner link  
**Images:** [07-before](images/07-before.png) · [07-after](images/07-after.png)

| | |
|---|---|
| **Problem** | Timetable builder can show class pills and an empty grid with little guidance that these slots power Schedule/Week. (Class panel polish is in progress elsewhere — don’t redo that UI.) |
| **Why it matters** | Teachers fill Half-terms or Lessons and wonder why the week looks empty. |
| **Recommendation** | Empty state: “No slots yet… These slots power your Week planner.” CTAs: Add first slot / Use sample week. Keep Schedule \| Timetable \| Half-term tabs labelled consistently with sidebar language. |
| **Effort** | **S** (copy + empty state; defer grid interactions to in-flight work) |

---

### 7. Medium — Declutter More tools  
**Images:** [02-before](images/02-before.png) · [02-after](images/02-after.png)

| | |
|---|---|
| **Problem** | More tools re-lists Lessons, Slides, Half-terms already in the sidebar (10 cards). |
| **Why it matters** | Teaches the wrong map: “maybe the real Lessons is over here?” |
| **Recommendation** | Keep Settings, Timetable shortcut, Class calendar, Contact, Forum, Help/walkthrough. Drop primary duplicates. |
| **Effort** | **S** |

---

### 8. Medium — Slides: scenes → slides; fix share/export  
**Images:** [08-before](images/08-before.png) · [08-after](images/08-after.png) · also [screens/28](screens/28-lesson-detail-export.png)

| | |
|---|---|
| **Problem** | Landing is strong (“Slides”), but editor chrome still says “1 scenes.” Demo Copy Link / Share PDF hit a **500**. Help text still mentions Calendar-tab Export PDF patterns from older IA. |
| **Why it matters** | Present/share is the last mile of the journey; failure here undoes trust. |
| **Recommendation** | Prefer “slides” / “slide deck” in all teacher chrome (keep “scene” only in advanced timeline if needed). Fix share PDF API in demo and signed-in paths; surface Export/Copy from Lessons ⋯ menu and lesson detail without a dead end. |
| **Effort** | **M** (copy S + share fix M) |

---

### 9. Nice-to-have — Bolt-ons “2” badge reads as notifications  
**Screenshot:** [screens/25b](screens/25b-bolt-ons-catalogue.png)

| | |
|---|---|
| **Problem** | `+ Bolt-ons` with a numeric badge looks like unread alerts. |
| **Recommendation** | Drop the count badge, or label “2 products” in text when expanded. |
| **Effort** | **S** |

---

### 10. Nice-to-have — Class context vanishes on some tabs  
**Observation:** Partner Hubs / Slides hide the class selector that Activity Library and Lessons rely on.

| | |
|---|---|
| **Recommendation** | Keep a muted “Planning as: LKG” chip even on global tabs, or explain “Hubs are school-wide.” |
| **Effort** | **S** |

---

### 11. Nice-to-have — Internal IDs vs labels (cleanup pass)  
Code/nav still uses `unit-viewer`, `curriculum`, `lesson-viewer` while UI says Planner / Half-terms / Slides. Fine technically; finish scrubbing user-visible leftovers (`Interactive lesson`, `Lesson Viewer`, `Karaoke` as product names, Help “Calendar tab” wording).

| **Effort** | **S–M** |

---

## Journey check (compressed)

| Step | Status on `preview/oct19-audit` |
|------|----------------------------------|
| Set up classes | Settings → My classes works; save-to-cloud copy is clear. |
| Build timetable | Reachable from Planner + More; empty state needs journey copy (sug. 6). Class panel WIP. |
| Plan half-terms | Map is strong; scheme vs lesson copy conflict (sug. 2 & 4). |
| Fill week planner | Week view is the star; day view control less discoverable; outline slots WIP. |
| Activities → lessons | Full-page Create activity is excellent; Library chrome noisy (sug. 5). Lessons actions noisy (sug. 3). |
| Present Slides | Landing good; terminology + share reliability (sug. 8). |
| Export / share | Copy Link / Share PDF **500** in demo — treat as P0 engineering. |
| Partner Hubs | Music Hubs map + East Midlands region list work; Arts orgs / Paid resources clear. Region map WIP. |

---

## Image index

| File | What |
|------|------|
| [images/00-sitemap.png](images/00-sitemap.png) | Proposed nav + glossary |
| [images/01-before.png](images/01-before.png) / [01-after.png](images/01-after.png) | Planner + sidebar IA |
| [images/02-before.png](images/02-before.png) / [02-after.png](images/02-after.png) | More tools declutter |
| [images/03-before.png](images/03-before.png) / [03-after.png](images/03-after.png) | Lessons actions |
| [images/04-before.png](images/04-before.png) / [04-after.png](images/04-after.png) | Half-term map copy |
| [images/05-before.png](images/05-before.png) / [05-after.png](images/05-after.png) | Assign scheme glossary |
| [images/06-before.png](images/06-before.png) / [06-after.png](images/06-after.png) | Activity Library chrome |
| [images/07-before.png](images/07-before.png) / [07-after.png](images/07-after.png) | Timetable empty state |
| [images/08-before.png](images/08-before.png) / [08-after.png](images/08-after.png) | Slides landing |
| [screens/](screens/) | Full walkthrough captures (login → bolt-ons) |

Mockup source: [`mockups/render-mockups.html`](mockups/render-mockups.html) (navy sidebar, indigo `#4f46e5`, Plus Jakarta Sans, white rounded cards).

---

## Addendum — second pass (same branch)

Complementary findings from a parallel walkthrough on the same `preview/oct19-audit` tip. Does not replace the ranked list above; use where it sharpens priority or adds evidence.

### A1. Critical — Sidebar defaults to collapsed
`StudioShell` initializes `collapsed` to `true`, so every remount starts icon-only. Teachers lose labels until they expand. Pair with sug. 1: default **expanded** on desktop ≥1280px and persist preference.

**Evidence:** [images/alt/01-before-collapsed.png](images/alt/01-before-collapsed.png) · proposed regroup [images/alt/01-after-regroup.png](images/alt/01-after-regroup.png) · alt sitemap [images/alt/00-sitemap-alt.png](images/alt/00-sitemap-alt.png)

### A2. High — Planner “Units” duplicates Half-terms
Planner tabs include **Schedule · Timetable builder · Units**; Units shows a single-class half-term grid while sidebar **Half-terms** is the all-class map. Same job, two doors (agrees with glossary work in sug. 2/4).

**Evidence:** [images/alt/03-before-units-tab.png](images/alt/03-before-units-tab.png) · [images/alt/03-after-unified-halfterms.png](images/alt/03-after-unified-halfterms.png)

### A3. High — Promote Timetable + Settings; More tools = extras only
Aligns with sug. 7. Alternate mockup of extras-only page: [images/alt/02-before-more-tools.png](images/alt/02-before-more-tools.png) · [images/alt/02-after-more-tools.png](images/alt/02-after-more-tools.png)

### A4. Medium — Header Share menu (alongside PDF 500 fix)
Sug. 8 covers the 500. Product pattern: one **Share** control (Export PDF · Copy link · Print) in the header on Planner / Lessons / Slides.

**Mock:** [images/alt/06-after-share-menu.png](images/alt/06-after-share-menu.png)

### A5. Medium — Login: one Preview entry, no stacked modal
Prototype notice bar is enough; avoid welcome modal on top of the landing card.

**Mock:** [images/alt/05-after-login-clean.png](images/alt/05-after-login-clean.png)

### A6. Medium — Explicit teaching-journey screen (once)
Four steps: My classes → Timetable → Half-terms → Week / Build / Share. Show once after first login and from Help.

**Mock:** [images/alt/08-after-teaching-journey.png](images/alt/08-after-teaching-journey.png)

Additional screen dumps from the second pass: [`screens-alt/`](screens-alt/). Mockup HTML: [`mockups/after-mockups-alt.html`](mockups/after-mockups-alt.html).
