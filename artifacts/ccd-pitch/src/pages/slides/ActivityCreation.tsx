export default function ActivityCreation() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div
        className="absolute -top-[10vh] -right-[10vw] rounded-full"
        style={{
          width: "45vw",
          height: "45vw",
          background: "radial-gradient(circle at center, rgba(255,107,107,0.15), transparent 65%)",
          filter: "blur(3vw)",
        }}
      />

      <div className="relative z-10 h-full w-full grid grid-cols-12 gap-[2.05vw] px-[5.74vw] py-[5.3vh] slide-auto-enter">
        <div className="col-span-5 flex flex-col justify-center">
          <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[0.82vw] mb-[1.8vh]">
            Feature 05
          </span>
          <h2
            className="font-display font-black text-text tracking-tight leading-[1.02]"
            style={{ fontSize: "3.44vw", textWrap: "balance" }}
          >
            Build an activity in two minutes.
          </h2>
          <p
            className="mt-[2.6vh] text-muted font-body leading-relaxed"
            style={{ fontSize: "1.11vw", textWrap: "pretty" }}
          >
            A focused form for the things that matter — name, year groups, time, instructions — with dedicated fields for the YouTube clip, the backing track, the worksheet and the web link you'd otherwise lose in a folder.
          </p>

          <div className="mt-[3.1vh] flex flex-col gap-[1.3vh]">
            <div className="flex items-start gap-[0.82vw]">
              <div className="w-[0.33vw] h-[1.97vw] rounded-full bg-accent shrink-0 mt-[0.4vh]" />
              <div>
                <h4 className="font-display font-bold text-text text-[0.98vw] leading-tight">Tag once, find forever</h4>
                <p className="text-muted font-body text-[0.82vw] leading-snug">Subject, year groups and category attach instantly.</p>
              </div>
            </div>
            <div className="flex items-start gap-[0.82vw]">
              <div className="w-[0.33vw] h-[1.97vw] rounded-full bg-primary shrink-0 mt-[0.4vh]" />
              <div>
                <h4 className="font-display font-bold text-text text-[0.98vw] leading-tight">Web links built in</h4>
                <p className="text-muted font-body text-[0.82vw] leading-snug">Six labelled link slots — video, music, backing, vocals, worksheet, web.</p>
              </div>
            </div>
            <div className="flex items-start gap-[0.82vw]">
              <div className="w-[0.33vw] h-[1.97vw] rounded-full bg-accent shrink-0 mt-[0.4vh]" />
              <div>
                <h4 className="font-display font-bold text-text text-[0.98vw] leading-tight">Drag straight in</h4>
                <p className="text-muted font-body text-[0.82vw] leading-snug">New activity drops into the lesson you're building.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-7 flex items-center">
          <div className="w-full rounded-[1.5rem] bg-surface shadow-[0_20px_60px_rgba(0,76,69,0.12)] border border-text/5 overflow-hidden">
            <div className="flex items-center justify-between px-[1.23vw] py-[1.4vh] border-b border-text/10 bg-bg">
              <span className="font-display font-bold text-text text-[0.98vw]">New activity</span>
              <span className="font-body text-muted text-[0.78vw]">Lesson 1 &middot; Storytelling Through Drama</span>
            </div>

            <div className="p-[1.8vh_1.23vw] flex flex-col gap-[1.1vh]">
              <div>
                <div className="font-display font-semibold text-text text-[0.74vw] mb-[0.4vh]">Activity name</div>
                <div className="rounded-[0.6rem] border border-text/15 bg-white p-[0.8vh_0.66vw] font-body text-text text-[0.86vw]">
                  Freeze-Frame Storytelling
                </div>
              </div>

              <div className="grid grid-cols-3 gap-[0.66vw]">
                <div>
                  <div className="font-display font-semibold text-text text-[0.74vw] mb-[0.4vh]">Subject</div>
                  <div className="rounded-[0.6rem] border border-text/15 bg-white p-[0.8vh_0.66vw] font-body text-text text-[0.82vw]">
                    Drama
                  </div>
                </div>
                <div>
                  <div className="font-display font-semibold text-text text-[0.74vw] mb-[0.4vh]">Category</div>
                  <div className="rounded-[0.6rem] border border-text/15 bg-white p-[0.8vh_0.66vw] font-body text-text text-[0.82vw]">
                    Main Activity
                  </div>
                </div>
                <div>
                  <div className="font-display font-semibold text-text text-[0.74vw] mb-[0.4vh]">Time (min)</div>
                  <div className="rounded-[0.6rem] border border-text/15 bg-white p-[0.8vh_0.66vw] font-body text-text text-[0.82vw]">
                    20
                  </div>
                </div>
              </div>

              <div>
                <div className="font-display font-semibold text-text text-[0.74vw] mb-[0.4vh]">Year groups</div>
                <div className="flex flex-wrap gap-[0.33vw]">
                  <span className="px-[0.57vw] py-[0.3vh] rounded-full bg-primary text-white font-body text-[0.74vw]">Year 9</span>
                  <span className="px-[0.57vw] py-[0.3vh] rounded-full bg-primary text-white font-body text-[0.74vw]">Year 11</span>
                  <span className="px-[0.57vw] py-[0.3vh] rounded-full bg-bg border border-text/15 text-muted font-body text-[0.74vw]">Year 12</span>
                  <span className="px-[0.57vw] py-[0.3vh] rounded-full bg-bg border border-text/15 text-muted font-body text-[0.74vw]">Year 13</span>
                </div>
              </div>

              <div>
                <div className="font-display font-semibold text-text text-[0.74vw] mb-[0.4vh]">Instructions</div>
                <div className="rounded-[0.6rem] border border-text/15 bg-white p-[0.8vh_0.66vw] font-body text-text text-[0.78vw] leading-snug">
                  Groups of four create three still images that retell a familiar fable. Use levels, facial expression, and gesture.
                </div>
              </div>

              <div className="rounded-[0.8rem] bg-accent/8 border-2 border-accent/30 p-[1.1vh_0.82vw]">
                <div className="flex items-center justify-between mb-[0.7vh]">
                  <span className="font-display font-bold text-accent-dark text-[0.82vw]">Web links &amp; resources</span>
                  <span className="font-body text-accent-dark/80 text-[0.70vw]">All optional</span>
                </div>
                <div className="grid grid-cols-2 gap-[0.49vw]">
                  <div className="rounded-[0.5rem] border border-accent/20 bg-white p-[0.6vh_0.57vw] font-body text-text text-[0.74vw]">
                    <span className="text-muted text-[0.61vw] block">Video link</span>
                    youtube.com/watch?v=bP-hnB
                  </div>
                  <div className="rounded-[0.5rem] border border-accent/20 bg-white p-[0.6vh_0.57vw] font-body text-text text-[0.74vw]">
                    <span className="text-muted text-[0.61vw] block">Web resource</span>
                    teachingideas.co.uk/drama
                  </div>
                  <div className="rounded-[0.5rem] border border-accent/20 bg-white p-[0.6vh_0.57vw] font-body text-text text-[0.74vw]">
                    <span className="text-muted text-[0.61vw] block">Backing track</span>
                    spotify.com/track/...
                  </div>
                  <div className="rounded-[0.5rem] border border-dashed border-accent/30 bg-accent/5 p-[0.6vh_0.57vw] font-body text-accent-dark/70 text-[0.74vw]">
                    <span className="text-muted text-[0.61vw] block">Worksheet</span>
                    + Add link
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-[0.66vw] pt-[0.5vh]">
                <span className="font-body text-muted text-[0.78vw]">Cancel</span>
                <span className="px-[0.98vw] py-[0.7vh] rounded-[0.6rem] bg-primary-dark text-white font-display font-semibold text-[0.82vw]">
                  Save activity
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
