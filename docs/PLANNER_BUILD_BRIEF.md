# Planner build brief — AI prompt pack

**Audience:** a coding agent implementing the three-column Lessons planner mockups  
**Mockups:** `/workspace/mock/1_main_planner.jpg`, `2_activity_card_steps.jpg`, `3_lesson_plan_modal.jpg` (also under `artifacts/ccd` design references as needed)  
**Base branch for implementation work:** `feat/lessons-unified` (this brief lives on `docs/planner-brief`)  
**App root:** `artifacts/ccd/`  
**Constraint:** settings-driven; no hard-coded subjects, colours, section types, or curriculum lists. Reuse existing Lessons workspace, half-terms map, categories, and curriculum already in Settings.

**Product naming:** do not rename the product to “Planner”. UI copy may say “lesson planner” for the screen; brand remains Creative Curriculum Designer / CCDesigner.

---

## How to use this pack

1. Read **§0 Codebase map** and **§1 Data model** before writing code.
2. Implement **one phase at a time**. Paste the phase prompt into a new agent turn.
3. Meet the phase acceptance criteria before starting the next phase.
4. Prefer extending existing components over parallel rewrites. Additive Supabase migrations only (no DROP of live lesson/activity data).
5. Print/PDF must stay single-sourced on `buildLessonPdfHtml` in `utils/lessonPdfHtml.ts`.

---

## 0. Codebase map (what already exists)

### 0.1 Unified Lessons entry (current)

| Piece | Path | Role today |
| --- | --- | --- |
| `LessonsWorkspace` | `artifacts/ccd/src/components/LessonsWorkspace.tsx` | Unified Lessons tab: **saved-lessons rail** (left) + embeds `LessonPlanBuilder` (canvas). Opens `StandaloneLessonCreator` full-screen for create/edit with live A4 preview. Assigns to half-term via `AssignToHalfTermModal`. |
| `LessonPlanBuilder` | `artifacts/ccd/src/components/LessonPlanBuilder.tsx` | Activity filter + DnD canvas (`LessonDropZone`), stacks, `PolishWithAIModal` (preview-only), `ActivityDetailsModal` / editor. |
| `StandaloneLessonCreator` | `artifacts/ccd/src/components/StandaloneLessonCreator.tsx` | Full lesson form: fixed fields (learning outcome, success criteria, intro, main, plenary, vocab, etc.), activity list DnD, curriculum objectives, Plan / Preview / Split, uses `LessonPrintPreview` + `buildLessonPdfHtml`. |
| Dashboard tab wiring | `artifacts/ccd/src/components/Dashboard.tsx` | Lessons tab → `LessonsWorkspace`; Half-terms / curriculum → `HalfTermDesigner` / board. |

**Gap vs mockup:** mockup is **three columns** (subject activity library \| portrait lesson \| My units). Current UI is **two columns** (saved lessons list \| builder) and treats the full plan form as a separate full-screen creator, not an overlay on the same composition.

### 0.2 Activity library & subject hierarchy

| Piece | Path | Role today |
| --- | --- | --- |
| `ActivityLibrary` | `artifacts/ccd/src/components/ActivityLibrary.tsx` | Full library UI: hierarchy expand, search, star, create/edit via `ActivityEditorPage`, details via `ActivityDetailsModal`. |
| Hierarchy helpers | `artifacts/ccd/src/utils/libraryHierarchy.ts` | Key stages `eyfs`…`ks5`; subjects Music/Drama/Dance/Art (+ Photography KS4/5); `subjectColor()`; category → subject placement (some heuristics still hard-coded). |
| Category settings | `artifacts/ccd/src/contexts/SettingsContextNew.tsx` (`Category`), `settings/SettingsContent.tsx` | Categories: `name`, `color`, `yearGroups`, `group`/`groups`, `hidden`, `source`. Colours via `getCategoryColor`. Folders = subject grouping. |
| Visibility | `artifacts/ccd/src/utils/activityLibraryCategories.ts`, `yearGroupMatchKeys.ts` | Filter activities/categories by selected class / year group. |
| DnD | `react-dnd` + `artifacts/ccd/src/components/dnd/*` | Used in library cards, `LessonDropZone`, `StandaloneLessonCreator`. |

