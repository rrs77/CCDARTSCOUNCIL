import { useEffect, useRef } from "react";

/**
 * Growing text field for edit mode. Height follows content (no clip).
 * Enter inserts a new paragraph when `onEnterNewParagraph` is provided.
 */
export function EditableText({
  value,
  onChange,
  editMode,
  as = "p",
  className = "",
  multiline = true,
  placeholder = "Edit…",
  "aria-label": ariaLabel,
  "data-story-para": dataStoryPara,
  onEnterNewParagraph,
}: {
  value: string;
  onChange: (next: string) => void;
  editMode: boolean;
  as?: "p" | "h1" | "h2" | "h3" | "h4" | "span" | "div";
  className?: string;
  multiline?: boolean;
  placeholder?: string;
  "aria-label"?: string;
  "data-story-para"?: string;
  /** Enter (without Shift) creates a new paragraph after this one. */
  onEnterNewParagraph?: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.innerText !== value) el.innerText = value || "";
  }, [value]);

  if (!editMode) {
    return (
      <Tag className={className} data-story-para={dataStoryPara}>
        {value}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref as never}
      className={`editable-text ${className}`}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={ariaLabel ?? placeholder}
      aria-multiline={multiline}
      data-placeholder={placeholder}
      data-story-para={dataStoryPara}
      onInput={(e) => {
        const text = (e.currentTarget as HTMLElement).innerText;
        onChange(text.replace(/\n$/, ""));
      }}
      onBlur={(e) => {
        onChange((e.currentTarget as HTMLElement).innerText.replace(/\n$/, ""));
      }}
      onKeyDown={(e) => {
        // Keep keys in the field; stop canvas/modal shortcuts
        e.stopPropagation();
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          // Flush current text before inserting a sibling paragraph
          onChange((e.currentTarget as HTMLElement).innerText.replace(/\n$/, ""));
          onEnterNewParagraph?.();
          return;
        }
        if (!multiline && e.key === "Enter") e.preventDefault();
      }}
    />
  );
}
