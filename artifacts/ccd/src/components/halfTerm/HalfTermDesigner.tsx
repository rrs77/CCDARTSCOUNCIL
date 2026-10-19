import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { UnitViewer } from '../UnitViewer';
import { AssignSchemePanel, type AssignSchemeTarget } from './AssignSchemePanel';
import { HalfTermYearMap, type YearGroupRef } from './HalfTermYearMap';

type Focus = { mode: 'map' } | { mode: 'class'; group: YearGroupRef };

/**
 * Primary half-term home: school-wide map, then drill into one year group.
 * Clicking a map cell opens the scheme-of-work assign panel (not single lessons).
 */
export function HalfTermDesigner() {
  const { currentSheetInfo, setCurrentSheetInfo } = useData();
  const [focus, setFocus] = useState<Focus>({ mode: 'map' });
  const [assignTarget, setAssignTarget] = useState<AssignSchemeTarget | null>(null);
  const [mapRefreshKey, setMapRefreshKey] = useState(0);

  const openClass = (group: YearGroupRef) => {
    if (group.id !== currentSheetInfo.sheet) {
      setCurrentSheetInfo({
        sheet: group.id,
        display: group.name,
        eyfs: `${group.id} Statements`,
      });
    }
    setFocus({ mode: 'class', group });
  };

  const openTermCell = (group: YearGroupRef, halfTermId: string) => {
    // Switch sheet first so updateHalfTerm writes to the correct class.
    if (group.id !== currentSheetInfo.sheet) {
      setCurrentSheetInfo({
        sheet: group.id,
        display: group.name,
        eyfs: `${group.id} Statements`,
      });
    }
    setAssignTarget({
      classId: group.id,
      className: group.name,
      halfTermId,
    });
  };

  return (
    <div className="min-w-0">
      {focus.mode === 'map' ? (
        <HalfTermYearMap
          refreshKey={mapRefreshKey}
          onOpenClass={(group) => openClass(group)}
          onOpenTerm={(group, halfTermId) => openTermCell(group, halfTermId)}
        />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFocus({ mode: 'map' })}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E2E0EF] bg-white px-3 text-[12px] font-bold text-[#1F1B4D] hover:border-[#bcb7f4] hover:bg-[#F4F3FA]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All year groups
            </button>
            <span className="text-[13px] font-extrabold text-[#1F1B4D]">{focus.group.name}</span>
            <span className="text-[12px] text-[#77738F]">· half-term designer</span>
          </div>
          <UnitViewer key={focus.group.id} hidePageChrome />
        </>
      )}

      {assignTarget ? (
        <AssignSchemePanel
          target={assignTarget}
          onClose={() => {
            setAssignTarget(null);
            setMapRefreshKey((k) => k + 1);
          }}
          onChanged={() => setMapRefreshKey((k) => k + 1)}
        />
      ) : null}
    </div>
  );
}
