type LogoProps = {
  className?: string;
  compact?: boolean;
  light?: boolean;
};

export function Logo({ className = "", compact = false, light = false }: LogoProps) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <img
        src={`${import.meta.env.BASE_URL}logo.png`}
        alt="Old Moulsham Tutoring"
        className={
          compact
            ? "h-11 w-auto sm:h-12"
            : light
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
