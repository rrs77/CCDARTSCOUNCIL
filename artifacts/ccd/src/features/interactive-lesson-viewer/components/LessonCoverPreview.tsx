import React, { useEffect, useRef } from 'react';
import { Clapperboard, Mic2, Music2, Presentation, Type, Youtube } from 'lucide-react';
import type { InteractiveLessonCover, SceneType } from '../types';
import { SCENE_TYPE_COLORS, SCENE_TYPE_LABELS } from '../types';
import { parseYouTubeUrl } from '../utils/youtubeEmbed';

const TYPE_ICON: Partial<Record<SceneType, React.ReactNode>> = {
  video: <Clapperboard className="h-5 w-5" />,
  audio: <Music2 className="h-5 w-5" />,
  lyrics: <Mic2 className="h-5 w-5" />,
  youtube: <Youtube className="h-5 w-5" />,
  title: <Type className="h-5 w-5" />,
  text: <Type className="h-5 w-5" />,
  powerpoint: <Presentation className="h-5 w-5" />,
  googleslides: <Presentation className="h-5 w-5" />,
  canva: <Presentation className="h-5 w-5" />,
};

function coverGradient(types: SceneType[] | undefined, fallbackType?: SceneType): string {
  const palette = (types || []).slice(0, 3).map((t) => SCENE_TYPE_COLORS[t]);
  if (palette.length === 0 && fallbackType) palette.push(SCENE_TYPE_COLORS[fallbackType]);
  if (palette.length === 0) palette.push('#4338E8', '#1F1B4D');
  if (palette.length === 1) return `linear-gradient(145deg, ${palette[0]} 0%, #1F1B4D 100%)`;
  return `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1] || '#1F1B4D'} 55%, ${palette[2] || '#4338E8'} 100%)`;
}

interface LessonCoverPreviewProps {
  cover?: InteractiveLessonCover;
  sceneTypes?: SceneType[];
  className?: string;
}

/** Visual tile cover from the first scene (media / embed / gradient fallback). */
export function LessonCoverPreview({ cover, sceneTypes, className = '' }: LessonCoverPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const yt = cover?.type === 'youtube' && cover.embedUrl ? parseYouTubeUrl(cover.embedUrl) : null;
  const bg =
    cover?.backgroundGradient ||
    cover?.backgroundColor ||
    coverGradient(sceneTypes, cover?.type);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const seek = () => {
      try {
        if (v.duration && !Number.isNaN(v.duration)) v.currentTime = Math.min(0.4, v.duration * 0.05);
      } catch {
        /* ignore */
      }
    };
    v.addEventListener('loadeddata', seek);
    return () => v.removeEventListener('loadeddata', seek);
  }, [cover?.mediaUrl]);

  const darkText =
    cover?.backgroundColor === '#FFFFFF' ||
    cover?.backgroundColor === '#F4F3FA' ||
    cover?.backgroundColor === '#fff';

  return (
    <div
      className={`ilv-lesson-cover ${className}`}
      style={{ background: typeof bg === 'string' && bg.startsWith('#') ? bg : bg }}
    >
      {cover?.type === 'video' && cover.mediaUrl && (
        <video
          ref={videoRef}
          src={cover.mediaUrl}
          muted
          playsInline
          preload="metadata"
          className="ilv-lesson-cover-media"
        />
      )}
      {cover?.type === 'image' && cover.mediaUrl && (
        <img src={cover.mediaUrl} alt="" className="ilv-lesson-cover-media" draggable={false} />
      )}
      {cover?.posterUrl && cover.type !== 'video' && cover.type !== 'image' && (
        <img src={cover.posterUrl} alt="" className="ilv-lesson-cover-media" draggable={false} />
      )}
      {yt?.thumbUrl && <img src={yt.thumbUrl} alt="" className="ilv-lesson-cover-media" draggable={false} />}

      {!cover?.mediaUrl && !yt?.thumbUrl && !cover?.posterUrl && (
        <div className={`ilv-lesson-cover-fallback ${darkText ? 'is-light' : ''}`}>
          <span className="ilv-lesson-cover-icon" style={{ background: SCENE_TYPE_COLORS[cover?.type || 'title'] }}>
            {TYPE_ICON[cover?.type || 'title'] || <Clapperboard className="h-5 w-5" />}
          </span>
          <p className="ilv-lesson-cover-headline">{cover?.headline || cover?.title || 'Interactive lesson'}</p>
          {sceneTypes && sceneTypes.length > 0 && (
            <div className="ilv-lesson-cover-types">
              {sceneTypes.slice(0, 4).map((t) => (
                <span key={t} style={{ background: SCENE_TYPE_COLORS[t] }}>
                  {SCENE_TYPE_LABELS[t]}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {cover && (cover.mediaUrl || yt?.thumbUrl || cover.posterUrl) && (
        <div className="ilv-lesson-cover-shade">
          <span className="ilv-lesson-cover-typechip" style={{ background: SCENE_TYPE_COLORS[cover.type] }}>
            {SCENE_TYPE_LABELS[cover.type]}
          </span>
        </div>
      )}
    </div>
  );
}
