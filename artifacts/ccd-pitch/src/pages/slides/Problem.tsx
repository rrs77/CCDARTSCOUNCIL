export default function Problem() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div
        className="absolute -top-[15vh] -left-[10vw] rounded-full"
        style={{
          width: "45vw",
          height: "45vw",
          background: "radial-gradient(circle at center, rgba(255,107,107,0.18), transparent 65%)",
          filter: "blur(3vw)",
        }}
      />

      <div className="relative z-10 h-full w-full grid grid-cols-12 gap-[1.64vw] pitch-slide-pad slide-auto-enter">
        <div className="col-span-5 flex flex-col justify-between">
          <div>
            <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[2.6vh]">
              The problem
            </span>
            <h2
              className="pitch-h2 font-display font-black text-text tracking-tight leading-[1.02]" style={{textWrap: "balance"}}>
              Lesson planning is fragmented.
            </h2>
            <p
              className="pitch-body-lg mt-[2.6vh] text-muted font-body leading-relaxed" style={{textWrap: "pretty"}}>
              Teachers stitch a year together from PDFs, shared drives, photocopied schemes and last year's tabs. The plan lives everywhere except where they need it.
            </p>
          </div>

          <div className="flex items-center gap-[1.23vw] pt-[2.6vh] border-t border-text/10">
            <div className="pitch-stat font-display font-black text-primary-dark leading-none" style={{ fontSize: "clamp(2rem, 3.2vw, 2.75rem)" }}>
              5+
            </div>
            <span className="pitch-body text-muted font-body leading-snug max-w-[9.41vw]">
              hours a week the average teacher spends planning outside of class.
            </span>
          </div>
        </div>

        <div className="col-span-7 flex flex-col justify-center gap-[1.8vh]">
          <div className="rounded-[1.5rem] bg-surface shadow-[0_8px_32px_rgba(0,76,69,0.08)] p-[2.2vh_2.05vw] flex items-start gap-[1.23vw]">
            <div className="w-[2.46vw] h-[2.46vw] rounded-2xl bg-accent/15 text-accent flex items-center justify-center font-display font-bold text-[1.31vw] shrink-0">
              01
            </div>
            <div>
              <h3 className="pitch-h3 font-display font-bold text-text leading-tight">Plans live in too many places</h3>
              <p className="pitch-body mt-[0.7vh] text-muted font-body leading-snug">
                Schemes of work in folders, slides in shared drives, activities in printouts. Nothing connects.
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-surface shadow-[0_8px_32px_rgba(0,76,69,0.08)] p-[2.2vh_2.05vw] flex items-start gap-[1.23vw]">
            <div className="w-[2.46vw] h-[2.46vw] rounded-2xl bg-primary/15 text-primary-dark flex items-center justify-center font-display font-bold text-[1.31vw] shrink-0">
              02
            </div>
            <div>
              <h3 className="pitch-h3 font-display font-bold text-text leading-tight">Half-term overview is invisible</h3>
              <p className="pitch-body mt-[0.7vh] text-muted font-body leading-snug">
                It's hard to see the whole arc of a term, let alone tweak it without rebuilding from scratch.
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-surface shadow-[0_8px_32px_rgba(0,76,69,0.08)] p-[2.2vh_2.05vw] flex items-start gap-[1.23vw]">
            <div className="w-[2.46vw] h-[2.46vw] rounded-2xl bg-accent/15 text-accent flex items-center justify-center font-display font-bold text-[1.31vw] shrink-0">
              03
            </div>
            <div>
              <h3 className="pitch-h3 font-display font-bold text-text leading-tight">Good activities get lost</h3>
              <p className="pitch-body mt-[0.7vh] text-muted font-body leading-snug">
                The warm-up that worked, the role-play that landed — they vanish into a notebook by July.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
