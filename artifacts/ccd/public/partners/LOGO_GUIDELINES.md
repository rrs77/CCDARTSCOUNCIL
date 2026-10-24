# Partner logo guidelines (directory cards)

Applies to the **Arts organisations** and **Paid resources** cards in Partner Hubs
(`OrgLogoStrip` / `OrgLogoMark` in `src/components/hubsPreview/PartnerHubsDirectoryViews.tsx`).

## Asset format
- **White SVG wordmark** (`fill="#fff"`), **transparent background**: no rect behind the text.
- **viewBox height 36**. Start from `0 0 200 36` (as in `bristol-old-vic.svg`), then trim the width to the
  text's right edge (e.g. `0 0 69 36`). Without the trim, empty space shrinks the logo inside the fixed box.
- Font: `font-family="Arial, Helvetica, sans-serif" font-weight="700" letter-spacing="0.18em"`, uppercase.
- **Font size 12**.
  - One line: baseline `y="22"`.
  - Two lines: baselines `y="14"` and `y="30"`.
- Keep the rendered width ≤ ~116px at 32px tall (about 130 viewBox units). For longer names, use two lines or
  drop the size slightly (RSC uses 8.5).
- Add `role="img"` and `aria-label="<Organisation name>"`.
- File location: `public/partners/<slug>/<name>-wordmark-white.svg` or `public/partners/paid-logos/...`.

## Tile
- Tile colour **#111111**.
- The card enforces the logo box, so any new logo renders at the same size:
  - logo box 32px tall (24px compact), `object-contain object-left`, `max-w-full`
  - tile 48px tall (36px compact), left padding 16px (12px compact)
  - right safe zone 56px (48px compact), kept clear for the save/heart button

## Where it's referenced: `src/config/partnerHubs.ts`
For each hub entry:
- `logoSrcOnDark: '/partners/.../<name>-wordmark-white.svg'`: the card logo (takes priority over `logoSrc`).
- `logoPanelColor: '#111111'`: the tile colour.
- `logoSrc` / `logoOnPlate` stay as the colour brand mark for the hub page header. Don't change them for card styling.
