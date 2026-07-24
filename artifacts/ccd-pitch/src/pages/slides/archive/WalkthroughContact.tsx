/**
 * Slide 10 — Contact / next steps.
 */
export default function WalkthroughContact() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-primary-dark">
      <div
        className="absolute -top-[22vh] -right-[12vw] rounded-full"
        style={{
          width: "55vw",
          height: "55vw",
          background: "radial-gradient(circle at center, rgba(182,255,126,0.2), transparent 65%)",
          filter: "blur(4vw)",
        }}
      />
      <div
        className="absolute -bottom-[28vh] -left-[16vw] rounded-full"
        style={{
          width: "52vw",
          height: "52vw",
          background: "radial-gradient(circle at center, rgba(20,184,166,0.3), transparent 65%)",
          filter: "blur(4vw)",
        }}
      />

      <div className="relative z-10 h-full w-full flex flex-col justify-center px-[8vw] py-[8vh] slide-auto-enter">
        <div className="flex items-center gap-[1vw] mb-[3vh]">
          <div
            className="flex items-center justify-center rounded-full bg-[#B6FF7E] text-primary-dark font-display font-black"
            style={{ width: "3.6vw", height: "3.6vw", fontSize: "1.35vw" }}
          >
            CCD
          </div>
          <span className="font-display font-bold text-white tracking-wide" style={{ fontSize: "1.2vw" }}>
            Creative Curriculum Designer
          </span>
        </div>

        <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[2vh]">
          Next steps
        </span>
        <h2
          className="font-display font-black text-white tracking-tight leading-[1.02] max-w-[70vw]"
          style={{ fontSize: "4.2vw", textWrap: "balance" }}
        >
          Continue into the prototype — or talk to us.
        </h2>
        <p
          className="mt-[2.5vh] text-white/80 font-body leading-relaxed max-w-[48vw]"
          style={{ fontSize: "1.35vw", textWrap: "pretty" }}
        >
          Close this walkthrough to sign in or explore. For funding conversations and partner access,
          get in touch.
        </p>

        <div className="mt-[4vh] grid grid-cols-3 gap-[1.3vw] max-w-[72vw]">
          <div className="rounded-[1.2rem] bg-white/8 border border-white/15 p-[2.2vh_1.3vw]">
            <div className="font-display font-semibold text-accent uppercase tracking-wide" style={{ fontSize: "0.8vw" }}>
              Email
            </div>
            <div className="font-display font-bold text-white mt-[0.8vh]" style={{ fontSize: "1.15vw" }}>
              rob@rhythmstix.co.uk
            </div>
          </div>
          <div className="rounded-[1.2rem] bg-white/8 border border-white/15 p-[2.2vh_1.3vw]">
            <div className="font-display font-semibold text-accent uppercase tracking-wide" style={{ fontSize: "0.8vw" }}>
              Web
            </div>
            <div className="font-display font-bold text-white mt-[0.8vh]" style={{ fontSize: "1.15vw" }}>
              www.ccdesigner.co.uk
            </div>
          </div>
          <div className="rounded-[1.2rem] bg-accent text-primary-dark p-[2.2vh_1.3vw]">
            <div className="font-display font-semibold uppercase tracking-wide" style={{ fontSize: "0.8vw" }}>
              In the app
            </div>
            <div className="font-display font-bold mt-[0.8vh]" style={{ fontSize: "1.15vw" }}>
              Sign in or explore the prototype
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
