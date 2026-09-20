import { motion, MotionConfig } from "framer-motion";

/**
 * Settings: key-stage folders / customisable library.
 */
export default function WalkthroughSettings() {
  const folders = ["EYFS", "KS1", "KS2", "KS3", "KS4", "KS5"];

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative w-screen h-screen overflow-hidden bg-bg">
        <div className="relative z-10 h-full w-full grid grid-cols-12 gap-[1.64vw] pitch-slide-pad">
          <motion.div
            className="col-span-5 flex flex-col justify-center"
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[1.8vh]">
              Settings
            </span>
            <h2
              className="pitch-h2 font-display font-black text-text tracking-tight leading-[1.02]"
              style={{ textWrap: "balance" }}
            >
              Key-stage folders you shape.
            </h2>
            <p
              className="pitch-body-lg mt-[2vh] text-muted font-body leading-relaxed"
              style={{ textWrap: "pretty" }}
            >
              Organise your activity library by key stage and category. Choose the academic year from
              the year dropdown — your school&apos;s structure, not a fixed template.
            </p>
            <ul className="mt-[2.6vh] flex flex-col gap-[1vh]">
              {[
                "Key-stage folders for drama, music & dance",
                "Custom categories and resource links",
                "Academic year dropdown for allocation",
              ].map((item, i) => (
                <motion.li
                  key={item}
                  className="flex items-start gap-[0.7vw]"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                >
                  <span className="mt-[0.45vh] w-[0.45vw] h-[0.45vw] rounded-full bg-accent shrink-0" />
                  <span className="pitch-body font-body text-text">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="col-span-7 flex items-center"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.08 }}
          >
            <div className="w-full rounded-[1.3rem] bg-surface border border-text/8 overflow-hidden shadow-[0_16px_48px_rgba(0,45,36,0.1)]">
              <div className="flex items-center justify-between px-[1.3vw] py-[1.3vh] border-b border-text/10 bg-white">
                <span className="font-display font-bold text-text" style={{ fontSize: "1.1vw" }}>
                  Library · key stages
                </span>
                <div className="flex items-center gap-[0.5vw] rounded-[0.5rem] border border-text/15 px-[0.8vw] py-[0.55vh]">
                  <span className="font-body text-muted" style={{ fontSize: "0.75vw" }}>
                    Year
                  </span>
                  <span
                    className="font-display font-semibold text-primary-dark"
                    style={{ fontSize: "0.85vw" }}
                  >
                    2025–26 ▾
                  </span>
                </div>
              </div>
              <div className="p-[1.3vw] grid grid-cols-3 gap-[0.9vw]">
                {folders.map((folder, i) => (
                  <motion.div
                    key={folder}
                    className="rounded-[0.85rem] border border-text/10 bg-white p-[1.6vh_0.9vw] flex flex-col gap-[0.6vh]"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.18 + i * 0.06 }}
                  >
                    <div className="w-[2vw] h-[1.6vw] rounded-[0.35rem] bg-primary-dark/90" />
                    <div className="font-display font-bold text-text" style={{ fontSize: "1.05vw" }}>
                      {folder}
                    </div>
                    <div className="font-body text-muted" style={{ fontSize: "0.75vw" }}>
                      Customisable folder
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </MotionConfig>
  );
}
