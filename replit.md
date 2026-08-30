# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Drag-and-Drop Architecture

- **Single root provider**: `DndRoot` (in `src/components/dnd/DndRoot.tsx`) wraps the entire app with `react-dnd-multi-backend` (HTML5 + Touch backends). No per-component `<DndProvider>` blocks.
- **Custom drag layer**: `CustomDragLayer` renders ghost previews for all drag types (activity, lesson, pack, objective, year-group).
- **Drop-zone feedback hooks** (in `src/components/dnd/dropFeedback.ts`):
  - `useDropZoneStyle({ isOver, canDrop, variant })` — consistent ring/background highlight on hover
  - `useDropFlash()` — brief green flash on successful drop
- Both hooks are applied to all drop zones: LessonDropZone, TimetableBuilder, CustomObjectivesAdmin, MinimizableActivityCard, StandaloneLessonCreator, and LessonPlannerCalendar (3 zones: month cell, day slot, week slot).

## Branding

- Product name is "Creative Curriculum Designer" (never "Planner")
- Settings normalization auto-replaces "Planner" with "Designer" in saved branding on load (localStorage, Supabase, and refresh paths in SettingsContextNew.tsx)
- Login page: split-screen layout — dark navy/purple gradient left panel, white right panel with form
- Login colors: purple/violet accent (#a78bfa, #7c3aed) for Sign In button, title italic, and links

## Settings Modal (UserSettings.tsx)

- Backdrop blur overlay, mobile bottom-sheet layout (h-[95vh], rounded-t-2xl)
- Pill-style tab navigation (rounded-lg, bg-teal-600 active state)
- Responsive content padding (p-4 sm:p-6 lg:p-8)
- Tabs: Year Groups, Categories, Objectives, Resource Shop, Admin dropdown

## Demo / Preview Mode

- Activated from the login page "Preview Full App" button or school homepage "Start Demo"
- `activateDemoMode()` sets `sessionStorage["ccd-demo-mode"]="1"`, `seedDemoLocalStorage()` populates sample Performing Arts content (Drama, Music, Dance)
- `useDemoMode` hook (`src/hooks/useDemoMode.ts`) provides `isDemo`, `showUpgradePrompt`, `gateFeature`, `truncateForDemo`
- `PreviewBanner` (indigo/violet gradient) shows at top with "Preview" badge, sign-up CTA, and Exit button
- DemoWatermark was removed (too distracting)
- Export/print/share gated: LessonExporter, LessonPrintModal, LessonDetailsModal, TimetableModal all block with upgrade toast in demo mode
- Activity descriptions truncated (~90-120 chars) with fade-out gradient and sign-up prompt in demo mode
- Lock icons replace Download/Link icons on export/share buttons in demo mode
- `AuthContext` injects synthetic `viewer` role user; `useIsViewOnly` hides save/delete/edit controls

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
