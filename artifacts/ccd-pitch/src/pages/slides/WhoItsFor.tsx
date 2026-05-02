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

      <div className="relative z-10 h-full w-full flex flex-col px-[7vw] py-[7vh]">
        <div className="max-w-[60vw] mb-[6vh]">
          <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[1vw] mb-[2.5vh]">
            Who it's for
          </span>
          <h2
            className="font-display font-black text-text tracking-tight leading-[1.02]"
            style={{ fontSize: "4.6vw", textWrap: "balance" }}
          >
            Built with primary teachers, for primary teachers.
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-[2vw] flex-1">
          <div className="rounded-[1.5rem] bg-surface shadow-[0_8px_32px_rgba(0,76,69,0.08)] p-[3vh_2vw] flex flex-col">
            <div className="flex items-baseline gap-[0.6vw] mb-[2vh]">
              <span className="font-display font-black text-primary-dark text-[3.2vw] leading-none">EYFS</span>
              <span className="font-body text-muted text-[1vw]">Ages 3–5</span>
            </div>
            <h3 className="font-display font-bold text-text text-[1.5vw] leading-tight mb-[1.5vh]">
              Reception leads shaping play-based learning
            </h3>
            <p className="text-muted font-body text-[1.15vw] leading-snug">
              Plan around continuous provision and adult-led inputs. Capture the activities that spark a child's curiosity, then reuse them next year.
            </p>
            <div className="mt-auto pt-[2vh] border-t border-text/10 font-body text-text/80 text-[1.05vw]">
              Half-term themes &middot; observation prompts
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-primary-dark text-white shadow-[0_12px_40px_rgba(0,76,69,0.2)] p-[3vh_2vw] flex flex-col">
            <div className="flex items-baseline gap-[0.6vw] mb-[2vh]">
              <span className="font-display font-black text-white text-[3.2vw] leading-none">KS1</span>
              <span className="font-body text-white/70 text-[1vw]">Ages 5–7</span>
            </div>
            <h3 className="font-display font-bold text-white text-[1.5vw] leading-tight mb-[1.5vh]">
              Year 1 &amp; 2 teachers building strong foundations
            </h3>
            <p className="text-white/75 font-body text-[1.15vw] leading-snug">
              Map National Curriculum objectives across the year. Mix new activities with proven warm-ups so every lesson starts confident.
            </p>
            <div className="mt-auto pt-[2vh] border-t border-white/15 font-body text-white/85 text-[1.05vw]">
              NC objectives &middot; phonics-friendly stacks
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-surface shadow-[0_8px_32px_rgba(0,76,69,0.08)] p-[3vh_2vw] flex flex-col">
            <div className="flex items-baseline gap-[0.6vw] mb-[2vh]">
              <span className="font-display font-black text-primary-dark text-[3.2vw] leading-none">KS2</span>
              <span className="font-body text-muted text-[1vw]">Ages 7–11</span>
            </div>
            <h3 className="font-display font-bold text-text text-[1.5vw] leading-tight mb-[1.5vh]">
              Year 3–6 teachers and subject leads
            </h3>
            <p className="text-muted font-body text-[1.15vw] leading-snug">
              Sequence units across terms. Share lesson packs across the team so a great Year 5 history unit is never planned twice.
            </p>
            <div className="mt-auto pt-[2vh] border-t border-text/10 font-body text-text/80 text-[1.05vw]">
              Unit planning &middot; team sharing
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
