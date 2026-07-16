import { motion, MotionConfig } from "framer-motion";

const base = import.meta.env.BASE_URL;
const LOGO = `${base}melting-pot-logo.png`;

/**
 * Opening slide: the Melting Pot logo, animated. The artwork is the
 * exact attached image — never redrawn. Horizontal bands of the image
 * are revealed in sequence (THE + rule, MELTING POT stamp, byline,
 * tagline, app logos) while the whole mark settles with a gentle zoom.
 *
 * Each band crops the full-width image via an overflow-hidden window;
 * the inner img is offset so the bands tile back into the exact logo.
 */
function Band({
  top,
  height,
  delay,
  stamp = false,
}: {
  top: number;
  height: number;
  delay: number;
  stamp?: boolean;
}) {
  return (
    <div
      className="absolute left-0 w-full overflow-hidden"
      style={{ top: `${top}%`, height: `${height}%` }}
    >
      <motion.img
        src={LOGO}
        alt=""
        aria-hidden
        crossOrigin="anonymous"
        className="absolute left-0 w-full"
        style={{ top: `${-(top / height) * 100}%` }}
        initial={
          stamp
            ? { opacity: 0, scale: 1.14, filter: "blur(6px)" }
            : { opacity: 0, y: "6%" }
        }
        animate={
          stamp
            ? { opacity: 1, scale: 1, filter: "blur(0px)" }
            : { opacity: 1, y: "0%" }
        }
        transition={
          stamp
            ? { delay, duration: 0.55, ease: [0.2, 0.9, 0.3, 1] }
            : { delay, duration: 0.8, ease: [0.25, 0.8, 0.35, 1] }
        }
      />
    </div>
  );
}

export default function MeltingPotIntro() {
  return (
    <MotionConfig>
      <div className="relative w-screen h-screen overflow-hidden bg-white flex items-center justify-center">
        <motion.div
          className="relative"
          style={{
            width: "min(100vw, calc(100vh * 16 / 9))",
            aspectRatio: "16 / 9",
          }}
          initial={{ scale: 1.045 }}
          animate={{ scale: 1 }}
          transition={{ duration: 3.2, ease: [0.16, 0.8, 0.3, 1] }}
        >
          {/* THE + top rule */}
          <Band top={17} height={12} delay={0.25} />
          {/* MELTING POT + bottom rule — stamped in */}
          <Band top={29} height={16.5} delay={0.85} stamp />
          {/* byline */}
          <Band top={45.5} height={10.5} delay={1.55} />
          {/* tagline */}
          <Band top={56} height={12} delay={1.95} />
          {/* app logos row */}
          <Band top={68} height={22} delay={2.35} />
        </motion.div>
      </div>
    </MotionConfig>
  );
}
