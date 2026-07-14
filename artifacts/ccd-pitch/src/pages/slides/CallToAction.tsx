const base = import.meta.env.BASE_URL;

export default function CallToAction() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-primary-dark">
      <div
        className="absolute -bottom-[30vh] -right-[20vw] rounded-full"
        style={{
          width: "70vw",
          height: "70vw",
          background: "radial-gradient(circle at center, rgba(255,107,107,0.45), transparent 65%)",
          filter: "blur(4vw)",
        }}
      />
      <div
        className="absolute -top-[20vh] -left-[15vw] rounded-full"
        style={{
          width: "55vw",
          height: "55vw",
          background: "radial-gradient(circle at center, rgba(20,184,166,0.35), transparent 65%)",
          filter: "blur(4vw)",
        }}
      />

      <div className="relative z-10 h-full w-full flex flex-col justify-between pitch-slide-pad slide-auto-enter">
        <div className="flex items-center gap-[0.98vw]">
          <img
            src={`${base}cd-logo.svg`}
            crossOrigin="anonymous"
            alt="CCD logo"
            className="w-[2.95vw] h-[2.95vw]"
          />
          <span className="text-white font-display font-semibold tracking-tight text-[clamp(0.85rem,1.05vw,1.05rem)]">
            Creative Curriculum Designer
          </span>
        </div>

        <div className="max-w-[50.43vw]">
          <span className="pitch-eyebrow inline-block px-[0.98vw] py-[0.6vh] rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-white font-medium uppercase mb-[2.6vh]">
            EYFS to A-level · Try it with your school
          </span>
          <h1
            className="pitch-h1 font-display font-black text-white tracking-tighter leading-[0.95]"
            style={{ textWrap: "balance" }}
          >
            Give your team back
            <span className="block text-accent">their planning hours.</span>
          </h1>
          <p
            className="pitch-body-lg mt-[2.6vh] text-white/85 font-body font-medium max-w-[36.98vw] leading-snug" style={{textWrap: "pretty"}}>
            Bring CCD into your school for a half-term trial. We'll set up your year groups, import your existing units, and walk your team through it.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-[1.64vw]">
          <div className="rounded-[1.5rem] bg-white/8 border border-white/15 backdrop-blur-sm p-[2.1vh_1.31vw]">
            <div className="font-display font-semibold text-accent text-[0.82vw] uppercase tracking-wide mb-[0.9vh]">Visit</div>
            <div className="pitch-h3 font-display font-bold text-white leading-tight">creativecurriculumdesigner.com</div>
          </div>
          <div className="rounded-[1.5rem] bg-white/8 border border-white/15 backdrop-blur-sm p-[2.1vh_1.31vw]">
            <div className="font-display font-semibold text-accent text-[0.82vw] uppercase tracking-wide mb-[0.9vh]">Email</div>
            <div className="pitch-h3 font-display font-bold text-white leading-tight">hello@creativecurriculumdesigner.com</div>
          </div>
          <div className="rounded-[1.5rem] bg-accent text-white p-[2.1vh_1.31vw]">
            <div className="font-display font-semibold text-white/90 text-[0.82vw] uppercase tracking-wide mb-[0.9vh]">Book a demo</div>
            <div className="pitch-h3 font-display font-bold text-white leading-tight">30-minute walk-through with your year leads</div>
          </div>
        </div>
      </div>
    </div>
  );
}
