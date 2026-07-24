export default function MeltingPot() {
  const contributors = [
    { label: "Schools", note: "Drama, music & dance specialists across EYFS to KS5", colour: "#008272" },
    { label: "Universities", note: "Conservatoires & arts faculties protecting the pipeline", colour: "#7C3AED" },
    { label: "Arts orgs", note: "Theatres, orchestras, dance companies, touring outreach", colour: "#FF6B6B" },
    { label: "Practitioners", note: "Working artists, freelance teachers, visiting workshops", colour: "#FBBF24" },
    { label: "Communities", note: "Parents, alumni, local audiences, partner primaries", colour: "#0EA4D4" },
    { label: "Children", note: "The young artists every contribution is in service of", colour: "#5EEAD4" },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div
        className="absolute top-[30vh] left-[35vw] rounded-full"
        style={{
          width: "55vw",
          height: "55vw",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle at center, rgba(124,58,237,0.18), rgba(255,107,107,0.10) 45%, transparent 70%)",
          filter: "blur(3vw)",
        }}
      />

      <div className="relative z-10 h-full w-full grid grid-cols-12 gap-[2.5vw] px-[7vw] py-[7vh] slide-auto-enter">
        <div className="col-span-5 flex flex-col justify-center">
          <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[1vw] mb-[3vh]">
            The argument
          </span>
          <h2
            className="font-display font-black text-text tracking-tight leading-[1.02]"
            style={{ fontSize: "4.6vw", textWrap: "balance" }}
          >
            A <span className="text-accent">melting pot</span> of knowledge.
          </h2>
          <p
            className="mt-[3vh] text-muted font-body leading-relaxed"
            style={{ fontSize: "1.4vw", textWrap: "pretty" }}
          >
            No single classroom — and no single conservatoire — can carry the whole creative ecology on its own. CCD is a place where every contributor pours in what they know best: the rehearsal a teacher nailed in Year 4, the masterclass a violinist gave in Year 11, the choreography a dance company toured to thirty schools. Together, that is a curriculum no funder could commission.
          </p>
        </div>

        <div className="col-span-7 relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="rounded-full"
              style={{
                width: "32vw",
                height: "32vw",
                background:
                  "radial-gradient(circle at center, rgba(0,130,114,0.18), transparent 65%)",
              }}
            />
          </div>
          <div className="relative z-10 grid grid-cols-3 gap-[1.4vw] w-[42vw]">
            {contributors.map((c) => (
              <div
                key={c.label}
                className="rounded-[1.4rem] bg-surface shadow-[0_8px_28px_rgba(0,76,69,0.10)] p-[2vh_1.2vw]"
                style={{ borderTop: `0.4vh solid ${c.colour}` }}
              >
                <div
                  className="font-display font-black text-[1.7vw] leading-tight"
                  style={{ color: c.colour }}
                >
                  {c.label}
                </div>
                <p className="mt-[0.8vh] text-muted font-body text-[0.95vw] leading-snug">
                  {c.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
