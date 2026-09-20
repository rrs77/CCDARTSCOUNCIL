import { motion, MotionConfig } from "framer-motion";

/** Settings — name year groups to match the school. */
export default function YearGroupsSettings() {
  const groups = [
    { name: "Lower Kindergarten Music", stage: "EYFS" },
    { name: "Year 2 Music", stage: "KS1" },
    { name: "Year 6 Music", stage: "KS2" },
    { name: "Year 8 Music", stage: "KS3" },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative w-screen h-screen overflow-hidden bg-bg">
        <div className="relative z-10 h-full w-full flex flex-col pitch-slide-pad">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[56vw] mb-[2.6vh]"
          >
            <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[1.4vh]">
              Year groups
            </span>
            <h2
              className="pitch-h2 font-display font-black text-text tracking-tight leading-[1.02]"
              style={{ textWrap: "balance" }}
            >
              Name the years the way your school teaches.
            </h2>
            <p
              className="pitch-body-lg mt-[1.5vh] text-muted font-body leading-snug max-w-[44vw]"
              style={{ textWrap: "pretty" }}
            >
              Settings lets schools name year groups and key-stage folders — then activities and
              lessons attach to those names, not a generic list.
            </p>
          </motion.div>

          <div className="grid grid-cols-4 gap-[1.2vw] flex-1 min-h-0">
            {groups.map((g, i) => (
              <motion.div
                key={g.name}
                className="rounded-[1.2rem] border border-text/10 bg-white p-[2.2vh_1.2vw] shadow-[0_12px_32px_rgba(0,45,36,0.06)] flex flex-col justify-between"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
              >
                <span className="font-display font-semibold text-accent uppercase tracking-[0.14em]" style={{ fontSize: "0.72vw" }}>
                  {g.stage}
                </span>
                <h3 className="font-display font-bold text-text leading-tight mt-[2vh]" style={{ fontSize: "1.35vw" }}>
                  {g.name}
                </h3>
                <p className="mt-[1.4vh] text-muted font-body" style={{ fontSize: "0.9vw" }}>
                  Activities tagged here appear in this class library.
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
