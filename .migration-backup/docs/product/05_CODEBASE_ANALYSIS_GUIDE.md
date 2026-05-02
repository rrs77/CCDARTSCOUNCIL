# How to Analyse the CCDesigner Codebase (Cursor Project)

This guide helps you (or a developer/AI) **extract current features and architecture** from the Cursor project so that product docs stay aligned with what’s actually implemented.

---

## 1. Best method: layered discovery

Use a **top-down then bottom-up** pass so you don’t miss areas.

### Step 1 – Entry and shell

- **Entry:** `src/main.tsx` → `App.tsx`.  
- **Auth gate:** In `App.tsx`, see how login and reset-password are handled; which provider wraps the app (e.g. `AuthProvider`, `DataProvider`, `SettingsProviderNew`).  
- **Main UI:** After login, what is the single root content (e.g. `Dashboard`). No router → single-page tabs.

**Search tips:**

- `pathname`, `route`, `Router` → confirm there is no React Router; only `pathname === '/reset-password'` in App.  
- `TabsTrigger`, `TabsContent`, `value="..."` in `Dashboard.tsx` → list of main sections (Unit Viewer, Lesson Library, Lesson Builder, Activity Library, Calendar).

### Step 2 – Data and config

- **Data:** `src/contexts/DataContext.tsx` – what is loaded (lessons, half-terms, activities, etc.), from where (Supabase, localStorage), and key function names (`loadData`, `updateLessonData`, etc.).  
- **Settings:** `src/contexts/SettingsContextNew.tsx` – year groups, categories, branding, resource links.  
- **API and tables:** `src/config/api.ts` and `src/config/supabase.ts` – list of `TABLES`, and in api.ts the main `*Api` objects (e.g. `activitiesApi`, `lessonsApi`, `halfTermsApi`).  
- **Custom objectives:** `src/config/customObjectivesApi.ts`, `src/types/customObjectives.ts`.

This gives you the **data model** and **backend surface** (Supabase tables and serverless endpoints like `api/generate-pdf.js`).

### Step 3 – Features by area

For each product area, find the main components and hooks:

| Area | Where to look | What to list |
|------|----------------|--------------|
| Activities | `ActivityLibrary`, `ActivityCreator`, `ActivityDetailsModal`, `api.ts` activitiesApi | CRUD, search, filter, import, categories |
| Lessons | `LessonLibrary`, `StandaloneLessonCreator`, `LessonPlanBuilder`, `DataContext` lessons/half-terms | Build from activities, half-terms, stacks, copy to class |
| Units / half-terms | `UnitViewer`, `HalfTermView`, `HalfTermCard`, `AssignToHalfTermModal` | Assign lessons, term copy |
| Stacks | `useLessonStacks`, `LessonStackBuilder`, `StackedLessonCard`, `AssignStackToTermModal` | Create stacks, assign to terms |
| Calendar | `LessonPlannerCalendar`, `CalendarLessonAssignmentModal`, `TimeSlotLessonModal` | Week/month view, assign plans to dates |
| Export / share | `useShareLesson`, `LessonPrintModal`, `api/generate-pdf.js`, `pdfApi.ts` | PDF export, copy link, share timetable |
| Curriculum | `NestedStandardsBrowser`, `CustomObjectivesAdmin`, `ObjectiveSelector`, `customObjectivesApi` | EYFS, custom objectives, attach to lessons/activities |
| Settings | `UserSettings`, `DataSourceSettings`, `Header` (class switcher) | Year groups, categories, branding, data source, admin |
| Auth | `AuthContext`, `LoginForm`, `ResetPasswordPage`, `useAuth` | Login, reset, roles, view-only |

Grep for **button labels and modal titles** (e.g. “Export PDF”, “Copy Link”, “Custom Objectives”) to cross-check the feature list.

### Step 4 – White-label and licensing readiness

- **Branding:** Grep `branding`, `loginTitle`, `footerCompanyName`, `schoolLogo`, `branding_settings`.  
- **Admin-only UI:** Grep `isAdmin`, `role === 'admin'`, `showUserManagement` and see which tabs or modals are gated.  
- **Multi-tenant:** Search for `organisation_id`, `tenant_id`, `user_id` in RLS or api; currently likely single-tenant or user-scoped.

### Step 5 – External services

- **Supabase:** `config/supabase.ts` (URL, anon key, auth toggle).  
- **PDF:** `api/generate-pdf.js` (PDFBolt, Blob), `utils/pdfApi.ts` (getPdfApiUrl).  
- **Email:** Docs (e.g. `SUPABASE_RESEND_SMTP.md`) and Supabase dashboard config; not in app code.

---

## 2. Automating feature extraction (Cursor / scripts)

### Option A – Cursor chat / agent

- Ask: “List all main user-facing features in this app, with the component or file that implements each.”  
- Then: “List all Supabase tables and the main api.ts endpoints.”  
- Use the answers to fill or update `01_PRODUCT_SPEC_AND_FEATURES.md`.

### Option B – Grep and glob

Run from repo root:

```bash
# Main tabs/sections
rg -n "TabsTrigger|TabsContent" src/components/Dashboard.tsx

# API surfaces
rg -n "Api = \{|\.getBySheet|\.getAll|\.create\(" src/config/api.ts

# Tables
rg -n "TABLES\.|from\('" src/config/supabase.ts src/config/api.ts

# Branding
rg -n "branding|loginTitle|footerCompanyName" src --type-add 'fe:*.{ts,tsx}' -t fe
```

Use results to build a checklist of “feature → file” for the spec.

### Option C – Simple script (optional)

A small Node or script that:

1. Reads `src/components/Dashboard.tsx` and parses `TabsTrigger` / `TabsContent` values.  
2. Lists `src/config/supabase.ts` TABLES.  
3. Lists exports from `src/config/api.ts` (e.g. `lessonsApi`, `activitiesApi`).  

Output: a minimal “feature shell” (tab names, tables, API names) that you then annotate with descriptions from the product overview.

---

## 3. Keeping docs in sync

- **After a major feature:** Update the feature list in `01_PRODUCT_SPEC_AND_FEATURES.md` (add row, set Status ✅/❌/Partial).  
- **After a new table or API:** Update `02_ARCHITECTURE_AND_MISSING_FEATURES.md` (data model table).  
- **After a release:** Bump version/date in the “Document control” section of the relevant doc.  
- **Roadmap:** When something is shipped, move it from “Planned” to “Done” in `04_DEVELOPMENT_ROADMAP.md` and add a short “Shipped” note if useful.

---

## 4. Quick reference – key files

| Purpose | File(s) |
|--------|--------|
| App entry, auth gate, reset-password | `src/App.tsx`, `src/main.tsx` |
| Main tabs and content | `src/components/Dashboard.tsx` |
| Lesson and activity data | `src/contexts/DataContext.tsx` |
| Settings, branding, year groups, categories | `src/contexts/SettingsContextNew.tsx` |
| Auth and profile | `src/contexts/AuthContext.tsx`, `src/hooks/useAuth.ts` |
| Supabase and table names | `src/config/supabase.ts` |
| Backend API (Supabase + serverless) | `src/config/api.ts`, `api/generate-pdf.js` |
| Custom objectives | `src/config/customObjectivesApi.ts`, `src/components/CustomObjectivesAdmin.tsx` |
| Share lesson / PDF | `src/hooks/useShareLesson.ts`, `src/components/LessonPrintModal.tsx` |
| User and admin settings UI | `src/components/UserSettings.tsx` |

Using this guide, you can periodically re-scan the codebase and update the product docs so they stay an accurate reflection of the system for licensing, sales, and development planning.
