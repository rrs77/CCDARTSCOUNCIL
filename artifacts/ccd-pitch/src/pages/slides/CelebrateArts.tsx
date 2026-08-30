export default function CelebrateArts() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div
        className="absolute -top-[15vh] -left-[10vw] rounded-full"
        style={{
          width: "50vw",
          height: "50vw",
          background:
            "radial-gradient(circle at center, rgba(20,184,166,0.18), transparent 65%)",
          filter: "blur(3vw)",
        }}
      />
      <div
        className="absolute -bottom-[20vh] -right-[10vw] rounded-full"
        style={{
          width: "55vw",
          height: "55vw",
          background:
            "radial-gradient(circle at center, rgba(255,107,107,0.16), transparent 65%)",
          filter: "blur(3vw)",
        }}
      />

      <div className="relative z-10 h-full w-full flex flex-col justify-between px-[7vw] py-[7vh] slide-auto-enter">
        <div className="max-w-[58vw]">
          <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[1vw] mb-[3vh]">
            Celebrating the work
          </span>
          <h2
            className="font-display font-black text-text tracking-tight leading-[1.02]"
            style={{ fontSize: "4.6vw", textWrap: "balance" }}
          >
            Learning in the arts deserves to be{" "}
            <span className="text-accent italic">seen</span>.
          </h2>
          <p
            className="mt-[3vh] text-muted font-body leading-relaxed max-w-[55vw]"
            style={{ fontSize: "1.4vw", textWrap: "pretty" }}
          >
            Every freeze-frame, every first improvisation, every Year 6 ensemble piece is evidence that the arts are alive in our schools. CCD turns the daily craft of teaching into a record worth celebrating — published to school homepages, shared with parents, gathered into year-end showcases that tell the real story of arts education.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-[1.4vw]">
          {[
            {
              kicker: "On the school homepage",
              title: "This week in the arts",
              body: "Lessons published live so parents and SLT see what's happening on stage and in the studio — not just on the spreadsheet.",
              colour: "#008272",
            },
            {
              kicker: "Year-end showcase",
              title: "From sketchbook to stage",
              body: "Pull every lesson, photo and reflection from a unit into a single, shareable timeline. Frame the journey, not just the performance.",
              colour: "#7C3AED",
            },
            {
              kicker: "Practitioner portfolio",
              title: "What I taught this year",
              body: "An export every educator can hand to a head, a partner organisation, or take with them into the next role.",
              colour: "#FF6B6B",
            },
            {
              kicker: "Sector evidence",
              title: "What the arts look like in 1,000 classrooms",
              body: "Anonymised, aggregated insight for funders, MATs and arts councils — so the case for the arts is grounded in real practice.",
              colour: "#FBBF24",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-[1.5rem] bg-surface shadow-[0_8px_28px_rgba(0,76,69,0.10)] p-[2.4vh_1.4vw] flex flex-col gap-[1vh]"
              style={{ borderLeft: `0.4vw solid ${c.colour}` }}
            >
              <div
                className="font-display font-semibold uppercase tracking-wide text-[0.85vw]"
                style={{ color: c.colour }}
              >
                {c.kicker}
              </div>
              <div className="font-display font-bold text-text text-[1.45vw] leading-tight">
                {c.title}
              </div>
              <p className="text-muted font-body text-[1vw] leading-snug">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
