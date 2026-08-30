/**
 * Slide 9 — Org hub / share value (brief).
 */
export default function WalkthroughOrgHub() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div
        className="absolute -bottom-[20vh] -left-[12vw] rounded-full"
        style={{
          width: "48vw",
          height: "48vw",
          background: "radial-gradient(circle at center, rgba(182,255,126,0.14), transparent 65%)",
          filter: "blur(3vw)",
        }}
      />

      <div className="relative z-10 h-full w-full flex flex-col justify-center pitch-slide-pad slide-auto-enter">
        <div className="max-w-[58vw] mb-[4vh]">
          <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[1.8vh]">
            Organisations
          </span>
          <h2 className="pitch-h2 font-display font-black text-text tracking-tight leading-[1.02]" style={{ textWrap: "balance" }}>
            Share practice across your organisation.
          </h2>
          <p className="pitch-body-lg mt-[2vh] text-muted font-body leading-snug max-w-[46vw]" style={{ textWrap: "pretty" }}>
            School and arts-organisation hubs keep lessons, partner packs, and planning visible to the
            right people — so great teaching multiplies beyond one classroom.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-[1.3vw] max-w-[78vw]">
          {[
            { title: "School hub", detail: "Department libraries, branding, and shared units" },
            { title: "Partner hub", detail: "Sector resources teachers can pull in once" },
            { title: "Share value", detail: "Colleagues reuse what works — nothing lost" },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-[1.2rem] border border-text/10 bg-white p-[2.4vh_1.3vw] shadow-[0_10px_32px_rgba(0,45,36,0.07)]"
            >
              <div className="w-[1.8vw] h-[1.8vw] rounded-full bg-primary-dark mb-[1.6vh]" />
              <h3 className="font-display font-bold text-text" style={{ fontSize: "1.35vw" }}>{card.title}</h3>
              <p className="font-body text-muted mt-[1vh] leading-snug" style={{ fontSize: "0.95vw" }}>{card.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
