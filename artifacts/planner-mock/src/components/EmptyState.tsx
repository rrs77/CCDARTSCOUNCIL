import { FileText, Sparkles } from "lucide-react";
import { Button, EmptyIllustration } from "./ui";

export function EmptyState({
  onStartTemplate,
  onBrowseLibrary,
}: {
  onStartTemplate: () => void;
  onBrowseLibrary?: () => void;
}) {
  return (
    <section className="relative flex min-h-[420px] min-w-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-[1.75rem] card-surface-strong px-6 py-14 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(480px 220px at 50% 20%, rgba(99,102,241,0.12), transparent 70%)",
        }}
      />
      <div className="relative z-10">
        <EmptyIllustration />
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Your lesson canvas is clear
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500">
          Start from a plan template tuned to your key stage, or drag activities from
          the library to compose a mixed-arts sequence.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button variant="primary" size="lg" onClick={onStartTemplate}>
            <FileText className="h-4 w-4" />
            Start from a template
          </Button>
          {onBrowseLibrary ? (
            <Button variant="secondary" size="lg" onClick={onBrowseLibrary}>
              <Sparkles className="h-4 w-4" />
              Explore activities
            </Button>
          ) : null}
        </div>
        <p className="mt-5 text-xs font-medium text-indigo-400">
          Tip: templates create a full lesson you can remix instantly
        </p>
      </div>
    </section>
  );
}
