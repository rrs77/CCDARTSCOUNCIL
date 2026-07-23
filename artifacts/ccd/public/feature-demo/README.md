# CCDesigner feature demo (external organisations)

Shareable walkthrough of the **working CCDesigner prototype**, recorded from the live UI (not slides alone).

## Deliverables

| File | Purpose |
|------|---------|
| [`ccdesigner-feature-demo.mp4`](./ccdesigner-feature-demo.mp4) | Preferred share file (email / Drive / Teams) |
| [`ccdesigner-feature-demo.webm`](./ccdesigner-feature-demo.webm) | Same recording (Chrome / Firefox / Edge) |
| [`index.html`](./index.html) | Chaptered player + stills fallback |
| [`frames/`](./frames/) | Key stills from each chapter |
| [`manifest.json`](./manifest.json) | Chapter titles / captions |

**Absolute paths (this machine):**

- `/Users/rfreich-storer/CCDesignerARTSCOUNCIL/artifacts/ccd/public/feature-demo/ccdesigner-feature-demo.mp4`
- `/Users/rfreich-storer/CCDesignerARTSCOUNCIL/artifacts/ccd/public/feature-demo/ccdesigner-feature-demo.webm`
- `/Users/rfreich-storer/CCDesignerARTSCOUNCIL/artifacts/ccd/public/feature-demo/index.html`

## How to open / share

1. **Send the MP4** — attach or upload `ccdesigner-feature-demo.mp4` (simplest for partners).
2. **Or host the folder** — with the CCD app running (`pnpm --filter @workspace/ccd run dev`), open:
   - `http://127.0.0.1:5173/feature-demo/`
3. **Or open locally** — double-click `index.html` (chapter stills work offline; video needs same-folder `mp4`/`webm`).

## What the demo shows

1. Login / landing + Explore the working prototype  
2. Half-Term Designer (Unit Viewer)  
3. Activity Library (topics, activities, recently added / partner picks)  
4. Lesson Builder  
5. Lesson Library  
6. Calendar — month view  
7. Calendar — week timed grid  
8. Partner Hubs — music hubs, premium, free organisations  
9. Open a partner hub (+ Add where available)  
10. Partner Planning accordion  
11. Closing / demo disclaimer  

Captions are burned into the recording as an on-screen overlay.

## Disclaimer (include when sharing)

Partners and logos are shown **for demonstration only** and do not imply endorsement, funding, or partnership. This is an early-stage interactive prototype for Arts Council England funding discussions and arts-sector consultation.

## Re-record

Requires the app on `http://127.0.0.1:5173` and Playwright Chromium installed under `artifacts/ccd/scripts/feature-demo`.

```bash
cd artifacts/ccd/scripts/feature-demo
PLAYWRIGHT_BROWSERS_PATH=…  # if needed
node record-feature-demo.mjs
# then encode MP4 (optional):
./node_modules/ffmpeg-static/ffmpeg -y \
  -i ../../public/feature-demo/ccdesigner-feature-demo.webm \
  -c:v libx264 -pix_fmt yuv420p -movflags +faststart -an \
  ../../public/feature-demo/ccdesigner-feature-demo.mp4
```

Prototype password used by the recorder: `artscouncil26` (same as the in-app gate).
