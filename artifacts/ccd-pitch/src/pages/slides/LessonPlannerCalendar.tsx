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

      <div className="relative z-10 h-full w-full grid grid-cols-12 gap-[1.64vw] pitch-slide-pad slide-auto-enter">
        <div className="col-span-4 flex flex-col justify-center min-h-0">
          <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[1.8vh]">
            Key feature · Calendar
          </span>
          <h2 className="pitch-h2 font-display font-black text-text tracking-tight leading-[1.02]" style={{ textWrap: "balance" }}>
            Your school calendar, your timetable.
          </h2>
          <p className="pitch-body-lg mt-[2.2vh] text-muted font-body leading-relaxed" style={{ textWrap: "pretty" }}>
            Set term dates to match your school year. Then drag lessons or whole stacks straight into the slots where you actually teach.
          </p>

          <div className="mt-[2.6vh] flex flex-col gap-[1.3vh]">
            <div className="flex items-start gap-[0.82vw]">
              <div className="w-[0.33vw] h-[1.97vw] rounded-full bg-primary shrink-0 mt-[0.4vh]" />
              <div>
                <h4 className="pitch-h3 font-display font-bold text-text leading-tight">Term dates you control</h4>
                <p className="pitch-body text-muted font-body leading-snug">Autumn, spring and summer blocks align to your inset days and holidays.</p>
              </div>
            </div>
            <div className="flex items-start gap-[0.82vw]">
              <div className="w-[0.33vw] h-[1.97vw] rounded-full bg-accent shrink-0 mt-[0.4vh]" />
              <div>
                <h4 className="pitch-h3 font-display font-bold text-text leading-tight">Drag lessons into slots</h4>
                <p className="pitch-body text-muted font-body leading-snug">Drop a single lesson from the library onto any teaching day.</p>
              </div>
            </div>
            <div className="flex items-start gap-[0.82vw]">
              <div className="w-[0.33vw] h-[1.97vw] rounded-full bg-accent shrink-0 mt-[0.4vh]" />
              <div>
                <h4 className="pitch-h3 font-display font-bold text-text leading-tight">Drop whole stacks</h4>
                <p className="pitch-body text-muted font-body leading-snug">A stack spreads across your timetable days — one lesson per session.</p>
              </div>
            </div>
          </div>

          <div className="mt-[2.6vh] grid grid-cols-2 gap-[0.82vw]">
            <div className="rounded-[0.9rem] bg-surface border border-text/10 p-[1.6vh_0.98vw]">
              <div className="pitch-stat font-display font-black text-primary-dark leading-none">Month</div>
              <div className="pitch-caption text-muted font-body mt-[0.4vh]">term overview</div>
            </div>
            <div className="rounded-[0.9rem] bg-surface border border-text/10 p-[1.6vh_0.98vw]">
              <div className="pitch-stat font-display font-black text-accent leading-none">Timetable</div>
              <div className="pitch-caption text-muted font-body mt-[0.4vh]">slot-by-slot</div>
            </div>
          </div>
        </div>

        <div className="col-span-8 flex items-center min-h-0">
          <div className="w-full h-full max-h-[78vh] grid grid-cols-12 gap-[0.98vw]">
            {/* Calendar mock — month + timetable */}
            <div className="col-span-7 rounded-[1.2rem] bg-surface shadow-[0_16px_48px_rgba(0,76,69,0.1)] border border-text/5 overflow-hidden flex flex-col min-h-0">
              <div className="flex items-center justify-between px-[1.15vw] py-[1.2vh] border-b border-text/10 bg-primary-dark text-white">
                <span className="pitch-h3 font-display font-bold">October 2025 · Year 4 Drama</span>
                <div className="flex gap-[0.33vw]">
                  {["Month", "Week", "Timetable"].map((view, i) => (
                    <span
                      key={view}
                      className={`pitch-caption px-[0.66vw] py-[0.35vh] rounded-full font-display font-semibold ${
                        i === 2 ? "bg-white text-primary-dark" : "bg-white/15 text-white/90"
                      }`}
                    >
                      {view}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-[1.15vw] flex-1 min-h-0 flex flex-col">
                <div className="grid grid-cols-7 gap-[0.33vw] pitch-caption font-display font-semibold text-muted uppercase tracking-wide mb-[0.7vh]">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <div key={d} className="text-center">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-[0.33vw] flex-1 min-h-0">
                  {[
                    { d: "29", muted: true },
                    { d: "30", muted: true },
                    { d: "1", term: "Autumn 1" },
                    { d: "2", lesson: "Freeze-frames", color: "#FFE5D6", text: "#A24A1A" },
                    { d: "3" },
                    { d: "4", lesson: "Hot-seating", color: "#FFE5D6", text: "#A24A1A" },
                    { d: "5", holiday: "Inset" },
                    { d: "6" },
                    { d: "7", lesson: "Devising", color: "#FFE5D6", text: "#A24A1A" },
                    { d: "8" },
                    { d: "9", lesson: "Motif build", color: "#E8E2F2", text: "#3D2F7A" },
                    { d: "10" },
                    { d: "11" },
                    { d: "12", drop: true },
                  ].map((cell, i) => (
                    <div
                      key={i}
                      className={`rounded-[0.45rem] border p-[0.5vh_0.25vw] min-h-[5.5vh] flex flex-col ${
                        cell.muted
                          ? "bg-bg/60 border-text/5 text-muted/50"
                          : cell.holiday
                            ? "bg-[#F5F3FF] border-[#8B5CF6]/30"
                            : cell.drop
                              ? "border-2 border-dashed border-primary/50 bg-primary/5"
                              : "bg-white border-text/10"
                      }`}
                    >
                      <span className={`pitch-caption font-display font-semibold ${cell.muted ? "text-muted/50" : "text-text"}`}>
                        {cell.d}
                      </span>
                      {cell.term && (
                        <span className="pitch-caption mt-auto font-body text-primary-dark font-medium leading-tight">{cell.term}</span>
                      )}
                      {cell.holiday && (
                        <span className="pitch-caption mt-auto font-body text-[#6D28D9] font-medium">{cell.holiday}</span>
                      )}
                      {cell.lesson && (
                        <span
                          className="pitch-caption mt-auto font-display font-semibold leading-tight rounded px-[0.25vw] py-[0.15vh]"
                          style={{ background: cell.color, color: cell.text }}
                        >
                          {cell.lesson}
                        </span>
                      )}
                      {cell.drop && (
                        <span className="pitch-caption mt-auto font-display font-semibold text-primary-dark text-center">Drop stack</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-[1.2vh] pt-[1vh] border-t border-text/10 flex items-center justify-between">
                  <span className="pitch-caption font-body text-muted">Term dates synced · Autumn 1 ends 24 Oct</span>
                  <span className="pitch-caption font-display font-semibold text-primary-dark">Edit term dates →</span>
                </div>
              </div>
            </div>

            {/* Add to Calendar panel */}
            <div className="col-span-5 rounded-[1.2rem] bg-surface shadow-[0_16px_48px_rgba(0,76,69,0.1)] border border-text/5 overflow-hidden flex flex-col min-h-0">
              <div className="px-[1vw] py-[1.2vh] border-b border-text/10 text-white" style={{ background: "linear-gradient(to right, #14B8A6, #0D9488)" }}>
                <div className="pitch-h3 font-display font-bold">Add to Calendar</div>
                <div className="pitch-caption font-body text-white/90 mt-[0.3vh]">Sunday, October 12, 2025</div>
              </div>

              <div className="flex border-b border-text/10">
                <div className="flex-1 pitch-caption text-center py-[1vh] font-display font-semibold text-primary-dark border-b-2 border-primary bg-primary/5">
                  Lesson from Library
                </div>
                <div className="flex-1 pitch-caption text-center py-[1vh] font-display font-medium text-muted">
                  Stack
                </div>
              </div>

              <div className="p-[1vw] flex-1 min-h-0 flex flex-col gap-[1vh]">
                <div className="rounded-[0.5rem] border border-text/15 bg-bg px-[0.82vw] py-[0.9vh] pitch-caption text-muted font-body">
                  Search lessons…
                </div>

                <div className="rounded-[0.6rem] border-2 border-primary/40 bg-primary/5 p-[0.9vh_0.7vw]">
                  <div className="flex items-center justify-between">
                    <span className="pitch-body font-display font-bold text-text">Commedia KS3 unit</span>
                    <span className="pitch-caption font-body text-primary-dark font-semibold">Stack · 4 lessons</span>
                  </div>
                  <p className="pitch-caption text-muted font-body mt-[0.4vh]">Spreads across your Mon &amp; Thu timetable slots</p>
                </div>

                <div className="rounded-[0.6rem] border border-text/10 p-[0.9vh_0.7vw]">
                  <span className="pitch-body font-display font-semibold text-text">Freeze-frame storytelling</span>
                  <p className="pitch-caption text-muted font-body mt-[0.3vh]">Drama · Year 4 · 45 min</p>
                </div>

                <div className="rounded-[0.6rem] border border-text/10 p-[0.9vh_0.7vw] opacity-70">
                  <span className="pitch-body font-display font-semibold text-text">Rhythms of West Africa</span>
                  <p className="pitch-caption text-muted font-body mt-[0.3vh]">Music · Year 3 · 40 min</p>
                </div>

                <div className="mt-auto flex items-center justify-between pt-[0.8vh] border-t border-text/10">
                  <span className="pitch-caption font-body text-muted">4 sessions from start date</span>
                  <span className="pitch-body px-[0.9vw] py-[0.6vh] rounded-[0.5rem] bg-primary-dark text-white font-display font-semibold">
                    Add to Calendar
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
