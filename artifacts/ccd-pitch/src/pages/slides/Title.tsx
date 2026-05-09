const base = import.meta.env.BASE_URL;

export default function Title() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <img
        src={`${base}classroom-hero.png`}
        crossOrigin="anonymous"
        alt="Primary school classroom"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#008272]/85 via-[#0f9d8d]/70 to-[#FF6B6B]/55" />
      <div
        className="absolute -top-[20vh] -right-[10vw] rounded-full"
        style={{
          width: "55vw",
          height: "55vw",
          background: "radial-gradient(circle at center, rgba(255,107,107,0.35), transparent 65%)",
          filter: "blur(4vw)",
        }}
      />

      <div className="relative z-10 h-full w-full flex flex-col justify-between px-[7vw] py-[6vh]">
        <div
          className="flex items-center gap-[1.2vw] slide-fade-up"
          style={{ ['--slide-stagger' as string]: '0ms' }}
        >
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

        <div className="max-w-[70vw]">
          <span
            className="inline-block px-[1.2vw] py-[0.7vh] rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-white font-medium text-[1.05vw] tracking-wide uppercase mb-[3vh] slide-fade-up"
            style={{ ['--slide-stagger' as string]: '120ms' }}
          >
            Live · Tested in classrooms · Drama · Dance · Music — EYFS through KS5
          </span>
          <h1
            className="font-display font-black text-white tracking-tighter leading-[0.95] slide-fade-up"
            style={{ fontSize: "7vw", textWrap: "balance", ['--slide-stagger' as string]: '220ms' }}
          >
            A living home for creative teaching.
          </h1>
          <p
            className="mt-[3vh] text-white/90 font-body font-medium max-w-[55vw] leading-snug slide-fade-up"
            style={{ fontSize: "1.7vw", textWrap: "pretty", ['--slide-stagger' as string]: '380ms' }}
          >
            One calm space where great teaching ideas live, evolve and grow — for every child, every classroom, every season of the year. Built with educators, theatres, orchestras and arts partners shaping it alongside you.
          </p>
        </div>

        <div
          className="flex items-end justify-between text-white/85 slide-fade-up"
          style={{ ['--slide-stagger' as string]: '520ms' }}
        >
          <span className="font-body text-[1.05vw] tracking-wide uppercase">A pitch for schools, arts organisations &amp; universities</span>
          <span className="font-body text-[1.05vw] tracking-wide">creativecurriculumdesigner.com</span>
        </div>
      </div>
    </div>
  );
}
