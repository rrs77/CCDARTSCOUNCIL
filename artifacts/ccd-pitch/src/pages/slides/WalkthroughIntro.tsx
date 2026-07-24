/**
 * Slide 1 — Context / connection / brief prototype intro.
 * Forest + lime CCD brand field with circle lockup cue.
 */
export default function WalkthroughIntro() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-primary-dark">
      <div
        className="absolute -top-[20vh] -right-[10vw] rounded-full"
        style={{
          width: "55vw",
          height: "55vw",
          background: "radial-gradient(circle at center, rgba(182,255,126,0.22), transparent 65%)",
          filter: "blur(4vw)",
        }}
      />
      <div
        className="absolute -bottom-[25vh] -left-[15vw] rounded-full"
        style={{
          width: "50vw",
          height: "50vw",
          background: "radial-gradient(circle at center, rgba(20,184,166,0.28), transparent 65%)",
          filter: "blur(4vw)",
        }}
      />

      <div className="relative z-10 h-full w-full flex flex-col justify-center px-[8vw] py-[8vh] slide-auto-enter">
        <div className="flex items-center gap-[1.2vw] mb-[3vh]">
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
        </div>

        <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[2vh]">
          Prototype · partners &amp; funding
        </span>
        <h1
          className="font-display font-black text-white tracking-tight leading-[1.02] max-w-[70vw]"
          style={{ fontSize: "4.6vw", textWrap: "balance" }}
        >
          One living home for{" "}
          <span className="text-accent">creative teaching</span>
          <span className="text-white/90"> — connected to the sector.</span>
        </h1>
        <p
          className="mt-[3vh] text-white/80 font-body leading-relaxed max-w-[48vw]"
          style={{ fontSize: "1.4vw", textWrap: "pretty" }}
        >
          A short tour of Partner Hubs, planning, key dates, paid partners, and how schools and arts
          organisations work together inside CCDesigner.
        </p>
      </div>
    </div>
  );
}
