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

      <div className="relative z-10 h-full w-full grid grid-cols-12 gap-[2.05vw] pitch-slide-pad slide-auto-enter">
        <div className="col-span-7 flex items-center">
          <div className="w-full rounded-[1.5rem] bg-surface shadow-[0_20px_60px_rgba(0,76,69,0.12)] p-[2.2vw] border border-text/5">
            <div className="flex items-center justify-between mb-[1.8vh]">
              <span className="font-display font-bold text-text text-[1.15vw]">Lesson library</span>
              <span className="font-body text-muted text-[0.82vw]">214 lessons</span>
            </div>

            <div className="rounded-[0.8rem] bg-bg border border-text/10 p-[0.9vh_0.82vw] mb-[1.8vh] flex items-center gap-[0.66vw]">
              <div className="w-[1.15vw] h-[1.15vw] rounded-full border-2 border-muted" />
              <span className="font-body text-muted text-[0.90vw]">Search by title, year, or unit…</span>
            </div>

            <div className="grid grid-cols-2 gap-[0.98vw]">
              <div className="rounded-[1rem] border border-text/10 p-[1.6vh_0.98vw] bg-white">
                <div className="flex items-center justify-between mb-[0.9vh]">
                  <span className="px-[0.49vw] py-[0.2vh] rounded-full bg-[#FFE5D6] text-[#A24A1A] font-display font-semibold text-[0.70vw]">Drama &middot; Y4</span>
                  <span className="font-body text-muted text-[0.70vw]">45 min</span>
                </div>
                <h4 className="pitch-h3 font-display font-bold text-text leading-tight">Freeze-frame storytelling</h4>
                <p className="pitch-body text-muted font-body leading-snug mt-[0.5vh]">Three still images that retell a fable using levels, gesture and gaze.</p>
              </div>

              <div className="rounded-[1rem] border border-text/10 p-[1.6vh_0.98vw] bg-white">
                <div className="flex items-center justify-between mb-[0.9vh]">
                  <span className="px-[0.49vw] py-[0.2vh] rounded-full bg-[#D6E8F2] text-[#0A4A66] font-display font-semibold text-[0.70vw]">Music &middot; Y3</span>
                  <span className="font-body text-muted text-[0.70vw]">40 min</span>
                </div>
                <h4 className="pitch-h3 font-display font-bold text-text leading-tight">Rhythms of West Africa</h4>
                <p className="pitch-body text-muted font-body leading-snug mt-[0.5vh]">Active listening, body percussion, then a class call-and-response.</p>
              </div>

              <div className="rounded-[1rem] border border-text/10 p-[1.6vh_0.98vw] bg-white">
                <div className="flex items-center justify-between mb-[0.9vh]">
                  <span className="px-[0.49vw] py-[0.2vh] rounded-full bg-[#E8E2F2] text-[#3D2F7A] font-display font-semibold text-[0.70vw]">Dance &middot; Y5</span>
                  <span className="font-body text-muted text-[0.70vw]">50 min</span>
                </div>
                <h4 className="pitch-h3 font-display font-bold text-text leading-tight">Storm motif &amp; canon</h4>
                <p className="pitch-body text-muted font-body leading-snug mt-[0.5vh]">Build a 16-count motif, then layer it as a four-group canon.</p>
              </div>

              <div className="rounded-[1rem] border border-text/10 p-[1.6vh_0.98vw] bg-white">
                <div className="flex items-center justify-between mb-[0.9vh]">
                  <span className="px-[0.49vw] py-[0.2vh] rounded-full bg-[#FFE5D6] text-[#A24A1A] font-display font-semibold text-[0.70vw]">Drama &middot; EYFS</span>
                  <span className="font-body text-muted text-[0.70vw]">20 min</span>
                </div>
                <h4 className="pitch-h3 font-display font-bold text-text leading-tight">Animal walks circle game</h4>
                <p className="pitch-body text-muted font-body leading-snug mt-[0.5vh]">Pretend movement and partner observation in a circle.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-5 flex flex-col justify-center">
          <span className="pitch-eyebrow inline-block text-accent font-display font-semibold uppercase mb-[1.8vh]">
            Feature 02
          </span>
          <h2
            className="pitch-h2 font-display font-black text-text tracking-tight leading-[1.02]" style={{textWrap: "balance"}}>
            Every good lesson, kept.
          </h2>
          <p
            className="pitch-body-lg mt-[2.6vh] text-muted font-body leading-relaxed" style={{textWrap: "pretty"}}>
            A searchable library of lessons your team builds together — plus partner packs from ROH and other specialists. Tag by year group, unit and objective. Share your own packs free, or sell them to other schools.
          </p>

          <div className="mt-[3.5vh] grid grid-cols-2 gap-[0.82vw]">
            <div className="rounded-[1rem] bg-surface border border-text/10 p-[1.6vh_0.98vw]">
              <div className="font-display font-black text-primary-dark text-[1.97vw] leading-none">200+</div>
              <div className="text-muted font-body text-[0.82vw] mt-[0.4vh]">starter lessons included</div>
            </div>
            <div className="rounded-[1rem] bg-surface border border-text/10 p-[1.6vh_0.98vw]">
              <div className="font-display font-black text-accent text-[1.97vw] leading-none">Share &amp; sell</div>
              <div className="text-muted font-body text-[0.82vw] mt-[0.4vh]">activity packs you create</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
