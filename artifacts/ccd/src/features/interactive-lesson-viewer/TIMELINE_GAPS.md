# Interactive Lesson Viewer — timeline audit vs Google Vids

Audit date: 2026-10-24. Compared editor timeline / audio / transitions to Google Vids–style behaviour.

## Fixed in this pass

- Playhead drag-scrub + keyboard nudge (←/→, Home/End) on the scene track
- Scene strip widths proportional to layout duration; right-edge drag changes duration
- Layout/playhead clock no longer clamps manual scenes to 0 ms
- Playback clock uses `sceneClockMs` (timer/media) instead of raw `durationMs`
- Audio clip snap to scene edges, playhead, and other clip edges (hold Alt to disable)
- Left-edge trim updates `trimStartMs`; inspector exposes source trim + duration
- Stage↔timeline splitter already had pointer drag, ArrowUp/Down, double-click/Home reset, `localStorage` — added `aria-valuetext` + focus ring

## Still missing / partial

| Behaviour | Status |
|---|---|
| Real decoded waveforms / peak metering | Pseudo bars only |
| Separate SFX lane (only Voiceover + Music) | Missing |
| Recorded voiceover upload to durable storage | Stays as blob URL |
| Beat / marker snap, snap toggle UI | No beat grid; Alt-bypass only |
| Isolated A/B transition scrub / overlap-aware media crossfade | CSS enter classes from scene start only |
| Video / YouTube scrubbed to playhead like audio | Stage media not frame-synced |
| Scene media in/out handles (trim inside a video clip) | Duration only; no media trim UI |
| Clip-to-clip ripple / overwrite edit modes | Missing |
| Multi-select clips, copy/paste timeline clips | Missing |
| Frame-accurate nudge (1 frame @ project fps) | 100 ms / 1 s steps only |
| Export / render with baked transitions + mix | Preview only |

## Providers (files)

Device, Dropbox, Google Drive, Box, OneDrive, Teams, Google Classroom reuse planner pickers + `/api/lesson-attachments`. Unconfigured providers show **not connected** and do not throw.
