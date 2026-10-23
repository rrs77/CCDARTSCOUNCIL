# Unified Planner Mock

Standalone **clickable prototype** of the Creative Curriculum Designer unified planner. Local mock data only — nothing touches Supabase or the real app.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4
- `@dnd-kit` for drag-and-drop
- Framer Motion for modal / preview motion

## Run locally

From the repo root (pnpm workspace):

```bash
pnpm install
pnpm --filter @workspace/planner-mock dev
```

Or from this folder:

```bash
pnpm install
pnpm dev
```

Open the printed local URL (default `http://localhost:5180`).

## Build static

```bash
pnpm --filter @workspace/planner-mock build
```

Output: `artifacts/planner-mock/dist/`

A packaged copy is also saved under `/opt/cursor/artifacts/planner-mock-static/` when built in the Cloud Agent environment.

## What’s in the prototype

1. **Main planner** — key stage switcher (EYFS–KS5), collapsible activity library (drag + tap Add), portrait lesson canvas with time bar (amber when over), collapsible My units with tray / term assign / duplicate.
2. **Activity card** — Edit toggle, 5 steps (Overview → Curriculum → How to run it → Resources → Assessment), autosave + undo.
3. **Lesson plan modal** — insert flexible sections between blocks, AI flesh-out with accept/reject, re-prompt, Plan / Preview / Print (A4).
4. **Year overview** — half-term columns from Settings dates, units, curriculum coverage chips.
5. **Settings** — subject colours, add/hide subjects, section types, term dates, class defaults — all live.
6. **Empty state** — “Start from a template”.

Use the floating bottom nav to jump between Planner / Lesson plan / Year / Settings / Empty.

## Notes

- Seeded demo data loads by default (Rhythm Explorers unit + Lesson 1).
- “Flesh out with AI” and re-prompt use canned copy for the prototype.
- No photos or people imagery — subject colour blocks only.
- Design iteration notes: see `REFINEMENTS.md`.

## Open a PR

Branch is `feat/planner-mock` (based on `feat/lessons-unified`):

https://github.com/rrs77/CCDARTSCOUNCIL/compare/feat/lessons-unified...feat/planner-mock?expand=1
