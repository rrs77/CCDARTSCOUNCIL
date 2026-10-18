# Interactive Lesson Viewer (prototype)

Self-contained module for Google Vids–style interactive lessons inside CCDesigner.

## Surfaces

| Surface | Who | Entry |
|--------|-----|--------|
| **Lesson Viewer** tab | Everyone (list/player); editor for admin / hub admin | Dashboard → Lesson Viewer |
| **Editor** | `admin`, `superuser`, `super_admin`, `organisation`, or hub `admin`/`owner` | Hub → Edit / New |
| **Player** | Anyone with a published lesson (or attach) | Hub Play, or lesson modal |
| **Attach** | Teachers attaching published content | Lesson details → Add interactive lesson |

## Setup for Rob

1. **Migration** — run in Supabase SQL Editor:
   - `supabase/migrations/20261018_interactive_lessons.sql`
2. **Optional Whisper auto-transcribe** — set server env (never commit):
   - `OPENAI_API_KEY` (or `WHISPER_API_KEY`)
   - Also ensure `SUPABASE_JWT_SECRET` or `SUPABASE_SERVICE_ROLE_KEY` for `/api/interactive-lessons/transcribe`
3. Without a key, Tap to sync + paste/auto-align still work.

## Demo content

Shipped as `demo-interactive-lesson` (published): intro sting MP4, title, karaoke sample (placeholder tone + timed lyrics), YouTube, audio, Canva/PPT placeholders, image+text.

Media under `public/interactive-lessons/`.

## Design

Studio Score tokens (Plus Jakarta Sans, ink/indigo/sun on lilac/canvas). Partner Hubs keep forest/teal.

## Decisions to review

- Editor also unlocked in authorized prototype **demo mode** so Preview can show the full UX; production still role-gated.
- Lessons stored as JSON documents (`interactive_lessons.data`) + localStorage fallback.
- Canva / PowerPoint: embed vs MP4 trade-offs documented in-scene notes.
- Auth: reuses CCDesigner sessions — no second login.
