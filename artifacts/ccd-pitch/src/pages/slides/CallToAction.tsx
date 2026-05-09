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

      <div className="relative z-10 h-full w-full flex flex-col justify-between px-[7vw] py-[7vh] slide-auto-enter">
        <div className="flex items-center gap-[1.2vw]">
          <img
            src={`${base}cd-logo.svg`}
            crossOrigin="anonymous"
            alt="CCD logo"
            className="w-[3.6vw] h-[3.6vw]"
          />
          <span className="text-white font-display font-semibold tracking-tight text-[1.6vw]">
            Creative Curriculum Designer
          </span>
        </div>

        <div className="max-w-[75vw]">
          <span className="inline-block px-[1.2vw] py-[0.7vh] rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-white font-medium text-[1.05vw] tracking-wide uppercase mb-[3vh]">
            Try it with your school, department or arts organisation
          </span>
          <h1
            className="font-display font-black text-white tracking-tighter leading-[0.95]"
            style={{ fontSize: "6.5vw", textWrap: "balance" }}
          >
            Grow your creative
            <span className="block text-accent">practice — together.</span>
          </h1>
          <p
            className="mt-[3vh] text-white/85 font-body font-medium max-w-[55vw] leading-snug"
            style={{ fontSize: "1.6vw", textWrap: "pretty" }}
          >
            Bring CCD into your school, department or arts organisation for a half-term trial. We'll set up your year groups and stages, import your existing units, and walk your team through how to contribute to — and draw from — the wider creative community.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-[2vw]">
          <div className="rounded-[1.5rem] bg-white/8 border border-white/15 backdrop-blur-sm p-[2.4vh_1.6vw]">
            <div className="font-display font-semibold text-accent text-[1vw] uppercase tracking-wide mb-[1vh]">Visit</div>
            <div className="font-display font-bold text-white text-[1.4vw] leading-tight">creativecurriculumdesigner.com</div>
          </div>
          <div className="rounded-[1.5rem] bg-white/8 border border-white/15 backdrop-blur-sm p-[2.4vh_1.6vw]">
            <div className="font-display font-semibold text-accent text-[1vw] uppercase tracking-wide mb-[1vh]">Email</div>
            <div className="font-display font-bold text-white text-[1.4vw] leading-tight">hello@creativecurriculumdesigner.com</div>
          </div>
          <div className="rounded-[1.5rem] bg-accent text-white p-[2.4vh_1.6vw]">
            <div className="font-display font-semibold text-white/90 text-[1vw] uppercase tracking-wide mb-[1vh]">Book a demo</div>
            <div className="font-display font-bold text-white text-[1.4vw] leading-tight">30-minute walk-through with your team or partners</div>
          </div>
        </div>
      </div>
    </div>
  );
}