**Gap:** mockup top-left is a **Key Stage** selector (EYFS–KS5) driving subject blocks for that stage. Today the app primarily selects a **class/sheet** (`currentSheetInfo`) and filters by year-group assignment. Subject list in `LIBRARY_SUBJECTS` omits **English** (mockup shows English). Extra/hidden subjects must come from Settings folders/categories, not the hard-coded subject array alone.

### 0.3 Activity view / edit

| Piece | Path | Role today |
| --- | --- | --- |
| `ActivityDetailsModal` | `artifacts/ccd/src/components/ActivityDetailsModal.tsx` | Read-only modal: duration, year groups, description, resources. Optional `onEdit`. |
| `ActivityEditorPage` | `artifacts/ccd/src/components/ActivityEditorPage.tsx` | Full-page create/edit (rich text, resources, standards/objectives). Autosave patterns exist in library flows. |
| `ActivityDetails` | `artifacts/ccd/src/components/ActivityDetails.tsx` | Inline details panel used from drop zone. |

**Gap:** mockup is a **stepped card** (Overview → Curriculum → How to run it → Resources → Assessment) with Edit toggle, side arrows, “Add to lesson”, autosave — same style as planner, not a separate full page. Keep view **and** edit; reshape into steps without losing fields.

### 0.4 Lesson plan modal, print, AI polish

| Piece | Path | Role today |
| --- | --- | --- |
| `StandaloneLessonCreator` | (above) | Closest to mockup lesson plan modal; fixed section keys; view modes Plan / Preview / Split. |
| `LessonPrintPreview` | `artifacts/ccd/src/components/LessonPrintPreview.tsx` | Live A4 iframe from shared HTML builder. |
| `LessonPrintModal` | `artifacts/ccd/src/components/LessonPrintModal.tsx` | Export / share / multi-lesson PDF; **still contains duplicate HTML construction** in places — must converge on shared template. |
| Shared HTML | `artifacts/ccd/src/utils/lessonPdfHtml.ts` → `buildLessonPdfHtml` | Canonical PDF/print HTML. Expects flat plan fields + `orderedActivities` / `grouped`. |
| Client share | `artifacts/ccd/src/utils/shareLesson.ts` | PDFBolt + upload; caller supplies `generateHTMLContent`. |
| API PDF | `artifacts/api-server/src/routes/pdf.ts` | Proxies HTML → PDFBolt; does not own template markup. |
| AI today | `artifacts/ccd/src/components/studio/PolishWithAIModal.tsx`, `utils/applyLessonPolish.ts` | **Design preview only** — no model call. Applies scripted note patches / sequence reorder. Wired from `LessonPlanBuilder` and `PlannerSheets`. |

**Gaps:**

- No “Choose plan template” picker per key stage.
- No “Flesh out with AI” that generates real plan content.
- Sections are **fixed properties** on `LessonData`, not a flexible ordered `sections[]` with insert-anywhere `+`.
- Preview swipe carousel for activities (mockup 1 header “Preview lesson”) is not the same as A4 print preview.
- Print view must use **the same** HTML as PDFBolt (`lessonPdfHtml.ts` + routes that only transport that HTML).

### 0.5 Units, half-terms, year overview

| Piece | Path | Role today |
| --- | --- | --- |
| `Unit` type + CRUD | `DataContext.tsx` (`units`, `updateUnit`) | Persisted in **`localStorage` key `units-${sheet}`** — not a first-class Supabase table today. |
| `HalfTerm` | `DataContext.tsx`; `halfTermsApi` in `config/api.ts` | Per-class/year half-terms with `lessons: string[]`, optional `stacks`. Synced via Supabase half-terms APIs. |
| `AssignToHalfTermModal` | `artifacts/ccd/src/components/AssignToHalfTermModal.tsx` | Modal assign lesson → half-term. |
| `UnitViewer` | `artifacts/ccd/src/components/UnitViewer.tsx` | Older units UI over localStorage units. |
| `ActivityStack` | `DataContext` + `activityStacksApi` | Named activity bundles (not scheme units). |
| `useLessonStacks` / lesson stacks | `hooks/useLessonStacks.ts`, `config/lessonStacksApi.ts` | Lesson stacks for packs / half-term schemes. |
| Year / half-term board | `halfTerm/TeacherHalfTermBoard.tsx`, `HalfTermDesigner.tsx`, `halfTermConstants.ts` | **Next screen** for scheme of work by half-term; uses academic year + term structure. |
| Term dates | Settings / half-term year config (per academic year in DataContext `halfTermsByYear`, `currentAcademicYear`) | Dates/structure set per year — Year overview must read these, not invent new calendars. |

