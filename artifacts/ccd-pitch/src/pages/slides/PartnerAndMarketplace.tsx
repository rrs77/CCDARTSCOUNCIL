const base = import.meta.env.BASE_URL;

const PITCH_PARTNER_LOGOS: { file: string; name: string }[] = [
  { file: 'arts-council-england.svg', name: 'Arts Council England' },
  { file: 'royal-opera-house.svg', name: 'Royal Opera House' },
  { file: 'lso.svg', name: 'London Symphony Orchestra' },
  { file: 'national-theatre.svg', name: 'National Theatre' },
  { file: 'bbc-ten-pieces.svg', name: 'BBC Ten Pieces' },
  { file: 'tate.svg', name: 'Tate' },
  { file: 'national-gallery.svg', name: 'The National Gallery' },
  { file: 'sadlers-wells.svg', name: "Sadler's Wells" },
];

export default function PartnerAndMarketplace() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div
        className="absolute -top-[12vh] -left-[8vw] rounded-full"
        style={{
          width: "48vw",
          height: "48vw",
          background: "radial-gradient(circle at center, rgba(255,107,107,0.16), transparent 65%)",
          filter: "blur(3vw)",
        }}
      />
      <div
        className="absolute -bottom-[18vh] -right-[12vw] rounded-full"
        style={{
          width: "52vw",
          height: "52vw",
          background: "radial-gradient(circle at center, rgba(20,184,166,0.14), transparent 65%)",
          filter: "blur(3vw)",
        }}
      />

      <div className="relative z-10 h-full w-full flex flex-col px-[7vw] py-[7vh] slide-auto-enter">
        <div className="max-w-[72vw] mb-[4vh]">
          <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[1vw] mb-[2.5vh]">
            Partner &amp; teacher resources
          </span>
          <h2
            className="font-display font-black text-text tracking-tight leading-[1.02]"
            style={{ fontSize: "4.6vw", textWrap: "balance" }}
          >
            Expert content from partners — and a place for yours.
          </h2>
          <p
            className="mt-[2vh] text-muted font-body leading-snug max-w-[58vw]"
            style={{ fontSize: "1.4vw", textWrap: "pretty" }}
          >
            Curated packs from leading arts organisations sit alongside your school library. Teachers can share packs with colleagues — or sell their own lesson plans to others.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-[2vw] flex-1 min-h-0">
          <div className="col-span-7 flex flex-col gap-[1.4vh]">
            <div className="font-display font-semibold text-text text-[1.05vw] mb-[0.4vh]">Partner activity packs</div>
            <div className="grid grid-cols-2 gap-[1.2vw] flex-1">
              <div className="rounded-[1.2rem] border border-text/10 bg-white p-[2vh_1.2vw] flex flex-col shadow-[0_8px_28px_rgba(0,76,69,0.06)]">
                <div className="flex items-center justify-between mb-[1.2vh]">
                  <img
                    src={`${base}partners/royal-opera-house.svg`}
                    alt="Royal Opera House"
                    className="h-[2vw] w-auto max-w-[10vw] brightness-0 opacity-80"
                  />
                  <span className="font-body text-muted text-[0.85vw]">Included</span>
                </div>
                <h3 className="font-display font-bold text-text text-[1.2vw] leading-tight">Royal Opera House</h3>
                <p className="text-muted font-body text-[0.95vw] leading-snug mt-[0.8vh] flex-1">
                  Opera, ballet and vocal warm-ups — specialist expertise ready to drop into your timetable.
                </p>
                <div className="mt-[1.2vh] pt-[1vh] border-t border-text/10 font-body text-text/75 text-[0.9vw]">
                  12 lesson stacks &middot; video links
                </div>
              </div>

              <div className="rounded-[1.2rem] border border-text/10 bg-white p-[2vh_1.2vw] flex flex-col shadow-[0_8px_28px_rgba(0,76,69,0.06)]">
                <div className="flex items-center justify-between mb-[1.2vh]">
                  <img
                    src={`${base}partners/national-theatre.svg`}
                    alt="National Theatre"
                    className="h-[1.8vw] w-auto max-w-[10vw] brightness-0 opacity-80"
                  />
                  <span className="font-body text-muted text-[0.85vw]">Included</span>
                </div>
                <h3 className="font-display font-bold text-text text-[1.2vw] leading-tight">National Theatre</h3>
                <p className="text-muted font-body text-[0.95vw] leading-snug mt-[0.8vh] flex-1">
                  Devising, text work and ensemble drama — classroom-ready units from NT Learning.
                </p>
                <div className="mt-[1.2vh] pt-[1vh] border-t border-text/10 font-body text-text/75 text-[0.9vw]">
                  GCSE &amp; A-level &middot; exam-aligned
                </div>
              </div>

              <div className="rounded-[1.2rem] border border-dashed border-primary/35 bg-primary/5 p-[2vh_1.2vw] flex flex-col justify-center col-span-2 gap-[1.2vh]">
                <div className="flex items-center justify-between gap-[1vw]">
                  <div>
                    <div className="font-display font-semibold text-primary-dark text-[1.05vw]">More partners joining</div>
                    <div className="font-body text-muted text-[0.95vw] mt-[0.4vh]">
                      Trinity, ABRSM, Rambert and other specialists — their content accessible inside CCD.
                    </div>
                  </div>
                  <span className="shrink-0 px-[1vw] py-[0.5vh] rounded-full bg-white border border-primary/20 font-display font-semibold text-primary-dark text-[0.95vw]">
                    Growing library
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-[1vw] pt-[0.5vh] border-t border-primary/15">
                  {PITCH_PARTNER_LOGOS.map((partner) => (
                    <img
                      key={partner.file}
                      src={`${base}partners/${partner.file}`}
                      alt={partner.name}
                      className="h-[1.6vw] w-auto max-w-[8vw] brightness-0 opacity-60"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-5 flex flex-col justify-center">
            <div className="rounded-[1.5rem] bg-primary-dark text-white p-[3vh_2vw] shadow-[0_16px_48px_rgba(0,76,69,0.18)]">
              <div className="font-display font-semibold text-accent text-[1vw] uppercase tracking-wide mb-[1.5vh]">
                Teacher marketplace
              </div>
              <h3 className="font-display font-bold text-white text-[1.8vw] leading-tight mb-[1.5vh]">
                Share free. Sell what you&apos;ve built.
              </h3>
              <p className="text-white/75 font-body text-[1.1vw] leading-snug mb-[2.5vh]">
                Package your lesson stacks into activity packs. Assign them to your department, share with partner schools, or list them for purchase.
              </p>

              <div className="rounded-[1rem] bg-white/10 border border-white/15 p-[1.6vh_1.2vw] mb-[1.5vh]">
                <div className="flex items-center justify-between mb-[0.8vh]">
                  <span className="font-display font-bold text-white text-[1.05vw]">Commedia KS3 pack</span>
                  <span className="font-display font-black text-accent text-[1.2vw]">£24.99</span>
                </div>
                <div className="font-body text-white/70 text-[0.9vw]">By Sarah M. &middot; 8 lessons &middot; Drama</div>
              </div>

              <div className="flex flex-col gap-[0.9vh] font-body text-white/85 text-[1vw]">
                <div className="flex items-center gap-[0.7vw]">
                  <span className="w-[0.5vw] h-[0.5vw] rounded-full bg-accent shrink-0" />
                  Share packs with your team at no cost
                </div>
                <div className="flex items-center gap-[0.7vw]">
                  <span className="w-[0.5vw] h-[0.5vw] rounded-full bg-accent shrink-0" />
                  Sell to other schools and keep creating
                </div>
                <div className="flex items-center gap-[0.7vw]">
                  <span className="w-[0.5vw] h-[0.5vw] rounded-full bg-accent shrink-0" />
                  Partner content always one click away
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
