# CCDesigner feature demo — archived

**Status:** Archived (July 2026). The primary product tour is now the **animated Feature Walkthrough** (`/ccd-pitch/` via the login “Feature walkthrough” / start-popup CTA). This MP4 is kept in-repo for reference but is **not** pushed as the first-open experience.

## Assets

- **MP4:** `ccdesigner-feature-demo.mp4`
- Optional archive path: keep files here, or move under `archive/` later if desired

## Slide colour palette (fixed 1920×1080 video — not responsive)

| Token | Hex | Use |
|-------|-----|-----|
| `--bg-deep` | `#05231e` | Deepest background |
| `--bg-forest` | `#002D24` | Primary forest field |
| `--text` | `#FFFFFF` | Headlines |
| `--text-body` | `#F2F7F4` | Body copy (high contrast) |
| `--accent` | `#B6FF7E` | Eyebrows / underlines only |

## Historical pathway (recorded video)

1. Logo → context → disclaimer → live login  
2. Explore → **LSO hub** → Activity Library → Lesson → Term  
3. **Key dates** → Settings → Create → Calendar week  
4. **Paid** (WTD / iCompose) → Organisations → Closing  

## Audio

Background music muxed at encode time from `audio/head-of-the-class.mp3`. Soft bed (~20% volume). **Rights:** clear clearance/licence before public distribution.

## Contact

- Email: [rob@rhythmstix.co.uk](mailto:rob@rhythmstix.co.uk?subject=CCDesigner%20Query)  
- Web: [www.ccdesigner.co.uk](https://www.ccdesigner.co.uk)  

## Re-record (optional)

```bash
cd artifacts/ccd/scripts/feature-demo
node record-feature-demo.mjs
```

Do not commit `raw-video/` (gitignored).
