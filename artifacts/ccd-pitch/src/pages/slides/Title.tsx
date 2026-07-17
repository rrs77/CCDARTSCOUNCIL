export default function Title() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 90% 70% at 50% 40%, #FBF7F1 0%, #F4ECDF 55%, #E9DCC4 100%)",
      }}
    >
      {/* A single, very soft warm wash — the only ambient element on the page */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 50% 38%, rgba(255,193,141,0.22), transparent 70%)",
        }}
      />

      {/* Editorial title block — left-aligned, generous whitespace.
          The brand mark is added by <BrandStamp/> in App.tsx, so we leave the
          top-left clear and rely on negative space to carry the elegance. */}
      <div className="relative z-10 h-full w-full flex flex-col justify-center px-[10vw]">
        <div className="max-w-[72vw]">
          <div
            className="font-body uppercase tracking-[0.32em] text-[#7A5A3A] slide-fade-up"
            style={{ fontSize: "0.95vw", ["--slide-stagger" as string]: "120ms" }}
          >
            A proposal to the Arts Council
          </div>

          <h1
            className="font-display font-medium text-[#1F1A14] tracking-[-0.015em] leading-[1.02] mt-[3.2vh] slide-fade-up"
            style={{
              fontSize: "5.4vw",
              textWrap: "balance",
              ["--slide-stagger" as string]: "240ms",
            }}
          >
            Bringing the arts
            <br />
            <span style={{ color: "#B86F3A", fontStyle: "italic", fontWeight: 400 }}>
              together
            </span>{" "}
            <span className="text-[#1F1A14]/85">— for every child.</span>
          </h1>

          <p
            className="mt-[4vh] text-[#2A2218] font-body leading-[1.5] max-w-[46vw] slide-fade-up"
            style={{
              fontSize: "1.35vw",
              textWrap: "pretty",
              ["--slide-stagger" as string]: "360ms",
            }}
          >
            One connected home for schools, arts organisations and practitioners —
            so exceptional creative opportunities reach the children who need them.
          </p>
        </div>
      </div>

      {/* A single hairline ecosystem cue — four soft dots joined by a thin line.
          Quietly suggests "unity" without ornament. */}
      <div
        className="absolute bottom-[18vh] left-[10vw] flex items-center slide-fade-up"
        style={{
          ["--slide-stagger" as string]: "480ms",
        }}
      >
        {["Schools", "Arts orgs", "Practitioners", "Children"].map((label, i, arr) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <span
                className="rounded-full"
                style={{
                  width: "0.7vw",
                  height: "0.7vw",
                  background: "#B86F3A",
                  boxShadow: "0 0 0 4px rgba(184,111,58,0.10)",
                }}
              />
              <span
                className="font-body text-[#5C4530] mt-[1.1vh] tracking-[0.12em] uppercase whitespace-nowrap"
                style={{ fontSize: "0.78vw" }}
              >
                {label}
              </span>
            </div>
            {i < arr.length - 1 && (
              <span
                className="block mx-[1.4vw]"
                style={{
                  width: "5.5vw",
                  height: "1px",
                  background:
                    "linear-gradient(to right, #B86F3A55, #B86F3A88, #B86F3A55)",
                  marginBottom: "2.4vh",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Footer — minimal attribution */}
      <div
        className="absolute bottom-[5vh] left-[10vw] right-[10vw] flex items-baseline justify-between text-[#5C4530] slide-fade-up"
        style={{ ["--slide-stagger" as string]: "600ms" }}
      >
        <span
          className="font-body uppercase tracking-[0.28em]"
          style={{ fontSize: "0.8vw" }}
        >
          Creative Curriculum Designer
        </span>
        <span className="font-body" style={{ fontSize: "0.8vw" }}>
          www.ccdesigner.co.uk
        </span>
      </div>
    </div>
  );
}
