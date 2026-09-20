import { motion, MotionConfig } from "framer-motion";

/** PDF export with live clickable links + share planning. */
export default function ShareAndExport() {
  const items = [
    {
      title: "Print PDFs",
      copy: "Lesson cards with objectives, timings and activities — ready for the room.",
    },
    {
      title: "Live links on the PDF",
      copy: "Video, audio and worksheets stay clickable in the export — not a dead printout.",
    },
    {
      title: "Share planning",
      copy: "Copy a link for a colleague or cover teacher. Same craft, less email archaeology.",
    },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative w-screen h-screen overflow-hidden bg-bg">
        <div className="relative z-10 h-full w-full flex flex-col pitch-slide-pad">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-[2.6vh] max-w-[58vw]"
          >
            <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[1.4vh]">
              Export & share
            </span>
            <h2
              className="pitch-h2 font-display font-black text-text tracking-tight leading-[1.02]"
              style={{ textWrap: "balance" }}
            >
              PDFs that keep working. Plans you can share.
            </h2>
            <p
              className="pitch-body-lg mt-[1.5vh] text-muted font-body leading-snug max-w-[46vw]"
              style={{ textWrap: "pretty" }}
            >
              Export isn&apos;t the end of the story. Live links travel with the PDF. Share planning
              with a colleague in one link.
            </p>
          </motion.div>

          <div className="grid grid-cols-3 gap-[1.3vw] flex-1 min-h-0">
            {items.map((item, i) => (
              <motion.div
                key={item.title}
                className="rounded-[1.2rem] border border-text/10 bg-white p-[2.8vh_1.4vw] shadow-[0_12px_36px_rgba(0,45,36,0.07)]"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 + i * 0.1 }}
              >
                <div
                  className="w-[2.4vw] h-[2.4vw] rounded-full bg-primary-dark text-[#B6FF7E] font-display font-black flex items-center justify-center mb-[1.8vh]"
                  style={{ fontSize: "0.95vw" }}
                >
                  {i + 1}
                </div>
                <h3 className="pitch-h3 font-display font-bold text-text">{item.title}</h3>
                <p className="pitch-body text-muted font-body mt-[1.1vh] leading-snug">{item.copy}</p>
                {i === 1 && (
                  <p className="mt-[1.6vh] font-display font-semibold text-primary-dark underline decoration-[#B6FF7E] decoration-2 underline-offset-4" style={{ fontSize: "0.95vw" }}>
                    youtube.com/watch?v=… →
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
