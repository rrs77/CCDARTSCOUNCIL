import { useEffect, useRef } from "react";

/**
 * Growing text field for edit mode. Height follows content (no clip).
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
}: {
  value: string;
  onChange: (next: string) => void;
  editMode: boolean;
  as?: "p" | "h1" | "h2" | "h3" | "h4" | "span" | "div";
  className?: string;
  multiline?: boolean;
  placeholder?: string;
  "aria-label"?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.innerText !== value) el.innerText = value || "";
  }, [value]);

  if (!editMode) {
    return <Tag className={className}>{value}</Tag>;
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
      onInput={(e) => {
        const text = (e.currentTarget as HTMLElement).innerText;
        onChange(text);
      }}
      onBlur={(e) => {
        onChange((e.currentTarget as HTMLElement).innerText);
      }}
      onKeyDown={(e) => {
        // Keep Enter/Shift+Enter in the field; stop canvas/modal shortcuts
        e.stopPropagation();
        if (!multiline && e.key === "Enter") e.preventDefault();
      }}
    />
  );
}
