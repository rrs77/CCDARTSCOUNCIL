import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePlanner } from "@/store";
import { Button, CloseX, ModalShell, Pill } from "../ui";

export function PreviewLessonModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { activeLesson, getSubject, lessonDuration } = usePlanner();
  const [index, setIndex] = useState(0);

  if (!activeLesson) return null;
  const blocks = activeLesson.blocks;
  const block = blocks[index];
  const subject = block?.subjectId ? getSubject(block.subjectId) : undefined;

  return (
    <ModalShell open={open} onClose={onClose} className="max-w-xl">
      <div className="flex items-center justify-between border-b border-indigo-50 px-5 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
            Lesson preview
          </p>
          <h2 className="text-lg font-extrabold text-slate-900">{activeLesson.title}</h2>
          <p className="text-xs text-slate-400">
            {lessonDuration(activeLesson)} min · swipe through activities
          </p>
        </div>
        <CloseX onClick={onClose} />
      </div>

      <div className="relative px-5 py-6">
        <div className="mb-4 flex items-center justify-center gap-1.5">
          {blocks.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-indigo-600" : "w-2 bg-indigo-200"
              }`}
            />
          ))}
        </div>

        <div className="relative min-h-[220px] overflow-hidden">
          <AnimatePresence mode="wait">
            {block ? (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
                className="rounded-3xl border border-indigo-50 bg-gradient-to-br from-white to-indigo-50/50 p-5 shadow-sm"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60 && index < blocks.length - 1) setIndex(index + 1);
                  if (info.offset.x > 60 && index > 0) setIndex(index - 1);
                }}
              >
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {subject ? <Pill color={subject.color}>{subject.name}</Pill> : null}
                  {block.durationMin ? (
                    <Pill className="bg-slate-100 text-slate-600">{block.durationMin} min</Pill>
                  ) : (
                    <Pill className="bg-violet-50 text-violet-700">Section</Pill>
                  )}
                </div>
                <p className="text-xs font-bold text-indigo-500">
                  Step {index + 1} of {blocks.length}
                </p>
                <h3 className="mt-1 text-xl font-extrabold text-slate-900">{block.title}</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                  {block.body}
                </p>
              </motion.div>
            ) : (
              <p className="py-16 text-center text-sm text-slate-400">
                Add activities to preview this lesson.
              </p>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={index >= blocks.length - 1}
            onClick={() => setIndex((i) => i + 1)}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
