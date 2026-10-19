import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { LyricLine, LyricsDisplayOptions, Scene, TextOverlay } from '../types';
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
import {
  contrastTextColor,
  isOverlayPlaceholder,
  placeholderTextColor,
} from '../utils/textContrast';
import type { StageObject } from '../types';
import { TransformHandles, applyMoveSnap } from './editor/TransformHandles';
import { LyricsCanvasToolbar } from './editor/LyricsCanvasToolbar';
import type { GuideLine } from '../utils/snapGuides';
import type { TextEffects } from '../types';

interface SceneRendererProps {
  scene: Scene;
  timeMs?: number;
  playing?: boolean;
  showLyrics?: boolean;
  interactive?: boolean;
  selectedOverlayId?: string | null;
  /** Overlay currently in contentEditable mode (Canva-style). */
  editingOverlayId?: string | null;
  onSelectOverlay?: (id: string | null) => void;
  onEditOverlay?: (id: string | null) => void;
  onMoveOverlay?: (id: string, x: number, y: number) => void;
  onUpdateOverlay?: (id: string, patch: Partial<TextOverlay>) => void;
  onUpdateObject?: (id: string, patch: Partial<StageObject>) => void;
  /** Karaoke: click/drag active lyric on canvas. */
  onUpdateLyric?: (id: string, patch: Partial<LyricLine>) => void;
  onChangeLyricsDisplay?: (patch: Partial<LyricsDisplayOptions>) => void;
  onOpenLyricsStudio?: (lineId?: string) => void;
  transitionClass?: string;
  reducedMotion?: boolean;
  /** Fired when video/audio/YouTube reaches its end (for media-end advance). */
  onMediaEnded?: () => void;
  /** Override media URL (e.g. player vocal/backing switch). */
  mediaUrlOverride?: string | null;
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
  editingOverlayId = null,
  onSelectOverlay,
  onEditOverlay,
  onMoveOverlay,
  onUpdateOverlay,
  onUpdateObject,
  onUpdateLyric,
  onChangeLyricsDisplay,
  onOpenLyricsStudio,
  transitionClass = '',
  reducedMotion = false,
  onMediaEnded,
  mediaUrlOverride = null,
}: SceneRendererProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; ox: number; oy: number; moved: boolean; kind: 'overlay' | 'object' } | null>(null);
  const lyricDragRef = useRef<{ startY: number; origPos: string } | null>(null);
  const editElsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const endedRef = useRef(false);
  const [selectedLyricId, setSelectedLyricId] = useState<string | null>(null);
  const [editingLyricId, setEditingLyricId] = useState<string | null>(null);
  const [guides, setGuides] = useState<GuideLine[]>([]);
  const [lyricsSelected, setLyricsSelected] = useState(false);
  const lyricsBoxRef = useRef<HTMLDivElement>(null);

  const activeMediaUrl = mediaUrlOverride || scene.mediaUrl;

  useEffect(() => {
    endedRef.current = false;
  }, [scene.id]);

  useEffect(() => {
    const media = videoRef.current || audioRef.current;
    if (!media || !activeMediaUrl) return;
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
  }, [playing, timeMs, activeMediaUrl, scene.id]);

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
  }, [onMediaEnded, scene.id, activeMediaUrl]);

  // Canva-style: focus + select-all when entering edit mode
  useLayoutEffect(() => {
    if (!editingOverlayId) return;
    const el = editElsRef.current[editingOverlayId];
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [editingOverlayId]);

  const commitOverlayEdit = (id: string) => {
    const el = editElsRef.current[id];
    if (el && onUpdateOverlay) {
      const next = (el.innerText || '').replace(/\u00a0/g, ' ');
      const trimmed = next.replace(/\n+$/, '');
      if (trimmed !== (scene.overlays.find((o) => o.id === id)?.text || '')) {
        onUpdateOverlay(id, { text: trimmed || ' ' });
      }
    }
    onEditOverlay?.(null);
  };

  const siblingBoxes = useMemo(() => {
    const fromOv = scene.overlays.map((o) => ({
      id: o.id,
      x: o.x,
      y: o.y,
      width: o.width,
      height: o.height || 8,
    }));
    const fromObj = (scene.objects || []).map((o) => ({
      id: o.id,
      x: o.x,
      y: o.y,
      width: o.width,
      height: o.height,
    }));
    return [...fromOv, ...fromObj];
  }, [scene.overlays, scene.objects]);

  const onPointerDown = (e: React.PointerEvent, overlay: TextOverlay) => {
    if (!interactive || !stageRef.current || overlay.locked) return;
    if (editingOverlayId === overlay.id) return; // let contentEditable handle
    e.stopPropagation();
    onSelectOverlay?.(overlay.id);
    if (editingOverlayId && editingOverlayId !== overlay.id) {
      commitOverlayEdit(editingOverlayId);
    }
    const rect = stageRef.current.getBoundingClientRect();
    dragRef.current = {
      id: overlay.id,
      ox: ((e.clientX - rect.left) / rect.width) * 100 - overlay.x,
      oy: ((e.clientY - rect.top) / rect.height) * 100 - overlay.y,
      moved: false,
      kind: 'overlay',
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!interactive || !dragRef.current || !stageRef.current) return;
    if (editingOverlayId === dragRef.current.id) return;
    const rect = stageRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100 - dragRef.current.ox;
    let y = ((e.clientY - rect.top) / rect.height) * 100 - dragRef.current.oy;
    // Allow slight overflow past stage edges (no hard left clip)
    x = Math.max(-15, Math.min(105, x));
    y = Math.max(-15, Math.min(105, y));

    const moving = siblingBoxes.find((b) => b.id === dragRef.current!.id);
    if (moving) {
      const snapped = applyMoveSnap({ ...moving, x, y }, siblingBoxes);
      x = snapped.x;
      y = snapped.y;
      setGuides(snapped.guides);
    }

    dragRef.current.moved = true;
    if (dragRef.current.kind === 'object') {
      onUpdateObject?.(dragRef.current.id, { x, y });
    } else {
      onMoveOverlay?.(dragRef.current.id, x, y);
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
    setGuides([]);
  };

  const selectedOverlay = scene.overlays.find((o) => o.id === selectedOverlayId);
  const selectedObject = (scene.objects || []).find((o) => o.id === selectedOverlayId);

  const lyricIdx = scene.lyrics ? activeLyricIndex(scene.lyrics, timeMs) : -1;
  const trClass = reducedMotion ? '' : transitionClass;
  const showTitleHelper =
    (scene.type === 'title' || scene.type === 'text') &&
    scene.overlays.length === 0 &&
    interactive;
  const bg = scene.background;
  const stageBg =
    bg?.kind === 'gradient' && bg.gradient
      ? bg.gradient
      : bg?.kind === 'color' && bg.color
        ? bg.color
        : scene.backgroundGradient || scene.backgroundColor || '#FFFFFF';
  const overlayFxStyle = (fx: TextEffects | undefined, color: string): React.CSSProperties => {
    if (!fx) return {};
    const angle = ((fx.shadowAngle ?? 135) * Math.PI) / 180;
    const dist = fx.shadowOffset ?? (fx.shadowIntensity ? fx.shadowIntensity / 10 : 4);
    const ox = Math.cos(angle) * dist;
    const oy = Math.sin(angle) * dist;
    const blur = fx.shadowBlur ?? (fx.shadowIntensity ? fx.shadowIntensity / 8 : 6);
    const opac = fx.shadowOpacity ?? 0.45;
    const shadowCol = fx.shadowColor || 'rgba(0,0,0,0.55)';
    const shadows: string[] = [];
    if (fx.shadow || fx.preset === 'shadow' || fx.preset === 'lift' || fx.preset === 'neon' || fx.preset === 'echo' || fx.preset === 'glitch' || fx.preset === 'outline') {
      shadows.push(`${ox}px ${oy}px ${blur}px ${shadowCol.replace(/[\d.]+\)$/, `${opac})`).includes('rgba') ? shadowCol : shadowCol}`);
      if (fx.preset === 'glitch' && fx.effectColor) {
        shadows.push(`${-ox}px ${oy}px 0 ${fx.effectColor}`);
      }
      if (fx.preset === 'echo') {
        shadows.push(`${ox * 2}px ${oy * 2}px 0 ${fx.effectColor || shadowCol}`);
      }
      if (fx.preset === 'neon') {
        const glow = fx.neonColor || color;
        const n = (fx.neonIntensity ?? 70) / 100;
        shadows.push(`0 0 ${8 + n * 20}px ${glow}`, `0 0 ${16 + n * 30}px ${glow}`);
      }
    }
    const style: React.CSSProperties = {};
    if (shadows.length) style.textShadow = shadows.join(', ');
    if (fx.outline || fx.preset === 'hollow' || fx.preset === 'outline' || fx.preset === 'splice') {
      style.WebkitTextStroke = `${fx.outlineWidth || 2}px ${fx.outlineColor || '#fff'}`;
      if (fx.preset === 'hollow') style.color = 'transparent';
    }
    if (fx.fillGradient) {
      style.backgroundImage = fx.fillGradient;
      style.WebkitBackgroundClip = 'text';
      style.backgroundClip = 'text';
      style.color = 'transparent';
    }
    if (fx.curveAmount) {
      style.transform = `${style.transform || ''} perspective(400px) rotateX(${(fx.curveAmount || 0) / 5}deg)`.trim();
    }
    if (fx.superscript) {
      style.fontSize = '0.65em';
      style.verticalAlign = 'super';
    }
    const boxBg = fx.boxGradient || fx.boxBackground;
    if (boxBg) style.background = boxBg;
    if (fx.boxRadius != null) style.borderRadius = fx.boxRadius >= 60 ? 999 : fx.boxRadius;
    if (fx.boxPadding != null) style.padding = fx.boxPadding;
    if (fx.boxBorderWidth) {
      style.borderWidth = fx.boxBorderWidth;
      style.borderStyle = fx.boxBorderStyle || 'solid';
      style.borderColor = fx.boxBorderColor || '#1F1B4D';
    }
    if (fx.highlight || fx.preset === 'background') {
      style.background = fx.highlightColor || 'rgba(255,201,60,0.45)';
    }
    return style;
  };

  return (
    <div
      ref={stageRef}
      className={`absolute inset-0 ${trClass}`}
      style={{
        background: stageBg,
        opacity: scene.backgroundOpacity != null ? scene.backgroundOpacity : 1,
        ['--ilv-tr-ms' as string]: `${scene.transition.durationMs}ms`,
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={() => {
        if (!interactive) return;
        if (editingOverlayId) commitOverlayEdit(editingOverlayId);
        onSelectOverlay?.(null);
        onEditOverlay?.(null);
        setSelectedLyricId(null);
        setEditingLyricId(null);
        setLyricsSelected(false);
      }}
    >
      {bg?.kind === 'image' && bg.imageUrl && (
        <img
          src={bg.imageUrl}
          alt=""
          className="ilv-scene-bg-media"
          style={{
            opacity: bg.opacity ?? 1,
            filter: bg.blur ? `blur(${bg.blur}px)` : undefined,
          }}
          draggable={false}
        />
      )}
      {bg?.kind === 'video' && bg.videoUrl && (
        <video
          className="ilv-scene-bg-media"
          src={bg.videoUrl}
          autoPlay
          muted={bg.muted !== false}
          loop={bg.loop !== false}
          playsInline
          style={{
            opacity: bg.opacity ?? 1,
            filter: bg.blur ? `blur(${bg.blur}px)` : undefined,
          }}
        />
      )}
      {(bg?.dim || 0) > 0 && (
        <div className="ilv-scene-bg-dim" style={{ opacity: bg?.dim }} aria-hidden />
      )}
      {(scene.type === 'video' ||
        (scene.type === 'lyrics' && activeMediaUrl?.match(/\.(mp4|webm|mov)(\?|$)/i))) &&
        activeMediaUrl && (
          <video
            ref={videoRef}
            src={activeMediaUrl}
            poster={scene.posterUrl}
            className="absolute inset-0 h-full w-full object-contain bg-black"
            playsInline
            preload="auto"
          />
        )}

      {scene.type === 'image' && activeMediaUrl && (
        <img
          src={activeMediaUrl}
          alt={scene.title}
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
        />
      )}

      {(scene.type === 'audio' || scene.type === 'lyrics') &&
        activeMediaUrl &&
        !activeMediaUrl.match(/\.(mp4|webm|mov)(\?|$)/i) && (
          <>
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <div className="h-32 w-32 rounded-full border-4 border-white/40" />
            </div>
            <audio ref={audioRef} src={activeMediaUrl} preload="auto" />
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

      {(scene.objects || []).map((obj) => {
        const flip =
          `${obj.flipH ? 'scaleX(-1)' : ''} ${obj.flipV ? 'scaleY(-1)' : ''}`.trim() || undefined;
        const rot = obj.rotation ? `rotate(${obj.rotation}deg)` : '';
        const transform = [rot, flip].filter(Boolean).join(' ') || undefined;
        const common = {
          left: `${obj.x}%`,
          top: `${obj.y}%`,
          width: `${obj.width}%`,
          height: `${obj.height}%`,
          opacity: obj.opacity != null ? obj.opacity : 1,
          transform,
          zIndex: obj.zIndex || 2,
          pointerEvents: (interactive ? 'auto' : 'none') as React.CSSProperties['pointerEvents'],
        };
        return (
          <div
            key={obj.id}
            className={`ilv-stage-object ${selectedOverlayId === obj.id ? 'is-selected' : ''} ${
              obj.locked ? 'is-locked' : ''
            }`}
            style={common}
            onPointerDown={(e) => {
              if (!interactive || obj.locked) return;
              e.stopPropagation();
              onSelectOverlay?.(obj.id);
              onEditOverlay?.(null);
              if (!stageRef.current) return;
              const rect = stageRef.current.getBoundingClientRect();
              dragRef.current = {
                id: obj.id,
                ox: ((e.clientX - rect.left) / rect.width) * 100 - obj.x,
                oy: ((e.clientY - rect.top) / rect.height) * 100 - obj.y,
                moved: false,
                kind: 'object',
              };
              (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
            }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (obj.kind === 'image' || obj.kind === 'video') onSelectOverlay?.(obj.id);
            }}
          >
            {obj.kind === 'image' && obj.mediaUrl && (
              <img src={obj.mediaUrl} alt="" draggable={false} className="ilv-stage-object-media" />
            )}
            {obj.kind === 'video' && obj.mediaUrl && (
              <video src={obj.mediaUrl} className="ilv-stage-object-media" muted playsInline />
            )}
            {obj.kind === 'shape' && (
              <ShapeVisual
                shape={obj.shape || 'rect'}
                fill={obj.fill || '#4338E8'}
                stroke={obj.stroke || '#1F1B4D'}
                strokeWidth={obj.strokeWidth || 2}
              />
            )}
          </div>
        );
      })}

      {scene.overlays.map((ov) => {
        const preset = TEXT_PRESET_DEFAULTS[ov.style];
        const isPlaceholder = isOverlayPlaceholder(ov.text);
        const isEditing = editingOverlayId === ov.id;
        const isSelected = selectedOverlayId === ov.id;
        const bg = scene.backgroundColor || '#FFFFFF';
        const readable = isPlaceholder ? placeholderTextColor(bg) : ov.color || contrastTextColor(bg);
        const font =
          TEXT_FONT_OPTIONS.find((f) => f.id === ov.fontFamily || f.stack === ov.fontFamily)?.stack ||
          ov.fontFamily ||
          TEXT_FONT_OPTIONS[0].stack;
        const animType = ov.animation?.type && ov.animation.type !== 'none' ? ov.animation.type : null;
        const animClass =
          !reducedMotion && animType && !isEditing ? `ilv-text-anim ilv-text-anim-${animType}` : '';
        const flip =
          `${ov.flipH ? 'scaleX(-1)' : ''} ${ov.flipV ? 'scaleY(-1)' : ''}`.trim() || undefined;
        const rot = ov.rotation ? `rotate(${ov.rotation}deg)` : '';
        const fxStyle = overlayFxStyle(ov.effects, readable);
        const speed = ov.animation?.speed || 1;
        const dur = Math.round((ov.animation?.durationMs || 700) / speed);
        return (
          <div
            key={ov.id}
            data-style={ov.style}
            className={`ilv-overlay-box ${isSelected ? 'is-selected' : ''} ${
              isPlaceholder && !isEditing ? 'is-placeholder' : ''
            } ${isEditing ? 'is-editing' : ''} ${ov.locked ? 'is-locked' : ''} ${animClass}`}
            style={{
              left: `${ov.x}%`,
              top: `${ov.y}%`,
              width: `${ov.width}%`,
              height: ov.height != null ? `${ov.height}%` : undefined,
              color: readable,
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
              transform: [rot, flip, fxStyle.transform].filter(Boolean).join(' ') || undefined,
              zIndex: ov.zIndex || 3,
              pointerEvents: interactive ? 'auto' : 'none',
              background: ov.boxBackground,
              ...fxStyle,
              ['--ilv-text-anim-ms' as string]: `${dur}ms`,
              ['--ilv-text-anim-delay' as string]: `${ov.animation?.delayMs || 0}ms`,
            }}
            onPointerDown={(e) => onPointerDown(e, ov)}
            onClick={(e) => {
              e.stopPropagation();
              if (!interactive) return;
              onSelectOverlay?.(ov.id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (!interactive || ov.locked) return;
              onSelectOverlay?.(ov.id);
              onEditOverlay?.(ov.id);
            }}
            onKeyDown={(e) => {
              if (!interactive || ov.locked) return;
              if (!isEditing && (e.key === 'Enter' || e.key.length === 1) && selectedOverlayId === ov.id) {
                if (e.key === 'Enter' || !e.metaKey) {
                  e.preventDefault();
                  onEditOverlay?.(ov.id);
                }
              }
              if (isEditing && e.key === 'Escape') {
                e.preventDefault();
                commitOverlayEdit(ov.id);
              }
            }}
          >
            {isEditing ? (
              <div
                ref={(el) => {
                  editElsRef.current[ov.id] = el;
                }}
                className="ilv-overlay-edit"
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-label="Edit text"
                onPointerDown={(e) => e.stopPropagation()}
                onBlur={() => commitOverlayEdit(ov.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    (e.target as HTMLElement).blur();
                  }
                }}
              >
                {ov.text}
              </div>
            ) : (
              ov.text
            )}
          </div>
        );
      })}

      {/* Snap guides while dragging */}
      {interactive &&
        guides.map((g, i) => (
          <div
            key={`g-${g.orientation}-${g.pos}-${i}`}
            className={`ilv-snap-guide ilv-snap-guide-${g.orientation} is-${g.kind}`}
            style={g.orientation === 'v' ? { left: `${g.pos}%` } : { top: `${g.pos}%` }}
          />
        ))}

      {/* Unified Canva-style transform chrome */}
      {interactive && selectedOverlay && editingOverlayId !== selectedOverlay.id && (
        <TransformHandles
          mode="text"
          allowOverflow
          box={{
            id: selectedOverlay.id,
            x: selectedOverlay.x,
            y: selectedOverlay.y,
            width: selectedOverlay.width,
            height: selectedOverlay.height || Math.max(6, ((selectedOverlay.fontSize || 24) / 8)),
            rotation: selectedOverlay.rotation,
            flipH: selectedOverlay.flipH,
            flipV: selectedOverlay.flipV,
            locked: selectedOverlay.locked,
            fontSize: selectedOverlay.fontSize,
          }}
          stageEl={stageRef.current}
          siblings={siblingBoxes}
          onGuides={setGuides}
          onChange={(patch) => {
            onUpdateOverlay?.(selectedOverlay.id, {
              x: patch.x,
              y: patch.y,
              width: patch.width,
              height: patch.height,
              rotation: patch.rotation,
              fontSize: patch.fontSize,
              flipH: patch.flipH,
              flipV: patch.flipV,
            });
          }}
        />
      )}
      {interactive && selectedObject && (
        <TransformHandles
          mode="box"
          allowOverflow
          lockAspect={selectedObject.kind === 'image' || selectedObject.kind === 'video'}
          box={{
            id: selectedObject.id,
            x: selectedObject.x,
            y: selectedObject.y,
            width: selectedObject.width,
            height: selectedObject.height,
            rotation: selectedObject.rotation,
            flipH: selectedObject.flipH,
            flipV: selectedObject.flipV,
            locked: selectedObject.locked,
          }}
          stageEl={stageRef.current}
          siblings={siblingBoxes}
          onGuides={setGuides}
          onChange={(patch) => onUpdateObject?.(selectedObject.id, patch)}
        />
      )}

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
        const backdropOpacity = ld.backdropOpacity != null ? ld.backdropOpacity : 1;
        const lyricAnim =
          !reducedMotion && ld.animation && ld.animation !== 'none'
            ? `ilv-lyric-anim ilv-text-anim-${ld.animation}`
            : '';
        const animMs = Math.round((ld.animDurationMs || 700) / (ld.animSpeed || 1));
        return (
          <>
            <div
              className={`absolute inset-0 flex px-6 ${posClass}`}
              style={{ pointerEvents: interactive ? 'auto' : 'none' }}
            >
              <div
                ref={lyricsBoxRef}
                className={`mx-auto flex w-full max-w-3xl flex-col items-center gap-2 ${
                  ld.background ? 'ilv-karaoke-backdrop' : ''
                } ${lyricsSelected ? 'is-lyrics-selected' : ''}`}
                style={
                  ld.background
                    ? {
                        background: ld.backgroundColor || 'rgba(31,27,77,0.55)',
                        opacity: backdropOpacity,
                      }
                    : undefined
                }
                onClick={(e) => {
                  if (!interactive) return;
                  e.stopPropagation();
                  setLyricsSelected(true);
                  onSelectOverlay?.(null);
                }}
                onPointerDown={(e) => {
                  if (!interactive || !onChangeLyricsDisplay) return;
                  if ((e.target as HTMLElement).closest('[contenteditable="true"]')) return;
                  e.stopPropagation();
                  setLyricsSelected(true);
                  lyricDragRef.current = {
                    startY: e.clientY,
                    origPos: ld.position || 'bottom',
                  };
                  const move = (ev: PointerEvent) => {
                    if (!lyricDragRef.current || !stageRef.current) return;
                    const rect = stageRef.current.getBoundingClientRect();
                    const ratio = (ev.clientY - rect.top) / rect.height;
                    const next = ratio < 0.33 ? 'top' : ratio < 0.66 ? 'center' : 'bottom';
                    if (next !== ld.position) onChangeLyricsDisplay({ position: next });
                  };
                  const up = () => {
                    lyricDragRef.current = null;
                    window.removeEventListener('pointermove', move);
                    window.removeEventListener('pointerup', up);
                  };
                  window.addEventListener('pointermove', move);
                  window.addEventListener('pointerup', up);
                }}
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
                    const editing = editingLyricId === line.id;
                    return (
                      <div
                        key={line.id}
                        className={`ilv-karaoke-line ${state} ${
                          interactive ? 'ilv-karaoke-editable' : ''
                        } ${selectedLyricId === line.id ? 'is-selected' : ''} ${
                          state === 'is-active' ? lyricAnim : ''
                        }`}
                        style={{
                          color,
                          fontFamily: font,
                          fontSize: ld.fontSize || 28,
                          ['--ilv-text-anim-ms' as string]: `${animMs}ms`,
                          ['--ilv-lyric-active' as string]: ld.activeColor || '#FFC93C',
                        }}
                        contentEditable={editing}
                        suppressContentEditableWarning
                        onClick={(e) => {
                          if (!interactive) return;
                          e.stopPropagation();
                          setSelectedLyricId(line.id);
                          setLyricsSelected(true);
                          setEditingLyricId(line.id);
                        }}
                        onDoubleClick={(e) => {
                          if (!interactive) return;
                          e.stopPropagation();
                          setEditingLyricId(line.id);
                          onOpenLyricsStudio?.(line.id);
                        }}
                        onBlur={(e) => {
                          if (!onUpdateLyric) return;
                          const text = (e.currentTarget.textContent || '').trim();
                          if (text && text !== line.text) onUpdateLyric(line.id, { text });
                          setEditingLyricId(null);
                        }}
                      >
                        {ld.animScope === 'word' && state === 'is-active'
                          ? line.text.split(/\s+/).map((w, wi) => (
                              <span
                                key={wi}
                                className="ilv-lyric-word"
                                style={{ animationDelay: `${wi * 80}ms` }}
                              >
                                {w}{' '}
                              </span>
                            ))
                          : line.text}
                      </div>
                    );
                  })}
              </div>
            </div>
            {interactive && lyricsSelected && onChangeLyricsDisplay && (
              <LyricsCanvasToolbar
                display={ld}
                anchorEl={lyricsBoxRef.current}
                onChange={onChangeLyricsDisplay}
                onOpenStudio={() => onOpenLyricsStudio?.()}
              />
            )}
          </>
        );
      })()}
    </div>
  );
}

