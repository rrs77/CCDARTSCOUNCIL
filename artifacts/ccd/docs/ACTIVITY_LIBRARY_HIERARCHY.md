# Activity Library hierarchy

## Structure

Top level **key stage** → **subject** → **leaf category** (existing folders keep their names and colours).

| Key stage | Subjects |
|-----------|----------|
| EYFS | Music, Drama, Dance, Art |
| KS1–KS3 | Music, Drama, Dance, Art |
| KS4 (GCSE) / KS5 (A level) | Music, Drama, Dance, Art, Photography |

All headings start **collapsed**. Activity counts show on collapsed rows. Expanded state is remembered for the browser session.

Class filter behaviour is unchanged: a class only sees categories assigned to it in Settings (plus vocal warm-up subcategory mapping).

## Spec / guidance sources (England)

Used when writing seed activities (not a substitute for centre exam-board choices):

- **EYFS**: Statutory framework for the early years foundation stage — Expressive Arts and Design (EAD) ELGs (creating with materials; being imaginative and expressive). GOV.UK.
- **KS1–KS3 Music / Art**: National curriculum in England programmes of study; **Model Music Curriculum** (DfE, non-statutory) — singing, listening, composing, performing.
- **Ofsted**: Research review series — art and design; music subject research / deep dive expectations (curriculum ambition, teaching, assessment).
- **GCSE Music**: AQA 8271; OCR J536 (AoS include film/game music); Edexcel/Pearson; Eduqas — performing, composing, appraising.
- **GCSE Drama**: AQA 8261; OCR J316; Eduqas — devising, performing texts, evaluation of live theatre.
- **GCSE Dance**: AQA 8236 — performance, choreography, dance appreciation (anthology).
- **GCSE Art & Design / Photography**: AQA; OCR; Edexcel; Eduqas — portfolio + externally set assignment; photography as endorsed title.
- **A level**: AQA/OCR/Edexcel/Eduqas Music, Drama & Theatre, Dance, Art & Design, Photography — coursework/NEA + examined components as per current specs.

Always check the centre’s chosen board specification and NEA dates.

## Data updates

- Snapshot: `artifacts/ccd/src/data/demoSnapshot.json`
- SQL: `supabase/data-updates/2026-10-19_library_hierarchy.sql`
- Counts: `artifacts/ccd/docs/library-hierarchy-counts.json`

Regenerate with:

```bash
node artifacts/ccd/scripts/restructure-library-hierarchy.mjs
```
