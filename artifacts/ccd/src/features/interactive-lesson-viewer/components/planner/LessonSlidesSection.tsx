/**
 * Slides section for the planner lesson side panel (PlannerSheet).
 * Lists linked viewers, remembered pick, Present full screen, attach picker.
 */
import React, { useCallback, useEffect, useId, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Clapperboard,
  MoreHorizontal,
  Play,
  Plus,
  Unlink,
} from 'lucide-react';
import { SlidesLibraryPicker } from '../SlidesLibraryPicker';
import { InteractiveLessonPlayer } from '../player/InteractiveLessonPlayer';
import {
  attachLessonViewer,
  detachLessonViewerLink,
  listLessonViewerLinks,
  pickLessonViewer,
  type LessonRef,
  type LessonViewerLinkDto,
} from '../../data/slidesLinksApi';
import { getInteractiveLesson, getPublishedInteractiveLessonForPlayer } from '../../data/store';
import type { InteractiveLesson } from '../../types';
import {
  buildPlannerReturnPath,
  buildPlayerPath,
  buildPlayerUrl,
} from '../../utils/playerLinks';

const btn =
  'inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl border border-[#E2E0EF] bg-white px-3.5 text-[13px] font-medium text-[#1F1B4D] hover:border-[#bcb7f4] hover:bg-[#F4F3FA] disabled:opacity-50';
const btnPrimary =
  'inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-[#4338E8] px-4 text-[13px] font-semibold text-white hover:bg-[#3529d1] disabled:opacity-50';

export interface LessonSlidesSectionProps {
  year: string;
  sheet: string;
  lessonNumber: string;
  /** Legacy single id from LessonData — used until migration lands. */
  legacyInteractiveLessonId?: string | null;
  /** Persist default onto LessonData.interactiveLessonId (read-only mirror). */
  onMirrorDefault?: (viewerId: string | null) => void;
  /** Planner return context for Present. */
  returnContext?: {
    view?: string;
    date?: string;
    lessonPlanId?: string;
    tab?: string;
  };
  /** Compact for side rails. */
  compact?: boolean;
}

