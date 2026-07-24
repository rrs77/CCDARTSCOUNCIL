import { useRef, useState } from 'react';
import { ImagePlus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { RichTextEditor } from '../../RichTextEditor';
import { readFileAsDataUrl, type LsoImageField } from '../../../utils/lsoSiteContent';
import { LsoHtml } from './LsoHtml';

export function LsoEditableHtml({
  editing,
  html,
  onChange,
  label,
  placeholder,
  minHeight = '120px',
  className = '',
}: {
  editing: boolean;
  html: string;
  onChange: (html: string) => void;
  label?: string;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!editing) {
    return <LsoHtml html={html} className={className} />;
  }

  return (
    <div className={`relative rounded-xl border border-dashed border-teal-300/80 bg-teal-50/30 p-2 ${className}`}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-teal-800">
            {label}
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100"
          >
            <Pencil className="h-3 w-3" aria-hidden />
            {open ? 'Done' : 'Edit'}
          </button>
        </div>
      )}
      {open || !label ? (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              try {
                const dataUrl = await readFileAsDataUrl(file);
                onChange(
                  `${html || ''}<p><img src="${dataUrl}" alt="${file.name.replace(/"/g, '')}" /></p>`,
                );
                toast.success('Image added to text');
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Could not add image');
              }
            }}
          />
          <RichTextEditor
            value={html}
            onChange={onChange}
            placeholder={placeholder}
            minHeight={minHeight}
            enableImages
            onInsertImage={() => fileRef.current?.click()}
          />
        </>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-lg border border-transparent px-2 py-1 text-left hover:border-teal-200 hover:bg-white/80"
        >
          <LsoHtml html={html || `<p class="text-gray-400">${placeholder || 'Click to edit…'}</p>`} />
        </button>
      )}
    </div>
  );
}

export function LsoImageSlot({
  editing,
  image,
  onChange,
  label = 'Image',
  aspectClassName = 'aspect-[16/9]',
  className = '',
}: {
  editing: boolean;
  image: LsoImageField | null | undefined;
  onChange: (image: LsoImageField | null) => void;
  label?: string;
  aspectClassName?: string;
  className?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const src = image?.src;

  if (!editing && !src) return null;

  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-100 ${className}`}>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          try {
            const dataUrl = await readFileAsDataUrl(file);
            onChange({ src: dataUrl, alt: image?.alt || file.name });
            toast.success('Image updated');
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not upload image');
          }
        }}
      />
      {src ? (
        <img
          src={src}
          alt={image?.alt || label}
          className={`w-full object-cover ${aspectClassName}`}
        />
      ) : (
        <div
          className={`flex w-full flex-col items-center justify-center gap-2 border border-dashed border-teal-300 bg-teal-50/40 text-teal-800 ${aspectClassName}`}
        >
          <ImagePlus className="h-8 w-8 opacity-70" aria-hidden />
          <span className="text-sm font-semibold">{label}</span>
          <span className="px-4 text-center text-xs text-teal-700/80">
            PNG/JPG up to ~750KB (stored locally for this prototype)
          </span>
        </div>
      )}
      {editing && (
        <div className="absolute bottom-2 right-2 flex gap-1.5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm ring-1 ring-black/5 hover:bg-white"
          >
            <ImagePlus className="h-3.5 w-3.5" aria-hidden />
            {src ? 'Replace' : 'Add image'}
          </button>
          {src && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-red-700 shadow-sm ring-1 ring-black/5 hover:bg-white"
              aria-label="Remove image"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function LsoPlainField({
  editing,
  value,
  onChange,
  label,
  placeholder,
  className = '',
}: {
  editing: boolean;
  value: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}) {
  if (!editing) {
    return <span className={className}>{value}</span>;
  }
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-teal-800">
          {label}
        </span>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
      />
    </label>
  );
}
