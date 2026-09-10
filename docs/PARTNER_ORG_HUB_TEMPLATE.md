# Partner Organisation Hub template

Jazz North and LSO use the same layout shell:

- `artifacts/ccd/src/components/partners/PartnerOrgHubTemplate.tsx`
- Card UI: `PartnerHubResourceCard.tsx`
- Defaults: `artifacts/ccd/src/config/partnerOrgHubDefaults.ts`
- Draft store: `artifacts/ccd/src/utils/partnerOrgHubDraft.ts`
- Types / section palette: `artifacts/ccd/src/types/partnerOrgHub.ts`

## Sections

| Type | Role |
|------|------|
| `about` | Intro copy + links |
| `featured` | Highlighted pack |
| `resources` | Downloads / seedable cards |
| `info-accordion` | Forums & information (collapsed by default) |
| `courses` / `events` / `cta` | Extra predefined boxes |

Admins can **Edit layout** → **Add section** (palette only) and **Reset** to code defaults. Drafts are localStorage until a cloud admin store exists.

## Subscribe

**Subscribe to {Organisation Name}** opens `PartnerKeyDatesModal` and writes Important dates (same flow as Calendar).
