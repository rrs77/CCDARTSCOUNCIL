import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { AssignSchemePanel, type AssignSchemeTarget } from './AssignSchemePanel';
import { ClassHalfTermBoard } from './ClassHalfTermBoard';
import { HalfTermYearMap, type YearGroupRef } from './HalfTermYearMap';

type Focus = { mode: 'map' } | { mode: 'class'; group: YearGroupRef };

/**
 * Primary half-term home: school-wide map, then a full-page per-class board.
 * Clicking a map cell or a class half-term card opens the scheme assign panel.
 */
export function HalfTermDesigner() {
  const { currentSheetInfo, setCurrentSheetInfo } = useData();
  const [focus, setFocus] = useState<Focus>({ mode: 'map' });
  const [assignTarget, setAssignTarget] = useState<AssignSchemeTarget | null>(null);
  const [mapRefreshKey, setMapRefreshKey] = useState(0);
  const [boardRefreshKey, setBoardRefreshKey] = useState(0);

  const switchToClass = (group: YearGroupRef) => {
    if (group.id !== currentSheetInfo.sheet) {
      setCurrentSheetInfo({
        sheet: group.id,
        display: group.name,
        eyfs: `${group.id} Statements`,
      });
    }
  };

  const openClass = (group: YearGroupRef) => {
    switchToClass(group);
    setFocus({ mode: 'class', group });
  };

  const openTermCell = (group: YearGroupRef, halfTermId: string) => {
    switchToClass(group);
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
        <ClassHalfTermBoard
          key={focus.group.id}
          group={focus.group}
          refreshKey={boardRefreshKey}
          onBack={() => {
            setFocus({ mode: 'map' });
            setMapRefreshKey((k) => k + 1);
          }}
          onOpenTerm={(halfTermId) =>
            setAssignTarget({
              classId: focus.group.id,
              className: focus.group.name,
              halfTermId,
            })
          }
        />
      )}

      {assignTarget ? (
        <AssignSchemePanel
          target={assignTarget}
          onClose={() => {
            setAssignTarget(null);
            setMapRefreshKey((k) => k + 1);
            setBoardRefreshKey((k) => k + 1);
          }}
          onChanged={() => {
            setMapRefreshKey((k) => k + 1);
            setBoardRefreshKey((k) => k + 1);
          }}
        />
      ) : null}
    </div>
  );
}