**Gap:** mockup “My units” tray (subject tag, lesson count, term, expand to drag lesson thumbnails) is not on the Lessons three-column screen. Assignment today is half-term-centric and/or separate Units UI. Multiple units per half-term is partially supported via multiple lessons on a term and separate `Unit` records, but UX does not match the tray.

### 0.6 Curriculum statements (do not invent a new source)

| Source | Path | Use |
| --- | --- | --- |
| Custom / national-style objectives | `types/customObjectives.ts`, `config/customObjectivesApi.ts`, `CustomObjectivesSelector.tsx`, `ObjectiveSelector.tsx`, Settings admin (`CustomObjectivesAdmin.tsx`) | Per year group; selected IDs stored on lesson as `customObjectives` / related fields. |
| EYFS / nested standards | `DataContext` (`nestedStandards`, `lessonStandards`, `eyfsApi`) | EYFS statements attachable to lessons. |
| Activity-level standards | `Activity.standards`, `NestedStandardsBrowser` in editor | Activity card Curriculum step. |

**Rule:** lesson plan modal “Curriculum statements” checklist = **same data teachers already configure in Settings**. No parallel curriculum picker dataset.

### 0.7 Persistence surfaces (Supabase / local)

- **Activities / lessons:** `activitiesApi`, `lessonsApi` → Supabase lesson sheet JSON (`data`, `lesson_numbers`, …).
- **Categories:** Settings + custom categories APIs / `system:categories` settings keys.
- **Half-terms:** `halfTermsApi` (sheet + academic year).
- **Units:** localStorage `units-${sheet}` (promote carefully if product requires sync).
- **Activity stacks:** `activity_stacks` via `activityStacksApi`.
- **Custom objectives:** custom objectives tables/API.
- **Demo mode:** `isDemoModeActive()` — must keep working offline / without live DB writes.

---

## 1. Target data model

Extend existing shapes; prefer additive fields. Names below are the contract for phases.

### 1.1 `Lesson` (extends `LessonData`)

Keep existing keys for backward compatibility. Add:

```ts
/** Ordered mix of activities and flexible teacher sections (source of truth for Plan / Preview / PDF). */
sections?: LessonSection[];

/** Optional plan template id chosen for this key stage. */
planTemplateId?: string;

/** Primary subject for unit tray colouring (from Settings subject/folder), not hard-coded. */
primarySubjectId?: string;

/** AI flesh-out metadata (never locks fields). */
aiFleshOut?: LessonAiFleshOutState;
```

Migration path: when `sections` is absent, derive a default `sections[]` from `orderedActivities` + legacy string fields (`introduction`, `vocabulary`, …) so old lessons open cleanly.

### 1.2 `LessonSection`

```ts
type LessonSectionKind =
  | 'activity'           // references an Activity snapshot / id
  | 'free_text'
  | 'differentiation'
  | 'vocabulary'
  | 'afl'                // Assessment for learning
  | 'health_and_safety'
  | 'homework'
  | 'custom';             // type id from Settings

interface LessonSection {
  id: string;            // stable uuid
  kind: LessonSectionKind;
  customTypeId?: string; // when kind === 'custom'
  title: string;         // teacher-renamable
  bodyHtml?: string;     // rich text; always editable
  activity?: Activity;   // when kind === 'activity' (snapshot + id)
  durationMins?: number;
  collapsed?: boolean;
  createdAt?: string;
  updatedAt?: string;
  /** Provenance only — UI must still treat body as normal editable content. */
  lastWrittenBy?: 'teacher' | 'ai';
}
```

Built-in kinds + **custom types from Settings** (new settings list; default seed the six built-ins). Insert via `+` **between every block** (including before first / after last).

### 1.3 `Unit` (extend existing `Unit` in DataContext)