function ShapeVisual({
  shape,
  fill,
  stroke,
  strokeWidth,
}: {
  shape: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
}) {
  const sw = strokeWidth;
  if (shape === 'ellipse') {
    return (
      <svg viewBox="0 0 100 100" className="ilv-stage-object-media" preserveAspectRatio="none">
        <ellipse cx="50" cy="50" rx="48" ry="48" fill={fill} stroke={stroke} strokeWidth={sw} />
      </svg>
    );
  }
  if (shape === 'triangle') {
    return (
      <svg viewBox="0 0 100 100" className="ilv-stage-object-media" preserveAspectRatio="none">
        <polygon points="50,4 96,96 4,96" fill={fill} stroke={stroke} strokeWidth={sw} />
      </svg>
    );
  }
  if (shape === 'line') {
    return (
      <svg viewBox="0 0 100 100" className="ilv-stage-object-media" preserveAspectRatio="none">
        <line x1="2" y1="50" x2="98" y2="50" stroke={stroke || fill} strokeWidth={sw * 2} />
      </svg>
    );
  }
  if (shape === 'arrow') {
    return (
      <svg viewBox="0 0 100 100" className="ilv-stage-object-media" preserveAspectRatio="none">
        <line x1="4" y1="50" x2="72" y2="50" stroke={stroke || fill} strokeWidth={sw * 2} />
        <polygon points="70,30 98,50 70,70" fill={fill} stroke={stroke} strokeWidth={sw} />
      </svg>
    );
  }
  if (shape === 'star') {
    return (
      <svg viewBox="0 0 100 100" className="ilv-stage-object-media" preserveAspectRatio="none">
        <polygon
          points="50,4 61,38 98,38 68,59 79,94 50,73 21,94 32,59 2,38 39,38"
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
        />
      </svg>
    );
  }
  const rx = shape === 'rounded' ? Math.min(24, sw * 4) : 0;
  return (
    <svg viewBox="0 0 100 100" className="ilv-stage-object-media" preserveAspectRatio="none">
      <rect x="2" y="2" width="96" height="96" rx={rx} fill={fill} stroke={stroke} strokeWidth={sw} />
    </svg>
  );
}
