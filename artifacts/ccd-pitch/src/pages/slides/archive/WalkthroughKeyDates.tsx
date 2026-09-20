import { motion, MotionConfig } from "framer-motion";

/**
 * Slide 5 — Key dates: populate from partners + Important dates.
 */
export default function WalkthroughKeyDates() {
  const rows = [
    { date: "12 Oct", title: "LSO Discovery workshop", tag: "Partner" },
    { date: "3 Nov", title: "Schools concert — Barbican", tag: "Key date" },
    { date: "18 Jan", title: "Composer visit (primary)", tag: "Partner" },
    { date: "9 Mar", title: "Spring showcase deadline", tag: "School" },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative w-screen h-screen overflow-hidden bg-bg">
        <div
          className="absolute -bottom-[18vh] -right-[10vw] rounded-full"
          style={{
            width: "46vw",
            height: "46vw",
            background: "radial-gradient(circle at center, rgba(182,255,126,0.16), transparent 65%)",
            filter: "blur(3vw)",
          }}
        />

        <div className="relative z-10 h-full w-full grid grid-cols-12 gap-[1.64vw] pitch-slide-pad">
          <motion.div
            className="col-span-5 flex flex-col justify-center"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65 }}
          >
            <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[1.8vh]">
              Key dates
            </span>
            <h2 className="pitch-h2 font-display font-black text-text tracking-tight leading-[1.02]" style={{ textWrap: "balance" }}>
              Populate with partner key dates.
            </h2>
            <p className="pitch-body-lg mt-[2vh] text-muted font-body leading-relaxed" style={{ textWrap: "pretty" }}>
              Pull Important dates from a partner into your calendar — concerts, workshops, and sector
              milestones sit alongside your school year.
            </p>
            <motion.div
              className="mt-[2.8vh] rounded-[1rem] border border-primary/25 bg-primary/5 p-[1.6vh_1.1vw]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2 }}
            >
              <div className="font-display font-semibold text-primary-dark" style={{ fontSize: "0.9vw" }}>
                Populate with key dates from
              </div>
              <div className="mt-[0.8vh] flex items-center justify-between rounded-[0.55rem] border border-text/15 bg-white px-[0.9vw] py-[0.9vh]">
                <span className="font-body text-text" style={{ fontSize: "0.95vw" }}>London Symphony Orchestra</span>
                <span className="text-muted" style={{ fontSize: "0.9vw" }}>▾</span>
              </div>
            </motion.div>
          </motion.div>

          <div className="col-span-7 flex items-center">
            <div className="w-full rounded-[1.3rem] bg-surface border border-text/8 overflow-hidden shadow-[0_16px_48px_rgba(0,45,36,0.1)]">
              <div className="px-[1.3vw] py-[1.3vh] border-b border-text/10 flex items-center justify-between bg-white">
                <span className="font-display font-bold text-text" style={{ fontSize: "1.1vw" }}>Important dates</span>
                <span className="font-body text-muted" style={{ fontSize: "0.78vw" }}>Academic year · 2025–26</span>
              </div>
              <div className="p-[1.2vw] flex flex-col gap-[0.9vh]">
                {rows.map((row, i) => (
                  <motion.div
                    key={row.title}
                    className="flex items-center gap-[1vw] rounded-[0.75rem] border border-text/10 bg-white px-[1vw] py-[1.2vh]"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.25 + i * 0.1 }}
                  >
                    <div className="w-[4.5vw] shrink-0 font-display font-bold text-primary-dark" style={{ fontSize: "0.95vw" }}>
                      {row.date}
                    </div>
                    <div className="flex-1 font-body text-text" style={{ fontSize: "0.95vw" }}>
                      {row.title}
                    </div>
                    <span className="px-[0.65vw] py-[0.3vh] rounded-full bg-[#B6FF7E]/35 text-primary-dark font-display font-semibold" style={{ fontSize: "0.7vw" }}>
                      {row.tag}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
