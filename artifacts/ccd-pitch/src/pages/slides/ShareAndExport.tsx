import { motion, MotionConfig } from "framer-motion";

/** PDF export + file share for funders / classroom use. */
export default function ShareAndExport() {
  const items = [
    {
      title: "PDF export",
      copy: "Print-ready lesson cards — objectives, activities, timings — for the room or a folder.",
    },
    {
      title: "Share a link",
      copy: "Send a colleague the lesson PDF link. Same craft, less email archaeology.",
    },
    {
      title: "Calendar view",
      copy: "Export the week plan so leaders and cover staff see the living timetable.",
    },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative w-screen h-screen overflow-hidden bg-bg">
        <div className="relative z-10 h-full w-full flex flex-col pitch-slide-pad">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-[3vh] max-w-[56vw]"
          >
            <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[1.6vh]">
              Export & share
            </span>
            <h2
              className="pitch-h2 font-display font-black text-text tracking-tight leading-[1.02]"
              style={{ textWrap: "balance" }}
            >
              Leave the platform with the work intact.
            </h2>
            <p
              className="pitch-body-lg mt-[1.6vh] text-muted font-body leading-snug max-w-[44vw]"
              style={{ textWrap: "pretty" }}
            >
              PDF export and share links turn digital planning into something a school can hold,
              pass on, and prove.
            </p>
          </motion.div>

          <div className="grid grid-cols-3 gap-[1.4vw] flex-1 min-h-0">
            {items.map((item, i) => (
              <motion.div
                key={item.title}
                className="rounded-[1.25rem] border border-text/10 bg-white p-[3vh_1.5vw] shadow-[0_12px_36px_rgba(0,45,36,0.07)]"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 + i * 0.1 }}
              >
                <div className="w-[2.6vw] h-[2.6vw] rounded-full bg-primary-dark text-accent font-display font-black flex items-center justify-center mb-[2vh]" style={{ fontSize: "1vw" }}>
                  {i + 1}
                </div>
                <h3 className="pitch-h3 font-display font-bold text-text">{item.title}</h3>
                <p className="pitch-body text-muted font-body mt-[1.2vh] leading-snug">{item.copy}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
