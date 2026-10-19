import React, { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Trash2, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Scene } from '../../types';
import { SCENE_TYPE_COLORS, SCENE_TYPE_LABELS, formatSceneDurationLabel } from '../../types';
import { parseYouTubeUrl } from '../../utils/youtubeEmbed';

interface SceneThumbProps {
  scene: Scene;
  active?: boolean;
  width: number;
  index: number;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onSelect: () => void;
  onReorder: (from: number, to: number) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}

/** Mini visual preview for the timeline strip, with delete + ⋯ menu. */
export function SceneThumb({
  scene,
  active,
  width,
  index,
  canMoveLeft,
  canMoveRight,
  onSelect,
  onReorder,
  onDelete,
  onDuplicate,
  onMoveLeft,
  onMoveRight,
}: SceneThumbProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const seek = () => {
      try {
        if (v.duration && !Number.isNaN(v.duration)) v.currentTime = Math.min(0.35, v.duration * 0.05);
      } catch {
        /* ignore */
      }
    };
    v.addEventListener('loadeddata', seek);
    return () => v.removeEventListener('loadeddata', seek);
  }, [scene.mediaUrl]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const bg = scene.backgroundColor || '#F4F3FA';
  const headline = scene.overlays.find((o) => o.style === 'headline')?.text;
  const yt = scene.type === 'youtube' && scene.embedUrl ? parseYouTubeUrl(scene.embedUrl) : null;
  const durLabel = formatSceneDurationLabel(scene);

  return (
    <div
      className={`ilv-scene-clip ${active ? 'is-active' : ''} ${menuOpen ? 'is-menu-open' : ''}`}
      style={{ width }}
      draggable={!menuOpen}
      onDragStart={(e) => {
        if ((e.target as HTMLElement).closest('.ilv-clip-actions, .ilv-clip-menu')) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.setData('text/ilv-scene-index', String(index));
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const from = Number(e.dataTransfer.getData('text/ilv-scene-index'));
        if (!Number.isNaN(from)) onReorder(from, index);
      }}
      onClick={onSelect}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect();
        setMenuOpen(true);
      }}
      title={`${scene.title} · ${durLabel}`}
    >
      <div className="ilv-clip-actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="ilv-clip-action"
          aria-label="Delete scene"
          title="Delete scene"
          onClick={() => {
            setMenuOpen(false);
            onDelete();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className={`ilv-clip-action ${menuOpen ? 'is-on' : ''}`}
          aria-label="More scene actions"
          aria-expanded={menuOpen}
          title="More"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      {menuOpen && (
        <div ref={menuRef} className="ilv-clip-menu" role="menu" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              onDuplicate();
            }}
          >
            <Copy className="h-3.5 w-3.5" />
            Duplicate
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!canMoveLeft}
            onClick={() => {
              setMenuOpen(false);
              onMoveLeft();
            }}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Move left
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!canMoveRight}
            onClick={() => {
              setMenuOpen(false);
              onMoveRight();
            }}
          >
            <ChevronRight className="h-3.5 w-3.5" />
            Move right
          </button>
          <button
            type="button"
            role="menuitem"
            className="is-danger"
            onClick={() => {
              setMenuOpen(false);
              onDelete();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      )}

      <div className="ilv-scene-thumb" style={{ background: bg }}>
        {scene.type === 'video' && scene.mediaUrl && (
          <video ref={videoRef} src={scene.mediaUrl} muted playsInline preload="metadata" className="ilv-thumb-media" />
        )}
        {scene.type === 'image' && scene.mediaUrl && (
          <img src={scene.mediaUrl} alt="" className="ilv-thumb-media" draggable={false} />
        )}
        {scene.type === 'youtube' && (
          yt?.thumbUrl ? (
            <img src={yt.thumbUrl} alt="" className="ilv-thumb-media" draggable={false} />
          ) : (
            <div className="ilv-thumb-brand" style={{ background: SCENE_TYPE_COLORS.youtube }}>
              YouTube
            </div>
          )
        )}
        {scene.type === 'vimeo' && (
          <div className="ilv-thumb-brand" style={{ background: SCENE_TYPE_COLORS.vimeo }}>
            Vimeo
          </div>
        )}
        {(scene.type === 'canva' || scene.type === 'powerpoint' || scene.type === 'googleslides' || scene.type === 'embed') && (
          <div className="ilv-thumb-brand" style={{ background: '#1F1B4D' }}>
            {scene.posterUrl ? <img src={scene.posterUrl} alt="" className="ilv-thumb-logo" /> : null}
            <span>{SCENE_TYPE_LABELS[scene.type]}</span>
          </div>
        )}
        {(scene.type === 'title' || scene.type === 'text' || scene.type === 'audio' || scene.type === 'lyrics') && (
          <div
            className="ilv-thumb-title"
            style={{ color: bg === '#1F1B4D' || bg === '#4338E8' ? '#fff' : '#1F1B4D' }}
          >
            {headline || scene.title}
          </div>
        )}
        {!scene.mediaUrl &&
          !scene.embedUrl &&
          !['title', 'text', 'audio', 'lyrics', 'canva', 'powerpoint', 'googleslides', 'embed', 'youtube', 'vimeo'].includes(
            scene.type,
          ) && <span className="ilv-thumb-fallback">{SCENE_TYPE_LABELS[scene.type]}</span>}
      </div>
      <div className="ilv-scene-typebar" style={{ background: SCENE_TYPE_COLORS[scene.type] }}>
        <span className="truncate">{SCENE_TYPE_LABELS[scene.type]}</span>
        <span className="ilv-scene-dur">{durLabel}</span>
      </div>
    </div>
  );
}
