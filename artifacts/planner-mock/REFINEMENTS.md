# Design refinement passes

## Pass 1 — Critique → structure & empty state

- Fixed broken empty state (no longer wiped units/lessons; canvas-only clear)
- Restored empty canvas with illustration, CTAs, atmospheric wash
- Segmented lesson-time bar tinted by subject; amber when over target
- Stronger drag-handle affordances + drop-target pulse on canvas
- Proto nav with icons + active state
- Escape / overlay close for modals
- Year overview empty half-terms with dashed + guidance

## Pass 2 — Hierarchy, motion cues, consistency

- Flexible sections visually distinct (indigo section chrome + “Section” pill)
- Subject accordion headers fully rounded
- Hover lift on library + lesson cards
- Activity “Add” always visible on small screens
- Header wraps cleanly on narrower widths
- First activity add from empty creates a new lesson automatically
- Tablet: hide side columns at breakpoints to keep canvas readable

## Pass 3 — Responsiveness & flexibility

- Floating **My units** / **Library** drawers for iPad widths
- Proto nav available on Year + Settings screens
- Settings remain live source of truth (colours, subjects, sections, terms)
- Screenshot suite for desktop, iPad, activity card, lesson plan + AI, preview, year, settings, empty, template, over-time, print A4

## Pass 4 — Rob feedback

- Single shared `ModalShell` size for activity card, lesson plan, swipe preview, templates, and Settings curriculum dialogs (same footprint on iPad)
- Removed Health and safety section type and related AI flesh-out copy
- Curriculum is user-defined in Settings: frameworks → strands (per subject + key stage) → statements; lesson/activity pickers only use those
- Long activity / unit / lesson names wrap to 2 lines with full `title` tooltip on hover