```ts
interface Unit {
  id: string;
  name: string;
  description: string;
  lessonNumbers: string[];
  color: string;          // prefer subject colour from Settings
  term?: string;          // half-term id e.g. 'A1' — several units may share one term
  subjectId?: string;     // Settings subject/folder id or name key
  classSheet?: string;    // owning class/sheet
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.4 Term assignment

- Half-term ids remain `A1 | A2 | SP1 | SP2 | SM1 | SM2` (`HALF_TERMS` in workspace / halfTermConstants).
- A lesson may appear in `halfTerms[].lessons` **and/or** in `unit.lessonNumbers` with `unit.term` set.
- Product rule: **several units can share a half-term** (e.g. Autumn 1 Music + Autumn 1 Drama). Do not enforce one-unit-per-term.

### 1.5 AI flesh-out state (inline in lesson plan modal)

Editing and re-prompting happen **inside the lesson plan modal/view** — not a separate screen or route.

```ts
interface LessonAiPromptTurn {
  id: string;
  createdAt: string;
  scope: 'whole_plan' | { sectionId: string };
  instruction: string;           // e.g. "make it more practical"
  /** Snapshot of sections (+ key lesson fields) BEFORE this turn applied. */
  snapshotBefore: {
    sections: LessonSection[];
    learningOutcome?: string;
    successCriteria?: string;
    // …other top-level fields the model may rewrite
  };
  /** Snapshot AFTER apply (for redo / compare). */
  snapshotAfter: { /* same shape */ };
  /** Section ids the teacher marked dirty (manual edit) at apply time. */
  teacherDirtySectionIds: string[];
  applyMode: 'overwrite_all' | 'fill_empty_only' | 'overwrite_selected';
  selectedSectionIds?: string[];
}

