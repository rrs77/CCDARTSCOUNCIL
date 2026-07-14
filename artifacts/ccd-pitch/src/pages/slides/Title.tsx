const base = import.meta.env.BASE_URL;

export default function Title() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#002D24]">
      <img
        src={`${base}performing-arts-hero.jpg`}
        crossOrigin="anonymous"
        alt="Young dancers rehearsing on stage"
        className="absolute inset-0 h-full w-full object-cover object-center opacity-45"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#002D24]/92 via-[#002D24]/78 to-[#002D24]/55" />
      <div
        className="absolute -top-[18vh] -left-[8vw] rounded-full"
        style={{
          width: "48vw",
          height: "48vw",
          background: "radial-gradient(circle at center, rgba(182,255,126,0.14), transparent 68%)",
          filter: "blur(3vw)",
        }}
      />

      <div className="relative z-10 flex h-full w-full flex-col justify-between pitch-slide-pad">
        <div
          className="flex items-center gap-[0.85vw] slide-fade-up"
          style={{ ["--slide-stagger" as string]: "0ms" }}
        >
          <img
            src={`${base}cd-logo.svg`}
            crossOrigin="anonymous"
            alt="CCD logo"
            className="h-[2.6vw] w-[2.6vw] min-h-[2rem] min-w-[2rem] max-h-[2.75rem] max-w-[2.75rem]"
          />
          <span className="font-display text-[clamp(0.85rem,1.05vw,1.05rem)] font-semibold tracking-tight text-white">
            Creative Curriculum Designer
          </span>
        </div>

        <div className="max-w-[min(42rem,52vw)]">
          <span
            className="pitch-eyebrow mb-[2vh] inline-block rounded-full border border-white/30 bg-white/15 px-[0.9vw] py-[0.5vh] font-medium uppercase text-white backdrop-blur-sm slide-fade-up"
            style={{ ["--slide-stagger" as string]: "120ms" }}
          >
            Drama · Music · Dance · EYFS to A-level
          </span>

          <h1
            className="pitch-h1 slide-fade-up font-semibold leading-[1.08] tracking-tight text-white"
            style={{
              textWrap: "balance",
              fontFamily: "Inter, system-ui, sans-serif",
              ["--slide-stagger" as string]: "220ms",
            }}
          >
            Exceptional lessons start with{" "}
            <span
              className="italic font-normal"
              style={{ color: "#B6FF7E", fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              connection
            </span>
          </h1>

          <p
            className="pitch-body-lg mt-[2vh] max-w-[min(34rem,40vw)] font-body font-medium leading-snug text-white/90 slide-fade-up"
            style={{ textWrap: "pretty", ["--slide-stagger" as string]: "380ms" }}
          >
            One calm space to map your half-terms, build lessons from a shared library, stack the warm-ups you actually use — and tap into partner expertise from ROH and more.
          </p>
        </div>

        <div
          className="flex items-end justify-between text-white/85 slide-fade-up"
          style={{ ["--slide-stagger" as string]: "520ms" }}
        >
          <span className="pitch-caption font-body uppercase tracking-wide">
            EYFS to A-level
          </span>
          <span className="pitch-caption font-body tracking-wide">creativecurriculumdesigner.com</span>
        </div>
      </div>
    </div>
  );
}
