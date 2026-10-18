import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { UnitViewer } from '../UnitViewer';
import { HalfTermYearMap, type YearGroupRef } from './HalfTermYearMap';

type Focus =
  | { mode: 'map' }
  | { mode: 'class'; group: YearGroupRef; halfTermId?: string };

/**
 * Primary half-term home: school-wide map, then drill into one year group.
 * Switching year group updates the shared sheet context (Activity Library / Builder stay aligned).
 */
export function HalfTermDesigner() {
  const { currentSheetInfo, setCurrentSheetInfo } = useData();
  const [focus, setFocus] = useState<Focus>({ mode: 'map' });
  const [pendingTerm, setPendingTerm] = useState<string | null>(null);

  const openClass = (group: YearGroupRef, halfTermId?: string) => {
    if (group.id !== currentSheetInfo.sheet) {
      setCurrentSheetInfo({
        sheet: group.id,
        display: group.name,
        eyfs: `${group.id} Statements`,
      });
    }
    if (halfTermId) setPendingTerm(halfTermId);
    setFocus({ mode: 'class', group, halfTermId });
  };

  // Clear one-shot term open after UnitViewer consumes it
  useEffect(() => {
    if (focus.mode !== 'class' || !pendingTerm) return;
    const t = window.setTimeout(() => setPendingTerm(null), 800);
    return () => window.clearTimeout(t);
  }, [focus, pendingTerm]);

  if (focus.mode === 'map') {
    return (
      <HalfTermYearMap
        onOpenClass={(group) => openClass(group)}
        onOpenTerm={(group, halfTermId) => openClass(group, halfTermId)}
      />
    );
  }

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setPendingTerm(null);
            setFocus({ mode: 'map' });
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E2E0EF] bg-white px-3 text-[12px] font-bold text-[#1F1B4D] hover:border-[#bcb7f4] hover:bg-[#F4F3FA]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All year groups
        </button>
        <span className="text-[13px] font-extrabold text-[#1F1B4D]">{focus.group.name}</span>
        <span className="text-[12px] text-[#77738F]">· half-term designer</span>
      </div>
      <UnitViewer
        key={`${focus.group.id}-${focus.halfTermId || 'list'}`}
        initialHalfTermId={pendingTerm || focus.halfTermId || null}
        hidePageChrome
      />
    </div>
  );
}
