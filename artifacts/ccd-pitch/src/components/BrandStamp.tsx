const base = import.meta.env.BASE_URL;

/**
 * Deck-wide corner logo: purple CC mark + "DESIGNER" text.
 * `variant="dark"`  => dark text (default, for light slide backgrounds).
 * `variant="light"` => white text (for dark slide backgrounds).
 */
export default function BrandStamp({
  variant = "dark",
}: {
  variant?: "light" | "dark";
}) {
  const textColor = variant === "light" ? "#FFFFFF" : "#1a1033";
  const dropShadow =
    variant === "light"
      ? "drop-shadow(0 2px 10px rgba(0,0,0,0.45))"
      : "drop-shadow(0 2px 8px rgba(26,16,51,0.18))";
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
          filter: dropShadow,
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
            color: textColor,
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
