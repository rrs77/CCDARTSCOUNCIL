import React, { useEffect, useId, useRef, useState } from 'react';
import { Image as ImageIcon, Music, Pause, Play, Search, GripVertical } from 'lucide-react';
import {
  checkFreesoundAvailable,
  fetchFreesoundPreviewObjectUrl,
  formatFreeMediaAttribution,
  searchFreeMedia,
  type AudioProvider,
  type FreeMediaItem,
  type FreeMediaType,
  type ImageProvider,
} from '../../utils/freeMedia';

export interface FreeMediaPanelProps {
  onInsertImage: (item: FreeMediaItem, at?: { xPct: number; yPct: number }) => void;
  onAddToLibrary: (item: FreeMediaItem) => void;
  onAddToAudioLane?: (item: FreeMediaItem, lane: 'voiceover' | 'music') => void;
}

type Tab = FreeMediaType;

const FREE_MEDIA_MIME = 'application/ilv-freemedia';

function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function setDragPayload(e: React.DragEvent, item: FreeMediaItem) {
  const payload = JSON.stringify(item);
  e.dataTransfer.setData(FREE_MEDIA_MIME, payload);
  e.dataTransfer.setData(
    'application/ilv-media',
    JSON.stringify({
      url: item.url,
      name: item.title,
      kind: item.mediaType === 'audio' ? 'audio' : 'image',
      thumbUrl: item.thumbUrl,
    }),
  );
  if (item.mediaType === 'audio') {
    e.dataTransfer.setData(
      'application/ilv-audio',
      JSON.stringify({
        url: item.url,
        name: item.title,
        durationMs: 8000,
      }),
    );
  }
  e.dataTransfer.effectAllowed = 'copyMove';
}

