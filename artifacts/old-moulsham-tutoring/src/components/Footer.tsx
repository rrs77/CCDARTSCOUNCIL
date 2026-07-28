import { Link } from "wouter";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="border-t border-teal/10 bg-teal-deep text-mint">
      <div className="safe-px mx-auto grid max-w-6xl gap-10 py-12 sm:py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-sage-soft">
            Friendly, personalised Maths and Combined Science support for students from Year 7
            through to GCSE — from a student who recently achieved Grade 9 in both.
          </p>
        </div>

        <div>
          <h2 className="font-display text-sm font-bold tracking-wide text-white uppercase">
            Explore
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-sage-soft">
            <li>
              <Link href="/maths" className="hover:text-white">
                Mathematics
              </Link>
            </li>
            <li>
              <Link href="/science" className="hover:text-white">
                Combined Science
              </Link>
            </li>
            <li>
              <Link href="/#approach" className="hover:text-white">
                Personalised lessons
              </Link>
            </li>
            <li>
              <Link href="/#tuition" className="hover:text-white">
                Online &amp; home tuition
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-sm font-bold tracking-wide text-white uppercase">
            Details
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-sage-soft">
            <li>£45 per hour</li>
            <li>Online lessons available</li>
            <li>Home visits within 3 miles of Oaklands School, Chelmsford</li>
            <li>
              <Link href="/contact" className="font-semibold text-gold-soft hover:text-white">
                Get in touch →
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="safe-px border-t border-white/10 py-4 text-center text-xs text-sage/80 sm:text-left">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Old Moulsham Tutoring</p>
          <p>Peer tutoring · Chelmsford</p>
        </div>
      </div>
    </footer>
  );
}
