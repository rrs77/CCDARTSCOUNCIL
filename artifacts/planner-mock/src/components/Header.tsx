import { BookOpen, ChevronDown, Eye, FileText, GraduationCap, Settings2 } from "lucide-react";
import { KEY_STAGE_LABELS, KEY_STAGES } from "@/mockData";
import { usePlanner } from "@/store";
import type { KeyStage } from "@/types";
import { Button, IconButton } from "./ui";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Header({
  onChooseTemplate,
  onPreviewLesson,
}: {
  onChooseTemplate: () => void;
  onPreviewLesson: () => void;
}) {
  const { state, dispatch, setScreen } = usePlanner();
  const [open, setOpen] = useState(false);

  return (
    <header className="no-print flex flex-wrap items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr]">
      <div className="relative justify-self-start">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="card-surface flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 transition hover:shadow-md"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="text-left leading-tight">
            <span className="block text-sm font-extrabold text-indigo-700">{state.keyStage}</span>
            <span className="block text-xs text-slate-500">{KEY_STAGE_LABELS[state.keyStage]}</span>
          </span>
          <ChevronDown className={cn("ml-1 h-4 w-4 text-slate-400 transition", open && "rotate-180")} />
        </button>
        {open ? (
          <div className="absolute left-0 top-[calc(100%+8px)] z-40 min-w-[220px] overflow-hidden rounded-2xl border border-indigo-100 bg-white p-1.5 shadow-xl shadow-indigo-900/10">
            {KEY_STAGES.map((ks) => (
              <button
                key={ks}
                type="button"
                onClick={() => {
                  dispatch({ type: "SET_KEY_STAGE", keyStage: ks as KeyStage });
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition",
                  state.keyStage === ks
                    ? "bg-indigo-50 font-semibold text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50",
                )}
              >
                <span>{ks}</span>
                <span className="text-xs text-slate-400">{KEY_STAGE_LABELS[ks]}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="secondary" onClick={onChooseTemplate}>
          <FileText className="h-4 w-4" />
          Choose plan template
        </Button>
        <Button variant="primary" onClick={onPreviewLesson}>
          <Eye className="h-4 w-4" />
          Preview lesson
        </Button>
      </div>

      <div className="flex items-center justify-end gap-2">
        <IconButton
          title="Year overview"
          onClick={() => setScreen("year")}
          className="h-10 w-10 rounded-2xl bg-white/80 shadow-sm"
        >
          <BookOpen className="h-5 w-5" />
        </IconButton>
        <IconButton
          title="Settings"
          onClick={() => setScreen("settings")}
          className="h-10 w-10 rounded-2xl bg-white/80 shadow-sm"
        >
          <Settings2 className="h-5 w-5" />
        </IconButton>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-600/30">
          CD
        </div>
      </div>
    </header>
  );
}