export function LessonSlidesSection({
  year,
  sheet,
  lessonNumber,
  legacyInteractiveLessonId,
  onMirrorDefault,
  returnContext,
  compact = false,
}: LessonSlidesSectionProps) {
  const ref: LessonRef = { year, sheet, lesson: lessonNumber };
  const chooseId = useId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<LessonViewerLinkDto[]>([]);
  const [defaultId, setDefaultId] = useState<string | null>(null);
  const [lastScene, setLastScene] = useState<number | null>(null);
  const [offline, setOffline] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [chooseOpen, setChooseOpen] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [playing, setPlaying] = useState<InteractiveLesson | null>(null);
  const [startScene, setStartScene] = useState(0);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listLessonViewerLinks(ref);
      let next = result.links;
      // Seed from legacy single id if empty
      if (!next.length && legacyInteractiveLessonId) {
        const seeded = await attachLessonViewer(ref, legacyInteractiveLessonId, {
          title: 'Linked slides',
          isOriginal: true,
          available: true,
          status: 'published',
        });
        if (seeded.ok) {
          const again = await listLessonViewerLinks(ref);
          next = again.links;
          setDefaultId(again.defaultViewerId);
          setLastScene(again.lastScene ?? null);
          setOffline(Boolean(again.offline));
        }
      } else {
        setDefaultId(result.defaultViewerId);
        setLastScene(result.lastScene ?? null);
        setOffline(Boolean(result.offline));
      }
      setLinks(next);
      if (result.defaultViewerId) onMirrorDefault?.(result.defaultViewerId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load slides');
    } finally {
      setLoading(false);
    }
  }, [year, sheet, lessonNumber, legacyInteractiveLessonId, onMirrorDefault]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const defaultLink = links.find((l) => l.viewerId === defaultId) || links.find((l) => l.available) || null;
  const others = links.filter((l) => l.viewerId !== defaultLink?.viewerId);

  const present = async (viewerId: string) => {
    setBusy(true);
    try {
      await pickLessonViewer(ref, viewerId, lastScene);
      onMirrorDefault?.(viewerId);
      const { lesson, reason } = await getPublishedInteractiveLessonForPlayer(viewerId);
      if (!lesson) {
        setError(
          reason === 'unpublished'
            ? 'Unavailable (unpublished)'
            : "You don't have access to this slideshow",
        );
        return;
      }
      const scene = lastScene && lastScene > 0 ? lastScene : 1;
      setStartScene(Math.max(0, scene - 1));
      setPlaying(lesson);
      // Also push history so Back / Esc return works with URL
      const returnTo = buildPlannerReturnPath({
        view: returnContext?.view,
        date: returnContext?.date,
        lessonPlanId: returnContext?.lessonPlanId,
        tab: returnContext?.tab,
      });
      const path = buildPlayerPath(viewerId, { scene, returnTo });
      try {
        window.history.replaceState({}, '', path);
      } catch {
        /* ignore */
      }
      try {
        await document.documentElement.requestFullscreen?.();
      } catch {
        /* iOS / denied — portal still fills viewport */
      }
    } finally {
      setBusy(false);
    }
  };

  const onAttach = async (viewerId: string) => {
    setBusy(true);
    const meta = await getInteractiveLesson(viewerId);
    const result = await attachLessonViewer(ref, viewerId, {
      title: meta?.title,
      isOriginal: Boolean(meta?.isDemo) || meta?.source === 'hub' || meta?.source === 'demo',
      available: meta?.status === 'published' || meta?.ownerId != null,
      status: meta?.status,
      source: meta?.source,
      slideCount: meta?.scenes?.length,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPickerOpen(false);
    await refresh();
  };

  const onDetach = async (linkId: string) => {
    setBusy(true);
    await detachLessonViewerLink(ref, linkId);
    setMenuId(null);
    setBusy(false);
    await refresh();
  };

  const onMakeDefault = async (viewerId: string) => {
    await pickLessonViewer(ref, viewerId);
    setDefaultId(viewerId);
    onMirrorDefault?.(viewerId);
    setChooseOpen(false);
    setMenuId(null);
  };

  if (!lessonNumber) {
    return (
      <section className="mt-4 border-t border-[#E2E0EF] pt-4">
        <h3 className="mb-2 text-[13px] font-bold uppercase tracking-[0.06em] text-[#77738F]">Slides</h3>
        <p className="text-[13px] text-[#77738F]">One-off planner entries have no linked lesson slides.</p>
      </section>
    );
  }

  return (
    <section className={`mt-4 border-t border-[#E2E0EF] pt-4 ${compact ? '' : ''}`} aria-label="Slides">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#77738F]">Slides</h3>
        <button type="button" className={btn} style={{ minHeight: 40 }} onClick={() => setPickerOpen(true)} disabled={busy}>
          <Plus className="h-4 w-4" />
          Attach
        </button>
      </div>

      {offline && (
        <p className="mb-2 rounded-lg bg-[#FFF1C2] px-2.5 py-1.5 text-[13px] text-[#1F1B4D]">
          Links saved on this device
        </p>
      )}

      {loading && (
        <div className="flex gap-3" aria-busy="true">
          <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-[#E2E0EF]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-[#E2E0EF]" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[#E2E0EF]" />
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-[#E2E0EF] bg-[#F4F3FA] px-3 py-2 text-[13px]">
          <p className="text-[#1F1B4D]">{error}</p>
          <button type="button" className={`${btn} mt-2`} onClick={() => void refresh()}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && links.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#E2E0EF] bg-[#F4F3FA] px-3 py-4 text-center">
          <Clapperboard className="mx-auto h-6 w-6 text-[#77738F]" />
          <p className="mt-2 text-[13px] text-[#1F1B4D]">No slides linked to this lesson.</p>
          <button type="button" className={`${btnPrimary} mt-3`} onClick={() => setPickerOpen(true)}>
            Attach slides
          </button>
        </div>
      )}

      {!loading && defaultLink && (
        <div className="rounded-xl border border-[#E2E0EF] bg-white p-3">
          <div className="flex gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#E9E6FF]">
              {defaultLink.thumb ? (
                <img src={defaultLink.thumb} alt={defaultLink.title} className="h-full w-full object-cover" />
              ) : (
                <Clapperboard className="h-6 w-6 text-[#4338E8]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate text-[13px] font-bold text-[#1F1B4D]">{defaultLink.title}</p>
                {defaultLink.isOriginal && (
                  <span className="rounded-md bg-[#FFC93C]/35 px-1.5 py-0.5 text-[13px] font-semibold text-[#1F1B4D]">
                    Original
                  </span>
                )}
                <span className="rounded-md bg-[#E9E6FF] px-1.5 py-0.5 text-[13px] font-semibold text-[#4338E8]">
                  ★ Default
                </span>
              </div>
              <p className="mt-0.5 text-[13px] text-[#77738F]">
                {defaultLink.orgName || (defaultLink.source === 'hub' ? 'Hub' : defaultLink.source === 'demo' ? 'CCDesigner' : 'Slides')}
                {defaultLink.slideCount ? ` · ${defaultLink.slideCount} slides` : ''}
                {defaultLink.status === 'published' ? ' · Published' : ` · ${defaultLink.status}`}
              </p>
              {!defaultLink.available && (
                <p className="mt-1 flex items-center gap-1 text-[13px] font-medium text-[#B45309]" id={`${chooseId}-reason`}>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {defaultLink.reason === 'unpublished'
                    ? 'Unavailable (unpublished)'
                    : defaultLink.reason === 'archived'
                      ? 'Removed by organisation'
                      : "You don't have access to this slideshow"}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={btnPrimary}
              disabled={busy || !defaultLink.available}
              aria-describedby={!defaultLink.available ? `${chooseId}-reason` : undefined}
              onClick={() => void present(defaultLink.viewerId)}
            >
              <Play className="h-4 w-4 fill-white" />
              Present full screen
              {lastScene && lastScene > 1 ? ` · resume ${lastScene}` : ''}
            </button>
            {links.length > 1 && (
              <div className="relative">
                <button
                  type="button"
                  className={btn}
                  aria-expanded={chooseOpen}
                  aria-controls={`${chooseId}-list`}
                  onClick={() => setChooseOpen((o) => !o)}
                >
                  Choose <ChevronDown className="h-4 w-4" />
                </button>
                {chooseOpen && (
                  <ul
                    id={`${chooseId}-list`}
                    role="radiogroup"
                    aria-label="Choose slideshow"
                    className="absolute right-0 z-20 mt-1 min-w-[220px] rounded-xl border border-[#E2E0EF] bg-white p-1 shadow-lg"
                  >
                    {links.map((l) => (
                      <li key={l.id}>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={l.viewerId === defaultId}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-[#F4F3FA]"
                          onClick={() => void onMakeDefault(l.viewerId)}
                        >
                          <span className="grid h-4 w-4 place-items-center rounded-full border border-[#4338E8]">
                            {l.viewerId === defaultId ? <Check className="h-3 w-3 text-[#4338E8]" /> : null}
                          </span>
                          <span className="min-w-0 flex-1 truncate font-medium">{l.title}</span>
                          {!l.available && <AlertTriangle className="h-3.5 w-3.5 text-[#B45309]" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && others.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-[13px] font-semibold text-[#77738F]">Also linked</p>
          <ul role="list" className="space-y-1">
            {others.map((l) => (
              <li
                key={l.id}
                className={`flex items-center gap-2 rounded-xl border border-[#E2E0EF] px-2.5 py-2 ${
                  l.available ? 'bg-white' : 'bg-[#F4F3FA] opacity-80'
                }`}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left text-[13px] font-medium text-[#1F1B4D]"
                  onClick={() => void onMakeDefault(l.viewerId)}
                >
                  <span className="block truncate">{l.title}</span>
                  <span className="text-[13px] font-normal text-[#77738F]">
                    {l.isOriginal ? 'Original' : l.orgName ? `Org copy · ${l.orgName}` : l.origin === 'scheme' ? 'From scheme' : 'Mine'}
                    {!l.available ? ' · Unavailable' : ''}
                  </span>
                </button>
                <div className="relative">
                  <button
                    type="button"
                    className="grid h-11 w-11 place-items-center rounded-lg hover:bg-[#F4F3FA]"
                    aria-label={`Options for ${l.title}`}
                    onClick={() => setMenuId((id) => (id === l.id ? null : l.id))}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {menuId === l.id && (
                    <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-[#E2E0EF] bg-white p-1 shadow-lg">
                      {l.available && (
                        <button
                          type="button"
                          className="block w-full rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-[#F4F3FA]"
                          onClick={() => void present(l.viewerId)}
                        >
                          Present
                        </button>
                      )}
                      <button
                        type="button"
                        className="block w-full rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-[#F4F3FA]"
                        onClick={() => void onMakeDefault(l.viewerId)}
                      >
                        Make default
                      </button>
                      <button
                        type="button"
                        className="block w-full rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-[#F4F3FA]"
                        onClick={async () => {
                          await navigator.clipboard.writeText(buildPlayerUrl(l.viewerId));
                          setMenuId(null);
                        }}
                      >
                        Copy player link
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-1 rounded-lg px-2.5 py-2 text-left text-[13px] text-[#B91C1C] hover:bg-[#FEF2F2]"
                        onClick={() => void onDetach(l.id)}
                      >
                        <Unlink className="h-3.5 w-3.5" /> Detach
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/*
        Spec prefers ModalShell for the picker. SlidesLibraryPicker already
        portals a 760-class dialog with focus/Esc; nesting ModalShell double-
        traps focus. Keep the existing picker shell; cloud Import tab stays
        disabled until lesson-attachments merges.
      */}
      <SlidesLibraryPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        attachMode
        title="Attach slides"
        onAttach={(id) => void onAttach(id)}
      />

      {playing && (
        <InteractiveLessonPlayer
          lesson={playing}
          playerOnly
          startSceneIndex={startScene}
          returnLabel="Back to planner"
          onClose={() => {
            setPlaying(null);
            if (document.fullscreenElement) {
              void document.exitFullscreen?.();
            }
            const returnTo = buildPlannerReturnPath({
              view: returnContext?.view,
              date: returnContext?.date,
              lessonPlanId: returnContext?.lessonPlanId,
              tab: returnContext?.tab,
            });
            try {
              window.history.replaceState({}, '', returnTo);
            } catch {
              /* ignore */
            }
            void pickLessonViewer(ref, playing.id, startScene + 1);
          }}
        />
      )}
    </section>
  );
}
