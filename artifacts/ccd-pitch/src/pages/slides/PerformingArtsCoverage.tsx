export default function PerformingArtsCoverage() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div
        className="absolute -top-[15vh] -right-[15vw] rounded-full"
        style={{
          width: "55vw",
          height: "55vw",
          background: "radial-gradient(circle at center, rgba(255,107,107,0.18), transparent 65%)",
          filter: "blur(3vw)",
        }}
      />

      <div className="relative z-10 h-full w-full flex flex-col px-[7vw] py-[7vh] slide-auto-enter">
        <div className="max-w-[70vw] mb-[5vh]">
          <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[1vw] mb-[2.5vh]">
            What it covers
          </span>
          <h2
            className="font-display font-black text-text tracking-tight leading-[1.02]"
            style={{ fontSize: "4.6vw", textWrap: "balance" }}
          >
            Drama. Music. Dance. One workspace.
          </h2>
          <p
            className="mt-[2vh] text-muted font-body leading-snug max-w-[55vw]"
            style={{ fontSize: "1.4vw", textWrap: "pretty" }}
          >
            Three disciplines that share the same rhythm of teaching — warm-up, main, plenary — modelled end-to-end with starter content across every key stage from EYFS to KS5.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-[1.8vw] flex-1">
          <div className="rounded-[1.5rem] bg-[#FFE5D6] border border-[#FFB07A]/40 p-[3vh_1.8vw] flex flex-col">
            <div className="flex items-center justify-between mb-[2vh]">
              <span className="font-display font-black text-[#A24A1A] text-[2.2vw] leading-none">Drama</span>
              <span className="font-body text-[#A24A1A]/80 text-[0.95vw]">EYFS · KS1–KS2 · KS3–KS5</span>
            </div>
            <div className="font-body text-[#A24A1A]/85 text-[1.05vw] leading-snug mb-[2vh]">
              Storytelling, voice, character &amp; physical theatre — built around ensemble work and clear performance moments.
            </div>
            <div className="mt-auto flex flex-col gap-[0.8vh] pt-[1.5vh] border-t border-[#A24A1A]/15">
              <div className="font-body text-[#A24A1A] text-[1vw]">&middot; Storytelling Through Drama</div>
              <div className="font-body text-[#A24A1A] text-[1vw]">&middot; Improvisation &amp; Status</div>
              <div className="font-body text-[#A24A1A] text-[1vw]">&middot; Scripted Scene Work</div>
              <div className="font-body text-[#A24A1A] text-[1vw]">&middot; Devising from Stimulus</div>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-[#D6E8F2] border border-[#0EA4D4]/30 p-[3vh_1.8vw] flex flex-col">
            <div className="flex items-center justify-between mb-[2vh]">
              <span className="font-display font-black text-[#0A4A66] text-[2.2vw] leading-none">Music</span>
              <span className="font-body text-[#0A4A66]/80 text-[0.95vw]">EYFS · KS1–KS2 · KS3–KS5</span>
            </div>
            <div className="font-body text-[#0A4A66]/85 text-[1.05vw] leading-snug mb-[2vh]">
              Rhythm, pitch, listening and singing — with backing tracks, vocal guides and resource links attached to every activity.
            </div>
            <div className="mt-auto flex flex-col gap-[0.8vh] pt-[1.5vh] border-t border-[#0A4A66]/15">
              <div className="font-body text-[#0A4A66] text-[1vw]">&middot; Rhythms of West Africa</div>
              <div className="font-body text-[#0A4A66] text-[1vw]">&middot; Singing &amp; Vocal Health</div>
              <div className="font-body text-[#0A4A66] text-[1vw]">&middot; Body Percussion</div>
              <div className="font-body text-[#0A4A66] text-[1vw]">&middot; Composing with Loops</div>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-[#E8E2F2] border border-[#7C6BF0]/30 p-[3vh_1.8vw] flex flex-col">
            <div className="flex items-center justify-between mb-[2vh]">
              <span className="font-display font-black text-[#3D2F7A] text-[2.2vw] leading-none">Dance</span>
              <span className="font-body text-[#3D2F7A]/80 text-[0.95vw]">EYFS · KS1–KS2 · KS3–KS5</span>
            </div>
            <div className="font-body text-[#3D2F7A]/85 text-[1.05vw] leading-snug mb-[2vh]">
              Motif, canon, contact and choreography — sequenced so a class can build a performance piece across a half-term.
            </div>
            <div className="mt-auto flex flex-col gap-[0.8vh] pt-[1.5vh] border-t border-[#3D2F7A]/15">
              <div className="font-body text-[#3D2F7A] text-[1vw]">&middot; Motif &amp; Canon</div>
              <div className="font-body text-[#3D2F7A] text-[1vw]">&middot; Contact &amp; Trust Work</div>
              <div className="font-body text-[#3D2F7A] text-[1vw]">&middot; Storm &amp; Weather Studies</div>
              <div className="font-body text-[#3D2F7A] text-[1vw]">&middot; Choreographing in Groups</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
