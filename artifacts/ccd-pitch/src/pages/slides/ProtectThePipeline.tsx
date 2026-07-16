export default function ProtectThePipeline() {
  const stages = [
    {
      band: "EYFS",
      label: "First sparks",
      body: "Songs, role play, movement to music. The first time a child is told they're an artist.",
      colour: "#FBBF24",
    },
    {
      band: "KS1–KS2",
      label: "Practice & confidence",
      body: "Ensemble performance, improvisation, the first lead role. Where the habit of making takes hold.",
      colour: "#5EEAD4",
    },
    {
      band: "KS3",
      label: "Specialism opens up",
      body: "Choosing an instrument, a discipline, a voice. The years that decide which children carry the arts forward.",
      colour: "#0EA4D4",
    },
    {
      band: "KS4–KS5",
      label: "Toward conservatoire",
      body: "GCSE, A-Level, BTEC, LAMDA. The portfolio that the auditioning panel will read.",
      colour: "#FF6B6B",
    },
    {
      band: "University",
      label: "The pipeline protected",
      body: "Drama school, conservatoire, music college. The next generation of professional artists — only as strong as Year 4 was.",
      colour: "#7C3AED",
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div
        className="absolute -bottom-[25vh] -left-[10vw] rounded-full"
        style={{
          width: "60vw",
          height: "60vw",
          background:
            "radial-gradient(circle at center, rgba(124,58,237,0.16), transparent 65%)",
          filter: "blur(3vw)",
        }}
      />

      <div className="relative z-10 h-full w-full flex flex-col px-[7vw] py-[7vh] slide-auto-enter">
        <div className="grid grid-cols-12 gap-[2.5vw] mb-[5vh]">
          <div className="col-span-7">
            <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[1vw] mb-[2.4vh]">
              Protecting the pipeline
            </span>
            <h2
              className="font-display font-black text-text tracking-tight leading-[1.02]"
              style={{ fontSize: "4.4vw", textWrap: "balance" }}
            >
              From a Reception assembly to a{" "}
              <span className="text-primary-dark">conservatoire stage</span> —{" "}
              <span className="text-accent">one continuous arc</span>.
            </h2>
          </div>
          <div className="col-span-5 flex items-end">
            <p
              className="text-muted font-body leading-relaxed"
              style={{ fontSize: "1.25vw", textWrap: "pretty" }}
            >
              When schools, arts orgs, practitioners and universities work in the same archive, no stage of a child's creative life sits in isolation. The lesson plan a Year 4 teacher writes is the same evidence base a head of conservatoire admissions will one day rely on.
            </p>
          </div>
        </div>

        <div className="relative flex-1">
          <div
            className="absolute left-0 right-0 top-[3.5vh] h-[0.5vh] rounded-full"
            style={{
              background:
                "linear-gradient(90deg, #FBBF24 0%, #5EEAD4 25%, #0EA4D4 50%, #FF6B6B 75%, #7C3AED 100%)",
            }}
          />
          <div className="grid grid-cols-5 gap-[1.4vw] relative">
            {stages.map((s) => (
              <div key={s.band} className="flex flex-col items-center text-center">
                <div
                  className="rounded-full border-[0.4vh] border-bg shadow-[0_4px_12px_rgba(0,76,69,0.20)]"
                  style={{
                    width: "2.6vh",
                    height: "2.6vh",
                    background: s.colour,
                    marginTop: "2.7vh",
                  }}
                />
                <div
                  className="mt-[2.4vh] rounded-[1.4rem] bg-surface shadow-[0_8px_28px_rgba(0,76,69,0.08)] p-[2vh_1.2vw] w-full flex flex-col gap-[0.8vh]"
                  style={{ borderTop: `0.4vh solid ${s.colour}` }}
                >
                  <div
                    className="font-display font-semibold uppercase tracking-wide text-[0.9vw]"
                    style={{ color: s.colour }}
                  >
                    {s.band}
                  </div>
                  <div className="font-display font-bold text-text text-[1.3vw] leading-tight">
                    {s.label}
                  </div>
                  <p className="text-muted font-body text-[0.95vw] leading-snug">
                    {s.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-[3.5vh] pt-[2.4vh] border-t border-text/10 flex items-center justify-between">
          <p className="font-display font-semibold text-text text-[1.4vw] max-w-[55vw] leading-snug">
            Cut any link in this chain, and the next generation of artists never reaches the stage.
          </p>
          <div className="font-display font-black text-primary-dark text-[1.4vw]">
            EYFS → KS5 → University
          </div>
        </div>
      </div>
    </div>
  );
}
