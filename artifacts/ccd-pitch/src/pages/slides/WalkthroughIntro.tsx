import { motion, MotionConfig } from "framer-motion";

/**
 * Slide 1 — Context / connection / brief prototype intro.
 * Forest + lime CCD brand field with circle lockup cue.
 */
export default function WalkthroughIntro() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative w-screen h-screen overflow-hidden bg-primary-dark">
        <motion.div
          className="absolute -top-[20vh] -right-[10vw] rounded-full"
          style={{
            width: "55vw",
            height: "55vw",
            background: "radial-gradient(circle at center, rgba(182,255,126,0.22), transparent 65%)",
            filter: "blur(4vw)",
          }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          className="absolute -bottom-[25vh] -left-[15vw] rounded-full"
          style={{
            width: "50vw",
            height: "50vw",
            background: "radial-gradient(circle at center, rgba(20,184,166,0.28), transparent 65%)",
            filter: "blur(4vw)",
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        />

        <div className="relative z-10 h-full w-full flex flex-col justify-center px-[8vw] py-[8vh]">
          <motion.div
            className="flex items-center gap-[1.2vw] mb-[3vh]"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="flex items-center justify-center rounded-full bg-[#B6FF7E] text-primary-dark font-display font-black"
              style={{ width: "4.2vw", height: "4.2vw", fontSize: "1.6vw" }}
            >
              CCD
            </div>
            <div>
              <div className="font-display font-bold text-white tracking-wide" style={{ fontSize: "1.35vw" }}>
                Creative Curriculum Designer
              </div>
              <div className="font-body text-white/65 uppercase tracking-[0.2em]" style={{ fontSize: "0.75vw" }}>
                Feature walkthrough
              </div>
            </div>
          </motion.div>

          <motion.span
            className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[2vh]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
          >
            Prototype · partners &amp; funding
          </motion.span>
          <motion.h1
            className="font-display font-black text-white tracking-tight leading-[1.02] max-w-[70vw]"
            style={{ fontSize: "4.6vw", textWrap: "balance" }}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            One living home for{" "}
            <span className="text-accent">creative teaching</span>
            <span className="text-white/90"> — connected to the sector.</span>
          </motion.h1>
          <motion.p
            className="mt-[3vh] text-white/80 font-body leading-relaxed max-w-[48vw]"
            style={{ fontSize: "1.4vw", textWrap: "pretty" }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
          >
            A short tour of Partner Hubs, planning, key dates, paid partners, and how schools and arts
            organisations work together inside CCDesigner.
          </motion.p>
        </div>
      </div>
    </MotionConfig>
  );
}
