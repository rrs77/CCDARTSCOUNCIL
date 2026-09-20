import { motion, MotionConfig } from "framer-motion";

/** Lesson craft — starter / main / plenary, max 60 minutes. */
export default function LessonHour() {
  const parts = [
    { name: "Starter", mins: "8–10", hint: "Warm-up · focus" },
    { name: "Main", mins: "30–35", hint: "Core craft" },
    { name: "Plenary", mins: "8–10", hint: "Reflect · next step" },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative w-screen h-screen overflow-hidden bg-bg">
        <div className="relative z-10 h-full w-full flex flex-col pitch-slide-pad">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-[2.4vh] max-w-[60vw]"
          >
            <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[1.6vh]">
              Build a lesson
            </span>
            <h2
              className="pitch-h2 font-display font-black text-text tracking-tight leading-[1.02]"
              style={{ textWrap: "balance" }}
            >
              Starter. Main. Plenary. One hour.
            </h2>
            <p
              className="pitch-body-lg mt-[1.6vh] text-muted font-body leading-snug max-w-[46vw]"
              style={{ textWrap: "pretty" }}
            >
              Drag activities into the builder — warm-ups, mains and plenaries — with a clear one-hour
              ceiling so every lesson is teachable in a real timetable slot.
            </p>
          </motion.div>

          <div className="flex items-end gap-[1.2vw] flex-1 min-h-0 pb-[1vh]">
            {parts.map((p, i) => (
              <motion.div
                key={p.name}
                className="flex-1 rounded-[1.25rem] border border-text/10 bg-white p-[2.4vh_1.4vw] shadow-[0_12px_36px_rgba(0,45,36,0.08)]"
                style={{ minHeight: `${42 + i * 8}%` }}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.12 + i * 0.1 }}
              >
                <p className="font-display font-semibold text-primary-dark uppercase tracking-[0.12em]" style={{ fontSize: "0.8vw" }}>
                  {p.mins} min
                </p>
                <h3 className="mt-[1vh] font-display font-black text-text" style={{ fontSize: "2.4vw" }}>
                  {p.name}
                </h3>
                <p className="mt-[1vh] text-muted font-body" style={{ fontSize: "1.1vw" }}>
                  {p.hint}
                </p>
              </motion.div>
            ))}
            <motion.div
              className="w-[18vw] rounded-[1.25rem] bg-primary-dark text-white p-[2.4vh_1.4vw] flex flex-col justify-center"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.4 }}
            >
              <p className="text-accent font-display font-semibold uppercase tracking-[0.14em]" style={{ fontSize: "0.75vw" }}>
                Cap
              </p>
              <p className="mt-[1vh] font-display font-black leading-none" style={{ fontSize: "4vw" }}>
                60
              </p>
              <p className="mt-[1vh] text-white/70 font-body" style={{ fontSize: "1.05vw" }}>
                minutes maximum per lesson
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
