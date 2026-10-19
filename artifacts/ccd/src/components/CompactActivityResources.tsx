import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  FileText,
  Image,
  Link as LinkIcon,
  Music,
  Palette,
  Plus,
  Upload,
  Video,
  Volume2,
  X,
} from 'lucide-react';
import type { ResourceLinkConfig } from '../contexts/SettingsContextNew';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Video,
  Music,
  Volume2,
  FileText,
  Palette,
  LinkIcon,
  Image,
  Link: LinkIcon,
};

export type ActivityResourceValues = Record<string, string | undefined>;

export interface CompactActivityResourcesProps {
  values: ActivityResourceValues;
  onChange: (key: string, value: string) => void;
  /** Enabled resource link configs from settings (video/music/…). */
  resourceLinks: ResourceLinkConfig[];
  /** Include activity image (upload + URL). Default true. */
  includeImage?: boolean;
  /** Include freeform additional link field. Default true. */
  includeAdditionalLink?: boolean;
  linkHeading?: string;
  onLinkHeadingChange?: (value: string) => void;
  /** Optional file → URL/base64 handler for image uploads. */
  onImageFile?: (file: File) => void;
  className?: string;
}

type ResourceOption = {
  key: string;
  label: string;
  iconName: string;
  shortLabel: string;
};

function shortLabel(label: string): string {
  return label.replace(/\s*URL\s*$/i, '').trim() || label;
}

function buildOptions(
  resourceLinks: ResourceLinkConfig[],
  includeImage: boolean,
  includeAdditionalLink: boolean,
  linkHeading: string,
): ResourceOption[] {
  const fromSettings = resourceLinks
    .filter((l) => l.enabled)
    .map((l) => ({
      key: l.key,
      label: l.label,
      iconName: l.iconName,
      shortLabel: shortLabel(l.label),
    }));

  const extras: ResourceOption[] = [];
  if (includeImage && !fromSettings.some((o) => o.key === 'imageLink')) {
    extras.push({
      key: 'imageLink',
      label: 'Activity image',
      iconName: 'Image',
      shortLabel: 'Image',
    });
  }
  if (includeAdditionalLink && !fromSettings.some((o) => o.key === 'link')) {
    extras.push({
      key: 'link',
      label: linkHeading || 'Additional Link',
      iconName: 'LinkIcon',
      shortLabel: shortLabel(linkHeading || 'Link'),
    });
  }
  return [...fromSettings, ...extras];
}

function hasValue(v: string | undefined): boolean {
  return Boolean((v || '').trim());
}

/**
 * Compact resources editor: summary row + chips for attached types only,
 * with “+ Add resource” to open a type picker. Empty types stay hidden.
 */
