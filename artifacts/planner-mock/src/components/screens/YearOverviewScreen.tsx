import { ArrowLeft, Check } from "lucide-react";
import { useMemo } from "react";
import { usePlanner } from "@/store";
import { ProtoNav } from "../ProtoNav";
import { Button } from "../ui";

function formatRange(start: string, end: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${new Date(start).toLocaleDateString(undefined, opts)} – ${new Date(end).toLocaleDateString(undefined, opts)}`;
}

export function YearOverviewScreen() {
  const { state, getSubject, setScreen, dispatch, snapshot } = usePlanner();

  const columns = useMemo(() => {
    return state.settings.terms.map((term) => ({
      term,
      units: state.units.filter((u) => u.termId === term.id),
    }));
  }, [state.settings.terms, state.units]);

  return (
    <div className="planner-shell flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => setScreen("planner")}>
            <ArrowLeft className="h-4 w-4" />
            Back to planner
          </Button>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
              Next screen
            </p>
            <h1 className="text-2xl font-extrabold text-slate-900">Year overview</h1>
          </div>
        </div>
        <Button variant="soft" size="sm" onClick={() => setScreen("settings")}>
          Edit term dates in Settings
        </Button>
      </header>

      <div className="soft-scroll flex-1 overflow-x-auto px-6 pb-24">
        <div className="flex min-w-max gap-4">
          {columns.map(({ term, units }) => (
            <section
              key={term.id}
              className="flex w-[280px] flex-col rounded-[1.5rem] card-surface"
            >
              <div className="border-b border-indigo-50 px-4 py-3">
                <h2 className="text-sm font-extrabold text-indigo-700">{term.name}</h2>
                <p className="text-xs text-slate-400">
                  {formatRange(term.start, term.end)}
                </p>
              </div>
              <div className="flex-1 space-y-2.5 p-3">
                {units.map((unit) => {
                  const subject = getSubject(unit.subjectId);
                  const lessons = unit.lessonIds
                    .map((id) => state.lessons.find((l) => l.id === id))
                    .filter(Boolean);
                  const covered = new Set(
                    lessons.flatMap((l) => l!.curriculumIds),
                  );
                  const strandIds = new Set(
                    state.settings.strands
                      .filter((s) => s.subjectId === unit.subjectId)
                      .map((s) => s.id),
                  );
                  const statements = state.settings.curriculum.filter((c) =>
                    strandIds.has(c.strandId),
                  );
                  return (
                    <article
                      key={unit.id}
                      className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5"
                    >
                      <div className="mb-2 flex items-start gap-2">
                        <span
                          className="mt-1 h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: subject?.color }}
                        />
                        <div className="min-w-0 flex-1" title={unit.title}>
                          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-800">
                            {unit.title}
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            {subject?.name} · {unit.lessonIds.length} lessons
                          </p>
                        </div>
                      </div>
                      <div className="mb-2 space-y-1">
                        {lessons.map((l) => (
                          <button
                            key={l!.id}
                            type="button"
                            onClick={() => {
                              dispatch({ type: "SET_ACTIVE_LESSON", id: l!.id });
                              setScreen("planner");
                            }}
                            className="block w-full truncate rounded-xl bg-slate-50 px-2.5 py-1.5 text-left text-[11px] font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            {l!.title}
                          </button>
                        ))}
                        {lessons.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-indigo-100 px-2 py-3 text-center text-[11px] text-slate-400">
                            No lessons yet
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Curriculum coverage
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {statements.length === 0 ? (
                            <span className="text-[11px] text-slate-400">None linked</span>
                          ) : (
                            statements.map((s, i) => {
                              const hit = covered.has(s.id);
                              return (
                                <span
                                  key={s.id}
                                  title={s.text}
                                  className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    hit
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-slate-100 text-slate-400"
                                  }`}
                                >
                                  {hit ? <Check className="h-2.5 w-2.5" /> : null}S{i + 1}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
                {units.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 px-3 py-10 text-center">
                    <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold text-indigo-400 shadow-sm">
                      +
                    </span>
                    <p className="text-xs font-semibold text-indigo-600">
                      No units in {term.name}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Assign a unit to this term from My units
                    </p>
                  </div>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </div>
      <ProtoNav
        onLessonPlan={() => setScreen("planner")}
        onEmpty={() => {
          snapshot();
          dispatch({ type: "SET_EMPTY_MODE", empty: true });
          setScreen("planner");
        }}
      />
    </div>
  );
}
