import React, { useEffect, useRef } from 'react';
import type { Scene, TextOverlay } from '../types';
import { TEXT_PRESET_DEFAULTS } from '../types';
import { activeLyricIndex } from '../utils/lyricsSync';

interface SceneRendererProps {
  scene: Scene;
  timeMs?: number;
  playing?: boolean;
  showLyrics?: boolean;
  interactive?: boolean;
  selectedOverlayId?: string | null;
  onSelectOverlay?: (id: string | null) => void;
  onMoveOverlay?: (id: string, x: number, y: number) => void;
  transitionClass?: string;
  reducedMotion?: boolean;
}

function youtubeEmbed(url: string): string {
  try {
    if (url.includes('/embed/')) return url;
    const u = new URL(url);
    const id = u.searchParams.get('v') || u.pathname.split('/').pop();
    return id ? `https://www.youtube.com/embed/${id}?rel=0` : url;
  } catch {
    return url;
  }
}

function vimeoEmbed(url: string): string {
  try {
    if (url.includes('player.vimeo.com')) return url;
    const id = url.split('/').filter(Boolean).pop();
    return id ? `https://player.vimeo.com/video/${id}` : url;
  } catch {
    return url;
  }
}

export function SceneRenderer({
  scene,
  timeMs = 0,
  playing = false,
  showLyrics = true,
  interactive = false,
  selectedOverlayId = null,
  onSelectOverlay,
  onMoveOverlay,
  transitionClass = '',
  reducedMotion = false,
}: SceneRendererProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const media = videoRef.current || audioRef.current;
    if (!media || !scene.mediaUrl) return;
    const local = timeMs / 1000;
    if (Math.abs(media.currentTime - local) > 0.35) {
      try {
        media.currentTime = local;
      } catch {
        /* ignore seek errors while loading */
      }
    }
    if (playing) {
      void media.play().catch(() => undefined);
    } else {
      media.pause();
    }
  }, [playing, timeMs, scene.mediaUrl, scene.id]);

  const onPointerDown = (e: React.PointerEvent, overlay: TextOverlay) => {
    if (!interactive || !stageRef.current) return;
    e.stopPropagation();
    onSelectOverlay?.(overlay.id);
    const rect = stageRef.current.getBoundingClientRect();
    dragRef.current = {
      id: overlay.id,
      ox: ((e.clientX - rect.left) / rect.width) * 100 - overlay.x,
      oy: ((e.clientY - rect.top) / rect.height) * 100 - overlay.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!interactive || !dragRef.current || !stageRef.current || !onMoveOverlay) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100 - dragRef.current.ox));
    const y = Math.max(0, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100 - dragRef.current.oy));
    onMoveOverlay(dragRef.current.id, x, y);
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const lyricIdx = scene.lyrics ? activeLyricIndex(scene.lyrics, timeMs) : -1;
  const trClass = reducedMotion ? '' : transitionClass;

  return (
    <div
      ref={stageRef}
      className={`absolute inset-0 ${trClass}`}
      style={{ background: scene.backgroundColor || '#FFFFFF', ['--ilv-tr-ms' as string]: `${scene.transition.durationMs}ms` }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={() => interactive && onSelectOverlay?.(null)}
    >
      {(scene.type === 'video' || (scene.type === 'lyrics' && scene.mediaUrl?.match(/\.(mp4|webm|mov)(\?|$)/i))) &&
        scene.mediaUrl && (
          <video
            ref={videoRef}
            src={scene.mediaUrl}
            className="absolute inset-0 h-full w-full object-contain bg-black"
            playsInline
            preload="auto"
          />
        )}

      {scene.type === 'image' && scene.mediaUrl && (
        <img
          src={scene.mediaUrl}
          alt={scene.title}
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
        />
      )}

      {(scene.type === 'audio' || scene.type === 'lyrics') && scene.mediaUrl && !scene.mediaUrl.match(/\.(mp4|webm|mov)(\?|$)/i) && (
        <>
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <div className="h-32 w-32 rounded-full border-4 border-white/40" />
          </div>
          <audio ref={audioRef} src={scene.mediaUrl} preload="auto" />
        </>
      )}

      {(scene.type === 'youtube' || scene.type === 'vimeo' || scene.type === 'canva' || scene.type === 'powerpoint' || scene.type === 'embed') && (
        scene.embedUrl ? (
          <iframe
            title={scene.title}
            src={
              scene.type === 'youtube'
                ? youtubeEmbed(scene.embedUrl)
                : scene.type === 'vimeo'
                  ? vimeoEmbed(scene.embedUrl)
                  : scene.embedUrl
            }
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : scene.overlays.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
            {scene.posterUrl && (
              <img src={scene.posterUrl} alt="" className="mb-2 h-16 w-auto opacity-80" />
            )}
            <p className="text-lg font-bold" style={{ color: scene.backgroundColor === '#1F1B4D' ? '#fff' : '#1F1B4D' }}>
              {scene.title}
            </p>
            <p className="max-w-md text-sm opacity-70" style={{ color: scene.backgroundColor === '#1F1B4D' ? '#E2E0EF' : '#77738F' }}>
              Add an embed or share link in the editor.
            </p>
          </div>
        ) : scene.posterUrl ? (
          <img
            src={scene.posterUrl}
            alt=""
            className="absolute inset-0 m-auto h-20 w-auto opacity-25"
            draggable={false}
          />
        ) : null
      )}

      {(scene.type === 'canva' || scene.type === 'powerpoint') &&
        !scene.embedUrl &&
        !(scene.overlays && scene.overlays.length > 0) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#1F1B4D]/92 p-8 text-center text-white">
          {scene.posterUrl && <img src={scene.posterUrl} alt="" className="h-14 w-auto" />}
          <p className="text-2xl font-extrabold tracking-tight">{scene.type === 'canva' ? 'Canva design' : 'PowerPoint'}</p>
          <p className="max-w-lg text-sm text-white/75">{scene.notes || 'Add a share or embed link in the editor.'}</p>
        </div>
      )}

      {scene.overlays.map((ov) => {
        const preset = TEXT_PRESET_DEFAULTS[ov.style];
        return (
          <div
            key={ov.id}
            data-style={ov.style}
            className={`ilv-overlay-box ${selectedOverlayId === ov.id ? 'is-selected' : ''}`}
            style={{
              left: `${ov.x}%`,
              top: `${ov.y}%`,
              width: `${ov.width}%`,
              color: ov.color,
              fontSize: ov.fontSize || preset.fontSize,
              fontWeight: preset.fontWeight,
              pointerEvents: interactive ? 'auto' : 'none',
            }}
            onPointerDown={(e) => onPointerDown(e, ov)}
          >
            {ov.text}
          </div>
        );
      })}

      {showLyrics && scene.lyrics && scene.lyrics.length > 0 && (
        <div className="absolute inset-x-0 bottom-[12%] px-6">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-2">
            {scene.lyrics
              .filter((_, i) => i >= lyricIdx - 1 && i <= lyricIdx + 1)
              .map((line) => {
                const idx = scene.lyrics!.findIndex((l) => l.id === line.id);
                const state =
                  idx === lyricIdx ? 'is-active' : idx < lyricIdx ? 'is-past' : 'is-upcoming';
                return (
                  <div key={line.id} className={`ilv-karaoke-line ${state}`}>
                    {line.text}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
