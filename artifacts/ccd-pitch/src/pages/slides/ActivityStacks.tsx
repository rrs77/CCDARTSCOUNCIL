export default function ActivityStacks() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="relative z-10 h-full w-full grid grid-cols-12 gap-[2.5vw] px-[7vw] py-[7vh]">
        <div className="col-span-5 flex flex-col justify-center">
          <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[1vw] mb-[2vh]">
            Feature 03
          </span>
          <h2
            className="font-display font-black text-text tracking-tight leading-[1.02]"
            style={{ fontSize: "4.2vw", textWrap: "balance" }}
          >
            Stack activities like Lego.
          </h2>
          <p
            className="mt-[3vh] text-muted font-body leading-relaxed"
            style={{ fontSize: "1.4vw", textWrap: "pretty" }}
          >
            Group your favourite warm-ups, mains and plenaries into reusable stacks. Drop a whole stack into any lesson and adapt as you go.
          </p>

          <div className="mt-[4vh] flex flex-col gap-[1.5vh]">
            <div className="flex items-center gap-[1vw]">
              <div className="w-[2.6vw] h-[2.6vw] rounded-xl bg-accent/15 flex items-center justify-center text-accent-dark font-display font-bold text-[1.3vw] shrink-0">A</div>
              <span className="font-body text-text text-[1.2vw]">Build once, reuse all year.</span>
            </div>
            <div className="flex items-center gap-[1vw]">
              <div className="w-[2.6vw] h-[2.6vw] rounded-xl bg-primary/15 flex items-center justify-center text-primary-dark font-display font-bold text-[1.3vw] shrink-0">B</div>
              <span className="font-body text-text text-[1.2vw]">Share stacks across the team.</span>
            </div>
            <div className="flex items-center gap-[1vw]">
              <div className="w-[2.6vw] h-[2.6vw] rounded-xl bg-accent/15 flex items-center justify-center text-accent-dark font-display font-bold text-[1.3vw] shrink-0">C</div>
              <span className="font-body text-text text-[1.2vw]">Drag straight into lesson plans.</span>
            </div>
          </div>
        </div>

        <div className="col-span-7 flex items-center">
          <div className="w-full grid grid-cols-2 gap-[1.5vw]">
            <div className="rounded-[1.5rem] bg-surface shadow-[0_12px_40px_rgba(0,76,69,0.1)] p-[2.5vh_1.6vw] border border-text/5">
              <div className="flex items-center justify-between mb-[1.5vh]">
                <span className="font-display font-bold text-text text-[1.3vw]">Warm-up stack</span>
                <span className="px-[0.6vw] py-[0.2vh] rounded-full bg-primary/15 text-primary-dark font-display font-semibold text-[0.85vw]">5 items</span>
              </div>
              <div className="flex flex-col gap-[1vh]">
                <div className="rounded-[0.8rem] bg-primary/10 border border-primary/20 p-[1vh_0.9vw] font-body text-text text-[1.05vw]">
                  Walk &amp; freeze
                </div>
                <div className="rounded-[0.8rem] bg-primary/10 border border-primary/20 p-[1vh_0.9vw] font-body text-text text-[1.05vw]">
                  Pass the clap
                </div>
                <div className="rounded-[0.8rem] bg-primary/10 border border-primary/20 p-[1vh_0.9vw] font-body text-text text-[1.05vw]">
                  Mirror partners
                </div>
                <div className="rounded-[0.8rem] bg-primary/10 border border-primary/20 p-[1vh_0.9vw] font-body text-text text-[1.05vw]">
                  Zip zap boing
                </div>
                <div className="rounded-[0.8rem] bg-primary/10 border border-primary/20 p-[1vh_0.9vw] font-body text-text text-[1.05vw]">
                  Status walks
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-surface shadow-[0_12px_40px_rgba(0,76,69,0.1)] p-[2.5vh_1.6vw] border border-text/5">
              <div className="flex items-center justify-between mb-[1.5vh]">
                <span className="font-display font-bold text-text text-[1.3vw]">Storytelling stack</span>
                <span className="px-[0.6vw] py-[0.2vh] rounded-full bg-accent/15 text-accent-dark font-display font-semibold text-[0.85vw]">4 items</span>
              </div>
              <div className="flex flex-col gap-[1vh]">
                <div className="rounded-[0.8rem] bg-accent/10 border border-accent/20 p-[1vh_0.9vw] font-body text-text text-[1.05vw]">
                  Story circle
                </div>
                <div className="rounded-[0.8rem] bg-accent/10 border border-accent/20 p-[1vh_0.9vw] font-body text-text text-[1.05vw]">
                  Character hot-seating
                </div>
                <div className="rounded-[0.8rem] bg-accent/10 border border-accent/20 p-[1vh_0.9vw] font-body text-text text-[1.05vw]">
                  Freeze-frame moments
                </div>
                <div className="rounded-[0.8rem] bg-accent/10 border border-accent/20 p-[1vh_0.9vw] font-body text-text text-[1.05vw]">
                  Reflective sharing
                </div>
                <div className="rounded-[0.8rem] border-2 border-dashed border-text/20 p-[1vh_0.9vw] font-body text-muted text-[1.05vw] text-center">
                  Drop activity here
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
