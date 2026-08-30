---
name: Walkthrough viewer architecture
description: Why the ccd-pitch autoplay viewer must render slides in a 16:9 iframe, not inline
---

Pitch slides size text/layout with vw/vh units, so they only look right when the viewport itself is 16:9. Rendering them inline in a non-16:9 window (mobile) breaks proportions and CSS transform-scaling cannot fix viewport units.

**Why:** Responsive rework of the Feature Walkthrough (July 2026) — inline rendering with `[&_.h-screen]:!h-full` overrides produced giant/squeezed text on phones.

**How to apply:** Keep `PitchAutoplayViewer` rendering slides inside a letterboxed 16:9 iframe sized via ResizeObserver, with all navigation driven from the viewer via `postMessage({type:'navigateToSlide', position})` and a transparent overlay owning tap/swipe (prevents parent/iframe state drift). The embedded bundle in the ccd app must be rebuilt with `pnpm --filter @workspace/ccd run build:pitch` after any ccd-pitch change.
