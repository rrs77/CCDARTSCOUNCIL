import { ArrowLeft, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { KEY_STAGES, KEY_STAGE_LABELS } from "@/mockData";
import { uid } from "@/lib/utils";
import { usePlanner } from "@/store";
import type { KeyStage } from "@/types";
import { ProtoNav } from "../ProtoNav";
import {
  Button,
  CloseX,
  Field,
  ModalShell,
  TextField,
  TextInput,
} from "../ui";

type CurriculumDialog =
  | { kind: "framework"; id?: string; name: string }
  | {
      kind: "strand";
      id?: string;
      name: string;
      frameworkId: string;
      subjectId: string;
      keyStage: KeyStage;
    }
  | { kind: "statement"; id?: string; text: string; strandId: string };

export function SettingsScreen() {
  const { state, dispatch, snapshot, setScreen } = usePlanner();
  const { settings } = state;
  const [dialog, setDialog] = useState<CurriculumDialog | null>(null);
  const [filterFramework, setFilterFramework] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterKeyStage, setFilterKeyStage] = useState<KeyStage | "all">("all");

  const filteredStrands = useMemo(() => {
    return settings.strands.filter((s) => {
      if (filterFramework !== "all" && s.frameworkId !== filterFramework) return false;
      if (filterSubject !== "all" && s.subjectId !== filterSubject) return false;
      if (filterKeyStage !== "all" && s.keyStage !== filterKeyStage) return false;
      return true;
    });
  }, [settings.strands, filterFramework, filterSubject, filterKeyStage]);

  const saveDialog = () => {
    if (!dialog) return;
    snapshot();
    if (dialog.kind === "framework") {
      if (dialog.id) {
        dispatch({
          type: "UPDATE_FRAMEWORK",
          id: dialog.id,
          patch: { name: dialog.name.trim() || "Untitled framework" },
        });
      } else {
        dispatch({
          type: "ADD_FRAMEWORK",
          name: dialog.name.trim() || "New framework",
        });
      }
    } else if (dialog.kind === "strand") {
      if (dialog.id) {
        dispatch({
          type: "UPDATE_STRAND",
          id: dialog.id,
          patch: {
            name: dialog.name.trim() || "Untitled strand",
            frameworkId: dialog.frameworkId,
            subjectId: dialog.subjectId,
            keyStage: dialog.keyStage,
          },
        });
      } else {
        dispatch({
          type: "ADD_STRAND",
          strand: {
            name: dialog.name.trim() || "New strand",
            frameworkId: dialog.frameworkId,
            subjectId: dialog.subjectId,
            keyStage: dialog.keyStage,
          },
        });
      }
    } else if (dialog.kind === "statement") {
      if (dialog.id) {
        dispatch({
          type: "UPDATE_STATEMENT",
          id: dialog.id,
          patch: {
            text: dialog.text.trim() || "New statement",
            strandId: dialog.strandId,
          },
        });
      } else {
        dispatch({
          type: "ADD_STATEMENT",
          statement: {
            text: dialog.text.trim() || "New statement",
            strandId: dialog.strandId,
          },
        });
      }
    }
    setDialog(null);
  };

  const dialogTitle =
    dialog?.kind === "framework"
      ? dialog.id
        ? "Rename framework"
        : "Add framework"
      : dialog?.kind === "strand"
        ? dialog.id
          ? "Edit strand"
          : "Add strand"
        : dialog?.kind === "statement"
          ? dialog.id
            ? "Edit statement"
            : "Add statement"
          : "";

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
              Everything here updates the prototype live — colours, subjects, sections, terms,
              and your curriculum.
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800">Curriculum</h2>
              <p className="mt-1 text-xs text-slate-400">
                Define frameworks, strands and statements per subject and key stage. Lesson plans
                and activity cards only pick from what you create here.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="soft"
                size="sm"
                onClick={() => setDialog({ kind: "framework", name: "" })}
              >
                <Plus className="h-3.5 w-3.5" /> Framework
              </Button>
              <Button
                variant="soft"
                size="sm"
                disabled={settings.frameworks.length === 0}
                onClick={() =>
                  setDialog({
                    kind: "strand",
                    name: "",
                    frameworkId: settings.frameworks[0]?.id ?? "",
                    subjectId: settings.subjects.find((s) => !s.hidden)?.id ?? "music",
                    keyStage: state.keyStage,
                  })
                }
              >
                <Plus className="h-3.5 w-3.5" /> Strand
              </Button>
              <Button
                variant="soft"
                size="sm"
                disabled={settings.strands.length === 0}
                onClick={() =>
                  setDialog({
                    kind: "statement",
                    text: "",
                    strandId: settings.strands[0]?.id ?? "",
                  })
                }
              >
                <Plus className="h-3.5 w-3.5" /> Statement
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <select
              className="h-9 rounded-full border border-indigo-100 bg-white px-3 text-xs font-semibold text-slate-600 outline-none"
              value={filterFramework}
              onChange={(e) => setFilterFramework(e.target.value)}
            >
              <option value="all">All frameworks</option>
              {settings.frameworks.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-full border border-indigo-100 bg-white px-3 text-xs font-semibold text-slate-600 outline-none"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
            >
              <option value="all">All subjects</option>
              {settings.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-full border border-indigo-100 bg-white px-3 text-xs font-semibold text-slate-600 outline-none"
              value={filterKeyStage}
              onChange={(e) => setFilterKeyStage(e.target.value as KeyStage | "all")}
            >
              <option value="all">All key stages</option>
              {KEY_STAGES.map((ks) => (
                <option key={ks} value={ks}>
                  {ks} · {KEY_STAGE_LABELS[ks]}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Frameworks
            </h3>
            {settings.frameworks.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-5 text-sm text-slate-500">
                No frameworks yet — add one to start defining strands and statements.
              </p>
            ) : (
              <ul className="space-y-2">
                {settings.frameworks.map((f) => (
                  <li
                    key={f.id}
                    className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2"
                  >
                    <TextField
                      value={f.name}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_FRAMEWORK",
                          id: f.id,
                          patch: { name: e.target.value },
                        })
                      }
                      className="min-w-[160px] flex-1"
                    />
                    <span className="text-[11px] font-semibold text-slate-400">
                      {settings.strands.filter((s) => s.frameworkId === f.id).length} strands
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDialog({ kind: "framework", id: f.id, name: f.name })}
                    >
                      Rename
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        if (
                          !window.confirm(
                            `Delete “${f.name}” and all its strands and statements?`,
                          )
                        )
                          return;
                        snapshot();
                        dispatch({ type: "DELETE_FRAMEWORK", id: f.id });
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Strands & statements
            </h3>
            {filteredStrands.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-5 text-sm text-slate-500">
                No strands match these filters.
              </p>
            ) : (
              filteredStrands.map((strand) => {
                const framework = settings.frameworks.find((f) => f.id === strand.frameworkId);
                const subject = settings.subjects.find((s) => s.id === strand.subjectId);
                const statements = settings.curriculum.filter((c) => c.strandId === strand.id);
                return (
                  <div
                    key={strand.id}
                    className="overflow-hidden rounded-2xl border border-indigo-50 bg-white"
                  >
                    <div className="flex flex-wrap items-center gap-2 border-b border-indigo-50 bg-indigo-50/40 px-3 py-2.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: subject?.color ?? "#4338CA" }}
                      />
                      <TextField
                        value={strand.name}
                        onChange={(e) =>
                          dispatch({
                            type: "UPDATE_STRAND",
                            id: strand.id,
                            patch: { name: e.target.value },
                          })
                        }
                        className="min-w-[120px] flex-1 bg-white"
                        title={strand.name}
                      />
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-indigo-700">
                        {framework?.name} · {subject?.name} · {strand.keyStage}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setDialog({
                            kind: "strand",
                            id: strand.id,
                            name: strand.name,
                            frameworkId: strand.frameworkId,
                            subjectId: strand.subjectId,
                            keyStage: strand.keyStage,
                          })
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        variant="soft"
                        size="sm"
                        onClick={() =>
                          setDialog({
                            kind: "statement",
                            text: "",
                            strandId: strand.id,
                          })
                        }
                      >
                        <Plus className="h-3.5 w-3.5" /> Statement
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Delete strand “${strand.name}” and its statements?`,
                            )
                          )
                            return;
                          snapshot();
                          dispatch({ type: "DELETE_STRAND", id: strand.id });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <ul className="divide-y divide-slate-50">
                      {statements.map((c) => (
                        <li
                          key={c.id}
                          className="flex items-start gap-2 px-3 py-2.5 text-sm text-slate-700"
                        >
                          <p className="min-w-0 flex-1 leading-relaxed">{c.text}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDialog({
                                kind: "statement",
                                id: c.id,
                                text: c.text,
                                strandId: c.strandId,
                              })
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              snapshot();
                              dispatch({ type: "DELETE_STATEMENT", id: c.id });
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))}
                      {statements.length === 0 ? (
                        <li className="px-3 py-4 text-center text-xs text-slate-400">
                          No statements in this strand yet.
                        </li>
                      ) : null}
                    </ul>
                  </div>
                );
              })
            )}
          </div>
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

      <ModalShell open={!!dialog} onClose={() => setDialog(null)}>
        <div className="flex items-center justify-between border-b border-indigo-50 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
              Settings
            </p>
            <h2 className="text-lg font-extrabold text-slate-900">{dialogTitle}</h2>
          </div>
          <CloseX onClick={() => setDialog(null)} />
        </div>
        <div className="soft-scroll flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {dialog?.kind === "framework" ? (
            <Field label="Framework name">
              <TextField
                autoFocus
                value={dialog.name}
                onChange={(e) => setDialog({ ...dialog, name: e.target.value })}
                placeholder="e.g. National Curriculum"
              />
            </Field>
          ) : null}

          {dialog?.kind === "strand" ? (
            <>
              <Field label="Strand name">
                <TextField
                  autoFocus
                  value={dialog.name}
                  onChange={(e) => setDialog({ ...dialog, name: e.target.value })}
                  placeholder="e.g. Performing"
                />
              </Field>
              <Field label="Framework">
                <select
                  className="h-11 w-full rounded-2xl border border-indigo-100 bg-white px-3.5 text-sm outline-none focus:ring-4 focus:ring-indigo-100"
                  value={dialog.frameworkId}
                  onChange={(e) =>
                    setDialog({ ...dialog, frameworkId: e.target.value })
                  }
                >
                  {settings.frameworks.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Subject">
                  <select
                    className="h-11 w-full rounded-2xl border border-indigo-100 bg-white px-3.5 text-sm outline-none focus:ring-4 focus:ring-indigo-100"
                    value={dialog.subjectId}
                    onChange={(e) =>
                      setDialog({ ...dialog, subjectId: e.target.value })
                    }
                  >
                    {settings.subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Key stage">
                  <select
                    className="h-11 w-full rounded-2xl border border-indigo-100 bg-white px-3.5 text-sm outline-none focus:ring-4 focus:ring-indigo-100"
                    value={dialog.keyStage}
                    onChange={(e) =>
                      setDialog({
                        ...dialog,
                        keyStage: e.target.value as KeyStage,
                      })
                    }
                  >
                    {KEY_STAGES.map((ks) => (
                      <option key={ks} value={ks}>
                        {ks} · {KEY_STAGE_LABELS[ks]}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </>
          ) : null}

          {dialog?.kind === "statement" ? (
            <>
              <Field label="Strand">
                <select
                  className="h-11 w-full rounded-2xl border border-indigo-100 bg-white px-3.5 text-sm outline-none focus:ring-4 focus:ring-indigo-100"
                  value={dialog.strandId}
                  onChange={(e) =>
                    setDialog({ ...dialog, strandId: e.target.value })
                  }
                >
                  {settings.strands.map((s) => {
                    const fw = settings.frameworks.find((f) => f.id === s.frameworkId);
                    const sub = settings.subjects.find((x) => x.id === s.subjectId);
                    return (
                      <option key={s.id} value={s.id}>
                        {fw?.name} · {sub?.name} · {s.keyStage} · {s.name}
                      </option>
                    );
                  })}
                </select>
              </Field>
              <Field label="Statement">
                <TextInput
                  autoFocus
                  rows={8}
                  value={dialog.text}
                  onChange={(e) => setDialog({ ...dialog, text: e.target.value })}
                  placeholder="Pupils should be taught to…"
                />
              </Field>
            </>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-indigo-50 px-5 py-3">
          <Button variant="ghost" onClick={() => setDialog(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveDialog}>
            Save
          </Button>
        </div>
      </ModalShell>

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
