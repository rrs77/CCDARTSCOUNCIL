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

      <div className="relative z-10 h-full w-full flex flex-col px-[5.74vw] py-[6.2vh] slide-auto-enter">
        <div className="max-w-[40.34vw] mb-[5.3vh]">
          <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[0.82vw] mb-[2.2vh]">
            How it works
          </span>
          <h2
            className="font-display font-black text-text tracking-tight leading-[1.02]"
            style={{ fontSize: "3.77vw", textWrap: "balance" }}
          >
            From empty term to ready-to-teach.
          </h2>
        </div>

        <div className="grid grid-cols-4 gap-[1.23vw] flex-1">
          <div className="flex flex-col">
            <div className="font-display font-black text-accent/30 text-[4.1vw] leading-none">01</div>
            <h3 className="font-display font-bold text-text text-[1.31vw] leading-tight mt-[0.9vh]">Map the year</h3>
            <p className="text-muted font-body text-[0.90vw] leading-snug mt-[1.1vh]">
              Open the half-term planner and sketch the arc of your year. Themes, units and topic windows.
            </p>
          </div>

          <div className="flex flex-col">
            <div className="font-display font-black text-accent/30 text-[4.1vw] leading-none">02</div>
            <h3 className="font-display font-bold text-text text-[1.31vw] leading-tight mt-[0.9vh]">Pull from the library</h3>
            <p className="text-muted font-body text-[0.90vw] leading-snug mt-[1.1vh]">
              Drop existing lessons into each half-term or duplicate one and tweak it for a new year group.
            </p>
          </div>

          <div className="flex flex-col">
            <div className="font-display font-black text-accent/30 text-[4.1vw] leading-none">03</div>
            <h3 className="font-display font-bold text-text text-[1.31vw] leading-tight mt-[0.9vh]">Stack the activities</h3>
            <p className="text-muted font-body text-[0.90vw] leading-snug mt-[1.1vh]">
              Add warm-ups, mains and plenaries. Save winning combinations as reusable stacks.
            </p>
          </div>

          <div className="flex flex-col">
            <div className="font-display font-black text-accent/30 text-[4.1vw] leading-none">04</div>
            <h3 className="font-display font-bold text-text text-[1.31vw] leading-tight mt-[0.9vh]">Teach &amp; refine</h3>
            <p className="text-muted font-body text-[0.90vw] leading-snug mt-[1.1vh]">
              Print, project or share with the team. Edit on the fly and the library improves with every term.
            </p>
          </div>
        </div>

        <div className="mt-[4.4vh] rounded-[1.5rem] bg-primary-dark text-white p-[2.2vh_2.05vw] flex items-center justify-between">
          <div className="flex items-center gap-[1.23vw]">
            <div className="w-[2.95vw] h-[2.95vw] rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-display font-black text-white text-[1.31vw]">
              CD
            </div>
            <div>
              <div className="font-display font-bold text-white text-[1.23vw] leading-tight">Built for every phase — EYFS to A-level.</div>
              <div className="font-body text-white/70 text-[0.90vw] leading-snug">Works on a laptop, a smartboard, or a tablet during break.</div>
            </div>
          </div>
          <div className="flex items-center gap-[1.64vw] font-body text-white/80 text-[0.82vw]">
            <span>Web &amp; PWA</span>
            <span className="w-[0.33vw] h-[0.33vw] rounded-full bg-accent" />
            <span>Offline-friendly</span>
            <span className="w-[0.33vw] h-[0.33vw] rounded-full bg-accent" />
            <span>Print-ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
