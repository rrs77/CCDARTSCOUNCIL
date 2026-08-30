export default function WhyNow() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div
        className="absolute -top-[20vh] -right-[10vw] rounded-full"
        style={{
          width: "55vw",
          height: "55vw",
          background:
            "radial-gradient(circle at center, rgba(255,107,107,0.18), transparent 65%)",
          filter: "blur(3vw)",
        }}
      />

      <div className="relative z-10 h-full w-full grid grid-cols-12 gap-[2vw] px-[7vw] py-[7vh] slide-auto-enter">
        <div className="col-span-6 flex flex-col justify-between">
          <div>
            <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[1vw] mb-[3vh]">
              Why now &middot; the case for the arts
            </span>
            <h2
              className="font-display font-black text-text tracking-tight leading-[1.02]"
              style={{ fontSize: "4.4vw", textWrap: "balance" }}
            >
              The arts in higher education are at a{" "}
              <span className="text-accent">tipping point</span>.
            </h2>
            <p
              className="mt-[3vh] text-muted font-body leading-relaxed"
              style={{ fontSize: "1.4vw", textWrap: "pretty" }}
            >
              Drama, music and dance courses at UK universities are being merged, paused and closed. The pipeline that feeds the West End, our orchestras, our touring dance companies — and every primary classroom that sings — starts in the schools we teach in today. If the practice we share now is thin, the cohort that arrives at university in five years will be too.
            </p>
          </div>

          <div className="pt-[3vh] border-t border-text/10">
            <p className="font-display font-semibold text-primary-dark text-[1.4vw] leading-snug max-w-[32vw]">
              "We don't get a second chance at a generation of artists."
            </p>
          </div>
        </div>

        <div className="col-span-6 grid grid-cols-2 grid-rows-2 gap-[1.4vw]">
          <div className="rounded-[1.5rem] bg-surface shadow-[0_8px_32px_rgba(0,76,69,0.08)] p-[2.6vh_1.8vw] flex flex-col justify-between">
            <div className="font-display font-black text-accent leading-none" style={{ fontSize: "4.6vw" }}>
              49
            </div>
            <div className="text-muted font-body text-[1.05vw] leading-snug">
              UK universities have closed, merged or paused arts &amp; humanities courses since 2023.
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-primary-dark text-white p-[2.6vh_1.8vw] flex flex-col justify-between">
            <div className="font-display font-black leading-none" style={{ fontSize: "4.6vw" }}>
              -47%
            </div>
            <div className="text-white/80 font-body text-[1.05vw] leading-snug">
              fall in arts GCSE entries since the EBacc was introduced.
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-surface shadow-[0_8px_32px_rgba(0,76,69,0.08)] p-[2.6vh_1.8vw] flex flex-col justify-between">
            <div className="font-display font-black text-primary-dark leading-none" style={{ fontSize: "4.6vw" }}>
              1 in 8
            </div>
            <div className="text-muted font-body text-[1.05vw] leading-snug">
              state primaries have no specialist music or drama provision at all.
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-accent text-white p-[2.6vh_1.8vw] flex flex-col justify-between">
            <div className="font-display font-black leading-none" style={{ fontSize: "4.6vw" }}>
              £126b
            </div>
            <div className="text-white/85 font-body text-[1.05vw] leading-snug">
              the UK creative industries — built on the artists our classrooms shape.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
