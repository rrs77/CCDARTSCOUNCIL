import { motion, MotionConfig } from "framer-motion";

/**
 * Hub backend + download analytics — hashed IP / reach for partners & funders.
 */
export default function HubBackendAnalytics() {
  const points = [
    {
      title: "Hub backend",
      copy: "Organisations publish resources and pages. Schools pull them into planning — not another orphaned PDF site.",
    },
    {
      title: "Download tracking",
      copy: "Hubs see what was used. Reach and geography for funders — without exposing teachers.",
    },
    {
      title: "Hashed IPs",
      copy: "Raw addresses stay protected. Analytics use hashed identifiers. Impact evidence, privacy intact.",
    },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative w-screen h-screen overflow-hidden bg-bg">
        <div className="relative z-10 h-full w-full flex flex-col pitch-slide-pad">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[58vw] mb-[2.6vh]"
          >
            <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[1.4vh]">
              Hub backend
            </span>
            <h2
              className="pitch-h2 font-display font-black text-text tracking-tight leading-[1.02]"
              style={{ textWrap: "balance" }}
            >
              Partners publish. Schools use. Funders see reach.
            </h2>
            <p
              className="pitch-body-lg mt-[1.5vh] text-muted font-body leading-snug max-w-[46vw]"
              style={{ textWrap: "pretty" }}
            >
              Behind Partner Hubs sits organisation admin and download analytics — so hubs can change
              resources and prove impact without collecting raw teacher IPs.
            </p>
          </motion.div>

          <div className="grid grid-cols-3 gap-[1.3vw] flex-1 min-h-0">
            {points.map((p, i) => (
              <motion.div
                key={p.title}
                className="rounded-[1.2rem] bg-primary-dark text-white p-[2.6vh_1.4vw] flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.1 }}
              >
                <span className="text-[#B6FF7E] font-display font-semibold uppercase tracking-[0.14em]" style={{ fontSize: "0.75vw" }}>
                  0{i + 1}
                </span>
                <h3 className="mt-[1.6vh] font-display font-bold leading-tight" style={{ fontSize: "1.7vw" }}>
                  {p.title}
                </h3>
                <p className="mt-[1.2vh] text-white/75 font-body leading-snug flex-1" style={{ fontSize: "1.05vw" }}>
                  {p.copy}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
