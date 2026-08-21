# Editing “The facts”

**To change a headline, edit [`facts.content.ts`](./facts.content.ts).**  
(`content.ts` re-exports the same module.)

## Shape

| Export | Purpose |
| --- | --- |
| `meta` | Brand, situation headline/line, framing, `ui` chrome |
| `overview` | Canvas size, hero image, headline/hint positions |
| `topics` | Four chips: Exams, Primary, Poverty & place, CCDesigner (`markerLabel`, `x`/`y`, modal copy, charts, neighbours) |
| `topicOrder` | Arrow/swipe ring |
| `glanceModal` | **Key findings** two-page modal (page headings, figures, sections) |
| `stats` / `charts` / `sources` | Shared figures and chart series |

## Key findings modal

Edit `glanceModal.pages` — two pages with clear H2s, not a 9-card grid. Pagination dots live in the UI.

## Optional on-screen keys

`?edit=1` shows content keys. `?glance=1` opens key findings.

## Rules

- Verify numbers against CLA / Ofqual / DfE (or omit)
- “No entries” ≠ “not taught”
- Use “aims to”, not “will solve”
