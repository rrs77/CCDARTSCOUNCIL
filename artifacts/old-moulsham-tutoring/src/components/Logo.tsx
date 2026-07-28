type LogoProps = {
  className?: string;
  compact?: boolean;
  light?: boolean;
};

export function Logo({ className = "", compact = false, light = false }: LogoProps) {
  if (compact) {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <BrandMark className="h-11 w-auto sm:h-12" />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center ${className}`}>
      <img
        src={`${import.meta.env.BASE_URL}logo.png`}
        alt="Old Moulsham Tutoring"
        className={
          light
            ? "h-16 w-auto rounded-md bg-[#F9F5F0] p-1.5 sm:h-[4.5rem]"
            : "h-12 w-auto sm:h-14 md:h-16"
        }
        width={320}
        height={280}
        decoding="async"
      />
    </span>
  );
}

function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 190"
      className={className}
      role="img"
      aria-label="Old Moulsham Tutoring"
    >
      <text
        x="110"
        y="78"
        textAnchor="middle"
        fill="#1A4335"
        fontFamily="Montserrat, Arial, Helvetica, sans-serif"
        fontSize="72"
        fontWeight="700"
        letterSpacing="3"
      >
        OM
      </text>
      <line
        x1="118"
        y1="86"
        x2="172"
        y2="81"
        stroke="#E67E5D"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <text
        x="110"
        y="122"
        textAnchor="middle"
        fill="#1A4335"
        fontFamily="Montserrat, Arial, Helvetica, sans-serif"
        fontSize="15"
        fontWeight="600"
        letterSpacing="4.5"
      >
        OLD MOULSHAM
      </text>
      <text
        x="110"
        y="152"
        textAnchor="middle"
        fill="#E67E5D"
        fontFamily="Montserrat, Arial, Helvetica, sans-serif"
        fontSize="12"
        fontWeight="600"
        letterSpacing="10"
      >
        TUTORING
      </text>
    </svg>
  );
}
