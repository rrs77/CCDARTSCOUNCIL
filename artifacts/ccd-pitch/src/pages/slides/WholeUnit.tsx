import { motion, MotionConfig } from "framer-motion";

/** Whole unit / scheme of work on the half-term planner. */
export default function WholeUnit() {
  const weeks = ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6"];

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative w-screen h-screen overflow-hidden bg-bg">
        <div className="relative z-10 h-full w-full flex flex-col pitch-slide-pad">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-[2.6vh] max-w-[58vw]"
          >
            <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[1.6vh]">
              Create a unit
            </span>
            <h2
              className="pitch-h2 font-display font-black text-text tracking-tight leading-[1.02]"
              style={{ textWrap: "balance" }}
            >
              Lessons become a whole unit.
            </h2>
            <p
              className="pitch-body-lg mt-[1.6vh] text-muted font-body leading-snug max-w-[46vw]"
              style={{ textWrap: "pretty" }}
            >
              Stack lessons into a named scheme, assign to a half-term, and see the arc across the
              planner — not just one isolated session.
            </p>
          </motion.div>

          <motion.div
            className="flex-1 min-h-0 rounded-[1.35rem] border border-text/10 bg-white p-[2.4vh_1.8vw] shadow-[0_14px_40px_rgba(0,45,36,0.07)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
          >
            <div className="flex items-center justify-between mb-[2vh]">
              <div>
                <p className="font-display font-semibold text-primary-dark uppercase tracking-[0.14em]" style={{ fontSize: "0.75vw" }}>
                  Half-term planner
                </p>
                <h3 className="font-display font-bold text-text mt-[0.4vh]" style={{ fontSize: "1.8vw" }}>
                  Year 6 Music — How to Build an Orchestra
                </h3>
              </div>
              <span className="px-[1vw] py-[0.6vh] rounded-full bg-primary/10 text-primary-dark font-display font-semibold" style={{ fontSize: "0.85vw" }}>
                6 lessons · ~1 hour each
              </span>
            </div>

            <div className="grid grid-cols-6 gap-[0.9vw] h-[58%]">
              {weeks.map((w, i) => (
                <div
                  key={w}
                  className="rounded-[1rem] border border-text/10 bg-bg/80 p-[1.4vh_0.8vw] flex flex-col"
                >
                  <span className="text-muted font-display font-semibold" style={{ fontSize: "0.75vw" }}>
                    {w}
                  </span>
                  <div
                    className="mt-[1vh] flex-1 rounded-lg bg-primary-dark/90 text-white p-[1vh_0.6vw]"
                    style={{ opacity: 0.55 + i * 0.08 }}
                  >
                    <p className="font-display font-semibold leading-tight" style={{ fontSize: "0.95vw" }}>
                      Lesson {i + 1}
                    </p>
                    <p className="mt-[0.6vh] text-white/70" style={{ fontSize: "0.72vw" }}>
                      45–60 min
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </MotionConfig>
  );
}
