/**
 * Slide 2 — Music hubs (EMS / Tri-Borough) + Partner Hubs structure.
 */
export default function WalkthroughMusicHubs() {
  const hubs = [
    { name: "EMS Music Hub", role: "Interactive hub", detail: "Browse resources · add to CCDesigner" },
    { name: "Tri-Borough", role: "Music education", detail: "Partner links & sector pathways" },
    { name: "Partner Hubs", role: "Dashboard tab", detail: "Arts orgs grouped by discipline" },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div
        className="absolute -top-[12vh] -left-[8vw] rounded-full"
        style={{
          width: "42vw",
          height: "42vw",
          background: "radial-gradient(circle at center, rgba(182,255,126,0.18), transparent 65%)",
          filter: "blur(3vw)",
        }}
      />

      <div className="relative z-10 h-full w-full flex flex-col pitch-slide-pad slide-auto-enter">
        <div className="max-w-[52vw] mb-[3vh]">
          <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[1.8vh]">
            Partner Hubs
          </span>
          <h2 className="pitch-h2 font-display font-black text-text tracking-tight leading-[1.02]" style={{ textWrap: "balance" }}>
            Music hubs — and a clear Partner Hubs home.
          </h2>
          <p className="pitch-body-lg mt-[1.8vh] text-muted font-body leading-snug max-w-[42vw]" style={{ textWrap: "pretty" }}>
            From the dashboard, open Partner Hubs to reach EMS, Tri-Borough, LSO, and more — structured
            sections so teachers find the right organisation quickly.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-[1.4vw] flex-1 min-h-0">
          {hubs.map((hub, i) => (
            <div
              key={hub.name}
              className="rounded-[1.3rem] border border-text/10 bg-white p-[2.4vh_1.4vw] flex flex-col shadow-[0_12px_36px_rgba(0,45,36,0.08)]"
              style={{ animationDelay: `${200 + i * 120}ms` }}
            >
              <div className="flex items-center justify-between mb-[2vh]">
                <span className="w-[2.4vw] h-[2.4vw] rounded-full bg-primary-dark text-accent font-display font-black flex items-center justify-center" style={{ fontSize: "0.95vw" }}>
                  {i + 1}
                </span>
                <span className="px-[0.7vw] py-[0.35vh] rounded-full bg-primary/10 text-primary-dark font-display font-semibold" style={{ fontSize: "0.72vw" }}>
                  {hub.role}
                </span>
              </div>
              <h3 className="pitch-h3 font-display font-bold text-text leading-tight">{hub.name}</h3>
              <p className="pitch-body text-muted font-body mt-[1vh] leading-snug flex-1">{hub.detail}</p>
              <div className="mt-[2vh] pt-[1.2vh] border-t border-text/10 font-body text-primary-dark font-semibold" style={{ fontSize: "0.85vw" }}>
                Open from Partner Hubs →
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