/** Dedicated Free media rail — Openverse / Wikimedia CC0·PD with DnD. */
export function FreeMediaPanel({
  onInsertImage,
  onAddToLibrary,
  onAddToAudioLane,
}: FreeMediaPanelProps) {
  const searchId = useId();
  const [freesoundOk, setFreesoundOk] = useState(false);

  const [tab, setTab] = useState<Tab>('image');
  const [imageProvider, setImageProvider] = useState<ImageProvider>('openverse');
  const [audioProvider, setAudioProvider] = useState<AudioProvider>('openverse');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FreeMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [audioTime, setAudioTime] = useState(0);
  const [audioDur, setAudioDur] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void checkFreesoundAvailable().then((ok) => {
      if (!cancelled) setFreesoundOk(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingId(null);
    setPreviewId(null);
    setAudioTime(0);
    setAudioDur(0);
  }, [tab, imageProvider, audioProvider]);

  const runSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const provider = tab === 'image' ? imageProvider : audioProvider;
      const items = await searchFreeMedia({
        query: q,
        mediaType: tab,
        provider,
        signal: ac.signal,
      });
      if (!ac.signal.aborted) setResults(items);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      setResults([]);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  };

  const revokePreviewObjectUrl = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
  };

  const ensureAudio = async (item: FreeMediaItem) => {
    if (audioRef.current && playingId === item.id) return audioRef.current;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    revokePreviewObjectUrl();

    let src = item.url;
    if (item.provider === 'freesound' && item.previewPath) {
      src = await fetchFreesoundPreviewObjectUrl(item.previewPath);
      previewObjectUrlRef.current = src;
    }

    const el = new Audio(src);
    audioRef.current = el;
    el.preload = 'metadata';
    el.ontimeupdate = () => setAudioTime(el.currentTime);
    el.onloadedmetadata = () => setAudioDur(el.duration || 0);
    el.onended = () => {
      setPlayingId(null);
      setAudioTime(0);
    };
    el.onerror = () => {
      setPlayingId(null);
      setError('Audio preview failed — try Open in source.');
    };
    return el;
  };

  const togglePreview = (item: FreeMediaItem) => {
    if (item.mediaType !== 'audio') {
      setPreviewId((id) => (id === item.id ? null : item.id));
      return;
    }
    setPreviewId(item.id);
    if (playingId === item.id && audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }
    void ensureAudio(item).then(
      (el) =>
        el.play().then(
          () => setPlayingId(item.id),
          () => setPlayingId(null),
        ),
      () => {
        setPlayingId(null);
        setError('Audio preview failed — try Open in source.');
      },
    );
  };

  const scrubTo = (item: FreeMediaItem, ratio: number) => {
    void ensureAudio(item).then((el) => {
      if (!el.duration) return;
      el.currentTime = Math.max(0, Math.min(el.duration, ratio * el.duration));
      setAudioTime(el.currentTime);
    });
  };

  const previewItem = results.find((r) => r.id === previewId) || null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      <div>
        <h3 className="text-sm font-extrabold tracking-tight text-[var(--ss-ink)]">Free media</h3>
        <p className="mt-0.5 text-xs text-[var(--ss-muted)]">
          CC0 / public-domain images &amp; sounds. Drag onto the slide or Music lane under the timeline.
        </p>
      </div>

      <div className="flex gap-1" role="tablist" aria-label="Media type">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'image'}
          className={`ilv-btn flex-1 text-xs ${tab === 'image' ? 'ilv-btn-primary' : 'ilv-btn-secondary'}`}
          onClick={() => {
            setTab('image');
            setResults([]);
            setSearched(false);
            setError(null);
          }}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          Images
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'audio'}
          className={`ilv-btn flex-1 text-xs ${tab === 'audio' ? 'ilv-btn-primary' : 'ilv-btn-secondary'}`}
          onClick={() => {
            setTab('audio');
            setResults([]);
            setSearched(false);
            setError(null);
          }}
        >
          <Music className="h-3.5 w-3.5" />
          Sounds
        </button>
      </div>

      <div>
        <label className="ilv-label" htmlFor={`${searchId}-provider`}>
          Provider
        </label>
        {tab === 'image' ? (
          <select
            id={`${searchId}-provider`}
            className="ilv-select"
            value={imageProvider}
            onChange={(e) => {
              setImageProvider(e.target.value as ImageProvider);
              setResults([]);
              setSearched(false);
            }}
          >
            <option value="openverse">Openverse (CC0 / PD)</option>
            <option value="wikimedia">Wikimedia Commons</option>
          </select>
        ) : (
          <select
            id={`${searchId}-provider`}
            className="ilv-select"
            value={audioProvider}
            onChange={(e) => {
              setAudioProvider(e.target.value as AudioProvider);
              setResults([]);
              setSearched(false);
            }}
          >
            <option value="openverse">Openverse (CC0 / PD)</option>
            {freesoundOk && <option value="freesound">Freesound</option>}
          </select>
        )}
      </div>

      <form onSubmit={runSearch} className="flex gap-1.5">
        <div className="min-w-0 flex-1">
          <label className="ilv-label" htmlFor={searchId}>
            Search
          </label>
          <input
            id={searchId}
            className="ilv-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === 'image' ? 'e.g. classroom piano' : 'e.g. soft clap'}
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          className="ilv-btn ilv-btn-primary self-end shrink-0 px-3"
          disabled={loading || !query.trim()}
          aria-label="Search free media"
        >
          <Search className="h-4 w-4" />
        </button>
      </form>

      {previewItem && (
        <div className="ilv-free-preview rounded-[12px] border border-[var(--ss-line)] bg-[var(--ss-canvas)] p-2">
          {previewItem.mediaType === 'image' ? (
            <img
              src={previewItem.url || previewItem.thumbUrl}
              alt={previewItem.title}
              className="max-h-40 w-full rounded-[8px] object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="ilv-play-btn"
                  aria-label={playingId === previewItem.id ? 'Pause' : 'Play'}
                  onClick={() => togglePreview(previewItem)}
                >
                  {playingId === previewItem.id ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 fill-white" />
                  )}
                </button>
                <span className="tabular-nums text-xs font-semibold">
                  {formatDuration(audioTime)} / {formatDuration(audioDur)}
                </span>
              </div>
              <div
                className="ilv-free-scrub"
                role="slider"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={audioDur ? Math.round((audioTime / audioDur) * 100) : 0}
                aria-label="Scrub audio"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  scrubTo(previewItem, (e.clientX - rect.left) / rect.width);
                }}
              >
                <div
                  className="ilv-free-scrub-fill"
                  style={{ width: audioDur ? `${(audioTime / audioDur) * 100}%` : 0 }}
                />
                <div className="ilv-free-scrub-wave" aria-hidden>
                  {Array.from({ length: 48 }).map((_, i) => (
                    <span key={i} style={{ height: `${30 + ((i * 37) % 70)}%` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <p className="mt-1.5 text-[11px] font-bold leading-snug">{previewItem.title}</p>
          <p className="text-[10px] text-[var(--ss-muted)]">{formatFreeMediaAttribution(previewItem)}</p>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && <div className="ilv-empty-slot pointer-events-none py-8 text-xs">Searching…</div>}
        {!loading && error && (
          <div className="rounded-[12px] border border-[var(--ss-line)] bg-[var(--ss-lilac)] px-3 py-2 text-xs">
            {error}
          </div>
        )}
        {!loading && !error && searched && results.length === 0 && (
          <div className="ilv-empty-slot pointer-events-none py-8 text-xs">No results — try another term.</div>
        )}
        {!loading && !searched && (
          <div className="ilv-empty-slot pointer-events-none py-8 text-xs">
            Search CC0 / public-domain media, then drag onto the slide or Music lane.
          </div>
        )}

        {!loading && results.length > 0 && (
          <ul className="grid grid-cols-2 gap-2">
            {results.map((item) => (
              <li key={item.id}>
                <div
                  className={`ilv-free-card ${previewId === item.id ? 'is-preview' : ''}`}
                  draggable
                  onDragStart={(e) => setDragPayload(e, item)}
                  title="Drag onto slide or Music lane"
                >
                  <div
                    className="ilv-free-card-media"
                    onClick={() => togglePreview(item)}
                    onMouseEnter={() => {
                      if (item.mediaType === 'image') setPreviewId(item.id);
                    }}
                  >
                    {item.mediaType === 'image' && item.thumbUrl ? (
                      <img
                        src={item.thumbUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        draggable={false}
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-1 text-[var(--ss-muted)]">
                        <Music className="h-6 w-6" />
                        <span className="text-[10px] font-bold">
                          {playingId === item.id ? 'Playing…' : 'Preview'}
                        </span>
                      </div>
                    )}
                    <span className="ilv-free-drag-hint" aria-hidden>
                      <GripVertical className="h-3 w-3" />
                    </span>
                  </div>
                  <div className="p-1.5">
                    <p className="line-clamp-2 text-[10px] font-bold leading-snug">{item.title}</p>
                    <p className="mt-0.5 truncate text-[9px] text-[var(--ss-muted)]">
                      {item.license} · {item.provider}
                    </p>
                    <div className="mt-1.5 flex flex-col gap-1">
                      {item.mediaType === 'image' ? (
                        <button
                          type="button"
                          className="ilv-btn ilv-btn-primary min-h-0 w-full py-1 text-[10px]"
                          onClick={() => onInsertImage(item)}
                        >
                          Insert on canvas
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="ilv-btn ilv-btn-primary min-h-0 w-full py-1 text-[10px]"
                          onClick={() => onAddToAudioLane?.(item, 'music')}
                        >
                          Add to Music lane
                        </button>
                      )}
                      <button
                        type="button"
                        className="ilv-btn ilv-btn-secondary min-h-0 w-full py-1 text-[10px]"
                        onClick={() => onAddToLibrary(item)}
                      >
                        Library
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export { FREE_MEDIA_MIME };
