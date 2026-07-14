export default function ActivityStacks() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="relative z-10 grid h-full w-full grid-cols-12 gap-[2.05vw] px-[5.74vw] py-[6.2vh]">
        <div className="col-span-5 flex flex-col justify-center slide-auto-enter">
          <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[0.82vw] mb-[1.8vh]">
            Feature 03
          </span>
          <h2
            className="font-display font-black text-text tracking-tight leading-[1.02]"
            style={{ fontSize: "3.44vw", textWrap: "balance" }}
          >
            Stack activities like Lego.
          </h2>
          <p
            className="mt-[2.6vh] text-muted font-body leading-relaxed"
            style={{ fontSize: "1.15vw", textWrap: "pretty" }}
          >
            Group your favourite warm-ups, mains and plenaries into reusable stacks. Drop a whole stack into any lesson and adapt as you go.
          </p>

          <div className="mt-[3.5vh] flex flex-col gap-[1.3vh]">
            <div className="flex items-center gap-[0.82vw]">
              <div className="w-[2.13vw] h-[2.13vw] rounded-xl bg-accent/15 flex items-center justify-center text-accent-dark font-display font-bold text-[1.07vw] shrink-0">A</div>
              <span className="font-body text-text text-[0.98vw]">Build once, reuse all year.</span>
            </div>
            <div className="flex items-center gap-[0.82vw]">
              <div className="w-[2.13vw] h-[2.13vw] rounded-xl bg-primary/15 flex items-center justify-center text-primary-dark font-display font-bold text-[1.07vw] shrink-0">B</div>
              <span className="font-body text-text text-[0.98vw]">Share stacks across the team.</span>
            </div>
            <div className="flex items-center gap-[0.82vw]">
              <div className="w-[2.13vw] h-[2.13vw] rounded-xl bg-accent/15 flex items-center justify-center text-accent-dark font-display font-bold text-[1.07vw] shrink-0">C</div>
              <span className="font-body text-text text-[0.98vw]">Drag straight into lesson plans.</span>
            </div>
          </div>
        </div>

        <div className="col-span-7 flex items-center">
          <div className="grid w-full grid-cols-2 gap-[1.23vw]">
            <div className="stack-panel-drop rounded-[1.5rem] bg-surface shadow-[0_12px_40px_rgba(0,76,69,0.1)] p-[2.2vh_1.31vw] border border-text/5">
              <div className="mb-[1.3vh] flex items-center justify-between">
                <span className="font-display font-bold text-text text-[1.07vw]">Drama &middot; Storytelling</span>
                <span className="px-[0.49vw] py-[0.2vh] rounded-full bg-[#FFE5D6] text-[#A24A1A] font-display font-semibold text-[0.70vw]">5 items</span>
              </div>
              <div className="stack-drop-column flex flex-col gap-[0.9vh]">
                <div
                  className="stack-item-drop rounded-[0.8rem] bg-[#FFE5D6]/60 border border-[#FFB07A]/40 p-[0.9vh_0.74vw] font-body text-text text-[0.86vw]"
                  style={{ ["--stack-drop-delay" as string]: "280ms" }}
                >
                  Mirror game warm-up
                </div>
                <div
                  className="stack-item-drop rounded-[0.8rem] bg-[#FFE5D6]/60 border border-[#FFB07A]/40 p-[0.9vh_0.74vw] font-body text-text text-[0.86vw]"
                  style={{ ["--stack-drop-delay" as string]: "430ms" }}
                >
                  Story circle &amp; offers
                </div>
                <div
                  className="stack-item-drop rounded-[0.8rem] bg-[#FFE5D6]/60 border border-[#FFB07A]/40 p-[0.9vh_0.74vw] font-body text-text text-[0.86vw]"
                  style={{ ["--stack-drop-delay" as string]: "580ms" }}
                >
                  Character hot-seating
                </div>
                <div
                  className="stack-item-drop rounded-[0.8rem] bg-[#FFE5D6]/60 border border-[#FFB07A]/40 p-[0.9vh_0.74vw] font-body text-text text-[0.86vw]"
                  style={{ ["--stack-drop-delay" as string]: "730ms" }}
                >
                  Freeze-frame moments
                </div>
                <div
                  className="stack-item-drop rounded-[0.8rem] bg-[#FFE5D6]/60 border border-[#FFB07A]/40 p-[0.9vh_0.74vw] font-body text-text text-[0.86vw]"
                  style={{ ["--stack-drop-delay" as string]: "880ms" }}
                >
                  Audience feedback circle
                </div>
              </div>
            </div>

            <div className="stack-panel-drop rounded-[1.5rem] bg-surface shadow-[0_12px_40px_rgba(0,76,69,0.1)] p-[2.2vh_1.31vw] border border-text/5">
              <div className="mb-[1.3vh] flex items-center justify-between">
                <span className="font-display font-bold text-text text-[1.07vw]">Music &middot; Rhythm &amp; voice</span>
                <span className="px-[0.49vw] py-[0.2vh] rounded-full bg-[#D6E8F2] text-[#0A4A66] font-display font-semibold text-[0.70vw]">4 items</span>
              </div>
              <div className="stack-drop-column flex flex-col gap-[0.9vh]">
                <div
                  className="stack-item-drop rounded-[0.8rem] bg-[#D6E8F2]/60 border border-[#0EA4D4]/30 p-[0.9vh_0.74vw] font-body text-text text-[0.86vw]"
                  style={{ ["--stack-drop-delay" as string]: "380ms" }}
                >
                  Body-percussion warm-up
                </div>
                <div
                  className="stack-item-drop rounded-[0.8rem] bg-[#D6E8F2]/60 border border-[#0EA4D4]/30 p-[0.9vh_0.74vw] font-body text-text text-[0.86vw]"
                  style={{ ["--stack-drop-delay" as string]: "530ms" }}
                >
                  Active listening: West Africa
                </div>
                <div
                  className="stack-item-drop rounded-[0.8rem] bg-[#D6E8F2]/60 border border-[#0EA4D4]/30 p-[0.9vh_0.74vw] font-body text-text text-[0.86vw]"
                  style={{ ["--stack-drop-delay" as string]: "680ms" }}
                >
                  Call-and-response clapping
                </div>
                <div
                  className="stack-item-drop rounded-[0.8rem] bg-[#D6E8F2]/60 border border-[#0EA4D4]/30 p-[0.9vh_0.74vw] font-body text-text text-[0.86vw]"
                  style={{ ["--stack-drop-delay" as string]: "830ms" }}
                >
                  Sing &amp; sign reflection
                </div>
                <div
                  className="stack-item-drop rounded-[0.8rem] border-2 border-dashed border-text/20 p-[0.9vh_0.74vw] font-body text-muted text-[0.86vw] text-center"
                  style={{ ["--stack-drop-delay" as string]: "980ms" }}
                >
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
