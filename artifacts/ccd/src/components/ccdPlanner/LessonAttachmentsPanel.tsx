import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Loader2,
  Music,
  Paperclip,
  Trash2,
  Video,
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { sanitizeUrl } from '../../utils/sanitize';
import {
  LESSON_ATTACHMENT_ACCEPT,
  type LessonAttachment,
  type ProviderConfig,
  buildLessonKey,
  deleteLessonAttachment,
  fetchProviderConfig,
  importCloudAttachment,
  listLessonAttachments,
  uploadLessonAttachment,
} from '../../utils/planner/lessonAttachmentsApi';
import {
  type ClassroomCourse,
  type ClassroomMaterialItem,
  listGoogleClassroomCourses,
  listGoogleClassroomMaterials,
  pickFromBox,
  pickFromDropbox,
  pickFromGoogleDrive,
  pickFromOneDrive,
  pickFromTeams,
} from '../../utils/planner/cloudPickers';

interface LessonAttachmentsPanelProps {
  sheet: string;
  lessonNumber: string;
}

/** https-only for external / linked URLs (blocks javascript:, http:, etc.). */
function sanitizeHttpsUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const cleaned = sanitizeUrl(url.trim());
  if (!cleaned || cleaned === '#') return null;
  try {
    const absolute = cleaned.startsWith('https://')
      ? cleaned
      : cleaned.startsWith('//')
        ? `https:${cleaned}`
        : null;
    if (!absolute) return null;
    const u = new URL(absolute);
    if (u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    return null;
  }
}

function isProxyAttachmentUrl(url: string): boolean {
  return url.includes('/api/lesson-attachments/');
}

function KindIcon({ kind }: { kind: LessonAttachment['kind'] }) {
  if (kind === 'image') return <ImageIcon className="h-4 w-4" aria-hidden />;
  if (kind === 'video') return <Video className="h-4 w-4" aria-hidden />;
  if (kind === 'audio') return <Music className="h-4 w-4" aria-hidden />;
  return <FileText className="h-4 w-4" aria-hidden />;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Resolve media src: linked https URLs via sanitizeHttpsUrl; proxy URLs via
 * Bearer fetch + blob URL (never ?access_token= in the URL).
 */
function useAttachmentSrc(url: string | null, token: string | null): string | null {
  const [blobSrc, setBlobSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    setBlobSrc(null);
    if (!url) return;

    if (!isProxyAttachmentUrl(url)) {
      setBlobSrc(sanitizeHttpsUrl(url));
      return;
    }

    if (!token) return;

    void (async () => {
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'same-origin',
        });
        if (!res.ok) return;
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobSrc(objectUrl);
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, token]);

  return blobSrc;
}

