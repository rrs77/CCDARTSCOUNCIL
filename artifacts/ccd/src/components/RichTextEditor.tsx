import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  className?: string;
  /** Prototype image insert (data URL / https) for partner site editors */
  enableImages?: boolean;
  onInsertImage?: () => void;
}

const ToolbarButton = ({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    title={title}
    className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
      active
        ? 'text-[#17A697] bg-[#D4F1EF]'
        : 'text-[#2D3748] hover:text-[#17A697] hover:bg-gray-100'
    }`}
  >
    {children}
  </button>
);

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter text here...',
  minHeight = '150px',
  maxHeight = '400px',
  className = '',
  enableImages = false,
  onInsertImage,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        strike: false,
        blockquote: {
          HTMLAttributes: { class: 'tiptap-blockquote' },
        },
      }),
      Underline,
      Strike,
      Link.configure({ openOnClick: false }),
      TaskList.configure({ HTMLAttributes: { class: 'tiptap-task-list' } }),
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content',
        style: `min-height: ${minHeight}; direction: ltr;`,
      },
    },
  });

  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL', prev ?? '');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  return (
    <div className={`rich-text-editor ${className}`} style={{ direction: 'ltr' }}>
      <style>{`
        .rich-text-editor {
          border: 1px solid #D4F1EF;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        .rich-text-editor .tiptap-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 2px;
          padding: 6px 8px;
          background: #f9fafb;
          border-bottom: 1px solid #D4F1EF;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
        }
        .rich-text-editor .tiptap-toolbar .separator {
          width: 1px;
          background: #D4F1EF;
          margin: 2px 4px;
          align-self: stretch;
        }
        .rich-text-editor .tiptap-editor-content {
          padding: 12px 15px 24px;
          color: #2D3748;
          font-size: 18px;
          line-height: 1.5;
          outline: none;
          overflow-y: auto;
          max-height: ${maxHeight};
          background: white;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }
        .rich-text-editor .tiptap-editor-content p {
          font-size: 18px;
          line-height: 1.5;
          margin-bottom: 0.5em;
        }
        .rich-text-editor .tiptap-editor-content p.is-empty:first-child::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
          float: left;
          height: 0;
          pointer-events: none;
        }
        .rich-text-editor .tiptap-editor-content h2 {
          font-size: 1.4em;
          font-weight: 700;
          margin: 0.75em 0 0.4em;
        }
        .rich-text-editor .tiptap-editor-content h3 {
          font-size: 1.15em;
          font-weight: 600;
          margin: 0.6em 0 0.3em;
        }
        .rich-text-editor .tiptap-editor-content ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .rich-text-editor .tiptap-editor-content ol {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .rich-text-editor .tiptap-editor-content li {
          font-size: 18px;
          line-height: 1.5;
          margin-bottom: 0.25em;
        }
        .rich-text-editor .tiptap-editor-content .tiptap-task-list {
          list-style: none;
          padding-left: 0.25em;
        }
        .rich-text-editor .tiptap-editor-content .tiptap-task-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.5em;
        }
        .rich-text-editor .tiptap-editor-content .tiptap-task-list li label {
          display: flex;
          align-items: center;
          gap: 0.35em;
          cursor: pointer;
          user-select: none;
        }
        .rich-text-editor .tiptap-editor-content .tiptap-task-list li input[type="checkbox"] {
          accent-color: #17A697;
          width: 1em;
          height: 1em;
          margin-top: 0.15em;
          flex-shrink: 0;
          cursor: pointer;
        }
        .rich-text-editor .tiptap-editor-content .tiptap-task-list li[data-checked="true"] > div {
          text-decoration: line-through;
          opacity: 0.7;
        }
        .rich-text-editor .tiptap-editor-content blockquote.tiptap-blockquote {
          border-left: 3px solid #D4F1EF;
          padding-left: 1em;
          color: #4a5568;
          margin: 0.5em 0;
          font-style: italic;
        }
        .rich-text-editor .tiptap-editor-content a {
          color: #17A697;
          text-decoration: underline;
        }
        .rich-text-editor .tiptap-editor-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 0.75em 0;
        }
      `}</style>

      <div className="tiptap-toolbar">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
          <span style={{ textDecoration: 'underline' }}>U</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <span style={{ textDecoration: 'line-through' }}>S</span>
        </ToolbarButton>

        <div className="separator" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          H2
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          H3
        </ToolbarButton>

        <div className="separator" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list">
          1.
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          •—
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Checklist">
          ☐
        </ToolbarButton>

        <div className="separator" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
          "
        </ToolbarButton>
        <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Link">
          🔗
        </ToolbarButton>
        {enableImages && (
          <ToolbarButton
            onClick={() => {
              if (onInsertImage) {
                onInsertImage();
                return;
              }
              const url = window.prompt('Image URL (https://… or paste after uploading elsewhere)');
              if (!url) return;
              editor
                .chain()
                .focus()
                .insertContent(`<img src="${url.replace(/"/g, '&quot;')}" alt="" />`)
                .run();
            }}
            title="Insert image"
          >
            🖼
          </ToolbarButton>
        )}

        <div className="separator" />

        <ToolbarButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear formatting">
          ✕
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
