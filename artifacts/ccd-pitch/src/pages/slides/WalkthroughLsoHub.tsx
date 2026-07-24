import { motion, MotionConfig } from "framer-motion";

/**
 * Slide 3 — LSO hub: choose resource → Add to CCDesigner (+ Partner Planning).
 */
export default function WalkthroughLsoHub() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative w-screen h-screen overflow-hidden bg-bg">
        <div
          className="absolute top-0 right-0 rounded-full"
          style={{
            width: "48vw",
            height: "48vw",
            transform: "translate(20%, -30%)",
            background: "radial-gradient(circle at center, rgba(20,184,166,0.16), transparent 65%)",
            filter: "blur(3vw)",
          }}
        />

        <div className="relative z-10 h-full w-full grid grid-cols-12 gap-[1.64vw] pitch-slide-pad">
          <motion.div
            className="col-span-5 flex flex-col justify-center min-h-0"
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65 }}
          >
            <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[1.8vh]">
              LSO hub
            </span>
            <h2 className="pitch-h2 font-display font-black text-text tracking-tight leading-[1.02]" style={{ textWrap: "balance" }}>
              Choose a resource. Add it to CCDesigner.
            </h2>
            <p className="pitch-body-lg mt-[2vh] text-muted font-body leading-relaxed" style={{ textWrap: "pretty" }}>
              Open the London Symphony Orchestra hub, pick a classroom pack such as How to Build an Orchestra,
              then bring those activities straight into your library — or select Partner Planning for the term.
            </p>

            <div className="mt-[3vh] flex flex-col gap-[1.2vh]">
              {[
                "Browse LSO learning resources",
                "Select a pack for your year group",
                "Add to CCDesigner — activities appear in your library",
              ].map((step, i) => (
                <motion.div
                  key={step}
                  className="flex items-start gap-[0.8vw]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.25 + i * 0.1 }}
                >
                  <span className="mt-[0.2vh] w-[1.6vw] h-[1.6vw] rounded-full bg-primary-dark text-accent font-display font-bold flex items-center justify-center shrink-0" style={{ fontSize: "0.75vw" }}>
                    {i + 1}
                  </span>
                  <span className="pitch-body font-body text-text leading-snug">{step}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="col-span-7 flex items-center min-h-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <div className="w-full rounded-[1.3rem] bg-surface border border-text/8 shadow-[0_16px_48px_rgba(0,45,36,0.1)] overflow-hidden">
              <div className="flex items-center justify-between px-[1.3vw] py-[1.4vh] bg-primary-dark text-white">
                <div>
                  <div className="font-display font-bold" style={{ fontSize: "1.15vw" }}>London Symphony Orchestra</div>
                  <div className="font-body text-white/70" style={{ fontSize: "0.78vw" }}>Partner hub · Music</div>
                </div>
                <span className="px-[0.8vw] py-[0.45vh] rounded-full bg-accent text-primary-dark font-display font-semibold" style={{ fontSize: "0.72vw" }}>
                  Interactive
                </span>
              </div>

              <div className="p-[1.3vw] grid grid-cols-2 gap-[1vw]">
                <motion.div
                  className="rounded-[0.9rem] border-2 border-primary/45 bg-primary/5 p-[1.6vh_1vw]"
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                >
                  <div className="font-display font-bold text-text" style={{ fontSize: "1.05vw" }}>How to Build an Orchestra</div>
                  <p className="font-body text-muted mt-[0.6vh]" style={{ fontSize: "0.78vw" }}>Year 6 · classroom pack</p>
                  <motion.div
                    className="mt-[1.6vh] inline-flex items-center gap-[0.4vw] px-[0.9vw] py-[0.7vh] rounded-[0.5rem] bg-primary-dark text-white font-display font-semibold"
                    style={{ fontSize: "0.82vw" }}
                    animate={{
                      boxShadow: [
                        "0 0 0 0px rgba(182,255,126,0)",
                        "0 0 0 6px rgba(182,255,126,0.45)",
                        "0 0 0 0px rgba(182,255,126,0)",
                      ],
                    }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    Add to CCDesigner
                  </motion.div>
                </motion.div>
                <motion.div
                  className="rounded-[0.9rem] border-2 border-accent/55 bg-[#B6FF7E]/12 p-[1.6vh_1vw]"
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.45 }}
                >
                  <div className="flex items-center justify-between gap-[0.5vw]">
                    <div className="font-display font-semibold text-text" style={{ fontSize: "1.05vw" }}>Partner planning</div>
                    <span className="w-[1.1vw] h-[1.1vw] rounded-[0.25rem] border-2 border-primary-dark bg-accent flex items-center justify-center font-display font-black text-primary-dark" style={{ fontSize: "0.7vw" }}>
                      ✓
                    </span>
                  </div>
                  <p className="font-body text-muted mt-[0.6vh]" style={{ fontSize: "0.78vw" }}>Selectable units for your term overview</p>
                  <div className="mt-[1.2vh] font-display font-semibold text-primary-dark" style={{ fontSize: "0.78vw" }}>
                    Select partner planning
                  </div>
                </motion.div>
                <div className="col-span-2 rounded-[0.9rem] border border-dashed border-accent/50 bg-[#B6FF7E]/12 p-[1.4vh_1vw] flex items-center justify-between">
                  <span className="font-body text-primary-dark" style={{ fontSize: "0.9vw" }}>
                    Activities land in Activity Library · ready for Lesson Builder
                  </span>
                  <span className="font-display font-bold text-primary-dark" style={{ fontSize: "0.9vw" }}>✓ Synced</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </MotionConfig>
  );
}
