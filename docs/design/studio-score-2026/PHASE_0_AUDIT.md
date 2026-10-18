# Studio Score — Phase 0 audit

**Branch:** `design/studio-score-ux` (from `design/partner-hubs-uk-map`)  
**Repo:** fork of `rrs77/CCDARTSCOUNCIL` · workspace `CCDesignerARTSCOUNCIL`  
**Inventory source:** [Phase 0 feature inventory](c75aa6f7-80a7-4833-9053-a25a1b41881a) + handoff docs.  
**Status:** Baseline locked. No `main` merge. No Supabase migrations.

## Local / not shipped at branch tip

| Path | Notes |
|------|--------|
| Planner A+B + Studio Score chrome | In progress on this branch |
| `design/settings-classes-library/` | Design mock only |
| `docs/CCD_AGENT_HANDOFF.md` | Agent handoff |

## Navigation map (before → after)

| Old `?tab=` / surface | Studio Score | Category |
|-----------------------|--------------|----------|
| `unit-viewer` → Planner | **Planner** (sidebar) | reskin |
| Planner Units room → `UnitViewer` | Units room · Half-terms | preserve |
| `UnitsView` (sequence vs dates) | Units room · Progress (wired) | was coded but hard to reach |
| Classic calendar / iCal / PDF | Timetable setup | preserve |
| `lesson-library` | More tools → Lesson Library | move |
| `lesson-builder` | Lesson Builder (+ Polish with AI preview) | reskin; DnD preserve |
| `activity-library` | Activity Library (still **per class** via header) | preserve filter |
| `our-partners` | Partner Hubs (first nav item) | move + shell bridge; forest/teal inside |
| `?hubs=classic` → `OurPartners` | Classic rollback | preserve |
| `contact-us` | More tools → Contact | move |
| Settings Year Groups / Categories | Settings · My classes / Activity folders | reskin labels |
| Forum / Help / Walkthrough | More tools | move |
| Admin / downloads / users | Settings (role-gated) | preserve |
| Standalone `/roh`, `/lso`, … | unchanged routes | preserve |
| Music hub `/essex…` + hub admin | unchanged | preserve |

## Critical preserves

- Activity Library + Lesson Builder year-group filtering (`currentSheetInfo.sheet`)
- Drag-and-drop: `DndRoot`, `LessonDropZone`, `ActivityCard`
- Partner Hubs map, RLS, resource-access, ManageHubDialog
- Engagement events wired in UI: **`viewed`**, **`added_to_library` only**
- Demo mode off live DB; East of England = **5** parent hubs; map = **43** England hubs / **361** LADs

## Future (do not claim shipped)

- Real AI endpoint for Polish (UI is preview stub)
- Engagement: `placed_in_lesson` / `assigned_to_planner` / `taught_reflected`
- Assessify / ProgressPath
- CPD / events data when provider-backed

## Integrity

Demo mode · additive DB only · no production deploy without approval.
