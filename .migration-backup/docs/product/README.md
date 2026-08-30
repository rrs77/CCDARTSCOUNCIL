# CCDesigner – Product Documentation

This folder contains the **structured product specification, feature list, architecture, licensing model, roadmap, and codebase analysis guide** for CCDesigner.

## Documents

| Document | Purpose |
|----------|--------|
| [01_PRODUCT_SPEC_AND_FEATURES.md](./01_PRODUCT_SPEC_AND_FEATURES.md) | Product overview, **clarifying questions**, and **complete feature list** (from product description + codebase). |
| [02_ARCHITECTURE_AND_MISSING_FEATURES.md](./02_ARCHITECTURE_AND_MISSING_FEATURES.md) | **Software architecture** (stack, frontend structure, data model), **missing product details** to document, **missing features analysis**, and recommended **documentation structure**. |
| [03_LICENSING_AND_SALES.md](./03_LICENSING_AND_SALES.md) | **White-label licensing model**, **customisation framework**, **sales page / “How to license” copy**, and **We Teach Drama pilot checklist**. |
| [04_DEVELOPMENT_ROADMAP.md](./04_DEVELOPMENT_ROADMAP.md) | **Development roadmap** (pilot-ready → licensing → product enhancements → scale) and **future high-value features**. |
| [05_CODEBASE_ANALYSIS_GUIDE.md](./05_CODEBASE_ANALYSIS_GUIDE.md) | **How to analyse the Cursor project** to extract current features and keep docs in sync. |
| [WETEACHDrama_Video_Script.md](./WETEACHDrama_Video_Script.md) | **Video recording script** for a We Teach Drama demo – covers all features and how they help with resources, courses, and webinars. |

## How to use

1. **Answer the clarifying questions** in `01_PRODUCT_SPEC_AND_FEATURES.md` so roadmap and licensing can be finalised.
2. **Share with sales/partners:** Use `01` (feature list) and `03` (licensing and sales copy).
3. **Development planning:** Use `02` (architecture), `04` (roadmap), and `05` (codebase analysis).
4. **Pilot (We Teach Drama):** Use the checklist in `03` and Phase 1 in `04`.
5. **Keeping docs accurate:** Periodically run the analysis in `05` and update `01` and `02`.

## Word export

To get Word documents (.docx) of all product docs and the video script:

1. Run: **`npm run export-product-docs`** (or `node scripts/export-product-docs-to-word.js`).
2. Open the generated files in **docs/product/word/*.html** with Microsoft Word.
3. In Word: **File > Save As > Word Document (.docx)**.

See [docs/product/word/README.txt](./word/README.txt) for the file list.

## Root docs

Other technical and operational docs (Supabase, Vercel, PDF, login, etc.) live in the parent [docs/](../) folder.
