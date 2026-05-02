export default function HalfTermPlanner() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="relative z-10 h-full w-full grid grid-cols-12 gap-[2.5vw] px-[7vw] py-[7vh]">
        <div className="col-span-5 flex flex-col justify-center">
          <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[1vw] mb-[2vh]">
            Feature 01
          </span>
          <h2
            className="font-display font-black text-text tracking-tight leading-[1.02]"
            style={{ fontSize: "4.2vw", textWrap: "balance" }}
          >
            See your year in six half-terms.
          </h2>
          <p
            className="mt-[3vh] text-muted font-body leading-relaxed"
            style={{ fontSize: "1.4vw", textWrap: "pretty" }}
          >
            A clean overview of the whole academic year. Track progress, spot gaps, and reshape a half-term in a click.
          </p>

          <div className="mt-[4vh] flex flex-col gap-[1.5vh]">
            <div className="flex items-start gap-[1vw]">
              <div className="w-[0.4vw] h-[2.4vw] rounded-full bg-accent shrink-0 mt-[0.4vh]" />
              <div>
                <h4 className="font-display font-bold text-text text-[1.3vw] leading-tight">Six color-coded terms</h4>
                <p className="text-muted font-body text-[1.05vw] leading-snug">Autumn 1 through Summer 2 in one view.</p>
              </div>
            </div>
            <div className="flex items-start gap-[1vw]">
              <div className="w-[0.4vw] h-[2.4vw] rounded-full bg-primary shrink-0 mt-[0.4vh]" />
              <div>
                <h4 className="font-display font-bold text-text text-[1.3vw] leading-tight">Live lesson counts</h4>
                <p className="text-muted font-body text-[1.05vw] leading-snug">Know what's planned and what's empty at a glance.</p>
              </div>
            </div>
            <div className="flex items-start gap-[1vw]">
              <div className="w-[0.4vw] h-[2.4vw] rounded-full bg-accent shrink-0 mt-[0.4vh]" />
              <div>
                <h4 className="font-display font-bold text-text text-[1.3vw] leading-tight">Drag to reorder</h4>
                <p className="text-muted font-body text-[1.05vw] leading-snug">Move a unit, copy a term, adjust the arc.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-7 flex items-center">
          <div className="w-full rounded-[1.5rem] bg-surface shadow-[0_20px_60px_rgba(0,76,69,0.12)] p-[2.5vw] border border-text/5">
            <div className="flex items-center justify-between mb-[2vh]">
              <span className="font-display font-bold text-text text-[1.4vw]">Year 4 &middot; Music</span>
              <span className="font-body text-muted text-[1vw]">2025–26 academic year</span>
            </div>

            <div className="grid grid-cols-3 grid-rows-2 gap-[1.2vw]">
              <div className="rounded-[1rem] p-[1.6vh_1vw] bg-[#FFE5D6] border border-[#FFB07A]/40">
                <div className="font-display font-bold text-[#A24A1A] text-[1.1vw]">Autumn 1</div>
                <div className="text-[#A24A1A]/80 font-body text-[0.85vw] mt-[0.4vh]">Sep–Oct</div>
                <div className="font-display font-black text-[#A24A1A] text-[2.2vw] mt-[1vh] leading-none">6</div>
                <div className="text-[#A24A1A]/80 font-body text-[0.85vw] mt-[0.3vh]">lessons planned</div>
              </div>
              <div className="rounded-[1rem] p-[1.6vh_1vw] bg-[#FFD6D6] border border-[#FF8A8A]/40">
                <div className="font-display font-bold text-[#9A2F2F] text-[1.1vw]">Autumn 2</div>
                <div className="text-[#9A2F2F]/80 font-body text-[0.85vw] mt-[0.4vh]">Nov–Dec</div>
                <div className="font-display font-black text-[#9A2F2F] text-[2.2vw] mt-[1vh] leading-none">7</div>
                <div className="text-[#9A2F2F]/80 font-body text-[0.85vw] mt-[0.3vh]">lessons planned</div>
              </div>
              <div className="rounded-[1rem] p-[1.6vh_1vw] bg-[#D6F2EE] border border-[#14B8A6]/30">
                <div className="font-display font-bold text-[#004C45] text-[1.1vw]">Spring 1</div>
                <div className="text-[#004C45]/80 font-body text-[0.85vw] mt-[0.4vh]">Jan–Feb</div>
                <div className="font-display font-black text-[#004C45] text-[2.2vw] mt-[1vh] leading-none">5</div>
                <div className="text-[#004C45]/80 font-body text-[0.85vw] mt-[0.3vh]">lessons planned</div>
              </div>
              <div className="rounded-[1rem] p-[1.6vh_1vw] bg-[#D6E8F2] border border-[#0EA4D4]/30">
                <div className="font-display font-bold text-[#0A4A66] text-[1.1vw]">Spring 2</div>
                <div className="text-[#0A4A66]/80 font-body text-[0.85vw] mt-[0.4vh]">Mar–Apr</div>
                <div className="font-display font-black text-[#0A4A66] text-[2.2vw] mt-[1vh] leading-none">6</div>
                <div className="text-[#0A4A66]/80 font-body text-[0.85vw] mt-[0.3vh]">lessons planned</div>
              </div>
              <div className="rounded-[1rem] p-[1.6vh_1vw] bg-[#FFF1D6] border border-[#F0B400]/30">
                <div className="font-display font-bold text-[#7A5500] text-[1.1vw]">Summer 1</div>
                <div className="text-[#7A5500]/80 font-body text-[0.85vw] mt-[0.4vh]">Apr–May</div>
                <div className="font-display font-black text-[#7A5500] text-[2.2vw] mt-[1vh] leading-none">4</div>
                <div className="text-[#7A5500]/80 font-body text-[0.85vw] mt-[0.3vh]">lessons planned</div>
              </div>
              <div className="rounded-[1rem] p-[1.6vh_1vw] bg-[#E8E2F2] border border-[#7C6BF0]/30">
                <div className="font-display font-bold text-[#3D2F7A] text-[1.1vw]">Summer 2</div>
                <div className="text-[#3D2F7A]/80 font-body text-[0.85vw] mt-[0.4vh]">Jun–Jul</div>
                <div className="font-display font-black text-[#3D2F7A] text-[2.2vw] mt-[1vh] leading-none">3</div>
                <div className="text-[#3D2F7A]/80 font-body text-[0.85vw] mt-[0.3vh]">in draft</div>
              </div>
            </div>

            <div className="mt-[2.5vh] pt-[2vh] border-t border-text/10 flex items-center justify-between">
              <span className="font-body text-muted text-[1vw]">31 lessons across the year</span>
              <span className="font-display font-semibold text-primary-dark text-[1vw]">86% complete</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
