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

      <div className="relative z-10 h-full w-full flex flex-col px-[5.74vw] py-[6.2vh] slide-auto-enter">
        <div className="max-w-[47.07vw] mb-[4.4vh]">
          <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[0.82vw] mb-[2.2vh]">
            What it covers
          </span>
          <h2
            className="font-display font-black text-text tracking-tight leading-[1.02]"
            style={{ fontSize: "3.77vw", textWrap: "balance" }}
          >
            Drama. Music. Dance. One workspace.
          </h2>
          <p
            className="mt-[1.8vh] text-muted font-body leading-snug max-w-[36.98vw]"
            style={{ fontSize: "1.15vw", textWrap: "pretty" }}
          >
            Three subjects that share the same rhythm of teaching — warm-up, main, plenary — modelled end-to-end with starter content for every year group.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-[1.48vw] flex-1">
          <div className="rounded-[1.5rem] bg-[#FFE5D6] border border-[#FFB07A]/40 p-[2.6vh_1.48vw] flex flex-col">
            <div className="flex items-center justify-between mb-[1.8vh]">
              <span className="font-display font-black text-[#A24A1A] text-[1.8vw] leading-none">Drama</span>
              <span className="font-body text-[#A24A1A]/80 text-[0.78vw]">EYFS to A-level</span>
            </div>
            <div className="font-body text-[#A24A1A]/85 text-[0.86vw] leading-snug mb-[1.8vh]">
              Storytelling, voice, character &amp; physical theatre — built around ensemble work and clear performance moments.
            </div>
            <div className="mt-auto flex flex-col gap-[0.7vh] pt-[1.3vh] border-t border-[#A24A1A]/15">
              <div className="font-body text-[#A24A1A] text-[0.82vw]">&middot; Storytelling Through Drama</div>
              <div className="font-body text-[#A24A1A] text-[0.82vw]">&middot; Improvisation &amp; Status</div>
              <div className="font-body text-[#A24A1A] text-[0.82vw]">&middot; Scripted Scene Work</div>
              <div className="font-body text-[#A24A1A] text-[0.82vw]">&middot; Devising from Stimulus</div>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-[#D6E8F2] border border-[#0EA4D4]/30 p-[2.6vh_1.48vw] flex flex-col">
            <div className="flex items-center justify-between mb-[1.8vh]">
              <span className="font-display font-black text-[#0A4A66] text-[1.8vw] leading-none">Music</span>
              <span className="font-body text-[#0A4A66]/80 text-[0.78vw]">EYFS to A-level</span>
            </div>
            <div className="font-body text-[#0A4A66]/85 text-[0.86vw] leading-snug mb-[1.8vh]">
              Rhythm, pitch, listening and singing — with backing tracks, vocal guides and resource links attached to every activity.
            </div>
            <div className="mt-auto flex flex-col gap-[0.7vh] pt-[1.3vh] border-t border-[#0A4A66]/15">
              <div className="font-body text-[#0A4A66] text-[0.82vw]">&middot; Rhythms of West Africa</div>
              <div className="font-body text-[#0A4A66] text-[0.82vw]">&middot; Singing &amp; Vocal Health</div>
              <div className="font-body text-[#0A4A66] text-[0.82vw]">&middot; Body Percussion</div>
              <div className="font-body text-[#0A4A66] text-[0.82vw]">&middot; Composing with Loops</div>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-[#E8E2F2] border border-[#7C6BF0]/30 p-[2.6vh_1.48vw] flex flex-col">
            <div className="flex items-center justify-between mb-[1.8vh]">
              <span className="font-display font-black text-[#3D2F7A] text-[1.8vw] leading-none">Dance</span>
              <span className="font-body text-[#3D2F7A]/80 text-[0.78vw]">EYFS to A-level</span>
            </div>
            <div className="font-body text-[#3D2F7A]/85 text-[0.86vw] leading-snug mb-[1.8vh]">
              Motif, canon, contact and choreography — sequenced so a class can build a performance piece across a half-term.
            </div>
            <div className="mt-auto flex flex-col gap-[0.7vh] pt-[1.3vh] border-t border-[#3D2F7A]/15">
              <div className="font-body text-[#3D2F7A] text-[0.82vw]">&middot; Motif &amp; Canon</div>
              <div className="font-body text-[#3D2F7A] text-[0.82vw]">&middot; Contact &amp; Trust Work</div>
              <div className="font-body text-[#3D2F7A] text-[0.82vw]">&middot; Storm &amp; Weather Studies</div>
              <div className="font-body text-[#3D2F7A] text-[0.82vw]">&middot; Choreographing in Groups</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
