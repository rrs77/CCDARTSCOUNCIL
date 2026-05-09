export default function LessonPDFExport() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-primary-dark">
      <div
        className="absolute top-0 left-0 rounded-full"
        style={{
          width: "55vw",
          height: "55vw",
          transform: "translate(-25%, -30%)",
          background: "radial-gradient(circle at center, rgba(20,184,166,0.25), transparent 65%)",
          filter: "blur(3vw)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "5vw 5vw",
        }}
      />

      <div className="relative z-10 h-full w-full grid grid-cols-12 gap-[2.5vw] px-[7vw] py-[6vh] slide-auto-enter">
        <div className="col-span-5 flex flex-col justify-center">
          <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[1vw] mb-[2vh]">
            Feature 06
          </span>
          <h2
            className="font-display font-black text-white tracking-tight leading-[1.02]"
            style={{ fontSize: "4.2vw", textWrap: "balance" }}
          >
            Print, project, share — pretty as paper.
          </h2>
          <p
            className="mt-[3vh] text-white/75 font-body leading-relaxed"
            style={{ fontSize: "1.35vw", textWrap: "pretty" }}
          >
            Every lesson exports to a clean PDF — your school's header, the objective, the run of activities with timings, and clickable resource links carried through. Print for cover, hand to a TA or non-specialist colleague stepping in, or send a partner organisation the takeaway from a workshop.
          </p>

          <div className="mt-[3.5vh] grid grid-cols-2 gap-[1vw]">
            <div className="rounded-[1rem] bg-white/10 border border-white/15 p-[1.6vh_1vw]">
              <div className="font-display font-black text-white text-[2vw] leading-none">PDF</div>
              <div className="text-white/70 font-body text-[0.95vw] mt-[0.4vh]">A4 &middot; print-ready</div>
            </div>
            <div className="rounded-[1rem] bg-white/10 border border-white/15 p-[1.6vh_1vw]">
              <div className="font-display font-black text-accent text-[2vw] leading-none">Share</div>
              <div className="text-white/70 font-body text-[0.95vw] mt-[0.4vh]">Link &middot; email &middot; print</div>
            </div>
          </div>
        </div>

        <div className="col-span-7 flex items-center justify-center">
          <div className="w-[42vw] rounded-[0.6rem] bg-white shadow-[0_30px_70px_rgba(0,0,0,0.45)] p-[2.6vh_2.4vw]" style={{ aspectRatio: "1 / 1.2" }}>
            <div className="flex items-center justify-between pb-[1.2vh] border-b-2 border-[#008272]">
              <div>
                <div className="font-display font-bold text-[#008272] text-[0.95vw] uppercase tracking-wide">Coopersale Hall School</div>
                <div className="font-display font-black text-[#0f2a2e] text-[1.5vw] leading-tight mt-[0.3vh]">Freeze-Frame Storytelling</div>
                <div className="font-body text-[#6b7d80] text-[0.8vw] mt-[0.2vh]">Year 4 &middot; Drama &middot; Storytelling Through Drama &middot; Lesson 1 of 6</div>
              </div>
              <div className="text-right">
                <div className="font-display font-bold text-[#0f2a2e] text-[0.85vw]">45 min</div>
                <div className="font-body text-[#6b7d80] text-[0.7vw]">Autumn 1 &middot; Wk 6</div>
              </div>
            </div>

            <div className="mt-[1.4vh]">
              <div className="font-display font-bold text-[#0f2a2e] text-[0.85vw] uppercase tracking-wide">Learning objective</div>
              <div className="font-body text-[#0f2a2e] text-[0.85vw] leading-snug mt-[0.3vh]">
                Pupils will use levels, facial expression and gesture to retell a familiar fable through three still images, then perform with focus and audience awareness.
              </div>
            </div>

            <div className="mt-[1.5vh] rounded-[0.4rem] border-l-[0.4vw] border-[#FFB07A] bg-[#FFF7F0] p-[0.9vh_0.8vw]">
              <div className="flex items-start justify-between">
                <div className="font-display font-bold text-[#A24A1A] text-[0.85vw]">Warm-Up &middot; Mirror Game</div>
                <div className="font-body text-[#A24A1A]/70 text-[0.7vw]">8 min</div>
              </div>
              <div className="font-body text-[#0f2a2e] text-[0.75vw] leading-snug mt-[0.3vh]">
                Pairs face each other. One leads, the other mirrors every movement. Switch after 90 seconds.
              </div>
              <div className="font-body text-[#008272] text-[0.7vw] mt-[0.3vh]">↗ bbc.co.uk/teach/drama-warm-up-games</div>
            </div>

            <div className="mt-[0.8vh] rounded-[0.4rem] border-l-[0.4vw] border-[#0EA4D4] bg-[#F0F8FB] p-[0.9vh_0.8vw]">
              <div className="flex items-start justify-between">
                <div className="font-display font-bold text-[#0A4A66] text-[0.85vw]">Main &middot; Freeze-Frame Storytelling</div>
                <div className="font-body text-[#0A4A66]/70 text-[0.7vw]">22 min</div>
              </div>
              <div className="font-body text-[#0f2a2e] text-[0.75vw] leading-snug mt-[0.3vh]">
                Groups of four create three still images that retell The Tortoise and the Hare. Encourage clear use of levels, facial expression, and gesture.
              </div>
              <div className="font-body text-[#008272] text-[0.7vw] mt-[0.3vh]">↗ teachingideas.co.uk/drama/freeze-frames</div>
            </div>

            <div className="mt-[0.8vh] rounded-[0.4rem] border-l-[0.4vw] border-[#7C6BF0] bg-[#F4F1FB] p-[0.9vh_0.8vw]">
              <div className="flex items-start justify-between">
                <div className="font-display font-bold text-[#3D2F7A] text-[0.85vw]">Plenary &middot; Audience Feedback Circle</div>
                <div className="font-body text-[#3D2F7A]/70 text-[0.7vw]">10 min</div>
              </div>
              <div className="font-body text-[#0f2a2e] text-[0.75vw] leading-snug mt-[0.3vh]">
                Each group performs. The audience names the moment of greatest tension and one strong storytelling choice.
              </div>
            </div>

            <div className="mt-[1.4vh] pt-[1vh] border-t border-[#0f2a2e]/10 flex items-center justify-between">
              <span className="font-body text-[#6b7d80] text-[0.7vw]">Created in Creative Curriculum Designer</span>
              <span className="font-body text-[#6b7d80] text-[0.7vw]">Page 1 of 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
