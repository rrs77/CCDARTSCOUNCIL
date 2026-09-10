import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { HubEditFieldKey, HubEditableContent, HubContentListItem } from '../../types/musicHubContent';
import type { MusicHubLink, MusicHubResource } from '../../types/musicHubsDirectory';
import {
  MUSIC_HUB_PLACEHOLDER_CARD,
  MUSIC_HUB_PLACEHOLDER_HERO,
  MUSIC_HUB_PLACEHOLDER_LOGO,
  newItemId,
  realHubMediaUrl,
} from '../../utils/musicHubContentStore';

function linesToText(lines?: string[]): string {
  return (lines || []).join('\n');
}

function textToLines(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function ListItemEditor({
  items,
  onChange,
  emptyLabel,
}: {
  items: HubContentListItem[];
  onChange: (next: HubContentListItem[]) => void;
  emptyLabel: string;
}) {
  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-xs text-[#002D24]/55">{emptyLabel}</p>
      )}
      {items.map((item, index) => (
        <div
          key={item.id}
          className="space-y-2 rounded-lg border border-[#002D24]/12 bg-[#E8F0EA]/30 p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-[#002D24]">Item {index + 1}</p>
            <button
              type="button"
              className="text-xs font-medium text-red-700 hover:underline"
              onClick={() => onChange(items.filter((x) => x.id !== item.id))}
            >
              Remove
            </button>
          </div>
          <input
            className="w-full rounded-md border border-[#002D24]/20 px-2 py-1.5 text-sm"
            value={item.title}
            placeholder="Title"
            onChange={(e) =>
              onChange(
                items.map((x) => (x.id === item.id ? { ...x, title: e.target.value } : x)),
              )
            }
          />
          <textarea
            className="w-full rounded-md border border-[#002D24]/20 px-2 py-1.5 text-sm"
            rows={2}
            value={item.description || ''}
            placeholder="Description"
            onChange={(e) =>
              onChange(
                items.map((x) =>
                  x.id === item.id ? { ...x, description: e.target.value } : x,
                ),
              )
            }
          />
          <input
            className="w-full rounded-md border border-[#002D24]/20 px-2 py-1.5 text-sm"
            value={item.href || ''}
            placeholder="Link URL"
            onChange={(e) =>
              onChange(
                items.map((x) => (x.id === item.id ? { ...x, href: e.target.value } : x)),
              )
            }
          />
          <input
            className="w-full rounded-md border border-[#002D24]/20 px-2 py-1.5 text-sm"
            value={item.imageUrl || MUSIC_HUB_PLACEHOLDER_CARD}
            placeholder="Image URL"
            onChange={(e) =>
              onChange(
                items.map((x) =>
                  x.id === item.id ? { ...x, imageUrl: e.target.value } : x,
                ),
              )
            }
          />
        </div>
      ))}
      <button
        type="button"
        className="rounded-lg border border-[#002D24]/20 bg-white px-3 py-1.5 text-sm font-semibold text-[#002D24]"
        onClick={() =>
          onChange([
            ...items,
            {
              id: newItemId('item'),
              title: 'New item',
              description: '',
              imageUrl: MUSIC_HUB_PLACEHOLDER_CARD,
            },
          ])
        }
      >
        Add item
      </button>
    </div>
  );
}

