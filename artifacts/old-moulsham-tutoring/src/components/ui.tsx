import { Link } from "wouter";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  light?: boolean;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  children,
  light = false,
  align = "left",
}: SectionHeadingProps) {
  return (
    <div className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      {eyebrow ? (
        <p
          className={`mb-3 text-xs font-bold tracking-[0.18em] uppercase ${
            light ? "text-gold-soft" : "text-gold"
          }`}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`font-display text-balance text-3xl font-bold tracking-tight sm:text-4xl ${
          light ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {children ? (
        <div className={`mt-4 text-base leading-relaxed sm:text-lg ${light ? "text-mint/90" : "text-ink-soft"}`}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function CtaButton({
  href,
  children,
  variant = "gold",
}: {
  href: string;
  children: ReactNode;
  variant?: "gold" | "outline" | "teal";
}) {
  const styles =
    variant === "gold"
      ? "bg-gold text-ink hover:bg-gold-bright"
      : variant === "teal"
        ? "bg-teal text-white hover:bg-teal-deep"
        : "border border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20";

  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center rounded-md px-6 py-3 text-center text-base font-bold transition ${styles}`}
    >
      {children}
    </Link>
  );
}

export function FadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function HeroGraphic() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md lg:max-w-none" aria-hidden>
      <div className="animate-float absolute inset-[8%] rounded-full bg-gradient-to-br from-sage/40 via-gold/20 to-transparent blur-2xl" />
      <svg viewBox="0 0 420 420" className="relative h-full w-full drop-shadow-sm">
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7CB7A3" />
            <stop offset="55%" stopColor="#E8F4EF" />
            <stop offset="100%" stopColor="#D4A017" />
          </linearGradient>
        </defs>
        <circle cx="210" cy="210" r="170" fill="none" stroke="url(#ring)" strokeWidth="1.5" opacity="0.55" />
        <circle cx="210" cy="210" r="132" fill="rgba(232,244,239,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        <path
          className="animate-draw"
          d="M95 268 C140 210, 175 185, 210 175 C255 160, 290 168, 330 145"
          fill="none"
          stroke="#D4A017"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M210 95c-12 26-46 58-78 78 14 6 30 9 45 9 12 0 24-2 34-6C205 141 208 116 210 95z"
          fill="#7CB7A3"
          opacity="0.95"
        />
        <path
          d="M210 95c12 26 46 58 78 78-14 6-30 9-45 9-12 0-24-2-34-6C215 141 212 116 210 95z"
          fill="#B8DCCF"
        />
        <path
          d="M132 195c28 8 56 7 78-2 22 9 50 10 78 2-10 50-42 90-78 110-36-20-68-60-78-110z"
          fill="#E8F4EF"
          opacity="0.92"
        />
        <path d="M210 186c2 24 4 50 0 76" stroke="#D4A017" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="210" cy="268" r="7" fill="#D4A017" />
        <text
          x="210"
          y="330"
          textAnchor="middle"
          fill="#E8F4EF"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "22px", fontWeight: 700 }}
        >
          Grade 9
        </text>
        <text
          x="210"
          y="356"
          textAnchor="middle"
          fill="rgba(184,220,207,0.9)"
          style={{ fontFamily: "Figtree, sans-serif", fontSize: "13px", fontWeight: 600 }}
        >
          Maths · Combined Science
        </text>
      </svg>
    </div>
  );
}
