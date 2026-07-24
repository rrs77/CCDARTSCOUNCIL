import { motion, MotionConfig } from "framer-motion";

/**
 * Slide 2 — Music hubs (EMS / Tri-Borough) + Partner Hubs structure.
 */
export default function WalkthroughMusicHubs() {
  const hubs = [
    { name: "EMS Music Hub", role: "Interactive", detail: "Browse resources · Add to CCDesigner" },
    { name: "Tri-Borough", role: "Links hub", detail: "Music education pathways & partner links" },
    { name: "LSO hub", role: "Interactive", detail: "Choose a pack · Add to CCDesigner" },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative w-screen h-screen overflow-hidden bg-bg">
        <div
          className="absolute -top-[12vh] -left-[8vw] rounded-full"
          style={{
            width: "42vw",
            height: "42vw",
            background: "radial-gradient(circle at center, rgba(182,255,126,0.18), transparent 65%)",
            filter: "blur(3vw)",
          }}
        />

        <div className="relative z-10 h-full w-full flex flex-col pitch-slide-pad">
          <motion.div
            className="max-w-[56vw] mb-[2.6vh]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[1.8vh]">
              Partner Hubs
            </span>
            <h2 className="pitch-h2 font-display font-black text-text tracking-tight leading-[1.02]" style={{ textWrap: "balance" }}>
              Music hubs in one Partner Hubs home.
            </h2>
            <p className="pitch-body-lg mt-[1.8vh] text-muted font-body leading-snug max-w-[44vw]" style={{ textWrap: "pretty" }}>
              Dashboard → Partner Hubs → Music section. EMS, Tri-Borough and LSO sit together so teachers
              find the right organisation in one place.
            </p>
          </motion.div>

          <motion.div
            className="mb-[2vh] rounded-[1rem] border border-primary/20 bg-primary/5 px-[1.2vw] py-[1.2vh] inline-flex items-center gap-[0.8vw] self-start"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
          >
            <span className="font-display font-semibold text-primary-dark" style={{ fontSize: "0.85vw" }}>
              Partner Hubs
            </span>
            <span className="text-muted" style={{ fontSize: "0.9vw" }}>→</span>
            <span className="px-[0.7vw] py-[0.3vh] rounded-full bg-primary-dark text-accent font-display font-semibold" style={{ fontSize: "0.75vw" }}>
              Music
            </span>
            <span className="text-muted" style={{ fontSize: "0.9vw" }}>→</span>
            <span className="font-body text-text" style={{ fontSize: "0.85vw" }}>
              EMS · Tri-Borough · LSO
            </span>
          </motion.div>

          <div className="grid grid-cols-3 gap-[1.4vw] flex-1 min-h-0">
            {hubs.map((hub, i) => (
              <motion.div
                key={hub.name}
                className="rounded-[1.3rem] border border-text/10 bg-white p-[2.4vh_1.4vw] flex flex-col shadow-[0_12px_36px_rgba(0,45,36,0.08)]"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.2 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center justify-between mb-[2vh]">
                  <span className="w-[2.4vw] h-[2.4vw] rounded-full bg-primary-dark text-accent font-display font-black flex items-center justify-center" style={{ fontSize: "0.95vw" }}>
                    {i + 1}
                  </span>
                  <span className="px-[0.7vw] py-[0.35vh] rounded-full bg-primary/10 text-primary-dark font-display font-semibold" style={{ fontSize: "0.72vw" }}>
                    {hub.role}
                  </span>
                </div>
                <h3 className="pitch-h3 font-display font-bold text-text leading-tight">{hub.name}</h3>
                <p className="pitch-body text-muted font-body mt-[1vh] leading-snug flex-1">{hub.detail}</p>
                <div className="mt-[2vh] pt-[1.2vh] border-t border-text/10 font-body text-primary-dark font-semibold" style={{ fontSize: "0.85vw" }}>
                  Open from Partner Hubs →
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
