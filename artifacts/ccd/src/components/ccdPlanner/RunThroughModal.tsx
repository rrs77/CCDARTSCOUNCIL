import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useId, useState } from 'react';
import type { LessonSection } from '../../types/lessonSections';
import { chipStyle } from '../../utils/planner/contrastText';
import { ModalBody, ModalFooter, ModalHeader, ModalShell } from './ModalShell';

/**
 * Run-through — swipe/pager through activity (+ section) cards.
 * Product naming: "Run-through" (not Preview — Preview is the A4 view).
 */
export function RunThroughModal({
  open,
  onClose,
  title,
  sections,
  durationMins,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sections: LessonSection[];
  durationMins?: number;
}) {
  const titleId = useId();
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const [liveMessage, setLiveMessage] = useState('');

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const block = sections[index];

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(sections.length - 1, next));
    setIndex(clamped);
    const s = sections[clamped];
    setLiveMessage(
      s
        ? `Step ${clamped + 1} of ${sections.length}: ${s.title}`
        : '',
    );
  };

  return (
    <ModalShell open={open} onClose={onClose} labelledBy={titleId}>
      <ModalHeader
        title={title || 'Lesson'}
        subtitle={`${durationMins ?? 0} min · Run-through`}
        onClose={onClose}
        titleId={titleId}
      />
      <ModalBody>
        {sections.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-400">
            Add activities to run through this lesson.
          </p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-center gap-1.5" role="tablist" aria-label="Steps">
              {sections.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  onClick={() => go(i)}
                  className={`h-3 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                    i === index ? 'w-6 bg-indigo-600' : 'w-3 bg-indigo-200'
                  }`}
                />
              ))}
            </div>
            <div className="relative min-h-[220px] overflow-hidden">
              <AnimatePresence mode="wait">
                {block ? (
                  <motion.div
                    key={block.id}
                    initial={reduceMotion ? false : { opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, x: -40 }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 320, damping: 30 }
                    }
                    className="rounded-3xl border border-indigo-50 bg-gradient-to-br from-white to-indigo-50/50 p-5 shadow-sm"
                    drag={reduceMotion ? false : 'x'}
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -60) go(index + 1);
                      if (info.offset.x > 60) go(index - 1);
                    }}
                  >
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {block.kind === 'activity' ? (
                        <span
                          className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                          style={chipStyle('#4338E8')}
                        >
                          Activity
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                          Section
                        </span>
                      )}
                      {block.durationMins ? (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                          {block.durationMins} min
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs font-bold text-indigo-500">
                      Step {index + 1} of {sections.length}
                    </p>
                    <h3 className="mt-1 text-xl font-extrabold text-slate-900">{block.title}</h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                      {block.bodyHtml || block.activity?.description || '—'}
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </>
        )}
        <div className="sr-only" aria-live="polite">
          {liveMessage}
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          disabled={index === 0 || sections.length === 0}
          onClick={() => go(index - 1)}
          className="inline-flex h-11 items-center gap-1 rounded-full border-2 border-indigo-200 px-4 text-sm font-semibold text-indigo-700 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <button
          type="button"
          disabled={index >= sections.length - 1 || sections.length === 0}
          onClick={() => go(index + 1)}
          className="inline-flex h-11 items-center gap-1 rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </ModalFooter>
    </ModalShell>
  );
}
