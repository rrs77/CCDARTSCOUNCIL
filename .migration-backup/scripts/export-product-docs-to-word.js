#!/usr/bin/env node
/**
 * Export docs/product/*.md to Word-friendly HTML.
 * Open any .html file in Microsoft Word, then File > Save As > Word Document (.docx).
 *
 * Usage: node scripts/export-product-docs-to-word.js
 * Output: docs/product/word/*.html
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PRODUCT_DIR = path.join(__dirname, '..', 'docs', 'product');
const OUT_DIR = path.join(PRODUCT_DIR, 'word');

const FILES = [
  '01_PRODUCT_SPEC_AND_FEATURES.md',
  '02_ARCHITECTURE_AND_MISSING_FEATURES.md',
  '03_LICENSING_AND_SALES.md',
  '04_DEVELOPMENT_ROADMAP.md',
  '05_CODEBASE_ANALYSIS_GUIDE.md',
  'README.md',
  'WETEACHDrama_Video_Script.md',
];

const WORD_HTML_HEAD = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="UTF-8">
<title>CCDesigner Product Doc</title>
<!--[if gte mso 9]>
<xml><w:WordDocument><w:View>Print</w:View></xml>
<![endif]-->
<style>
body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.4; margin: 1in; }
h1 { font-size: 18pt; margin-top: 12pt; margin-bottom: 6pt; page-break-after: avoid; }
h2 { font-size: 14pt; margin-top: 12pt; margin-bottom: 6pt; page-break-after: avoid; }
h3 { font-size: 12pt; margin-top: 10pt; margin-bottom: 4pt; page-break-after: avoid; }
table { border-collapse: collapse; margin: 8pt 0; width: 100%; }
th, td { border: 1px solid #ccc; padding: 4pt 8pt; text-align: left; }
th { background: #f0f0f0; font-weight: bold; }
p { margin: 6pt 0; }
ul, ol { margin: 6pt 0; padding-left: 24pt; }
li { margin: 2pt 0; }
strong { font-weight: bold; }
code { background: #f5f5f5; padding: 1pt 4pt; font-family: Consolas, monospace; font-size: 10pt; }
hr { border: none; border-top: 1px solid #ccc; margin: 12pt 0; }
</style>
</head>
<body>
`;

const WORD_HTML_TAIL = '\n</body>\n</html>';

function mdLineToHtml(line) {
  let s = line;
  // Bold **text**
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Inline code
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Escape HTML
  s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Restore tags we added
  s = s.replace(/&lt;strong&gt;/g, '<strong>').replace(/&lt;\/strong&gt;/g, '</strong>');
  s = s.replace(/&lt;code&gt;/g, '<code>').replace(/&lt;\/code&gt;/g, '</code>');
  return s;
}

function mdToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let inTable = false;
  let tableRows = [];
  let inList = false;
  let listTag = null;
  let i = 0;

  function flushTable() {
    if (tableRows.length === 0) return;
    out.push('<table>');
    const separatorIdx = tableRows.findIndex(row => row.every(c => /^[-:\s]+$/.test(c.trim())));
    const headerRow = separatorIdx >= 0 ? 0 : -1;
    tableRows.forEach((row, idx) => {
      if (separatorIdx >= 0 && idx === separatorIdx) return; // skip separator line
      const tag = idx === headerRow ? 'th' : 'td';
      out.push('<tr>' + row.map(c => `<${tag}>${mdLineToHtml(c.trim())}</${tag}>`).join('') + '</tr>');
    });
    out.push('</table>');
    tableRows = [];
  }

  function flushList() {
    if (listTag) out.push(`</${listTag}>`);
    listTag = null;
    inList = false;
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Table row
    if (/^\|.+\|$/.test(trimmed)) {
      if (inTable) {
        const cells = trimmed.split(/\|/).slice(1, -1);
        if (cells.length > 0) tableRows.push(cells);
      } else {
        flushList();
        inTable = true;
        const cells = trimmed.split(/\|/).slice(1, -1);
        tableRows.push(cells);
      }
      i++;
      continue;
    }

    if (inTable) {
      flushTable();
      inTable = false;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      flushList();
      out.push('<h3>' + mdLineToHtml(trimmed.slice(4)) + '</h3>');
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      out.push('<h2>' + mdLineToHtml(trimmed.slice(3)) + '</h2>');
      i++;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      out.push('<h1>' + mdLineToHtml(trimmed.slice(2)) + '</h1>');
      i++;
      continue;
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***') {
      flushList();
      out.push('<hr>');
      i++;
      continue;
    }

    // Unordered list
    if (/^[-*] /.test(trimmed) || /^\d+\. /.test(trimmed)) {
      const isOl = /^\d+\. /.test(trimmed);
      const tag = isOl ? 'ol' : 'ul';
      if (!inList || listTag !== tag) {
        flushList();
        listTag = tag;
        inList = true;
        out.push(`<${tag}>`);
      }
      const content = trimmed.replace(/^[-*] /, '').replace(/^\d+\. /, '');
      out.push('<li>' + mdLineToHtml(content) + '</li>');
      i++;
      continue;
    }

    flushList();

    // Empty line
    if (trimmed === '') {
      out.push('<p></p>');
      i++;
      continue;
    }

    // Paragraph (skip markdown link-only lines that are next-line links)
    if (trimmed.startsWith('[') && trimmed.includes('](')) {
      out.push('<p>' + mdLineToHtml(trimmed) + '</p>');
      i++;
      continue;
    }

    out.push('<p>' + mdLineToHtml(trimmed) + '</p>');
    i++;
  }

  if (inTable) flushTable();
  flushList();

  return out.join('\n');
}

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

FILES.forEach((file) => {
  const src = path.join(PRODUCT_DIR, file);
  if (!fs.existsSync(src)) {
    console.warn('Skip (not found):', file);
    return;
  }
  const md = fs.readFileSync(src, 'utf8');
  const body = mdToHtml(md);
  const html = WORD_HTML_HEAD + body + WORD_HTML_TAIL;
  const outName = file.replace(/\.md$/, '.html');
  const outPath = path.join(OUT_DIR, outName);
  fs.writeFileSync(outPath, html, 'utf8');
  console.log('Written:', outPath);
});

console.log('\nDone. Open any .html file in Microsoft Word, then File > Save As > Word Document (.docx).');
