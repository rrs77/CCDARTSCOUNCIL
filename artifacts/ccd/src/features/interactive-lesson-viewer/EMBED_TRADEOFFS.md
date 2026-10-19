# Canva & PowerPoint trade-offs

## Canva

| Approach | Pros | Cons |
|----------|------|------|
| **Share / embed link** | Keeps Canva layout; easy for teachers | Animations depend on Canva’s embed player; needs network; link permissions matter |
| **Exported MP4** | Motion plays as designed offline-friendly once cached | Flat video — no live edit; larger files |

## PowerPoint

| Approach | Pros | Cons |
|----------|------|------|
| **Office Online embed** | Slide advances & many animations when file URL is publicly reachable | Requires Microsoft viewer + public/hosted file |
| **Uploaded .pptx only** | Familiar teacher workflow | Browser cannot natively play PPTX animations |
| **Export to MP4/video** | Guaranteed playback of authored motion | Flattened; loses editable slides |

## Cloud file links (Drive / Dropbox / OneDrive / iCloud / Box)

| Approach | Pros | Cons |
|----------|------|------|
| **Provider preview / embed URL** | Teachers keep files in familiar cloud drives | Embed depends on link sharing + CSP `frame-src`; some providers block framing |
| **Direct media URL** | Works for audio/image in `<audio>` / `<img>` | Requires a publicly reachable or signed URL; CORS may block waveform decode |
| **Download + re-upload to lesson storage** | Reliable classroom playback | Extra step; storage quota |

CSP allows Drive, Docs, OneDrive, SharePoint, and Office Online viewers. Dropbox / Box / iCloud often need export or share-preview URLs rather than raw edit links.

## Free media (Openverse / Wikimedia / optional Freesound)

| Approach | Pros | Cons |
|----------|------|------|
| **Client search + hotlink** | No new serverless functions; CC0/PD discoverable in-editor | Depends on third-party CDN CORS; attribution must stay with the asset |
| **Copy into lesson media library / Storage** | Stable offline-friendly once uploaded | Storage cost; license text should still be kept on the library item |

Drag-and-drop places images on the stage and sounds on the Music lane (with fade handles). Prefer Openverse CC0/PD filters; Freesound needs `VITE_FREESOUND_API_KEY`.

## Generic embed

Placeholder for future media types (interactive widgets, H5P, etc.) until decided.