export function CompactActivityResources({
  values,
  onChange,
  resourceLinks,
  includeImage = true,
  includeAdditionalLink = true,
  linkHeading = 'Additional Link',
  onLinkHeadingChange,
  onImageFile,
  className = '',
}: CompactActivityResourcesProps) {
  const options = useMemo(
    () => buildOptions(resourceLinks, includeImage, includeAdditionalLink, linkHeading),
    [resourceLinks, includeImage, includeAdditionalLink, linkHeading],
  );

  const filledKeys = useMemo(
    () => options.filter((o) => hasValue(values[o.key])).map((o) => o.key),
    [options, values],
  );

  /** Keys the user opened via Add (may still be empty while typing). */
  const [openKeys, setOpenKeys] = useState<string[]>(() => filledKeys);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const focusKeyRef = useRef<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Keep open rows in sync when values gain content (e.g. undo/load).
  useEffect(() => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      filledKeys.forEach((k) => next.add(k));
      // Drop keys that are no longer options
      const optionKeys = new Set(options.map((o) => o.key));
      return [...next].filter((k) => optionKeys.has(k));
    });
  }, [filledKeys, options]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  useEffect(() => {
    const key = focusKeyRef.current;
    if (!key) return;
    const el = inputRefs.current[key];
    if (el) {
      el.focus();
      focusKeyRef.current = null;
    }
  }, [openKeys]);

  const visibleKeys = useMemo(() => {
    const order = options.map((o) => o.key);
    return order.filter((k) => openKeys.includes(k) || filledKeys.includes(k));
  }, [options, openKeys, filledKeys]);

  const attachedCount = filledKeys.length;
  const availableToAdd = options.filter((o) => !visibleKeys.includes(o.key));

  const addResource = (key: string) => {
    setOpenKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
    focusKeyRef.current = key;
    setMenuOpen(false);
    if (key === 'imageLink' && onImageFile) {
      // Prefer upload picker for images when available; URL field still shown.
    }
  };

  const removeResource = (key: string) => {
    onChange(key, '');
    setOpenKeys((prev) => prev.filter((k) => k !== key));
  };

  const optionByKey = (key: string) => options.find((o) => o.key === key);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Summary row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[12px] font-extrabold text-[#1F1B4D]">
          Resources{attachedCount > 0 ? ` (${attachedCount})` : ''}
        </span>

        {filledKeys.map((key) => {
          const opt = optionByKey(key);
          if (!opt) return null;
          const Icon = ICON_MAP[opt.iconName] || FileText;
          return (
            <span
              key={`chip-${key}`}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[#E2E0EF] bg-white text-[#4338E8]"
              title={opt.shortLabel}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
          );
        })}

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            disabled={availableToAdd.length === 0}
            className="inline-flex h-7 items-center gap-1 rounded-lg border border-[#bcb7f4] bg-[#E9E6FF] px-2 text-[11px] font-bold text-[#4338E8] transition-colors hover:bg-[#ddd8ff] disabled:cursor-not-allowed disabled:opacity-40"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <Plus className="h-3 w-3" />
            Add resource
            <ChevronDown className={`h-3 w-3 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>
          {menuOpen && availableToAdd.length > 0 && (
            <div
              role="menu"
              className="absolute left-0 z-20 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-[#E2E0EF] bg-white py-1 shadow-[0_12px_32px_rgba(31,27,77,0.16)]"
            >
              {availableToAdd.map((opt) => {
                const Icon = ICON_MAP[opt.iconName] || FileText;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    role="menuitem"
                    onClick={() => addResource(opt.key)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] font-semibold text-[#1F1B4D] hover:bg-[#F4F3FA]"
                  >
                    <Icon className="h-3.5 w-3.5 text-[#4338E8]" />
                    {opt.shortLabel}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Attached resource rows */}
      {visibleKeys.length > 0 && (
        <div className="space-y-1.5">
          {visibleKeys.map((key) => {
            const opt = optionByKey(key);
            if (!opt) return null;
            const Icon = ICON_MAP[opt.iconName] || FileText;
            const value = values[key] || '';

            if (key === 'imageLink') {
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-lg border border-[#E2E0EF] bg-white px-2 py-1.5"
                >
                  {hasValue(value) ? (
                    <img
                      src={value}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-md border border-[#E2E0EF] object-cover"
                    />
                  ) : (
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#F4F3FA] text-[#77738F]">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="shrink-0 text-[11px] font-bold text-[#1F1B4D]">
                        {opt.shortLabel}
                      </span>
                      {onImageFile && (
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="inline-flex h-6 items-center gap-1 rounded-md bg-[#4338E8] px-1.5 text-[10px] font-bold text-white hover:bg-[#3529d1]"
                        >
                          <Upload className="h-3 w-3" />
                          Upload
                        </button>
                      )}
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && onImageFile) onImageFile(file);
                          e.target.value = '';
                        }}
                      />
                    </div>
                    <input
                      ref={(el) => {
                        inputRefs.current[key] = el;
                      }}
                      type="url"
                      value={value}
                      onChange={(e) => onChange(key, e.target.value)}
                      placeholder="Image URL"
                      className="h-7 w-full rounded-md border border-[#E2E0EF] bg-white px-2 text-[12px] text-[#1F1B4D] placeholder:text-[#77738F] focus:border-[#4338E8] focus:outline-none focus:ring-1 focus:ring-[#4338E8]/25"
                      dir="ltr"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeResource(key)}
                    className="shrink-0 rounded-md p-1 text-[#77738F] hover:bg-[#F4F3FA] hover:text-red-600"
                    title={`Remove ${opt.shortLabel}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={key}
                className="flex items-center gap-1.5 rounded-lg border border-[#E2E0EF] bg-white px-2 py-1"
              >
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#E9E6FF] text-[#4338E8]">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {key === 'link' && onLinkHeadingChange ? (
                  <input
                    type="text"
                    value={linkHeading}
                    onChange={(e) => onLinkHeadingChange(e.target.value)}
                    className="w-[5.5rem] shrink-0 border-0 bg-transparent p-0 text-[11px] font-bold text-[#1F1B4D] outline-none focus:ring-0"
                    title="Link label"
                    aria-label="Link label"
                  />
                ) : (
                  <span className="w-[4.75rem] shrink-0 truncate text-[11px] font-bold text-[#1F1B4D]">
                    {opt.shortLabel}
                  </span>
                )}
                <input
                  ref={(el) => {
                    inputRefs.current[key] = el;
                  }}
                  type="url"
                  value={value}
                  onChange={(e) => onChange(key, e.target.value)}
                  placeholder={`${opt.shortLabel} URL`}
                  className="h-7 min-w-0 flex-1 rounded-md border border-[#E2E0EF] bg-white px-2 text-[12px] text-[#1F1B4D] placeholder:text-[#77738F] focus:border-[#4338E8] focus:outline-none focus:ring-1 focus:ring-[#4338E8]/25"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => removeResource(key)}
                  className="shrink-0 rounded-md p-1 text-[#77738F] hover:bg-[#F4F3FA] hover:text-red-600"
                  title={`Remove ${opt.shortLabel}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
