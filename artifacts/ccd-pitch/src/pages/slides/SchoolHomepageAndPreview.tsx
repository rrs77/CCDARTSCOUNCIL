export default function SchoolHomepageAndPreview() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div
        className="absolute -top-[15vh] -left-[10vw] rounded-full"
        style={{
          width: "40vw",
          height: "40vw",
          background: "radial-gradient(circle at center, rgba(255,107,107,0.15), transparent 65%)",
          filter: "blur(3vw)",
        }}
      />

      <div className="relative z-10 h-full w-full flex flex-col px-[5.74vw] py-[4.4vh] slide-auto-enter">
        <div className="max-w-[47.07vw] mb-[2.6vh]">
          <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[0.82vw] mb-[1.8vh]">
            Feature 08
          </span>
          <h2
            className="font-display font-black text-text tracking-tight leading-[1.02]"
            style={{ fontSize: "3.28vw", textWrap: "balance" }}
          >
            Your school's homepage. A real preview.
          </h2>
          <p
            className="mt-[1.3vh] text-muted font-body leading-snug max-w-[36.98vw]"
            style={{ fontSize: "1.02vw", textWrap: "pretty" }}
          >
            Each school gets a public landing page with their branding, plus a one-click preview that drops a visitor into a curated, read-only walkthrough — no sign-up.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-[1.64vw] flex-1">
          <div className="rounded-[1.5rem] bg-surface shadow-[0_12px_40px_rgba(0,76,69,0.1)] border border-text/5 overflow-hidden flex flex-col">
            <div className="px-[1.15vw] py-[0.9vh] border-b border-text/10 bg-bg flex items-center justify-between">
              <span className="font-display font-semibold text-muted text-[0.70vw]">creativecurriculumdesigner.com/oakhill</span>
              <span className="font-body text-muted text-[0.61vw]">Public homepage</span>
            </div>
            <div className="grid grid-cols-2 flex-1">
              <div className="bg-primary-dark p-[1.8vh_1.15vw] flex flex-col justify-between">
                <div className="flex items-center gap-[0.41vw]">
                  <div className="w-[1.31vw] h-[1.31vw] rounded-md bg-white flex items-center justify-center font-display font-black text-primary-dark text-[0.82vw]">O</div>
                  <span className="font-display font-bold text-white text-[0.78vw]">Oakhill School</span>
                </div>
                <div>
                  <div className="font-display font-black text-white leading-[1] text-[1.8vw]">Performing Arts at Oakhill School</div>
                  <div className="font-body text-white/75 text-[0.70vw] mt-[0.7vh] leading-snug">A year of drama, music and dance — built by our teachers, for our pupils.</div>
                </div>
                <div className="flex flex-col gap-[0.5vh]">
                  <div className="px-[0.74vw] py-[0.7vh] rounded-[0.5rem] bg-accent text-white font-display font-semibold text-[0.74vw] text-center">
                    Sign in
                  </div>
                  <div className="px-[0.74vw] py-[0.7vh] rounded-[0.5rem] bg-white/10 border border-white/30 text-white font-display font-semibold text-[0.74vw] text-center">
                    Preview the curriculum
                  </div>
                </div>
              </div>
              <div className="bg-[#FFE5D6] p-[1.8vh_0.98vw] flex flex-col gap-[0.6vh] justify-center">
                <div className="rounded-[0.5rem] bg-white p-[0.6vh_0.57vw] border border-[#FFB07A]/40">
                  <div className="font-display font-bold text-[#A24A1A] text-[0.66vw]">Drama &middot; Y4</div>
                  <div className="font-body text-[#0f2a2e] text-[0.61vw]">Storytelling Through Drama</div>
                </div>
                <div className="rounded-[0.5rem] bg-white p-[0.6vh_0.57vw] border border-[#0EA4D4]/40">
                  <div className="font-display font-bold text-[#0A4A66] text-[0.66vw]">Music &middot; Y3</div>
                  <div className="font-body text-[#0f2a2e] text-[0.61vw]">Rhythms of West Africa</div>
                </div>
                <div className="rounded-[0.5rem] bg-white p-[0.6vh_0.57vw] border border-[#7C6BF0]/40">
                  <div className="font-display font-bold text-[#3D2F7A] text-[0.66vw]">Dance &middot; Y5</div>
                  <div className="font-body text-[#0f2a2e] text-[0.61vw]">Storm Motif &amp; Canon</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-surface shadow-[0_12px_40px_rgba(0,76,69,0.1)] border border-text/5 overflow-hidden flex flex-col">
            <div className="px-[1.15vw] py-[0.9vh] border-b border-text/10 bg-bg flex items-center justify-between">
              <span className="font-display font-semibold text-muted text-[0.70vw]">creativecurriculumdesigner.com/app</span>
              <span className="font-body text-muted text-[0.61vw]">Preview mode</span>
            </div>
            <div className="bg-accent text-white px-[0.82vw] py-[0.6vh] flex items-center justify-between">
              <span className="font-display font-semibold text-[0.70vw]">You're in preview mode &middot; sample drama, music &amp; dance content</span>
              <div className="flex gap-[0.33vw]">
                <span className="px-[0.57vw] py-[0.3vh] rounded bg-white text-accent font-display font-semibold text-[0.61vw]">Sign in</span>
                <span className="px-[0.57vw] py-[0.3vh] rounded bg-white/15 border border-white/40 text-white font-display font-semibold text-[0.61vw]">Exit</span>
              </div>
            </div>
            <div className="p-[1.2vh_0.98vw] flex-1 flex flex-col gap-[0.7vh]">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-text text-[0.82vw]">Year 4 &middot; Music</span>
                <span className="font-body text-muted text-[0.61vw]">Autumn 1 &middot; 2025–26</span>
              </div>
              <div className="grid grid-cols-3 gap-[0.41vw] flex-1">
                <div className="rounded-[0.5rem] bg-[#D6E8F2] border border-[#0EA4D4]/40 p-[0.5vh_0.49vw]">
                  <div className="font-display font-bold text-[#0A4A66] text-[0.61vw]">Lesson 1</div>
                  <div className="font-body text-[#0A4A66]/80 text-[0.57vw] leading-tight mt-[0.2vh]">Rhythms of West Africa</div>
                </div>
                <div className="rounded-[0.5rem] bg-[#D6E8F2] border border-[#0EA4D4]/40 p-[0.5vh_0.49vw]">
                  <div className="font-display font-bold text-[#0A4A66] text-[0.61vw]">Lesson 2</div>
                  <div className="font-body text-[#0A4A66]/80 text-[0.57vw] leading-tight mt-[0.2vh]">Body percussion patterns</div>
                </div>
                <div className="rounded-[0.5rem] bg-[#D6E8F2] border border-[#0EA4D4]/40 p-[0.5vh_0.49vw]">
                  <div className="font-display font-bold text-[#0A4A66] text-[0.61vw]">Lesson 3</div>
                  <div className="font-body text-[#0A4A66]/80 text-[0.57vw] leading-tight mt-[0.2vh]">Call &amp; response groups</div>
                </div>
                <div className="rounded-[0.5rem] bg-[#D6E8F2] border border-[#0EA4D4]/40 p-[0.5vh_0.49vw]">
                  <div className="font-display font-bold text-[#0A4A66] text-[0.61vw]">Lesson 4</div>
                  <div className="font-body text-[#0A4A66]/80 text-[0.57vw] leading-tight mt-[0.2vh]">Singing in unison</div>
                </div>
                <div className="rounded-[0.5rem] bg-[#D6E8F2] border border-[#0EA4D4]/40 p-[0.5vh_0.49vw]">
                  <div className="font-display font-bold text-[#0A4A66] text-[0.61vw]">Lesson 5</div>
                  <div className="font-body text-[#0A4A66]/80 text-[0.57vw] leading-tight mt-[0.2vh]">Composing with loops</div>
                </div>
                <div className="rounded-[0.5rem] bg-[#D6E8F2] border border-[#0EA4D4]/40 p-[0.5vh_0.49vw]">
                  <div className="font-display font-bold text-[#0A4A66] text-[0.61vw]">Lesson 6</div>
                  <div className="font-body text-[#0A4A66]/80 text-[0.57vw] leading-tight mt-[0.2vh]">Class performance</div>
                </div>
              </div>
              <div className="rounded-[0.5rem] bg-bg border border-dashed border-text/20 p-[0.5vh_0.57vw] font-body text-muted text-[0.61vw] text-center">
                Read-only — click any lesson to explore
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