interface LessonAiFleshOutState {
  history: LessonAiPromptTurn[];  // newest last; cap ~20
  historyIndex: number;           // undo/redo pointer
}
```

**Product rules (non-negotiable):**

1. After AI runs, **every field and section remains normal editable content** (same editors as manual entry). No locked / read-only “AI output” chrome.
2. Teacher can **re-prompt** with further instructions (whole plan or single section), e.g. “add a SEND adaptation”, “restructure for a 60 min lesson”.
3. Maintain **prompt history + undo/redo** of AI applies.
4. **Preserve teacher manual edits** by default: do not silently overwrite sections the teacher edited since the last AI apply unless they explicitly choose overwrite (confirm UI).
5. UX lives **inline** in the lesson plan modal (toolbar + optional side panel / drawer attached to that modal), never a separate page.

### 1.6 Plan templates (new, settings-driven)

```ts
interface PlanTemplate {
  id: string;
  keyStageId: LibraryKeyStageId | string; // EYFS–KS5
  name: string;
  /** Initial section kinds/titles to seed an empty lesson. */
  defaultSectionBlueprints: Array<{ kind: LessonSectionKind; title: string; customTypeId?: string }>;
}
```

Store in Settings (user or school settings JSON) — **no hard-coded per-KS templates in component source** beyond empty defaults.

### 1.7 PDF / print projection

Extend `LessonPdfData` in `lessonPdfHtml.ts` to render `sections` in order (activity cards + titled free sections). Until all callers pass `sections`, keep rendering legacy flat fields. **One HTML function** for Preview tab, Print/PDF button, `LessonPrintModal`, and `shareLesson` / `pdf.ts` payloads.

---

## 2. Feature-by-feature: exists → interpret → gap → change

### 2.1 One screen: library + lesson + units

| | |
| --- | --- |
| **Exists** | `LessonsWorkspace` (2-col), `ActivityLibrary` (own tab), `UnitViewer` / half-term assign. |
| **Interpret** | Workspace is the right host; builder already embeds activity picking. |
| **Gap** | No three-column composition; saved-lessons rail ≠ subject blocks; no unit tray. |
| **Change** | Rebuild `LessonsWorkspace` layout to mockup columns: left `PlannerActivityLibrary` (extract/reuse `ActivityLibrary` hierarchy), centre portrait `LessonCanvas`, right `MyUnitsPanel`. Keep saved-lesson open/load as secondary (header or unit tray), don’t lose existing open-by-number. |
| **Risk** | Large layout change on active `feat/lessons-unified` UX; preserve `embedded` `LessonPlanBuilder` behaviours or fold them carefully. |

### 2.2 Key stage dropdown (EYFS–KS5)

| | |
| --- | --- |
| **Exists** | `LIBRARY_KEY_STAGES` in `libraryHierarchy.ts`; class selector / `currentSheetInfo`; `yearGroupSections`. |
| **Interpret** | Hierarchy already thinks in KS; sheet selection is class-scoped. |
| **Gap** | No dedicated KS control on Lessons header as in mockup; filtering is class-first. |
| **Change** | Add KS dropdown bound to settings sections; filter subject blocks + activities by KS (+ still respect class year-group assignments when a class is selected). Prefer deriving KS from selected class when set. |
| **Risk** | Dual filters (KS vs class) confusing — document: class implies KS; KS-only browse allowed for library. |

### 2.3 Subject blocks (colours, extra, hidden from Settings)

| | |
| --- | --- |
| **Exists** | Categories + folders/groups; `hidden`; colours; `buildLibraryHierarchyTree`. |
| **Interpret** | Expanding a subject shows leaf categories’ activities for that KS. |
| **Gap** | `LIBRARY_SUBJECTS` hard-codes arts list (no English); some colours/heuristics in `libraryHierarchy.ts`. |
| **Change** | Drive subject list from Settings folders / category groups (include English and user extras). Honour `hidden`. Colours from folder/category Settings, falling back to `getCategoryColor`. Reduce hard-coded `SUBJECT_COLORS` / `CATEGORY_PLACEMENT` over time. |
| **Risk** | Breaking existing Music-heavy demos; migrate heuristics behind Settings defaults. |

### 2.4 Drag activities → portrait lesson; multi-subject; reorder; delete

| | |
| --- | --- |
| **Exists** | `LessonDropZone`, react-dnd types `lesson-activity` / library drag; duration sum; remove. |
| **Interpret** | Already supports multi-category activities in one plan. |
| **Gap** | Portrait “lesson rectangle” chrome; drag finished lesson into unit tray; visual parity with mockup. |
| **Change** | Restyle centre column; keep DnD; on drop append `sections` item `kind: 'activity'`. Enable drag of lesson thumbnail to unit drop zone. |
| **Risk** | DnD type collisions between library → lesson and lesson → unit — use distinct item types. |

### 2.5 Activity stepped view/edit card

| | |
| --- | --- |
| **Exists** | `ActivityDetailsModal` + `ActivityEditorPage`. |
| **Interpret** | All fields already exist on `Activity`. |
| **Gap** | Not stepped; edit is full-page. |
| **Change** | New `ActivityStepsModal` (or upgrade details modal): steps Overview / Curriculum / How to run it / Resources / Assessment; Edit toggle; arrows; autosave via existing `updateActivity`; “Add to lesson”. Reuse editors/fields from `ActivityEditorPage`. |
| **Risk** | Duplicating editor logic — extract shared field groups. |

### 2.6 Preview lesson (swipe) + Choose plan template

| | |
| --- | --- |
| **Exists** | `LessonPrintPreview` (A4); no swipe deck; no plan templates. |
| **Gap** | Mockup header actions. |
| **Change** | `PreviewLessonModal`: swipe/pager through activity (+ section) cards for the draft lesson. `ChoosePlanTemplateModal`: list templates filtered by KS from Settings; applying seeds `sections` if empty (confirm if non-empty). |
| **Risk** | Confusing “Preview lesson” (card swipe) vs “Preview” print tab — label clearly. |

### 2.7 Lesson plan modal (sequence, Flesh out, Plan/Preview/Print, PDF)

| | |
| --- | --- |
| **Exists** | `StandaloneLessonCreator` + print preview + `LessonPrintModal` / share. |
| **Interpret** | Closest implementation; evolve it into the modal in mockup 3 (or wrap it). |
| **Gap** | Flexible `+` sections; Flesh out AI; Plan/Preview/Print segmented control matching mockup; PDF must use shared HTML including new sections. |
| **Change** | Refactor creator into modal shell with left sequence (`sections`), right curriculum/objectives/success criteria; toolbar Plan \| Preview \| Print + **Flesh out with AI**; footer Preview + Print/PDF calling `buildLessonPdfHtml` only. **Inline** AI panel (see §2.8). |
| **Risk** | `LessonPrintModal` duplicate HTML — delete/redirect duplicates when touching print. |

### 2.8 Flesh out with AI — editable, re-prompt, history (INLINE)

| | |
| --- | --- |
| **Exists** | `PolishWithAIModal` (fake suggestions) + `applyLessonPolishDraft`. |
| **Interpret** | UX precedent for “AI helps then teacher accepts”; output already lands in editable notes/activities. |
| **Gap** | No real generation; no re-prompt; no history; not labeled Flesh out; not scoped to modal. |
| **Change** | Replace/extend polish into **Flesh out with AI** inside the lesson plan modal: |
| | 1. Generate/revise `sections` + objectives from activities + curriculum + duration + teacher instruction. |
| | 2. Write results into the **same** bound state as manual editors (no lock). |
| | 3. Re-prompt UI: instruction box + scope (whole plan \| current/selected section) + Apply. |
| | 4. Persist `aiFleshOut.history` on the lesson; Undo/Redo AI applies. |
| | 5. Default apply mode **fill empty / skip teacher-dirty**; optional overwrite with confirm. |
| | 6. Keep a lightweight “Polish” path if desired, but do not ship fake-only as the Flesh out button. |
| **Risk** | Token cost / API design; demo mode needs deterministic stub; never overwrite hub-licensed activity resource text. |

### 2.9 Curriculum statements from Settings

| | |
| --- | --- |
| **Exists** | Custom objectives + EYFS/nested standards; selectors in creator. |
| **Change** | Wire checklist to existing APIs only; copy “From your curriculum in Settings.” Deep-link to Settings curriculum admin if empty. |
| **Risk** | Mixing EYFS vs CUSTOM `curriculumType` — respect lesson/class mode. |

### 2.10 Flexible optional sections

| | |
| --- | --- |
| **Exists** | Fixed string fields on `LessonData` / creator. |
| **Gap** | Insert-anywhere, reorder, rename, delete, custom types. |
| **Change** | Implement `sections[]` UI with `+` menus; Settings for custom section types; include in Preview swipe, Plan view, and PDF. Map legacy fields ↔ sections on load/save. |
| **Risk** | PDF regression for old lessons — golden-test HTML for legacy + sections. |

### 2.11 My units tray + term assign + Year overview

| | |
| --- | --- |
| **Exists** | `Unit` localStorage; half-terms API; `TeacherHalfTermBoard` as year scheme UI. |
| **Change** | Right column My units: list subject, count, term; expand tray with lesson thumbs + “Drag lesson here”; assign term dropdown; `+ New unit`. **Year overview** control navigates to existing Half-terms / curriculum board (`ccd:open-tab` → `curriculum` / half-term designer) — do not rebuild the year map inside Lessons. |
| **Risk** | Units only in localStorage — document sync limitation; optional later Supabase table (additive). |

---

## 3. Risks & conflicts (global)

1. **`feat/lessons-unified` already merged Lessons + Builder** — three-column redesign must not revive the old dual-tab split.
2. **Hard-coded subjects/colours** in `libraryHierarchy.ts` conflict with “nothing hard-coded” — treat as temporary defaults only.
3. **Print HTML duplication** in `LessonPrintModal` vs `lessonPdfHtml.ts` — conflict with “same template as PDFBolt”; fix in the print phase.
4. **Units localStorage vs halfTerms Supabase** — two assignment models; define read path for tray (prefer Unit.term + lessonNumbers; keep halfTerms.lessons in sync when assigning).
5. **Fake AI polish** — product expects real Flesh out; don’t leave preview-only behind the same button label.
6. **ActivityEditorPage vs stepped modal** — avoid two divergent editors.
7. **Demo mode / RLS** — AI and saves must respect `isDemoModeActive()` and view-only (`useIsViewOnly`).
8. **Additive migrations only** — per `docs/CCD_AGENT_HANDOFF.md`.

---

## 4. Suggested phases & acceptance criteria

### Phase 0 — Spike & contracts (no UI polish)

**Done when:**

- [ ] Short ADR in PR description listing files to extend vs replace.
- [ ] `LessonSection` / `LessonAiFleshOutState` types added (or documented in shared types file) without breaking load of existing lessons.
- [ ] Legacy → `sections` normalizer utility with unit tests for a sample `LessonData`.

### Phase 1 — Three-column shell on `LessonsWorkspace`

**Done when:**

- [ ] Lessons tab shows library \| portrait lesson \| My units at desktop; usable stacked layout on mobile.
- [ ] KS dropdown EYFS–KS5 filters subject blocks.
- [ ] Subject blocks expand to activities from Settings (hidden respected); colours from Settings.
- [ ] Drag activity onto lesson; reorder; delete; duration updates.
- [ ] Existing lessons still open/save via DataContext.

### Phase 2 — Activity steps modal

**Done when:**

- [ ] Click activity → stepped modal (5 steps), view + edit, arrows, autosave, Add to lesson.
- [ ] No regression to library full-page editor entry points (can keep as advanced/alternate).

### Phase 3 — Flexible sections + lesson plan modal shell

**Done when:**

- [ ] Lesson plan modal lists ordered `sections` with `+` insert menu (built-ins + Settings custom types).
- [ ] Sections move / rename / delete.
- [ ] Curriculum checklist uses Settings objectives/standards only.
- [ ] Plan \| Preview \| Print tabs; Print/PDF HTML === `buildLessonPdfHtml` output for same lesson input.
- [ ] Legacy lessons show equivalent content via normalizer.

### Phase 4 — Flesh out with AI (inline)

**Done when:**

- [ ] Flesh out runs from **inside** lesson plan modal; results editable in-place.
- [ ] Re-prompt whole plan or one section; history undo/redo.
- [ ] Teacher-dirty sections preserved unless overwrite confirmed.
- [ ] Demo mode stub works without API keys.
- [ ] Does not mutate locked partner resource URLs/attribution.

### Phase 5 — Templates, preview swipe, units tray, year overview

**Done when:**

- [ ] Choose plan template (per KS, settings-driven).
- [ ] Preview lesson swipe modal for sequence.
- [ ] Drag lesson into unit tray; My units shows subject, count, term; multi-unit same half-term.
- [ ] Year overview navigates to existing half-term scheme screen using Settings/year term data.
- [ ] Walkthrough/help copy updated if hooks exist.

### Phase 6 — Hardening

**Done when:**

- [ ] Typecheck/build green; demo seed lessons OK; print parity snapshot test; view-only respected.

---

## 5. Ready-to-paste prompts (one per phase)

### Prompt — Phase 0

```
You are implementing CCDesigner planner work on branch feat/lessons-unified (app in artifacts/ccd). DOCUMENTATION CONTRACT: read docs/PLANNER_BUILD_BRIEF.md fully first.

