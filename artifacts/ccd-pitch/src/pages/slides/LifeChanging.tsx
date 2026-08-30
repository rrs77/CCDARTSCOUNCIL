export default function LifeChanging() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-primary-dark">
      <div
        className="absolute -top-[20vh] -right-[15vw] rounded-full"
        style={{
          width: "60vw",
          height: "60vw",
          background:
            "radial-gradient(circle at center, rgba(124,58,237,0.35), transparent 65%)",
          filter: "blur(4vw)",
        }}
      />
      <div
        className="absolute -bottom-[25vh] -left-[15vw] rounded-full"
        style={{
          width: "55vw",
          height: "55vw",
          background:
            "radial-gradient(circle at center, rgba(255,107,107,0.30), transparent 65%)",
          filter: "blur(4vw)",
        }}
      />

      <div className="relative z-10 h-full w-full grid grid-cols-12 gap-[2.5vw] px-[7vw] py-[7vh] slide-auto-enter">
        <div className="col-span-7 flex flex-col justify-center">
          <span className="inline-block px-[1.2vw] py-[0.6vh] rounded-full bg-white/15 border border-white/30 text-white font-medium text-[1vw] tracking-wide uppercase mb-[3vh] w-fit">
            Inspiring &middot; Life-changing
          </span>
          <h2
            className="font-display font-black text-white tracking-tight leading-[0.98]"
            style={{ fontSize: "5.4vw", textWrap: "balance" }}
          >
            One inspiring lesson can{" "}
            <span className="text-accent">change a life</span>.
          </h2>
          <p
            className="mt-[3vh] text-white/80 font-body leading-relaxed max-w-[42vw]"
            style={{ fontSize: "1.4vw", textWrap: "pretty" }}
          >
            Ask any director, choreographer, conductor or composer where it started, and you'll hear the same answer: a teacher, a moment, a lesson that opened a door. CCD is built so those moments multiply — so the brilliant lesson a teacher teaches in Stoke this Tuesday is the lesson a non-specialist in Truro can teach next week.
          </p>
        </div>

        <div className="col-span-5 flex flex-col justify-center gap-[2vh]">
          <figure className="rounded-[1.5rem] bg-white/8 border border-white/15 backdrop-blur-sm p-[2.4vh_1.8vw]">
            <blockquote className="font-display font-semibold text-white text-[1.5vw] leading-snug">
              "My drama teacher gave me the courage to audition. Without that one lesson I'd have never set foot on a stage."
            </blockquote>
            <figcaption className="mt-[1.4vh] text-accent font-display font-semibold text-[0.95vw] uppercase tracking-wide">
              RSC company member, 2024
            </figcaption>
          </figure>

          <figure className="rounded-[1.5rem] bg-white/8 border border-white/15 backdrop-blur-sm p-[2.4vh_1.8vw]">
            <blockquote className="font-display font-semibold text-white text-[1.5vw] leading-snug">
              "I learned to read music in Year 5 from a peripatetic teacher who came in once a week. That teacher built my whole career."
            </blockquote>
            <figcaption className="mt-[1.4vh] text-accent font-display font-semibold text-[0.95vw] uppercase tracking-wide">
              BBC Symphony player
            </figcaption>
          </figure>

          <div className="rounded-[1.5rem] bg-accent text-white p-[2.4vh_1.8vw]">
            <div className="font-display font-bold text-[1.4vw] leading-tight">
              Every shared lesson is one more door, opened for one more child.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
