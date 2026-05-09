export default function HowItWorks() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: "70vw",
          height: "70vw",
          background: "radial-gradient(circle at center, rgba(20,184,166,0.08), transparent 60%)",
          filter: "blur(4vw)",
        }}
      />

      <div className="relative z-10 h-full w-full flex flex-col px-[7vw] py-[7vh] slide-auto-enter">
        <div className="max-w-[60vw] mb-[6vh]">
          <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[1vw] mb-[2.5vh]">
            How it works
          </span>
          <h2
            className="font-display font-black text-text tracking-tight leading-[1.02]"
            style={{ fontSize: "4.6vw", textWrap: "balance" }}
          >
            From empty term to ready-to-teach.
          </h2>
        </div>

        <div className="grid grid-cols-4 gap-[1.5vw] flex-1">
          <div className="flex flex-col">
            <div className="font-display font-black text-accent/30 text-[5vw] leading-none">01</div>
            <h3 className="font-display font-bold text-text text-[1.6vw] leading-tight mt-[1vh]">Map the year</h3>
            <p className="text-muted font-body text-[1.1vw] leading-snug mt-[1.2vh]">
              Open the half-term planner and sketch the arc of your year. Themes, units and topic windows.
            </p>
          </div>

          <div className="flex flex-col">
            <div className="font-display font-black text-accent/30 text-[5vw] leading-none">02</div>
            <h3 className="font-display font-bold text-text text-[1.6vw] leading-tight mt-[1vh]">Pull from the library</h3>
            <p className="text-muted font-body text-[1.1vw] leading-snug mt-[1.2vh]">
              Drop existing lessons into each half-term or duplicate one and tweak it for a new year group.
            </p>
          </div>

          <div className="flex flex-col">
            <div className="font-display font-black text-accent/30 text-[5vw] leading-none">03</div>
            <h3 className="font-display font-bold text-text text-[1.6vw] leading-tight mt-[1vh]">Stack the activities</h3>
            <p className="text-muted font-body text-[1.1vw] leading-snug mt-[1.2vh]">
              Add warm-ups, mains and plenaries. Save winning combinations as reusable stacks.
            </p>
          </div>

          <div className="flex flex-col">
            <div className="font-display font-black text-accent/30 text-[5vw] leading-none">04</div>
            <h3 className="font-display font-bold text-text text-[1.6vw] leading-tight mt-[1vh]">Teach &amp; refine</h3>
            <p className="text-muted font-body text-[1.1vw] leading-snug mt-[1.2vh]">
              Print, project or share with the team. Edit on the fly and the library improves with every term.
            </p>
          </div>
        </div>

        <div className="mt-[5vh] rounded-[1.5rem] bg-primary-dark text-white p-[2.5vh_2.5vw] flex items-center justify-between">
          <div className="flex items-center gap-[1.5vw]">
            <div className="w-[3.6vw] h-[3.6vw] rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-display font-black text-white text-[1.6vw]">
              CD
            </div>
            <div>
              <div className="font-display font-bold text-white text-[1.5vw] leading-tight">Built for performing arts teaching from EYFS to KS5.</div>
              <div className="font-body text-white/70 text-[1.1vw] leading-snug">Works on a laptop, a smartboard, a studio tablet, or a phone in the rehearsal room.</div>
            </div>
          </div>
          <div className="flex items-center gap-[2vw] font-body text-white/80 text-[1vw]">
            <span>Web &amp; PWA</span>
            <span className="w-[0.4vw] h-[0.4vw] rounded-full bg-accent" />
            <span>Offline-friendly</span>
            <span className="w-[0.4vw] h-[0.4vw] rounded-full bg-accent" />
            <span>Print-ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