Phase 0 only: define additive TypeScript types for LessonSection, extended LessonData fields (sections, planTemplateId, primarySubjectId, aiFleshOut), and LessonAiFleshOutState/LessonAiPromptTurn as specified in the brief. Add a pure util legacyLessonToSections(lesson: LessonData): LessonSection[] that maps orderedActivities/grouped + introduction/vocabulary/differentiation/assessment/resources/plenary/mainActivity into sections without data loss. Add unit tests. Do not redesign UI yet. Do not break existing loaders. Follow additive-only persistence rules. Summarize files touched.
```

### Prompt — Phase 1

```
Read docs/PLANNER_BUILD_BRIEF.md §0–§2.1–2.4 and §4 Phase 1.

Implement the three-column Lessons workspace mockup (mock/1_main_planner.jpg) inside artifacts/ccd/src/components/LessonsWorkspace.tsx (reuse ActivityLibrary hierarchy utils, LessonDropZone/react-dnd, Settings categories/folders for subjects/colours/hidden, libraryHierarchy key stages). Top-left KS dropdown EYFS–KS5. Left: expandable subject blocks → activities. Centre: portrait lesson rectangle, multi-subject DnD, reorder, delete, duration. Right: My units panel shell (can be mostly presentational if data wiring is stubbed to existing Unit localStorage + halfTerms). Do not hard-code subject lists/colours when Settings provides them. Keep DataContext save/load working. No separate Flesh out work yet. Acceptance: Phase 1 checklist in the brief.
```

### Prompt — Phase 2

```
Read docs/PLANNER_BUILD_BRIEF.md §2.5 and mock/2_activity_card_steps.jpg.

