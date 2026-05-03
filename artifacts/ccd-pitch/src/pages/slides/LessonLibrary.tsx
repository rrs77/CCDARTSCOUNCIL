export default function LessonLibrary() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div
        className="absolute -top-[10vh] -left-[10vw] rounded-full"
        style={{
          width: "40vw",
          height: "40vw",
          background: "radial-gradient(circle at center, rgba(20,184,166,0.15), transparent 65%)",
          filter: "blur(3vw)",
        }}
      />

      <div className="relative z-10 h-full w-full grid grid-cols-12 gap-[2.5vw] px-[7vw] py-[7vh] slide-auto-enter">
        <div className="col-span-7 flex items-center">
          <div className="w-full rounded-[1.5rem] bg-surface shadow-[0_20px_60px_rgba(0,76,69,0.12)] p-[2.2vw] border border-text/5">
            <div className="flex items-center justify-between mb-[2vh]">
              <span className="font-display font-bold text-text text-[1.4vw]">Lesson library</span>
              <span className="font-body text-muted text-[1vw]">214 lessons</span>
            </div>

            <div className="rounded-[0.8rem] bg-bg border border-text/10 p-[1vh_1vw] mb-[2vh] flex items-center gap-[0.8vw]">
              <div className="w-[1.4vw] h-[1.4vw] rounded-full border-2 border-muted" />
              <span className="font-body text-muted text-[1.1vw]">Search by title, year, or unit…</span>
            </div>

            <div className="grid grid-cols-2 gap-[1.2vw]">
              <div className="rounded-[1rem] border border-text/10 p-[1.8vh_1.2vw] bg-white">
                <div className="flex items-center justify-between mb-[1vh]">
                  <span className="px-[0.6vw] py-[0.2vh] rounded-full bg-[#FFE5D6] text-[#A24A1A] font-display font-semibold text-[0.85vw]">Drama &middot; Y4</span>
                  <span className="font-body text-muted text-[0.85vw]">45 min</span>
                </div>
                <h4 className="font-display font-bold text-text text-[1.25vw] leading-tight">Freeze-frame storytelling</h4>
                <p className="text-muted font-body text-[0.95vw] leading-snug mt-[0.6vh]">Three still images that retell a fable using levels, gesture and gaze.</p>
              </div>

              <div className="rounded-[1rem] border border-text/10 p-[1.8vh_1.2vw] bg-white">
                <div className="flex items-center justify-between mb-[1vh]">
                  <span className="px-[0.6vw] py-[0.2vh] rounded-full bg-[#D6E8F2] text-[#0A4A66] font-display font-semibold text-[0.85vw]">Music &middot; Y3</span>
                  <span className="font-body text-muted text-[0.85vw]">40 min</span>
                </div>
                <h4 className="font-display font-bold text-text text-[1.25vw] leading-tight">Rhythms of West Africa</h4>
                <p className="text-muted font-body text-[0.95vw] leading-snug mt-[0.6vh]">Active listening, body percussion, then a class call-and-response.</p>
              </div>

              <div className="rounded-[1rem] border border-text/10 p-[1.8vh_1.2vw] bg-white">
                <div className="flex items-center justify-between mb-[1vh]">
                  <span className="px-[0.6vw] py-[0.2vh] rounded-full bg-[#E8E2F2] text-[#3D2F7A] font-display font-semibold text-[0.85vw]">Dance &middot; Y5</span>
                  <span className="font-body text-muted text-[0.85vw]">50 min</span>
                </div>
                <h4 className="font-display font-bold text-text text-[1.25vw] leading-tight">Storm motif &amp; canon</h4>
                <p className="text-muted font-body text-[0.95vw] leading-snug mt-[0.6vh]">Build a 16-count motif, then layer it as a four-group canon.</p>
              </div>

              <div className="rounded-[1rem] border border-text/10 p-[1.8vh_1.2vw] bg-white">
                <div className="flex items-center justify-between mb-[1vh]">
                  <span className="px-[0.6vw] py-[0.2vh] rounded-full bg-[#FFE5D6] text-[#A24A1A] font-display font-semibold text-[0.85vw]">Drama &middot; EYFS</span>
                  <span className="font-body text-muted text-[0.85vw]">20 min</span>
                </div>
                <h4 className="font-display font-bold text-text text-[1.25vw] leading-tight">Animal walks circle game</h4>
                <p className="text-muted font-body text-[0.95vw] leading-snug mt-[0.6vh]">Pretend movement and partner observation in a circle.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-5 flex flex-col justify-center">
          <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[1vw] mb-[2vh]">
            Feature 02
          </span>
          <h2
            className="font-display font-black text-text tracking-tight leading-[1.02]"
            style={{ fontSize: "4.2vw", textWrap: "balance" }}
          >
            Every good lesson, kept.
          </h2>
          <p
            className="mt-[3vh] text-muted font-body leading-relaxed"
            style={{ fontSize: "1.4vw", textWrap: "pretty" }}
          >
            A searchable library of lessons your team builds together. Tag by year group, unit and objective. Open the right one when you need it.
          </p>

          <div className="mt-[4vh] grid grid-cols-2 gap-[1vw]">
            <div className="rounded-[1rem] bg-surface border border-text/10 p-[1.8vh_1.2vw]">
              <div className="font-display font-black text-primary-dark text-[2.4vw] leading-none">200+</div>
              <div className="text-muted font-body text-[1vw] mt-[0.5vh]">starter lessons included</div>
            </div>
            <div className="rounded-[1rem] bg-surface border border-text/10 p-[1.8vh_1.2vw]">
              <div className="font-display font-black text-accent text-[2.4vw] leading-none">1-click</div>
              <div className="text-muted font-body text-[1vw] mt-[0.5vh]">duplicate, edit, share</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
