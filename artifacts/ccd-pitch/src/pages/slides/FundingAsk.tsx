/**
 * Closing funding ask — classy, minimal CTA for Arts Council / partners.
 */
export default function FundingAsk() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-primary-dark">
      <div
        className="absolute -bottom-[28vh] -right-[18vw] rounded-full"
        style={{
          width: "62vw",
          height: "62vw",
          background: "radial-gradient(circle at center, rgba(182,255,126,0.28), transparent 68%)",
          filter: "blur(3vw)",
        }}
      />
      <div
        className="absolute -top-[22vh] -left-[12vw] rounded-full"
        style={{
          width: "48vw",
          height: "48vw",
          background: "radial-gradient(circle at center, rgba(20,184,166,0.28), transparent 68%)",
          filter: "blur(3vw)",
        }}
      />

      <div className="relative z-10 h-full w-full flex flex-col justify-between px-[7vw] py-[7vh] slide-auto-enter">
        <div className="max-w-[72vw]">
          <span className="inline-block px-[1.1vw] py-[0.65vh] rounded-full bg-white/12 border border-white/25 text-white/90 font-medium tracking-[0.16em] uppercase mb-[2.6vh]" style={{ fontSize: "0.95vw" }}>
            The ask
          </span>
          <h1
            className="font-display font-black text-white tracking-tight leading-[0.98]"
            style={{ fontSize: "5.4vw", textWrap: "balance" }}
          >
            Fund the connection layer
            <span className="block text-accent">between hubs and classrooms.</span>
          </h1>
          <p
            className="mt-[2.6vh] text-white/82 font-body font-medium max-w-[52vw] leading-snug"
            style={{ fontSize: "1.45vw", textWrap: "pretty" }}
          >
            Support CCDesigner so Music Hubs and arts organisations can put practice where teachers
            already plan — with lessons, units, calendars and shareable PDFs that keep the arts
            visible and teachable.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-[1.6vw]">
          <div className="rounded-[1.25rem] bg-white/8 border border-white/15 p-[2.2vh_1.4vw]">
            <div className="font-display font-semibold text-accent uppercase tracking-wide mb-[0.8vh]" style={{ fontSize: "0.9vw" }}>
              Visit
            </div>
            <div className="font-display font-bold text-white leading-tight" style={{ fontSize: "1.35vw" }}>
              www.ccdesigner.co.uk
            </div>
          </div>
          <div className="rounded-[1.25rem] bg-white/8 border border-white/15 p-[2.2vh_1.4vw]">
            <div className="font-display font-semibold text-accent uppercase tracking-wide mb-[0.8vh]" style={{ fontSize: "0.9vw" }}>
              Contact
            </div>
            <div className="font-display font-bold text-white leading-tight" style={{ fontSize: "1.35vw" }}>
              rob@rhythmstix.co.uk
            </div>
          </div>
          <div className="rounded-[1.25rem] bg-[#B6FF7E] text-primary-dark p-[2.2vh_1.4vw]">
            <div className="font-display font-semibold uppercase tracking-wide mb-[0.8vh]" style={{ fontSize: "0.9vw" }}>
              Next step
            </div>
            <div className="font-display font-bold leading-tight" style={{ fontSize: "1.35vw" }}>
              Book a 30-minute funder walkthrough
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