Build a stepped Activity view/edit modal used from the new planner library/lesson cards. Steps: Overview, Curriculum, How to run it, Resources, Assessment. Keep view AND edit (Edit toggle). Arrow navigation, autosave via existing updateActivity, Add to lesson. Reuse field editors from ActivityEditorPage / standards / custom objectives — do not invent a new curriculum data source. Prefer upgrading ActivityDetailsModal or a new ActivityStepsModal shared by library and lesson. Acceptance: Phase 2 checklist.
```

### Prompt — Phase 3

```
Read docs/PLANNER_BUILD_BRIEF.md §1.2, §2.7, §2.9–2.10 and mock/3_lesson_plan_modal.jpg.

Evolve StandaloneLessonCreator (or a LessonPlanModal wrapper) so the lesson sequence is sections[] with + insert-anywhere (Free text, Differentiation, Vocabulary, AfL, Health and safety, Homework, + custom types from Settings). Sections reorder/rename/delete. Right rail: curriculum statements FROM existing Settings objectives/EYFS standards only; learning objective + success criteria. Tabs Plan | Preview | Print. Print/PDF must call buildLessonPdfHtml in utils/lessonPdfHtml.ts (extend renderer for sections). Remove/avoid duplicate HTML in LessonPrintModal/share paths for this flow. Legacy lessons via legacyLessonToSections. Acceptance: Phase 3 checklist.
```

### Prompt — Phase 4

```
Read docs/PLANNER_BUILD_BRIEF.md §1.5 and §2.8 carefully.

