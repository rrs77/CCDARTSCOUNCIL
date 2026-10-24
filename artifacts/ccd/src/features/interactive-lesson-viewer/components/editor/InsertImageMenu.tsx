import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Link2, Upload, Library, Sparkles } from 'lucide-react';
import type { MediaLibraryItem } from '../../types';
import { PortalPopover } from './PortalPopover';
import { normaliseCloudLink, sceneTypeToCloudKind } from '../../utils/cloudLinks';
import {
  ILV_FILE_ACCEPT,
  uploadInteractiveLessonMedia,
  type UploadProgress,
} from '../../utils/mediaUpload';
import { IlvCloudFilesPanel } from './IlvCloudFilesPanel';
import type { ImportedIlvMedia } from '../../utils/ilvCloudImport';

interface InsertImageMenuProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  mediaLibrary: MediaLibraryItem[];
  userId: string;
  lessonId: string;
  onUploaded: (result: {
    url: string;
    name: string;
    kind: string;
    localOnly: boolean;
    warning?: string;
    cloudProvider?: string;
    sourceUrl?: string;
  }) => void;
  onInsertUrl: (url: string, meta?: { name?: string; sourceUrl?: string; cloudProvider?: string }) => void;
  onOpenFreeMedia: () => void;
  onOpenLibraryRail: () => void;
  /** Cloud / device import via lesson-attachment pickers (preferred for Drive, Dropbox, …). */
  onCloudImported?: (media: ImportedIlvMedia) => void;
}

/** Portaled insert-image picker — Upload from computer first. */
export function InsertImageMenu({
  open,
  anchorRef,
  onClose,
  mediaLibrary,
  userId,
  lessonId,
  onUploaded,
  onInsertUrl,
  onOpenFreeMedia,
  onOpenLibraryRail,
  onCloudImported,
}: InsertImageMenuProps) {
  const [url, setUrl] = useState('');
  const [hint, setHint] = useState('');
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const images = mediaLibrary.filter(
    (m) => m.kind === 'image' || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(m.url),
  );

  const runUpload = async (file: File) => {
    setBusy(true);
    setHint('');
    setProgress({ loaded: 0, total: file.size, percent: 0 });
    try {
      const result = await uploadInteractiveLessonMedia(file, {
        userId,
        lessonId,
        onProgress: setProgress,
      });
      onUploaded({
        url: result.url,
        name: result.name,
        kind: result.kind,
        localOnly: result.localOnly,
        warning: result.warning,
      });
      if (result.localOnly && result.warning) setHint(result.warning);
      onClose();
    } catch (err) {
      setHint(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const applyUrl = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setHint('Paste an image URL or cloud share link.');
      return;
    }
    const cloud = normaliseCloudLink(trimmed, sceneTypeToCloudKind('image'));
    if (cloud.shareHint && cloud.fallback) setHint(cloud.shareHint);
    onInsertUrl(cloud.streamUrl || trimmed, {
      name: cloud.badge !== 'Link' ? `${cloud.badge} image` : undefined,
      sourceUrl: cloud.sourceUrl,
      cloudProvider: cloud.provider,
    });
    setUrl('');
    onClose();
  };

  return (
    <PortalPopover
      open={open}
      anchorRef={anchorRef}
      onClose={() => {
        if (!busy) onClose();
      }}
      aria-label="Insert image"
      role="dialog"
      minWidth={300}
      maxWidth={360}
      maxHeight={520}
      placement="bottom-start"
    >
      <div className="ilv-insert-menu">
        <p className="ilv-insert-menu-title">
          <ImageIcon className="h-4 w-4" />
          Insert image
        </p>

        <button
          type="button"
          className="ilv-insert-menu-row is-primary"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          <span>
            <strong>Upload from computer</strong>
            <em>Images, video, audio, PPTX — or drag onto the canvas</em>
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={ILV_FILE_ACCEPT}
          className="sr-only"
          aria-hidden
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void runUpload(file);
            e.target.value = '';
          }}
        />

        {progress && (
          <div className="ilv-upload-progress" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100}>
            <div className="ilv-upload-progress-bar" style={{ width: `${progress.percent}%` }} />
            <span>{progress.percent}%</span>
          </div>
        )}

        {onCloudImported && (
          <div className="ilv-insert-menu-block">
            <IlvCloudFilesPanel
              lessonId={lessonId}
              compact
              acceptKinds={['image', 'video', 'audio', 'powerpoint', 'upload']}
              targetHint="Device, Dropbox, Drive, Box, OneDrive, Teams, Classroom"
              onImported={(media) => {
                onCloudImported(media);
                onClose();
              }}
            />
          </div>
        )}

        <div className="ilv-insert-menu-block">
          <label className="ilv-label">URL or cloud link</label>
          <div className="flex gap-1.5">
            <input
              className="ilv-input min-h-[34px] flex-1 py-1 text-xs"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Drive, Dropbox, OneDrive, https://…"
              disabled={busy}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyUrl(url);
              }}
            />
            <button
              type="button"
              className="ilv-btn ilv-btn-primary text-xs"
              onClick={() => applyUrl(url)}
              aria-label="Insert from URL"
              disabled={busy}
            >
              <Link2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <button
          type="button"
          className="ilv-insert-menu-row"
          disabled={busy}
          onClick={() => {
            onOpenLibraryRail();
            onClose();
          }}
        >
          <Library className="h-4 w-4" />
          <span>
            <strong>Media library</strong>
            <em>
              {images.length} image{images.length === 1 ? '' : 's'}
            </em>
          </span>
        </button>

        <button
          type="button"
          className="ilv-insert-menu-row"
          disabled={busy}
          onClick={() => {
            onOpenFreeMedia();
            onClose();
          }}
        >
          <Sparkles className="h-4 w-4" />
          <span>
            <strong>Free media</strong>
            <em>CC0 / public domain</em>
          </span>
        </button>

        {images.length > 0 && (
          <div className="ilv-insert-menu-grid">
            {images.slice(0, 8).map((m) => (
              <button
                key={m.id}
                type="button"
                className="ilv-insert-thumb"
                title={m.name}
                disabled={busy}
                onClick={() => {
                  onInsertUrl(m.url, {
                    name: m.name,
                    cloudProvider: m.cloudProvider,
                    sourceUrl: m.sourceUrl,
                  });
                  onClose();
                }}
              >
                <img src={m.thumbUrl || m.url} alt="" />
              </button>
            ))}
          </div>
        )}

        {hint && <p className="mt-1 text-[13px] leading-snug text-[var(--ss-muted)]">{hint}</p>}
      </div>
    </PortalPopover>
  );
}
