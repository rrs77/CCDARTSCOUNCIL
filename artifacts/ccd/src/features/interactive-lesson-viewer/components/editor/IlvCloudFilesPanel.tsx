import React, { useEffect, useRef, useState } from 'react';
import { Cloud, HardDrive, Loader2 } from 'lucide-react';
import { ILV_FILE_ACCEPT } from '../../utils/mediaUpload';
import {
  importPickedCloudToIlv,
  listIlvProviderStatuses,
  loadIlvClassroomMaterials,
  loadIlvProviderConfig,
  openIlvClassroom,
  pickIlvCloudProvider,
  uploadDeviceFileToIlv,
  type ClassroomCourse,
  type ClassroomMaterialItem,
  type IlvCloudProviderId,
  type ImportedIlvMedia,
  type ProviderConfig,
} from '../../utils/ilvCloudImport';

interface IlvCloudFilesPanelProps {
  lessonId: string;
  /** Restrict which media kinds to accept after import (empty = all). */
  acceptKinds?: Array<'image' | 'video' | 'audio' | 'powerpoint' | 'upload'>;
  targetHint?: string;
  onImported: (media: ImportedIlvMedia) => void;
  compact?: boolean;
}

/** Device + cloud providers for slides / timeline — reuses planner pickers & routes. */
export function IlvCloudFilesPanel({
  lessonId,
  acceptKinds,
  targetHint,
  onImported,
  compact,
}: IlvCloudFilesPanelProps) {
  const [cfg, setCfg] = useState<ProviderConfig | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [classroomOpen, setClassroomOpen] = useState(false);
  const [classroomToken, setClassroomToken] = useState<string | null>(null);
  const [classroomCourses, setClassroomCourses] = useState<ClassroomCourse[]>([]);
  const [classroomCourseId, setClassroomCourseId] = useState('');
  const [classroomMaterials, setClassroomMaterials] = useState<ClassroomMaterialItem[]>([]);
  const [classroomBusy, setClassroomBusy] = useState(false);

  useEffect(() => {
    void loadIlvProviderConfig().then(setCfg);
  }, []);

  const statuses = listIlvProviderStatuses(cfg);

  const finish = (media: ImportedIlvMedia) => {
    if (acceptKinds?.length && !acceptKinds.includes(media.kind)) {
      setError(
        `That file is ${media.kind}; this panel expects ${acceptKinds.join(' / ')}.`,
      );
      return;
    }
    onImported(media);
  };

  const onDevice = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    setProgress(0);
    try {
      for (const file of Array.from(files)) {
        const media = await uploadDeviceFileToIlv(lessonId, file, setProgress);
        finish(media);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
      setProgress(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onCloud = async (id: IlvCloudProviderId) => {
    if (id === 'device') {
      fileRef.current?.click();
      return;
    }
    if (!cfg) return;
    const status = statuses.find((s) => s.id === id);
    if (!status?.connected) {
      setError(`${status?.label || 'Provider'} is not connected`);
      return;
    }

    if (id === 'googleClassroom') {
      setBusy(true);
      setError(null);
      try {
        const { token, courses } = await openIlvClassroom(cfg);
        setClassroomToken(token);
        setClassroomCourses(courses);
        setClassroomCourseId(courses[0]?.id || '');
        setClassroomMaterials([]);
        setClassroomOpen(true);
        if (courses[0]?.id) {
          setClassroomBusy(true);
          try {
            setClassroomMaterials(await loadIlvClassroomMaterials(courses[0].id, token));
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
      const picked = await pickIlvCloudProvider(id, cfg);
      if (!picked) return;
      const media = await importPickedCloudToIlv(lessonId, picked);
      finish(media);
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
      setClassroomMaterials(await loadIlvClassroomMaterials(courseId, classroomToken));
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
      const media = await importPickedCloudToIlv(lessonId, item.attachment);
      setClassroomOpen(false);
      finish(media);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Classroom import failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`ilv-cloud-files ${compact ? 'is-compact' : ''}`}>
      {!compact && (
        <p className="ilv-cloud-files-title">
          <Cloud className="h-3.5 w-3.5" />
          Add files
        </p>
      )}
      {targetHint ? <p className="ilv-cloud-files-hint">{targetHint}</p> : null}

      <div className="ilv-cloud-files-grid" role="group" aria-label="File sources">
        {statuses.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`ilv-cloud-files-btn ${s.connected ? '' : 'is-disconnected'}`}
            disabled={busy || (s.id !== 'device' && !cfg)}
            title={s.connected ? s.label : `${s.label} — not connected`}
            aria-label={s.connected ? s.label : `${s.label}, not connected`}
            onClick={() => void onCloud(s.id)}
          >
            {s.id === 'device' ? <HardDrive className="h-3.5 w-3.5" /> : null}
            <span className="ilv-cloud-files-btn-label">{s.label}</span>
            {!s.connected ? <em className="ilv-cloud-files-nc">not connected</em> : null}
          </button>
        ))}
      </div>

      <input
        ref={fileRef}
        type="file"
        className="sr-only"
        accept={ILV_FILE_ACCEPT}
        multiple
        onChange={(e) => void onDevice(e.target.files)}
      />

      {busy && (
        <p className="ilv-cloud-files-status" role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {progress != null ? `Uploading… ${progress}%` : 'Working…'}
        </p>
      )}
      {error && (
        <p className="ilv-cloud-files-error" role="alert">
          {error}
        </p>
      )}

      {classroomOpen && (
        <div className="ilv-cloud-classroom" role="dialog" aria-label="Google Classroom materials">
          <div className="flex items-center justify-between gap-2">
            <strong className="text-xs">Classroom materials</strong>
            <button
              type="button"
              className="ilv-btn ilv-btn-secondary text-[11px]"
              onClick={() => setClassroomOpen(false)}
            >
              Close
            </button>
          </div>
          <label className="ilv-label">Course</label>
          <select
            className="ilv-select"
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
            <p className="text-[11px] text-[var(--ss-muted)]">Loading…</p>
          ) : classroomMaterials.length === 0 ? (
            <p className="text-[11px] text-[var(--ss-muted)]">No materials in this course.</p>
          ) : (
            <ul className="ilv-cloud-classroom-list">
              {classroomMaterials.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className="ilv-cloud-classroom-item"
                    disabled={busy}
                    onClick={() => void onClassroomPick(m)}
                  >
                    {m.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
