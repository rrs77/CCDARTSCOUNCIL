# CCDesigner funding pitch — timed voiceover call sheet

**Purpose:** Persuasive, classy Arts Council / partner funding pitch.  
**Picture:** Autoplay walkthrough at `/ccd-pitch/index.html?autoplay=1` (no music — VO only).  
**Total runtime:** **~2:50** (170 seconds).  
**Tone:** Minimal, clear, confident. Marketing agency for a public-good product — not a feature dump.

---

## How to record

1. Build pitch: `pnpm --filter @workspace/ccd run build:pitch`
2. Open `https://www.ccdesigner.co.uk/ccd-pitch/index.html?autoplay=1` (or local `/ccd-pitch/index.html?autoplay=1`)
3. Mute any ambient audio; record screen + separate VO track
4. Follow **IN / OUT** times below; speak the **VO** column (or paraphrase to timing)

Optional product B-roll (same VO): Partner Hubs → LSO Add → Lesson Builder → Unit → Calendar → PDF Print.

---

## Call sheet

| # | IN | OUT | Dur | On screen | VO (read aloud) |
|---|----|-----|-----|-----------|-----------------|
| 1 | 0:00 | 0:08 | 8s | CCD brand — “Exceptional lessons start with connection” | Open on the CCD mark. Calm and confident. *Exceptional lessons start with connection.* Pause. Let the brand land. |
| 2 | 0:08 | 0:22 | 14s | Problem — arts teachers working alone | Arts teachers — drama, dance, music — are still stitching years from PDFs, drives and last year’s tabs. Often the only specialist in the building. Great practice gets lost. Non-specialists are left guessing. This is the gap funding must close. |
| 3 | 0:22 | 0:38 | 16s | Connection layer — hubs / partners / craft | CCDesigner is the connection layer. Music Hubs. National arts partners. Classroom craft. One workspace so sector expertise reaches the teacher who needs it on Tuesday morning — not as another website to remember, but as planning they already do. |
| 4 | 0:38 | 0:54 | 16s | Partner Hubs / Music Hubs | Partner Hubs puts Music Hubs and organisations in one place. Essex Music Service for Greater Essex. Tri-Borough pathways. LSO packs teachers can open and add. Regional delivery and national excellence — side by side. |
| 5 | 0:54 | 1:09 | 15s | LSO hub → Add to CCDesigner | Open a hub. Choose a resource. Add to CCDesigner. That is the moment funding buys: sector content landing inside the teacher’s living library — not a dead download on a desktop. |
| 6 | 1:09 | 1:23 | 14s | Personal resources + Add to library | Teachers also add their own. Video. Links. Backing tracks. Notes. Partner packs and personal resources sit together — so the scheme is both sector-backed and school-owned. |
| 7 | 1:23 | 1:41 | 18s | Starter / main / plenary — 60 min cap | Then they build the lesson. Starter. Main. Plenary. Example activities dragged into place. Cap: sixty minutes. One hour. Real timetable. No three-hour fantasy plans — teachable craft for a real day. |
| 8 | 1:41 | 1:57 | 16s | Whole unit on half-term planner | Lessons stack into a whole unit. Assign to a half-term. See the arc across six weeks. How to Build an Orchestra. Romeo and Juliet. Whatever the hub and the teacher invent together — visible as a journey, not a pile of files. |
| 9 | 1:57 | 2:12 | 15s | Calendar + partner key dates | The calendar holds it. Lessons on the week. Partner key dates — concerts, workshops, inset — teal on the same grid. The living timetable where hubs and schools meet. |
| 10 | 2:12 | 2:24 | 12s | PDF export & share | Then leave with the work intact. PDF export for the room. Share a link with a colleague. Calendar export for cover and leaders. Proof that the arts were planned — and delivered. |
| 11 | 2:24 | 2:36 | 12s | Celebrating learning in the arts | This is how we celebrate learning in the arts — not as a one-off showcase, but as daily craft made visible to parents, leaders, hubs and the wider sector. |
| 12 | 2:36 | 2:50 | 14s | Funding ask + contacts | The ask: fund the connection layer between hubs and classrooms. Support CCDesigner so Music Hubs and arts organisations put practice where teachers already plan. Visit ccdesigner.co.uk. Contact rob@rhythmstix.co.uk. Book a thirty-minute funder walkthrough. End clean. Hold the brand. |

**End:** 2:50

---

## Timing notes for VO

- Prefer slightly under duration; leave 0.5–1s air at slide changes.
- Slide 7 (lesson hour) and slide 3 (connection) carry the thesis — don’t rush.
- Slide 12: read contact once, clearly; no music bed.

## Product proof (if cutting live UI B-roll)

After demo login, calendar should show **Year 6 Music** lessons for the current week plus seeded LSO / EMS / ROH **key dates**. Lessons are capped at **60 minutes**. Demo PDF: use **Print → Save as PDF**.

## Files

- Manifest + speaker notes: `artifacts/ccd-pitch/src/data/slides-manifest.json`
- Autoplay: `artifacts/ccd-pitch/src/PitchAutoplayViewer.tsx` (per-slide `durationMs`)
- This call sheet: `docs/FUNDING_PITCH_CALL_SHEET.md`
