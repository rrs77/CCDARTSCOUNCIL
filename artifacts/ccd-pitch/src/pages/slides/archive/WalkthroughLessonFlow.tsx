import { motion, MotionConfig } from "framer-motion";

/**
 * Activity Library → Lesson Builder → Lesson Library → term.
 */
export default function WalkthroughLessonFlow() {
  const stages = [
    { title: "Activity Library", detail: "Partner & school activities in one place" },
    { title: "Lesson Builder", detail: "Sequence warm-ups, mains, plenaries" },
    { title: "Lesson Library", detail: "Save, name, and reuse the lesson" },
    { title: "Half-term / term", detail: "Place it on your planner overview" },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative w-screen h-screen overflow-hidden bg-bg">
        <div className="relative z-10 h-full w-full flex flex-col pitch-slide-pad">
          <motion.div
            className="max-w-[55vw] mb-[3.5vh]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[1.8vh]">
              Planning flow
            </span>
            <h2
              className="pitch-h2 font-display font-black text-text tracking-tight leading-[1.02]"
              style={{ textWrap: "balance" }}
            >
              From activity to lesson to term.
            </h2>
            <p
              className="pitch-body-lg mt-[1.8vh] text-muted font-body leading-snug max-w-[44vw]"
              style={{ textWrap: "pretty" }}
            >
              Partner activities become a named lesson, then sit on your half-term designer — one
              continuous path from sector content to the classroom.
            </p>
          </motion.div>

          <div className="flex items-stretch gap-[1vw] flex-1 min-h-0">
            {stages.map((stage, i) => (
              <div key={stage.title} className="flex-1 flex items-center gap-[1vw]">
                <motion.div
                  className="flex-1 h-full min-h-[28vh] rounded-[1.2rem] border border-text/10 bg-white p-[2.2vh_1.1vw] flex flex-col shadow-[0_10px_32px_rgba(0,45,36,0.07)]"
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div
                    className="w-[2.2vw] h-[2.2vw] rounded-full bg-primary-dark text-accent font-display font-black flex items-center justify-center mb-[2vh]"
                    style={{ fontSize: "0.95vw" }}
                  >
                    {i + 1}
                  </div>
                  <h3
                    className="font-display font-bold text-text leading-tight"
                    style={{ fontSize: "1.35vw" }}
                  >
                    {stage.title}
                  </h3>
                  <p
                    className="font-body text-muted mt-[1vh] leading-snug"
                    style={{ fontSize: "0.95vw" }}
                  >
                    {stage.detail}
                  </p>
                </motion.div>
                {i < stages.length - 1 && (
                  <div
                    className="shrink-0 text-accent font-display font-black"
                    style={{ fontSize: "1.8vw" }}
                    aria-hidden
                  >
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
