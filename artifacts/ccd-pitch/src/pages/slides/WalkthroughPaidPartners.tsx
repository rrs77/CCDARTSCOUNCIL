import { motion, MotionConfig } from "framer-motion";

/**
 * Slide 7 — iCompose + We Teach Drama (paid partners / basket).
 */
export default function WalkthroughPaidPartners() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative w-screen h-screen overflow-hidden bg-bg">
        <div
          className="absolute -top-[15vh] -right-[8vw] rounded-full"
          style={{
            width: "44vw",
            height: "44vw",
            background: "radial-gradient(circle at center, rgba(20,184,166,0.14), transparent 65%)",
            filter: "blur(3vw)",
          }}
        />

        <div className="relative z-10 h-full w-full flex flex-col pitch-slide-pad">
          <motion.div
            className="max-w-[54vw] mb-[3vh]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[1.8vh]">
              Paid partners
            </span>
            <h2 className="pitch-h2 font-display font-black text-text tracking-tight leading-[1.02]" style={{ textWrap: "balance" }}>
              iCompose — and We Teach Drama.
            </h2>
            <p className="pitch-body-lg mt-[1.8vh] text-muted font-body leading-snug max-w-[44vw]" style={{ textWrap: "pretty" }}>
              Premium partner products sit in a clear school basket. A small platform fee (10–20%)
              helps sustain CCDesigner while partners keep creating classroom-ready packs.
            </p>
          </motion.div>

          <div className="grid grid-cols-12 gap-[1.4vw] flex-1 min-h-0">
            <motion.div
              className="col-span-5 rounded-[1.3rem] border border-text/10 bg-white p-[2.4vh_1.4vw] shadow-[0_12px_36px_rgba(0,45,36,0.08)] flex flex-col"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
            >
              <div className="flex items-center justify-between mb-[1.6vh]">
                <span className="font-display font-black text-primary-dark" style={{ fontSize: "1.6vw" }}>iCompose</span>
                <span className="px-[0.7vw] py-[0.35vh] rounded-full bg-primary-dark text-accent font-display font-semibold" style={{ fontSize: "0.7vw" }}>
                  Paid hub
                </span>
              </div>
              <p className="font-body text-muted leading-snug flex-1" style={{ fontSize: "1vw" }}>
                Composition pathways for classrooms — browse the hub, add getting-started packs, and check
                out through the paid basket.
              </p>
              <div className="mt-[2vh] pt-[1.2vh] border-t border-text/10 font-display font-semibold text-primary-dark" style={{ fontSize: "0.9vw" }}>
                Add to basket →
              </div>
            </motion.div>

            <motion.div
              className="col-span-4 rounded-[1.3rem] border border-text/10 bg-white p-[2.4vh_1.4vw] shadow-[0_12px_36px_rgba(0,45,36,0.08)] flex flex-col"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.28 }}
            >
              <div className="flex items-center justify-between mb-[1.6vh]">
                <span className="font-display font-bold text-text" style={{ fontSize: "1.35vw" }}>We Teach Drama</span>
                <span className="px-[0.7vw] py-[0.35vh] rounded-full bg-[#B6FF7E]/40 text-primary-dark font-display font-semibold" style={{ fontSize: "0.7vw" }}>
                  Paid
                </span>
              </div>
              <p className="font-body text-muted leading-snug flex-1" style={{ fontSize: "1vw" }}>
                Specialist drama resources for schools — same basket flow, clear licensing for departments.
              </p>
              <div className="mt-[2vh] pt-[1.2vh] border-t border-text/10 font-body text-muted" style={{ fontSize: "0.85vw" }}>
                Brief mention · full hub in prototype
              </div>
            </motion.div>

            <motion.div
              className="col-span-3 rounded-[1.3rem] bg-primary-dark text-white p-[2.4vh_1.2vw] flex flex-col justify-between shadow-[0_16px_48px_rgba(0,45,36,0.18)]"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.4 }}
            >
              <div>
                <div className="font-display font-semibold text-accent uppercase tracking-wide" style={{ fontSize: "0.75vw" }}>
                  Basket
                </div>
                <div className="font-display font-bold mt-[1vh]" style={{ fontSize: "1.2vw" }}>
                  Paid partner checkout
                </div>
              </div>
              <div className="font-body text-white/75 leading-snug" style={{ fontSize: "0.9vw" }}>
                Platform fee 10–20% · partners keep creating · schools get classroom-ready packs
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
