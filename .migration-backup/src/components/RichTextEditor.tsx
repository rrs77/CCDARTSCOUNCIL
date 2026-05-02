import React, { useRef, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Register checklist support for Quill
const List = Quill.import('formats/list');

// Extend the list format to support 'check' type
const originalListValue = List.prototype.value;
List.prototype.value = function() {
  const value = originalListValue.call(this);
  if (this.domNode.getAttribute('data-list') === 'check') {
    return 'check';
  }
  return value;
};

const originalListFormat = List.formats;
List.formats = function(node: any) {
  if (node.getAttribute('data-list') === 'check') {
    return 'check';
  }
  return originalListFormat ? originalListFormat(node) : undefined;
};

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter text here...',
  minHeight = '150px',
  maxHeight = '400px',
  className = ''
}: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);

  // Set up the editor with paste handling and checklist support
  useEffect(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      editor.root.dir = 'ltr';
      
      // Add checklist handler - creates bullet list marked as checklist
      const toolbar = editor.getModule('toolbar');
      if (toolbar) {
        toolbar.addHandler('list', function(value: string) {
          if (value === 'check') {
            const range = this.quill.getSelection(true);
            if (range) {
              // Create bullet list first
              this.quill.format('list', 'bullet', 'user');
              // Mark as checklist after a brief delay to ensure DOM is updated
              requestAnimationFrame(() => {
                const [line] = this.quill.getLine(range.index);
                if (line && line.domNode) {
                  const listItem = line.domNode.closest('li');
                  const list = listItem?.parentElement;
                  if (list && list.tagName === 'UL') {
                    list.setAttribute('data-list', 'check');
                    list.classList.add('ql-checklist');
                  }
                }
              });
            }
          } else {
            // Use default handler for bullet/ordered
            this.quill.format('list', value, 'user');
          }
        });
        
        // Fix strikethrough - only apply when text is selected (not when typing)
        const originalStrikeHandler = toolbar.handlers.strike;
        toolbar.addHandler('strike', function() {
          const range = this.quill.getSelection();
          // Only apply strikethrough if there's a selection with length > 0
          if (!range || range.length === 0) {
            // No selection - don't apply strikethrough, just return
            return;
          }
          // Use default handler for selected text
          if (originalStrikeHandler) {
            originalStrikeHandler.call(this);
          } else {
            const format = this.quill.getFormat(range);
            this.quill.format('strike', !format.strike, 'user');
          }
        });
      }
      
      // Add click handler for checklist items
      const handleChecklistClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const listItem = target.closest('li');
        if (listItem) {
          const list = listItem.parentElement;
          if (list && (list.classList.contains('ql-checklist') || list.getAttribute('data-list') === 'check')) {
            e.preventDefault();
            listItem.classList.toggle('ql-checked');
            // Trigger change event
            editor.update();
          }
        }
      };
      
      editor.root.addEventListener('click', handleChecklistClick);

      // Paste handler: for plain-text multi-line pastes (e.g. song lyrics), use soft breaks
      // within stanzas (\n) and paragraph breaks between stanzas (\n\n) - avoids huge gaps
      const handlePaste = (e: ClipboardEvent) => {
        const plain = e.clipboardData?.getData('text/plain');
        const html = e.clipboardData?.getData('text/html');
        if (!plain || !plain.includes('\n')) return;
        // Skip if paste has rich formatting we want to preserve
        if (html && /<(strong|b|em|i|ul|ol|li|h[1-6])/i.test(html)) return;
        e.preventDefault();
        const lines = plain.split(/\r\n|\r|\n/);
        const stanzas: string[] = [];
        let i = 0;
        while (i < lines.length) {
          const stanza: string[] = [];
          while (i < lines.length && lines[i].trim() !== '') {
            stanza.push(lines[i]);
            i++;
          }
          if (stanza.length) stanzas.push(stanza.join('\n'));
          while (i < lines.length && lines[i].trim() === '') i++;
        }
        const content = stanzas.join('\n\n') + (stanzas.length ? '\n' : '');
        const Delta = Quill.import('delta');
        const range = editor.getSelection(true) || { index: 0, length: 0 };
        const delta = new Delta()
          .retain(range.index)
          .delete(range.length)
          .insert(content);
        editor.updateContents(delta, 'user');
        editor.setSelection(range.index + content.length, 0);
      };
      editor.root.addEventListener('paste', handlePaste);

      // Custom clipboard matcher: fix list doubling, but preserve formatting (bold, italic, etc.)
      const clipboard = editor.getModule('clipboard');
      if (clipboard) {
        const originalMatchers = clipboard.matchers.slice(0);
        clipboard.matchers = [];

        // Add our list/BR handler first - only for elements we need to fix
        clipboard.addMatcher(Node.ELEMENT_NODE, (node: any, delta: any) => {
          if (node.tagName === 'UL' || node.tagName === 'OL') {
            const listItems = Array.from(node.querySelectorAll('li'));
            const ops: any[] = [];
            listItems.forEach((li: any) => {
              // Preserve inline formatting (bold, italic) within list items
              const liDelta = getDeltaFromNode(li);
              if (liDelta.ops?.length) {
                ops.push(...liDelta.ops);
              }
              const listType = node.getAttribute('data-list') === 'check' ? 'check' : 
                              (node.tagName === 'OL' ? 'ordered' : 'bullet');
              ops.push({ insert: '\n', attributes: { list: listType } });
            });
            return { ops };
          }
          if (node.tagName === 'BR') {
            return { ops: [{ insert: '\n' }] };
          }
          // Delegate to default matchers to preserve bold, italic, headers, etc.
          for (let i = 0; i < originalMatchers.length; i++) {
            const [selector, handler] = originalMatchers[i];
            if (selector === Node.ELEMENT_NODE || (typeof selector === 'number' && selector === Node.ELEMENT_NODE)) {
              const result = handler(node, delta);
              if (result && result.ops) return result;
              break;
            }
          }
          // Fallback: preserve as formatted text
          return getDeltaFromNode(node);
        });

        clipboard.addMatcher(Node.TEXT_NODE, (node: any, delta: any) => {
          const text = node.data || '';
          return { ops: [{ insert: text }] };
        });
      }

      function getDeltaFromNode(node: Node): { ops: any[] } {
        const ops: any[] = [];
        const walk = (n: Node) => {
          if (n.nodeType === Node.TEXT_NODE) {
            const t = n.textContent || '';
            if (t) ops.push({ insert: t });
            return;
          }
          if (n.nodeType === Node.ELEMENT_NODE) {
            const el = n as HTMLElement;
            const attrs: Record<string, boolean> = {};
            if (el.tagName === 'STRONG' || el.tagName === 'B') attrs.bold = true;
            if (el.tagName === 'EM' || el.tagName === 'I') attrs.italic = true;
            if (el.tagName === 'U') attrs.underline = true;
            if (el.tagName === 'S') attrs.strike = true;
            el.childNodes.forEach(walk);
            // Apply attrs to last insert if we added text
            if (Object.keys(attrs).length && ops.length) {
              const last = ops[ops.length - 1];
              if (typeof last.insert === 'string') last.attributes = { ...last.attributes, ...attrs };
            }
            return;
          }
        };
        node.childNodes.forEach(walk);
        return ops.length ? { ops } : { ops: [{ insert: (node.textContent || '') }] };
      }
      
      return () => {
        editor.root.removeEventListener('click', handleChecklistClick);
        editor.root.removeEventListener('paste', handlePaste);
      };
    }
  }, []);

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'header': [2, 3, false] }], // Order: Heading 2, Heading 3, Normal
      [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
      ['blockquote', 'link'],
      ['clean']
    ],
    clipboard: {
      // Preserve formatting when pasting
      matchVisual: false,
    },
  };

  const formats = [
    'bold', 'italic', 'underline', 'strike',
    'header',
    'list', 'bullet', 'ordered', 'check',
    'blockquote', 'link',
    'indent', 'align',
  ];

  // Prevent browser default for format shortcuts only when focus is in toolbar
  // (e.g. Cmd+B opens bookmarks bar in Chrome). When focus is in the editor,
  // let Quill handle bold/italic/underline/strike shortcuts.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.ql-editor')) {
      return; // In editor - let Quill handle formatting shortcuts
    }
    if ((e.metaKey || e.ctrlKey) && ['b', 'i', 'u', 's', 'z', 'y'].includes(e.key?.toLowerCase())) {
      e.preventDefault();
    }
  };

  return (
    <div className={`rich-text-editor ${className}`} style={{ direction: 'ltr' }} onKeyDown={handleKeyDown}>
      <style>{`
        .rich-text-editor .ql-container {
          min-height: ${minHeight};
          max-height: ${maxHeight};
          overflow-y: auto;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          background: white;
          border-color: #D4F1EF;
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background: #f9fafb;
          border-color: #D4F1EF;
        }
        .rich-text-editor .ql-toolbar button:hover {
          color: #17A697;
        }
        .rich-text-editor .ql-toolbar button.ql-active {
          color: #17A697;
        }
        .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: #2D3748;
        }
        .rich-text-editor .ql-toolbar button:hover .ql-stroke {
          stroke: #17A697;
        }
        .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: #17A697;
        }
        .rich-text-editor .ql-toolbar .ql-fill {
          fill: #2D3748;
        }
        .rich-text-editor .ql-toolbar button:hover .ql-fill {
          fill: #17A697;
        }
        .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          fill: #17A697;
        }
        .rich-text-editor .ql-editor {
          min-height: ${minHeight};
          direction: ltr;
          text-align: left;
          color: #2D3748;
          font-size: 18px;
          line-height: 1.5;
          padding-bottom: 1.5em;
        }
        .rich-text-editor .ql-editor p {
          font-size: 18px;
          line-height: 1.5;
          margin-bottom: 0.5em;
        }
        .rich-text-editor .ql-editor ul:not(.ql-checklist):not([data-list="check"]) {
          list-style-type: disc !important;
          padding-left: 1.5em !important;
          margin: 0.5em 0 !important;
        }
        .rich-text-editor .ql-editor ul:not(.ql-checklist):not([data-list="check"]) li {
          font-size: 18px;
          line-height: 1.5;
          margin-bottom: 0.25em;
          list-style-type: disc !important;
          display: list-item !important;
          list-style-position: outside !important;
        }
        .rich-text-editor .ql-editor ul:not(.ql-checklist):not([data-list="check"]) li::marker {
          color: #2D3748 !important;
          font-size: 18px !important;
          font-weight: normal !important;
        }
        /* Override any Quill default list styles that might use squares */
        .rich-text-editor .ql-editor ul:not(.ql-checklist):not([data-list="check"]) li::before {
          display: none !important;
        }
        .rich-text-editor .ql-editor ol {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .rich-text-editor .ql-editor ol li {
          font-size: 18px;
          line-height: 1.5;
          margin-bottom: 0.25em;
          list-style-type: decimal;
          display: list-item;
        }
        .rich-text-editor .ql-editor ul.ql-checklist,
        .rich-text-editor .ql-editor ul[data-list="check"] {
          list-style: none;
          padding-left: 0;
        }
        .rich-text-editor .ql-editor ul.ql-checklist li,
        .rich-text-editor .ql-editor ul[data-list="check"] li {
          position: relative;
          padding-left: 1.5em;
        }
        .rich-text-editor .ql-editor ul.ql-checklist li::before,
        .rich-text-editor .ql-editor ul[data-list="check"] li::before {
          content: '☐';
          position: absolute;
          left: 0;
          color: #2D3748;
          font-size: 18px;
          line-height: 1.5;
        }
        .rich-text-editor .ql-editor ul.ql-checklist li.ql-checked::before,
        .rich-text-editor .ql-editor ul[data-list="check"] li.ql-checked::before {
          content: '☑';
          color: #17A697;
        }
        .rich-text-editor .ql-editor ul.ql-checklist li.ql-checked,
        .rich-text-editor .ql-editor ul[data-list="check"] li.ql-checked {
          text-decoration: line-through;
          opacity: 0.7;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: italic;
        }
      `}</style>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}