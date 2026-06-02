export default function Solution() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-primary-dark">
      <div
        className="absolute top-0 right-0 rounded-full"
        style={{
          width: "60vw",
          height: "60vw",
          transform: "translate(20%, -30%)",
          background: "radial-gradient(circle at center, rgba(255,107,107,0.35), transparent 65%)",
          filter: "blur(2vw)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "5vw 5vw",
        }}
      />

      <div className="relative z-10 h-full w-full flex flex-col justify-center px-[7vw] py-[7vh] slide-auto-enter">
        <div className="max-w-[80vw]">
          <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[1vw] mb-[3vh]">
            The solution
          </span>
          <h2
            className="font-display font-black text-white tracking-tight leading-[1.02]"
            style={{ fontSize: "5.2vw", textWrap: "balance" }}
          >
            One calm space for drama, music and dance.
          </h2>
          <p
            className="mt-[2.5vh] text-white/75 font-body max-w-[60vw] leading-snug"
            style={{ fontSize: "1.6vw", textWrap: "pretty" }}
          >
            Creative Curriculum Designer brings planning, teaching and reusable resources into one workspace — purpose-built for performing arts from EYFS to A-level.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-[2vw] mt-[6vh]">
          <div className="rounded-[1.5rem] bg-white/8 border border-white/15 backdrop-blur-sm p-[2.8vh_2vw]">
            <div className="w-[3.5vw] h-[3.5vw] rounded-2xl bg-accent flex items-center justify-center mb-[2vh]">
              <span className="font-display font-black text-white text-[1.8vw]">1</span>
            </div>
            <h3 className="font-display font-bold text-white text-[1.7vw] leading-tight">Half-term planner</h3>
            <p className="mt-[1vh] text-white/70 font-body text-[1.15vw] leading-snug">
              See six half-terms at a glance. Drag, reorder, and shape the year before the year begins.
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white/8 border border-white/15 backdrop-blur-sm p-[2.8vh_2vw]">
            <div className="w-[3.5vw] h-[3.5vw] rounded-2xl bg-primary flex items-center justify-center mb-[2vh]">
              <span className="font-display font-black text-white text-[1.8vw]">2</span>
            </div>
            <h3 className="font-display font-bold text-white text-[1.7vw] leading-tight">Lesson library</h3>
            <p className="mt-[1vh] text-white/70 font-body text-[1.15vw] leading-snug">
              Build, reuse and share lessons. Browse partner packs and sell your own activity packs to other teachers.
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white/8 border border-white/15 backdrop-blur-sm p-[2.8vh_2vw]">
            <div className="w-[3.5vw] h-[3.5vw] rounded-2xl bg-accent flex items-center justify-center mb-[2vh]">
              <span className="font-display font-black text-white text-[1.8vw]">3</span>
            </div>
            <h3 className="font-display font-bold text-white text-[1.7vw] leading-tight">Activity stacks</h3>
            <p className="mt-[1vh] text-white/70 font-body text-[1.15vw] leading-snug">
              Group warm-ups, mains and plenaries into reusable stacks. Drop them straight into any lesson.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
