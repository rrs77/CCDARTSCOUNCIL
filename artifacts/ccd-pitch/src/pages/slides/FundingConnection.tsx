import { motion, MotionConfig } from "framer-motion";

/**
 * Funding pitch — connection layer for Music Hubs & arts organisations.
 */
export default function FundingConnection() {
  const pillars = [
    {
      title: "Music Hubs",
      copy: "EMS, Tri-Borough and the UK Music Hubs directory — regional delivery in one Partner Hubs home.",
    },
    {
      title: "National partners",
      copy: "LSO, ROH, National Theatre and more — trusted packs teachers can add straight into their library.",
    },
    {
      title: "Classroom craft",
      copy: "Starter, main and plenary — lessons capped at one hour, then whole units on the calendar.",
    },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative w-screen h-screen overflow-hidden bg-bg">
        <div
          className="absolute -top-[18vh] right-[-8vw] rounded-full"
          style={{
            width: "48vw",
            height: "48vw",
            background: "radial-gradient(circle at center, rgba(182,255,126,0.22), transparent 68%)",
            filter: "blur(2.5vw)",
          }}
        />

        <div className="relative z-10 h-full w-full flex flex-col pitch-slide-pad">
          <motion.div
            className="max-w-[62vw] mb-[3vh]"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[1.6vh]">
              Why fund this
            </span>
            <h2
              className="pitch-h2 font-display font-black text-text tracking-tight leading-[1.02]"
              style={{ textWrap: "balance" }}
            >
              A connection layer for the arts.
            </h2>
            <p
              className="pitch-body-lg mt-[1.8vh] text-muted font-body leading-snug max-w-[48vw]"
              style={{ textWrap: "pretty" }}
            >
              CCDesigner sits between Music Hubs, national arts organisations and the classroom —
              so great practice travels, and teachers are never planning alone.
            </p>
          </motion.div>

          <div className="grid grid-cols-3 gap-[1.5vw] flex-1 min-h-0">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                className="rounded-[1.25rem] border border-text/10 bg-white p-[2.6vh_1.5vw] flex flex-col shadow-[0_14px_40px_rgba(0,45,36,0.07)]"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <span
                  className="font-display font-black text-primary-dark/25 leading-none mb-[1.6vh]"
                  style={{ fontSize: "3.2vw" }}
                >
                  0{i + 1}
                </span>
                <h3 className="pitch-h3 font-display font-bold text-text leading-tight">{p.title}</h3>
                <p className="pitch-body text-muted font-body mt-[1.2vh] leading-snug flex-1">{p.copy}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