export function HubEditModal({
  field,
  content,
  nodeName,
  onSave,
  onClose,
}: {
  field: HubEditFieldKey;
  content: HubEditableContent;
  nodeName: string;
  onSave: (next: HubEditableContent) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<HubEditableContent>(content);

  useEffect(() => {
    setDraft(content);
  }, [content, field]);

  const titleForField = (): string => {
    switch (field) {
      case 'header':
        return 'Edit title & description';
      case 'logo':
        return 'Edit logo';
      case 'hero':
        return 'Edit hero image';
      case 'about':
        return 'Edit about';
      case 'schoolsEducation':
        return 'Edit schools / music education';
      case 'resources':
        return 'Edit resources';
      case 'courses':
        return 'Edit courses';
      case 'activities':
        return 'Edit activities';
      case 'lessonPlans':
        return 'Edit lesson plans';
      case 'training':
        return 'Edit training / CPD';
      case 'events':
        return 'Edit events';
      case 'links':
        return 'Edit links';
      case 'images':
        return 'Edit images';
      default:
        return 'Edit content';
    }
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hub-edit-modal-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 id="hub-edit-modal-title" className="truncate text-base font-semibold text-[#002D24]">
              {titleForField()}
            </h2>
            <p className="truncate text-xs text-[#002D24]/60">{nodeName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
          {field === 'header' && (
            <>
              <label className="block text-sm font-medium text-[#002D24]">
                Title
                <input
                  className="mt-1 w-full rounded-md border border-[#002D24]/20 px-3 py-2 text-sm"
                  value={draft.title || ''}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </label>
              <label className="block text-sm font-medium text-[#002D24]">
                Tagline
                <input
                  className="mt-1 w-full rounded-md border border-[#002D24]/20 px-3 py-2 text-sm"
                  value={draft.tagline || ''}
                  onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
                />
              </label>
              <label className="block text-sm font-medium text-[#002D24]">
                Description (one paragraph per line)
                <textarea
                  className="mt-1 w-full rounded-md border border-[#002D24]/20 px-3 py-2 text-sm"
                  rows={5}
                  value={linesToText(draft.description)}
                  onChange={(e) =>
                    setDraft({ ...draft, description: textToLines(e.target.value) })
                  }
                />
              </label>
            </>
          )}

          {field === 'logo' && (
            <label className="block text-sm font-medium text-[#002D24]">
              Logo URL
              <input
                className="mt-1 w-full rounded-md border border-[#002D24]/20 px-3 py-2 text-sm"
                placeholder="/music-hubs/logos/example.svg"
                value={realHubMediaUrl(draft.logoUrl) || ''}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    logoUrl: e.target.value.trim() || undefined,
                  })
                }
              />
              <p className="mt-1 text-xs font-normal text-[#002D24]/55">
                Leave blank for a text-only identity on the public page (no fake logo box).
              </p>
              <img
                src={realHubMediaUrl(draft.logoUrl) || MUSIC_HUB_PLACEHOLDER_LOGO}
                alt=""
                className="mt-3 h-20 w-auto max-w-full rounded-lg border border-[#002D24]/10 bg-[#E8F0EA] object-contain p-2"
              />
            </label>
          )}

          {field === 'hero' && (
            <label className="block text-sm font-medium text-[#002D24]">
              Hero image URL
              <input
                className="mt-1 w-full rounded-md border border-[#002D24]/20 px-3 py-2 text-sm"
                placeholder="/music-hubs/… or https://"
                value={realHubMediaUrl(draft.heroImageUrl) || ''}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    heroImageUrl: e.target.value.trim() || undefined,
                  })
                }
              />
              <p className="mt-1 text-xs font-normal text-[#002D24]/55">
                Leave blank to hide the hero banner on the public page.
              </p>
              <img
                src={realHubMediaUrl(draft.heroImageUrl) || MUSIC_HUB_PLACEHOLDER_HERO}
                alt=""
                className="mt-3 max-h-40 w-full rounded-lg object-cover"
              />
            </label>
          )}

          {(field === 'about' ||
            field === 'schoolsEducation' ||
            field === 'training' ||
            field === 'events') && (
            <label className="block text-sm font-medium text-[#002D24]">
              Text (one paragraph per line). Leave blank for placeholder.
              <textarea
                className="mt-1 w-full rounded-md border border-[#002D24]/20 px-3 py-2 text-sm"
                rows={6}
                value={linesToText(draft[field])}
                onChange={(e) =>
                  setDraft({ ...draft, [field]: textToLines(e.target.value) })
                }
              />
            </label>
          )}

          {field === 'courses' && (
            <ListItemEditor
              items={draft.courses || []}
              emptyLabel="No courses yet — add placeholders as needed."
              onChange={(courses) => setDraft({ ...draft, courses })}
            />
          )}
          {field === 'activities' && (
            <ListItemEditor
              items={draft.activities || []}
              emptyLabel="No activities yet — add placeholders as needed."
              onChange={(activities) => setDraft({ ...draft, activities })}
            />
          )}
          {field === 'lessonPlans' && (
            <ListItemEditor
              items={draft.lessonPlans || []}
              emptyLabel="No lesson plans yet — add placeholders as needed."
              onChange={(lessonPlans) => setDraft({ ...draft, lessonPlans })}
            />
          )}

          {field === 'resources' && (
            <div className="space-y-3">
              {(draft.resources || []).map((res, index) => (
                <div
                  key={res.id}
                  className="space-y-2 rounded-lg border border-[#002D24]/12 bg-[#E8F0EA]/30 p-3"
                >
                  <div className="flex justify-between">
                    <p className="text-xs font-semibold">Resource {index + 1}</p>
                    <button
                      type="button"
                      className="text-xs text-red-700"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          resources: (draft.resources || []).filter((r) => r.id !== res.id),
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    className="w-full rounded-md border border-[#002D24]/20 px-2 py-1.5 text-sm"
                    value={res.title}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        resources: (draft.resources || []).map((r) =>
                          r.id === res.id ? { ...r, title: e.target.value } : r,
                        ),
                      })
                    }
                  />
                  <textarea
                    className="w-full rounded-md border border-[#002D24]/20 px-2 py-1.5 text-sm"
                    rows={2}
                    value={res.description || ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        resources: (draft.resources || []).map((r) =>
                          r.id === res.id ? { ...r, description: e.target.value } : r,
                        ),
                      })
                    }
                  />
                  <select
                    className="w-full rounded-md border border-[#002D24]/20 px-2 py-1.5 text-sm"
                    value={res.access}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        resources: (draft.resources || []).map((r) =>
                          r.id === res.id
                            ? {
                                ...r,
                                access: e.target.value as MusicHubResource['access'],
                              }
                            : r,
                        ),
                      })
                    }
                  >
                    <option value="FREE">FREE</option>
                    <option value="EXTERNAL">EXTERNAL</option>
                    <option value="SUBSCRIBER">SUBSCRIBER</option>
                  </select>
                  <input
                    className="w-full rounded-md border border-[#002D24]/20 px-2 py-1.5 text-sm"
                    value={res.href || ''}
                    placeholder="URL (optional for SUBSCRIBER)"
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        resources: (draft.resources || []).map((r) =>
                          r.id === res.id ? { ...r, href: e.target.value } : r,
                        ),
                      })
                    }
                  />
                </div>
              ))}
              <button
                type="button"
                className="rounded-lg border border-[#002D24]/20 bg-white px-3 py-1.5 text-sm font-semibold"
                onClick={() =>
                  setDraft({
                    ...draft,
                    resources: [
                      ...(draft.resources || []),
                      {
                        id: newItemId('res'),
                        title: 'New resource',
                        access: 'FREE',
                        description: '',
                      },
                    ],
                  })
                }
              >
                Add resource
              </button>
            </div>
          )}

          {field === 'links' && (
            <div className="space-y-3">
              {(draft.links || []).map((link, index) => (
                <div
                  key={`${link.href}-${index}`}
                  className="flex flex-col gap-2 rounded-lg border border-[#002D24]/12 p-3 sm:flex-row"
                >
                  <input
                    className="flex-1 rounded-md border border-[#002D24]/20 px-2 py-1.5 text-sm"
                    value={link.label}
                    placeholder="Label"
                    onChange={(e) => {
                      const links = [...(draft.links || [])] as MusicHubLink[];
                      links[index] = { ...links[index], label: e.target.value };
                      setDraft({ ...draft, links });
                    }}
                  />
                  <input
                    className="flex-[1.4] rounded-md border border-[#002D24]/20 px-2 py-1.5 text-sm"
                    value={link.href}
                    placeholder="https://"
                    onChange={(e) => {
                      const links = [...(draft.links || [])] as MusicHubLink[];
                      links[index] = { ...links[index], href: e.target.value };
                      setDraft({ ...draft, links });
                    }}
                  />
                  <button
                    type="button"
                    className="text-xs text-red-700"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        links: (draft.links || []).filter((_, i) => i !== index),
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="rounded-lg border border-[#002D24]/20 bg-white px-3 py-1.5 text-sm font-semibold"
                onClick={() =>
                  setDraft({
                    ...draft,
                    links: [...(draft.links || []), { label: 'New link', href: 'https://' }],
                  })
                }
              >
                Add link
              </button>
            </div>
          )}

          {field === 'images' && (
            <div className="space-y-3">
              {(draft.images || []).map((img) => (
                <div key={img.id} className="space-y-2 rounded-lg border border-[#002D24]/12 p-3">
                  <input
                    className="w-full rounded-md border border-[#002D24]/20 px-2 py-1.5 text-sm"
                    value={img.url}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        images: (draft.images || []).map((x) =>
                          x.id === img.id ? { ...x, url: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <input
                    className="w-full rounded-md border border-[#002D24]/20 px-2 py-1.5 text-sm"
                    value={img.alt || ''}
                    placeholder="Alt text"
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        images: (draft.images || []).map((x) =>
                          x.id === img.id ? { ...x, alt: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </div>
              ))}
              <button
                type="button"
                className="rounded-lg border border-[#002D24]/20 bg-white px-3 py-1.5 text-sm font-semibold"
                onClick={() =>
                  setDraft({
                    ...draft,
                    images: [
                      ...(draft.images || []),
                      {
                        id: newItemId('img'),
                        url: MUSIC_HUB_PLACEHOLDER_CARD,
                        alt: 'Hub image',
                      },
                    ],
                  })
                }
              >
                Add image
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-[#002D24] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003d32]"
          >
            Save draft
          </button>
        </div>
      </div>
    </div>
  );
}

export function HubEditPencil({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#002D24]/20 bg-white text-[#002D24] shadow-sm hover:bg-[#E8F0EA]"
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    </button>
  );
}
