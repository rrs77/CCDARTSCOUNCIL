export default function LessonPlannerCalendar() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div
        className="absolute top-0 right-0 rounded-full"
        style={{
          width: "45vw",
          height: "45vw",
          transform: "translate(25%, -30%)",
          background: "radial-gradient(circle at center, rgba(20,184,166,0.18), transparent 65%)",
          filter: "blur(3vw)",
        }}
      />

      <div className="relative z-10 h-full w-full grid grid-cols-12 gap-[2.5vw] px-[7vw] py-[7vh] slide-auto-enter">
        <div className="col-span-5 flex flex-col justify-center">
          <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[1vw] mb-[2vh]">
            Feature 02
          </span>
          <h2
            className="font-display font-black text-text tracking-tight leading-[1.02]"
            style={{ fontSize: "4.2vw", textWrap: "balance" }}
          >
            Your week, slotted in.
          </h2>
          <p
            className="mt-[3vh] text-muted font-body leading-relaxed"
            style={{ fontSize: "1.4vw", textWrap: "pretty" }}
          >
            Drag any lesson onto the timetable. The planner respects your school's slot lengths, year groups, and free periods — and shows the day at a glance.
          </p>

          <div className="mt-[4vh] grid grid-cols-2 gap-[1vw]">
            <div className="rounded-[1rem] bg-surface border border-text/10 p-[1.8vh_1.2vw]">
              <div className="font-display font-black text-primary-dark text-[2.2vw] leading-none">Drag</div>
              <div className="text-muted font-body text-[1vw] mt-[0.5vh]">a lesson into any slot</div>
            </div>
            <div className="rounded-[1rem] bg-surface border border-text/10 p-[1.8vh_1.2vw]">
              <div className="font-display font-black text-accent text-[2.2vw] leading-none">Snap</div>
              <div className="text-muted font-body text-[1vw] mt-[0.5vh]">to your timetable rules</div>
            </div>
          </div>
        </div>

        <div className="col-span-7 flex items-center">
          <div className="w-full rounded-[1.5rem] bg-surface shadow-[0_20px_60px_rgba(0,76,69,0.12)] p-[2vw] border border-text/5">
            <div className="flex items-center justify-between mb-[1.8vh]">
              <span className="font-display font-bold text-text text-[1.3vw]">Week of 13 Oct &middot; Year 4</span>
              <span className="font-body text-muted text-[0.95vw]">Autumn 1 &middot; Week 6</span>
            </div>

            <div className="grid grid-cols-6 gap-[0.5vw] text-[0.8vw] font-display font-semibold text-muted uppercase tracking-wide mb-[0.8vh]">
              <div></div>
              <div className="text-center">Mon</div>
              <div className="text-center">Tue</div>
              <div className="text-center">Wed</div>
              <div className="text-center">Thu</div>
              <div className="text-center">Fri</div>
            </div>

            <div className="grid grid-cols-6 gap-[0.5vw] mb-[0.6vh] items-stretch">
              <div className="font-body text-muted text-[0.85vw] flex items-center">09:00</div>
              <div className="rounded-[0.6rem] bg-[#FFE5D6] border border-[#FFB07A]/50 p-[0.8vh_0.5vw]">
                <div className="font-display font-bold text-[#A24A1A] text-[0.85vw] leading-tight">Drama</div>
                <div className="text-[#A24A1A]/80 font-body text-[0.7vw]">Freeze-frames</div>
              </div>
              <div className="rounded-[0.6rem] bg-bg border border-text/10 p-[0.8vh_0.5vw]" />
              <div className="rounded-[0.6rem] bg-[#D6E8F2] border border-[#0EA4D4]/40 p-[0.8vh_0.5vw]">
                <div className="font-display font-bold text-[#0A4A66] text-[0.85vw] leading-tight">Music</div>
                <div className="text-[#0A4A66]/80 font-body text-[0.7vw]">Body percussion</div>
              </div>
              <div className="rounded-[0.6rem] bg-bg border border-text/10 p-[0.8vh_0.5vw]" />
              <div className="rounded-[0.6rem] bg-[#E8E2F2] border border-[#7C6BF0]/40 p-[0.8vh_0.5vw]">
                <div className="font-display font-bold text-[#3D2F7A] text-[0.85vw] leading-tight">Dance</div>
                <div className="text-[#3D2F7A]/80 font-body text-[0.7vw]">Motif build</div>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-[0.5vw] mb-[0.6vh] items-stretch">
              <div className="font-body text-muted text-[0.85vw] flex items-center">10:30</div>
              <div className="rounded-[0.6rem] bg-bg border border-text/10 p-[0.8vh_0.5vw]" />
              <div className="rounded-[0.6rem] bg-[#FFE5D6] border border-[#FFB07A]/50 p-[0.8vh_0.5vw]">
                <div className="font-display font-bold text-[#A24A1A] text-[0.85vw] leading-tight">Drama</div>
                <div className="text-[#A24A1A]/80 font-body text-[0.7vw]">Hot-seating</div>
              </div>
              <div className="rounded-[0.6rem] bg-bg border border-text/10 p-[0.8vh_0.5vw]" />
              <div className="rounded-[0.6rem] bg-[#D6E8F2] border border-[#0EA4D4]/40 p-[0.8vh_0.5vw]">
                <div className="font-display font-bold text-[#0A4A66] text-[0.85vw] leading-tight">Music</div>
                <div className="text-[#0A4A66]/80 font-body text-[0.7vw]">West Africa</div>
              </div>
              <div className="rounded-[0.6rem] bg-bg border border-text/10 p-[0.8vh_0.5vw]" />
            </div>

            <div className="grid grid-cols-6 gap-[0.5vw] mb-[0.6vh] items-stretch">
              <div className="font-body text-muted text-[0.85vw] flex items-center">13:15</div>
              <div className="rounded-[0.6rem] bg-[#E8E2F2] border border-[#7C6BF0]/40 p-[0.8vh_0.5vw]">
                <div className="font-display font-bold text-[#3D2F7A] text-[0.85vw] leading-tight">Dance</div>
                <div className="text-[#3D2F7A]/80 font-body text-[0.7vw]">Canon &amp; share</div>
              </div>
              <div className="rounded-[0.6rem] bg-bg border border-text/10 p-[0.8vh_0.5vw]" />
              <div className="rounded-[0.6rem] bg-[#FFE5D6] border border-[#FFB07A]/50 p-[0.8vh_0.5vw]">
                <div className="font-display font-bold text-[#A24A1A] text-[0.85vw] leading-tight">Drama</div>
                <div className="text-[#A24A1A]/80 font-body text-[0.7vw]">Devising</div>
              </div>
              <div className="rounded-[0.6rem] bg-bg border border-text/10 p-[0.8vh_0.5vw]" />
              <div className="rounded-[0.6rem] border-2 border-dashed border-primary/40 bg-primary/5 p-[0.8vh_0.5vw] flex items-center justify-center">
                <span className="font-display font-semibold text-primary-dark text-[0.75vw]">Drop here</span>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-[0.5vw] items-stretch">
              <div className="font-body text-muted text-[0.85vw] flex items-center">14:45</div>
              <div className="rounded-[0.6rem] bg-bg border border-text/10 p-[0.8vh_0.5vw]" />
              <div className="rounded-[0.6rem] bg-[#D6E8F2] border border-[#0EA4D4]/40 p-[0.8vh_0.5vw]">
                <div className="font-display font-bold text-[#0A4A66] text-[0.85vw] leading-tight">Music</div>
                <div className="text-[#0A4A66]/80 font-body text-[0.7vw]">Composing loops</div>
              </div>
              <div className="rounded-[0.6rem] bg-bg border border-text/10 p-[0.8vh_0.5vw]" />
              <div className="rounded-[0.6rem] bg-[#E8E2F2] border border-[#7C6BF0]/40 p-[0.8vh_0.5vw]">
                <div className="font-display font-bold text-[#3D2F7A] text-[0.85vw] leading-tight">Dance</div>
                <div className="text-[#3D2F7A]/80 font-body text-[0.7vw]">Refine motif</div>
              </div>
              <div className="rounded-[0.6rem] bg-bg border border-text/10 p-[0.8vh_0.5vw]" />
            </div>

            <div className="mt-[2vh] pt-[1.6vh] border-t border-text/10 flex items-center justify-between">
              <span className="font-body text-muted text-[0.95vw]">11 lessons scheduled this week</span>
              <span className="font-display font-semibold text-primary-dark text-[0.95vw]">Drag from the library →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
