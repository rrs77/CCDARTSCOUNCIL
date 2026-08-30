CCDesigner – Product docs as Word-friendly HTML
==============================================

These .html files were generated from the markdown docs in docs/product/.

TO GET WORD DOCUMENTS (.docx):
1. Open any .html file in Microsoft Word (File > Open, or double-click).
2. In Word: File > Save As > choose "Word Document (*.docx)" and save.

FILES:
- 01_PRODUCT_SPEC_AND_FEATURES.html  → Product spec and feature list
- 02_ARCHITECTURE_AND_MISSING_FEATURES.html → Architecture and gaps
- 03_LICENSING_AND_SALES.html        → Licensing and sales copy
- 04_DEVELOPMENT_ROADMAP.html        → Development roadmap
- 05_CODEBASE_ANALYSIS_GUIDE.html    → Codebase analysis guide
- README.html                        → Product docs index
- WETEACHDrama_Video_Script.html     → Video recording script for We Teach Drama

TO REGENERATE (after editing the .md files):
  node scripts/export-product-docs-to-word.js
