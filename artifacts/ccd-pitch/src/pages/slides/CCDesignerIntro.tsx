import { motion, MotionConfig } from "framer-motion";

const base = import.meta.env.BASE_URL;
/** Same circular CCD mark as LoginHeroPanel / LogoMark (lime ring, forest fill). */
const CCD_MARK = `${base}cd-logo.svg`;

const HERO_HEADLINE = "Exceptional lessons start with";
const HERO_VALUE =
  "Capture ideas. Build lessons. Connect with the best arts organisations — EYFS to A-level.";

/**
 * Opening slide: app login branding — CCD circle + connection byline.
 * Matches LoginHeroPanel: forest stage, lime italic “connection”, short value line.
 */
export default function CCDesignerIntro() {
  return (
    <MotionConfig>
      <div
        className="relative w-screen h-screen overflow-hidden flex items-center justify-center"
        style={{ backgroundColor: "#002D24" }}
      >
        {/* Soft lime glow behind the lockup — login visual language */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: "58vw",
            height: "58vw",
            left: "50%",
            top: "44%",
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, rgba(182,255,126,0.12) 0%, transparent 68%)",
            filter: "blur(2vw)",
          }}
          aria-hidden
        />

        <div className="relative z-10 flex flex-col items-center text-center px-[7vw] max-w-[78vw]">
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.22, 0.61, 0.36, 1] }}
            className="relative rounded-full"
            style={{
              boxShadow: "0 0 4vh rgba(182,255,126,0.14)",
            }}
          >
            <img
              src={CCD_MARK}
              alt="CCD"
              className="block"
              style={{
                width: "min(18vw, 22vh)",
                height: "min(18vw, 22vh)",
              }}
            />
          </motion.div>

          <motion.h1
            className="mt-[4.5vh] text-white font-semibold tracking-tight leading-[1.12]"
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: "clamp(1.55rem, 3.6vw, 2.85rem)",
              textWrap: "balance",
              maxWidth: "18em",
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 0.61, 0.36, 1], delay: 0.22 }}
          >
            {HERO_HEADLINE}{" "}
            <span
              className="italic font-normal"
              style={{
                color: "#B6FF7E",
                fontFamily: '"Playfair Display", Georgia, serif',
              }}
            >
              connection
            </span>
          </motion.h1>

          <motion.p
            className="mt-[2.8vh] text-white/90 font-body leading-relaxed max-w-[36em]"
            style={{
              fontSize: "clamp(0.88rem, 1.35vw, 1.2rem)",
              textWrap: "pretty",
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1], delay: 0.42 }}
          >
            {HERO_VALUE}
          </motion.p>
        </div>
      </div>
    </MotionConfig>
  );
}
