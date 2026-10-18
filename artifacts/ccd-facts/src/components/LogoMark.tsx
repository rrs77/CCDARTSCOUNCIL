/**
 * Brand lockup — ribbon mark + solid “designer” type (Studio Score).
 * Replaces the old lime-ring CCD circle.
 */
export function LogoMark({
  letters: _letters = 'CCD',
  className = '',
  size = 48,
  title = 'designer',
  light = true,
}: {
  letters?: string;
  className?: string;
  size?: number;
  title?: string;
  /** White word on dark surfaces (default for The Facts). */
  light?: boolean;
}) {
  const wordPx = Math.max(14, Math.round(size * 0.42));
  return (
    <span
      className={`inline-flex items-center gap-[0.28em] ${className}`}
      role="img"
      aria-label={title}
    >
      <img
        src={`${import.meta.env.BASE_URL}ccd-mark.png`}
        alt=""
        width={size}
        height={size}
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
        decoding="async"
      />
      <span
        aria-hidden
        className="font-extrabold lowercase leading-none tracking-[-0.03em]"
        style={{
          fontSize: wordPx,
          fontFamily:
            "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
          color: light ? '#FFFFFF' : '#1F1B4D',
        }}
      >
        designer
      </span>
    </span>
  );
}
