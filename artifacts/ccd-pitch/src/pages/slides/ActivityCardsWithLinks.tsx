export default function ActivityCardsWithLinks() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div
        className="absolute -bottom-[20vh] -left-[10vw] rounded-full"
        style={{
          width: "40vw",
          height: "40vw",
          background: "radial-gradient(circle at center, rgba(20,184,166,0.15), transparent 65%)",
          filter: "blur(3vw)",
        }}
      />

      <div className="relative z-10 h-full w-full grid grid-cols-12 gap-[2.5vw] px-[7vw] py-[6vh] slide-auto-enter">
        <div className="col-span-5 flex flex-col justify-center">
          <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[1vw] mb-[2vh]">
            Feature 04
          </span>
          <h2
            className="font-display font-black text-text tracking-tight leading-[1.02]"
            style={{ fontSize: "4.2vw", textWrap: "balance" }}
          >
            Every resource, one tap away.
          </h2>
          <p
            className="mt-[3vh] text-muted font-body leading-relaxed"
            style={{ fontSize: "1.35vw", textWrap: "pretty" }}
          >
            Activity cards carry the things you actually need in the room: a video demo, a backing track, a vocal guide, a worksheet, a web link. Pupils can see them on the smartboard. Teachers click straight through.
          </p>

          <div className="mt-[3.5vh] flex flex-col gap-[1vh]">
            <div className="flex items-center gap-[0.8vw] font-body text-text text-[1.1vw]">
              <span className="w-[1.6vw] h-[1.6vw] rounded-full bg-[#FFE5D6] text-[#A24A1A] flex items-center justify-center font-display font-bold text-[0.9vw]">▶</span>
              Video demos &amp; performance clips
            </div>
            <div className="flex items-center gap-[0.8vw] font-body text-text text-[1.1vw]">
              <span className="w-[1.6vw] h-[1.6vw] rounded-full bg-[#D6E8F2] text-[#0A4A66] flex items-center justify-center font-display font-bold text-[0.9vw]">♪</span>
              Backing tracks &amp; vocal guides
            </div>
            <div className="flex items-center gap-[0.8vw] font-body text-text text-[1.1vw]">
              <span className="w-[1.6vw] h-[1.6vw] rounded-full bg-primary/20 text-primary-dark flex items-center justify-center font-display font-bold text-[0.9vw]">↗</span>
              Web links &amp; teaching ideas
            </div>
            <div className="flex items-center gap-[0.8vw] font-body text-text text-[1.1vw]">
              <span className="w-[1.6vw] h-[1.6vw] rounded-full bg-accent/20 text-accent-dark flex items-center justify-center font-display font-bold text-[0.9vw]">≡</span>
              Worksheets &amp; printable resources
            </div>
          </div>
        </div>

        <div className="col-span-7 flex flex-col justify-center gap-[1.6vh]">
          <div className="rounded-[1.2rem] bg-surface shadow-[0_12px_40px_rgba(0,76,69,0.1)] p-[2vh_1.6vw] border border-text/5">
            <div className="flex items-start justify-between mb-[1vh]">
              <div>
                <div className="flex items-center gap-[0.6vw] mb-[0.4vh]">
                  <span className="px-[0.5vw] py-[0.15vh] rounded-full bg-[#FFE5D6] text-[#A24A1A] font-display font-semibold text-[0.85vw]">Drama</span>
                  <span className="px-[0.5vw] py-[0.15vh] rounded-full bg-bg border border-text/10 text-muted font-body text-[0.85vw]">Y4 &middot; 20 min</span>
                </div>
                <h4 className="font-display font-bold text-text text-[1.4vw] leading-tight">Freeze-Frame Storytelling</h4>
              </div>
              <span className="text-muted font-body text-[0.95vw] mt-[0.4vh]">Main activity</span>
            </div>
            <p className="font-body text-muted text-[1vw] leading-snug mb-[1.2vh]">
              Groups of four create three still images that retell a familiar fable. Encourage clear use of levels, facial expression, and gesture.
            </p>
            <div className="flex flex-wrap gap-[0.5vw]">
              <span className="inline-flex items-center gap-[0.4vw] px-[0.7vw] py-[0.4vh] rounded-full bg-primary/10 text-primary-dark font-body text-[0.95vw] border border-primary/20">
                <span className="font-display font-bold">↗</span> BBC Bitesize: Drama warm-up games
              </span>
              <span className="inline-flex items-center gap-[0.4vw] px-[0.7vw] py-[0.4vh] rounded-full bg-primary/10 text-primary-dark font-body text-[0.95vw] border border-primary/20">
                <span className="font-display font-bold">↗</span> Teaching Ideas: Freeze-frames
              </span>
            </div>
          </div>

          <div className="rounded-[1.2rem] bg-surface shadow-[0_12px_40px_rgba(0,76,69,0.1)] p-[2vh_1.6vw] border border-text/5">
            <div className="flex items-start justify-between mb-[1vh]">
              <div>
                <div className="flex items-center gap-[0.6vw] mb-[0.4vh]">
                  <span className="px-[0.5vw] py-[0.15vh] rounded-full bg-[#D6E8F2] text-[#0A4A66] font-display font-semibold text-[0.85vw]">Music</span>
                  <span className="px-[0.5vw] py-[0.15vh] rounded-full bg-bg border border-text/10 text-muted font-body text-[0.85vw]">Y3 &middot; 15 min</span>
                </div>
                <h4 className="font-display font-bold text-text text-[1.4vw] leading-tight">Active Listening: Rhythms of West Africa</h4>
              </div>
              <span className="text-muted font-body text-[0.95vw] mt-[0.4vh]">Warm-up</span>
            </div>
            <p className="font-body text-muted text-[1vw] leading-snug mb-[1.2vh]">
              Play a short djembe ensemble recording. Pupils tap the underlying pulse, then identify the call-and-response pattern and shifting layers.
            </p>
            <div className="flex flex-wrap gap-[0.5vw]">
              <span className="inline-flex items-center gap-[0.4vw] px-[0.7vw] py-[0.4vh] rounded-full bg-[#FFE5D6] text-[#A24A1A] font-body text-[0.95vw] border border-[#FFB07A]/40">
                <span className="font-display font-bold">▶</span> Video demo
              </span>
              <span className="inline-flex items-center gap-[0.4vw] px-[0.7vw] py-[0.4vh] rounded-full bg-[#D6E8F2] text-[#0A4A66] font-body text-[0.95vw] border border-[#0EA4D4]/40">
                <span className="font-display font-bold">♪</span> Backing track
              </span>
              <span className="inline-flex items-center gap-[0.4vw] px-[0.7vw] py-[0.4vh] rounded-full bg-primary/10 text-primary-dark font-body text-[0.95vw] border border-primary/20">
                <span className="font-display font-bold">↗</span> BBC Teach: Djembe ensemble
              </span>
            </div>
          </div>

          <div className="rounded-[1.2rem] bg-surface shadow-[0_12px_40px_rgba(0,76,69,0.1)] p-[2vh_1.6vw] border border-text/5">
            <div className="flex items-start justify-between mb-[1vh]">
              <div>
                <div className="flex items-center gap-[0.6vw] mb-[0.4vh]">
                  <span className="px-[0.5vw] py-[0.15vh] rounded-full bg-[#E8E2F2] text-[#3D2F7A] font-display font-semibold text-[0.85vw]">Dance</span>
                  <span className="px-[0.5vw] py-[0.15vh] rounded-full bg-bg border border-text/10 text-muted font-body text-[0.85vw]">Y5 &middot; 25 min</span>
                </div>
                <h4 className="font-display font-bold text-text text-[1.4vw] leading-tight">Storm Motif &amp; Canon</h4>
              </div>
              <span className="text-muted font-body text-[0.95vw] mt-[0.4vh]">Main activity</span>
            </div>
            <p className="font-body text-muted text-[1vw] leading-snug mb-[1.2vh]">
              Build a 16-count motif inspired by a storm. In four groups, layer the motif as a canon, two counts apart.
            </p>
            <div className="flex flex-wrap gap-[0.5vw]">
              <span className="inline-flex items-center gap-[0.4vw] px-[0.7vw] py-[0.4vh] rounded-full bg-[#FFE5D6] text-[#A24A1A] font-body text-[0.95vw] border border-[#FFB07A]/40">
                <span className="font-display font-bold">▶</span> Choreography demo
              </span>
              <span className="inline-flex items-center gap-[0.4vw] px-[0.7vw] py-[0.4vh] rounded-full bg-[#D6E8F2] text-[#0A4A66] font-body text-[0.95vw] border border-[#0EA4D4]/40">
                <span className="font-display font-bold">♪</span> Storm music
              </span>
              <span className="inline-flex items-center gap-[0.4vw] px-[0.7vw] py-[0.4vh] rounded-full bg-accent/15 text-accent-dark font-body text-[0.95vw] border border-accent/25">
                <span className="font-display font-bold">≡</span> Counting worksheet
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
