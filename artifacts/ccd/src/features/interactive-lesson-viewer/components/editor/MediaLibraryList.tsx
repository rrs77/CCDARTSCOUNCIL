import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MoreHorizontal,
  Trash2,
  Pencil,
  Link2,
  Video,
  Music,
  Image as ImageIcon,
  Palette,
  FileSpreadsheet,
  Youtube,
  Presentation,
  Code2,
  Upload,
} from 'lucide-react';
import type { InteractiveLesson, MediaLibraryItem, SceneType } from '../../types';
import { SCENE_TYPE_LABELS } from '../../types';
import { countMediaUsages } from '../../utils/timelineAudio';

interface MediaLibraryListProps {
  lesson: InteractiveLesson;
  items: MediaLibraryItem[];
  onApply: (item: MediaLibraryItem) => void;
  onRename: (id: string, name: string) => void;
  onReplaceUrl: (id: string, url: string) => void;
  onDelete: (id: string, alsoRemoveFromUses: boolean) => void;
  onDragStart?: (item: MediaLibraryItem, e: React.DragEvent) => void;
}

function KindIcon({ kind }: { kind: SceneType | 'upload' }) {
  const cls = 'h-3.5 w-3.5 shrink-0';
  switch (kind) {
    case 'video':
      return <Video className={cls} />;
    case 'audio':
      return <Music className={cls} />;
    case 'image':
      return <ImageIcon className={cls} />;
    case 'canva':
      return <Palette className={cls} />;
    case 'powerpoint':
      return <FileSpreadsheet className={cls} />;
    case 'youtube':
      return <Youtube className={cls} />;
    case 'googleslides':
      return <Presentation className={cls} />;
    case 'embed':
      return <Code2 className={cls} />;
    default:
      return <Upload className={cls} />;
  }
}

function isImageish(kind: SceneType | 'upload', url: string) {
  return kind === 'image' || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
}

export function MediaLibraryList({
  lesson,
  items,
  onApply,
  onRename,
  onReplaceUrl,
  onDelete,
  onDragStart,
}: MediaLibraryListProps) {
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, flipUp: false });
  const [confirm, setConfirm] = useState<{ id: string; scenes: number; audio: number } | null>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!menuId) return;
    const btn = btnRefs.current[menuId];
    if (!btn) return;
    const place = () => {
      const rect = btn.getBoundingClientRect();
      const h = 160;
      const flipUp = window.innerHeight - rect.bottom < h && rect.top > h;
      setMenuPos({
        top: flipUp ? rect.top - 6 : rect.bottom + 6,
        left: Math.max(8, Math.min(window.innerWidth - 176, rect.right - 168)),
        flipUp,
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [menuId]);

  useEffect(() => {
    if (!menuId) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || btnRefs.current[menuId]?.contains(t)) return;
      setMenuId(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuId]);

  const requestDelete = (item: MediaLibraryItem) => {
    setMenuId(null);
    const u = countMediaUsages(lesson, item);
    if (u.total > 0) {
      setConfirm({ id: item.id, scenes: u.scenes, audio: u.audioClips });
    } else {
      onDelete(item.id, false);
    }
  };

  if (items.length === 0) {
    return (
      <button type="button" className="ilv-empty-slot w-full" disabled>
        + Add media via URL above
      </button>
    );
  }

  return (
    <div className="space-y-1.5">
      {items.map((m) => {
        const kindLabel = m.kind === 'upload' ? 'Upload' : SCENE_TYPE_LABELS[m.kind] || m.kind;
        return (
          <div key={m.id} className="ilv-media-row group">
            <button
              type="button"
              className="ilv-media-row-main"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/ilv-media', JSON.stringify(m));
                e.dataTransfer.setData(
                  'application/ilv-audio',
                  JSON.stringify({ url: m.url, name: m.name, id: m.id, durationMs: m.durationMs }),
                );
                onDragStart?.(m, e);
              }}
              onClick={() => onApply(m)}
              title="Apply to scene / drag to audio lane"
            >
              <span className="ilv-media-thumb" aria-hidden>
                {isImageish(m.kind, m.url) || m.thumbUrl ? (
                  <img src={m.thumbUrl || m.url} alt="" />
                ) : (
                  <KindIcon kind={m.kind} />
                )}
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-xs font-bold">{m.name}</span>
                <span className="flex items-center gap-1 truncate text-[10px] text-[var(--ss-muted)]">
                  <KindIcon kind={m.kind} />
                  {kindLabel}
                  {m.cloudProvider && m.cloudProvider !== 'generic' && (
                    <span className="ilv-chip ilv-chip-sun ml-0.5 !px-1 !py-0 text-[9px] uppercase">
                      {m.cloudProvider === 'gdrive'
                        ? 'Drive'
                        : m.cloudProvider === 'onedrive'
                          ? 'OneDrive'
                          : m.cloudProvider}
                    </span>
                  )}
                </span>
              </span>
            </button>
            <button
              type="button"
              className="ilv-media-trash"
              aria-label={`Delete ${m.name}`}
              title="Delete from library"
              onClick={() => requestDelete(m)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button
              ref={(el) => {
                btnRefs.current[m.id] = el;
              }}
              type="button"
              className={`ilv-media-more ${menuId === m.id ? 'is-on' : ''}`}
              aria-label={`More for ${m.name}`}
              aria-expanded={menuId === m.id}
              onClick={() => setMenuId((id) => (id === m.id ? null : m.id))}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}

      {menuId &&
        createPortal(
          <div
            ref={menuRef}
            className="ilv-clip-menu ilv-clip-menu-portal"
            role="menu"
            style={{
              position: 'fixed',
              top: menuPos.flipUp ? undefined : menuPos.top,
              bottom: menuPos.flipUp ? window.innerHeight - menuPos.top : undefined,
              left: menuPos.left,
              width: 168,
              zIndex: 10050,
            }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                const item = items.find((x) => x.id === menuId);
                setMenuId(null);
                if (!item) return;
                const name = window.prompt('Rename media', item.name);
                if (name && name.trim()) onRename(item.id, name.trim());
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Rename
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                const item = items.find((x) => x.id === menuId);
                setMenuId(null);
                if (!item) return;
                const url = window.prompt('Replace URL', item.url);
                if (url && url.trim()) onReplaceUrl(item.id, url.trim());
              }}
            >
              <Link2 className="h-3.5 w-3.5" />
              Replace URL
            </button>
            <button
              type="button"
              role="menuitem"
              className="is-danger"
              onClick={() => {
                const item = items.find((x) => x.id === menuId);
                if (item) requestDelete(item);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>,
          document.body,
        )}

      {confirm && (
        <div className="ilv-media-confirm" role="alertdialog" aria-modal="true">
          <p className="text-xs font-semibold text-[var(--ss-ink)]">
            Used in {confirm.scenes} scene{confirm.scenes === 1 ? '' : 's'}
            {confirm.audio > 0 ? ` and ${confirm.audio} audio clip${confirm.audio === 1 ? '' : 's'}` : ''}.
            Remove from library only, or also remove from those scenes?
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              className="ilv-btn ilv-btn-secondary text-xs"
              onClick={() => {
                onDelete(confirm.id, false);
                setConfirm(null);
              }}
            >
              Library only
            </button>
            <button
              type="button"
              className="ilv-btn ilv-btn-primary text-xs"
              onClick={() => {
                onDelete(confirm.id, true);
                setConfirm(null);
              }}
            >
              Also remove uses
            </button>
            <button type="button" className="ilv-btn ilv-btn-ghost text-xs" onClick={() => setConfirm(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
