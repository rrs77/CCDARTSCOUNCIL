export default function WhoItsFor() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div
        className="absolute -bottom-[20vh] -right-[10vw] rounded-full"
        style={{
          width: "50vw",
          height: "50vw",
          background: "radial-gradient(circle at center, rgba(20,184,166,0.18), transparent 65%)",
          filter: "blur(3vw)",
        }}
      />

      <div className="relative z-10 h-full w-full flex flex-col px-[7vw] py-[7vh] slide-auto-enter">
        <div className="max-w-[70vw] mb-[6vh]">
          <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[1vw] mb-[2.5vh]">
            Who it's for
          </span>
          <h2
            className="font-display font-black text-text tracking-tight leading-[1.02]"
            style={{ fontSize: "4.6vw", textWrap: "balance" }}
          >
            Built with arts educators — every key stage, EYFS to KS5.
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-[2vw] flex-1">
          <div className="rounded-[1.5rem] bg-surface shadow-[0_8px_32px_rgba(0,76,69,0.08)] p-[3vh_2vw] flex flex-col">
            <div className="flex items-baseline gap-[0.6vw] mb-[2vh]">
              <span className="font-display font-black text-primary-dark text-[2.6vw] leading-none">Early Years &amp; Primary</span>
            </div>
            <div className="font-body text-muted text-[1vw] mb-[1.5vh]">EYFS · KS1 · KS2 · Ages 3–11</div>
            <h3 className="font-display font-bold text-text text-[1.5vw] leading-tight mb-[1.5vh]">
              Reception leads, generalist teachers and primary arts specialists
            </h3>
            <p className="text-muted font-body text-[1.15vw] leading-snug">
              Plan around continuous provision and adult-led inputs. Give non-specialist teachers the confidence to lead drama, dance and music — backed by activities they can actually run.
            </p>
            <div className="mt-auto pt-[2vh] border-t border-text/10 font-body text-text/80 text-[1.05vw]">
              Continuous provision &middot; non-specialist support
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-primary-dark text-white shadow-[0_12px_40px_rgba(0,76,69,0.2)] p-[3vh_2vw] flex flex-col">
            <div className="flex items-baseline gap-[0.6vw] mb-[2vh]">
              <span className="font-display font-black text-white text-[2.6vw] leading-none">Secondary &amp; Sixth Form</span>
            </div>
            <div className="font-body text-white/70 text-[1vw] mb-[1.5vh]">KS3 · KS4 · KS5 · Ages 11–18</div>
            <h3 className="font-display font-bold text-white text-[1.5vw] leading-tight mb-[1.5vh]">
              Drama, dance and music subject leads &amp; departments
            </h3>
            <p className="text-white/75 font-body text-[1.15vw] leading-snug">
              Sequence units across years, key stages and qualifications — GCSE, A-Level, BTEC and beyond. Build a shared department library of rehearsal techniques, schemes of work and reflective practice, so a great unit is taught well by every teacher.
            </p>
            <div className="mt-auto pt-[2vh] border-t border-white/15 font-body text-white/85 text-[1.05vw]">
              GCSE, A-Level &amp; BTEC frameworks &middot; departmental sharing
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-surface shadow-[0_8px_32px_rgba(0,76,69,0.08)] p-[3vh_2vw] flex flex-col">
            <div className="flex items-baseline gap-[0.6vw] mb-[2vh]">
              <span className="font-display font-black text-primary-dark text-[2.6vw] leading-none">Arts Sector Partners</span>
            </div>
            <div className="font-body text-muted text-[1vw] mb-[1.5vh]">Theatres · Orchestras · Dance companies · Universities</div>
            <h3 className="font-display font-bold text-text text-[1.5vw] leading-tight mb-[1.5vh]">
              Outreach teams, practitioners, training providers and university arts faculties
            </h3>
            <p className="text-muted font-body text-[1.15vw] leading-snug">
              Contribute outreach resources, rehearsal techniques, research-informed frameworks and training pathways into the schools you partner with — strengthening creative practice from EYFS to KS5.
            </p>
            <div className="mt-auto pt-[2vh] border-t border-text/10 font-body text-text/80 text-[1.05vw]">
              Outreach &middot; training &middot; sector-wide collaboration
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
