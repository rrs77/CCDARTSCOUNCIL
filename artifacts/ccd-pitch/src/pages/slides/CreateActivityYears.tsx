import { motion, MotionConfig } from "framer-motion";

/** Create activity + tag year groups. */
export default function CreateActivityYears() {
  const fields = [
    { label: "Name", value: "Call and response — Hello Song" },
    { label: "Year groups", value: "Year 2 Music · KS1 · Assembly" },
    { label: "Links", value: "Video · backing · worksheet" },
    { label: "Duration", value: "8 minutes" },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative w-screen h-screen overflow-hidden bg-bg">
        <div className="relative z-10 h-full w-full grid grid-cols-12 gap-[2vw] pitch-slide-pad">
          <motion.div
            className="col-span-5 flex flex-col justify-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[1.5vh]">
              Create an activity
            </span>
            <h2
              className="pitch-h2 font-display font-black text-text tracking-tight leading-[1.02]"
              style={{ textWrap: "balance" }}
            >
              Build it. Tag the years. Find it forever.
            </h2>
            <p
              className="pitch-body-lg mt-[1.6vh] text-muted font-body leading-snug"
              style={{ textWrap: "pretty" }}
            >
              Teachers create their own activities — name, instructions, video and backing tracks —
              then assign them to the year groups that teach them.
            </p>
          </motion.div>

          <motion.div
            className="col-span-7 flex items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <div className="w-full rounded-[1.3rem] bg-white border border-text/10 shadow-[0_16px_44px_rgba(0,45,36,0.08)] overflow-hidden">
              <div className="flex items-center justify-between px-[1.4vw] py-[1.4vh] border-b border-text/10 bg-bg/80">
                <span className="font-display font-bold text-text" style={{ fontSize: "1.05vw" }}>
                  New activity
                </span>
                <span className="px-[0.8vw] py-[0.35vh] rounded-full bg-primary-dark text-[#B6FF7E] font-display font-semibold" style={{ fontSize: "0.72vw" }}>
                  Save to library
                </span>
              </div>
              <div className="p-[2vh_1.4vw] flex flex-col gap-[1.2vh]">
                {fields.map((f) => (
                  <div key={f.label} className="rounded-xl border border-text/10 bg-bg/60 px-[1vw] py-[1.2vh]">
                    <p className="font-display font-semibold text-primary-dark uppercase tracking-[0.12em]" style={{ fontSize: "0.7vw" }}>
                      {f.label}
                    </p>
                    <p className="mt-[0.4vh] font-body text-text" style={{ fontSize: "1.15vw" }}>
                      {f.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </MotionConfig>
  );
}
