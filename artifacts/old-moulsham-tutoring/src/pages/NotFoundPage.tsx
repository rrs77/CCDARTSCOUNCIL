import { Link } from "wouter";

export function NotFoundPage() {
  return (
    <section className="atmosphere">
      <div className="safe-px mx-auto flex max-w-6xl flex-col items-start py-24">
        <p className="text-xs font-bold tracking-[0.18em] text-gold uppercase">404</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-ink">Page not found</h1>
        <p className="mt-3 max-w-md text-ink-soft">
          That page doesn’t exist. Head back to the homepage to explore tutoring options.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-12 items-center rounded-md bg-teal px-6 py-3 font-bold text-white hover:bg-teal-deep"
        >
          Back to home
        </Link>
      </div>
    </section>
  );
}
