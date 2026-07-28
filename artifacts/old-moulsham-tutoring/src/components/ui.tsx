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
      {eyebrow ? <div className="accent-rule mb-4" aria-hidden /> : null}
      <h2
        className={`font-display text-balance text-3xl font-bold tracking-tight sm:text-4xl ${
          light ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {children ? (
        <div
          className={`mt-4 text-base leading-relaxed sm:text-lg ${light ? "text-mint/90" : "text-ink-soft"}`}
        >
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
      ? "bg-gold text-white hover:bg-gold-bright"
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
    <div
      className="relative mx-auto flex w-full max-w-md items-center justify-center lg:max-w-lg"
      aria-hidden
    >
      <div className="animate-float absolute inset-[6%] rounded-[2rem] bg-gradient-to-br from-gold/30 via-cream/20 to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-[1.5rem] bg-cream shadow-[0_20px_60px_rgba(18,49,41,0.35)] ring-1 ring-white/20">
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt=""
          className="h-auto w-full"
          width={640}
          height={560}
          decoding="async"
        />
        <div className="border-t border-ink/5 px-5 py-4 text-center sm:px-6">
          <p className="font-display text-sm font-bold tracking-[0.12em] text-ink uppercase">
            Grade 9 · Maths &amp; Science
          </p>
          <div className="mx-auto mt-2 h-0.5 w-12 origin-left -rotate-3 bg-gold" />
        </div>
      </div>
    </div>
  );
}
