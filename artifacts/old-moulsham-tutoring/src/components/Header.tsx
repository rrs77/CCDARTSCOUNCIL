import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/maths", label: "Maths" },
  { href: "/science", label: "Combined Science" },
  { href: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-teal/10 bg-surface/95 backdrop-blur-md transition-shadow duration-300 ${
        scrolled || open ? "shadow-[0_1px_0_rgba(18,52,59,0.06)]" : ""
      }`}
    >
      <div className="safe-px mx-auto flex max-w-6xl items-center justify-between gap-4 py-3 sm:py-4">
        <Link href="/" className="relative z-10 min-w-0" aria-label="Old Moulsham Tutoring home">
          <Logo compact />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((item) => {
            const active = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3.5 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-mint text-teal"
                    : "text-ink-soft hover:bg-mint/70 hover:text-teal"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/contact"
            className="ml-2 inline-flex items-center rounded-md bg-gold px-4 py-2.5 text-sm font-bold text-white transition hover:bg-gold-bright"
          >
            Book a lesson
          </Link>
        </nav>

        <button
          type="button"
          className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-md text-teal lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div
        id="mobile-nav"
        className={`lg:hidden ${open ? "pointer-events-auto visible opacity-100" : "pointer-events-none invisible opacity-0"} fixed inset-0 top-[4.75rem] z-40 transition-opacity duration-200`}
      >
        <button
          type="button"
          className="absolute inset-0 bg-ink/30"
          aria-label="Close menu overlay"
          onClick={() => setOpen(false)}
        />
        <nav
          className="relative mx-3 mt-2 overflow-hidden rounded-xl border border-teal/10 bg-white p-3 shadow-lg sm:mx-4"
          aria-label="Mobile"
        >
          {NAV.map((item) => {
            const active = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-4 py-3.5 text-base font-semibold ${
                  active ? "bg-mint text-teal" : "text-ink hover:bg-sky"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/contact"
            className="mt-2 block rounded-lg bg-gold px-4 py-3.5 text-center text-base font-bold text-white"
          >
            Book a lesson
          </Link>
        </nav>
      </div>
    </header>
  );
}
