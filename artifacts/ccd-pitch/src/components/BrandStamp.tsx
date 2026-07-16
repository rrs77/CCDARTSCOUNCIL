const base = import.meta.env.BASE_URL;

/**
 * Deck-wide corner logo: purple CC mark + "DESIGNER" text on a subtle
 * translucent pill so it stays legible on any slide background,
 * light or dark.
 */
export default function BrandStamp() {
  return (
    <div
      className="absolute top-[3vh] left-[2.5vw] z-[60] pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="inline-flex items-center"
        style={{
          height: "5vh",
          fontSize: "5vh",
          gap: "0.18em",
          lineHeight: 1,
          padding: "0.9vh 1.4vh",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.88)",
          boxShadow: "0 2px 10px rgba(26,16,51,0.18)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      >
        <img
          src={`${base}cc-mark.png`}
          alt=""
          aria-hidden
          crossOrigin="anonymous"
          style={{ height: "100%", width: "auto", display: "block" }}
        />
        <span
          style={{
            color: "#1a1033",
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            fontWeight: 700,
            letterSpacing: "0.06em",
            fontSize: "0.4em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          Designer
        </span>
      </div>
    </div>
  );
}
