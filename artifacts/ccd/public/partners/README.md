# Example organisation logos

White wordmark SVGs for the login **example organisations** strip on the dark green (`#002D24`) hero, and for Partner Hubs card strips. These are shown for demonstration only and do not imply partnership or endorsement.

Arts Council England is intentionally omitted from this strip.

Current set includes white-on-transparent SVGs matching the LSO / National Theatre strip style:

- `we-teach-drama.svg` — TD monogram + WE TEACH / DRAMA wordmark
- `essex-music-service.svg` — EMS + ESSEX MUSIC SERVICE
- `icompose.svg` — iCompose + ONLINE COMPOSITION
- `drama-resource.svg` — DRAMA / RESOURCE

## Replacing with official assets

1. Export each organisation’s **white** or **reversed** logo from their brand guidelines (PNG or SVG).
2. Save using the same filename (e.g. `royal-opera-house.svg`).
3. Keep a wide aspect ratio; height is controlled in the UI (~20–28px).
4. If your file is dark-on-transparent and should display white, add `invert: true` for that entry in `src/config/partnerLogos.ts`.
5. If the logo must keep brand colours (or is dark on a light plate), add `onPlate: true` instead — the strip renders a soft white pill behind it.

Do not redraw or alter official logos beyond scaling and approved colour reversals.
