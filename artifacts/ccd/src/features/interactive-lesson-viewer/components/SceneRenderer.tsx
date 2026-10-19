import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { Scene, TextOverlay } from '../types';
import { DEFAULT_LYRICS_DISPLAY, TEXT_FONT_OPTIONS, TEXT_PRESET_DEFAULTS } from '../types';
import { activeLyricIndex } from '../utils/lyricsSync';
import {
  canvaOpenUrl,
  isCanvaShortlink,
  isLikelyCanvaEmbed,
  normalizeCanvaEmbedUrl,
} from '../utils/canvaEmbed';
import { youtubeEmbedSrc, parseYouTubeUrl } from '../utils/youtubeEmbed';
import {
  isGoogleSlidesUrl,
  normalizeGoogleSlidesEmbedUrl,
  parseGoogleSlidesUrl,
} from '../utils/googleSlidesEmbed';

interface SceneRendererProps {
  scene: Scene;
  timeMs?: number;
  playing?: boolean;
  showLyrics?: boolean;
  interactive?: boolean;
  selectedOverlayId?: string | null;
  onSelectOverlay?: (id: string | null) => void;
  onMoveOverlay?: (id: string, x: number, y: number) => void;
  onUpdateOverlay?: (id: string, patch: Partial<TextOverlay>) => void;
  transitionClass?: string;
  reducedMotion?: boolean;
  /** Fired when video/audio/YouTube reaches its end (for media-end advance). */
  onMediaEnded?: () => void;
}

const PLACEHOLDER_RE = /^(add title|add subtitle|add text|lesson title|subtitle|body text)$/i;

function vimeoEmbed(url: string): string {
  try {
    if (url.includes('player.vimeo.com')) return url;
    const id = url.split('/').filter(Boolean).pop();
    return id ? `https://player.vimeo.com/video/${id}` : url;
  } catch {
    return url;
  }
}

function CanvaHelpCard({ url, shortlink }: { url: string; shortlink?: boolean }) {
  return (
    <div className="ilv-embed-fallback">
      <p className="ilv-embed-fallback-title">
        {shortlink ? 'Canva short links can’t be embedded' : 'Canva blocked this link'}
      </p>
      <p className="ilv-embed-fallback-body">
        In Canva, choose Share → More → Embed, copy the embed link, and paste it here. Or download as
        MP4 and add it as a video.
      </p>
      <a
        className="ilv-btn ilv-btn-secondary"
        href={canvaOpenUrl(url)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <ExternalLink className="h-4 w-4" />
        Open in Canva
      </a>
    </div>
  );
}

function CanvaFrame({ url, title }: { url: string; title: string }) {
  const normalized = useMemo(() => normalizeCanvaEmbedUrl(url), [url]);
  const shortlink = isCanvaShortlink(url);
  const embeddable = isLikelyCanvaEmbed(normalized) && !shortlink;
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setShowHelp(false);
    if (!embeddable) return;
    // Cross-origin frames can't report XFO; after a short wait offer help without hiding a working embed.
    const t = window.setTimeout(() => setShowHelp(true), 4500);
    return () => window.clearTimeout(t);
  }, [normalized, embeddable]);

  if (!embeddable) {
    return <CanvaHelpCard url={url} shortlink={shortlink} />;
  }

  return (
    <div className="absolute inset-0">
      <iframe
        title={title}
        src={normalized}
        className="absolute inset-0 h-full w-full border-0 bg-white"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
      {showHelp && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          <button
            type="button"
            className="ilv-btn ilv-btn-secondary text-xs shadow-md"
            onClick={() => setShowHelp(false)}
          >
            Looking good
          </button>
          <a
            className="ilv-btn ilv-btn-primary text-xs shadow-md"
            href={canvaOpenUrl(url)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Can&apos;t see it? Open in Canva
          </a>
        </div>
      )}
    </div>
  );
}

