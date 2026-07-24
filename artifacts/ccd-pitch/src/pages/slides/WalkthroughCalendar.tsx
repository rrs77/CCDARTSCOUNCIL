/**
 * Slide 6 — Calendar week / timetable highlights.
 */
export default function WalkthroughCalendar() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const slots = [
    { day: 0, label: "Orchestra build", color: "#E8F8F0", text: "#0A3D32" },
    { day: 2, label: "Rhythm warm-up", color: "#FFF4D6", text: "#7A5200" },
    { day: 3, label: "LSO workshop", color: "#B6FF7E", text: "#002D24" },
    { day: 4, label: "Reflect & share", color: "#E8E2F2", text: "#3D2F7A" },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="relative z-10 h-full w-full grid grid-cols-12 gap-[1.64vw] pitch-slide-pad slide-auto-enter">
        <div className="col-span-4 flex flex-col justify-center">
          <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[1.8vh]">
            Calendar
          </span>
          <h2 className="pitch-h2 font-display font-black text-text tracking-tight leading-[1.02]" style={{ textWrap: "balance" }}>
            Your week, your timetable.
          </h2>
          <p className="pitch-body-lg mt-[2vh] text-muted font-body leading-relaxed" style={{ textWrap: "pretty" }}>
            Week and timetable views highlight where partner lessons and school sessions land — drag from
            the library into the slots you actually teach.
          </p>
        </div>

        <div className="col-span-8 flex items-center">
          <div className="w-full rounded-[1.3rem] bg-surface border border-text/8 overflow-hidden shadow-[0_16px_48px_rgba(0,45,36,0.1)]">
            <div className="flex items-center justify-between px-[1.2vw] py-[1.3vh] bg-primary-dark text-white">
              <span className="font-display font-bold" style={{ fontSize: "1.1vw" }}>Week view · Year 6 Music</span>
              <div className="flex gap-[0.35vw]">
                {["Month", "Week", "Timetable"].map((v, i) => (
                  <span
                    key={v}
                    className={`px-[0.7vw] py-[0.35vh] rounded-full font-display font-semibold ${i === 1 ? "bg-white text-primary-dark" : "bg-white/15 text-white/90"}`}
                    style={{ fontSize: "0.72vw" }}
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-[1.2vw]">
              <div className="grid grid-cols-5 gap-[0.7vw] mb-[0.8vh]">
                {days.map((d) => (
                  <div key={d} className="text-center font-display font-semibold text-muted uppercase tracking-wide" style={{ fontSize: "0.75vw" }}>
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-[0.7vw] min-h-[28vh]">
                {days.map((_, dayIdx) => {
                  const lesson = slots.find((s) => s.day === dayIdx);
                  return (
                    <div key={dayIdx} className="rounded-[0.7rem] border border-text/10 bg-white p-[0.8vh_0.5vw] min-h-[22vh]">
                      {lesson ? (
                        <div
                          className="rounded-[0.5rem] px-[0.45vw] py-[0.7vh] font-display font-semibold leading-tight"
                          style={{ background: lesson.color, color: lesson.text, fontSize: "0.85vw" }}
                        >
                          {lesson.label}
                        </div>
                      ) : (
                        <div className="h-full rounded-[0.45rem] border border-dashed border-text/10 bg-bg/40" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
