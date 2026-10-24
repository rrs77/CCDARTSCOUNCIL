import { KEY_STAGE_LABELS } from "@/mockData";
import { usePlanner } from "@/store";
import type { KeyStage } from "@/types";
import { useMemo, useState } from "react";
import { Button, CloseX, ModalShell, Segmented } from "../ui";

export function TemplatePickerModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { state, dispatch, snapshot } = usePlanner();
  const [filter, setFilter] = useState<KeyStage | "ALL">(state.keyStage);

  const templates = useMemo(
    () =>
      state.templates.filter((t) => filter === "ALL" || t.keyStage === filter),
    [state.templates, filter],
  );

  return (
    <ModalShell open={open} onClose={onClose}>
      <div className="flex items-center justify-between border-b border-indigo-50 px-5 py-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Choose plan template</h2>
          <p className="text-sm text-slate-500">Filtered by key stage — applies instantly to a new lesson.</p>
        </div>
        <CloseX onClick={onClose} />
      </div>
      <div className="border-b border-indigo-50 px-5 py-3">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { id: "ALL" as const, label: "All" },
            ...(["EYFS", "KS1", "KS2", "KS3", "KS4", "KS5"] as KeyStage[]).map(
              (ks) => ({ id: ks, label: ks }),
            ),
          ]}
        />
      </div>
      <div className="soft-scroll grid flex-1 gap-3 overflow-y-auto p-5 sm:grid-cols-2">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => {
              snapshot();
              dispatch({ type: "APPLY_TEMPLATE", templateId: tpl.id });
              onClose();
            }}
            className="rounded-3xl border border-indigo-50 bg-gradient-to-br from-white to-indigo-50/40 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                {tpl.keyStage} · {KEY_STAGE_LABELS[tpl.keyStage]}
              </span>
              <span className="text-xs font-semibold text-slate-400">{tpl.targetMin} min</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900">{tpl.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{tpl.description}</p>
            <p className="mt-3 text-xs font-medium text-indigo-600">
              {tpl.activityIds.length} activities · tap to use
            </p>
          </button>
        ))}
        {templates.length === 0 ? (
          <p className="col-span-full py-10 text-center text-sm text-slate-400">
            No templates for this key stage yet.
          </p>
        ) : null}
      </div>
      <div className="flex justify-end border-t border-indigo-50 px-5 py-3">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </ModalShell>
  );
}