function BrandEmbedCard({
  kind,
  posterUrl,
  notes,
}: {
  kind: 'canva' | 'powerpoint' | 'embed';
  posterUrl?: string;
  notes?: string;
}) {
  const label = kind === 'canva' ? 'Canva design' : kind === 'powerpoint' ? 'PowerPoint' : 'Embed';
  return (
    <div className="ilv-embed-fallback">
      {posterUrl && <img src={posterUrl} alt="" className="h-14 w-auto opacity-90" />}
      <p className="ilv-embed-fallback-title">{label}</p>
      <p className="ilv-embed-fallback-body">
        {notes ||
          (kind === 'canva'
            ? 'Paste a Canva Embed link (Share → More → Embed) to preview live.'
            : 'Paste an Office Online embed URL to preview slides.')}
      </p>
    </div>
  );
}

function YouTubeFrame({
  url,
  title,
  startSec,
  endSec,
  playing,
  onEnded,
}: {
  url: string;
  title: string;
  startSec?: number;
  endSec?: number;
  playing?: boolean;
  onEnded?: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const src = youtubeEmbedSrc(url, { startSec, endSec, autoplay: playing });

  useEffect(() => {
    if (!onEnded) return;
    const onMessage = (event: MessageEvent) => {
      if (!String(event.origin).includes('youtube.com')) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        // YouTube IFrame API posts infoDelivery / onStateChange (0 = ended)
        if (data?.event === 'onStateChange' && (data?.info === 0 || data?.info?.playerState === 0)) {
          onEnded();
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('message', onMessage);
    // Ask the iframe to listen for state changes when possible
    const t = window.setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }),
        '*',
      );
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }),
        '*',
      );
    }, 800);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('message', onMessage);
    };
  }, [onEnded, src]);

  // Soft end detection via clip window when API messages are blocked
  useEffect(() => {
    if (!onEnded || endSec == null || !playing) return;
    const start = startSec || 0;
    const ms = Math.max(500, (endSec - start) * 1000);
    const t = window.setTimeout(onEnded, ms);
    return () => window.clearTimeout(t);
  }, [onEnded, endSec, startSec, playing, src]);

  return (
    <iframe
      ref={iframeRef}
      title={title}
      src={src}
      className="absolute inset-0 h-full w-full border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}

function GoogleSlidesFrame({ url, title }: { url: string; title: string }) {
  const embed = normalizeGoogleSlidesEmbedUrl(url);
  const parsed = parseGoogleSlidesUrl(url);
  const [blocked, setBlocked] = useState(!isGoogleSlidesUrl(url) && !embed.includes('/embed'));

  if (blocked) {
    return (
      <div className="ilv-embed-fallback">
        <p className="ilv-embed-fallback-title">Google Slides couldn’t load</p>
        <p className="ilv-embed-fallback-body">
          Share the deck as “Anyone with the link can view”, or File → Share → Publish to the web, then paste the
          link again.
        </p>
        {parsed && (
          <a className="ilv-btn ilv-btn-secondary" href={parsed.openUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Open in Google Slides
          </a>
        )}
        <button type="button" className="ilv-btn ilv-btn-ghost text-xs text-white/80" onClick={() => setBlocked(false)}>
          Try embed again
        </button>
      </div>
    );
  }

  return (
    <iframe
      title={title}
      src={embed}
      className="absolute inset-0 h-full w-full border-0 bg-white"
      allowFullScreen
      onError={() => setBlocked(true)}
    />
  );
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
  onMediaEnded,
}: SceneRendererProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null);
  const endedRef = useRef(false);

  useEffect(() => {
    endedRef.current = false;
  }, [scene.id]);

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

  useEffect(() => {
    const media = videoRef.current || audioRef.current;
    if (!media || !onMediaEnded) return;
    const onEnded = () => {
      if (endedRef.current) return;
      endedRef.current = true;
      onMediaEnded();
    };
    media.addEventListener('ended', onEnded);
    return () => media.removeEventListener('ended', onEnded);
  }, [onMediaEnded, scene.id, scene.mediaUrl]);

  const onPointerDown = (e: React.PointerEvent, overlay: TextOverlay) => {
    if (!interactive || !stageRef.current || overlay.locked) return;
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
  const showTitleHelper =
    (scene.type === 'title' || scene.type === 'text') &&
    scene.overlays.length === 0 &&
    interactive;

  return (
    <div
      ref={stageRef}
      className={`absolute inset-0 ${trClass}`}
      style={{
        background: scene.backgroundColor || '#FFFFFF',
        ['--ilv-tr-ms' as string]: `${scene.transition.durationMs}ms`,
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={() => interactive && onSelectOverlay?.(null)}
    >
      {(scene.type === 'video' ||
        (scene.type === 'lyrics' && scene.mediaUrl?.match(/\.(mp4|webm|mov)(\?|$)/i))) &&
        scene.mediaUrl && (
          <video
            ref={videoRef}
            src={scene.mediaUrl}
            poster={scene.posterUrl}
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

      {(scene.type === 'audio' || scene.type === 'lyrics') &&
        scene.mediaUrl &&
        !scene.mediaUrl.match(/\.(mp4|webm|mov)(\?|$)/i) && (
          <>
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <div className="h-32 w-32 rounded-full border-4 border-white/40" />
            </div>
            <audio ref={audioRef} src={scene.mediaUrl} preload="auto" />
          </>
        )}

      {scene.type === 'youtube' && scene.embedUrl && (
        <YouTubeFrame
          url={scene.embedUrl}
          title={scene.title}
          startSec={scene.youtubeStartSec}
          endSec={scene.youtubeEndSec}
          playing={playing}
          onEnded={onMediaEnded}
        />
      )}

      {scene.type === 'vimeo' && scene.embedUrl && (
        <iframe
          title={scene.title}
          src={vimeoEmbed(scene.embedUrl)}
          className="absolute inset-0 h-full w-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      )}

      {scene.type === 'canva' &&
        (scene.embedUrl ? (
          <CanvaFrame url={scene.embedUrl} title={scene.title} />
        ) : scene.overlays.length === 0 ? (
          <BrandEmbedCard kind="canva" posterUrl={scene.posterUrl} notes={scene.notes} />
        ) : (
          scene.posterUrl && (
            <img
              src={scene.posterUrl}
              alt=""
              className="absolute inset-0 m-auto h-20 w-auto opacity-25"
              draggable={false}
            />
          )
        ))}

      {scene.type === 'powerpoint' &&
        (scene.embedUrl ? (
          <iframe
            title={scene.title}
            src={scene.embedUrl}
            className="absolute inset-0 h-full w-full border-0 bg-white"
            allowFullScreen
          />
        ) : scene.overlays.length === 0 ? (
          <BrandEmbedCard kind="powerpoint" posterUrl={scene.posterUrl} notes={scene.notes} />
        ) : (
          scene.posterUrl && (
            <img
              src={scene.posterUrl}
              alt=""
              className="absolute inset-0 m-auto h-20 w-auto opacity-25"
              draggable={false}
            />
          )
        ))}

      {scene.type === 'googleslides' &&
        (scene.embedUrl ? (
          <GoogleSlidesFrame url={scene.embedUrl} title={scene.title} />
        ) : (
          <BrandEmbedCard
            kind="embed"
            posterUrl={scene.posterUrl}
            notes={
              scene.notes ||
              'Paste a Google Slides link shared as “Anyone with the link can view”, or publish to the web.'
            }
          />
        ))}

      {scene.type === 'embed' &&
        (scene.embedUrl ? (
          <iframe
            title={scene.title}
            src={scene.embedUrl}
            className="absolute inset-0 h-full w-full border-0"
            allowFullScreen
          />
        ) : (
          <BrandEmbedCard kind="embed" posterUrl={scene.posterUrl} notes={scene.notes} />
        ))}

      {showTitleHelper && (
        <div className="ilv-stage-helper" aria-hidden>
          <span className="ilv-stage-helper-title">Add a title</span>
          <span className="ilv-stage-helper-sub">Use Text in the rail, or press T</span>
        </div>
      )}

      {scene.overlays.map((ov) => {
        const preset = TEXT_PRESET_DEFAULTS[ov.style];
        const isPlaceholder = PLACEHOLDER_RE.test(ov.text.trim());
        const font =
          TEXT_FONT_OPTIONS.find((f) => f.id === ov.fontFamily || f.stack === ov.fontFamily)?.stack ||
          ov.fontFamily ||
          TEXT_FONT_OPTIONS[0].stack;
        const shadow =
          ov.effects?.shadow
            ? `0 ${Math.max(1, (ov.effects.shadowIntensity || 40) / 20)}px ${Math.max(2, (ov.effects.shadowIntensity || 40) / 8)}px ${ov.effects.shadowColor || 'rgba(0,0,0,0.45)'}`
            : undefined;
        const outline =
          ov.effects?.outline
            ? `${ov.effects.outlineWidth || 1}px ${ov.effects.outlineColor || '#000'}`
            : undefined;
        const animType = ov.animation?.type && ov.animation.type !== 'none' ? ov.animation.type : null;
        const animClass =
          !reducedMotion && animType ? `ilv-text-anim ilv-text-anim-${animType}` : '';
        return (
          <div
            key={ov.id}
            data-style={ov.style}
            className={`ilv-overlay-box ${selectedOverlayId === ov.id ? 'is-selected' : ''} ${
              isPlaceholder ? 'is-placeholder' : ''
            } ${ov.locked ? 'is-locked' : ''} ${animClass}`}
            style={{
              left: `${ov.x}%`,
              top: `${ov.y}%`,
              width: `${ov.width}%`,
              color: ov.color,
              fontSize: ov.fontSize || preset.fontSize,
              fontWeight: ov.fontWeight || preset.fontWeight,
              fontFamily: font,
              fontStyle: ov.fontStyle || 'normal',
              textDecoration: ov.textDecoration || 'none',
              textTransform: ov.textTransform || 'none',
              textAlign: ov.textAlign || 'left',
              letterSpacing: ov.letterSpacing != null ? `${ov.letterSpacing}px` : undefined,
              lineHeight: ov.lineHeight || undefined,
              opacity: ov.opacity != null ? ov.opacity : 1,
              transform: ov.rotation ? `rotate(${ov.rotation}deg)` : undefined,
              textShadow: shadow,
              WebkitTextStroke: outline,
              background: ov.effects?.highlight ? ov.effects.highlightColor || 'rgba(255,201,60,0.35)' : undefined,
              zIndex: ov.zIndex || 1,
              pointerEvents: interactive ? 'auto' : 'none',
              ['--ilv-text-anim-ms' as string]: `${ov.animation?.durationMs || 700}ms`,
              ['--ilv-text-anim-delay' as string]: `${ov.animation?.delayMs || 0}ms`,
            }}
            onPointerDown={(e) => onPointerDown(e, ov)}
          >
            {ov.text}
          </div>
        );
      })}

      {showLyrics && scene.lyrics && scene.lyrics.length > 0 && (() => {
        const ld = { ...DEFAULT_LYRICS_DISPLAY, ...scene.lyricsDisplay };
        const font =
          TEXT_FONT_OPTIONS.find((f) => f.id === ld.fontFamily)?.stack || TEXT_FONT_OPTIONS[0].stack;
        const posClass =
          ld.position === 'top'
            ? 'items-start pt-[10%]'
            : ld.position === 'center'
              ? 'items-center'
              : 'items-end pb-[12%]';
        return (
          <div className={`absolute inset-0 flex px-6 ${posClass}`} style={{ pointerEvents: 'none' }}>
            <div
              className={`mx-auto flex w-full max-w-3xl flex-col items-center gap-2 ${ld.background ? 'ilv-karaoke-backdrop' : ''}`}
              style={
                ld.background
                  ? { background: ld.backgroundColor || 'rgba(31,27,77,0.55)' }
                  : undefined
              }
            >
              {scene.lyrics
                .map((line, idx) => ({ line, idx }))
                .filter(({ idx }) => {
                  if (idx === lyricIdx) return true;
                  if (idx === lyricIdx - 1) return ld.showPast !== false;
                  if (idx === lyricIdx + 1) return ld.showUpcoming !== false;
                  return false;
                })
                .map(({ line, idx }) => {
                  const state =
                    idx === lyricIdx ? 'is-active' : idx < lyricIdx ? 'is-past' : 'is-upcoming';
                  const color =
                    state === 'is-active'
                      ? ld.activeColor
                      : state === 'is-past'
                        ? ld.pastColor
                        : ld.upcomingColor;
                  return (
                    <div
                      key={line.id}
                      className={`ilv-karaoke-line ${state}`}
                      style={{
                        color,
                        fontFamily: font,
                        fontSize: ld.fontSize || 28,
                      }}
                    >
                      {line.text}
                    </div>
                  );
                })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
