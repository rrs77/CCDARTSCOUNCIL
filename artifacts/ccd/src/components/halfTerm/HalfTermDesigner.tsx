import React, { useEffect, useRef, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContextNew';
import { AssignSchemePanel, type AssignSchemeTarget } from './AssignSchemePanel';
import {
  AssignSchemeMultiPanel,
  type AssignSchemeMultiTarget,
} from './AssignSchemeMultiPanel';
import { ClassHalfTermBoard } from './ClassHalfTermBoard';
import { HalfTermYearMap, type YearGroupRef } from './HalfTermYearMap';
import { TeacherHalfTermBoard } from './TeacherHalfTermBoard';

type Focus =
  | { mode: 'year' }
  | { mode: 'map' }
  | { mode: 'class'; group: YearGroupRef };

function readDeepLink(): { view: 'year' | 'map' | 'class'; classId: string | null } {
  try {
    const params = new URLSearchParams(window.location.search);
    const classId = params.get('htClass') || params.get('class');
    const viewRaw = (params.get('htView') || '').toLowerCase();
    if (viewRaw === 'map') return { view: 'map', classId };
    if (viewRaw === 'class' && classId) return { view: 'class', classId };
    return { view: 'year', classId };
  } catch {
    return { view: 'year', classId: null };
  }
}

/**
 * Half-terms home: teacher-level year board (all classes on one page).
 * Old year-group map / per-class board remain as demoted deep-links
 * (`?htView=map`, `?htView=class&htClass=…`, or `?htClass=…` to filter the year board).
 */
export function HalfTermDesigner() {
  const { currentSheetInfo, setCurrentSheetInfo } = useData();
  const { customYearGroups } = useSettings();
  const deep = useRef(readDeepLink()).current;

  const initialFocus = (): Focus => {
    if (deep.view === 'map') return { mode: 'map' };
    if (deep.view === 'class' && deep.classId) {
      const g = customYearGroups.find(
        (c) => c.id === deep.classId || c.name === deep.classId,
      );
      if (g) return { mode: 'class', group: { id: g.id, name: g.name } };
    }
    return { mode: 'year' };
  };

  const [focus, setFocus] = useState<Focus>(initialFocus);
  const [focusClassId, setFocusClassId] = useState<string | null>(
    deep.view === 'year' ? deep.classId : null,
  );
  const [assignTarget, setAssignTarget] = useState<AssignSchemeTarget | null>(null);
  const [multiTarget, setMultiTarget] = useState<AssignSchemeMultiTarget | null>(null);
  const [boardRefreshKey, setBoardRefreshKey] = useState(0);
  const [mapRefreshKey, setMapRefreshKey] = useState(0);

  // Resolve ?htView=class&htClass=… once year groups finish loading
  useEffect(() => {
    if (deep.view !== 'class' || !deep.classId || customYearGroups.length === 0) return;
    const g = customYearGroups.find(
      (c) => c.id === deep.classId || c.name === deep.classId,
    );
    if (!g) return;
    setFocus((prev) =>
      prev.mode === 'class' && prev.group.id === g.id
        ? prev
        : { mode: 'class', group: { id: g.id, name: g.name } },
    );
  }, [customYearGroups, deep.view, deep.classId]);

  // Respect header class chip: when the teacher picks a different class in the
  // header while on the year board, filter to that one class.
  const lastSeenSheet = useRef(currentSheetInfo.sheet);
  useEffect(() => {
    if (focus.mode !== 'year') {
      lastSeenSheet.current = currentSheetInfo.sheet;
      return;
    }
    if (currentSheetInfo.sheet && currentSheetInfo.sheet !== lastSeenSheet.current) {
      lastSeenSheet.current = currentSheetInfo.sheet;
      setFocusClassId(currentSheetInfo.sheet);
    }
  }, [currentSheetInfo.sheet, focus.mode]);

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
    setFocusClassId(group.id);
    setFocus({ mode: 'year' });
  };

  const openTermCell = (group: YearGroupRef, halfTermId: string) => {
    switchToClass(group);
    setAssignTarget({
      classId: group.id,
      className: group.name,
      halfTermId,
    });
  };

  const bump = () => {
    setBoardRefreshKey((k) => k + 1);
    setMapRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-w-0">
      {focus.mode === 'year' ? (
        <TeacherHalfTermBoard
          refreshKey={boardRefreshKey}
          focusClassId={focusClassId}
          onFocusClassChange={setFocusClassId}
          onAddScheme={(halfTermId, preselectedClassIds) =>
            setMultiTarget({ halfTermId, preselectedClassIds })
          }
          onManageClassTerm={(classId, className, halfTermId) =>
            setAssignTarget({ classId, className, halfTermId })
          }
          onOpenMap={() => setFocus({ mode: 'map' })}
        />
      ) : focus.mode === 'map' ? (
        <HalfTermYearMap
          refreshKey={mapRefreshKey}
          onBack={() => {
            setFocus({ mode: 'year' });
            bump();
          }}
          onOpenClass={(group) => openClass(group)}
          onOpenTerm={(group, halfTermId) => openTermCell(group, halfTermId)}
        />
      ) : (
        <ClassHalfTermBoard
          key={focus.group.id}
          group={focus.group}
          refreshKey={boardRefreshKey}
          onBack={() => {
            setFocusClassId(focus.group.id);
            setFocus({ mode: 'year' });
            bump();
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

      {multiTarget ? (
        <AssignSchemeMultiPanel
          target={multiTarget}
          onClose={() => {
            setMultiTarget(null);
            bump();
          }}
          onChanged={bump}
        />
      ) : null}

      {assignTarget ? (
        <AssignSchemePanel
          target={assignTarget}
          onClose={() => {
            setAssignTarget(null);
            bump();
          }}
          onChanged={bump}
        />
      ) : null}
    </div>
  );
}