Implement "Flesh out with AI" INLINE inside the lesson plan modal (not a separate screen/route). Requirements:
- AI output writes into the same editable sections/fields teachers already edit; nothing locked.
- Teacher can re-prompt with free-text instructions for the whole plan OR a single section (examples: make more practical; add SEND adaptation; restructure for 60 min).
- Persist prompt history on lesson.aiFleshOut with undo/redo of applies (snapshots).
- Preserve teacher manual edits by default (track dirty sections); overwrite only with explicit confirm/apply mode.
- Demo mode: deterministic stub if no API key; never spend tokens in tests.
- Do not replace hub/partner licensed activity resource text.
Replace or clearly demote PolishWithAIModal preview-only behaviour so the Flesh out button is not fake.
Acceptance: Phase 4 checklist.
```

### Prompt — Phase 5

```
Read docs/PLANNER_BUILD_BRIEF.md §2.6 and §2.11.

Add: (1) Choose plan template per key stage from Settings-driven PlanTemplate list; (2) Preview lesson swipe/pager modal over sections/activities; (3) Finish My units: subject tag, lesson count, term assign, expand tray, drag lesson into unit, allow multiple units per half-term; (4) Year overview control navigates to the existing half-terms / TeacherHalfTermBoard (curriculum tab) using term dates/year already in Settings/DataContext — do not rebuild the year map. Wire AssignToHalfTerm / Unit updateUnit consistently. Acceptance: Phase 5 checklist.
```

### Prompt — Phase 6

```
Read docs/PLANNER_BUILD_BRIEF.md §3 and §4 Phase 6.

Harden planner work: typecheck/build; fix print parity (single HTML source); demo seed; view-only; DnD edge cases; mobile layout; ensure no hard-coded subjects/section types remain in new UI paths; update help/walkthrough hooks if present. Add a short QA notes section to the PR. No drive-by refactors outside planner paths.
```

---

## 6. Mockup → UI checklist (quick)

| Mockup | Primary build target |
| --- | --- |
| `mock/1_main_planner.jpg` | `LessonsWorkspace` three columns + header actions |
| `mock/2_activity_card_steps.jpg` | Stepped activity modal |
| `mock/3_lesson_plan_modal.jpg` | Lesson plan modal + flexible sections + Flesh out + Plan/Preview/Print |

---

## 7. Out of scope (unless product amends)

- Rebuilding Partner Hubs, Interactive Lesson Viewer, or Timetable from scratch.
- Renaming the product to Planner.
- Destructive Supabase migrations.
- A second curriculum database for the lesson modal.

---

*Brief authored against `feat/lessons-unified` code as of docs branch `docs/planner-brief`. Implement on a feature branch cut from `feat/lessons-unified`, not by editing app code in the docs-only branch unless asked.*
