import { motion, MotionConfig } from "framer-motion";

/** Personal resources + Add to library — teacher ownership. */
export default function PersonalResources() {
  const steps = [
    { label: "From a hub", detail: "Add to CCDesigner from LSO, EMS, ROH…" },
    { label: "Create your own", detail: "Video, link, backing track, notes" },
    { label: "In My Resources", detail: "Ready for Lesson Builder" },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative w-screen h-screen overflow-hidden bg-bg">
        <div className="relative z-10 h-full w-full flex flex-col pitch-slide-pad">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-[58vw] mb-[3vh]"
          >
            <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[1.6vh]">
              Add to library
            </span>
            <h2
              className="pitch-h2 font-display font-black text-text tracking-tight leading-[1.02]"
              style={{ textWrap: "balance" }}
            >
              Partner packs and personal resources — together.
            </h2>
            <p
              className="pitch-body-lg mt-[1.8vh] text-muted font-body leading-snug max-w-[46vw]"
              style={{ textWrap: "pretty" }}
            >
              Teachers pull trusted hub content into their library, then add their own materials —
              so the scheme reflects both the sector and the school.
            </p>
          </motion.div>

          <div className="grid grid-cols-3 gap-[1.4vw] flex-1 min-h-0 items-stretch">
            {steps.map((s, i) => (
              <motion.div
                key={s.label}
                className="rounded-[1.25rem] bg-primary-dark text-white p-[3vh_1.6vw] flex flex-col justify-between"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 + i * 0.1 }}
              >
                <div>
                  <span className="text-accent font-display font-semibold uppercase tracking-[0.14em]" style={{ fontSize: "0.85vw" }}>
                    Step {i + 1}
                  </span>
                  <h3 className="mt-[1.4vh] font-display font-bold leading-tight" style={{ fontSize: "2vw" }}>
                    {s.label}
                  </h3>
                </div>
                <p className="text-white/75 font-body leading-snug" style={{ fontSize: "1.15vw" }}>
                  {s.detail}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
