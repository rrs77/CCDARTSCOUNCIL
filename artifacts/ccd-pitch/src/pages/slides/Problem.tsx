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

      <div className="relative z-10 h-full w-full grid grid-cols-12 gap-[2vw] px-[7vw] py-[7vh] slide-auto-enter">
        <div className="col-span-5 flex flex-col justify-between">
          <div>
            <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[1vw] mb-[3vh]">
              The problem
            </span>
            <h2
              className="font-display font-black text-text tracking-tight leading-[1.02]"
              style={{ fontSize: "4.6vw", textWrap: "balance" }}
            >
              Arts teachers are working alone.
            </h2>
            <p
              className="mt-[3vh] text-muted font-body leading-relaxed"
              style={{ fontSize: "1.5vw", textWrap: "pretty" }}
            >
              Drama, dance and music teachers stitch a year together from PDFs, shared drives, photocopied schemes and last year's tabs — often as the only specialist in the building. Great practice gets lost; non-specialists are left guessing.
            </p>
          </div>

          <div className="flex items-center gap-[1.5vw] pt-[3vh] border-t border-text/10">
            <div className="font-display font-black text-primary-dark leading-none" style={{ fontSize: "5vw" }}>
              5+
            </div>
            <span className="text-muted font-body text-[1.2vw] leading-snug max-w-[14vw]">
              hours a week the average teacher spends planning outside of class — most of it reinventing what someone, somewhere has already made.
            </span>
          </div>
        </div>

        <div className="col-span-7 flex flex-col justify-center gap-[2vh]">
          <div className="rounded-[1.5rem] bg-surface shadow-[0_8px_32px_rgba(0,76,69,0.08)] p-[2.5vh_2.5vw] flex items-start gap-[1.5vw]">
            <div className="w-[3vw] h-[3vw] rounded-2xl bg-accent/15 text-accent flex items-center justify-center font-display font-bold text-[1.6vw] shrink-0">
              01
            </div>
            <div>
              <h3 className="font-display font-bold text-text text-[1.6vw] leading-tight">Practice lives in too many places</h3>
              <p className="mt-[0.8vh] text-muted font-body text-[1.2vw] leading-snug">
                Schemes in folders, rehearsal notes on a phone, warm-ups in a notebook. Nothing connects, nothing carries forward.
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-surface shadow-[0_8px_32px_rgba(0,76,69,0.08)] p-[2.5vh_2.5vw] flex items-start gap-[1.5vw]">
            <div className="w-[3vw] h-[3vw] rounded-2xl bg-primary/15 text-primary-dark flex items-center justify-center font-display font-bold text-[1.6vw] shrink-0">
              02
            </div>
            <div>
              <h3 className="font-display font-bold text-text text-[1.6vw] leading-tight">The bigger arc is invisible</h3>
              <p className="mt-[0.8vh] text-muted font-body text-[1.2vw] leading-snug">
                It's hard to see how a term, a key stage, or a whole creative journey fits together — let alone shape it without starting over.
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-surface shadow-[0_8px_32px_rgba(0,76,69,0.08)] p-[2.5vh_2.5vw] flex items-start gap-[1.5vw]">
            <div className="w-[3vw] h-[3vw] rounded-2xl bg-accent/15 text-accent flex items-center justify-center font-display font-bold text-[1.6vw] shrink-0">
              03
            </div>
            <div>
              <h3 className="font-display font-bold text-text text-[1.6vw] leading-tight">Creative practice gets lost</h3>
              <p className="mt-[0.8vh] text-muted font-body text-[1.2vw] leading-snug">
                Teaching is creative work — but the warm-up that worked, the rehearsal that landed, the unit a colleague nailed disappear into forgotten documents by July, learned again the hard way next September.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
