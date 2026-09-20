import { motion, MotionConfig } from "framer-motion";

/** Jazz North — organisation hub example with Add to CCDesigner. */
export default function JazzNorthHub() {
  const packs = [
    { name: "Mr Big", detail: "Showcase lesson → Year 2 Music" },
    { name: "Playlist Project", detail: "Milestones listening pathway" },
    { name: "Worksheet packs", detail: "Hello Song · Can You Sing · Improv" },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative w-screen h-screen overflow-hidden bg-bg">
        <div
          className="absolute -top-[12vh] -right-[6vw] rounded-full"
          style={{
            width: "40vw",
            height: "40vw",
            background: "radial-gradient(circle at center, rgba(232,90,158,0.22), transparent 68%)",
            filter: "blur(2.5vw)",
          }}
        />
        <div className="relative z-10 h-full w-full flex flex-col pitch-slide-pad">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[58vw] mb-[2.4vh]"
          >
            <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[1.4vh]">
              Organisation example
            </span>
            <h2
              className="pitch-h2 font-display font-black text-text tracking-tight leading-[1.02]"
              style={{ textWrap: "balance" }}
            >
              Jazz North — Add to CCDesigner.
            </h2>
            <p
              className="pitch-body-lg mt-[1.5vh] text-muted font-body leading-snug max-w-[46vw]"
              style={{ textWrap: "pretty" }}
            >
              Free worksheets and lessons from an organisation hub. One click seeds activities into
              the teacher&apos;s library — same pathway as national partners.
            </p>
          </motion.div>

          <div className="grid grid-cols-3 gap-[1.3vw] flex-1 min-h-0">
            {packs.map((p, i) => (
              <motion.div
                key={p.name}
                className="rounded-[1.2rem] border border-text/10 bg-white p-[2.4vh_1.4vw] shadow-[0_12px_36px_rgba(0,45,36,0.07)] flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 + i * 0.1 }}
              >
                <span
                  className="w-[2.2vw] h-[2.2vw] rounded-full bg-primary-dark text-[#B6FF7E] font-display font-black flex items-center justify-center mb-[1.6vh]"
                  style={{ fontSize: "0.95vw" }}
                >
                  {i + 1}
                </span>
                <h3 className="pitch-h3 font-display font-bold text-text">{p.name}</h3>
                <p className="pitch-body text-muted font-body mt-[1vh] flex-1 leading-snug">{p.detail}</p>
                <p className="mt-[1.6vh] pt-[1vh] border-t border-text/10 font-display font-semibold text-primary-dark" style={{ fontSize: "0.85vw" }}>
                  Add to CCDesigner →
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
