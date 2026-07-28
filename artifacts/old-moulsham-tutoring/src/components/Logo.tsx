type LogoProps = {
  className?: string;
  showWordmark?: boolean;
  light?: boolean;
};

export function Logo({ className = "", showWordmark = true, light = false }: LogoProps) {
  const textClass = light ? "text-white" : "text-teal";
  const subClass = light ? "text-sage-soft" : "text-ink-soft";

  return (
    <span className={`inline-flex items-center gap-2.5 sm:gap-3 ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        className="h-10 w-10 shrink-0 sm:h-11 sm:w-11"
        role="img"
        aria-hidden={showWordmark}
        aria-label={showWordmark ? undefined : "Old Moulsham Tutoring"}
      >
        <circle cx="32" cy="32" r="30" fill={light ? "#E8F4EF" : "#0D5C63"} />
        <path
          d="M32 12c-2.2 4.8-8.4 10.6-14.2 14.2 2.6 1.1 5.4 1.7 8.2 1.7 2.2 0 4.3-.4 6.2-1.1C30.8 20.4 31.4 15.8 32 12z"
          fill={light ? "#0D5C63" : "#7CB7A3"}
        />
        <path
          d="M32 12c2.2 4.8 8.4 10.6 14.2 14.2-2.6 1.1-5.4 1.7-8.2 1.7-2.2 0-4.3-.4-6.2-1.1C33.2 20.4 32.6 15.8 32 12z"
          fill={light ? "#2A7A73" : "#9FCFB8"}
        />
        <path
          d="M18 30.5c4.8 1.4 9.6 1.2 14-.4 4.4 1.6 9.2 1.8 14 .4-1.8 8.6-7.2 15.4-14 18.8-6.8-3.4-12.2-10.2-14-18.8z"
          fill={light ? "#B8DCCF" : "#E8F4EF"}
          opacity=".95"
        />
        <path
          d="M32 28.8c.4 4.2.8 8.6 0 13.2"
          stroke="#D4A017"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M24.5 36.2c2.6 1.8 5.4 3 7.5 3.6 2.1-.6 4.9-1.8 7.5-3.6"
          stroke={light ? "#0D5C63" : "#0D5C63"}
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity=".55"
        />
        <circle cx="32" cy="42.5" r="2.2" fill="#D4A017" />
      </svg>
      {showWordmark ? (
        <span className="min-w-0 leading-tight">
          <span className={`font-display block text-[0.95rem] font-bold tracking-tight sm:text-lg ${textClass}`}>
            Old Moulsham Tutoring
          </span>
          <span className={`block text-[0.7rem] font-medium tracking-wide sm:text-xs ${subClass}`}>
            Maths &amp; Combined Science
          </span>
        </span>
      ) : null}
    </span>
  );
}
