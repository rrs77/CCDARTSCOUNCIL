import { ArrowLeft, Eye, EyeOff, Plus } from "lucide-react";
import { uid } from "@/lib/utils";
import { usePlanner } from "@/store";
import { ProtoNav } from "../ProtoNav";
import { Button, Field, TextField } from "../ui";

export function SettingsScreen() {
  const { state, dispatch, snapshot, setScreen } = usePlanner();
  const { settings } = state;

  return (
    <div className="planner-shell min-h-screen">
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => setScreen("planner")}>
            <ArrowLeft className="h-4 w-4" />
            Back to planner
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Settings</h1>
            <p className="text-sm text-slate-500">
              Everything here updates the prototype live — colours, subjects, sections, terms.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            snapshot();
            dispatch({ type: "RESET_DEMO" });
          }}
        >
          Reset demo data
        </Button>
      </header>

      <div className="mx-auto grid max-w-5xl gap-4 px-6 pb-24 lg:grid-cols-2">
        <section className="rounded-[1.5rem] card-surface-strong p-5">
          <h2 className="text-sm font-extrabold text-slate-800">Class defaults</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Class name">
              <TextField
                value={settings.className}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_SETTINGS",
                    patch: { className: e.target.value },
                  })
                }
              />
            </Field>
            <Field label="Year group">
              <TextField
                value={settings.yearGroup}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_SETTINGS",
                    patch: { yearGroup: e.target.value },
                  })
                }
              />
            </Field>
            <Field label="Default lesson length (min)">
              <TextField
                type="number"
                value={settings.defaultTargetMin}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_SETTINGS",
                    patch: { defaultTargetMin: Number(e.target.value) || 45 },
                  })
                }
              />
            </Field>
          </div>
        </section>

        <section className="rounded-[1.5rem] card-surface-strong p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-800">Subjects & colours</h2>
            <Button
              variant="soft"
              size="sm"
              onClick={() => {
                snapshot();
                dispatch({
                  type: "ADD_SUBJECT",
                  subject: {
                    id: uid("sub"),
                    name: "New subject",
                    color: "#6366F1",
                    hidden: false,
                  },
                });
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Add subject
            </Button>
          </div>
          <ul className="mt-3 space-y-2">
            {settings.subjects.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2"
              >
                <input
                  type="color"
                  value={s.color}
                  onChange={(e) => {
                    snapshot();
                    dispatch({
                      type: "UPDATE_SUBJECT",
                      id: s.id,
                      patch: { color: e.target.value },
                    });
                  }}
                  className="h-9 w-9 cursor-pointer rounded-xl border-0 bg-transparent"
                />
                <TextField
                  value={s.name}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_SUBJECT",
                      id: s.id,
                      patch: { name: e.target.value },
                    })
                  }
                  className="min-w-[120px] flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    snapshot();
                    dispatch({
                      type: "UPDATE_SUBJECT",
                      id: s.id,
                      patch: { hidden: !s.hidden },
                    });
                  }}
                >
                  {s.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {s.hidden ? "Hidden" : "Visible"}
                </Button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[1.5rem] card-surface-strong p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-800">Flexible section types</h2>
            <Button
              variant="soft"
              size="sm"
              onClick={() => {
                const label = window.prompt("Section type name?");
                if (!label) return;
                snapshot();
                dispatch({ type: "ADD_SECTION_TYPE", label });
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Add type
            </Button>
          </div>
          <ul className="mt-3 space-y-2">
            {settings.sectionTypes.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2"
              >
                <TextField
                  value={s.label}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_SECTION_TYPE",
                      id: s.id,
                      patch: { label: e.target.value },
                    })
                  }
                  className="flex-1"
                />
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <input
                    type="checkbox"
                    checked={s.enabled}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_SECTION_TYPE",
                        id: s.id,
                        patch: { enabled: e.target.checked },
                      })
                    }
                  />
                  Enabled
                </label>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[1.5rem] card-surface-strong p-5">
          <h2 className="text-sm font-extrabold text-slate-800">Term / half-term dates</h2>
          <p className="mt-1 text-xs text-slate-400">
            Year overview columns use these dates.
          </p>
          <ul className="mt-3 space-y-2">
            {settings.terms.map((t) => (
              <li
                key={t.id}
                className="grid grid-cols-[1fr_auto_auto] gap-2 rounded-2xl bg-slate-50 p-2 sm:grid-cols-[1.2fr_1fr_1fr]"
              >
                <TextField
                  value={t.name}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_TERM",
                      id: t.id,
                      patch: { name: e.target.value },
                    })
                  }
                />
                <TextField
                  type="date"
                  value={t.start}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_TERM",
                      id: t.id,
                      patch: { start: e.target.value },
                    })
                  }
                />
                <TextField
                  type="date"
                  value={t.end}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_TERM",
                      id: t.id,
                      patch: { end: e.target.value },
                    })
                  }
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[1.5rem] card-surface-strong p-5 lg:col-span-2">
          <h2 className="text-sm font-extrabold text-slate-800">Curriculum statements</h2>
          <p className="mt-1 text-xs text-slate-400">
            Marked in lesson plans as “From your curriculum in Settings”.
          </p>
          <ul className="mt-3 space-y-2">
            {settings.curriculum.map((c) => {
              const subject = settings.subjects.find((s) => s.id === c.subjectId);
              return (
                <li
                  key={c.id}
                  className="rounded-2xl border border-slate-100 bg-white px-3 py-2.5 text-sm text-slate-700"
                >
                  <span
                    className="mr-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: subject?.color ?? "#4338CA" }}
                  >
                    {subject?.name} · {c.keyStage}
                  </span>
                  {c.text}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-[1.5rem] border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-5 lg:col-span-2">
          <h2 className="text-sm font-extrabold text-indigo-800">Prototype helpers</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                snapshot();
                dispatch({ type: "SET_EMPTY_MODE", empty: true });
                setScreen("planner");
              }}
            >
              Show empty state
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                dispatch({ type: "RESET_DEMO" });
                setScreen("planner");
              }}
            >
              Restore seeded planner
            </Button>
          </div>
        </section>
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
