export default function SettingsHub() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div
        className="absolute -bottom-[20vh] -right-[10vw] rounded-full"
        style={{
          width: "45vw",
          height: "45vw",
          background: "radial-gradient(circle at center, rgba(20,184,166,0.15), transparent 65%)",
          filter: "blur(3vw)",
        }}
      />

      <div className="relative z-10 h-full w-full grid grid-cols-12 gap-[2.5vw] px-[7vw] py-[6vh] slide-auto-enter">
        <div className="col-span-5 flex flex-col justify-center">
          <span className="inline-block text-accent font-display font-semibold uppercase tracking-[0.18em] text-[1vw] mb-[2vh]">
            Feature 07
          </span>
          <h2
            className="font-display font-black text-text tracking-tight leading-[1.02]"
            style={{ fontSize: "4.2vw", textWrap: "balance" }}
          >
            Settings that fit your school.
          </h2>
          <p
            className="mt-[3vh] text-muted font-body leading-relaxed"
            style={{ fontSize: "1.35vw", textWrap: "pretty" }}
          >
            One panel for the things that change school by school — year groups, activity categories, your branding on every print-out, and where your data lives.
          </p>

          <div className="mt-[3vh] flex flex-col gap-[1vh]">
            <div className="flex items-center gap-[0.8vw] font-body text-text text-[1.05vw]">
              <span className="w-[0.6vw] h-[0.6vw] rounded-full bg-primary" />
              Year groups, EYFS through A-level
            </div>
            <div className="flex items-center gap-[0.8vw] font-body text-text text-[1.05vw]">
              <span className="w-[0.6vw] h-[0.6vw] rounded-full bg-accent" />
              Custom activity categories per subject
            </div>
            <div className="flex items-center gap-[0.8vw] font-body text-text text-[1.05vw]">
              <span className="w-[0.6vw] h-[0.6vw] rounded-full bg-primary" />
              Logo, colours, header on every PDF
            </div>
            <div className="flex items-center gap-[0.8vw] font-body text-text text-[1.05vw]">
              <span className="w-[0.6vw] h-[0.6vw] rounded-full bg-accent" />
              Import, export, back up — your data stays yours
            </div>
          </div>
        </div>

        <div className="col-span-7 flex items-center">
          <div className="w-full rounded-[1.5rem] bg-surface shadow-[0_20px_60px_rgba(0,76,69,0.12)] border border-text/5 overflow-hidden">
            <div className="flex items-center justify-between px-[1.5vw] py-[1.4vh] border-b border-text/10 bg-bg">
              <span className="font-display font-bold text-text text-[1.2vw]">Settings</span>
              <span className="font-body text-muted text-[0.9vw]">Oakhill School</span>
            </div>

            <div className="flex border-b border-text/10 px-[0.6vw] bg-bg/40">
              <div className="px-[0.9vw] py-[1vh] font-display font-semibold text-text text-[0.9vw] border-b-2 border-primary-dark -mb-[1px]">Year groups</div>
              <div className="px-[0.9vw] py-[1vh] font-body text-muted text-[0.9vw]">Categories</div>
              <div className="px-[0.9vw] py-[1vh] font-body text-muted text-[0.9vw]">Resource links</div>
              <div className="px-[0.9vw] py-[1vh] font-body text-muted text-[0.9vw]">Custom objectives</div>
              <div className="px-[0.9vw] py-[1vh] font-body text-muted text-[0.9vw]">Branding</div>
              <div className="px-[0.9vw] py-[1vh] font-body text-muted text-[0.9vw]">Data</div>
              <div className="px-[0.9vw] py-[1vh] font-body text-muted text-[0.9vw]">Users</div>
            </div>

            <div className="grid grid-cols-2 gap-[1vw] p-[1.6vh_1.2vw]">
              <div>
                <div className="font-display font-semibold text-text text-[0.95vw] mb-[0.8vh]">Active year groups</div>
                <div className="flex flex-col gap-[0.6vh]">
                  <div className="flex items-center justify-between rounded-[0.5rem] border border-text/10 bg-white p-[0.7vh_0.7vw]">
                    <span className="font-body text-text text-[0.9vw]">EYFS &middot; Reception</span>
                    <span className="font-body text-muted text-[0.75vw]">↕</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[0.5rem] border border-text/10 bg-white p-[0.7vh_0.7vw]">
                    <span className="font-body text-text text-[0.9vw]">Year 1</span>
                    <span className="font-body text-muted text-[0.75vw]">↕</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[0.5rem] border border-primary/40 bg-primary/5 p-[0.7vh_0.7vw]">
                    <span className="font-body text-text text-[0.9vw]">Year 2</span>
                    <span className="font-body text-primary-dark text-[0.75vw]">↕</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[0.5rem] border border-text/10 bg-white p-[0.7vh_0.7vw]">
                    <span className="font-body text-text text-[0.9vw]">Year 3</span>
                    <span className="font-body text-muted text-[0.75vw]">↕</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[0.5rem] border border-text/10 bg-white p-[0.7vh_0.7vw]">
                    <span className="font-body text-text text-[0.9vw]">Year 4</span>
                    <span className="font-body text-muted text-[0.75vw]">↕</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[0.5rem] border border-text/10 bg-white p-[0.7vh_0.7vw]">
                    <span className="font-body text-text text-[0.9vw]">Year 5</span>
                    <span className="font-body text-muted text-[0.75vw]">↕</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[0.5rem] border border-text/10 bg-white p-[0.7vh_0.7vw]">
                    <span className="font-body text-text text-[0.9vw]">Year 11 &middot; GCSE</span>
                    <span className="font-body text-muted text-[0.75vw]">↕</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[0.5rem] border border-text/10 bg-white p-[0.7vh_0.7vw]">
                    <span className="font-body text-text text-[0.9vw]">Year 13 &middot; A-level</span>
                    <span className="font-body text-muted text-[0.75vw]">↕</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-[1vh]">
                <div className="rounded-[0.6rem] border border-text/10 bg-bg/50 p-[1vh_0.9vw]">
                  <div className="font-display font-semibold text-text text-[0.9vw] mb-[0.4vh]">Branding preview</div>
                  <div className="rounded-[0.4rem] bg-white border border-text/10 p-[0.8vh_0.8vw]">
                    <div className="flex items-center gap-[0.5vw]">
                      <div className="w-[1.4vw] h-[1.4vw] rounded-md bg-primary-dark flex items-center justify-center font-display font-black text-white text-[0.8vw]">C</div>
                      <div>
                        <div className="font-display font-bold text-text text-[0.85vw] leading-tight">Oakhill School</div>
                        <div className="font-body text-muted text-[0.7vw]">Performing Arts Curriculum</div>
                      </div>
                    </div>
                    <div className="mt-[0.6vh] flex gap-[0.3vw]">
                      <div className="w-[1vw] h-[0.4vh] rounded-full bg-primary-dark" />
                      <div className="w-[1vw] h-[0.4vh] rounded-full bg-accent" />
                      <div className="w-[1vw] h-[0.4vh] rounded-full bg-[#FFB07A]" />
                    </div>
                  </div>
                </div>

                <div className="rounded-[0.6rem] border border-text/10 bg-bg/50 p-[1vh_0.9vw]">
                  <div className="font-display font-semibold text-text text-[0.9vw] mb-[0.4vh]">Categories &middot; Drama</div>
                  <div className="flex flex-wrap gap-[0.3vw]">
                    <span className="px-[0.6vw] py-[0.2vh] rounded-full bg-[#FFE5D6] text-[#A24A1A] font-body text-[0.75vw]">Warm-Up</span>
                    <span className="px-[0.6vw] py-[0.2vh] rounded-full bg-[#FFE5D6] text-[#A24A1A] font-body text-[0.75vw]">Main Activity</span>
                    <span className="px-[0.6vw] py-[0.2vh] rounded-full bg-[#FFE5D6] text-[#A24A1A] font-body text-[0.75vw]">Plenary</span>
                    <span className="px-[0.6vw] py-[0.2vh] rounded-full bg-[#FFE5D6] text-[#A24A1A] font-body text-[0.75vw]">Cool-Down</span>
                  </div>
                </div>

                <div className="rounded-[0.6rem] border border-text/10 bg-bg/50 p-[1vh_0.9vw]">
                  <div className="font-display font-semibold text-text text-[0.9vw] mb-[0.4vh]">Data</div>
                  <div className="flex items-center justify-between">
                    <span className="font-body text-muted text-[0.8vw]">Synced 2 min ago</span>
                    <div className="flex gap-[0.4vw]">
                      <span className="px-[0.6vw] py-[0.3vh] rounded-md border border-text/15 bg-white font-body text-text text-[0.75vw]">Import</span>
                      <span className="px-[0.6vw] py-[0.3vh] rounded-md border border-text/15 bg-white font-body text-text text-[0.75vw]">Export</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
