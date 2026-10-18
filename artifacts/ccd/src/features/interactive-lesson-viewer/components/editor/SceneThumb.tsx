import React, { useEffect, useRef } from 'react';
import type { Scene } from '../../types';
import { SCENE_TYPE_COLORS, SCENE_TYPE_LABELS } from '../../types';

interface SceneThumbProps {
  scene: Scene;
  active?: boolean;
  width: number;
  onSelect: () => void;
  onReorder: (from: number, to: number) => void;
  index: number;
}

/** Mini visual preview for the timeline strip. */
export function SceneThumb({ scene, active, width, onSelect, onReorder, index }: SceneThumbProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const bg = scene.backgroundColor || '#F4F3FA';
  const headline = scene.overlays.find((o) => o.style === 'headline')?.text;

  return (
    <div
      className={`ilv-scene-clip ${active ? 'is-active' : ''}`}
      style={{ width }}
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/ilv-scene-index', String(index))}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const from = Number(e.dataTransfer.getData('text/ilv-scene-index'));
        if (!Number.isNaN(from)) onReorder(from, index);
      }}
      onClick={onSelect}
      title={`${scene.title} · ${(scene.durationMs / 1000).toFixed(1)}s`}
    >
      <div className="ilv-scene-thumb" style={{ background: bg }}>
        {scene.type === 'video' && scene.mediaUrl && (
          <video ref={videoRef} src={scene.mediaUrl} muted playsInline preload="metadata" className="ilv-thumb-media" />
        )}
        {scene.type === 'image' && scene.mediaUrl && (
          <img src={scene.mediaUrl} alt="" className="ilv-thumb-media" draggable={false} />
        )}
        {(scene.type === 'youtube' || scene.type === 'vimeo') && (
          <div className="ilv-thumb-brand" style={{ background: SCENE_TYPE_COLORS[scene.type] }}>
            {SCENE_TYPE_LABELS[scene.type]}
          </div>
        )}
        {(scene.type === 'canva' || scene.type === 'powerpoint' || scene.type === 'embed') && (
          <div className="ilv-thumb-brand" style={{ background: '#1F1B4D' }}>
            {scene.posterUrl ? (
              <img src={scene.posterUrl} alt="" className="ilv-thumb-logo" />
            ) : null}
            <span>{SCENE_TYPE_LABELS[scene.type]}</span>
          </div>
        )}
        {(scene.type === 'title' || scene.type === 'text' || scene.type === 'audio' || scene.type === 'lyrics') && (
          <div className="ilv-thumb-title" style={{ color: bg === '#1F1B4D' || bg === '#4338E8' ? '#fff' : '#1F1B4D' }}>
            {headline || scene.title}
          </div>
        )}
        {!scene.mediaUrl &&
          !scene.embedUrl &&
          !['title', 'text', 'audio', 'lyrics', 'canva', 'powerpoint', 'embed', 'youtube', 'vimeo'].includes(
            scene.type,
          ) && (
            <span className="ilv-thumb-fallback">{SCENE_TYPE_LABELS[scene.type]}</span>
          )}
      </div>
      <div className="ilv-scene-typebar" style={{ background: SCENE_TYPE_COLORS[scene.type] }}>
        <span className="truncate">{SCENE_TYPE_LABELS[scene.type]}</span>
        <span className="ilv-scene-dur">{(scene.durationMs / 1000).toFixed(1)}s</span>
      </div>
    </div>
  );
}