function AttachmentRow({
  item,
  token,
  busy,
  onPreview,
  onDelete,
}: {
  item: LessonAttachment;
  token: string | null;
  busy: boolean;
  onPreview: (item: LessonAttachment) => void;
  onDelete: (id: string) => void;
}) {
  const src = useAttachmentSrc(item.url, token);
  const openHref =
    item.status === 'linked' || item.storageKind === 'link'
      ? sanitizeHttpsUrl(item.url)
      : src;

  return (
    <li className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-2">
      <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white text-slate-400">
        {item.kind === 'image' && src ? (
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <KindIcon kind={item.kind} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">{item.fileName}</p>
        <p className="text-[12px] text-slate-500">
          {item.kind}
          {item.provider ? ` · ${item.provider}` : ''}
          {item.status === 'linked' ? ' · linked' : ''} · {formatBytes(item.byteSize)}
        </p>
        {item.kind === 'audio' && src ? (
          <audio controls className="mt-1 w-full max-w-md" src={src} preload="metadata" />
        ) : null}
        <div className="mt-1 flex flex-wrap gap-2">
          {(item.kind === 'video' || item.kind === 'image') && src ? (
            <button
              type="button"
              className="text-[13px] font-semibold text-indigo-700 hover:underline"
              onClick={() => onPreview(item)}
            >
              {item.kind === 'video' ? 'Play' : 'Preview'}
            </button>
          ) : null}
          {openHref ? (
            <a
              href={openHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-semibold text-indigo-700 hover:underline"
            >
              {item.status === 'linked' ? 'Open link' : 'Download'}
            </a>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        disabled={busy}
        aria-label={`Delete ${item.fileName}`}
        onClick={() => onDelete(item.id)}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

function PreviewModal({
  preview,
  token,
  onClose,
}: {
  preview: LessonAttachment;
  token: string | null;
  onClose: () => void;
}) {
  const src = useAttachmentSrc(preview.url, token);
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={preview.fileName}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] max-w-3xl overflow-auto rounded-2xl bg-white p-3 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-slate-800">{preview.fileName}</p>
          <button
            type="button"
            className="rounded-full px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        {preview.kind === 'image' && src ? (
          <img src={src} alt={preview.fileName} className="max-h-[70vh] w-auto max-w-full" />
        ) : null}
        {preview.kind === 'video' && src ? (
          <video src={src} controls className="max-h-[70vh] w-full" />
        ) : null}
      </div>
    </div>
  );
}

export function LessonAttachmentsPanel({ sheet, lessonNumber }: LessonAttachmentsPanelProps) {
  const lessonKey = buildLessonKey(sheet, lessonNumber);
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<LessonAttachment[]>([]);
  const [providers, setProviders] = useState<ProviderConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [preview, setPreview] = useState<LessonAttachment | null>(null);
  const [classroomOpen, setClassroomOpen] = useState(false);
  const [classroomToken, setClassroomToken] = useState<string | null>(null);
  const [classroomCourses, setClassroomCourses] = useState<ClassroomCourse[]>([]);
  const [classroomMaterials, setClassroomMaterials] = useState<ClassroomMaterialItem[]>([]);
  const [classroomCourseId, setClassroomCourseId] = useState('');
  const [classroomBusy, setClassroomBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token || null);
    });
    void fetchProviderConfig().then(setProviders);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listLessonAttachments(lessonKey));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load attachments');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [lessonKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onPick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    setProgress(0);
    try {
      for (const file of Array.from(files)) {
        await uploadLessonAttachment(lessonKey, file, setProgress);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onCloud = async (
    provider: 'dropbox' | 'googleDrive' | 'box' | 'oneDrive' | 'teams' | 'googleClassroom',
  ) => {
    if (!providers) return;
    if (provider === 'googleClassroom') {
      if (!providers.keys.googleClientId) return;
      setBusy(true);
      setError(null);
      try {
        const { token, courses } = await listGoogleClassroomCourses(providers.keys.googleClientId);
        setClassroomToken(token);
        setClassroomCourses(courses);
        setClassroomMaterials([]);
        setClassroomCourseId(courses[0]?.id || '');
        setClassroomOpen(true);
        if (courses[0]?.id) {
          setClassroomBusy(true);
          try {
            setClassroomMaterials(await listGoogleClassroomMaterials(courses[0].id, token));
          } finally {
            setClassroomBusy(false);
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Classroom sign-in failed');
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    setError(null);
    try {
      let picked = null as Awaited<ReturnType<typeof pickFromDropbox>>;
      if (provider === 'dropbox' && providers.keys.dropboxAppKey) {
        picked = await pickFromDropbox(providers.keys.dropboxAppKey);
      } else if (
        provider === 'googleDrive' &&
        providers.keys.googleApiKey &&
        providers.keys.googleClientId
      ) {
        picked = await pickFromGoogleDrive(
          providers.keys.googleApiKey,
          providers.keys.googleClientId,
        );
      } else if (provider === 'box' && providers.keys.boxClientId) {
        picked = await pickFromBox(providers.keys.boxClientId);
      } else if (provider === 'oneDrive' && providers.keys.oneDriveClientId) {
        picked = await pickFromOneDrive(providers.keys.oneDriveClientId);
      } else if (provider === 'teams' && providers.keys.teamsClientId) {
        picked = await pickFromTeams(providers.keys.teamsClientId);
      }
      if (!picked) return;
      await importCloudAttachment(lessonKey, picked);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cloud import failed');
    } finally {
      setBusy(false);
    }
  };

  const onClassroomCourseChange = async (courseId: string) => {
    setClassroomCourseId(courseId);
    if (!classroomToken || !courseId) {
      setClassroomMaterials([]);
      return;
    }
    setClassroomBusy(true);
    setError(null);
    try {
      setClassroomMaterials(await listGoogleClassroomMaterials(courseId, classroomToken));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Classroom materials');
      setClassroomMaterials([]);
    } finally {
      setClassroomBusy(false);
    }
  };

  const onClassroomPick = async (item: ClassroomMaterialItem) => {
    setBusy(true);
    setError(null);
    try {
      await importCloudAttachment(lessonKey, item.attachment);
      setClassroomOpen(false);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Classroom import failed');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm('Delete this attachment?')) return;
    setBusy(true);
    try {
      await deleteLessonAttachment(id);
      setItems((prev) => prev.filter((a) => a.id !== id));
      if (preview?.id === id) setPreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-planner-extension="lesson-attachments"
      className="mt-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Attachments
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          Add file
        </button>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={LESSON_ATTACHMENT_ACCEPT}
          multiple
          onChange={(e) => void onPick(e.target.files)}
        />
      </div>
      <p className="mb-2 text-[13px] text-slate-500">
        Photos, video, Word and audio. Stored on DreamHost (or linked if over the size limit).
      </p>

      {providers &&
      (providers.dropbox ||
        providers.googleDrive ||
        providers.googleClassroom ||
        providers.box ||
        providers.oneDrive ||
        providers.teams) ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {providers.dropbox ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onCloud('dropbox')}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Dropbox
            </button>
          ) : null}
          {providers.googleDrive ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onCloud('googleDrive')}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Google Drive
            </button>
          ) : null}
          {providers.googleClassroom ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onCloud('googleClassroom')}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Google Classroom
            </button>
          ) : null}
          {providers.box ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onCloud('box')}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Box
            </button>
          ) : null}
          {providers.oneDrive ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onCloud('oneDrive')}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              OneDrive
            </button>
          ) : null}
          {providers.teams ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onCloud('teams')}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Teams
            </button>
          ) : null}
        </div>
      ) : null}

      {progress != null ? (
        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      ) : null}

      {error ? (
        <p className="mb-2 rounded-lg bg-rose-50 px-2 py-1.5 text-[13px] font-medium text-rose-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-[13px] text-slate-400">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-[13px] text-slate-400">No attachments yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <AttachmentRow
              key={item.id}
              item={item}
              token={token}
              busy={busy}
              onPreview={setPreview}
              onDelete={(id) => void onDelete(id)}
            />
          ))}
        </ul>
      )}

      {classroomOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Google Classroom materials"
          onClick={() => setClassroomOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-slate-800">Google Classroom</h3>
              <button
                type="button"
                className="rounded-full px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                onClick={() => setClassroomOpen(false)}
              >
                Close
              </button>
            </div>
            {classroomCourses.length === 0 ? (
              <p className="text-[13px] text-slate-500">No active courses found for this teacher.</p>
            ) : (
              <>
                <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  Course
                </label>
                <select
                  className="mb-3 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
                  value={classroomCourseId}
                  onChange={(e) => void onClassroomCourseChange(e.target.value)}
                >
                  {classroomCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {classroomBusy ? (
                  <p className="text-[13px] text-slate-400">Loading materials…</p>
                ) : classroomMaterials.length === 0 ? (
                  <p className="text-[13px] text-slate-400">
                    No Drive files, links or YouTube attachments in this course.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {classroomMaterials.map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void onClassroomPick(m)}
                          className="flex w-full items-start justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-left hover:bg-indigo-50 disabled:opacity-50"
                        >
                          <span className="text-[13px] font-semibold text-slate-800">{m.title}</span>
                          <span className="shrink-0 text-[12px] font-medium text-indigo-700">
                            {m.attachment.linkOnly ? 'Link' : 'Attach'}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      ) : null}

      {preview ? (
        <PreviewModal preview={preview} token={token} onClose={() => setPreview(null)} />
      ) : null}
    </div>
  );
}
